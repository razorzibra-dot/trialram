-- ============================================================================
-- Users Table Validation Script
-- Phase 4: Database Schema Validation - Users Table
-- ============================================================================

-- 1. Verify all columns exist with correct types and constraints
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- 3. Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- 4. Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- 5. Verify RLS policies
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
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. Test data validation rules - Check existing data
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'super_admin' AND tenant_id IS NOT NULL THEN 1 END) as invalid_super_admins,
    COUNT(CASE WHEN role != 'super_admin' AND tenant_id IS NULL THEN 1 END) as invalid_regular_users,
    COUNT(CASE WHEN failed_login_attempts < 0 THEN 1 END) as invalid_failed_attempts,
    COUNT(CASE WHEN concurrent_sessions_limit <= 0 OR concurrent_sessions_limit > 20 THEN 1 END) as invalid_session_limits,
    COUNT(CASE WHEN password_strength_score < 0 OR password_strength_score > 100 THEN 1 END) as invalid_password_scores
FROM users;

-- 7. Verify enum types
SELECT
    n.nspname AS schema_name,
    t.typname AS type_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typname IN ('user_role', 'user_status')
ORDER BY t.typname, e.enumsortorder;

-- 8. Check for any orphaned records (users without tenants, except super_admins)
SELECT
    u.id,
    u.email,
    u.role,
    u.tenant_id,
    t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE (u.role != 'super_admin' AND u.tenant_id IS NULL)
   OR (u.role = 'super_admin' AND u.tenant_id IS NOT NULL)
LIMIT 10;

-- 9. Verify triggers
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- 10. Test sample data integrity
SELECT
    'Sample user validation' as test,
    COUNT(*) as users_with_valid_emails
FROM users
WHERE email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- 11. Check unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.constraint_name, kcu.ordinal_position;