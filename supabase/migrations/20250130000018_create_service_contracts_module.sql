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