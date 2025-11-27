-- ============================================================================
-- Migration: Fix remaining RLS policies with subqueries
-- Date: 2025-11-20
-- Problem: Some policies still have subqueries that cause recursion
-- Solution: Replace remaining problematic policies
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 2. FIX POLICIES THAT REFERENCE users.is_super_admin
-- ============================================================================

-- These policies reference users.is_super_admin which may cause issues
-- Replace them with the function-based approach

DROP POLICY IF EXISTS "Super admins can view all customer interactions" ON customer_interactions;
CREATE POLICY "Super admins can view all customer interactions" ON customer_interactions
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all customer preferences" ON customer_preferences;
CREATE POLICY "Super admins can view all customer preferences" ON customer_preferences
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all inventory" ON inventory;
CREATE POLICY "Super admins can view all inventory" ON inventory
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all leads" ON leads;
CREATE POLICY "Super admins can view all leads" ON leads
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 3. FIX PERMISSIONS POLICY
-- ============================================================================

DROP POLICY IF EXISTS "users_view_all_permissions" ON permissions;
CREATE POLICY "users_view_all_permissions" ON permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 4. FIX REFERENCE DATA POLICIES
-- ============================================================================

-- These policies use subqueries on users table - replace with function
DROP POLICY IF EXISTS "reference_data_delete_policy" ON reference_data;
CREATE POLICY "reference_data_delete_policy" ON reference_data
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "reference_data_select_policy" ON reference_data;
CREATE POLICY "reference_data_select_policy" ON reference_data
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "reference_data_update_policy" ON reference_data;
CREATE POLICY "reference_data_update_policy" ON reference_data
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- 5. FIX ROLE TEMPLATES POLICY
-- ============================================================================

DROP POLICY IF EXISTS "users_view_role_templates" ON role_templates;
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = true
    OR tenant_id IS NULL
    OR tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- 6. FIX TENANTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenants_view_with_super_admin_access" ON tenants;
CREATE POLICY "tenants_view_with_super_admin_access" ON tenants
  FOR SELECT
  USING (
    is_current_user_admin_or_super_admin()
    OR id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "users_view_own_tenant" ON tenants;
CREATE POLICY "users_view_own_tenant" ON tenants
  FOR SELECT
  USING (id = get_current_user_tenant_id());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that no policies remain with problematic subqueries
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE (qual LIKE '%users%' AND qual LIKE '%SELECT%')
   OR (qual LIKE '%user_roles%' AND qual LIKE '%EXISTS%')
   AND schemaname = 'public'
ORDER BY tablename, policyname;