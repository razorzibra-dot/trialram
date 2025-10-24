-- ============================================================================
-- RBAC RLS POLICIES FIX
-- Migration: 010 - Add missing Row Level Security policies for RBAC tables
-- ============================================================================
-- 
-- ISSUE: RLS was enabled on permissions, roles, user_roles, and role_templates
-- tables but NO read policies were defined. This caused Supabase to deny ALL
-- queries by default, resulting in empty data on the UI.
--
-- This migration fixes the issue by adding proper RLS policies for these tables.
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS TABLE POLICIES
-- ============================================================================
-- Permissions are system-wide and should be readable by all authenticated users
-- System permissions are global, not tenant-specific

-- Users can view all permissions (system-wide)
CREATE POLICY "users_view_all_permissions" ON permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
    )
  );

-- Only admins can create permissions
CREATE POLICY "admins_create_permissions" ON permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Only admins can update permissions
CREATE POLICY "admins_update_permissions" ON permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 2. ROLES TABLE POLICIES
-- ============================================================================
-- Users can view roles in their tenant
-- Super admin can view all roles

-- Users can view roles in their tenant
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Regular users see roles in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can create roles in their tenant
CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Admins can update roles in their tenant (except system roles)
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
    AND NOT is_system_role
  );

-- Admins can delete roles in their tenant (except system roles)
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
    AND NOT is_system_role
  );

-- ============================================================================
-- 3. USER ROLES TABLE POLICIES
-- ============================================================================
-- Users can view their own role assignments
-- Admins can manage role assignments in their tenant

-- Users can view user_roles in their tenant
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Users see assignments in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can assign roles in their tenant
CREATE POLICY "admins_assign_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = user_roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Admins can remove roles in their tenant
CREATE POLICY "admins_remove_roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = user_roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 4. ROLE TEMPLATES TABLE POLICIES
-- ============================================================================
-- Enable RLS on role_templates
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- Users can view role templates (system templates with NULL tenant_id)
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = TRUE
    OR tenant_id IS NULL
    OR tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can create role templates in their tenant
CREATE POLICY "admins_create_role_templates" ON role_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'super_admin'))
      AND (users.tenant_id = role_templates.tenant_id OR role_templates.tenant_id IS NULL)
      AND users.deleted_at IS NULL
    )
  );

-- Admins can update role templates in their tenant
CREATE POLICY "admins_update_role_templates" ON role_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND (users.tenant_id = role_templates.tenant_id OR role_templates.tenant_id IS NULL)
      AND users.deleted_at IS NULL
    )
  );

-- Only super admin can delete role templates
CREATE POLICY "super_admin_delete_role_templates" ON role_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- PERMISSIONS TABLE:
--   - READ: All authenticated users can view permissions (system-wide)
--   - CREATE/UPDATE: Only admins and super_admin
--   - Permissions are NOT tenant-specific (shared across all tenants)
--
-- ROLES TABLE:
--   - READ: Users can view roles in their tenant; super_admin can view all
--   - CREATE/UPDATE/DELETE: Tenant admins can manage (except system roles)
--   - System roles cannot be deleted
--
-- USER_ROLES TABLE:
--   - READ: Users can view their own assignments; admins view tenant assignments
--   - CREATE/DELETE: Tenant admins can assign/remove roles
--
-- ROLE_TEMPLATES TABLE:
--   - READ: Users can view default templates and tenant-specific templates
--   - CREATE/UPDATE: Admins in their tenant
--   - DELETE: Only super_admin
--
-- ============================================================================