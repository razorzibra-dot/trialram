-- ============================================================================
-- RLS Policy Validation Script
-- Phase 4.3: Database Schema Validation - RLS Policy Testing
-- ============================================================================

-- ============================================================================
-- 1. OVERVIEW OF RLS POLICIES ACROSS ALL TABLES
-- ============================================================================

-- 1.1 Check RLS status for all tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_prisma_%'
ORDER BY tablename;

-- 1.2 Count of RLS policies per table
SELECT
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT cmd, ', ') as operations_with_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 1.3 Detailed RLS policy analysis
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE
        WHEN qual IS NOT NULL THEN 'Has WHERE conditions'
        ELSE 'No WHERE conditions'
    END as has_conditions,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 2. TENANT ISOLATION VALIDATION
-- ============================================================================

-- 2.1 Check tenant_id column presence across all tables
SELECT
    t.table_name,
    CASE
        WHEN c.column_name = 'tenant_id' THEN 'Has tenant_id'
        ELSE 'No tenant_id'
    END as tenant_column_status,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
    AND c.column_name = 'tenant_id'
    AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_prisma_%'
ORDER BY t.table_name;

-- 2.2 Analyze tenant distribution across key tables
SELECT 'Users per tenant' as metric, tenant_id, COUNT(*) as count FROM users GROUP BY tenant_id ORDER BY count DESC;
SELECT 'Customers per tenant' as metric, tenant_id, COUNT(*) as count FROM customers GROUP BY tenant_id ORDER BY count DESC;
SELECT 'Sales per tenant' as metric, tenant_id, COUNT(*) as count FROM sales GROUP BY tenant_id ORDER BY count DESC;
SELECT 'Tickets per tenant' as metric, tenant_id, COUNT(*) as count FROM tickets GROUP BY tenant_id ORDER BY count DESC;
SELECT 'Contracts per tenant' as metric, tenant_id, COUNT(*) as count FROM contracts GROUP BY tenant_id ORDER BY count DESC;
SELECT 'Products per tenant' as metric, tenant_id, COUNT(*) as count FROM products GROUP BY tenant_id ORDER BY count DESC;

-- ============================================================================
-- 3. SUPER ADMIN BYPASS VALIDATION
-- ============================================================================

-- 3.1 Check for super admin bypass policies
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND (qual ILIKE '%is_super_admin%'
         OR qual ILIKE '%super_admin%'
         OR qual ILIKE '%admin%')
ORDER BY tablename, policyname;

-- 3.2 Check super admin user setup
SELECT
    id,
    email,
    role,
    is_super_admin,
    tenant_id
FROM users
WHERE is_super_admin = true OR role = 'super_admin'
ORDER BY email;

-- 3.3 Validate super admin tenant access (should be null or access all)
SELECT
    'Super admin tenant access validation' as check_type,
    COUNT(*) as super_admin_users,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM users
WHERE is_super_admin = true OR role = 'super_admin';

-- ============================================================================
-- 4. CROSS-TENANT ACCESS PREVENTION
-- ============================================================================

-- 4.1 Check for policies that prevent cross-tenant access
SELECT
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND qual ILIKE '%tenant_id%'
ORDER BY tablename, policyname;

-- 4.2 Validate tenant isolation in policies (look for tenant_id = current_user_tenant_id patterns)
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    CASE
        WHEN qual ILIKE '%tenant_id%' AND qual ILIKE '%current%' THEN 'Uses tenant isolation function'
        WHEN qual ILIKE '%tenant_id%' AND qual ILIKE '%auth%' THEN 'Uses auth-based tenant check'
        ELSE 'Other tenant check'
    END as isolation_method
FROM pg_policies
WHERE schemaname = 'public'
    AND qual ILIKE '%tenant_id%'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. RLS POLICY COMPREHENSIVENESS CHECK
-- ============================================================================

-- 5.1 Tables with RLS enabled but missing policies for certain operations
WITH table_operations AS (
    SELECT
        schemaname,
        tablename,
        unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as operation
    FROM pg_tables
    WHERE schemaname = 'public'
        AND rowsecurity = true
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma_%'
),
existing_policies AS (
    SELECT
        schemaname,
        tablename,
        cmd as operation
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT
    t.schemaname,
    t.tablename,
    t.operation,
    CASE
        WHEN p.operation IS NOT NULL THEN 'Policy exists'
        ELSE 'Missing policy'
    END as policy_status
FROM table_operations t
LEFT JOIN existing_policies p ON t.schemaname = p.schemaname
    AND t.tablename = p.tablename
    AND t.operation = p.operation
ORDER BY t.tablename, t.operation;

-- 5.2 Tables without RLS (should be minimal and justified)
SELECT
    schemaname,
    tablename,
    'No RLS' as rls_status,
    'Check if this is intentional' as note
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_prisma_%'
    AND tablename NOT IN ('tenants', 'roles', 'permissions', 'role_permissions') -- Core auth tables might not need RLS
ORDER BY tablename;

-- ============================================================================
-- 6. POLICY LOGIC VALIDATION
-- ============================================================================

-- 6.1 Check for policies with complex WHERE conditions
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    CASE
        WHEN qual LIKE '%OR%' THEN 'Has OR conditions'
        WHEN qual LIKE '%AND%' THEN 'Has AND conditions'
        WHEN qual LIKE '%NOT%' THEN 'Has NOT conditions'
        ELSE 'Simple conditions'
    END as complexity
FROM pg_policies
WHERE schemaname = 'public'
    AND qual IS NOT NULL
ORDER BY tablename, policyname;

-- 6.2 Check for policies with WITH CHECK clauses
SELECT
    schemaname,
    tablename,
    policyname,
    with_check,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has data validation'
        ELSE 'No data validation'
    END as validation_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. ROLE-BASED ACCESS VALIDATION
-- ============================================================================

-- 7.1 Check policies that reference specific roles
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    qual,
    CASE
        WHEN roles IS NULL THEN 'Applies to all roles'
        WHEN 'anon' = ANY(roles) THEN 'Includes anonymous users'
        WHEN 'authenticated' = ANY(roles) THEN 'Requires authentication'
        ELSE 'Role-specific access'
    END as access_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7.2 Validate role hierarchy in policies
SELECT
    'Role hierarchy check' as validation_type,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN roles IS NULL THEN 1 END) as universal_policies,
    COUNT(CASE WHEN 'authenticated' = ANY(roles) THEN 1 END) as auth_required_policies,
    COUNT(CASE WHEN roles IS NOT NULL AND 'anon' != ALL(roles) THEN 1 END) as restricted_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- 8. DATA EXPORT RESTRICTIONS VALIDATION
-- ============================================================================

-- 8.1 Check for policies that might restrict bulk operations
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    CASE
        WHEN cmd = 'SELECT' AND qual LIKE '%LIMIT%' THEN 'Has row limits'
        WHEN cmd = 'SELECT' AND qual LIKE '%tenant_id%' THEN 'Tenant-restricted SELECT'
        ELSE 'Other SELECT restrictions'
    END as export_restrictions
FROM pg_policies
WHERE schemaname = 'public'
    AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 8.2 Check for tables that might need export controls
SELECT
    t.tablename,
    CASE
        WHEN t.rowsecurity THEN 'RLS Enabled - Export controlled'
        ELSE 'No RLS - Unrestricted export'
    END as export_control_status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE '_prisma_%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ============================================================================
-- 9. RLS PERFORMANCE CONSIDERATIONS
-- ============================================================================

-- 9.1 Check for policies that might impact performance
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    CASE
        WHEN qual LIKE '%SUBQUERY%' OR qual LIKE '%EXISTS%' THEN 'Uses subqueries - potential performance impact'
        WHEN qual LIKE '%IN (%' THEN 'Uses IN clause - check performance'
        WHEN qual LIKE '%JOIN%' THEN 'Uses joins - monitor performance'
        ELSE 'Simple conditions - good performance'
    END as performance_considerations
FROM pg_policies
WHERE schemaname = 'public'
    AND qual IS NOT NULL
ORDER BY tablename, policyname;

-- ============================================================================
-- 10. COMPREHENSIVE RLS HEALTH CHECK
-- ============================================================================

-- 10.1 Overall RLS health summary
SELECT
    'RLS Health Summary' as report_type,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_tables,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as rls_disabled_tables,
    ROUND(
        (COUNT(CASE WHEN rowsecurity THEN 1 END)::decimal / COUNT(*)::decimal) * 100, 2
    ) as rls_coverage_pct
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_prisma_%';

-- 10.2 Policy distribution summary
SELECT
    'Policy Distribution' as report_type,
    cmd as operation,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY policy_count DESC;

-- 10.3 Tables with most policies (potential complexity)
SELECT
    'Complex Tables' as report_type,
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(DISTINCT cmd, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 3
ORDER BY policy_count DESC;

-- 10.4 Final validation checklist
SELECT
    'RLS Validation Checklist' as checklist_type,
    'All tables have RLS enabled or justified exemption' as requirement,
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM pg_tables
            WHERE schemaname = 'public'
                AND rowsecurity = false
                AND tablename NOT LIKE 'pg_%'
                AND tablename NOT LIKE '_prisma_%'
                AND tablename NOT IN ('tenants', 'roles', 'permissions', 'role_permissions')
        ) = 0 THEN 'PASS'
        ELSE 'REVIEW'
    END as status
UNION ALL
SELECT
    'RLS Validation Checklist',
    'All tables have tenant isolation policies',
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM pg_tables t
            WHERE t.schemaname = 'public'
                AND t.rowsecurity = true
                AND t.tablename NOT LIKE 'pg_%'
                AND t.tablename NOT LIKE '_prisma_%'
                AND NOT EXISTS (
                    SELECT 1 FROM pg_policies p
                    WHERE p.schemaname = t.schemaname
                        AND p.tablename = t.tablename
                        AND p.qual ILIKE '%tenant_id%'
                )
        ) = 0 THEN 'PASS'
        ELSE 'REVIEW'
    END
UNION ALL
SELECT
    'RLS Validation Checklist',
    'Super admin bypass policies exist where needed',
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM pg_policies
            WHERE schemaname = 'public'
                AND (qual ILIKE '%is_super_admin%' OR qual ILIKE '%super_admin%')
        ) > 0 THEN 'PASS'
        ELSE 'REVIEW'
    END
UNION ALL
SELECT
    'RLS Validation Checklist',
    'All CRUD operations have policies for RLS tables',
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM (
                SELECT t.tablename, op.operation
                FROM pg_tables t
                CROSS JOIN (SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as operation) op
                WHERE t.schemaname = 'public'
                    AND t.rowsecurity = true
                    AND t.tablename NOT LIKE 'pg_%'
                    AND t.tablename NOT LIKE '_prisma_%'
                EXCEPT
                SELECT tablename, cmd
                FROM pg_policies
                WHERE schemaname = 'public'
            ) missing_policies
        ) = 0 THEN 'PASS'
        ELSE 'REVIEW'
    END;