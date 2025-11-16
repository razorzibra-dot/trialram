-- ============================================================================
-- Migration: Add user_name and user_email columns to audit_logs
-- Date: 2025-03-28
-- Description: Add missing user identification columns to audit_logs table
-- Required for audit logging functionality in auditService.ts
-- ============================================================================

-- Add user_name column
ALTER TABLE audit_logs
ADD COLUMN user_name VARCHAR(255);

-- Add user_email column
ALTER TABLE audit_logs
ADD COLUMN user_email VARCHAR(255);

-- Add resource column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN resource VARCHAR(100);

-- Add resource_id column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN resource_id VARCHAR(255);

-- Add target_id column (used in superAdminManagementService.ts)
ALTER TABLE audit_logs
ADD COLUMN target_id VARCHAR(255);

-- Add metadata column (used in auditService.ts)
ALTER TABLE audit_logs
ADD COLUMN metadata JSONB;

-- Add indexes for the new columns
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);

-- Update comments
COMMENT ON COLUMN audit_logs.user_name IS 'Display name of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email address of the user who performed the action';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type that was affected (e.g., customer, sale, user)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource that was affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata about the action';

-- ============================================================================
-- Verification queries (run after migration)
-- ============================================================================

-- Check that columns were added
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'audit_logs'
-- AND column_name IN ('user_name', 'user_email', 'resource', 'resource_id', 'metadata')
-- ORDER BY column_name;

-- Check indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'audit_logs'
-- AND indexname LIKE '%user_email%' OR indexname LIKE '%resource%'
-- ORDER BY indexname;