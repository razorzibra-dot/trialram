-- ============================================================================
-- TEST SCRIPT FOR DATABASE RESET VALIDATION
-- This script tests the consolidated database reset script syntax and structure
-- ============================================================================

-- Test basic syntax validation
DO $$
BEGIN
    RAISE NOTICE 'Testing database reset script syntax...';
    
    -- Test that key functions exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_system_setup') THEN
        RAISE NOTICE '✓ validate_system_setup function exists';
    ELSE
        RAISE EXCEPTION '✗ validate_system_setup function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_fresh_setup') THEN
        RAISE NOTICE '✓ complete_fresh_setup function exists';
    ELSE
        RAISE EXCEPTION '✗ complete_fresh_setup function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_auth_user_to_public_user') THEN
        RAISE NOTICE '✓ sync_auth_user_to_public_user function exists';
    ELSE
        RAISE EXCEPTION '✗ sync_auth_user_to_public_user function missing';
    END IF;
    
    -- Test that key tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE '✓ tenants table exists';
    ELSE
        RAISE EXCEPTION '✗ tenants table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '✓ users table exists';
    ELSE
        RAISE EXCEPTION '✗ users table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RAISE NOTICE '✓ permissions table exists';
    ELSE
        RAISE EXCEPTION '✗ permissions table missing';
    END IF;
    
    -- Test RLS is enabled on key tables
    SELECT CASE WHEN relrowsecurity THEN '✓' ELSE '✗' END as rls_status, relname
    FROM pg_class 
    WHERE relname IN ('users', 'tenants', 'permissions')
    ORDER BY relname;
    
    RAISE NOTICE '✓ Basic validation complete';
END $$;

-- ============================================================================
-- COMPREHENSIVE VALIDATION TEST
-- ============================================================================

-- Run full system validation
SELECT validate_system_setup() as system_validation;

-- Test permission format
SELECT 
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN name LIKE '%:%' THEN 1 END) as resource_action_format,
    COUNT(CASE WHEN name IN ('read', 'write', 'delete') THEN 1 END) as core_permissions
FROM permissions;

-- Test roles and assignments
SELECT 
    t.name as tenant_name,
    COUNT(DISTINCT r.id) as role_count,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT ur.id) as assignment_count
FROM tenants t
LEFT JOIN roles r ON t.id = r.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Test RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 20;

-- ============================================================================
-- END OF VALIDATION TEST
-- ============================================================================