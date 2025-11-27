-- ============================================================================
-- Migration: Fix ALL RLS policies with user_roles subqueries
-- Date: 2025-11-20
-- Problem: Many policies have EXISTS subqueries on user_roles causing recursion
-- Solution: Replace all problematic policies with SECURITY DEFINER function calls
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "companies_manage" ON companies;
CREATE POLICY "companies_manage" ON companies
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 2. PRODUCTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "products_manage" ON products;
CREATE POLICY "products_manage" ON products
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 3. REFERENCE DATA POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "reference_data_manage" ON reference_data;
CREATE POLICY "reference_data_manage" ON reference_data
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
CREATE POLICY "reference_data_select" ON reference_data
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 4. PRODUCT CATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view categories in their tenant" ON product_categories;
CREATE POLICY "Users can view categories in their tenant" ON product_categories
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Users can update categories in their tenant" ON product_categories;
CREATE POLICY "Users can update categories in their tenant" ON product_categories
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Users can delete categories in their tenant" ON product_categories;
CREATE POLICY "Users can delete categories in their tenant" ON product_categories
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 5. ROLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_update_roles" ON roles;
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    is_current_user_admin_or_super_admin()
    AND NOT is_system_role
  );

DROP POLICY IF EXISTS "admins_delete_roles" ON roles;
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    is_current_user_admin_or_super_admin()
    AND NOT is_system_role
  );

-- ============================================================================
-- 6. PERMISSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "permissions_manage" ON permissions;
CREATE POLICY "permissions_manage" ON permissions
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 7. ROLE TEMPLATES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "role_templates_manage" ON role_templates;
CREATE POLICY "role_templates_manage" ON role_templates
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 8. SUPER USER TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_user_tables_access" ON super_user_tenant_access;
CREATE POLICY "super_user_tables_access" ON super_user_tenant_access
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "super_user_logs_access" ON super_user_impersonation_logs;
CREATE POLICY "super_user_logs_access" ON super_user_impersonation_logs
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 9. TENANT TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenants_access" ON tenants;
CREATE POLICY "tenants_access" ON tenants
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "tenant_statistics_access" ON tenant_statistics;
CREATE POLICY "tenant_statistics_access" ON tenant_statistics
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "tenant_config_access" ON tenant_config_overrides;
CREATE POLICY "tenant_config_access" ON tenant_config_overrides
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 10. COMPLAINTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_complaints" ON complaints;
CREATE POLICY "super_admin_view_all_complaints" ON complaints
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "admins_manage_tenant_complaints" ON complaints;
CREATE POLICY "admins_manage_tenant_complaints" ON complaints
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 11. COMPLAINT COMMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_complaint_comments" ON complaint_comments;
CREATE POLICY "super_admin_view_all_complaint_comments" ON complaint_comments
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "admins_manage_tenant_complaint_comments" ON complaint_comments;
CREATE POLICY "admins_manage_tenant_complaint_comments" ON complaint_comments
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 12. SERVICE CONTRACTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_service_contracts" ON service_contracts;
CREATE POLICY "super_admin_view_all_service_contracts" ON service_contracts
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 13. PRODUCT SALES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_product_sales" ON product_sales;
CREATE POLICY "super_admin_view_all_product_sales" ON product_sales
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 14. CUSTOMER TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "customer_analytics_super_admin_access" ON customer_analytics;
CREATE POLICY "customer_analytics_super_admin_access" ON customer_analytics
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_interactions_super_admin_access" ON customer_interactions;
CREATE POLICY "customer_interactions_super_admin_access" ON customer_interactions
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_preferences_super_admin_access" ON customer_preferences;
CREATE POLICY "customer_preferences_super_admin_access" ON customer_preferences
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_segments_super_admin_access" ON customer_segments;
CREATE POLICY "customer_segments_super_admin_access" ON customer_segments
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_segment_memberships_super_admin_access" ON customer_segment_memberships;
CREATE POLICY "customer_segment_memberships_super_admin_access" ON customer_segment_memberships
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that no policies remain with user_roles subqueries
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
-- 1. Replaced all EXISTS subqueries on user_roles with is_current_user_admin_or_super_admin()
-- 2. Maintained proper tenant isolation using get_current_user_tenant_id()
-- 3. Preserved all security logic while eliminating recursion
--
-- This should completely resolve the "Database error querying schema" during authentication
-- ============================================================================