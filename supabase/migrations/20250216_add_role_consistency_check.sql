-- ============================================================================
-- MIGRATION: Add Role Consistency Constraint
-- Date: 2025-02-15
-- Purpose: Ensure role, is_super_admin flag, and tenant_id are always consistent
-- ============================================================================

-- Add CHECK constraint for role consistency
-- Enforces that:
-- 1. Super admins: role='super_admin' AND is_super_admin=true AND tenant_id=NULL
-- 2. Regular users: role IN (admin/manager/agent/engineer/customer) AND is_super_admin=false AND tenant_id NOT NULL
ALTER TABLE users
ADD CONSTRAINT ck_super_admin_role_consistency
  CHECK (
    (is_super_admin = true AND role = 'super_admin' AND tenant_id IS NULL) OR
    (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer') AND tenant_id IS NOT NULL)
  );

-- Document the constraint
COMMENT ON CONSTRAINT ck_super_admin_role_consistency ON users IS
  'Ensures role, is_super_admin flag, and tenant_id are always consistent:
   
   VALID STATES:
   - Super Admin: role=super_admin AND is_super_admin=true AND tenant_id=NULL
     (Platform-wide administrator with no tenant scope)
   
   - Regular User: role IN (admin/manager/agent/engineer/customer) AND is_super_admin=false AND tenant_id NOT NULL
     (Tenant-scoped user with assigned tenant)
   
   This constraint prevents invalid state combinations that could compromise security or data integrity.';