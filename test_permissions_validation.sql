-- ============================================================================
-- Permissions Table Validation Tests
-- Phase 4.4: Database Schema Validation - Permissions Table
-- ============================================================================

-- Test 1: Verify all columns exist with correct types and constraints
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== PERMISSIONS TABLE COLUMN VALIDATION ===';

    -- Check all expected columns exist
    FOR column_record IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'permissions' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            column_record.column_name, column_record.data_type,
            column_record.is_nullable, column_record.column_default;
    END LOOP;

    RAISE NOTICE '=== PERMISSIONS TABLE CONSTRAINTS ===';

    -- Check constraints
    FOR constraint_record IN
        SELECT conname, contype, pg_get_constraintdef(c.oid) as condef
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'permissions' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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

-- Test 2: Data Validation Rules - Test permission categories
DO $$
DECLARE
    test_permission_id UUID;
BEGIN
    RAISE NOTICE '=== PERMISSIONS DATA VALIDATION RULE TESTS ===';

    -- Test 2.1: Valid core permission creation should work
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('users:read', 'Read users', 'users', 'read', 'core', true)
        RETURNING id INTO test_permission_id;

        RAISE NOTICE '✓ Valid core permission creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid core permission creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.2: Valid module permission creation should work
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('customers:manage', 'Manage customers', 'customers', 'manage', 'module', true);

        RAISE NOTICE '✓ Valid module permission creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid module permission creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.3: Valid administrative permission creation should work
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('users:manage_roles', 'Manage user roles', 'users', 'manage_roles', 'administrative', true);

        RAISE NOTICE '✓ Valid administrative permission creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid administrative permission creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.4: Valid system permission creation should work
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('platform:admin', 'Platform administration', 'platform', 'admin', 'system', true);

        RAISE NOTICE '✓ Valid system permission creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid system permission creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.5: Duplicate permission name should fail
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('users:read', 'Duplicate permission', 'users', 'read', 'core', true);

        RAISE NOTICE '✗ Duplicate permission name: FAILED - Should have been blocked';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE '✓ Duplicate permission name: SUCCESS - Correctly blocked duplicate';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Duplicate permission name: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.6: Invalid category should fail
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('test:invalid', 'Invalid category', 'test', 'invalid', 'invalid_category', true);

        RAISE NOTICE '✗ Invalid category: FAILED - Should have been blocked';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✓ Invalid category: SUCCESS - Correctly blocked invalid category';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Invalid category: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.7: Permission inheritance (wildcard permission)
    BEGIN
        INSERT INTO permissions (name, description, resource, action, category, is_system_permission)
        VALUES ('*:admin', 'Wildcard admin permission', '*', 'admin', 'system', true);

        RAISE NOTICE '✓ Wildcard permission creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Wildcard permission creation: FAILED - %', SQLERRM;
    END;

    -- Clean up test data
    DELETE FROM permissions WHERE name LIKE 'users:read' OR name LIKE 'customers:%' OR name LIKE 'users:manage_roles' OR name LIKE 'platform:%' OR name LIKE '*:admin' OR name LIKE 'test:%';

    RAISE NOTICE '=== PERMISSIONS DATA VALIDATION TESTS COMPLETE ===';

END $$;

-- Test 3: Index Validation
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== PERMISSIONS INDEX VALIDATION ===';

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
        WHERE t.relname = 'permissions' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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
    RAISE NOTICE '=== PERMISSIONS RLS POLICY VALIDATION ===';

    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'permissions' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ RLS is enabled on permissions table';
    ELSE
        RAISE NOTICE '✗ RLS is NOT enabled on permissions table';
    END IF;

    -- List all policies
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'permissions' AND schemaname = 'public'
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
-- END OF PERMISSIONS TABLE VALIDATION TESTS
-- ============================================================================