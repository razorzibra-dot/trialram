-- ============================================================================
-- CUSTOMER TAGS TABLE AND RELATIONSHIP
-- Migration: 008 - Customer Tags Management
-- ============================================================================

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