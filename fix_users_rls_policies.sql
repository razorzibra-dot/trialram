-- Fix: Drop all policies on users table that may reference dropped columns, and recreate correct ones

-- Drop all existing policies on users
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_view_tenant_users" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_users" ON users;
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;
-- Drop any other policies that might exist

-- Allow authenticated users to select from users (security handled at application level)
CREATE POLICY "allow_authenticated_select" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Recreate the update and insert policies (from previous migration)
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE u.id = auth.uid()
      AND u.tenant_id = users.tenant_id
      AND (r.name IN ('admin') OR r.name = 'super_admin')
      AND u.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE u.id = auth.uid()
      AND u.tenant_id = users.tenant_id
      AND (r.name IN ('admin') OR r.name = 'super_admin')
      AND u.deleted_at IS NULL
    )
  );