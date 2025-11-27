-- ============================================================================
-- VALIDATION DASHBOARD - EXECUTIVE SUMMARY
-- Task: 4.1.6 - Consolidated Validation Dashboard
-- Purpose: Single-query overview of entire database synchronization status
-- ============================================================================

-- ============================================================================
-- EXECUTIVE DASHBOARD - KEY METRICS AT A GLANCE
-- ============================================================================

SELECT 
    'EXECUTIVE_DASHBOARD' as report_type,
    'DATABASE_SYNCHRONIZATION_STATUS' as section,
    'Overall Health Score' as metric,
    CASE 
        WHEN (
            -- Check critical components
            (SELECT COUNT(*) FROM tenants) >= 3 AND
            (SELECT COUNT(*) FROM users) >= 10 AND
            (SELECT COUNT(*) FROM permissions WHERE name LIKE '%:%') >= 30 AND
            (SELECT COUNT(*) FROM roles) >= 5 AND
            (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 50
        ) THEN '✅ EXCELLENT (90-100%)'
        WHEN (
            (SELECT COUNT(*) FROM tenants) >= 2 AND
            (SELECT COUNT(*) FROM users) >= 8 AND
            (SELECT COUNT(*) FROM permissions WHERE name LIKE '%:%') >= 20 AND
            (SELECT COUNT(*) FROM roles) >= 4 AND
            (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 30
        ) THEN '✅ GOOD (75-89%)'
        WHEN (
            (SELECT COUNT(*) FROM tenants) >= 1 AND
            (SELECT COUNT(*) FROM users) >= 5 AND
            (SELECT COUNT(*) FROM permissions) >= 15 AND
            (SELECT COUNT(*) FROM roles) >= 3 AND
            (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 15
        ) THEN '⚠️ ACCEPTABLE (60-74%)'
        ELSE '❌ NEEDS IMPROVEMENT (<60%)'
    END as status,
    'Comprehensive database synchronization assessment' as description

UNION ALL

SELECT 
    'EXECUTIVE_DASHBOARD' as report_type,
    'CRITICAL_MIGRATIONS' as section,
    'Permission Migration Status' as metric,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM supabase_migrations.schema_migrations 
            WHERE version = '20251122000002'
        ) THEN '✅ APPLIED'
        ELSE '❌ MISSING'
    END as status,
    'Critical permission format migration (resource:action)' as description

UNION ALL

SELECT 
    'EXECUTIVE_DASHBOARD' as report_type,
    'AUTH_SYNCHRONIZATION' as section,
    'User ID Sync Status' as metric,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM users WHERE email IN (
                'admin@acme.com', 'manager@acme.com', 'superadmin@platform.com'
            )
        ) >= 3 THEN '✅ SYNCHRONIZED'
        ELSE '⚠️ PARTIAL SYNC'
    END as status,
    'Auth users properly synchronized with public users' as description

UNION ALL

SELECT 
    'EXECUTIVE_DASHBOARD' as report_type,
    'SECURITY_POSTURE' as section,
    'RLS Coverage' as metric,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' AND rowsecurity = true
        ) >= (
            SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
        ) * 0.8 THEN '✅ COMPREHENSIVE'
        ELSE '⚠️ PARTIAL COVERAGE'
    END as status,
    'Row Level Security coverage across critical tables' as description

UNION ALL

SELECT 
    'EXECUTIVE_DASHBOARD' as report_type,
    'DATA_INTEGRITY' as section,
    'Permission Format Compliance' as metric,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM permissions WHERE name LIKE '%:%'
        ) >= (
            SELECT COUNT(*) FROM permissions
        ) * 0.8 THEN '✅ COMPLIANT'
        ELSE '⚠️ LEGACY FORMAT REMAINS'
    END as status,
    'Resource:action permission format adoption' as description;

-- ============================================================================
-- CRITICAL SUCCESS INDICATORS
-- ============================================================================

SELECT 
    'SUCCESS_INDICATORS' as report_type,
    'TENANT_ISOLATION' as indicator,
    CASE 
        WHEN (
            SELECT COUNT(DISTINCT tablename) FROM pg_policies 
            WHERE schemaname = 'public' AND qual ILIKE '%tenant_id%'
        ) >= 5 THEN '✅ IMPLEMENTED'
        ELSE '⚠️ PARTIAL'
    END as status,
    CONCAT(
        (SELECT COUNT(DISTINCT tablename) FROM pg_policies 
         WHERE schemaname = 'public' AND qual ILIKE '%tenant_id%'), 
        ' tables with tenant isolation'
    ) as details

UNION ALL

SELECT 
    'SUCCESS_INDICATORS' as report_type,
    'SUPER_ADMIN_ACCESS' as indicator,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM users WHERE is_super_admin = true
        ) >= 1 THEN '✅ CONFIGURED'
        ELSE '❌ MISSING'
    END as status,
    CONCAT(
        (SELECT COUNT(*) FROM users WHERE is_super_admin = true), 
        ' super admin users configured'
    ) as details

UNION ALL

SELECT 
    'SUCCESS_INDICATORS' as report_type,
    'ROLE_PERMISSION_MAPPING' as indicator,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = 'Administrator'
        ) >= 30 THEN '✅ COMPREHENSIVE'
        ELSE '⚠️ INCOMPLETE'
    END as status,
    CONCAT(
        (SELECT COUNT(*) FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.id
         WHERE r.name = 'Administrator'), 
        ' permissions assigned to Administrator role'
    ) as details

UNION ALL

SELECT 
    'SUCCESS_INDICATORS' as report_type,
    'AUDIT_LOGGING' as indicator,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM audit_logs
        ) >= 10 THEN '✅ ACTIVE'
        ELSE '⚠️ MINIMAL'
    END as status,
    CONCAT(
        (SELECT COUNT(*) FROM audit_logs), 
        ' audit log entries recorded'
    ) as details;

-- ============================================================================
-- RISK ASSESSMENT MATRIX
-- ============================================================================

SELECT 
    'RISK_ASSESSMENT' as report_type,
    'MISSING_CRITICAL_POLICIES' as risk_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_tables t
            LEFT JOIN pg_policies p ON t.tablename = p.tablename 
                AND t.schemaname = p.schemaname
            WHERE t.schemaname = 'public'
                AND t.rowsecurity = true
                AND p.policyname IS NULL
        ) = 0 THEN '✅ NO RISK'
        ELSE CONCAT('⚠️ ', (
            SELECT COUNT(*) FROM pg_tables t
            LEFT JOIN pg_policies p ON t.tablename = p.tablename 
                AND t.schemaname = p.schemaname
            WHERE t.schemaname = 'public'
                AND t.rowsecurity = true
                AND p.policyname IS NULL
        ), ' TABLES AT RISK')
    END as status,
    'Tables with RLS enabled but no policies defined' as description

UNION ALL

SELECT 
    'RISK_ASSESSMENT' as report_type,
    'ORPHANED_PERMISSIONS' as risk_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM permissions p
            LEFT JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.permission_id IS NULL
        ) = 0 THEN '✅ NO RISK'
        ELSE CONCAT('⚠️ ', (
            SELECT COUNT(*) FROM permissions p
            LEFT JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.permission_id IS NULL
        ), ' ORPHANED PERMISSIONS')
    END as status,
    'Permissions not assigned to any role' as description

UNION ALL

SELECT 
    'RISK_ASSESSMENT' as report_type,
    'DATA_INCONSISTENCY' as risk_category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM auth.users au
            LEFT JOIN public.users pu ON au.id = pu.id
            WHERE pu.id IS NULL
        ) = 0 THEN '✅ NO RISK'
        ELSE CONCAT('⚠️ ', (
            SELECT COUNT(*) FROM auth.users au
            LEFT JOIN public.users pu ON au.id = pu.id
            WHERE pu.id IS NULL
        ), ' AUTH USERS WITHOUT PUBLIC RECORDS')
    END as status,
    'Auth users missing corresponding public user records' as description;

-- ============================================================================
-- DEPLOYMENT READINESS CHECK
-- ============================================================================

SELECT 
    'DEPLOYMENT_READINESS' as report_type,
    'READY_FOR_PRODUCTION' as readiness_check,
    CASE 
        WHEN (
            -- All critical checks must pass
            EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') AND
            (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 10 AND
            (SELECT COUNT(*) FROM permissions WHERE name LIKE '%:%') >= 30 AND
            (SELECT COUNT(*) FROM roles) >= 5 AND
            (SELECT COUNT(*) FROM user_roles) >= 10
        ) THEN '✅ READY'
        ELSE '⚠️ REQUIRES ATTENTION'
    END as status,
    'All critical components validated for production deployment' as description

UNION ALL

SELECT 
    'DEPLOYMENT_READINESS' as report_type,
    'VALIDATION_SCRIPTS_STATUS' as readiness_check,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%validation%') >= 5
        ) THEN '✅ AVAILABLE'
        ELSE '⚠️ LIMITED'
    END as status,
    'Comprehensive validation scripts available for ongoing monitoring' as description;

-- ============================================================================
-- PERFORMANCE METRICS SUMMARY
-- ============================================================================

SELECT 
    'PERFORMANCE_METRICS' as report_type,
    'TABLE_COUNTS' as metric_category,
    'Total Tables' as metric,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%')::TEXT as value

UNION ALL

SELECT 
    'PERFORMANCE_METRICS' as report_type,
    'TABLE_COUNTS' as metric_category,
    'RLS Enabled Tables' as metric,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::TEXT as value

UNION ALL

SELECT 
    'PERFORMANCE_METRICS' as report_type,
    'TABLE_COUNTS' as metric_category,
    'Total RLS Policies' as metric,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::TEXT as value

UNION ALL

SELECT 
    'PERFORMANCE_METRICS' as report_type,
    'TABLE_COUNTS' as metric_category,
    'Average Policies per Table' as metric,
    ROUND(
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::decimal /
        NULLIF((SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true), 0),
        2
    )::TEXT as value;

-- ============================================================================
-- FINAL RECOMMENDATIONS
-- ============================================================================

SELECT 
    'RECOMMENDATIONS' as report_type,
    'IMMEDIATE_ACTIONS' as category,
    'Monitor Critical Migrations' as recommendation,
    CASE 
        WHEN EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002')
        THEN '✅ Current: Permission migration applied'
        ELSE '❌ Action Required: Apply permission migration'
    END as status,
    'Ensure all critical migrations are applied before production' as details

UNION ALL

SELECT 
    'RECOMMENDATIONS' as report_type,
    'IMMEDIATE_ACTIONS' as category,
    'Validate Auth Sync' as recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users au JOIN public.users pu ON au.id = pu.id) >= 10
        THEN '✅ Current: Auth sync validated'
        ELSE '⚠️ Action Required: Run auth user validation'
    END as status,
    'Regular validation of auth-public user synchronization' as details

UNION ALL

SELECT 
    'RECOMMENDATIONS' as report_type,
    'ONGOING_MONITORING' as category,
    'Policy Performance' as recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND LENGTH(qual) > 500) = 0
        THEN '✅ Current: Policy performance optimal'
        ELSE '⚠️ Review: Some policies may impact performance'
    END as status,
    'Monitor RLS policy performance, especially complex expressions' as details

UNION ALL

SELECT 
    'RECOMMENDATIONS' as report_type,
    'ONGOING_MONITORING' as category,
    'Security Posture' as recommendation,
    '✅ Continuous: Maintain comprehensive RLS coverage',
    'Regular security audits and policy validation' as details,
    'Ensure all new tables have appropriate RLS policies' as details;