-- ============================================================================
-- Migration: Add RLS Policies to audit_logs Table
-- Date: 2025-11-22
-- Description: Enable RLS on audit_logs table and implement tenant isolation
-- Impact: Critical security fix - prevents unauthorized cross-tenant audit log access
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON AUDIT_LOGS
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR AUDIT_LOGS
-- ============================================================================

-- Policy: Allow users to read audit logs from their own tenant
CREATE POLICY "users_read_own_tenant_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    -- Super admin can read all audit logs
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'super_admin'
      AND u.deleted_at IS NULL
    )
    OR
    -- Regular users can only read audit logs from their tenant
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND deleted_at IS NULL
      LIMIT 1
    )
  );

-- Policy: Allow INSERT of audit logs (for logging actions)
CREATE POLICY "allow_audit_log_insertion" ON audit_logs
  FOR INSERT
  WITH CHECK (
    -- Only authenticated users can insert audit logs
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND deleted_at IS NULL
    )
    AND
    -- Ensure tenant_id matches user's tenant (except for super_admin)
    (
      -- Super admin can insert audit logs for any tenant
      EXISTS (
        SELECT 1 FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.name = 'super_admin'
        AND u.deleted_at IS NULL
      )
      OR
      -- Regular users can only insert audit logs for their tenant
      tenant_id = (
        SELECT tenant_id FROM users
        WHERE id = auth.uid()
        AND deleted_at IS NULL
        LIMIT 1
      )
    )
  );

-- Policy: Only super_admin can UPDATE audit logs (for data corrections)
CREATE POLICY "super_admin_update_audit_logs" ON audit_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'super_admin'
      AND u.deleted_at IS NULL
    )
  );

-- Policy: Only super_admin can DELETE audit logs (for compliance/legal requirements)
CREATE POLICY "super_admin_delete_audit_logs" ON audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'super_admin'
      AND u.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Audit log table with Row Level Security enabled for tenant isolation';
COMMENT ON POLICY "users_read_own_tenant_audit_logs" ON audit_logs IS 'Users can read audit logs from their tenant; super_admin can read all';
COMMENT ON POLICY "allow_audit_log_insertion" ON audit_logs IS 'Authenticated users can create audit logs; tenant isolation enforced';
COMMENT ON POLICY "super_admin_update_audit_logs" ON audit_logs IS 'Only super_admin can update audit logs';
COMMENT ON POLICY "super_admin_delete_audit_logs" ON audit_logs IS 'Only super_admin can delete audit logs';

-- ============================================================================
-- 4. VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check that RLS is enabled on audit_logs table
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'audit_logs';

-- Check that policies were created
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'audit_logs';

-- Test tenant isolation query (run as a regular user)
-- SELECT tenant_id, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- ============================================================================
-- 5. SUMMARY OF CHANGES
-- ============================================================================
-- 
-- SECURITY IMPROVEMENTS:
--   ✓ RLS enabled on audit_logs table
--   ✓ Tenant isolation enforced for all audit log access
--   ✓ Super admin can access all audit logs across tenants
--   ✓ Regular users can only access audit logs from their own tenant
--   ✓ INSERT policy prevents cross-tenant log creation
--   ✓ Only super_admin can modify/delete audit logs (for compliance)
--   ✓ RLS policies use user_roles relationship table for role checking
--
-- USER IMPACT:
--   ✓ Audit log queries automatically filter by tenant (handled by RLS)
--   ✓ Existing RBAC service methods continue to work
--   ✓ No changes needed in application code
--   ✓ Compliance with data privacy regulations
--   ✓ Fixed to use correct database schema with role relationships
-- ============================================================================