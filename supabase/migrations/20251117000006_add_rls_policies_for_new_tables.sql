-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - RLS Policies for New Tables
-- Migration: 20251117000006 - Add RLS Policies for New Module Tables
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_terms ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CUSTOMER INTERACTIONS POLICIES
-- ============================================================================

-- Users can view customer interactions in their tenant
CREATE POLICY "users_view_tenant_customer_interactions" ON customer_interactions
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customer interactions in their tenant
CREATE POLICY "users_create_customer_interactions" ON customer_interactions
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customer interactions in their tenant
CREATE POLICY "users_update_customer_interactions" ON customer_interactions
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 3. CUSTOMER PREFERENCES POLICIES
-- ============================================================================

-- Users can view customer preferences in their tenant
CREATE POLICY "users_view_tenant_customer_preferences" ON customer_preferences
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customer preferences in their tenant
CREATE POLICY "users_create_customer_preferences" ON customer_preferences
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customer preferences in their tenant
CREATE POLICY "users_update_customer_preferences" ON customer_preferences
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 4. LEADS POLICIES
-- ============================================================================

-- Users can view leads in their tenant
CREATE POLICY "users_view_tenant_leads" ON leads
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create leads in their tenant
CREATE POLICY "users_create_leads" ON leads
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update leads in their tenant
CREATE POLICY "users_update_leads" ON leads
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 5. OPPORTUNITIES POLICIES
-- ============================================================================

-- Users can view opportunities in their tenant
CREATE POLICY "users_view_tenant_opportunities" ON opportunities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create opportunities in their tenant
CREATE POLICY "users_create_opportunities" ON opportunities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update opportunities in their tenant
CREATE POLICY "users_update_opportunities" ON opportunities
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 6. SALES ACTIVITIES POLICIES
-- ============================================================================

-- Users can view sales activities in their tenant
CREATE POLICY "users_view_tenant_sales_activities" ON sales_activities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create sales activities in their tenant
CREATE POLICY "users_create_sales_activities" ON sales_activities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update sales activities in their tenant
CREATE POLICY "users_update_sales_activities" ON sales_activities
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 7. INVENTORY POLICIES
-- ============================================================================

-- Users can view inventory in their tenant
CREATE POLICY "users_view_tenant_inventory" ON inventory
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Managers can update inventory in their tenant
CREATE POLICY "managers_update_inventory" ON inventory
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'super_admin')
    )
  );

-- Managers can create inventory records
CREATE POLICY "managers_create_inventory" ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'super_admin')
    )
  );

-- ============================================================================
-- 8. TICKET ACTIVITIES POLICIES
-- ============================================================================

-- Users can view ticket activities in their tenant
CREATE POLICY "users_view_tenant_ticket_activities" ON ticket_activities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- System can insert ticket activities (audit trail)
CREATE POLICY "system_insert_ticket_activities" ON ticket_activities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 9. CONTRACT TERMS POLICIES
-- ============================================================================

-- Users can view contract terms in their tenant
CREATE POLICY "users_view_tenant_contract_terms" ON contract_terms
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create contract terms in their tenant
CREATE POLICY "users_create_contract_terms" ON contract_terms
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update contract terms in their tenant
CREATE POLICY "users_update_contract_terms" ON contract_terms
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 10. ROLE PERMISSIONS POLICIES (if not already covered)
-- ============================================================================

-- Users can view role permissions for roles in their tenant
CREATE POLICY "users_view_tenant_role_permissions" ON role_permissions
  FOR SELECT
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Admins can manage role permissions for roles in their tenant
CREATE POLICY "admins_manage_role_permissions" ON role_permissions
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 11. USER ROLES POLICIES (if not already covered)
-- ============================================================================

-- Users can view user roles in their tenant
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Admins can manage user roles in their tenant
CREATE POLICY "admins_manage_user_roles" ON user_roles
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 12. COMMENTS
-- ============================================================================

COMMENT ON POLICY "users_view_tenant_customer_interactions" ON customer_interactions IS 'Users can only view customer interactions in their tenant';
COMMENT ON POLICY "users_view_tenant_customer_preferences" ON customer_preferences IS 'Users can only view customer preferences in their tenant';
COMMENT ON POLICY "users_view_tenant_leads" ON leads IS 'Users can only view leads in their tenant';
COMMENT ON POLICY "users_view_tenant_opportunities" ON opportunities IS 'Users can only view opportunities in their tenant';
COMMENT ON POLICY "users_view_tenant_sales_activities" ON sales_activities IS 'Users can only view sales activities in their tenant';
COMMENT ON POLICY "users_view_tenant_inventory" ON inventory IS 'Users can only view inventory in their tenant';
COMMENT ON POLICY "users_view_tenant_ticket_activities" ON ticket_activities IS 'Users can only view ticket activities in their tenant';
COMMENT ON POLICY "users_view_tenant_contract_terms" ON contract_terms IS 'Users can only view contract terms in their tenant';