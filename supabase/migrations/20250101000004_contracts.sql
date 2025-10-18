-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CONTRACTS
-- Migration: 004 - Contract Management
-- ============================================================================

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