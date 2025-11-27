-- ============================================================================
-- Contract Tables Validation Script
-- Phase 4: Database Schema Validation - Contract Tables
-- ============================================================================

-- ============================================================================
-- 1. CONTRACTS TABLE VALIDATION
-- ============================================================================

-- 1.1 Verify contracts table columns
SELECT
    'contracts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;

-- 1.2 Verify contracts table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'contracts'::regclass
ORDER BY conname;

-- 1.3 Verify contracts table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'contracts'
ORDER BY indexname;

-- 1.4 Check contracts table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'contracts';

-- 1.5 Verify contracts table RLS policies
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
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================================================
-- 2. CONTRACT_VERSIONS TABLE VALIDATION
-- ============================================================================

-- 2.1 Verify contract_versions table columns
SELECT
    'contract_versions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'contract_versions'
ORDER BY ordinal_position;

-- 2.2 Verify contract_versions table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'contract_versions'::regclass
ORDER BY conname;

-- 2.3 Verify contract_versions table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'contract_versions'
ORDER BY indexname;

-- 2.4 Check contract_versions table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'contract_versions';

-- 2.5 Verify contract_versions table RLS policies
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
WHERE tablename = 'contract_versions'
ORDER BY policyname;

-- ============================================================================
-- 3. CONTRACT_TERMS TABLE VALIDATION
-- ============================================================================

-- 3.1 Verify contract_terms table columns
SELECT
    'contract_terms' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'contract_terms'
ORDER BY ordinal_position;

-- 3.2 Verify contract_terms table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'contract_terms'::regclass
ORDER BY conname;

-- 3.3 Verify contract_terms table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'contract_terms'
ORDER BY indexname;

-- 3.4 Check contract_terms table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'contract_terms';

-- 3.5 Verify contract_terms table RLS policies
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
WHERE tablename = 'contract_terms'
ORDER BY policyname;

-- ============================================================================
-- 4. CROSS-TABLE RELATIONSHIP VALIDATION
-- ============================================================================

-- 4.1 Check for orphaned contract_versions (contract relationship)
SELECT
    'Orphaned contract_versions (contract)' as issue,
    COUNT(*) as count
FROM contract_versions cv
LEFT JOIN contracts c ON cv.contract_id = c.id
WHERE c.id IS NULL;

-- 4.2 Check for orphaned contract_terms (contract relationship)
SELECT
    'Orphaned contract_terms (contract)' as issue,
    COUNT(*) as count
FROM contract_terms ct
LEFT JOIN contracts c ON ct.contract_id = c.id
WHERE c.id IS NULL;

-- 4.3 Check for orphaned contracts (customer relationship)
SELECT
    'Orphaned contracts (customer)' as issue,
    COUNT(*) as count
FROM contracts c
LEFT JOIN customers cu ON c.customer_id = cu.id
WHERE cu.id IS NULL AND c.customer_id IS NOT NULL;

-- 4.4 Check for orphaned contracts (created_by relationship)
SELECT
    'Orphaned contracts (created_by)' as issue,
    COUNT(*) as count
FROM contracts c
LEFT JOIN users u ON c.created_by = u.id
WHERE u.id IS NULL AND c.created_by IS NOT NULL;

-- 4.5 Check for orphaned contract_terms (approved_by relationship)
SELECT
    'Orphaned contract_terms (approved_by)' as issue,
    COUNT(*) as count
FROM contract_terms ct
LEFT JOIN users u ON ct.approved_by = u.id
WHERE u.id IS NULL AND ct.approved_by IS NOT NULL;

-- 4.6 Check for orphaned contract_versions (created_by relationship)
SELECT
    'Orphaned contract_versions (created_by)' as issue,
    COUNT(*) as count
FROM contract_versions cv
LEFT JOIN users u ON cv.created_by = u.id
WHERE u.id IS NULL AND cv.created_by IS NOT NULL;

-- 4.7 Verify tenant isolation across contract tables
SELECT
    'Contracts per tenant' as metric,
    c.tenant_id,
    t.name as tenant_name,
    COUNT(*) as contract_count
FROM contracts c
LEFT JOIN tenants t ON c.tenant_id = t.id
GROUP BY c.tenant_id, t.name
ORDER BY contract_count DESC;

SELECT
    'Contract versions per tenant' as metric,
    cv.tenant_id,
    t.name as tenant_name,
    COUNT(*) as version_count
FROM contract_versions cv
LEFT JOIN tenants t ON cv.tenant_id = t.id
GROUP BY cv.tenant_id, t.name
ORDER BY version_count DESC;

SELECT
    'Contract terms per tenant' as metric,
    ct.tenant_id,
    t.name as tenant_name,
    COUNT(*) as term_count
FROM contract_terms ct
LEFT JOIN tenants t ON ct.tenant_id = t.id
GROUP BY ct.tenant_id, t.name
ORDER BY term_count DESC;

-- ============================================================================
-- 5. DATA INTEGRITY VALIDATION
-- ============================================================================

-- 5.1 Check contract data completeness
SELECT
    'Contract data completeness' as check_type,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as with_title,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer,
    COUNT(CASE WHEN contract_value IS NOT NULL THEN 1 END) as with_value,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status,
    ROUND(
        (COUNT(CASE WHEN title IS NOT NULL AND customer_id IS NOT NULL THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as completeness_pct
FROM contracts;

-- 5.2 Check contract status distribution
SELECT
    'Contract status distribution' as check_type,
    status,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM contracts
GROUP BY status
ORDER BY count DESC;

-- 5.3 Check contract type distribution
SELECT
    'Contract type distribution' as check_type,
    contract_type,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM contracts
GROUP BY contract_type
ORDER BY count DESC;

-- 5.4 Check contract expiration analysis
SELECT
    'Contract expiration analysis' as check_type,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as expired,
    COUNT(CASE WHEN end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_30_days,
    COUNT(CASE WHEN end_date BETWEEN CURRENT_DATE + INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as expiring_90_days,
    COUNT(CASE WHEN end_date > CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as active_long_term,
    ROUND(
        (COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as expired_pct
FROM contracts
WHERE end_date IS NOT NULL;

-- 5.5 Check contract value analysis
SELECT
    'Contract value analysis' as check_type,
    COUNT(*) as total_contracts,
    AVG(contract_value) as avg_contract_value,
    MIN(contract_value) as min_contract_value,
    MAX(contract_value) as max_contract_value,
    SUM(contract_value) as total_contract_value
FROM contracts
WHERE contract_value IS NOT NULL;

-- 5.6 Check contract versioning
SELECT
    'Contract versioning' as check_type,
    COUNT(DISTINCT cv.contract_id) as contracts_with_versions,
    COUNT(*) as total_versions,
    ROUND(AVG(version_count), 2) as avg_versions_per_contract,
    MAX(version_count) as max_versions_per_contract
FROM (
    SELECT contract_id, COUNT(*) as version_count
    FROM contract_versions
    GROUP BY contract_id
) cv;

-- 5.7 Check contract terms analysis
SELECT
    'Contract terms analysis' as check_type,
    COUNT(DISTINCT ct.contract_id) as contracts_with_terms,
    COUNT(*) as total_terms,
    ROUND(AVG(term_count), 2) as avg_terms_per_contract,
    COUNT(DISTINCT term_type) as unique_term_types
FROM (
    SELECT contract_id, COUNT(*) as term_count
    FROM contract_terms
    GROUP BY contract_id
) ct;

-- 5.8 Check contract terms by type
SELECT
    'Contract terms by type' as check_type,
    term_type,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM contract_terms
GROUP BY term_type
ORDER BY count DESC;

-- 5.9 Check contract approval status
SELECT
    'Contract approval status' as check_type,
    COUNT(*) as total_terms,
    COUNT(CASE WHEN requires_approval = true THEN 1 END) as requires_approval,
    COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as approved,
    COUNT(CASE WHEN requires_approval = true AND approved_at IS NULL THEN 1 END) as pending_approval,
    ROUND(
        (COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END)::decimal / NULLIF(COUNT(CASE WHEN requires_approval = true THEN 1 END), 0)::decimal) * 100, 2
    ) as approval_completion_pct
FROM contract_terms;

-- 5.10 Check contract-customer relationship
SELECT
    'Contract-customer relationship' as check_type,
    COUNT(DISTINCT customer_id) as customers_with_contracts,
    COUNT(*) as total_contracts,
    ROUND(AVG(contract_count), 2) as avg_contracts_per_customer
FROM (
    SELECT customer_id, COUNT(*) as contract_count
    FROM contracts
    WHERE customer_id IS NOT NULL
    GROUP BY customer_id
) c;

-- 5.11 Check contract duration analysis
SELECT
    'Contract duration analysis' as check_type,
    AVG(EXTRACT(EPOCH FROM (end_date - start_date))/86400) as avg_duration_days,
    MIN(EXTRACT(EPOCH FROM (end_date - start_date))/86400) as min_duration_days,
    MAX(EXTRACT(EPOCH FROM (end_date - start_date))/86400) as max_duration_days
FROM contracts
WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date;

-- 5.12 Check contract renewal patterns
SELECT
    'Contract renewal patterns' as check_type,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN auto_renewal = true THEN 1 END) as auto_renewal_enabled,
    COUNT(CASE WHEN renewal_notice_days IS NOT NULL THEN 1 END) as with_renewal_notices,
    AVG(renewal_notice_days) as avg_renewal_notice_days
FROM contracts;