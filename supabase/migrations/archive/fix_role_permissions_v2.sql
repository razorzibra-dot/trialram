-- Fix Role Permissions Population Script (Updated)
-- Based on migration 20251122000002 logic, but using NULL granted_by

BEGIN;

-- Clear existing role_permissions to start fresh
DELETE FROM role_permissions;

-- Administrator role permissions (use first Administrator role)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000001'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name IN (
  'read', 'write', 'delete',
  'users:manage', 'roles:manage', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'dashboard:manage', 'settings:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access'
);

-- Manager role permissions 
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000002'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name IN (
  'read', 'write',
  'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'dashboard:manage', 'settings:manage', 'companies:manage',
  'reports:manage', 'integrations:manage',
  'system_monitoring'
);

-- User role permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000003'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name IN (
  'read', 'write',
  'customers:manage',
  'product_sales:manage', 'job_works:manage',
  'tickets:manage'
);

-- Engineer role permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000004'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name IN (
  'read', 'write',
  'products:manage',
  'product_sales:manage',
  'job_works:manage',
  'tickets:manage',
  'create_products', 'update_products',
  'system_monitoring', 'view_audit_logs'
);

-- Customer role permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000005'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name = 'read';

-- Super admin role permissions (create if doesn't exist)
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  '10000000-0000-0000-0000-000000000006'::UUID as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM permissions p
WHERE p.name IN (
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
);

-- Verify the results
DO $$
DECLARE
    admin_count INTEGER;
    manager_count INTEGER;
    user_count INTEGER;
    engineer_count INTEGER;
    customer_count INTEGER;
    super_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO manager_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000002';
    SELECT COUNT(*) INTO user_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000003';
    SELECT COUNT(*) INTO engineer_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000004';
    SELECT COUNT(*) INTO customer_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000005';
    SELECT COUNT(*) INTO super_admin_count FROM role_permissions WHERE role_id = '10000000-0000-0000-0000-000000000006';
    
    RAISE NOTICE '=== ROLE PERMISSIONS POPULATED ===';
    RAISE NOTICE 'Administrator: % permissions', admin_count;
    RAISE NOTICE 'Manager: % permissions', manager_count;
    RAISE NOTICE 'User: % permissions', user_count;
    RAISE NOTICE 'Engineer: % permissions', engineer_count;
    RAISE NOTICE 'Customer: % permissions', customer_count;
    RAISE NOTICE 'Super Admin: % permissions', super_admin_count;
    
    IF admin_count > 0 AND manager_count > 0 AND user_count > 0 AND engineer_count > 0 AND customer_count > 0 AND super_admin_count > 0 THEN
        RAISE NOTICE '✅ ALL ROLE PERMISSIONS SUCCESSFULLY POPULATED';
    ELSE
        RAISE EXCEPTION '❌ SOME ROLES MISSING PERMISSIONS';
    END IF;
END $$;

COMMIT;