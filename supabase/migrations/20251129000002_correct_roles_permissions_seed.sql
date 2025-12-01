-- ============================================================================
-- CORRECT ROLES AND PERMISSIONS SEED DATA
-- Aligns with Functional Requirement Specification (FRS)
--
-- Date: November 29, 2025
-- Version: 1.0
-- Status: FRS-compliant role and permission structure
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP EXISTING ROLES AND PERMISSIONS
-- ============================================================================

-- Remove existing role_permissions assignments
DELETE FROM role_permissions;

-- Remove existing roles (except super_admin which is system role)
DELETE FROM roles WHERE name != 'super_admin';

-- Remove existing permissions
DELETE FROM permissions;

-- ============================================================================
-- STEP 2: SEED FRS-COMPLIANT PERMISSIONS
-- ============================================================================

-- Core System Permissions
INSERT INTO permissions (name, description, resource, action, category, is_system_permission) VALUES
-- Authentication & User Management
('crm:auth:login', 'User login access', 'auth', 'login', 'system', true),
('crm:auth:logout', 'User logout access', 'auth', 'logout', 'system', true),
('crm:auth:profile:read', 'View user profile', 'auth', 'profile:read', 'system', true),
('crm:auth:profile:update', 'Update user profile', 'auth', 'profile:update', 'system', true),

-- User Management (Administrative)
('crm:user:record:read', 'View user records', 'user', 'record:read', 'administrative', true),
('crm:user:record:create', 'Create user records', 'user', 'record:create', 'administrative', true),
('crm:user:record:update', 'Update user records', 'user', 'record:update', 'administrative', true),
('crm:user:record:delete', 'Delete user records', 'user', 'record:delete', 'administrative', true),
('crm:user:role:assign', 'Assign user roles', 'user', 'role:assign', 'administrative', true),
('crm:user:role:revoke', 'Revoke user roles', 'user', 'role:revoke', 'administrative', true),

-- Role Management (Administrative)
('crm:role:record:read', 'View role records', 'role', 'record:read', 'administrative', true),
('crm:role:record:create', 'Create role records', 'role', 'record:create', 'administrative', true),
('crm:role:record:update', 'Update role records', 'role', 'record:update', 'administrative', true),
('crm:role:record:delete', 'Delete role records', 'role', 'record:delete', 'administrative', true),
('crm:role:permission:assign', 'Assign role permissions', 'role', 'permission:assign', 'administrative', true),

-- Customer Management (Core Business)
('crm:customer:record:read', 'View customer records', 'customer', 'record:read', 'module', true),
('crm:customer:record:create', 'Create customer records', 'customer', 'record:create', 'module', true),
('crm:customer:record:update', 'Update customer records', 'customer', 'record:update', 'module', true),
('crm:customer:record:delete', 'Delete customer records', 'customer', 'record:delete', 'module', true),
('crm:customer:contact:add', 'Add customer contacts', 'customer', 'contact:add', 'module', true),
('crm:customer:contact:remove', 'Remove customer contacts', 'customer', 'contact:remove', 'module', true),
('crm:customer:document:upload', 'Upload customer documents', 'customer', 'document:upload', 'module', true),
('crm:customer:document:download', 'Download customer documents', 'customer', 'document:download', 'module', true),

-- Sales & Deal Management (Core Business)
('crm:sales:deal:read', 'View sales deals', 'sales', 'deal:read', 'module', true),
('crm:sales:deal:create', 'Create sales deals', 'sales', 'deal:create', 'module', true),
('crm:sales:deal:update', 'Update sales deals', 'sales', 'deal:update', 'module', true),
('crm:sales:deal:delete', 'Delete sales deals', 'sales', 'deal:delete', 'module', true),
('crm:sales:deal:close', 'Close sales deals', 'sales', 'deal:close', 'module', true),
('crm:sales:pipeline:view', 'View sales pipeline', 'sales', 'pipeline:view', 'module', true),
('crm:sales:pipeline:manage', 'Manage sales pipeline', 'sales', 'pipeline:manage', 'module', true),
('crm:sales:forecast:view', 'View sales forecasts', 'sales', 'forecast:view', 'module', true),
('crm:sales:forecast:create', 'Create sales forecasts', 'sales', 'forecast:create', 'module', true),
('crm:sales:activity:log', 'Log sales activities', 'sales', 'activity:log', 'module', true),

-- Product Management (Core Business)
('crm:product:record:read', 'View product records', 'product', 'record:read', 'module', true),
('crm:product:record:create', 'Create product records', 'product', 'record:create', 'module', true),
('crm:product:record:update', 'Update product records', 'product', 'record:update', 'module', true),
('crm:product:record:delete', 'Delete product records', 'product', 'record:delete', 'module', true),
('crm:product:inventory:manage', 'Manage product inventory', 'product', 'inventory:manage', 'module', true),
('crm:product:pricing:manage', 'Manage product pricing', 'product', 'pricing:manage', 'module', true),

-- Service Contract Management (Core Business)
('crm:contract:service:read', 'View service contracts', 'contract', 'service:read', 'module', true),
('crm:contract:service:create', 'Create service contracts', 'contract', 'service:create', 'module', true),
('crm:contract:service:update', 'Update service contracts', 'contract', 'service:update', 'module', true),
('crm:contract:service:delete', 'Delete service contracts', 'contract', 'service:delete', 'module', true),
('crm:contract:service:approve', 'Approve service contracts', 'contract', 'service:approve', 'module', true),
('crm:contract:service:renew', 'Renew service contracts', 'contract', 'service:renew', 'module', true),

-- Job Work/Project Management (Core Business)
('crm:project:record:read', 'View project records', 'project', 'record:read', 'module', true),
('crm:project:record:create', 'Create project records', 'project', 'record:create', 'module', true),
('crm:project:record:update', 'Update project records', 'project', 'record:update', 'module', true),
('crm:project:record:delete', 'Delete project records', 'project', 'record:delete', 'module', true),
('crm:project:task:assign', 'Assign project tasks', 'project', 'task:assign', 'module', true),
('crm:project:resource:allocate', 'Allocate project resources', 'project', 'resource:allocate', 'module', true),
('crm:project:milestone:manage', 'Manage project milestones', 'project', 'milestone:manage', 'module', true),

-- Support & Ticket Management (Core Business)
('crm:support:ticket:read', 'View support tickets', 'support', 'ticket:read', 'module', true),
('crm:support:ticket:create', 'Create support tickets', 'support', 'ticket:create', 'module', true),
('crm:support:ticket:update', 'Update support tickets', 'support', 'ticket:update', 'module', true),
('crm:support:ticket:assign', 'Assign support tickets', 'support', 'ticket:assign', 'module', true),
('crm:support:ticket:resolve', 'Resolve support tickets', 'support', 'ticket:resolve', 'module', true),
('crm:support:ticket:close', 'Close support tickets', 'support', 'ticket:close', 'module', true),

-- Complaints Management (Core Business)
('crm:support:complaint:read', 'View complaints', 'support', 'complaint:read', 'module', true),
('crm:support:complaint:create', 'Create complaints', 'support', 'complaint:create', 'module', true),
('crm:support:complaint:update', 'Update complaints', 'support', 'complaint:update', 'module', true),
('crm:support:complaint:investigate', 'Investigate complaints', 'support', 'complaint:investigate', 'module', true),
('crm:support:complaint:resolve', 'Resolve complaints', 'support', 'complaint:resolve', 'module', true),

-- Contract Management (Core Business)
('crm:contract:record:read', 'View contract records', 'contract', 'record:read', 'module', true),
('crm:contract:record:create', 'Create contract records', 'contract', 'record:create', 'module', true),
('crm:contract:record:update', 'Update contract records', 'contract', 'record:update', 'module', true),
('crm:contract:record:delete', 'Delete contract records', 'contract', 'record:delete', 'module', true),
('crm:contract:record:approve', 'Approve contracts', 'contract', 'record:approve', 'module', true),

-- Reporting & Analytics (Core Business)
('crm:report:record:view', 'View reports', 'report', 'view', 'module', true),
('crm:report:record:create', 'Create reports', 'report', 'create', 'module', true),
('crm:report:record:export', 'Export reports', 'report', 'export', 'module', true),
('crm:analytics:insight:view', 'View analytics', 'analytics', 'view', 'module', true),
('crm:analytics:insight:create', 'Create analytics', 'analytics', 'create', 'module', true),
('crm:dashboard:panel:view', 'View dashboards', 'dashboard', 'view', 'module', true),
('crm:dashboard:panel:create', 'Create dashboards', 'dashboard', 'create', 'module', true),

-- Audit & Compliance (System)
('crm:audit:log:read', 'View audit logs', 'audit', 'log:read', 'system', true),
('crm:audit:log:export', 'Export audit logs', 'audit', 'log:export', 'system', true),
('crm:audit:report:generate', 'Generate audit reports', 'audit', 'report:generate', 'system', true),

-- System Administration (System)
('crm:system:platform:admin', 'System administration', 'system', 'admin', 'system', true),
('crm:system:config:manage', 'Manage system configuration', 'system', 'config:manage', 'system', true),
('crm:system:backup:create', 'Create system backups', 'system', 'backup:create', 'system', true),
('crm:system:backup:restore', 'Restore system backups', 'system', 'backup:restore', 'system', true),

-- Platform Administration (System)
('crm:platform:control:admin', 'Platform administration', 'platform', 'admin', 'system', true),
('crm:platform:tenant:create', 'Create tenants', 'platform', 'tenant:create', 'system', true),
('crm:platform:tenant:update', 'Update tenants', 'platform', 'tenant:update', 'system', true),
('crm:platform:tenant:delete', 'Delete tenants', 'platform', 'tenant:delete', 'system', true),
('crm:platform:tenant:suspend', 'Suspend tenants', 'platform', 'tenant:suspend', 'system', true),

-- Notification Management (System)
('crm:notification:channel:manage', 'Manage notifications', 'notification', 'manage', 'system', true),
('crm:notification:template:create', 'Create notification templates', 'notification', 'template:create', 'system', true),
('crm:notification:campaign:create', 'Create notification campaigns', 'notification', 'campaign:create', 'system', true),

-- Reference Data Management (Administrative)
('crm:reference:data:read', 'View reference data', 'reference', 'data:read', 'administrative', true),
('crm:reference:data:manage', 'Manage reference data', 'reference', 'data:manage', 'administrative', true),
('crm:reference:data:import', 'Import reference data', 'reference', 'data:import', 'administrative', true),
('crm:reference:data:export', 'Export reference data', 'reference', 'data:export', 'administrative', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 3: SEED FRS-COMPLIANT ROLES
-- ============================================================================

-- Insert FRS-compliant roles per tenant
INSERT INTO roles (name, description, tenant_id, is_system_role) VALUES
-- Acme Corporation roles (FRS-compliant)
('super_admin', 'Global system administrator', NULL, true),
('tenant_admin', 'Tenant administrator with full access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('sales_manager', 'Sales team manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('sales_representative', 'Sales representative', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('support_manager', 'Support team manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('support_agent', 'Support agent', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('contract_manager', 'Contract manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('project_manager', 'Project manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('business_analyst', 'Business analyst', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),

-- Tech Solutions Inc roles (FRS-compliant)
('tenant_admin', 'Tenant administrator with full access', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('sales_manager', 'Sales team manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('sales_representative', 'Sales representative', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('support_manager', 'Support team manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('support_agent', 'Support agent', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('contract_manager', 'Contract manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('project_manager', 'Project manager', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('business_analyst', 'Business analyst', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', false),

-- Global Trading Ltd roles (FRS-compliant)
('tenant_admin', 'Tenant administrator with full access', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('sales_manager', 'Sales team manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('sales_representative', 'Sales representative', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('support_manager', 'Support team manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('support_agent', 'Support agent', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('contract_manager', 'Contract manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('project_manager', 'Project manager', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('business_analyst', 'Business analyst', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', false)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: ASSIGN PERMISSIONS TO ROLES (FRS-COMPLIANT)
-- ============================================================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = true;

-- Tenant Admin permissions (comprehensive access within tenant)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    -- All authentication permissions
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    -- All user management permissions
    'crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete',
    'crm:user:role:assign', 'crm:user:role:revoke',
    -- All role management permissions
    'crm:role:record:read', 'crm:role:record:create', 'crm:role:record:update', 'crm:role:record:delete',
    'crm:role:permission:assign',
    -- All customer management permissions
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update', 'crm:customer:record:delete',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    -- All sales permissions
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:pipeline:manage', 'crm:sales:forecast:view', 'crm:sales:forecast:create',
    'crm:sales:activity:log',
    -- All product permissions
    'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update', 'crm:product:record:delete',
    'crm:product:inventory:manage', 'crm:product:pricing:manage',
    -- All contract permissions
    'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
    'crm:contract:service:approve', 'crm:contract:service:renew',
    'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
    'crm:contract:record:approve',
    -- All project permissions
    'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
    'crm:project:task:assign', 'crm:project:resource:allocate', 'crm:project:milestone:manage',
    -- All support permissions
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:assign',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    -- All reporting permissions
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    -- Audit permissions
    'crm:audit:log:read', 'crm:audit:log:export', 'crm:audit:report:generate',
    -- System administration
    'crm:system:platform:admin', 'crm:system:config:manage', 'crm:system:backup:create', 'crm:system:backup:restore',
    -- Notification management
    'crm:notification:channel:manage', 'crm:notification:template:create', 'crm:notification:campaign:create',
    -- Reference data management
    'crm:reference:data:read', 'crm:reference:data:manage', 'crm:reference:data:import', 'crm:reference:data:export'
)
WHERE r.name = 'tenant_admin';

-- Sales Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:pipeline:manage', 'crm:sales:forecast:view', 'crm:sales:forecast:create',
    'crm:sales:activity:log',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read' -- Can view team members
)
WHERE r.name = 'sales_manager';

-- Sales Representative permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
    'crm:customer:contact:add', 'crm:customer:contact:remove', 'crm:customer:document:upload', 'crm:customer:document:download',
    'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete', 'crm:sales:deal:close',
    'crm:sales:pipeline:view', 'crm:sales:activity:log',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:export',
    'crm:analytics:insight:view',
    'crm:dashboard:panel:view'
)
WHERE r.name = 'sales_representative';

-- Support Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:assign',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read', -- Can view team members
    'crm:audit:log:read' -- Can view audit logs for compliance
)
WHERE r.name = 'support_manager';

-- Support Agent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
    'crm:support:ticket:resolve', 'crm:support:ticket:close',
    'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
    'crm:support:complaint:investigate', 'crm:support:complaint:resolve',
    'crm:report:record:view', 'crm:report:record:export',
    'crm:analytics:insight:view',
    'crm:dashboard:panel:view'
)
WHERE r.name = 'support_agent';

-- Contract Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
    'crm:contract:service:approve', 'crm:contract:service:renew',
    'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
    'crm:contract:record:approve',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:audit:log:read'
)
WHERE r.name = 'contract_manager';

-- Project Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
    'crm:project:task:assign', 'crm:project:resource:allocate', 'crm:project:milestone:manage',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:user:record:read' -- Can view team members
)
WHERE r.name = 'project_manager';

-- Business Analyst permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'crm:auth:login', 'crm:auth:logout', 'crm:auth:profile:read', 'crm:auth:profile:update',
    'crm:customer:record:read',
    'crm:sales:deal:read', 'crm:sales:pipeline:view', 'crm:sales:forecast:view',
    'crm:contract:service:read', 'crm:contract:record:read',
    'crm:project:record:read',
    'crm:support:ticket:read', 'crm:support:complaint:read',
    'crm:product:record:read',
    'crm:report:record:view', 'crm:report:record:create', 'crm:report:record:export',
    'crm:analytics:insight:view', 'crm:analytics:insight:create',
    'crm:dashboard:panel:view', 'crm:dashboard:panel:create',
    'crm:reference:data:read'
)
WHERE r.name = 'business_analyst';

-- ============================================================================
-- STEP 5: VALIDATION AND MONITORING
-- ============================================================================

-- Create function to validate FRS-compliant role and permission setup
CREATE OR REPLACE FUNCTION validate_frs_roles_permissions_setup()
RETURNS JSON AS $$
DECLARE
  result JSON;
  permissions_count INTEGER;
  roles_count INTEGER;
  role_permissions_count INTEGER;
  issues JSON := '[]'::json;
BEGIN
  SELECT COUNT(*) INTO permissions_count FROM permissions;
  SELECT COUNT(*) INTO roles_count FROM roles;
  SELECT COUNT(*) INTO role_permissions_count FROM role_permissions;

  -- Check for required FRS roles
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin' AND is_system_role = true) THEN
    issues := issues || json_build_array('Missing super_admin system role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'tenant_admin' AND tenant_id IS NOT NULL) THEN
    issues := issues || json_build_array('Missing tenant_admin roles');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name IN ('sales_manager', 'sales_representative', 'support_manager', 'support_agent', 'contract_manager', 'project_manager', 'business_analyst')) THEN
    issues := issues || json_build_array('Missing FRS-compliant business roles');
  END IF;

  -- Check for required FRS permissions
  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:auth:%') THEN
    issues := issues || json_build_array('Missing authentication permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:user:%') THEN
    issues := issues || json_build_array('Missing user management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:customer:%') THEN
    issues := issues || json_build_array('Missing customer management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:sales:%') THEN
    issues := issues || json_build_array('Missing sales management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:support:%') THEN
    issues := issues || json_build_array('Missing support management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:contract:%') THEN
    issues := issues || json_build_array('Missing contract management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:project:%') THEN
    issues := issues || json_build_array('Missing project management permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:report:%') THEN
    issues := issues || json_build_array('Missing reporting permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name LIKE 'crm:system:%') THEN
    issues := issues || json_build_array('Missing system administration permissions');
  END IF;

  -- Build result
  result := json_build_object(
    'status', CASE WHEN json_array_length(issues) = 0 THEN 'frs_compliant' ELSE 'issues_found' END,
    'summary', json_build_object(
      'permissions', permissions_count,
      'roles', roles_count,
      'role_permissions', role_permissions_count
    ),
    'issues', issues,
    'compliance_check', CASE
      WHEN json_array_length(issues) = 0 THEN 'FRS-compliant role and permission structure successfully implemented'
      ELSE 'FRS compliance issues found - review and correct'
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'FRS-compliant roles and permissions migration completed successfully';
  RAISE NOTICE 'Run: SELECT validate_frs_roles_permissions_setup(); to verify FRS compliance';
END $$;