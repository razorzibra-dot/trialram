-- ============================================================================
-- Migration: Update Permissions to Resource:Action Format
-- Date: 2025-11-22
-- Description: Convert all legacy permission names to {resource}:{action} format
-- Impact: Fixes permission naming inconsistency across the RBAC system
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PERMISSIONS TABLE - RENAME LEGACY PERMISSIONS
-- ============================================================================

-- First, add new permissions in the correct format (matching seed.sql)
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
-- Core permissions (already correct format)
('read', 'Read access', 'core', '*', 'read', true),
('write', 'Write access', 'core', '*', 'write', true),
('delete', 'Delete access', 'core', '*', 'delete', true),

-- Module management permissions (matching seed.sql format)
('users:manage', 'Manage users', 'module', 'users', 'manage', false),
('roles:manage', 'Manage roles', 'module', 'roles', 'manage', false),
('customers:manage', 'Manage customers', 'module', 'customers', 'manage', false),
('sales:manage', 'Manage sales', 'module', 'sales', 'manage', false),
('contracts:manage', 'Manage contracts', 'module', 'contracts', 'manage', false),
('service_contracts:manage', 'Manage service contracts', 'module', 'service_contracts', 'manage', false),
('products:manage', 'Manage products', 'module', 'products', 'manage', false),
('product_sales:manage', 'Manage product sales', 'module', 'product_sales', 'manage', false),
('job_works:manage', 'Manage job works', 'module', 'job_works', 'manage', false),
('tickets:manage', 'Manage tickets', 'module', 'tickets', 'manage', false),
('complaints:manage', 'Manage complaints', 'module', 'complaints', 'manage', false),
('dashboard:manage', 'Access dashboard', 'module', 'dashboard', 'manage', false),
('settings:manage', 'Manage settings', 'module', 'settings', 'manage', false),
('companies:manage', 'Manage companies', 'module', 'companies', 'manage', false),
('reports:manage', 'Access reports and analytics', 'module', 'reports', 'manage', false),
('inventory:manage', 'Manage inventory', 'module', 'inventory', 'manage', false),
('integrations:manage', 'Manage third-party integrations', 'module', 'integrations', 'manage', false),

-- Additional permissions (matching seed.sql)
('export_data', 'Export data and reports', 'module', 'data', 'export', false),
('view_audit_logs', 'View audit logs', 'module', 'audit', 'read', false),
('create_tickets', 'Create support tickets', 'module', 'tickets', 'create', false),
('update_tickets', 'Update support tickets', 'module', 'tickets', 'update', false),
('create_products', 'Create products', 'module', 'products', 'create', false),
('update_products', 'Update products', 'module', 'products', 'update', false),
('view_financials', 'View financial reports', 'module', 'finance', 'read', false),
('bulk_operations', 'Perform bulk operations', 'module', 'bulk', 'manage', false),
('advanced_search', 'Advanced search capabilities', 'module', 'search', 'advanced', false),
('api_access', 'API access', 'module', 'api', 'access', false),

-- System permissions (already correct format)
('platform_admin', 'Platform administration', 'system', 'platform', 'admin', true),
('super_admin', 'Full system administration', 'system', 'system', 'admin', true),
('tenants:manage', 'Manage tenants', 'system', 'tenants', 'manage', true),
('system_monitoring', 'System monitoring', 'system', 'system', 'monitor', true)

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. UPDATE ROLE_PERMISSIONS TABLE - MAP LEGACY TO NEW PERMISSIONS
-- ============================================================================

-- First, create a mapping of old permission names to new permission names
CREATE TEMP TABLE permission_name_mapping AS
SELECT 
  p_old.name as old_name,
  p_new.id as new_permission_id,
  p_old.id as old_permission_id
FROM permissions p_old
JOIN permissions p_new ON p_new.name = CASE 
  WHEN p_old.name = 'manage_users' THEN 'users:manage'
  WHEN p_old.name = 'manage_roles' THEN 'roles:manage'
  WHEN p_old.name = 'manage_customers' THEN 'customers:manage'
  WHEN p_old.name = 'manage_sales' THEN 'sales:manage'
  WHEN p_old.name = 'manage_contracts' THEN 'contracts:manage'
  WHEN p_old.name = 'manage_service_contracts' THEN 'service_contracts:manage'
  WHEN p_old.name = 'manage_products' THEN 'products:manage'
  WHEN p_old.name = 'manage_product_sales' THEN 'product_sales:manage'
  WHEN p_old.name = 'manage_job_works' THEN 'job_works:manage'
  WHEN p_old.name = 'manage_tickets' THEN 'tickets:manage'
  WHEN p_old.name = 'manage_complaints' THEN 'complaints:manage'
  WHEN p_old.name = 'manage_dashboard' THEN 'dashboard:manage'
  WHEN p_old.name = 'manage_settings' THEN 'settings:manage'
  WHEN p_old.name = 'manage_companies' THEN 'companies:manage'
  WHEN p_old.name = 'manage_reports' THEN 'reports:manage'
  WHEN p_old.name = 'manage_inventory' THEN 'inventory:manage'
  WHEN p_old.name = 'manage_integrations' THEN 'integrations:manage'
  ELSE p_old.name
END;

-- Update role_permissions to use new permission IDs while preserving granted_by
UPDATE role_permissions 
SET permission_id = mapping.new_permission_id
FROM permission_name_mapping mapping
WHERE role_permissions.permission_id = mapping.old_permission_id;

-- Insert any missing role_permissions for Administrator role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrator'
  AND p.name IN (
    'read', 'write', 'delete',
    'users:manage', 'roles:manage', 'customers:manage', 'sales:manage',
    'contracts:manage', 'service_contracts:manage', 'products:manage',
    'dashboard:manage', 'settings:manage', 'companies:manage',
    'reports:manage', 'export_data', 'view_audit_logs',
    'create_tickets', 'update_tickets', 'create_products', 'update_products',
    'inventory:manage', 'view_financials', 'integrations:manage',
    'bulk_operations', 'advanced_search', 'api_access'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Insert any missing role_permissions for Manager role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND p.name IN (
    'read', 'write',
    'customers:manage', 'sales:manage',
    'contracts:manage', 'service_contracts:manage', 'products:manage',
    'dashboard:manage', 'settings:manage', 'companies:manage',
    'reports:manage', 'integrations:manage',
    'system_monitoring'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Insert any missing role_permissions for User role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'User'
  AND p.name IN (
    'read', 'write',
    'customers:manage',
    'product_sales:manage', 'job_works:manage',
    'tickets:manage'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Insert any missing role_permissions for Engineer role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Engineer'
  AND p.name IN (
    'read', 'write',
    'products:manage',
    'product_sales:manage',
    'job_works:manage',
    'tickets:manage',
    'create_products', 'update_products',
    'system_monitoring', 'view_audit_logs'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Insert any missing role_permissions for Customer role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Customer'
  AND p.name IN ('read')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Insert any missing role_permissions for super_admin role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name IN (
    'read', 'write', 'delete',
    'users:manage', 'roles:manage', 'customers:manage', 'sales:manage',
    'contracts:manage', 'service_contracts:manage', 'products:manage',
    'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
    'dashboard:manage', 'settings:manage', 'companies:manage',
    'reports:manage', 'export_data', 'view_audit_logs',
    'create_tickets', 'update_tickets', 'create_products', 'update_products',
    'inventory:manage', 'view_financials', 'integrations:manage',
    'bulk_operations', 'advanced_search', 'api_access',
    'platform_admin', 'super_admin', 'tenants:manage', 'system_monitoring'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Clean up temporary tables
DROP TABLE IF EXISTS permission_name_mapping;

-- ============================================================================
-- 3. CLEAN UP LEGACY PERMISSIONS
-- ============================================================================

-- Delete old legacy permissions (after ensuring all role_permissions are updated)
DELETE FROM permissions WHERE name IN (
  'manage_users', 'manage_roles', 'manage_customers', 'manage_sales', 
  'manage_contracts', 'manage_service_contracts', 'manage_products', 
  'manage_product_sales', 'manage_job_works', 'manage_tickets', 
  'manage_complaints', 'manage_dashboard', 'manage_settings', 
  'manage_companies', 'manage_reports', 'manage_inventory',
  'manage_integrations'
);

-- ============================================================================
-- 4. UPDATE PERMISSION CATEGORIES FOR NEW FORMAT
-- ============================================================================

-- Update categories for the new format permissions (matching seed.sql structure)
UPDATE permissions SET
  category = CASE
    WHEN name IN ('read', 'write', 'delete') THEN 'core'
    WHEN name LIKE '%:manage' THEN 'module'
    WHEN name IN ('export_data', 'view_audit_logs', 'create_tickets', 'update_tickets', 'create_products', 'update_products', 'view_financials', 'bulk_operations', 'advanced_search', 'api_access') THEN 'module'
    WHEN name IN ('platform_admin', 'super_admin', 'tenants:manage', 'system_monitoring') THEN 'system'
    ELSE 'core'
  END,
  is_system_permission = CASE
    WHEN name IN ('platform_admin', 'super_admin', 'tenants:manage', 'system_monitoring') THEN TRUE
    ELSE FALSE
  END;

-- ============================================================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure indexes exist for the new permission format
CREATE INDEX IF NOT EXISTS idx_permissions_name_format ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE permissions IS 'Permission definitions using {resource}:{action} format';
COMMENT ON COLUMN permissions.name IS 'Permission name in {resource}:{action} format (e.g., customers:read)';
COMMENT ON COLUMN permissions.resource IS 'Resource/module name (e.g., customers, sales, users)';
COMMENT ON COLUMN permissions.action IS 'Action name (e.g., read, create, update, delete)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Added new permissions in {resource}:{action} format
-- - Updated all role_permissions to use new permission names
-- - Removed legacy permission names (manage_* format)
-- - Updated permission categories to reflect new structure
-- - Added performance indexes
-- - Enhanced documentation
-- ============================================================================