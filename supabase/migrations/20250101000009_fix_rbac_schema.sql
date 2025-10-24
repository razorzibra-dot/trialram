-- ============================================================================
-- RBAC SCHEMA FIX
-- Migration: 009 - Add missing RBAC tables and columns
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO PERMISSIONS TABLE
-- ============================================================================

ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_system_permission BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. CREATE ROLE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'custom', -- e.g., 'sales', 'operations', 'support', 'admin'
  permissions JSONB DEFAULT '[]'::JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_template_per_tenant'
  ) THEN
    ALTER TABLE role_templates
    ADD CONSTRAINT unique_template_per_tenant UNIQUE(name, tenant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_role_templates_tenant_id ON role_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_templates_is_default ON role_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_role_templates_category ON role_templates(category);

-- ============================================================================
-- 3. CREATE TRIGGER FOR ROLE_TEMPLATES updated_at
-- ============================================================================

CREATE TRIGGER role_templates_updated_at_trigger
BEFORE UPDATE ON role_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. INSERT DEFAULT PERMISSIONS IF NOT EXISTS
-- ============================================================================

-- Core permissions for user management
INSERT INTO permissions (name, description, resource, action, category, is_system_permission) 
VALUES 
  ('manage_users', 'Create, read, update, and delete users', 'users', 'manage', 'admin', TRUE),
  ('view_users', 'View user list and details', 'users', 'read', 'admin', TRUE),
  ('create_user', 'Create new users', 'users', 'create', 'admin', TRUE),
  ('edit_user', 'Edit user information', 'users', 'update', 'admin', TRUE),
  ('delete_user', 'Delete users', 'users', 'delete', 'admin', TRUE),
  ('reset_password', 'Reset user passwords', 'users', 'update', 'admin', TRUE),
  ('assign_role', 'Assign roles to users', 'roles', 'assign', 'admin', TRUE),
  ('manage_roles', 'Create, read, update, and delete roles', 'roles', 'manage', 'admin', TRUE),
  ('view_roles', 'View role list and details', 'roles', 'read', 'admin', TRUE),
  ('create_role', 'Create new roles', 'roles', 'create', 'admin', TRUE),
  ('edit_role', 'Edit role information', 'roles', 'update', 'admin', TRUE),
  ('delete_role', 'Delete roles', 'roles', 'delete', 'admin', TRUE),
  ('manage_permissions', 'Manage permissions', 'permissions', 'manage', 'admin', TRUE),
  ('view_audit_logs', 'View audit logs', 'audit_logs', 'read', 'admin', TRUE),
  ('view_reports', 'View analytics and reports', 'reports', 'read', 'reporting', FALSE),
  ('create_customer', 'Create new customers', 'customers', 'create', 'crm', FALSE),
  ('edit_customer', 'Edit customer information', 'customers', 'update', 'crm', FALSE),
  ('delete_customer', 'Delete customers', 'customers', 'delete', 'crm', FALSE),
  ('view_customer', 'View customer details', 'customers', 'read', 'crm', FALSE),
  ('manage_contracts', 'Manage contracts', 'contracts', 'manage', 'crm', FALSE),
  ('manage_tickets', 'Manage support tickets', 'tickets', 'manage', 'support', FALSE),
  ('manage_sales', 'Manage sales records', 'sales', 'manage', 'sales', FALSE),
  ('manage_products', 'Manage products', 'products', 'manage', 'masters', FALSE),
  ('manage_job_works', 'Manage job works', 'job_works', 'manage', 'operations', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INSERT DEFAULT ROLE TEMPLATES IF NOT EXISTS
-- ============================================================================

INSERT INTO role_templates (name, description, category, is_default, permissions) 
VALUES 
  (
    'Super Admin',
    'Full system access - can manage all aspects of the application',
    'admin',
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works"
    ]'::JSONB
  ),
  (
    'Administrator',
    'Administrative access - manage users, roles, and system settings',
    'admin',
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "view_customer", "manage_contracts", "manage_tickets", "manage_sales"
    ]'::JSONB
  ),
  (
    'Sales Manager',
    'Sales and customer management access',
    'sales',
    TRUE,
    '[
      "view_users", "view_reports", "create_customer", "edit_customer", "view_customer",
      "manage_contracts", "manage_sales", "manage_job_works"
    ]'::JSONB
  ),
  (
    'Support Agent',
    'Support ticket and customer service access',
    'support',
    TRUE,
    '[
      "view_users", "view_customer", "manage_tickets", "create_customer", "edit_customer"
    ]'::JSONB
  ),
  (
    'Viewer',
    'Read-only access - can only view data',
    'general',
    TRUE,
    '[
      "view_users", "view_roles", "view_customer", "view_reports"
    ]'::JSONB
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE role_templates IS 'Pre-configured role templates for quick role creation';
COMMENT ON COLUMN role_templates.is_default IS 'Whether this is a default system template';
COMMENT ON COLUMN role_templates.category IS 'Category of the template (admin, sales, support, etc.)';