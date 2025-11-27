-- ============================================================================
-- PHASE 4: DATABASE SCHEMA VALIDATION - User Security Enhancements
-- Migration: 20251117000003 - Add User Security Fields
-- ============================================================================

-- Add MFA (Multi-Factor Authentication) fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]'::JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method VARCHAR(50) DEFAULT 'none' CHECK (mfa_method IN ('none', 'totp', 'sms', 'email'));

-- Add session management fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS concurrent_sessions_limit INTEGER DEFAULT 5;

-- Add security audit fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '[]'::JSONB;

-- Add password policy fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_strength_score INTEGER DEFAULT 0 CHECK (password_strength_score >= 0 AND password_strength_score <= 100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;

-- Add account lockout mechanism
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason TEXT;

-- Add security event tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspicious_activity_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_suspicious_activity TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_alerts_enabled BOOLEAN DEFAULT TRUE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mfa_method ON users(mfa_method);
CREATE INDEX IF NOT EXISTS idx_users_failed_login_attempts ON users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked);
CREATE INDEX IF NOT EXISTS idx_users_password_expires_at ON users(password_expires_at);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_failed_login_attempts
  CHECK (failed_login_attempts >= 0);

ALTER TABLE users ADD CONSTRAINT check_concurrent_sessions_limit
  CHECK (concurrent_sessions_limit > 0 AND concurrent_sessions_limit <= 20);

-- Update existing records to have default values
UPDATE users SET
  mfa_method = 'none',
  failed_login_attempts = 0,
  concurrent_sessions_limit = 5,
  security_alerts_enabled = TRUE,
  password_changed_at = COALESCE(password_changed_at, created_at)
WHERE mfa_method IS NULL OR failed_login_attempts IS NULL;

-- Add comments
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret key for multi-factor authentication';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Backup recovery codes for MFA';
COMMENT ON COLUMN users.mfa_method IS 'MFA method: none, totp, sms, email';
COMMENT ON COLUMN users.session_token IS 'Current session token for session management';
COMMENT ON COLUMN users.session_expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN users.concurrent_sessions_limit IS 'Maximum concurrent sessions allowed';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account lockout expiration timestamp';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of last failed login attempt';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN users.last_password_reset IS 'Timestamp of last password reset request';
COMMENT ON COLUMN users.security_questions IS 'Security questions for account recovery';
COMMENT ON COLUMN users.password_strength_score IS 'Password strength score (0-100)';
COMMENT ON COLUMN users.password_expires_at IS 'Password expiration timestamp';
COMMENT ON COLUMN users.require_password_change IS 'Flag to force password change on next login';
COMMENT ON COLUMN users.account_locked IS 'Account lockout status';
COMMENT ON COLUMN users.lock_reason IS 'Reason for account lockout';
COMMENT ON COLUMN users.suspicious_activity_count IS 'Count of suspicious activities detected';
COMMENT ON COLUMN users.last_suspicious_activity IS 'Timestamp of last suspicious activity';
COMMENT ON COLUMN users.security_alerts_enabled IS 'Whether security alerts are enabled for this user';