-- ============================================================================
-- MASTER VALIDATION SCRIPT
-- Purpose: Comprehensive database validation covering all aspects
-- Runs: Environment test + Schema drift + Permission checks + User ID verification
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXECUTE ALL VALIDATION SCRIPTS IN SEQUENCE
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║          DATABASE SCRIPT SYNCHRONIZATION - MASTER VALIDATION          ║';
RAISE NOTICE '║                         COMPREHENSIVE CHECK                            ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';
RAISE NOTICE '';

-- ============================================================================
-- PHASE 1: COMPREHENSIVE ENVIRONMENT TEST
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║                           PHASE 1: ENVIRONMENT TEST                      ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';

-- Environment Setup Verification
DO $$
DECLARE
    test_start_time TIMESTAMP;
    db_version TEXT;
    extension_count INTEGER;
BEGIN
    test_start_time := NOW();
    RAISE NOTICE '=== ENVIRONMENT SETUP TEST STARTED AT % ===', test_start_time;
    
    -- Test PostgreSQL version compatibility
    SELECT version() INTO db_version;
    RAISE NOTICE 'PostgreSQL Version: %', db_version;
    
    -- Check required extensions
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

-- Migration Execution Order Verification
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
END $$;

-- Seed Data Execution Verification
DO $$
DECLARE
    permission_count INTEGER;
    role_count INTEGER;
    user_count INTEGER;
    tenant_count INTEGER;
BEGIN
    RAISE NOTICE '=== SEED DATA EXECUTION TEST ===';
    
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

RAISE NOTICE '';

-- ============================================================================
-- PHASE 2: SCHEMA DRIFT DETECTION
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║                          PHASE 2: SCHEMA DRIFT DETECTION                ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'tenants', 'users', 'roles', 'permissions', 'user_roles', 
        'role_permissions', 'customers', 'sales', 'contracts',
        'audit_logs', 'reference_data'
    ];
    drift_count INTEGER := 0;
    table_name TEXT;
BEGIN
    RAISE NOTICE '=== SCHEMA DRIFT DETECTION STARTED ===';
    
    -- Detect unexpected tables
    RAISE NOTICE '--- UNEXPECTED TABLES DETECTION ---';
    
    FOR table_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN (SELECT unnest(expected_tables))
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
    LOOP
        RAISE NOTICE '⚠️  UNEXPECTED TABLE: %', table_name;
        drift_count := drift_count + 1;
    END LOOP;
    
    IF drift_count = 0 THEN
        RAISE NOTICE '✅ No unexpected tables found';
    END IF;
    
    -- Check missing expected tables
    RAISE NOTICE '--- MISSING EXPECTED TABLES DETECTION ---';
    
    FOR table_name IN 
        SELECT unnest(expected_tables)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name 
            AND table_type = 'BASE TABLE'
        ) THEN
            RAISE NOTICE '❌ MISSING EXPECTED TABLE: %', table_name;
            drift_count := drift_count + 1;
        ELSE
            RAISE NOTICE '✅ Expected table exists: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Schema drift issues found: %', drift_count;
END $$;

RAISE NOTICE '';

-- ============================================================================
-- PHASE 3: PERMISSION CONSISTENCY CHECKS
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║                     PHASE 3: PERMISSION CONSISTENCY CHECKS              ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';

DO $$
DECLARE
    new_format_count INTEGER;
    legacy_format_count INTEGER;
    permission_consistency_issues INTEGER := 0;
    admin_permissions_expected INTEGER := 34;
    current_admin_count INTEGER;
BEGIN
    RAISE NOTICE '=== PERMISSION CONSISTENCY CHECKS STARTED ===';
    
    -- Permission format analysis
    SELECT COUNT(*) INTO new_format_count
    FROM permissions
    WHERE name LIKE '%:%' 
    OR name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin');
    
    SELECT COUNT(*) INTO legacy_format_count
    FROM permissions
    WHERE name LIKE 'manage_%' 
    OR name LIKE '%_manage'
    AND name NOT IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin');
    
    RAISE NOTICE 'Permission format breakdown:';
    RAISE NOTICE '  - New format (resource:action): % permissions', new_format_count;
    RAISE NOTICE '  - Legacy format (manage_X): % permissions', legacy_format_count;
    
    IF new_format_count >= 30 AND legacy_format_count <= 10 THEN
        RAISE NOTICE '✅ PERMISSION FORMAT: GOOD (majority in new format)';
    ELSIF new_format_count >= 20 THEN
        RAISE NOTICE '⚠️  PERMISSION FORMAT: ACCEPTABLE (some legacy format remains)';
        permission_consistency_issues := permission_consistency_issues + 1;
    ELSE
        RAISE NOTICE '❌ PERMISSION FORMAT: POOR (too many legacy permissions)';
        permission_consistency_issues := permission_consistency_issues + 2;
    END IF;
    
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
        permission_consistency_issues := permission_consistency_issues + 1;
    ELSE
        RAISE NOTICE '❌ Administrator role: MAJOR ISSUE (too few permissions)';
        permission_consistency_issues := permission_consistency_issues + 2;
    END IF;
    
    RAISE NOTICE 'Permission consistency issues: %', permission_consistency_issues;
END $$;

RAISE NOTICE '';

-- ============================================================================
-- PHASE 4: AUTOMATED USER ID VERIFICATION
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║                       PHASE 4: AUTOMATED USER ID VERIFICATION            ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';

DO $$
DECLARE
    expected_users TEXT[] := ARRAY[
        'admin@acme.com', 'manager@acme.com', 'engineer@acme.com',
        'user@acme.com', 'admin@techsolutions.com', 'manager@techsolutions.com',
        'admin@globaltrading.com', 'superadmin@platform.com'
    ];
    verification_issues INTEGER := 0;
    auth_user_count INTEGER;
    db_user_count INTEGER;
    i INTEGER;
    current_email TEXT;
BEGIN
    RAISE NOTICE '=== AUTOMATED USER ID VERIFICATION STARTED ===';
    
    -- Overall user count verification
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO db_user_count FROM users;
    
    RAISE NOTICE 'User count comparison:';
    RAISE NOTICE '  - Auth users: %', auth_user_count;
    RAISE NOTICE '  - Database users: %', db_user_count;
    RAISE NOTICE '  - Expected users: %', array_length(expected_users, 1);
    
    IF auth_user_count = db_user_count THEN
        IF auth_user_count = array_length(expected_users, 1) THEN
            RAISE NOTICE '✅ USER COUNTS: PERFECT MATCH';
        ELSE
            RAISE NOTICE '⚠️  USER COUNTS: MATCH BUT UNEXPECTED TOTAL';
            verification_issues := verification_issues + 1;
        END IF;
    ELSE
        RAISE NOTICE '❌ USER COUNTS: MISMATCH BETWEEN AUTH AND DATABASE';
        verification_issues := verification_issues + 2;
    END IF;
    
    RAISE NOTICE 'User ID verification issues: %', verification_issues;
END $$;

RAISE NOTICE '';

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║                             FINAL SUMMARY                                  ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';

DO $$
DECLARE
    total_tables INTEGER;
    total_policies INTEGER;
    total_permissions INTEGER;
    total_users INTEGER;
    system_health_score INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tables FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO total_permissions FROM permissions;
    SELECT COUNT(*) INTO total_users FROM users;
    
    -- Calculate overall system health score (0-100)
    system_health_score := 0;
    
    -- Tables (25 points)
    IF total_tables >= 70 THEN system_health_score := system_health_score + 25;
    ELSIF total_tables >= 50 THEN system_health_score := system_health_score + 20;
    ELSIF total_tables >= 30 THEN system_health_score := system_health_score + 15;
    ELSE system_health_score := system_health_score + 10;
    END IF;
    
    -- RLS Policies (25 points)
    IF total_policies >= 150 THEN system_health_score := system_health_score + 25;
    ELSIF total_policies >= 100 THEN system_health_score := system_health_score + 20;
    ELSIF total_policies >= 50 THEN system_health_score := system_health_score + 15;
    ELSE system_health_score := system_health_score + 10;
    END IF;
    
    -- Permissions (25 points)
    IF total_permissions >= 80 THEN system_health_score := system_health_score + 25;
    ELSIF total_permissions >= 60 THEN system_health_score := system_health_score + 20;
    ELSIF total_permissions >= 40 THEN system_health_score := system_health_score + 15;
    ELSE system_health_score := system_health_score + 10;
    END IF;
    
    -- Users (25 points)
    IF total_users >= 10 THEN system_health_score := system_health_score + 25;
    ELSIF total_users >= 8 THEN system_health_score := system_health_score + 20;
    ELSIF total_users >= 5 THEN system_health_score := system_health_score + 15;
    ELSE system_health_score := system_health_score + 10;
    END IF;
    
    RAISE NOTICE 'System Statistics:';
    RAISE NOTICE '  📊 Tables: %', total_tables;
    RAISE NOTICE '  🔒 RLS Policies: %', total_policies;
    RAISE NOTICE '  🔑 Permissions: %', total_permissions;
    RAISE NOTICE '  👥 Users: %', total_users;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Overall System Health Score: %/100', system_health_score;
    
    IF system_health_score >= 90 THEN
        RAISE NOTICE '🎉 SYSTEM STATUS: EXCELLENT (Ready for Production)';
    ELSIF system_health_score >= 75 THEN
        RAISE NOTICE '✅ SYSTEM STATUS: GOOD (Minor optimizations recommended)';
    ELSIF system_health_score >= 60 THEN
        RAISE NOTICE '⚠️  SYSTEM STATUS: ACCEPTABLE (Some issues to address)';
    ELSIF system_health_score >= 40 THEN
        RAISE NOTICE '❌ SYSTEM STATUS: NEEDS IMPROVEMENT (Multiple issues found)';
    ELSE
        RAISE NOTICE '🚨 SYSTEM STATUS: CRITICAL (Major problems requiring immediate attention)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                    MASTER VALIDATION COMPLETED                          ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════════════╝';
END $$;

ROLLBACK;