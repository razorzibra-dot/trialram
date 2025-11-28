-- ============================================================================
-- Migration: Add user_name and user_email columns to audit_logs
-- Date: 2025-11-28
-- Description: Add missing user identification columns to audit_logs table
-- Required for audit logging functionality in auditService.ts
-- ============================================================================

-- Add user_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_name'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_name VARCHAR(255);
  END IF;
END $$;

-- Add user_email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_email'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(255);
  END IF;
END $$;

-- Add resource column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'resource'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource VARCHAR(100);
  END IF;
END $$;

-- Add resource_id column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR(255);
  END IF;
END $$;

-- Add metadata column if it doesn't exist (used in auditService.ts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add changes column if it doesn't exist (used in auditService.ts)
-- Note: audit_logs already has old_values and new_values, but changes is a combined format
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'changes'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
END $$;

-- Add indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Update comments
COMMENT ON COLUMN audit_logs.user_name IS 'Display name of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email address of the user who performed the action';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type that was affected (e.g., customer, sale, user)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource that was affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata about the action';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

