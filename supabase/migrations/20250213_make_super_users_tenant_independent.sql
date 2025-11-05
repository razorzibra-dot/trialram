-- ============================================================================
-- Migration: Make super users truly tenant-independent
-- Created: 2025-02-13
-- Purpose: Allow super users to exist without being tied to a specific tenant
-- ============================================================================

-- CRITICAL: This migration assumes is_super_admin column exists (from migration 20250212)

-- ============================================================================
-- Step 1: Make tenant_id nullable to allow super users independence
-- ============================================================================
ALTER TABLE users 
ALTER COLUMN tenant_id DROP NOT NULL;

-- ============================================================================
-- Step 2: Add constraint to enforce tenant_id for regular (non-super) users
-- ============================================================================
-- This ensures:
-- - Super users (is_super_admin=true) CAN have tenant_id=NULL
-- - Regular users (is_super_admin=false) MUST have tenant_id NOT NULL
ALTER TABLE users
ADD CONSTRAINT ck_tenant_id_for_regular_users
  CHECK (is_super_admin = true OR tenant_id IS NOT NULL);

-- ============================================================================
-- Step 3: Fix unique constraints to handle super user independence
-- ============================================================================

-- Drop the old unique constraint if it exists (may have different name)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS unique_email_per_tenant CASCADE;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_unique_email_per_tenant CASCADE;

-- Step 3a: Create unique index for regular users (unique per tenant)
CREATE UNIQUE INDEX idx_unique_email_per_tenant 
  ON users(email, tenant_id) 
  WHERE is_super_admin = false AND tenant_id IS NOT NULL;

-- Step 3b: Create unique index for super admins (globally unique email)
CREATE UNIQUE INDEX idx_unique_super_admin_email 
  ON users(email) 
  WHERE is_super_admin = true;

-- ============================================================================
-- Step 4: Create index for queries filtering by super admin status and tenant
-- ============================================================================
CREATE INDEX idx_users_super_admin_tenant ON users(is_super_admin, tenant_id);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check constraint is in place
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'users' 
AND constraint_name = 'ck_tenant_id_for_regular_users';

-- List all indexes related to users table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users' 
AND (indexname LIKE '%email%' OR indexname LIKE '%super_admin%' OR indexname LIKE '%tenant%')
ORDER BY indexname;

-- Verify column properties
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'tenant_id';

-- Check for any users that violate the constraint (should be empty before migration)
-- This will fail if there are regular users without tenant_id
SELECT 
  id,
  email,
  is_super_admin,
  tenant_id,
  'VIOLATION' as status
FROM users
WHERE (is_super_admin = false AND tenant_id IS NULL);