-- ============================================================================
-- Migration: Remove Redundant Super Admin Fields
-- Date: 2025-11-16
-- Purpose: Remove is_super_admin column and related constraints since
--          role='super_admin' is sufficient to identify super users
-- ============================================================================

-- ============================================================================
-- 1. DROP CONSTRAINTS THAT REFERENCE is_super_admin
-- ============================================================================

-- Drop the role consistency check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS ck_super_admin_role_consistency;

-- Drop the tenant_id constraint for regular users
ALTER TABLE users
DROP CONSTRAINT IF EXISTS ck_tenant_id_for_regular_users;

-- ============================================================================
-- 2. DROP INDEXES THAT REFERENCE is_super_admin
-- ============================================================================

DROP INDEX IF EXISTS idx_users_is_super_admin;
DROP INDEX IF EXISTS idx_users_super_admin_status;
DROP INDEX IF EXISTS idx_users_super_admin_tenant;

-- ============================================================================
-- 3. UPDATE POLICIES THAT REFERENCE is_super_admin BEFORE DROPPING COLUMN
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
-- 4. DROP THE REDUNDANT is_super_admin COLUMN
-- ============================================================================

ALTER TABLE users
DROP COLUMN IF EXISTS is_super_admin;

-- ============================================================================
-- 5. ADD NEW CONSTRAINTS BASED ON ROLE ONLY
-- ============================================================================

-- Ensure super admins have no tenant_id
ALTER TABLE users
ADD CONSTRAINT ck_super_admin_tenant_null
  CHECK (role != 'super_admin' OR tenant_id IS NULL);

-- Ensure non-super-admins have tenant_id
ALTER TABLE users
ADD CONSTRAINT ck_regular_user_tenant_not_null
  CHECK (role = 'super_admin' OR tenant_id IS NOT NULL);

-- ============================================================================
-- 6. ADD NEW INDEXES BASED ON ROLE
-- ============================================================================

-- Index for super admin queries
CREATE INDEX idx_users_role_super_admin
ON users(role)
WHERE role = 'super_admin';

-- Composite index for role and status
CREATE INDEX idx_users_role_status
ON users(role, status);

-- ============================================================================
-- 7. UPDATE COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT ck_super_admin_tenant_null ON users IS
  'Super admin users (role=super_admin) must have tenant_id=NULL for platform-wide access';

COMMENT ON CONSTRAINT ck_regular_user_tenant_not_null ON users IS
  'Regular users (role!=super_admin) must have tenant_id NOT NULL for tenant isolation';

-- ============================================================================
-- 8. MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Removed redundant is_super_admin column
-- - Removed related constraints and indexes
-- - Added role-based constraints
-- - Added role-based indexes
-- - Super user identification now based solely on role='super_admin'
-- ============================================================================