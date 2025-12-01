-- Test Permission Insertion and Role Verification Script
-- Task: 1.1.4 - Test permission insertion on clean database
-- Task: 1.2.3-1.2.8 - Verify role permissions

BEGIN;

-- Clean slate test
DO $$
BEGIN
    RAISE NOTICE '=== PERMISSION INSERTION TEST ===';
    
    -- Test 1: Check if all 36 permissions exist
    DECLARE
        permission_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO permission_count
        FROM permissions
        WHERE name IN (
            'read', 'write', 'delete',
            'crm:user:record:update', 'crm:role:permission:assign', 'customers:manage',
            'sales:manage', 'contracts:manage', 'service_contracts:manage',
            'products:manage', 'product_sales:manage', 'job_works:manage',
            'tickets:manage', 'complaints:manage', 'dashboard:manage',
            'crm:system:config:manage', 'companies:manage', 'crm:platform:control:admin',
            'super_admin', 'crm:platform:tenant:manage', 'system_monitoring',
            'reports:manage', 'export_data', 'view_audit_logs',
            'create_tickets', 'update_tickets', 'create_products',
            'update_products', 'inventory:manage', 'view_financials',
            'integrations:manage', 'bulk_operations', 'advanced_search',
            'api_access'
        );
        
        RAISE NOTICE 'Total permissions found: % (Expected: 36)', permission_count;
        
        IF permission_count = 36 THEN
            RAISE NOTICE '✅ ALL PERMISSIONS CORRECTLY INSERTED';
        ELSE
            RAISE EXCEPTION '❌ MISSING PERMISSIONS: Found %, Expected 36', permission_count;
        END IF;
    END;
    
    -- Test 2: Verify Admin role permissions (1.2.3)
    DECLARE
        admin_permission_count INTEGER;
        admin_role_id UUID := '10000000-0000-0000-0000-000000000001';
    BEGIN
        SELECT COUNT(*) INTO admin_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = admin_role_id;
        
        RAISE NOTICE 'Admin role permissions: % (Expected: 35+)', admin_permission_count;
        
        IF admin_permission_count >= 35 THEN
            RAISE NOTICE '✅ ADMIN ROLE PERMISSIONS VERIFIED (Task 1.2.3)';
        ELSE
            RAISE EXCEPTION '❌ ADMIN ROLE INCOMPLETE: Found %, Expected 35+', admin_permission_count;
        END IF;
    END;
    
    -- Test 3: Verify Manager role permissions (1.2.4)
    DECLARE
        manager_permission_count INTEGER;
        manager_role_id UUID := '10000000-0000-0000-0000-000000000002';
    BEGIN
        SELECT COUNT(*) INTO manager_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = manager_role_id;
        
        RAISE NOTICE 'Manager role permissions: % (Expected: 20+)', manager_permission_count;
        
        IF manager_permission_count >= 20 THEN
            RAISE NOTICE '✅ MANAGER ROLE PERMISSIONS VERIFIED (Task 1.2.4)';
        ELSE
            RAISE EXCEPTION '❌ MANAGER ROLE INCOMPLETE: Found %, Expected 20+', manager_permission_count;
        END IF;
    END;
    
    -- Test 4: Verify User role permissions (1.2.5)
    DECLARE
        user_permission_count INTEGER;
        user_role_id UUID := '10000000-0000-0000-0000-000000000003';
    BEGIN
        SELECT COUNT(*) INTO user_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = user_role_id;
        
        RAISE NOTICE 'User role permissions: % (Expected: 10+)', user_permission_count;
        
        IF user_permission_count >= 10 THEN
            RAISE NOTICE '✅ USER ROLE PERMISSIONS VERIFIED (Task 1.2.5)';
        ELSE
            RAISE EXCEPTION '❌ USER ROLE INCOMPLETE: Found %, Expected 10+', user_permission_count;
        END IF;
    END;
    
    -- Test 5: Verify Engineer role permissions (1.2.6)
    DECLARE
        engineer_permission_count INTEGER;
        engineer_role_id UUID := '10000000-0000-0000-0000-000000000004';
    BEGIN
        SELECT COUNT(*) INTO engineer_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = engineer_role_id;
        
        RAISE NOTICE 'Engineer role permissions: % (Expected: 10+)', engineer_permission_count;
        
        IF engineer_permission_count >= 10 THEN
            RAISE NOTICE '✅ ENGINEER ROLE PERMISSIONS VERIFIED (Task 1.2.6)';
        ELSE
            RAISE EXCEPTION '❌ ENGINEER ROLE INCOMPLETE: Found %, Expected 10+', engineer_permission_count;
        END IF;
    END;
    
    -- Test 6: Verify Customer role permissions (1.2.7)
    DECLARE
        customer_permission_count INTEGER;
        customer_role_id UUID := '10000000-0000-0000-0000-000000000005';
    BEGIN
        SELECT COUNT(*) INTO customer_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = customer_role_id;
        
        RAISE NOTICE 'Customer role permissions: % (Expected: 1)', customer_permission_count;
        
        IF customer_permission_count = 1 THEN
            RAISE NOTICE '✅ CUSTOMER ROLE PERMISSIONS VERIFIED (Task 1.2.7)';
        ELSE
            RAISE EXCEPTION '❌ CUSTOMER ROLE INCORRECT: Found %, Expected 1', customer_permission_count;
        END IF;
    END;
    
    -- Test 7: Verify super_admin role permissions (1.2.8)
    DECLARE
        super_admin_permission_count INTEGER;
        super_admin_role_id UUID := '20000000-0000-0000-0000-000000000001';
    BEGIN
        SELECT COUNT(*) INTO super_admin_permission_count
        FROM role_permissions rp
        WHERE rp.role_id = super_admin_role_id;
        
        RAISE NOTICE 'Super admin role permissions: % (Expected: 40+)', super_admin_permission_count;
        
        IF super_admin_permission_count >= 40 THEN
            RAISE NOTICE '✅ SUPER_ADMIN ROLE PERMISSIONS VERIFIED (Task 1.2.8)';
        ELSE
            RAISE EXCEPTION '❌ SUPER_ADMIN ROLE INCOMPLETE: Found %, Expected 40+', super_admin_permission_count;
        END IF;
    END;
    
    -- Test 8: Verify granted_by field preservation (Migration fix)
    DECLARE
        granted_by_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO granted_by_count
        FROM role_permissions rp
        WHERE rp.granted_by IS NOT NULL;
        
        RAISE NOTICE 'Role permissions with granted_by: % (Should be > 0)', granted_by_count;
        
        IF granted_by_count > 0 THEN
            RAISE NOTICE '✅ GRANTED_BY FIELD PRESERVED (Migration fix confirmed)';
        ELSE
            RAISE EXCEPTION '❌ GRANTED_BY FIELD MISSING (Migration issue)';
        END IF;
    END;
    
    RAISE NOTICE '=== ALL PERMISSION TESTS PASSED ===';
END $$;

-- Detailed role permission breakdown
SELECT 
    r.name as role_name,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VALIDATION SUMMARY ===';
    RAISE NOTICE 'Task 1.1.4: ✅ PERMISSION INSERTION TEST - PASSED';
    RAISE NOTICE 'Task 1.2.3: ✅ ADMIN ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Task 1.2.4: ✅ MANAGER ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Task 1.2.5: ✅ USER ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Task 1.2.6: ✅ ENGINEER ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Task 1.2.7: ✅ CUSTOMER ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Task 1.2.8: ✅ SUPER_ADMIN ROLE PERMISSIONS - VERIFIED';
    RAISE NOTICE 'Migration Fix: ✅ GRANTED_BY FIELD PRESERVED';
END $$;

ROLLBACK;