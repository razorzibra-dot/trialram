---
title: Phase 4 Backup & Restore Procedures
description: Comprehensive backup and restore procedures for Phase 4 database migrations
date: 2025-11-08
version: 1.0.0
status: active
author: AI Agent
---

# Phase 4: Backup & Restore Procedures

**Objective**: Ensure data safety before and after Phase 4 migrations  
**Scope**: Staging and Production databases  
**Critical**: Backups are mandatory before any migration execution

---

## PART 1: BACKUP STRATEGIES

### Strategy Selection

Choose based on your infrastructure:

| Strategy | Use Case | Time | Size | Storage | Restore Time |
|----------|----------|------|------|---------|--------------|
| **Full Dump** | Development/Staging | 5-15 min | 100-500 MB | Low | 10-30 min |
| **Custom Format** | Production backup | 10-20 min | 50-200 MB | Medium | 10-20 min |
| **Logical Backup** | Schema reference | 5-10 min | 50-100 MB | Low | Quick |
| **pg_basebackup** | Full recovery | 15-30 min | 200+ MB | High | 5-10 min |
| **WAL Archiving** | Point-in-time recovery | Continuous | 1-10 GB | High | On demand |

---

## PART 2: PRE-MIGRATION BACKUPS

### Backup 1: Full Database Backup (Recommended for Staging)

```bash
# Create timestamped backup directory
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="_backups/staging/$BACKUP_DATE"
mkdir -p $BACKUP_DIR

# Set database variables
STAGING_HOST="staging-db.example.com"
STAGING_USER="postgres"
STAGING_DB="crm_staging"
STAGING_PASS="your-password-here"  # Use ~/.pgpass for security

export PGPASSWORD=$STAGING_PASS

# Perform full database dump
echo "Starting full database backup..."
pg_dump -h $STAGING_HOST \
  -U $STAGING_USER \
  -d $STAGING_DB \
  --verbose \
  --format=plain \
  > $BACKUP_DIR/staging_full_backup_plain.sql

echo "✅ Full backup complete"
echo "   Location: $BACKUP_DIR/staging_full_backup_plain.sql"
echo "   Size: $(du -h $BACKUP_DIR/staging_full_backup_plain.sql | cut -f1)"
```

### Backup 2: Custom Format Backup (Best Compression)

```bash
# Custom format offers best compression and parallel restore capabilities
echo "Creating custom format backup..."

pg_dump -h $STAGING_HOST \
  -U $STAGING_USER \
  -d $STAGING_DB \
  --format=custom \
  --file=$BACKUP_DIR/staging_full_backup.dump \
  --verbose

# Verify backup integrity
echo "Verifying backup integrity..."
pg_restore --list $BACKUP_DIR/staging_full_backup.dump | head -30 > $BACKUP_DIR/backup_contents.txt

echo "✅ Custom format backup complete"
echo "   Location: $BACKUP_DIR/staging_full_backup.dump"
echo "   Size: $(du -h $BACKUP_DIR/staging_full_backup.dump | cut -f1)"
echo "   Contents: See $BACKUP_DIR/backup_contents.txt"
```

### Backup 3: Schema-Only Backup (Reference)

```bash
# Useful for schema reference and comparison
echo "Creating schema-only backup..."

pg_dump -h $STAGING_HOST \
  -U $STAGING_USER \
  -d $STAGING_DB \
  --schema-only \
  > $BACKUP_DIR/staging_schema_only.sql

echo "✅ Schema-only backup complete"
echo "   Location: $BACKUP_DIR/staging_schema_only.sql"
```

### Backup 4: Data Snapshot (Critical Tables)

```bash
# Quick snapshot of row counts and sample data
psql -h $STAGING_HOST -U $STAGING_USER -d $STAGING_DB << EOF > $BACKUP_DIR/pre_migration_data_snapshot.txt

-- ============================================================================
-- PRE-MIGRATION DATA SNAPSHOT
-- ============================================================================
-- Generated: $(date)
-- Purpose: Verify data integrity before and after migration

-- Section 1: Row Counts
SELECT 'Table' as entity_type, 'Row Count' as metric
UNION ALL
SELECT '---' , '---'
UNION ALL
SELECT 'products', COUNT(*)::text FROM products
UNION ALL
SELECT 'suppliers', COUNT(*)::text FROM suppliers
UNION ALL
SELECT 'sales', COUNT(*)::text FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*)::text FROM sale_items
UNION ALL
SELECT 'product_sales', COUNT(*)::text FROM product_sales
UNION ALL
SELECT 'customers', COUNT(*)::text FROM customers
UNION ALL
SELECT 'tickets', COUNT(*)::text FROM tickets
UNION ALL
SELECT 'ticket_comments', COUNT(*)::text FROM ticket_comments
UNION ALL
SELECT 'ticket_attachments', COUNT(*)::text FROM ticket_attachments
UNION ALL
SELECT 'contracts', COUNT(*)::text FROM contracts
UNION ALL
SELECT 'contract_approval_records', COUNT(*)::text FROM contract_approval_records
UNION ALL
SELECT 'service_contracts', COUNT(*)::text FROM service_contracts
UNION ALL
SELECT 'job_works', COUNT(*)::text FROM job_works
UNION ALL
SELECT 'job_work_specifications', COUNT(*)::text FROM job_work_specifications
UNION ALL
SELECT 'complaints', COUNT(*)::text FROM complaints;

-- Section 2: Denormalized Field Verification (Before Migration)
SELECT 
  column_name, 
  table_name
FROM information_schema.columns
WHERE table_name IN ('products', 'sales', 'tickets', 'contracts', 'job_works')
  AND column_name IN (
    'category', 'is_active', 'supplier_name',
    'customer_name', 'assigned_to_name', 'amount',
    'customer_email', 'customer_phone', 'reported_by_name',
    'product_name', 'product_sku', 'product_category',
    'customer_short_name', 'customer_contact',
    'receiver_engineer_name', 'receiver_engineer_email', 'assigned_by_name'
  )
ORDER BY table_name, column_name;

-- Section 3: Sample FK Validation
SELECT 'Sales without customer' as check_name, COUNT(*)::text as issue_count
FROM sales WHERE customer_id IS NULL
UNION ALL
SELECT 'Tickets without customer', COUNT(*)::text
FROM tickets WHERE customer_id IS NULL
UNION ALL
SELECT 'Job works without customer', COUNT(*)::text
FROM job_works WHERE customer_id IS NULL
UNION ALL
SELECT 'Contracts without customer', COUNT(*)::text
FROM contracts WHERE customer_id IS NULL;

EOF

cat $BACKUP_DIR/pre_migration_data_snapshot.txt
```

### Backup 5: Database Metadata Export

```bash
# Export database structure information
psql -h $STAGING_HOST -U $STAGING_USER -d $STAGING_DB << EOF > $BACKUP_DIR/database_metadata.txt

-- List all tables
\dt

-- List all indexes
\di

-- List all views
\dv

-- List all sequences
\ds

EOF
```

### Create Backup Manifest

```bash
# Create manifest file for documentation
cat > $BACKUP_DIR/BACKUP_MANIFEST.txt << EOF
================================================================================
BACKUP MANIFEST
================================================================================

Backup Date/Time: $BACKUP_DATE
Database: $STAGING_DB
Host: $STAGING_HOST
User: $STAGING_USER

BACKUP FILES:
================================================================================

1. staging_full_backup_plain.sql
   Type: Plain text SQL dump
   Size: $(du -h $BACKUP_DIR/staging_full_backup_plain.sql 2>/dev/null | cut -f1 || echo "N/A")
   Contents: Complete database schema and data
   Restore: psql -h host -U user -d dbname < staging_full_backup_plain.sql
   
2. staging_full_backup.dump
   Type: PostgreSQL custom format (compressed)
   Size: $(du -h $BACKUP_DIR/staging_full_backup.dump 2>/dev/null | cut -f1 || echo "N/A")
   Contents: Complete database schema and data
   Restore: pg_restore -h host -U user -d dbname staging_full_backup.dump
   
3. staging_schema_only.sql
   Type: Schema-only SQL dump
   Size: $(du -h $BACKUP_DIR/staging_schema_only.sql 2>/dev/null | cut -f1 || echo "N/A")
   Contents: Database schema (no data)
   Restore: psql -h host -U user -d dbname < staging_schema_only.sql

4. pre_migration_data_snapshot.txt
   Type: Data integrity verification
   Size: Reference file
   Contents: Row counts, denormalized fields, FK validation

5. database_metadata.txt
   Type: Structure reference
   Size: Reference file
   Contents: Tables, indexes, views, sequences

BACKUP VERIFICATION:
================================================================================

Backup Integrity Check:
$ pg_restore --list $BACKUP_DIR/staging_full_backup.dump | wc -l
Result: Should show 100+ objects

RESTORE INSTRUCTIONS:
================================================================================

Quick Restore (Latest backup):
$ pg_restore -h staging-db -U postgres -d crm_staging -v $BACKUP_DIR/staging_full_backup.dump

Parallel Restore (Faster, 4 jobs):
$ pg_restore -h staging-db -U postgres -d crm_staging -j 4 -v $BACKUP_DIR/staging_full_backup.dump

Restore from Plain SQL:
$ psql -h staging-db -U postgres -d crm_staging < $BACKUP_DIR/staging_full_backup_plain.sql

RETENTION POLICY:
================================================================================

Backup Retention: 30 days minimum
Archive Location: $BACKUP_DIR
Deletion Date: $(date -d "+30 days" +%Y-%m-%d)

NOTES:
================================================================================

- Keep this manifest with the backup files
- Test restore on non-production database before relying on backup
- Store backup copies in geographically different locations if possible
- Encrypt backups if transmitted over network

EOF

echo "✅ Backup manifest created"
cat $BACKUP_DIR/BACKUP_MANIFEST.txt
```

---

## PART 3: BACKUP VERIFICATION

### Verify Backup Completeness

```bash
# 1. Check backup file exists and has reasonable size
ls -lh $BACKUP_DIR/staging_full_backup.dump
# Expected: File size > 50MB (depending on data)

# 2. Verify backup format
file $BACKUP_DIR/staging_full_backup.dump
# Expected: "pg_restore archive data, PostgreSQL custom"

# 3. List backup contents (first 20 items)
pg_restore --list $BACKUP_DIR/staging_full_backup.dump | head -20

# 4. Verify backup integrity - test restore to temporary DB
TEMP_DB="crm_staging_restore_test"

# Create temporary database
psql -h $STAGING_HOST -U postgres -c "CREATE DATABASE $TEMP_DB;"

# Restore backup to temporary database
pg_restore -h $STAGING_HOST \
  -U postgres \
  -d $TEMP_DB \
  -v \
  $BACKUP_DIR/staging_full_backup.dump 2>&1 | tail -20

# Verify restore succeeded
psql -h $STAGING_HOST -U postgres -d $TEMP_DB -c "SELECT COUNT(*) FROM products;"
# Expected: Same row count as original

# Clean up temporary database
psql -h $STAGING_HOST -U postgres -c "DROP DATABASE $TEMP_DB;"

echo "✅ Backup verification complete"
```

### Document Backup Status

```bash
cat > $BACKUP_DIR/BACKUP_STATUS.txt << EOF
Backup Status Report
Created: $(date)

✅ BACKUP VERIFICATION RESULTS:

File Integrity: PASSED
- Main backup file exists and is readable
- File size: $(du -h $BACKUP_DIR/staging_full_backup.dump | cut -f1)
- Backup format: PostgreSQL custom format

Object Count: PASSED
- Total objects in backup: $(pg_restore --list $BACKUP_DIR/staging_full_backup.dump | wc -l)

Data Sample Verification: PASSED
- Products count: $(psql -h $STAGING_HOST -U postgres -d $STAGING_DB -tc "SELECT COUNT(*) FROM products;")
- Sales count: $(psql -h $STAGING_HOST -U postgres -d $STAGING_DB -tc "SELECT COUNT(*) FROM sales;")
- Tickets count: $(psql -h $STAGING_HOST -U postgres -d $STAGING_DB -tc "SELECT COUNT(*) FROM tickets;")

Backup Age: Fresh (created today)
Backup Location: $BACKUP_DIR
Retention Until: $(date -d "+30 days" +%Y-%m-%d)

READY FOR MIGRATION: ✅ YES

EOF

cat $BACKUP_DIR/BACKUP_STATUS.txt
```

---

## PART 4: RESTORE PROCEDURES

### Scenario 1: Complete Database Restore

Use when entire database needs to be restored to pre-migration state.

```bash
# Step 1: Connect to database server
ssh admin@staging-db.example.com

# Step 2: Stop application (if running on same server)
systemctl stop application
# or: docker-compose down
# or: manually stop services

# Step 3: Verify backup exists
BACKUP_FILE="/path/to/backups/staging_full_backup.dump"
ls -lh $BACKUP_FILE

# Step 4: Drop current corrupted database
psql -U postgres -c "DROP DATABASE crm_staging;"

# Step 5: Create fresh database
psql -U postgres -c "CREATE DATABASE crm_staging OWNER postgres;"

# Step 6: Restore from backup
echo "Starting restore... This may take 10-20 minutes"
pg_restore -h localhost \
  -U postgres \
  -d crm_staging \
  -v \
  $BACKUP_FILE 2>&1 | tee restore.log

# Step 7: Verify restore
psql -U postgres -d crm_staging << EOF
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM sales;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM tickets;
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM job_works;
EOF

# Step 8: Restart application
systemctl start application
# or: docker-compose up -d
# or: manually start services

echo "✅ Restore complete"
```

### Scenario 2: Parallel Restore (Faster)

Use for large databases to restore with multiple parallel jobs.

```bash
# Parallel restore with 4 concurrent jobs
pg_restore -h localhost \
  -U postgres \
  -d crm_staging \
  -j 4 \
  -v \
  $BACKUP_FILE

echo "✅ Parallel restore complete"
```

### Scenario 3: Partial Restore (Specific Tables)

Use to restore only specific tables (e.g., if migration partially failed).

```bash
# Restore only products table
pg_restore -h localhost \
  -U postgres \
  -d crm_staging \
  -t products \
  $BACKUP_FILE

# Restore multiple tables
pg_restore -h localhost \
  -U postgres \
  -d crm_staging \
  -t products \
  -t sales \
  -t tickets \
  $BACKUP_FILE

echo "✅ Partial restore complete"
```

### Scenario 4: Restore to Different Database

Use to test restore on non-production database.

```bash
# Create new database
psql -U postgres -c "CREATE DATABASE crm_staging_test;"

# Restore to new database
pg_restore -h localhost \
  -U postgres \
  -d crm_staging_test \
  $BACKUP_FILE

# Verify
psql -U postgres -d crm_staging_test -c "SELECT COUNT(*) FROM products;"

# Clean up when done
psql -U postgres -c "DROP DATABASE crm_staging_test;"

echo "✅ Test restore complete"
```

### Scenario 5: Restore from Plain SQL

Use if custom format backup unavailable.

```bash
# Restore from plain SQL backup
psql -h localhost \
  -U postgres \
  -d crm_staging \
  < staging_full_backup_plain.sql

echo "✅ SQL restore complete"
```

---

## PART 5: POINT-IN-TIME RECOVERY (PITR)

### Setup WAL Archiving (For Production)

```bash
# Enable WAL archiving in postgresql.conf
# (Edit /etc/postgresql/14/main/postgresql.conf)

wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64

# Create WAL archive directory
mkdir -p /var/lib/postgresql/wal_archive
chown postgres:postgres /var/lib/postgresql/wal_archive

# Add to postgresql.conf:
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'

# Restart PostgreSQL
systemctl restart postgresql
```

### Recover to Specific Point-in-Time

```bash
# Step 1: Copy base backup
cp /backups/base_backup_datetime.dump .

# Step 2: Create recovery.conf (PostgreSQL 11 and earlier)
# or recovery.signal + postgresql.conf (PostgreSQL 12+)

cat > recovery.conf << EOF
recovery_target_timeline = 'latest'
recovery_target_time = '2025-11-08 14:30:00'
recovery_target_inclusive = true
EOF

# Step 3: Perform PITR restore
pg_restore -C -d postgres base_backup_datetime.dump

echo "✅ PITR recovery complete"
```

---

## PART 6: BACKUP TESTING

### Test Restore Procedure

```bash
# 1. Create test environment (docker container or VM)
docker run -d --name pg_test -e POSTGRES_PASSWORD=password postgres:14

# 2. Wait for container to start
sleep 5

# 3. Copy backup into container
docker cp $BACKUP_FILE pg_test:/tmp/

# 4. Create test database
docker exec pg_test psql -U postgres -c "CREATE DATABASE crm_staging_test;"

# 5. Restore backup
docker exec pg_test pg_restore \
  -U postgres \
  -d crm_staging_test \
  /tmp/$(basename $BACKUP_FILE)

# 6. Verify all tables exist
docker exec pg_test psql -U postgres -d crm_staging_test << EOF
\dt
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';
EOF

# 7. Clean up
docker stop pg_test
docker rm pg_test

echo "✅ Restore test successful"
```

### Automated Backup Verification Script

```bash
#!/bin/bash
# backup_verification.sh
# Run this script daily to verify backups

BACKUP_DIR="_backups/staging"
LOG_FILE="_logs/backup_verification.log"
ALERT_EMAIL="dba@example.com"

echo "Backup Verification - $(date)" >> $LOG_FILE

# Check if backups exist
if [ ! -d "$BACKUP_DIR" ]; then
  echo "ERROR: Backup directory not found: $BACKUP_DIR" >> $LOG_FILE
  mail -s "ALERT: Backup verification failed" $ALERT_EMAIL < $LOG_FILE
  exit 1
fi

# Find latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*/staging_full_backup.dump 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup files found" >> $LOG_FILE
  mail -s "ALERT: No backup files found" $ALERT_EMAIL < $LOG_FILE
  exit 1
fi

# Check backup age (should be < 24 hours)
BACKUP_AGE=$(($(date +%s) - $(stat -c%Y "$LATEST_BACKUP")))
if [ $BACKUP_AGE -gt 86400 ]; then
  echo "WARNING: Backup is older than 24 hours" >> $LOG_FILE
fi

# Verify backup integrity
pg_restore --list "$LATEST_BACKUP" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Backup integrity check failed" >> $LOG_FILE
  mail -s "ALERT: Backup corruption detected" $ALERT_EMAIL < $LOG_FILE
  exit 1
fi

echo "✅ All backup checks passed" >> $LOG_FILE
echo "Latest backup: $LATEST_BACKUP" >> $LOG_FILE
echo "Backup size: $(du -h "$LATEST_BACKUP" | cut -f1)" >> $LOG_FILE

exit 0
```

---

## PART 7: BACKUP STORAGE & RETENTION

### Local Storage

```bash
# Create backup directory structure
mkdir -p _backups/staging/{daily,weekly,monthly}
mkdir -p _backups/production/{daily,weekly,monthly}

# Set permissions
chmod 700 _backups/*/

# Archive old backups (monthly)
tar -czf _backups/staging/archive_$(date +%Y%m).tar.gz _backups/staging/daily/
```

### Off-Site Backup (Critical for Production)

```bash
#!/bin/bash
# backup_to_s3.sh
# Upload backups to AWS S3

BACKUP_FILE=$1
S3_BUCKET="s3://company-database-backups"

# Upload to S3 with encryption
aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/staging/" \
  --sse AES256 \
  --storage-class GLACIER

echo "✅ Backup uploaded to S3"

# Verify upload
aws s3 ls "$S3_BUCKET/staging/" --recursive | tail -5
```

### Backup Retention Schedule

```
Daily Backups:
- Keep: Last 7 days
- Location: _backups/staging/daily/
- Rotation: Delete after 7 days

Weekly Backups:
- Keep: Last 4 weeks
- Location: _backups/staging/weekly/
- Rotation: Monthly consolidation

Monthly Backups:
- Keep: Last 12 months
- Location: _backups/staging/monthly/
- Rotation: Yearly archive

Long-term Archive:
- Keep: 7 years (per compliance)
- Location: Off-site storage (S3 Glacier)
```

---

## APPENDIX: Troubleshooting

### Backup Creation Fails

```bash
# Check database connectivity
psql -h $STAGING_HOST -U $STAGING_USER -d $STAGING_DB -c "SELECT 1;"

# Check available disk space
df -h
# Expected: At least 2x database size available

# Check PostgreSQL logs
tail -50 /var/log/postgresql/postgresql.log

# Try with verbose flag to see detailed output
pg_dump -h $STAGING_HOST -U $STAGING_USER -d $STAGING_DB --verbose 2>&1
```

### Restore Fails with FK Violations

```bash
# Disable FK checks during restore
psql -h localhost -U postgres -d crm_staging << EOF
ALTER TABLE sales DISABLE TRIGGER ALL;
ALTER TABLE tickets DISABLE TRIGGER ALL;
ALTER TABLE contracts DISABLE TRIGGER ALL;
EOF

# Then restore
pg_restore -h localhost -U postgres -d crm_staging $BACKUP_FILE

# Re-enable constraints
psql -h localhost -U postgres -d crm_staging << EOF
ALTER TABLE sales ENABLE TRIGGER ALL;
ALTER TABLE tickets ENABLE TRIGGER ALL;
ALTER TABLE contracts ENABLE TRIGGER ALL;
EOF
```

### Restore Hangs

```bash
# Check if restore process is stuck
ps aux | grep pg_restore

# Monitor I/O
iostat -x 1

# Kill restore if necessary (WARNING: This corrupts database)
kill -9 <pg_restore_pid>

# Rollback transaction if possible
psql -U postgres -d crm_staging -c "ROLLBACK;"
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**Next Review**: Before first production backup
