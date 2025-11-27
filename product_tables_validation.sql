-- ============================================================================
-- Product Tables Validation Script
-- Phase 4: Database Schema Validation - Product Tables
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS TABLE VALIDATION
-- ============================================================================

-- 1.1 Verify products table columns
SELECT
    'products' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 1.2 Verify products table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
ORDER BY conname;

-- 1.3 Verify products table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

-- 1.4 Check products table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'products';

-- 1.5 Verify products table RLS policies
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
WHERE tablename = 'products'
ORDER BY policyname;

-- ============================================================================
-- 2. PRODUCT_CATEGORIES TABLE VALIDATION
-- ============================================================================

-- 2.1 Verify product_categories table columns
SELECT
    'product_categories' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'product_categories'
ORDER BY ordinal_position;

-- 2.2 Verify product_categories table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'product_categories'::regclass
ORDER BY conname;

-- 2.3 Verify product_categories table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'product_categories'
ORDER BY indexname;

-- 2.4 Check product_categories table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'product_categories';

-- 2.5 Verify product_categories table RLS policies
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
WHERE tablename = 'product_categories'
ORDER BY policyname;

-- ============================================================================
-- 3. INVENTORY TABLE VALIDATION
-- ============================================================================

-- 3.1 Verify inventory table columns
SELECT
    'inventory' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- 3.2 Verify inventory table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'inventory'::regclass
ORDER BY conname;

-- 3.3 Verify inventory table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'inventory'
ORDER BY indexname;

-- 3.4 Check inventory table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'inventory';

-- 3.5 Verify inventory table RLS policies
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
WHERE tablename = 'inventory'
ORDER BY policyname;

-- ============================================================================
-- 4. CROSS-TABLE RELATIONSHIP VALIDATION
-- ============================================================================

-- 4.1 Check for orphaned inventory (product relationship)
SELECT
    'Orphaned inventory (product)' as issue,
    COUNT(*) as count
FROM inventory i
LEFT JOIN products p ON i.product_id = p.id
WHERE p.id IS NULL;

-- 4.2 Check for orphaned products (category relationship)
SELECT
    'Orphaned products (category)' as issue,
    COUNT(*) as count
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.id IS NULL AND p.category_id IS NOT NULL;

-- 4.3 Check for orphaned product_categories (parent relationship)
SELECT
    'Orphaned product_categories (parent)' as issue,
    COUNT(*) as count
FROM product_categories pc
LEFT JOIN product_categories parent ON pc.parent_id = parent.id
WHERE parent.id IS NULL AND pc.parent_id IS NOT NULL;

-- 4.4 Verify tenant isolation across product tables
SELECT
    'Products per tenant' as metric,
    p.tenant_id,
    t.name as tenant_name,
    COUNT(*) as product_count
FROM products p
LEFT JOIN tenants t ON p.tenant_id = t.id
GROUP BY p.tenant_id, t.name
ORDER BY product_count DESC;

SELECT
    'Product categories per tenant' as metric,
    pc.tenant_id,
    t.name as tenant_name,
    COUNT(*) as category_count
FROM product_categories pc
LEFT JOIN tenants t ON pc.tenant_id = t.id
GROUP BY pc.tenant_id, t.name
ORDER BY category_count DESC;

SELECT
    'Inventory items per tenant' as metric,
    i.tenant_id,
    t.name as tenant_name,
    COUNT(*) as inventory_count
FROM inventory i
LEFT JOIN tenants t ON i.tenant_id = t.id
GROUP BY i.tenant_id, t.name
ORDER BY inventory_count DESC;

-- 4.5 Check category hierarchy
SELECT
    'Category hierarchy levels' as metric,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
    COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as sub_categories,
    MAX(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as max_depth
FROM product_categories;

-- ============================================================================
-- 5. DATA INTEGRITY VALIDATION
-- ============================================================================

-- 5.1 Check product data completeness
SELECT
    'Product data completeness' as check_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN sku IS NOT NULL THEN 1 END) as with_sku,
    COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as with_category,
    ROUND(
        (COUNT(CASE WHEN name IS NOT NULL AND sku IS NOT NULL THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as completeness_pct
FROM products;

-- 5.2 Check category data quality
SELECT
    'Category data quality' as check_type,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
    COUNT(DISTINCT name) as unique_names
FROM product_categories;

-- 5.3 Check inventory data quality
SELECT
    'Inventory data quality' as check_type,
    COUNT(*) as total_inventory,
    COUNT(CASE WHEN current_stock >= 0 THEN 1 END) as valid_stock,
    COUNT(CASE WHEN available_stock >= 0 THEN 1 END) as valid_available,
    COUNT(CASE WHEN stock_status IS NOT NULL THEN 1 END) as with_status,
    AVG(current_stock) as avg_stock,
    MIN(current_stock) as min_stock,
    MAX(current_stock) as max_stock
FROM inventory;

-- 5.4 Check inventory status distribution
SELECT
    'Inventory status distribution' as check_type,
    stock_status,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM inventory
GROUP BY stock_status
ORDER BY count DESC;

-- 5.5 Check product-category relationships
SELECT
    'Products per category' as metric,
    pc.name as category_name,
    COUNT(p.id) as product_count
FROM product_categories pc
LEFT JOIN products p ON pc.id = p.category_id
GROUP BY pc.id, pc.name
ORDER BY product_count DESC;

-- 5.6 Check inventory coverage
SELECT
    'Inventory coverage' as metric,
    COUNT(DISTINCT p.id) as products_with_inventory,
    COUNT(DISTINCT p2.id) as total_products,
    ROUND(
        (COUNT(DISTINCT p.id)::decimal / NULLIF(COUNT(DISTINCT p2.id), 0)::decimal) * 100, 2
    ) as coverage_pct
FROM products p2
LEFT JOIN inventory i ON p2.id = i.product_id
LEFT JOIN products p ON i.product_id = p.id;