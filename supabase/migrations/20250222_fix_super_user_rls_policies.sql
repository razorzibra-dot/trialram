-- =====================================================
-- FIX: RLS Policies for Super User Module
-- Created: 2025-02-22
-- Purpose: Fix nested subquery issues in super user RLS policies
--          The original policies had SELECT subqueries that violated
--          the users table's own RLS policies
-- =====================================================

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
-- Allow super users to see their own tenant access records
-- Uses EXISTS with direct auth.uid() check to avoid RLS violations

CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- Only super admins can insert tenant access
CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- IMPERSONATION LOGS RLS POLICIES (FIXED)
-- =====================================================
-- Super users can see their own impersonation logs
-- Super admins can see all logs

CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- Only super users can create impersonation logs
CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        super_user_id = auth.uid()
    );

-- Only the creator or super admin can update
CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        super_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    )
    WITH CHECK (
        super_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- TENANT STATISTICS RLS POLICIES (FIXED)
-- =====================================================
-- Super admins can view/manage all statistics
-- Super users can see stats for their assigned tenants

CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        ) OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

-- Only super admins can insert statistics
CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- TENANT CONFIG OVERRIDES RLS POLICIES (FIXED)
-- =====================================================
-- Super admins can view/manage all configuration overrides
-- Super users can see overrides for their assigned tenants

CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        ) OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

-- Only super admins can insert config overrides
CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
            AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- Migration Complete
-- RLS Policies fixed - nested subqueries replaced with
-- direct EXISTS checks that satisfy users table RLS
-- =====================================================