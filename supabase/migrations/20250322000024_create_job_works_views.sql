-- ============================================================================
-- PHASE 2: DATABASE VIEWS - JOB WORKS MODULE
-- Migration: Create job works views with denormalized data
-- ============================================================================

-- ============================================================================
-- 1. JOB WORKS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW job_works_with_details AS
SELECT
  jw.id, jw.job_ref_id,
  jw.customer_id, c.company_name AS customer_name, c.contact_name AS customer_contact,
  c.email AS customer_email, c.phone AS customer_phone,
  jw.product_id, p.name AS product_name, p.sku AS product_sku,
  pc.name AS product_category, p.unit AS product_unit,
  jw.pieces, jw.size, jw.base_price, jw.default_price, jw.manual_price, jw.final_price, jw.currency,
  jw.receiver_engineer_id, COALESCE(u1.name, u1.email) AS receiver_engineer_name,
  u1.email AS receiver_engineer_email,
  jw.assigned_by, COALESCE(u2.name, u2.email) AS assigned_by_name,
  jw.status, jw.priority, jw.due_date, jw.started_at, jw.completed_at, jw.delivered_at, jw.estimated_completion,
  jw.comments, jw.internal_notes, jw.delivery_address, jw.delivery_instructions,
  jw.quality_check_passed, jw.quality_notes, jw.compliance_requirements,
  jw.tenant_id, jw.created_at, jw.updated_at, jw.created_by
FROM job_works jw
LEFT JOIN customers c ON jw.customer_id = c.id
LEFT JOIN products p ON jw.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN users u1 ON jw.receiver_engineer_id = u1.id
LEFT JOIN users u2 ON jw.assigned_by = u2.id
WHERE jw.deleted_at IS NULL;

-- ============================================================================
-- 2. JOB WORK SPECIFICATIONS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW job_work_specifications_with_details AS
SELECT
  jws.id, jws.job_work_id, jw.job_ref_id,
  jws.name, jws.value, jws.unit, jws.required, jws.created_at, jw.tenant_id
FROM job_work_specifications jws
LEFT JOIN job_works jw ON jws.job_work_id = jw.id;

COMMENT ON VIEW job_works_with_details IS 'Job works with denormalized customer, product, and user information';
COMMENT ON VIEW job_work_specifications_with_details IS 'Job specifications with parent job reference';
