-- ============================================================================
-- Roles Table Validation Tests
-- Phase 4.2: Database Schema Validation - Roles Table
-- ============================================================================

-- Test 1: Verify all columns exist with correct types and constraints
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== ROLES TABLE COLUMN VALIDATION ===';

    -- Check all expected columns exist
    FOR column_record IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'roles' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            column_record.column_name, column_record.data_type,
            column_record.is_nullable, column_record.column_default;
    END LOOP;

    RAISE NOTICE '=== ROLES TABLE CONSTRAINTS ===';

    -- Check constraints
    FOR constraint_record IN
        SELECT conname, contype, pg_get_constraintdef(c.oid) as condef
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'roles' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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
    test_role_id UUID;
BEGIN
    RAISE NOTICE '=== ROLES DATA VALIDATION RULE TESTS ===';

    -- Create test tenant
    INSERT INTO tenants (name, domain, status, plan)
    VALUES ('Test Tenant', 'test.example.com', 'active', 'basic')
    RETURNING id INTO test_tenant_id;

    -- Test 2.1: Valid system role creation should work
    BEGIN
        INSERT INTO roles (name, description, is_system_role)
        VALUES ('test_admin', 'Test Admin Role', true)
        RETURNING id INTO test_role_id;

        RAISE NOTICE '✓ Valid system role creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid system role creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.2: Valid tenant role creation should work
    BEGIN
        INSERT INTO roles (name, description, tenant_id, is_system_role)
        VALUES ('tenant_admin', 'Tenant Admin Role', test_tenant_id, false);

        RAISE NOTICE '✓ Valid tenant role creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid tenant role creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.3: Duplicate role name per tenant should fail
    BEGIN
        INSERT INTO roles (name, description, tenant_id, is_system_role)
        VALUES ('tenant_admin', 'Another Tenant Admin Role', test_tenant_id, false);

        RAISE NOTICE '✗ Duplicate role name per tenant: FAILED - Should have been blocked';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE '✓ Duplicate role name per tenant: SUCCESS - Correctly blocked duplicate';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Duplicate role name per tenant: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.4: System role without tenant_id should work
    BEGIN
        INSERT INTO roles (name, description, is_system_role)
        VALUES ('system_role_test', 'System Role Test', true);

        RAISE NOTICE '✓ System role without tenant_id: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ System role without tenant_id: FAILED - %', SQLERRM;
    END;

    -- Test 2.5: Tenant role with tenant_id should work
    BEGIN
        INSERT INTO roles (name, description, tenant_id, is_system_role)
        VALUES ('tenant_role_test', 'Tenant Role Test', test_tenant_id, false);

        RAISE NOTICE '✓ Tenant role with tenant_id: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Tenant role with tenant_id: FAILED - %', SQLERRM;
    END;

    -- Clean up test data
    DELETE FROM roles WHERE name LIKE '%test%' OR name LIKE '%tenant%';
    DELETE FROM tenants WHERE id = test_tenant_id;

    RAISE NOTICE '=== ROLES DATA VALIDATION TESTS COMPLETE ===';

END $$;

-- Test 3: Index Validation
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== ROLES INDEX VALIDATION ===';

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
        WHERE t.relname = 'roles' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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
    RAISE NOTICE '=== ROLES RLS POLICY VALIDATION ===';

    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'roles' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ RLS is enabled on roles table';
    ELSE
        RAISE NOTICE '✗ RLS is NOT enabled on roles table';
    END IF;

    -- List all policies
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'roles' AND schemaname = 'public'
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
-- END OF ROLES TABLE VALIDATION TESTS
-- ============================================================================