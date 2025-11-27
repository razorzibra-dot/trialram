-- ============================================================================
-- User Roles Table Validation Tests
-- Phase 4.3: Database Schema Validation - User Roles Table
-- ============================================================================

-- Test 1: Verify all columns exist with correct types and constraints
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== USER_ROLES TABLE COLUMN VALIDATION ===';

    -- Check all expected columns exist
    FOR column_record IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'user_roles' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            column_record.column_name, column_record.data_type,
            column_record.is_nullable, column_record.column_default;
    END LOOP;

    RAISE NOTICE '=== USER_ROLES TABLE CONSTRAINTS ===';

    -- Check constraints
    FOR constraint_record IN
        SELECT conname, contype, pg_get_constraintdef(c.oid) as condef
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'user_roles' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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

-- Test 2: Data Validation Rules - Test many-to-many relationship
DO $$
DECLARE
    test_tenant_id UUID;
    test_user_id UUID;
    test_role_id UUID;
    test_user_role_id UUID;
BEGIN
    RAISE NOTICE '=== USER_ROLES DATA VALIDATION RULE TESTS ===';

    -- Create test tenant
    INSERT INTO tenants (name, domain, status, plan)
    VALUES ('Test Tenant', 'test.example.com', 'active', 'basic')
    RETURNING id INTO test_tenant_id;

    -- Create test user
    INSERT INTO users (email, name, tenant_id, status)
    VALUES ('test@example.com', 'Test User', test_tenant_id, 'active')
    RETURNING id INTO test_user_id;

    -- Create test role
    INSERT INTO roles (name, description, tenant_id, is_system_role)
    VALUES ('test_role', 'Test Role', test_tenant_id, false)
    RETURNING id INTO test_role_id;

    -- Test 2.1: Valid user-role assignment should work
    BEGIN
        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (test_user_id, test_role_id, test_tenant_id)
        RETURNING id INTO test_user_role_id;

        RAISE NOTICE '✓ Valid user-role assignment: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid user-role assignment: FAILED - %', SQLERRM;
    END;

    -- Test 2.2: Duplicate user-role assignment should fail
    BEGIN
        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (test_user_id, test_role_id, test_tenant_id);

        RAISE NOTICE '✗ Duplicate user-role assignment: FAILED - Should have been blocked';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE '✓ Duplicate user-role assignment: SUCCESS - Correctly blocked duplicate';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Duplicate user-role assignment: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.3: User can have multiple roles
    BEGIN
        -- Create another role
        INSERT INTO roles (name, description, tenant_id, is_system_role)
        VALUES ('test_role2', 'Test Role 2', test_tenant_id, false)
        RETURNING id INTO test_role_id;

        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (test_user_id, test_role_id, test_tenant_id);

        RAISE NOTICE '✓ User with multiple roles: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ User with multiple roles: FAILED - %', SQLERRM;
    END;

    -- Test 2.4: Same role can be assigned to multiple users
    BEGIN
        -- Create another user
        INSERT INTO users (email, name, tenant_id, status)
        VALUES ('test2@example.com', 'Test User 2', test_tenant_id, 'active')
        RETURNING id INTO test_user_id;

        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (test_user_id, test_role_id, test_tenant_id);

        RAISE NOTICE '✓ Same role assigned to multiple users: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Same role assigned to multiple users: FAILED - %', SQLERRM;
    END;

    -- Test 2.5: Assignment tracking (assigned_at should be set)
    BEGIN
        -- Check that assigned_at is automatically set
        IF EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = test_user_id AND role_id = test_role_id
            AND assigned_at IS NOT NULL
        ) THEN
            RAISE NOTICE '✓ Assignment tracking (assigned_at): SUCCESS';
        ELSE
            RAISE NOTICE '✗ Assignment tracking (assigned_at): FAILED - assigned_at not set';
        END IF;
    END;

    -- Clean up test data
    DELETE FROM user_roles WHERE tenant_id = test_tenant_id;
    DELETE FROM roles WHERE tenant_id = test_tenant_id;
    DELETE FROM users WHERE tenant_id = test_tenant_id;
    DELETE FROM tenants WHERE id = test_tenant_id;

    RAISE NOTICE '=== USER_ROLES DATA VALIDATION TESTS COMPLETE ===';

END $$;

-- Test 3: Index Validation
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== USER_ROLES INDEX VALIDATION ===';

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
        WHERE t.relname = 'user_roles' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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
    RAISE NOTICE '=== USER_ROLES RLS POLICY VALIDATION ===';

    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_roles' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ RLS is enabled on user_roles table';
    ELSE
        RAISE NOTICE '✗ RLS is NOT enabled on user_roles table';
    END IF;

    -- List all policies
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'user_roles' AND schemaname = 'public'
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
-- END OF USER_ROLES TABLE VALIDATION TESTS
-- ============================================================================