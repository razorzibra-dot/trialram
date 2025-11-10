-- ============================================================================
-- PHASE 2: DATABASE VIEWS - SALES MODULE
-- Migration: Create sales views for denormalized data queries
-- ============================================================================

-- ============================================================================
-- 1. SALES WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW sales_with_details AS
SELECT
  s.id, s.sale_number, s.title, s.description,
  s.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  s.value, s.amount, s.currency, s.probability, s.weighted_amount,
  s.stage, s.status, s.source, s.campaign,
  s.expected_close_date, s.actual_close_date,
  s.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  s.notes, s.tags, s.tenant_id, s.created_at, s.updated_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.assigned_to = u.id;

-- ============================================================================
-- 2. SALE ITEMS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW sale_items_with_details AS
SELECT
  si.id, si.sale_id, si.product_id,
  p.name AS product_name, p.sku AS product_sku,
  pc.name AS category_name, p.unit AS product_unit,
  si.quantity, si.unit_price, si.discount, si.tax, si.line_total,
  si.created_at
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- ============================================================================
-- 3. PRODUCT SALES WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW product_sales_with_details AS
SELECT
  ps.id, ps.customer_id, c.company_name AS customer_name,
  ps.product_id, p.name AS product_name, pc.name AS category_name,
  ps.units, ps.cost_per_unit, ps.total_cost,
  ps.delivery_date, ps.warranty_expiry, ps.status, ps.notes,
  ps.tenant_id, ps.created_at, ps.updated_at
FROM product_sales ps
LEFT JOIN customers c ON ps.customer_id = c.id
LEFT JOIN products p ON ps.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

COMMENT ON VIEW sales_with_details IS 'Sales with customer and user denormalized data';
COMMENT ON VIEW sale_items_with_details IS 'Sale items with product and category enrichment';
COMMENT ON VIEW product_sales_with_details IS 'Product sales with customer and product enrichment';
