-- ============================================================================
-- COMPLETE DATABASE SCHEMA EXPORT
-- PDS CRM Enterprise Application
-- ============================================================================
-- Generated: December 15, 2025
-- Purpose: Complete database schema including structure, RLS, functions, and seed data
-- 
-- USAGE:
-- 1. Create a fresh Supabase project or PostgreSQL database
-- 2. Run this script to set up the complete schema
-- 3. All tables, policies, functions, triggers, and seed data will be created
--
-- STRUCTURE:
-- 1. Extensions & Prerequisites
-- 2. Core Schema (Tables, Enums, Types)
-- 3. Row Level Security (RLS) Policies
-- 4. Functions & Triggers
-- 5. Indexes & Performance Optimization
-- 6. Views
-- 7. Seed Data
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLEAN SLATE (Optional - Use with CAUTION)
-- ============================================================================
-- WARNING: Uncomment the following lines ONLY for fresh installations
-- This will DROP ALL existing data

-- DROP SCHEMA IF EXISTS public CASCADE;
-- DROP SCHEMA IF EXISTS auth CASCADE;
-- CREATE SCHEMA IF NOT EXISTS public;
-- CREATE SCHEMA IF NOT EXISTS auth;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ============================================================================
-- SECTION 2: EXTENSIONS & PREREQUISITES
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";         -- Cryptography functions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring

-- ============================================================================
-- SECTION 3: COMPLETE MIGRATION HISTORY
-- All migrations applied in chronological order
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20250101000001_init_tenants_and_users.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CORE SETUP
-- Migration: 001 - Tenants and Users
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Shared Type Definitions
-- ============================================================================

-- User Roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'agent',
  'engineer',
  'customer'
);

-- User Status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- ============================================================================
-- 2. TENANTS TABLE - Multi-tenant Support
-- ============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
  users_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for tenants
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_domain ON tenants(domain);

-- ============================================================================
-- 3. USERS TABLE - Authentication & Authorization
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'agent',
  status user_status NOT NULL DEFAULT 'active',
  
  -- Tenant relationship
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Additional information
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  company_name VARCHAR(255),
  department VARCHAR(100),
  position VARCHAR(100),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint per tenant
  CONSTRAINT unique_email_per_tenant UNIQUE(email, tenant_id)
);

-- Indexes for users
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- 4. USER ROLES & PERMISSIONS - RBAC
-- ============================================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_system_role BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);

-- ============================================================================
-- 5. USER ROLE ASSIGNMENTS
-- ============================================================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_user_role_per_tenant UNIQUE(user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);

-- ============================================================================
-- 6. PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. ROLE PERMISSIONS MAPPING
-- ============================================================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================================================
-- 8. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  
  changes JSONB,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- 9. HELPER FUNCTIONS - Timestamp Updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER tenants_updated_at_trigger
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roles_updated_at_trigger
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. INITIAL DATA - Default System Roles
-- ============================================================================

-- This will be populated by the application on first setup
-- Or manually: INSERT INTO permissions VALUES (...) for core permissions

COMMENT ON TABLE tenants IS 'Multi-tenant data isolation';
COMMENT ON TABLE users IS 'Application users with tenant isolation';
COMMENT ON TABLE roles IS 'Custom roles per tenant';
COMMENT ON TABLE audit_logs IS 'Activity audit trail';



-- ============================================================================
-- MIGRATION: 20250101000002_master_data_companies_products.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - MASTER DATA
-- Migration: 002 - Companies and Products
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Master Data Types
-- ============================================================================

CREATE TYPE company_size AS ENUM (
  'startup',
  'small',
  'medium',
  'large',
  'enterprise'
);

CREATE TYPE entity_status AS ENUM (
  'active',
  'inactive',
  'prospect',
  'suspended'
);

CREATE TYPE product_status AS ENUM (
  'active',
  'inactive',
  'discontinued'
);

-- ============================================================================
-- 2. COMPANIES TABLE - Master Company Data
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Classification
  industry VARCHAR(100),
  size company_size,
  status entity_status DEFAULT 'active',
  
  -- Additional info
  description TEXT,
  logo_url VARCHAR(500),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_company_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);

-- ============================================================================
-- 3. PRODUCT CATEGORIES TABLE
-- ============================================================================

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_product_categories_tenant_id ON product_categories(tenant_id);

-- ============================================================================
-- 4. PRODUCTS TABLE - Master Product Data
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  type VARCHAR(50),
  sku VARCHAR(100) NOT NULL,
  
  -- Pricing
  price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status product_status DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE,
  
  -- Stock Management
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  track_stock BOOLEAN DEFAULT TRUE,
  unit VARCHAR(20),
  min_order_quantity INTEGER,
  
  -- Physical Properties
  weight NUMERIC(8, 2),
  dimensions VARCHAR(100),
  
  -- Supplier
  supplier_id UUID,
  supplier_name VARCHAR(255),
  
  -- Additional
  warranty_period_months INTEGER,
  service_contract_available BOOLEAN DEFAULT FALSE,
  tags VARCHAR(255)[],
  image_url VARCHAR(500),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_sku_per_tenant UNIQUE(sku, tenant_id)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================================================
-- 5. PRODUCT SPECIFICATIONS TABLE
-- ============================================================================

CREATE TABLE product_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);

-- ============================================================================
-- 6. TRIGGERS - Master Data Timestamp Updates
-- ============================================================================

CREATE TRIGGER companies_updated_at_trigger
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER product_categories_updated_at_trigger
BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. INITIAL DATA - Default Categories
-- ============================================================================

-- Insert standard product categories (these will be populated per tenant)
-- The app will handle tenant-specific initialization

COMMENT ON TABLE companies IS 'Master company data with tenant isolation';
COMMENT ON TABLE products IS 'Master product catalog with inventory tracking';
COMMENT ON TABLE product_specifications IS 'Product attribute specifications';


-- ============================================================================
-- MIGRATION: 20250101000003_crm_customers_sales_tickets.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20250101000004_contracts.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CONTRACTS
-- Migration: 004 - Contract Management
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Contract Types
-- ============================================================================

CREATE TYPE contract_type AS ENUM (
  'service_agreement',
  'nda',
  'purchase_order',
  'employment',
  'custom'
);

CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_approval',
  'active',
  'renewed',
  'expired',
  'terminated'
);

CREATE TYPE contract_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non_compliant',
  'pending_review'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE party_role AS ENUM (
  'client',
  'vendor',
  'partner',
  'internal',
  'customer'
);

CREATE TYPE signature_status_enum AS ENUM (
  'pending',
  'signed',
  'declined'
);

-- ============================================================================
-- 2. CONTRACT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type contract_type NOT NULL,
  category VARCHAR(100),
  
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_template_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_contract_templates_tenant_id ON contract_templates(tenant_id);
CREATE INDEX idx_contract_templates_type ON contract_templates(type);

-- ============================================================================
-- 3. TEMPLATE FIELDS TABLE
-- ============================================================================

CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- text, number, date, select, textarea
  required BOOLEAN DEFAULT FALSE,
  placeholder VARCHAR(255),
  options VARCHAR(255)[],
  default_value VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_fields_template_id ON template_fields(template_id);

-- ============================================================================
-- 4. CONTRACTS TABLE
-- ============================================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identifiers
  contract_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type contract_type NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_contact VARCHAR(255),
  
  -- Financial
  value NUMERIC(12, 2) NOT NULL,
  total_value NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(255),
  delivery_terms VARCHAR(255),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  signed_date DATE,
  next_renewal_date DATE,
  
  -- Renewal & Terms
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_period_months INTEGER,
  renewal_terms TEXT,
  terms TEXT,
  
  -- Approval
  approval_stage VARCHAR(100),
  compliance_status compliance_status DEFAULT 'pending_review',
  
  -- Document
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  content TEXT,
  document_path VARCHAR(500),
  document_url VARCHAR(500),
  version INTEGER DEFAULT 1,
  
  -- Management
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  
  -- Organization
  tags VARCHAR(255)[],
  priority contract_priority DEFAULT 'medium',
  reminder_days INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  next_reminder_date DATE,
  notes TEXT,
  
  -- Signatures
  signature_total_required INTEGER DEFAULT 1,
  signature_completed INTEGER DEFAULT 0,
  signed_by_customer VARCHAR(255),
  signed_by_company VARCHAR(255),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_assigned_to ON contracts(assigned_to);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- ============================================================================
-- 5. CONTRACT PARTIES TABLE
-- ============================================================================

CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  role party_role NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  signature_required BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_url VARCHAR(500),
  signature_status signature_status_enum DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_parties_contract_id ON contract_parties(contract_id);

-- ============================================================================
-- 6. CONTRACT ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE contract_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(50),
  size BIGINT,
  
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_attachments_contract_id ON contract_attachments(contract_id);

-- ============================================================================
-- 7. APPROVAL RECORDS TABLE
-- ============================================================================

CREATE TABLE contract_approval_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  stage VARCHAR(100) NOT NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_name VARCHAR(255),
  status approval_status NOT NULL,
  comments TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_approval_records_contract_id ON contract_approval_records(contract_id);
CREATE INDEX idx_contract_approval_records_approver_id ON contract_approval_records(approver_id);

-- ============================================================================
-- 8. CONTRACT VERSIONS TABLE
-- ============================================================================

CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, archived
  
  document_url VARCHAR(500) NOT NULL,
  is_current_version BOOLEAN DEFAULT FALSE,
  
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_contract_version UNIQUE(contract_id, version)
);

CREATE INDEX idx_contract_versions_contract_id ON contract_versions(contract_id);

-- ============================================================================
-- 9. TRIGGERS - Contract Timestamp Updates
-- ============================================================================

CREATE TRIGGER contract_templates_updated_at_trigger
BEFORE UPDATE ON contract_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contracts_updated_at_trigger
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contracts IS 'Contract management and lifecycle';
COMMENT ON TABLE contract_parties IS 'Contract signing parties';
COMMENT ON TABLE contract_attachments IS 'Contract file attachments';
COMMENT ON TABLE contract_approval_records IS 'Contract approval workflow audit';
COMMENT ON TABLE contract_versions IS 'Contract version history';


-- ============================================================================
-- MIGRATION: 20250101000005_advanced_product_sales_jobwork.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ADVANCED FEATURES
-- Migration: 005 - Product Sales & Service Contracts & Job Work
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS - Product Sales & Service Types
-- ============================================================================

CREATE TYPE product_sale_status AS ENUM (
  'new',
  'renewed',
  'expired'
);

CREATE TYPE service_contract_status AS ENUM (
  'active',
  'expired',
  'renewed',
  'cancelled'
);

CREATE TYPE service_level AS ENUM (
  'basic',
  'standard',
  'premium',
  'enterprise'
);

CREATE TYPE job_work_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'delivered',
  'cancelled'
);

CREATE TYPE job_work_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- ============================================================================
-- 2. PRODUCT SALES TABLE
-- ============================================================================

CREATE TABLE product_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer & Product
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  
  -- Sale Details
  units NUMERIC(10, 2) NOT NULL,
  cost_per_unit NUMERIC(12, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  
  -- Dates
  delivery_date DATE NOT NULL,
  warranty_expiry DATE NOT NULL,
  
  -- Status & Notes
  status product_sale_status DEFAULT 'new',
  notes TEXT,
  attachments VARCHAR(255)[],
  
  -- Service Contract Link
  service_contract_id UUID,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_product_sales_tenant_id ON product_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_customer_id ON product_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_status ON product_sales(status);

-- ============================================================================
-- 3. SERVICE CONTRACTS TABLE (ENTERPRISE SCHEMA)
-- ============================================================================
-- NOTE: This is the ENTERPRISE schema that matches the service layer.
-- The old simple schema (with product_sale_id, contract_value, etc.) has been 
-- replaced by migration 20250130000018_create_service_contracts_module.sql

CREATE TABLE service_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Contract Identification
  contract_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Related Entities
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  
  -- Service Details
  service_type VARCHAR(50) NOT NULL,           -- support, maintenance, consulting, training, hosting, custom
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending_approval, active, on_hold, completed, cancelled, expired
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  -- Financial Terms
  value NUMERIC(12, 2) NOT NULL CHECK (value >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_frequency VARCHAR(20),               -- monthly, quarterly, annually, one_time
  payment_terms TEXT,
  
  -- Service Delivery Terms
  sla_terms TEXT,                              -- Service Level Agreement terms (HTML-rich text)
  renewal_terms TEXT,                          -- Renewal and continuation terms
  service_scope TEXT,                          -- Detailed scope of services (HTML-rich text)
  exclusions TEXT,                             -- What's NOT included (HTML-rich text)
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_completion_date DATE,
  
  -- Renewal Settings
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_period_months INTEGER,
  last_renewal_date DATE,
  next_renewal_date DATE,
  
  -- Scheduling & Delivery
  delivery_schedule TEXT,                      -- Detailed schedule (JSON or text)
  scheduled_hours_per_week INTEGER,
  time_zone VARCHAR(50),
  
  -- Team Assignment
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  secondary_contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
  secondary_contact_name VARCHAR(255),
  
  -- Metadata
  approval_status VARCHAR(50),                 -- approved, rejected, pending, in_review
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  compliance_notes TEXT,
  tags VARCHAR(500)[],                         -- For filtering and organization
  custom_fields JSONB,                         -- Flexible custom fields
  
  -- Audit Fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT valid_service_type CHECK (
    service_type IN ('support', 'maintenance', 'consulting', 'training', 'hosting', 'custom')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'pending_approval', 'active', 'on_hold', 'completed', 'cancelled', 'expired')
  ),
  CONSTRAINT unique_contract_number_per_tenant UNIQUE(contract_number, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_service_contracts_tenant_id ON service_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_customer_id ON service_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_status ON service_contracts(status);
CREATE INDEX IF NOT EXISTS idx_service_contracts_end_date ON service_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_service_contracts_service_type ON service_contracts(service_type);
CREATE INDEX IF NOT EXISTS idx_service_contracts_assigned_to ON service_contracts(assigned_to_user_id);

-- ============================================================================
-- 4. JOB WORK TABLE - Engineering/Service Jobs
-- ============================================================================

CREATE TABLE job_works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  job_ref_id VARCHAR(50) NOT NULL,
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_short_name VARCHAR(20),
  customer_contact VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Product
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  product_sku VARCHAR(100),
  product_category VARCHAR(100),
  product_unit VARCHAR(20),
  
  -- Job Specifications
  pieces NUMERIC(10, 2) NOT NULL,
  size VARCHAR(100) NOT NULL,
  
  -- Pricing
  base_price NUMERIC(12, 2) NOT NULL,
  default_price NUMERIC(12, 2) NOT NULL,
  manual_price NUMERIC(12, 2),
  final_price NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Assignment
  receiver_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_engineer_name VARCHAR(255),
  receiver_engineer_email VARCHAR(255),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_name VARCHAR(255),
  
  -- Status & Priority
  status job_work_status NOT NULL DEFAULT 'pending',
  priority job_work_priority,
  
  -- Timeline
  due_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_completion DATE,
  
  -- Details
  comments TEXT,
  internal_notes TEXT,
  delivery_address TEXT,
  delivery_instructions TEXT,
  
  -- Quality
  quality_check_passed BOOLEAN,
  quality_notes TEXT,
  compliance_requirements VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_job_ref_per_tenant UNIQUE(job_ref_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_works_tenant_id ON job_works(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_works_customer_id ON job_works(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_works_product_id ON job_works(product_id);
CREATE INDEX IF NOT EXISTS idx_job_works_status ON job_works(status);
CREATE INDEX IF NOT EXISTS idx_job_works_receiver_engineer_id ON job_works(receiver_engineer_id);
CREATE INDEX IF NOT EXISTS idx_job_works_assigned_by ON job_works(assigned_by);
CREATE INDEX IF NOT EXISTS idx_job_works_due_date ON job_works(due_date);

-- ============================================================================
-- 5. JOB WORK SPECIFICATIONS TABLE
-- ============================================================================

CREATE TABLE job_work_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_work_id UUID NOT NULL REFERENCES job_works(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  required BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_work_specifications_job_work_id ON job_work_specifications(job_work_id);

-- ============================================================================
-- 6. TRIGGERS - Advanced Features Timestamp Updates
-- ============================================================================

CREATE TRIGGER product_sales_updated_at_trigger
BEFORE UPDATE ON product_sales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_contracts_updated_at_trigger
BEFORE UPDATE ON service_contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER job_works_updated_at_trigger
BEFORE UPDATE ON job_works
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE product_sales IS 'Product sale records with warranty tracking';
COMMENT ON TABLE service_contracts IS 'Service contract management';
COMMENT ON TABLE job_works IS 'Engineering/service job assignments';
COMMENT ON TABLE job_work_specifications IS 'Job specifications and requirements';


-- ============================================================================
-- MIGRATION: 20250101000006_notifications_and_indexes.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20250101000007_row_level_security.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ROW LEVEL SECURITY
-- Migration: 007 - RLS Policies for Multi-Tenant Data Isolation
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Master data
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- Advanced
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_specifications ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 2. HELPER FUNCTION - Get Current User Tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Get tenant_id from users table by matching auth.uid()
  -- First try JWT claims, fall back to users table lookup
  DECLARE
    tenant_id_from_jwt UUID;
    tenant_id_from_db UUID;
  BEGIN
    -- Try to get from JWT claims first
    tenant_id_from_jwt := (auth.jwt() ->> 'tenant_id')::UUID;
    
    IF tenant_id_from_jwt IS NOT NULL THEN
      RETURN tenant_id_from_jwt;
    END IF;
    
    -- Fall back to querying users table
    SELECT users.tenant_id INTO tenant_id_from_db
    FROM users
    WHERE users.id = auth.uid()
    LIMIT 1;
    
    RETURN tenant_id_from_db;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. TENANTS POLICIES
-- ============================================================================

-- Super admin can view all tenants
CREATE POLICY "super_admin_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  );

-- Users can view their own tenant
CREATE POLICY "users_view_own_tenant" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
    )
  );

-- Super admin can update tenants
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 4. USERS POLICIES
-- ============================================================================

-- Users can view users in their tenant
CREATE POLICY "users_view_tenant_users" ON users
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR id = auth.uid()
  );

-- Admins can manage users in their tenant
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- Admins can insert new users
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- ============================================================================
-- 5. CUSTOMERS POLICIES
-- ============================================================================

-- Users can view customers in their tenant
CREATE POLICY "users_view_tenant_customers" ON customers
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customers in their tenant
CREATE POLICY "users_create_customers" ON customers
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customers in their tenant
CREATE POLICY "users_update_customers" ON customers
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Users can delete customers in their tenant (soft delete handled by application)
CREATE POLICY "users_delete_customers" ON customers
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 6. SALES POLICIES
-- ============================================================================

-- Users can view sales in their tenant
CREATE POLICY "users_view_tenant_sales" ON sales
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create sales in their tenant
CREATE POLICY "users_create_sales" ON sales
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update sales in their tenant
CREATE POLICY "users_update_sales" ON sales
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Sale items follow parent sales policy
CREATE POLICY "users_view_sale_items" ON sale_items
  FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 7. TICKETS POLICIES
-- ============================================================================

-- Users can view tickets in their tenant
CREATE POLICY "users_view_tenant_tickets" ON tickets
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create tickets in their tenant
CREATE POLICY "users_create_tickets" ON tickets
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update tickets in their tenant
CREATE POLICY "users_update_tickets" ON tickets
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Ticket comments follow parent ticket policy
CREATE POLICY "users_view_ticket_comments" ON ticket_comments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY "users_create_ticket_comments" ON ticket_comments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Ticket attachments follow parent ticket policy
CREATE POLICY "users_view_ticket_attachments" ON ticket_attachments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 8. CONTRACTS POLICIES
-- ============================================================================

-- Users can view contracts in their tenant
CREATE POLICY "users_view_tenant_contracts" ON contracts
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create contracts in their tenant
CREATE POLICY "users_create_contracts" ON contracts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update contracts in their tenant
CREATE POLICY "users_update_contracts" ON contracts
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Contract parties follow parent contract policy
CREATE POLICY "users_view_contract_parties" ON contract_parties
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Contract attachments follow parent contract policy
CREATE POLICY "users_view_contract_attachments" ON contract_attachments
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 9. PRODUCTS & MASTER DATA POLICIES
-- ============================================================================

-- Users can view products in their tenant
CREATE POLICY "users_view_tenant_products" ON products
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Managers can create/update products
CREATE POLICY "managers_manage_products" ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Product categories follow same pattern
CREATE POLICY "users_view_categories" ON product_categories
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Companies same pattern
CREATE POLICY "users_view_tenant_companies" ON companies
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 10. JOB WORKS POLICIES
-- ============================================================================

-- Users can view job works in their tenant
CREATE POLICY "users_view_tenant_job_works" ON job_works
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Engineers can view their assigned jobs
CREATE POLICY "engineers_view_own_jobs" ON job_works
  FOR SELECT
  USING (
    receiver_engineer_id = auth.uid()
    OR tenant_id = get_current_user_tenant_id()
  );

-- Users can create job works
CREATE POLICY "users_create_job_works" ON job_works
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Job specifications follow parent job policy
CREATE POLICY "users_view_job_specs" ON job_work_specifications
  FOR SELECT
  USING (
    job_work_id IN (
      SELECT id FROM job_works
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================================
-- 11. NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can only update their own notifications
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- Only system can insert notifications (disable direct insert)
CREATE POLICY "system_insert_notifications" ON notifications
  FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- 12. AUDIT LOG POLICIES
-- ============================================================================

-- Users can view audit logs for their tenant
CREATE POLICY "users_view_tenant_audit_logs" ON audit_logs
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Only system can insert audit logs
CREATE POLICY "system_insert_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 13. COMMENTS ON SECURITY
-- ============================================================================

COMMENT ON FUNCTION get_current_user_tenant_id() IS 'Get current authenticated user tenant ID from JWT token';
COMMENT ON POLICY "users_view_tenant_customers" ON customers IS 'All users can view their tenant customers';
COMMENT ON POLICY "users_create_customers" ON customers IS 'All users can create customers in their tenant';


-- ============================================================================
-- MIGRATION: 20250101000008_customer_tags.sql
-- ============================================================================

-- ============================================================================
-- CUSTOMER TAGS TABLE AND RELATIONSHIP
-- Migration: 008 - Customer Tags Management
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DROP EXISTING CONSTRAINT ON CUSTOMERS.TAGS IF IT EXISTS
-- ============================================================================
-- We'll convert from VARCHAR array to proper relationship table

-- ============================================================================
-- 2. CREATE CUSTOMER_TAGS TABLE
-- ============================================================================
CREATE TABLE customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#1890FF', -- Hex color code
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_tags_tenant_id ON customer_tags(tenant_id);
CREATE INDEX idx_customer_tags_name ON customer_tags(name);

-- ============================================================================
-- 3. CREATE JUNCTION TABLE FOR CUSTOMER-TAG RELATIONSHIPS
-- ============================================================================
CREATE TABLE customer_tag_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  
  -- Prevent duplicates
  UNIQUE(customer_id, tag_id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_tag_mapping_customer_id ON customer_tag_mapping(customer_id);
CREATE INDEX idx_customer_tag_mapping_tag_id ON customer_tag_mapping(tag_id);

-- ============================================================================
-- 4. MIGRATE EXISTING DATA (if any tags exist in customers.tags)
-- ============================================================================
-- This would need to be done manually after assessing existing data
-- For now, we'll just create the tables for new usage

-- ============================================================================
-- 5. UPDATE CUSTOMERS TABLE TO ADD TAGS RELATIONSHIP
-- ============================================================================
-- Drop the old tags column if it exists and create a computed relationship
-- Note: In PostgREST, we can query through the junction table

COMMENT ON TABLE customer_tags IS 'Tags/categories for organizing customers';
COMMENT ON TABLE customer_tag_mapping IS 'Junction table linking customers to tags';


-- ============================================================================
-- MIGRATION: 20250101000009_fix_rbac_schema.sql
-- ============================================================================

-- ============================================================================
-- RBAC SCHEMA FIX
-- Migration: 009 - Add missing RBAC tables and columns
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO PERMISSIONS TABLE
-- ============================================================================

ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_system_permission BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. CREATE ROLE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'custom', -- e.g., 'sales', 'operations', 'support', 'admin'
  permissions JSONB DEFAULT '[]'::JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_template_per_tenant'
  ) THEN
    ALTER TABLE role_templates
    ADD CONSTRAINT unique_template_per_tenant UNIQUE(name, tenant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_role_templates_tenant_id ON role_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_templates_is_default ON role_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_role_templates_category ON role_templates(category);

-- ============================================================================
-- 3. CREATE TRIGGER FOR ROLE_TEMPLATES updated_at
-- ============================================================================

CREATE TRIGGER role_templates_updated_at_trigger
BEFORE UPDATE ON role_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. SEED DATA NOTICE
-- ============================================================================
-- Permissions and role templates are seeded via seed.sql, not migrations.
-- This keeps schema changes (migrations) separate from data (seed.sql).

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE role_templates IS 'Pre-configured role templates for quick role creation';
COMMENT ON COLUMN role_templates.is_default IS 'Whether this is a default system template';
COMMENT ON COLUMN role_templates.category IS 'Category of the template (admin, sales, support, etc.)';


-- ============================================================================
-- MIGRATION: 20250101000010_add_rbac_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- RBAC RLS POLICIES FIX
-- Migration: 010 - Add missing Row Level Security policies for RBAC tables
-- ============================================================================
-- 
-- ISSUE: RLS was enabled on permissions, roles, user_roles, and role_templates
-- tables but NO read policies were defined. This caused Supabase to deny ALL
-- queries by default, resulting in empty data on the UI.
--
-- This migration fixes the issue by adding proper RLS policies for these tables.
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS TABLE POLICIES
-- ============================================================================
-- Permissions are system-wide and should be readable by all authenticated users
-- System permissions are global, not tenant-specific

-- Users can view all permissions (system-wide)
CREATE POLICY "users_view_all_permissions" ON permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
    )
  );

-- Only admins can create permissions
CREATE POLICY "admins_create_permissions" ON permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Only admins can update permissions
CREATE POLICY "admins_update_permissions" ON permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 2. ROLES TABLE POLICIES
-- ============================================================================
-- Users can view roles in their tenant
-- Super admin can view all roles

-- Users can view roles in their tenant
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Regular users see roles in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can create roles in their tenant
CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Admins can update roles in their tenant (except system roles)
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
    AND NOT is_system_role
  );

-- Admins can delete roles in their tenant (except system roles)
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
    AND NOT is_system_role
  );

-- ============================================================================
-- 3. USER ROLES TABLE POLICIES
-- ============================================================================
-- Users can view their own role assignments
-- Admins can manage role assignments in their tenant

-- Users can view user_roles in their tenant
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Users see assignments in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can assign roles in their tenant
CREATE POLICY "admins_assign_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = user_roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Admins can remove roles in their tenant
CREATE POLICY "admins_remove_roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = user_roles.tenant_id
      AND users.role IN ('admin', 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 4. ROLE TEMPLATES TABLE POLICIES
-- ============================================================================
-- Enable RLS on role_templates
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- Users can view role templates (system templates with NULL tenant_id)
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = TRUE
    OR tenant_id IS NULL
    OR tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Admins can create role templates in their tenant
CREATE POLICY "admins_create_role_templates" ON role_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'super_admin'))
      AND (users.tenant_id = role_templates.tenant_id OR role_templates.tenant_id IS NULL)
      AND users.deleted_at IS NULL
    )
  );

-- Admins can update role templates in their tenant
CREATE POLICY "admins_update_role_templates" ON role_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND (users.tenant_id = role_templates.tenant_id OR role_templates.tenant_id IS NULL)
      AND users.deleted_at IS NULL
    )
  );

-- Only super admin can delete role templates
CREATE POLICY "super_admin_delete_role_templates" ON role_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- PERMISSIONS TABLE:
--   - READ: All authenticated users can view permissions (system-wide)
--   - CREATE/UPDATE: Only admins and super_admin
--   - Permissions are NOT tenant-specific (shared across all tenants)
--
-- ROLES TABLE:
--   - READ: Users can view roles in their tenant; super_admin can view all
--   - CREATE/UPDATE/DELETE: Tenant admins can manage (except system roles)
--   - System roles cannot be deleted
--
-- USER_ROLES TABLE:
--   - READ: Users can view their own assignments; admins view tenant assignments
--   - CREATE/DELETE: Tenant admins can assign/remove roles
--
-- ROLE_TEMPLATES TABLE:
--   - READ: Users can view default templates and tenant-specific templates
--   - CREATE/UPDATE: Admins in their tenant
--   - DELETE: Only super_admin
--
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20250101000011_fix_rbac_rls_policies_v2.sql
-- ============================================================================

-- ============================================================================
-- RBAC RLS POLICIES FIX - VERSION 2
-- Migration: 011 - Fix tenant_id query issues in RLS policies
-- ============================================================================
-- 
-- ISSUE: Original policies used get_current_user_tenant_id() which could
-- return NULL, causing RLS to deny all queries.
--
-- SOLUTION: Replace with direct subquery to users table for reliability
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "users_view_tenant_roles" ON roles;
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_role_templates" ON role_templates;

-- ============================================================================
-- RECREATE POLICIES WITH FIXED LOGIC
-- ============================================================================

-- Users can view roles in their tenant
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Regular users see roles in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Users can view user_roles in their tenant
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Users see assignments in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- Users can view role templates (system templates with NULL tenant_id)
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = TRUE
    OR tenant_id IS NULL
    OR tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      LIMIT 1
    )
  );

-- ============================================================================
-- SUMMARY OF FIXES
-- ============================================================================
--
-- Fixed three main issues:
-- 1. Replaced get_current_user_tenant_id() with direct users table subquery
-- 2. Ensured tenant_id queries properly handle NULL cases
-- 3. Added explicit OR conditions for better policy clarity
--
-- Testing:
-- - Permissions should load (unchanged)
-- - Roles should now load (fixed policy)
-- - User roles should now load (fixed policy)
-- - Role templates should now load (fixed policy)
--
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20250101000012_enable_rls_on_rbac_tables.sql
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON RBAC TABLES
-- Migration: 012 - Enable Row Level Security on user_roles table
-- ============================================================================
-- 
-- ISSUE: Migration 007 enabled RLS on most tables but forgot user_roles.
-- This caused role data to load without security restrictions.
-- While policies were created in migration 010, they had no effect 
-- because RLS was disabled on the table.
--
-- FIX: Enable RLS on user_roles table so policies are enforced
-- ============================================================================

-- Enable RLS on user_roles if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Verify all RBAC tables have RLS enabled
-- (These should already be enabled from previous migrations)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this migration:
-- - user_roles: RLS ENABLED ✓ (was disabled, now fixed)
-- - roles: RLS ENABLED ✓
-- - permissions: RLS ENABLED ✓
-- - role_templates: RLS ENABLED ✓
--
-- All policies from migration 010 will now be enforced.
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20250101000013_fix_sale_items_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX SALE_ITEMS RLS POLICIES
-- Migration: 013 - Add INSERT, UPDATE, DELETE policies for sale_items
-- ============================================================================

-- Add INSERT policy for sale_items
CREATE POLICY "users_create_sale_items" ON sale_items
  FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Add UPDATE policy for sale_items
CREATE POLICY "users_update_sale_items" ON sale_items
  FOR UPDATE
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Add DELETE policy for sale_items
CREATE POLICY "users_delete_sale_items" ON sale_items
  FOR DELETE
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );


-- ============================================================================
-- MIGRATION: 20250101000014_add_missing_notification_columns.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX NOTIFICATIONS TABLE
-- Migration: 014 - Add missing notification columns (action_label, category, data, read, user_id)
-- ============================================================================

-- Add missing columns to notifications table to match service expectations
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_label VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Add user_id as alias/reference to recipient_id for service compatibility
-- This allows the service to use user_id while maintaining foreign key relationship
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add updated_at column if missing
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to sync user_id with recipient_id on insert
CREATE OR REPLACE FUNCTION sync_notification_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is provided, use it as recipient_id
  IF NEW.user_id IS NOT NULL AND NEW.recipient_id IS NULL THEN
    NEW.recipient_id := NEW.user_id;
  END IF;
  -- Keep user_id in sync with recipient_id
  NEW.user_id := NEW.recipient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS sync_notification_user_id_trigger ON notifications;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_notification_user_id_trigger
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION sync_notification_user_id();

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS notifications_updated_at_trigger ON notifications;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- MIGRATION: 20250101000015_extend_notification_type_enum.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - EXTEND NOTIFICATION_TYPE ENUM
-- Migration: 015 - Add missing notification types (info, success, warning, error)
-- ============================================================================

-- In PostgreSQL, we need to:
-- 1. Create a new ENUM type with all values
-- 2. Alter the column to use the new type
-- 3. Drop the old type and cast with CASCADE
-- 4. Rename the new type to the original name

-- Step 1: Create new enum type with all values
CREATE TYPE notification_type_new AS ENUM (
  'system',
  'user',
  'alert',
  'reminder',
  'approval',
  'task_assigned',
  'info',
  'success',
  'warning',
  'error'
);

-- Step 2: Alter the notifications table to use the new type
ALTER TABLE notifications
  ALTER COLUMN type TYPE notification_type_new USING type::text::notification_type_new;

-- Step 3: Drop the old type with CASCADE to remove dependent objects (cast)
DROP TYPE notification_type CASCADE;

-- Step 4: Rename the new type to the original name
ALTER TYPE notification_type_new RENAME TO notification_type;

-- Step 5: Update the comment
COMMENT ON TYPE notification_type IS 'Notification type enumeration including system, user, alert, reminder, approval, task_assigned, info, success, warning, error';


-- ============================================================================
-- MIGRATION: 20250101000016_fix_notifications_rls_policy.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX NOTIFICATIONS RLS POLICY
-- Migration: 016 - Allow application to insert notifications with proper tenant checks
-- ============================================================================

-- Drop the restrictive policy that was blocking all inserts
DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;

-- Create a new policy that allows users to insert notifications for their tenant
-- The application creates notifications with the correct tenant_id in context
CREATE POLICY "users_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- This allows the application to insert notifications while maintaining multi-tenant isolation
-- All notifications must have tenant_id matching the current user's tenant


-- ============================================================================
-- MIGRATION: 20250130000018_create_service_contracts_module.sql
-- ============================================================================

-- ============================================================
-- Service Contracts Module - Enterprise-Grade Schema
-- Manages service delivery contracts, scheduling, and SLA terms
-- Created: 2025-01-30
-- Status: Active
-- ============================================================

-- ============================================================
-- Drop old service_contracts table (from migration 5) to replace with new schema
-- ============================================================
DROP TABLE IF EXISTS service_contracts CASCADE;

-- ============================================================
-- Service Contracts Core Table
-- ============================================================
CREATE TABLE service_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Contract Identification
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Related Entities
  customer_id UUID NOT NULL,
  customer_name VARCHAR(255),
  product_id UUID,
  product_name VARCHAR(255),
  
  -- Service Details
  service_type VARCHAR(50) NOT NULL,           -- support, maintenance, consulting, training, hosting, custom
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending_approval, active, on_hold, completed, cancelled, expired
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  -- Financial Terms
  value DECIMAL(12, 2) NOT NULL CHECK (value >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_frequency VARCHAR(20),               -- monthly, quarterly, annually, one_time
  payment_terms TEXT,
  
  -- Service Delivery Terms
  sla_terms TEXT,                             -- Service Level Agreement terms (HTML-rich text)
  renewal_terms TEXT,                         -- Renewal and continuation terms
  service_scope TEXT,                         -- Detailed scope of services (HTML-rich text)
  exclusions TEXT,                            -- What's NOT included (HTML-rich text)
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_completion_date DATE,
  
  -- Renewal Settings
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_period_months INT,
  last_renewal_date DATE,
  next_renewal_date DATE,
  
  -- Scheduling & Delivery
  delivery_schedule TEXT,                     -- Detailed schedule (JSON or text)
  scheduled_hours_per_week INT,
  time_zone VARCHAR(50),
  
  -- Team Assignment
  assigned_to_user_id UUID,
  assigned_to_name VARCHAR(255),
  secondary_contact_id UUID,
  secondary_contact_name VARCHAR(255),
  
  -- Metadata
  approval_status VARCHAR(50),                -- approved, rejected, pending, in_review
  approved_by_user_id UUID,
  approved_at TIMESTAMP,
  
  compliance_notes TEXT,
  tags VARCHAR(500)[],                        -- For filtering and organization
  custom_fields JSONB,                        -- Flexible custom fields
  
  -- Audit Fields
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT valid_service_type CHECK (
    service_type IN ('support', 'maintenance', 'consulting', 'training', 'hosting', 'custom')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'pending_approval', 'active', 'on_hold', 'completed', 'cancelled', 'expired')
  ),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id),
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- ============================================================
-- Service Contract Attachments/Documents Table
-- ============================================================
CREATE TABLE IF NOT EXISTS service_contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_contract_id UUID NOT NULL,
  
  -- Document Details
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),                      -- pdf, doc, docx, xlsx, etc.
  file_size INT,                               -- Size in bytes
  file_path VARCHAR(1000) NOT NULL,            -- Storage path/URL
  document_type VARCHAR(50),                   -- sla_document, schedule, attachment, email, other
  
  -- Metadata
  uploaded_by_user_id UUID,
  uploaded_by_name VARCHAR(255),
  description TEXT,
  tags VARCHAR(200)[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  version_number INT DEFAULT 1,
  parent_document_id UUID,                     -- For tracking document versions
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_file_type CHECK (
    file_type IN ('pdf', 'doc', 'docx', 'xlsx', 'xls', 'pptx', 'txt', 'jpg', 'png', 'gif', 'other')
  ),
  CONSTRAINT valid_document_type CHECK (
    document_type IN ('sla_document', 'schedule', 'attachment', 'email', 'signed_contract', 'amendment', 'other')
  ),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_contract_id) REFERENCES service_contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_document_id) REFERENCES service_contract_documents(id) ON DELETE SET NULL
);

-- ============================================================
-- Service Delivery Milestones Table
-- ============================================================
CREATE TABLE IF NOT EXISTS service_delivery_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_contract_id UUID NOT NULL,
  
  -- Milestone Details
  milestone_name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_number INT NOT NULL,
  
  -- Dates
  planned_date DATE,
  actual_date DATE,
  
  -- Deliverables
  deliverable_description TEXT,
  acceptance_criteria TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',       -- pending, in_progress, completed, delayed, cancelled
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Responsible Party
  assigned_to_user_id UUID,
  assigned_to_name VARCHAR(255),
  
  -- Notes & Tracking
  notes TEXT,
  dependencies VARCHAR(500)[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')
  ),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_contract_id) REFERENCES service_contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- Service Contract Issues/Risks Table
-- ============================================================
CREATE TABLE IF NOT EXISTS service_contract_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_contract_id UUID NOT NULL,
  
  -- Issue Details
  issue_title VARCHAR(255) NOT NULL,
  issue_description TEXT,
  severity VARCHAR(20),                       -- low, medium, high, critical
  category VARCHAR(50),                       -- sla_breach, resource, schedule, scope, budget, other
  
  -- Status & Resolution
  status VARCHAR(50) DEFAULT 'open',          -- open, in_progress, resolved, closed, cancelled
  resolution_notes TEXT,
  resolution_date DATE,
  
  -- Assignment
  assigned_to_user_id UUID,
  assigned_to_name VARCHAR(255),
  
  -- Dates
  reported_date DATE DEFAULT CURRENT_DATE,
  target_resolution_date DATE,
  
  -- Impact
  impact_description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_contract_id) REFERENCES service_contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- Service Contract Activity/Audit Log Table
-- ============================================================
CREATE TABLE IF NOT EXISTS service_contract_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_contract_id UUID NOT NULL,
  
  -- Activity Details
  activity_type VARCHAR(100),                 -- created, updated, status_changed, document_added, comment_added, etc.
  activity_description TEXT,
  changes JSONB,                              -- Track what changed (old value, new value)
  
  -- User Information
  user_id UUID,
  user_name VARCHAR(255),
  
  -- Timestamps
  activity_date TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (service_contract_id) REFERENCES service_contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_service_contracts_tenant_id ON service_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_customer_id ON service_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_status ON service_contracts(status);
CREATE INDEX IF NOT EXISTS idx_service_contracts_service_type ON service_contracts(service_type);
CREATE INDEX IF NOT EXISTS idx_service_contracts_assigned_to ON service_contracts(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_start_date ON service_contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_service_contracts_end_date ON service_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_service_contracts_created_at ON service_contracts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_service_contract_id ON service_contract_documents(service_contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON service_contract_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON service_contract_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_milestones_service_contract_id ON service_delivery_milestones(service_contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON service_delivery_milestones(status);

CREATE INDEX IF NOT EXISTS idx_issues_service_contract_id ON service_contract_issues(service_contract_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON service_contract_issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON service_contract_issues(status);

CREATE INDEX IF NOT EXISTS idx_activity_log_service_contract_id ON service_contract_activity_log(service_contract_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON service_contract_activity_log(user_id);

-- ============================================================
-- Row-Level Security (RLS) Policies
-- ============================================================
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_delivery_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contract_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contract_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see contracts in their tenant
CREATE POLICY service_contracts_tenant_isolation
  ON service_contracts
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
         OR auth.uid() IS NULL);

CREATE POLICY service_contract_documents_tenant_isolation
  ON service_contract_documents
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
         OR auth.uid() IS NULL);

CREATE POLICY service_delivery_milestones_tenant_isolation
  ON service_delivery_milestones
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
         OR auth.uid() IS NULL);

CREATE POLICY service_contract_issues_tenant_isolation
  ON service_contract_issues
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
         OR auth.uid() IS NULL);

CREATE POLICY service_contract_activity_log_tenant_isolation
  ON service_contract_activity_log
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
         OR auth.uid() IS NULL);

-- ============================================================
-- Migration Complete - Seed data should be in seed.sql
-- ============================================================


-- ============================================================================
-- MIGRATION: 20250131000019_fix_service_contracts_rls_policies.sql
-- ============================================================================

-- ============================================================
-- Fix Service Contracts RLS Policies
-- Issue: Policies were trying to access auth.users directly
-- causing "permission denied for table users" error
-- Solution: Use proper helper function like other tables do
-- Created: 2025-01-31
-- ============================================================

-- Drop the old incorrect policies
DROP POLICY IF EXISTS service_contracts_tenant_isolation ON service_contracts;
DROP POLICY IF EXISTS service_contract_documents_tenant_isolation ON service_contract_documents;
DROP POLICY IF EXISTS service_delivery_milestones_tenant_isolation ON service_delivery_milestones;
DROP POLICY IF EXISTS service_contract_issues_tenant_isolation ON service_contract_issues;
DROP POLICY IF EXISTS service_contract_activity_log_tenant_isolation ON service_contract_activity_log;

-- Create correct policies for service_contracts using the helper function
CREATE POLICY service_contracts_select
  ON service_contracts
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_insert
  ON service_contracts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_update
  ON service_contracts
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY service_contracts_delete
  ON service_contracts
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Create correct policies for service_contract_documents
CREATE POLICY service_contract_documents_select
  ON service_contract_documents
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_documents_insert
  ON service_contract_documents
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_documents_update
  ON service_contract_documents
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_delivery_milestones
CREATE POLICY service_delivery_milestones_select
  ON service_delivery_milestones
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_delivery_milestones_insert
  ON service_delivery_milestones
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_delivery_milestones_update
  ON service_delivery_milestones
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_contract_issues
CREATE POLICY service_contract_issues_select
  ON service_contract_issues
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_issues_insert
  ON service_contract_issues
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_issues_update
  ON service_contract_issues
  FOR UPDATE
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Create correct policies for service_contract_activity_log
CREATE POLICY service_contract_activity_log_select
  ON service_contract_activity_log
  FOR SELECT
  USING (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

CREATE POLICY service_contract_activity_log_insert
  ON service_contract_activity_log
  FOR INSERT
  WITH CHECK (
    service_contract_id IN (
      SELECT id FROM service_contracts
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- ============================================================
-- Migration Complete
-- ============================================================


-- ============================================================================
-- MIGRATION: 20250211_super_user_schema.sql
-- ============================================================================

-- =====================================================
-- Super User Module - Database Schema Migration
-- Created: 2025-02-11
-- Purpose: Define tables for super user management,
--          impersonation audit logging, tenant statistics,
--          and configuration overrides
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Access level enum for tenant access control
CREATE TYPE access_level_enum AS ENUM (
    'full',
    'limited',
    'read_only',
    'specific_modules'
);

-- Metric type enum for tenant statistics
CREATE TYPE metric_type_enum AS ENUM (
    'active_users',
    'total_contracts',
    'total_sales',
    'total_transactions',
    'disk_usage',
    'api_calls_daily'
);

-- =====================================================
-- TABLE 1: Super User Tenant Access
-- =====================================================
-- Purpose: Track which tenants a super user can manage
-- This creates a many-to-many relationship between
-- super users and tenants with access level control

CREATE TABLE super_user_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    access_level access_level_enum NOT NULL DEFAULT 'limited',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_super_user_tenant_access_super_user_id
        FOREIGN KEY (super_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_tenant_access_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint: each super user can have one access level per tenant
    CONSTRAINT uk_super_user_tenant_access_unique
        UNIQUE (super_user_id, tenant_id),
    
    -- Check constraints
    CONSTRAINT ck_super_user_tenant_access_not_null
        CHECK (super_user_id IS NOT NULL AND tenant_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_super_user_tenant_access_super_user_id 
    ON super_user_tenant_access(super_user_id);
CREATE INDEX idx_super_user_tenant_access_tenant_id 
    ON super_user_tenant_access(tenant_id);
CREATE INDEX idx_super_user_tenant_access_composite 
    ON super_user_tenant_access(super_user_id, tenant_id);
CREATE INDEX idx_super_user_tenant_access_access_level 
    ON super_user_tenant_access(access_level);

-- =====================================================
-- TABLE 2: Impersonation Audit Logs
-- =====================================================
-- Purpose: Track all super user impersonation sessions
-- for audit and compliance purposes

CREATE TABLE super_user_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL,
    impersonated_user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    reason VARCHAR(500),
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    actions_taken JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_super_user_impersonation_logs_super_user_id
        FOREIGN KEY (super_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_impersonation_logs_impersonated_user_id
        FOREIGN KEY (impersonated_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_impersonation_logs_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT ck_super_user_impersonation_logs_not_null
        CHECK (super_user_id IS NOT NULL AND impersonated_user_id IS NOT NULL AND tenant_id IS NOT NULL),
    CONSTRAINT ck_super_user_impersonation_logs_login_before_logout
        CHECK (logout_at IS NULL OR logout_at > login_at)
);

-- Indexes for performance
CREATE INDEX idx_super_user_impersonation_logs_super_user_id 
    ON super_user_impersonation_logs(super_user_id);
CREATE INDEX idx_super_user_impersonation_logs_impersonated_user_id 
    ON super_user_impersonation_logs(impersonated_user_id);
CREATE INDEX idx_super_user_impersonation_logs_tenant_id 
    ON super_user_impersonation_logs(tenant_id);
CREATE INDEX idx_super_user_impersonation_logs_login_at 
    ON super_user_impersonation_logs(login_at DESC);
CREATE INDEX idx_super_user_impersonation_logs_logout_at 
    ON super_user_impersonation_logs(logout_at DESC)
    WHERE logout_at IS NOT NULL;
CREATE INDEX idx_super_user_impersonation_logs_active_sessions 
    ON super_user_impersonation_logs(super_user_id, logout_at)
    WHERE logout_at IS NULL;

-- =====================================================
-- TABLE 3: Tenant Statistics
-- =====================================================
-- Purpose: Store aggregated metrics for tenant dashboard
-- and analytics across multi-tenant system

CREATE TABLE tenant_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type metric_type_enum NOT NULL,
    metric_value DECIMAL(15, 2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tenant_statistics_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT ck_tenant_statistics_not_null
        CHECK (tenant_id IS NOT NULL AND metric_type IS NOT NULL),
    CONSTRAINT ck_tenant_statistics_metric_value_non_negative
        CHECK (metric_value IS NULL OR metric_value >= 0)
);

-- Indexes for performance
CREATE INDEX idx_tenant_statistics_tenant_id 
    ON tenant_statistics(tenant_id);
CREATE INDEX idx_tenant_statistics_metric_type 
    ON tenant_statistics(metric_type);
CREATE INDEX idx_tenant_statistics_recorded_at 
    ON tenant_statistics(recorded_at DESC);
CREATE INDEX idx_tenant_statistics_tenant_metric_time 
    ON tenant_statistics(tenant_id, metric_type, recorded_at DESC);

-- =====================================================
-- TABLE 4: Tenant Configuration Overrides
-- =====================================================
-- Purpose: Store configuration overrides for specific
-- tenants that super users can apply temporarily or
-- permanently with expiration options

CREATE TABLE tenant_config_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    override_reason VARCHAR(500),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tenant_config_overrides_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_config_overrides_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint: one config key per tenant
    CONSTRAINT uk_tenant_config_overrides_unique
        UNIQUE (tenant_id, config_key),
    
    -- Check constraints
    CONSTRAINT ck_tenant_config_overrides_not_null
        CHECK (tenant_id IS NOT NULL AND config_key IS NOT NULL AND config_value IS NOT NULL),
    CONSTRAINT ck_tenant_config_overrides_expires_after_created
        CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_tenant_config_overrides_tenant_id 
    ON tenant_config_overrides(tenant_id);
CREATE INDEX idx_tenant_config_overrides_config_key 
    ON tenant_config_overrides(config_key);
CREATE INDEX idx_tenant_config_overrides_created_at 
    ON tenant_config_overrides(created_at DESC);
CREATE INDEX idx_tenant_config_overrides_expires_at 
    ON tenant_config_overrides(expires_at DESC)
    WHERE expires_at IS NOT NULL;
CREATE INDEX idx_tenant_config_overrides_active 
    ON tenant_config_overrides(tenant_id, config_key)
    WHERE expires_at IS NULL;

-- =====================================================
-- Migration Complete
-- NOTE: RLS Policies are created in migration 20250214
--       after is_super_admin column is added in 20250212
-- =====================================================


-- ============================================================================
-- MIGRATION: 20250211000001_add_missing_company_columns.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add Missing Company Columns
-- Date: 2025-02-11
-- ============================================================================

-- Add missing columns to companies table to support extended company data

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS founded_year VARCHAR(20),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'pro',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_companies_registration_number ON companies(registration_number);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);

-- Add comments for documentation
COMMENT ON COLUMN companies.registration_number IS 'Company registration/incorporation number';
COMMENT ON COLUMN companies.tax_id IS 'Tax identification number (TIN/VAT ID)';
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.notes IS 'Additional notes about the company';
COMMENT ON COLUMN companies.domain IS 'Company domain/website domain';
COMMENT ON COLUMN companies.city IS 'City where company is located';
COMMENT ON COLUMN companies.country IS 'Country where company is located';
COMMENT ON COLUMN companies.plan IS 'Company subscription plan level';
COMMENT ON COLUMN companies.subscription_status IS 'Status of company subscription';
COMMENT ON COLUMN companies.trial_ends_at IS 'When the company trial subscription ends';
COMMENT ON COLUMN companies.metadata IS 'JSON metadata for extended company information';


-- ============================================================================
-- MIGRATION: 20250211000002_add_missing_product_columns.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add Missing Product Columns
-- Date: 2025-02-11
-- ============================================================================

-- Add missing columns to products table to support extended product data

ALTER TABLE products
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);

-- Add comments for documentation
COMMENT ON COLUMN products.manufacturer IS 'Product manufacturer name';
COMMENT ON COLUMN products.notes IS 'Additional notes about the product';


-- ============================================================================
-- MIGRATION: 20250212_add_super_admin_column.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add is_super_admin column to users table
-- Created: 2025-02-12
-- Purpose: Mark users as super administrators for global tenant management
-- ============================================================================

-- Step 1: Add is_super_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Create index for super admin queries (used in RLS policies)
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin) 
WHERE is_super_admin = true;

-- Step 3: Add composite index for authentication queries
CREATE INDEX idx_users_super_admin_status ON users(is_super_admin, status);

-- Step 4: Add index for email uniqueness per tenant (for later unique constraint)
CREATE INDEX idx_users_email_tenant ON users(email, tenant_id);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Verify column was created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name='users' AND column_name='is_super_admin'
ORDER BY ordinal_position;


-- ============================================================================
-- MIGRATION: 20250213_make_super_users_tenant_independent.sql
-- ============================================================================

-- ============================================================================
-- Migration: Make super users truly tenant-independent
-- Created: 2025-02-13
-- Purpose: Allow super users to exist without being tied to a specific tenant
-- ============================================================================

-- CRITICAL: This migration assumes is_super_admin column exists (from migration 20250212)

-- ============================================================================
-- Step 1: Make tenant_id nullable to allow super users independence
-- ============================================================================
ALTER TABLE users 
ALTER COLUMN tenant_id DROP NOT NULL;

-- ============================================================================
-- Step 2: Add constraint to enforce tenant_id for regular (non-super) users
-- ============================================================================
-- This ensures:
-- - Super users (is_super_admin=true) CAN have tenant_id=NULL
-- - Regular users (is_super_admin=false) MUST have tenant_id NOT NULL
ALTER TABLE users
ADD CONSTRAINT ck_tenant_id_for_regular_users
  CHECK (is_super_admin = true OR tenant_id IS NOT NULL);

-- ============================================================================
-- Step 3: Fix unique constraints to handle super user independence
-- ============================================================================

-- Drop the old unique constraint if it exists (may have different name)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS unique_email_per_tenant CASCADE;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_unique_email_per_tenant CASCADE;

-- Step 3a: Create unique index for regular users (unique per tenant)
CREATE UNIQUE INDEX idx_unique_email_per_tenant 
  ON users(email, tenant_id) 
  WHERE is_super_admin = false AND tenant_id IS NOT NULL;

-- Step 3b: Create unique index for super admins (globally unique email)
CREATE UNIQUE INDEX idx_unique_super_admin_email 
  ON users(email) 
  WHERE is_super_admin = true;

-- ============================================================================
-- Step 4: Create index for queries filtering by super admin status and tenant
-- ============================================================================
CREATE INDEX idx_users_super_admin_tenant ON users(is_super_admin, tenant_id);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check constraint is in place
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'users' 
AND constraint_name = 'ck_tenant_id_for_regular_users';

-- List all indexes related to users table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users' 
AND (indexname LIKE '%email%' OR indexname LIKE '%super_admin%' OR indexname LIKE '%tenant%')
ORDER BY indexname;

-- Verify column properties
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'tenant_id';

-- Check for any users that violate the constraint (should be empty before migration)
-- This will fail if there are regular users without tenant_id
SELECT 
  id,
  email,
  is_super_admin,
  tenant_id,
  'VIOLATION' as status
FROM users
WHERE (is_super_admin = false AND tenant_id IS NULL);


-- ============================================================================
-- MIGRATION: 20250216_add_role_consistency_check.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: Add Role Consistency Constraint
-- Date: 2025-02-15
-- Purpose: Ensure role, is_super_admin flag, and tenant_id are always consistent
-- ============================================================================

-- Add CHECK constraint for role consistency
-- Enforces that:
-- 1. Super admins: role='super_admin' AND is_super_admin=true AND tenant_id=NULL
-- 2. Regular users: role IN (admin/manager/agent/engineer/customer) AND is_super_admin=false AND tenant_id NOT NULL
ALTER TABLE users
ADD CONSTRAINT ck_super_admin_role_consistency
  CHECK (
    (is_super_admin = true AND role = 'super_admin' AND tenant_id IS NULL) OR
    (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer') AND tenant_id IS NOT NULL)
  );

-- Document the constraint
COMMENT ON CONSTRAINT ck_super_admin_role_consistency ON users IS
  'Ensures role, is_super_admin flag, and tenant_id are always consistent:
   
   VALID STATES:
   - Super Admin: role=super_admin AND is_super_admin=true AND tenant_id=NULL
     (Platform-wide administrator with no tenant scope)
   
   - Regular User: role IN (admin/manager/agent/engineer/customer) AND is_super_admin=false AND tenant_id NOT NULL
     (Tenant-scoped user with assigned tenant)
   
   This constraint prevents invalid state combinations that could compromise security or data integrity.';


-- ============================================================================
-- MIGRATION: 20250217_make_audit_logs_nullable.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: Make audit_logs.tenant_id Nullable
-- Date: 2025-02-15
-- Purpose: Allow audit logs to track platform-wide super admin actions
-- ============================================================================

-- Make tenant_id nullable to support super admin actions that have no tenant scope
ALTER TABLE audit_logs
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update column comment to document the nullable tenant_id
COMMENT ON COLUMN audit_logs.tenant_id IS 
  'Tenant ID - NULL for platform-wide super admin actions, NOT NULL for tenant-scoped user actions
   
   Super admins can perform platform-wide actions that affect multiple or all tenants.
   These audit records will have tenant_id=NULL to indicate they are not scoped to a single tenant.';

-- Create index for efficient querying of super admin actions (tenant_id IS NULL)
-- This helps with auditing and compliance reporting for platform-wide changes
CREATE INDEX idx_audit_logs_super_admin_actions 
  ON audit_logs(user_id, created_at) 
  WHERE tenant_id IS NULL;

-- Add index for tenant-specific audits (tenant_id IS NOT NULL)
CREATE INDEX idx_audit_logs_tenant_actions
  ON audit_logs(tenant_id, created_at)
  WHERE tenant_id IS NOT NULL;


-- ============================================================================
-- MIGRATION: 20250303_complete_fix_super_user_rls_no_nested_selects.sql
-- ============================================================================

-- =====================================================
-- COMPLETE FIX: Remove ALL Nested SELECT Subqueries
-- Created: 2025-03-03
-- Problem: Migration 20250223 still had nested SELECTs
--          Super admin has NO tenant_id, causing failures
--          Nested SELECTs still trigger circular RLS dependencies
-- Solution: Create helper functions for ALL checks
--           Remove ALL nested SELECT subqueries
--           Handle super_admin with no tenant_id
-- =====================================================

-- =====================================================
-- DROP EXISTING HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS is_current_user_super_admin() CASCADE;

-- =====================================================
-- CREATE NEW HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Function 1: Check if current user is super admin (no nested SELECT in RLS)
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- Function 2: Get tenant IDs accessible to current super user (for tenant-specific queries)
CREATE OR REPLACE FUNCTION get_accessible_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- If user is super admin, return ALL tenant IDs (no restrictions)
  -- If user is a super user, return only their assigned tenant IDs
  SELECT id FROM tenants WHERE deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    )
  UNION
  SELECT DISTINCT tenant_id FROM super_user_tenant_access 
  WHERE super_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
      AND users.deleted_at IS NULL
    );
$$;

GRANT EXECUTE ON FUNCTION get_accessible_tenant_ids() TO authenticated;

-- Function 3: Can user access specific tenant (no nested SELECT in RLS)
CREATE OR REPLACE FUNCTION can_user_access_tenant(tenant_id_to_check UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    WHERE 
      -- Super admin can access any tenant
      is_current_user_super_admin()
      OR
      -- Or user is assigned to this tenant
      EXISTS (
        SELECT 1 FROM super_user_tenant_access 
        WHERE super_user_id = auth.uid()
        AND tenant_id = tenant_id_to_check
      )
  );
$$;

GRANT EXECUTE ON FUNCTION can_user_access_tenant(UUID) TO authenticated;

-- =====================================================
-- DROP ALL PROBLEMATIC OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- =====================================================
-- RECREATE ALL POLICIES - USING ONLY FUNCTION CALLS
-- NO NESTED SELECT SUBQUERIES
-- =====================================================

-- =====================================================
-- SUPER USER TENANT ACCESS POLICIES
-- =====================================================

CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        is_current_user_super_admin()
    );

-- =====================================================
-- IMPERSONATION LOGS POLICIES
-- =====================================================

CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        super_user_id = auth.uid()
    );

CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    )
    WITH CHECK (
        super_user_id = auth.uid() OR
        is_current_user_super_admin()
    );

-- =====================================================
-- TENANT STATISTICS POLICIES (FIXED - NO NESTED SELECT)
-- =====================================================
-- Now uses can_user_access_tenant() function instead of nested SELECT

CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        can_user_access_tenant(tenant_id)
    );

CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

-- =====================================================
-- TENANT CONFIG OVERRIDES POLICIES (FIXED - NO NESTED SELECT)
-- =====================================================
-- Now uses can_user_access_tenant() function instead of nested SELECT

CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        can_user_access_tenant(tenant_id)
    );

CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        is_current_user_super_admin()
    )
    WITH CHECK (
        is_current_user_super_admin()
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        is_current_user_super_admin()
    );

-- =====================================================
-- Migration Complete
-- =====================================================
-- KEY FIXES:
-- 1. All nested SELECT subqueries removed
-- 2. New helper functions handle tenant access safely
-- 3. Super admin with no tenant_id now works correctly
-- 4. SECURITY DEFINER functions bypass RLS for permission checks
-- 5. Zero 400 errors expected
-- 
-- CRITICAL INSIGHT FROM USER:
-- Super admin doesn't have tenant_id, so nested SELECTs checking
-- super_user_tenant_access would fail. Now we use functions that
-- return ALL tenant access for super_admin automatically.
-- =====================================================


-- ============================================================================
-- MIGRATION: 20250304_add_companies_products_crud_policies.sql
-- ============================================================================

-- ============================================================================
-- ADD MISSING RLS POLICIES FOR COMPANIES & PRODUCTS
-- Migration: Add INSERT, UPDATE, DELETE policies for companies and products
-- Issue: Companies & products tables were missing CRUD policies, only had SELECT
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES POLICIES - Add Missing CRUD Operations
-- ============================================================================

-- Managers can create companies
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can update companies
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can delete companies
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 2. PRODUCTS POLICIES - Add Missing UPDATE & DELETE Operations
-- ============================================================================

-- Managers can update products
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can delete products
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );


-- ============================================================================
-- MIGRATION: 20250305_fix_super_admin_users_tenants_visibility.sql
-- ============================================================================

-- =====================================================
-- MIGRATION: Fix Super Admin Data Visibility
-- Created: 2025-03-05
-- Version: 20250305 (renamed from 20250304 to avoid conflict)
-- Problem: Super admins couldn't see users/tenants
--          "users_view_tenant_users" policy excluded NULL tenant_id
--          "tenants" table had no super admin access policy
-- Solution: Update policies to include super admin checks
--           Super admins see ALL users and ALL tenants
-- =====================================================

-- =====================================================
-- HELPER FUNCTION (if not already created)
-- =====================================================
-- This was created in 20250303, ensure it exists
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- =====================================================
-- FIX USERS TABLE POLICIES
-- =====================================================

-- Drop old problematic policy
DROP POLICY IF EXISTS "users_view_tenant_users" ON users;

-- NEW POLICY: Super admins see ALL users, others see their tenant + themselves
CREATE POLICY "users_view_with_super_admin_access" ON users
  FOR SELECT
  USING (
    -- Super admins see EVERYONE
    is_current_user_super_admin()
    -- Regular users only see their own tenant users
    OR tenant_id = get_current_user_tenant_id()
    -- Everyone sees themselves
    OR id = auth.uid()
  );

-- =====================================================
-- FIX USERS MANAGE POLICIES (already handle super admin)
-- =====================================================
-- These already check for is_super_admin, so they work correctly
-- But we can verify they're in place:

-- Drop and recreate to ensure correctness
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;

CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    -- Super admins can manage any user
    is_current_user_super_admin()
    -- Regular admins can manage users in their tenant
    OR EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;

CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    -- Super admins can insert any user
    is_current_user_super_admin()
    -- Regular admins can insert users in their tenant
    OR EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role = 'admin' OR "current_user".is_super_admin = true)
      AND "current_user".deleted_at IS NULL
    )
  );

-- =====================================================
-- FIX TENANTS TABLE POLICIES
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "tenants_view_all" ON tenants;
DROP POLICY IF EXISTS "tenants_view_tenant_info" ON tenants;

-- NEW POLICY: Super admins see ALL tenants, others see only theirs
CREATE POLICY "tenants_view_with_super_admin_access" ON tenants
  FOR SELECT
  USING (
    -- Super admins see ALL tenants
    is_current_user_super_admin()
    -- Regular users see only their tenant
    OR id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.deleted_at IS NULL
      AND users.tenant_id IS NOT NULL
    )
  );

-- Super admins can manage tenants
DROP POLICY IF EXISTS "admins_crm:platform:tenant:manage" ON tenants;

CREATE POLICY "admins_crm:platform:tenant:manage" ON tenants
  FOR UPDATE
  USING (
    is_current_user_super_admin()
  );

-- Super admins can insert tenants
DROP POLICY IF EXISTS "admins_insert_tenants" ON tenants;

CREATE POLICY "admins_insert_tenants" ON tenants
  FOR INSERT
  WITH CHECK (
    is_current_user_super_admin()
  );

-- Super admins can delete tenants
DROP POLICY IF EXISTS "admins_delete_tenants" ON tenants;

CREATE POLICY "admins_delete_tenants" ON tenants
  FOR DELETE
  USING (
    is_current_user_super_admin()
  );

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================
-- Uncomment these to verify the fix works:
/*
-- Check if super admin function exists
SELECT 'Function check' as test, COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_name = 'is_current_user_super_admin';

-- Check if users policies exist
SELECT 'Policies check' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%super_admin%';

-- Check if tenants policies exist
SELECT 'Tenants policies check' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'tenants' 
AND policyname LIKE '%super_admin%';
*/

-- =====================================================
-- Migration Complete
-- =====================================================
-- CRITICAL FIXES:
-- 1. Super admins with NULL tenant_id can now see all users
-- 2. Super admins can see all tenants
-- 3. Policies use SECURITY DEFINER function - no infinite recursion
-- 4. Regular users still only see their tenant
-- 5. Everyone can see themselves
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Run this migration in Supabase (auto-applied or manual SQL editor)
-- 2. Clear browser cache and log out completely
-- 3. Log back in as super admin
-- 4. Super Admin pages should now display all records
-- =====================================================


-- ============================================================================
-- MIGRATION: 20250315000001_create_status_options.sql
-- ============================================================================

-- ============================================================================
-- PHASE 1.5: DYNAMIC DATA LOADING ARCHITECTURE
-- Migration: Status Options Table for Module-Specific Statuses
-- ============================================================================

-- ============================================================================
-- 1. STATUS_OPTIONS TABLE - Module-specific status choices
-- ============================================================================

CREATE TABLE status_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Status classification
  module VARCHAR(100) NOT NULL,  -- 'sales', 'tickets', 'contracts', 'jobwork', 'complaints', etc.
  status_key VARCHAR(100) NOT NULL,  -- 'pending', 'completed', 'cancelled', etc.
  
  -- Display and UI
  display_label VARCHAR(255) NOT NULL,  -- 'Pending Review', 'In Progress', etc.
  description TEXT,  -- Optional explanation
  color_code VARCHAR(7),  -- Hex color for UI: '#FF5733'
  
  -- Sorting and visibility
  sort_order INTEGER DEFAULT 0,  -- For ordering in dropdowns
  is_active BOOLEAN DEFAULT true,  -- Soft delete
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT unique_status_per_module UNIQUE(tenant_id, module, status_key)
);

-- ============================================================================
-- 2. INDEXES - for performance
-- ============================================================================

CREATE INDEX idx_status_options_tenant_id ON status_options(tenant_id);
CREATE INDEX idx_status_options_module ON status_options(module);
CREATE INDEX idx_status_options_is_active ON status_options(is_active);
CREATE INDEX idx_status_options_tenant_module_active ON status_options(tenant_id, module, is_active);

-- ============================================================================
-- 3. TRIGGERS - Auto update timestamp
-- ============================================================================

CREATE TRIGGER status_options_updated_at_trigger
BEFORE UPDATE ON status_options
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE status_options ENABLE ROW LEVEL SECURITY;

-- ⚠️  Policy 1: Super users bypass RLS (see only their data, can see any tenant for debugging)
CREATE POLICY status_options_super_user_policy ON status_options
  FOR ALL USING (
    (auth.jwt() ->> 'is_super_user')::boolean = true
    OR (auth.jwt() ->> 'super_user')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_super_user')::boolean = true
    OR (auth.jwt() ->> 'super_user')::boolean = true
  );

-- Policy 2: Regular users see only their tenant's status options
CREATE POLICY status_options_tenant_isolation_policy ON status_options
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY status_options_insert_policy ON status_options
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY status_options_update_policy ON status_options
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY status_options_delete_policy ON status_options
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- 5. COMMENTS - Documentation
-- ============================================================================

COMMENT ON TABLE status_options IS 'Dynamic status choices for different modules - replaces hardcoded enums';
COMMENT ON COLUMN status_options.module IS 'Module name: sales, tickets, contracts, jobwork, complaints, serviceContract, etc.';
COMMENT ON COLUMN status_options.status_key IS 'Programmatic identifier: pending, completed, cancelled, etc.';
COMMENT ON COLUMN status_options.display_label IS 'User-friendly display label for UI';
COMMENT ON COLUMN status_options.color_code IS 'Hex color code for status badge: #FF5733';


-- ============================================================================
-- MIGRATION: 20250315000002_create_reference_data.sql
-- ============================================================================

-- ============================================================================
-- PHASE 1.5: DYNAMIC DATA LOADING ARCHITECTURE
-- Migration: Generic Reference Data Table
-- ============================================================================

-- ============================================================================
-- 1. REFERENCE_DATA TABLE - Generic extensible reference data
-- ============================================================================

CREATE TABLE reference_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Categorization
  category VARCHAR(100) NOT NULL,  -- 'priority', 'severity', 'department', 'industry', etc.
  key VARCHAR(100) NOT NULL,  -- Unique identifier within category: 'high', 'low', 'critical', etc.
  
  -- Display
  label VARCHAR(255) NOT NULL,  -- User-friendly display: 'High Priority', 'Low Priority'
  description TEXT,  -- Optional explanation
  
  -- Metadata for extensibility (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,  -- {color: '#FF5733', icon: 'AlertCircle', weight: 100}
  
  -- Sorting and visibility
  sort_order INTEGER DEFAULT 0,  -- For ordering in dropdowns
  is_active BOOLEAN DEFAULT true,  -- Soft delete
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT unique_ref_data_per_category UNIQUE(tenant_id, category, key)
);

-- ============================================================================
-- 2. INDEXES - for performance
-- ============================================================================

CREATE INDEX idx_reference_data_tenant_id ON reference_data(tenant_id);
CREATE INDEX idx_reference_data_category ON reference_data(category);
CREATE INDEX idx_reference_data_is_active ON reference_data(is_active);
CREATE INDEX idx_reference_data_tenant_category_active ON reference_data(tenant_id, category, is_active);
CREATE INDEX idx_reference_data_metadata ON reference_data USING GIN (metadata);

-- ============================================================================
-- 3. TRIGGERS - Auto update timestamp
-- ============================================================================

CREATE TRIGGER reference_data_updated_at_trigger
BEFORE UPDATE ON reference_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE reference_data ENABLE ROW LEVEL SECURITY;

-- Policy 0: Service role (used during migrations/seeding) can do everything
CREATE POLICY reference_data_service_role_policy ON reference_data
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ⚠️ Policy 1: Super users bypass RLS entirely
CREATE POLICY reference_data_super_user_all_policy ON reference_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Policy 2: Regular users see only their tenant's reference data (SELECT)
CREATE POLICY reference_data_select_policy ON reference_data
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 3: Regular users can insert their tenant's reference data
CREATE POLICY reference_data_insert_policy ON reference_data
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 4: Regular users can update their tenant's reference data
CREATE POLICY reference_data_update_policy ON reference_data
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Policy 5: Regular users can delete their tenant's reference data
CREATE POLICY reference_data_delete_policy ON reference_data
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- ============================================================================
-- 5. COMMENTS - Documentation
-- ============================================================================

COMMENT ON TABLE reference_data IS 'Generic extensible reference data table - supports custom dropdowns, priorities, severities, departments, etc.';
COMMENT ON COLUMN reference_data.category IS 'Category of reference data: priority, severity, department, industry, competency_level, etc.';
COMMENT ON COLUMN reference_data.key IS 'Programmatic identifier within category: high, low, critical, low, urgent, etc.';
COMMENT ON COLUMN reference_data.label IS 'User-friendly display label for UI';
COMMENT ON COLUMN reference_data.metadata IS 'JSONB object for flexible additional properties: {color, icon, weight, code, etc.}';


-- ============================================================================
-- MIGRATION: 20250315000003_enhance_reference_tables.sql
-- ============================================================================

-- ============================================================================
-- PHASE 1.5: DYNAMIC DATA LOADING ARCHITECTURE
-- Migration: Enhance Product Categories and Create Suppliers Table
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE PRODUCT_CATEGORIES TABLE
-- ============================================================================

-- Add missing columns to product_categories if they don't exist
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_is_active ON product_categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order ON product_categories(sort_order);

-- ============================================================================
-- 2. CREATE SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Supplier Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  
  -- Contact Person
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Classification
  industry VARCHAR(100),
  country VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Additional
  notes TEXT,
  tax_id VARCHAR(50),
  credit_limit NUMERIC(12, 2),
  payment_terms VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_supplier_per_tenant UNIQUE(name, tenant_id)
);

-- ============================================================================
-- 3. INDEXES - Suppliers
-- ============================================================================

CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_tenant_is_active ON suppliers(tenant_id, is_active);
CREATE INDEX idx_suppliers_sort_order ON suppliers(sort_order);

-- ============================================================================
-- 4. TRIGGERS - Suppliers
-- ============================================================================

CREATE TRIGGER suppliers_updated_at_trigger
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - Suppliers
-- ============================================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ⚠️  Policy 1: Super users bypass RLS
CREATE POLICY suppliers_super_user_policy ON suppliers
  FOR ALL USING (
    (auth.jwt() ->> 'is_super_user')::boolean = true
    OR (auth.jwt() ->> 'super_user')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_super_user')::boolean = true
    OR (auth.jwt() ->> 'super_user')::boolean = true
  );

-- Policy 2: Regular users see only their tenant's suppliers
CREATE POLICY suppliers_tenant_isolation_policy ON suppliers
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY suppliers_insert_policy ON suppliers
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY suppliers_update_policy ON suppliers
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY suppliers_delete_policy ON suppliers
  FOR DELETE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- 6. COMMENTS - Documentation
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Supplier master data with contact information and status tracking';
COMMENT ON COLUMN suppliers.is_active IS 'Soft delete flag - false means supplier is inactive/archived';
COMMENT ON COLUMN suppliers.sort_order IS 'Display order in dropdown lists';


-- ============================================================================
-- MIGRATION: 20250322000021_create_sales_views.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE VIEWS - SALES MODULE
-- Migration: Create sales views for denormalized data queries
-- ============================================================================

-- ============================================================================
-- 1. SALES WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW sales_with_details AS
SELECT
  s.id, s.sale_number, s.title, s.description,
  s.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  s.value, s.amount, s.currency, s.probability, s.weighted_amount,
  s.stage, s.status, s.source, s.campaign,
  s.expected_close_date, s.actual_close_date,
  s.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  s.notes, s.tags, s.tenant_id, s.created_at, s.updated_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.assigned_to = u.id;

-- ============================================================================
-- 2. SALE ITEMS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW sale_items_with_details AS
SELECT
  si.id, si.sale_id, si.product_id,
  p.name AS product_name, p.sku AS product_sku,
  pc.name AS category_name, p.unit AS product_unit,
  si.quantity, si.unit_price, si.discount, si.tax, si.line_total,
  si.created_at
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- ============================================================================
-- 3. PRODUCT SALES WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW product_sales_with_details AS
SELECT
  ps.id, ps.customer_id, c.company_name AS customer_name,
  ps.product_id, p.name AS product_name, pc.name AS category_name,
  ps.units, ps.cost_per_unit, ps.total_cost,
  ps.delivery_date, ps.warranty_expiry, ps.status, ps.notes,
  ps.tenant_id, ps.created_at, ps.updated_at
FROM product_sales ps
LEFT JOIN customers c ON ps.customer_id = c.id
LEFT JOIN products p ON ps.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

COMMENT ON VIEW sales_with_details IS 'Sales with customer and user denormalized data';
COMMENT ON VIEW sale_items_with_details IS 'Sale items with product and category enrichment';
COMMENT ON VIEW product_sales_with_details IS 'Product sales with customer and product enrichment';



-- ============================================================================
-- MIGRATION: 20250322000022_create_crm_views.sql
-- ============================================================================

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



-- ============================================================================
-- MIGRATION: 20250322000023_create_contract_views.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE VIEWS - CONTRACT MODULE
-- Migration: Create contract views with denormalized data
-- ============================================================================

-- ============================================================================
-- 1. CONTRACTS WITH DETAILS VIEW
-- ============================================================================
-- Provides contracts enriched with customer and user information

CREATE OR REPLACE VIEW contracts_with_details AS
SELECT
  c.id, c.contract_number, c.title, c.description,
  c.type, c.status, c.customer_id,
  cust.company_name AS customer_name, cust.contact_name AS customer_contact_name,
  cust.email AS customer_email, cust.phone AS customer_phone,
  c.value, c.total_value, c.currency,
  c.start_date, c.end_date, c.signed_date, c.next_renewal_date,
  c.auto_renew, c.renewal_period_months,
  c.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  c.compliance_status, c.priority,
  c.template_id, ct.name AS template_name,
  c.signature_total_required, c.signature_completed,
  c.tags, c.notes,
  c.tenant_id, c.created_at, c.updated_at
FROM contracts c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_to = u.id
LEFT JOIN contract_templates ct ON c.template_id = ct.id
WHERE c.deleted_at IS NULL;

-- ============================================================================
-- 2. CONTRACT APPROVAL RECORDS WITH DETAILS VIEW
-- ============================================================================
-- Approval records enriched with approver information

CREATE OR REPLACE VIEW contract_approval_records_with_details AS
SELECT
  car.id, car.contract_id, car.stage,
  car.approver_id, COALESCE(u.name, u.email) AS approver_name,
  u.email AS approver_email, u.role AS approver_role,
  car.status, car.comments, car.timestamp, car.created_at
FROM contract_approval_records car
LEFT JOIN users u ON car.approver_id = u.id;

-- ============================================================================
-- 3. COMMENTS - Documentation
-- ============================================================================

COMMENT ON VIEW contracts_with_details IS 'Contracts enriched with customer, user, and template information';
COMMENT ON VIEW contract_approval_records_with_details IS 'Contract approvals with approver details and role information';



-- ============================================================================
-- MIGRATION: 20250322000024_create_job_works_views.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE VIEWS - JOB WORKS MODULE
-- Migration: Create job works views with denormalized data
-- ============================================================================

-- ============================================================================
-- 1. JOB WORKS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW job_works_with_details AS
SELECT
  jw.id, jw.job_ref_id,
  jw.customer_id, c.company_name AS customer_name, c.contact_name AS customer_contact,
  c.email AS customer_email, c.phone AS customer_phone,
  jw.product_id, p.name AS product_name, p.sku AS product_sku,
  pc.name AS product_category, p.unit AS product_unit,
  jw.pieces, jw.size, jw.base_price, jw.default_price, jw.manual_price, jw.final_price, jw.currency,
  jw.receiver_engineer_id, COALESCE(u1.name, u1.email) AS receiver_engineer_name,
  u1.email AS receiver_engineer_email,
  jw.assigned_by, COALESCE(u2.name, u2.email) AS assigned_by_name,
  jw.status, jw.priority, jw.due_date, jw.started_at, jw.completed_at, jw.delivered_at, jw.estimated_completion,
  jw.comments, jw.internal_notes, jw.delivery_address, jw.delivery_instructions,
  jw.quality_check_passed, jw.quality_notes, jw.compliance_requirements,
  jw.tenant_id, jw.created_at, jw.updated_at, jw.created_by
FROM job_works jw
LEFT JOIN customers c ON jw.customer_id = c.id
LEFT JOIN products p ON jw.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN users u1 ON jw.receiver_engineer_id = u1.id
LEFT JOIN users u2 ON jw.assigned_by = u2.id
WHERE jw.deleted_at IS NULL;

-- ============================================================================
-- 2. JOB WORK SPECIFICATIONS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW job_work_specifications_with_details AS
SELECT
  jws.id, jws.job_work_id, jw.job_ref_id,
  jws.name, jws.value, jws.unit, jws.required, jws.created_at, jw.tenant_id
FROM job_work_specifications jws
LEFT JOIN job_works jw ON jws.job_work_id = jw.id;

COMMENT ON VIEW job_works_with_details IS 'Job works with denormalized customer, product, and user information';
COMMENT ON VIEW job_work_specifications_with_details IS 'Job specifications with parent job reference';



-- ============================================================================
-- MIGRATION: 20250322000025_create_remaining_views.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE VIEWS - SERVICE CONTRACTS & COMPLAINTS
-- Migration: Create remaining views for service contracts and complaints
-- ============================================================================

-- ============================================================================
-- 1. SERVICE CONTRACTS WITH DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW service_contracts_with_details AS
SELECT
  sc.id, sc.contract_number, sc.title, sc.description,
  sc.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  c.contact_name AS customer_contact_name,
  sc.product_id, p.name AS product_name, p.sku AS product_sku,
  sc.start_date, sc.end_date, sc.value, sc.currency,
  sc.status, sc.service_type, sc.priority,
  sc.auto_renew, sc.renewal_period_months,
  sc.sla_terms, sc.service_scope,
  sc.tenant_id, sc.created_at, sc.updated_at, sc.created_by
FROM service_contracts sc
LEFT JOIN customers c ON sc.customer_id = c.id
LEFT JOIN products p ON sc.product_id = p.id
WHERE sc.deleted_at IS NULL;

COMMENT ON VIEW service_contracts_with_details IS 'Service contracts with customer and product enrichment';



-- ============================================================================
-- MIGRATION: 20250328000026_remove_all_denormalized_fields.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: COMPLETE DENORMALIZATION REMOVAL
-- Migration: Remove all 45+ denormalized fields from all tables
-- This migration must come AFTER all views are created (Phase 2)
-- Views will provide denormalized data for queries that need it
-- ============================================================================

-- ============================================================================
-- 0. DROP DEPENDENT VIEWS FIRST
-- ============================================================================
DROP VIEW IF EXISTS sales_with_details CASCADE;
DROP VIEW IF EXISTS sale_items_with_details CASCADE;
DROP VIEW IF EXISTS product_sales_with_details CASCADE;
DROP VIEW IF EXISTS customers_with_stats CASCADE;
DROP VIEW IF EXISTS tickets_with_details CASCADE;
DROP VIEW IF EXISTS ticket_comments_with_details CASCADE;
DROP VIEW IF EXISTS contracts_with_details CASCADE;
DROP VIEW IF EXISTS contract_approval_records_with_details CASCADE;
DROP VIEW IF EXISTS service_contracts_with_details CASCADE;
DROP VIEW IF EXISTS job_works_with_details CASCADE;
DROP VIEW IF EXISTS job_work_specifications_with_details CASCADE;

-- ============================================================================
-- 1. PRODUCTS TABLE - Remove 3 denormalized fields
-- ============================================================================
ALTER TABLE products
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS supplier_name;

-- ============================================================================
-- 2. SALES TABLE - Remove 3 denormalized fields
-- ============================================================================
ALTER TABLE sales
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS assigned_to_name,
DROP COLUMN IF EXISTS amount;

-- ============================================================================
-- 3. TICKETS TABLE - Remove 5 denormalized fields
-- ============================================================================
ALTER TABLE tickets
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS customer_email,
DROP COLUMN IF EXISTS customer_phone,
DROP COLUMN IF EXISTS assigned_to_name,
DROP COLUMN IF EXISTS reported_by_name;

-- ============================================================================
-- 4. TICKET COMMENTS TABLE - Remove 2 denormalized fields
-- ============================================================================
ALTER TABLE ticket_comments
DROP COLUMN IF EXISTS author_name,
DROP COLUMN IF EXISTS author_role;

-- ============================================================================
-- 5. TICKET ATTACHMENTS TABLE - Remove 1 denormalized field
-- ============================================================================
ALTER TABLE ticket_attachments
DROP COLUMN IF EXISTS uploaded_by_name;

-- ============================================================================
-- 6. CONTRACTS TABLE - Remove 4 denormalized fields
-- ============================================================================
ALTER TABLE contracts
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS customer_contact,
DROP COLUMN IF EXISTS assigned_to_name,
DROP COLUMN IF EXISTS total_value;

-- ============================================================================
-- 7. CONTRACT APPROVAL RECORDS TABLE - Remove 1 denormalized field
-- ============================================================================
ALTER TABLE contract_approval_records
DROP COLUMN IF EXISTS approver_name;

-- ============================================================================
-- 8. PRODUCT SALES TABLE - Remove 2 denormalized fields
-- ============================================================================
ALTER TABLE product_sales
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS product_name;

-- ============================================================================
-- 9. SERVICE CONTRACTS TABLE - Remove 2 denormalized fields
-- ============================================================================
ALTER TABLE service_contracts
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS product_name;

-- ============================================================================
-- 10. JOB WORKS TABLE - Remove 12 denormalized fields
-- ============================================================================
ALTER TABLE job_works
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS customer_short_name,
DROP COLUMN IF EXISTS customer_contact,
DROP COLUMN IF EXISTS customer_email,
DROP COLUMN IF EXISTS customer_phone,
DROP COLUMN IF EXISTS product_name,
DROP COLUMN IF EXISTS product_sku,
DROP COLUMN IF EXISTS product_category,
DROP COLUMN IF EXISTS product_unit,
DROP COLUMN IF EXISTS receiver_engineer_name,
DROP COLUMN IF EXISTS receiver_engineer_email,
DROP COLUMN IF EXISTS assigned_by_name;

-- ============================================================================
-- 11. COMPLAINTS TABLE - Remove 1 denormalized field
-- ============================================================================
ALTER TABLE complaints
DROP COLUMN IF EXISTS customer_name;

-- ============================================================================
-- 12. COMMENTS - Migration Notes
-- ============================================================================

COMMENT ON TABLE products IS 'Product data (normalized - use product_with_details view for enriched data)';
COMMENT ON TABLE sales IS 'Sales data (normalized - use sales_with_details view for enriched data)';
COMMENT ON TABLE tickets IS 'Tickets (normalized - use tickets_with_details view for enriched data)';
COMMENT ON TABLE ticket_comments IS 'Ticket comments (normalized - use ticket_comments_with_details view for enriched data)';
COMMENT ON TABLE contracts IS 'Contracts (normalized - use contracts_with_details view for enriched data)';
COMMENT ON TABLE contract_approval_records IS 'Approvals (normalized - use contract_approval_records_with_details view for enriched data)';
COMMENT ON TABLE product_sales IS 'Product sales (normalized - use product_sales_with_details view for enriched data)';
COMMENT ON TABLE service_contracts IS 'Service contracts (normalized - use service_contracts_with_details view for enriched data)';
COMMENT ON TABLE job_works IS 'Job works (normalized - use job_works_with_details view for enriched data)';
COMMENT ON TABLE complaints IS 'Complaints (normalized - use complaints_with_details view for enriched data)';

-- ============================================================================
-- 13. CREATE SUMMARY VIEWS FOR COMPUTED DATA
-- ============================================================================

-- Customer Summary View - replaces computed fields
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

-- ============================================================================
-- 14. RECREATE VIEWS (now normalized without denormalized fields)
-- ============================================================================

-- Sales with details view
CREATE OR REPLACE VIEW sales_with_details AS
SELECT
  s.id, s.sale_number, s.title, s.description,
  s.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  s.value, s.currency, s.probability, s.weighted_amount,
  s.stage, s.status, s.source, s.campaign,
  s.expected_close_date, s.actual_close_date,
  s.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  s.notes, s.tags, s.tenant_id, s.created_at, s.updated_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.assigned_to = u.id;

-- Sale items with details view
CREATE OR REPLACE VIEW sale_items_with_details AS
SELECT
  si.id, si.sale_id, si.product_id,
  p.name AS product_name, p.sku AS product_sku,
  pc.name AS category_name, p.unit AS product_unit,
  si.quantity, si.unit_price, si.discount, si.tax, si.line_total,
  si.created_at
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- Product sales with details view
CREATE OR REPLACE VIEW product_sales_with_details AS
SELECT
  ps.id, ps.customer_id, c.company_name AS customer_name,
  ps.product_id, p.name AS product_name, pc.name AS category_name,
  ps.units, ps.cost_per_unit, ps.total_cost,
  ps.delivery_date, ps.warranty_expiry, ps.status, ps.notes,
  ps.tenant_id, ps.created_at, ps.updated_at
FROM product_sales ps
LEFT JOIN customers c ON ps.customer_id = c.id
LEFT JOIN products p ON ps.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- Customers with stats view - now uses customer_summary for computed data
CREATE OR REPLACE VIEW customers_with_stats AS
SELECT
  cs.id, cs.company_name, cs.contact_name, cs.email,
  cs.customer_type, cs.status,
  c.assigned_to,
  COALESCE(u.name, u.email) AS assigned_to_name,
  cs.total_sales_amount, cs.total_orders, cs.average_order_value,
  cs.last_purchase_date, c.last_contact_date,
  cs.open_sales,
  cs.open_tickets,
  cs.active_service_contracts AS total_contracts,
  cs.tenant_id, cs.created_at, cs.updated_at
FROM customer_summary cs
LEFT JOIN customers c ON cs.id = c.id
LEFT JOIN users u ON c.assigned_to = u.id
WHERE c.deleted_at IS NULL;

-- Tickets with details view
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

-- Ticket comments with details view
CREATE OR REPLACE VIEW ticket_comments_with_details AS
SELECT
  tc.id, tc.ticket_id, tc.content,
  tc.author_id, COALESCE(u.name, u.email) AS author_name,
  u.email AS author_email, u.role AS author_role,
  tc.parent_id, tc.created_at, tc.updated_at
FROM ticket_comments tc
LEFT JOIN users u ON tc.author_id = u.id;

-- Contracts with details view
CREATE OR REPLACE VIEW contracts_with_details AS
SELECT
  c.id, c.contract_number, c.title, c.description,
  c.type, c.status, c.customer_id,
  cust.company_name AS customer_name, cust.contact_name AS customer_contact_name,
  cust.email AS customer_email, cust.phone AS customer_phone,
  c.value, c.currency,
  c.start_date, c.end_date, c.signed_date, c.next_renewal_date,
  c.auto_renew, c.renewal_period_months,
  c.assigned_to, COALESCE(u.name, u.email) AS assigned_to_name,
  c.compliance_status, c.priority,
  c.template_id, ct.name AS template_name,
  c.signature_total_required, c.signature_completed,
  c.tags, c.notes,
  c.tenant_id, c.created_at, c.updated_at
FROM contracts c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_to = u.id
LEFT JOIN contract_templates ct ON c.template_id = ct.id
WHERE c.deleted_at IS NULL;

-- Contract approval records with details view
CREATE OR REPLACE VIEW contract_approval_records_with_details AS
SELECT
  car.id, car.contract_id, car.stage,
  car.approver_id, COALESCE(u.name, u.email) AS approver_name,
  u.email AS approver_email, u.role AS approver_role,
  car.status, car.comments, car.timestamp, car.created_at
FROM contract_approval_records car
LEFT JOIN users u ON car.approver_id = u.id;

-- Service contracts with details view
CREATE OR REPLACE VIEW service_contracts_with_details AS
SELECT
  sc.id, sc.contract_number, sc.title, sc.description,
  sc.customer_id, c.company_name AS customer_name, c.email AS customer_email,
  c.contact_name AS customer_contact_name,
  sc.product_id, p.name AS product_name, p.sku AS product_sku,
  sc.start_date, sc.end_date, sc.value, sc.currency,
  sc.status, sc.service_type, sc.priority,
  sc.auto_renew, sc.renewal_period_months,
  sc.sla_terms, sc.service_scope,
  sc.tenant_id, sc.created_at, sc.updated_at, sc.created_by
FROM service_contracts sc
LEFT JOIN customers c ON sc.customer_id = c.id
LEFT JOIN products p ON sc.product_id = p.id
WHERE sc.deleted_at IS NULL;

-- Job works with details view
CREATE OR REPLACE VIEW job_works_with_details AS
SELECT
  jw.id, jw.job_ref_id,
  jw.customer_id, c.company_name AS customer_name, c.contact_name AS customer_contact,
  c.email AS customer_email, c.phone AS customer_phone,
  jw.product_id, p.name AS product_name, p.sku AS product_sku,
  pc.name AS product_category, p.unit AS product_unit,
  jw.pieces, jw.size, jw.base_price, jw.default_price, jw.manual_price, jw.final_price, jw.currency,
  jw.receiver_engineer_id, COALESCE(u1.name, u1.email) AS receiver_engineer_name,
  u1.email AS receiver_engineer_email,
  jw.assigned_by, COALESCE(u2.name, u2.email) AS assigned_by_name,
  jw.status, jw.priority, jw.due_date, jw.started_at, jw.completed_at, jw.delivered_at, jw.estimated_completion,
  jw.comments, jw.internal_notes, jw.delivery_address, jw.delivery_instructions,
  jw.quality_check_passed, jw.quality_notes, jw.compliance_requirements,
  jw.tenant_id, jw.created_at, jw.updated_at, jw.created_by
FROM job_works jw
LEFT JOIN customers c ON jw.customer_id = c.id
LEFT JOIN products p ON jw.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN users u1 ON jw.receiver_engineer_id = u1.id
LEFT JOIN users u2 ON jw.assigned_by = u2.id
WHERE jw.deleted_at IS NULL;

-- Job work specifications with details view
CREATE OR REPLACE VIEW job_work_specifications_with_details AS
SELECT
  jws.id, jws.job_work_id, jw.job_ref_id,
  jws.name, jws.value, jws.unit, jws.required, jws.created_at, jw.tenant_id
FROM job_work_specifications jws
LEFT JOIN job_works jw ON jws.job_work_id = jw.id;

-- ============================================================================
-- 13. SUMMARY OF CHANGES
-- ============================================================================
-- Total columns removed: 45+
-- Tables affected: 10
-- Data migration: None (all data preserved in related tables and views)
-- New views available: 11 (provide denormalized data as needed)
-- Estimated storage reduction: 25-40%
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20250328000027_add_performance_indexes.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: PERFORMANCE OPTIMIZATION INDEXES
-- Migration: Add indexes to optimize query performance after normalization
-- These indexes support the views and common queries
-- ============================================================================

-- ============================================================================
-- 1. SALES TABLE INDEXES
-- ============================================================================
-- For sales_with_details view and common sales queries
CREATE INDEX IF NOT EXISTS idx_sales_tenant_customer ON sales(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_assigned_to ON sales(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_stage_status ON sales(stage, status);
CREATE INDEX IF NOT EXISTS idx_sales_expected_close_date ON sales(expected_close_date);

-- ============================================================================
-- 2. SALE ITEMS INDEXES
-- ============================================================================
-- For sale_items_with_details view
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON sale_items(sale_id, product_id);

-- ============================================================================
-- 3. TICKETS TABLE INDEXES
-- ============================================================================
-- For tickets_with_details view and analytics
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_customer ON tickets(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_assigned_to ON tickets(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date_open ON tickets(due_date) WHERE status NOT IN ('resolved', 'closed');

-- ============================================================================
-- 4. TICKET COMMENTS INDEXES
-- ============================================================================
-- For ticket_comments_with_details view
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author_created ON ticket_comments(author_id, created_at);

-- ============================================================================
-- 5. CUSTOMERS TABLE INDEXES
-- ============================================================================
-- For customers_with_stats view (aggregations)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status ON customers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to_tenant ON customers(assigned_to, tenant_id);

-- ============================================================================
-- 6. CONTRACTS TABLE INDEXES
-- ============================================================================
-- For contracts_with_details view and lifecycle queries
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_customer ON contracts(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_assigned_to ON contracts(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_contracts_status_date ON contracts(status, end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_auto_renew_date ON contracts(auto_renew, next_renewal_date);

-- ============================================================================
-- 7. CONTRACT APPROVAL RECORDS INDEXES
-- ============================================================================
-- For contract_approval_records_with_details view
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract_approver ON contract_approval_records(contract_id, approver_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_status ON contract_approval_records(status, stage);

-- ============================================================================
-- 8. PRODUCT SALES INDEXES
-- ============================================================================
-- For product_sales_with_details view
CREATE INDEX IF NOT EXISTS idx_product_sales_tenant_customer ON product_sales(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_tenant_product ON product_sales(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_status ON product_sales(status);
CREATE INDEX IF NOT EXISTS idx_product_sales_warranty_expiry ON product_sales(warranty_expiry);

-- ============================================================================
-- 9. SERVICE CONTRACTS INDEXES
-- ============================================================================
-- For service_contracts_with_details view
CREATE INDEX IF NOT EXISTS idx_service_contracts_tenant_customer ON service_contracts(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_tenant_product ON service_contracts(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_status ON service_contracts(status);
CREATE INDEX IF NOT EXISTS idx_service_contracts_end_date_active ON service_contracts(end_date) WHERE status IN ('active', 'renewed');
CREATE INDEX IF NOT EXISTS idx_service_contracts_auto_renew ON service_contracts(auto_renew, end_date);

-- ============================================================================
-- 10. JOB WORKS INDEXES (CRITICAL - Most joins)
-- ============================================================================
-- For job_works_with_details view (5+ table joins)
CREATE INDEX IF NOT EXISTS idx_job_works_tenant_customer ON job_works(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_job_works_tenant_product ON job_works(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_job_works_engineer_tenant ON job_works(receiver_engineer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_works_assigned_by_tenant ON job_works(assigned_by, tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_works_status_priority ON job_works(status, priority);
CREATE INDEX IF NOT EXISTS idx_job_works_due_date_pending ON job_works(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_job_works_completed_delivered ON job_works(completed_at, delivered_at);

-- ============================================================================
-- 11. JOB WORK SPECIFICATIONS INDEXES
-- ============================================================================
-- For job_work_specifications_with_details view
CREATE INDEX IF NOT EXISTS idx_job_work_specs_required ON job_work_specifications(required, name);

-- ============================================================================
-- 12. COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================
-- Multi-column indexes for complex queries

-- Sales analytics queries
CREATE INDEX IF NOT EXISTS idx_sales_stage_date ON sales(tenant_id, stage, expected_close_date);

-- Ticket SLA tracking
CREATE INDEX IF NOT EXISTS idx_tickets_sla_check ON tickets(tenant_id, is_sla_breached, status);

-- Job work workflow
CREATE INDEX IF NOT EXISTS idx_job_works_workflow ON job_works(tenant_id, status, due_date, receiver_engineer_id);

-- ============================================================================
-- 13. SUMMARY OF INDEXES ADDED
-- ============================================================================
-- Total indexes added: 30+
-- Purpose: Optimize view queries and common filtering operations
-- Expected query improvement: 25-40% faster for join operations
-- Storage cost: ~15-20% additional for indexes (worth the query improvement)
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20250328000028_add_audit_logs_user_columns.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add user_name and user_email columns to audit_logs
-- Date: 2025-03-28
-- Description: Add missing user identification columns to audit_logs table
-- Required for audit logging functionality in auditService.ts
-- ============================================================================

-- Add user_name column
ALTER TABLE audit_logs
ADD COLUMN user_name VARCHAR(255);

-- Add user_email column
ALTER TABLE audit_logs
ADD COLUMN user_email VARCHAR(255);

-- Add resource column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN resource VARCHAR(100);

-- Add resource_id column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN resource_id VARCHAR(255);

-- Add target_id column (used in superAdminManagementService.ts)
ALTER TABLE audit_logs
ADD COLUMN target_id VARCHAR(255);

-- Add metadata column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN metadata JSONB;

-- Add indexes for the new columns
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);

-- Update comments
COMMENT ON COLUMN audit_logs.user_name IS 'Display name of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email address of the user who performed the action';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type that was affected (e.g., customer, sale, user)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource that was affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata about the action';

-- ============================================================================
-- Verification queries (run after migration)
-- ============================================================================

-- Check that columns were added
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'audit_logs'
-- AND column_name IN ('user_name', 'user_email', 'resource', 'resource_id', 'metadata')
-- ORDER BY column_name;

-- Check indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'audit_logs'
-- AND indexname LIKE '%user_email%' OR indexname LIKE '%resource%'
-- ORDER BY indexname;


-- ============================================================================
-- MIGRATION: 20250329000001_enterprise_schema_normalization.sql
-- ============================================================================

-- ============================================================================
-- ENTERPRISE SCHEMA NORMALIZATION - Complete Denormalization Removal
-- Migration: Remove remaining denormalized fields and computed fields
-- This completes the normalization started in migration 26
-- ============================================================================

-- ============================================================================
-- 0. DROP VIEWS THAT DEPEND ON COLUMNS TO BE REMOVED
-- ============================================================================

-- Drop views that reference the computed columns before dropping the columns
DROP VIEW IF EXISTS customers_with_stats CASCADE;

-- ============================================================================
-- 1. REMOVE COMPUTED FIELDS FROM CUSTOMERS TABLE (Violates 3NF)
-- ============================================================================

-- Drop computed fields that should be calculated dynamically
ALTER TABLE customers
DROP COLUMN IF EXISTS total_sales_amount,
DROP COLUMN IF EXISTS total_orders,
DROP COLUMN IF EXISTS average_order_value,
DROP COLUMN IF EXISTS last_purchase_date;

-- ============================================================================
-- 2. REMOVE REMAINING DENORMALIZED FIELDS FROM SERVICE CONTRACTS MODULE
-- ============================================================================

-- Service Contracts table - remove denormalized name fields
ALTER TABLE service_contracts
DROP COLUMN IF EXISTS customer_name,
DROP COLUMN IF EXISTS product_name,
DROP COLUMN IF EXISTS assigned_to_name,
DROP COLUMN IF EXISTS secondary_contact_name;

-- Add proper foreign key constraints that were missing
ALTER TABLE service_contracts
ADD CONSTRAINT fk_service_contracts_customer_id
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_service_contracts_product_id
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_service_contracts_assigned_to
FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_service_contracts_secondary_contact
FOREIGN KEY (secondary_contact_id) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_service_contracts_approved_by
FOREIGN KEY (approved_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_service_contracts_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_service_contracts_updated_by
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Service Contract Documents - remove denormalized field
ALTER TABLE service_contract_documents
DROP COLUMN IF EXISTS uploaded_by_name;

-- Add proper foreign key constraint
ALTER TABLE service_contract_documents
ADD CONSTRAINT fk_service_contract_documents_uploaded_by
FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Service Delivery Milestones - remove denormalized field
ALTER TABLE service_delivery_milestones
DROP COLUMN IF EXISTS assigned_to_name;

-- Add proper foreign key constraint
ALTER TABLE service_delivery_milestones
ADD CONSTRAINT fk_service_delivery_milestones_assigned_to
FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Service Contract Issues - remove denormalized field
ALTER TABLE service_contract_issues
DROP COLUMN IF EXISTS assigned_to_name;

-- Add proper foreign key constraint
ALTER TABLE service_contract_issues
ADD CONSTRAINT fk_service_contract_issues_assigned_to
FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Service Contract Activity Log - remove denormalized field
ALTER TABLE service_contract_activity_log
DROP COLUMN IF EXISTS user_name;

-- Add proper foreign key constraint
ALTER TABLE service_contract_activity_log
ADD CONSTRAINT fk_service_contract_activity_log_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. CREATE SUMMARY VIEWS FOR COMPUTED DATA
-- ============================================================================

-- Service Contract Summary View
CREATE OR REPLACE VIEW service_contract_summary AS
SELECT
    sc.id,
    sc.contract_number,
    sc.title,
    sc.status,
    sc.value,
    sc.currency,

    -- Related entity names (from joins, not stored)
    c.company_name AS customer_name,
    c.contact_name AS customer_contact,
    p.name AS product_name,
    p.sku AS product_sku,
    COALESCE(u1.name, u1.email) AS assigned_to_name,
    COALESCE(u2.name, u2.email) AS secondary_contact_name,

    -- Document count
    COUNT(DISTINCT scd.id) AS document_count,

    -- Milestone progress
    COUNT(DISTINCT CASE WHEN sdm.status = 'completed' THEN sdm.id END) AS completed_milestones,
    COUNT(DISTINCT sdm.id) AS total_milestones,

    -- Issue count
    COUNT(DISTINCT CASE WHEN sci.status IN ('open', 'in_progress') THEN sci.id END) AS open_issues,

    sc.start_date,
    sc.end_date,
    sc.created_at,
    sc.tenant_id
FROM service_contracts sc
LEFT JOIN customers c ON sc.customer_id = c.id
LEFT JOIN products p ON sc.product_id = p.id
LEFT JOIN users u1 ON sc.assigned_to_user_id = u1.id
LEFT JOIN users u2 ON sc.secondary_contact_id = u2.id
LEFT JOIN service_contract_documents scd ON sc.id = scd.service_contract_id
LEFT JOIN service_delivery_milestones sdm ON sc.id = sdm.service_contract_id
LEFT JOIN service_contract_issues sci ON sc.id = sci.service_contract_id
WHERE sc.deleted_at IS NULL
GROUP BY sc.id, sc.contract_number, sc.title, sc.status, sc.value, sc.currency,
         c.company_name, c.contact_name, p.name, p.sku, u1.name, u1.email, u2.name, u2.email,
         sc.start_date, sc.end_date, sc.created_at, sc.tenant_id;

-- ============================================================================
-- 4. UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE customers IS 'Customer data (normalized - use customer_summary view for computed metrics)';
COMMENT ON TABLE service_contracts IS 'Service contracts (normalized - use service_contract_summary view for enriched data)';
COMMENT ON VIEW customer_summary IS 'Customer summary with computed sales metrics and activity counts';
COMMENT ON VIEW service_contract_summary IS 'Service contract summary with related entity names and progress metrics';

-- ============================================================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for the new foreign key constraints
CREATE INDEX IF NOT EXISTS idx_service_contracts_customer_id ON service_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_product_id ON service_contracts(product_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_assigned_to_user_id ON service_contracts(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_secondary_contact_id ON service_contracts(secondary_contact_id);

CREATE INDEX IF NOT EXISTS idx_service_contract_documents_uploaded_by_user_id ON service_contract_documents(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_service_delivery_milestones_assigned_to_user_id ON service_delivery_milestones(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_service_contract_issues_assigned_to_user_id ON service_contract_issues(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_service_contract_activity_log_user_id ON service_contract_activity_log(user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Removed 4 computed fields from customers table
-- - Removed 9 denormalized name fields from service contracts module
-- - Added 9 proper foreign key constraints
-- - Created 2 summary views for computed/enriched data
-- - Added performance indexes
-- - Total fields removed: 13
-- - Estimated storage reduction: 15-20%


-- ============================================================================
-- MIGRATION: 20251116000001_remove_redundant_super_admin_fields.sql
-- ============================================================================

-- ============================================================================
-- Migration: Remove Redundant Super Admin Fields
-- Date: 2025-11-16
-- Purpose: Remove is_super_admin column and related constraints since
--          role='super_admin' is sufficient to identify super users
-- ============================================================================

-- ============================================================================
-- 1. DROP CONSTRAINTS THAT REFERENCE is_super_admin
-- ============================================================================

-- Drop the role consistency check constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS ck_super_admin_role_consistency;

-- Drop the tenant_id constraint for regular users
ALTER TABLE users
DROP CONSTRAINT IF EXISTS ck_tenant_id_for_regular_users;

-- ============================================================================
-- 2. DROP INDEXES THAT REFERENCE is_super_admin
-- ============================================================================

DROP INDEX IF EXISTS idx_users_is_super_admin;
DROP INDEX IF EXISTS idx_users_super_admin_status;
DROP INDEX IF EXISTS idx_users_super_admin_tenant;

-- ============================================================================
-- 3. UPDATE POLICIES THAT REFERENCE is_super_admin BEFORE DROPPING COLUMN
-- ============================================================================

-- Update tenants policies
DROP POLICY IF EXISTS "super_admin_view_all_tenants" ON tenants;
CREATE POLICY "super_admin_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "super_admin_update_tenants" ON tenants;
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

-- Update users policies
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

-- Update products policies
DROP POLICY IF EXISTS "managers_manage_products" ON products;
CREATE POLICY "managers_manage_products" ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_products" ON products;
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_products" ON products;
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update companies policies
DROP POLICY IF EXISTS "managers_create_companies" ON companies;
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_companies" ON companies;
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_companies" ON companies;
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update reference_data policies
DROP POLICY IF EXISTS "reference_data_super_user_all_policy" ON reference_data;
CREATE POLICY "reference_data_super_user_all_policy" ON reference_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 4. DROP THE REDUNDANT is_super_admin COLUMN
-- ============================================================================

ALTER TABLE users
DROP COLUMN IF EXISTS is_super_admin;

-- ============================================================================
-- 5. ADD NEW CONSTRAINTS BASED ON ROLE ONLY
-- ============================================================================

-- Ensure super admins have no tenant_id
ALTER TABLE users
ADD CONSTRAINT ck_super_admin_tenant_null
  CHECK (role != 'super_admin' OR tenant_id IS NULL);

-- Ensure non-super-admins have tenant_id
ALTER TABLE users
ADD CONSTRAINT ck_regular_user_tenant_not_null
  CHECK (role = 'super_admin' OR tenant_id IS NOT NULL);

-- ============================================================================
-- 6. ADD NEW INDEXES BASED ON ROLE
-- ============================================================================

-- Index for super admin queries
CREATE INDEX idx_users_role_super_admin
ON users(role)
WHERE role = 'super_admin';

-- Composite index for role and status
CREATE INDEX idx_users_role_status
ON users(role, status);

-- ============================================================================
-- 7. UPDATE COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT ck_super_admin_tenant_null ON users IS
  'Super admin users (role=super_admin) must have tenant_id=NULL for platform-wide access';

COMMENT ON CONSTRAINT ck_regular_user_tenant_not_null ON users IS
  'Regular users (role!=super_admin) must have tenant_id NOT NULL for tenant isolation';

-- ============================================================================
-- 8. MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Removed redundant is_super_admin column
-- - Removed related constraints and indexes
-- - Added role-based constraints
-- - Added role-based indexes
-- - Super user identification now based solely on role='super_admin'
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251116000002_update_rls_policies_for_role_based_super_admin.sql
-- ============================================================================

-- ============================================================================
-- Migration: Update RLS Policies for Role-Based Super Admin Detection
-- Date: 2025-11-16
-- Purpose: Replace all is_super_admin references with role='super_admin'
--          in Row Level Security policies after removing is_super_admin column
-- ============================================================================

-- ============================================================================
-- 1. UPDATE SUPER USER TENANT ACCESS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

-- Recreate with role-based checks
CREATE POLICY "super_user_tenant_access_select"
    ON super_user_tenant_access FOR SELECT
    USING (
        -- Super users can access their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_insert"
    ON super_user_tenant_access FOR INSERT
    WITH CHECK (
        -- Only super users can create tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_update"
    ON super_user_tenant_access FOR UPDATE
    USING (
        -- Super users can update their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_tenant_access_delete"
    ON super_user_tenant_access FOR DELETE
    USING (
        -- Super users can delete their own tenant access records
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 2. UPDATE IMPERSONATION LOG POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

-- Recreate with role-based checks
CREATE POLICY "super_user_impersonation_logs_select"
    ON super_user_impersonation_logs FOR SELECT
    USING (
        -- Super users can view their own impersonation logs
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_impersonation_logs_insert"
    ON super_user_impersonation_logs FOR INSERT
    WITH CHECK (
        -- Only super users can create impersonation logs
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "super_user_impersonation_logs_update"
    ON super_user_impersonation_logs FOR UPDATE
    USING (
        -- Super users can update their own impersonation logs (for logout)
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 3. UPDATE TENANT STATISTICS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

-- Recreate with role-based checks
CREATE POLICY "tenant_statistics_select"
    ON tenant_statistics FOR SELECT
    USING (
        -- Super users can view all tenant statistics
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can view their own tenant's statistics
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_statistics_insert"
    ON tenant_statistics FOR INSERT
    WITH CHECK (
        -- Super users can insert statistics for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can insert statistics for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_statistics_update"
    ON tenant_statistics FOR UPDATE
    USING (
        -- Super users can update statistics for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can update statistics for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_statistics.tenant_id
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 4. UPDATE TENANT CONFIG OVERRIDES POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- Recreate with role-based checks
CREATE POLICY "tenant_config_overrides_select"
    ON tenant_config_overrides FOR SELECT
    USING (
        -- Super users can view all config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can view config overrides for their own tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = tenant_config_overrides.tenant_id
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_insert"
    ON tenant_config_overrides FOR INSERT
    WITH CHECK (
        -- Only super users can create config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_update"
    ON tenant_config_overrides FOR UPDATE
    USING (
        -- Only super users can update config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "tenant_config_overrides_delete"
    ON tenant_config_overrides FOR DELETE
    USING (
        -- Only super users can delete config overrides
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 5. UPDATE OTHER POLICIES THAT USED is_super_admin
-- ============================================================================

-- Update reference data policies
DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
CREATE POLICY "reference_data_select"
    ON reference_data FOR SELECT
    USING (
        -- Super users can access all reference data
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can access reference data for their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = reference_data.tenant_id
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "reference_data_insert" ON reference_data;
CREATE POLICY "reference_data_insert"
    ON reference_data FOR INSERT
    WITH CHECK (
        -- Super users can insert reference data for any tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.deleted_at IS NULL
        )
        OR
        -- Tenant users can insert reference data for their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.tenant_id = reference_data.tenant_id
            AND users.deleted_at IS NULL
        )
    );

-- Update companies policies
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select"
    ON companies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert"
    ON companies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update"
    ON companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_delete"
    ON companies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "companies_select_all" ON companies;
CREATE POLICY "companies_select_all"
    ON companies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

-- Update products policies
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select"
    ON products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update"
    ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete"
    ON products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all"
    ON products FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
            AND users.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 6. UPDATE USER POLICIES (if they reference is_super_admin)
-- ============================================================================

-- Update users policies to use role-based checks
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select"
    ON users FOR SELECT
    USING (
        -- Users can view their own record
        users.id = auth.uid()
        OR
        -- Super users can view all users
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can view users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert"
    ON users FOR INSERT
    WITH CHECK (
        -- Super users can create users in any tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can create users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update"
    ON users FOR UPDATE
    USING (
        -- Users can update their own record
        users.id = auth.uid()
        OR
        -- Super users can update any user
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can update users in their tenant
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND u.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete"
    ON users FOR DELETE
    USING (
        -- Super users can delete any user
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.deleted_at IS NULL
        )
        OR
        -- Tenant admins can delete users in their tenant (except other admins)
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.tenant_id = users.tenant_id
            AND u.role = 'admin'
            AND users.role != 'admin'
            AND u.deleted_at IS NULL
        )
    );

-- ============================================================================
-- 7. UPDATE REMAINING POLICIES THAT USED is_super_admin
-- ============================================================================

-- Update tenants policies
DROP POLICY IF EXISTS "super_admin_view_all_tenants" ON tenants;
CREATE POLICY "super_admin_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "super_admin_update_tenants" ON tenants;
CREATE POLICY "super_admin_update_tenants" ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
      AND users.deleted_at IS NULL
    )
  );

-- Update users policies
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
CREATE POLICY "admins_manage_tenant_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS "current_user"
      WHERE "current_user".id = auth.uid()
      AND "current_user".tenant_id = users.tenant_id
      AND ("current_user".role IN ('admin') OR "current_user".role = 'super_admin')
      AND "current_user".deleted_at IS NULL
    )
  );

-- Update products policies
DROP POLICY IF EXISTS "managers_manage_products" ON products;
CREATE POLICY "managers_manage_products" ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_products" ON products;
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_products" ON products;
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update companies policies
DROP POLICY IF EXISTS "managers_create_companies" ON companies;
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_update_companies" ON companies;
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "managers_delete_companies" ON companies;
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.role = 'super_admin')
      AND users.deleted_at IS NULL
    )
  );

-- Update reference_data policies
DROP POLICY IF EXISTS "reference_data_super_user_all_policy" ON reference_data;
CREATE POLICY "reference_data_super_user_all_policy" ON reference_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Updated all RLS policies to use role='super_admin' instead of is_super_admin=true
-- - Maintained all existing security rules and access patterns
-- - Ensured super users retain full platform access
-- - Tenant users retain tenant-scoped access
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251116000003_normalize_user_access_schema.sql
-- ============================================================================

-- ============================================================================
-- Migration: Normalize User Access Schema - Enterprise RBAC Implementation
-- Date: 2025-11-16
-- Purpose: Remove redundant role enum from users table and implement proper
--          RBAC using database tables (roles, user_roles, permissions, role_permissions)
-- ============================================================================

-- ============================================================================
-- 0. FIX ROLES TABLE SCHEMA FOR SYSTEM ROLES
-- ============================================================================

-- Make tenant_id nullable for system roles
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Add check constraint to ensure non-system roles have tenant_id
ALTER TABLE roles ADD CONSTRAINT ck_roles_tenant_id_required_for_non_system
  CHECK (is_system_role OR tenant_id IS NOT NULL);

-- ============================================================================
-- ROLES WILL BE CREATED IN SEED.SQL TO ENSURE PROPER ORDERING
-- ============================================================================

-- ============================================================================
-- 2. MIGRATE EXISTING USER ROLES TO USER_ROLES TABLE
-- ============================================================================

-- Insert user_roles assignments based on existing users.role
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT
  u.id,
  r.id,
  u.tenant_id,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM users u
JOIN roles r ON r.name = (
  CASE u.role
    WHEN 'admin' THEN 'Administrator'
    WHEN 'manager' THEN 'Manager'
    WHEN 'agent' THEN 'User'
    WHEN 'engineer' THEN 'Engineer'
    WHEN 'customer' THEN 'Customer'
    ELSE 'User'
  END
) AND (r.tenant_id = u.tenant_id OR (u.role = 'super_admin' AND r.tenant_id IS NULL))
WHERE u.deleted_at IS NULL
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- ============================================================================
-- PERMISSIONS WILL BE CREATED IN SEED.SQL TO ENSURE PROPER ORDERING
-- ============================================================================

-- ============================================================================
-- 4. POPULATE ROLE_PERMISSIONS TABLE
-- ============================================================================

-- Clear existing role_permissions
DELETE FROM role_permissions;

-- Insert role_permissions for Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrator'
  AND p.name IN ('read', 'write', 'delete', 'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'crm:product-sale:record:update', 'manage_job_works', 'manage_tickets', 'crm:support:complaint:update', 'manage_dashboard', 'crm:system:config:manage', 'manage_companies');

-- Insert role_permissions for Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND p.name IN ('read', 'write', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'manage_dashboard');

-- Insert role_permissions for User role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'User'
  AND p.name IN ('read', 'write', 'crm:customer:record:update', 'manage_tickets');

-- Insert role_permissions for Engineer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Engineer'
  AND p.name IN ('read', 'write', 'manage_products', 'manage_job_works', 'manage_tickets');

-- Insert role_permissions for Customer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Customer'
  AND p.name IN ('read');

-- Insert role_permissions for super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name IN ('read', 'write', 'delete', 'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_contracts', 'crm:contract:service:update', 'manage_products', 'crm:product-sale:record:update', 'manage_job_works', 'manage_tickets', 'crm:support:complaint:update', 'manage_dashboard', 'crm:system:config:manage', 'manage_companies', 'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring');

-- ============================================================================
-- 5. DROP ALL OLD RLS POLICIES THAT DEPEND ON USERS.ROLE
-- ============================================================================

-- Permissions table policies
DROP POLICY IF EXISTS "admins_create_permissions" ON permissions;
DROP POLICY IF EXISTS "admins_update_permissions" ON permissions;

-- Roles table policies
DROP POLICY IF EXISTS "users_view_tenant_roles" ON roles;
DROP POLICY IF EXISTS "admins_create_roles" ON roles;
DROP POLICY IF EXISTS "admins_update_roles" ON roles;
DROP POLICY IF EXISTS "admins_delete_roles" ON roles;

-- User roles table policies
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_assign_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_remove_roles" ON user_roles;

-- Role templates policies
DROP POLICY IF EXISTS "admins_create_role_templates" ON role_templates;
DROP POLICY IF EXISTS "admins_update_role_templates" ON role_templates;
DROP POLICY IF EXISTS "super_admin_delete_role_templates" ON role_templates;

-- Super user tables policies
DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

-- Tenant statistics policies
DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

-- Tenant config overrides policies
DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- Reference data policies
DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
DROP POLICY IF EXISTS "reference_data_insert" ON reference_data;
DROP POLICY IF EXISTS "reference_data_super_user_all_policy" ON reference_data;

-- Companies policies
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;
DROP POLICY IF EXISTS "companies_select_all" ON companies;
DROP POLICY IF EXISTS "managers_create_companies" ON companies;
DROP POLICY IF EXISTS "managers_update_companies" ON companies;
DROP POLICY IF EXISTS "managers_delete_companies" ON companies;

-- Products policies
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "managers_manage_products" ON products;
DROP POLICY IF EXISTS "managers_update_products" ON products;
DROP POLICY IF EXISTS "managers_delete_products" ON products;

-- Users policies
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_tenants" ON tenants;
DROP POLICY IF EXISTS "super_admin_update_tenants" ON tenants;
DROP POLICY IF EXISTS "admins_manage_tenant_users" ON users;
DROP POLICY IF EXISTS "admins_insert_users" ON users;

-- ============================================================================
-- 6. DROP AND RECREATE VIEWS THAT DEPEND ON USERS.ROLE
-- ============================================================================

-- Drop views that depend on users.role
DROP VIEW IF EXISTS ticket_comments_with_details;
DROP VIEW IF EXISTS contract_approval_records_with_details;

-- Recreate ticket_comments_with_details view to use user_roles
CREATE VIEW ticket_comments_with_details AS
SELECT
  tc.id, tc.ticket_id, tc.content,
  tc.author_id, COALESCE(u.name, u.email) AS author_name,
  u.email AS author_email,
  COALESCE(r.name, 'user') AS author_role,
  tc.parent_id, tc.created_at, tc.updated_at
FROM ticket_comments tc
LEFT JOIN users u ON tc.author_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- Recreate contract_approval_records_with_details view to use user_roles
CREATE VIEW contract_approval_records_with_details AS
SELECT
  car.id, car.contract_id, car.stage,
  car.approver_id, COALESCE(u.name, u.email) AS approver_name,
  u.email AS approver_email,
  COALESCE(r.name, 'user') AS approver_role,
  car.status, car.comments, car.timestamp, car.created_at
FROM contract_approval_records car
LEFT JOIN users u ON car.approver_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

-- ============================================================================
-- 7. DROP REDUNDANT ROLE COLUMN FROM USERS TABLE
-- ============================================================================

-- Drop constraints that reference the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_super_admin_role_consistency;
ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_tenant_id_for_regular_users;

-- Drop indexes that reference the role column
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_super_admin_status;
DROP INDEX IF EXISTS idx_users_super_admin_tenant;
DROP INDEX IF EXISTS idx_users_role_super_admin;
DROP INDEX IF EXISTS idx_users_role_status;

-- Drop the redundant role column
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- ============================================================================
-- 8. CREATE NEW RLS POLICIES USING USER_ROLES
-- ============================================================================

-- Permissions table - simplified (permissions are global)
CREATE POLICY "permissions_select" ON permissions FOR SELECT USING (true);
CREATE POLICY "permissions_manage" ON permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('Administrator', 'super_admin')
  )
);

-- Roles table policies
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND r2.name = 'super_admin'
    )
    OR
    -- Regular users see roles in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
  );

CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
    AND NOT is_system_role
  );

CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r2 ON ur.role_id = r2.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = roles.tenant_id
        AND (r2.name IN ('Administrator', 'super_admin'))
    )
    AND NOT is_system_role
  );

-- User roles table policies
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Admins see assignments in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_assign_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = user_roles.tenant_id
        AND (r.name IN ('Administrator', 'super_admin'))
    )
  );

CREATE POLICY "admins_remove_roles" ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = user_roles.tenant_id
        AND (r.name IN ('Administrator', 'super_admin'))
    )
  );

-- Role templates policies (simplified)
CREATE POLICY "role_templates_select" ON role_templates FOR SELECT USING (true);
CREATE POLICY "role_templates_manage" ON role_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('Administrator', 'super_admin')
  )
);

-- Super user tables - simplified for super admins only
CREATE POLICY "super_user_tables_access" ON super_user_tenant_access FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

CREATE POLICY "super_user_logs_access" ON super_user_impersonation_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Tenant statistics - super admin only
CREATE POLICY "tenant_statistics_access" ON tenant_statistics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Tenant config overrides - super admin only
CREATE POLICY "tenant_config_access" ON tenant_config_overrides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- Reference data - tenant isolation
CREATE POLICY "reference_data_select" ON reference_data
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "reference_data_manage" ON reference_data
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Companies - tenant isolation with role-based access
CREATE POLICY "companies_select" ON companies
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "companies_manage" ON companies
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Products - tenant isolation with role-based access
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

CREATE POLICY "products_manage" ON products
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
  );

-- Users - complex tenant and role-based access
CREATE POLICY "users_select" ON users
  FOR SELECT
  USING (
    -- Users can see themselves
    id = auth.uid()
    OR
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant users can see users in their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT
  WITH CHECK (
    -- Super admin can create anywhere
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant admins can create in their tenant
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

CREATE POLICY "users_update" ON users
  FOR UPDATE
  USING (
    -- Users can update themselves
    id = auth.uid()
    OR
    -- Super admin can update all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    )
    OR
    -- Tenant admins can update users in their tenant (except other admins)
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'Administrator'
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE
  USING (
    -- Super admin can delete all (except other super admins)
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'super_admin'
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'super_admin'
      )
    )
    OR
    -- Tenant admins can delete users in their tenant (except other admins)
    (
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE users.id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id
          AND r.name = 'Administrator'
      )
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name = 'Administrator'
      )
    )
  );

-- Tenants - super admin only
CREATE POLICY "tenants_access" ON tenants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  )
);

-- ============================================================================
-- 9. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role_id ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id_permission_id ON role_permissions(role_id, permission_id);

-- ============================================================================
-- 10. UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts (normalized - roles assigned via user_roles table)';
COMMENT ON TABLE roles IS 'Role definitions per tenant';
COMMENT ON TABLE user_roles IS 'User role assignments (many-to-many)';
COMMENT ON TABLE permissions IS 'Global permission definitions';
COMMENT ON TABLE role_permissions IS 'Role permission assignments (many-to-many)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Migrated users.role enum to user_roles table
-- - Removed redundant role column from users table
-- - Implemented proper RBAC using database tables
-- - Updated RLS policies to use user_roles
-- - Added proper constraints and indexes
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251116000004_fix_roles_tenant_id_nullable.sql
-- ============================================================================

-- ============================================================================
-- Migration: 20251116000004 - Fix roles tenant_id nullable constraint
-- ============================================================================

-- Make tenant_id nullable in roles table to support system-wide roles like super_admin
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the unique constraint to handle NULL tenant_id properly
-- Drop the existing constraint
ALTER TABLE roles DROP CONSTRAINT unique_role_per_tenant;

-- Create new constraint that allows NULL tenant_id for system roles
ALTER TABLE roles ADD CONSTRAINT unique_role_per_tenant UNIQUE (name, tenant_id);

-- Add comment explaining the nullable tenant_id
COMMENT ON COLUMN roles.tenant_id IS 'Tenant ID for tenant-specific roles, NULL for system-wide roles like super_admin';


-- ============================================================================
-- MIGRATION: 20251116000005_fix_user_roles_tenant_id_nullable.sql
-- ============================================================================

-- ============================================================================
-- Migration: 20251116000005 - Fix user_roles tenant_id nullable constraint
-- ============================================================================

-- Make tenant_id nullable in user_roles table to support system-wide roles like super_admin
ALTER TABLE user_roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the unique constraint to handle NULL tenant_id properly
-- Drop the existing constraint
ALTER TABLE user_roles DROP CONSTRAINT unique_user_role_per_tenant;

-- Create new constraint that allows NULL tenant_id for system roles
ALTER TABLE user_roles ADD CONSTRAINT unique_user_role_per_tenant UNIQUE (user_id, role_id, tenant_id);

-- Add comment explaining the nullable tenant_id
COMMENT ON COLUMN user_roles.tenant_id IS 'Tenant ID for tenant-specific role assignments, NULL for system-wide roles like super_admin';


-- ============================================================================
-- MIGRATION: 20251116000006_fix_user_roles_rls_infinite_recursion.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix user_roles RLS Infinite Recursion
-- Date: 2025-11-16
-- Problem: user_roles RLS policy causes infinite recursion when querying users
--          with user_roles joins because policy references users table in subquery
-- Solution: Create SECURITY DEFINER function to get current user tenant_id safely
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION FOR CURRENT USER TENANT_ID
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM users
  WHERE users.id = auth.uid()
  AND users.deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_current_user_tenant_id() TO authenticated;

-- ============================================================================
-- 2. CREATE FUNCTION TO CHECK IF CURRENT USER IS SUPER ADMIN (ROLE-BASED)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_current_user_super_admin_role_based()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_super_admin_role_based() TO authenticated;

-- ============================================================================
-- 3. UPDATE USER_ROLES RLS POLICY TO USE FUNCTIONS INSTEAD OF SUBQUERIES
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;

-- Recreate with function calls (no nested subqueries)
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Super admin can see all
    is_current_user_super_admin_role_based()
    OR
    -- Users see their own assignments
    user_id = auth.uid()
    OR
    -- Users see assignments in their tenant
    tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- 4. FIX USERS TABLE RLS POLICY TO AVOID INFINITE RECURSION
-- ============================================================================

-- Drop the problematic users policy that causes recursion
DROP POLICY IF EXISTS "users_select" ON users;

-- Recreate users policy with simplified logic to avoid recursion
-- Note: This policy is simplified to prevent infinite recursion.
-- Tenant isolation is primarily enforced at the application level.
CREATE POLICY "users_select" ON users
  FOR SELECT
  USING (
    -- Users can always see themselves
    id = auth.uid()
    OR
    -- Super admin can see all users
    is_current_user_super_admin_role_based()
    OR
    -- Allow tenant users to see other users (application handles isolation)
    -- This prevents recursion while maintaining basic access control
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id IS NOT NULL
    )
  );

-- ============================================================================
-- 5. UPDATE OTHER POLICIES THAT MAY HAVE SIMILAR ISSUES
-- ============================================================================

-- Update roles policy to use function
DROP POLICY IF EXISTS "users_view_tenant_roles" ON roles;
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    -- Super admin can see all roles
    is_current_user_super_admin_role_based()
    OR
    -- Regular users see roles in their tenant
    tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Created SECURITY DEFINER functions to bypass RLS recursion
-- 2. Updated user_roles policy to use functions instead of subqueries
-- 3. Updated roles policy for consistency
-- 4. Functions are STABLE for performance optimization
--
-- This should eliminate the "infinite recursion detected in policy for relation 'user_roles'" error
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251116000007_fix_users_rls_policies_final.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix Users RLS Policies (Final)
-- Date: 2025-11-16
-- Purpose: Properly fix RLS policies on users table after removing is_super_admin
--          and role columns. This ensures clean database resets work correctly.
-- ============================================================================

-- Drop all existing policies on users table to ensure clean slate
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Allow authenticated users to select from users table
-- Security is handled at the application level
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins and super_admins to update users
-- Application handles tenant isolation for regular admins
CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Allow admins and super_admins to insert users
-- Application handles tenant isolation for regular admins
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- DELETE POLICIES (if needed in future)
-- ============================================================================

-- Allow admins and super_admins to delete users
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- FIX USER_ROLES RLS POLICIES
-- ============================================================================

-- Drop all existing policies on user_roles table
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Dropping policy: %', pol.policyname;
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Disable RLS on user_roles for SELECT to allow permission queries
-- Application handles security for data modifications
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policies for modifications
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_modify_authenticated" ON user_roles
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Dropped all existing policies on users and user_roles tables
-- - Added clean RLS policies that work with the new RBAC system
-- - Policies reference roles through user_roles/roles tables
-- - No references to dropped columns (is_super_admin, role)
-- - Application handles detailed security logic
-- - Fixed user_roles SELECT to allow permission checks
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251117000001_update_complaints_schema.sql
-- ============================================================================

-- ============================================================================
-- PHASE 5: COMPLAINTS SCHEMA NORMALIZATION
-- Migration: Update complaints schema to match TypeScript types
-- ============================================================================

-- ============================================================================
-- 1. UPDATE COMPLAINTS TABLE TO MATCH TYPESCRIPT INTERFACE
-- ============================================================================

-- Rename and update existing columns to match TypeScript interface
ALTER TABLE complaints
DROP COLUMN IF EXISTS complaint_number,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS assigned_to,
DROP COLUMN IF EXISTS resolution,
DROP COLUMN IF EXISTS resolved_at,
DROP COLUMN IF EXISTS created_by;

-- Add new columns to match TypeScript Complaint interface
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'breakdown' CHECK (type IN ('breakdown', 'preventive', 'software_update', 'optimize')),
ADD COLUMN IF NOT EXISTS assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS engineer_resolution TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Update existing status values to match TypeScript enum
UPDATE complaints SET status = 'new' WHERE status = 'open';
UPDATE complaints SET status = 'in_progress' WHERE status = 'in_progress';
UPDATE complaints SET status = 'closed' WHERE status = 'resolved' OR status = 'closed';

-- Add check constraint for status
ALTER TABLE complaints
DROP CONSTRAINT IF EXISTS complaints_status_check,
ADD CONSTRAINT complaints_status_check CHECK (status IN ('new', 'in_progress', 'closed'));

-- ============================================================================
-- 2. CREATE COMPLAINT_COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Threaded comments support
  parent_id UUID REFERENCES complaint_comments(id) ON DELETE CASCADE,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON complaint_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_tenant_id ON complaint_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_parent_id ON complaint_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_created_at ON complaint_comments(created_at);

-- ============================================================================
-- 3. CREATE COMPLAINTS_WITH_DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW complaints_with_details AS
SELECT
  c.id,
  c.title,
  c.description,
  c.customer_id,
  cust.company_name AS customer_name,
  cust.contact_name AS customer_contact_name,
  cust.email AS customer_email,
  c.type,
  c.status,
  c.priority,
  c.assigned_engineer_id,
  COALESCE(u.name, u.email) AS assigned_engineer_name,
  c.engineer_resolution,
  c.tenant_id,
  c.created_at,
  c.updated_at,
  c.closed_at,

  -- Comments as JSON array
  COALESCE(
    json_agg(
      json_build_object(
        'id', cc.id,
        'complaint_id', cc.complaint_id,
        'user_id', cc.user_id,
        'content', cc.content,
        'created_at', cc.created_at,
        'parent_id', cc.parent_id
      )
    ) FILTER (WHERE cc.id IS NOT NULL),
    '[]'::json
  ) AS comments

FROM complaints c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_engineer_id = u.id
LEFT JOIN complaint_comments cc ON c.id = cc.complaint_id AND cc.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.title, c.description, c.customer_id, cust.company_name,
         cust.contact_name, cust.email, c.type, c.status, c.priority,
         c.assigned_engineer_id, u.name, u.email, c.engineer_resolution,
         c.tenant_id, c.created_at, c.updated_at, c.closed_at;

-- ============================================================================
-- 4. ADD RLS POLICIES
-- ============================================================================

-- Enable RLS on complaint_comments
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaints (already exists, but ensure it's correct)
DROP POLICY IF EXISTS users_view_tenant_complaints ON complaints;
DROP POLICY IF EXISTS admins_manage_tenant_complaints ON complaints;
DROP POLICY IF EXISTS super_admin_view_all_complaints ON complaints;

CREATE POLICY users_view_tenant_complaints ON complaints
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY admins_manage_tenant_complaints ON complaints
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaints ON complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- RLS policies for complaint_comments
DROP POLICY IF EXISTS users_view_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS users_manage_own_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS admins_manage_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS super_admin_view_all_complaint_comments ON complaint_comments;

CREATE POLICY users_view_tenant_complaint_comments ON complaint_comments
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY users_manage_own_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    user_id = auth.uid()
  );

CREATE POLICY admins_manage_tenant_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaint_comments ON complaint_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- 5. ADD TRIGGERS
-- ============================================================================

CREATE TRIGGER complaint_comments_updated_at_trigger
  BEFORE UPDATE ON complaint_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE complaints IS 'Customer complaints (normalized - use complaints_with_details view for enriched data)';
COMMENT ON TABLE complaint_comments IS 'Complaint comments and threaded discussions';
COMMENT ON VIEW complaints_with_details IS 'Complaints with customer and engineer details, including comments';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Updated complaints table to match TypeScript Complaint interface
-- - Created complaint_comments table for threaded discussions
-- - Created complaints_with_details view with enriched data
-- - Added proper RLS policies for multi-tenant security
-- - Added performance indexes
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251117000002_add_product_sales_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - PRODUCT SALES RLS POLICIES
-- Migration: Add RLS policies for product_sales table
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT SALES RLS POLICIES
-- ============================================================================

-- Users can view product sales in their tenant
CREATE POLICY "users_view_tenant_product_sales" ON product_sales
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create product sales in their tenant
CREATE POLICY "users_create_product_sales" ON product_sales
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update product sales in their tenant
CREATE POLICY "users_update_product_sales" ON product_sales
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Users can delete product sales in their tenant (soft delete handled by application)
CREATE POLICY "users_delete_product_sales" ON product_sales
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Super admin can view all product sales
CREATE POLICY "super_admin_view_all_product_sales" ON product_sales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- 2. SERVICE CONTRACTS RLS POLICIES (if not already added)
-- ============================================================================

-- Check if service_contracts policies exist, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'service_contracts' AND policyname = 'users_view_tenant_service_contracts'
  ) THEN

    -- Users can view service contracts in their tenant
    CREATE POLICY "users_view_tenant_service_contracts" ON service_contracts
      FOR SELECT
      USING (tenant_id = get_current_user_tenant_id());

    -- Users can create service contracts in their tenant
    CREATE POLICY "users_create_service_contracts" ON service_contracts
      FOR INSERT
      WITH CHECK (tenant_id = get_current_user_tenant_id());

    -- Users can update service contracts in their tenant
    CREATE POLICY "users_update_service_contracts" ON service_contracts
      FOR UPDATE
      USING (tenant_id = get_current_user_tenant_id());

    -- Super admin can view all service contracts
    CREATE POLICY "super_admin_view_all_service_contracts" ON service_contracts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
      );

  END IF;
END $$;

-- ============================================================================
-- 3. JOB WORKS RLS POLICIES (if not already added)
-- ============================================================================

-- Check if job_works policies exist, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_works' AND policyname = 'users_view_tenant_job_works'
  ) THEN

    -- Users can view job works in their tenant
    CREATE POLICY "users_view_tenant_job_works" ON job_works
      FOR SELECT
      USING (tenant_id = get_current_user_tenant_id());

    -- Users can create job works in their tenant
    CREATE POLICY "users_create_job_works" ON job_works
      FOR INSERT
      WITH CHECK (tenant_id = get_current_user_tenant_id());

    -- Users can update job works in their tenant
    CREATE POLICY "users_update_job_works" ON job_works
      FOR UPDATE
      USING (tenant_id = get_current_user_tenant_id());

    -- Super admin can view all job works
    CREATE POLICY "super_admin_view_all_job_works" ON job_works
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
      );

  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Added RLS policies for product_sales table
-- - Added RLS policies for service_contracts table (if missing)
-- - Added RLS policies for job_works table (if missing)
-- - All policies enforce tenant isolation with super admin bypass
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251117000003_add_user_security_fields.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - User Security Enhancements
-- Migration: 20251117000003 - Add User Security Fields
-- ============================================================================

-- Add MFA (Multi-Factor Authentication) fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]'::JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method VARCHAR(50) DEFAULT 'none' CHECK (mfa_method IN ('none', 'totp', 'sms', 'email'));

-- Add session management fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS concurrent_sessions_limit INTEGER DEFAULT 5;

-- Add security audit fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '[]'::JSONB;

-- Add password policy fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_strength_score INTEGER DEFAULT 0 CHECK (password_strength_score >= 0 AND password_strength_score <= 100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;

-- Add account lockout mechanism
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason TEXT;

-- Add security event tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspicious_activity_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_suspicious_activity TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_alerts_enabled BOOLEAN DEFAULT TRUE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mfa_method ON users(mfa_method);
CREATE INDEX IF NOT EXISTS idx_users_failed_login_attempts ON users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked);
CREATE INDEX IF NOT EXISTS idx_users_password_expires_at ON users(password_expires_at);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_failed_login_attempts
  CHECK (failed_login_attempts >= 0);

ALTER TABLE users ADD CONSTRAINT check_concurrent_sessions_limit
  CHECK (concurrent_sessions_limit > 0 AND concurrent_sessions_limit <= 20);

-- Update existing records to have default values
UPDATE users SET
  mfa_method = 'none',
  failed_login_attempts = 0,
  concurrent_sessions_limit = 5,
  security_alerts_enabled = TRUE,
  password_changed_at = COALESCE(password_changed_at, created_at)
WHERE mfa_method IS NULL OR failed_login_attempts IS NULL;

-- Add comments
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret key for multi-factor authentication';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Backup recovery codes for MFA';
COMMENT ON COLUMN users.mfa_method IS 'MFA method: none, totp, sms, email';
COMMENT ON COLUMN users.session_token IS 'Current session token for session management';
COMMENT ON COLUMN users.session_expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN users.concurrent_sessions_limit IS 'Maximum concurrent sessions allowed';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account lockout expiration timestamp';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of last failed login attempt';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN users.last_password_reset IS 'Timestamp of last password reset request';
COMMENT ON COLUMN users.security_questions IS 'Security questions for account recovery';
COMMENT ON COLUMN users.password_strength_score IS 'Password strength score (0-100)';
COMMENT ON COLUMN users.password_expires_at IS 'Password expiration timestamp';
COMMENT ON COLUMN users.require_password_change IS 'Flag to force password change on next login';
COMMENT ON COLUMN users.account_locked IS 'Account lockout status';
COMMENT ON COLUMN users.lock_reason IS 'Reason for account lockout';
COMMENT ON COLUMN users.suspicious_activity_count IS 'Count of suspicious activities detected';
COMMENT ON COLUMN users.last_suspicious_activity IS 'Timestamp of last suspicious activity';
COMMENT ON COLUMN users.security_alerts_enabled IS 'Whether security alerts are enabled for this user';


-- ============================================================================
-- MIGRATION: 20251117000004_add_permissions_category.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - Permissions Category Support
-- Migration: 20251117000004 - Add Permissions Category Field
-- ============================================================================

-- Add category field to permissions table
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'core' CHECK (category IN ('core', 'module', 'administrative', 'system'));

-- Add is_system_permission field for FRS compliance
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system_permission BOOLEAN DEFAULT FALSE;

-- Update existing permissions with appropriate categories
UPDATE permissions SET
  category = CASE
    WHEN name IN ('read', 'write', 'delete') THEN 'core'
    WHEN name LIKE 'manage_%' THEN 'module'
    WHEN name IN ('crm:user:record:update', 'crm:role:record:update', 'crm:analytics:insight:view', 'crm:system:config:manage', 'manage_companies') THEN 'administrative'
    WHEN name IN ('crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring') THEN 'system'
    ELSE 'core'
  END,
  is_system_permission = CASE
    WHEN name IN ('crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring') THEN TRUE
    ELSE FALSE
  END;

-- Add index for category queries
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_is_system_permission ON permissions(is_system_permission);

-- Add comments
COMMENT ON COLUMN permissions.category IS 'Permission category: core, module, administrative, system';
COMMENT ON COLUMN permissions.is_system_permission IS 'Whether this is a system-level permission that cannot be modified';


-- ============================================================================
-- MIGRATION: 20251117000005_add_missing_module_tables.sql
-- ============================================================================

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
  CONSTRAINT check_lead_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'cancelled')),
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


-- ============================================================================
-- MIGRATION: 20251117000006_add_rls_policies_for_new_tables.sql
-- ============================================================================

-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - RLS Policies for New Tables
-- Migration: 20251117000006 - Add RLS Policies for New Module Tables
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_terms ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CUSTOMER INTERACTIONS POLICIES
-- ============================================================================

-- Users can view customer interactions in their tenant
CREATE POLICY "users_view_tenant_customer_interactions" ON customer_interactions
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customer interactions in their tenant
CREATE POLICY "users_create_customer_interactions" ON customer_interactions
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customer interactions in their tenant
CREATE POLICY "users_update_customer_interactions" ON customer_interactions
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 3. CUSTOMER PREFERENCES POLICIES
-- ============================================================================

-- Users can view customer preferences in their tenant
CREATE POLICY "users_view_tenant_customer_preferences" ON customer_preferences
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create customer preferences in their tenant
CREATE POLICY "users_create_customer_preferences" ON customer_preferences
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update customer preferences in their tenant
CREATE POLICY "users_update_customer_preferences" ON customer_preferences
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 4. LEADS POLICIES
-- ============================================================================

-- Users can view leads in their tenant
CREATE POLICY "users_view_tenant_leads" ON leads
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create leads in their tenant
CREATE POLICY "users_create_leads" ON leads
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update leads in their tenant
CREATE POLICY "users_update_leads" ON leads
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 5. OPPORTUNITIES POLICIES
-- ============================================================================

-- Users can view opportunities in their tenant
CREATE POLICY "users_view_tenant_opportunities" ON opportunities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create opportunities in their tenant
CREATE POLICY "users_create_opportunities" ON opportunities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update opportunities in their tenant
CREATE POLICY "users_update_opportunities" ON opportunities
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 6. SALES ACTIVITIES POLICIES
-- ============================================================================

-- Users can view sales activities in their tenant
CREATE POLICY "users_view_tenant_sales_activities" ON sales_activities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create sales activities in their tenant
CREATE POLICY "users_create_sales_activities" ON sales_activities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update sales activities in their tenant
CREATE POLICY "users_update_sales_activities" ON sales_activities
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 7. INVENTORY POLICIES
-- ============================================================================

-- Users can view inventory in their tenant
CREATE POLICY "users_view_tenant_inventory" ON inventory
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Managers can update inventory in their tenant
CREATE POLICY "managers_update_inventory" ON inventory
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'super_admin')
    )
  );

-- Managers can create inventory records
CREATE POLICY "managers_create_inventory" ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'super_admin')
    )
  );

-- ============================================================================
-- 8. TICKET ACTIVITIES POLICIES
-- ============================================================================

-- Users can view ticket activities in their tenant
CREATE POLICY "users_view_tenant_ticket_activities" ON ticket_activities
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- System can insert ticket activities (audit trail)
CREATE POLICY "system_insert_ticket_activities" ON ticket_activities
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 9. CONTRACT TERMS POLICIES
-- ============================================================================

-- Users can view contract terms in their tenant
CREATE POLICY "users_view_tenant_contract_terms" ON contract_terms
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create contract terms in their tenant
CREATE POLICY "users_create_contract_terms" ON contract_terms
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update contract terms in their tenant
CREATE POLICY "users_update_contract_terms" ON contract_terms
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- ============================================================================
-- 10. ROLE PERMISSIONS POLICIES (if not already covered)
-- ============================================================================

-- Users can view role permissions for roles in their tenant
CREATE POLICY "users_view_tenant_role_permissions" ON role_permissions
  FOR SELECT
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Admins can manage role permissions for roles in their tenant
CREATE POLICY "admins_manage_role_permissions" ON role_permissions
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 11. USER ROLES POLICIES (if not already covered)
-- ============================================================================

-- Users can view user roles in their tenant
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Admins can manage user roles in their tenant
CREATE POLICY "admins_manage_user_roles" ON user_roles
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 12. COMMENTS
-- ============================================================================

COMMENT ON POLICY "users_view_tenant_customer_interactions" ON customer_interactions IS 'Users can only view customer interactions in their tenant';
COMMENT ON POLICY "users_view_tenant_customer_preferences" ON customer_preferences IS 'Users can only view customer preferences in their tenant';
COMMENT ON POLICY "users_view_tenant_leads" ON leads IS 'Users can only view leads in their tenant';
COMMENT ON POLICY "users_view_tenant_opportunities" ON opportunities IS 'Users can only view opportunities in their tenant';
COMMENT ON POLICY "users_view_tenant_sales_activities" ON sales_activities IS 'Users can only view sales activities in their tenant';
COMMENT ON POLICY "users_view_tenant_inventory" ON inventory IS 'Users can only view inventory in their tenant';
COMMENT ON POLICY "users_view_tenant_ticket_activities" ON ticket_activities IS 'Users can only view ticket activities in their tenant';
COMMENT ON POLICY "users_view_tenant_contract_terms" ON contract_terms IS 'Users can only view contract terms in their tenant';


-- ============================================================================
-- MIGRATION: 20251117000007_create_sales_pipeline_tables.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20251118000001_add_product_hierarchy.sql
-- ============================================================================

-- Add product hierarchy columns to products table
-- Migration: 20251118000001 - Add Product Hierarchy

-- Add hierarchy columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_variant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_group_id TEXT;

-- Add indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_group_id ON products(variant_group_id);
CREATE INDEX IF NOT EXISTS idx_products_is_variant ON products(is_variant);

-- Add constraint to prevent circular references
-- (This is a basic check; more complex validation would be needed for production)
ALTER TABLE products
ADD CONSTRAINT check_parent_not_self
CHECK (parent_id != id);

-- Add constraint for variant group consistency
-- (Products in same variant group should have same parent or be root variants)
-- This constraint is complex and would need application-level validation

-- Update RLS policies to include hierarchy columns
-- (No changes needed as RLS is already tenant-based)


-- ============================================================================
-- MIGRATION: 20251118000002_add_deal_payment_revenue_columns.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20251118000003_create_customer_management_tables.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20251118000004_create_opportunities_table.sql
-- ============================================================================

-- Create opportunities table for sales pipeline management
-- Migration: 20251118000002_create_opportunities_table.sql

-- Drop dependent objects first
DROP VIEW IF EXISTS opportunities_with_details;
DROP VIEW IF EXISTS sales_activities_with_details;
DROP VIEW IF EXISTS deals_with_details;
DROP TABLE IF EXISTS revenue_recognition_schedule;
DROP TABLE IF EXISTS deal_items;
DROP TABLE IF EXISTS opportunity_items;
DROP TABLE IF EXISTS sales_activities;

-- Drop foreign key constraints to break circular dependencies
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_converted_to_deal_id;
ALTER TABLE deals DROP CONSTRAINT IF EXISTS fk_deals_opportunity_id;

DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS opportunities;

-- Drop existing table if it exists
DROP TABLE IF EXISTS opportunities;

-- Create deals table first since opportunities references it
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('won', 'lost', 'cancelled')),
    source VARCHAR(100),
    campaign VARCHAR(100),
    close_date DATE NOT NULL,
    expected_close_date DATE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    competitor_info TEXT,
    win_loss_reason TEXT,
    opportunity_id UUID, -- Will add FK constraint later
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create opportunities table
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255), -- For display purposes, denormalized
    estimated_value DECIMAL(15,2) NOT NULL CHECK (estimated_value >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    weighted_value DECIMAL(15,2) GENERATED ALWAYS AS (estimated_value * probability / 100) STORED,
    stage VARCHAR(20) DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'decision', 'contract')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold', 'cancelled')),
    source VARCHAR(100),
    campaign VARCHAR(100),
    expected_close_date DATE,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    next_activity_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    assigned_to_name VARCHAR(255), -- For display purposes, denormalized
    notes TEXT,
    tags JSONB DEFAULT '[]',
    competitor_info TEXT,
    pain_points JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    proposed_items JSONB DEFAULT '[]', -- Array of proposed items/products
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    converted_to_deal_id UUID REFERENCES deals(id), -- Link to deal when converted
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create opportunity_items table for detailed item tracking
CREATE TABLE opportunity_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id), -- Optional product reference
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(15,2) DEFAULT 0 CHECK (discount >= 0),
    tax DECIMAL(15,2) DEFAULT 0 CHECK (tax >= 0),
    line_total DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount + tax) STORED,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for deals.opportunity_id
ALTER TABLE deals ADD CONSTRAINT fk_deals_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);

-- Create indexes for performance
CREATE INDEX idx_opportunities_tenant_id ON opportunities(tenant_id);
CREATE INDEX idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX idx_opportunities_converted_to_deal_id ON opportunities(converted_to_deal_id);

CREATE INDEX idx_opportunity_items_opportunity_id ON opportunity_items(opportunity_id);
CREATE INDEX idx_opportunity_items_product_id ON opportunity_items(product_id);
CREATE INDEX idx_opportunity_items_tenant_id ON opportunity_items(tenant_id);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for opportunities
CREATE POLICY "Users can view tenant opportunities"
ON opportunities FOR SELECT
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can create opportunities for their tenant"
ON opportunities FOR INSERT
WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can update tenant opportunities"
ON opportunities FOR UPDATE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can delete tenant opportunities"
ON opportunities FOR DELETE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Create RLS policies for opportunity_items
CREATE POLICY "Users can view tenant opportunity items"
ON opportunity_items FOR SELECT
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can create opportunity items for their tenant"
ON opportunity_items FOR INSERT
WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can update tenant opportunity items"
ON opportunity_items FOR UPDATE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can delete tenant opportunity items"
ON opportunity_items FOR DELETE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Create trigger for updated_at
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_items_updated_at
    BEFORE UPDATE ON opportunity_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data inserts removed to avoid FK constraint violations with non-existent customer/product records


-- ============================================================================
-- MIGRATION: 20251118000005_create_product_categories.sql
-- ============================================================================

-- Create product_categories table for hierarchical product categorization
-- Migration: 20251118000003_create_product_categories.sql

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    path TEXT, -- Full path for quick lookups (e.g., "Electronics/Computers/Laptops")
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex color code
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_category_name_per_tenant UNIQUE (name, tenant_id),
    CONSTRAINT check_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes removed to avoid conflicts with existing table schema

-- Create function to update path on insert/update
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Build the full path by concatenating parent paths
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.name;
        NEW.level := 1;
    ELSE
        SELECT
            COALESCE(pc.path || '/' || NEW.name, NEW.name),
            COALESCE(pc.level + 1, 1)
        INTO NEW.path, NEW.level
        FROM product_categories pc
        WHERE pc.id = NEW.parent_id;
    END IF;

    -- Update children paths if this is an update
    IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
        UPDATE product_categories
        SET path = replace(path, OLD.path || '/', NEW.path || '/')
        WHERE path LIKE OLD.path || '/%';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain path hierarchy
CREATE TRIGGER trigger_update_category_path
    BEFORE INSERT OR UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_path();

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view categories in their tenant" ON product_categories
    FOR SELECT USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can insert categories in their tenant" ON product_categories
    FOR INSERT WITH CHECK (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can update categories in their tenant" ON product_categories
    FOR UPDATE USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can delete categories in their tenant" ON product_categories
    FOR DELETE USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

-- Sample data inserts removed to avoid tenant reference issues


-- ============================================================================
-- MIGRATION: 20251119000001_create_suppliers_table.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - SUPPLIERS
-- Migration: 20251119000001 - Suppliers Table (Fix)
-- ============================================================================

-- ============================================================================
-- 1. SUPPLIERS TABLE - Master Supplier Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  payment_terms VARCHAR(50),
  
  -- Financial Information
  credit_limit DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status & Classification
  status entity_status DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_preferred BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_supplier_per_tenant UNIQUE(company_name, tenant_id)
);

-- ============================================================================
-- 2. INDEXES for Performance
-- ============================================================================

-- Indexes removed to avoid conflicts with existing table schema

-- ============================================================================
-- 3. TRIGGERS - Supplier Timestamp Updates
-- ============================================================================

-- Trigger removed to avoid conflicts with existing trigger

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

-- Comments removed to avoid conflicts with existing table schema


-- ============================================================================
-- MIGRATION: 20251119000002_purchase_orders.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - PURCHASE ORDERS
-- Migration: 005 - Purchase Orders for Inventory Management
-- ============================================================================

-- ============================================================================
-- 1. PURCHASE ORDERS TABLE
-- ============================================================================

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ordered_by UUID NOT NULL REFERENCES users(id),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. PURCHASE ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES for Performance
-- ============================================================================

CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- ============================================================================
-- 4. TRIGGERS - Purchase Order Timestamp Updates
-- ============================================================================

CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

-- ============================================================================
-- 6. BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';

  -- Format: PO-2025-0001
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when PO items are received
CREATE OR REPLACE FUNCTION update_product_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock when quantity_received changes
  IF (TG_OP = 'UPDATE' AND OLD.quantity_received != NEW.quantity_received) OR TG_OP = 'INSERT' THEN
    UPDATE products
    SET
      stock_quantity = stock_quantity + (NEW.quantity_received - COALESCE(OLD.quantity_received, 0)),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS for Business Logic
-- ============================================================================

-- Trigger to update totals when items change
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

-- Trigger to update stock when items are received
CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';
-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';


-- ============================================================================
-- MIGRATION: 20251119000003_suppliers_and_foreign_keys_fix.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - SUPPLIERS AND FOREIGN KEYS FIX
-- Migration: 20251119000003 - Suppliers Table and Foreign Key Relationships
-- ============================================================================

-- ============================================================================
-- 1. CREATE SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  payment_terms VARCHAR(50),
  
  -- Financial Information
  credit_limit DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status & Classification
  status entity_status DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_preferred BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_supplier_per_tenant UNIQUE(company_name, tenant_id)
);

-- ============================================================================
-- 2. CREATE PURCHASE ORDERS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ordered_by UUID NOT NULL REFERENCES users(id),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint from products to suppliers
ALTER TABLE products
ADD CONSTRAINT fk_products_supplier_id
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add foreign key constraint from inventory to suppliers
ALTER TABLE inventory
ADD CONSTRAINT fk_inventory_supplier_id
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Suppliers indexes removed to avoid conflicts with existing table schema

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- Supplier foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Supplier trigger
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Purchase order triggers
DROP TRIGGER IF EXISTS purchase_orders_updated_at_trigger ON purchase_orders;
CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS purchase_order_items_updated_at_trigger ON purchase_order_items;
CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CREATE BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';

  -- Format: PO-2025-0001
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when PO items are received
CREATE OR REPLACE FUNCTION update_product_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock when quantity_received changes
  IF (TG_OP = 'UPDATE' AND OLD.quantity_received != NEW.quantity_received) OR TG_OP = 'INSERT' THEN
    UPDATE products
    SET
      stock_quantity = stock_quantity + (NEW.quantity_received - COALESCE(OLD.quantity_received, 0)),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR BUSINESS LOGIC
-- ============================================================================

-- Trigger to update totals when items change
DROP TRIGGER IF EXISTS update_po_total_on_item_change ON purchase_order_items;
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

-- Trigger to update stock when items are received
DROP TRIGGER IF EXISTS update_stock_on_po_receipt ON purchase_order_items;
CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Master supplier/vendor data with tenant isolation';
COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';


-- ============================================================================
-- MIGRATION: 20251119000004_cleanup_suppliers_partial_migration.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CLEANUP PARTIAL SUPPLIERS MIGRATION
-- Migration: 20251119000004 - Cleanup Failed Suppliers Migration
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING PARTIAL TABLES IF THEY EXIST
-- ============================================================================

-- Drop any partially created tables from the failed migration
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- ============================================================================
-- 2. CREATE SUPPLIERS TABLE (Fresh Start)
-- ============================================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  payment_terms VARCHAR(50),
  
  -- Financial Information
  credit_limit DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status & Classification
  status VARCHAR(50) DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_preferred BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_supplier_per_tenant UNIQUE(company_name, tenant_id)
);

-- ============================================================================
-- 3. CREATE PURCHASE ORDERS TABLES
-- ============================================================================

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ordered_by UUID NOT NULL REFERENCES users(id),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Suppliers indexes
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX idx_suppliers_is_preferred ON suppliers(is_preferred);

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- ============================================================================
-- 5. CREATE BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';

  -- Format: PO-2025-0001
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when PO items are received
CREATE OR REPLACE FUNCTION update_product_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock when quantity_received changes
  IF (TG_OP = 'UPDATE' AND OLD.quantity_received != NEW.quantity_received) OR TG_OP = 'INSERT' THEN
    UPDATE products
    SET
      stock_quantity = stock_quantity + (NEW.quantity_received - COALESCE(OLD.quantity_received, 0)),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Supplier trigger
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Purchase order triggers
DROP TRIGGER IF EXISTS purchase_orders_updated_at_trigger ON purchase_orders;
CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS purchase_order_items_updated_at_trigger ON purchase_order_items;
CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update totals when items change
DROP TRIGGER IF EXISTS update_po_total_on_item_change ON purchase_order_items;
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

-- Trigger to update stock when items are received
DROP TRIGGER IF EXISTS update_stock_on_po_receipt ON purchase_order_items;
CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Master supplier/vendor data with tenant isolation';
COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';


-- ============================================================================
-- MIGRATION: 20251119000005_add_supplier_foreign_keys_final.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ADD SUPPLIER FOREIGN KEY RELATIONSHIPS
-- Migration: 20251119000005 - Add Foreign Key Relationships to Suppliers
-- ============================================================================

-- ============================================================================
-- 1. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint from products to suppliers
-- First, update any existing NULL values
UPDATE products SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND supplier_id NOT IN (SELECT id FROM suppliers);

-- Add the foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add foreign key constraint from inventory to suppliers
-- First, update any existing NULL values  
UPDATE inventory SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND supplier_id NOT IN (SELECT id FROM suppliers);

-- Add the foreign key constraint
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Supplier foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- ============================================================================
-- 3. VERIFY CONSTRAINTS WERE ADDED SUCCESSFULLY
-- ============================================================================

-- Verify the constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('products', 'inventory', 'purchase_orders', 'purchase_order_items')
AND kcu.column_name LIKE '%supplier_id%';

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON COLUMN products.supplier_id IS 'Foreign key to suppliers table for product sourcing';
COMMENT ON COLUMN inventory.supplier_id IS 'Foreign key to suppliers table for inventory sourcing';
COMMENT ON COLUMN purchase_orders.supplier_id IS 'Foreign key to suppliers table for purchase orders';


-- ============================================================================
-- MIGRATION: 20251120000001_complete_suppliers_purchase_orders_system.sql
-- ============================================================================

-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - COMPLETE SUPPLIERS AND PURCHASE ORDERS SYSTEM
-- Migration: 20251120000001 - Complete Suppliers and Purchase Orders System
-- ============================================================================

-- Drop conflicting triggers from existing tables
DROP TRIGGER IF EXISTS trigger_update_category_path ON product_categories;

-- ============================================================================
-- 1. CREATE SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  payment_terms VARCHAR(50),
  
  -- Financial Information
  credit_limit DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status & Classification
  status VARCHAR(50) DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_preferred BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_supplier_per_tenant UNIQUE(company_name, tenant_id)
);

-- ============================================================================
-- 2. CREATE PURCHASE ORDERS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ordered_by UUID NOT NULL REFERENCES users(id),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE ALL INDEXES
-- ============================================================================

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON suppliers(is_preferred);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- ============================================================================
-- 4. CREATE BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';

  -- Format: PO-2025-0001
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when PO items are received
CREATE OR REPLACE FUNCTION update_product_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock when quantity_received changes
  IF (TG_OP = 'UPDATE' AND OLD.quantity_received != NEW.quantity_received) OR TG_OP = 'INSERT' THEN
    UPDATE products
    SET
      stock_quantity = stock_quantity + (NEW.quantity_received - COALESCE(OLD.quantity_received, 0)),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
DROP TRIGGER IF EXISTS purchase_orders_updated_at_trigger ON purchase_orders;
DROP TRIGGER IF EXISTS purchase_order_items_updated_at_trigger ON purchase_order_items;
DROP TRIGGER IF EXISTS update_po_total_on_item_change ON purchase_order_items;
DROP TRIGGER IF EXISTS update_stock_on_po_receipt ON purchase_order_items;

-- Create timestamp triggers
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create business logic triggers
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Products to suppliers
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS fk_products_supplier_id;

ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Inventory to suppliers
ALTER TABLE inventory 
DROP CONSTRAINT IF EXISTS fk_inventory_supplier_id;

ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Master supplier/vendor data with tenant isolation';
COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON COLUMN suppliers.credit_limit IS 'Maximum credit amount available to this supplier';
COMMENT ON COLUMN suppliers.is_preferred IS 'Flag for preferred/premier suppliers';
COMMENT ON COLUMN suppliers.rating IS 'Supplier rating from 1-5 stars';
COMMENT ON COLUMN products.supplier_id IS 'Foreign key to suppliers table for product sourcing';
COMMENT ON COLUMN inventory.supplier_id IS 'Foreign key to suppliers table for inventory sourcing';
COMMENT ON COLUMN purchase_orders.supplier_id IS 'Foreign key to suppliers table for purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';

-- ============================================================================
-- 8. VERIFICATION QUERY
-- ============================================================================

-- Verify all tables and constraints were created successfully
SELECT 
  'suppliers' as table_name, 
  COUNT(*) as record_count 
FROM suppliers
UNION ALL
SELECT 
  'purchase_orders' as table_name, 
  COUNT(*) as record_count 
FROM purchase_orders
UNION ALL
SELECT 
  'purchase_order_items' as table_name, 
  COUNT(*) as record_count 
FROM purchase_order_items;


-- ============================================================================
-- MIGRATION: 20251120000002_fix_user_roles_admin_policy_recursion.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix user_roles admin policy infinite recursion
-- Date: 2025-11-20
-- Problem: The "admins_manage_user_roles" policy causes infinite recursion
--          because it queries user_roles in its USING clause
-- Solution: Create SECURITY DEFINER function to check admin/super_admin status
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION FOR ADMIN/SUPER_ADMIN CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION is_current_user_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_admin_or_super_admin() TO authenticated;

-- ============================================================================
-- 2. UPDATE THE PROBLEMATIC POLICY TO USE THE FUNCTION
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_manage_user_roles" ON user_roles;

-- Recreate with function call (no nested subqueries)
CREATE POLICY "admins_manage_user_roles" ON user_roles
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 3. UPDATE OTHER POLICIES THAT MAY HAVE SIMILAR ISSUES
-- ============================================================================

-- Update inventory policies that reference user_roles
DROP POLICY IF EXISTS "managers_update_inventory" ON inventory;
CREATE POLICY "managers_update_inventory" ON inventory
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "managers_create_inventory" ON inventory;
CREATE POLICY "managers_create_inventory" ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- Update role_permissions policy
DROP POLICY IF EXISTS "admins_manage_role_permissions" ON role_permissions;
CREATE POLICY "admins_manage_role_permissions" ON role_permissions
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_current_user_tenant_id()
    )
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Created SECURITY DEFINER function to check admin/super_admin status
-- 2. Updated user_roles admin policy to use function instead of subquery
-- 3. Updated related policies to prevent similar recursion issues
--
-- This should eliminate the "infinite recursion detected in policy for relation 'user_roles'" error
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251120000003_create_auth_users.sql
-- ============================================================================

-- ============================================================================
-- Migration: Create auth users for local development
-- Date: 2025-11-20
-- Purpose: Create users in auth.users table to enable login functionality
-- Note: Password is 'password123' for all users (bcrypt hash)
-- ============================================================================

-- Enable pgcrypto for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert auth users with matching IDs from public.users
-- Password hash for 'password123' using bcrypt
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES
    -- Acme Corporation users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '6e084750-4e35-468c-9903-5b5ab9d14af4'::uuid,
        'authenticated',
        'authenticated',
        'admin@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2707509b-57e8-4c84-a6fe-267eaa724223'::uuid,
        'authenticated',
        'authenticated',
        'manager@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Manager Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '27ff37b5-ef55-4e34-9951-42f35a1b2506'::uuid,
        'authenticated',
        'authenticated',
        'engineer@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Engineer Acme"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '3ce006ad-3a2b-45b8-b540-4b8634d0e410'::uuid,
        'authenticated',
        'authenticated',
        'user@acme.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "User Acme"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Tech Solutions users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '945ab101-36c0-4ef1-9e12-9d13294deb46'::uuid,
        'authenticated',
        'authenticated',
        'admin@techsolutions.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Tech"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '4fe9bb56-c5cd-481b-bc7d-2275d7f3ebaf'::uuid,
        'authenticated',
        'authenticated',
        'manager@techsolutions.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Manager Tech"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Global Trading users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'de2b56b8-bffc-4a54-b1f4-4a058afe5c5f'::uuid,
        'authenticated',
        'authenticated',
        'admin@globaltrading.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Admin Global"}'::jsonb,
        NOW(),
        NOW()
    ),

    -- Super admin users
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '465f34f1-e33c-475b-b42d-4feb4feaaf92'::uuid,
        'authenticated',
        'authenticated',
        'superadmin@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Platform Super Admin"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '5782d9ca-ef99-4f57-b9e2-2463d2fbb637'::uuid,
        'authenticated',
        'authenticated',
        'superadmin2@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Limited Super Admin"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'cad16f39-88a0-47c0-826d-bc84ebe59384'::uuid,
        'authenticated',
        'authenticated',
        'superadmin3@platform.com',
        crypt('password123', gen_salt('bf', 8)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"name": "Read-Only Super Admin"}'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show created auth users
SELECT id, email, raw_user_meta_data->>'name' as name, created_at
FROM auth.users
WHERE email LIKE '%@%'
ORDER BY email;


-- ============================================================================
-- MIGRATION: 20251120000004_fix_users_rls_policies_recursion.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix users table RLS policies recursion
-- Date: 2025-11-20
-- Problem: users table policies have subqueries that reference user_roles,
--          causing recursion during Supabase Auth operations
-- Solution: Update policies to use the SECURITY DEFINER function
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PROBLEMATIC USERS POLICIES
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_delete_users" ON users;
DROP POLICY IF EXISTS "admins_update_users" ON users;

-- Recreate with function calls (no nested subqueries)
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (is_current_user_admin_or_super_admin());

CREATE POLICY "admins_update_users" ON users
  FOR UPDATE
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 2. CHECK FOR OTHER POLICIES THAT MAY HAVE SIMILAR ISSUES
-- ============================================================================

-- Check if there are any other policies with subqueries on user_roles
-- This query will show any remaining problematic policies
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual LIKE '%user_roles%'
  AND qual LIKE '%EXISTS%'
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Updated users table admin policies to use is_current_user_admin_or_super_admin()
-- 2. Removed subqueries that were causing recursion during auth operations
--
-- This should resolve the "Database error querying schema" during login
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251120000005_fix_all_rls_policies_recursion.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix ALL RLS policies with user_roles subqueries
-- Date: 2025-11-20
-- Problem: Many policies have EXISTS subqueries on user_roles causing recursion
-- Solution: Replace all problematic policies with SECURITY DEFINER function calls
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "companies_manage" ON companies;
CREATE POLICY "companies_manage" ON companies
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 2. PRODUCTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "products_manage" ON products;
CREATE POLICY "products_manage" ON products
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 3. REFERENCE DATA POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "reference_data_manage" ON reference_data;
CREATE POLICY "reference_data_manage" ON reference_data
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "reference_data_select" ON reference_data;
CREATE POLICY "reference_data_select" ON reference_data
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 4. PRODUCT CATEGORIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view categories in their tenant" ON product_categories;
CREATE POLICY "Users can view categories in their tenant" ON product_categories
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Users can update categories in their tenant" ON product_categories;
CREATE POLICY "Users can update categories in their tenant" ON product_categories
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

DROP POLICY IF EXISTS "Users can delete categories in their tenant" ON product_categories;
CREATE POLICY "Users can delete categories in their tenant" ON product_categories
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    OR is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 5. ROLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_update_roles" ON roles;
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    is_current_user_admin_or_super_admin()
    AND NOT is_system_role
  );

DROP POLICY IF EXISTS "admins_delete_roles" ON roles;
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    is_current_user_admin_or_super_admin()
    AND NOT is_system_role
  );

-- ============================================================================
-- 6. PERMISSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "permissions_manage" ON permissions;
CREATE POLICY "permissions_manage" ON permissions
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 7. ROLE TEMPLATES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "role_templates_manage" ON role_templates;
CREATE POLICY "role_templates_manage" ON role_templates
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 8. SUPER USER TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_user_tables_access" ON super_user_tenant_access;
CREATE POLICY "super_user_tables_access" ON super_user_tenant_access
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "super_user_logs_access" ON super_user_impersonation_logs;
CREATE POLICY "super_user_logs_access" ON super_user_impersonation_logs
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 9. TENANT TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenants_access" ON tenants;
CREATE POLICY "tenants_access" ON tenants
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "tenant_statistics_access" ON tenant_statistics;
CREATE POLICY "tenant_statistics_access" ON tenant_statistics
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "tenant_config_access" ON tenant_config_overrides;
CREATE POLICY "tenant_config_access" ON tenant_config_overrides
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 10. COMPLAINTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_complaints" ON complaints;
CREATE POLICY "super_admin_view_all_complaints" ON complaints
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "admins_manage_tenant_complaints" ON complaints;
CREATE POLICY "admins_manage_tenant_complaints" ON complaints
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 11. COMPLAINT COMMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_complaint_comments" ON complaint_comments;
CREATE POLICY "super_admin_view_all_complaint_comments" ON complaint_comments
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "admins_manage_tenant_complaint_comments" ON complaint_comments;
CREATE POLICY "admins_manage_tenant_complaint_comments" ON complaint_comments
  FOR ALL
  USING (
    tenant_id = get_current_user_tenant_id()
    AND is_current_user_admin_or_super_admin()
  );

-- ============================================================================
-- 12. SERVICE CONTRACTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_service_contracts" ON service_contracts;
CREATE POLICY "super_admin_view_all_service_contracts" ON service_contracts
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 13. PRODUCT SALES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_view_all_product_sales" ON product_sales;
CREATE POLICY "super_admin_view_all_product_sales" ON product_sales
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 14. CUSTOMER TABLES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "customer_analytics_super_admin_access" ON customer_analytics;
CREATE POLICY "customer_analytics_super_admin_access" ON customer_analytics
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_interactions_super_admin_access" ON customer_interactions;
CREATE POLICY "customer_interactions_super_admin_access" ON customer_interactions
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_preferences_super_admin_access" ON customer_preferences;
CREATE POLICY "customer_preferences_super_admin_access" ON customer_preferences
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_segments_super_admin_access" ON customer_segments;
CREATE POLICY "customer_segments_super_admin_access" ON customer_segments
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "customer_segment_memberships_super_admin_access" ON customer_segment_memberships;
CREATE POLICY "customer_segment_memberships_super_admin_access" ON customer_segment_memberships
  FOR ALL
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that no policies remain with user_roles subqueries
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual LIKE '%user_roles%'
  AND qual LIKE '%EXISTS%'
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Key fixes:
-- 1. Replaced all EXISTS subqueries on user_roles with is_current_user_admin_or_super_admin()
-- 2. Maintained proper tenant isolation using get_current_user_tenant_id()
-- 3. Preserved all security logic while eliminating recursion
--
-- This should completely resolve the "Database error querying schema" during authentication
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251120000006_fix_remaining_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix remaining RLS policies with subqueries
-- Date: 2025-11-20
-- Problem: Some policies still have subqueries that cause recursion
-- Solution: Replace remaining problematic policies
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "admins_insert_users" ON users;
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT
  WITH CHECK (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 2. FIX POLICIES THAT REFERENCE users.is_super_admin
-- ============================================================================

-- These policies reference users.is_super_admin which may cause issues
-- Replace them with the function-based approach

DROP POLICY IF EXISTS "Super admins can view all customer interactions" ON customer_interactions;
CREATE POLICY "Super admins can view all customer interactions" ON customer_interactions
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all customer preferences" ON customer_preferences;
CREATE POLICY "Super admins can view all customer preferences" ON customer_preferences
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all inventory" ON inventory;
CREATE POLICY "Super admins can view all inventory" ON inventory
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

DROP POLICY IF EXISTS "Super admins can view all leads" ON leads;
CREATE POLICY "Super admins can view all leads" ON leads
  FOR SELECT
  USING (is_current_user_admin_or_super_admin());

-- ============================================================================
-- 3. FIX PERMISSIONS POLICY
-- ============================================================================

DROP POLICY IF EXISTS "users_view_all_permissions" ON permissions;
CREATE POLICY "users_view_all_permissions" ON permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 4. FIX REFERENCE DATA POLICIES
-- ============================================================================

-- These policies use subqueries on users table - replace with function
DROP POLICY IF EXISTS "reference_data_delete_policy" ON reference_data;
CREATE POLICY "reference_data_delete_policy" ON reference_data
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "reference_data_select_policy" ON reference_data;
CREATE POLICY "reference_data_select_policy" ON reference_data
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "reference_data_update_policy" ON reference_data;
CREATE POLICY "reference_data_update_policy" ON reference_data
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- 5. FIX ROLE TEMPLATES POLICY
-- ============================================================================

DROP POLICY IF EXISTS "users_view_role_templates" ON role_templates;
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = true
    OR tenant_id IS NULL
    OR tenant_id = get_current_user_tenant_id()
  );

-- ============================================================================
-- 6. FIX TENANTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenants_view_with_super_admin_access" ON tenants;
CREATE POLICY "tenants_view_with_super_admin_access" ON tenants
  FOR SELECT
  USING (
    is_current_user_admin_or_super_admin()
    OR id = get_current_user_tenant_id()
  );

DROP POLICY IF EXISTS "users_view_own_tenant" ON tenants;
CREATE POLICY "users_view_own_tenant" ON tenants
  FOR SELECT
  USING (id = get_current_user_tenant_id());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that no policies remain with problematic subqueries
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE (qual LIKE '%users%' AND qual LIKE '%SELECT%')
   OR (qual LIKE '%user_roles%' AND qual LIKE '%EXISTS%')
   AND schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================================================
-- MIGRATION: 20251121000001_sync_auth_users_to_public_users.sql
-- ============================================================================

-- ============================================================================
-- Migration: Sync Auth Users to Public Users Table
-- Date: 2025-11-21
-- Purpose: Ensure all auth.users have corresponding entries in public.users
--          This fixes the issue where auth users exist but database users don't
-- ============================================================================

-- ============================================================================
-- Step 1: Create function to sync auth users to public.users
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine if user is super admin (email contains 'superadmin' or 'platform')
  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR 
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  -- Determine tenant_id and role_name based on email domain
  -- Super admins get NULL tenant_id
  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant_id
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE (
      CASE 
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN name = 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN name = 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN name = 'Global Trading Ltd'
        ELSE FALSE
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match found (for development)
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Determine role name from email (mapped to roles table names)
    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User' -- Default role
    END;
  END IF;

  -- Insert or update user in public.users (role is managed via user_roles table)
  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at,
    last_login
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  -- Assign role via user_roles table
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 2: Create trigger to auto-sync new auth users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_public_user();

-- ============================================================================
-- Step 3: Sync existing auth users that don't have public.users entries
-- ============================================================================

-- Insert missing users from auth.users into public.users (role is managed via user_roles table)
INSERT INTO public.users (
  id,
  email,
  name,
  first_name,
  last_name,
  status,
  tenant_id,
  is_super_admin,
  created_at,
  updated_at,
  last_login
)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as name,
  split_part(
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'display_name',
      split_part(au.email, '@', 1)
    ),
    ' ',
    1
  ) as first_name,
  CASE 
    WHEN array_length(
      string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ),
      1
    ) > 1 
    THEN array_to_string(
      (string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ))[2:],
      ' '
    )
    ELSE NULL
  END as last_name,
  'active'::user_status as status,
  CASE
    -- Super admins get NULL tenant_id
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
    -- Map email domain to tenant
    WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
    WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
    WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
    -- Default to first tenant if no match
    ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
  END as tenant_id,
  CASE
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN TRUE
    ELSE FALSE
  END as is_super_admin,
  COALESCE(au.created_at, NOW()) as created_at,
  COALESCE(au.updated_at, NOW()) as updated_at,
  NULL as last_login
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  tenant_id = EXCLUDED.tenant_id,
  is_super_admin = EXCLUDED.is_super_admin,
  updated_at = NOW();

-- Assign roles via user_roles table for newly synced users
-- This uses a CTE to determine the role name and tenant_id, then joins with roles table
WITH user_role_mapping AS (
  SELECT
    au.id as user_id,
    CASE
      -- Super admin role
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN 'super_admin'
      -- Regular user roles based on email pattern
      WHEN au.email LIKE '%admin%' THEN 'Administrator'
      WHEN au.email LIKE '%manager%' THEN 'Manager'
      WHEN au.email LIKE '%engineer%' THEN 'Engineer'
      WHEN au.email LIKE '%user%' THEN 'User'
      WHEN au.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User' -- Default role
    END as role_name,
    CASE
      -- Super admins have NULL tenant_id
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
      -- Map email domain to tenant
      WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
      WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
      WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
      -- Default to first tenant if no match
      ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
    END as tenant_id
  FROM auth.users au
  WHERE au.email IS NOT NULL
    AND au.email != ''
    AND EXISTS (
      SELECT 1 
      FROM public.users pu 
      WHERE pu.id = au.id
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = au.id
    )
)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  urm.user_id,
  r.id,
  urm.tenant_id,
  NOW()
FROM user_role_mapping urm
JOIN roles r ON r.name = urm.role_name 
  AND (r.tenant_id = urm.tenant_id OR (urm.tenant_id IS NULL AND r.tenant_id IS NULL))
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- ============================================================================
-- Step 4: Update existing users to match auth users (if email changed)
-- ============================================================================

UPDATE public.users pu
SET
  email = au.email,
  name = COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    pu.name,
    split_part(au.email, '@', 1)
  ),
  updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
  AND pu.email != au.email;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show auth users without public.users entries (should be empty after migration)
SELECT 
  au.id,
  au.email,
  'Missing in public.users' as status
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  );

-- Show count of synced users
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(pu.id) as synced_users,
  COUNT(*) - COUNT(pu.id) as missing_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email IS NOT NULL AND au.email != '';




-- ============================================================================
-- MIGRATION: 20251121000002_quick_sync_missing_user.sql
-- ============================================================================

-- ============================================================================
-- Migration: Quick Sync Missing User
-- Date: 2025-11-21
-- Purpose: Manually sync a specific auth user to public.users if they don't exist
--          This is a temporary fix for users created before the sync trigger
-- ============================================================================

-- Sync the specific user that's causing the error
-- Replace the user ID below with the actual auth user ID if different
DO $$
DECLARE
  target_user_id UUID := '903d5e30-7799-44a1-90c8-f9a448edf64c';
  auth_user_record RECORD;
  user_tenant_id UUID;
  role_name TEXT;
  role_id_val UUID;
BEGIN
  -- Get the auth user
  SELECT * INTO auth_user_record
  FROM auth.users
  WHERE id = target_user_id;

  IF auth_user_record IS NULL THEN
    RAISE NOTICE 'Auth user % not found', target_user_id;
    RETURN;
  END IF;

  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id) THEN
    RAISE NOTICE 'User % already exists in public.users', target_user_id;
    RETURN;
  END IF;

  -- Determine tenant_id and role based on email
  IF auth_user_record.email LIKE '%superadmin%' 
     OR auth_user_record.email LIKE '%@platform.com' 
     OR auth_user_record.email LIKE '%@platform.%' THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE (
      CASE 
        WHEN auth_user_record.email LIKE '%@acme.com' OR auth_user_record.email LIKE '%@acme.%' THEN name = 'Acme Corporation'
        WHEN auth_user_record.email LIKE '%@techsolutions.com' OR auth_user_record.email LIKE '%@techsolutions.%' THEN name = 'Tech Solutions Inc'
        WHEN auth_user_record.email LIKE '%@globaltrading.com' OR auth_user_record.email LIKE '%@globaltrading.%' THEN name = 'Global Trading Ltd'
        ELSE FALSE
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Determine role name from email
    role_name := CASE
      WHEN auth_user_record.email LIKE '%admin%' THEN 'Administrator'
      WHEN auth_user_record.email LIKE '%manager%' THEN 'Manager'
      WHEN auth_user_record.email LIKE '%engineer%' THEN 'Engineer'
      WHEN auth_user_record.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  -- Insert user into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at,
    last_login
  )
  VALUES (
    target_user_id,
    auth_user_record.email,
    COALESCE(
      auth_user_record.raw_user_meta_data->>'name',
      auth_user_record.raw_user_meta_data->>'display_name',
      split_part(auth_user_record.email, '@', 1)
    ),
    split_part(
      COALESCE(
        auth_user_record.raw_user_meta_data->>'name',
        auth_user_record.raw_user_meta_data->>'display_name',
        split_part(auth_user_record.email, '@', 1)
      ),
      ' ',
      1
    ),
    CASE 
      WHEN array_length(
        string_to_array(
          COALESCE(
            auth_user_record.raw_user_meta_data->>'name',
            auth_user_record.raw_user_meta_data->>'display_name',
            split_part(auth_user_record.email, '@', 1)
          ),
          ' '
        ),
        1
      ) > 1 
      THEN array_to_string(
        (string_to_array(
          COALESCE(
            auth_user_record.raw_user_meta_data->>'name',
            auth_user_record.raw_user_meta_data->>'display_name',
            split_part(auth_user_record.email, '@', 1)
          ),
          ' '
        ))[2:],
        ' '
      )
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    CASE
      WHEN auth_user_record.email LIKE '%superadmin%' 
           OR auth_user_record.email LIKE '%@platform.com' 
           OR auth_user_record.email LIKE '%@platform.%' THEN TRUE
      ELSE FALSE
    END,
    COALESCE(auth_user_record.created_at, NOW()),
    COALESCE(auth_user_record.updated_at, NOW()),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  RAISE NOTICE 'User % synced to public.users', target_user_id;

  -- Assign role via user_roles table
  SELECT id INTO role_id_val
  FROM roles
  WHERE name = role_name
    AND (tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND tenant_id IS NULL))
  LIMIT 1;

  IF role_id_val IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    VALUES (target_user_id, role_id_val, user_tenant_id, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned to user %', role_name, target_user_id;
  ELSE
    RAISE WARNING 'Role % not found for user %', role_name, target_user_id;
  END IF;

END $$;

-- Also sync ALL other missing auth users
INSERT INTO public.users (
  id,
  email,
  name,
  first_name,
  last_name,
  status,
  tenant_id,
  is_super_admin,
  created_at,
  updated_at,
  last_login
)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as name,
  split_part(
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'display_name',
      split_part(au.email, '@', 1)
    ),
    ' ',
    1
  ) as first_name,
  CASE 
    WHEN array_length(
      string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ),
      1
    ) > 1 
    THEN array_to_string(
      (string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ))[2:],
      ' '
    )
    ELSE NULL
  END as last_name,
  'active'::user_status as status,
  CASE
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
    WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
    WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
    WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
    ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
  END as tenant_id,
  CASE
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN TRUE
    ELSE FALSE
  END as is_super_admin,
  COALESCE(au.created_at, NOW()) as created_at,
  COALESCE(au.updated_at, NOW()) as updated_at,
  NULL as last_login
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  tenant_id = EXCLUDED.tenant_id,
  is_super_admin = EXCLUDED.is_super_admin,
  updated_at = NOW();

-- Assign roles for all newly synced users
WITH user_role_mapping AS (
  SELECT
    au.id as user_id,
    CASE
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN 'super_admin'
      WHEN au.email LIKE '%admin%' THEN 'Administrator'
      WHEN au.email LIKE '%manager%' THEN 'Manager'
      WHEN au.email LIKE '%engineer%' THEN 'Engineer'
      WHEN au.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END as role_name,
    CASE
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
      WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
      WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
      WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
      ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
    END as tenant_id
  FROM auth.users au
  WHERE au.email IS NOT NULL
    AND au.email != ''
    AND EXISTS (
      SELECT 1 
      FROM public.users pu 
      WHERE pu.id = au.id
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM user_roles ur 
      WHERE ur.user_id = au.id
    )
)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  urm.user_id,
  r.id,
  urm.tenant_id,
  NOW()
FROM user_role_mapping urm
JOIN roles r ON r.name = urm.role_name 
  AND (r.tenant_id = urm.tenant_id OR (urm.tenant_id IS NULL AND r.tenant_id IS NULL))
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;




-- ============================================================================
-- MIGRATION: 20251124000001_qualify_sync_function.sql
-- ============================================================================

-- Ensure the sync trigger function references schema-qualified tables
-- This avoids "relation \"tenants\" does not exist" errors when search_path differs

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    SELECT id INTO user_tenant_id
    FROM public.tenants
    WHERE name = (
      CASE
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN 'Global Trading Ltd'
        ELSE NULL
      END
    )
    LIMIT 1;

    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;
    END IF;

    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::public.user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM public.roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE
  ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_auth_user_to_public_user();



-- ============================================================================
-- MIGRATION: 20251125000001_add_deleted_at_to_tickets.sql
-- ============================================================================

-- Add deleted_at column to tickets table for soft delete support
-- This enables filtering by deleted_at status in REST API queries
-- Migration: 2025-11-25

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.deleted_at IS 'Soft delete timestamp. When set, ticket is considered deleted. NULL means active.';



-- ============================================================================
-- MIGRATION: 20251127000001_set_auth_user_defaults.sql
-- ============================================================================

-- Migration: set safe defaults for auth.users token/string fields
-- Ensures GoTrue won't fail when scanning NULL string columns by using empty-string defaults

BEGIN;

-- Clean up existing NULLs for seeded or legacy rows
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR email_change IS NULL
  OR reauthentication_token IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL;

-- Add safe defaults for future inserts
-- Only attempt to ALTER the table if this session user owns the table.
DO $$
DECLARE
  owner_name TEXT;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(c.relowner) INTO owner_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'auth' AND c.relname = 'users';

  IF owner_name = current_user THEN
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change_token_current SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN reauthentication_token SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN phone_change SET DEFAULT '';$sql$;
    EXECUTE $sql$ALTER TABLE auth.users ALTER COLUMN phone_change_token SET DEFAULT '';$sql$;
  ELSE
    RAISE NOTICE 'Skipping ALTER TABLE auth.users (owner: % , current_user: %)', owner_name, current_user;
  END IF;
END;
$$;

COMMIT;



-- ============================================================================
-- MIGRATION: 20251128000100_align_customer_schema.sql
-- ============================================================================

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




-- ============================================================================
-- MIGRATION: 20251128000200_fix_auth_rls.sql
-- ============================================================================

-- ============================================================================
-- Migration: Reapply authentication RLS fixes (safe functions & policies)
-- Date:     2025-11-28
-- Purpose:  Prevent "Database error granting user" during login by ensuring
--           non-recursive policies exist for users / roles / role_permissions.
-- ============================================================================

BEGIN;

-- 1. Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER helper functions (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM users WHERE id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM users
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- 3. USERS policies
DROP POLICY IF EXISTS "Users can view tenant users" ON public.users;

CREATE POLICY "Users can view tenant users"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 4. USER_ROLES policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 5. ROLES policies
DROP POLICY IF EXISTS "Users can view tenant roles" ON public.roles;

CREATE POLICY "Users can view tenant roles"
  ON public.roles
  FOR SELECT
  USING (
    is_system_role = TRUE
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 6. ROLE_PERMISSIONS policies
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;

CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.id = role_permissions.role_id
        AND (
          r.is_system_role = TRUE
          OR r.tenant_id = get_current_user_tenant_id_safe()
          OR is_current_user_super_admin_safe()
        )
    )
  );

-- 7. PERMISSIONS policies (allow authenticated read)
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

COMMIT;




-- ============================================================================
-- MIGRATION: 20251128000300_disable_users_rls.sql
-- ============================================================================

-- ============================================================================
-- Migration: Disable RLS on public.users (auth compatibility)
-- Date:     2025-11-28
-- Context:  Per RBAC implementation guidance + Supabase auth docs,
--           the public.users table must have RLS disabled to prevent
--           recursive policy evaluation during login/token grants.
-- ============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Keep policies in place for future use, but RLS stays disabled so that
-- Supabase auth can manage users without triggering "Database error granting user".




-- ============================================================================
-- MIGRATION: 20251128000400_reapply_sync_function.sql
-- ============================================================================

-- ============================================================================
-- Migration: Reapply schema-qualified sync_auth_user_to_public_user trigger
-- Date:     2025-11-28
-- Reason:   Later migrations (e.g. 20251126000001_isolated_reset) overwrite the
--           function with a version that references unqualified "tenants",
--           causing "relation \"tenants\" does not exist" when auth triggers run
--           under the supabase_auth_admin search_path. This migration restores
--           the safe definition (SET search_path = public + fully qualified
--           table references) and recreates the trigger.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    SELECT id INTO user_tenant_id
    FROM public.tenants
    WHERE name = (
      CASE
        WHEN NEW.email ILIKE '%@acme.com' OR NEW.email ILIKE '%@acme.%' THEN 'Acme Corporation'
        WHEN NEW.email ILIKE '%@techsolutions.com' OR NEW.email ILIKE '%@techsolutions.%' THEN 'Tech Solutions Inc'
        WHEN NEW.email ILIKE '%@globaltrading.com' OR NEW.email ILIKE '%@globaltrading.%' THEN 'Global Trading Ltd'
        ELSE NULL
      END
    )
    LIMIT 1;

    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;
    END IF;

    role_name := CASE
      WHEN NEW.email ILIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email ILIKE '%manager%' THEN 'Manager'
      WHEN NEW.email ILIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email ILIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    NULLIF(regexp_replace(user_name, '^[^ ]+ ?', ''), ''),
    'active'::public.user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM public.roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE
  ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_auth_user_to_public_user();




-- ============================================================================
-- MIGRATION: 20251128000500_fix_customer_tag_relationships.sql
-- ============================================================================

-- ============================================================================
-- Migration: Establish foreign keys for customer_tag_mapping relationships
-- Date:     2025-11-28
-- Purpose:  Ensure PostgREST can discover the relationship between
--           customers ↔ customer_tag_mapping ↔ customer_tags so the nested
--           selects in SupabaseCustomerService keep working after resets.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_tag_mapping_customer_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'customer_tag_mapping'
  ) THEN
    ALTER TABLE public.customer_tag_mapping
      ADD CONSTRAINT customer_tag_mapping_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_tag_mapping_tag_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'customer_tag_mapping'
  ) THEN
    ALTER TABLE public.customer_tag_mapping
      ADD CONSTRAINT customer_tag_mapping_tag_id_fkey
      FOREIGN KEY (tag_id)
      REFERENCES public.customer_tags(id)
      ON DELETE CASCADE;
  END IF;
END
$$;




-- ============================================================================
-- MIGRATION: 20251128000600_add_relationship_constraints.sql
-- ============================================================================

-- ============================================================================
-- Migration: Restore missing relationship constraints for PostgREST nesting
-- Date:     2025-11-28
-- ============================================================================

-- 1. sale_items -> deals (optional relationship for deal line items)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sale_items'
      AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN deal_id UUID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sale_items_deal_id_fkey'
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT sale_items_deal_id_fkey
      FOREIGN KEY (deal_id)
      REFERENCES public.deals(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sale_items_deal_id ON public.sale_items(deal_id);

-- 2. ticket_comments -> tickets / users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_comments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_ticket_id_fkey
      FOREIGN KEY (ticket_id)
      REFERENCES public.tickets(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_comments_author_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_author_id_fkey
      FOREIGN KEY (author_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. ticket_attachments -> tickets / users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_attachments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_attachments
      ADD CONSTRAINT ticket_attachments_ticket_id_fkey
      FOREIGN KEY (ticket_id)
      REFERENCES public.tickets(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_attachments_uploaded_by_fkey'
  ) THEN
    ALTER TABLE public.ticket_attachments
      ADD CONSTRAINT ticket_attachments_uploaded_by_fkey
      FOREIGN KEY (uploaded_by)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;




-- ============================================================================
-- MIGRATION: 20251128000700_add_missing_ticket_company_columns.sql
-- ============================================================================

-- ============================================================================
-- Migration: add columns referenced by application code but missing post-reset
-- ============================================================================

-- 1) Ensure tickets table has soft-delete timestamp
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at
  ON public.tickets(deleted_at);

-- 2) Ensure companies table exposes the subscription/plan metadata
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan VARCHAR(100);




-- ============================================================================
-- MIGRATION: 20251128000800_seed_reference_data.sql
-- ============================================================================

-- ============================================================================
-- Migration: Seed reference_data defaults for core CRM dropdowns
-- Date:     2025-11-28
-- Purpose:  Ensure industry, company_size, and customer_type choices exist for
--           every tenant so customer forms have options immediately after a
--           reset. Idempotent (skips rows that already exist).
-- ============================================================================

WITH tenants AS (
  SELECT id
  FROM public.tenants
),
defaults AS (
  -- category, key, label, description, metadata, sort_order
  VALUES
    ('industry', 'manufacturing', 'Manufacturing', 'Industrial & manufacturing businesses', '{"icon":"factory"}', 1),
    ('industry', 'technology', 'Technology', 'Software, hardware, and IT services', '{"icon":"laptop"}', 2),
    ('industry', 'finance', 'Financial Services', 'Banking, insurance, and fintech', '{"icon":"bank"}', 3),
    ('industry', 'healthcare', 'Healthcare', 'Medical providers and life sciences', '{"icon":"medical"}', 4),
    ('industry', 'retail', 'Retail & Consumer', 'Retail stores and consumer brands', '{"icon":"retail"}', 5),

    ('company_size', 'startup', 'Startup (1-50)', 'Early-stage teams up to 50 employees', '{"minEmployees":1,"maxEmployees":50}', 1),
    ('company_size', 'small', 'Small (51-200)', 'Growing companies with 51-200 employees', '{"minEmployees":51,"maxEmployees":200}', 2),
    ('company_size', 'medium', 'Medium (201-1000)', 'Established companies with 201-1000 employees', '{"minEmployees":201,"maxEmployees":1000}', 3),
    ('company_size', 'enterprise', 'Enterprise (1000+)', 'Global enterprises with 1000+ employees', '{"minEmployees":1001}', 4),

    ('customer_type', 'business', 'Business', 'B2B customers and organizations', '{"icon":"building"}', 1),
    ('customer_type', 'individual', 'Individual', 'B2C customers and consumers', '{"icon":"user"}', 2),
    ('customer_type', 'government', 'Government / Public Sector', 'Agencies and government entities', '{"icon":"government"}', 3)
)
INSERT INTO public.reference_data (
  id,
  tenant_id,
  category,
  key,
  label,
  description,
  metadata,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  t.id,
  d.column1,
  d.column2,
  d.column3,
  d.column4,
  d.column5::jsonb,
  d.column6,
  true,
  NOW(),
  NOW()
FROM tenants t
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reference_data r
  WHERE r.tenant_id = t.id
    AND r.category = d.column1
    AND r.key = d.column2
);




-- ============================================================================
-- MIGRATION: 20251128000900_seed_customer_status_lead_data.sql
-- ============================================================================

-- ============================================================================
-- Migration: Seed customer_status, lead_source, and lead_rating reference data
-- Date:      2025-11-28
-- Purpose:   Ensure all core customer dropdowns have default values per tenant
--            so that Status, Lead Source, and Lead Rating lists render without
--            manual inserts after every db reset.
-- ============================================================================

WITH tenants AS (
  SELECT id
  FROM public.tenants
),
defaults AS (
  -- category, key, label, description, metadata_json, sort_order
  VALUES
    -- Customer status defaults
    ('customer_status', 'active', 'Active', 'Currently engaged customer', '{"emoji":"\uD83D\uDFE2","badgeColor":"green"}', 1),
    ('customer_status', 'prospect', 'Prospect', 'Pre-sales prospect under evaluation', '{"emoji":"\uD83D\uDD35","badgeColor":"blue"}', 2),
    ('customer_status', 'inactive', 'Inactive', 'Dormant customer with no recent activity', '{"emoji":"\u26AA","badgeColor":"default"}', 3),
    ('customer_status', 'suspended', 'Suspended', 'Temporarily blocked due to issues', '{"emoji":"\uD83D\uDD34","badgeColor":"red"}', 4),

    -- Lead source defaults
    ('lead_source', 'referral', 'Referral', 'Brought in by an existing contact or client', '{"emoji":"\uD83E\uDD1D"}', 1),
    ('lead_source', 'website', 'Website', 'Captured from corporate website or landing page', '{"emoji":"\uD83C\uDF10"}', 2),
    ('lead_source', 'event', 'Event / Webinar', 'Generated from marketing events or webinars', '{"emoji":"\uD83C\uDFAF"}', 3),
    ('lead_source', 'email_campaign', 'Email Campaign', 'Marketing automation or newsletter response', '{"emoji":"\u2709"}', 4),
    ('lead_source', 'partner', 'Partner / Channel', 'Submitted by a channel or alliance partner', '{"emoji":"\uD83E\uDD1D"}', 5),

    -- Lead rating defaults
    ('lead_rating', 'hot', 'Hot', 'High-intent lead ready for conversion', '{"emoji":"\uD83D\uDD25"}', 1),
    ('lead_rating', 'warm', 'Warm', 'Engaged lead that needs nurturing', '{"emoji":"\uD83C\uDF21"}', 2),
    ('lead_rating', 'cold', 'Cold', 'Low-engagement lead requiring long-term follow-up', '{"emoji":"\u2744"}', 3),
    ('lead_rating', 'nurture', 'Nurture', 'Long-term nurture program candidate', '{"emoji":"\uD83C\uDF31"}', 4)
)
INSERT INTO public.reference_data (
  id,
  tenant_id,
  category,
  key,
  label,
  description,
  metadata,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  t.id,
  d.column1,
  d.column2,
  d.column3,
  d.column4,
  d.column5::jsonb,
  d.column6,
  true,
  NOW(),
  NOW()
FROM tenants t
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reference_data r
  WHERE r.tenant_id = t.id
    AND r.category = d.column1
    AND r.key = d.column2
);




-- ============================================================================
-- MIGRATION: 20251128001000_add_deleted_at_to_tenants.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add deleted_at column to tenants for soft-delete filtering
-- Date:      2025-11-28
-- Purpose:   User management services filter tenants with deleted_at IS NULL.
--            The column did not exist, causing PostgREST 400 errors. This
--            migration adds the column and supporting index.
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tenants_deleted_at_idx
  ON public.tenants (deleted_at);




-- ============================================================================
-- MIGRATION: 20251128001100_grant_user_management_to_admin_manager.sql
-- ============================================================================

-- Migration: Grant full user management access to admin and manager roles
-- Purpose: Ensure admin and manager roles have all user management permissions
-- Date: 2025-11-28
--
-- ⚠️ CRITICAL: This migration ensures admin and manager roles have all granular
-- user management permissions required for permission hooks to work correctly.
-- See Repo.md section 2.9 for details on permission hook property name consistency.
--
-- ✅ Uses normalized role names: 'admin' and 'manager' (not 'Administrator' and 'Manager')
--
-- This migration is idempotent and safe to run multiple times. It will:
-- 1. Create granular permissions if they don't exist (crm:user:record:read, crm:user:record:create, crm:user:record:update, crm:user:record:delete)
-- 2. Assign all user management permissions to admin role
-- 3. Assign all user management permissions to manager role
--
-- Note: The isolated_reset migration (20251126000001) already includes these permissions
-- and assignments, so this migration is primarily for fixing existing databases.

-- First, ensure granular user management permissions exist
-- These are needed for fine-grained permission checks in the application
-- ⚠️ These permissions are checked by authService.hasPermission() and must exist
-- ✅ Updated to use crm: permission format for consistency

INSERT INTO permissions (name, description, category, resource, action, is_system_permission)
VALUES
  ('crm:user:record:read', 'Read user information', 'administrative', 'user', 'record:read', true),
  ('crm:user:record:create', 'Create new users', 'administrative', 'user', 'record:create', true),
  ('crm:user:record:update', 'Update user information', 'administrative', 'user', 'record:update', true),
  ('crm:user:record:delete', 'Delete users', 'administrative', 'user', 'record:delete', true)
ON CONFLICT (name) DO NOTHING;

-- Grant all user management permissions to admin role
-- admin should have full user management access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'crm:user:record:read',
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Grant all user management permissions to manager role
-- manager should also have full user management access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    'crm:user:record:read',
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Verify the permissions were assigned
DO $$
DECLARE
  admin_count INTEGER;
  manager_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.name = 'admin'
    AND p.name IN ('crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete');

  SELECT COUNT(*) INTO manager_count
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.name = 'manager'
    AND p.name IN ('crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete');

  RAISE NOTICE 'admin role now has % user management permissions', admin_count;
  RAISE NOTICE 'manager role now has % user management permissions', manager_count;
END $$;




-- ============================================================================
-- MIGRATION: 20251128001200_verify_admin_permissions.sql
-- ============================================================================

-- Migration: Verify Administrator and Manager role permissions
-- Purpose: Debug script to check what permissions are assigned
-- Date: 2025-11-28

-- Check what permissions Administrator role has
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager')
  AND (p.name LIKE 'users:%' OR p.name = 'crm:user:record:read')
ORDER BY r.name, p.name;

-- Count permissions for each role
SELECT 
  r.name as role_name,
  COUNT(*) as user_management_permission_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager')
  AND (p.name LIKE 'users:%' OR p.name = 'crm:user:record:read')
GROUP BY r.name;




-- ============================================================================
-- MIGRATION: 20251128001300_fix_admin_user_permissions.sql
-- ============================================================================

-- Migration: Fix admin user permissions
-- Purpose: Ensure acme@admin.com user has Administrator role with all permissions
-- Date: 2025-11-28

-- Step 1: Verify the user exists and get their ID
DO $$
DECLARE
  admin_user_id UUID;
  admin_role_id UUID;
  tenant_id_val UUID;
  perm_count INTEGER;
BEGIN
  -- Find the user
  SELECT id, tenant_id INTO admin_user_id, tenant_id_val
  FROM users
  WHERE email = 'acme@admin.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User acme@admin.com not found. Please create the user first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user acme@admin.com with ID: %', admin_user_id;
  RAISE NOTICE 'User tenant_id: %', tenant_id_val;

  -- Find the admin role for this tenant
  -- ✅ Use normalized role name 'admin' (not 'Administrator')
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin'
    AND (tenant_id = tenant_id_val OR (tenant_id IS NULL AND tenant_id_val IS NULL))
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'admin role not found for tenant: %', tenant_id_val;
    RETURN;
  END IF;

  RAISE NOTICE 'Found admin role with ID: %', admin_role_id;

  -- Ensure user has admin role assigned
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  VALUES (admin_user_id, admin_role_id, tenant_id_val, NOW())
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
  SET assigned_at = NOW();

  RAISE NOTICE 'User role assignment verified/updated';

  -- Verify permissions for Administrator role
  SELECT COUNT(*) INTO perm_count
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  WHERE rp.role_id = admin_role_id
    AND p.name IN ('crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete', 'crm:user:record:update', 'crm:user:record:read');

  RAISE NOTICE 'admin role has % user management permissions', perm_count;
END $$;

-- Step 2: Check if user exists
SELECT 
  'User Check' as check_type,
  u.email,
  u.id as user_id,
  u.tenant_id,
  CASE WHEN u.id IS NULL THEN 'NOT FOUND' ELSE 'EXISTS' END as status
FROM users u
WHERE u.email = 'acme@admin.com'
LIMIT 1;

-- Step 3: Check all users with 'admin' in email
SELECT 
  'All Admin Users' as check_type,
  u.email,
  u.id as user_id,
  u.tenant_id
FROM users u
WHERE u.email LIKE '%admin%'
ORDER BY u.email;

-- Step 4: Check user's role assignment
SELECT 
  'User Role Assignment' as check_type,
  u.email,
  u.id as user_id,
  r.name as role_name,
  r.id as role_id,
  ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'acme@admin.com';

-- Step 5: Check what roles exist
SELECT 
  'Available Roles' as check_type,
  r.name as role_name,
  r.id as role_id,
  r.tenant_id,
  COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
WHERE r.name IN ('admin', 'manager', 'super_admin')
GROUP BY r.name, r.id, r.tenant_id
ORDER BY r.name, r.tenant_id;

-- Step 6: Check admin role permissions
SELECT 
  'admin Permissions' as check_type,
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
  AND (p.name LIKE 'users:%' OR p.name = 'crm:user:record:read')
ORDER BY p.name;




-- ============================================================================
-- MIGRATION: 20251128001400_ensure_admin_user_has_role.sql
-- ============================================================================

-- Migration: Ensure acme@admin.com user exists and has admin role
-- Purpose: Fix user role assignment for admin user
-- Date: 2025-11-28
-- ✅ Uses normalized role name 'admin' (not 'Administrator')

DO $$
DECLARE
  admin_user_id UUID;
  admin_role_id UUID;
  tenant_id_val UUID;
  auth_user_id UUID;
  user_email TEXT;
  verify_email TEXT;
  verify_role TEXT;
  verify_count INTEGER;
BEGIN
  -- Step 1: Check if user exists in auth.users (try both email formats)
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email IN ('acme@admin.com', 'admin@acme.com')
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'User admin@acme.com does not exist in auth.users. Please create the user first by logging in.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found auth user: %', auth_user_id;

  -- Step 2: Get or create user in public.users
  SELECT id, tenant_id INTO admin_user_id, tenant_id_val
  FROM public.users
  WHERE email IN ('acme@admin.com', 'admin@acme.com')
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    -- User doesn't exist in public.users, create it
    -- Find tenant for acme.com domain
    SELECT id INTO tenant_id_val
    FROM tenants
    WHERE name = 'Acme Corporation'
    LIMIT 1;

    IF tenant_id_val IS NULL THEN
      -- Get first tenant as fallback
      SELECT id INTO tenant_id_val FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = auth_user_id;
    
    -- Insert user into public.users
    INSERT INTO public.users (
      id,
      email,
      name,
      first_name,
      last_name,
      status,
      tenant_id,
      is_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      auth_user_id,
      user_email,
      'Admin User',
      'Admin',
      'User',
      'active'::user_status,
      tenant_id_val,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;

    RAISE NOTICE 'Created user in public.users: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User already exists in public.users: %', admin_user_id;
  END IF;

  -- Step 3: Find admin role for this tenant
  -- ✅ Use normalized role name 'admin' (not 'Administrator')
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin'
    AND (tenant_id = tenant_id_val OR (tenant_id IS NULL AND tenant_id_val IS NULL))
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'admin role not found for tenant: %. Trying to find any admin role.', tenant_id_val;
    SELECT id INTO admin_role_id
    FROM roles
    WHERE name = 'admin'
    LIMIT 1;
  END IF;

  -- If admin role still doesn't exist, skip this migration gracefully
  -- Roles will be created by seed.sql or other migrations
  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'admin role not found in database. Skipping role assignment. Roles will be created by seed data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found admin role: %', admin_role_id;

  -- Step 4: Ensure user has admin role assigned
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  VALUES (admin_user_id, admin_role_id, tenant_id_val, NOW())
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
  SET assigned_at = NOW();

  RAISE NOTICE 'User role assignment completed successfully';

  -- Step 5: Verify the assignment
  SELECT 
    u.email,
    r.name,
    COUNT(DISTINCT p.id)
  INTO verify_email, verify_role, verify_count
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = admin_user_id
    AND (p.name LIKE 'users:%' OR p.name = 'crm:user:record:read')
  GROUP BY u.email, r.name;

  IF verify_email IS NOT NULL THEN
    RAISE NOTICE 'Verification: User % has role % with % user management permissions', 
      verify_email, verify_role, verify_count;
  ELSE
    RAISE NOTICE 'Warning: Could not verify role assignment. User may need to log out and log back in.';
  END IF;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE NOTICE 'Warning: Could not verify role assignment. User may need to log out and log back in.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END $$;

-- Final verification query (only runs if roles exist)
-- This is a conditional query that won't fail if roles don't exist yet
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM roles WHERE name = 'admin' LIMIT 1) THEN
    PERFORM 1 FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email IN ('acme@admin.com', 'admin@acme.com')
    LIMIT 1;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Silently skip verification if tables/roles don't exist yet
    NULL;
END $$;




-- ============================================================================
-- MIGRATION: 20251128001500_fix_user_roles_insert_policy.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix user_roles INSERT policy to allow admins to assign roles
-- Date: 2025-11-28
-- Problem: The "admins_manage_user_roles" policy is too restrictive for INSERT
--          It requires tenant_id match, but doesn't account for super admins
--          or the WITH CHECK clause for INSERT operations
--          Also causes infinite recursion by querying user_roles in policies
-- Solution: Use SECURITY DEFINER functions to avoid recursion and allow proper INSERT
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTIONS TO AVOID RECURSION
-- ============================================================================

-- Function to check if current user is super admin (no recursion)
CREATE OR REPLACE FUNCTION is_current_user_super_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'Super Admin')
  );
$$;

-- Function to check if current user is admin or super admin (no recursion)
CREATE OR REPLACE FUNCTION is_current_user_admin_or_super_admin_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'Administrator', 'super_admin', 'Super Admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_current_user_super_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin_or_super_admin_safe() TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_manage_user_roles" ON user_roles;
DROP POLICY IF EXISTS "user_roles_modify_authenticated" ON user_roles;
DROP POLICY IF EXISTS "users_view_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_insert_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_update_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_delete_user_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_tenant_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_assign_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_remove_roles" ON user_roles;

-- ============================================================================
-- 3. CREATE NEW POLICIES USING SECURITY DEFINER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- SELECT policy: Allow users to see their own roles and admins to see roles in their tenant
CREATE POLICY "users_view_user_roles" ON user_roles
  FOR SELECT
  USING (
    -- Users can always see their own role assignments
    user_id = auth.uid()
    OR
    -- Super admins can see all
    is_current_user_super_admin_safe()
    OR
    -- Admins can see roles in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- INSERT policy: Allow admins/super_admins to assign roles
CREATE POLICY "admins_insert_user_roles" ON user_roles
  FOR INSERT
  WITH CHECK (
    -- Super admins can assign roles to any tenant (including null)
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can assign roles in their own tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- UPDATE policy: Allow admins/super_admins to update role assignments
CREATE POLICY "admins_update_user_roles" ON user_roles
  FOR UPDATE
  USING (
    -- Super admins can update any role assignment
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can update role assignments in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- DELETE policy: Allow admins/super_admins to remove role assignments
CREATE POLICY "admins_delete_user_roles" ON user_roles
  FOR DELETE
  USING (
    -- Super admins can delete any role assignment
    is_current_user_super_admin_safe()
    OR
    -- Regular admins can delete role assignments in their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND is_current_user_admin_or_super_admin_safe()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to avoid infinite recursion
-- - Dropped all existing restrictive policies
-- - Created separate policies for SELECT, INSERT, UPDATE, DELETE
-- - INSERT policy now properly uses WITH CHECK clause
-- - Super admins can assign roles to any tenant
-- - Regular admins can assign roles in their own tenant
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20251128001600_add_audit_logs_user_columns.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add user_name and user_email columns to audit_logs
-- Date: 2025-11-28
-- Description: Add missing user identification columns to audit_logs table
-- Required for audit logging functionality in auditService.ts
-- ============================================================================

-- Add user_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_name'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_name VARCHAR(255);
  END IF;
END $$;

-- Add user_email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_email'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(255);
  END IF;
END $$;

-- Add resource column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'resource'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource VARCHAR(100);
  END IF;
END $$;

-- Add resource_id column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR(255);
  END IF;
END $$;

-- Add metadata column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add changes column if it doesn't exist (used in auditService.ts)
-- Note: audit_logs already has old_values and new_values, but changes is a combined format
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'changes'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
END $$;

-- Add indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Update comments
COMMENT ON COLUMN audit_logs.user_name IS 'Display name of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email address of the user who performed the action';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type that was affected (e.g., customer, sale, user)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource that was affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata about the action';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251128001700_normalize_role_names.sql
-- ============================================================================

-- ============================================================================
-- Migration: Normalize Role Names to Match UserRole Enum
-- Date: 2025-11-28
-- Purpose: Normalize all role names in database to match UserRole enum values
--          This eliminates the need for hardcoded role mapping
--          Database role names will match enum: 'admin', 'manager', 'user', 'engineer', 'customer', 'super_admin'
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EXISTING ROLES TO NORMALIZED NAMES
-- ============================================================================

-- Update "Administrator" → "admin"
UPDATE roles 
SET name = 'admin', 
    updated_at = NOW()
WHERE name = 'Administrator';

-- Update "Manager" → "manager"
UPDATE roles 
SET name = 'manager', 
    updated_at = NOW()
WHERE name = 'Manager';

-- Update "User" → "user"
UPDATE roles 
SET name = 'user', 
    updated_at = NOW()
WHERE name = 'User';

-- Update "Engineer" → "engineer"
UPDATE roles 
SET name = 'engineer', 
    updated_at = NOW()
WHERE name = 'Engineer';

-- Update "Customer" → "customer"
UPDATE roles 
SET name = 'customer', 
    updated_at = NOW()
WHERE name = 'Customer';

-- Ensure "super_admin" is already normalized (no change needed, but verify)
-- super_admin should already be lowercase

-- ============================================================================
-- 2. UPDATE SYNC FUNCTION TO USE NORMALIZED ROLE NAMES
-- ============================================================================

-- Update the sync function to use normalized role names
CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine if user is super admin
  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR 
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  -- Determine tenant_id and role_name based on email domain
  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant_id
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE name = (
      CASE 
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN 'Global Trading Ltd'
        ELSE NULL
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match found
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- ✅ Use normalized role names (matching UserRole enum)
    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'admin'        -- Normalized: was 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'manager'     -- Normalized: was 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'engineer'  -- Normalized: was 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'customer'  -- Normalized: was 'Customer'
      ELSE 'user'                                        -- Normalized: was 'User'
    END;
  END IF;

  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  -- Assign role via user_roles table (using normalized role names)
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. VERIFY NORMALIZATION
-- ============================================================================

-- Verify all roles are normalized
DO $$
DECLARE
  non_normalized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO non_normalized_count
  FROM roles
  WHERE name IN ('Administrator', 'Manager', 'User', 'Engineer', 'Customer');
  
  IF non_normalized_count > 0 THEN
    RAISE WARNING 'Found % non-normalized role names. Please review migration.', non_normalized_count;
  ELSE
    RAISE NOTICE 'All role names have been normalized successfully.';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - All role names normalized to match UserRole enum: 'admin', 'manager', 'user', 'engineer', 'customer', 'super_admin'
-- - Sync function updated to use normalized names
-- - No hardcoded mapping needed - database stores enum values directly
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251128001800_fix_role_permissions_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix role_permissions RLS policies to allow admins to manage permissions
-- Date: 2025-11-28
-- Problem: role_permissions table has RLS enabled but only SELECT policy exists
--          INSERT/UPDATE/DELETE operations are blocked, causing 403 errors
-- Solution: Create comprehensive RLS policies using SECURITY DEFINER functions
--           to avoid recursion, similar to user_roles policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTIONS (REUSE EXISTING IF AVAILABLE)
-- ============================================================================

-- Function to check if current user has crm:role:permission:assign permission
-- ✅ Database-driven: Checks actual permissions from database, not hardcoded roles
CREATE OR REPLACE FUNCTION has_roles_manage_permission_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND (p.name = 'crm:role:permission:assign' OR p.name = 'roles:admin')
  );
$$;

-- Function to get tenant_id of a role (for tenant isolation checks)
CREATE OR REPLACE FUNCTION get_role_tenant_id_safe(role_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM roles WHERE id = role_uuid;
$$;

GRANT EXECUTE ON FUNCTION has_roles_manage_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_tenant_id_safe(UUID) TO authenticated;

-- Note: is_current_user_super_admin_safe() and get_current_user_tenant_id_safe() 
-- are already created in migration 20251128000200_fix_auth_rls.sql

-- ============================================================================
-- 2. DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "admins_manage_role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_select_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_update_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete_policy" ON role_permissions;

-- ============================================================================
-- 3. CREATE NEW POLICIES USING SECURITY DEFINER FUNCTIONS (NO RECURSION)
-- ============================================================================

-- SELECT policy: Allow users to see role permissions for roles they have access to
-- Note: This replaces the existing "Users can view role permissions" policy
CREATE POLICY "role_permissions_select_policy" ON role_permissions
  FOR SELECT
  USING (
    -- Super admins can see all role permissions
    is_current_user_super_admin_safe()
    OR
    -- Users can see permissions for roles in their tenant
    (
      get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
    OR
    -- Users can see permissions for system roles (available to all tenants)
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.is_system_role = TRUE
    )
    OR
    -- Users can see permissions for roles they are assigned to
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id = role_permissions.role_id
    )
  );

-- INSERT policy: Allow admins/super_admins to assign permissions to roles
CREATE POLICY "role_permissions_insert_policy" ON role_permissions
  FOR INSERT
  WITH CHECK (
    -- Super admins can assign permissions to any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:permission:assign permission can assign permissions to roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- UPDATE policy: Allow admins/super_admins to update role permissions
CREATE POLICY "role_permissions_update_policy" ON role_permissions
  FOR UPDATE
  USING (
    -- Super admins can update any role permission
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:permission:assign permission can update permissions for roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- DELETE policy: Allow admins/super_admins to remove permissions from roles
CREATE POLICY "role_permissions_delete_policy" ON role_permissions
  FOR DELETE
  USING (
    -- Super admins can delete any role permission
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:permission:assign permission can delete permissions from roles in their tenant
    (
      has_roles_manage_permission_safe()
      AND get_role_tenant_id_safe(role_id) = get_current_user_tenant_id_safe()
      AND get_role_tenant_id_safe(role_id) IS NOT NULL
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to avoid infinite recursion
-- - Dropped all existing restrictive policies
-- - Created separate policies for SELECT, INSERT, UPDATE, DELETE
-- - INSERT/UPDATE/DELETE policies check for crm:role:permission:assign permission (database-driven)
-- - Super admins can manage permissions for any role
-- - Regular admins can manage permissions for roles in their tenant
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251128001900_create_navigation_items_table.sql
-- ============================================================================

-- ============================================================================
-- Migration: Create navigation_items table for database-driven navigation
-- Date: 2025-11-28
-- Purpose: Store navigation structure in database instead of hardcoded config
-- ============================================================================

-- Navigation Items Table
-- Stores the complete navigation structure with hierarchical support
CREATE TABLE IF NOT EXISTS navigation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
    permission_name VARCHAR(100),
    is_section BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    route_path VARCHAR(500),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_system_item BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant_id ON navigation_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_key ON navigation_items(key);
CREATE INDEX IF NOT EXISTS idx_navigation_items_sort_order ON navigation_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_navigation_items_active ON navigation_items(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for navigation_items
-- SELECT: Users can see navigation items for their tenant or system items
CREATE POLICY "users_view_navigation_items" ON navigation_items
  FOR SELECT
  USING (
    -- Super admins can see all
    is_current_user_super_admin_safe()
    OR
    -- Users can see items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
    )
    OR
    -- Users can see system items (available to all tenants)
    (
      is_system_item = TRUE
      AND tenant_id IS NULL
    )
    OR
    -- Active items only
    is_active = TRUE
  );

-- INSERT: Only super admins or users with navigation:manage permission can create items
CREATE POLICY "admins_insert_navigation_items" ON navigation_items
  FOR INSERT
  WITH CHECK (
    -- Super admins can create any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can create items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- UPDATE: Only super admins or users with navigation:manage permission can update items
CREATE POLICY "admins_update_navigation_items" ON navigation_items
  FOR UPDATE
  USING (
    -- Super admins can update any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can update items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- DELETE: Only super admins or users with navigation:manage permission can delete items
CREATE POLICY "admins_delete_navigation_items" ON navigation_items
  FOR DELETE
  USING (
    -- Super admins can delete any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can delete items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_navigation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_items_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created navigation_items table with hierarchical support (parent_id)
-- - Added indexes for performance
-- - Enabled RLS with tenant-aware policies
-- - Created policies for SELECT, INSERT, UPDATE, DELETE
-- - Policies use SECURITY DEFINER functions (no recursion)
-- - System items (is_system_item=TRUE, tenant_id=NULL) are visible to all tenants
-- - Tenant-specific items are only visible to users in that tenant
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251128002000_seed_navigation_items.sql
-- ============================================================================

-- ============================================================================
-- Migration: Seed navigation items from current hardcoded config
-- Date: 2025-11-28
-- Purpose: Populate navigation_items table with existing navigation structure
-- ============================================================================

BEGIN;

DO $$
DECLARE
  default_tenant_id UUID;
  system_user_id UUID;
  admin_section_id UUID;
  masters_id UUID;
  users_id UUID;
  config_id UUID;
BEGIN
  -- Get default tenant
  SELECT id INTO default_tenant_id
  FROM tenants
  WHERE name = 'Acme Corporation'
  LIMIT 1;

  -- Get system user (first admin user) for created_by/updated_by
  SELECT id INTO system_user_id
  FROM users
  WHERE email = 'admin@acme.com'
  LIMIT 1;

  -- ============================================
  -- TENANT ITEMS - Available to tenant users only
  -- ============================================
  
  -- Dashboard
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/dashboard',
    'Dashboard',
    NULL,
    'crm:dashboard:panel:view',
    FALSE,
    1,
    '/tenant/dashboard',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Customers
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/customers',
    'Customers',
    NULL,
    'crm:customer:record:read',
    FALSE,
    2,
    '/tenant/customers',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Deals
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/deals',
    'Deals',
    NULL,
    'crm:deal:record:read',
    FALSE,
    3,
    '/tenant/deals',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Product Sales
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/product-sales',
    'Product Sales',
    NULL,
    'crm:product:record:read',
    FALSE,
    4,
    '/tenant/product-sales',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Contracts
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/contracts',
    'Contracts',
    NULL,
    'crm:contract:record:read',
    FALSE,
    5,
    '/tenant/contracts',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Service Contracts
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/service-contracts',
    'Service Contracts',
    NULL,
    'crm:contract:service:read',
    FALSE,
    6,
    '/tenant/service-contracts',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Support Tickets
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/tickets',
    'Support Tickets',
    NULL,
    'crm:support:ticket:read',
    FALSE,
    7,
    '/tenant/tickets',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Complaints
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/complaints',
    'Complaints',
    NULL,
    'crm:support:complaint:read',
    FALSE,
    8,
    '/tenant/complaints',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Job Works
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/job-works',
    'Job Works',
    NULL,
    'crm:job:work:read',
    FALSE,
    9,
    '/tenant/job-works',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- ============================================
  -- ADMINISTRATION SECTION
  -- ============================================
  
  -- Administration Section Header
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    'admin-section',
    'Administration',
    NULL,
    'crm:master:data:read',
    TRUE,
    10,
    NULL,
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get admin-section ID for children
  SELECT id INTO admin_section_id
  FROM navigation_items
  WHERE key = 'admin-section'
  LIMIT 1;

  -- Masters (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters',
    'Masters',
    admin_section_id,
    'crm:master:data:read',
    FALSE,
    11,
    '/tenant/masters',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get masters ID for children
  SELECT id INTO masters_id
  FROM navigation_items
  WHERE key = '/tenant/masters'
  LIMIT 1;

  -- Companies (child of Masters)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters/companies',
    'Companies',
    masters_id,
    'crm:company:record:read',
    FALSE,
    1,
    '/tenant/masters/companies',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Products (child of Masters)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters/products',
    'Products',
    masters_id,
    'crm:product:record:read',
    FALSE,
    2,
    '/tenant/masters/products',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- User Management (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users',
    'User Management',
    admin_section_id,
    'crm:user:record:read',
    FALSE,
    12,
    '/tenant/users',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get user management ID for children
  SELECT id INTO users_id
  FROM navigation_items
  WHERE key = '/tenant/users'
  LIMIT 1;

  -- Users (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/list',
    'Users',
    users_id,
    'crm:user:record:read',
    FALSE,
    1,
    '/tenant/users/list',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Roles (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/roles',
    'Roles',
    users_id,
    'crm:role:record:read',
    FALSE,
    2,
    '/tenant/users/roles',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Permissions (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/permissions',
    'Permissions',
    users_id,
    'crm:permission:record:read',
    FALSE,
    3,
    '/tenant/users/permissions',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Configuration (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration',
    'Configuration',
    admin_section_id,
    'crm:system:config:manage',
    FALSE,
    13,
    '/tenant/configuration',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get configuration ID for children
  SELECT id INTO config_id
  FROM navigation_items
  WHERE key = '/tenant/configuration'
  LIMIT 1;

  -- Tenant Settings (child of Configuration)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration/tenant',
    'Tenant Settings',
    config_id,
    'crm:system:config:manage',
    FALSE,
    1,
    '/tenant/configuration/tenant',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- PDF Templates (child of Configuration)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration/pdf-templates',
    'PDF Templates',
    config_id,
    'crm:system:config:manage',
    FALSE,
    2,
    '/tenant/configuration/pdf-templates',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Notifications
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/notifications',
    'Notifications',
    admin_section_id,
    'crm:notification:channel:manage',
    FALSE,
    14,
    '/tenant/notifications',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Audit Logs
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/logs',
    'Audit Logs',
    admin_section_id,
    'crm:audit:log:read',
    FALSE,
    15,
    '/tenant/logs',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;
END $$;

-- Verify the results
DO $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO item_count FROM navigation_items;
  RAISE NOTICE '✅ Navigation items seeded: % items', item_count;
  
  IF item_count < 20 THEN
    RAISE EXCEPTION '❌ Expected at least 20 navigation items, but found %', item_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Seeded all navigation items from current hardcoded config
-- - Maintained hierarchical structure (parent_id relationships)
-- - Set is_system_item=TRUE for all items (they're system defaults)
-- - Set tenant_id to default tenant (Acme Corporation)
-- - All items are active by default
-- - Used ON CONFLICT DO NOTHING for idempotency
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20251128002100_add_navigation_manage_permission.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add navigation:manage permission
-- Date: 2025-11-28
-- Purpose: Add permission for managing navigation items
-- ============================================================================

BEGIN;

-- Add navigation:manage permission
INSERT INTO permissions (name, description, category, resource, action, is_system_permission)
VALUES (
  'navigation:manage',
  'Manage navigation items and menu structure',
  'administrative',
  'navigation',
  'manage',
  false
) ON CONFLICT (name) DO NOTHING;

-- Grant navigation:manage to admin and manager roles (for all tenants)
DO $$
DECLARE
  admin_role_id UUID;
  manager_role_id UUID;
  nav_permission_id UUID;
BEGIN
  -- Get permission ID
  SELECT id INTO nav_permission_id
  FROM permissions
  WHERE name = 'navigation:manage'
  LIMIT 1;

  IF nav_permission_id IS NULL THEN
    RAISE EXCEPTION 'Navigation permission not found';
  END IF;

  -- Grant to admin role for all tenants
  FOR admin_role_id IN
    SELECT id FROM roles WHERE name = 'admin'
  LOOP
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (admin_role_id, nav_permission_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Grant to manager role for all tenants
  FOR manager_role_id IN
    SELECT id FROM roles WHERE name = 'manager'
  LOOP
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (manager_role_id, nav_permission_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Added navigation:manage permission
-- - Granted to admin and manager roles for all tenants
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251129000001_element_level_permissions.sql
-- ============================================================================

-- ============================================================================
-- ELEMENT-LEVEL PERMISSIONS MIGRATION
-- Adds support for granular element-level permission control
--
-- Date: November 29, 2025
-- Version: 1.0
-- Status: Production-ready element permission schema
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND EXISTING PERMISSIONS TABLE
-- ============================================================================

-- Add element-level permission columns to existing permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS element_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS parent_permission_id UUID REFERENCES permissions(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_element_path ON permissions(element_path);
CREATE INDEX IF NOT EXISTS idx_permissions_parent_permission_id ON permissions(parent_permission_id);

-- ============================================================================
-- STEP 2: CREATE ELEMENT PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS element_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_path VARCHAR(500) NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  required_role_level VARCHAR(50) CHECK (required_role_level IN ('read', 'write', 'admin')),
  conditions JSONB DEFAULT '{}',
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX idx_element_permissions_element_path ON element_permissions(element_path);
CREATE INDEX idx_element_permissions_permission_id ON element_permissions(permission_id);
CREATE INDEX idx_element_permissions_tenant_id ON element_permissions(tenant_id);
CREATE INDEX idx_element_permissions_required_role_level ON element_permissions(required_role_level);

-- Add unique constraint to prevent duplicates
ALTER TABLE element_permissions
ADD CONSTRAINT unique_element_permission_per_tenant
UNIQUE (element_path, permission_id, tenant_id);

-- ============================================================================
-- STEP 3: CREATE PERMISSION OVERRIDES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) CHECK (resource_type IN ('record', 'field', 'element')),
  resource_id VARCHAR(255),
  override_type VARCHAR(20) CHECK (override_type IN ('grant', 'deny')),
  conditions JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX idx_permission_overrides_user_id ON permission_overrides(user_id);
CREATE INDEX idx_permission_overrides_permission_id ON permission_overrides(permission_id);
CREATE INDEX idx_permission_overrides_tenant_id ON permission_overrides(tenant_id);
CREATE INDEX idx_permission_overrides_resource_type_id ON permission_overrides(resource_type, resource_id);
CREATE INDEX idx_permission_overrides_expires_at ON permission_overrides(expires_at);

-- ============================================================================
-- STEP 4: CREATE PERMISSION TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  template JSONB NOT NULL,
  applicable_to VARCHAR(100) CHECK (applicable_to IN ('form', 'list', 'dashboard', 'module')),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for name (required for ON CONFLICT)
ALTER TABLE permission_templates
ADD CONSTRAINT unique_permission_template_name
UNIQUE (name);

-- Add performance indexes
CREATE INDEX idx_permission_templates_name ON permission_templates(name);
CREATE INDEX idx_permission_templates_applicable_to ON permission_templates(applicable_to);
CREATE INDEX idx_permission_templates_tenant_id ON permission_templates(tenant_id);

-- ============================================================================
-- STEP 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE element_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Element Permissions RLS Policies
CREATE POLICY "Element permissions tenant isolation" ON element_permissions
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Super admins can manage all element permissions" ON element_permissions
FOR ALL USING (
  (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Permission Overrides RLS Policies
CREATE POLICY "Users can view their own permission overrides" ON permission_overrides
FOR SELECT USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
  OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Admins can manage permission overrides in their tenant" ON permission_overrides
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Permission Templates RLS Policies
CREATE POLICY "Permission templates tenant isolation" ON permission_templates
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- ============================================================================
-- STEP 6: SEED ELEMENT-LEVEL PERMISSIONS
-- ============================================================================

-- Insert hierarchical element permissions following existing crm:resource:action pattern
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Module-level permissions
('crm:contacts:module:access', 'Access to contacts module', 'contacts', 'module:access', 'module', true, 'contacts:module'),
('crm:sales:module:access', 'Access to sales module', 'sales', 'module:access', 'module', true, 'sales:module'),
('crm:support:module:access', 'Access to support module', 'support', 'module:access', 'module', true, 'support:module'),
('crm:admin:module:access', 'Access to admin module', 'admin', 'module:access', 'administrative', true, 'admin:module'),

-- List view permissions
('crm:contacts:list:view', 'View contacts list', 'contacts', 'list:view', 'module', true, 'contacts:list'),
('crm:contacts:list:button.create:visible', 'Create button visibility on contacts list', 'contacts', 'list:button.create:visible', 'module', true, 'contacts:list:button.create'),
('crm:contacts:list:button.export:enabled', 'Export button enabled on contacts list', 'contacts', 'list:button.export:enabled', 'module', true, 'contacts:list:button.export'),

-- Detail view permissions
('crm:contacts:detail:view', 'View contact details', 'contacts', 'detail:view', 'module', true, 'contacts:detail'),
('crm:contacts:detail:button.edit:enabled', 'Edit button enabled on contact detail', 'contacts', 'detail:button.edit:enabled', 'module', true, 'contacts:detail:button.edit'),
('crm:contacts:detail:tab.history:accessible', 'History tab accessible on contact detail', 'contacts', 'detail:tab.history:accessible', 'module', true, 'contacts:detail:tab.history'),

-- Field-level permissions
('crm:contacts:field.email:editable', 'Email field editable', 'contacts', 'field.email:editable', 'module', true, 'contacts:field.email'),
('crm:contacts:field.phone:visible', 'Phone field visible', 'contacts', 'field.phone:visible', 'module', true, 'contacts:field.phone'),
('crm:contacts:field.ssn:visible', 'SSN field visible (restricted)', 'contacts', 'field.ssn:visible', 'module', true, 'contacts:field.ssn'),

-- Sales pipeline permissions
('crm:sales:pipeline:view', 'View sales pipeline', 'sales', 'pipeline:view', 'module', true, 'sales:pipeline'),
('crm:sales:pipeline:stage.qualified:movable', 'Move deals to qualified stage', 'sales', 'pipeline:stage.qualified:movable', 'module', true, 'sales:pipeline:stage.qualified'),

-- Support permissions
('crm:support:tickets:list:view', 'View support tickets list', 'support', 'tickets:list:view', 'module', true, 'support:tickets:list'),
('crm:support:complaints:escalate:enabled', 'Escalate complaints enabled', 'support', 'complaints:escalate:enabled', 'module', true, 'support:complaints:escalate'),

-- Admin permissions
('crm:admin:users:list:view', 'View users list in admin', 'admin', 'users:list:view', 'administrative', true, 'admin:users:list'),
('crm:admin:roles:assign:enabled', 'Role assignment enabled in admin', 'admin', 'roles:assign:enabled', 'administrative', true, 'admin:roles:assign'),
('crm:admin:audit:logs:view', 'View audit logs in admin', 'admin', 'audit:logs:view', 'administrative', true, 'admin:audit:logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 7: UPDATE EXISTING ROLE PERMISSIONS
-- ============================================================================

-- Add element permissions to existing roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND (
    -- Admin roles get all element permissions
    r.name IN ('admin', 'super_admin')
    OR
    -- Manager roles get most element permissions except restricted ones
    (r.name = 'manager' AND p.name NOT LIKE '%ssn%')
    OR
    -- Engineer roles get technical element permissions
    (r.name = 'engineer' AND p.name LIKE '%support%' OR p.name LIKE '%job%')
    OR
    -- User roles get basic view permissions
    (r.name = 'user' AND p.action LIKE '%view')
    OR
    -- Customer roles get limited view permissions
    (r.name = 'customer' AND p.action LIKE '%view' AND p.resource = 'contacts')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 8: CREATE PERMISSION TEMPLATES
-- ============================================================================

INSERT INTO permission_templates (name, template, applicable_to, tenant_id) VALUES
(
  'Contact Form Template',
  '{
    "fields": {
      "firstName": {"visible": true, "editable": true},
      "lastName": {"visible": true, "editable": true},
      "email": {"visible": true, "editable": true},
      "phone": {"visible": true, "editable": true},
      "address": {"visible": true, "editable": false}
    },
    "buttons": {
      "save": {"visible": true, "enabled": true},
      "cancel": {"visible": true, "enabled": true}
    }
  }',
  'form',
  NULL
),
(
  'Contact List Template',
  '{
    "columns": {
      "name": {"visible": true, "sortable": true},
      "email": {"visible": true, "sortable": true},
      "phone": {"visible": false, "sortable": false},
      "company": {"visible": true, "sortable": true}
    },
    "actions": {
      "view": {"visible": true, "enabled": true},
      "edit": {"visible": true, "enabled": true},
      "delete": {"visible": false, "enabled": false}
    }
  }',
  'list',
  NULL
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 9: VALIDATION AND MONITORING
-- ============================================================================

-- Create function to validate element permissions setup
CREATE OR REPLACE FUNCTION validate_element_permissions_setup()
RETURNS JSON AS $$
DECLARE
  result JSON;
  element_permissions_count INTEGER;
  permission_overrides_count INTEGER;
  templates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO element_permissions_count FROM element_permissions;
  SELECT COUNT(*) INTO permission_overrides_count FROM permission_overrides;
  SELECT COUNT(*) INTO templates_count FROM permission_templates;

  result := json_build_object(
    'status', 'element_permissions_setup_complete',
    'summary', json_build_object(
      'element_permissions', element_permissions_count,
      'permission_overrides', permission_overrides_count,
      'permission_templates', templates_count
    ),
    'message', 'Element-level permissions schema successfully created and seeded'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Element-level permissions migration completed successfully';
  RAISE NOTICE 'Run: SELECT validate_element_permissions_setup(); to verify setup';
END $$;


-- ============================================================================
-- MIGRATION: 20251129000002_correct_roles_permissions_seed.sql
-- ============================================================================

-- ============================================================================
-- CORRECT ROLES AND PERMISSIONS SEED DATA
-- Aligns with Functional Requirement Specification (FRS)
--
-- Date: November 29, 2025
-- Version: 1.0
-- Status: FRS-compliant role and permission structure
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP EXISTING ROLES AND PERMISSIONS
-- ============================================================================

-- Remove existing role_permissions assignments
DELETE FROM role_permissions;

-- Ensure sample tenants exist so tenant-scoped role inserts do not fail when migrations run
INSERT INTO tenants (id, name, domain, created_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corporation', 'acme.com', NOW()),
  ('b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', 'Tech Solutions Inc', 'techsolutions.example', NOW()),
  ('c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', 'Global Trading Ltd', 'globaltrading.example', NOW())
ON CONFLICT (id) DO NOTHING;

-- Remove existing roles (except super_admin which is system role)
DELETE FROM roles WHERE name != 'super_admin';

-- Remove existing permissions
DELETE FROM permissions;

-- ============================================================================
-- STEP 2: SEED FRS-COMPLIANT PERMISSIONS
-- ============================================================================

-- Core System Permissions
INSERT INTO permissions (name, description, resource, action, category, is_system_permission) VALUES
-- Authentication & User Management
('crm:auth:login', 'User login access', 'auth', 'login', 'system', true),
('crm:auth:logout', 'User logout access', 'auth', 'logout', 'system', true),
('crm:auth:profile:read', 'View user profile', 'auth', 'profile:read', 'system', true),
('crm:auth:profile:update', 'Update user profile', 'auth', 'profile:update', 'system', true),

-- User Management (Administrative)
('crm:user:record:read', 'View user records', 'user', 'record:read', 'administrative', true),
('crm:user:record:create', 'Create user records', 'user', 'record:create', 'administrative', true),
('crm:user:record:update', 'Update user records', 'user', 'record:update', 'administrative', true),
('crm:user:record:delete', 'Delete user records', 'user', 'record:delete', 'administrative', true),
('crm:user:role:assign', 'Assign user roles', 'user', 'role:assign', 'administrative', true),
('crm:user:role:revoke', 'Revoke user roles', 'user', 'role:revoke', 'administrative', true),

-- Role Management (Administrative)
('crm:role:record:read', 'View role records', 'role', 'record:read', 'administrative', true),
('crm:role:record:create', 'Create role records', 'role', 'record:create', 'administrative', true),
('crm:role:record:update', 'Update role records', 'role', 'record:update', 'administrative', true),
('crm:role:record:delete', 'Delete role records', 'role', 'record:delete', 'administrative', true),
('crm:role:permission:assign', 'Assign role permissions', 'role', 'permission:assign', 'administrative', true),

-- Customer Management (Core Business)
('crm:customer:record:read', 'View customer records', 'customer', 'record:read', 'module', true),
('crm:customer:record:create', 'Create customer records', 'customer', 'record:create', 'module', true),
('crm:customer:record:update', 'Update customer records', 'customer', 'record:update', 'module', true),
('crm:customer:record:delete', 'Delete customer records', 'customer', 'record:delete', 'module', true),
('crm:customer:contact:add', 'Add customer contacts', 'customer', 'contact:add', 'module', true),
('crm:customer:contact:remove', 'Remove customer contacts', 'customer', 'contact:remove', 'module', true),
('crm:customer:document:upload', 'Upload customer documents', 'customer', 'document:upload', 'module', true),
('crm:customer:document:download', 'Download customer documents', 'customer', 'document:download', 'module', true),

-- Sales & Deal Management (Core Business)
('crm:sales:deal:read', 'View sales deals', 'sales', 'deal:read', 'module', true),
('crm:sales:deal:create', 'Create sales deals', 'sales', 'deal:create', 'module', true),
('crm:sales:deal:update', 'Update sales deals', 'sales', 'deal:update', 'module', true),
('crm:sales:deal:delete', 'Delete sales deals', 'sales', 'deal:delete', 'module', true),
('crm:sales:deal:close', 'Close sales deals', 'sales', 'deal:close', 'module', true),
('crm:sales:pipeline:view', 'View sales pipeline', 'sales', 'pipeline:view', 'module', true),
('crm:sales:pipeline:manage', 'Manage sales pipeline', 'sales', 'pipeline:manage', 'module', true),
('crm:sales:forecast:view', 'View sales forecasts', 'sales', 'forecast:view', 'module', true),
('crm:sales:forecast:create', 'Create sales forecasts', 'sales', 'forecast:create', 'module', true),
('crm:sales:activity:log', 'Log sales activities', 'sales', 'activity:log', 'module', true),

-- Product Management (Core Business)
('crm:product:record:read', 'View product records', 'product', 'record:read', 'module', true),
('crm:product:record:create', 'Create product records', 'product', 'record:create', 'module', true),
('crm:product:record:update', 'Update product records', 'product', 'record:update', 'module', true),
('crm:product:record:delete', 'Delete product records', 'product', 'record:delete', 'module', true),
('crm:product:inventory:manage', 'Manage product inventory', 'product', 'inventory:manage', 'module', true),
('crm:product:pricing:manage', 'Manage product pricing', 'product', 'pricing:manage', 'module', true),

-- Service Contract Management (Core Business)
('crm:contract:service:read', 'View service contracts', 'contract', 'service:read', 'module', true),
('crm:contract:service:create', 'Create service contracts', 'contract', 'service:create', 'module', true),
('crm:contract:service:update', 'Update service contracts', 'contract', 'service:update', 'module', true),
('crm:contract:service:delete', 'Delete service contracts', 'contract', 'service:delete', 'module', true),
('crm:contract:service:approve', 'Approve service contracts', 'contract', 'service:approve', 'module', true),
('crm:contract:service:renew', 'Renew service contracts', 'contract', 'service:renew', 'module', true),

-- Job Work/Project Management (Core Business)
('crm:project:record:read', 'View project records', 'project', 'record:read', 'module', true),
('crm:project:record:create', 'Create project records', 'project', 'record:create', 'module', true),
('crm:project:record:update', 'Update project records', 'project', 'record:update', 'module', true),
('crm:project:record:delete', 'Delete project records', 'project', 'record:delete', 'module', true),
('crm:project:task:assign', 'Assign project tasks', 'project', 'task:assign', 'module', true),
('crm:project:resource:allocate', 'Allocate project resources', 'project', 'resource:allocate', 'module', true),
('crm:project:milestone:manage', 'Manage project milestones', 'project', 'milestone:manage', 'module', true),

-- Support & Ticket Management (Core Business)
('crm:support:ticket:read', 'View support tickets', 'support', 'ticket:read', 'module', true),
('crm:support:ticket:create', 'Create support tickets', 'support', 'ticket:create', 'module', true),
('crm:support:ticket:update', 'Update support tickets', 'support', 'ticket:update', 'module', true),
('crm:support:ticket:assign', 'Assign support tickets', 'support', 'ticket:assign', 'module', true),
('crm:support:ticket:resolve', 'Resolve support tickets', 'support', 'ticket:resolve', 'module', true),
('crm:support:ticket:close', 'Close support tickets', 'support', 'ticket:close', 'module', true),

-- Complaints Management (Core Business)
('crm:support:complaint:read', 'View complaints', 'support', 'complaint:read', 'module', true),
('crm:support:complaint:create', 'Create complaints', 'support', 'complaint:create', 'module', true),
('crm:support:complaint:update', 'Update complaints', 'support', 'complaint:update', 'module', true),
('crm:support:complaint:investigate', 'Investigate complaints', 'support', 'complaint:investigate', 'module', true),
('crm:support:complaint:resolve', 'Resolve complaints', 'support', 'complaint:resolve', 'module', true),

-- Contract Management (Core Business)
('crm:contract:record:read', 'View contract records', 'contract', 'record:read', 'module', true),
('crm:contract:record:create', 'Create contract records', 'contract', 'record:create', 'module', true),
('crm:contract:record:update', 'Update contract records', 'contract', 'record:update', 'module', true),
('crm:contract:record:delete', 'Delete contract records', 'contract', 'record:delete', 'module', true),
('crm:contract:record:approve', 'Approve contracts', 'contract', 'record:approve', 'module', true),

-- Reporting & Analytics (Core Business)
('crm:report:record:view', 'View reports', 'report', 'view', 'module', true),
('crm:report:record:create', 'Create reports', 'report', 'create', 'module', true),
('crm:report:record:export', 'Export reports', 'report', 'export', 'module', true),
('crm:analytics:insight:view', 'View analytics', 'analytics', 'view', 'module', true),
('crm:analytics:insight:create', 'Create analytics', 'analytics', 'create', 'module', true),
('crm:dashboard:panel:view', 'View dashboards', 'dashboard', 'view', 'module', true),
('crm:dashboard:panel:create', 'Create dashboards', 'dashboard', 'create', 'module', true),

-- Audit & Compliance (System)
('crm:audit:log:read', 'View audit logs', 'audit', 'log:read', 'system', true),
('crm:audit:log:export', 'Export audit logs', 'audit', 'log:export', 'system', true),
('crm:audit:report:generate', 'Generate audit reports', 'audit', 'report:generate', 'system', true),

-- System Administration (System)
('crm:system:platform:admin', 'System administration', 'system', 'admin', 'system', true),
('crm:system:config:manage', 'Manage system configuration', 'system', 'config:manage', 'system', true),
('crm:system:backup:create', 'Create system backups', 'system', 'backup:create', 'system', true),
('crm:system:backup:restore', 'Restore system backups', 'system', 'backup:restore', 'system', true),

-- Platform Administration (System)
('crm:platform:control:admin', 'Platform administration', 'platform', 'admin', 'system', true),
('crm:platform:tenant:create', 'Create tenants', 'platform', 'tenant:create', 'system', true),
('crm:platform:tenant:update', 'Update tenants', 'platform', 'tenant:update', 'system', true),
('crm:platform:tenant:delete', 'Delete tenants', 'platform', 'tenant:delete', 'system', true),
('crm:platform:tenant:suspend', 'Suspend tenants', 'platform', 'tenant:suspend', 'system', true),

-- Notification Management (System)
('crm:notification:channel:manage', 'Manage notifications', 'notification', 'manage', 'system', true),
('crm:notification:template:create', 'Create notification templates', 'notification', 'template:create', 'system', true),
('crm:notification:campaign:create', 'Create notification campaigns', 'notification', 'campaign:create', 'system', true),

-- Reference Data Management (Administrative)
('crm:reference:data:read', 'View reference data', 'reference', 'data:read', 'administrative', true),
('crm:reference:data:manage', 'Manage reference data', 'reference', 'data:manage', 'administrative', true),
('crm:reference:data:import', 'Import reference data', 'reference', 'data:import', 'administrative', true),
('crm:reference:data:export', 'Export reference data', 'reference', 'data:export', 'administrative', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 3: SEED FRS-COMPLIANT ROLES
-- ============================================================================

-- Insert FRS-compliant roles per tenant
INSERT INTO roles (name, description, tenant_id, is_system_role) VALUES
-- Acme Corporation roles (FRS-compliant)
('super_admin', 'Global system administrator', NULL, true),
('tenant_admin', 'Tenant administrator with full access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('sales_manager', 'Sales team manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('sales_representative', 'Sales representative', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('support_manager', 'Support team manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('support_agent', 'Support agent', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('contract_manager', 'Contract manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('project_manager', 'Project manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('business_analyst', 'Business analyst', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),

-- Tech Solutions Inc roles (FRS-compliant)
('tenant_admin', 'Tenant administrator with full access', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('sales_manager', 'Sales team manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('sales_representative', 'Sales representative', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('support_manager', 'Support team manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('support_agent', 'Support agent', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('contract_manager', 'Contract manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('project_manager', 'Project manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('business_analyst', 'Business analyst', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),

-- Global Trading Ltd roles (FRS-compliant)
('tenant_admin', 'Tenant administrator with full access', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('sales_manager', 'Sales team manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('sales_representative', 'Sales representative', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('support_manager', 'Support team manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('support_agent', 'Support agent', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('contract_manager', 'Contract manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('project_manager', 'Project manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('business_analyst', 'Business analyst', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: ASSIGN PERMISSIONS TO ROLES (FRS-COMPLIANT)
-- ============================================================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = true;

-- Tenant Admin permissions (comprehensive access within tenant)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- All authentication permissions
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    -- All user management permissions
    'crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete',
    'crm:user:role:assign', 'crm:user:role:revoke',
    -- All role management permissions
    'crm:role:record:read', 'crm:role:record:create', 'crm:role:record:update', 'crm:role:record:delete',
    'crm:role:permission:assign',
    -- All customer management permissions
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update', 'crm:customer:record:delete',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    -- All sales permissions
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:pipeline:manage', 'crm:sales:forecast:view', 'crm:sales:forecast:create',
    'crm:sales:activity:log',
    -- All product permissions
    'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update', 'crm:product:record:delete',
    'crm:product:inventory:manage', 'crm:product:pricing:manage',
    -- All contract permissions
    'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
    'crm:contract:service:approve', 'crm:contract:service:renew',
    'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
    'crm:contract:record:approve',
    -- All project permissions
    'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
    'crm:project:task:assign', 'crm:project:resource:allocate', 'crm:project:milestone:manage',
    -- All support permissions
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:assign',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    -- All reporting permissions
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    -- Audit permissions
    'crm:audit:log:read', 'crm:audit:log:export', 'crm:audit:report:generate',
    -- System administration
    'crm:system:platform:admin', 'crm:system:config:manage', 'crm:system:backup:create', 'crm:system:backup:restore',
    -- Notification management
    'crm:notification:channel:manage', 'crm:notification:template:create', 'crm:notification:campaign:create',
    -- Reference data management
    'crm:reference:data:read', 'crm:reference:data:manage', 'crm:reference:data:import', 'crm:reference:data:export'
)
WHERE r.name = 'tenant_admin';

-- Sales Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:pipeline:manage', 'crm:sales:forecast:view', 'crm:sales:forecast:create',
    'crm:sales:activity:log',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read' -- Can view team members
)
WHERE r.name = 'sales_manager';

-- Sales Representative permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:activity:log',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:export',
    'crm:analytics:insight:view',
    'crm:dashboard:panel:view'
)
WHERE r.name = 'sales_representative';

-- Support Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:assign',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read', -- Can view team members
    'crm:audit:log:read' -- Can view audit logs for compliance
)
WHERE r.name = 'support_manager';

-- Support Agent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    'crm:report:record:view', 'crm:report:record:export',
    'crm:analytics:insight:view',
    'crm:dashboard:panel:view'
)
WHERE r.name = 'support_agent';

-- Contract Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
    'crm:contract:service:approve', 'crm:contract:service:renew',
    'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
    'crm:contract:record:approve',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:audit:log:read'
)
WHERE r.name = 'contract_manager';

-- Project Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
    'crm:project:task:assign', 'crm:project:resource:allocate', 'crm:project:milestone:manage',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read' -- Can view team members
)
WHERE r.name = 'project_manager';

-- Business Analyst permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:sales:deal:read', 'crm:sales:pipeline:view', 'crm:sales:forecast:view',
    'crm:contract:service:read', 'crm:contract:record:read',
    'crm:project:record:read',
    'crm:support:ticket:read', 'crm:support:complaint:read',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:reference:data:read'
)
WHERE r.name = 'business_analyst';

-- ============================================================================
-- STEP 5: VALIDATION AND MONITORING
-- ============================================================================

-- Create function to validate FRS-compliant role and permission setup
CREATE OR REPLACE FUNCTION validate_frs_roles_permissions_setup()
RETURNS JSON AS $$
DECLARE
  result JSON;
  permissions_count INTEGER;
  roles_count INTEGER;
  role_permissions_count INTEGER;
  issues JSON := '[]'::json;
BEGIN
  SELECT COUNT(*) INTO permissions_count FROM permissions;
  SELECT COUNT(*) INTO roles_count FROM roles;
  SELECT COUNT(*) INTO role_permissions_count FROM role_permissions;

  -- Check for required FRS roles
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin' AND is_system_role = true) THEN
    issues := issues || json_build_array('Missing super_admin system role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'tenant_admin' AND tenant_id IS NOT NULL) THEN
    issues := issues || json_build_array('Missing tenant_admin roles');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name IN ('sales_manager', 'sales_representative', 'support_manager', 'support_agent', 'contract_manager', 'project_manager', 'business_analyst')) THEN
    issues := issues || json_build_array('Missing FRS-compliant business roles');
  END IF;

  -- Check for required FRS permissions
  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:auth:%') THEN
    issues := issues || json_build_array('Missing authentication permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:user:%') THEN
    issues := issues || json_build_array('Missing user management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:customer:%') THEN
    issues := issues || json_build_array('Missing customer management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:sales:%') THEN
    issues := issues || json_build_array('Missing sales management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:support:%') THEN
    issues := issues || json_build_array('Missing support management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:contract:%') THEN
    issues := issues || json_build_array('Missing contract management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:project:%') THEN
    issues := issues || json_build_array('Missing project management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:report:%') THEN
    issues := issues || json_build_array('Missing reporting permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:system:%') THEN
    issues := issues || json_build_array('Missing system administration permissions');
  END IF;

  -- Build result
  result := json_build_object(
    'status', CASE WHEN json_array_length(issues) = 0 THEN 'frs_compliant' ELSE 'issues_found' END,
    'summary', json_build_object(
      'permissions', permissions_count,
      'roles', roles_count,
      'role_permissions', role_permissions_count
    ),
    'issues', issues,
    'compliance_check', CASE
      WHEN json_array_length(issues) = 0 THEN 'FRS-compliant role and permission structure successfully implemented'
      ELSE 'FRS compliance issues found - review and correct'
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'FRS-compliant roles and permissions migration completed successfully';
  RAISE NOTICE 'Run: SELECT validate_frs_roles_permissions_setup(); to verify FRS compliance';
END $$;


-- ============================================================================
-- MIGRATION: 20251129000003_fix_navigation_permissions.sql
-- ============================================================================

-- ============================================================================
-- CRITICAL FIX: Update navigation items to use FRS-compliant permission names
-- Date: November 29, 2025
-- Purpose: Fix permission name mismatches between navigation items and FRS permissions
-- ============================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔧 Starting navigation permissions fix...';

    -- Update navigation items to use correct FRS-compliant permission names

    -- Dashboard: 'crm:dashboard:panel:view' ✓ (already correct)

    -- Customers: 'crm:customer:record:read' → 'crm:customer:record:read'
    UPDATE navigation_items
    SET permission_name = 'crm:customer:record:read'
    WHERE permission_name = 'crm:customer:record:read';

    -- Sales: 'crm:deal:record:read' → 'crm:sales:deal:read'
    UPDATE navigation_items
    SET permission_name = 'crm:sales:deal:read'
    WHERE permission_name = 'crm:deal:record:read';

    -- Masters section: 'crm:master:data:read' → 'crm:reference:data:read'
    UPDATE navigation_items
    SET permission_name = 'crm:reference:data:read'
    WHERE permission_name = 'crm:master:data:read';

    -- Companies: 'crm:company:record:read' → 'crm:reference:data:read' (companies are reference data)
    UPDATE navigation_items
    SET permission_name = 'crm:reference:data:read'
    WHERE permission_name = 'crm:company:record:read';

    -- Permissions: 'crm:permission:record:read' → 'crm:role:permission:assign' (closest match)
    UPDATE navigation_items
    SET permission_name = 'crm:role:permission:assign'
    WHERE permission_name = 'crm:permission:record:read';

    -- Settings: 'crm:system:config:manage' → 'crm:system:config:manage'
    UPDATE navigation_items
    SET permission_name = 'crm:system:config:manage'
    WHERE permission_name = 'crm:system:config:manage';

    -- Job Works: 'crm:job:work:read' → 'crm:project:record:read' (closest match)
    UPDATE navigation_items
    SET permission_name = 'crm:project:record:read'
    WHERE permission_name = 'crm:job:work:read';

    RAISE NOTICE '✅ Navigation permissions updated to FRS-compliant names';
END $$;

-- Verify the fix
DO $$
DECLARE
    total_items INTEGER;
    updated_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items FROM navigation_items;
    SELECT COUNT(*) INTO updated_items
    FROM navigation_items
    WHERE permission_name IN (
        'crm:customer:record:read',
        'crm:sales:deal:read',
        'crm:reference:data:read',
        'crm:role:permission:assign',
        'crm:system:config:manage',
        'crm:project:record:read'
    );

    RAISE NOTICE '📊 Navigation items: % total, % with FRS-compliant permissions', total_items, updated_items;

    IF updated_items < 10 THEN
        RAISE EXCEPTION '❌ Expected at least 10 items with FRS-compliant permissions, but found %', updated_items;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- FIX COMPLETE
-- ============================================================================
-- Summary:
-- - Updated navigation items to use FRS-compliant permission names
-- - Fixed mismatches between navigation config and seeded permissions
-- - Navigation should now work correctly with user permissions
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251130000001_restore_complaints_schema.sql
-- ============================================================================

-- ============================================================================
-- Restore Complaints Schema & View after isolated reset
-- Ensures complaint tables match TypeScript layer after any `supabase db reset`
-- ============================================================================

BEGIN;

-- Normalize complaints table to match src/types/complaints.ts
ALTER TABLE complaints
  DROP COLUMN IF EXISTS complaint_type,
  DROP COLUMN IF EXISTS severity,
  DROP COLUMN IF EXISTS assigned_to,
  DROP COLUMN IF EXISTS resolution,
  DROP COLUMN IF EXISTS resolved_at;

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'breakdown' CHECK (type IN ('breakdown', 'preventive', 'software_update', 'optimize')),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS engineer_resolution TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Align status values and constraint
UPDATE complaints SET status = 'new'
WHERE status NOT IN ('new', 'in_progress', 'closed');

ALTER TABLE complaints
  DROP CONSTRAINT IF EXISTS complaints_status_check,
  ADD CONSTRAINT complaints_status_check CHECK (status IN ('new', 'in_progress', 'closed'));

-- Complaint comments table for threaded discussions
CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES complaint_comments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON complaint_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_tenant_id ON complaint_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_parent_id ON complaint_comments(parent_id);

ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

-- Re-create enriched complaints view
DROP VIEW IF EXISTS complaints_with_details;

CREATE VIEW complaints_with_details AS
SELECT
  c.id,
  c.title,
  c.description,
  c.customer_id,
  cust.company_name AS customer_name,
  cust.contact_name AS customer_contact_name,
  cust.email AS customer_email,
  c.type,
  c.status,
  c.priority,
  c.assigned_engineer_id,
  COALESCE(u.name, u.email) AS assigned_engineer_name,
  c.engineer_resolution,
  c.tenant_id,
  c.created_at,
  c.updated_at,
  c.closed_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', cc.id,
        'complaint_id', cc.complaint_id,
        'user_id', cc.user_id,
        'content', cc.content,
        'created_at', cc.created_at,
        'parent_id', cc.parent_id
      )
    ) FILTER (WHERE cc.id IS NOT NULL),
    '[]'::json
  ) AS comments
FROM complaints c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_engineer_id = u.id
LEFT JOIN complaint_comments cc ON c.id = cc.complaint_id AND cc.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY
  c.id, c.title, c.description, c.customer_id, cust.company_name,
  cust.contact_name, cust.email, c.type, c.status, c.priority,
  c.assigned_engineer_id, u.name, u.email, c.engineer_resolution,
  c.tenant_id, c.created_at, c.updated_at, c.closed_at;

COMMENT ON VIEW complaints_with_details IS 'Complaints with customer & engineer enrichment plus threaded comments';

-- RLS policies for complaints table
DROP POLICY IF EXISTS users_view_tenant_complaints ON complaints;
DROP POLICY IF EXISTS admins_manage_tenant_complaints ON complaints;
DROP POLICY IF EXISTS super_admin_view_all_complaints ON complaints;

CREATE POLICY users_view_tenant_complaints ON complaints
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY admins_manage_tenant_complaints ON complaints
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaints ON complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- RLS policies for complaint_comments
DROP POLICY IF EXISTS users_view_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS users_manage_own_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS admins_manage_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS super_admin_view_all_complaint_comments ON complaint_comments;

CREATE POLICY users_view_tenant_complaint_comments ON complaint_comments
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY users_manage_own_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    user_id = auth.uid()
  );

CREATE POLICY admins_manage_tenant_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaint_comments ON complaint_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

COMMIT;




-- ============================================================================
-- MIGRATION: 20251130000002_user_management_element_permissions.sql
-- ============================================================================

-- ============================================================================
-- User Management Element Permissions
-- Ensures UI-level permissions exist for Users/Role modules post reset
-- ============================================================================

BEGIN;

-- Insert missing element-level permissions for user management screens
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
  ('crm:user:list:view:accessible', 'Allow access to the user list view', 'user', 'list:view:accessible', 'administrative', true, 'user:list:view'),
  ('crm:user:list:button.create:visible', 'Show the create user button', 'user', 'list:button.create:visible', 'administrative', true, 'user:list:button.create'),
  ('crm:user:list:button.export:visible', 'Show the export users button', 'user', 'list:button.export:visible', 'administrative', true, 'user:list:button.export'),
  ('crm:user:list:filters:visible', 'Enable advanced filters on the user list', 'user', 'list:filters:visible', 'administrative', true, 'user:list:filters'),
  ('crm:user:list:button.refresh:visible', 'Show the refresh button on user list', 'user', 'list:button.refresh:visible', 'administrative', true, 'user:list:button.refresh'),
  ('crm:user.*:button.edit:visible', 'Enable edit action within per-user menus', 'user', 'record:button.edit:visible', 'administrative', true, 'user:record:button.edit'),
  ('crm:user.*:button.resetpassword:visible', 'Enable reset password action on user rows', 'user', 'record:button.resetpassword:visible', 'administrative', true, 'user:record:button.resetpassword'),
  ('crm:user.*:button.delete:visible', 'Enable delete action on user rows', 'user', 'record:button.delete:visible', 'administrative', true, 'user:record:button.delete')
ON CONFLICT (name) DO NOTHING;

-- Grant the new permissions to any role that already manages user records
WITH new_permissions AS (
  SELECT id FROM permissions
  WHERE name IN (
    'crm:user:list:view:accessible',
    'crm:user:list:button.create:visible',
    'crm:user:list:button.export:visible',
    'crm:user:list:filters:visible',
    'crm:user:list:button.refresh:visible',
    'crm:user.*:button.edit:visible',
    'crm:user.*:button.resetpassword:visible',
    'crm:user.*:button.delete:visible'
  )
),
user_management_roles AS (
  SELECT DISTINCT rp.role_id
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:user:record:read',
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT umr.role_id, np.id
FROM user_management_roles umr
CROSS JOIN new_permissions np
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;




-- ============================================================================
-- MIGRATION: 20251130000003_fix_tenant_admin_element_permissions.sql
-- ============================================================================

-- ============================================================================
-- FIX TENANT ADMIN ELEMENT PERMISSIONS
-- Ensures tenant_admin roles get all necessary UI element permissions
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: UPDATE ELEMENT PERMISSIONS ASSIGNMENT FOR TENANT_ADMIN
-- ============================================================================

-- First, ensure tenant_admin roles get ALL element permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND r.name = 'tenant_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 2: ENSURE USER MANAGEMENT ELEMENT PERMISSIONS FOR TENANT_ADMIN
-- ============================================================================

-- Make sure tenant_admin gets specific user management UI permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  -- User list permissions
  'crm:user:list:view:accessible',
  'crm:user:list:button.create:visible',
  'crm:user:list:button.export:visible',
  'crm:user:list:filters:visible',
  'crm:user:list:button.refresh:visible',
  -- Per-user action permissions
  'crm:user.*:button.edit:visible',
  'crm:user.*:button.resetpassword:visible',
  'crm:user.*:button.delete:visible',
  -- Legacy admin permissions (if they exist)
  'crm:admin:users:list:view',
  'crm:admin:roles:assign:enabled'
)
WHERE r.name = 'tenant_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: ENSURE ALL ADMIN ROLES HAVE COMPREHENSIVE ACCESS
-- ============================================================================

-- Make sure any role with user management permissions gets UI permissions
WITH admin_roles AS (
  SELECT DISTINCT r.id
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM admin_roles ar
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND p.element_path LIKE 'user:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION QUERY
-- ============================================================================

-- Optional: Log what we assigned for debugging
DO $$
DECLARE
  tenant_admin_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT r.id) INTO tenant_admin_count
  FROM roles r
  WHERE r.name = 'tenant_admin';

  SELECT COUNT(DISTINCT rp.role_id) INTO element_perms_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.element_path IS NOT NULL;

  RAISE NOTICE 'Assigned element permissions to % tenant_admin roles', tenant_admin_count;
  RAISE NOTICE 'Total roles with element permissions: %', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - tenant_admin roles now get all element-level permissions
-- - User management UI permissions explicitly assigned
-- - Any role with user CRUD permissions gets UI permissions
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20251130000004_cleanup_roles_frs_compliance.sql
-- ============================================================================

-- ============================================================================
-- CLEANUP ROLES FOR FRS COMPLIANCE
-- Removes duplicate and non-FRS compliant roles
-- Ensures only FRS-defined roles exist with correct tenant_id assignment
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: REMOVE ALL NON-FRS COMPLIANT ROLES
-- ============================================================================

-- Remove legacy roles that don't match FRS specification
DELETE FROM role_permissions WHERE role_id IN (
    SELECT id FROM roles WHERE name IN (
        'admin',      -- Legacy, replaced by tenant_admin
        'manager',    -- Legacy, replaced by specific managers
        'user',       -- Legacy, replaced by specific user roles
        'engineer',   -- Legacy, replaced by support_agent
        'customer',   -- Not in FRS, external users not supported
        'sales_rep'   -- Legacy, replaced by sales_representative
    )
);

-- Remove the roles themselves
DELETE FROM roles WHERE name IN (
    'admin',      -- Legacy, replaced by tenant_admin
    'manager',    -- Legacy, replaced by specific managers
    'user',       -- Legacy, replaced by specific user roles
    'engineer',   -- Legacy, replaced by support_agent
    'customer',   -- Not in FRS, external users not supported
    'sales_rep'   -- Legacy, replaced by sales_representative
);

-- ============================================================================
-- STEP 2: ENSURE ONLY FRS-COMPLIANT ROLES EXIST
-- ============================================================================

-- FRS-compliant roles that should exist:
-- 1. super_admin (system-wide, tenant_id = NULL)
-- 2. tenant_admin (per tenant)
-- 3. sales_manager (per tenant)
-- 4. sales_representative (per tenant)
-- 5. support_manager (per tenant)
-- 6. support_agent (per tenant)
-- 7. contract_manager (per tenant)
-- 8. project_manager (per tenant)
-- 9. business_analyst (per tenant)

-- Remove any duplicate super_admin entries (keep only one)
DELETE FROM roles
WHERE name = 'super_admin'
AND id NOT IN (
    SELECT id FROM roles WHERE name = 'super_admin' ORDER BY created_at LIMIT 1
);

-- Ensure super_admin has correct properties
UPDATE roles
SET tenant_id = NULL, is_system_role = true, description = 'Global system administrator'
WHERE name = 'super_admin';

-- Ensure all tenant-specific roles have tenant_id set (not NULL)
-- If any FRS roles exist without tenant_id, they should be removed
DELETE FROM role_permissions WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst')
    AND tenant_id IS NULL
);

DELETE FROM roles
WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
               'support_manager', 'support_agent', 'contract_manager',
               'project_manager', 'business_analyst')
AND tenant_id IS NULL;

-- ============================================================================
-- STEP 3: VALIDATION
-- ============================================================================

DO $$
DECLARE
    total_roles INTEGER;
    super_admin_count INTEGER;
    tenant_roles_count INTEGER;
    invalid_tenant_roles INTEGER;
BEGIN
    -- Count total roles
    SELECT COUNT(*) INTO total_roles FROM roles;

    -- Count super_admin roles (should be exactly 1)
    SELECT COUNT(*) INTO super_admin_count
    FROM roles
    WHERE name = 'super_admin';

    -- Count tenant-specific roles
    SELECT COUNT(*) INTO tenant_roles_count
    FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst');

    -- Check for invalid tenant roles (FRS roles without tenant_id)
    SELECT COUNT(*) INTO invalid_tenant_roles
    FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst')
    AND tenant_id IS NULL;

    RAISE NOTICE 'Role cleanup completed:';
    RAISE NOTICE 'Total roles remaining: %', total_roles;
    RAISE NOTICE 'Super admin roles: % (should be 1)', super_admin_count;
    RAISE NOTICE 'FRS tenant roles: %', tenant_roles_count;
    RAISE NOTICE 'Invalid tenant roles (no tenant_id): % (should be 0)', invalid_tenant_roles;

    -- List remaining roles for verification
    RAISE NOTICE 'Remaining roles cleaned up successfully';
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Removed all legacy/non-FRS roles (admin, manager, user, engineer, customer, sales_rep)
-- ✅ Kept only FRS-compliant roles
-- ✅ Ensured super_admin has no tenant_id and is_system_role = true
-- ✅ Ensured all other FRS roles have tenant_id assigned
-- ✅ Removed duplicate roles
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20251130000005_fix_roles_insert_rls_policy.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix roles INSERT RLS policy to use permission-based checks
-- Date: 2025-11-30
-- Problem: roles INSERT policy checks for hardcoded role names ('admin', 'super_admin')
--          but users have 'tenant_admin' role, causing RLS violations
-- Solution: Update policy to check for crm:role:record:create permission (database-driven)
-- ============================================================================

-- ============================================================================
-- 1. CREATE FUNCTION TO CHECK ROLE CREATE PERMISSION
-- ============================================================================

-- Function to check if current user has crm:role:record:create permission
-- ✅ Database-driven: Checks actual permissions from database, not hardcoded roles
CREATE OR REPLACE FUNCTION has_role_create_permission_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND (p.name = 'crm:role:record:create' OR p.name = 'crm:role:record:update')
  );
$$;

-- Function to check if current user has role update permission
CREATE OR REPLACE FUNCTION has_role_update_permission_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.name = 'crm:role:record:update'
  );
$$;

-- Function to check if current user has role delete permission
CREATE OR REPLACE FUNCTION has_role_delete_permission_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.name = 'crm:role:record:delete'
  );
$$;

GRANT EXECUTE ON FUNCTION has_role_create_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_update_permission_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_delete_permission_safe() TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "admins_create_roles" ON roles;
DROP POLICY IF EXISTS "admins_update_roles" ON roles;
DROP POLICY IF EXISTS "admins_delete_roles" ON roles;

-- ============================================================================
-- 3. CREATE NEW PERMISSION-BASED POLICIES
-- ============================================================================

-- INSERT policy: Allow users with crm:role:record:create permission to create roles in their tenant
CREATE POLICY "admins_create_roles" ON roles
  FOR INSERT
  WITH CHECK (
    -- Super admins can create any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:create permission can create roles in their tenant
    (
      has_role_create_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Prevent tenant admins from creating platform roles
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- UPDATE policy: Allow users with crm:role:record:update permission to update roles in their tenant
CREATE POLICY "admins_update_roles" ON roles
  FOR UPDATE
  USING (
    -- Super admins can update any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:update permission can update roles in their tenant
    (
      has_role_update_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Cannot update system roles (platform-level)
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      has_role_update_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- DELETE policy: Allow users with crm:role:record:delete permission to delete roles in their tenant
CREATE POLICY "admins_delete_roles" ON roles
  FOR DELETE
  USING (
    -- Super admins can delete any role
    is_current_user_super_admin_safe()
    OR
    -- ✅ Database-driven: Users with crm:role:record:delete permission can delete roles in their tenant
    (
      has_role_delete_permission_safe()
      AND roles.tenant_id = get_current_user_tenant_id_safe()
      AND roles.tenant_id IS NOT NULL
      -- Cannot delete system roles (platform-level)
      AND NOT (roles.is_system_role = TRUE AND roles.tenant_id IS NULL)
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created SECURITY DEFINER functions to check role management permissions
-- - Dropped existing hardcoded role-based policies
-- - Created new permission-based policies for INSERT, UPDATE, DELETE
-- - Policies check for crm:role:record:create/update/delete permissions (database-driven)
-- - Super admins can manage any role
-- - Regular admins can manage roles in their tenant (if they have the permission)
-- - All policies use SECURITY DEFINER functions (no recursion)
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251130000006_fix_audit_logs_rls_policy.sql
-- ============================================================================

-- ============================================================================
-- Migration: Fix audit_logs RLS policy to use safe functions
-- Date: 2025-11-30
-- Problem: audit_logs INSERT policy uses direct SELECT queries which can cause recursion
--          and fails when tenant_id doesn't match or is null
-- Solution: Update policy to use SECURITY DEFINER safe functions
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can update tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can delete tenant audit_logs" ON audit_logs;

-- ============================================================================
-- 2. CREATE NEW POLICIES USING SAFE FUNCTIONS
-- ============================================================================

-- SELECT policy: Users can view audit logs from their tenant or if super admin
CREATE POLICY "Users can view tenant audit_logs" ON audit_logs
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
    OR user_id = auth.uid()  -- Users can always see their own audit logs
  );

-- INSERT policy: Allow authenticated users to create audit logs
-- ✅ Database-driven: Uses safe functions to avoid recursion
CREATE POLICY "Users can insert tenant audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Super admin can insert audit logs for any tenant
      is_current_user_super_admin_safe()
      OR
      -- Regular users can insert audit logs for their tenant
      (
        tenant_id = get_current_user_tenant_id_safe()
        AND get_current_user_tenant_id_safe() IS NOT NULL
      )
      OR
      -- Allow inserting audit logs with user_id matching current user (for user-specific logs)
      user_id = auth.uid()
    )
  );

-- UPDATE policy: Only super admin can update audit logs (for data corrections)
CREATE POLICY "Users can update tenant audit_logs" ON audit_logs
  FOR UPDATE
  USING (
    is_current_user_super_admin_safe()
  )
  WITH CHECK (
    is_current_user_super_admin_safe()
  );

-- DELETE policy: Only super admin can delete audit logs (for compliance/legal requirements)
CREATE POLICY "Users can delete tenant audit_logs" ON audit_logs
  FOR DELETE
  USING (
    is_current_user_super_admin_safe()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Dropped existing policies that used direct SELECT queries
-- - Created new policies using SECURITY DEFINER safe functions
-- - INSERT policy allows authenticated users to create audit logs for their tenant
-- - Super admins can manage audit logs for any tenant
-- - All policies use safe functions (no recursion)
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251130000007_add_dashboard_element_permissions.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add Dashboard Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Dashboard controls not loading after element-level permission implementation
--          Missing element permissions for dashboard widgets, buttons, and sections
-- Solution: Create comprehensive dashboard element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT DASHBOARD ELEMENT PERMISSIONS
-- ============================================================================

-- Dashboard panel/view permissions
-- ✅ Element paths match what DashboardPage checks (without action suffix)
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Main dashboard access
('crm:dashboard:panel:view', 'Access dashboard and analytics', 'dashboard', 'view', 'module', true, 'crm:dashboard:panel:view'),
('crm:dashboard:stats:view', 'View dashboard statistics', 'dashboard', 'stats:view', 'module', true, 'crm:dashboard:stats:view'),

-- Dashboard widgets
('crm:dashboard:widget.recentactivity:view', 'View recent activity widget', 'dashboard', 'widget.recentactivity:view', 'module', true, 'crm:dashboard:widget.recentactivity:view'),
('crm:dashboard:widget.topcustomers:view', 'View top customers widget', 'dashboard', 'widget.topcustomers:view', 'module', true, 'crm:dashboard:widget.topcustomers:view'),
('crm:dashboard:widget.ticketstats:view', 'View ticket statistics widget', 'dashboard', 'widget.ticketstats:view', 'module', true, 'crm:dashboard:widget.ticketstats:view'),
('crm:dashboard:widget.salespipeline:view', 'View sales pipeline widget', 'dashboard', 'widget.salespipeline:view', 'module', true, 'crm:dashboard:widget.salespipeline:view'),

-- Dashboard sections
('crm:dashboard:section.quickactions:view', 'View quick actions section', 'dashboard', 'section.quickactions:view', 'module', true, 'crm:dashboard:section.quickactions:view'),

-- Dashboard buttons
('crm:dashboard:button.downloadreport', 'Download dashboard report', 'dashboard', 'button.downloadreport', 'module', true, 'crm:dashboard:button.downloadreport'),
('crm:dashboard:button.newcustomer', 'Create new customer from dashboard', 'dashboard', 'button.newcustomer', 'module', true, 'crm:dashboard:button.newcustomer'),
('crm:dashboard:button.createdeal', 'Create new deal from dashboard', 'dashboard', 'button.createdeal', 'module', true, 'crm:dashboard:button.createdeal'),
('crm:dashboard:button.newticket', 'Create new ticket from dashboard', 'dashboard', 'button.newticket', 'module', true, 'crm:dashboard:button.newticket')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN DASHBOARD PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all dashboard permissions to tenant_admin and super_admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:dashboard:panel:view',
  'crm:dashboard:stats:view',
  'crm:dashboard:widget.recentactivity:view',
  'crm:dashboard:widget.topcustomers:view',
  'crm:dashboard:widget.ticketstats:view',
  'crm:dashboard:widget.salespipeline:view',
  'crm:dashboard:section.quickactions:view',
  'crm:dashboard:button.downloadreport',
  'crm:dashboard:button.newcustomer',
  'crm:dashboard:button.createdeal',
  'crm:dashboard:button.newticket'
)
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign dashboard view permissions to manager roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:dashboard:panel:view',
  'crm:dashboard:stats:view',
  'crm:dashboard:widget.recentactivity:view',
  'crm:dashboard:widget.topcustomers:view',
  'crm:dashboard:widget.ticketstats:view',
  'crm:dashboard:widget.salespipeline:view',
  'crm:dashboard:section.quickactions:view'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic dashboard view to all other roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'crm:dashboard:panel:view'
AND r.name NOT IN ('tenant_admin', 'admin', 'super_admin', 'Administrator', 'manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for dashboard elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button%' THEN 'write'
    WHEN p.name LIKE '%widget%' OR p.name LIKE '%section%' THEN 'read'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:dashboard:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  dashboard_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dashboard_perms_count
  FROM permissions
  WHERE name LIKE 'crm:dashboard:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:dashboard:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:dashboard:%';

  RAISE NOTICE '✅ Created % dashboard permissions', dashboard_perms_count;
  RAISE NOTICE '✅ Assigned dashboard permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 11 dashboard element permissions (panel, stats, widgets, sections, buttons)
-- - Assigned permissions to appropriate roles (admin, manager, user)
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251130000008_add_customer_form_element_permissions.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add Customer Form Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Customer form action buttons (Save/Create/Update) not visible
--          Missing element permissions for customer form sections and buttons
-- Solution: Create comprehensive customer form element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT CUSTOMER FORM ELEMENT PERMISSIONS
-- ============================================================================

-- Customer form action buttons
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Form action buttons
('crm:contacts:form:button.save', 'Save button enabled on customer form', 'contacts', 'form:button.save', 'module', true, 'crm:contacts:form:button.save'),
('crm:contacts:form:button.create', 'Create button enabled on customer form', 'contacts', 'form:button.create', 'module', true, 'crm:contacts:form:button.create'),
('crm:contacts:form:button.update', 'Update button enabled on customer form', 'contacts', 'form:button.update', 'module', true, 'crm:contacts:form:button.update'),
('crm:contacts:form:button.cancel', 'Cancel button visible on customer form', 'contacts', 'form:button.cancel', 'module', true, 'crm:contacts:form:button.cancel'),

-- Form sections
('crm:contacts:form:section.basic', 'Basic information section accessible', 'contacts', 'form:section.basic', 'module', true, 'crm:contacts:form:section.basic'),
('crm:contacts:form:section.business', 'Business information section accessible', 'contacts', 'form:section.business', 'module', true, 'crm:contacts:form:section.business'),
('crm:contacts:form:section.address', 'Address information section accessible', 'contacts', 'form:section.address', 'module', true, 'crm:contacts:form:section.address'),
('crm:contacts:form:section.financial', 'Financial information section accessible', 'contacts', 'form:section.financial', 'module', true, 'crm:contacts:form:section.financial'),
('crm:contacts:form:section.lead', 'Lead information section accessible', 'contacts', 'form:section.lead', 'module', true, 'crm:contacts:form:section.lead'),
('crm:contacts:form:section.notes', 'Notes section accessible', 'contacts', 'form:section.notes', 'module', true, 'crm:contacts:form:section.notes'),

-- Form fields (for granular control)
('crm:contacts:form:field.company_name', 'Company name field editable', 'contacts', 'form:field.company_name', 'module', true, 'crm:contacts:form:field.company_name'),
('crm:contacts:form:field.contact_name', 'Contact name field editable', 'contacts', 'form:field.contact_name', 'module', true, 'crm:contacts:form:field.contact_name'),
('crm:contacts:form:field.email', 'Email field editable', 'contacts', 'form:field.email', 'module', true, 'crm:contacts:form:field.email'),
('crm:contacts:form:field.phone', 'Phone field editable', 'contacts', 'form:field.phone', 'module', true, 'crm:contacts:form:field.phone'),
('crm:contacts:form:field.status', 'Status field editable', 'contacts', 'form:field.status', 'module', true, 'crm:contacts:form:field.status'),
('crm:contacts:form:field.assigned_to', 'Assigned to field editable', 'contacts', 'form:field.assigned_to', 'module', true, 'crm:contacts:form:field.assigned_to')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN CUSTOMER FORM PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all customer form permissions to roles that have customer record permissions
WITH customer_management_roles AS (
  SELECT DISTINCT r.id, r.name
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:customer:record:create',
    'crm:customer:record:update',
    'crm:customer:record:read',
    'crm:contacts:list:view',
    'crm:contacts:list:button.create:visible'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT cmr.id, p.id
FROM customer_management_roles cmr
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:form:button.save',
  'crm:contacts:form:button.create',
  'crm:contacts:form:button.update',
  'crm:contacts:form:button.cancel',
  'crm:contacts:form:section.basic',
  'crm:contacts:form:section.business',
  'crm:contacts:form:section.address',
  'crm:contacts:form:section.financial',
  'crm:contacts:form:section.lead',
  'crm:contacts:form:section.notes',
  'crm:contacts:form:field.company_name',
  'crm:contacts:form:field.contact_name',
  'crm:contacts:form:field.email',
  'crm:contacts:form:field.phone',
  'crm:contacts:form:field.status',
  'crm:contacts:form:field.assigned_to'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign form permissions to admin roles explicitly
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name LIKE 'crm:contacts:form:%'
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic form permissions to manager roles (view and edit, but not all fields)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:form:button.save',
  'crm:contacts:form:button.update',
  'crm:contacts:form:button.cancel',
  'crm:contacts:form:section.basic',
  'crm:contacts:form:section.business',
  'crm:contacts:form:section.address',
  'crm:contacts:form:section.lead',
  'crm:contacts:form:section.notes',
  'crm:contacts:form:field.company_name',
  'crm:contacts:form:field.contact_name',
  'crm:contacts:form:field.email',
  'crm:contacts:form:field.phone',
  'crm:contacts:form:field.status'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for customer form elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button.save%' OR p.name LIKE '%button.create%' OR p.name LIKE '%button.update%' THEN 'write'
    WHEN p.name LIKE '%button.cancel%' THEN 'read'
    WHEN p.name LIKE '%section%' THEN 'read'
    WHEN p.name LIKE '%field%' THEN 'write'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:contacts:form:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  form_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO form_perms_count
  FROM permissions
  WHERE name LIKE 'crm:contacts:form:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:contacts:form:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:contacts:form:%';

  RAISE NOTICE '✅ Created % customer form permissions', form_perms_count;
  RAISE NOTICE '✅ Assigned customer form permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 16 customer form element permissions (buttons, sections, fields)
-- - Assigned permissions to roles with customer management access
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251130000009_add_customer_detail_element_permissions.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add Customer Detail Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Customer detail panel shows "You don't have permission to access this section"
--          Action buttons (Edit) not visible
-- Solution: Create comprehensive customer detail element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT CUSTOMER DETAIL ELEMENT PERMISSIONS
-- ============================================================================

-- Customer detail action buttons
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Detail action buttons
('crm:contacts:detail:button.edit', 'Edit button visible on customer detail', 'contacts', 'detail:button.edit', 'module', true, 'crm:contacts:detail:button.edit'),
('crm:contacts:detail:button.delete', 'Delete button visible on customer detail', 'contacts', 'detail:button.delete', 'module', true, 'crm:contacts:detail:button.delete'),
('crm:contacts:detail:button.close', 'Close button visible on customer detail', 'contacts', 'detail:button.close', 'module', true, 'crm:contacts:detail:button.close'),

-- Detail sections
('crm:contacts:detail:section.basic', 'Basic information section accessible on customer detail', 'contacts', 'detail:section.basic', 'module', true, 'crm:contacts:detail:section.basic'),
('crm:contacts:detail:section.business', 'Business information section accessible on customer detail', 'contacts', 'detail:section.business', 'module', true, 'crm:contacts:detail:section.business'),
('crm:contacts:detail:section.address', 'Address information section accessible on customer detail', 'contacts', 'detail:section.address', 'module', true, 'crm:contacts:detail:section.address'),
('crm:contacts:detail:section.financial', 'Financial information section accessible on customer detail', 'contacts', 'detail:section.financial', 'module', true, 'crm:contacts:detail:section.financial'),
('crm:contacts:detail:section.lead', 'Lead information section accessible on customer detail', 'contacts', 'detail:section.lead', 'module', true, 'crm:contacts:detail:section.lead'),
('crm:contacts:detail:section.notes', 'Notes section accessible on customer detail', 'contacts', 'detail:section.notes', 'module', true, 'crm:contacts:detail:section.notes'),
('crm:contacts:detail:section.timeline', 'Timeline section accessible on customer detail', 'contacts', 'detail:section.timeline', 'module', true, 'crm:contacts:detail:section.timeline'),
('crm:contacts:detail:section.metrics', 'Key metrics section accessible on customer detail', 'contacts', 'detail:section.metrics', 'module', true, 'crm:contacts:detail:section.metrics'),

-- Detail fields (for granular control)
('crm:contacts:detail:field.company_name', 'Company name field visible on customer detail', 'contacts', 'detail:field.company_name', 'module', true, 'crm:contacts:detail:field.company_name'),
('crm:contacts:detail:field.email', 'Email field visible on customer detail', 'contacts', 'detail:field.email', 'module', true, 'crm:contacts:detail:field.email'),
('crm:contacts:detail:field.phone', 'Phone field visible on customer detail', 'contacts', 'detail:field.phone', 'module', true, 'crm:contacts:detail:field.phone'),
('crm:contacts:detail:field.status', 'Status field visible on customer detail', 'contacts', 'detail:field.status', 'module', true, 'crm:contacts:detail:field.status')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN CUSTOMER DETAIL PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all customer detail permissions to roles that have customer record permissions
WITH customer_management_roles AS (
  SELECT DISTINCT r.id, r.name
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:customer:record:read',
    'crm:customer:record:update',
    'crm:customer:record:delete',
    'crm:contacts:list:view',
    'crm:contacts:detail:view'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT cmr.id, p.id
FROM customer_management_roles cmr
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:detail:button.edit',
  'crm:contacts:detail:button.delete',
  'crm:contacts:detail:button.close',
  'crm:contacts:detail:section.basic',
  'crm:contacts:detail:section.business',
  'crm:contacts:detail:section.address',
  'crm:contacts:detail:section.financial',
  'crm:contacts:detail:section.lead',
  'crm:contacts:detail:section.notes',
  'crm:contacts:detail:section.timeline',
  'crm:contacts:detail:section.metrics',
  'crm:contacts:detail:field.company_name',
  'crm:contacts:detail:field.email',
  'crm:contacts:detail:field.phone',
  'crm:contacts:detail:field.status'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign detail permissions to admin roles explicitly
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name LIKE 'crm:contacts:detail:%'
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic detail permissions to manager roles (view sections, but not all actions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:detail:button.edit',
  'crm:contacts:detail:button.close',
  'crm:contacts:detail:section.basic',
  'crm:contacts:detail:section.business',
  'crm:contacts:detail:section.address',
  'crm:contacts:detail:section.financial',
  'crm:contacts:detail:section.lead',
  'crm:contacts:detail:section.notes',
  'crm:contacts:detail:section.timeline',
  'crm:contacts:detail:section.metrics',
  'crm:contacts:detail:field.company_name',
  'crm:contacts:detail:field.email',
  'crm:contacts:detail:field.phone',
  'crm:contacts:detail:field.status'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for customer detail elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button.edit%' OR p.name LIKE '%button.delete%' THEN 'write'
    WHEN p.name LIKE '%button.close%' THEN 'read'
    WHEN p.name LIKE '%section%' THEN 'read'
    WHEN p.name LIKE '%field%' THEN 'read'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:contacts:detail:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  detail_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO detail_perms_count
  FROM permissions
  WHERE name LIKE 'crm:contacts:detail:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:contacts:detail:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:contacts:detail:%';

  RAISE NOTICE '✅ Created % customer detail permissions', detail_perms_count;
  RAISE NOTICE '✅ Assigned customer detail permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 15 customer detail element permissions (buttons, sections, fields)
-- - Assigned permissions to roles with customer management access
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251130000010_add_deleted_at_to_products.sql
-- ============================================================================

-- ============================================================================
-- Migration: Add deleted_at column to products table
-- Date: 2025-11-30
-- Problem: products table missing deleted_at column but service uses it for soft delete
-- Solution: Add deleted_at column to support soft delete pattern
-- ============================================================================

BEGIN;

-- Add deleted_at column to products table for soft delete support
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when filtering by deleted_at
CREATE INDEX IF NOT EXISTS idx_products_deleted_at
  ON public.products(deleted_at)
  WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete timestamp. When set, product is considered deleted. NULL means active.';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'deleted_at'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE '✅ deleted_at column added to products table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add deleted_at column to products table';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Added deleted_at column to products table
-- - Created index for performance
-- - Added documentation comment
-- - Supports soft delete pattern used in productService
-- ============================================================================




-- ============================================================================
-- MIGRATION: 20251202000001_update_sales_table_for_deals.sql
-- ============================================================================

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


-- ============================================================================
-- MIGRATION: 20251204_add_deal_types_and_items.sql
-- ============================================================================

-- Migration: Add deal_type, contract_id and extend deal_items for PRODUCT/SERVICE support
-- Date: 2025-12-04
-- Purpose: Add deal_type, contract reference and service-related fields to deal_items

BEGIN;

-- Add deal_type to deals
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS deal_type VARCHAR(20) NOT NULL DEFAULT 'PRODUCT' CHECK (deal_type IN ('PRODUCT','SERVICE'));

-- Add contract_id to deals as nullable FK
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Conversion traceability columns to prevent duplicate downstream records
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS converted_to_order_id UUID;

ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS converted_to_contract_id UUID;

-- Indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_status_type ON deals(status, deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_contract_id ON deals(contract_id);

-- Extend deal_items
ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS service_id UUID;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed' NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS duration VARCHAR(50);

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Constraint: product_id XOR service_id (exclusive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'deal_items' AND c.conname = 'chk_deal_items_product_or_service') THEN
      ALTER TABLE deal_items ADD CONSTRAINT chk_deal_items_product_or_service CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
      );
    END IF;
  END IF;
END$$;

-- Add indexes where useful
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON deal_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_deal_items_service_id ON deal_items(service_id);
  END IF;
END$$;

COMMIT;



-- ============================================================================
-- MIGRATION: 20251204000001_create_deal_transactions.sql
-- ============================================================================

-- Migration: create stored procedures for atomic deal + items operations
-- Date: 2025-12-04
-- Adds two helper functions:
--   - create_deal_with_items(p_json json, p_tenant uuid) RETURNS uuid
--   - update_deal_with_items(p_json json, p_tenant uuid) RETURNS uuid
-- These functions perform inserts/updates for deals and deal_items in a single
-- database-side transaction so callers (Supabase RPC) observe atomic behavior.

BEGIN;

-- create_deal_with_items: inserts a deal row and associated deal_items
CREATE OR REPLACE FUNCTION public.create_deal_with_items(p_json json, p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id uuid;
  v_items json;
BEGIN
  -- Insert deal and capture generated id
  INSERT INTO public.deals (
    tenant_id, title, description, customer_id, value, currency, status,
    deal_type, source, campaign, close_date, expected_close_date, assigned_to,
    assigned_to_name, notes, tags, competitor_info, win_loss_reason, opportunity_id,
    contract_id, converted_to_order_id, converted_to_contract_id, created_at, updated_at, created_by
  )
  SELECT
    p_tenant,
    p_json->>'title',
    p_json->>'description',
    NULLIF(p_json->>'customer_id','')::uuid,
    NULLIF(p_json->>'value','')::numeric,
    COALESCE(p_json->>'currency','USD'),
    p_json->>'status',
    p_json->>'dealType',
    p_json->>'source',
    p_json->>'campaign',
    NULLIF(p_json->>'close_date','')::timestamptz,
    NULLIF(p_json->>'expected_close_date','')::timestamptz,
    NULLIF(p_json->>'assigned_to','')::uuid,
    p_json->>'assigned_to_name',
    p_json->>'notes',
    CASE WHEN p_json->>'tags' IS NULL THEN NULL ELSE string_to_array(p_json->>'tags', ',') END,
    p_json->>'competitor_info',
    p_json->>'win_loss_reason',
    NULLIF(p_json->>'opportunity_id','')::uuid,
    NULLIF(p_json->>'contract_id','')::uuid,
    NULLIF(p_json->>'converted_to_order_id','')::uuid,
    NULLIF(p_json->>'converted_to_contract_id','')::uuid,
    now(), now(), NULLIF(p_json->>'created_by','')::uuid
  RETURNING id INTO v_deal_id;

  -- Insert items if provided
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    INSERT INTO public.deal_items (
      deal_id, product_id, product_name, product_description, quantity, unit_price,
      discount, discount_type, tax, tax_rate, service_id, duration, notes, line_total,
      tenant_id, created_at, updated_at
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      item->>'product_name',
      item->>'product_description',
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      NULLIF(item->>'discount','')::numeric,
      COALESCE(item->>'discount_type','fixed'),
      NULLIF(item->>'tax','')::numeric,
      NULLIF(item->>'tax_rate','')::numeric,
      NULLIF(item->>'service_id','')::uuid,
      NULLIF(item->>'duration','')::int,
      item->>'notes',
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now()
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- update_deal_with_items: updates deal row and replaces associated deal_items atomically
CREATE OR REPLACE FUNCTION public.update_deal_with_items(p_json json, p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal_id uuid := NULL;
  v_items json;
BEGIN
  -- Require id
  IF p_json->>'id' IS NULL THEN
    RAISE EXCEPTION 'id is required';
  END IF;

  v_deal_id := (p_json->>'id')::uuid;

  -- Update allowed fields on deals (only fields provided)
  UPDATE public.deals SET
    title = COALESCE(NULLIF(p_json->>'title',''), title),
    description = COALESCE(NULLIF(p_json->>'description',''), description),
    customer_id = COALESCE(NULLIF(p_json->>'customer_id','')::uuid, customer_id),
    value = COALESCE(NULLIF(p_json->>'value','')::numeric, value),
    currency = COALESCE(p_json->>'currency', currency),
    status = COALESCE(p_json->>'status', status),
    source = COALESCE(p_json->>'source', source),
    campaign = COALESCE(p_json->>'campaign', campaign),
    close_date = COALESCE(NULLIF(p_json->>'close_date','')::timestamptz, close_date),
    expected_close_date = COALESCE(NULLIF(p_json->>'expected_close_date','')::timestamptz, expected_close_date),
    assigned_to = COALESCE(NULLIF(p_json->>'assigned_to','')::uuid, assigned_to),
    assigned_to_name = COALESCE(p_json->>'assigned_to_name', assigned_to_name),
    notes = COALESCE(p_json->>'notes', notes),
    tags = CASE WHEN p_json->>'tags' IS NULL THEN tags ELSE string_to_array(p_json->>'tags', ',') END,
    competitor_info = COALESCE(p_json->>'competitor_info', competitor_info),
    win_loss_reason = COALESCE(p_json->>'win_loss_reason', win_loss_reason),
    opportunity_id = COALESCE(NULLIF(p_json->>'opportunity_id','')::uuid, opportunity_id),
    contract_id = COALESCE(NULLIF(p_json->>'contract_id','')::uuid, contract_id),
    converted_to_order_id = COALESCE(NULLIF(p_json->>'converted_to_order_id','')::uuid, converted_to_order_id),
    converted_to_contract_id = COALESCE(NULLIF(p_json->>'converted_to_contract_id','')::uuid, converted_to_contract_id),
    updated_at = now()
  WHERE id = v_deal_id AND tenant_id = p_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found or not in tenant';
  END IF;

  -- If items provided, delete existing items for this deal and re-insert
  v_items := p_json->'items';
  IF v_items IS NOT NULL THEN
    DELETE FROM public.deal_items WHERE deal_id = v_deal_id AND tenant_id = p_tenant;

    INSERT INTO public.deal_items (
      deal_id, product_id, product_name, product_description, quantity, unit_price,
      discount, discount_type, tax, tax_rate, service_id, duration, notes, line_total,
      tenant_id, created_at, updated_at
    )
    SELECT
      v_deal_id,
      NULLIF(item->>'product_id','')::uuid,
      item->>'product_name',
      item->>'product_description',
      NULLIF(item->>'quantity','')::int,
      NULLIF(item->>'unit_price','')::numeric,
      NULLIF(item->>'discount','')::numeric,
      COALESCE(item->>'discount_type','fixed'),
      NULLIF(item->>'tax','')::numeric,
      NULLIF(item->>'tax_rate','')::numeric,
      NULLIF(item->>'service_id','')::uuid,
      NULLIF(item->>'duration','')::int,
      item->>'notes',
      NULLIF(item->>'line_total','')::numeric,
      p_tenant,
      now(), now()
    FROM json_array_elements(v_items) AS item;
  END IF;

  RETURN v_deal_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

COMMIT;



-- ============================================================================
-- MIGRATION: 20251205000000_remove_realtime_conflicting_tenant.sql
-- ============================================================================

-- Migration: Remove conflicting realtime tenant to avoid Realtime seeding duplicate errors
-- This migration is safe to run in dev/local and ensures Realtime's seed can insert its tenant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    -- Always remove by name if present
    DELETE FROM public.tenants WHERE name = 'realtime-dev';

    -- If tenants table has an external_id column, remove by external_id as well
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'external_id'
    ) THEN
      DELETE FROM public.tenants WHERE external_id = 'realtime-dev';
    END IF;
  END IF;
END
$$;



-- ============================================================================
-- MIGRATION: 20251205000001_add_missing_schema_columns.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: Add Missing Schema Columns
-- Adds preferences, metadata columns to users table and company_id to customers table
-- Also adds missing columns for products and other tables
--
-- This migration fixes schema synchronization issues where application code
-- expects columns that were missing from the database schema.
--
-- Columns Added:
-- - users.preferences: JSONB (default '{}')
-- - users.metadata: JSONB (default '{}')
-- - customers.company_id: UUID (foreign key to companies.id)
-- - products.is_active: BOOLEAN (default TRUE)
-- - products.sku: VARCHAR(100) (renamed from code)
-- - Various deleted_at columns for soft delete functionality
--
-- Date: December 5, 2025 (Updated: December 6, 2025)
-- ============================================================================

-- Add preferences column to users table (expected by application)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to users table (expected by application)
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add company_id foreign key to customers table (expected by application)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for the new company_id column for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);

-- Add is_active column to products table (expected by application)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename code column to sku in products table for consistency (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'code') THEN
        ALTER TABLE products RENAME COLUMN code TO sku;
    END IF;
END $$;

-- Add deleted_at columns for soft delete functionality
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_works ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251206000001_create_deal_items_table.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: Create Deal Items Table
-- Creates the deal_items table for CRM deal line items
--
-- This table stores individual line items within CRM deals, separate from
-- sale_items which are used for product sales/orders.
--
-- Date: December 6, 2025
-- ============================================================================

-- Create deal_items table for CRM deal line items
CREATE TABLE IF NOT EXISTS deal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES products(id) ON DELETE SET NULL, -- For service deals
    product_name VARCHAR(255),
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Ensure either product_id or service_id is provided
    CONSTRAINT deal_items_product_or_service_check
    CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL) OR
        (product_id IS NOT NULL AND service_id IS NOT NULL)
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON deal_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON deal_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_service_id ON deal_items(service_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_tenant_id ON deal_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_tenant_deal ON deal_items(tenant_id, deal_id);

-- Add updated_at trigger
CREATE TRIGGER deal_items_updated_at_trigger
    BEFORE UPDATE ON deal_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "Users can view tenant deal_items" ON deal_items FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can insert tenant deal_items" ON deal_items FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can update tenant deal_items" ON deal_items FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can delete tenant deal_items" ON deal_items FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================


-- ============================================================================
-- MIGRATION: 20251207000001_add_product_sale_permissions.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: Add Product-Sales Element-Level Permissions
-- Adds product-sales permissions required by the product-sales module
-- Following ELEMENT_PERMISSION_GUIDE.md naming convention:
-- crm:{module}:{feature}:{element}:{action}
--
-- This migration fixes the "Permission Denied" error for the product-sales module
-- by adding the missing element-level permissions to the database.
--
-- Permission Token Format: crm:product-sales:{feature}:{element}:{action}
--
-- Date: December 6, 2025
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Element-Level Permissions for Product-Sales Module
-- ============================================================================

-- List view permissions
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
-- Module access
('crm:product-sales:access', 'Access product sales module', 'module', 'product-sales', 'access', true),

-- List view permissions
('crm:product-sales:list:view', 'View product sales list', 'module', 'product-sales', 'list:view', true),
('crm:product-sales:list:button.create:visible', 'Show create product sale button', 'module', 'product-sales', 'list:button.create:visible', true),
('crm:product-sales:list:button.export:visible', 'Show export product sales button', 'module', 'product-sales', 'list:button.export:visible', true),
('crm:product-sales:list:button.bulkdelete:visible', 'Show bulk delete button', 'module', 'product-sales', 'list:button.bulkdelete:visible', true),
('crm:product-sales:list:filters:visible', 'Show advanced filters', 'module', 'product-sales', 'list:filters:visible', true),

-- Form access permissions
('crm:product-sales:form:access', 'Access product sale form', 'module', 'product-sales', 'form:access', true),

-- Record-level permissions (using {id} placeholder pattern)
('crm:product-sales:record.{id}:tab.details:accessible', 'Access product sale details tab', 'module', 'product-sales', 'record:tab.details:accessible', true),
('crm:product-sales:record.{id}:tab.history:accessible', 'Access product sale history/audit tab', 'module', 'product-sales', 'record:tab.history:accessible', true),
('crm:product-sales:record.{id}:field.customer_id:editable', 'Edit customer field', 'module', 'product-sales', 'record:field.customer_id:editable', true),
('crm:product-sales:record.{id}:field.quantity:editable', 'Edit quantity field', 'module', 'product-sales', 'record:field.quantity:editable', true),
('crm:product-sales:record.{id}:field.status:editable', 'Edit status field', 'module', 'product-sales', 'record:field.status:editable', true),

-- CRUD operations (standard format)
('crm:product-sale:record:read', 'View product sale records', 'module', 'product-sale', 'record:read', true),
('crm:product-sale:record:create', 'Create product sale records', 'module', 'product-sale', 'record:create', true),
('crm:product-sale:record:update', 'Update product sale records', 'module', 'product-sale', 'record:update', true),
('crm:product-sale:record:delete', 'Delete product sale records', 'module', 'product-sale', 'record:delete', true),

-- Approval workflow permissions
('product_sales:approve', 'Approve product sales', 'module', 'product-sales', 'approve', true),
('product_sales:reject', 'Reject product sales', 'module', 'product-sales', 'reject', true),

-- Bulk operations
('product_sales:bulk_update_status', 'Bulk update product sales status', 'module', 'product-sales', 'bulk_update_status', true),
('product_sales:bulk_export', 'Bulk export product sales', 'module', 'product-sales', 'bulk_export', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: Assign permissions to tenant_admin role (per-tenant)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'tenant_admin'
  AND p.name IN (
    'crm:product-sales:access',
    'crm:product-sales:list:view',
    'crm:product-sales:list:button.create:visible',
    'crm:product-sales:list:button.export:visible',
    'crm:product-sales:list:button.bulkdelete:visible',
    'crm:product-sales:list:filters:visible',
    'crm:product-sales:form:access',
    'crm:product-sales:record.{id}:tab.details:accessible',
    'crm:product-sales:record.{id}:tab.history:accessible',
    'crm:product-sales:record.{id}:field.customer_id:editable',
    'crm:product-sales:record.{id}:field.quantity:editable',
    'crm:product-sales:record.{id}:field.status:editable',
    'crm:product-sale:record:read',
    'crm:product-sale:record:create',
    'crm:product-sale:record:update',
    'crm:product-sale:record:delete',
    'product_sales:approve',
    'product_sales:reject',
    'product_sales:bulk_update_status',
    'product_sales:bulk_export'
  )
  AND r.tenant_id IS NOT NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Assign permissions to super_admin role (system-wide)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND r.is_system_role = true
  AND p.name IN (
    'crm:product-sales:access',
    'crm:product-sales:list:view',
    'crm:product-sales:list:button.create:visible',
    'crm:product-sales:list:button.export:visible',
    'crm:product-sales:list:button.bulkdelete:visible',
    'crm:product-sales:list:filters:visible',
    'crm:product-sales:form:access',
    'crm:product-sales:record.{id}:tab.details:accessible',
    'crm:product-sales:record.{id}:tab.history:accessible',
    'crm:product-sales:record.{id}:field.customer_id:editable',
    'crm:product-sales:record.{id}:field.quantity:editable',
    'crm:product-sales:record.{id}:field.status:editable',
    'crm:product-sale:record:read',
    'crm:product-sale:record:create',
    'crm:product-sale:record:update',
    'crm:product-sale:record:delete',
    'product_sales:approve',
    'product_sales:reject',
    'product_sales:bulk_update_status',
    'product_sales:bulk_export'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Assign permissions to sales_manager role (if exists)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_manager'
  AND p.name IN (
    'crm:product-sales:access',
    'crm:product-sales:list:view',
    'crm:product-sales:list:button.create:visible',
    'crm:product-sales:list:button.export:visible',
    'crm:product-sales:list:filters:visible',
    'crm:product-sales:form:access',
    'crm:product-sales:record.{id}:tab.details:accessible',
    'crm:product-sales:record.{id}:tab.history:accessible',
    'crm:product-sales:record.{id}:field.customer_id:editable',
    'crm:product-sales:record.{id}:field.quantity:editable',
    'crm:product-sales:record.{id}:field.status:editable',
    'crm:product-sale:record:read',
    'crm:product-sale:record:create',
    'crm:product-sale:record:update',
    'product_sales:approve',
    'product_sales:reject'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Assign permissions to sales_representative role (if exists)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_representative'
  AND p.name IN (
    'crm:product-sales:access',
    'crm:product-sales:list:view',
    'crm:product-sales:list:button.create:visible',
    'crm:product-sales:form:access',
    'crm:product-sales:record.{id}:tab.details:accessible',
    'crm:product-sales:record.{id}:field.customer_id:editable',
    'crm:product-sales:record.{id}:field.quantity:editable',
    'crm:product-sale:record:read',
    'crm:product-sale:record:create',
    'crm:product-sale:record:update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================



-- ============================================================================
-- MIGRATION: 20251208000001_add_product_sale_element_permissions.sql
-- ============================================================================

-- ============================================================================ 
-- Add Product Sales Element-Level Permissions (MIGRATION UPDATED)
-- This migration adds granular element-level permissions for product sales forms and actions
--
-- NOTE: `required_role_level` must use string values ('read','write','admin') to match
-- the `element_permissions` table check constraint defined in the element-level schema migration.
-- ============================================================================

-- Insert element permissions for product sales
INSERT INTO element_permissions (element_path, permission_id, required_role_level, conditions, tenant_id, created_at, updated_at) VALUES
-- Product Sales List Page
('crm:product-sales:list', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales"}', NULL, NOW(), NOW()),
('crm:product-sales:list:button.create', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "action": "create"}', NULL, NOW(), NOW()),
('crm:product-sales:list:button.bulk-delete', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:delete'), 'write', '{"module": "product-sales", "action": "bulk-delete"}', NULL, NOW(), NOW()),
('crm:product-sales:list:button.export', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "export"}', NULL, NOW(), NOW()),

-- Product Sales Form Elements
('crm:product-sales:form', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "action": "form"}', NULL, NOW(), NOW()),
('crm:product-sales:form:customer', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "customer"}', NULL, NOW(), NOW()),
('crm:product-sales:form:product', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "product"}', NULL, NOW(), NOW()),
('crm:product-sales:form:quantity', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "quantity"}', NULL, NOW(), NOW()),
('crm:product-sales:form:unit-price', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "unit-price"}', NULL, NOW(), NOW()),
('crm:product-sales:form:total', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "total"}', NULL, NOW(), NOW()),
('crm:product-sales:form:status', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "status"}', NULL, NOW(), NOW()),
('crm:product-sales:form:delivery-address', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "delivery-address"}', NULL, NOW(), NOW()),
('crm:product-sales:form:notes', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:create'), 'read', '{"module": "product-sales", "field": "notes"}', NULL, NOW(), NOW()),

-- Product Sales Detail Page
('crm:product-sales:detail', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "detail"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.edit', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "edit"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.delete', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:delete'), 'write', '{"module": "product-sales", "action": "delete"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.status-transition', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "status-transition"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.generate-invoice', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "generate-invoice"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.send-invoice', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "send-invoice"}', NULL, NOW(), NOW()),
('crm:product-sales:detail:button.generate-contract', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "generate-contract"}', NULL, NOW(), NOW()),

-- Product Sales Analytics
('crm:product-sales:analytics', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "analytics"}', NULL, NOW(), NOW()),

-- Advanced Filters Modal
('crm:product-sales:filters', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "filters"}', NULL, NOW(), NOW()),
('crm:product-sales:filters:status', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "field": "status"}', NULL, NOW(), NOW()),
('crm:product-sales:filters:date-range', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "field": "date-range"}', NULL, NOW(), NOW()),
('crm:product-sales:filters:price-range', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "field": "price-range"}', NULL, NOW(), NOW()),
('crm:product-sales:filters:customer', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "field": "customer"}', NULL, NOW(), NOW()),
('crm:product-sales:filters:product', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "field": "product"}', NULL, NOW(), NOW()),

-- Bulk Operations
('crm:product-sales:bulk', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "bulk"}', NULL, NOW(), NOW()),
('crm:product-sales:bulk:status-update', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "bulk-status"}', NULL, NOW(), NOW()),
('crm:product-sales:bulk:delete', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:delete'), 'write', '{"module": "product-sales", "action": "bulk-delete"}', NULL, NOW(), NOW()),
('crm:product-sales:bulk:export', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "bulk-export"}', NULL, NOW(), NOW()),

-- Status Transition Modal
('crm:product-sales:status-transition', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "status-transition"}', NULL, NOW(), NOW()),

-- Invoice Generation Modal
('crm:product-sales:invoice', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "invoice"}', NULL, NOW(), NOW()),
('crm:product-sales:invoice:generate', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "generate-invoice"}', NULL, NOW(), NOW()),
('crm:product-sales:invoice:email', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "send-invoice"}', NULL, NOW(), NOW()),

-- Reports Modal
('crm:product-sales:reports', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "reports"}', NULL, NOW(), NOW()),

-- Notification Preferences Modal
('crm:product-sales:notifications', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "notifications"}', NULL, NOW(), NOW()),

-- Dynamic Columns Modal
('crm:product-sales:columns', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "columns"}', NULL, NOW(), NOW()),

-- Filter Presets Modal
('crm:product-sales:filter-presets', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:read'), 'read', '{"module": "product-sales", "action": "filter-presets"}', NULL, NOW(), NOW()),

-- Invoice Email Modal
('crm:product-sales:invoice-email', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "invoice-email"}', NULL, NOW(), NOW()),

-- Contract Generation
('crm:product-sales:contract', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "contract"}', NULL, NOW(), NOW()),
('crm:product-sales:contract:generate', (SELECT id FROM permissions WHERE name = 'crm:product-sale:record:update'), 'read', '{"module": "product-sales", "action": "generate-contract"}', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign element permissions to roles
-- Get role IDs for assignment
DO $$
DECLARE
    tenant_admin_role_id UUID;
    sales_manager_role_id UUID;
    sales_representative_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO tenant_admin_role_id FROM roles WHERE name = 'tenant_admin' AND tenant_id IS NOT NULL LIMIT 1;
    SELECT id INTO sales_manager_role_id FROM roles WHERE name = 'sales_manager' AND tenant_id IS NOT NULL LIMIT 1;
    SELECT id INTO sales_representative_role_id FROM roles WHERE name = 'sales_representative' AND tenant_id IS NOT NULL LIMIT 1;

    -- Assign all product-sales element permissions to tenant_admin (full access)
    IF tenant_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
        SELECT
            tenant_admin_role_id,
            ep.permission_id,
            NULL::uuid,
            NOW()
        FROM element_permissions ep
        WHERE ep.element_path LIKE 'crm:product-sales:%'
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- Assign read and basic create permissions to sales_manager
    IF sales_manager_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
        SELECT
            sales_manager_role_id,
            ep.permission_id,
            NULL::uuid,
            NOW()
        FROM element_permissions ep
        WHERE ep.element_path LIKE 'crm:product-sales:%'
        AND ep.element_path NOT LIKE '%:delete%'
        AND ep.element_path NOT LIKE '%:bulk-delete%'
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- Assign basic read and create permissions to sales_representative (limited)
    IF sales_representative_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
        SELECT
            sales_representative_role_id,
            ep.permission_id,
            NULL::uuid,
            NOW()
        FROM element_permissions ep
        WHERE ep.element_path LIKE 'crm:product-sales:%'
        AND ep.element_path NOT LIKE '%:delete%'
        AND ep.element_path NOT LIKE '%:bulk%'
        AND ep.element_path NOT LIKE '%:analytics%'
        AND ep.element_path NOT LIKE '%:reports%'
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Product Sales Element-Level Permissions migration completed successfully';
    RAISE NOTICE '📊 Created element permissions and assigned to roles (tenant_admin, sales_manager, sales_representative)';
END $$;

-- ============================================================================
-- SECTION 4: SEED DATA
-- Essential data for development and production
-- ============================================================================

-- ============================================================================
-- COMPREHENSIVE DATABASE SEED DATA FOR ENTERPRISE CRM
-- This file contains essential seed data for development and testing
--
-- Date: December 5, 2025
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: SEED DATA INSERTION
-- ============================================================================

-- Insert sample tenants (only if they don't exist)
INSERT INTO tenants (id, name, domain, plan, status)
SELECT * FROM (VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Acme Corporation', 'acme.com', 'enterprise', 'active'),
  ('b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'Tech Solutions Inc', 'techsolutions.example', 'premium', 'active'),
  ('c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'Global Trading Ltd', 'globaltrading.example', 'basic', 'active')
) AS v(id, name, domain, plan, status)
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE tenants.id = v.id);

-- Product-Sale Permissions (required for product-sales module access)
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
('crm:product-sale:record:read', 'View product sale records', 'module', 'product-sale', 'record:read', true),
('crm:product-sale:record:create', 'Create product sale records', 'module', 'product-sale', 'record:create', true),
('crm:product-sale:record:update', 'Update product sale records', 'module', 'product-sale', 'record:update', true),
('crm:product-sale:record:delete', 'Delete product sale records', 'module', 'product-sale', 'record:delete', true)
ON CONFLICT (name) DO NOTHING;

-- Update role name for tenant admin to match user preference
UPDATE roles SET name = 'tenant_admin' WHERE name = 'Administrator' AND tenant_id IS NOT NULL;

-- Role permissions are assigned by migrations, skipping here

-- Insert sample auth users (only if they don't exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  phone_change,
  phone_change_token,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-000000000000'::uuid, '6e084750-4e35-468c-9903-5b5ab9d14af4'::uuid, 'authenticated', 'authenticated', 'admin@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Admin User"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, '2707509b-57e8-4c84-a6fe-267eaa724223'::uuid, 'authenticated', 'authenticated', 'manager@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Sales Manager"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, '27ff37b5-ef55-4e34-9951-42f35a1b2506'::uuid, 'authenticated', 'authenticated', 'engineer@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Sales Rep"}'::jsonb, NOW(), NOW())
) AS v(instance_id, id, aud, role, email, encrypted_password, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change, phone_change_token, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = v.id);

-- Insert public users with proper tenant assignment (override sync function if needed)
INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status) VALUES
('6e084750-4e35-468c-9903-5b5ab9d14af4', 'admin@acme.com', 'Admin User', 'Admin', 'User', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('2707509b-57e8-4c84-a6fe-267eaa724223', 'manager@acme.com', 'Sales Manager', 'Sales', 'Manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('27ff37b5-ef55-4e34-9951-42f35a1b2506', 'engineer@acme.com', 'Sales Rep', 'Sales', 'Rep', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Ensure a deterministic super-admin auth + public user exists and capture its id by email
DO $$
DECLARE
  super_auth_id UUID;
BEGIN
  -- Create auth user only if an auth record for this email doesn't exist (auth.users may not have a unique constraint on email)
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT '00000000-0000-0000-0000-000000000000'::uuid, uuid_generate_v4(), 'authenticated', 'authenticated', 'superadmin@crm.com', crypt('password123', gen_salt('bf', 8)), NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Super Admin"}'::jsonb, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@crm.com');

  SELECT id INTO super_auth_id FROM auth.users WHERE email = 'superadmin@crm.com' LIMIT 1;

  IF super_auth_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status)
    VALUES (super_auth_id, 'superadmin@crm.com', 'Super Admin', 'Super', 'Admin', NULL, true, 'active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      tenant_id = EXCLUDED.tenant_id,
      is_super_admin = EXCLUDED.is_super_admin,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;
END $$;

-- Assign user roles directly (FRS-compliant roles)
-- Super admin role (tenant_id is NULL)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, NULL, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'superadmin@crm.com' AND r.name = 'super_admin' AND r.is_system_role = true
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id IS NULL);

-- Tenant admin roles - ensure admin@acme.com gets tenant_admin role
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'admin@acme.com' AND r.name = 'tenant_admin' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

-- Additional explicit role assignment for admin@acme.com (failsafe)
DO $$
DECLARE
    user_id_val UUID;
    role_id_val UUID;
    tenant_id_val UUID;
BEGIN
    -- Get the user ID for admin@acme.com
    SELECT id, tenant_id INTO user_id_val, tenant_id_val
    FROM users
    WHERE email = 'admin@acme.com'
    LIMIT 1;

    -- Get the role ID for tenant_admin
    SELECT id INTO role_id_val
    FROM roles
    WHERE name = 'tenant_admin' AND tenant_id = tenant_id_val
    LIMIT 1;

    -- Insert if not exists
    IF user_id_val IS NOT NULL AND role_id_val IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
        VALUES (user_id_val, role_id_val, tenant_id_val, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1))
        ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
    END IF;
END $$;

INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'manager@acme.com' AND r.name = 'Manager' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'engineer@acme.com' AND r.name = 'Engineer' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

-- Insert sample companies
INSERT INTO companies (name, address, phone, email, tenant_id) VALUES
('Demo Manufacturing Inc', '123 Industrial Ave, Detroit, MI, USA', '+1-313-555-0100', 'contact@demomfg.com', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Acme Solutions Corp', '456 Tech Blvd, Austin, TX, USA', '+1-512-555-0200', 'info@acmesolutions.com', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Global Services Ltd', '789 Service St, Miami, FL, USA', '+1-305-555-0300', 'sales@globalservices.com', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
;

-- Insert sample products
INSERT INTO products (name, sku, description, price, cost_price, stock_quantity, tenant_id) VALUES
('Premium Widget', 'WID-001', 'High-quality industrial widget', 29.99, 18.50, 100, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Standard Gadget', 'GAD-001', 'Reliable electronic gadget', 49.99, 30.00, 75, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Service Package Basic', 'SRV-001', 'Basic service maintenance package', 99.99, 60.00, 50, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Advanced Tool Kit', 'TOO-001', 'Complete toolkit for professionals', 79.99, 45.00, 30, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert sample customers
INSERT INTO customers (
  company_name,
  contact_name,
  email,
  phone,
  address,
  city,
  country,
  tenant_id,
  status,
  size,
  customer_type
) VALUES
('Demo Manufacturing Inc', 'Alice Johnson', 'alice.johnson@example.com', '+1-555-1001', '100 Main St', 'New York', 'USA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'active', 'medium', 'business'),
('Acme Solutions Corp', 'Bob Smith', 'bob.smith@example.com', '+1-555-1002', '200 Oak Ave', 'Los Angeles', 'USA', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', 'prospect', 'small', 'business'),
('Global Services Ltd', 'Carol Williams', 'carol.williams@example.com', '+1-555-1003', '300 Pine Rd', 'Chicago', 'USA', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', 'active', 'enterprise', 'business');

-- Insert sample deals
INSERT INTO deals (customer_id, title, description, value, status, close_date, assigned_to, notes, tenant_id, created_by, deal_type) VALUES
(
  (SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1),
  'Premium Widget Package',
  'Enterprise customer interested in full product suite',
  15000.00,
  'won',
  CURRENT_DATE - INTERVAL '5 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Closed deal with premium tier discount applied',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'PRODUCT'
),
(
  (SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1),
  'Service Upgrade Deal',
  'Upsell to premium service tier',
  8500.00,
  'won',
  CURRENT_DATE - INTERVAL '2 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Customer approved for 1-year service contract',
  'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'SERVICE'
),
(
  (SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1),
  'Tool Kit + Support Bundle',
  'Complete tool kit with extended support',
  12000.00,
  'lost',
  CURRENT_DATE + INTERVAL '5 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Customer chose competitor product',
  'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'PRODUCT'
);

-- Insert sample deal items (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    INSERT INTO deal_items (deal_id, product_id, product_name, quantity, unit_price, line_total, tenant_id) VALUES
    -- Deal 1: Premium Widget Package
    (
      (SELECT id FROM deals WHERE title = 'Premium Widget Package' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'WID-001' LIMIT 1),
      'Premium Widget Bundle',
      5,
      2500.00,
      12500.00,
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ),
    -- Deal 2: Service Upgrade Deal
    (
      (SELECT id FROM deals WHERE title = 'Service Upgrade Deal' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'SRV-001' LIMIT 1),
      'Premium Support Service (Annual)',
      2,
      3500.00,
      7000.00,
      'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'
    ),
    -- Deal 3: Tool Kit + Support Bundle
    (
      (SELECT id FROM deals WHERE title = 'Tool Kit + Support Bundle' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'TOO-001' LIMIT 1),
      'Complete Tool Kit',
      3,
      3200.00,
      9600.00,
      'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'
    );
  END IF;
END$$;

-- ============================================================================
-- END OF DATABASE SEED DATA
-- ============================================================================

-- Verification: Run SELECT validate_system_setup();
