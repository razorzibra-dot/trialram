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