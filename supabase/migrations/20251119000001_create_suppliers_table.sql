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