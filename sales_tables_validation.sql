-- ============================================================================
-- Sales Tables Validation Script
-- Phase 4: Database Schema Validation - Sales Tables
-- ============================================================================

-- ============================================================================
-- 1. LEADS TABLE VALIDATION
-- ============================================================================

-- 1.1 Verify leads table columns
SELECT
    'leads' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 1.2 Verify leads table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
ORDER BY conname;

-- 1.3 Verify leads table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
ORDER BY indexname;

-- 1.4 Check leads table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'leads';

-- 1.5 Verify leads table RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- ============================================================================
-- 2. OPPORTUNITIES TABLE VALIDATION
-- ============================================================================

-- 2.1 Verify opportunities table columns
SELECT
    'opportunities' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'opportunities'
ORDER BY ordinal_position;

-- 2.2 Verify opportunities table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'opportunities'::regclass
ORDER BY conname;

-- 2.3 Verify opportunities table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'opportunities'
ORDER BY indexname;

-- 2.4 Check opportunities table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'opportunities';

-- 2.5 Verify opportunities table RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'opportunities'
ORDER BY policyname;

-- ============================================================================
-- 3. SALES TABLE VALIDATION (DEALS)
-- ============================================================================

-- 3.1 Verify sales table columns
SELECT
    'sales' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- 3.2 Verify sales table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'sales'::regclass
ORDER BY conname;

-- 3.3 Verify sales table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sales'
ORDER BY indexname;

-- 3.4 Check sales table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'sales';

-- 3.5 Verify sales table RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY policyname;

-- ============================================================================
-- 4. SALES_ACTIVITIES TABLE VALIDATION
-- ============================================================================

-- 4.1 Verify sales_activities table columns
SELECT
    'sales_activities' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'sales_activities'
ORDER BY ordinal_position;

-- 4.2 Verify sales_activities table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'sales_activities'::regclass
ORDER BY conname;

-- 4.3 Verify sales_activities table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sales_activities'
ORDER BY indexname;

-- 4.4 Check sales_activities table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'sales_activities';

-- 4.5 Verify sales_activities table RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'sales_activities'
ORDER BY policyname;

-- ============================================================================
-- 5. CROSS-TABLE RELATIONSHIP VALIDATION
-- ============================================================================

-- 5.1 Check for orphaned opportunities (customer relationship)
SELECT
    'Orphaned opportunities (customer)' as issue,
    COUNT(*) as count
FROM opportunities o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE c.id IS NULL AND o.customer_id IS NOT NULL;

-- 5.2 Check for orphaned opportunities (lead relationship)
SELECT
    'Orphaned opportunities (lead)' as issue,
    COUNT(*) as count
FROM opportunities o
LEFT JOIN leads l ON o.lead_id = l.id
WHERE l.id IS NULL AND o.lead_id IS NOT NULL;

-- 5.3 Check for orphaned opportunities (sale relationship)
SELECT
    'Orphaned opportunities (sale)' as issue,
    COUNT(*) as count
FROM opportunities o
LEFT JOIN sales s ON o.sale_id = s.id
WHERE s.id IS NULL AND o.sale_id IS NOT NULL;

-- 5.4 Check for orphaned sales_activities (sale relationship)
SELECT
    'Orphaned sales_activities (sale)' as issue,
    COUNT(*) as count
FROM sales_activities sa
LEFT JOIN sales s ON sa.sale_id = s.id
WHERE s.id IS NULL AND sa.sale_id IS NOT NULL;

-- 5.5 Check for orphaned sales_activities (opportunity relationship)
SELECT
    'Orphaned sales_activities (opportunity)' as issue,
    COUNT(*) as count
FROM sales_activities sa
LEFT JOIN opportunities o ON sa.opportunity_id = o.id
WHERE o.id IS NULL AND sa.opportunity_id IS NOT NULL;

-- 5.6 Check for orphaned sales_activities (customer relationship)
SELECT
    'Orphaned sales_activities (customer)' as issue,
    COUNT(*) as count
FROM sales_activities sa
LEFT JOIN customers c ON sa.customer_id = c.id
WHERE c.id IS NULL AND sa.customer_id IS NOT NULL;

-- 5.7 Verify tenant isolation across sales tables
SELECT
    'Leads per tenant' as metric,
    l.tenant_id,
    t.name as tenant_name,
    COUNT(*) as lead_count
FROM leads l
LEFT JOIN tenants t ON l.tenant_id = t.id
GROUP BY l.tenant_id, t.name
ORDER BY lead_count DESC;

SELECT
    'Opportunities per tenant' as metric,
    o.tenant_id,
    t.name as tenant_name,
    COUNT(*) as opportunity_count
FROM opportunities o
LEFT JOIN tenants t ON o.tenant_id = t.id
GROUP BY o.tenant_id, t.name
ORDER BY opportunity_count DESC;

SELECT
    'Sales per tenant' as metric,
    s.tenant_id,
    t.name as tenant_name,
    COUNT(*) as sale_count
FROM sales s
LEFT JOIN tenants t ON s.tenant_id = t.id
GROUP BY s.tenant_id, t.name
ORDER BY sale_count DESC;

SELECT
    'Sales activities per tenant' as metric,
    sa.tenant_id,
    t.name as tenant_name,
    COUNT(*) as activity_count
FROM sales_activities sa
LEFT JOIN tenants t ON sa.tenant_id = t.id
GROUP BY sa.tenant_id, t.name
ORDER BY activity_count DESC;

-- ============================================================================
-- 6. DATA INTEGRITY VALIDATION
-- ============================================================================

-- 6.1 Check lead data completeness
SELECT
    'Lead data completeness' as check_type,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN first_name IS NOT NULL OR last_name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    ROUND(
        (COUNT(CASE WHEN (first_name IS NOT NULL OR last_name IS NOT NULL) THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as name_completeness_pct
FROM leads;

-- 6.2 Check opportunity data quality
SELECT
    'Opportunity data quality' as check_type,
    COUNT(*) as total_opportunities,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as with_title,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer,
    COUNT(CASE WHEN estimated_value IS NOT NULL THEN 1 END) as with_value,
    COUNT(DISTINCT stage) as unique_stages,
    COUNT(DISTINCT status) as unique_statuses
FROM opportunities;

-- 6.3 Check sales data quality
SELECT
    'Sales data quality' as check_type,
    COUNT(*) as total_sales,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as with_title,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer,
    COUNT(CASE WHEN value IS NOT NULL THEN 1 END) as with_value,
    COUNT(DISTINCT stage) as unique_stages,
    COUNT(DISTINCT status) as unique_statuses
FROM sales;

-- 6.4 Check sales activities data quality
SELECT
    'Sales activities data quality' as check_type,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN type IS NOT NULL THEN 1 END) as with_type,
    COUNT(CASE WHEN subject IS NOT NULL THEN 1 END) as with_subject,
    COUNT(DISTINCT type) as unique_types
FROM sales_activities;

-- 6.5 Check sales pipeline metrics
SELECT
    'Sales pipeline metrics' as check_type,
    COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) as won_opportunities,
    COUNT(CASE WHEN stage = 'closed_lost' THEN 1 END) as lost_opportunities,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as won_sales,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_sales,
    ROUND(
        (COUNT(CASE WHEN stage = 'closed_won' THEN 1 END)::decimal /
         NULLIF(COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END), 0)::decimal) * 100, 2
    ) as opportunity_win_rate_pct,
    ROUND(
        (COUNT(CASE WHEN status = 'won' THEN 1 END)::decimal /
         NULLIF(COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END), 0)::decimal) * 100, 2
    ) as sales_win_rate_pct
FROM opportunities o
FULL OUTER JOIN sales s ON 1=1;