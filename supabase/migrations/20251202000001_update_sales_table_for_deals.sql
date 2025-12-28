-- Migration: Update sales table to support deals functionality
-- Date: December 2, 2025
-- Description: Add missing columns to sales table to support full deals management

-- Add deal-specific columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deal_number VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS campaign VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS competitor_info TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS win_loss_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS opportunity_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS revenue_recognized DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS revenue_recognition_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS revenue_recognition_method VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS recognition_schedule JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update existing records to have default values
-- Guard against older schemas that may not have `total_amount`
DO $$
DECLARE
  has_total boolean;
  tags_udt text;
  rec_sched_udt text;
  tags_literal text;
  rec_sched_literal text;
  dyn_sql text := '';
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'total_amount'
  ) INTO has_total;

  SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'tags' LIMIT 1 INTO tags_udt;

  SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'recognition_schedule' LIMIT 1 INTO rec_sched_udt;

  IF has_total THEN
    dyn_sql := dyn_sql || 'UPDATE sales SET
        value = COALESCE(total_amount, 0),
        currency = COALESCE(currency, ''USD''),
        payment_status = COALESCE(payment_status, ''pending''),
        revenue_recognition_status = COALESCE(revenue_recognition_status, ''pending''),
        paid_amount = COALESCE(paid_amount, 0),
        outstanding_amount = COALESCE(total_amount, 0),
        revenue_recognized = COALESCE(revenue_recognized, 0)
      WHERE value IS NULL;';
  ELSE
    dyn_sql := dyn_sql || 'UPDATE sales SET
        value = COALESCE(value, 0),
        currency = COALESCE(currency, ''USD''),
        payment_status = COALESCE(payment_status, ''pending''),
        revenue_recognition_status = COALESCE(revenue_recognition_status, ''pending''),
        paid_amount = COALESCE(paid_amount, 0),
        outstanding_amount = COALESCE(outstanding_amount, 0),
        revenue_recognized = COALESCE(revenue_recognized, 0)
      WHERE value IS NULL;';
  END IF;

  -- Determine appropriate literal for tags based on udt_name
  IF tags_udt = 'jsonb' THEN
    tags_literal := '''[]''::jsonb';
  ELSIF tags_udt LIKE '\_%' THEN
    -- udt_name for arrays starts with an underscore; derive base and cast to base[]
    tags_literal := 'ARRAY[]::' || substring(tags_udt from 2) || '[]';
  ELSE
    -- fallback: use jsonb empty array
    tags_literal := '''[]''::jsonb';
  END IF;

  -- Determine appropriate literal for recognition_schedule
  IF rec_sched_udt = 'jsonb' THEN
    rec_sched_literal := '''[]''::jsonb';
  ELSIF rec_sched_udt LIKE '\_%' THEN
    rec_sched_literal := 'ARRAY[]::' || substring(rec_sched_udt from 2) || '[]';
  ELSE
    rec_sched_literal := '''[]''::jsonb';
  END IF;

  -- Append tags and recognition_schedule updates using the computed literals
  dyn_sql := dyn_sql || 'UPDATE sales SET tags = COALESCE(tags, ' || tags_literal || ') WHERE tags IS NULL;';
  dyn_sql := dyn_sql || 'UPDATE sales SET recognition_schedule = COALESCE(recognition_schedule, ' || rec_sched_literal || ') WHERE recognition_schedule IS NULL;';

  EXECUTE dyn_sql;
END;
$$;

-- Create index for better performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_sales_assigned_to ON sales(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_contract_id ON sales(contract_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_revenue_recognition_status ON sales(revenue_recognition_status);

-- Add comments for documentation
COMMENT ON COLUMN sales.deal_number IS 'Unique deal identifier for the organization';
COMMENT ON COLUMN sales.title IS 'Deal title/name';
COMMENT ON COLUMN sales.description IS 'Detailed description of the deal';
COMMENT ON COLUMN sales.customer_name IS 'Cached customer name for performance';
COMMENT ON COLUMN sales.value IS 'Deal value/amount';
COMMENT ON COLUMN sales.currency IS 'Currency code (USD, EUR, etc.)';
COMMENT ON COLUMN sales.source IS 'Lead source (website, referral, etc.)';
COMMENT ON COLUMN sales.campaign IS 'Marketing campaign that generated this deal';
COMMENT ON COLUMN sales.expected_close_date IS 'Expected date when deal will close';
COMMENT ON COLUMN sales.assigned_to IS 'User ID of the person assigned to this deal';
COMMENT ON COLUMN sales.assigned_to_name IS 'Cached name of assigned user';
COMMENT ON COLUMN sales.tags IS 'Tags for categorization and filtering';
COMMENT ON COLUMN sales.competitor_info IS 'Information about competing offers';
COMMENT ON COLUMN sales.win_loss_reason IS 'Reason for winning or losing the deal';
COMMENT ON COLUMN sales.opportunity_id IS 'Reference to related opportunity';
COMMENT ON COLUMN sales.contract_id IS 'Reference to generated contract';
COMMENT ON COLUMN sales.payment_terms IS 'Payment terms and conditions';
COMMENT ON COLUMN sales.payment_status IS 'Current payment status';
COMMENT ON COLUMN sales.payment_due_date IS 'Date when payment is due';
COMMENT ON COLUMN sales.paid_amount IS 'Amount already paid';
COMMENT ON COLUMN sales.outstanding_amount IS 'Amount still outstanding';
COMMENT ON COLUMN sales.payment_method IS 'Method of payment';
COMMENT ON COLUMN sales.revenue_recognized IS 'Amount of revenue recognized';
COMMENT ON COLUMN sales.revenue_recognition_status IS 'Status of revenue recognition';
COMMENT ON COLUMN sales.revenue_recognition_method IS 'Method used for revenue recognition';
COMMENT ON COLUMN sales.recognition_schedule IS 'Schedule for revenue recognition installments';
COMMENT ON COLUMN sales.created_by IS 'User who created this deal';