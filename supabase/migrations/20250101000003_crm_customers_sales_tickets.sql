-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CRM CORE
-- Migration: 003 - Customers, Sales, and Tickets
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - CRM Types
-- ============================================================================

CREATE TYPE customer_type AS ENUM (
  'individual',
  'business',
  'enterprise'
);

CREATE TYPE sale_stage AS ENUM (
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

CREATE TYPE sale_status AS ENUM (
  'open',
  'won',
  'lost',
  'cancelled'
);

CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed'
);

CREATE TYPE ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE ticket_category AS ENUM (
  'technical',
  'billing',
  'general',
  'feature_request'
);

-- ============================================================================
-- 2. CUSTOMERS TABLE - CRM Customer Data
-- ============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  
  -- Business Info
  industry VARCHAR(100),
  size company_size,
  status entity_status DEFAULT 'active',
  customer_type customer_type,
  
  -- Financial Info
  credit_limit NUMERIC(12, 2),
  payment_terms VARCHAR(50),
  tax_id VARCHAR(100),
  annual_revenue NUMERIC(14, 2),
  total_sales_amount NUMERIC(14, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value NUMERIC(12, 2),
  last_purchase_date DATE,
  
  -- Relationships
  tags VARCHAR(255)[],
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  source VARCHAR(100),
  rating VARCHAR(10),
  last_contact_date DATE,
  next_follow_up_date DATE,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- ============================================================================
-- 3. SALES TABLE (DEALS)
-- ============================================================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identifiers
  sale_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Customer Relationship
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  
  -- Financial Info
  value NUMERIC(12, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL, -- Alias for value
  currency VARCHAR(3) DEFAULT 'USD',
  probability NUMERIC(5, 2) DEFAULT 50,
  weighted_amount NUMERIC(12, 2),
  
  -- Sales Process
  stage sale_stage NOT NULL,
  status sale_status NOT NULL,
  source VARCHAR(100),
  campaign VARCHAR(100),
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  next_activity_date TIMESTAMP WITH TIME ZONE,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  
  -- Additional
  notes TEXT,
  tags VARCHAR(255)[],
  competitor_info TEXT,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_stage ON sales(stage);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_assigned_to ON sales(assigned_to);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- ============================================================================
-- 4. SALE ITEMS TABLE (PRODUCTS IN SALES)
-- ============================================================================

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(12, 2) DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================================================
-- 5. TICKETS TABLE - Support/Service Tickets
-- ============================================================================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identifiers
  ticket_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Customer Relationship
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Status & Classification
  status ticket_status NOT NULL,
  priority ticket_priority NOT NULL,
  category ticket_category NOT NULL,
  sub_category VARCHAR(100),
  source VARCHAR(50),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_by_name VARCHAR(255),
  
  -- Dates & SLA
  due_date DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  first_response_date TIMESTAMP WITH TIME ZONE,
  
  -- Time Tracking
  estimated_hours NUMERIC(8, 2),
  actual_hours NUMERIC(8, 2),
  first_response_time INTEGER, -- in minutes
  resolution_time INTEGER, -- in minutes
  is_sla_breached BOOLEAN DEFAULT FALSE,
  
  -- Resolution
  resolution TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- ============================================================================
-- 6. TICKET COMMENTS TABLE
-- ============================================================================

CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255),
  author_role VARCHAR(50),
  
  parent_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_author_id ON ticket_comments(author_id);
CREATE INDEX idx_ticket_comments_parent_id ON ticket_comments(parent_id);

-- ============================================================================
-- 7. TICKET ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  content_type VARCHAR(100),
  file_size BIGINT,
  
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);

-- ============================================================================
-- 8. TRIGGERS - CRM Timestamp Updates
-- ============================================================================

CREATE TRIGGER customers_updated_at_trigger
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sales_updated_at_trigger
BEFORE UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tickets_updated_at_trigger
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ticket_comments_updated_at_trigger
BEFORE UPDATE ON ticket_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE customers IS 'CRM customer records';
COMMENT ON TABLE sales IS 'Sales deals and opportunities';
COMMENT ON TABLE tickets IS 'Support tickets and issues';
COMMENT ON TABLE ticket_comments IS 'Ticket discussion threads';
COMMENT ON TABLE ticket_attachments IS 'Ticket file attachments';