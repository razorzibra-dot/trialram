-- =====================================================
-- Super User Module - Database Schema Migration
-- Created: 2025-02-11
-- Purpose: Define tables for super user management,
--          impersonation audit logging, tenant statistics,
--          and configuration overrides
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Access level enum for tenant access control
CREATE TYPE access_level_enum AS ENUM (
    'full',
    'limited',
    'read_only',
    'specific_modules'
);

-- Metric type enum for tenant statistics
CREATE TYPE metric_type_enum AS ENUM (
    'active_users',
    'total_contracts',
    'total_sales',
    'total_transactions',
    'disk_usage',
    'api_calls_daily'
);

-- =====================================================
-- TABLE 1: Super User Tenant Access
-- =====================================================
-- Purpose: Track which tenants a super user can manage
-- This creates a many-to-many relationship between
-- super users and tenants with access level control

CREATE TABLE super_user_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    access_level access_level_enum NOT NULL DEFAULT 'limited',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_super_user_tenant_access_super_user_id
        FOREIGN KEY (super_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_tenant_access_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint: each super user can have one access level per tenant
    CONSTRAINT uk_super_user_tenant_access_unique
        UNIQUE (super_user_id, tenant_id),
    
    -- Check constraints
    CONSTRAINT ck_super_user_tenant_access_not_null
        CHECK (super_user_id IS NOT NULL AND tenant_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_super_user_tenant_access_super_user_id 
    ON super_user_tenant_access(super_user_id);
CREATE INDEX idx_super_user_tenant_access_tenant_id 
    ON super_user_tenant_access(tenant_id);
CREATE INDEX idx_super_user_tenant_access_composite 
    ON super_user_tenant_access(super_user_id, tenant_id);
CREATE INDEX idx_super_user_tenant_access_access_level 
    ON super_user_tenant_access(access_level);

-- =====================================================
-- TABLE 2: Impersonation Audit Logs
-- =====================================================
-- Purpose: Track all super user impersonation sessions
-- for audit and compliance purposes

CREATE TABLE super_user_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL,
    impersonated_user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    reason VARCHAR(500),
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    actions_taken JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_super_user_impersonation_logs_super_user_id
        FOREIGN KEY (super_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_impersonation_logs_impersonated_user_id
        FOREIGN KEY (impersonated_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_super_user_impersonation_logs_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT ck_super_user_impersonation_logs_not_null
        CHECK (super_user_id IS NOT NULL AND impersonated_user_id IS NOT NULL AND tenant_id IS NOT NULL),
    CONSTRAINT ck_super_user_impersonation_logs_login_before_logout
        CHECK (logout_at IS NULL OR logout_at > login_at)
);

-- Indexes for performance
CREATE INDEX idx_super_user_impersonation_logs_super_user_id 
    ON super_user_impersonation_logs(super_user_id);
CREATE INDEX idx_super_user_impersonation_logs_impersonated_user_id 
    ON super_user_impersonation_logs(impersonated_user_id);
CREATE INDEX idx_super_user_impersonation_logs_tenant_id 
    ON super_user_impersonation_logs(tenant_id);
CREATE INDEX idx_super_user_impersonation_logs_login_at 
    ON super_user_impersonation_logs(login_at DESC);
CREATE INDEX idx_super_user_impersonation_logs_logout_at 
    ON super_user_impersonation_logs(logout_at DESC)
    WHERE logout_at IS NOT NULL;
CREATE INDEX idx_super_user_impersonation_logs_active_sessions 
    ON super_user_impersonation_logs(super_user_id, logout_at)
    WHERE logout_at IS NULL;

-- =====================================================
-- TABLE 3: Tenant Statistics
-- =====================================================
-- Purpose: Store aggregated metrics for tenant dashboard
-- and analytics across multi-tenant system

CREATE TABLE tenant_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type metric_type_enum NOT NULL,
    metric_value DECIMAL(15, 2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tenant_statistics_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT ck_tenant_statistics_not_null
        CHECK (tenant_id IS NOT NULL AND metric_type IS NOT NULL),
    CONSTRAINT ck_tenant_statistics_metric_value_non_negative
        CHECK (metric_value IS NULL OR metric_value >= 0)
);

-- Indexes for performance
CREATE INDEX idx_tenant_statistics_tenant_id 
    ON tenant_statistics(tenant_id);
CREATE INDEX idx_tenant_statistics_metric_type 
    ON tenant_statistics(metric_type);
CREATE INDEX idx_tenant_statistics_recorded_at 
    ON tenant_statistics(recorded_at DESC);
CREATE INDEX idx_tenant_statistics_tenant_metric_time 
    ON tenant_statistics(tenant_id, metric_type, recorded_at DESC);

-- =====================================================
-- TABLE 4: Tenant Configuration Overrides
-- =====================================================
-- Purpose: Store configuration overrides for specific
-- tenants that super users can apply temporarily or
-- permanently with expiration options

CREATE TABLE tenant_config_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    override_reason VARCHAR(500),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tenant_config_overrides_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_config_overrides_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint: one config key per tenant
    CONSTRAINT uk_tenant_config_overrides_unique
        UNIQUE (tenant_id, config_key),
    
    -- Check constraints
    CONSTRAINT ck_tenant_config_overrides_not_null
        CHECK (tenant_id IS NOT NULL AND config_key IS NOT NULL AND config_value IS NOT NULL),
    CONSTRAINT ck_tenant_config_overrides_expires_after_created
        CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_tenant_config_overrides_tenant_id 
    ON tenant_config_overrides(tenant_id);
CREATE INDEX idx_tenant_config_overrides_config_key 
    ON tenant_config_overrides(config_key);
CREATE INDEX idx_tenant_config_overrides_created_at 
    ON tenant_config_overrides(created_at DESC);
CREATE INDEX idx_tenant_config_overrides_expires_at 
    ON tenant_config_overrides(expires_at DESC)
    WHERE expires_at IS NOT NULL;
CREATE INDEX idx_tenant_config_overrides_active 
    ON tenant_config_overrides(tenant_id, config_key)
    WHERE expires_at IS NULL;

-- =====================================================
-- Migration Complete
-- NOTE: RLS Policies are created in migration 20250214
--       after is_super_admin column is added in 20250212
-- =====================================================