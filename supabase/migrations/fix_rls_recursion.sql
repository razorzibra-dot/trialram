-- ============================================================================
-- RLS POLICY FIX - REMOVE RECURSIVE POLICIES
-- ============================================================================
-- This migration fixes infinite recursion issues in RLS policies that query
-- the users table from within the users table's own RLS policy.
--
-- PROBLEM: Policies that contain SELECT from users table within the condition
-- cause infinite recursion when accessed via PostgREST API during auth.
--
-- SOLUTION: Replace recursive policies with non-recursive alternatives using:
-- 1. get_current_user_tenant_id() - SECURITY DEFINER function (bypasses RLS)
-- 2. is_current_user_super_admin() - SECURITY DEFINER function (bypasses RLS)
-- 3. Simpler conditions that don't self-reference the table
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Re-enable RLS on users table and create SECURITY DEFINER functions
-- ============================================================================

-- First, enable RLS on users table (it was disabled earlier)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a SECURITY DEFINER function to safely check if current user is super admin
-- This function bypasses RLS when called, solving the recursion problem
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM users WHERE id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$;

-- Create a SECURITY DEFINER function to safely get current user's tenant ID
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 2: Fix RLS policies on users table
-- ============================================================================

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view tenant users" ON public.users;

-- Create non-recursive policy using SECURITY DEFINER function
CREATE POLICY "Users can view tenant users"
  ON public.users
  FOR SELECT
  USING (
    -- User can view their own record
    (auth.uid() = id)
    -- OR user can view users in their tenant (using safe function)
    OR (tenant_id = get_current_user_tenant_id_safe())
    -- OR super admin can view all users (using safe function)
    OR is_current_user_super_admin_safe()
  );

-- ============================================================================
-- STEP 3: Fix RLS policies on user_roles table
-- ============================================================================

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create non-recursive policy
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    -- User can view their own roles
    (auth.uid() = user_id)
    -- OR user can view roles in their tenant
    OR (tenant_id = get_current_user_tenant_id_safe())
    -- OR super admin can view all roles
    OR is_current_user_super_admin_safe()
  );

-- ============================================================================
-- STEP 4: Fix RLS policies on roles table
-- ============================================================================

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view tenant roles" ON public.roles;

-- Create non-recursive policy
CREATE POLICY "Users can view tenant roles"
  ON public.roles
  FOR SELECT
  USING (
    -- System roles are always visible
    (is_system_role = TRUE)
    -- OR user can view roles in their tenant
    OR (tenant_id = get_current_user_tenant_id_safe())
    -- OR super admin can view all roles
    OR is_current_user_super_admin_safe()
  );

-- ============================================================================
-- STEP 5: Fix RLS policies on role_permissions table
-- ============================================================================

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;

-- Create non-recursive policy
CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (
    -- User can view permissions for roles in their tenant
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
      AND (
        r.is_system_role = TRUE
        OR r.tenant_id = get_current_user_tenant_id_safe()
        OR is_current_user_super_admin_safe()
      )
    )
  );

-- ============================================================================
-- STEP 6: Fix RLS policies on permissions table (if needed)
-- ============================================================================

-- Permissions table should allow authenticated users to view all permissions
-- This is safe because permissions don't contain sensitive data
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- ============================================================================
-- VERIFICATION: Test the policies don't have recursion
-- ============================================================================

-- These functions should now work without recursion issues
-- Can be tested with: SELECT * FROM users WHERE id = 'some-id';
-- via PostgREST API with a valid JWT token

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- If you need to revert this migration:
--
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- 
-- This will disable RLS entirely. To properly rollback:
-- 1. Drop the SECURITY DEFINER functions
-- 2. Recreate the original policies with recursive queries
-- 3. Re-enable RLS
-- ============================================================================
