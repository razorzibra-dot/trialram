-- ============================================================================
-- Migration: Update RLS Policies for Role-Based Super Admin Detection
-- Date: 2025-11-16
-- Purpose: Replace all is_super_admin references with role='super_admin'
--          in Row Level Security policies after removing is_super_admin column
-- ============================================================================

-- ============================================================================
-- 1. UPDATE SUPER USER TENANT ACCESS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

-- Recreate with role-based checks
CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        -- Super users can access their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        -- Only super users can create tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        -- Super users can update their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        -- Super users can delete their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 2. UPDATE IMPERSONATION LOG POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

-- Recreate with role-based checks
CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        -- Super users can view their own impersonation logs
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        -- Only super users can create impersonation logs
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        -- Super users can update their own impersonation logs (for logout)
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 3. UPDATE TENANT STATISTICS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

-- Recreate with role-based checks
CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        -- Super users can view all tenant statistics
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can view their own tenant's statistics
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        -- Super users can insert statistics for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can insert statistics for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        -- Super users can update statistics for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can update statistics for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 4. UPDATE TENANT CONFIG OVERRIDES POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- Recreate with role-based checks
CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        -- Super users can view all config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can view config overrides for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_config_overrides.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        -- Only super users can create config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        -- Only super users can update config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        -- Only super users can delete config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 5. UPDATE OTHER POLICIES THAT USED is_super_admin
-- ============================================================================

-- Update reference data policies
DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
CREATE POLICY "reference_data_select"
    ON reference_data FOR SELECT
    USING (
        -- Super users can access all reference data
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can access reference data for their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = reference_data.tenant_id
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "reference_data_insert" ON reference_data;
CREATE POLICY "reference_data_insert"
    ON reference_data FOR INSERT
    WITH CHECK (
        -- Super users can insert reference data for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can insert reference data for their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = reference_data.tenant_id
            AND users.deleted_at IS NULL
        )
    );

-- Update companies policies
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select"
    ON companies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert"
    ON companies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update"
    ON companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_delete"
    ON companies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_select_all" ON companies;
CREATE POLICY "companies_select_all"
    ON companies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

-- Update products policies
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select"
    ON products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update"
    ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete"
    ON products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all"
    ON products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 6. UPDATE USER POLICIES (if they reference is_super_admin)
-- ============================================================================

-- Update users policies to use role-based checks
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select"
    ON users FOR SELECT
    USING (
        -- Users can view their own record
        users.id = auth.uid()
        OR
        -- Super users can view all users
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can view users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert"
    ON users FOR INSERT
    WITH CHECK (
        -- Super users can create users in any tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can create users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update"
    ON users FOR UPDATE
    USING (
        -- Users can update their own record
        users.id = auth.uid()
        OR
        -- Super users can update any user
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can update users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete"
    ON users FOR DELETE
    USING (
        -- Super users can delete any user
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can delete users in their tenant (except other admins)
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND users.role != 'admin'
            AND u.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 7. UPDATE REMAINING POLICIES THAT USED is_super_admin
-- ============================================================================

-- Update tenants policies
DROP POLICY IF EXISTS "super_admin_view_all_tenants" ON tenants;
CREATE POLICY "super_admin_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "super_admin_update_tenants" ON tenants;
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

-- Update users policies
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

-- Update products policies
DROP POLICY IF EXISTS "managers_manage_products" ON products;
CREATE POLICY "managers_manage_products" ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_products" ON products;
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_products" ON products;
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update companies policies
DROP POLICY IF EXISTS "managers_create_companies" ON companies;
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_companies" ON companies;
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_companies" ON companies;
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update reference_data policies
DROP POLICY IF EXISTS "reference_data_super_user_all_policy" ON reference_data;
CREATE POLICY "reference_data_super_user_all_policy" ON reference_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Updated all RLS policies to use role='super_admin' instead of is_super_admin=true
-- - Maintained all existing security rules and access patterns
-- - Ensured super users retain full platform access
-- - Tenant users retain tenant-scoped access
-- ============================================================================