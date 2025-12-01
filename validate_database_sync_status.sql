-- ============================================================================
-- DATABASE SYNCHRONIZATION STATUS VALIDATION
-- ============================================================================
-- This script validates the current state of database synchronization
-- to determine which checklist items are actually complete
-- ============================================================================

\echo '============================================================================'
\echo 'DATABASE SYNCHRONIZATION STATUS VALIDATION'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. PERMISSION FORMAT VALIDATION
-- ============================================================================
\echo '1. PERMISSION FORMAT VALIDATION'
\echo '--------------------------------'

-- Check if permissions are in resource:action format
SELECT 
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN name LIKE '%:%' THEN 1 END) as resource_action_format,
    COUNT(CASE WHEN name NOT LIKE '%:%' AND name NOT IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin', 'system_monitoring', 'view_audit_logs', 'export_data', 'view_financials', 'bulk_operations', 'advanced_search', 'api_access') THEN 1 END) as old_format
FROM permissions;

\echo ''
\echo 'Permissions in resource:action format:'
SELECT name, resource, action 
FROM permissions 
WHERE name LIKE '%:%'
ORDER BY name
LIMIT 20;

\echo ''

-- ============================================================================
-- 2. ROLE PERMISSIONS MAPPING VALIDATION
-- ============================================================================
\echo '2. ROLE PERMISSIONS MAPPING VALIDATION'
\echo '---------------------------------------'

-- Count permissions per role
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count,
    COUNT(DISTINCT rp.granted_by) as granted_by_users
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY r.name;

\echo ''

-- ============================================================================
-- 3. MIGRATION EXECUTION ORDER VALIDATION
-- ============================================================================
\echo '3. MIGRATION EXECUTION ORDER VALIDATION'
\echo '----------------------------------------'

-- Check if critical migrations exist
SELECT 
    version,
    name,
    executed_at
FROM supabase_migrations.schema_migrations
WHERE version IN (
    '20251122000001',
    '20251122000002'
)
ORDER BY version;

\echo ''

-- ============================================================================
-- 4. AUTH USER SYNCHRONIZATION VALIDATION
-- ============================================================================
\echo '4. AUTH USER SYNCHRONIZATION VALIDATION'
\echo '----------------------------------------'

-- Verify user IDs match between auth.users and public.users
SELECT 
    au.email,
    au.id as auth_id,
    pu.id as public_id,
    CASE 
        WHEN au.id = pu.id THEN 'MATCH ✓'
        ELSE 'MISMATCH ✗'
    END as sync_status
FROM auth.users au
LEFT JOIN users pu ON au.email = pu.email
ORDER BY au.email;

\echo ''

-- Count sync status
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN au.id = pu.id THEN 1 END) as synced_users,
    COUNT(CASE WHEN au.id != pu.id OR pu.id IS NULL THEN 1 END) as unsynced_users
FROM auth.users au
LEFT JOIN users pu ON au.email = pu.email;

\echo ''

-- ============================================================================
-- 5. VALIDATION SCRIPTS EXISTENCE CHECK
-- ============================================================================
\echo '5. VALIDATION SCRIPTS STATUS'
\echo '-----------------------------'

-- This would need to be checked from file system
\echo 'Validation scripts should exist:'
\echo '  - test_permission_validation_updated.sql'
\echo '  - test_migration_order_validation.sql'
\echo '  - test_auth_sync_validation.sql'
\echo '  - comprehensive_environment_test.sql'
\echo ''

-- ============================================================================
-- 6. RLS POLICIES VALIDATION
-- ============================================================================
\echo '6. RLS POLICIES VALIDATION'
\echo '--------------------------'

-- Count RLS policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo ''

-- ============================================================================
-- 7. TENANT ISOLATION VALIDATION
-- ============================================================================
\echo '7. TENANT ISOLATION VALIDATION'
\echo '-------------------------------'

-- Check tenant data distribution
SELECT 
    t.name as tenant_name,
    (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as users_count,
    (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) as customers_count,
    (SELECT COUNT(*) FROM sales WHERE tenant_id = t.id) as sales_count
FROM tenants t
ORDER BY t.name;

\echo ''

-- ============================================================================
-- 8. OVERALL SYSTEM HEALTH
-- ============================================================================
\echo '8. OVERALL SYSTEM HEALTH'
\echo '------------------------'

-- Summary statistics
SELECT 
    'Tenants' as entity,
    COUNT(*) as count
FROM tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role Permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Sales', COUNT(*) FROM sales
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts;

\echo ''
\echo '============================================================================'
\echo 'VALIDATION COMPLETE'
\echo '============================================================================'
