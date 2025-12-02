-- Sales to Deals Module Database Migration Script
-- This script renames the sales tables and columns to deals terminology
-- Version: 1.0
-- Date: December 1, 2025
-- Status: Ready for execution in development environment
-- WARNING: Backup database before executing in production

BEGIN TRANSACTION;

-- ============================================================================
-- PHASE 1: Table Renames
-- ============================================================================

-- Rename sale_items → deal_items FIRST (has foreign key)
ALTER TABLE IF EXISTS sale_items RENAME TO deal_items;

-- Rename sales → deals
ALTER TABLE IF EXISTS sales RENAME TO deals;

-- ============================================================================
-- PHASE 2: Foreign Key Column Renames (after table rename completes)
-- ============================================================================

-- Update foreign key column: sale_id → deal_id in deal_items table
ALTER TABLE deal_items RENAME COLUMN sale_id TO deal_id;

-- ============================================================================
-- PHASE 3: Constraint Renames (if applicable)
-- ============================================================================

-- Rename foreign key constraint if it exists
-- (This is automatic with column rename in most PostgreSQL versions)
-- If manual rename needed:
-- ALTER TABLE deal_items RENAME CONSTRAINT fk_sale_items_sales_id 
--   TO fk_deal_items_deals_id;

-- ============================================================================
-- PHASE 4: Index Renames (for clarity, optional)
-- ============================================================================

-- Update index names that reference old table names
-- Examples:
-- - idx_sales_tenant_id → idx_deals_tenant_id
-- - idx_sales_customer_id → idx_deals_customer_id
-- - idx_sale_items_sale_id → idx_deal_items_deal_id

-- Check current indexes first:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('deals', 'deal_items');

-- Rename deal-related indexes
DO $$
DECLARE
  idx_record RECORD;
BEGIN
  FOR idx_record IN 
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'deals' 
    AND indexname LIKE '%sales%'
  LOOP
    EXECUTE 'ALTER INDEX IF EXISTS ' || idx_record.indexname || 
            ' RENAME TO ' || REPLACE(idx_record.indexname, 'sales', 'deals');
  END LOOP;

  FOR idx_record IN 
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'deal_items' 
    AND indexname LIKE '%sale%'
  LOOP
    EXECUTE 'ALTER INDEX IF EXISTS ' || idx_record.indexname || 
            ' RENAME TO ' || REPLACE(idx_record.indexname, 'sale', 'deal');
  END LOOP;
END $$;

-- ============================================================================
-- PHASE 5: Row Level Security (RLS) Policy Updates
-- ============================================================================

-- Drop old RLS policies on the old table name (now 'deals')
DROP POLICY IF EXISTS "Users can view their tenant sales" ON deals;
DROP POLICY IF EXISTS "Users can update their tenant sales" ON deals;
DROP POLICY IF EXISTS "Users can delete their tenant sales" ON deals;
DROP POLICY IF EXISTS "Users can insert sales" ON deals;

-- Create new RLS policies with updated names
CREATE POLICY "Users can view their tenant deals" ON deals
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert deals" ON deals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant deals" ON deals
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tenant deals" ON deals
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- Drop old RLS policies on deal_items
DROP POLICY IF EXISTS "Users can view sale items for their tenant deals" ON deal_items;
DROP POLICY IF EXISTS "Users can insert deal items" ON deal_items;

-- Create new RLS policies for deal_items
CREATE POLICY "Users can view deal items for their tenant deals" ON deal_items
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND deal_id IN (
      SELECT id FROM deals 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert deal items" ON deal_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND deal_id IN (
      SELECT id FROM deals 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PHASE 6: Verify Schema Changes
-- ============================================================================

-- Log table structure after changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('deals', 'deal_items')
ORDER BY table_name, ordinal_position;

-- Log updated indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('deals', 'deal_items')
ORDER BY tablename, indexname;

-- Log updated RLS policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('deals', 'deal_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- PHASE 7: Verify Data Integrity
-- ============================================================================

-- Count records to ensure data wasn't lost
SELECT 
  'deals' as table_name,
  COUNT(*) as record_count
FROM deals
UNION ALL
SELECT 
  'deal_items' as table_name,
  COUNT(*) as record_count
FROM deal_items;

-- Check for orphaned deal_items (deal_id not in deals table)
SELECT COUNT(*) as orphaned_items
FROM deal_items di
LEFT JOIN deals d ON di.deal_id = d.id
WHERE d.id IS NULL;

-- ============================================================================
-- COMMIT OR ROLLBACK
-- ============================================================================

-- If all verifications pass, commit the transaction
-- If any errors occurred, the transaction will rollback automatically

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION (Run AFTER successful migration)
-- ============================================================================
-- 
-- After migration commits successfully, run these queries to verify:
--

-- 1. Verify table existence
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('deals', 'deal_items');

-- 2. Verify no 'sales' or 'sale_items' tables remain
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('sales', 'sale_items');

-- 3. Verify column rename
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'deal_items' AND column_name = 'deal_id';

-- 4. Test foreign key constraint
-- INSERT INTO deal_items (deal_id, product_id, product_name, quantity, unit_price, line_total)
-- VALUES ('nonexistent_id', 'prod_1', 'Test Product', 1, 100, 100);
-- Should fail with foreign key constraint error

-- 5. Test RLS policy
-- SELECT * FROM deals WHERE tenant_id = 'your_tenant_id';
-- Should return only deals belonging to authenticated user's tenant

-- 6. Query performance - ensure indexes are working
-- EXPLAIN ANALYZE SELECT * FROM deals WHERE tenant_id = 'your_tenant_id';
-- EXPLAIN ANALYZE SELECT * FROM deal_items WHERE deal_id = 'your_deal_id';
