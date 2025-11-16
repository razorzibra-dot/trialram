-- ============================================================================
-- Migration: Fix Users RLS Policies (Final)
-- Date: 2025-11-16
-- Purpose: Properly fix RLS policies on users table after removing is_super_admin
--          and role columns. This ensures clean database resets work correctly.
-- ============================================================================

-- Drop all existing policies on users table to ensure clean slate
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Allow authenticated users to select from users table
-- Security is handled at the application level
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins and super_admins to update users
-- Application handles tenant isolation for regular admins
CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Allow admins and super_admins to insert users
-- Application handles tenant isolation for regular admins
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- DELETE POLICIES (if needed in future)
-- ============================================================================

-- Allow admins and super_admins to delete users
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- FIX USER_ROLES RLS POLICIES
-- ============================================================================

-- Drop all existing policies on user_roles table
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Disable RLS on user_roles for SELECT to allow permission queries
-- Application handles security for data modifications
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policies for modifications
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_modify_authenticated" ON user_roles
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Dropped all existing policies on users and user_roles tables
-- - Added clean RLS policies that work with the new RBAC system
-- - Policies reference roles through user_roles/roles tables
-- - No references to dropped columns (is_super_admin, role)
-- - Application handles detailed security logic
-- - Fixed user_roles SELECT to allow permission checks
-- ============================================================================