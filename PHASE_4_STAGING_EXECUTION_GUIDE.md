---
title: Phase 4 Staging Execution Guide
description: Complete guide for executing Phase 4 database migrations in staging environment with pre-flight checks, procedures, and rollback strategies
date: 2025-11-08
version: 1.0.0
status: active
author: AI Agent
---

# Phase 4: Staging Execution Guide

**Purpose**: Execute Phase 4 database migrations in staging environment before production deployment  
**Timeline**: ~3-4 hours including verification  
**Environment**: Staging Database  
**Prerequisites**: All Phases 1-3 complete with 0 TypeScript errors

---

## Executive Summary

This guide provides everything needed to:
1. ✅ Verify readiness for staging execution
2. ✅ Create comprehensive database backups
3. ✅ Execute migrations in correct sequence
4. ✅ Verify data integrity after each migration
5. ✅ Validate application functionality
6. ✅ Rollback if issues detected

---

## PART 1: PRE-FLIGHT CHECKLIST

### A. Build & Code Quality Verification

```bash
# 1. Navigate to project directory
cd /path/to/CRMV9_NEWTHEME

# 2. Verify application builds without errors
npm run build
# Expected: ✅ 0 TypeScript errors, 5940+ modules transformed

# 3. Verify linting passes
npm run lint
# Expected: ✅ No new errors introduced

# 4. Verify tests pass
npm test
# Expected: ✅ All tests pass

# 5. Verify Git status (no uncommitted changes)
git status
# Expected: ✅ Clean working directory
```

**Sign-off**: _____ (Date: _____)

### B. Migration File Verification

Verify all migration files exist:

```bash
# Check all Phase 4 migration files exist
ls -la supabase/migrations/20250315000003_enhance_reference_tables.sql
ls -la supabase/migrations/20250322000021_create_sales_views.sql
ls -la supabase/migrations/20250322000022_create_crm_views.sql
ls -la supabase/migrations/20250322000023_create_contract_views.sql
ls -la supabase/migrations/20250322000024_create_job_works_views.sql
ls -la supabase/migrations/20250322000025_create_remaining_views.sql
ls -la supabase/migrations/20250328000026_remove_all_denormalized_fields.sql
ls -la supabase/migrations/20250328000027_add_performance_indexes.sql
```

**Expected Output**: All 8 files present and readable
**Sign-off**: _____ (Date: _____)

### C. Supabase Connection Verification

```bash
# 1. Verify Supabase CLI installed
supabase --version
# Expected: ✅ supabase-cli version X.X.X

# 2. Check Supabase status
supabase status
# Expected: ✅ Connected to project

# 3. Verify connection to staging database
psql -h staging-host -U staging-user -d crm_staging -c "SELECT version();"
# Expected: ✅ PostgreSQL version output
```

**Sign-off**: _____ (Date: _____)

### D. Staging Environment Readiness

```bash
# 1. Verify staging database is accessible
psql -h staging-host -U staging-user -d crm_staging -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
# Expected: ✅ 25+ tables

# 2. Verify staging has recent data
psql -h staging-host -U staging-user -d crm_staging -c "SELECT COUNT(*) FROM customers; SELECT COUNT(*) FROM sales; SELECT COUNT(*) FROM jobs;"
# Expected: ✅ Row counts match production (or acceptable test data)

# 3. Verify no existing views (should not exist yet)
psql -h staging-host -U staging-user -d crm_staging -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public';"
# Expected: ✅ 0 views (or existing views documented)
```

**Sign-off**: _____ (Date: _____)

### E. Team Readiness

- [ ] Database Admin available for entire migration window
- [ ] Developer available for post-migration testing
- [ ] QA available for smoke testing
- [ ] Rollback plan reviewed by team
- [ ] Communication channels established (Slack, email)
- [ ] Contingency plan documented

**Sign-off**: _____ (Date: _____)

---

## PART 2: BACKUP PROCEDURES

### Critical: Create Pre-Migration Backup

```bash
# Step 1: Create backup directory with timestamp
BACKUP_DIR="_backups/staging/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Step 2: Create full database backup
echo "Creating full database backup..."
pg_dump -h staging-host \
  -U staging-user \
  -d crm_staging \
  --format=custom \
  --verbose \
  > $BACKUP_DIR/staging_full_backup.dump

# Verify backup was created
ls -lh $BACKUP_DIR/staging_full_backup.dump
# Expected: ✅ File size > 10MB
```

### Create Schema-Only Backup

```bash
# Useful for reference in case full restore needed
pg_dump -h staging-host \
  -U staging-user \
  -d crm_staging \
  --schema-only \
  > $BACKUP_DIR/staging_schema_only.sql
```

### Create Data Export (CSV)

```bash
# Quick snapshot of critical tables
psql -h staging-host -U staging-user -d crm_staging << EOF > $BACKUP_DIR/staging_data_snapshot.txt
-- Table row counts before migration
SELECT 'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'job_works', COUNT(*) FROM job_works
ORDER BY table_name;
EOF
```

### Backup Verification

```bash
# Verify backup integrity
pg_restore -h localhost -U postgres -d test_db --list $BACKUP_DIR/staging_full_backup.dump | head -20
# Expected: ✅ Backup format readable, contains database objects

# Document backup details
cat > $BACKUP_DIR/BACKUP_INFO.txt << EOF
Backup Date: $(date)
Source: staging-host/crm_staging
Size: $(du -h $BACKUP_DIR/staging_full_backup.dump | cut -f1)
Type: Full database backup (custom format)
Backup Location: $BACKUP_DIR
Restore Command: pg_restore -h staging-host -U staging-user -d crm_staging -v $BACKUP_DIR/staging_full_backup.dump
EOF
```

**Backup Location**: `_backups/staging/$(date +%Y%m%d_%H%M%S)/`  
**Retention**: Keep for 30 days minimum  
**Sign-off**: _____ (Date: _____)

---

## PART 3: MIGRATION EXECUTION

### Pre-Execution Final Checks

```bash
# 1. Final Git commit (in case rollback needed)
git add -A
git commit -m "Pre-Phase4-Migration checkpoint"

# 2. Note current time
echo "Migration start time: $(date)"

# 3. Verify no active connections to database
psql -h staging-host -U staging-user -d crm_staging -c "SELECT pid, usename, query FROM pg_stat_activity WHERE datname='crm_staging' AND pid != pg_backend_pid();"
# Expected: ✅ No active connections (or only admin connection)
```

### Migration Execution Sequence

**CRITICAL**: Execute in this exact order. Do NOT skip any migration.

#### Migration 1: Enhance Reference Tables
**File**: `20250315000003_enhance_reference_tables.sql`  
**Duration**: ~30 seconds  
**Purpose**: Add suppliers table and reference data enhancements

```bash
echo "===== Migration 1: Enhance Reference Tables ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250315000003_enhance_reference_tables.sql

echo "End time: $(date)"
echo "✅ Migration 1 Complete"
```

**Verification**:
```sql
-- Verify suppliers table created
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'suppliers' AND table_schema = 'public';
-- Expected: ✅ 1 row

-- Verify RLS policies on suppliers
SELECT policyname FROM pg_policies WHERE tablename = 'suppliers';
-- Expected: ✅ 2 policies (select, modify)
```

#### Migration 2: Create Sales Views
**File**: `20250322000021_create_sales_views.sql`  
**Duration**: ~30 seconds  
**Purpose**: Create views for sales, sale_items, product_sales

```bash
echo "===== Migration 2: Create Sales Views ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250322000021_create_sales_views.sql

echo "End time: $(date)"
echo "✅ Migration 2 Complete"
```

**Verification**:
```sql
-- Verify views created
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('sales_with_details', 'sale_items_with_details', 'product_sales_with_details');
-- Expected: ✅ 3 rows

-- Test view query
SELECT COUNT(*) FROM sales_with_details;
-- Expected: ✅ Same as sales row count
```

#### Migration 3: Create CRM Views
**File**: `20250322000022_create_crm_views.sql`  
**Duration**: ~30 seconds  
**Purpose**: Create views for customers, tickets, ticket_comments

```bash
echo "===== Migration 3: Create CRM Views ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250322000022_create_crm_views.sql

echo "End time: $(date)"
echo "✅ Migration 3 Complete"
```

**Verification**:
```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%_with_details';
-- Expected: ✅ 5 views (including previous sales views)
```

#### Migration 4: Create Contract Views
**File**: `20250322000023_create_contract_views.sql`  
**Duration**: ~30 seconds

```bash
echo "===== Migration 4: Create Contract Views ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250322000023_create_contract_views.sql

echo "End time: $(date)"
echo "✅ Migration 4 Complete"
```

#### Migration 5: Create Job Works Views (CRITICAL)
**File**: `20250322000024_create_job_works_views.sql`  
**Duration**: ~1 minute  
**Purpose**: Create complex views for job works (5+ table JOINs)

```bash
echo "===== Migration 5: Create Job Works Views ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250322000024_create_job_works_views.sql

echo "End time: $(date)"
echo "✅ Migration 5 Complete"
```

**Verification** (Critical for complex view):
```sql
-- Test job_works_with_details view with sample query
SELECT 
  id, customer_id, product_id, receiver_engineer_id,
  customer_name, product_name, receiver_engineer_name
FROM job_works_with_details 
LIMIT 5;
-- Expected: ✅ 5 rows with all denormalized fields populated

-- Check execution time
EXPLAIN ANALYZE SELECT COUNT(*) FROM job_works_with_details;
-- Expected: ✅ Execution time < 1000ms for 100K rows
```

#### Migration 6: Create Remaining Views
**File**: `20250322000025_create_remaining_views.sql`  
**Duration**: ~30 seconds

```bash
echo "===== Migration 6: Create Remaining Views ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250322000025_create_remaining_views.sql

echo "End time: $(date)"
echo "✅ Migration 6 Complete"
```

---

## PART 4: DENORMALIZATION REMOVAL (POINT OF NO RETURN)

### ⚠️ CRITICAL WARNING

The following migration removes 45+ denormalized columns. **ENSURE BACKUPS VERIFIED BEFORE PROCEEDING**.

```bash
# Final confirmation
read -p "Backups verified? (yes/no): " response
if [ "$response" != "yes" ]; then
  echo "Migration aborted. Verify backups first."
  exit 1
fi

echo "===== Migration 7: Remove All Denormalized Fields ====="
echo "⚠️  POINT OF NO RETURN - Starting denormalization removal"
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250328000026_remove_all_denormalized_fields.sql

echo "End time: $(date)"
echo "✅ Migration 7 Complete - All 45+ denormalized fields removed"
```

**Verification After Denormalization Removal**:

```sql
-- 1. Verify columns removed from products
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN ('category', 'is_active', 'supplier_name');
-- Expected: ✅ 0 rows (columns removed)

-- 2. Verify columns removed from sales
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sales'
  AND column_name IN ('customer_name', 'assigned_to_name', 'amount');
-- Expected: ✅ 0 rows

-- 3. Verify all IDs still present
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sales'
  AND column_name IN ('customer_id', 'assigned_to', 'value');
-- Expected: ✅ 3 rows (IDs still present)

-- 4. Verify views still work (they should be unaffected)
SELECT COUNT(*) FROM sales_with_details;
SELECT COUNT(*) FROM job_works_with_details;
-- Expected: ✅ Same row counts as before
```

---

## PART 5: PERFORMANCE INDEXES

```bash
echo "===== Migration 8: Add Performance Indexes ====="
echo "Start time: $(date)"

psql -h staging-host \
  -U staging-user \
  -d crm_staging \
  -f supabase/migrations/20250328000027_add_performance_indexes.sql

echo "End time: $(date)"
echo "✅ Migration 8 Complete - 30+ indexes added"
```

**Verification**:

```sql
-- Count indexes created
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
-- Expected: ✅ 30+ indexes

-- Verify critical indexes exist
SELECT indexname FROM pg_indexes 
WHERE indexname IN (
  'idx_sales_tenant_customer',
  'idx_job_works_engineer_tenant',
  'idx_tickets_status_priority'
)
ORDER BY indexname;
-- Expected: ✅ 3 rows
```

---

## PART 6: POST-MIGRATION VERIFICATION

### Phase 6.1: Data Integrity Check

```bash
# Execute comprehensive data verification
psql -h staging-host -U staging-user -d crm_staging << EOF > /tmp/data_integrity_check.txt

-- 1. Verify row counts unchanged
SELECT 'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'job_works', COUNT(*) FROM job_works
UNION ALL
SELECT 'complaints', COUNT(*) FROM complaints
ORDER BY table_name;

-- 2. Verify FK relationships intact
SELECT 'sales_customer_fk' as check_name, COUNT(*) as valid_count
FROM sales WHERE customer_id IS NULL;

SELECT 'tickets_customer_fk', COUNT(*)
FROM tickets WHERE customer_id IS NOT NULL 
  AND customer_id NOT IN (SELECT id FROM customers);

SELECT 'job_works_customer_fk', COUNT(*)
FROM job_works WHERE customer_id IS NOT NULL 
  AND customer_id NOT IN (SELECT id FROM customers);

-- 3. Verify no orphaned records
SELECT 'orphaned_sales', COUNT(*)
FROM sales WHERE customer_id NOT IN (SELECT id FROM customers WHERE customer_id IS NOT NULL);

SELECT 'orphaned_tickets', COUNT(*)
FROM tickets WHERE customer_id NOT IN (SELECT id FROM customers WHERE customer_id IS NOT NULL);

-- 4. Verify views return expected data
SELECT 'sales_view_rows', COUNT(*) FROM sales_with_details;
SELECT 'tickets_view_rows', COUNT(*) FROM tickets_with_details;
SELECT 'job_works_view_rows', COUNT(*) FROM job_works_with_details;

EOF

# Display results
cat /tmp/data_integrity_check.txt
```

### Phase 6.2: Application Code Testing

```bash
# 1. Deploy staging application code
cd /path/to/CRMV9_NEWTHEME
npm run build
# Expected: ✅ 0 TypeScript errors

# 2. Run full test suite
npm test
# Expected: ✅ All tests pass

# 3. Start staging application
npm run dev
# Expected: ✅ Application starts without errors
```

### Phase 6.3: Smoke Tests

```bash
# Test as different users/roles
curl -H "Authorization: Bearer $STAGING_USER_TOKEN" \
  https://staging.api.example.com/api/sales
# Expected: ✅ 200 OK, returns data with customer_id (not customer_name)

curl -H "Authorization: Bearer $STAGING_USER_TOKEN" \
  https://staging.api.example.com/api/tickets
# Expected: ✅ 200 OK, normalized structure

curl -H "Authorization: Bearer $STAGING_USER_TOKEN" \
  https://staging.api.example.com/api/job-works
# Expected: ✅ 200 OK, all fields present
```

### Phase 6.4: Performance Baseline Comparison

```sql
-- Compare query performance before/after (if baseline recorded)
-- Example: Check index usage

SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Expected: ✅ New indexes showing high scan counts
```

---

## PART 7: ROLLBACK PROCEDURES

### If Issues Detected During Migration

**Stop immediately** and follow this rollback procedure:

```bash
# Step 1: Note failure point
echo "Migration failed at step: ___________"
echo "Error: ___________"

# Step 2: Stop any running application instances
# (Instructions specific to your deployment)

# Step 3: Verify backup exists
ls -lh $BACKUP_DIR/staging_full_backup.dump
```

### Full Database Rollback

```bash
# WARNING: This completely reverts the database to pre-migration state

# Step 1: Connect to database
psql -h staging-host -U staging-user -d crm_staging

# Step 2: Drop all Phase 4 objects (views first, then indexes)
DROP VIEW IF EXISTS sales_with_details CASCADE;
DROP VIEW IF EXISTS sale_items_with_details CASCADE;
DROP VIEW IF EXISTS product_sales_with_details CASCADE;
DROP VIEW IF EXISTS customers_with_stats CASCADE;
DROP VIEW IF EXISTS tickets_with_details CASCADE;
DROP VIEW IF EXISTS ticket_comments_with_details CASCADE;
DROP VIEW IF EXISTS contracts_with_details CASCADE;
DROP VIEW IF EXISTS contract_approval_records_with_details CASCADE;
DROP VIEW IF EXISTS job_works_with_details CASCADE;
DROP VIEW IF EXISTS job_work_specifications_with_details CASCADE;
DROP VIEW IF EXISTS service_contracts_with_details CASCADE;
DROP VIEW IF EXISTS complaints_with_details CASCADE;

-- Drop indexes (pg_stat_user_indexes will show them)
DROP INDEX IF EXISTS idx_sales_tenant_customer;
DROP INDEX IF EXISTS idx_job_works_engineer_tenant;
-- ... (repeat for all indexes from migration 8)

# Step 3: If columns were removed, restore from backup
pg_restore -h staging-host \
  -U staging-user \
  -d crm_staging \
  -v \
  $BACKUP_DIR/staging_full_backup.dump

echo "✅ Rollback complete - Database restored to pre-migration state"
```

### Partial Rollback (Specific Issues Only)

```bash
# If only denormalized fields need to be restored:

# Option 1: Restore specific columns using backup schema
psql -h staging-host -U staging-user -d crm_staging << EOF
-- Recreate removed columns
ALTER TABLE products ADD COLUMN category VARCHAR(255);
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN supplier_name VARCHAR(255);
-- ... (repeat for other removed columns)

-- Restore data from backup
-- (Use SQL SELECT INTO or data import if needed)
EOF
```

---

## PART 8: SIGN-OFF & DOCUMENTATION

### Execution Summary

```
Migration Start Time: _______________
Migration End Time: _______________
Total Duration: _______________

Migrations Applied:
[ ] 20250315000003 - Enhance Reference Tables
[ ] 20250322000021 - Create Sales Views
[ ] 20250322000022 - Create CRM Views
[ ] 20250322000023 - Create Contract Views
[ ] 20250322000024 - Create Job Works Views
[ ] 20250322000025 - Create Remaining Views
[ ] 20250328000026 - Remove Denormalized Fields
[ ] 20250328000027 - Add Performance Indexes

Data Integrity: ✅ VERIFIED
Tests Passed: ✅ PASSED
Smoke Tests: ✅ PASSED
Performance: ✅ ACCEPTABLE

Issues Encountered: NONE / List below
_____________________________________
_____________________________________

Rollback Required: YES / NO
If YES, rollback completed at: _______
```

### Sign-Offs

- **Database Administrator**: _________________ (Date: ______) (Time: ______)
- **Lead Developer**: _________________ (Date: ______) (Time: ______)
- **QA Lead**: _________________ (Date: ______) (Time: ______)
- **Project Manager**: _________________ (Date: ______) (Time: ______)

---

## APPENDIX: Troubleshooting

### Migration Hangs

**Symptom**: Migration appears to be running but no progress for > 5 minutes

**Solution**:
```bash
# Check for blocking queries
psql -h staging-host -U staging-user -d crm_staging -c "
SELECT pid, usename, query, query_start, state 
FROM pg_stat_activity 
WHERE datname = 'crm_staging' 
  AND state != 'idle';"

# Kill blocking query if safe
SELECT pg_terminate_backend(pid);
```

### Foreign Key Violations

**Symptom**: Migration fails with foreign key constraint errors

**Solution**: Verify data integrity before migration:
```sql
-- Check for orphaned records
SELECT * FROM sales WHERE customer_id NOT IN (SELECT id FROM customers);
-- Delete orphaned records or restore from backup
```

### Index Creation Failures

**Symptom**: "Index creation failed" errors

**Solution**:
```bash
# Check table/index permissions
psql -h staging-host -U staging-user -d crm_staging -c "
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'sales';"

# Recreate index manually
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

---

## APPENDIX: Performance Benchmarking

### Pre-Migration Query Times (Record Before)
```
Sales list query: _______ ms
Tickets query: _______ ms
Job works query: _______ ms
Customer stats: _______ ms
```

### Post-Migration Query Times (Record After)
```
Sales list query: _______ ms
Tickets query: _______ ms
Job works query: _______ ms
Customer stats: _______ ms
```

### Calculated Improvement
```
Sales improvement: _______ %
Tickets improvement: _______ %
Job works improvement: _______ %
Average improvement: _______ %
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**Next Review**: After staging execution
