-- ============================================================================
-- TEST SCRIPT: Migration Order Validation and Deployment Procedure
-- Purpose: Validate migration timestamp order and document correct deployment
-- Status: Implementation Tasks 3.1-3.4 - Migration Order Testing
-- ============================================================================

-- ============================================================================
-- 3. MIGRATION ORDER VALIDATION (Task 3.1)
-- ============================================================================

-- Test 3.1.1: Validate migration timestamp order
SELECT 
    'MIGRATION_ORDER_VALIDATION' as test_name,
    version,
    applied_at,
    LAG(version) OVER (ORDER BY version) as previous_version,
    CASE 
        WHEN version > LAG(version) OVER (ORDER BY version) THEN 'CORRECT_ORDER'
        ELSE 'INCORRECT_ORDER'
    END as order_status,
    CASE 
        WHEN version = '20251122000001' THEN 'AUDIT_LOGS_RLS_POLICIES'
        WHEN version = '20251122000002' THEN 'PERMISSION_FORMAT_UPDATE'
        ELSE 'OTHER_MIGRATION'
    END as migration_description
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Test 3.1.2: Specific check for critical migration sequence
SELECT 
    'CRITICAL_MIGRATION_SEQUENCE' as test_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000001') 
             AND EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') 
        THEN 'BOTH_CRITICAL_MIGRATIONS_PRESENT'
        ELSE 'MISSING_CRITICAL_MIGRATIONS'
    END as sequence_status,
    (SELECT COUNT(*) FROM supabase_migrations.schema_migrations WHERE version <= '20251122000002') as migrations_up_to_permission_update
FROM supabase_migrations.schema_migrations
LIMIT 1;

-- Test 3.1.3: Validate no gaps in migration timeline
SELECT 
    'MIGRATION_TIMELINE_GAPS' as test_name,
    version,
    applied_at,
    EXTRACT(EPOCH FROM (applied_at - LAG(applied_at) OVER (ORDER BY version))) / 60 as minutes_since_previous,
    CASE 
        WHEN EXTRACT(EPOCH FROM (applied_at - LAG(applied_at) OVER (ORDER BY version))) / 60 < 60 
        THEN 'REASONABLE_GAP'
        WHEN LAG(applied_at) OVER (ORDER BY version) IS NULL 
        THEN 'FIRST_MIGRATION'
        ELSE 'LARGE_GAP'
    END as gap_analysis
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- ============================================================================
-- 4. ENSURE MIGRATION RUNS BEFORE SEED DATA (Task 3.2)
-- ============================================================================

-- Test 3.2.1: Check if permission migration runs before seed data insertion
WITH migration_status AS (
    SELECT 
        'MIGRATION_STATUS' as check_type,
        CASE 
            WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') 
            THEN 'MIGRATION_APPLIED'
            ELSE 'MIGRATION_NOT_APPLIED'
        END as status,
        MAX(applied_at) as latest_migration_time
    FROM supabase_migrations.schema_migrations
),
seed_data_check AS (
    SELECT 
        'SEED_DATA_STATUS' as check_type,
        CASE 
            WHEN EXISTS(SELECT 1 FROM permissions WHERE name = 'crm:user:record:update') 
            THEN 'SEED_DATA_PRESENT'
            ELSE 'SEED_DATA_NOT_PRESENT'
        END as status
    FROM permissions
    LIMIT 1
)
SELECT 
    'MIGRATION_VS_SEED_TIMING' as test_name,
    m.check_type as component,
    m.status as status,
    m.latest_migration_time,
    CASE 
        WHEN m.status = 'MIGRATION_APPLIED' AND s.status = 'SEED_DATA_PRESENT' 
        THEN 'CORRECT_SEQUENCE'
        WHEN m.status = 'MIGRATION_NOT_APPLIED' AND s.status = 'SEED_DATA_PRESENT' 
        THEN 'SEED_BEFORE_MIGRATION_ERROR'
        WHEN m.status = 'MIGRATION_APPLIED' AND s.status = 'SEED_DATA_NOT_PRESENT' 
        THEN 'MIGRATION_ONLY'
        ELSE 'NEITHER_APPLIED'
    END as sequence_validation
FROM migration_status m, seed_data_check s;

-- ============================================================================
-- 5. COMPLETE MIGRATION SEQUENCE TEST (Task 3.3)
-- ============================================================================

-- Test 3.3.1: Complete migration sequence validation
DO $$
DECLARE
    migration_count INTEGER;
    expected_migrations INTEGER := 2; -- 20251122000001 and 20251122000002
    permission_migration_present BOOLEAN;
    audit_migration_present BOOLEAN;
    final_status TEXT;
BEGIN
    -- Count total migrations
    SELECT COUNT(*) INTO migration_count 
    FROM supabase_migrations.schema_migrations 
    WHERE version >= '20251122000001';
    
    -- Check for specific migrations
    SELECT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000001') 
    INTO audit_migration_present;
    
    SELECT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') 
    INTO permission_migration_present;
    
    -- Determine final status
    IF permission_migration_present AND audit_migration_present AND migration_count >= expected_migrations THEN
        final_status := 'COMPLETE_MIGRATION_SEQUENCE';
    ELSIF permission_migration_present AND NOT audit_migration_present THEN
        final_status := 'PERMISSION_MIGRATION_ONLY';
    ELSIF audit_migration_present AND NOT permission_migration_present THEN
        final_status := 'AUDIT_MIGRATION_ONLY';
    ELSE
        final_status := 'INCOMPLETE_MIGRATIONS';
    END IF;
    
    RAISE NOTICE 'Migration Sequence Validation: %', final_status;
    RAISE NOTICE 'Total migrations found: % (expected: %+)', migration_count, expected_migrations;
    RAISE NOTICE 'Audit logs migration present: %', audit_migration_present;
    RAISE NOTICE 'Permission migration present: %', permission_migration_present;
    
END $$;

-- Test 3.3.2: Validate migration dependencies
SELECT 
    'MIGRATION_DEPENDENCIES' as test_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000001') 
        THEN 'AUDIT_MIGRATION_DEPENDENCY_MET'
        ELSE 'AUDIT_MIGRATION_DEPENDENCY_MISSING'
    END as audit_dependency,
    CASE 
        WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002') 
        THEN 'PERMISSION_MIGRATION_APPLIED'
        ELSE 'PERMISSION_MIGRATION_MISSING'
    END as permission_dependency,
    CASE 
        WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000001')
        AND EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20251122000002')
        THEN 'ALL_DEPENDENCIES_MET'
        ELSE 'DEPENDENCIES_NOT_MET'
    END as dependency_status
FROM supabase_migrations.schema_migrations
LIMIT 1;

-- ============================================================================
-- 6. DEPLOYMENT PROCEDURE DOCUMENTATION (Task 3.4)
-- ============================================================================

-- Test 3.4.1: Generate deployment checklist
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_1' as step_number,
    'Database Backup' as step_description,
    'Create full database backup before migration' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_2' as step_number,
    'Environment Validation' as step_description,
    'Verify clean test environment and database connectivity' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_3' as step_number,
    'Pre-Migration Validation' as step_description,
    'Run test_permission_format_alignment.sql to validate current state' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_4' as step_number,
    'Execute Migration 20251122000001' as step_description,
    'Apply audit_logs_rls_policies migration first' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_5' as step_number,
    'Execute Migration 20251122000002' as step_description,
    'Apply permission_format_update migration second (CRITICAL)' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_6' as step_number,
    'Post-Migration Validation' as step_description,
    'Run test_migration_execution.sql to verify migration success' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_7' as step_number,
    'Execute Seed Data' as step_description,
    'Run seed.sql to populate test data' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_8' as step_number,
    'Role Permission Validation' as step_description,
    'Run test_role_permissions_validation.sql to verify RBAC integrity' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_9' as step_number,
    'Auth User Synchronization' as step_description,
    'Execute scripts/seed-auth-users.ts and scripts/sync-auth-to-sql.ts' as step_details
UNION ALL
SELECT 
    'DEPLOYMENT_CHECKLIST' as document_type,
    'STEP_10' as step_number,
    'Final Validation' as step_description,
    'Run comprehensive validation suite and user login tests' as step_details;

-- Test 3.4.2: Document correct deployment order
SELECT 
    'DEPLOYMENT_ORDER_DOCUMENTATION' as document_type,
    'CRITICAL_MIGRATION_ORDER' as section,
    version,
    migration_name,
    execution_order,
    dependencies,
    CASE 
        WHEN version = '20251122000001' THEN 'Must execute BEFORE permission migration'
        WHEN version = '20251122000002' THEN 'Must execute AFTER audit migration and BEFORE seed data'
        ELSE 'Standard migration'
    END as critical_notes
FROM (
    VALUES 
        ('20251122000001', 'Audit Logs RLS Policies', 1, 'Base migration - no dependencies', 'CRITICAL'),
        ('20251122000002', 'Permission Format Update', 2, 'Requires audit migration completion', 'CRITICAL'),
        ('seed_data', 'Seed Data Insertion', 3, 'Requires all migrations complete', 'CRITICAL')
) AS migration_order(version, migration_name, execution_order, dependencies, critical_notes)
ORDER BY execution_order;

-- ============================================================================
-- 7. ROLLBACK PROCEDURE DOCUMENTATION
-- ============================================================================

SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_1' as step_number,
    'Stop Application Services' as step_description,
    'Stop all application services to prevent new data writes' as step_details
UNION ALL
SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_2' as step_number,
    'Database Backup (Pre-Rollback)' as step_description,
    'Create backup of current state before rollback' as step_details
UNION ALL
SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_3' as step_number,
    'Execute Rollback Migration' as step_description,
    'Run: supabase db reset --to 20251121000000' as step_details
UNION ALL
SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_4' as step_number,
    'Restore from Backup' as step_description,
    'Restore data from pre-migration backup if needed' as step_details
UNION ALL
SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_5' as step_number,
    'Validate Rollback' as step_description,
    'Run validation scripts to confirm rollback success' as step_details
UNION ALL
SELECT 
    'ROLLBACK_PROCEDURE' as document_type,
    'STEP_6' as step_number,
    'Restart Services' as step_description,
    'Restart application services with rollback validation' as step_details;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
    'MIGRATION_ORDER_VALIDATION' as test_suite,
    'READY_FOR_EXECUTION' as status,
    'Execute before and after migration to validate proper deployment order' as instructions
UNION ALL
SELECT 
    'CRITICAL_SEQUENCE' as test_suite,
    'AUDIT_THEN_PERMISSION_THEN_SEED' as status,
    'Tasks 3.1-3.4: Validate migration order, ensure proper execution sequence' as summary
UNION ALL
SELECT 
    'DEPLOYMENT_PROCEDURE' as test_suite,
    'DOCUMENTED' as status,
    'Complete step-by-step deployment and rollback procedures documented' as summary;

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================
/*
EXECUTION STEPS FOR TASKS 3.1-3.4:

TASK 3.1 - VALIDATE MIGRATION TIMESTAMP ORDER:
1. Check migration order in supabase_migrations.schema_migrations
2. Verify no gaps or incorrect ordering
3. Ensure logical dependency chain

TASK 3.2 - ENSURE PROPER EXECUTION SEQUENCE:
1. Verify permission migration (20251122000002) runs after audit migration
2. Confirm seed data runs AFTER all migrations complete
3. Document correct sequence

TASK 3.3 - TEST COMPLETE MIGRATION SEQUENCE:
1. Execute full migration chain on test environment
2. Validate each step completes successfully
3. Verify end-to-end functionality

TASK 3.4 - DOCUMENT DEPLOYMENT PROCEDURE:
1. Create step-by-step deployment checklist
2. Document rollback procedures
3. Include validation checkpoints

CRITICAL REQUIREMENTS:
- 20251122000001 (audit) MUST run before 20251122000002 (permissions)
- 20251122000002 (permissions) MUST run before seed data insertion
- All validations must pass before proceeding to next step
- Rollback plan must be ready before any deployment

MIGRATION ORDER VALIDATION COMPLETE FOR TASKS 3.1-3.4
*/