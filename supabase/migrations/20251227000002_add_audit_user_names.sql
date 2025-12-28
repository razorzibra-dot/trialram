-- ============================================================================
-- MIGRATION: 20251227000002 - Add Audit User Name Columns
-- ============================================================================
-- Purpose: Store created_by and updated_by user names directly to avoid RLS issues
-- ============================================================================

-- ============================================================================
-- 1. Add created_by_name and updated_by_name columns to leads
-- ============================================================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by_name VARCHAR(255);

-- ============================================================================
-- 2. Populate created_by_name from existing data
-- ============================================================================
UPDATE leads l
SET created_by_name = COALESCE(
  u.name,
  CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))
)
FROM users u
WHERE l.created_by = u.id
AND l.created_by_name IS NULL;

-- ============================================================================
-- 3. Populate updated_by_name from existing data  
-- ============================================================================
UPDATE leads l
SET updated_by_name = COALESCE(
  u.name,
  CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))
)
FROM users u
WHERE l.updated_by = u.id
AND l.updated_by_name IS NULL;

-- ============================================================================
-- Notes:
-- - These columns denormalize user names to avoid RLS restrictions
-- - Service layer will keep these in sync when creating/updating leads
-- - UI will display these instead of trying to look up users via RLS
-- ============================================================================
