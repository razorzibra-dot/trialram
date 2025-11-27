-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - NOTIFICATIONS & INDEXES
-- Migration: 006 - Notifications, Additional Indexes, and Optimization
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Notification Types
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
  'system',
  'user',
  'alert',
  'reminder',
  'approval',
  'task_assigned'
);

-- ============================================================================
-- 2. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Target
  related_entity_type VARCHAR(100),
  related_entity_id VARCHAR(255),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url VARCHAR(500),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Notification channel preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  
  -- Notification type preferences
  system_notifications BOOLEAN DEFAULT TRUE,
  alerts BOOLEAN DEFAULT TRUE,
  reminders BOOLEAN DEFAULT TRUE,
  approvals BOOLEAN DEFAULT TRUE,
  task_assignments BOOLEAN DEFAULT TRUE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_preferences_per_user UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================================================
-- 4. PDF TEMPLATES TABLE
-- ============================================================================

CREATE TABLE pdf_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  content TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_pdf_template_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_pdf_templates_tenant_id ON pdf_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_category ON pdf_templates(category);

-- ============================================================================
-- 5. COMPLAINTS TABLE
-- ============================================================================

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  complaint_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  
  -- Classification
  category VARCHAR(100),
  priority ticket_priority NOT NULL,
  status VARCHAR(50) NOT NULL, -- open, in_progress, resolved, closed
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_complaints_tenant_id ON complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- ============================================================================
-- 6. ACTIVITY LOG TABLE - For tracking user activity
-- ============================================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  description TEXT,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address VARCHAR(45),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- ============================================================================
-- 7. TRIGGERS - Notification Timestamp Updates
-- ============================================================================

CREATE TRIGGER notification_preferences_updated_at_trigger
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER pdf_templates_updated_at_trigger
BEFORE UPDATE ON pdf_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER complaints_updated_at_trigger
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. PERFORMANCE INDEXES - Key Queries
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_tenant_assigned ON customers(tenant_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_stage_created ON sales(tenant_id, stage, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_assigned_status ON tickets(tenant_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status_end ON contracts(tenant_id, status, end_date);
CREATE INDEX IF NOT EXISTS idx_job_works_tenant_status_engineer ON job_works(tenant_id, status, receiver_engineer_id);

-- Date range indexes
CREATE INDEX IF NOT EXISTS idx_sales_expected_close_date ON sales(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date_notification ON contracts(end_date) WHERE status != 'expired';
CREATE INDEX IF NOT EXISTS idx_service_contracts_end_date ON service_contracts(end_date) WHERE status != 'expired';
CREATE INDEX IF NOT EXISTS idx_job_works_due_date ON job_works(due_date) WHERE status IN ('pending', 'in_progress');

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_name_lower ON customers(LOWER(company_name));
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_sales_title_lower ON sales(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_tickets_title_lower ON tickets(LOWER(title));

-- ============================================================================
-- 9. HELPER FUNCTIONS - Common Queries
-- ============================================================================

-- Function to get tenant-filtered user count
CREATE OR REPLACE FUNCTION get_tenant_user_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users WHERE tenant_id = p_tenant_id AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to get open tickets count
CREATE OR REPLACE FUNCTION get_open_tickets_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM tickets 
          WHERE tenant_id = p_tenant_id 
          AND status IN ('open', 'in_progress', 'pending')
          AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to get active sales count
CREATE OR REPLACE FUNCTION get_active_sales_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM sales 
          WHERE tenant_id = p_tenant_id 
          AND status = 'open'
          AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total deal value
CREATE OR REPLACE FUNCTION get_total_deal_value(p_tenant_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(value), 0) FROM sales 
          WHERE tenant_id = p_tenant_id 
          AND status = 'open'
          AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to get expiring contracts (within 30 days)
CREATE OR REPLACE FUNCTION get_expiring_contracts(p_tenant_id UUID)
RETURNS TABLE(id UUID, title VARCHAR, customer_name VARCHAR, end_date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.customer_name, c.end_date
  FROM contracts c
  WHERE c.tenant_id = p_tenant_id
    AND c.status IN ('active', 'renewed')
    AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.deleted_at IS NULL
  ORDER BY c.end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. FULL TEXT SEARCH - For global search
-- ============================================================================

-- Full text search config for common tables
ALTER TABLE customers ADD COLUMN search_text TSVECTOR;
ALTER TABLE products ADD COLUMN search_text TSVECTOR;
ALTER TABLE sales ADD COLUMN search_text TSVECTOR;
ALTER TABLE tickets ADD COLUMN search_text TSVECTOR;
ALTER TABLE contracts ADD COLUMN search_text TSVECTOR;

-- Update search text columns on insert/update (example for customers)
CREATE OR REPLACE FUNCTION update_customers_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english', 
    COALESCE(NEW.company_name, '') || ' ' ||
    COALESCE(NEW.contact_name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.phone, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_search_text_trigger
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_customers_search_text();

-- Create GIN index for full text search
CREATE INDEX IF NOT EXISTS idx_customers_search_text ON customers USING gin(search_text);

-- Similar for products
CREATE OR REPLACE FUNCTION update_products_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.sku, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_text_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_products_search_text();

CREATE INDEX IF NOT EXISTS idx_products_search_text ON products USING gin(search_text);

COMMENT ON TABLE notifications IS 'User notifications system';
COMMENT ON TABLE pdf_templates IS 'PDF template management';
COMMENT ON TABLE complaints IS 'Customer complaints management';
COMMENT ON TABLE activity_logs IS 'User activity tracking';