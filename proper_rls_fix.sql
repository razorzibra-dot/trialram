-- Proper RLS fix for users table
-- Re-enable RLS and add correct policies

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "allow_authenticated_select" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;
-- Add more DROP POLICY statements if needed

-- Allow authenticated users to select (application handles security)
CREATE POLICY "allow_authenticated_select" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins to update users in their tenant
CREATE POLICY "admins_update_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
      AND (
        r.name = 'super_admin' OR
        users.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
      AND (
        r.name = 'super_admin' OR
        users.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
      )
    )
  );

-- Allow admins to insert users in their tenant
CREATE POLICY "admins_insert_tenant_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
      AND (
        r.name = 'super_admin' OR
        users.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
      )
    )
  );