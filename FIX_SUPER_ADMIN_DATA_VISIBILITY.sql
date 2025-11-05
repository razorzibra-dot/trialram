-- =====================================================
-- IMMEDIATE FIX: Allow Super Admins to View All Users
-- Run this SQL directly in Supabase SQL Editor
-- =====================================================
-- Copy ALL of this and paste into: http://localhost:54323 → SQL Editor
-- IMPORTANT: This uses SECURITY DEFINER function to avoid infinite recursion

-- STEP 1: Drop the old restrictive policies
DROP POLICY IF EXISTS "users_view_tenant_users" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_users" ON users;

-- STEP 2: Create/Update SECURITY DEFINER helper function
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

-- STEP 3: Create new policy - Super admins can view ALL users (uses helper function)
CREATE POLICY "super_admin_view_all_users" ON users
  FOR SELECT
  USING (is_current_user_super_admin());

-- STEP 4: Restore the policy for regular users (they only see their tenant)
CREATE POLICY "users_view_tenant_users" ON users
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR id = auth.uid()
  );

-- =====================================================
-- VERIFICATION - Run these queries to verify it works:
-- =====================================================

-- 1. Check if current user is super admin
SELECT 
  auth.uid() as current_user_id,
  email,
  is_super_admin,
  role,
  tenant_id
FROM users 
WHERE id = auth.uid();

-- 2. Try to fetch all super admins (what the dashboard does)
SELECT 
  id, 
  email, 
  is_super_admin, 
  role, 
  tenant_id 
FROM users 
WHERE is_super_admin = true
ORDER BY created_at DESC;

-- 3. Count total super admins
SELECT COUNT(*) as super_admin_count 
FROM users 
WHERE is_super_admin = true;

-- =====================================================
-- If you see data in query #2, the fix worked! ✅
-- =====================================================