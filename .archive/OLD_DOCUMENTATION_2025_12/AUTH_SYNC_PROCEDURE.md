# Auth User Synchronization Procedure

## 🎯 **OVERVIEW**

This document provides the complete procedure for synchronizing authentication users between Supabase Auth and the application database, ensuring proper user ID matching and role assignment.

---

## 📋 **AUTHENTICATION WORKFLOW**

### Step 1: Environment Setup
```bash
# 1. Start local Supabase instance
supabase start

# 2. Verify environment variables are set
cat .env | grep SUPABASE
```

### Step 2: Create Auth Users
```bash
# Execute the auth user seeding script
npx tsx scripts/seed-auth-users.ts
```

**Expected Output:**
- Creates 10 test users across multiple tenants
- Generates `auth-users-config.json` with user IDs
- Provides detailed validation and error handling

### Step 3: Sync User IDs to Database
```bash
# Update seed.sql with actual user IDs
tsx scripts/sync-auth-to-sql.ts
```

**Expected Output:**
- Matches auth users with database users by email
- Updates all user UUID references in seed.sql
- Provides mapping summary

### Step 4: Database Reset and Seeding
```bash
# Reset database with synced user data
supabase db reset
```

---

## 🔍 **VALIDATION PROCEDURES**

### Automated Validation
Run the comprehensive environment test:
```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f comprehensive_environment_test.sql
```

**Validates:**
- ✅ Environment setup (PostgreSQL 17.6, extensions)
- ✅ Migration execution (74 migrations)
- ✅ Seed data execution (90 permissions, 16 roles, 10 users, 3 tenants)
- ✅ Table creation (75 tables)
- ✅ RLS policies (186 policies)
- ✅ RBAC functionality

### Manual Validation
Check user synchronization:
```sql
-- Verify auth user sync
SELECT email, id as auth_id FROM auth.users;

-- Verify database users match
SELECT email, id as db_id FROM users;

-- Check role assignments
SELECT u.email, r.name as role_name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;
```

---

## 🛠️ **TROUBLESHOOTING**

### Common Issues and Solutions

#### Issue 1: Connection Errors
**Symptom:** `Database error finding users`
**Solution:**
```bash
# Verify Supabase is running
supabase status

# Check service key permissions
echo $VITE_SUPABASE_SERVICE_KEY | head -c 20
```

#### Issue 2: User ID Mismatches
**Symptom:** `oldId => newId` mappings in sync output
**Solution:**
```bash
# Re-run sync to update IDs
tsx scripts/sync-auth-to-sql.ts

# Verify database reset
supabase db reset
```

#### Issue 3: Permission Format Issues
**Symptom:** Permission validation failures
**Solution:**
```sql
-- Check permission format
SELECT name FROM permissions WHERE name LIKE '%manage%' LIMIT 10;

-- Verify new format: crm:user:record:update, crm:role:permission:assign, etc.
SELECT name FROM permissions WHERE name LIKE '%:%' OR name IN ('read', 'write', 'delete');
```

---

## 🔐 **USER ACCOUNTS OVERVIEW**

### Test Users Created
| Email | Role | Tenant |
|-------|------|--------|
| admin@acme.com | Administrator | Acme Corporation |
| manager@acme.com | Manager | Acme Corporation |
| engineer@acme.com | Engineer | Acme Corporation |
| user@acme.com | User | Acme Corporation |
| admin@techsolutions.com | Administrator | Tech Solutions Inc |
| manager@techsolutions.com | Manager | Tech Solutions Inc |
| admin@globaltrading.com | Administrator | Global Trading Ltd |
| superadmin@platform.com | Super Admin | Platform |
| superadmin2@platform.com | Super Admin | Platform |
| superadmin3@platform.com | Super Admin | Platform |

### Default Password
**All test users:** `password123`

---

## 📊 **VALIDATION METRICS**

### Success Criteria
- ✅ **10/10 users** successfully synchronized
- ✅ **74 migrations** applied without errors
- ✅ **90 permissions** properly formatted
- ✅ **16 roles** correctly assigned
- ✅ **186 RLS policies** active and functional
- ✅ **Tenant isolation** working across all roles

### Database Statistics
```sql
-- Total counts for verification
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM role_permissions) as total_role_permissions,
    (SELECT COUNT(*) FROM tenants) as total_tenants;
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### Pre-Deployment Validation
- [ ] Environment variables configured
- [ ] Supabase instance accessible
- [ ] Auth users created successfully
- [ ] Database synchronization completed
- [ ] Comprehensive environment test passed
- [ ] User role assignments verified
- [ ] RLS policies functioning correctly

### Post-Deployment Verification
- [ ] All test users can log in
- [ ] Role-based access control working
- [ ] Tenant isolation functioning
- [ ] Permission checks operational
- [ ] No database constraint violations

---

## 📞 **SUPPORT**

For issues not covered in this guide:
1. Review comprehensive_environment_test.sql output
2. Check Supabase logs: `supabase logs`
3. Verify environment configuration
4. Run manual validation queries

**Last Updated:** 2025-11-23 01:02:00 UTC  
**Version:** 1.0  
**Status:** Production Ready