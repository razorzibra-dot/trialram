-- ============================================================================
-- CONSOLIDATED PERMISSIONS MIGRATION
-- ============================================================================
-- This is the authoritative permissions file that:
-- 1. Creates ALL permissions the application code expects
-- 2. Assigns them properly to all roles (super_admin, tenant_admin, etc.)
-- 
-- Run this after fresh database setup or to fix missing permissions.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ALL PERMISSIONS
-- ============================================================================
-- These permissions are based on src/constants/permissionTokens.ts and actual
-- hasPermission() calls found throughout the codebase.

INSERT INTO permissions (name, description, category, resource, action) VALUES

-- ============================================================================
-- AUTH MODULE
-- ============================================================================
('crm:auth:session:login', 'User can log in', 'core', 'auth', 'session:login'),
('crm:auth:session:logout', 'User can log out', 'core', 'auth', 'session:logout'),
('crm:auth:profile:read', 'View own profile', 'core', 'auth', 'profile:read'),
('crm:auth:profile:update', 'Update own profile', 'core', 'auth', 'profile:update'),

-- ============================================================================
-- CUSTOMER MODULE
-- ============================================================================
('crm:customer:record:read', 'View customer records', 'module', 'customer', 'record:read'),
('crm:customer:record:create', 'Create customer records', 'module', 'customer', 'record:create'),
('crm:customer:record:update', 'Update customer records', 'module', 'customer', 'record:update'),
('crm:customer:record:delete', 'Delete customer records', 'module', 'customer', 'record:delete'),
('crm:customer:record:bulk:update', 'Bulk update customer records', 'module', 'customer', 'record:bulk:update'),
('crm:customer:record:export', 'Export customer records', 'module', 'customer', 'record:export'),
('crm:customer:contact:add', 'Add customer contacts', 'module', 'customer', 'contact:add'),
('crm:customer:contact:remove', 'Remove customer contacts', 'module', 'customer', 'contact:remove'),
('crm:customer:document:upload', 'Upload customer documents', 'module', 'customer', 'document:upload'),
('crm:customer:document:download', 'Download customer documents', 'module', 'customer', 'document:download'),

-- ============================================================================
-- COMPANY MODULE
-- ============================================================================
('crm:company:record:read', 'View company records', 'module', 'company', 'record:read'),
('crm:company:record:create', 'Create company records', 'module', 'company', 'record:create'),
('crm:company:record:update', 'Update company records', 'module', 'company', 'record:update'),
('crm:company:record:delete', 'Delete company records', 'module', 'company', 'record:delete'),

-- ============================================================================
-- SALES/DEALS MODULE
-- ============================================================================
('crm:sales:deal:read', 'View deal records', 'module', 'sales', 'deal:read'),
('crm:sales:deal:create', 'Create deal records', 'module', 'sales', 'deal:create'),
('crm:sales:deal:update', 'Update deal records', 'module', 'sales', 'deal:update'),
('crm:sales:deal:delete', 'Delete deal records', 'module', 'sales', 'deal:delete'),
('crm:sales:deal:close', 'Close deals', 'module', 'sales', 'deal:close'),
('crm:sales:pipeline:view', 'View sales pipeline', 'module', 'sales', 'pipeline:view'),
('crm:sales:pipeline:manage', 'Manage sales pipeline', 'module', 'sales', 'pipeline:manage'),
('crm:sales:pipeline:move', 'Move deals in pipeline', 'module', 'sales', 'pipeline:move'),
('crm:sales:forecast:view', 'View sales forecast', 'module', 'sales', 'forecast:view'),
('crm:sales:forecast:create', 'Create sales forecast', 'module', 'sales', 'forecast:create'),
('crm:sales:activity:log', 'Log sales activities', 'module', 'sales', 'activity:log'),

-- ============================================================================
-- LEAD MODULE
-- ============================================================================
('crm:lead:record:read', 'View lead records', 'module', 'lead', 'record:read'),
('crm:lead:record:create', 'Create lead records', 'module', 'lead', 'record:create'),
('crm:lead:record:update', 'Update lead records', 'module', 'lead', 'record:update'),
('crm:lead:record:delete', 'Delete lead records', 'module', 'lead', 'record:delete'),

-- ============================================================================
-- PRODUCT MODULE
-- ============================================================================
('crm:product:record:read', 'View product records', 'module', 'product', 'record:read'),
('crm:product:record:create', 'Create product records', 'module', 'product', 'record:create'),
('crm:product:record:update', 'Update product records', 'module', 'product', 'record:update'),
('crm:product:record:delete', 'Delete product records', 'module', 'product', 'record:delete'),
('crm:product:inventory:manage', 'Manage product inventory', 'module', 'product', 'inventory:manage'),
('crm:product:pricing:manage', 'Manage product pricing', 'module', 'product', 'pricing:manage'),

-- ============================================================================
-- PRODUCT-SALE MODULE (critical for ProductSalesPage)
-- ============================================================================
('crm:product-sale:record:read', 'View product sale records', 'module', 'product-sale', 'record:read'),
('crm:product-sale:record:create', 'Create product sale records', 'module', 'product-sale', 'record:create'),
('crm:product-sale:record:update', 'Update product sale records', 'module', 'product-sale', 'record:update'),
('crm:product-sale:record:delete', 'Delete product sale records', 'module', 'product-sale', 'record:delete'),

-- ============================================================================
-- CONTRACT MODULE
-- ============================================================================
('crm:contract:record:read', 'View contract records', 'module', 'contract', 'record:read'),
('crm:contract:record:create', 'Create contract records', 'module', 'contract', 'record:create'),
('crm:contract:record:update', 'Update contract records', 'module', 'contract', 'record:update'),
('crm:contract:record:delete', 'Delete contract records', 'module', 'contract', 'record:delete'),
('crm:contract:record:approve', 'Approve contracts', 'module', 'contract', 'record:approve'),

-- ============================================================================
-- SERVICE CONTRACT MODULE
-- ============================================================================
('crm:contract:service:read', 'View service contracts', 'module', 'service-contract', 'read'),
('crm:contract:service:create', 'Create service contracts', 'module', 'service-contract', 'create'),
('crm:contract:service:update', 'Update service contracts', 'module', 'service-contract', 'update'),
('crm:contract:service:delete', 'Delete service contracts', 'module', 'service-contract', 'delete'),
('crm:contract:service:approve', 'Approve service contracts', 'module', 'service-contract', 'approve'),
('crm:contract:service:renew', 'Renew service contracts', 'module', 'service-contract', 'renew'),

-- ============================================================================
-- PROJECT/JOB-WORKS MODULE
-- ============================================================================
('crm:project:record:read', 'View project records', 'module', 'project', 'record:read'),
('crm:project:record:create', 'Create project records', 'module', 'project', 'record:create'),
('crm:project:record:update', 'Update project records', 'module', 'project', 'record:update'),
('crm:project:record:delete', 'Delete project records', 'module', 'project', 'record:delete'),
('crm:project:task:assign', 'Assign project tasks', 'module', 'project', 'task:assign'),
('crm:project:resource:allocate', 'Allocate project resources', 'module', 'project', 'resource:allocate'),
('crm:project:milestone:manage', 'Manage project milestones', 'module', 'project', 'milestone:manage'),

-- ============================================================================
-- SUPPORT/TICKET MODULE
-- ============================================================================
('crm:support:ticket:read', 'View ticket records', 'module', 'support', 'ticket:read'),
('crm:support:ticket:create', 'Create ticket records', 'module', 'support', 'ticket:create'),
('crm:support:ticket:update', 'Update ticket records', 'module', 'support', 'ticket:update'),
('crm:support:ticket:assign', 'Assign tickets', 'module', 'support', 'ticket:assign'),
('crm:support:ticket:resolve', 'Resolve tickets', 'module', 'support', 'ticket:resolve'),
('crm:support:ticket:close', 'Close tickets', 'module', 'support', 'ticket:close'),
('crm:support:ticket:delete', 'Delete tickets', 'module', 'support', 'ticket:delete'),

-- ============================================================================
-- SUPPORT/COMPLAINT MODULE
-- ============================================================================
('crm:support:complaint:read', 'View complaint records', 'module', 'support', 'complaint:read'),
('crm:support:complaint:create', 'Create complaint records', 'module', 'support', 'complaint:create'),
('crm:support:complaint:update', 'Update complaint records', 'module', 'support', 'complaint:update'),
('crm:support:complaint:investigate', 'Investigate complaints', 'module', 'support', 'complaint:investigate'),
('crm:support:complaint:resolve', 'Resolve complaints', 'module', 'support', 'complaint:resolve'),
('crm:support:complaint:delete', 'Delete complaints', 'module', 'support', 'complaint:delete'),

-- ============================================================================
-- REPORT MODULE
-- ============================================================================
('crm:report:record:view', 'View reports', 'module', 'report', 'record:view'),
('crm:report:record:create', 'Create reports', 'module', 'report', 'record:create'),
('crm:report:record:export', 'Export reports', 'module', 'report', 'record:export'),

-- ============================================================================
-- ANALYTICS MODULE
-- ============================================================================
('crm:analytics:insight:view', 'View analytics insights', 'module', 'analytics', 'insight:view'),
('crm:analytics:insight:create', 'Create analytics insights', 'module', 'analytics', 'insight:create'),

-- ============================================================================
-- DASHBOARD MODULE
-- ============================================================================
('crm:dashboard:panel:view', 'View dashboard panels', 'module', 'dashboard', 'panel:view'),
('crm:dashboard:panel:create', 'Create dashboard panels', 'module', 'dashboard', 'panel:create'),

-- ============================================================================
-- AUDIT MODULE
-- ============================================================================
('crm:audit:log:read', 'Read audit logs', 'administrative', 'audit', 'log:read'),
('crm:audit:log:export', 'Export audit logs', 'administrative', 'audit', 'log:export'),
('crm:audit:report:generate', 'Generate audit reports', 'administrative', 'audit', 'report:generate'),

-- ============================================================================
-- NOTIFICATION MODULE
-- ============================================================================
('crm:notification:channel:read', 'Read notification channels', 'module', 'notification', 'channel:read'),
('crm:notification:channel:manage', 'Manage notification channels', 'module', 'notification', 'channel:manage'),
('crm:notification:template:create', 'Create notification templates', 'module', 'notification', 'template:create'),
('crm:notification:campaign:create', 'Create notification campaigns', 'module', 'notification', 'campaign:create'),

-- ============================================================================
-- REFERENCE DATA MODULE
-- ============================================================================
('crm:reference:data:read', 'Read reference data', 'module', 'reference', 'data:read'),
('crm:reference:data:manage', 'Manage reference data', 'module', 'reference', 'data:manage'),
('crm:reference:data:import', 'Import reference data', 'module', 'reference', 'data:import'),
('crm:reference:data:export', 'Export reference data', 'module', 'reference', 'data:export'),

-- ============================================================================
-- PERMISSION MODULE
-- ============================================================================
('crm:permission:record:read', 'Read permissions', 'administrative', 'permission', 'record:read'),
('crm:permission:record:create', 'Create permissions', 'administrative', 'permission', 'record:create'),
('crm:permission:record:update', 'Update permissions', 'administrative', 'permission', 'record:update'),
('crm:permission:record:delete', 'Delete permissions', 'administrative', 'permission', 'record:delete'),

-- ============================================================================
-- USER MANAGEMENT MODULE
-- ============================================================================
('crm:user:record:read', 'View user records', 'administrative', 'user', 'record:read'),
('crm:user:record:create', 'Create user records', 'administrative', 'user', 'record:create'),
('crm:user:record:update', 'Update user records', 'administrative', 'user', 'record:update'),
('crm:user:record:delete', 'Delete user records', 'administrative', 'user', 'record:delete'),
('crm:user:role:assign', 'Assign roles to users', 'administrative', 'user', 'role:assign'),
('crm:user:role:revoke', 'Revoke roles from users', 'administrative', 'user', 'role:revoke'),

-- ============================================================================
-- ROLE MANAGEMENT MODULE
-- ============================================================================
('crm:role:record:read', 'View role records', 'administrative', 'role', 'record:read'),
('crm:role:record:create', 'Create role records', 'administrative', 'role', 'record:create'),
('crm:role:record:update', 'Update role records', 'administrative', 'role', 'record:update'),
('crm:role:record:delete', 'Delete role records', 'administrative', 'role', 'record:delete'),
('crm:role:permission:assign', 'Assign permissions to roles', 'administrative', 'role', 'permission:assign'),

-- ============================================================================
-- SYSTEM MODULE
-- ============================================================================
('crm:system:platform:admin', 'Platform administration', 'system', 'system', 'platform:admin'),
('crm:system:config:read', 'Read system configuration', 'system', 'system', 'config:read'),
('crm:system:config:manage', 'Manage system configuration', 'system', 'system', 'config:manage'),
('crm:system:backup:create', 'Create system backups', 'system', 'system', 'backup:create'),
('crm:system:backup:restore', 'Restore system backups', 'system', 'system', 'backup:restore'),

-- ============================================================================
-- PLATFORM (SUPER ADMIN) MODULE
-- ============================================================================
('crm:platform:control:admin', 'Super admin platform control', 'system', 'platform', 'control:admin'),
('crm:platform:tenant:create', 'Create tenants', 'system', 'platform', 'tenant:create'),
('crm:platform:tenant:update', 'Update tenants', 'system', 'platform', 'tenant:update'),
('crm:platform:tenant:delete', 'Delete tenants', 'system', 'platform', 'tenant:delete'),
('crm:platform:tenant:suspend', 'Suspend tenants', 'system', 'platform', 'tenant:suspend'),
('crm:platform:tenant:manage', 'Manage tenants', 'system', 'platform', 'tenant:manage'),
('crm:platform:user:manage', 'Manage platform users', 'system', 'platform', 'user:manage'),
('crm:platform:audit:view', 'View platform audit logs', 'system', 'platform', 'audit:view'),
('crm:platform:crm:analytics:insight:view', 'View platform analytics', 'system', 'platform', 'analytics:view'),
('crm:platform:config:manage', 'Manage platform configuration', 'system', 'platform', 'config:manage'),

-- ============================================================================
-- DATA MODULE
-- ============================================================================
('crm:data:export', 'Export data', 'module', 'data', 'export'),
('crm:data:import', 'Import data', 'module', 'data', 'import'),

-- ============================================================================
-- LEGACY/GENERIC PERMISSIONS (for backward compatibility)
-- ============================================================================
('read', 'Generic read permission', 'core', 'system', 'read'),
('write', 'Generic write permission', 'core', 'system', 'write'),
('delete', 'Generic delete permission', 'core', 'system', 'delete'),
('super_admin', 'Super admin access', 'system', 'system', 'super_admin')

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 1.5: CREATE BASE TENANTS AND ROLES
-- ============================================================================
-- Create sample tenants FIRST so roles can be created with proper tenant_ids.
-- This ensures tenant_admin roles exist before permission assignment.

-- First, fix the roles table constraint if tenant_id is currently NOT NULL
DO $$
BEGIN
  -- Make tenant_id nullable if it isn't already (required for super_admin role)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'tenant_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;
  END IF;
END $$;

-- Create sample tenants (same as seed.sql, but run here to ensure they exist for role creation)
INSERT INTO tenants (id, name, domain, plan, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Acme Corporation', 'acme.com', 'enterprise', 'active'),
  ('b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'Tech Solutions Inc', 'techsolutions.example', 'premium', 'active'),
  ('c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'Global Trading Ltd', 'globaltrading.example', 'basic', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert system super_admin role (tenant_id = NULL)
INSERT INTO roles (name, description, tenant_id, is_system_role)
VALUES ('super_admin', 'Global system administrator with full access', NULL, true)
ON CONFLICT ON CONSTRAINT unique_role_per_tenant DO UPDATE SET
  description = EXCLUDED.description,
  is_system_role = true;

-- Create tenant_admin roles for ALL tenants
INSERT INTO roles (name, description, tenant_id, is_system_role)
SELECT 'tenant_admin', 'Tenant administrator with full CRM access', t.id, false
FROM tenants t
ON CONFLICT ON CONSTRAINT unique_role_per_tenant DO NOTHING;

-- Create manager role for ALL tenants
INSERT INTO roles (name, description, tenant_id, is_system_role)
SELECT 'manager', 'Manager with CRUD and reporting access', t.id, false
FROM tenants t
ON CONFLICT ON CONSTRAINT unique_role_per_tenant DO NOTHING;

-- Create user role for ALL tenants
INSERT INTO roles (name, description, tenant_id, is_system_role)
SELECT 'user', 'Standard user with basic access', t.id, false
FROM tenants t
ON CONFLICT ON CONSTRAINT unique_role_per_tenant DO NOTHING;

-- ============================================================================
-- STEP 2: ASSIGN ALL PERMISSIONS TO SUPER_ADMIN
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND r.is_system_role = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: ASSIGN PERMISSIONS TO TENANT_ADMIN
-- ============================================================================
-- Tenant admins get all CRM module permissions but NOT platform/super_admin permissions

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'tenant_admin'
  AND p.name NOT LIKE 'crm:platform:%'
  AND p.name NOT IN ('super_admin', 'crm:system:platform:admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 4: ASSIGN PERMISSIONS TO MANAGER ROLE
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    -- Auth
    'crm:auth:session:login', 'crm:auth:session:logout', 
    'crm:auth:profile:read', 'crm:auth:profile:update',
    -- Customer CRUD
    'crm:customer:record:read', 'crm:customer:record:create', 
    'crm:customer:record:update', 'crm:customer:record:delete',
    'crm:customer:contact:add', 'crm:customer:contact:remove',
    'crm:customer:document:upload', 'crm:customer:document:download',
    -- Company CRUD
    'crm:company:record:read', 'crm:company:record:create', 
    'crm:company:record:update', 'crm:company:record:delete',
    -- Sales/Deals
    'crm:sales:deal:read', 'crm:sales:deal:create', 
    'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:pipeline:manage',
    -- Leads
    'crm:lead:record:read', 'crm:lead:record:create', 
    'crm:lead:record:update', 'crm:lead:record:delete',
    -- Products
    'crm:product:record:read', 'crm:product:record:create', 
    'crm:product:record:update', 'crm:product:record:delete',
    -- Product Sales
    'crm:product-sale:record:read', 'crm:product-sale:record:create', 
    'crm:product-sale:record:update', 'crm:product-sale:record:delete',
    -- Projects
    'crm:project:record:read', 'crm:project:record:create', 
    'crm:project:record:update', 'crm:project:record:delete',
    'crm:project:task:assign',
    -- Tickets
    'crm:support:ticket:read', 'crm:support:ticket:create', 
    'crm:support:ticket:update', 'crm:support:ticket:assign',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    -- Complaints
    'crm:support:complaint:read', 'crm:support:complaint:create', 
    'crm:support:complaint:update', 'crm:support:complaint:investigate',
    'crm:support:complaint:resolve',
    -- Contracts
    'crm:contract:record:read', 'crm:contract:record:create', 
    'crm:contract:record:update',
    'crm:contract:service:read', 'crm:contract:service:create', 
    'crm:contract:service:update',
    -- Dashboard & Reports
    'crm:dashboard:panel:view', 'crm:report:record:view', 
    'crm:analytics:insight:view',
    -- Reference data
    'crm:reference:data:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 5: ASSIGN PERMISSIONS TO USER ROLE (basic user)
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND p.name IN (
    -- Auth
    'crm:auth:session:login', 'crm:auth:session:logout', 
    'crm:auth:profile:read', 'crm:auth:profile:update',
    -- Customer (read only, create own)
    'crm:customer:record:read', 'crm:customer:record:create',
    -- Company (read only)
    'crm:company:record:read',
    -- Sales/Deals (read, create own)
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update',
    'crm:sales:pipeline:view',
    -- Leads
    'crm:lead:record:read', 'crm:lead:record:create', 'crm:lead:record:update',
    -- Products (read only)
    'crm:product:record:read',
    -- Product Sales
    'crm:product-sale:record:read', 'crm:product-sale:record:create',
    -- Projects
    'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update',
    -- Tickets (create and view own)
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
    -- Complaints (create and view own)
    'crm:support:complaint:read', 'crm:support:complaint:create',
    -- Dashboard
    'crm:dashboard:panel:view',
    -- Reference data
    'crm:reference:data:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  perm_count integer;
  super_admin_perms integer;
  tenant_admin_perms integer;
  manager_perms integer;
  user_perms integer;
BEGIN
  SELECT COUNT(*) INTO perm_count FROM permissions;
  RAISE NOTICE '✅ Total permissions in database: %', perm_count;
  
  SELECT COUNT(*) INTO super_admin_perms 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'super_admin' AND r.is_system_role = true;
  RAISE NOTICE '✅ super_admin has % permissions', super_admin_perms;
  
  SELECT COUNT(*) INTO tenant_admin_perms 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'tenant_admin';
  RAISE NOTICE '✅ tenant_admin has % permissions', tenant_admin_perms;
  
  SELECT COUNT(*) INTO manager_perms 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'manager';
  RAISE NOTICE '✅ manager has % permissions', manager_perms;
  
  SELECT COUNT(*) INTO user_perms 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'user';
  RAISE NOTICE '✅ user has % permissions', user_perms;
END $$;

-- ============================================================================
-- STEP 6: CREATE TRIGGER FOR AUTO-ASSIGNING PERMISSIONS TO NEW ROLES
-- ============================================================================
-- This trigger ensures that when new tenant_admin, manager, or user roles are created
-- (e.g., when a new tenant is added), they automatically get the correct permissions.

CREATE OR REPLACE FUNCTION assign_permissions_to_new_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign permissions based on role name
  IF NEW.name = 'tenant_admin' THEN
    -- Tenant admin gets all CRM permissions except platform/super_admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT NEW.id, p.id
    FROM permissions p
    WHERE p.name NOT LIKE 'crm:platform:%'
      AND p.name NOT IN ('super_admin', 'crm:system:platform:admin')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
  ELSIF NEW.name = 'manager' THEN
    -- Manager gets CRUD + reporting permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT NEW.id, p.id
    FROM permissions p
    WHERE p.name IN (
      'crm:auth:session:login', 'crm:auth:session:logout', 
      'crm:auth:profile:read', 'crm:auth:profile:update',
      'crm:customer:record:read', 'crm:customer:record:create', 
      'crm:customer:record:update', 'crm:customer:record:delete',
      'crm:customer:contact:add', 'crm:customer:contact:remove',
      'crm:customer:document:upload', 'crm:customer:document:download',
      'crm:company:record:read', 'crm:company:record:create', 
      'crm:company:record:update', 'crm:company:record:delete',
      'crm:sales:deal:read', 'crm:sales:deal:create', 
      'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
      'crm:sales:pipeline:view', 'crm:sales:pipeline:manage',
      'crm:lead:record:read', 'crm:lead:record:create', 
      'crm:lead:record:update', 'crm:lead:record:delete',
      'crm:product:record:read', 'crm:product:record:create', 
      'crm:product:record:update', 'crm:product:record:delete',
      'crm:product-sale:record:read', 'crm:product-sale:record:create', 
      'crm:product-sale:record:update', 'crm:product-sale:record:delete',
      'crm:project:record:read', 'crm:project:record:create', 
      'crm:project:record:update', 'crm:project:record:delete',
      'crm:support:ticket:read', 'crm:support:ticket:create', 
      'crm:support:ticket:update', 'crm:support:ticket:assign',
      'crm:support:ticket:resolve', 'crm:support:ticket:close',
      'crm:support:complaint:read', 'crm:support:complaint:create', 
      'crm:support:complaint:update', 'crm:support:complaint:investigate',
      'crm:support:complaint:resolve',
      'crm:contract:record:read', 'crm:contract:record:create', 
      'crm:contract:record:update',
      'crm:contract:service:read', 'crm:contract:service:create', 
      'crm:contract:service:update',
      'crm:report:sales:view', 'crm:report:customer:view',
      'crm:dashboard:panel:view',
      'crm:reference:data:read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
  ELSIF NEW.name = 'user' THEN
    -- User gets basic read/create permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT NEW.id, p.id
    FROM permissions p
    WHERE p.name IN (
      'crm:auth:session:login', 'crm:auth:session:logout', 
      'crm:auth:profile:read', 'crm:auth:profile:update',
      'crm:customer:record:read', 'crm:customer:record:create',
      'crm:company:record:read',
      'crm:sales:deal:read', 'crm:sales:deal:create',
      'crm:lead:record:read', 'crm:lead:record:create',
      'crm:product:record:read',
      'crm:product-sale:record:read', 'crm:product-sale:record:create',
      'crm:project:record:read',
      'crm:support:ticket:read', 'crm:support:ticket:create',
      'crm:support:complaint:read', 'crm:support:complaint:create',
      'crm:contract:record:read',
      'crm:contract:service:read',
      'crm:dashboard:panel:view',
      'crm:reference:data:read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on roles table
DROP TRIGGER IF EXISTS auto_assign_role_permissions ON roles;
CREATE TRIGGER auto_assign_role_permissions
  AFTER INSERT ON roles
  FOR EACH ROW
  EXECUTE FUNCTION assign_permissions_to_new_role();

-- Show product-sale permissions assigned to tenant_admin (for debugging)
SELECT 'tenant_admin product-sale permissions:' as info;
SELECT p.name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'tenant_admin'
  AND p.name LIKE 'crm:product-sale:%'
ORDER BY p.name;
