-- ============================================================================
-- Roles Table Validation Script
-- Phase 4: Database Schema Validation - Roles Table
-- ============================================================================

-- 1. Verify all columns exist with correct types and constraints
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- 2. Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'roles'::regclass
ORDER BY conname;

-- 3. Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'roles'
ORDER BY indexname;

-- 4. Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'roles';

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
WHERE tablename = 'roles'
ORDER BY policyname;

-- 6. Test role hierarchy support - Check existing roles
SELECT
    r.id,
    r.name,
    r.description,
    r.tenant_id,
    r.is_system_role,
    r.permissions,
    t.name as tenant_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN tenants t ON r.tenant_id = t.id
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.description, r.tenant_id, r.is_system_role, r.permissions, t.name
ORDER BY r.is_system_role DESC, r.name;

-- 7. Test custom role functionality - Check system vs custom roles
SELECT
    'System Roles' as role_type,
    COUNT(*) as count
FROM roles
WHERE is_system_role = true
UNION ALL
SELECT
    'Custom Roles' as role_type,
    COUNT(*) as count
FROM roles
WHERE is_system_role = false;

-- 8. Validate permission storage - Check permissions JSONB structure
SELECT
    r.name,
    r.permissions,
    jsonb_array_length(r.permissions) as permission_count,
    CASE
        WHEN jsonb_array_length(r.permissions) > 0 THEN
            jsonb_agg(DISTINCT elem->>'resource') FILTER (WHERE elem->>'resource' IS NOT NULL)
        ELSE NULL
    END as resources
FROM roles r,
LATERAL jsonb_array_elements(r.permissions) AS elem
GROUP BY r.id, r.name, r.permissions
ORDER BY r.name;

-- 9. Check for orphaned roles (roles without tenants)
SELECT
    r.id,
    r.name,
    r.tenant_id,
    t.name as tenant_name
FROM roles r
LEFT JOIN tenants t ON r.tenant_id = t.id
WHERE t.id IS NULL;

-- 10. Verify triggers
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'roles'
ORDER BY trigger_name;

-- 11. Test unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'roles'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 12. Validate role-permission relationships
SELECT
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count,
    COUNT(p.id) as valid_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- 13. Check for roles with invalid tenant references
SELECT
    r.id,
    r.name,
    r.tenant_id
FROM roles r
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.id = r.tenant_id
);