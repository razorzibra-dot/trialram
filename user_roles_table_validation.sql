-- ============================================================================
-- User Roles Table Validation Script
-- Phase 4: Database Schema Validation - User Roles Table
-- ============================================================================

-- 1. Verify all columns exist with correct types and constraints
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_roles'::regclass
ORDER BY conname;

-- 3. Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_roles'
ORDER BY indexname;

-- 4. Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

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
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 6. Test many-to-many relationship - Check user-role assignments
SELECT
    ur.id,
    u.email as user_email,
    r.name as role_name,
    ur.tenant_id,
    t.name as tenant_name,
    ur.assigned_at,
    ur.assigned_by
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN tenants t ON ur.tenant_id = t.id
ORDER BY ur.assigned_at DESC
LIMIT 20;

-- 7. Verify assignment tracking - Check assignment metadata
SELECT
    'Total assignments' as metric,
    COUNT(*) as value
FROM user_roles
UNION ALL
SELECT
    'Assignments with assigned_by' as metric,
    COUNT(*) as value
FROM user_roles
WHERE assigned_by IS NOT NULL
UNION ALL
SELECT
    'Assignments by super_admin' as metric,
    COUNT(*) as value
FROM user_roles ur
JOIN users u ON ur.assigned_by = u.id
WHERE u.role = 'super_admin'
UNION ALL
SELECT
    'Assignments by admin' as metric,
    COUNT(*) as value
FROM user_roles ur
JOIN users u ON ur.assigned_by = u.id
WHERE u.role = 'admin';

-- 8. Test expiration handling - Check if there are any expiration fields (there shouldn't be based on schema)
SELECT
    column_name
FROM information_schema.columns
WHERE table_name = 'user_roles'
    AND column_name LIKE '%expir%';

-- 9. Check for orphaned user_role assignments
SELECT
    'Orphaned user references' as issue,
    COUNT(*) as count
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT
    'Orphaned role references' as issue,
    COUNT(*) as count
FROM user_roles ur
LEFT JOIN roles r ON ur.role_id = r.id
WHERE r.id IS NULL
UNION ALL
SELECT
    'Orphaned tenant references' as issue,
    COUNT(*) as count
FROM user_roles ur
LEFT JOIN tenants t ON ur.tenant_id = t.id
WHERE t.id IS NULL;

-- 10. Verify tenant isolation in assignments
SELECT
    ur.tenant_id,
    t.name as tenant_name,
    COUNT(*) as assignments_in_tenant,
    COUNT(DISTINCT ur.user_id) as unique_users,
    COUNT(DISTINCT ur.role_id) as unique_roles
FROM user_roles ur
LEFT JOIN tenants t ON ur.tenant_id = t.id
GROUP BY ur.tenant_id, t.name
ORDER BY assignments_in_tenant DESC;

-- 11. Check for users with multiple roles
SELECT
    u.email,
    u.name,
    COUNT(ur.role_id) as role_count,
    string_agg(r.name, ', ') as roles,
    ur.tenant_id,
    t.name as tenant_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN tenants t ON ur.tenant_id = t.id
GROUP BY u.id, u.email, u.name, ur.tenant_id, t.name
HAVING COUNT(ur.role_id) > 1
ORDER BY role_count DESC;

-- 12. Verify unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_roles'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 13. Check assignment timestamps
SELECT
    'Oldest assignment' as metric,
    MIN(assigned_at) as value
FROM user_roles
UNION ALL
SELECT
    'Newest assignment' as metric,
    MAX(assigned_at) as value
FROM user_roles
UNION ALL
SELECT
    'Assignments in last 24h' as metric,
    COUNT(*)::text as value
FROM user_roles
WHERE assigned_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- 14. Validate that all users have at least one role assignment
SELECT
    'Users without roles' as issue,
    COUNT(*) as count
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
)
AND u.deleted_at IS NULL;

-- 15. Check role assignment consistency (user tenant_id should match user_roles tenant_id)
SELECT
    'Tenant mismatches' as issue,
    COUNT(*) as count
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE ur.tenant_id != u.tenant_id
    AND u.role != 'super_admin'; -- super_admins can have null tenant_id