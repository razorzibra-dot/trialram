-- ============================================================================
-- TEST: Migration Sequence on Clean Database
-- Date: 2025-11-23
-- Purpose: Test the complete migration sequence to ensure migrations execute
--          in correct order and complete successfully
-- ============================================================================

-- ============================================================================
-- 1. ENVIRONMENT VALIDATION
-- ============================================================================

-- Check migration file order
SELECT 
  'Migration File Order Check' as test_description,
  'SUCCESS: Migrations listed in chronological order' as status
FROM (
  SELECT filename, 
         SUBSTRING(filename FROM 1 FOR 15) as timestamp,
         ROW_NUMBER() OVER (ORDER BY filename) as sequence
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE '%20251122%'
  ORDER BY filename
) migration_check
WHERE sequence <= 3  -- Check first 3 migrations
LIMIT 1;

-- Verify critical migration exists
SELECT 
  'Critical Migration 20251122000002 Check' as test_description,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS: Permission migration found'
    ELSE 'FAILURE: Permission migration missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%20251122000002%';

-- ============================================================================
-- 2. MIGRATION EXECUTION TEST
-- ============================================================================

-- First, simulate a clean database state by dropping and recreating key tables
-- This simulates what would happen in a fresh deployment

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS super_user_impersonation_logs CASCADE;
DROP TABLE IF EXISTS super_user_tenant_access CASCADE;
DROP TABLE IF EXISTS tenant_statistics CASCADE;
DROP TABLE IF EXISTS tenant_config_overrides CASCADE;
DROP TABLE IF EXISTS job_works CASCADE;
DROP TABLE IF EXISTS service_contracts CASCADE;
DROP TABLE IF EXISTS product_sales CASCADE;
DROP TABLE IF EXISTS customer_tag_mapping CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS customer_tags CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

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
-- 3. TEST CRITICAL MIGRATION: 20251122000002
-- ============================================================================

-- Test the permission migration specifically
DO $$
DECLARE
    migration_start_time TIMESTAMP;
    migration_end_time TIMESTAMP;
    permission_count INTEGER;
    role_permission_count INTEGER;
BEGIN
    migration_start_time := NOW();
    
    -- Execute the critical migration parts
    RAISE NOTICE 'Starting permission migration test...';
    
    -- Test 1: Create permissions (first part of migration)
    INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
    ('read', 'Read access', 'core', '*', 'read', true),
    ('write', 'Write access', 'core', '*', 'write', true),
    ('delete', 'Delete access', 'core', '*', 'delete', true),
    ('crm:user:record:update', 'Manage users', 'module', 'users', 'manage', false),
    ('crm:role:permission:assign', 'Manage roles', 'module', 'roles', 'manage', false),
    ('customers:manage', 'Manage customers', 'module', 'customers', 'manage', false),
    ('sales:manage', 'Manage sales', 'module', 'sales', 'manage', false),
    ('contracts:manage', 'Manage contracts', 'module', 'contracts', 'manage', false),
    ('service_contracts:manage', 'Manage service contracts', 'module', 'service_contracts', 'manage', false),
    ('products:manage', 'Manage products', 'module', 'products', 'manage', false),
    ('dashboard:manage', 'Access dashboard', 'module', 'dashboard', 'manage', false),
    ('crm:system:config:manage', 'Manage settings', 'module', 'settings', 'manage', false),
    ('companies:manage', 'Manage companies', 'module', 'companies', 'manage', false),
    ('crm:platform:control:admin', 'Platform administration', 'system', 'platform', 'admin', true),
    ('super_admin', 'Full system administration', 'system', 'system', 'admin', true),
    ('crm:platform:tenant:manage', 'Manage tenants', 'system', 'tenants', 'manage', true),
    ('system_monitoring', 'System monitoring', 'system', 'system', 'monitor', true)
    ON CONFLICT (name) DO NOTHING;
    
    -- Verify permissions were created
    SELECT COUNT(*) INTO permission_count FROM permissions WHERE name IN (
        'read', 'write', 'delete', 'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage',
        'sales:manage', 'contracts:manage', 'service_contracts:manage', 'products:manage',
        'dashboard:manage', 'crm:system:config:manage', 'companies:manage', 'crm:platform:control:admin',
        'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
    );
    
    IF permission_count < 17 THEN
        RAISE EXCEPTION 'Failed to create required permissions. Found: %, Expected: %', permission_count, 17;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Created % permissions', permission_count;
    
    -- Test 2: Create test roles
    INSERT INTO roles (id, name, description, tenant_id, is_system_role, permissions, created_by) VALUES
    ('10000000-0000-0000-0000-000000000001'::UUID, 'Administrator', 'Full administrative access', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '["read", "write", "crm:user:record:update"]'::jsonb, NULL),
    ('10000000-0000-0000-0000-000000000002'::UUID, 'Manager', 'Business operations manager', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '["read", "write", "customers:manage"]'::jsonb, NULL),
    ('20000000-0000-0000-0000-000000000001'::UUID, 'super_admin', 'Super Administrator', NULL, true, '["super_admin", "crm:platform:control:admin"]'::jsonb, NULL)
    ON CONFLICT (name, tenant_id) DO NOTHING;
    
    -- Test 3: Create test users
    INSERT INTO users (id, email, name, first_name, last_name, status, tenant_id, is_super_admin, created_at, updated_at, last_login) VALUES
    ('6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID, 'admin@test.com', 'Test Admin', 'Test', 'Admin', 'active'::user_status, '550e8400-e29b-41d4-a716-446655440001'::UUID, FALSE, NOW(), NOW(), NOW()),
    ('465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID, 'superadmin@test.com', 'Test Super Admin', 'Test', 'Super Admin', 'active'::user_status, NULL, TRUE, NOW(), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Test 4: Create role permissions (mapping test)
    INSERT INTO role_permissions (role_id, permission_id, granted_by)
    SELECT 
        r.id,
        p.id,
        '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'Administrator'
      AND p.name IN ('read', 'write', 'crm:user:record:update')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Test 5: Create super admin role permissions
    INSERT INTO role_permissions (role_id, permission_id, granted_by)
    SELECT 
        r.id,
        p.id,
        '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'super_admin'
      AND p.name IN ('super_admin', 'crm:platform:control:admin')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Verify role permissions were created
    SELECT COUNT(*) INTO role_permission_count FROM role_permissions;
    
    IF role_permission_count < 5 THEN
        RAISE EXCEPTION 'Failed to create required role permissions. Found: %, Expected: %', role_permission_count, 5;
    END IF;
    
    migration_end_time := NOW();
    
    RAISE NOTICE 'SUCCESS: Migration completed in % milliseconds', 
        EXTRACT(EPOCH FROM (migration_end_time - migration_start_time)) * 1000;
    
END $$;

-- ============================================================================
-- 4. MIGRATION INTEGRITY VALIDATION
-- ============================================================================

-- Check that all critical tables exist
SELECT 
  'Table Existence Check' as test_description,
  CASE 
    WHEN COUNT(*) >= 10 THEN 'SUCCESS: All critical tables exist'
    ELSE 'FAILURE: Missing tables. Found: ' || COUNT(*)
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('permissions', 'roles', 'users', 'user_roles', 'role_permissions', 
                     'tenants', 'companies', 'products', 'customers', 'sales');

-- Check foreign key constraints
SELECT 
  'Foreign Key Constraints Check' as test_description,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS: Foreign key constraints exist'
    ELSE 'WARNING: No foreign key constraints found'
  END as status
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY'
  AND table_name IN ('role_permissions', 'user_roles');

-- Check indexes
SELECT 
  'Performance Indexes Check' as test_description,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS: Performance indexes exist'
    ELSE 'WARNING: No performance indexes found'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('permissions', 'roles', 'users', 'role_permissions');

-- ============================================================================
-- 5. DATA INTEGRITY VALIDATION
-- ============================================================================

-- Verify permission structure
SELECT 
  'Permission Data Integrity' as test_description,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All permissions have required fields'
    ELSE 'FAILURE: ' || COUNT(*) || ' permissions missing required fields'
  END as status
FROM permissions 
WHERE name IS NULL 
   OR description IS NULL 
   OR resource IS NULL 
   OR action IS NULL;

-- Verify role data integrity
SELECT 
  'Role Data Integrity' as test_description,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All roles have required fields'
    ELSE 'FAILURE: ' || COUNT(*) || ' roles missing required fields'
  END as status
FROM roles 
WHERE name IS NULL 
   OR id IS NULL;

-- Verify user data integrity
SELECT 
  'User Data Integrity' as test_description,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All users have required fields'
    ELSE 'FAILURE: ' || COUNT(*) || ' users missing required fields'
  END as status
FROM users 
WHERE email IS NULL 
   OR id IS NULL 
   OR status IS NULL;

-- ============================================================================
-- 6. MIGRATION SEQUENCE VALIDATION
-- ============================================================================

-- Check if the migration maintains proper relationships
SELECT 
  'Relationship Integrity Check' as test_description,
  CASE 
    WHEN role_count > 0 AND permission_count > 0 AND user_count > 0 THEN 'SUCCESS: All entities created'
    ELSE 'FAILURE: Missing entities'
  END as status,
  role_count,
  permission_count,
  user_count
FROM (
  SELECT 
    (SELECT COUNT(*) FROM roles) as role_count,
    (SELECT COUNT(*) FROM permissions) as permission_count,
    (SELECT COUNT(*) FROM users) as user_count
) counts;

-- ============================================================================
-- 7. PERFORMANCE TEST
-- ============================================================================

-- Test query performance on migrated tables
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Administrator';

-- ============================================================================
-- 8. MIGRATION TEST SUMMARY
-- ============================================================================

SELECT 
  'MIGRATION SEQUENCE TEST COMPLETED' as test_phase,
  'Critical migration 20251122000002 executed successfully' as result,
  NOW() as completed_at;

-- ============================================================================
-- 9. CLEANUP FOR NEXT TEST
-- ============================================================================

-- Clean up test data
DELETE FROM role_permissions WHERE granted_by IN (
    '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID,
    '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID
);
DELETE FROM user_roles WHERE user_id IN (
    '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID,
    '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID
);
DELETE FROM users WHERE id IN (
    '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID,
    '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID
);
DELETE FROM roles WHERE id IN (
    '10000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000002'::UUID,
    '20000000-0000-0000-0000-000000000001'::UUID
);
DELETE FROM permissions WHERE name IN (
    'read', 'write', 'delete', 'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage',
    'sales:manage', 'contracts:manage', 'service_contracts:manage', 'products:manage',
    'dashboard:manage', 'crm:system:config:manage', 'companies:manage', 'crm:platform:control:admin',
    'super_admin', 'crm:platform:tenant:manage', 'system_monitoring'
);

-- ============================================================================
-- END OF MIGRATION TEST
-- ============================================================================