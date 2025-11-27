-- ============================================================================
-- Users Table Validation Tests
-- Phase 4.1: Database Schema Validation - Users Table
-- ============================================================================

-- Test 1: Verify all columns exist with correct types and constraints
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== USERS TABLE COLUMN VALIDATION ===';

    -- Check all expected columns exist
    FOR column_record IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            column_record.column_name, column_record.data_type,
            column_record.is_nullable, column_record.column_default;
    END LOOP;

    RAISE NOTICE '=== USERS TABLE CONSTRAINTS ===';

    -- Check constraints
    FOR constraint_record IN
        SELECT conname, contype, pg_get_constraintdef(c.oid) as condef
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'users' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        RAISE NOTICE 'Constraint: % | Type: % | Definition: %',
            constraint_record.conname,
            CASE constraint_record.contype
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'c' THEN 'CHECK'
                ELSE 'OTHER'
            END,
            constraint_record.condef;
    END LOOP;

END $$;

-- Test 2: Data Validation Rules - Test constraint violations
DO $$
DECLARE
    test_tenant_id UUID;
    test_user_id UUID;
    test_role_id UUID;
BEGIN
    RAISE NOTICE '=== DATA VALIDATION RULE TESTS ===';

    -- Create test tenant
    INSERT INTO tenants (name, domain, status, plan)
    VALUES ('Test Tenant', 'test.example.com', 'active', 'basic')
    RETURNING id INTO test_tenant_id;

    -- Create test role
    INSERT INTO roles (name, description, tenant_id, is_system_role)
    VALUES ('agent', 'Test Agent Role', test_tenant_id, true)
    RETURNING id INTO test_role_id;

    -- Test 2.1: Valid user creation should work
    BEGIN
        INSERT INTO users (email, name, tenant_id, status)
        VALUES ('test@example.com', 'Test User', test_tenant_id, 'active')
        RETURNING id INTO test_user_id;

        -- Assign role via user_roles
        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (test_user_id, test_role_id, test_tenant_id);

        RAISE NOTICE '✓ Valid user creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid user creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.2: Duplicate email per tenant should fail
    BEGIN
        INSERT INTO users (email, name, tenant_id, status)
        VALUES ('test@example.com', 'Another User', test_tenant_id, 'active');

        RAISE NOTICE '✗ Duplicate email constraint: FAILED - Should have been blocked';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE '✓ Duplicate email constraint: SUCCESS - Correctly blocked duplicate';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Duplicate email constraint: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.3: Super admin tenant_id must be NULL (create super_admin role)
    BEGIN
        INSERT INTO roles (name, description, is_system_role)
        VALUES ('super_admin', 'Super Admin Role', true)
        RETURNING id INTO test_role_id;

        INSERT INTO users (email, name, tenant_id, status)
        VALUES ('super@test.com', 'Super Admin', test_tenant_id, 'active');

        RAISE NOTICE '✗ Super admin tenant constraint: FAILED - Should have been blocked';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✓ Super admin tenant constraint: SUCCESS - Correctly blocked tenant_id for super_admin';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Super admin tenant constraint: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.4: Super admin with NULL tenant_id should work
    BEGIN
        INSERT INTO users (email, name, status)
        VALUES ('super2@test.com', 'Super Admin 2', 'active');

        RAISE NOTICE '✓ Super admin NULL tenant: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Super admin NULL tenant: FAILED - %', SQLERRM;
    END;

    -- Test 2.5: Regular user without tenant_id should fail
    BEGIN
        INSERT INTO users (email, name, status)
        VALUES ('regular@test.com', 'Regular User', 'active');

        RAISE NOTICE '✗ Regular user tenant constraint: FAILED - Should have been blocked';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✓ Regular user tenant constraint: SUCCESS - Correctly required tenant_id';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Regular user tenant constraint: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.6: Invalid status enum should fail
    BEGIN
        INSERT INTO users (email, name, tenant_id, status)
        VALUES ('invalid@test.com', 'Invalid Status', test_tenant_id, 'invalid_status');

        RAISE NOTICE '✗ Invalid status enum: FAILED - Should have been blocked';
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE '✓ Invalid status enum: SUCCESS - Correctly blocked invalid status';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Invalid status enum: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.7: Security field constraints
    BEGIN
        INSERT INTO users (email, name, tenant_id, status, failed_login_attempts, concurrent_sessions_limit)
        VALUES ('security@test.com', 'Security Test', test_tenant_id, 'active', 10, 25);

        RAISE NOTICE '✗ Security field constraints: FAILED - Should have been blocked';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✓ Security field constraints: SUCCESS - Correctly enforced limits';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Security field constraints: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Clean up test data
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
    DELETE FROM users WHERE email LIKE '%@test.com';
    DELETE FROM roles WHERE name IN ('agent', 'super_admin') AND tenant_id = test_tenant_id;
    DELETE FROM roles WHERE name = 'super_admin' AND tenant_id IS NULL;
    DELETE FROM tenants WHERE id = test_tenant_id;

    RAISE NOTICE '=== DATA VALIDATION TESTS COMPLETE ===';

END $$;

-- Test 3: Index Validation
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== INDEX VALIDATION ===';

    FOR index_record IN
        SELECT
            i.relname as index_name,
            a.attname as column_name,
            ix.indisunique as is_unique,
            ix.indisprimary as is_primary
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = 'users' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY i.relname, a.attname
    LOOP
        RAISE NOTICE 'Index: % | Column: % | Unique: % | Primary: %',
            index_record.index_name, index_record.column_name,
            index_record.is_unique, index_record.is_primary;
    END LOOP;

END $$;

-- Test 4: RLS Policy Validation
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== RLS POLICY VALIDATION ===';

    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'users' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ RLS is enabled on users table';
    ELSE
        RAISE NOTICE '✗ RLS is NOT enabled on users table';
    END IF;

    -- List all policies
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'users' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: %',
            policy_record.policyname, policy_record.cmd,
            CASE WHEN policy_record.roles IS NULL THEN 'ALL' ELSE array_to_string(policy_record.roles, ',') END;
        IF policy_record.qual IS NOT NULL THEN
            RAISE NOTICE '  USING: %', policy_record.qual;
        END IF;
        IF policy_record.with_check IS NOT NULL THEN
            RAISE NOTICE '  WITH CHECK: %', policy_record.with_check;
        END IF;
    END LOOP;

END $$;

-- ============================================================================
-- END OF USERS TABLE VALIDATION TESTS
-- ============================================================================