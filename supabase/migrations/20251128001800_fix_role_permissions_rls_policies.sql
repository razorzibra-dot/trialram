-- ============================================================================
-- Migration: Fix role_permissions RLS policies to allow admins to manage permissions
-- Date: 2025-11-28
-- Problem: role_permissions table has RLS enabled but only SELECT policy exists
--          INSERT/UPDATE/DELETE operations are blocked, causing 403 errors
-- Solution: Create comprehensive RLS policies using SECURITY DEFINER functions
--           to avoid recursion, similar to user_roles policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTIONS (REUSE EXISTING IF AVAILABLE)
-- ============================================================================

-- Function to check if current user has roles:manage permission
-- ✅ Database-driven: Checks actual permissions from database, not hardcoded roles
CREATE OR REPLACE FUNCTION has_roles_manage_permission_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND (p.name = 'roles:manage' OR p.name = 'roles:admin')
  );
$$;

-- Function to get tenant_id of a role (for tenant isolation checks)
CREATE OR REPLACE FUNCTION get_role_tenant_id_safe(role_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM roles WHERE id = role_uuid;
$$;

GRANT EXECUTE ON FUNCTION has_roles_manage_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_tenant_id_safe(UUID) TO authenticated;

-- Note: is_current_user_super_admin_safe() and get_current_user_tenant_id_safe() 
-- are already created in migration 20251128000200_fix_auth_rls.sql

-- ============================================================================
-- 2. DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "admins_manage_role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_select_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_update_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete_policy" ON role_permissions;

-- ============================================================================
-- 3. CREATE NEW POLICIES USING SECURITY DEFINER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- SELECT policy: Allow users to see role permissions for roles they have access to
-- Note: This replaces the existing "Users can view role permissions" policy
CREATE POLICY "role_permissions_select_policy" ON role_permissions
  FOR SELECT
  USING (
    -- Super admins can see all role permissions
    is_current_user_super_admin_safe()
    OR
    -- Users can see permissions for roles in their tenant
    (
      get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
    OR
    -- Users can see permissions for system roles (available to all tenants)
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.is_system_role = TRUE
    )
    OR
    -- Users can see permissions for roles they are assigned to
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id = role_permissions.role_id
    )
  );

-- INSERT policy: Allow admins/super_admins to assign permissions to roles
CREATE POLICY "role_permissions_insert_policy" ON role_permissions
  FOR INSERT
  WITH CHECK (
    -- Super admins can assign permissions to any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with roles:manage permission can assign permissions to roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- UPDATE policy: Allow admins/super_admins to update role permissions
CREATE POLICY "role_permissions_update_policy" ON role_permissions
  FOR UPDATE
  USING (
    -- Super admins can update any role permission
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with roles:manage permission can update permissions for roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- DELETE policy: Allow admins/super_admins to remove permissions from roles
CREATE POLICY "role_permissions_delete_policy" ON role_permissions
  FOR DELETE
  USING (
    -- Super admins can delete any role permission
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with roles:manage permission can delete permissions from roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to avoid infinite recursion
-- - Dropped all existing restrictive policies
-- - Created separate policies for SELECT, INSERT, UPDATE, DELETE
-- - INSERT/UPDATE/DELETE policies check for roles:manage permission (database-driven)
-- - Super admins can manage permissions for any role
-- - Regular admins can manage permissions for roles in their tenant
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================

