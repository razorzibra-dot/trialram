-- ============================================================================
-- Migration: Align customer & company schema with application contract
-- Date: 2025-11-28
-- Purpose:
--   * Add missing columns required by the UI/service layers
--   * Ensure enums (entity_status, customer_type, company_size) are used
--   * Backfill existing data so grid/forms show meaningful values
-- ============================================================================

-- 1. Ensure companies table exposes industry/size metadata
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS size company_size,
  ADD COLUMN IF NOT EXISTS segment VARCHAR(100);

-- 2. Extend customers table with full data contract fields
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS size company_size,
  ADD COLUMN IF NOT EXISTS customer_type customer_type DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS total_sales_amount NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_order_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS rating VARCHAR(10),
  ADD COLUMN IF NOT EXISTS last_contact_date DATE,
  ADD COLUMN IF NOT EXISTS next_follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. Align status column with entity_status enum
-- Drop dependent summary view if it exists to allow safe type change
DROP VIEW IF EXISTS customer_summary CASCADE;

ALTER TABLE customers
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE customers
  ALTER COLUMN status TYPE entity_status
  USING
    CASE
      WHEN status IN ('active','inactive','prospect','suspended') THEN status::entity_status
      ELSE 'active'
    END;

ALTER TABLE customers
  ALTER COLUMN status SET DEFAULT 'active';

-- 4. Backfill derived fields from existing data
-- 4.1 Contact name from first/last name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name IN ('first_name','last_name')
  ) THEN
    UPDATE customers
    SET contact_name = COALESCE(contact_name, NULLIF(TRIM(CONCAT_WS(' ', NULLIF(first_name, ''), NULLIF(last_name, ''))), ''))
    WHERE COALESCE(contact_name, '') = '';
  END IF;
END$$;

-- 4.2 Company name from associated company
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_id'
  ) THEN
    UPDATE customers c
    SET company_name = COALESCE(c.company_name, comp.name)
    FROM companies comp
    WHERE c.company_id = comp.id
      AND (c.company_name IS NULL OR c.company_name = '');
  END IF;
END$$;

-- 4.3 Industry / website defaults pulled from companies when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'company_id'
  ) THEN
    UPDATE customers c
    SET industry = COALESCE(c.industry, comp.industry),
        website = COALESCE(c.website, comp.website)
    FROM companies comp
    WHERE c.company_id = comp.id
      AND (c.industry IS NULL OR c.website IS NULL);
  END IF;
END$$;

-- 4.4 Set default size & customer type where missing
UPDATE customers
SET size = COALESCE(size, 'small')
WHERE size IS NULL;

UPDATE customers
SET customer_type = COALESCE(customer_type, 'business');

ALTER TABLE customers
  ALTER COLUMN customer_type SET DEFAULT 'business';

-- 5. Helpful indexes for common filters
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_contact_name ON customers(contact_name);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry);
CREATE INDEX IF NOT EXISTS idx_customers_size ON customers(size);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- Recreate the customer_summary view that was dropped earlier so downstream
-- migrations and queries depending on it remain functional.
CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.id,
  c.tenant_id,
  c.company_name,
  c.contact_name,
  c.email,
  c.customer_type,
  c.status,

  -- Computed sales metrics
  COALESCE(SUM(s.value), 0) AS total_sales_amount,
  COUNT(DISTINCT s.id) AS total_orders,
  CASE
    WHEN COUNT(s.id) > 0 THEN ROUND(AVG(s.value), 2)
    ELSE 0
  END AS average_order_value,
  MAX(s.actual_close_date) AS last_purchase_date,

  -- Activity counts
  COUNT(DISTINCT CASE WHEN s.status = 'open' THEN s.id END) AS open_sales,
  COUNT(DISTINCT CASE WHEN t.status NOT IN ('resolved', 'closed') THEN t.id END) AS open_tickets,
  COUNT(DISTINCT CASE WHEN sc.status IN ('active', 'pending_approval') THEN sc.id END) AS active_service_contracts,

  c.created_at,
  c.updated_at
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id AND s.deleted_at IS NULL
LEFT JOIN tickets t ON c.id = t.customer_id AND t.deleted_at IS NULL
LEFT JOIN service_contracts sc ON c.id = sc.customer_id AND sc.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.tenant_id, c.company_name, c.contact_name, c.email, c.customer_type, c.status, c.created_at, c.updated_at;

