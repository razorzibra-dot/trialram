-- ============================================================================
-- Migration: Fix audit_logs RLS policy to use safe functions
-- Date: 2025-11-30
-- Problem: audit_logs INSERT policy uses direct SELECT queries which can cause recursion
--          and fails when tenant_id doesn't match or is null
-- Solution: Update policy to use SECURITY DEFINER safe functions
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can update tenant audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can delete tenant audit_logs" ON audit_logs;

-- ============================================================================
-- 2. CREATE NEW POLICIES USING SAFE FUNCTIONS
-- ============================================================================

-- SELECT policy: Users can view audit logs from their tenant or if super admin
CREATE POLICY "Users can view tenant audit_logs" ON audit_logs
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
    OR user_id = auth.uid()  -- Users can always see their own audit logs
  );

-- INSERT policy: Allow authenticated users to create audit logs
-- ✅ Database-driven: Uses safe functions to avoid recursion
CREATE POLICY "Users can insert tenant audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Super admin can insert audit logs for any tenant
      is_current_user_super_admin_safe()
      OR
      -- Regular users can insert audit logs for their tenant
      (
        tenant_id = get_current_user_tenant_id_safe()
        AND get_current_user_tenant_id_safe() IS NOT NULL
      )
      OR
      -- Allow inserting audit logs with user_id matching current user (for user-specific logs)
      user_id = auth.uid()
    )
  );

-- UPDATE policy: Only super admin can update audit logs (for data corrections)
CREATE POLICY "Users can update tenant audit_logs" ON audit_logs
  FOR UPDATE
  USING (
    is_current_user_super_admin_safe()
  )
  WITH CHECK (
    is_current_user_super_admin_safe()
  );

-- DELETE policy: Only super admin can delete audit logs (for compliance/legal requirements)
CREATE POLICY "Users can delete tenant audit_logs" ON audit_logs
  FOR DELETE
  USING (
    is_current_user_super_admin_safe()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Dropped existing policies that used direct SELECT queries
-- - Created new policies using SECURITY DEFINER safe functions
-- - INSERT policy allows authenticated users to create audit logs for their tenant
-- - Super admins can manage audit logs for any tenant
-- - All policies use safe functions (no recursion)
-- ============================================================================

