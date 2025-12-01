-- ============================================================================
-- PRE-DEPLOYMENT DATABASE VALIDATION SCRIPT
-- Task: 4.2.1 - Create pre-deployment validation script
-- Purpose: Comprehensive validation before production deployment
-- Usage: psql "postgresql://user:pass@host:port/db" -f pre-deployment-validation.sql
-- ============================================================================

-- ============================================================================
-- HEADER AND CONFIGURATION
-- ============================================================================
\echo '============================================================================'
\echo 'PRE-DEPLOYMENT DATABASE VALIDATION REPORT'
\echo 'Generated: ' `date`
\echo 'Purpose: Comprehensive validation before production deployment'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- SECTION 1: ENVIRONMENT AND CONNECTION VALIDATION
-- ============================================================================
\echo '🔍 SECTION 1: ENVIRONMENT VALIDATION'
\echo '====================================='

-- Database version and connection info
SELECT 
    'ENVIRONMENT' as check_type,
    version() as database_version,
    current_database() as database_name,
    current_user as connected_user,
    inet_server_addr() as server_address,
    inet_server_port() as server_port,
    now() as validation_timestamp;

-- Check if we're connected to the right database
SELECT 
    'DATABASE_CONNECTION' as check_type,
    CASE 
        WHEN current_database() = 'postgres' THEN 'INFO: Using default postgres database'
        WHEN current_database() LIKE '%crm%' OR current_database() LIKE '%prod%' THEN 'WARNING: Appears to be production database'
        ELSE 'INFO: Using development/test database'
    END as connection_status,
    current_database() as current_database;

\echo ''

-- ============================================================================
-- SECTION 2: CRITICAL MIGRATION STATUS CHECKS
-- ============================================================================
\echo '🔄 SECTION 2: MIGRATION STATUS VALIDATION'
\echo '========================================='

-- Check critical migrations are applied
SELECT 
    'CRITICAL_MIGRATIONS' as check_type,
    version,
    executed_at,
    CASE 
        WHEN version = '20251122000002' THEN '✅ CRITICAL: Permission format migration'
        WHEN version LIKE '%audit%' THEN '✅ AUDIT: Audit logs RLS policies'
        WHEN version LIKE '%auth%' THEN '✅ AUTH: Auth user synchronization'
        ELSE '✅ OTHER: Standard migration'
    END as migration_status,
    CASE 
        WHEN version = '20251122000002' THEN 'MUST_BE_PRESENT'
        ELSE 'OPTIONAL'
    END as criticality
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Migration count summary
SELECT 
    'MIGRATION_SUMMARY' as check_type,
    COUNT(*) as total_migrations,
    COUNT(CASE WHEN version = '20251122000002' THEN 1 END) as permission_migration_present,
    COUNT(CASE WHEN version LIKE '%audit%' THEN 1 END) as audit_migrations_present,
    COUNT(CASE WHEN version LIKE '%auth%' THEN 1 END) as auth_migrations_present
FROM supabase_migrations.schema_migrations;

\echo ''

-- ============================================================================
-- SECTION 3: AUTH USER SYNCHRONIZATION VALIDATION
-- ============================================================================
\echo '👥 SECTION 3: AUTH USER SYNCHRONIZATION'
\echo '========================================'

-- Test critical user ID synchronization
SELECT 
    'AUTH_USER_SYNC' as check_type,
    expected_email,
    expected_id,
    actual_id,
    CASE 
        WHEN actual_id = expected_id::UUID THEN '✅ SYNCED'
        WHEN actual_id IS NULL THEN '❌ MISSING_IN_DB'
        ELSE '❌ ID_MISMATCH'
    END as sync_status,
    auth_email,
    public_email
FROM (
    VALUES 
        ('admin@acme.com', '6e084750-4e35-468c-9903-5b5ab9d14af4'),
        ('manager@acme.com', '2707509b-57e8-4c84-a6fe-267eaa724223'),
        ('superadmin@platform.com', '465f34f1-e33c-475b-b42d-4feb4feaaf92'),
        ('engineer@acme.com', '27ff37b5-ef55-4e34-9951-42f35a1b2506'),
        ('user@acme.com', '3ce006ad-3a2b-45b8-b540-4b8634d0e410')
) AS expected_users(expected_email, expected_id)
LEFT JOIN auth.users au ON au.email = expected_users.expected_email
LEFT JOIN public.users pu ON pu.email = expected_users.expected_email
ORDER BY expected_email;

-- Summary statistics
SELECT 
    'AUTH_SYNC_SUMMARY' as check_type,
    COUNT(DISTINCT au.id) as auth_users_count,
    COUNT(DISTINCT pu.id) as public_users_count,
    COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as synced_users,
    COUNT(DISTINCT au.id) - COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as missing_in_public,
    COUNT(DISTINCT pu.id) - COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as missing_in_auth
FROM auth.users au
FULL OUTER JOIN public.users pu ON pu.id = au.id
WHERE (au.email IS NOT NULL AND au.email != '') OR (pu.email IS NOT NULL AND pu.email != '');

\echo ''

-- ============================================================================
-- SECTION 4: PERMISSION SYSTEM VALIDATION
-- ============================================================================
\echo '🔐 SECTION 4: PERMISSION SYSTEM VALIDATION'
\echo '==========================================='

-- Permission format analysis
SELECT 
    'PERMISSION_FORMATS' as check_type,
    CASE 
        WHEN name LIKE '%:%' THEN 'resource:action_format'
        WHEN name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin') THEN 'simple_format'
        ELSE 'legacy_format'
    END as format_type,
    COUNT(*) as permission_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PRESENT'
        ELSE '❌ MISSING'
    END as status
FROM permissions 
GROUP BY format_type
ORDER BY format_type;

-- Critical permissions check
SELECT 
    'CRITICAL_PERMISSIONS' as check_type,
    name,
    description,
    resource,
    action,
    CASE 
        WHEN name LIKE '%:%' THEN '✅ NEW_FORMAT'
        WHEN name IN ('read', 'write', 'delete') THEN '✅ CORE_PERMISSION'
        ELSE '⚠️ LEGACY_FORMAT'
    END as format_status,
    is_system_permission
FROM permissions 
WHERE name IN (
    'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 'sales:manage',
    'contracts:manage', 'products:manage', 'dashboard:manage', 'crm:system:config:manage',
    'read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin'
)
ORDER BY name;

-- Permission consistency check
SELECT 
    'PERMISSION_CONSISTENCY' as check_type,
    'Role_Permission_Mappings' as component,
    COUNT(*) as total_mappings,
    COUNT(DISTINCT role_id) as unique_roles,
    COUNT(DISTINCT permission_id) as unique_permissions,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RBAC_ACTIVE'
        ELSE '❌ NO_RBAC_DATA'
    END as status
FROM role_permissions;

\echo ''

-- ============================================================================
-- SECTION 5: TENANT ISOLATION VALIDATION
-- ============================================================================
\echo '🏢 SECTION 5: TENANT ISOLATION VALIDATION'
\echo '========================================='

-- Tenant count and status
SELECT 
    'TENANT_OVERVIEW' as check_type,
    COUNT(*) as total_tenants,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_tenants,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_tenants
FROM tenants;

-- User distribution by tenant
SELECT 
    'USER_TENANT_DISTRIBUTION' as check_type,
    t.name as tenant_name,
    t.status as tenant_status,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.is_super_admin THEN 1 END) as super_admin_count,
    COUNT(CASE WHEN u.is_active THEN 1 END) as active_user_count,
    CASE 
        WHEN COUNT(u.id) > 0 THEN '✅ TENANT_HAS_USERS'
        ELSE '⚠️ TENANT_NO_USERS'
    END as tenant_status
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.status
ORDER BY t.name;

-- Data isolation check (customers by tenant)
SELECT 
    'DATA_ISOLATION' as check_type,
    t.name as tenant,
    COUNT(c.id) as customer_count,
    COUNT(s.id) as sales_count,
    COUNT(ct.id) as contract_count,
    CASE 
        WHEN COUNT(c.id) + COUNT(s.id) + COUNT(ct.id) > 0 THEN '✅ HAS_BUSINESS_DATA'
        ELSE '⚠️ NO_BUSINESS_DATA'
    END as data_status
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
LEFT JOIN sales s ON t.id = s.tenant_id
LEFT JOIN contracts ct ON t.id = ct.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

\echo ''

-- ============================================================================
-- SECTION 6: RLS POLICIES VALIDATION
-- ============================================================================
\echo '🛡️ SECTION 6: RLS POLICIES VALIDATION'
\echo '======================================'

-- RLS enabled tables
SELECT 
    'RLS_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS_ENABLED'
        ELSE '⚠️ RLS_DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'customers', 'sales', 'contracts', 'audit_logs')
ORDER BY tablename;

-- Policy count by table
SELECT 
    'RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ POLICIES_PRESENT'
        ELSE '⚠️ NO_POLICIES'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'customers', 'sales', 'contracts', 'audit_logs')
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo ''

-- ============================================================================
-- SECTION 7: REFERENCE DATA VALIDATION
-- ============================================================================
\echo '📊 SECTION 7: REFERENCE DATA VALIDATION'
\echo '======================================='

-- Reference data completeness
SELECT 
    'REFERENCE_DATA_COMPLETENESS' as check_type,
    category,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active THEN 1 END) as active_records,
    COUNT(DISTINCT tenant_id) as tenant_coverage,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ DATA_PRESENT'
        ELSE '❌ NO_DATA'
    END as status
FROM reference_data
GROUP BY category
ORDER BY category;

-- Critical reference categories check
SELECT 
    'CRITICAL_REFERENCE_CATEGORIES' as check_type,
    category,
    CASE 
        WHEN category IN ('industry', 'company_size', 'customer_status', 'ticket_status', 'contract_status') THEN '✅ REQUIRED'
        ELSE '✅ OPTIONAL'
    END as criticality,
    COUNT(*) as record_count
FROM reference_data
WHERE category IN ('industry', 'company_size', 'customer_status', 'ticket_status', 'contract_status', 'lead_source', 'priority')
GROUP BY category
ORDER BY category;

\echo ''

-- ============================================================================
-- SECTION 8: DATA INTEGRITY VALIDATION
-- ============================================================================
\echo '🔍 SECTION 8: DATA INTEGRITY VALIDATION'
\echo '========================================'

-- Orphaned records check
SELECT 
    'DATA_INTEGRITY' as check_type,
    'Orphaned_Customers' as issue_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO_ORPHANS'
        ELSE '❌ ORPHANS_FOUND'
    END as status
FROM customers c
LEFT JOIN tenants t ON c.tenant_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 
    'DATA_INTEGRITY' as check_type,
    'Orphaned_Sales' as issue_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO_ORPHANS'
        ELSE '❌ ORPHANS_FOUND'
    END as status
FROM sales s
LEFT JOIN tenants t ON s.tenant_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 
    'DATA_INTEGRITY' as check_type,
    'Orphaned_Contracts' as issue_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO_ORPHANS'
        ELSE '❌ ORPHANS_FOUND'
    END as status
FROM contracts ct
LEFT JOIN tenants t ON ct.tenant_id = t.id
WHERE t.id IS NULL;

-- User role assignments validation
SELECT 
    'USER_ROLES_VALIDATION' as check_type,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT user_id) as unique_users_with_roles,
    COUNT(DISTINCT role_id) as unique_roles_assigned,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RBAC_ACTIVE'
        ELSE '⚠️ NO_ROLE_ASSIGNMENTS'
    END as status
FROM user_roles;

\echo ''

-- ============================================================================
-- SECTION 9: SUMMARY AND DEPLOYMENT READINESS
-- ============================================================================
\echo '📋 SECTION 9: DEPLOYMENT READINESS SUMMARY'
\echo '=========================================='

-- Overall system health score
WITH critical_checks AS (
    SELECT 
        'AUTH_SYNC' as check_name,
        CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM auth.users au 
                JOIN public.users pu ON au.id = pu.id 
                WHERE au.email IN ('admin@acme.com', 'manager@acme.com', 'superadmin@platform.com')
            ) = 3 THEN 'PASS'
            ELSE 'FAIL'
        END as status
    UNION ALL
    SELECT 
        'MIGRATIONS' as check_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') THEN 'PASS'
            ELSE 'FAIL'
        END as status
    UNION ALL
    SELECT 
        'PERMISSIONS' as check_name,
        CASE 
            WHEN (SELECT COUNT(*) FROM permissions WHERE name LIKE '%:%') > 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status
    UNION ALL
    SELECT 
        'TENANTS' as check_name,
        CASE 
            WHEN (SELECT COUNT(*) FROM tenants WHERE status = 'active') > 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status
    UNION ALL
    SELECT 
        'RLS_POLICIES' as check_name,
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status
)
SELECT 
    'DEPLOYMENT_READINESS' as report_type,
    COUNT(*) as total_critical_checks,
    COUNT(CASE WHEN status = 'PASS' THEN 1 END) as passed_checks,
    COUNT(CASE WHEN status = 'FAIL' THEN 1 END) as failed_checks,
    ROUND(
        (COUNT(CASE WHEN status = 'PASS' THEN 1 END)::decimal / COUNT(*)) * 100, 2
    ) as health_percentage,
    CASE 
        WHEN COUNT(CASE WHEN status = 'FAIL' THEN 1 END) = 0 THEN '✅ READY_FOR_DEPLOYMENT'
        ELSE '❌ NOT_READY_DEPLOYMENT_ISSUES'
    END as deployment_status,
    CASE 
        WHEN COUNT(CASE WHEN status = 'FAIL' THEN 1 END) = 0 THEN 'All critical systems validated successfully'
        ELSE 'Critical issues must be resolved before deployment'
    END as recommendation
FROM critical_checks;

\echo ''
\echo '============================================================================'
\echo 'PRE-DEPLOYMENT VALIDATION COMPLETE'
\echo 'Review all sections above for deployment readiness'
\echo 'If any checks show FAIL or ❌, resolve issues before proceeding'
\echo '============================================================================'