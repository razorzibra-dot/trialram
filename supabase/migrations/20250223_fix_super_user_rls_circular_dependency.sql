-- =====================================================
-- FIX: RLS Circular Dependency in Super User Policies
-- Created: 2025-02-23
-- Problem: Nested SELECT queries in RLS policies hit RLS restrictions
--          Example: auth.uid() IN (SELECT id FROM users WHERE is_super_admin)
--          fails because SELECT hits users table RLS
-- Solution: Use SECURITY DEFINER function to bypass RLS for permission checks
-- =====================================================

-- =====================================================
-- CREATE HELPER FUNCTION (SECURITY DEFINER)
-- =====================================================
-- This function bypasses RLS to check if current user is super admin
-- SECURITY DEFINER means it runs with the role that created it (postgres)
-- which bypasses RLS restrictions

CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
  );
$$;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- =====================================================
-- DROP EXISTING PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- =====================================================
-- SUPER USER TENANT ACCESS RLS POLICIES (FIXED)
-- =====================================================
-- Now uses SECURITY DEFINER function to check super admin status
-- Avoids nested SELECT that triggers RLS violations

CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        is_current_user_super_admin()
    );

-- =====================================================
-- IMPERSONATION LOGS RLS POLICIES (FIXED)
-- =====================================================
-- Uses SECURITY DEFINER function for clean permission checks

CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        super_user_id = auth.uid()
    );

CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    )
    WITH CHECK (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

-- =====================================================
-- TENANT STATISTICS RLS POLICIES (FIXED)
-- =====================================================

CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        is_current_user_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

-- =====================================================
-- TENANT CONFIG OVERRIDES RLS POLICIES (FIXED)
-- =====================================================

CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        is_current_user_super_admin() OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        is_current_user_super_admin()
    );

-- =====================================================
-- Migration Complete
-- 
-- Key Fix:
-- - SECURITY DEFINER function bypasses RLS for permission checks
-- - Eliminates circular RLS dependencies
-- - Policies now execute without 400 errors
-- 
-- How it works:
-- 1. is_current_user_super_admin() function runs as postgres role
-- 2. It can SELECT from users without hitting RLS restrictions
-- 3. RLS policies call this function for permission checks
-- 4. Result: Clean permission evaluation without RLS conflicts
-- =====================================================