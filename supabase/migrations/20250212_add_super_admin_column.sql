-- ============================================================================
-- Migration: Add is_super_admin column to users table
-- Created: 2025-02-12
-- Purpose: Mark users as super administrators for global tenant management
-- ============================================================================

-- Step 1: Add is_super_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Create index for super admin queries (used in RLS policies)
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin) 
WHERE is_super_admin = true;

-- Step 3: Add composite index for authentication queries
CREATE INDEX idx_users_super_admin_status ON users(is_super_admin, status);

-- Step 4: Add index for email uniqueness per tenant (for later unique constraint)
CREATE INDEX idx_users_email_tenant ON users(email, tenant_id);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Verify column was created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name='users' AND column_name='is_super_admin'
ORDER BY ordinal_position;