-- ============================================================================
-- PHASE 1: FOUNDATION LAYER COMPLETION - Customer Management Tables
-- Migration: 20251118000001 - Create Customer Management Tables
-- ============================================================================

-- Create customer_interactions table for tracking all customer interactions
CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Interaction details
  type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'social_media', 'website_visit', 'support_ticket', 'sales_inquiry', 'complaint', 'feedback')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  subject VARCHAR(255),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Contact information
  contact_person VARCHAR(255),
  contact_method VARCHAR(50),
  contact_details JSONB DEFAULT '{}',

  -- Timing and duration
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Status and outcome
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  outcome VARCHAR(100),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,

  -- Assignment and ownership
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create customer_preferences table for customer-specific settings
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Communication preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  phone_calls BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  newsletter_subscription BOOLEAN DEFAULT FALSE,

  -- Contact preferences
  preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'mail', 'in_person')),
  preferred_contact_time VARCHAR(50) CHECK (preferred_contact_time IN ('morning', 'afternoon', 'evening', 'anytime')),
  timezone VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',

  -- Business preferences
  preferred_payment_terms VARCHAR(100),
  preferred_shipping_method VARCHAR(100),
  special_instructions TEXT,

  -- Privacy and data preferences
  data_sharing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_source VARCHAR(100),

  -- Custom preferences
  custom_preferences JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create customer_segments table for customer segmentation
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Segment definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_type VARCHAR(50) NOT NULL CHECK (segment_type IN ('automatic', 'manual', 'dynamic')),
  category VARCHAR(100),

  -- Segmentation criteria
  criteria JSONB DEFAULT '{}',
  rules JSONB DEFAULT '{}',

  -- Segment properties
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(100),
  priority INTEGER DEFAULT 0,

  -- Statistics
  customer_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system_segment BOOLEAN DEFAULT FALSE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create customer_analytics table for customer insights and metrics
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Customer lifecycle metrics
  customer_since TIMESTAMP WITH TIME ZONE,
  total_interactions INTEGER DEFAULT 0,
  last_interaction_date TIMESTAMP WITH TIME ZONE,
  days_since_last_interaction INTEGER,

  -- Value metrics
  lifetime_value DECIMAL(15,2) DEFAULT 0,
  average_order_value DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,

  -- Engagement metrics
  email_open_rate DECIMAL(5,2) DEFAULT 0,
  email_click_rate DECIMAL(5,2) DEFAULT 0,
  website_visits INTEGER DEFAULT 0,
  support_tickets INTEGER DEFAULT 0,

  -- Satisfaction metrics
  satisfaction_score DECIMAL(3,1), -- 1-5 scale
  nps_score INTEGER, -- -100 to 100
  churn_risk_score DECIMAL(5,2) DEFAULT 0, -- 0-1 scale

  -- Segmentation scores
  segment_scores JSONB DEFAULT '{}',
  predicted_lifetime_value DECIMAL(15,2),

  -- Trend data
  monthly_metrics JSONB DEFAULT '{}',
  quarterly_metrics JSONB DEFAULT '{}',
  yearly_metrics JSONB DEFAULT '{}',

  -- Custom analytics
  custom_metrics JSONB DEFAULT '{}',

  -- Last updated
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  next_calculation_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for customer-segment relationships
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Membership details
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id),
  auto_assigned BOOLEAN DEFAULT FALSE,

  -- Membership status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(customer_id, segment_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Customer interactions indexes
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_tenant_id ON customer_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON customer_interactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_date ON customer_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_user_id ON customer_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_by ON customer_interactions(created_by);

-- Customer preferences indexes
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_tenant_id ON customer_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_contact_method ON customer_preferences(preferred_contact_method);

-- Customer segments indexes
CREATE INDEX IF NOT EXISTS idx_customer_segments_tenant_id ON customer_segments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_category ON customer_segments(category);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);

-- Customer analytics indexes
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer_id ON customer_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_tenant_id ON customer_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_churn_risk ON customer_analytics(churn_risk_score);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_lifetime_value ON customer_analytics(lifetime_value);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_last_interaction ON customer_analytics(last_interaction_date);

-- Customer segment memberships indexes
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_id ON customer_segment_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment_id ON customer_segment_memberships(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_tenant_id ON customer_segment_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_active ON customer_segment_memberships(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;

-- Customer interactions policies
CREATE POLICY "customer_interactions_tenant_isolation" ON customer_interactions
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "customer_interactions_super_admin_access" ON customer_interactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Customer preferences policies
CREATE POLICY "customer_preferences_tenant_isolation" ON customer_preferences
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "customer_preferences_super_admin_access" ON customer_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Customer segments policies
CREATE POLICY "customer_segments_tenant_isolation" ON customer_segments
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "customer_segments_super_admin_access" ON customer_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Customer analytics policies
CREATE POLICY "customer_analytics_tenant_isolation" ON customer_analytics
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "customer_analytics_super_admin_access" ON customer_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Customer segment memberships policies
CREATE POLICY "customer_segment_memberships_tenant_isolation" ON customer_segment_memberships
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "customer_segment_memberships_super_admin_access" ON customer_segment_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- CONSTRAINTS AND VALIDATION
-- ============================================================================

-- Add check constraints
ALTER TABLE customer_interactions ADD CONSTRAINT check_interaction_date_not_future
  CHECK (interaction_date <= CURRENT_TIMESTAMP);

ALTER TABLE customer_analytics ADD CONSTRAINT check_satisfaction_score_range
  CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5);

ALTER TABLE customer_analytics ADD CONSTRAINT check_nps_score_range
  CHECK (nps_score >= -100 AND nps_score <= 100);

ALTER TABLE customer_analytics ADD CONSTRAINT check_churn_risk_range
  CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE customer_interactions IS 'Tracks all customer interactions including calls, emails, meetings, and notes';
COMMENT ON TABLE customer_preferences IS 'Stores customer-specific preferences for communication and business processes';
COMMENT ON TABLE customer_segments IS 'Defines customer segments for targeted marketing and analysis';
COMMENT ON TABLE customer_analytics IS 'Stores calculated metrics and insights for each customer';
COMMENT ON TABLE customer_segment_memberships IS 'Junction table linking customers to their segments';

COMMENT ON COLUMN customer_interactions.type IS 'Type of interaction: call, email, meeting, note, task, etc.';
COMMENT ON COLUMN customer_interactions.direction IS 'Direction of interaction: inbound, outbound, or internal';
COMMENT ON COLUMN customer_interactions.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN customer_preferences.preferred_contact_method IS 'Preferred method: email, phone, sms, mail, in_person';
COMMENT ON COLUMN customer_segments.segment_type IS 'Type of segment: automatic, manual, or dynamic';
COMMENT ON COLUMN customer_analytics.lifetime_value IS 'Total customer lifetime value in currency units';
COMMENT ON COLUMN customer_analytics.churn_risk_score IS 'Probability of customer churn (0-1 scale)';

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert some default system segments
INSERT INTO customer_segments (tenant_id, name, description, segment_type, category, color, is_system_segment)
SELECT
  t.id as tenant_id,
  s.name,
  s.description,
  s.segment_type,
  s.category,
  s.color,
  true as is_system_segment
FROM tenants t
CROSS JOIN (
  VALUES
    ('High Value', 'Customers with high lifetime value', 'automatic', 'Value', '#10B981'),
    ('New Customers', 'Recently acquired customers', 'automatic', 'Lifecycle', '#3B82F6'),
    ('At Risk', 'Customers showing churn indicators', 'automatic', 'Risk', '#EF4444'),
    ('VIP', 'Very important customers', 'manual', 'Priority', '#F59E0B'),
    ('Enterprise', 'Large enterprise customers', 'automatic', 'Size', '#8B5CF6')
) AS s(name, description, segment_type, category, color)
ON CONFLICT DO NOTHING;

-- Insert default preferences for existing customers
INSERT INTO customer_preferences (customer_id, tenant_id, created_by)
SELECT
  c.id,
  c.tenant_id,
  c.created_by
FROM customers c
LEFT JOIN customer_preferences cp ON cp.customer_id = c.id
WHERE cp.id IS NULL
ON CONFLICT DO NOTHING;