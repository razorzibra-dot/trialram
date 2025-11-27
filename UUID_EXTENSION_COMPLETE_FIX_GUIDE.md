# UUID Extension Error - Complete Fix Guide

## Problem
```
ERROR: function uuid_generate_v4() does not exist (SQLSTATE 42883)
At statement: 35
```

## Root Cause Analysis
The `uuid_generate_v4()` function requires PostgreSQL extensions that may not be enabled in your environment.

## Solution Options

### Option 1: Enable Extensions First (RECOMMENDED)
**Execute this script FIRST in Supabase SQL Editor:**

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify it worked
SELECT uuid_generate_v4() as test_uuid;
```

### Option 2: Use Built-in Function (Alternative)
**Replace `uuid_generate_v4()` with `gen_random_uuid()`** in your SQL files:
- `gen_random_uuid()` is available in PostgreSQL 13+ without extensions
- This is a permanent fix if you can't enable extensions

### Option 3: Check Current Extensions
**Verify what's available in your database:**

```sql
-- Check installed extensions
SELECT name, comment FROM pg_extension WHERE name IN ('uuid-ossp', 'pgcrypto');

-- Test both UUID functions
SELECT uuid_generate_v4() as uuid_v4;
SELECT gen_random_uuid() as gen_uuid;
```

## Files Already Fixed
✅ **All migration files now include extension enablement:**
- `20250101000002_master_data_companies_products.sql` 
- `20250101000003_crm_customers_sales_tickets.sql`
- `20250101000004_contracts.sql`
- `20250101000005_advanced_product_sales_jobwork.sql`
- `20250101000006_notifications_and_indexes.sql`
- `20250101000008_customer_tags.sql`
- `20250101000009_fix_rbac_schema.sql`

## Immediate Steps to Fix

### Step 1: Run Extension Enable Script
Execute this in your Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 2: Test the Fix
```sql
SELECT uuid_generate_v4() as test;
```
Should return a UUID like: `550e8400-e29b-41d4-a716-446655440000`

### Step 3: Re-run Migrations
After extensions are enabled, your migrations should work without errors.

## Environment-Specific Solutions

### Supabase Local Development
```bash
# If using Supabase CLI, enable extensions in local database
supabase db reset
```

### Docker/External PostgreSQL
```bash
# In your PostgreSQL container or external database
# Connect to PostgreSQL and run:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Production Supabase
```sql
-- In Supabase Dashboard > SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Verification Checklist

- [ ] Extensions installed: `SELECT * FROM pg_extension WHERE name IN ('uuid-ossp', 'pgcrypto');`
- [ ] Function works: `SELECT uuid_generate_v4();`
- [ ] Migrations run without errors
- [ ] No breaking changes to existing data

## Alternative: Migrate to gen_random_uuid()

If you prefer not to enable extensions, replace all instances of:
- `uuid_generate_v4()` → `gen_random_uuid()`

This requires updating all affected migration files but provides a extension-free solution.

## Quick Test Script

Run this complete test to verify everything works:

```sql
-- Test script to verify UUID functionality
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    -- Test uuid_generate_v4()
    SELECT uuid_generate_v4() INTO test_uuid;
    RAISE NOTICE 'uuid_generate_v4() result: %', test_uuid;
    
    -- Test gen_random_uuid()
    SELECT gen_random_uuid() INTO test_uuid;
    RAISE NOTICE 'gen_random_uuid() result: %', test_uuid;
    
    RAISE NOTICE 'All UUID functions working correctly!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'UUID test failed: %', SQLERRM;
END $$;
```

## Troubleshooting

### If `uuid_generate_v4()` still doesn't work:
1. Check PostgreSQL version: `SELECT version();`
2. Try `gen_random_uuid()` instead (PostgreSQL 13+)
3. Verify extensions are installed in correct schema
4. Check if running as superuser (may need elevated privileges)

### If extensions can't be installed:
1. Contact your database administrator
2. Use `gen_random_uuid()` as fallback
3. Consider upgrading PostgreSQL version

## Success Indicators
When the fix is working:
- `SELECT uuid_generate_v4();` returns a valid UUID
- Migration scripts execute without the "does not exist" error
- Database schema creation completes successfully

---
**Status**: Ready for deployment  
**Priority**: High - Fix required before any UUID-based table creation  
**Testing**: Run extension enable script first, then verify with test queries