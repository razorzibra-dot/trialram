-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - CORE SETUP
-- Migration: 001 - Tenants and Users
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS - Shared Type Definitions
-- ============================================================================

-- User Roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'agent',
  'engineer',
  'customer'
);

-- User Status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- ============================================================================
-- 2. TENANTS TABLE - Multi-tenant Support
-- ============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
  users_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for tenants
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_domain ON tenants(domain);

-- ============================================================================
-- 3. USERS TABLE - Authentication & Authorization
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'agent',
  status user_status NOT NULL DEFAULT 'active',
  
  -- Tenant relationship
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Additional information
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  company_name VARCHAR(255),
  department VARCHAR(100),
  position VARCHAR(100),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint per tenant
  CONSTRAINT unique_email_per_tenant UNIQUE(email, tenant_id)
);

-- Indexes for users
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- 4. USER ROLES & PERMISSIONS - RBAC
-- ============================================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_system_role BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);

-- ============================================================================
-- 5. USER ROLE ASSIGNMENTS
-- ============================================================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_user_role_per_tenant UNIQUE(user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);

-- ============================================================================
-- 6. PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. ROLE PERMISSIONS MAPPING
-- ============================================================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================================================
-- 8. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  
  changes JSONB,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- 9. HELPER FUNCTIONS - Timestamp Updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER tenants_updated_at_trigger
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roles_updated_at_trigger
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. INITIAL DATA - Default System Roles
-- ============================================================================

-- This will be populated by the application on first setup
-- Or manually: INSERT INTO permissions VALUES (...) for core permissions

COMMENT ON TABLE tenants IS 'Multi-tenant data isolation';
COMMENT ON TABLE users IS 'Application users with tenant isolation';
COMMENT ON TABLE roles IS 'Custom roles per tenant';
COMMENT ON TABLE audit_logs IS 'Activity audit trail';