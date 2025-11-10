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