-- ============================================================================
-- Migration: Add deleted_at column to products table
-- Date: 2025-11-30
-- Problem: products table missing deleted_at column but service uses it for soft delete
-- Solution: Add deleted_at column to support soft delete pattern
-- ============================================================================

BEGIN;

-- Add deleted_at column to products table for soft delete support
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when filtering by deleted_at
CREATE INDEX IF NOT EXISTS idx_products_deleted_at
  ON public.products(deleted_at)
  WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete timestamp. When set, product is considered deleted. NULL means active.';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'deleted_at'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE '✅ deleted_at column added to products table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add deleted_at column to products table';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Added deleted_at column to products table
-- - Created index for performance
-- - Added documentation comment
-- - Supports soft delete pattern used in productService
-- ============================================================================

