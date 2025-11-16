-- ============================================================================
-- Migration: 20251116000005 - Fix user_roles tenant_id nullable constraint
-- ============================================================================

-- Make tenant_id nullable in user_roles table to support system-wide roles like super_admin
ALTER TABLE user_roles ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the unique constraint to handle NULL tenant_id properly
-- Drop the existing constraint
ALTER TABLE user_roles DROP CONSTRAINT unique_user_role_per_tenant;

-- Create new constraint that allows NULL tenant_id for system roles
ALTER TABLE user_roles ADD CONSTRAINT unique_user_role_per_tenant UNIQUE (user_id, role_id, tenant_id);

-- Add comment explaining the nullable tenant_id
COMMENT ON COLUMN user_roles.tenant_id IS 'Tenant ID for tenant-specific role assignments, NULL for system-wide roles like super_admin';