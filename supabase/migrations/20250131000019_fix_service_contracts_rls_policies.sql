-- ============================================================
-- Fix Service Contracts RLS Policies
-- Issue: Policies were trying to access auth.users directly
-- causing "permission denied for table users" error
-- Solution: Use proper helper function like other tables do
-- Created: 2025-01-31
-- ============================================================

-- Drop the old incorrect policies
DROP POLICY IF EXISTS service_contracts_tenant_isolation ON service_contracts;
DROP POLICY IF EXISTS service_contract_documents_tenant_isolation ON service_contract_documents;
DROP POLICY IF EXISTS service_delivery_milestones_tenant_isolation ON service_delivery_milestones;
DROP POLICY IF EXISTS service_contract_issues_tenant_isolation ON service_contract_issues;
DROP POLICY IF EXISTS service_contract_activity_log_tenant_isolation ON service_contract_activity_log;

-- Create correct policies for service_contracts using the helper function
CREATE POLICY service_contracts_select
  ON service_contracts
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_insert
  ON service_contracts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_update
  ON service_contracts
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_delete
  ON service_contracts
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Create correct policies for service_contract_documents
CREATE POLICY service_contract_documents_select
  ON service_contract_documents
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_documents_insert
  ON service_contract_documents
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_documents_update
  ON service_contract_documents
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_delivery_milestones
CREATE POLICY service_delivery_milestones_select
  ON service_delivery_milestones
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_delivery_milestones_insert
  ON service_delivery_milestones
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_delivery_milestones_update
  ON service_delivery_milestones
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_contract_issues
CREATE POLICY service_contract_issues_select
  ON service_contract_issues
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_issues_insert
  ON service_contract_issues
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_issues_update
  ON service_contract_issues
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_contract_activity_log
CREATE POLICY service_contract_activity_log_select
  ON service_contract_activity_log
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_activity_log_insert
  ON service_contract_activity_log
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================
-- Migration Complete
-- ============================================================