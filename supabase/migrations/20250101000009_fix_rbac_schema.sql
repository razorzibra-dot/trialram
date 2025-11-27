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