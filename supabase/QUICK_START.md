# 📦 Complete Database Export - Quick Reference

Generated: **December 15, 2025**

## 🎯 Files Created

### 1. **COMPLETE_DATABASE_EXPORT.sql** (748 KB)
**The complete database schema with everything you need**

**Contents:**
- ✅ All 112 migrations in chronological order
- ✅ All table structures, enums, types
- ✅ All RLS policies (200+)
- ✅ All functions and triggers (75+)
- ✅ All indexes (150+)
- ✅ All views (15+)
- ✅ Complete seed data (tenants, users, roles, permissions)

**When to use:** Fresh installation or complete database reset

**How to use:**
```bash
# PostgreSQL
psql -U postgres -d your_database < supabase/COMPLETE_DATABASE_EXPORT.sql

# Supabase CLI
supabase db reset
# Then copy/paste content in Supabase SQL Editor

# Or use Supabase Dashboard
# Go to SQL Editor → Paste content → Run
```

---

### 2. **complete_database_schema.sql** (702 KB)
**Migrations only, no seed data**

**Contents:**
- ✅ All migrations concatenated
- ❌ No seed data

**When to use:** Production deployment without test data

---

### 3. **DATABASE_EXPORT_README.md** (15 KB)
**Comprehensive documentation**

**Contents:**
- Complete schema documentation
- All tables explained
- RLS policies overview
- Security features
- Troubleshooting guide
- Migration management
- Common operations

**When to use:** Understanding the database structure

---

### 4. **VERIFY_DATABASE_EXPORT.sql** (6 KB)
**Verification script to test successful import**

**Tests:**
- ✅ Extensions installed
- ✅ Tables created (40+)
- ✅ RLS policies applied (200+)
- ✅ Functions created (25+)
- ✅ Triggers created (50+)
- ✅ Indexes created (150+)
- ✅ Views created (15+)
- ✅ Seed data loaded
- ✅ Super admin created
- ✅ RLS enabled on critical tables

**How to use:**
```bash
# After importing COMPLETE_DATABASE_EXPORT.sql
psql -U postgres -d your_database < supabase/VERIFY_DATABASE_EXPORT.sql

# Should show all ✅ PASS results
```

---

### 5. **MIGRATION_INDEX.txt** (5 KB)
**Complete list of all 112 migrations**

Quick reference for migration history.

---

## 📊 Database Schema Overview

### Core Entities (40+ tables)

#### **Multi-Tenancy & Users**
- `tenants` - Tenant organizations
- `users` - User profiles (synced with auth.users)
- `roles` - Tenant-specific roles
- `permissions` - Granular permissions (150+)
- `role_permissions` - Role-permission mappings
- `user_roles` - User-role assignments

#### **CRM Core**
- `customers` - Customer database
- `customer_tags` - Customer categorization
- `sales` / `deals` - Sales pipeline
- `deal_items` - Deal line items
- `deal_transactions` - Deal payment tracking
- `tickets` - Support tickets
- `complaints` - Complaint management

#### **Products & Services**
- `products` - Product catalog
- `product_categories` - Product hierarchy
- `companies` - Suppliers/vendors
- `product_sales` - Product sale records
- `service_contracts` - Service contracts

#### **Operations**
- `job_works` - Service job tracking
- `job_work_items` - Job work line items
- `purchase_orders` - Purchase orders
- `purchase_order_items` - PO line items
- `suppliers` - Supplier management

#### **System**
- `audit_logs` - Audit trail
- `notifications` - In-app notifications
- `navigation_items` - Dynamic menus
- `status_options` - Configurable statuses
- `lead_sources`, `ticket_priorities`, etc.

---

## 🔒 Security Features

### 1. Row Level Security (RLS)
- **Enabled on all critical tables**
- **Tenant isolation:** Users can only access their tenant's data
- **Super admin isolation:** Super admins can read all data but are separate from tenants
- **Permission-based access:** RBAC enforced at database level

### 2. Multi-Tenant Architecture
```sql
-- Every tenant-specific table has:
tenant_id UUID REFERENCES tenants(id)

-- RLS policy ensures:
WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
-- OR for super admins:
WHERE (SELECT is_super_admin FROM users WHERE id = auth.uid()) = true
```

### 3. Audit Trail
```sql
-- All data changes logged to audit_logs
CREATE TRIGGER log_changes
  AFTER INSERT OR UPDATE OR DELETE ON table_name
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

### 4. Soft Deletes
```sql
-- Critical tables use soft deletes
deleted_at TIMESTAMP WITH TIME ZONE
-- Data remains in database for audit/recovery
```

---

## 👥 Default Users (Seed Data)

### Super Admin (Global)
```
Email: superadmin@crm.com
Password: password123
Tenant: NULL (global access)
Role: super_admin
```

### Tenant Users (Acme Corporation)
```
Admin:
  Email: admin@acme.com
  Password: password123
  Role: tenant_admin

Manager:
  Email: manager@acme.com
  Password: password123
  Role: manager

Agent:
  Email: engineer@acme.com
  Password: password123
  Role: agent
```

**⚠️ IMPORTANT:** Change these passwords immediately in production!

---

## 🚀 Quick Start Guide

### Step 1: Create Database
```bash
# Option A: Supabase (Recommended)
# 1. Create new Supabase project at https://supabase.com
# 2. Note your connection details

# Option B: Local PostgreSQL
createdb pds_crm
```

### Step 2: Import Schema
```bash
# Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Open COMPLETE_DATABASE_EXPORT.sql
# 3. Copy all content
# 4. Paste in SQL Editor
# 5. Click Run

# OR using psql:
psql -U postgres -d pds_crm < supabase/COMPLETE_DATABASE_EXPORT.sql
```

### Step 3: Verify Import
```bash
psql -U postgres -d pds_crm < supabase/VERIFY_DATABASE_EXPORT.sql

# Should see:
# ✅ Extensions Check - PASS
# ✅ Core Tables Check - PASS
# ✅ RLS Policies Check - PASS
# ... (all tests passing)
```

### Step 4: Test Login
```bash
# In your application:
# 1. Start the app: npm run dev
# 2. Navigate to http://localhost:5000
# 3. Login with: superadmin@crm.com / password123
# 4. Verify dashboard loads
# 5. Check super admin panel access
```

### Step 5: Production Cleanup
```sql
-- Remove seed data (optional for production)
DELETE FROM users WHERE email LIKE '%@acme.com';
DELETE FROM tenants WHERE domain LIKE '%.example';

-- Update super admin password
UPDATE auth.users 
SET encrypted_password = crypt('YOUR_SECURE_PASSWORD', gen_salt('bf', 8))
WHERE email = 'superadmin@crm.com';
```

---

## 🔧 Common Tasks

### Reset Database to Clean State
```bash
# Supabase CLI
supabase db reset

# PostgreSQL
dropdb pds_crm && createdb pds_crm
psql -U postgres -d pds_crm < supabase/COMPLETE_DATABASE_EXPORT.sql
```

### Backup Current Database
```bash
# Full backup
pg_dump -U postgres -d pds_crm > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U postgres -d pds_crm --schema-only > schema_backup.sql

# Data only
pg_dump -U postgres -d pds_crm --data-only > data_backup.sql
```

### Add New Tenant
```sql
-- Create tenant
INSERT INTO tenants (id, name, domain, plan, status)
VALUES (
  gen_random_uuid(),
  'New Company',
  'newcompany.com',
  'premium',
  'active'
);

-- Create admin user (must exist in auth.users first)
INSERT INTO users (id, email, name, tenant_id, is_super_admin, status)
VALUES (
  '<auth_user_id>',
  'admin@newcompany.com',
  'Company Admin',
  '<tenant_id>',
  false,
  'active'
);

-- Assign role
INSERT INTO user_roles (user_id, role_id, tenant_id)
SELECT 
  '<auth_user_id>',
  id,
  '<tenant_id>'
FROM roles 
WHERE name = 'tenant_admin' AND tenant_id = '<tenant_id>';
```

---

## 📈 Statistics

| Metric | Count |
|--------|-------|
| **Migrations** | 112 |
| **Tables** | 40+ |
| **RLS Policies** | 200+ |
| **Functions** | 25+ |
| **Triggers** | 50+ |
| **Indexes** | 150+ |
| **Views** | 15+ |
| **Permissions** | 150+ |
| **Default Roles** | 6 |
| **Lines of SQL** | 19,000+ |

---

## ⚠️ Important Warnings

1. **⚠️ ALWAYS BACKUP BEFORE IMPORTING**
   - This script will modify your database structure
   - Test in development first

2. **⚠️ CHANGE DEFAULT PASSWORDS**
   - Default passwords are for development only
   - Update immediately in production

3. **⚠️ REVIEW SEED DATA**
   - Remove test tenants and users in production
   - Keep only necessary reference data

4. **⚠️ CHECK POSTGRESQL VERSION**
   - Requires PostgreSQL 14+
   - Requires Supabase extensions

5. **⚠️ VERIFY RLS POLICIES**
   - Test tenant isolation after import
   - Verify super admin access
   - Test user permissions

---

## 📞 Need Help?

### Troubleshooting Resources
- **README**: [DATABASE_EXPORT_README.md](./DATABASE_EXPORT_README.md)
- **Architecture**: `../ARCHITECTURE.md`
- **RLS Guide**: `../RLS_BEST_PRACTICES.md`
- **Implementation Guide**: `../COMPREHENSIVE_IMPLEMENTATION_GUIDE.md`

### Common Issues

**Issue: RLS blocking queries**
```sql
-- Check user permissions
SELECT * FROM users WHERE id = auth.uid();
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

**Issue: Super admin can't login**
```sql
-- Verify super admin exists
SELECT * FROM users WHERE is_super_admin = true;
-- Should have: tenant_id IS NULL, is_super_admin = true
```

**Issue: Migration errors**
```bash
# Reset and retry
supabase db reset
supabase db push
```

---

**Last Updated:** December 15, 2025  
**Schema Version:** 1.0.0  
**Compatible With:** PostgreSQL 14+, Supabase

---

## ✅ Checklist

After importing, verify:

- [ ] All 40+ tables created
- [ ] RLS enabled on critical tables
- [ ] Super admin user exists (superadmin@crm.com)
- [ ] At least 3 sample tenants created
- [ ] At least 4 users created
- [ ] At least 6 roles created
- [ ] At least 100 permissions created
- [ ] Can login as super admin
- [ ] Can login as tenant admin
- [ ] Tenant isolation working (users can't see other tenants' data)
- [ ] Super admin can view all tenants
- [ ] Audit logs are being created
- [ ] Timestamps auto-update (updated_at)

**Run verification script:**
```bash
psql -U postgres -d pds_crm < supabase/VERIFY_DATABASE_EXPORT.sql
```

All checks should show **✅ PASS**
