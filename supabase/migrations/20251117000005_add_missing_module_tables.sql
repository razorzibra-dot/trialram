-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - Missing Module Tables
-- Migration: 20251117000005 - Add Missing Module-Specific Tables
-- ============================================================================

-- ============================================================================
-- 0. ENSURE SUPER ADMIN COLUMN EXISTS (for RLS policies)
-- ============================================================================

-- Add is_super_admin column if it doesn't exist (safety check)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for super admin queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin)
WHERE is_super_admin = true;

-- ============================================================================
-- 1. CUSTOMER INTERACTIONS TABLE - Complete interaction history
-- ============================================================================

CREATE TABLE customer_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Interaction details
  type VARCHAR(50) NOT NULL, -- email, call, meeting, note, task, etc.
  direction VARCHAR(20), -- inbound, outbound (for calls/emails)
  subject VARCHAR(255),
  description TEXT,
  notes TEXT,

  -- Participants
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  contact_person VARCHAR(255),
  contact_method VARCHAR(50), -- phone, email, in_person, etc.

  -- Timing
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Outcome
  outcome VARCHAR(100), -- successful, unsuccessful, follow_up_needed, etc.
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  next_action TEXT,

  -- Metadata
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  tags VARCHAR(255)[],
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_interaction_type CHECK (type IN ('email', 'call', 'meeting', 'note', 'task', 'social_media', 'web_visit', 'other')),
  CONSTRAINT check_direction CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT check_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_tenant_id ON customer_interactions(tenant_id);
CREATE INDEX idx_customer_interactions_type ON customer_interactions(type);
CREATE INDEX idx_customer_interactions_interaction_date ON customer_interactions(interaction_date);
CREATE INDEX idx_customer_interactions_user_id ON customer_interactions(user_id);

-- Enable RLS on customer_interactions
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only access customer interactions from their tenant
CREATE POLICY "Users can view customer interactions from their tenant" ON customer_interactions
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert customer interactions for their tenant" ON customer_interactions
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update customer interactions from their tenant" ON customer_interactions
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete customer interactions from their tenant" ON customer_interactions
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all customer interactions
CREATE POLICY "Super admins can view all customer interactions" ON customer_interactions
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all customer interactions" ON customer_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all customer interactions" ON customer_interactions
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all customer interactions" ON customer_interactions
  FOR DELETE USING (true);

-- ============================================================================
-- 2. CUSTOMER PREFERENCES TABLE - Customer customization
-- ============================================================================

CREATE TABLE customer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Communication preferences
  preferred_contact_method VARCHAR(50), -- email, phone, sms, mail
  preferred_contact_time VARCHAR(50), -- morning, afternoon, evening
  communication_frequency VARCHAR(50), -- daily, weekly, monthly, never
  newsletter_subscription BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  promotional_offers BOOLEAN DEFAULT TRUE,

  -- Business preferences
  preferred_payment_terms VARCHAR(100),
  preferred_delivery_method VARCHAR(100),
  special_instructions TEXT,
  discount_eligibility BOOLEAN DEFAULT FALSE,
  credit_terms_override VARCHAR(255),

  -- Personal preferences
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50),
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  currency VARCHAR(3) DEFAULT 'USD',

  -- Notification preferences
  email_notifications JSONB DEFAULT '{"marketing": true, "updates": true, "reminders": true}'::JSONB,
  sms_notifications JSONB DEFAULT '{"urgent": true, "reminders": false}'::JSONB,

  -- Custom fields
  custom_fields JSONB DEFAULT '{}'::JSONB,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT unique_customer_preferences UNIQUE(customer_id)
);

CREATE INDEX idx_customer_preferences_customer_id ON customer_preferences(customer_id);
CREATE INDEX idx_customer_preferences_tenant_id ON customer_preferences(tenant_id);

-- Enable RLS on customer_preferences
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access customer preferences from their tenant
CREATE POLICY "Users can view customer preferences from their tenant" ON customer_preferences
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert customer preferences for their tenant" ON customer_preferences
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update customer preferences from their tenant" ON customer_preferences
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete customer preferences from their tenant" ON customer_preferences
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all customer preferences
CREATE POLICY "Super admins can view all customer preferences" ON customer_preferences
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all customer preferences" ON customer_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all customer preferences" ON customer_preferences
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all customer preferences" ON customer_preferences
  FOR DELETE USING (true);

-- ============================================================================
-- 3. LEADS TABLE - Sales lead management
-- ============================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lead information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),

  -- Lead details
  source VARCHAR(100), -- website, referral, social_media, cold_call, etc.
  campaign VARCHAR(100),
  lead_score INTEGER DEFAULT 0,
  qualification_status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, unqualified

  -- Business information
  industry VARCHAR(100),
  company_size VARCHAR(50),
  job_title VARCHAR(100),
  budget_range VARCHAR(50),
  timeline VARCHAR(50),

  -- Lead status
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, proposal, negotiation, won, lost
  stage VARCHAR(50) DEFAULT 'awareness', -- awareness, interest, consideration, intent, evaluation, purchase

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),

  -- Conversion
  converted_to_customer BOOLEAN DEFAULT FALSE,
  converted_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Notes and follow-up
  notes TEXT,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  last_contact TIMESTAMP WITH TIME ZONE,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_lead_score CHECK (lead_score >= 0 AND lead_score <= 100),
  CONSTRAINT check_qualification_status CHECK (qualification_status IN ('new', 'contacted', 'qualified', 'unqualified')),
  CONSTRAINT check_lead_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  CONSTRAINT check_lead_stage CHECK (stage IN ('awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase'))
);

CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_lead_score ON leads(lead_score);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Enable RLS on leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Users can only access leads from their tenant
CREATE POLICY "Users can view leads from their tenant" ON leads
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert leads for their tenant" ON leads
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update leads from their tenant" ON leads
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete leads from their tenant" ON leads
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all leads
CREATE POLICY "Super admins can view all leads" ON leads
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all leads" ON leads
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all leads" ON leads
  FOR DELETE USING (true);

-- ============================================================================
-- 4. OPPORTUNITIES TABLE - Sales opportunity tracking
-- ============================================================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Opportunity details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  opportunity_number VARCHAR(50),

  -- Customer relationship
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Financial information
  estimated_value NUMERIC(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  probability INTEGER DEFAULT 50, -- 0-100

  -- Status and stage
  stage VARCHAR(50) DEFAULT 'prospecting', -- prospecting, qualification, proposal, negotiation, closed_won, closed_lost
  status VARCHAR(50) DEFAULT 'open', -- open, won, lost, cancelled

  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  last_activity_date TIMESTAMP WITH TIME ZONE,

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),

  -- Competition and notes
  competitors TEXT,
  competitive_advantage TEXT,
  notes TEXT,
  next_steps TEXT,

  -- Conversion
  converted_to_sale BOOLEAN DEFAULT FALSE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_probability CHECK (probability >= 0 AND probability <= 100),
  CONSTRAINT check_opportunity_stage CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  CONSTRAINT check_opportunity_status CHECK (status IN ('open', 'won', 'lost', 'cancelled'))
);

CREATE INDEX idx_opportunities_tenant_id ON opportunities(tenant_id);
CREATE INDEX idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);

-- Enable RLS on opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Users can only access opportunities from their tenant
CREATE POLICY "Users can view opportunities from their tenant" ON opportunities
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert opportunities for their tenant" ON opportunities
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update opportunities from their tenant" ON opportunities
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete opportunities from their tenant" ON opportunities
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all opportunities
CREATE POLICY "Super admins can view all opportunities" ON opportunities
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all opportunities" ON opportunities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all opportunities" ON opportunities
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all opportunities" ON opportunities
  FOR DELETE USING (true);

-- ============================================================================
-- 5. SALES ACTIVITIES TABLE - Sales activity tracking
-- ============================================================================

CREATE TABLE sales_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Related entities
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Activity details
  type VARCHAR(50) NOT NULL, -- call, email, meeting, demo, proposal, follow_up, etc.
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  outcome VARCHAR(100), -- successful, unsuccessful, follow_up_needed, etc.

  -- Participants
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  contact_person VARCHAR(255),

  -- Timing
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  next_action TEXT,

  -- Metadata
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  tags VARCHAR(255)[],
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_activity_type CHECK (type IN ('call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'presentation', 'negotiation', 'other')),
  CONSTRAINT check_activity_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX idx_sales_activities_sale_id ON sales_activities(sale_id);
CREATE INDEX idx_sales_activities_opportunity_id ON sales_activities(opportunity_id);
CREATE INDEX idx_sales_activities_customer_id ON sales_activities(customer_id);
CREATE INDEX idx_sales_activities_tenant_id ON sales_activities(tenant_id);
CREATE INDEX idx_sales_activities_type ON sales_activities(type);
CREATE INDEX idx_sales_activities_activity_date ON sales_activities(activity_date);
CREATE INDEX idx_sales_activities_performed_by ON sales_activities(performed_by);

-- Enable RLS on sales_activities
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;

-- Users can only access sales activities from their tenant
CREATE POLICY "Users can view sales activities from their tenant" ON sales_activities
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert sales activities for their tenant" ON sales_activities
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update sales activities from their tenant" ON sales_activities
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete sales activities from their tenant" ON sales_activities
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all sales activities
CREATE POLICY "Super admins can view all sales activities" ON sales_activities
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all sales activities" ON sales_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all sales activities" ON sales_activities
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all sales activities" ON sales_activities
  FOR DELETE USING (true);

-- ============================================================================
-- 6. INVENTORY TABLE - Product inventory management
-- ============================================================================

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Stock levels
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,

  -- Stock thresholds
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER,

  -- Location and warehouse
  warehouse_id UUID,
  warehouse_name VARCHAR(255),
  location_code VARCHAR(100),
  bin_location VARCHAR(100),

  -- Stock status
  stock_status VARCHAR(50) DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock, discontinued
  last_stock_check TIMESTAMP WITH TIME ZONE,
  last_stock_update TIMESTAMP WITH TIME ZONE,

  -- Cost and valuation
  unit_cost NUMERIC(12, 2),
  total_value NUMERIC(14, 2) GENERATED ALWAYS AS (current_stock * unit_cost) STORED,

  -- Supplier information
  supplier_id UUID,
  supplier_name VARCHAR(255),
  lead_time_days INTEGER,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_current_stock CHECK (current_stock >= 0),
  CONSTRAINT check_reserved_stock CHECK (reserved_stock >= 0),
  CONSTRAINT check_stock_status CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  CONSTRAINT unique_product_inventory UNIQUE(product_id, tenant_id)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX idx_inventory_stock_status ON inventory(stock_status);
CREATE INDEX idx_inventory_available_stock ON inventory(available_stock);

-- Enable RLS on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Users can only access inventory from their tenant
CREATE POLICY "Users can view inventory from their tenant" ON inventory
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert inventory for their tenant" ON inventory
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update inventory from their tenant" ON inventory
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete inventory from their tenant" ON inventory
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Super admins can access all inventory
CREATE POLICY "Super admins can view all inventory" ON inventory
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true));

CREATE POLICY "Super admins can insert all inventory" ON inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can update all inventory" ON inventory
  FOR UPDATE USING (true);

CREATE POLICY "Super admins can delete all inventory" ON inventory
  FOR DELETE USING (true);

-- ============================================================================
-- 7. TICKET ACTIVITIES TABLE - Ticket activity tracking
-- ============================================================================

CREATE TABLE ticket_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Activity details
  type VARCHAR(50) NOT NULL, -- created, updated, assigned, status_changed, commented, attachment_added, etc.
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  -- User information
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  performed_by_role VARCHAR(50),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_tenant_id ON ticket_activities(tenant_id);
CREATE INDEX idx_ticket_activities_type ON ticket_activities(type);
CREATE INDEX idx_ticket_activities_performed_by ON ticket_activities(performed_by);
CREATE INDEX idx_ticket_activities_created_at ON ticket_activities(created_at);

-- ============================================================================
-- 8. CONTRACT TERMS TABLE - Contract terms and conditions
-- ============================================================================

CREATE TABLE contract_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Term details
  term_type VARCHAR(100) NOT NULL, -- payment_terms, delivery_terms, warranty, liability, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,

  -- Term specifics
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_negotiable BOOLEAN DEFAULT TRUE,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

  -- Validity
  effective_date DATE,
  expiry_date DATE,
  version INTEGER DEFAULT 1,

  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_term_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_contract_terms_contract_id ON contract_terms(contract_id);
CREATE INDEX idx_contract_terms_tenant_id ON contract_terms(tenant_id);
CREATE INDEX idx_contract_terms_term_type ON contract_terms(term_type);
CREATE INDEX idx_contract_terms_priority ON contract_terms(priority);

-- ============================================================================
-- 9. TRIGGERS - Missing table timestamp updates
-- ============================================================================

CREATE TRIGGER customer_interactions_updated_at_trigger
BEFORE UPDATE ON customer_interactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER customer_preferences_updated_at_trigger
BEFORE UPDATE ON customer_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER leads_updated_at_trigger
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER opportunities_updated_at_trigger
BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sales_activities_updated_at_trigger
BEFORE UPDATE ON sales_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER inventory_updated_at_trigger
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contract_terms_updated_at_trigger
BEFORE UPDATE ON contract_terms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE customer_interactions IS 'Complete customer interaction history and communication log';
COMMENT ON TABLE customer_preferences IS 'Customer-specific preferences and communication settings';
COMMENT ON TABLE leads IS 'Sales leads and prospect management';
COMMENT ON TABLE opportunities IS 'Sales opportunities and pipeline management';
COMMENT ON TABLE sales_activities IS 'Sales activity tracking and follow-up management';
COMMENT ON TABLE inventory IS 'Product inventory levels and stock management';
COMMENT ON TABLE ticket_activities IS 'Ticket activity log and audit trail';
COMMENT ON TABLE contract_terms IS 'Contract terms, conditions, and legal clauses';