-- ============================================================================
-- Customer Tables Validation Script
-- Phase 4: Database Schema Validation - Customer Tables
-- ============================================================================

-- ============================================================================
-- 1. CUSTOMERS TABLE VALIDATION
-- ============================================================================

-- 1.1 Verify customers table columns
SELECT
    'customers' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 1.2 Verify customers table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
ORDER BY conname;

-- 1.3 Verify customers table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
ORDER BY indexname;

-- 1.4 Check customers table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'customers';

-- 1.5 Verify customers table RLS policies
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
WHERE tablename = 'customers'
ORDER BY policyname;

-- ============================================================================
-- 2. CUSTOMER_INTERACTIONS TABLE VALIDATION
-- ============================================================================

-- 2.1 Verify customer_interactions table columns
SELECT
    'customer_interactions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customer_interactions'
ORDER BY ordinal_position;

-- 2.2 Verify customer_interactions table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'customer_interactions'::regclass
ORDER BY conname;

-- 2.3 Verify customer_interactions table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customer_interactions'
ORDER BY indexname;

-- 2.4 Check customer_interactions table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'customer_interactions';

-- 2.5 Verify customer_interactions table RLS policies
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
WHERE tablename = 'customer_interactions'
ORDER BY policyname;

-- ============================================================================
-- 3. CUSTOMER_PREFERENCES TABLE VALIDATION
-- ============================================================================

-- 3.1 Verify customer_preferences table columns
SELECT
    'customer_preferences' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customer_preferences'
ORDER BY ordinal_position;

-- 3.2 Verify customer_preferences table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'customer_preferences'::regclass
ORDER BY conname;

-- 3.3 Verify customer_preferences table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customer_preferences'
ORDER BY indexname;

-- 3.4 Check customer_preferences table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'customer_preferences';

-- 3.5 Verify customer_preferences table RLS policies
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
WHERE tablename = 'customer_preferences'
ORDER BY policyname;

-- ============================================================================
-- 4. CROSS-TABLE RELATIONSHIP VALIDATION
-- ============================================================================

-- 4.1 Check for orphaned customer_interactions
SELECT
    'Orphaned customer_interactions' as issue,
    COUNT(*) as count
FROM customer_interactions ci
LEFT JOIN customers c ON ci.customer_id = c.id
WHERE c.id IS NULL;

-- 4.2 Check for orphaned customer_preferences
SELECT
    'Orphaned customer_preferences' as issue,
    COUNT(*) as count
FROM customer_preferences cp
LEFT JOIN customers c ON cp.customer_id = c.id
WHERE c.id IS NULL;

-- 4.3 Verify tenant isolation across customer tables
SELECT
    'Customers per tenant' as metric,
    c.tenant_id,
    t.name as tenant_name,
    COUNT(*) as customer_count
FROM customers c
LEFT JOIN tenants t ON c.tenant_id = t.id
GROUP BY c.tenant_id, t.name
ORDER BY customer_count DESC;

-- 4.4 Check interaction distribution
SELECT
    'Interactions per customer' as metric,
    COUNT(DISTINCT ci.customer_id) as customers_with_interactions,
    COUNT(*) as total_interactions,
    ROUND(AVG(interaction_count), 2) as avg_interactions_per_customer
FROM (
    SELECT customer_id, COUNT(*) as interaction_count
    FROM customer_interactions
    GROUP BY customer_id
) ci;

-- 4.5 Check preference distribution
SELECT
    'Preferences per customer' as metric,
    COUNT(DISTINCT cp.customer_id) as customers_with_preferences,
    COUNT(*) as total_preferences,
    ROUND(AVG(preference_count), 2) as avg_preferences_per_customer
FROM (
    SELECT customer_id, COUNT(*) as preference_count
    FROM customer_preferences
    GROUP BY customer_id
) cp;

-- ============================================================================
-- 5. DATA INTEGRITY VALIDATION
-- ============================================================================

-- 5.1 Check customer data completeness
SELECT
    'Customer data completeness' as check_type,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    ROUND(
        (COUNT(CASE WHEN name IS NOT NULL THEN 1 END)::decimal / COUNT(*)::decimal) * 100, 2
    ) as name_completeness_pct
FROM customers;

-- 5.2 Check interaction data quality
SELECT
    'Interaction data quality' as check_type,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN interaction_type IS NOT NULL THEN 1 END) as with_type,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
    COUNT(DISTINCT interaction_type) as unique_types
FROM customer_interactions;

-- 5.3 Check preference data quality
SELECT
    'Preference data quality' as check_type,
    COUNT(*) as total_preferences,
    COUNT(CASE WHEN preference_key IS NOT NULL THEN 1 END) as with_key,
    COUNT(CASE WHEN preference_value IS NOT NULL THEN 1 END) as with_value,
    COUNT(DISTINCT preference_key) as unique_keys
FROM customer_preferences;