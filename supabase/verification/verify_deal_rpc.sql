-- Verification Script: Deal RPC and Schema Consistency
-- Purpose: Ensure migrations correctly define functions and schema after reset

-- 1) Check deals table columns (ensure no updated_by column)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'deals'
ORDER BY column_name;

-- 2) Assert deals.updated_by does NOT exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'updated_by'
  ) THEN
    RAISE EXCEPTION 'Schema mismatch: deals.updated_by should not exist';
  END IF;
END $$;

-- 3) Confirm RPC functions exist
SELECT p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('create_deal_with_items', 'update_deal_with_items')
ORDER BY p.proname;

-- 4) Confirm update_deal_with_items does NOT set deals.updated_by
-- This checks the function definition text for the absence of 'updated_by ='
WITH def AS (
  SELECT pg_get_functiondef(p.oid) AS src
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'update_deal_with_items'
)
SELECT CASE WHEN POSITION('updated_by =' IN src) = 0
            THEN 'OK: deals.updated_by not set in update function'
            ELSE 'ERROR: deals.updated_by set in update function'
       END AS update_func_updated_by_check
FROM def;

-- 5) Confirm deal_items columns exist (discount_amount/percentage, tax_amount/percentage, description)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'deal_items'
  AND column_name IN ('discount_amount','discount_percentage','tax_amount','tax_percentage','description')
ORDER BY column_name;

-- 6) Show function definitions for manual inspection (optional)
-- SELECT pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.proname IN ('create_deal_with_items', 'update_deal_with_items');
