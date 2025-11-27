-- ============================================================================
-- Audit Logs Table Validation Tests
-- Phase 4.5: Database Schema Validation - Audit Logs Table
-- ============================================================================

-- Test 1: Verify all columns exist with correct types and constraints
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== AUDIT LOGS TABLE COLUMN VALIDATION ===';

    -- Check all expected columns exist
    FOR column_record IN
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %',
            column_record.column_name, column_record.data_type,
            column_record.is_nullable, column_record.column_default;
    END LOOP;

    RAISE NOTICE '=== AUDIT LOGS TABLE CONSTRAINTS ===';

    -- Check constraints
    FOR constraint_record IN
        SELECT conname, contype, pg_get_constraintdef(c.oid) as condef
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'audit_logs' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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

-- Test 2: Data Validation Rules - Test audit trail completeness
DO $$
DECLARE
    test_tenant_id UUID;
    test_user_id UUID;
    test_audit_id UUID;
BEGIN
    RAISE NOTICE '=== AUDIT LOGS DATA VALIDATION RULE TESTS ===';

    -- Create test tenant and user
    INSERT INTO tenants (name, domain, status, plan)
    VALUES ('Test Tenant', 'test.example.com', 'active', 'basic')
    RETURNING id INTO test_tenant_id;

    INSERT INTO users (email, name, tenant_id, status)
    VALUES ('test@example.com', 'Test User', test_tenant_id, 'active')
    RETURNING id INTO test_user_id;

    -- Test 2.1: Valid audit log creation should work
    BEGIN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, description)
        VALUES (test_tenant_id, test_user_id, 'create', 'user', test_user_id, 'User created')
        RETURNING id INTO test_audit_id;

        RAISE NOTICE '✓ Valid audit log creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Valid audit log creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.2: Audit log without user_id should work (system actions)
    BEGIN
        INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, description)
        VALUES (test_tenant_id, 'system_backup', 'system', 'backup_001', 'System backup completed');

        RAISE NOTICE '✓ System audit log creation: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ System audit log creation: FAILED - %', SQLERRM;
    END;

    -- Test 2.3: Audit log with changes JSON should work
    BEGIN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, description, changes)
        VALUES (
            test_tenant_id,
            test_user_id,
            'update',
            'user',
            test_user_id,
            'User profile updated',
            '{"name": {"old": "Old Name", "new": "New Name"}}'::jsonb
        );

        RAISE NOTICE '✓ Audit log with changes JSON: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Audit log with changes JSON: FAILED - %', SQLERRM;
    END;

    -- Test 2.4: Audit log with IP address and user agent should work
    BEGIN
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, description, ip_address, user_agent)
        VALUES (
            test_tenant_id,
            test_user_id,
            'login',
            'session',
            'session_001',
            'User login',
            '192.168.1.100',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        );

        RAISE NOTICE '✓ Audit log with IP and user agent: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Audit log with IP and user agent: FAILED - %', SQLERRM;
    END;

    -- Test 2.5: Invalid action should fail
    BEGIN
        INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, description)
        VALUES (test_tenant_id, 'invalid_action', 'test', 'test_001', 'Invalid action test');

        RAISE NOTICE '✗ Invalid action: FAILED - Should have been blocked';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✓ Invalid action: SUCCESS - Correctly blocked invalid action';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Invalid action: FAILED - Unexpected error: %', SQLERRM;
    END;

    -- Test 2.6: Audit trail completeness - check created_at is set
    BEGIN
        -- Check that created_at is automatically set
        IF EXISTS (
            SELECT 1 FROM audit_logs
            WHERE tenant_id = test_tenant_id AND user_id = test_user_id
            AND created_at IS NOT NULL
        ) THEN
            RAISE NOTICE '✓ Audit trail timestamp: SUCCESS';
        ELSE
            RAISE NOTICE '✗ Audit trail timestamp: FAILED - created_at not set';
        END IF;
    END;

    -- Clean up test data
    DELETE FROM audit_logs WHERE tenant_id = test_tenant_id;
    DELETE FROM users WHERE id = test_user_id;
    DELETE FROM tenants WHERE id = test_tenant_id;

    RAISE NOTICE '=== AUDIT LOGS DATA VALIDATION TESTS COMPLETE ===';

END $$;

-- Test 3: Index Validation
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '=== AUDIT LOGS INDEX VALIDATION ===';

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
        WHERE t.relname = 'audit_logs' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
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
    RAISE NOTICE '=== AUDIT LOGS RLS POLICY VALIDATION ===';

    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'audit_logs' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ RLS is enabled on audit_logs table';
    ELSE
        RAISE NOTICE '✗ RLS is NOT enabled on audit_logs table';
    END IF;

    -- List all policies
    FOR policy_record IN
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'audit_logs' AND schemaname = 'public'
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
-- END OF AUDIT LOGS TABLE VALIDATION TESTS
-- ============================================================================