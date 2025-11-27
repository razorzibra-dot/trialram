-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX - ALL TABLES
-- ============================================================================
-- This migration fixes all RLS policies that contain recursive SELECT statements
-- by replacing them with SECURITY DEFINER function calls that are safe.
--
-- Tables to fix:
-- - audit_logs
-- - complaints
-- - companies
-- - contracts
-- - customers
-- - inventory
-- - job_works
-- - leads
-- - notifications
-- - opportunities
-- - opportunity_items
-- - products
-- - sales
-- - sale_items
-- - service_contracts
-- - tickets
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure SECURITY DEFINER functions exist (create if missing)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_current_user_super_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM users WHERE id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 2: Fix RLS policies on audit_logs table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update tenant audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can delete tenant audit_logs" ON public.audit_logs;

CREATE POLICY "Users can view tenant audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant audit_logs"
  ON public.audit_logs FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant audit_logs"
  ON public.audit_logs FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 3: Fix RLS policies on companies table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update tenant companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete tenant companies" ON public.companies;

CREATE POLICY "Users can view tenant companies"
  ON public.companies FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant companies"
  ON public.companies FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant companies"
  ON public.companies FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 4: Fix RLS policies on complaints table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can update tenant complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can delete tenant complaints" ON public.complaints;

CREATE POLICY "Users can view tenant complaints"
  ON public.complaints FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant complaints"
  ON public.complaints FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant complaints"
  ON public.complaints FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 5: Fix RLS policies on contracts table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update tenant contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete tenant contracts" ON public.contracts;

CREATE POLICY "Users can view tenant contracts"
  ON public.contracts FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant contracts"
  ON public.contracts FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant contracts"
  ON public.contracts FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 6: Fix RLS policies on customers table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update tenant customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete tenant customers" ON public.customers;

CREATE POLICY "Users can view tenant customers"
  ON public.customers FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant customers"
  ON public.customers FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant customers"
  ON public.customers FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 7: Fix RLS policies on inventory table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view inventory from their tenant" ON public.inventory;
DROP POLICY IF EXISTS "Users can update inventory from their tenant" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete inventory from their tenant" ON public.inventory;

CREATE POLICY "Users can view inventory from their tenant"
  ON public.inventory FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update inventory from their tenant"
  ON public.inventory FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete inventory from their tenant"
  ON public.inventory FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 8: Fix RLS policies on job_works table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant job_works" ON public.job_works;
DROP POLICY IF EXISTS "Users can update tenant job_works" ON public.job_works;
DROP POLICY IF EXISTS "Users can delete tenant job_works" ON public.job_works;

CREATE POLICY "Users can view tenant job_works"
  ON public.job_works FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant job_works"
  ON public.job_works FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant job_works"
  ON public.job_works FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 9: Fix RLS policies on leads table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view leads from their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads from their tenant" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads from their tenant" ON public.leads;

CREATE POLICY "Users can view leads from their tenant"
  ON public.leads FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update leads from their tenant"
  ON public.leads FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete leads from their tenant"
  ON public.leads FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 10: Fix RLS policies on notifications table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update tenant notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete tenant notifications" ON public.notifications;

CREATE POLICY "Users can view tenant notifications"
  ON public.notifications FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant notifications"
  ON public.notifications FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant notifications"
  ON public.notifications FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 11: Fix RLS policies on opportunities table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update tenant opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete tenant opportunities" ON public.opportunities;

CREATE POLICY "Users can view tenant opportunities"
  ON public.opportunities FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant opportunities"
  ON public.opportunities FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant opportunities"
  ON public.opportunities FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 12: Fix RLS policies on opportunity_items table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant opportunity items" ON public.opportunity_items;
DROP POLICY IF EXISTS "Users can update tenant opportunity items" ON public.opportunity_items;
DROP POLICY IF EXISTS "Users can delete tenant opportunity items" ON public.opportunity_items;

CREATE POLICY "Users can view tenant opportunity items"
  ON public.opportunity_items FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant opportunity items"
  ON public.opportunity_items FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant opportunity items"
  ON public.opportunity_items FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 13: Fix RLS policies on products table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can update tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can delete tenant products" ON public.products;

CREATE POLICY "Users can view tenant products"
  ON public.products FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant products"
  ON public.products FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant products"
  ON public.products FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 14: Fix RLS policies on sales table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update tenant sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete tenant sales" ON public.sales;

CREATE POLICY "Users can view tenant sales"
  ON public.sales FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant sales"
  ON public.sales FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant sales"
  ON public.sales FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 15: Fix RLS policies on sale_items table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update tenant sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete tenant sale_items" ON public.sale_items;

CREATE POLICY "Users can view tenant sale_items"
  ON public.sale_items FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant sale_items"
  ON public.sale_items FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant sale_items"
  ON public.sale_items FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 16: Fix RLS policies on service_contracts table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant service_contracts" ON public.service_contracts;
DROP POLICY IF EXISTS "Users can update tenant service_contracts" ON public.service_contracts;
DROP POLICY IF EXISTS "Users can delete tenant service_contracts" ON public.service_contracts;

CREATE POLICY "Users can view tenant service_contracts"
  ON public.service_contracts FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant service_contracts"
  ON public.service_contracts FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant service_contracts"
  ON public.service_contracts FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- STEP 17: Fix RLS policies on tickets table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tenant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update tenant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete tenant tickets" ON public.tickets;

CREATE POLICY "Users can view tenant tickets"
  ON public.tickets FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "Users can update tenant tickets"
  ON public.tickets FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete tenant tickets"
  ON public.tickets FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- VERIFICATION: All recursive SELECT statements have been replaced
-- ============================================================================

-- Run this audit query after migration to confirm all are fixed:
-- SELECT tablename, policyname, qual FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND qual ILIKE '%FROM users%' 
-- AND tablename != 'users'
-- ORDER BY tablename, policyname;
-- 
-- Expected result: 0 rows (no recursive SELECT statements)

COMMIT;

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 
-- 1. SECURITY DEFINER Functions:
--    - is_current_user_super_admin_safe() - Checks if user is super admin
--    - get_current_user_tenant_id_safe() - Gets user's tenant ID
--    These functions bypass RLS, so they're safe to call from RLS policies.
--
-- 2. Why This Approach Works:
--    - SECURITY DEFINER functions run with the privileges of the definer
--    - They bypass RLS because they execute in a privileged context
--    - This prevents infinite recursion in RLS policy evaluation
--
-- 3. Performance:
--    - These functions are STABLE so Postgres can cache results
--    - Minimal performance impact vs. the old recursive queries
--
-- 4. Backup:
--    - Original policies had recursive SELECT statements
--    - This migration replaces them with safe, non-recursive versions
--    - No data loss occurs
-- ============================================================================
