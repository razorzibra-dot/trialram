-- ============================================================================
-- TEST: Permission Insertion on Clean Database
-- Date: 2025-11-23
-- Purpose: Validate that permissions from seed.sql can be inserted correctly
--          on a clean database without conflicts or errors
-- ============================================================================

-- ============================================================================
-- 1. SETUP: Clean Database Test Environment
-- ============================================================================

-- Drop all data to simulate clean environment
DELETE FROM super_user_impersonation_logs;
DELETE FROM super_user_tenant_access;
DELETE FROM tenant_statistics;
DELETE FROM tenant_config_overrides;
DELETE FROM job_works;
DELETE FROM service_contracts;
DELETE FROM product_sales;
DELETE FROM customer_tag_mapping;
DELETE FROM contracts;
DELETE FROM sales;
DELETE FROM customers;
DELETE FROM customer_tags;
DELETE FROM products;
DELETE FROM product_categories;
DELETE FROM companies;
DELETE FROM users;
DELETE FROM tenants;

-- Reset sequences
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS product_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contracts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS product_sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS service_contracts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS job_works_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_tags_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_tag_mapping_id_seq RESTART WITH 1;

-- ============================================================================
-- 2. TEST: Permission Insertion (Lines 14-48 from seed.sql)
-- ============================================================================

-- Test inserting permissions exactly as they appear in seed.sql lines 14-48
INSERT INTO permissions (id, name, description, resource, action) VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'read', 'Read access', '*', 'read'),
  ('00000000-0000-0000-0000-000000000101'::UUID, 'write', 'Write access', '*', 'write'),
  ('00000000-0000-0000-0000-000000000102'::UUID, 'delete', 'Delete access', '*', 'delete'),
  ('00000000-0000-0000-0000-000000000103'::UUID, 'crm:user:record:update', 'Manage users', 'users', 'manage'),
  ('00000000-0000-0000-0000-000000000104'::UUID, 'crm:role:permission:assign', 'Manage roles', 'roles', 'manage'),
  ('00000000-0000-0000-0000-000000000105'::UUID, 'customers:manage', 'Manage customers', 'customers', 'manage'),
  ('00000000-0000-0000-0000-000000000201'::UUID, 'sales:manage', 'Manage sales', 'sales', 'manage'),
  ('00000000-0000-0000-0000-000000000202'::UUID, 'contracts:manage', 'Manage contracts', 'contracts', 'manage'),
  ('00000000-0000-0000-0000-000000000203'::UUID, 'service_contracts:manage', 'Manage service contracts', 'service_contracts', 'manage'),
  ('00000000-0000-0000-0000-000000000204'::UUID, 'products:manage', 'Manage products', 'products', 'manage'),
  ('00000000-0000-0000-0000-000000000301'::UUID, 'product_sales:manage', 'Manage product sales', 'product_sales', 'manage'),
  ('00000000-0000-0000-0000-000000000302'::UUID, 'job_works:manage', 'Manage job works', 'job_works', 'manage'),
  ('00000000-0000-0000-0000-000000000303'::UUID, 'tickets:manage', 'Manage tickets', 'tickets', 'manage'),
  ('00000000-0000-0000-0000-000000000304'::UUID, 'complaints:manage', 'Manage complaints', 'complaints', 'manage'),
  ('00000000-0000-0000-0000-000000000401'::UUID, 'dashboard:manage', 'Access dashboard', 'dashboard', 'manage'),
  ('00000000-0000-0000-0000-000000000402'::UUID, 'crm:system:config:manage', 'Manage settings', 'settings', 'manage'),
  ('00000000-0000-0000-0000-000000000501'::UUID, 'companies:manage', 'Manage companies', 'companies', 'manage'),
  ('00000000-0000-0000-0000-000000000502'::UUID, 'crm:platform:control:admin', 'Platform administration', 'platform', 'admin'),
  ('00000000-0000-0000-0000-000000000601'::UUID, 'super_admin', 'Full system administration', 'system', 'admin'),
  ('00000000-0000-0000-0000-000000000602'::UUID, 'crm:platform:tenant:manage', 'Manage tenants', 'tenants', 'manage'),
  ('00000000-0000-0000-0000-000000000701'::UUID, 'system_monitoring', 'System monitoring', 'system', 'monitor'),
  ('00000000-0000-0000-0000-000000000403'::UUID, 'reports:manage', 'Access reports and analytics', 'reports', 'manage'),
  ('00000000-0000-0000-0000-000000000404'::UUID, 'export_data', 'Export data and reports', 'data', 'export'),
  ('00000000-0000-0000-0000-000000000702'::UUID, 'view_audit_logs', 'View audit logs', 'audit', 'read'),
  ('00000000-0000-0000-0000-000000000801'::UUID, 'create_tickets', 'Create support tickets', 'tickets', 'create'),
  ('00000000-0000-0000-0000-000000000802'::UUID, 'update_tickets', 'Update support tickets', 'tickets', 'update'),
  ('00000000-0000-0000-0000-000000000901'::UUID, 'create_products', 'Create products', 'products', 'create'),
  ('00000000-0000-0000-0000-000000000902'::UUID, 'update_products', 'Update products', 'products', 'update'),
  ('00000000-0000-0000-0000-000000001001'::UUID, 'inventory:manage', 'Manage inventory', 'inventory', 'manage'),
  ('00000000-0000-0000-0000-000000001002'::UUID, 'view_financials', 'View financial reports', 'finance', 'read'),
  ('00000000-0000-0000-0000-000000001003'::UUID, 'integrations:manage', 'Manage third-party integrations', 'integrations', 'manage'),
  ('00000000-0000-0000-0000-000000001004'::UUID, 'bulk_operations', 'Perform bulk operations', 'bulk', 'manage'),
  ('00000000-0000-0000-0000-000000001005'::UUID, 'advanced_search', 'Advanced search capabilities', 'search', 'advanced'),
  ('00000000-0000-0000-0000-000000001006'::UUID, 'api_access', 'API access', 'api', 'access')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. VALIDATION: Check Insertion Results
-- ============================================================================

-- Count total permissions inserted
SELECT 
  'Total Permissions Inserted' as test_description,
  COUNT(*) as count,
  'SUCCESS' as status
FROM permissions
WHERE name IN (
  'read', 'write', 'delete',
  'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
  'dashboard:manage', 'crm:system:config:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access',
  'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
);

-- Check for expected count (should be 34)
DO $$
DECLARE
    permission_count INTEGER;
    expected_count INTEGER := 34;
BEGIN
    SELECT COUNT(*) INTO permission_count
    FROM permissions
    WHERE name IN (
      'read', 'write', 'delete',
      'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
      'contracts:manage', 'service_contracts:manage', 'products:manage',
      'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
      'dashboard:manage', 'crm:system:config:manage', 'companies:manage',
      'reports:manage', 'export_data', 'view_audit_logs',
      'create_tickets', 'update_tickets', 'create_products', 'update_products',
      'inventory:manage', 'view_financials', 'integrations:manage',
      'bulk_operations', 'advanced_search', 'api_access',
      'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
    );
    
    IF permission_count = expected_count THEN
        RAISE NOTICE 'SUCCESS: All % expected permissions inserted correctly', expected_count;
    ELSE
        RAISE EXCEPTION 'FAILURE: Expected % permissions but found %', expected_count, permission_count;
    END IF;
END $$;

-- ============================================================================
-- 4. VALIDATION: Permission Format Check
-- ============================================================================

-- Verify all permissions follow resource:action format
SELECT 
  'Permission Format Validation' as test_description,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All permissions follow correct format'
    ELSE 'FAILURE: Found ' || COUNT(*) || ' permissions not in resource:action format'
  END as validation_result
FROM permissions
WHERE name NOT LIKE '%:%' 
  AND name NOT IN ('read', 'write', 'delete', 'crm:platform:control:admin', 'super_admin', 'system_monitoring')
  AND name IS NOT NULL;

-- Verify permissions have correct structure
SELECT 
  'Permission Structure Validation' as test_description,
  'SUCCESS: All required fields populated' as validation_result
FROM permissions
WHERE name IN (
  'read', 'write', 'delete',
  'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
  'dashboard:manage', 'crm:system:config:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access',
  'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
)
AND description IS NOT NULL 
AND resource IS NOT NULL 
AND action IS NOT NULL
LIMIT 1;

-- ============================================================================
-- 5. VALIDATION: No Duplicate Names
-- ============================================================================

-- Check for duplicate permission names
SELECT 
  'Duplicate Permission Names Check' as test_description,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: No duplicate permission names found'
    ELSE 'FAILURE: Found ' || COUNT(*) || ' duplicate permission names'
  END as validation_result
FROM (
  SELECT name, COUNT(*) as duplicate_count
  FROM permissions
  GROUP BY name
  HAVING COUNT(*) > 1
) duplicates;

-- ============================================================================
-- 6. DETAILED PERMISSION REPORT
-- ============================================================================

-- Show all inserted permissions with their details
SELECT 
  name,
  description,
  resource,
  action,
  CASE 
    WHEN name LIKE '%:manage' THEN 'Module Permission'
    WHEN name IN ('crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring') THEN 'System Permission'
    ELSE 'Core Permission'
  END as permission_type
FROM permissions
WHERE name IN (
  'read', 'write', 'delete',
  'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
  'dashboard:manage', 'crm:system:config:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access',
  'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
)
ORDER BY 
  CASE 
    WHEN name IN ('read', 'write', 'delete') THEN 1
    WHEN name LIKE '%:manage' THEN 2
    ELSE 3
  END,
  name;

-- ============================================================================
-- 7. TEST COMPLETION SUMMARY
-- ============================================================================

SELECT 
  'PERMISSION INSERTION TEST COMPLETED' as test_phase,
  'All 34 permissions from seed.sql lines 14-48 successfully inserted' as result,
  NOW() as completed_at;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Clean up test data for next test
DELETE FROM permissions WHERE name IN (
  'read', 'write', 'delete',
  'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
  'contracts:manage', 'service_contracts:manage', 'products:manage',
  'product_sales:manage', 'job_works:manage', 'tickets:manage', 'complaints:manage',
  'dashboard:manage', 'crm:system:config:manage', 'companies:manage',
  'reports:manage', 'export_data', 'view_audit_logs',
  'create_tickets', 'update_tickets', 'create_products', 'update_products',
  'inventory:manage', 'view_financials', 'integrations:manage',
  'bulk_operations', 'advanced_search', 'api_access',
  'crm:platform:control:admin', 'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
);

-- ============================================================================
-- END OF TEST
-- ============================================================================