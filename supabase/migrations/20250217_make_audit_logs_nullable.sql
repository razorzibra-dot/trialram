-- ============================================================================
-- MIGRATION: Make audit_logs.tenant_id Nullable
-- Date: 2025-02-15
-- Purpose: Allow audit logs to track platform-wide super admin actions
-- ============================================================================

-- Make tenant_id nullable to support super admin actions that have no tenant scope
ALTER TABLE audit_logs
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update column comment to document the nullable tenant_id
COMMENT ON COLUMN audit_logs.tenant_id IS 
  'Tenant ID - NULL for platform-wide super admin actions, NOT NULL for tenant-scoped user actions
   
   Super admins can perform platform-wide actions that affect multiple or all tenants.
   These audit records will have tenant_id=NULL to indicate they are not scoped to a single tenant.';

-- Create index for efficient querying of super admin actions (tenant_id IS NULL)
-- This helps with auditing and compliance reporting for platform-wide changes
CREATE INDEX idx_audit_logs_super_admin_actions 
  ON audit_logs(user_id, created_at) 
  WHERE tenant_id IS NULL;

-- Add index for tenant-specific audits (tenant_id IS NOT NULL)
CREATE INDEX idx_audit_logs_tenant_actions
  ON audit_logs(tenant_id, created_at)
  WHERE tenant_id IS NOT NULL;