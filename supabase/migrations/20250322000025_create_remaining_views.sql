-- ============================================================================
-- PHASE 2: DATABASE VIEWS - SERVICE CONTRACTS & COMPLAINTS
-- Migration: Create remaining views for service contracts and complaints
-- ============================================================================

-- ============================================================================
-- 1. SERVICE CONTRACTS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW service_contracts_with_details AS
SELECT
  sc.id, sc.contract_number, sc.title, sc.description,
  sc.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  c.contact_name AS customer_contact_name,
  sc.product_id, p.name AS product_name, p.sku AS product_sku,
  sc.start_date, sc.end_date, sc.value, sc.currency,
  sc.status, sc.service_type, sc.priority,
  sc.auto_renew, sc.renewal_period_months,
  sc.sla_terms, sc.service_scope,
  sc.tenant_id, sc.created_at, sc.updated_at, sc.created_by
FROM service_contracts sc
LEFT JOIN customers c ON sc.customer_id = c.id
LEFT JOIN products p ON sc.product_id = p.id
WHERE sc.deleted_at IS NULL;

COMMENT ON VIEW service_contracts_with_details IS 'Service contracts with customer and product enrichment';
