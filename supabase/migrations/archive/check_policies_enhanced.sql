-- ============================================================================
-- ENHANCED RLS POLICIES VALIDATION SCRIPT
-- Task: 4.1.2 - Enhance check_policies.sql scope
-- Task: 4.1.3 - Add permission format validation
-- ============================================================================

-- ============================================================================
-- SECTION 1: RLS POLICIES COMPREHENSIVE OVERVIEW
-- ============================================================================

-- Enhanced RLS policies overview (original content preserved and enhanced)
SELECT 
    'RLS_POLICIES_OVERVIEW' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression,
    cmd as command_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 2: RLS ENABLEMENT STATUS
-- ============================================================================

-- Check which tables have RLS enabled
SELECT 
    'RLS_ENABLED_TABLES' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- ============================================================================
-- SECTION 3: TENANT ISOLATION POLICIES
-- ============================================================================

-- Check tenant isolation policies specifically
SELECT 
    'TENANT_ISOLATION_POLICIES' as section,
    tablename,
    policyname,
    permissive,
    qual as using_expression,
    CASE 
        WHEN qual ILIKE '%tenant_id%' THEN '✅ HAS TENANT ISOLATION'
        WHEN qual ILIKE '%tenant%' THEN '✅ TENANT REFERENCE'
        ELSE '⚠️ NO TENANT ISOLATION'
    END as isolation_status
FROM pg_policies 
WHERE schemaname = 'public'
    AND (
        tablename IN ('customers', 'sales', 'contracts', 'audit_logs', 'reference_data')
        OR policyname ILIKE '%tenant%'
        OR qual ILIKE '%tenant%'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 4: CRITICAL TABLE POLICIES
-- ============================================================================

-- Policies for critical business tables
SELECT 
    'CRITICAL_TABLE_POLICIES' as section,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    CASE 
        WHEN cmd = 'ALL' THEN 'Full Access'
        WHEN cmd = 'SELECT' THEN 'Read Only'
        WHEN cmd = 'INSERT' THEN 'Create Only'
        WHEN cmd = 'UPDATE' THEN 'Update Only'
        WHEN cmd = 'DELETE' THEN 'Delete Only'
        ELSE cmd
    END as access_level
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('customers', 'sales', 'contracts', 'users', 'audit_logs')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 5: USER CONTEXT POLICIES
-- ============================================================================

-- Policies that use user context (auth.uid())
SELECT 
    'USER_CONTEXT_POLICIES' as section,
    tablename,
    policyname,
    qual as using_expression,
    CASE 
        WHEN qual ILIKE '%auth.uid%' THEN '✅ AUTH CONTEXT'
        WHEN qual ILIKE '%user_id%' THEN '✅ USER ID CONTEXT'
        WHEN qual ILIKE '%current_user%' THEN '✅ CURRENT USER'
        ELSE '⚠️ NO USER CONTEXT'
    END as user_context_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 6: PERMISSION-BASED POLICIES
-- ============================================================================

-- Policies that implement permission checks
SELECT 
    'PERMISSION_BASED_POLICIES' as section,
    tablename,
    policyname,
    qual as using_expression,
    CASE 
        WHEN qual ILIKE '%permission%' THEN '✅ PERMISSION CHECK'
        WHEN qual ILIKE '%role%' THEN '✅ ROLE CHECK'
        WHEN qual ILIKE '%has_%' THEN '✅ HAS_PERMISSION FUNCTION'
        ELSE 'Standard Policy'
    END as permission_implementation
FROM pg_policies 
WHERE schemaname = 'public'
    AND (
        qual ILIKE '%permission%' 
        OR qual ILIKE '%role%' 
        OR qual ILIKE '%has_%'
        OR policyname ILIKE '%permission%'
        OR policyname ILIKE '%role%'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 7: POLICY COMPLETENESS ANALYSIS
-- ============================================================================

-- Policy coverage analysis by table
SELECT 
    'POLICY_COVERAGE_ANALYSIS' as section,
    t.tablename,
    CASE 
        WHEN t.rowsecurity THEN 'RLS ENABLED'
        ELSE 'RLS DISABLED'
    END as rls_status,
    COUNT(p.policyname) as policy_count,
    STRING_AGG(p.cmd, ', ' ORDER BY p.cmd) as commands_covered,
    CASE 
        WHEN COUNT(p.policyname) >= 4 THEN '✅ COMPREHENSIVE'
        WHEN COUNT(policyname) >= 2 THEN '⚠️ PARTIAL'
        WHEN COUNT(policyname) = 1 THEN '❌ MINIMAL'
        WHEN t.rowsecurity THEN '❌ NO POLICIES'
        ELSE 'ℹ️ RLS DISABLED'
    END as coverage_rating
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename 
    AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
    CASE 
        WHEN t.rowsecurity THEN 1 
        ELSE 2 
    END,
    t.tablename;

-- ============================================================================
-- SECTION 8: SECURITY GAPS ANALYSIS
-- ============================================================================

-- Identify potential security gaps
SELECT 
    'SECURITY_GAPS' as section,
    'NO_RLS_ENABLED' as gap_type,
    t.tablename as table_name,
    'Table has no Row Level Security enabled' as description,
    'HIGH' as risk_level
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.rowsecurity = false
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
    AND t.tablename NOT IN ('permissions', 'roles') -- System tables

UNION ALL

SELECT 
    'SECURITY_GAPS' as section,
    'NO_TENANT_ISOLATION' as gap_type,
    p.tablename as table_name,
    'Table lacks tenant isolation policy' as description,
    'HIGH' as risk_level
FROM pg_policies p
WHERE p.schemaname = 'public'
    AND p.tablename IN ('customers', 'sales', 'contracts', 'audit_logs')
    AND (p.qual NOT ILIKE '%tenant_id%' AND p.policyname NOT ILIKE '%tenant%')

UNION ALL

SELECT 
    'SECURITY_GAPS' as section,
    'MISSING_POLICIES' as gap_type,
    t.tablename as table_name,
    'Table has RLS enabled but no policies defined' as description,
    'CRITICAL' as risk_level
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename 
    AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND p.policyname IS NULL
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'

ORDER BY 
    CASE risk_level
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
    END,
    gap_type;

-- ============================================================================
-- SECTION 9: POLICY PERFORMANCE ANALYSIS
-- ============================================================================

-- Check for potentially problematic policy expressions
SELECT 
    'POLICY_PERFORMANCE' as section,
    tablename,
    policyname,
    LENGTH(qual) as expression_length,
    CASE 
        WHEN LENGTH(qual) > 500 THEN '⚠️ LONG EXPRESSION'
        WHEN LENGTH(qual) > 200 THEN '⚠️ MEDIUM EXPRESSION'
        ELSE '✅ REASONABLE LENGTH'
    END as performance_rating,
    qual as expression_preview
FROM pg_policies 
WHERE schemaname = 'public'
    AND LENGTH(qual) > 100
ORDER BY LENGTH(qual) DESC, tablename;

-- ============================================================================
-- SECTION 10: COMPLIANCE AND AUDIT
-- ============================================================================

-- Policy compliance summary
SELECT 
    'POLICY_COMPLIANCE_SUMMARY' as section,
    'Total RLS Enabled Tables' as metric,
    COUNT(*)::TEXT as value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
    'POLICY_COMPLIANCE_SUMMARY' as section,
    'Total Policies Defined' as metric,
    COUNT(*)::TEXT as value
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'POLICY_COMPLIANCE_SUMMARY' as section,
    'Tables with Tenant Isolation' as metric,
    COUNT(DISTINCT tablename)::TEXT as value
FROM pg_policies 
WHERE schemaname = 'public'
    AND (qual ILIKE '%tenant_id%' OR policyname ILIKE '%tenant%')

UNION ALL

SELECT 
    'POLICY_COMPLIANCE_SUMMARY' as section,
    'Critical Security Gaps' as metric,
    COUNT(*)::TEXT as value
FROM (
    SELECT t.tablename
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename 
        AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
        AND p.policyname IS NULL
    UNION
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
        AND t.rowsecurity = false
        AND t.tablename IN ('customers', 'sales', 'contracts', 'audit_logs')
) gaps;

-- ============================================================================
-- SECTION 11: RLS POLICY STATISTICS
-- ============================================================================

-- Detailed policy statistics
SELECT 
    'POLICY_STATISTICS' as section,
    tablename,
    permissive,
    cmd as command_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, permissive, cmd
ORDER BY tablename, cmd;