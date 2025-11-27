-- ============================================================================
-- UUID EXTENSIONS PRE-ENABLEMENT SCRIPT
-- This script ensures UUID extensions are available before any migration runs
-- 
-- IMPORTANT: Run this script FIRST before executing any migrations that use UUID functions
-- 
-- Date: November 23, 2025
-- Status: Ready for immediate execution
-- ============================================================================

-- Enable required PostgreSQL extensions
-- These provide uuid_generate_v4() and other UUID generation functions

-- Option 1: uuid-ossp extension (most common)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Option 2: pgcrypto extension (alternative)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Option 3: PostgreSQL 13+ built-in function (no extension needed)
-- gen_random_uuid() is available by default in PostgreSQL 13+

-- Verify extensions are available
DO $$
BEGIN
    -- Test uuid_generate_v4() function
    PERFORM uuid_generate_v4();
    RAISE NOTICE 'uuid_generate_v4() function is available';
    
    -- Test gen_random_uuid() function  
    PERFORM gen_random_uuid();
    RAISE NOTICE 'gen_random_uuid() function is available';
    
    RAISE NOTICE 'UUID extensions are successfully enabled!';
EXCEPTION
    WHEN undefined_function THEN
        RAISE EXCEPTION 'UUID functions not available. Please ensure uuid-ossp or pgcrypto extensions are installed.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error testing UUID functions: %', SQLERRM;
END $$;

-- Show enabled extensions
SELECT 
    name,
    comment
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY e.extname;

-- ============================================================================
-- END OF UUID EXTENSIONS PRE-ENABLEMENT SCRIPT
-- ============================================================================