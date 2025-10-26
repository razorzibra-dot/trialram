-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX SALE_ITEMS RLS POLICIES
-- Migration: 013 - Add INSERT, UPDATE, DELETE policies for sale_items
-- ============================================================================

-- Add INSERT policy for sale_items
CREATE POLICY "users_create_sale_items" ON sale_items
  FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Add UPDATE policy for sale_items
CREATE POLICY "users_update_sale_items" ON sale_items
  FOR UPDATE
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );

-- Add DELETE policy for sale_items
CREATE POLICY "users_delete_sale_items" ON sale_items
  FOR DELETE
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE tenant_id = get_current_user_tenant_id()
    )
  );