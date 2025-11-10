-- ============================================================================
-- PHASE 2: DATABASE VIEWS - CONTRACT MODULE
-- Migration: Create contract views with denormalized data
-- ============================================================================

-- ============================================================================
-- 1. CONTRACTS WITH DETAILS VIEW
-- ============================================================================
-- Provides contracts enriched with customer and user information

CREATE OR REPLACE VIEW contracts_with_details AS
SELECT
  c.id, c.contract_number, c.title, c.description,
  c.type, c.status, c.customer_id,
  cust.company_name AS customer_name, cust.contact_name AS customer_contact_name,
  cust.email AS customer_email, cust.phone AS customer_phone,
  c.value, c.total_value, c.currency,
  c.start_date, c.end_date, c.signed_date, c.next_renewal_date,
  c.auto_renew, c.renewal_period_months,
  c.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  c.compliance_status, c.priority,
  c.template_id, ct.name AS template_name,
  c.signature_total_required, c.signature_completed,
  c.tags, c.notes,
  c.tenant_id, c.created_at, c.updated_at
FROM contracts c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_to = u.id
LEFT JOIN contract_templates ct ON c.template_id = ct.id
WHERE c.deleted_at IS NULL;

-- ============================================================================
-- 2. CONTRACT APPROVAL RECORDS WITH DETAILS VIEW
-- ============================================================================
-- Approval records enriched with approver information

CREATE OR REPLACE VIEW contract_approval_records_with_details AS
SELECT
  car.id, car.contract_id, car.stage,
  car.approver_id, COALESCE(u.name, u.email) AS approver_name,
  u.email AS approver_email, u.role AS approver_role,
  car.status, car.comments, car.timestamp, car.created_at
FROM contract_approval_records car
LEFT JOIN users u ON car.approver_id = u.id;

-- ============================================================================
-- 3. COMMENTS - Documentation
-- ============================================================================

COMMENT ON VIEW contracts_with_details IS 'Contracts enriched with customer, user, and template information';
COMMENT ON VIEW contract_approval_records_with_details IS 'Contract approvals with approver details and role information';
