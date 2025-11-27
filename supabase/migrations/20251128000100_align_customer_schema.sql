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
UPDATE customers
SET contact_name = COALESCE(contact_name, NULLIF(TRIM(CONCAT_WS(' ', NULLIF(first_name, ''), NULLIF(last_name, ''))), ''))
WHERE COALESCE(contact_name, '') = '';

-- 4.2 Company name from associated company
UPDATE customers c
SET company_name = COALESCE(c.company_name, comp.name)
FROM companies comp
WHERE c.company_id = comp.id
  AND (c.company_name IS NULL OR c.company_name = '');

-- 4.3 Industry / website defaults pulled from companies when available
UPDATE customers c
SET industry = COALESCE(c.industry, comp.industry),
    website = COALESCE(c.website, comp.website)
FROM companies comp
WHERE c.company_id = comp.id
  AND (c.industry IS NULL OR c.website IS NULL);

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

