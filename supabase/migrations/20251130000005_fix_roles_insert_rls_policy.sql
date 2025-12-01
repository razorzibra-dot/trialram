-- ============================================================================
-- Migration: Fix roles INSERT RLS policy to use permission-based checks
-- Date: 2025-11-30
-- Problem: roles INSERT policy checks for hardcoded role names ('admin', 'super_admin')
--          but users have 'tenant_admin' role, causing RLS violations
-- Solution: Update policy to check for crm:role:record:create permission (database-driven)
-- ============================================================================

-- ============================================================================
-- 1. CREATE FUNCTION TO CHECK ROLE CREATE PERMISSION
-- ============================================================================

-- Function to check if current user has crm:role:record:create permission
-- ✅ Database-driven: Checks actual permissions from database, not hardcoded roles
CREATE OR REPLACE FUNCTION has_role_create_permission_safe()
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
      AND (p.name = 'crm:role:record:create' OR p.name = 'crm:role:record:update')
  );
$$;

-- Function to check if current user has role update permission
CREATE OR REPLACE FUNCTION has_role_update_permission_safe()
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
      AND p.name = 'crm:role:record:update'
  );
$$;

-- Function to check if current user has role delete permission
CREATE OR REPLACE FUNCTION has_role_delete_permission_safe()
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
      AND p.name = 'crm:role:record:delete'
  );
$$;

GRANT EXECUTE ON FUNCTION has_role_create_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_update_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_delete_permission_safe() TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_create_roles" ON roles;
DROP POLICY IF EXISTS "admins_update_roles" ON roles;
DROP POLICY IF EXISTS "admins_delete_roles" ON roles;

-- ============================================================================
-- 3. CREATE NEW PERMISSION-BASED POLICIES
-- ============================================================================

-- INSERT policy: Allow users with crm:role:record:create permission to create roles in their tenant
CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    -- Super admins can create any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:create permission can create roles in their tenant
    (
      has_role_create_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Prevent tenant admins from creating platform roles
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- UPDATE policy: Allow users with crm:role:record:update permission to update roles in their tenant
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    -- Super admins can update any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:update permission can update roles in their tenant
    (
      has_role_update_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Cannot update system roles (platform-level)
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      has_role_update_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- DELETE policy: Allow users with crm:role:record:delete permission to delete roles in their tenant
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    -- Super admins can delete any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:delete permission can delete roles in their tenant
    (
      has_role_delete_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Cannot delete system roles (platform-level)
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to check role management permissions
-- - Dropped existing hardcoded role-based policies
-- - Created new permission-based policies for INSERT, UPDATE, DELETE
-- - Policies check for crm:role:record:create/update/delete permissions (database-driven)
-- - Super admins can manage any role
-- - Regular admins can manage roles in their tenant (if they have the permission)
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================

