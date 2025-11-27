-- Add payment processing and revenue recognition columns to deals table
-- Migration: 20251118000002_add_deal_payment_revenue_columns.sql

-- =============================================
-- ADD PAYMENT PROCESSING COLUMNS TO DEALS
-- =============================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- =============================================
-- ADD REVENUE RECOGNITION COLUMNS TO DEALS
-- =============================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS revenue_recognized DECIMAL(15,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS revenue_recognition_status VARCHAR(50) DEFAULT 'not_started' CHECK (revenue_recognition_status IN ('not_started', 'in_progress', 'completed'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS revenue_recognition_method VARCHAR(50) DEFAULT 'immediate' CHECK (revenue_recognition_method IN ('immediate', 'installments', 'milestone', 'time_based'));

-- =============================================
-- CREATE REVENUE RECOGNITION SCHEDULE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS revenue_recognition_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  recognized_amount DECIMAL(15,2) DEFAULT 0,
  recognition_date DATE NOT NULL,
  actual_recognition_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recognized', 'cancelled')),
  description TEXT,
  milestone VARCHAR(255),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_recognized_amount CHECK (recognized_amount >= 0),
  CONSTRAINT recognized_not_exceed_amount CHECK (recognized_amount <= amount)
);

-- =============================================
-- INDEXES FOR REVENUE RECOGNITION
-- =============================================

CREATE INDEX IF NOT EXISTS idx_revenue_recognition_schedule_deal_id ON revenue_recognition_schedule(deal_id);
CREATE INDEX IF NOT EXISTS idx_revenue_recognition_schedule_tenant_id ON revenue_recognition_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_recognition_schedule_status ON revenue_recognition_schedule(status);
CREATE INDEX IF NOT EXISTS idx_revenue_recognition_schedule_recognition_date ON revenue_recognition_schedule(recognition_date);

-- =============================================
-- RLS POLICIES FOR REVENUE RECOGNITION
-- =============================================

ALTER TABLE revenue_recognition_schedule ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "revenue_recognition_schedule_tenant_isolation" ON revenue_recognition_schedule
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Super admin bypass policy
CREATE POLICY "super_admin_revenue_recognition_schedule_access" ON revenue_recognition_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Add updated_at trigger for revenue recognition schedule
CREATE TRIGGER update_revenue_recognition_schedule_updated_at
  BEFORE UPDATE ON revenue_recognition_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate outstanding amount
CREATE OR REPLACE FUNCTION calculate_deal_outstanding_amount(deal_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  deal_value DECIMAL;
  paid_amount DECIMAL;
BEGIN
  SELECT value, COALESCE(paid_amount, 0) INTO deal_value, paid_amount
  FROM deals WHERE id = deal_id;

  RETURN GREATEST(deal_value - paid_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update deal payment status
CREATE OR REPLACE FUNCTION update_deal_payment_status(deal_id UUID)
RETURNS VOID AS $$
DECLARE
  deal_value DECIMAL;
  paid_amt DECIMAL;
  outstanding_amt DECIMAL;
BEGIN
  SELECT value, COALESCE(paid_amount, 0) INTO deal_value, paid_amt
  FROM deals WHERE id = deal_id;

  outstanding_amt := GREATEST(deal_value - paid_amt, 0);

  UPDATE deals SET
    outstanding_amount = outstanding_amt,
    payment_status = CASE
      WHEN outstanding_amt = 0 THEN 'paid'
      WHEN paid_amt > 0 THEN 'partial'
      WHEN outstanding_amt > 0 AND payment_due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = deal_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recognize revenue for a deal
CREATE OR REPLACE FUNCTION recognize_deal_revenue(deal_id UUID, amount DECIMAL, recognition_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  current_recognized DECIMAL;
  deal_value DECIMAL;
BEGIN
  SELECT COALESCE(revenue_recognized, 0), value INTO current_recognized, deal_value
  FROM deals WHERE id = deal_id;

  -- Ensure we don't over-recognize revenue
  IF current_recognized + amount > deal_value THEN
    RAISE EXCEPTION 'Cannot recognize more revenue than deal value';
  END IF;

  UPDATE deals SET
    revenue_recognized = current_recognized + amount,
    revenue_recognition_status = CASE
      WHEN current_recognized + amount >= deal_value THEN 'completed'
      ELSE 'in_progress'
    END,
    updated_at = NOW()
  WHERE id = deal_id;

  -- Insert recognition record
  INSERT INTO revenue_recognition_schedule (
    deal_id,
    installment_number,
    amount,
    recognized_amount,
    recognition_date,
    actual_recognition_date,
    status,
    description,
    tenant_id,
    created_by
  ) SELECT
    deal_id,
    COALESCE(MAX(installment_number), 0) + 1,
    amount,
    amount,
    recognition_date,
    recognition_date,
    'recognized',
    'Revenue recognition',
    tenant_id,
    created_by
  FROM revenue_recognition_schedule
  WHERE deal_id = deal_id
  UNION ALL
  SELECT deal_id, 1, amount, amount, recognition_date, recognition_date, 'recognized', 'Revenue recognition', tenant_id, created_by
  FROM deals
  WHERE id = deal_id AND NOT EXISTS (SELECT 1 FROM revenue_recognition_schedule WHERE deal_id = deal_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GRANTS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_recognition_schedule TO authenticated;

-- =============================================
-- UPDATE EXISTING DEALS
-- =============================================

-- Set default values for existing deals
UPDATE deals SET
  payment_status = 'pending',
  paid_amount = 0,
  outstanding_amount = value,
  revenue_recognized = 0,
  revenue_recognition_status = 'not_started',
  revenue_recognition_method = 'immediate'
WHERE payment_status IS NULL;

-- =============================================
-- ADD DEAL-CONTRACT LINK
-- =============================================

-- Add contract_id column if it doesn't exist
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id);

-- Add index for contract lookups
CREATE INDEX IF NOT EXISTS idx_deals_contract_id ON deals(contract_id);

-- =============================================
-- ADD DEAL NUMBER GENERATION TRIGGER
-- =============================================

-- Create trigger to auto-generate deal numbers
CREATE OR REPLACE FUNCTION generate_deal_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_number IS NULL THEN
    NEW.deal_number := generate_deal_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_deal_number_on_insert
  BEFORE INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION generate_deal_number_trigger();