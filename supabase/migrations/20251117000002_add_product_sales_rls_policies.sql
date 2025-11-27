-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - PRODUCT SALES RLS POLICIES
-- Migration: Add RLS policies for product_sales table
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT SALES RLS POLICIES
-- ============================================================================

-- Users can view product sales in their tenant
CREATE POLICY "users_view_tenant_product_sales" ON product_sales
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

-- Users can create product sales in their tenant
CREATE POLICY "users_create_product_sales" ON product_sales
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Users can update product sales in their tenant
CREATE POLICY "users_update_product_sales" ON product_sales
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

-- Users can delete product sales in their tenant (soft delete handled by application)
CREATE POLICY "users_delete_product_sales" ON product_sales
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Super admin can view all product sales
CREATE POLICY "super_admin_view_all_product_sales" ON product_sales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- 2. SERVICE CONTRACTS RLS POLICIES (if not already added)
-- ============================================================================

-- Check if service_contracts policies exist, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'service_contracts' AND policyname = 'users_view_tenant_service_contracts'
  ) THEN

    -- Users can view service contracts in their tenant
    CREATE POLICY "users_view_tenant_service_contracts" ON service_contracts
      FOR SELECT
      USING (tenant_id = get_current_user_tenant_id());

    -- Users can create service contracts in their tenant
    CREATE POLICY "users_create_service_contracts" ON service_contracts
      FOR INSERT
      WITH CHECK (tenant_id = get_current_user_tenant_id());

    -- Users can update service contracts in their tenant
    CREATE POLICY "users_update_service_contracts" ON service_contracts
      FOR UPDATE
      USING (tenant_id = get_current_user_tenant_id());

    -- Super admin can view all service contracts
    CREATE POLICY "super_admin_view_all_service_contracts" ON service_contracts
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
      );

  END IF;
END $$;

-- ============================================================================
-- 3. JOB WORKS RLS POLICIES (if not already added)
-- ============================================================================

-- Check if job_works policies exist, add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_works' AND policyname = 'users_view_tenant_job_works'
  ) THEN

    -- Users can view job works in their tenant
    CREATE POLICY "users_view_tenant_job_works" ON job_works
      FOR SELECT
      USING (tenant_id = get_current_user_tenant_id());

    -- Users can create job works in their tenant
    CREATE POLICY "users_create_job_works" ON job_works
      FOR INSERT
      WITH CHECK (tenant_id = get_current_user_tenant_id());

    -- Users can update job works in their tenant
    CREATE POLICY "users_update_job_works" ON job_works
      FOR UPDATE
      USING (tenant_id = get_current_user_tenant_id());

    -- Super admin can view all job works
    CREATE POLICY "super_admin_view_all_job_works" ON job_works
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
      );

  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Added RLS policies for product_sales table
-- - Added RLS policies for service_contracts table (if missing)
-- - Added RLS policies for job_works table (if missing)
-- - All policies enforce tenant isolation with super admin bypass
-- ============================================================================