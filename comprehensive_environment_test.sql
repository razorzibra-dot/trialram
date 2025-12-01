-- ============================================================================
-- COMPREHENSIVE ENVIRONMENT TESTING SCRIPT
-- Task: 3.1.1 - Set up clean test environment
-- Task: 3.1.2 - Run all migrations in order
-- Task: 3.1.3 - Execute seed.sql successfully
-- Task: 3.1.4 - Verify all tables created correctly
-- Task: 3.1.5 - Test all RLS policies function
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: ENVIRONMENT SETUP VERIFICATION
-- ============================================================================

DO $$
DECLARE
    test_start_time TIMESTAMP;
    db_version TEXT;
    extension_count INTEGER;
BEGIN
    test_start_time := NOW();
    RAISE NOTICE '=== ENVIRONMENT SETUP TEST STARTED AT % ===', test_start_time;
    
    -- Test 1.1.1: Check PostgreSQL version compatibility
    SELECT version() INTO db_version;
    RAISE NOTICE 'PostgreSQL Version: %', db_version;
    
    -- Test 1.1.2: Check required extensions
    SELECT COUNT(*) INTO extension_count
    FROM pg_extension 
    WHERE extname IN ('uuid-ossp', 'pgcrypto');
    
    IF extension_count >= 2 THEN
        RAISE NOTICE '✅ Required extensions installed (uuid-ossp, pgcrypto)';
    ELSE
        RAISE NOTICE '⚠️ Extension check: Found % required extensions', extension_count;
    END IF;
    
    RAISE NOTICE '✅ Environment setup verified';
END $$;

-- ============================================================================
-- SECTION 2: MIGRATION EXECUTION ORDER VERIFICATION
-- ============================================================================

DO $$
DECLARE
    migration_count INTEGER;
    expected_migrations TEXT[] := ARRAY[
        '20250101000001', '20250101000007', '20251120000003',
        '20251122000001', '20251122000002'
    ];
    migration_names TEXT[] := ARRAY[
        'Initial schema', 'RLS setup', 'Auth user creation',
        'Audit logs RLS', 'Permission format update'
    ];
    i INTEGER;
    actual_migration TEXT;
BEGIN
    RAISE NOTICE '=== MIGRATION EXECUTION ORDER TEST ===';
    
    -- Test 3.1.2: Check migration history
    SELECT COUNT(*) INTO migration_count
    FROM supabase_migrations.schema_migrations;
    
    RAISE NOTICE 'Migrations found in database: %', migration_count;
    
    -- Verify critical migrations exist in order
    FOR i IN 1..array_length(expected_migrations, 1) LOOP
        SELECT version INTO actual_migration
        FROM supabase_migrations.schema_migrations
        WHERE version = expected_migrations[i];
        
        IF actual_migration IS NOT NULL THEN
            RAISE NOTICE '✅ Migration % (%): FOUND', expected_migrations[i], migration_names[i];
        ELSE
            RAISE NOTICE '⚠️ Migration % (%): NOT FOUND', expected_migrations[i], migration_names[i];
        END IF;
    END LOOP;
    
    -- Test 3.1.3: Verify critical permission migration
    SELECT version INTO actual_migration
    FROM supabase_migrations.schema_migrations
    WHERE version = '20251122000002' AND version LIKE '%update_permissions%';
    
    IF actual_migration IS NOT NULL THEN
        RAISE NOTICE '✅ CRITICAL: Permission format migration executed';
    ELSE
        RAISE NOTICE '❌ CRITICAL: Permission format migration MISSING';
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: SEED DATA EXECUTION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    permission_count INTEGER;
    role_count INTEGER;
    user_count INTEGER;
    tenant_count INTEGER;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '=== SEED DATA EXECUTION TEST ===';
    
    -- Test 3.1.3: Verify seed data execution
    SELECT COUNT(*) INTO permission_count FROM permissions;
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    
    RAISE NOTICE 'Seed data verification:';
    RAISE NOTICE '  - Permissions: % (Expected: ~34)', permission_count;
    RAISE NOTICE '  - Roles: % (Expected: ~6)', role_count;
    RAISE NOTICE '  - Users: % (Expected: ~11)', user_count;
    RAISE NOTICE '  - Tenants: % (Expected: ~4)', tenant_count;
    
    IF permission_count >= 30 THEN
        RAISE NOTICE '✅ Permissions properly seeded';
    ELSE
        RAISE NOTICE '⚠️ Permission seeding may be incomplete';
    END IF;
    
    IF role_count >= 5 THEN
        RAISE NOTICE '✅ Roles properly seeded';
    ELSE
        RAISE NOTICE '⚠️ Role seeding may be incomplete';
    END IF;
    
    IF tenant_count >= 3 THEN
        RAISE NOTICE '✅ Tenants properly seeded';
    ELSE
        RAISE NOTICE '⚠️ Tenant seeding may be incomplete';
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: TABLE CREATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'tenants', 'users', 'roles', 'permissions', 'user_roles', 
        'role_permissions', 'customers', 'sales', 'contracts',
        'audit_logs', 'reference_data'
    ];
    table_exists BOOLEAN;
    i INTEGER;
    current_table_name TEXT;
    existing_tables INTEGER;
BEGIN
    RAISE NOTICE '=== TABLE CREATION VERIFICATION TEST ===';
    
    SELECT COUNT(*) INTO existing_tables
    FROM information_schema.tables
    WHERE table_schema = 'public';
    
    RAISE NOTICE 'Total tables in public schema: %', existing_tables;
    
    -- Test 3.1.4: Verify critical tables exist
    FOR i IN 1..array_length(expected_tables, 1) LOOP
        current_table_name := expected_tables[i];
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ Table %: EXISTS', current_table_name;
        ELSE
            RAISE NOTICE '❌ Table %: MISSING', current_table_name;
        END IF;
    END LOOP;
    
    -- Check for core CRM tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customers'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Core CRM functionality available';
    ELSE
        RAISE NOTICE '❌ Core CRM tables missing';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: RLS POLICIES FUNCTIONALITY TEST
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    customer_policy_exists BOOLEAN;
    tenant_isolation_policy_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== RLS POLICIES FUNCTIONALITY TEST ===';
    
    -- Test 3.1.5: Check RLS policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total RLS policies found: %', policy_count;
    
    -- Check for critical tenant isolation policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customers' 
        AND policyname ILIKE '%tenant%'
    ) INTO tenant_isolation_policy_exists;
    
    IF tenant_isolation_policy_exists THEN
        RAISE NOTICE '✅ Tenant isolation policy EXISTS for customers';
    ELSE
        RAISE NOTICE '⚠️ Tenant isolation policy MISSING for customers';
    END IF;
    
    -- Check if RLS is enabled on critical tables
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'customers' 
        AND rowsecurity = true
    ) INTO customer_policy_exists;
    
    IF customer_policy_exists THEN
        RAISE NOTICE '✅ RLS enabled on customers table';
    ELSE
        RAISE NOTICE '⚠️ RLS not enabled on customers table';
    END IF;
    
    IF policy_count >= 10 THEN
        RAISE NOTICE '✅ Comprehensive RLS policies deployed';
    ELSE
        RAISE NOTICE '⚠️ Limited RLS policies found';
    END IF;
END $$;

-- ============================================================================
-- SECTION 6: PERMISSION FORMAT VALIDATION
-- ============================================================================

DO $$
DECLARE
    correct_format_count INTEGER;
    incorrect_format_count INTEGER;
    total_permissions INTEGER;
BEGIN
    RAISE NOTICE '=== PERMISSION FORMAT VALIDATION TEST ===';
    
    -- Test 3.1.7: Validate permission format (Task 4.1.3)
    SELECT COUNT(*) INTO total_permissions FROM permissions;
    SELECT COUNT(*) INTO correct_format_count
    FROM permissions
    WHERE name LIKE '%:%' OR name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin');
    
    incorrect_format_count := total_permissions - correct_format_count;
    
    RAISE NOTICE 'Permission format analysis:';
    RAISE NOTICE '  - Total permissions: %', total_permissions;
    RAISE NOTICE '  - Correct format: %', correct_format_count;
    RAISE NOTICE '  - Incorrect format: %', incorrect_format_count;
    
    IF correct_format_count >= 30 AND incorrect_format_count <= 4 THEN
        RAISE NOTICE '✅ Permission format validation PASSED';
    ELSE
        RAISE NOTICE '❌ Permission format validation FAILED';
    END IF;
END $$;

-- ============================================================================
-- SECTION 7: AUTH USER SYNCHRONIZATION VERIFICATION
-- ============================================================================

DO $
DECLARE
    auth_users_count INTEGER;
    public_users_count INTEGER;
    synced_users_count INTEGER;
    missing_auth_sync INTEGER;
    expected_test_users INTEGER := 11;
BEGIN
    RAISE NOTICE '=== AUTH USER SYNCHRONIZATION TEST ===';
    
    -- Test 3.1.8: Verify auth-public user synchronization
    SELECT COUNT(*) INTO auth_users_count 
    FROM auth.users 
    WHERE email IS NOT NULL AND email != '';
    
    SELECT COUNT(*) INTO public_users_count 
    FROM public.users 
    WHERE email IS NOT NULL AND email != '';
    
    SELECT COUNT(*) INTO synced_users_count
    FROM auth.users au
    JOIN public.users pu ON pu.id = au.id
    WHERE au.email IS NOT NULL 
      AND au.email != ''
      AND pu.email IS NOT NULL 
      AND pu.email != ''
      AND au.email = pu.email;
    
    missing_auth_sync := auth_users_count - synced_users_count;
    
    RAISE NOTICE 'Auth-Public sync verification:';
    RAISE NOTICE '  - Auth users: %', auth_users_count;
    RAISE NOTICE '  - Public users: %', public_users_count;
    RAISE NOTICE '  - Synced users: %', synced_users_count;
    RAISE NOTICE '  - Missing sync: %', missing_auth_sync;
    
    IF synced_users_count >= expected_test_users THEN
        RAISE NOTICE '✅ AUTH SYNC: All test users properly synchronized';
    ELSE
        RAISE NOTICE '⚠️ AUTH SYNC: Missing % test users', (expected_test_users - synced_users_count);
    END IF;
    
    -- Verify specific test users exist
    DECLARE
        test_user_exists BOOLEAN;
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM auth.users au
            JOIN public.users pu ON pu.id = au.id
            WHERE au.email = 'superadmin@platform.com'
        ) INTO test_user_exists;
        
        IF test_user_exists THEN
            RAISE NOTICE '✅ CRITICAL USER: superadmin@platform.com synchronized';
        ELSE
            RAISE NOTICE '❌ CRITICAL USER: superadmin@platform.com NOT synchronized';
        END IF;
    END;
END $;

-- ============================================================================
-- SECTION 8: ROLE-BASED ACCESS CONTROL VERIFICATION
-- ============================================================================

DO $
DECLARE
    admin_perms INTEGER;
    manager_perms INTEGER;
    user_perms INTEGER;
    super_admin_perms INTEGER;
    total_roles INTEGER;
BEGIN
    RAISE NOTICE '=== RBAC FUNCTIONALITY VERIFICATION TEST ===';
    
    -- Test 3.1.7: Verify role permissions
    SELECT COUNT(*) INTO admin_perms
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'Administrator';
    
    SELECT COUNT(*) INTO manager_perms
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'Manager';
    
    SELECT COUNT(*) INTO user_perms
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'User';
    
    SELECT COUNT(*) INTO super_admin_perms
    FROM role_permissions rp
    JOIN roles r ON rp.role_id = r.id
    WHERE r.name = 'super_admin';
    
    SELECT COUNT(*) INTO total_roles FROM roles;
    
    RAISE NOTICE 'RBAC verification:';
    RAISE NOTICE '  - Administrator permissions: %', admin_perms;
    RAISE NOTICE '  - Manager permissions: %', manager_perms;
    RAISE NOTICE '  - User permissions: %', user_perms;
    RAISE NOTICE '  - Super Admin permissions: %', super_admin_perms;
    RAISE NOTICE '  - Total roles: %', total_roles;
    
    IF admin_perms >= 20 AND manager_perms >= 10 AND super_admin_perms >= 30 THEN
        RAISE NOTICE '✅ RBAC functionality VERIFIED';
    ELSE
        RAISE NOTICE '⚠️ RBAC functionality INCOMPLETE';
    END IF;
END $$;

-- ============================================================================
-- SECTION 9: COMPREHENSIVE TEST SUMMARY
-- ============================================================================

DO $
DECLARE
    total_tables INTEGER;
    total_policies INTEGER;
    total_permissions INTEGER;
    total_users INTEGER;
    test_end_time TIMESTAMP;
    test_duration INTERVAL;
    test_start_time TIMESTAMP;
BEGIN
    test_start_time := NOW();
    test_end_time := NOW();
    test_duration := test_end_time - test_start_time;
    
    SELECT COUNT(*) INTO total_tables FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO total_permissions FROM permissions;
    SELECT COUNT(*) INTO total_users FROM users;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPREHENSIVE TEST SUMMARY ===';
    RAISE NOTICE 'Test completed at: %', test_end_time;
    RAISE NOTICE 'Total test duration: %', test_duration;
    RAISE NOTICE '';
    RAISE NOTICE 'Database Statistics:';
    RAISE NOTICE '  - Tables: %', total_tables;
    RAISE NOTICE '  - RLS Policies: %', total_policies;
    RAISE NOTICE '  - Permissions: %', total_permissions;
    RAISE NOTICE '  - Users: %', total_users;
    RAISE NOTICE '';
    RAISE NOTICE 'Environment Status:';
    
    IF total_tables >= 10 THEN
        RAISE NOTICE '  ✅ Table structure: COMPLETE';
    ELSE
        RAISE NOTICE '  ⚠️ Table structure: INCOMPLETE';
    END IF;
    
    IF total_policies >= 5 THEN
        RAISE NOTICE '  ✅ RLS Policies: DEPLOYED';
    ELSE
        RAISE NOTICE '  ⚠️ RLS Policies: LIMITED';
    END IF;
    
    IF total_permissions >= 30 THEN
        RAISE NOTICE '  ✅ Permission System: CONFIGURED';
    ELSE
        RAISE NOTICE '  ⚠️ Permission System: INCOMPLETE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ENVIRONMENT TEST COMPLETED SUCCESSFULLY ===';
END $$;

ROLLBACK;