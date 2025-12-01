-- ============================================================================
-- Migration: Normalize User Access Schema - Enterprise RBAC Implementation
-- Date: 2025-11-16
-- Purpose: Remove redundant role enum from users table and implement proper
--          RBAC using database tables (roles, user_roles, permissions, role_permissions)
-- ============================================================================

-- ============================================================================
-- 0. FIX ROLES TABLE SCHEMA FOR SYSTEM ROLES
-- ============================================================================

-- Make tenant_id nullable for system roles
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Add check constraint to ensure non-system roles have tenant_id
ALTER TABLE roles ADD CONSTRAINT ck_roles_tenant_id_required_for_non_system
  CHECK (is_system_role OR tenant_id IS NOT NULL);

-- ============================================================================
-- ROLES WILL BE CREATED IN SEED.SQL TO ENSURE PROPER ORDERING
-- ============================================================================

-- ============================================================================
-- 2. MIGRATE EXISTING USER ROLES TO USER_ROLES TABLE
-- ============================================================================

-- Insert user_roles assignments based on existing users.role
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT
  u.id,
  r.id,
  u.tenant_id,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM users u
JOIN roles r ON r.name = (
  CASE u.role
    WHEN 'admin' THEN 'Administrator'
    WHEN 'manager' THEN 'Manager'
    WHEN 'agent' THEN 'User'
    WHEN 'engineer' THEN 'Engineer'
    WHEN 'customer' THEN 'Customer'
    ELSE 'User'
  END
) AND (r.tenant_id = u.tenant_id OR (u.role = 'super_admin' AND r.tenant_id IS NULL))
WHERE u.deleted_at IS NULL
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- ============================================================================
-- PERMISSIONS WILL BE CREATED IN SEED.SQL TO ENSURE PROPER ORDERING
-- ============================================================================

-- ============================================================================
-- 4. POPULATE ROLE_PERMISSIONS TABLE
-- ============================================================================

-- Clear existing role_permissions
DELETE FROM role_permissions;

-- Insert role_permissions for Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrator'
  AND p.name IN ('read', 'write', 'delete', 'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'crm:product-sale:record:update', 'manage_job_works', 'manage_tickets', 'crm:support:complaint:update', 'manage_dashboard', 'crm:system:config:manage', 'manage_companies');

-- Insert role_permissions for Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND p.name IN ('read', 'write', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'manage_dashboard');

-- Insert role_permissions for User role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'User'
  AND p.name IN ('read', 'write', 'crm:customer:record:update', 'manage_tickets');

-- Insert role_permissions for Engineer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Engineer'
  AND p.name IN ('read', 'write', 'manage_products', 'manage_job_works', 'manage_tickets');

-- Insert role_permissions for Customer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Customer'
  AND p.name IN ('read');

-- Insert role_permissions for super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name IN ('read', 'write', 'delete', 'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'crm:product-sale:record:update', 'manage_job_works', 'manage_tickets', 'crm:support:complaint:update', 'manage_dashboard', 'crm:system:config:manage', 'manage_companies', 'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring');

-- ============================================================================
-- 5. DROP ALL OLD RLS POLICIES THAT DEPEND ON USERS.ROLE
-- ============================================================================

-- Permissions table policies
DROP POLICY IF EXISTS "admins_create_permissions" ON permissions;
DROP POLICY IF EXISTS "admins_update_permissions" ON permissions;

-- Roles table policies
DROP POLICY IF EXISTS "users_view_tenant_roles" ON roles;
DROP POLICY IF EXISTS "admins_create_roles" ON roles;
DROP POLICY IF EXISTS "admins_update_roles" ON roles;
DROP POLICY IF EXISTS "admins_delete_roles" ON roles;

-- User roles table policies
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_assign_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_remove_roles" ON user_roles;

-- Role templates policies
DROP POLICY IF EXISTS "admins_create_role_templates" ON role_templates;
DROP POLICY IF EXISTS "admins_update_role_templates" ON role_templates;
DROP POLICY IF EXISTS "super_admin_delete_role_templates" ON role_templates;

-- Super user tables policies
DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

-- Tenant statistics policies
DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

-- Tenant config overrides policies
DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- Reference data policies
DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
DROP POLICY IF EXISTS "reference_data_insert" ON reference_data;
DROP POLICY IF EXISTS "reference_data_super_user_all_policy" ON reference_data;

-- Companies policies
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;
DROP POLICY IF EXISTS "companies_select_all" ON companies;
DROP POLICY IF EXISTS "managers_create_companies" ON companies;
DROP POLICY IF EXISTS "managers_update_companies" ON companies;
DROP POLICY IF EXISTS "managers_delete_companies" ON companies;

-- Products policies
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "managers_manage_products" ON products;
DROP POLICY IF EXISTS "managers_update_products" ON products;
DROP POLICY IF EXISTS "managers_delete_products" ON products;

-- Users policies
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_tenants" ON tenants;
DROP POLICY IF EXISTS "super_admin_update_tenants" ON tenants;
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;

-- ============================================================================
-- 6. DROP AND RECREATE VIEWS THAT DEPEND ON USERS.ROLE
-- ============================================================================

-- Drop views that depend on users.role
DROP VIEW IF EXISTS ticket_comments_with_details;
DROP VIEW IF EXISTS contract_approval_records_with_details;

-- Recreate ticket_comments_with_details view to use user_roles
CREATE VIEW ticket_comments_with_details AS
SELECT
  tc.id, tc.ticket_id, tc.content,
  tc.author_id, COALESCE(u.name, u.email) AS author_name,
  u.email AS author_email,
  COALESCE(r.name, 'user') AS author_role,
  tc.parent_id, tc.created_at, tc.updated_at
FROM ticket_comments tc
LEFT JOIN users u ON tc.author_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- Recreate contract_approval_records_with_details view to use user_roles
CREATE VIEW contract_approval_records_with_details AS
SELECT
  car.id, car.contract_id, car.stage,
  car.approver_id, COALESCE(u.name, u.email) AS approver_name,
  u.email AS approver_email,
  COALESCE(r.name, 'user') AS approver_role,
  car.status, car.comments, car.timestamp, car.created_at
FROM contract_approval_records car
LEFT JOIN users u ON car.approver_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- ============================================================================
-- 7. DROP REDUNDANT ROLE COLUMN FROM USERS TABLE
-- ============================================================================

-- Drop constraints that reference the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_super_admin_role_consistency;
ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_tenant_id_for_regular_users;

-- Drop indexes that reference the role column
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_super_admin_status;
DROP INDEX IF EXISTS idx_users_super_admin_tenant;
DROP INDEX IF EXISTS idx_users_role_super_admin;
DROP INDEX IF EXISTS idx_users_role_status;

-- Drop the redundant role column
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- ============================================================================
-- 8. CREATE NEW RLS POLICIES USING USER_ROLES
-- ============================================================================

-- Permissions table - simplified (permissions are global)
CREATE POLICY "permissions_select" ON permissions FOR SELECT USING (true);
CREATE POLICY "permissions_manage" ON permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('Administrator', 'super_admin')
  )
);

-- Roles table policies
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND r2.name = 'super_admin'
    )
    OR
    -- Regular users see roles in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
  );

CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
    AND NOT is_system_role
  );

CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
    AND NOT is_system_role
  );

-- User roles table policies
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Admins see assignments in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_assign_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = user_roles.tenant_id
        AND (r.name IN ('Administrator', 'super_admin'))
    )
  );

CREATE POLICY "admins_remove_roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = user_roles.tenant_id
        AND (r.name IN ('Administrator', 'super_admin'))
    )
  );

-- Role templates policies (simplified)
CREATE POLICY "role_templates_select" ON role_templates FOR SELECT USING (true);
CREATE POLICY "role_templates_manage" ON role_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('Administrator', 'super_admin')
  )
);

-- Super user tables - simplified for super admins only
CREATE POLICY "super_user_tables_access" ON super_user_tenant_access FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

CREATE POLICY "super_user_logs_access" ON super_user_impersonation_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Tenant statistics - super admin only
CREATE POLICY "tenant_statistics_access" ON tenant_statistics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Tenant config overrides - super admin only
CREATE POLICY "tenant_config_access" ON tenant_config_overrides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Reference data - tenant isolation
CREATE POLICY "reference_data_select" ON reference_data
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "reference_data_manage" ON reference_data
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Companies - tenant isolation with role-based access
CREATE POLICY "companies_select" ON companies
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "companies_manage" ON companies
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Products - tenant isolation with role-based access
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "products_manage" ON products
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Users - complex tenant and role-based access
CREATE POLICY "users_select" ON users
  FOR SELECT
  USING (
    -- Users can see themselves
    id = auth.uid()
    OR
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant users can see users in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT
  WITH CHECK (
    -- Super admin can create anywhere
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant admins can create in their tenant
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE
  USING (
    -- Users can update themselves
    id = auth.uid()
    OR
    -- Super admin can update all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant admins can update users in their tenant (except other admins)
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'Administrator'
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE
  USING (
    -- Super admin can delete all (except other super admins)
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'super_admin'
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'super_admin'
      )
    )
    OR
    -- Tenant admins can delete users in their tenant (except other admins)
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'Administrator'
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

-- Tenants - super admin only
CREATE POLICY "tenants_access" ON tenants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- ============================================================================
-- 9. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role_id ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id_permission_id ON role_permissions(role_id, permission_id);

-- ============================================================================
-- 10. UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts (normalized - roles assigned via user_roles table)';
COMMENT ON TABLE roles IS 'Role definitions per tenant';
COMMENT ON TABLE user_roles IS 'User role assignments (many-to-many)';
COMMENT ON TABLE permissions IS 'Global permission definitions';
COMMENT ON TABLE role_permissions IS 'Role permission assignments (many-to-many)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Migrated users.role enum to user_roles table
-- - Removed redundant role column from users table
-- - Implemented proper RBAC using database tables
-- - Updated RLS policies to use user_roles
-- - Added proper constraints and indexes
-- ============================================================================