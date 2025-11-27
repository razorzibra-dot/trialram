-- Create sales pipeline tables: opportunities, deals, sales_activities
-- Migration: 20251117000007_create_sales_pipeline_tables.sql

-- =============================================
-- SALES ACTIVITIES TABLE
-- =============================================

DROP TABLE IF EXISTS sales_activities;

-- =============================================
-- OPPORTUNITIES TABLE
-- =============================================

DROP TABLE IF EXISTS deals;

DROP TABLE IF EXISTS opportunities;

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Customer Relationship
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Financial Information
  estimated_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),

  -- Sales Process
  stage VARCHAR(50) NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'decision', 'contract')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold', 'cancelled')),
  source VARCHAR(100),
  campaign VARCHAR(100),

  -- Dates
  expected_close_date DATE,
  last_activity_date TIMESTAMPTZ,
  next_activity_date TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID NOT NULL REFERENCES users(id),

  -- Additional Information
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  competitor_info TEXT,
  pain_points TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',

  -- Relationships
  converted_to_deal_id UUID,

  -- System Information
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- =============================================
-- DEALS TABLE
-- =============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Customer Relationship
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Financial Information
  value DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Sales Process
  status VARCHAR(50) NOT NULL CHECK (status IN ('won', 'lost', 'cancelled')),
  source VARCHAR(100),
  campaign VARCHAR(100),

  -- Dates
  close_date DATE NOT NULL,
  expected_close_date DATE,

  -- Assignment
  assigned_to UUID NOT NULL REFERENCES users(id),

  -- Additional Information
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  competitor_info TEXT,
  win_loss_reason TEXT,

  -- Relationships
  opportunity_id UUID,

  -- System Information
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- =============================================
-- OPPORTUNITY ITEMS TABLE
-- =============================================

CREATE TABLE opportunity_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DEAL ITEMS TABLE
-- =============================================

CREATE TABLE deal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SALES ACTIVITIES TABLE
-- =============================================

DROP TABLE IF EXISTS sales_activities;

CREATE TABLE sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'demo', 'proposal', 'follow_up', 'negotiation', 'presentation', 'site_visit', 'other')),
  subject VARCHAR(255) NOT NULL,
  description TEXT,

  -- Relationships
  opportunity_id UUID,
  deal_id UUID REFERENCES deals(id),
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  duration_minutes INTEGER CHECK (duration_minutes > 0),

  -- Participants
  performed_by UUID NOT NULL REFERENCES users(id),
  participants UUID[] DEFAULT '{}',
  contact_person VARCHAR(255),

  -- Outcome
  outcome VARCHAR(50) CHECK (outcome IN ('successful', 'unsuccessful', 'pending', 'cancelled', 'rescheduled')),
  outcome_notes TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,

  -- Additional
  location TEXT,
  attachments TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- System Information
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Constraints
  CONSTRAINT sales_activities_relationship_check CHECK (
    (opportunity_id IS NOT NULL AND deal_id IS NULL) OR
    (opportunity_id IS NULL AND deal_id IS NOT NULL)
  )
);

-- Add foreign key constraints after both tables exist
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_converted_to_deal_id FOREIGN KEY (converted_to_deal_id) REFERENCES deals(id);
ALTER TABLE deals ADD CONSTRAINT fk_deals_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);

-- =============================================
-- INDEXES
-- =============================================

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant_id ON opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_converted_to_deal_id ON opportunities(converted_to_deal_id);

-- Opportunity items indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_items_opportunity_id ON opportunity_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_items_product_id ON opportunity_items(product_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_items_tenant_id ON opportunity_items(tenant_id);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(close_date);
CREATE INDEX IF NOT EXISTS idx_deals_opportunity_id ON deals(opportunity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_deal_number ON deals(deal_number) WHERE deal_number IS NOT NULL;

-- Deal items indexes
CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON deal_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON deal_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_tenant_id ON deal_items(tenant_id);

-- Sales activities indexes
CREATE INDEX IF NOT EXISTS idx_sales_activities_tenant_id ON sales_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_opportunity_id ON sales_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_deal_id ON sales_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_customer_id ON sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_performed_by ON sales_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_sales_activities_activity_type ON sales_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_sales_activities_start_date ON sales_activities(start_date);
CREATE INDEX IF NOT EXISTS idx_sales_activities_outcome ON sales_activities(outcome);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;

-- Opportunities policies
CREATE POLICY "opportunities_tenant_isolation" ON opportunities
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "super_admin_opportunities_access" ON opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Opportunity items policies
CREATE POLICY "opportunity_items_tenant_isolation" ON opportunity_items
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "super_admin_opportunity_items_access" ON opportunity_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Deals policies
CREATE POLICY "deals_tenant_isolation" ON deals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "super_admin_deals_access" ON deals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Deal items policies
CREATE POLICY "deal_items_tenant_isolation" ON deal_items
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "super_admin_deal_items_access" ON deal_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Sales activities policies
CREATE POLICY "sales_activities_tenant_isolation" ON sales_activities
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "super_admin_sales_activities_access" ON sales_activities
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunity_items_updated_at BEFORE UPDATE ON opportunity_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_items_updated_at BEFORE UPDATE ON deal_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_activities_updated_at BEFORE UPDATE ON sales_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate deal number
CREATE OR REPLACE FUNCTION generate_deal_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  deal_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM deals
  WHERE deal_number LIKE 'D-' || current_year || '-%';

  -- Format: D-2025-0001
  deal_number := 'D-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN deal_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate opportunity weighted value
CREATE OR REPLACE FUNCTION calculate_opportunity_weighted_value(opp_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  estimated_val DECIMAL;
  prob INTEGER;
BEGIN
  SELECT estimated_value, probability INTO estimated_val, prob
  FROM opportunities WHERE id = opp_id;

  RETURN COALESCE(estimated_val * prob / 100, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS
-- =============================================

-- Opportunities with customer and assignee info
CREATE VIEW opportunities_with_details AS
SELECT
  o.*,
  c.company_name as customer_name,
  u.name as assigned_to_name,
  calculate_opportunity_weighted_value(o.id) as weighted_value
FROM opportunities o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.assigned_to = u.id;

-- Deals with customer and assignee info
CREATE VIEW deals_with_details AS
SELECT
  d.*,
  c.company_name as customer_name,
  u.name as assigned_to_name
FROM deals d
LEFT JOIN customers c ON d.customer_id = c.id
LEFT JOIN users u ON d.assigned_to = u.id;

-- Sales activities with related info
CREATE VIEW sales_activities_with_details AS
SELECT
  sa.*,
  c.company_name as customer_name,
  u.name as performed_by_name,
  COALESCE(o.title, dl.title) as related_record_title
FROM sales_activities sa
LEFT JOIN customers c ON sa.customer_id = c.id
LEFT JOIN users u ON sa.performed_by = u.id
LEFT JOIN opportunities o ON sa.opportunity_id = o.id
LEFT JOIN deals dl ON sa.deal_id = dl.id;

-- =============================================
-- GRANTS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_activities TO authenticated;

-- Grant permissions on views
GRANT SELECT ON opportunities_with_details TO authenticated;
GRANT SELECT ON deals_with_details TO authenticated;
GRANT SELECT ON sales_activities_with_details TO authenticated;