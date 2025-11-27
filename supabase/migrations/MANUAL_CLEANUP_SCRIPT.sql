-- ============================================================================
-- MANUAL DATABASE CLEANUP SCRIPT
-- Run these commands in your Supabase database to clean up the failed migration
-- ============================================================================

-- Step 1: Delete the failed migration record from schema_migrations table
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20250101000004';

-- Step 2: Verify the record was deleted (should return no results)
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20250101000004';

-- Step 3: Check current migration status
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 5;

-- Step 4: Verify if suppliers table exists (should be false after cleanup)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'suppliers'
);

-- Step 5: Verify if purchase_orders table exists (should be false after cleanup)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'purchase_orders'
);

-- Step 6: Verify if purchase_order_items table exists (should be false after cleanup)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'purchase_order_items'
);

-- ============================================================================
-- AFTER RUNNING THE CLEANUP:
-- 1. The failed migration record will be removed
-- 2. All tables from the failed migration will be dropped
-- 3. You can then run the new migrations:
--    - 20251119000004_cleanup_suppliers_partial_migration.sql
--    - 20251119000005_add_supplier_foreign_keys_final.sql
-- ============================================================================