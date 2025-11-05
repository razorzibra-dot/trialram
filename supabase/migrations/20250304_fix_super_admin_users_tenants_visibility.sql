-- =====================================================
-- MIGRATION: Fix Super Admin Data Visibility
-- Created: 2025-03-04
-- Problem: Super admins couldn't see users/tenants
--          "users_view_tenant_users" policy excluded NULL tenant_id
--          "tenants" table had no super admin access policy
-- Solution: Update policies to include super admin checks
--           Super admins see ALL users and ALL tenants
-- =====================================================

-- =====================================================
-- HELPER FUNCTION (if not already created)
-- =====================================================
-- This was created in 20250303, ensure it exists
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

-- =====================================================
-- FIX USERS TABLE POLICIES
-- =====================================================

-- Drop old problematic policy
DROP POLICY IF EXISTS "users_view_tenant_users" ON users;

-- NEW POLICY: Super admins see ALL users, others see their tenant + themselves
CREATE POLICY "users_view_with_super_admin_access" ON users
  FOR SELECT
  USING (
    -- Super admins see EVERYONE
    is_current_user_super_admin()
    -- Regular users only see their own tenant users
    OR tenant_id = get_current_user_tenant_id()
    -- Everyone sees themselves
    OR id = auth.uid()
  );

-- =====================================================
-- FIX USERS MANAGE POLICIES (already handle super admin)
-- =====================================================
-- These already check for is_super_admin, so they work correctly
-- But we can verify they're in place:

-- Drop and recreate to ensure correctness
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;

CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    -- Super admins can manage any user
    is_current_user_super_admin()
    -- Regular admins can manage users in their tenant
    OR EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;

CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    -- Super admins can insert any user
    is_current_user_super_admin()
    -- Regular admins can insert users in their tenant
    OR EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- =====================================================
-- FIX TENANTS TABLE POLICIES
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "tenants_view_all" ON tenants;
DROP POLICY IF EXISTS "tenants_view_tenant_info" ON tenants;

-- NEW POLICY: Super admins see ALL tenants, others see only theirs
CREATE POLICY "tenants_view_with_super_admin_access" ON tenants
  FOR SELECT
  USING (
    -- Super admins see ALL tenants
    is_current_user_super_admin()
    -- Regular users see only their tenant
    OR id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      AND users.tenant_id IS NOT NULL
    )
  );

-- Super admins can manage tenants
DROP POLICY IF EXISTS "admins_manage_tenants" ON tenants;

CREATE POLICY "admins_manage_tenants" ON tenants
  FOR UPDATE
  USING (
    is_current_user_super_admin()
  );

-- Super admins can insert tenants
DROP POLICY IF EXISTS "admins_insert_tenants" ON tenants;

CREATE POLICY "admins_insert_tenants" ON tenants
  FOR INSERT
  WITH CHECK (
    is_current_user_super_admin()
  );

-- Super admins can delete tenants
DROP POLICY IF EXISTS "admins_delete_tenants" ON tenants;

CREATE POLICY "admins_delete_tenants" ON tenants
  FOR DELETE
  USING (
    is_current_user_super_admin()
  );

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================
-- Uncomment these to verify the fix works:
/*
-- Check if super admin function exists
SELECT 'Function check' as test, COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_name = 'is_current_user_super_admin';

-- Check if users policies exist
SELECT 'Policies check' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%super_admin%';

-- Check if tenants policies exist
SELECT 'Tenants policies check' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'tenants' 
AND policyname LIKE '%super_admin%';
*/

-- =====================================================
-- Migration Complete
-- =====================================================
-- CRITICAL FIXES:
-- 1. Super admins with NULL tenant_id can now see all users
-- 2. Super admins can see all tenants
-- 3. Policies use SECURITY DEFINER function - no infinite recursion
-- 4. Regular users still only see their tenant
-- 5. Everyone can see themselves
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Run this migration in Supabase (auto-applied or manual SQL editor)
-- 2. Clear browser cache and log out completely
-- 3. Log back in as super admin
-- 4. Super Admin pages should now display all records
-- =====================================================