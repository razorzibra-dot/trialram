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