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