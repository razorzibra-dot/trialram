-- ============================================================================
-- Migration: 20251116000004 - Fix roles tenant_id nullable constraint
-- ============================================================================

-- Make tenant_id nullable in roles table to support system-wide roles like super_admin
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the unique constraint to handle NULL tenant_id properly
-- Drop the existing constraint
ALTER TABLE roles DROP CONSTRAINT unique_role_per_tenant;

-- Create new constraint that allows NULL tenant_id for system roles
ALTER TABLE roles ADD CONSTRAINT unique_role_per_tenant UNIQUE (name, tenant_id);

-- Add comment explaining the nullable tenant_id
COMMENT ON COLUMN roles.tenant_id IS 'Tenant ID for tenant-specific roles, NULL for system-wide roles like super_admin';