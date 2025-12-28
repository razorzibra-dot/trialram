# Complete Database Export - PDS CRM Enterprise

## 📦 Export Contents

This directory contains the complete database schema export for the PDS CRM Enterprise application.

### Files Included

1. **`COMPLETE_DATABASE_EXPORT.sql`** (748 KB)
   - Complete database schema with all migrations
   - All tables, enums, types
   - All RLS policies
   - All functions and triggers
   - All indexes and views
   - Essential seed data

2. **`COMPLETE_DATABASE_SCHEMA.sql`** (702 KB)
   - Migrations only (no seed data)
   - Useful for production deployments without test data

3. **`seed.sql`** (282 lines)
   - Reference and seed data
   - Development user accounts
   - Sample tenants and permissions

## 🚀 Quick Start

### Option 1: Fresh Installation (Recommended)

```bash
# 1. Create a new Supabase project or PostgreSQL database
# 2. Run the complete export
psql -U postgres -d your_database < COMPLETE_DATABASE_EXPORT.sql

# OR using Supabase CLI
supabase db reset
supabase db push
```

### Option 2: Schema Only (Production)

```bash
# Run migrations without seed data
psql -U postgres -d your_database < COMPLETE_DATABASE_SCHEMA.sql
```

### Option 3: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `COMPLETE_DATABASE_EXPORT.sql`
3. Paste and run

## 📋 What's Included

### 1. Core Schema (112 migrations)

#### **Tenants & Multi-tenancy**
- `tenants` - Multi-tenant isolation
- Soft deletes with `deleted_at`
- Plan-based features (basic, premium, enterprise)

#### **User Management & Authentication**
- `users` - Public user profiles (synced with auth.users)
- `roles` - Tenant-specific roles with RBAC
- `permissions` - Granular permission system
- `role_permissions` - Role-permission assignments
- `user_roles` - User-role assignments
- Element-level permissions for fine-grained UI control

#### **CRM Modules**
- **Customers**: `customers`, `customer_tags`, `customer_tag_relationships`
- **Deals/Sales**: `sales`, `deal_items`, `deal_transactions`, `deal_types`
- **Tickets**: `tickets` with complaint tracking
- **Complaints**: `complaints` with resolution workflow
- **Contracts**: `service_contracts` with renewal tracking

#### **Product Management**
- `products` - Product catalog with hierarchy
- `product_categories` - Multi-level categorization
- `product_sales` - Product sale tracking
- `companies` - Supplier/vendor management

#### **Job Work System**
- `job_works` - Service job tracking
- `job_work_items` - Line items
- Integration with customers and products

#### **Purchase Management**
- `suppliers` - Supplier database
- `purchase_orders` - PO tracking
- `purchase_order_items` - PO line items

#### **System Tables**
- `audit_logs` - Comprehensive audit trail
- `notifications` - In-app notifications
- `navigation_items` - Dynamic menu configuration
- `status_options` - Configurable status workflows
- `lead_sources`, `ticket_priorities`, etc.

### 2. Row Level Security (RLS)

#### **Super Admin Isolation**
- Super admins (`is_super_admin = true`, `tenant_id IS NULL`) have global access
- Enforced across all tables with dedicated policies
- Rate limiting and audit logging for super admin actions

#### **Tenant Isolation**
- All tenant users can ONLY access data within their `tenant_id`
- Cross-tenant data leakage prevented at database level
- Recursive policy protection (no nested SELECT vulnerabilities)

#### **Role-Based Access Control (RBAC)**
- Module-level permissions (`crm:customers:read`, `crm:deals:create`, etc.)
- Element-level permissions for UI components (buttons, forms, tabs)
- Permission inheritance through role hierarchy

#### **Key RLS Policies**
- ✅ SELECT: Based on tenant_id + user permissions
- ✅ INSERT: Validates tenant ownership + create permissions
- ✅ UPDATE: Validates tenant ownership + update permissions
- ✅ DELETE: Validates tenant ownership + delete permissions (soft delete enforced)

### 3. Functions & Triggers

#### **Authentication Sync**
```sql
-- Automatically syncs auth.users → public.users
handle_new_user() TRIGGER
```

#### **Audit Trail**
```sql
-- Logs all data changes
log_audit_trail() TRIGGER
-- Applied to: customers, sales, tickets, contracts, etc.
```

#### **Timestamp Management**
```sql
-- Auto-updates updated_at on record changes
update_updated_at_column() TRIGGER
```

#### **Data Validation**
```sql
-- Validates role consistency
check_role_consistency() FUNCTION
-- Ensures users don't have conflicting roles
```

### 4. Indexes & Performance

#### **Primary Indexes**
- All tables have UUID primary keys with indexes
- Foreign key columns are indexed
- Tenant isolation columns indexed for performance

#### **Performance Indexes**
```sql
-- Multi-tenant queries
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);

-- Status filtering
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_sales_stage ON sales(stage);

-- Date range queries
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- Full-text search
CREATE INDEX idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);
```

### 5. Views

#### **Sales Pipeline Views**
```sql
-- sales_pipeline_view: Aggregated deal metrics by stage
-- deal_revenue_view: Revenue analysis
```

#### **CRM Views**
```sql
-- customer_summary_view: Customer 360 with stats
-- ticket_summary_view: Ticket analytics
```

#### **Contract Views**
```sql
-- active_contracts_view: Current contracts
-- contract_revenue_view: Revenue projections
```

### 6. Seed Data

#### **Default Tenants**
- Acme Corporation (Enterprise plan)
- Tech Solutions Inc (Premium plan)
- Global Trading Ltd (Basic plan)

#### **Sample Users**
```
Super Admin: superadmin@crm.com / password123
Tenant Admin: admin@acme.com / password123
Manager: manager@acme.com / password123
Agent: engineer@acme.com / password123
```

#### **Default Roles**
- `super_admin` - Global administrator
- `tenant_admin` - Tenant administrator
- `manager` - Department manager
- `agent` - Sales agent
- `engineer` - Field engineer
- `customer` - Customer portal access

#### **Permissions**
- 150+ granular permissions
- Organized by module and action
- Element-level UI permissions

#### **Reference Data**
- Lead sources (Website, Referral, Cold Call, etc.)
- Ticket priorities (Low, Medium, High, Urgent)
- Deal stages (Lead, Qualified, Proposal, etc.)
- Customer statuses (Active, Inactive, VIP, etc.)

## 📊 Schema Statistics

| Category | Count |
|----------|-------|
| **Migrations** | 112 files |
| **Tables** | 40+ tables |
| **RLS Policies** | 200+ policies |
| **Functions** | 25+ functions |
| **Triggers** | 50+ triggers |
| **Indexes** | 150+ indexes |
| **Views** | 15+ views |
| **Permissions** | 150+ permissions |
| **Roles** | 6 default roles |

## 🔒 Security Features

### 1. Multi-Tenant Isolation
- ✅ Row-level security enforced on all tables
- ✅ Tenant ID validation on all operations
- ✅ Cross-tenant queries blocked at database level

### 2. Super Admin Protection
- ✅ Super admins isolated from tenant data
- ✅ Separate access patterns and policies
- ✅ Audit logging for super admin actions

### 3. Authentication & Authorization
- ✅ Supabase Auth integration
- ✅ JWT-based authentication
- ✅ Permission-based authorization
- ✅ Element-level UI permissions

### 4. Audit Trail
- ✅ All data changes logged
- ✅ User identification (auth user + public user)
- ✅ IP tracking and session tracking
- ✅ Change history with before/after snapshots

### 5. Data Protection
- ✅ Soft deletes (deleted_at) on critical tables
- ✅ Cascade delete prevention
- ✅ Foreign key constraints
- ✅ NOT NULL constraints on required fields

## 🛠️ Migration Management

### Current Migration Files (112 total)

#### Foundation (Phase 1)
1. `20250101000001_init_tenants_and_users.sql` - Core tenants and users
2. `20250101000002_master_data_companies_products.sql` - Master data tables
3. `20250101000003_crm_customers_sales_tickets.sql` - CRM core tables
4. `20250101000004_contracts.sql` - Contract management
5. `20250101000005_advanced_product_sales_jobwork.sql` - Product sales and job works

#### Security & RBAC (Phase 2)
6. `20250101000007_row_level_security.sql` - Initial RLS policies
7. `20250101000009_fix_rbac_schema.sql` - RBAC schema corrections
8. `20250101000010_add_rbac_rls_policies.sql` - RBAC RLS policies
9-12. Multiple RLS fixes and refinements

#### Features & Enhancements (Phase 3)
13-17. Notification system enhancements
18-19. Service contracts module
20-25. Views and analytics
26-28. Denormalization removal and performance indexes

#### Super Admin & Advanced Features (Phase 4)
29-40. Super admin schema and isolation
41-50. Element-level permissions
51-60. Module-specific enhancements

#### Recent Updates (Phase 5)
61-112. Complaints, deals, product categories, purchase orders, schema alignments

### Adding New Migrations

```bash
# Create a new migration
supabase migration new my_feature_name

# Test migration
supabase db reset
supabase db push

# Commit migration
git add supabase/migrations/
git commit -m "Add: my feature migration"
```

## 📝 Common Operations

### Reset Database to Clean State

```bash
# Using Supabase CLI
supabase db reset

# Using psql
psql -U postgres -d your_database < COMPLETE_DATABASE_EXPORT.sql
```

### Backup Current Database

```bash
# Dump current schema
pg_dump -U postgres -d your_database --schema-only > backup_schema.sql

# Dump current data
pg_dump -U postgres -d your_database --data-only > backup_data.sql

# Complete backup
pg_dump -U postgres -d your_database > complete_backup.sql
```

### Export Fresh Schema

```bash
# From migrations folder
cd supabase/migrations
cat *.sql > ../COMPLETE_DATABASE_SCHEMA.sql
```

## 🐛 Troubleshooting

### Issue: RLS Policies Blocking Queries

**Symptom**: `row-level security policy for table "X" (RLS): permission denied`

**Solution**:
```sql
-- Check current user permissions
SELECT * FROM auth.users WHERE id = auth.uid();
SELECT * FROM users WHERE id = auth.uid();
SELECT * FROM user_roles WHERE user_id = auth.uid();
SELECT * FROM role_permissions rp
JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = auth.uid();

-- Temporarily disable RLS for debugging (NOT for production)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

### Issue: Super Admin Can't Access Tenant Data

**Expected Behavior**: Super admins (`is_super_admin = true`, `tenant_id IS NULL`) should have read access to all tenant data but cannot modify tenant data.

**Verification**:
```sql
-- Check super admin user
SELECT id, email, tenant_id, is_super_admin FROM users WHERE email = 'superadmin@crm.com';

-- Should return: tenant_id IS NULL, is_super_admin = true
```

### Issue: User Can't See Data in Their Tenant

**Check**:
```sql
-- Verify user tenant assignment
SELECT id, email, tenant_id, is_super_admin FROM users WHERE email = 'your@email.com';

-- Verify user has role in their tenant
SELECT ur.*, r.name FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'your@email.com');

-- Verify role has necessary permissions
SELECT p.* FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
WHERE rp.role_id = (
  SELECT role_id FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com')
);
```

### Issue: Migration Fails

**Common Causes**:
1. Missing dependencies (run migrations in order)
2. Duplicate objects (tables/functions already exist)
3. RLS policy conflicts

**Solution**:
```bash
# Reset and reapply all migrations
supabase db reset
supabase db push

# Check migration status
supabase migration list
```

## 📚 Additional Resources

- **Architecture Guide**: `ARCHITECTURE.md`
- **RLS Best Practices**: `RLS_BEST_PRACTICES.md`
- **Permission Tokens**: `src/constants/permissionTokens.ts`
- **Module Registry**: `src/modules/ModuleRegistry.ts`
- **API Documentation**: `COMPREHENSIVE_IMPLEMENTATION_GUIDE.md`

## 🔄 Version History

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-15 | 1.0.0 | Initial complete export with 112 migrations |
| 2025-01-01 | 0.1.0 | Foundation schema (tenants, users, core CRM) |
| 2025-01-17 | 0.5.0 | RBAC and RLS implementation |
| 2025-11-16 | 0.8.0 | Super admin isolation and element permissions |
| 2025-12-08 | 0.9.0 | Deals module, product sales enhancements |

## ⚠️ Important Notes

1. **Always backup before applying**: This script modifies database structure
2. **Test in development first**: Never run directly on production without testing
3. **Review seed data**: Remove or modify sample data for production deployments
4. **Update passwords**: Change default passwords immediately
5. **Configure extensions**: Ensure PostgreSQL extensions are enabled
6. **Check version compatibility**: Requires PostgreSQL 14+ with Supabase extensions

## 📧 Support

For issues or questions:
- Review architecture documentation
- Check existing migrations for patterns
- Consult RLS best practices guide
- Verify permission configurations

---

**Generated**: December 15, 2025  
**Schema Version**: 1.0.0  
**Total Migrations**: 112  
**Database Size**: ~748 KB (structure + seed data)
