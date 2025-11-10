-- ============================================================================
-- PHASE 2: DATABASE VIEWS - CRM MODULE
-- Migration: Create CRM views for tickets and customers
-- ============================================================================

-- ============================================================================
-- 1. CUSTOMERS WITH STATS VIEW
-- ============================================================================
-- Aggregates customer data with related statistics

CREATE OR REPLACE VIEW customers_with_stats AS
SELECT
  c.id, c.company_name, c.contact_name, c.email, c.phone,
  c.customer_type, c.status, c.assigned_to,
  COALESCE(u.name, u.email) AS assigned_to_name,
  c.total_sales_amount, c.total_orders, c.average_order_value,
  c.last_purchase_date, c.last_contact_date,
  (SELECT COUNT(*) FROM sales WHERE customer_id = c.id AND deleted_at IS NULL) AS open_sales,
  (SELECT COUNT(*) FROM tickets WHERE customer_id = c.id AND status NOT IN ('resolved', 'closed') AND deleted_at IS NULL) AS open_tickets,
  (SELECT COUNT(*) FROM contracts WHERE customer_id = c.id AND deleted_at IS NULL) AS total_contracts,
  c.tenant_id, c.created_at, c.updated_at
FROM customers c
LEFT JOIN users u ON c.assigned_to = u.id
WHERE c.deleted_at IS NULL;

-- ============================================================================
-- 2. TICKETS WITH DETAILS VIEW
-- ============================================================================
-- Provides ticket data enriched with customer and user info

CREATE OR REPLACE VIEW tickets_with_details AS
SELECT
  t.id, t.ticket_number, t.title, t.description,
  t.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  c.contact_name AS customer_contact_name, c.phone AS customer_phone,
  t.status, t.priority, t.category, t.sub_category, t.source,
  t.assigned_to, COALESCE(u1.name, u1.email) AS assigned_to_name,
  t.reported_by, COALESCE(u2.name, u2.email) AS reported_by_name,
  t.due_date, t.resolved_at, t.closed_at,
  t.estimated_hours, t.actual_hours, t.first_response_time, t.resolution_time,
  t.is_sla_breached, t.resolution, t.tags,
  t.tenant_id, t.created_at, t.updated_at
FROM tickets t
LEFT JOIN customers c ON t.customer_id = c.id
LEFT JOIN users u1 ON t.assigned_to = u1.id
LEFT JOIN users u2 ON t.reported_by = u2.id
WHERE t.deleted_at IS NULL;

-- ============================================================================
-- 3. TICKET COMMENTS WITH DETAILS VIEW
-- ============================================================================
-- Ticket comments enriched with author information

CREATE OR REPLACE VIEW ticket_comments_with_details AS
SELECT
  tc.id, tc.ticket_id, tc.content,
  tc.author_id, COALESCE(u.name, u.email) AS author_name,
  u.email AS author_email, u.role AS author_role,
  tc.parent_id, tc.created_at, tc.updated_at
FROM ticket_comments tc
LEFT JOIN users u ON tc.author_id = u.id;

-- ============================================================================
-- 4. COMMENTS - Documentation
-- ============================================================================

COMMENT ON VIEW customers_with_stats IS 'Customer data enriched with aggregated statistics from sales, tickets, and contracts';
COMMENT ON VIEW tickets_with_details IS 'Tickets with denormalized customer and user information';
COMMENT ON VIEW ticket_comments_with_details IS 'Ticket comments with author details';
