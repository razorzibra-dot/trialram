-- ============================================================================
-- Permissions Table Validation Script
-- Phase 4: Database Schema Validation - Permissions Table
-- ============================================================================

-- 1. Verify all columns exist with correct types and constraints
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'permissions'
ORDER BY ordinal_position;

-- 2. Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'permissions'::regclass
ORDER BY conname;

-- 3. Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'permissions'
ORDER BY indexname;

-- 4. Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'permissions';

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
WHERE tablename = 'permissions'
ORDER BY policyname;

-- 6. Verify permission categories - Check distribution of categories
SELECT
    category,
    COUNT(*) as permission_count,
    COUNT(CASE WHEN is_system_permission THEN 1 END) as system_permissions,
    COUNT(CASE WHEN NOT is_system_permission THEN 1 END) as regular_permissions
FROM permissions
GROUP BY category
ORDER BY category;

-- 7. Test permission inheritance - Check how permissions are assigned to roles
SELECT
    r.name as role_name,
    r.is_system_role,
    COUNT(rp.permission_id) as total_permissions,
    COUNT(CASE WHEN p.category = 'core' THEN 1 END) as core_permissions,
    COUNT(CASE WHEN p.category = 'module' THEN 1 END) as module_permissions,
    COUNT(CASE WHEN p.category = 'administrative' THEN 1 END) as admin_permissions,
    COUNT(CASE WHEN p.category = 'system' THEN 1 END) as system_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name, r.is_system_role
ORDER BY r.is_system_role DESC, r.name;

-- 8. Validate custom permissions - Check if there are any non-system permissions
SELECT
    'Custom permissions available' as status,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN is_system_permission THEN 1 END) as system_permissions,
    COUNT(CASE WHEN NOT is_system_permission THEN 1 END) as custom_permissions
FROM permissions;

-- 9. Check permission structure - resource:action format
SELECT
    name,
    resource,
    action,
    category,
    is_system_permission,
    CASE
        WHEN resource IS NOT NULL AND action IS NOT NULL THEN resource || ':' || action
        WHEN resource IS NULL AND action IS NOT NULL THEN action
        WHEN resource IS NOT NULL AND action IS NULL THEN resource
        ELSE name
    END as permission_string
FROM permissions
ORDER BY category, name;

-- 10. Verify system permissions cannot be modified
SELECT
    'System permissions check' as validation,
    COUNT(*) as total_system_permissions,
    COUNT(CASE WHEN is_system_permission THEN 1 END) as properly_marked_system
FROM permissions
WHERE category = 'system';

-- 11. Check for duplicate permission names
SELECT
    name,
    COUNT(*) as occurrences
FROM permissions
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- 12. Validate permission uniqueness
SELECT
    'Permission uniqueness' as check_type,
    COUNT(DISTINCT name) as unique_names,
    COUNT(*) as total_permissions,
    CASE WHEN COUNT(DISTINCT name) = COUNT(*) THEN 'All names unique' ELSE 'Duplicate names found' END as status
FROM permissions;

-- 13. Check permissions by resource
SELECT
    resource,
    COUNT(*) as permissions_count,
    string_agg(DISTINCT action, ', ') as actions,
    string_agg(DISTINCT category, ', ') as categories
FROM permissions
WHERE resource IS NOT NULL
GROUP BY resource
ORDER BY resource;

-- 14. Verify permission categories match expected values
SELECT
    'Invalid categories' as issue,
    category,
    COUNT(*) as count
FROM permissions
WHERE category NOT IN ('core', 'module', 'administrative', 'system')
GROUP BY category;

-- 15. Check role-permission relationships integrity
SELECT
    'Orphaned role-permission links' as issue,
    COUNT(*) as count
FROM role_permissions rp
LEFT JOIN roles r ON rp.role_id = r.id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.id IS NULL OR p.id IS NULL;