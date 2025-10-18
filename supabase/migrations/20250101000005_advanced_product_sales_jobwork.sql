-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ADVANCED FEATURES
-- Migration: 005 - Product Sales & Service Contracts & Job Work
-- ============================================================================

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
-- 3. SERVICE CONTRACTS TABLE
-- ============================================================================

CREATE TABLE service_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product Sale Reference
  product_sale_id UUID NOT NULL REFERENCES product_sales(id) ON DELETE CASCADE,
  contract_number VARCHAR(50) NOT NULL,
  
  -- Customer & Product
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status & Terms
  status service_contract_status DEFAULT 'active',
  contract_value NUMERIC(12, 2) NOT NULL,
  annual_value NUMERIC(12, 2) NOT NULL,
  terms TEXT,
  
  -- Service Details
  warranty_period_months INTEGER,
  service_level service_level DEFAULT 'standard',
  
  -- Renewal
  auto_renewal BOOLEAN DEFAULT FALSE,
  renewal_notice_period_days INTEGER DEFAULT 30,
  
  -- Document
  pdf_url VARCHAR(500),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_contract_number_per_tenant UNIQUE(contract_number, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_service_contracts_tenant_id ON service_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_product_sale_id ON service_contracts(product_sale_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_customer_id ON service_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_contracts_status ON service_contracts(status);
CREATE INDEX IF NOT EXISTS idx_service_contracts_end_date ON service_contracts(end_date);

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