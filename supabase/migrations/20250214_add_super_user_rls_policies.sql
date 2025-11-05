-- =====================================================
-- RLS Policies for Super User Module
-- Created: 2025-02-14
-- Purpose: Add Row Level Security policies for super user tables
--          AFTER is_super_admin column is added in migration 20250212
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE super_user_tenant_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_user_impersonation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_config_overrides ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPER USER TENANT ACCESS RLS POLICIES
-- =====================================================
-- Allow super users to see their own tenant access records

CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- Only admins can insert/update/delete tenant access
CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- =====================================================
-- IMPERSONATION LOGS RLS POLICIES
-- =====================================================
-- Super users can see their own impersonation logs
-- Admins can see all logs

CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- Only super users can create impersonation logs
CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        super_user_id = auth.uid()
    );

-- Only the creator or admin can update
CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        super_user_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    )
    WITH CHECK (
        super_user_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- =====================================================
-- TENANT STATISTICS RLS POLICIES
-- =====================================================
-- Admins can view/manage all statistics
-- Super users can see stats for their assigned tenants

CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        ) OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

-- Only admins can insert/update statistics
CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- =====================================================
-- TENANT CONFIG OVERRIDES RLS POLICIES
-- =====================================================
-- Admins can view/manage all configuration overrides
-- Super users can see overrides for their assigned tenants

CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        ) OR
        tenant_id IN (
            SELECT tenant_id FROM super_user_tenant_access 
            WHERE super_user_id = auth.uid()
        )
    );

-- Only admins can insert/update/delete config overrides
CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE is_super_admin = true
        )
    );

-- =====================================================
-- Migration Complete
-- RLS Policies successfully added after is_super_admin
-- =====================================================