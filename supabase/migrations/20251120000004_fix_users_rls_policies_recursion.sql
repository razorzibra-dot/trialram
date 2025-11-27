-- ============================================================================
-- Migration: Fix users table RLS policies recursion
-- Date: 2025-11-20
-- Problem: users table policies have subqueries that reference user_roles,
--          causing recursion during Supabase Auth operations
-- Solution: Update policies to use the SECURITY DEFINER function
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PROBLEMATIC USERS POLICIES
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_delete_users" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;

-- Recreate with function calls (no nested subqueries)
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (is_current_user_admin_or_super_admin());

CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 2. CHECK FOR OTHER POLICIES THAT MAY HAVE SIMILAR ISSUES
-- ============================================================================

-- Check if there are any other policies with subqueries on user_roles
-- This query will show any remaining problematic policies
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual LIKE '%user_roles%'
  AND qual LIKE '%EXISTS%'
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Updated users table admin policies to use is_current_user_admin_or_super_admin()
-- 2. Removed subqueries that were causing recursion during auth operations
--
-- This should resolve the "Database error querying schema" during login
-- ============================================================================