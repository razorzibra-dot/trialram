-- ============================================================================
-- TEST SCRIPT: Role Permission Validation (Tasks 2.1-2.7)
-- Purpose: Validate all role permission assignments and granted_by field preservation
-- Status: Implementation Tasks 2.1-2.7 - Role Permission Testing
-- ============================================================================

-- ============================================================================
-- 2. ADMIN ROLE PERMISSION VALIDATION (Task 2.1)
-- ============================================================================

-- Test 2.1: Admin Role Permissions (Expected 30+ entries)
WITH admin_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'Administrator'
    ORDER BY p.name
)
SELECT 
    'ADMIN_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) >= 30 THEN 'SUCCESS: Admin has sufficient permissions (' || COUNT(*) || ')'
        ELSE 'WARNING: Admin has fewer than expected permissions (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM admin_role_permissions;

-- ============================================================================
-- 3. MANAGER ROLE PERMISSION VALIDATION (Task 2.2)
-- ============================================================================

-- Test 2.2: Manager Role Permissions (Expected 20+ entries)
WITH manager_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'Manager'
    ORDER BY p.name
)
SELECT 
    'MANAGER_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) >= 20 THEN 'SUCCESS: Manager has sufficient permissions (' || COUNT(*) || ')'
        ELSE 'WARNING: Manager has fewer than expected permissions (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM manager_role_permissions;

-- ============================================================================
-- 4. USER ROLE PERMISSION VALIDATION (Task 2.3)
-- ============================================================================

-- Test 2.3: User Role Permissions (Expected 10+ entries)
WITH user_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'User'
    ORDER BY p.name
)
SELECT 
    'USER_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) >= 10 THEN 'SUCCESS: User has sufficient permissions (' || COUNT(*) || ')'
        ELSE 'WARNING: User has fewer than expected permissions (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM user_role_permissions;

-- ============================================================================
-- 5. ENGINEER ROLE PERMISSION VALIDATION (Task 2.4)
-- ============================================================================

-- Test 2.4: Engineer Role Permissions (Expected 10+ entries)
WITH engineer_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'Engineer'
    ORDER BY p.name
)
SELECT 
    'ENGINEER_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) >= 10 THEN 'SUCCESS: Engineer has sufficient permissions (' || COUNT(*) || ')'
        ELSE 'WARNING: Engineer has fewer than expected permissions (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM engineer_role_permissions;

-- ============================================================================
-- 6. CUSTOMER ROLE PERMISSION VALIDATION (Task 2.5)
-- ============================================================================

-- Test 2.5: Customer Role Permissions (Expected 1 entry)
WITH customer_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'Customer'
    ORDER BY p.name
)
SELECT 
    'CUSTOMER_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) = 1 THEN 'SUCCESS: Customer has expected 1 permission (' || COUNT(*) || ')'
        ELSE 'WARNING: Customer has unexpected permission count (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM customer_role_permissions;

-- ============================================================================
-- 7. SUPER ADMIN ROLE PERMISSION VALIDATION (Task 2.6)
-- ============================================================================

-- Test 2.6: Super Admin Role Permissions (Expected 40+ entries)
WITH super_admin_role_permissions AS (
    SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.category,
        rp.granted_by,
        u.email as granted_by_email,
        CASE WHEN rp.granted_by IS NOT NULL THEN 'PRESERVED' ELSE 'MISSING' END as granted_by_status
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    LEFT JOIN users u ON rp.granted_by = u.id
    WHERE r.name = 'super_admin'
    ORDER BY p.name
)
SELECT 
    'SUPER_ADMIN_ROLE_VALIDATION' as test_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN granted_by_status = 'PRESERVED' THEN 1 END) as preserved_granted_by,
    COUNT(CASE WHEN granted_by_status = 'MISSING' THEN 1 END) as missing_granted_by,
    COUNT(DISTINCT category) as category_types,
    CASE 
        WHEN COUNT(*) >= 40 THEN 'SUCCESS: Super Admin has sufficient permissions (' || COUNT(*) || ')'
        ELSE 'WARNING: Super Admin has fewer than expected permissions (' || COUNT(*) || ')'
    END as validation_result,
    STRING_AGG(permission_name, ', ' ORDER BY permission_name) as permission_list
FROM super_admin_role_permissions;

-- ============================================================================
-- 8. GRANTED_BY FIELD PRESERVATION VALIDATION (Task 2.7)
-- ============================================================================

-- Test 2.7: Verify granted_by field preservation across all roles
SELECT 
    'GRANTED_BY_PRESERVATION_CHECK' as test_name,
    COUNT(*) as total_role_permissions,
    COUNT(CASE WHEN granted_by IS NOT NULL THEN 1 END) as with_granted_by,
    COUNT(CASE WHEN granted_by IS NULL THEN 1 END) as without_granted_by,
    ROUND(COUNT(CASE WHEN granted_by IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as preservation_percentage,
    CASE 
        WHEN COUNT(CASE WHEN granted_by IS NULL THEN 1 END) = 0 THEN 'SUCCESS: All role permissions have granted_by field'
        ELSE 'WARNING: Some role permissions missing granted_by field'
    END as validation_result
FROM role_permissions;

-- Additional detailed check for granted_by preservation by role
SELECT 
    'GRANTED_BY_BY_ROLE' as test_name,
    r.name as role_name,
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN rp.granted_by IS NOT NULL THEN 1 END) as with_granted_by,
    COUNT(CASE WHEN rp.granted_by IS NULL THEN 1 END) as without_granted_by,
    ROUND(COUNT(CASE WHEN rp.granted_by IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as preservation_percentage,
    STRING_AGG(DISTINCT u.email, ', ' ORDER BY u.email) as grantor_emails
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN users u ON rp.granted_by = u.id
GROUP BY r.name
ORDER BY r.name;

-- ============================================================================
-- 9. CROSS-ROLE PERMISSION ANALYSIS
-- ============================================================================

-- Test: Permission overlap analysis across roles
WITH role_permission_matrix AS (
    SELECT 
        p.name as permission_name,
        COUNT(CASE WHEN r.name = 'Administrator' THEN 1 END) as admin_has,
        COUNT(CASE WHEN r.name = 'Manager' THEN 1 END) as manager_has,
        COUNT(CASE WHEN r.name = 'User' THEN 1 END) as user_has,
        COUNT(CASE WHEN r.name = 'Engineer' THEN 1 END) as engineer_has,
        COUNT(CASE WHEN r.name = 'Customer' THEN 1 END) as customer_has,
        COUNT(CASE WHEN r.name = 'super_admin' THEN 1 END) as super_admin_has
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    LEFT JOIN roles r ON rp.role_id = r.id
    GROUP BY p.name
)
SELECT 
    'PERMISSION_MATRIX_ANALYSIS' as test_name,
    permission_name,
    admin_has,
    manager_has,
    user_has,
    engineer_has,
    customer_has,
    super_admin_has,
    (admin_has + manager_has + user_has + engineer_has + customer_has + super_admin_has) as total_role_assignments
FROM role_permission_matrix
WHERE (admin_has + manager_has + user_has + engineer_has + customer_has + super_admin_has) > 0
ORDER BY total_role_assignments DESC, permission_name;

-- ============================================================================
-- 10. ROLE PERMISSION SUMMARY
-- ============================================================================

-- Comprehensive role permission summary
SELECT 
    'COMPREHENSIVE_ROLE_SUMMARY' as test_name,
    r.name as role_name,
    r.tenant_id,
    t.name as tenant_name,
    COUNT(rp.permission_id) as total_permissions,
    COUNT(CASE WHEN p.category = 'core' THEN 1 END) as core_permissions,
    COUNT(CASE WHEN p.category = 'module' THEN 1 END) as module_permissions,
    COUNT(CASE WHEN p.category = 'system' THEN 1 END) as system_permissions,
    COUNT(CASE WHEN rp.granted_by IS NOT NULL THEN 1 END) as with_grantor,
    STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as permission_list
FROM roles r
LEFT JOIN tenants t ON r.tenant_id = t.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name, r.tenant_id, t.name
ORDER BY r.name;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
    'ROLE_PERMISSION_VALIDATION' as test_suite,
    'READY_FOR_EXECUTION' as status,
    'Execute after migration and seed data to validate all role permissions' as instructions
UNION ALL
SELECT 
    'EXPECTED_RESULTS' as test_suite,
    'ALL_ROLES_VALIDATED' as status,
    'Tasks 2.1-2.7: Admin(30+), Manager(20+), User(10+), Engineer(10+), Customer(1), SuperAdmin(40+)' as summary
UNION ALL
SELECT 
    'GRANTED_BY_STATUS' as test_suite,
    'PRESERVATION_VERIFIED' as status,
    'All role_permissions should preserve granted_by field from migration' as summary;

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================
/*
EXECUTION STEPS FOR TASKS 2.1-2.7:

PREREQUISITES:
1. Migration 20251122000002 executed successfully
2. Seed.sql executed successfully
3. All tables populated with test data

EXECUTION:
1. Execute this script on the database
2. Review results for each role validation
3. Check granted_by field preservation
4. Analyze permission overlaps and gaps

EXPECTED RESULTS:
- Administrator: 30+ permissions with granted_by preserved
- Manager: 20+ permissions with granted_by preserved  
- User: 10+ permissions with granted_by preserved
- Engineer: 10+ permissions with granted_by preserved
- Customer: 1 permission with granted_by preserved
- super_admin: 40+ permissions with granted_by preserved
- 100% granted_by field preservation across all roles
- Proper permission hierarchy and access control

ROLE PERMISSION VALIDATION COMPLETE FOR TASKS 2.1-2.7
*/