-- =====================================================
-- COMPLETE FIX: Remove ALL Nested SELECT Subqueries
-- Created: 2025-03-03
-- Problem: Migration 20250223 still had nested SELECTs
--          Super admin has NO tenant_id, causing failures
--          Nested SELECTs still trigger circular RLS dependencies
-- Solution: Create helper functions for ALL checks
--           Remove ALL nested SELECT subqueries
--           Handle super_admin with no tenant_id
-- =====================================================

-- =====================================================
-- DROP EXISTING HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS is_current_user_super_admin() CASCADE;

-- =====================================================
-- CREATE NEW HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Function 1: Check if current user is super admin (no nested SELECT in RLS)
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

GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- Function 2: Get tenant IDs accessible to current super user (for tenant-specific queries)
CREATE OR REPLACE FUNCTION get_accessible_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- If user is super admin, return ALL tenant IDs (no restrictions)
  -- If user is a super user, return only their assigned tenant IDs
  SELECT id FROM tenants WHERE deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  UNION
  SELECT DISTINCT tenant_id FROM super_user_tenant_access 
  WHERE super_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    );
$$;

GRANT EXECUTE ON FUNCTION get_accessible_tenant_ids() TO authenticated;

-- Function 3: Can user access specific tenant (no nested SELECT in RLS)
CREATE OR REPLACE FUNCTION can_user_access_tenant(tenant_id_to_check UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    WHERE 
      -- Super admin can access any tenant
      is_current_user_super_admin()
      OR
      -- Or user is assigned to this tenant
      EXISTS (
        SELECT 1 FROM super_user_tenant_access 
        WHERE super_user_id = auth.uid()
        AND tenant_id = tenant_id_to_check
      )
  );
$$;

GRANT EXECUTE ON FUNCTION can_user_access_tenant(UUID) TO authenticated;

-- =====================================================
-- DROP ALL PROBLEMATIC OLD POLICIES
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
-- RECREATE ALL POLICIES - USING ONLY FUNCTION CALLS
-- NO NESTED SELECT SUBQUERIES
-- =====================================================

-- =====================================================
-- SUPER USER TENANT ACCESS POLICIES
-- =====================================================

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
-- IMPERSONATION LOGS POLICIES
-- =====================================================

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
-- TENANT STATISTICS POLICIES (FIXED - NO NESTED SELECT)
-- =====================================================
-- Now uses can_user_access_tenant() function instead of nested SELECT

CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        can_user_access_tenant(tenant_id)
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
-- TENANT CONFIG OVERRIDES POLICIES (FIXED - NO NESTED SELECT)
-- =====================================================
-- Now uses can_user_access_tenant() function instead of nested SELECT

CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        can_user_access_tenant(tenant_id)
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
-- =====================================================
-- KEY FIXES:
-- 1. All nested SELECT subqueries removed
-- 2. New helper functions handle tenant access safely
-- 3. Super admin with no tenant_id now works correctly
-- 4. SECURITY DEFINER functions bypass RLS for permission checks
-- 5. Zero 400 errors expected
-- 
-- CRITICAL INSIGHT FROM USER:
-- Super admin doesn't have tenant_id, so nested SELECTs checking
-- super_user_tenant_access would fail. Now we use functions that
-- return ALL tenant access for super_admin automatically.
-- =====================================================