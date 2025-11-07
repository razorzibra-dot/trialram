-- ============================================================================
-- ADD MISSING RLS POLICIES FOR COMPANIES & PRODUCTS
-- Migration: Add INSERT, UPDATE, DELETE policies for companies and products
-- Issue: Companies & products tables were missing CRUD policies, only had SELECT
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES POLICIES - Add Missing CRUD Operations
-- ============================================================================

-- Managers can create companies
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can update companies
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can delete companies
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- ============================================================================
-- 2. PRODUCTS POLICIES - Add Missing UPDATE & DELETE Operations
-- ============================================================================

-- Managers can update products
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Managers can delete products
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );