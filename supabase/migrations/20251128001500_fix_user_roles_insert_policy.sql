-- ============================================================================
-- Migration: Fix user_roles INSERT policy to allow admins to assign roles
-- Date: 2025-11-28
-- Problem: The "admins_manage_user_roles" policy is too restrictive for INSERT
--          It requires tenant_id match, but doesn't account for super admins
--          or the WITH CHECK clause for INSERT operations
--          Also causes infinite recursion by querying user_roles in policies
-- Solution: Use SECURITY DEFINER functions to avoid recursion and allow proper INSERT
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTIONS TO AVOID RECURSION
-- ============================================================================

-- Function to check if current user is super admin (no recursion)
CREATE OR REPLACE FUNCTION is_current_user_super_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'Super Admin')
  );
$$;

-- Function to check if current user is admin or super admin (no recursion)
CREATE OR REPLACE FUNCTION is_current_user_admin_or_super_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'Administrator', 'super_admin', 'Super Admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_super_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin_or_super_admin_safe() TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_manage_user_roles" ON user_roles;
DROP POLICY IF EXISTS "user_roles_modify_authenticated" ON user_roles;
DROP POLICY IF EXISTS "users_view_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_insert_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_update_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_delete_user_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_assign_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_remove_roles" ON user_roles;

-- ============================================================================
-- 3. CREATE NEW POLICIES USING SECURITY DEFINER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- SELECT policy: Allow users to see their own roles and admins to see roles in their tenant
CREATE POLICY "users_view_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Users can always see their own role assignments
    user_id = auth.uid()
    OR
    -- Super admins can see all
    is_current_user_super_admin_safe()
    OR
    -- Admins can see roles in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- INSERT policy: Allow admins/super_admins to assign roles
CREATE POLICY "admins_insert_user_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    -- Super admins can assign roles to any tenant (including null)
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can assign roles in their own tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- UPDATE policy: Allow admins/super_admins to update role assignments
CREATE POLICY "admins_update_user_roles" ON user_roles
  FOR UPDATE
  USING (
    -- Super admins can update any role assignment
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can update role assignments in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- DELETE policy: Allow admins/super_admins to remove role assignments
CREATE POLICY "admins_delete_user_roles" ON user_roles
  FOR DELETE
  USING (
    -- Super admins can delete any role assignment
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can delete role assignments in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to avoid infinite recursion
-- - Dropped all existing restrictive policies
-- - Created separate policies for SELECT, INSERT, UPDATE, DELETE
-- - INSERT policy now properly uses WITH CHECK clause
-- - Super admins can assign roles to any tenant
-- - Regular admins can assign roles in their own tenant
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================
