-- ============================================================================
-- PERMISSION CONSISTENCY CHECKS SCRIPT
-- Task: 4.2.3 - Implement permission consistency checks
-- Purpose: Validate permission format, consistency, and role assignments
-- ============================================================================

BEGIN;

DO $$
DECLARE
    new_format_count INTEGER;
    legacy_format_count INTEGER;
    permission_consistency_issues INTEGER := 0;
    role_perm_inconsistencies INTEGER := 0;
    orphaned_permissions INTEGER := 0;
    admin_permissions_expected INTEGER := 34;
    manager_permissions_expected INTEGER := 20;
    current_admin_count INTEGER;
    current_manager_count INTEGER;
    permission_record RECORD;
    role_record RECORD;
BEGIN
    RAISE NOTICE '=== PERMISSION CONSISTENCY CHECKS STARTED ===';
    RAISE NOTICE 'Validating permission format and role assignments...';
    RAISE NOTICE '';

    -- ============================================================================
    -- SECTION 1: PERMISSION FORMAT VALIDATION
    -- ============================================================================
    
    RAISE NOTICE '--- PERMISSION FORMAT ANALYSIS ---';
    
    -- Count new format permissions (resource:action)
    SELECT COUNT(*) INTO new_format_count
    FROM permissions
    WHERE name LIKE '%:%' 
    OR name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin');
    
    -- Count legacy format permissions (crm:user:record:update, etc.)
    SELECT COUNT(*) INTO legacy_format_count
    FROM permissions
    WHERE name LIKE 'manage_%' 
    OR name LIKE '%_manage'
    AND name NOT IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin');
    
    RAISE NOTICE 'Permission format breakdown:';
    RAISE NOTICE '  - New format (resource:action): % permissions', new_format_count;
    RAISE NOTICE '  - Legacy format (manage_X): % permissions', legacy_format_count;
    RAISE NOTICE '  - Total permissions: %', (new_format_count + legacy_format_count);
    
    -- Validate format consistency
    IF new_format_count >= 30 AND legacy_format_count <= 10 THEN
        RAISE NOTICE '✅ PERMISSION FORMAT: GOOD (majority in new format)';
    ELSIF new_format_count >= 20 THEN
        RAISE NOTICE '⚠️  PERMISSION FORMAT: ACCEPTABLE (some legacy format remains)';
        permission_consistency_issues := permission_consistency_issues + 1;
    ELSE
        RAISE NOTICE '❌ PERMISSION FORMAT: POOR (too many legacy permissions)';
        permission_consistency_issues := permission_consistency_issues + 2;
    END IF;
    
    -- ============================================================================
    -- SECTION 2: CRITICAL PERMISSION VALIDATION
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- CRITICAL PERMISSIONS VALIDATION ---';
    
    -- Check for expected critical permissions
    FOR permission_record IN 
        SELECT name, resource, action 
        FROM permissions 
        WHERE name IN (
            'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage', 
            'sales:manage', 'contracts:manage', 'products:manage',
            'tickets:manage', 'complaints:manage', 'dashboard:manage',
            'crm:system:config:manage', 'companies:manage', 'crm:platform:tenant:manage',
            'super_admin', 'crm:platform:control:admin'
        )
    LOOP
        RAISE NOTICE '✅ Critical permission exists: % (%)', permission_record.name, permission_record.resource;
    END LOOP;
    
    -- Check for missing critical permissions
    FOR permission_record IN 
        SELECT 'crm:user:record:update' as name, 'users' as resource, 'manage' as action
        UNION ALL SELECT 'crm:role:permission:assign', 'roles', 'manage'
        UNION ALL SELECT 'customers:manage', 'customers', 'manage'
        UNION ALL SELECT 'super_admin', 'system', 'admin'
        UNION ALL SELECT 'crm:platform:control:admin', 'platform', 'admin'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM permissions 
            WHERE name = permission_record.name 
            AND resource = permission_record.resource 
            AND action = permission_record.action
        ) THEN
            RAISE NOTICE '❌ MISSING CRITICAL PERMISSION: % (%)', permission_record.name, permission_record.resource;
            permission_consistency_issues := permission_consistency_issues + 1;
        END IF;
    END LOOP;
    
    -- ============================================================================
    -- SECTION 3: ROLE-PERMISSION CONSISTENCY
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- ROLE-PERMISSION ASSIGNMENT VALIDATION ---';
    
    -- Check Administrator role permissions
    SELECT COUNT(*) INTO current_admin_count
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'Administrator';
    
    RAISE NOTICE 'Administrator role permissions: % (expected: %)', 
        current_admin_count, admin_permissions_expected;
    
    IF current_admin_count >= admin_permissions_expected THEN
        RAISE NOTICE '✅ Administrator role: WELL CONFIGURED';
    ELSIF current_admin_count >= 20 THEN
        RAISE NOTICE '⚠️  Administrator role: MINOR ISSUE (insufficient permissions)';
        role_perm_inconsistencies := role_perm_inconsistencies + 1;
    ELSE
        RAISE NOTICE '❌ Administrator role: MAJOR ISSUE (too few permissions)';
        role_perm_inconsistencies := role_perm_inconsistencies + 2;
    END IF;
    
    -- Check Manager role permissions
    SELECT COUNT(*) INTO current_manager_count
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'Manager';
    
    RAISE NOTICE 'Manager role permissions: % (expected: %)', 
        current_manager_count, manager_permissions_expected;
    
    IF current_manager_count >= manager_permissions_expected THEN
        RAISE NOTICE '✅ Manager role: WELL CONFIGURED';
    ELSIF current_manager_count >= 15 THEN
        RAISE NOTICE '⚠️  Manager role: MINOR ISSUE (insufficient permissions)';
        role_perm_inconsistencies := role_perm_inconsistencies + 1;
    ELSE
        RAISE NOTICE '❌ Manager role: MAJOR ISSUE (too few permissions)';
        role_perm_inconsistencies := role_perm_inconsistencies + 2;
    END IF;
    
    -- Check for role permission consistency across similar roles
    FOR role_record IN 
        SELECT name, COUNT(rp.permission_id) as perm_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.name IN ('User', 'Engineer', 'Customer')
        GROUP BY r.name
    LOOP
        RAISE NOTICE 'Role % permissions: %', role_record.name, role_record.perm_count;
        
        -- Basic validation for role permission levels
        CASE role_record.name
            WHEN 'User' THEN
                IF role_record.perm_count >= 5 AND role_record.perm_count <= 15 THEN
                    RAISE NOTICE '✅ User role: APPROPRIATE PERMISSION LEVEL';
                ELSE
                    RAISE NOTICE '⚠️  User role: UNUSUAL PERMISSION COUNT';
                    role_perm_inconsistencies := role_perm_inconsistencies + 1;
                END IF;
            WHEN 'Engineer' THEN
                IF role_record.perm_count >= 8 AND role_record.perm_count <= 20 THEN
                    RAISE NOTICE '✅ Engineer role: APPROPRIATE PERMISSION LEVEL';
                ELSE
                    RAISE NOTICE '⚠️  Engineer role: UNUSUAL PERMISSION COUNT';
                    role_perm_inconsistencies := role_perm_inconsistencies + 1;
                END IF;
            WHEN 'Customer' THEN
                IF role_record.perm_count <= 3 THEN
                    RAISE NOTICE '✅ Customer role: APPROPRIATE RESTRICTED ACCESS';
                ELSE
                    RAISE NOTICE '⚠️  Customer role: TOO MANY PERMISSIONS';
                    role_perm_inconsistencies := role_perm_inconsistencies + 1;
                END IF;
        END CASE;
    END LOOP;
    
    -- ============================================================================
    -- SECTION 4: ORPHANED PERMISSIONS CHECK
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- ORPHANED PERMISSIONS VALIDATION ---';
    
    -- Check for permissions not assigned to any role
    SELECT COUNT(*) INTO orphaned_permissions
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.permission_id IS NULL;
    
    RAISE NOTICE 'Orphaned permissions (not assigned to any role): %', orphaned_permissions;
    
    IF orphaned_permissions = 0 THEN
        RAISE NOTICE '✅ NO ORPHANED PERMISSIONS: All permissions are utilized';
    ELSIF orphaned_permissions <= 5 THEN
        RAISE NOTICE '⚠️  MINOR ORPHANED PERMISSIONS: % unused permissions', orphaned_permissions;
        permission_consistency_issues := permission_consistency_issues + 1;
    ELSE
        RAISE NOTICE '❌ SIGNIFICANT ORPHANED PERMISSIONS: % unused permissions', orphaned_permissions;
        permission_consistency_issues := permission_consistency_issues + 2;
    END IF;
    
    -- List some orphaned permissions for review
    IF orphaned_permissions > 0 THEN
        RAISE NOTICE 'Sample orphaned permissions:';
        FOR permission_record IN 
            SELECT p.name, p.resource, p.action
            FROM permissions p
            LEFT JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.permission_id IS NULL
            LIMIT 5
        LOOP
            RAISE NOTICE '  - % (%)', permission_record.name, permission_record.resource;
        END LOOP;
        
        IF orphaned_permissions > 5 THEN
            RAISE NOTICE '  ... and % more', (orphaned_permissions - 5);
        END IF;
    END IF;
    
    -- ============================================================================
    -- SECTION 5: PERMISSION NAME UNIQUE CHECK
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- PERMISSION NAME UNIQUENESS CHECK ---';
    
    IF EXISTS (
        SELECT name, COUNT(*) 
        FROM permissions 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE '❌ DUPLICATE PERMISSION NAMES FOUND';
        permission_consistency_issues := permission_consistency_issues + 1;
        
        -- List duplicate permissions
        FOR permission_record IN 
            SELECT name, COUNT(*) as count
            FROM permissions 
            GROUP BY name 
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE '  - % appears % times', permission_record.name, permission_record.count;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ ALL PERMISSION NAMES ARE UNIQUE';
    END IF;
    
    -- ============================================================================
    -- SECTION 6: SUMMARY AND RECOMMENDATIONS
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PERMISSION CONSISTENCY SUMMARY ===';
    
    RAISE NOTICE 'Issues found:';
    RAISE NOTICE '  - Permission format issues: %', permission_consistency_issues;
    RAISE NOTICE '  - Role-permission inconsistencies: %', role_perm_inconsistencies;
    RAISE NOTICE '  - Orphaned permissions: %', orphaned_permissions;
    
    -- Overall assessment
    IF (permission_consistency_issues + role_perm_inconsistencies) = 0 AND orphaned_permissions <= 2 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ PERMISSION SYSTEM STATUS: EXCELLENT';
        RAISE NOTICE 'All permission checks passed successfully';
    ELSIF (permission_consistency_issues + role_perm_inconsistencies) <= 2 AND orphaned_permissions <= 5 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  PERMISSION SYSTEM STATUS: GOOD WITH MINOR ISSUES';
        RAISE NOTICE 'System is functional but has some optimization opportunities';
    ELSIF (permission_consistency_issues + role_perm_inconsistencies) <= 4 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ PERMISSION SYSTEM STATUS: NEEDS ATTENTION';
        RAISE NOTICE 'Several issues found that should be addressed';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🚨 PERMISSION SYSTEM STATUS: CRITICAL ISSUES';
        RAISE NOTICE 'Significant problems found requiring immediate attention';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PERMISSION CONSISTENCY CHECKS COMPLETED ===';
END $$;

ROLLBACK;