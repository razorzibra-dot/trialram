---
title: Phase 4 Rollback Procedures & Contingency Plans
description: Comprehensive rollback procedures for Phase 4 database migrations with contingency plans for various failure scenarios
date: 2025-11-08
version: 1.0.0
status: active
author: AI Agent
---

# Phase 4: Rollback Procedures & Contingency Plans

**Objective**: Provide immediate rollback procedures for any migration failure  
**Scope**: Staging and Production environments  
**Critical**: Know these procedures BEFORE starting migration

---

## PART 1: DECISION TREE

### When to Rollback

```
Migration Issue Detected?
    ↓
Is it a CRITICAL issue?
    ├─ YES: Data corruption, loss of connectivity, FK violations
    │   └─→ IMMEDIATE ROLLBACK (Follow Scenario 1)
    │
    ├─ NO: Minor issue, non-critical error
    │   └─→ CONTINUE (Try to fix)
    │
    └─ UNSURE: Unclear severity
        └─→ PAUSE (Contact DBA, assess situation)

After Rollback Decision:
    ├─ FULL ROLLBACK: Restore entire database to pre-migration state
    ├─ PARTIAL ROLLBACK: Restore specific tables only
    └─ RECOVERY: Fix issue and retry migration
```

---

## PART 2: ESCALATION LEVELS

### Level 1: Issue Detection (First 5 minutes)

**Signs**:
- Long-running query (> 2 minutes)
- Connection timeouts
- Constraint violations with clear root cause

**Action**:
```bash
# Step 1: Assess severity
SEVERITY="ASSESS_NOW"  # Update based on symptoms

# Step 2: Notify DBA if not already aware
echo "Issue detected: $SEVERITY at $(date)"

# Step 3: Don't panic - evaluate options
# - Can we continue?
# - Can we fix it?
# - Must we rollback?
```

### Level 2: Partial Failure (5-15 minutes in)

**Signs**:
- Some migrations succeeded, some failed
- Data partially migrated
- Views created but data removal failed

**Action**:
```bash
# Option A: Continue to next migration (if current failed gracefully)
# Option B: Partial rollback (undo only failed migration)
# Option C: Full rollback (safer option)

# Default: Go with Option C (Full Rollback) for safety
```

### Level 3: Critical Failure (Anytime)

**Signs**:
- Widespread data corruption
- Major FK constraint violations
- Cannot connect to database
- Unplanned application errors

**Action**:
```bash
# IMMEDIATE FULL ROLLBACK
# No discussion, execute rollback now
# Contact entire team
# Notify stakeholders
```

---

## PART 3: SCENARIO 1 - IMMEDIATE FULL ROLLBACK

Use this for critical failures requiring complete database restoration.

### Step 1: Declare Incident

```bash
# Set incident status
INCIDENT_TIME=$(date)
INCIDENT_LEVEL="CRITICAL"
INCIDENT_STATUS="IN_PROGRESS"

# Notify team
echo "🚨 CRITICAL INCIDENT: Phase 4 Migration Failure"
echo "Time: $INCIDENT_TIME"
echo "Action: IMMEDIATE FULL ROLLBACK"

# Send alerts
# - Slack: #database-incidents
# - Email: dba-team@example.com
# - PagerDuty: Trigger incident
```

### Step 2: Stop All Activity

```bash
# IMMEDIATELY stop all application servers
# Command depends on your deployment method

# Docker Compose
docker-compose down

# Kubernetes
kubectl scale deployment crm-api --replicas=0

# Systemd
systemctl stop crm-application

# Manual
killall node  # Or your application process

echo "✅ All application instances stopped"
```

### Step 3: Verify Backup Exists

```bash
# Locate most recent backup
BACKUP_FILE=$(ls -t _backups/staging/*/staging_full_backup.dump | head -1)

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ CRITICAL: No backup found!"
  echo "Cannot rollback without backup"
  exit 1
fi

echo "✅ Backup located: $BACKUP_FILE"
echo "   Created: $(stat -c%y "$BACKUP_FILE")"
echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
```

### Step 4: Drop Failed Database

```bash
# Connect as postgres user
# CONFIRM this before executing - this is point of no return

read -p "Drop database crm_staging? (type 'YES' to confirm): " confirm
if [ "$confirm" != "YES" ]; then
  echo "Rollback aborted"
  exit 1
fi

# Drop the database
psql -h staging-host \
  -U postgres \
  -c "DROP DATABASE IF EXISTS crm_staging;"

echo "✅ Database dropped"
```

### Step 5: Create Fresh Database

```bash
# Create new empty database
psql -h staging-host \
  -U postgres \
  -c "CREATE DATABASE crm_staging OWNER postgres;"

echo "✅ New database created"
```

### Step 6: Restore from Backup

```bash
echo "Starting restore... This will take 10-20 minutes"
echo "Started at: $(date)"

# Restore backup (single job for reliability)
pg_restore -h staging-host \
  -U postgres \
  -d crm_staging \
  --verbose \
  "$BACKUP_FILE" 2>&1 | tee rollback_restore.log

# Capture return code
RESTORE_STATUS=$?

if [ $RESTORE_STATUS -eq 0 ]; then
  echo "✅ Restore completed successfully"
else
  echo "❌ Restore failed with status: $RESTORE_STATUS"
  echo "See rollback_restore.log for details"
  exit 1
fi

echo "Completed at: $(date)"
```

### Step 7: Verify Database Integrity

```bash
# Connect to restored database
psql -h staging-host -U postgres -d crm_staging << EOF

-- Section 1: Check for obvious corruption
SELECT 'Products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'Sales', COUNT(*) FROM sales
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'Job Works', COUNT(*) FROM job_works
ORDER BY table_name;

-- Section 2: Verify denormalized fields are present
SELECT COUNT(*) as denormalized_fields_count
FROM information_schema.columns
WHERE table_name IN ('sales', 'tickets', 'job_works')
  AND column_name IN (
    'customer_name', 'assigned_to_name', 'product_name',
    'customer_email', 'customer_phone'
  );
-- Expected: Should be > 0 (denormalized fields should exist after rollback)

-- Section 3: Check no views yet (if rollback before views created)
SELECT COUNT(*) as view_count FROM pg_views 
WHERE schemaname = 'public';
-- Expected: 0 (or count of pre-existing views)

EOF
```

### Step 8: Restart Application

```bash
# Restart application instances

# Docker Compose
docker-compose up -d

# Kubernetes
kubectl scale deployment crm-api --replicas=3

# Systemd
systemctl start crm-application

# Wait for application to be ready
sleep 10

# Verify application is responding
curl http://localhost:3000/api/health

echo "✅ Application restarted"
```

### Step 9: Verify Application Works

```bash
# Run smoke tests
npm test -- --testPathPattern="smoke"

# Or manual verification
curl -H "Authorization: Bearer $TEST_TOKEN" \
  http://localhost:3000/api/sales
# Expected: 200 OK

curl -H "Authorization: Bearer $TEST_TOKEN" \
  http://localhost:3000/api/tickets
# Expected: 200 OK

echo "✅ Application verification complete"
```

### Step 10: Document Incident

```bash
# Create incident report
cat > INCIDENT_REPORT.md << EOF
# Incident Report - Phase 4 Migration Rollback

**Date**: $(date)
**Incident Level**: CRITICAL
**Status**: ROLLED BACK

## Timeline

- Migration start: [TIME]
- Issue detected: [TIME]
- Rollback initiated: [TIME]
- Restore completed: [TIME]
- Application restarted: [TIME]
- Incident closed: $(date)

## Root Cause

[DESCRIBE ISSUE HERE]

## What Failed

[DESCRIBE WHAT STEP FAILED]

## Resolution

Full database rollback performed. Database restored to pre-migration state.

## Prevention

[WHAT WILL BE DONE TO PREVENT THIS IN FUTURE]

## Sign-offs

- DBA: _________________ Date: _______
- Lead Dev: _________________ Date: _______
- Manager: _________________ Date: _______

EOF

echo "✅ Incident report created: INCIDENT_REPORT.md"
```

---

## PART 4: SCENARIO 2 - PARTIAL ROLLBACK

Use when only specific migrations failed, but earlier migrations succeeded.

### Example: Views created successfully, but denormalization removal failed

```bash
# Case: Migrations 1-6 succeeded (views created)
#       Migration 7 failed (denormalization removal)

# Option 1: Drop only the failed migration objects
psql -h staging-host -U postgres -d crm_staging << EOF

-- Drop the 45+ denormalized columns that were removed
-- (Add them back to the table schemas)

ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2);

-- ... (repeat for all 45+ removed fields)

EOF

# Option 2: Drop views and re-run backup
DROP VIEW IF EXISTS sales_with_details CASCADE;
DROP VIEW IF EXISTS job_works_with_details CASCADE;
-- ... (drop all Phase 4 views)

# Then restore from backup
pg_restore -h staging-host -U postgres -d crm_staging \
  -t products -t sales -t tickets \
  "$BACKUP_FILE"
```

---

## PART 5: SCENARIO 3 - RECOVERY (Partial Fix)

Use when failure is in specific table migration, other tables OK.

### Recovery: Re-run single migration

```bash
# Identify failed migration
FAILED_MIGRATION="20250322000024_create_job_works_views.sql"

# Option 1: Drop and recreate
psql -h staging-host -U postgres -d crm_staging << EOF
DROP VIEW IF EXISTS job_works_with_details CASCADE;
DROP VIEW IF EXISTS job_work_specifications_with_details CASCADE;
EOF

# Re-run the migration
psql -h staging-host -U postgres -d crm_staging \
  -f supabase/migrations/$FAILED_MIGRATION

# Verify
psql -h staging-host -U postgres -d crm_staging << EOF
SELECT viewname FROM pg_views 
WHERE viewname IN ('job_works_with_details', 'job_work_specifications_with_details');
EOF
```

---

## PART 6: SCENARIO 4 - APPLICATION-LEVEL ROLLBACK

Use when database migration succeeded but application fails.

### Revert Application Code

```bash
# Step 1: Revert to previous Git commit
git log --oneline -10
# Find commit before Phase 4 changes

# Option A: Soft reset (keep changes, but remove commits)
git reset --soft HEAD~5

# Option B: Hard reset (lose all Phase 4 changes)
git reset --hard origin/main

# Step 2: Redeploy application
npm run build
npm run deploy:staging

# Step 3: Verify application works
npm test

echo "✅ Application rolled back to pre-Phase4 version"
```

---

## PART 7: MANUAL ROLLBACK COMMANDS

### Quick Rollback - Views Only

```bash
# If only views were partially created
psql -h staging-host -U postgres -d crm_staging << EOF

DROP VIEW IF EXISTS sales_with_details;
DROP VIEW IF EXISTS sale_items_with_details;
DROP VIEW IF EXISTS product_sales_with_details;
DROP VIEW IF EXISTS customers_with_stats;
DROP VIEW IF EXISTS tickets_with_details;
DROP VIEW IF EXISTS ticket_comments_with_details;
DROP VIEW IF EXISTS contracts_with_details;
DROP VIEW IF EXISTS contract_approval_records_with_details;
DROP VIEW IF EXISTS job_works_with_details;
DROP VIEW IF EXISTS job_work_specifications_with_details;
DROP VIEW IF EXISTS service_contracts_with_details;
DROP VIEW IF EXISTS complaints_with_details;

EOF

echo "✅ All Phase 4 views dropped"
```

### Quick Rollback - Indexes Only

```bash
# If indexes cause performance issues
psql -h staging-host -U postgres -d crm_staging << EOF

DROP INDEX IF EXISTS idx_sales_tenant_customer;
DROP INDEX IF EXISTS idx_sales_tenant_assigned_to;
DROP INDEX IF EXISTS idx_sales_stage_status;
DROP INDEX IF EXISTS idx_sales_expected_close_date;
DROP INDEX IF EXISTS idx_job_works_engineer_tenant;
-- ... (repeat for all Phase 4 indexes)

EOF

echo "✅ All Phase 4 indexes dropped"
```

### Restore Denormalized Columns

```bash
# If denormalized fields were accidentally removed early
psql -h staging-host -U postgres -d crm_staging << EOF

ALTER TABLE products ADD COLUMN category VARCHAR(255);
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN supplier_name VARCHAR(255);

ALTER TABLE sales ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN assigned_to_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN amount DECIMAL(12,2);

ALTER TABLE tickets ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE tickets ADD COLUMN customer_email VARCHAR(255);
ALTER TABLE tickets ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE tickets ADD COLUMN assigned_to_name VARCHAR(255);
ALTER TABLE tickets ADD COLUMN reported_by_name VARCHAR(255);

ALTER TABLE job_works ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE job_works ADD COLUMN customer_short_name VARCHAR(50);
ALTER TABLE job_works ADD COLUMN customer_contact VARCHAR(255);
ALTER TABLE job_works ADD COLUMN customer_email VARCHAR(255);
ALTER TABLE job_works ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE job_works ADD COLUMN product_name VARCHAR(255);
ALTER TABLE job_works ADD COLUMN product_sku VARCHAR(100);
ALTER TABLE job_works ADD COLUMN product_category VARCHAR(255);
ALTER TABLE job_works ADD COLUMN product_unit VARCHAR(50);
ALTER TABLE job_works ADD COLUMN receiver_engineer_name VARCHAR(255);
ALTER TABLE job_works ADD COLUMN receiver_engineer_email VARCHAR(255);
ALTER TABLE job_works ADD COLUMN assigned_by_name VARCHAR(255);

-- ... (repeat for all other tables)

EOF

echo "✅ Denormalized columns restored"
```

---

## PART 8: CONTINGENCY PLANS

### Contingency 1: Migration Hangs (No Progress for 10+ minutes)

**Signs**: CPU low, I/O low, no activity

**Action**:
```bash
# Check what query is running
psql -h staging-host -U postgres << EOF
SELECT pid, query, query_start, state 
FROM pg_stat_activity 
WHERE datname = 'crm_staging' 
  AND state != 'idle';
EOF

# If migration is truly stuck (waiting for lock):
# Option 1: Kill it and rollback
SELECT pg_terminate_backend(pid);

# Option 2: Check for table locks
SELECT * FROM pg_locks WHERE pid IN (
  SELECT pid FROM pg_stat_activity 
  WHERE datname = 'crm_staging'
);
```

### Contingency 2: Connection Lost During Migration

**Signs**: Network error, SSH disconnect, connection timeout

**Action**:
```bash
# Check if migration is still running on server
ssh admin@staging-host
ps aux | grep postgres
ps aux | grep pg_restore

# If process still running: Let it continue
# If process died: Check database state

psql -h staging-host -U postgres -d crm_staging -c "SELECT COUNT(*) FROM products;"

# If query works: Migration may have succeeded, continue
# If connection fails: Database may be corrupted, DO FULL ROLLBACK
```

### Contingency 3: Out of Disk Space

**Signs**: Migration fails with "No space left on device"

**Action**:
```bash
# Check available space
df -h /var/lib/postgresql/

# Free up space (if possible)
rm -rf /tmp/*
rm old_backups/*

# If not enough space, ROLLBACK and add storage
# Then retry migration

# Estimate space needed
du -sh /var/lib/postgresql/data/
# Need at least 2x this amount free for migration
```

### Contingency 4: FK Constraint Violations

**Signs**: Migration fails with foreign key constraint error

**Action**:
```bash
# Identify orphaned records
psql -h staging-host -U postgres -d crm_staging << EOF
SELECT * FROM sales 
WHERE customer_id NOT IN (SELECT id FROM customers);
EOF

# Option 1: Delete orphaned records
DELETE FROM sales 
WHERE customer_id NOT IN (SELECT id FROM customers);

# Option 2: Or restore from backup
# (Backup should have clean data)

# Then retry migration
```

### Contingency 5: Performance Degradation Post-Migration

**Signs**: Queries slow (> 5s), high CPU after migration

**Action**:
```bash
# Run query analysis
psql -h staging-host -U postgres -d crm_staging << EOF
ANALYZE;
VACUUM;
REINDEX INDEX idx_sales_tenant_customer;
EOF

# If still slow: Indexes may be missing
# Verify all Phase 4 indexes were created
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

# If issues persist: Rollback to previous indexes
DROP INDEX idx_problematic_index;
CREATE INDEX ... (with original definition);
```

---

## PART 9: COMMUNICATION TEMPLATE

### During Incident

```
🚨 INCIDENT ALERT 🚨

Database Migration Issue Detected
- Time: [TIMESTAMP]
- Status: [INVESTIGATING / ROLLING BACK / RESOLVED]
- Environment: Staging

Application Impact: [OFFLINE / DEGRADED / WORKING]

Action: We are executing rollback procedures
ETA for recovery: [TIME]

Updates will be posted every 5 minutes.
```

### After Rollback

```
✅ INCIDENT RESOLVED ✅

Database migration issue has been resolved.
- Rollback completed: [TIMESTAMP]
- Database restored to pre-migration state
- Application restarted and verified working
- No data loss

Next Steps:
- Root cause analysis in progress
- Full incident report will be published
- Remediation plan to follow

We appreciate your patience.
```

---

## PART 10: POST-INCIDENT ACTIONS

### Immediate (Within 1 hour)

- [ ] Verify all systems operational
- [ ] Notify stakeholders of resolution
- [ ] Create backup of current state
- [ ] Document incident timeline

### Short-term (Within 24 hours)

- [ ] Conduct root cause analysis
- [ ] Identify preventive measures
- [ ] Update runbooks with learnings
- [ ] Share incident report with team

### Long-term (Before next attempt)

- [ ] Implement preventive measures
- [ ] Add additional monitoring/alerts
- [ ] Update migration procedures
- [ ] Schedule team training/review

---

## QUICK REFERENCE CHEAT SHEET

```
INCIDENT TYPE                   QUICK COMMAND
─────────────────────────────────────────────────────────────
Database won't start            systemctl status postgresql
Connection refused              psql -h host -U user -c "SELECT 1;"
Migration hangs                 ps aux | grep pg_restore
Out of disk space              df -h /var/lib/postgresql
FK constraint violation         psql ... -c "VACUUM; ANALYZE;"
Views not created              psql ... -c "\dv" (check if empty)
Denormalized fields still      psql ... -c "\d products" (check schema)
Application won't start         docker logs crm-app (check error)
Need full rollback             See SCENARIO 1

RECOVERY CHECKLIST:
✓ Declare incident
✓ Stop application
✓ Verify backup exists
✓ Drop failed database
✓ Restore from backup
✓ Verify data integrity
✓ Restart application
✓ Test functionality
✓ Document incident
```

---

## Approval & Sign-Off

```
This rollback plan has been reviewed and approved by:

Database Administrator: _________________ Date: _______
Lead Developer: _________________ Date: _______
Operations Manager: _________________ Date: _______

Training completed:
- DBA Team: _________________ Date: _______
- Dev Team: _________________ Date: _______
- Ops Team: _________________ Date: _______
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**Review Frequency**: Before each migration execution  
**Emergency Contact**: dba-team@example.com, +1-XXX-XXX-XXXX
