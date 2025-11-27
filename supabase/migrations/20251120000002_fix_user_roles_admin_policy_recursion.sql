-- ============================================================================
-- Migration: Fix user_roles admin policy infinite recursion
-- Date: 2025-11-20
-- Problem: The "admins_manage_user_roles" policy causes infinite recursion
--          because it queries user_roles in its USING clause
-- Solution: Create SECURITY DEFINER function to check admin/super_admin status
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION FOR ADMIN/SUPER_ADMIN CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION is_current_user_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_admin_or_super_admin() TO authenticated;

-- ============================================================================
-- 2. UPDATE THE PROBLEMATIC POLICY TO USE THE FUNCTION
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_manage_user_roles" ON user_roles;

-- Recreate with function call (no nested subqueries)
CREATE POLICY "admins_manage_user_roles" ON user_roles
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 3. UPDATE OTHER POLICIES THAT MAY HAVE SIMILAR ISSUES
-- ============================================================================

-- Update inventory policies that reference user_roles
DROP POLICY IF EXISTS "managers_update_inventory" ON inventory;
CREATE POLICY "managers_update_inventory" ON inventory
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "managers_create_inventory" ON inventory;
CREATE POLICY "managers_create_inventory" ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- Update role_permissions policy
DROP POLICY IF EXISTS "admins_manage_role_permissions" ON role_permissions;
CREATE POLICY "admins_manage_role_permissions" ON role_permissions
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Created SECURITY DEFINER function to check admin/super_admin status
-- 2. Updated user_roles admin policy to use function instead of subquery
-- 3. Updated related policies to prevent similar recursion issues
--
-- This should eliminate the "infinite recursion detected in policy for relation 'user_roles'" error
-- ============================================================================