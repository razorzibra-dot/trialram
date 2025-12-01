# Database Script Synchronization - Complete Deployment Guide

## 🎯 **OVERVIEW**

This guide provides the correct deployment procedure for the CRM application, ensuring all database scripts execute in the proper order and all synchronization issues are resolved.

---

## 📋 **DEPLOYMENT PREREQUISITES**

### System Requirements
- PostgreSQL 14+ with Supabase extensions
- Node.js 18+ with TypeScript support
- Environment variables configured (`.env` file)
- Supabase CLI installed and authenticated

### Database Requirements
- Clean database or migration-capable existing database
- Sufficient disk space (minimum 2GB)
- Proper database user permissions (CREATE, INSERT, UPDATE, DELETE)

---

## 🚀 **STEP-BY-STEP DEPLOYMENT PROCEDURE**

### **Phase 1: Environment Setup**

#### 1.1 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Update with your configuration
# Required variables:
# - DATABASE_URL
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

#### 1.2 Verify Supabase Connection
```bash
# Test database connection
npx supabase db reset --dry-run

# Verify migrations exist
ls supabase/migrations/
```

### **Phase 2: Migration Execution (CRITICAL ORDER)**

#### 2.1 Run Migrations in Sequence
```bash
# Reset and apply all migrations in timestamp order
supabase db reset

# Alternative: Run migrations individually
supabase db push

# Verify migration status
npx supabase migration list
```

#### 2.2 Key Migration Checkpoints
- **20251122000001**: Audit logs and RLS policies
- **20251122000002**: **CRITICAL** - Permission format migration
- **Additional migrations**: Custom feature migrations

#### 2.3 Verify Migration Success
```sql
-- Check migration completion
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 5;

-- Verify critical permission migration
SELECT name, resource, action 
FROM permissions 
WHERE name LIKE '%:manage' 
ORDER BY name;
```

### **Phase 3: Seed Data Execution**

#### 3.1 Execute Seed Data
```bash
# Run seed data (this includes permissions and test data)
psql -h [host] -U [user] -d [database] -f supabase/seed.sql
```

#### 3.2 Verify Seed Data
```sql
-- Verify permissions inserted
SELECT COUNT(*) as permission_count 
FROM permissions 
WHERE name IN ('crm:user:record:update', 'crm:role:permission:assign', 'customers:manage');

-- Verify test users created
SELECT email, status, tenant_id 
FROM users 
WHERE email LIKE '%@acme.com';

-- Verify roles created
SELECT name, tenant_id, is_system_role 
FROM roles 
WHERE name IN ('Administrator', 'Manager', 'User');
```

### **Phase 4: Auth User Synchronization**

#### 4.1 Create Auth Users
```bash
# Execute auth user seeding script
npx ts-node scripts/seed-auth-users.ts

# Expected output: 11 users created across 4 tenants
```

#### 4.2 Sync Auth to Public Users
```bash
# Synchronize auth users to public users table
tsx scripts/sync-auth-to-sql.ts

# This will update seed.sql with actual auth UUIDs
```

#### 4.3 Verify Auth Sync
```sql
-- Verify all 11 users match between auth and public
SELECT 
  'Auth Users' as source,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@%'

UNION ALL

SELECT 
  'Public Users' as source,
  COUNT(*) as count
FROM public.users
WHERE email LIKE '%@%';
```

---

## ⚠️ **CRITICAL DEPLOYMENT CHECKPOINTS**

### **Checkpoint 1: Permission Migration Success**
- ✅ All permissions in resource:action format
- ✅ Role permissions preserved with granted_by field
- ✅ No duplicate permissions

**Validation Query:**
```sql
SELECT 'Permission Format Check' as test,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM permissions 
WHERE name NOT LIKE '%:%' 
  AND name NOT IN ('read', 'write', 'delete', 'crm:platform:control:admin', 'super_admin');
```

### **Checkpoint 2: Role Permissions Mapping**
- ✅ Admin role has 30+ permissions
- ✅ Manager role has 20+ permissions  
- ✅ User role has 10+ permissions
- ✅ Super Admin has all permissions

**Validation Query:**
```sql
SELECT 
  r.name as role_name,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name, r.tenant_id
ORDER BY permission_count DESC;
```

### **Checkpoint 3: User Synchronization**
- ✅ All 11 test users exist in both auth.users and public.users
- ✅ UUIDs match between auth and public schemas
- ✅ User role assignments completed

**Validation Query:**
```sql
-- Check user synchronization
SELECT 
  u.email,
  CASE WHEN au.id IS NOT NULL THEN 'SYNCED' ELSE 'MISSING' END as auth_status,
  CASE WHEN u.tenant_id IS NOT NULL THEN 'TENANT_SCOPED' ELSE 'GLOBAL' END as user_type
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.email;
```

---

## 🧪 **VALIDATION SUITE**

### **Run Complete Validation**
```bash
# Execute comprehensive validation scripts
psql -f check_data_enhanced.sql
psql -f check_policies_enhanced.sql
psql -f test_permission_validation_final.sql
psql -f test_auth_sync_validation.sql
```

### **Expected Results**
- **Total Permissions**: 34+ permissions in correct format
- **Total Roles**: 6+ roles with proper permissions
- **Total Users**: 11 test users synchronized
- **Migration Status**: All migrations applied successfully
- **RLS Policies**: All policies active and functional

---

## 🔄 **ROLLBACK PROCEDURES**

### **Emergency Rollback Steps**

#### 1. Database Rollback
```bash
# Revert to previous migration state
supabase db reset --to [migration_version]

# Or manually rollback critical migration
psql -f rollback_migration_20251122000002.sql
```

#### 2. Data Cleanup
```bash
# Clean up test data if needed
psql -f cleanup_test_data.sql

# Reset sequences
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;
-- (continue for all sequences)
```

#### 3. Auth User Cleanup
```bash
# Clean up auth users
psql -c "DELETE FROM auth.users WHERE email LIKE '%@test.com';"
```

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **Common Issues and Solutions**

#### Issue 1: Permission Migration Fails
**Symptoms**: Error inserting permissions, foreign key constraints
**Solution**: 
```sql
-- Check for existing permissions
SELECT name FROM permissions WHERE name LIKE '%:manage';

-- Remove conflicts and retry
DELETE FROM permissions WHERE name LIKE '%:manage';
```

#### Issue 2: Auth User Sync Mismatch
**Symptoms**: UUIDs don't match between auth and public
**Solution**:
```bash
# Re-run sync with force flag
tsx scripts/sync-auth-to-sql.ts --force
```

#### Issue 3: Role Permissions Missing
**Symptoms**: Users can't access expected features
**Solution**:
```sql
-- Re-populate role permissions
psql -f fix_role_permissions_v2.sql
```

#### Issue 4: Migration Order Issues
**Symptoms**: Dependency errors during migration
**Solution**:
```bash
# Check migration order
ls -la supabase/migrations/ | grep 20251122

# Ensure timestamp sequence is correct
```

---

## 📊 **DEPLOYMENT MONITORING**

### **Success Metrics**
- ✅ Clean database deploys successfully
- ✅ All migrations execute without errors
- ✅ All 34+ permissions created in correct format
- ✅ All role permissions mapped correctly
- ✅ All 11 test users can authenticate
- ✅ RBAC functionality verified across all roles

### **Performance Benchmarks**
- Migration execution time: < 5 minutes
- Seed data insertion: < 2 minutes
- Auth user sync: < 1 minute
- Full validation suite: < 3 minutes

---

## 📝 **POST-DEPLOYMENT CHECKLIST**

### **Immediate Validation (First 10 Minutes)**
- [ ] All migrations applied successfully
- [ ] Permissions table populated with 34+ entries
- [ ] All test users can log in
- [ ] Role permissions assigned correctly
- [ ] No database constraint violations

### **Short-term Validation (First Hour)**
- [ ] RBAC permissions working for all roles
- [ ] Tenant isolation functioning
- [ ] Auth user synchronization verified
- [ ] All CRUD operations functional
- [ ] RLS policies active

### **Long-term Validation (First Day)**
- [ ] Application performance stable
- [ ] No database deadlocks or performance issues
- [ ] User access patterns normal
- [ ] Audit logs recording correctly
- [ ] System monitoring alerts clear

---

## 🔧 **MAINTENANCE PROCEDURES**

### **Regular Validation**
- Weekly: Run permission consistency checks
- Monthly: Verify auth user synchronization
- Quarterly: Complete migration rollback test

### **Backup Procedures**
```bash
# Create database backup before any changes
pg_dump [database] > backup_$(date +%Y%m%d_%H%M%S).sql

# Test backup restore
psql [database] < backup_latest.sql
```

---

## 📞 **SUPPORT CONTACTS**

### **Emergency Escalation**
- **Database Issues**: Review migration logs in `supabase/logs/`
- **Permission Issues**: Check role_permissions table and granted_by field
- **Auth Issues**: Verify auth.users table and sync scripts
- **RLS Issues**: Check pg_policies table and policy definitions

---

## 📚 **REFERENCES**

### **Key Files**
- `supabase/migrations/20251122000002_update_permissions_to_resource_action_format.sql`
- `supabase/seed.sql`
- `scripts/seed-auth-users.ts`
- `scripts/sync-auth-to-sql.ts`

### **Validation Scripts**
- `test_permission_insertion_clean_db.sql`
- `test_migration_sequence_clean_db.sql`
- `check_data_enhanced.sql`
- `check_policies_enhanced.sql`

### **Documentation**
- `ARCHITECTURE.md` - Database schema and relationships
- `FUNCTIONAL_REQUIREMENT_SPECIFICATION.md` - Permission requirements
- `REPOSITORY.md` - Code standards and patterns

---

**Last Updated**: 2025-11-23 01:37:00 UTC  
**Version**: 2.0 - Complete Deployment Guide  
**Status**: Production Ready