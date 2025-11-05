-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ROW LEVEL SECURITY
-- Migration: 007 - RLS Policies for Multi-Tenant Data Isolation
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Master data
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- Advanced
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_specifications ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 2. HELPER FUNCTION - Get Current User Tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Get tenant_id from users table by matching auth.uid()
  -- First try JWT claims, fall back to users table lookup
  DECLARE
    tenant_id_from_jwt UUID;
    tenant_id_from_db UUID;
  BEGIN
    -- Try to get from JWT claims first
    tenant_id_from_jwt := (auth.jwt() ->> 'tenant_id')::UUID;
    
    IF tenant_id_from_jwt IS NOT NULL THEN
      RETURN tenant_id_from_jwt;
    END IF;
    
    -- Fall back to querying users table
    SELECT users.tenant_id INTO tenant_id_from_db
    FROM users
    WHERE users.id = auth.uid()
    LIMIT 1;
    
    RETURN tenant_id_from_db;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. TENANTS POLICIES
-- ============================================================================

-- Super admin can view all tenants
CREATE POLICY "super_admin_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  );

-- Users can view their own tenant
CREATE POLICY "users_view_own_tenant" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
    )
  );

-- Super admin can update tenants
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 4. USERS POLICIES
-- ============================================================================

-- Users can view users in their tenant
CREATE POLICY "users_view_tenant_users" ON users
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR id = auth.uid()
  );

-- Admins can manage users in their tenant
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- Admins can insert new users
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- ============================================================================
-- 5. CUSTOMERS POLICIES
-- ============================================================================

-- Users can view customers in their tenant
CREATE POLICY "users_view_tenant_customers" ON customers
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customers in their tenant
CREATE POLICY "users_create_customers" ON customers
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customers in their tenant
CREATE POLICY "users_update_customers" ON customers
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Users can delete customers in their tenant (soft delete handled by application)
CREATE POLICY "users_delete_customers" ON customers
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 6. SALES POLICIES
-- ============================================================================

-- Users can view sales in their tenant
CREATE POLICY "users_view_tenant_sales" ON sales
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create sales in their tenant
CREATE POLICY "users_create_sales" ON sales
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update sales in their tenant
CREATE POLICY "users_update_sales" ON sales
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Sale items follow parent sales policy
CREATE POLICY "users_view_sale_items" ON sale_items
  FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 7. TICKETS POLICIES
-- ============================================================================

-- Users can view tickets in their tenant
CREATE POLICY "users_view_tenant_tickets" ON tickets
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create tickets in their tenant
CREATE POLICY "users_create_tickets" ON tickets
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update tickets in their tenant
CREATE POLICY "users_update_tickets" ON tickets
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Ticket comments follow parent ticket policy
CREATE POLICY "users_view_ticket_comments" ON ticket_comments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY "users_create_ticket_comments" ON ticket_comments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Ticket attachments follow parent ticket policy
CREATE POLICY "users_view_ticket_attachments" ON ticket_attachments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 8. CONTRACTS POLICIES
-- ============================================================================

-- Users can view contracts in their tenant
CREATE POLICY "users_view_tenant_contracts" ON contracts
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create contracts in their tenant
CREATE POLICY "users_create_contracts" ON contracts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update contracts in their tenant
CREATE POLICY "users_update_contracts" ON contracts
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Contract parties follow parent contract policy
CREATE POLICY "users_view_contract_parties" ON contract_parties
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Contract attachments follow parent contract policy
CREATE POLICY "users_view_contract_attachments" ON contract_attachments
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 9. PRODUCTS & MASTER DATA POLICIES
-- ============================================================================

-- Users can view products in their tenant
CREATE POLICY "users_view_tenant_products" ON products
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Managers can create/update products
CREATE POLICY "managers_manage_products" ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Product categories follow same pattern
CREATE POLICY "users_view_categories" ON product_categories
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Companies same pattern
CREATE POLICY "users_view_tenant_companies" ON companies
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 10. JOB WORKS POLICIES
-- ============================================================================

-- Users can view job works in their tenant
CREATE POLICY "users_view_tenant_job_works" ON job_works
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Engineers can view their assigned jobs
CREATE POLICY "engineers_view_own_jobs" ON job_works
  FOR SELECT
  USING (
    receiver_engineer_id = auth.uid()
    OR tenant_id = get_current_user_tenant_id()
  );

-- Users can create job works
CREATE POLICY "users_create_job_works" ON job_works
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Job specifications follow parent job policy
CREATE POLICY "users_view_job_specs" ON job_work_specifications
  FOR SELECT
  USING (
    job_work_id IN (
      SELECT id FROM job_works
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 11. NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can only update their own notifications
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- Only system can insert notifications (disable direct insert)
CREATE POLICY "system_insert_notifications" ON notifications
  FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- 12. AUDIT LOG POLICIES
-- ============================================================================

-- Users can view audit logs for their tenant
CREATE POLICY "users_view_tenant_audit_logs" ON audit_logs
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Only system can insert audit logs
CREATE POLICY "system_insert_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 13. COMMENTS ON SECURITY
-- ============================================================================

COMMENT ON FUNCTION get_current_user_tenant_id() IS 'Get current authenticated user tenant ID from JWT token';
COMMENT ON POLICY "users_view_tenant_customers" ON customers IS 'All users can view their tenant customers';
COMMENT ON POLICY "users_create_customers" ON customers IS 'All users can create customers in their tenant';