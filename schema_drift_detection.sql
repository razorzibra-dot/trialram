-- ============================================================================
-- SCHEMA DRIFT DETECTION SCRIPT
-- Task: 4.2.2 - Add schema drift detection
-- Purpose: Detect unexpected changes to database schema
-- ============================================================================

BEGIN;

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'tenants', 'users', 'roles', 'permissions', 'user_roles', 
        'role_permissions', 'customers', 'sales', 'contracts',
        'audit_logs', 'reference_data'
    ];
    expected_columns RECORD;
    actual_columns RECORD;
    drift_count INTEGER := 0;
    table_name TEXT;
    column_name TEXT;
    column_type TEXT;
    expected_column_types TEXT[] := ARRAY[
        'character varying', 'text', 'uuid', 'timestamp with time zone', 
        'integer', 'boolean', 'jsonb', 'numeric'
    ];
BEGIN
    RAISE NOTICE '=== SCHEMA DRIFT DETECTION STARTED ===';
    RAISE NOTICE 'Scanning for unexpected schema changes...';
    RAISE NOTICE '';

    -- ============================================================================
    -- SECTION 1: DETECT UNEXPECTED TABLES
    -- ============================================================================
    
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
    
    -- ============================================================================
    -- SECTION 2: DETECT MISSING EXPECTED TABLES
    -- ============================================================================
    
    RAISE NOTICE '';
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
    
    -- ============================================================================
    -- SECTION 3: DETECT COLUMN TYPE DRIFT
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- COLUMN TYPE DRIFT DETECTION ---';
    
    -- Check critical columns in key tables
    FOR expected_columns IN 
        SELECT table_name, column_name, data_type 
        FROM (
            VALUES 
                ('users', 'id', 'uuid'),
                ('users', 'email', 'character varying'),
                ('users', 'tenant_id', 'uuid'),
                ('roles', 'id', 'uuid'),
                ('roles', 'name', 'character varying'),
                ('permissions', 'id', 'uuid'),
                ('permissions', 'name', 'character varying'),
                ('permissions', 'resource', 'character varying'),
                ('permissions', 'action', 'character varying'),
                ('tenants', 'id', 'uuid'),
                ('tenants', 'name', 'character varying'),
                ('customers', 'id', 'uuid'),
                ('customers', 'tenant_id', 'uuid')
        ) AS expected(table_name, column_name, data_type)
    LOOP
        -- Check if table and column exist
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = expected_columns.table_name 
            AND column_name = expected_columns.column_name
        ) THEN
            -- Get actual column type
            SELECT data_type INTO column_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = expected_columns.table_name 
            AND column_name = expected_columns.column_name;
            
            -- Compare with expected type
            IF column_type <> expected_columns.data_type THEN
                RAISE NOTICE '⚠️  COLUMN TYPE MISMATCH: %.% expected: %, actual: %', 
                    expected_columns.table_name, expected_columns.column_name, 
                    expected_columns.data_type, column_type;
                drift_count := drift_count + 1;
            ELSE
                RAISE NOTICE '✅ Column type correct: %.% (%)', 
                    expected_columns.table_name, expected_columns.column_name, column_type;
            END IF;
        ELSE
            RAISE NOTICE '❌ COLUMN MISSING: %.%', 
                expected_columns.table_name, expected_columns.column_name;
            drift_count := drift_count + 1;
        END IF;
    END LOOP;
    
    -- ============================================================================
    -- SECTION 4: DETECT MISSING CONSTRAINTS
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- CONSTRAINT VALIDATION ---';
    
    -- Check for primary keys on critical tables
    FOR table_name IN 
        SELECT unnest(expected_tables)
        WHERE unnest(expected_tables) IN ('users', 'roles', 'permissions', 'tenants')
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = table_name 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            RAISE NOTICE '✅ Primary key exists: %', table_name;
        ELSE
            RAISE NOTICE '⚠️  MISSING PRIMARY KEY: %', table_name;
            drift_count := drift_count + 1;
        END IF;
    END LOOP;
    
    -- Check for foreign key constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✅ Foreign keys exist: user_roles';
    ELSE
        RAISE NOTICE '⚠️  MISSING FOREIGN KEYS: user_roles';
        drift_count := drift_count + 1;
    END IF;
    
    -- ============================================================================
    -- SECTION 5: DETECT UNEXPECTED INDEXES
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '--- INDEX VALIDATION ---';
    
    -- Check for expected indexes
    FOR expected_columns IN 
        SELECT table_name, column_name 
        FROM (
            VALUES 
                ('users', 'email'),
                ('users', 'tenant_id'),
                ('roles', 'name'),
                ('permissions', 'name'),
                ('tenants', 'name'),
                ('customers', 'tenant_id')
        ) AS expected(table_name, column_name)
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = expected_columns.table_name 
            AND indexdef LIKE '%' || expected_columns.column_name || '%'
        ) THEN
            RAISE NOTICE '✅ Index exists: % (%)', expected_columns.table_name, expected_columns.column_name;
        ELSE
            RAISE NOTICE '⚠️  MISSING INDEX: % (%)', expected_columns.table_name, expected_columns.column_name;
            -- Don't count missing indexes as critical drift
        END IF;
    END LOOP;
    
    -- ============================================================================
    -- SECTION 6: SUMMARY REPORT
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA DRIFT DETECTION SUMMARY ===';
    
    IF drift_count = 0 THEN
        RAISE NOTICE '✅ SCHEMA STATUS: NO DRIFT DETECTED';
        RAISE NOTICE 'Database schema matches expected configuration';
    ELSIF drift_count <= 3 THEN
        RAISE NOTICE '⚠️  SCHEMA STATUS: MINOR DRIFT DETECTED';
        RAISE NOTICE 'Found % potential schema changes', drift_count;
        RAISE NOTICE 'Review changes to ensure they are intentional';
    ELSE
        RAISE NOTICE '❌ SCHEMA STATUS: SIGNIFICANT DRIFT DETECTED';
        RAISE NOTICE 'Found % schema inconsistencies', drift_count;
        RAISE NOTICE 'Immediate investigation required';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA DRIFT DETECTION COMPLETED ===';
END $$;

ROLLBACK;