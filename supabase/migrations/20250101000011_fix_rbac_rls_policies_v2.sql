-- ============================================================================
-- RBAC RLS POLICIES FIX - VERSION 2
-- Migration: 011 - Fix tenant_id query issues in RLS policies
-- ============================================================================
-- 
-- ISSUE: Original policies used get_current_user_tenant_id() which could
-- return NULL, causing RLS to deny all queries.
--
-- SOLUTION: Replace with direct subquery to users table for reliability
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "users_view_tenant_roles" ON roles;
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_role_templates" ON role_templates;

-- ============================================================================
-- RECREATE POLICIES WITH FIXED LOGIC
-- ============================================================================

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

-- ============================================================================
-- SUMMARY OF FIXES
-- ============================================================================
--
-- Fixed three main issues:
-- 1. Replaced get_current_user_tenant_id() with direct users table subquery
-- 2. Ensured tenant_id queries properly handle NULL cases
-- 3. Added explicit OR conditions for better policy clarity
--
-- Testing:
-- - Permissions should load (unchanged)
-- - Roles should now load (fixed policy)
-- - User roles should now load (fixed policy)
-- - Role templates should now load (fixed policy)
--
-- ============================================================================