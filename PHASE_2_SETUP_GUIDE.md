# Phase 2: Database Setup Guide
## Apply Migrations & Verify Schema

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- ✅ Supabase CLI installed (`supabase --version`)
- ✅ Docker running (`docker ps` works)
- ✅ Project has `supabase/migrations/` folder with 7 migration files

### Step 1: Start Supabase (Terminal 1)
```powershell
# In project root
supabase start

# Wait for output:
# Started supabase local development setup.
# 
# API URL: http://localhost:54321
# Studio URL: http://localhost:54323
```

**⏳ This takes 30-60 seconds on first run**

### Step 2: Verify Migrations (Terminal 2)
```powershell
# In project root
supabase migration list

# You should see:
# Migrations  
# ──────────────────────────────
# 20250101000001_init_tenants_and_users.sql
# 20250101000002_master_data_companies_products.sql
# 20250101000003_crm_customers_sales_tickets.sql
# 20250101000004_contracts.sql
# 20250101000005_advanced_product_sales_jobwork.sql
# 20250101000006_notifications_and_indexes.sql
# 20250101000007_row_level_security.sql
```

### Step 3: Check Database (Terminal 2)
```powershell
# Connect to local database
psql "postgresql://postgres:postgres@localhost:5432/postgres"

# List tables (shows ~50 tables)
\dt

# Exit
\q
```

✅ **All tables created successfully!**

---

## 📊 Verify Schema in Studio

### Open Studio UI
```
http://localhost:54323
```

### Navigate to Database
1. Click **SQL Editor** in left sidebar
2. Run verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### You should see these 50+ tables:
```
activity_logs
audit_logs
companies
complaints
contract_approval_records
contract_attachments
contract_parties
contract_templates
contract_versions
contracts
customers
job_work_specifications
job_works
notification_preferences
notifications
permissions
pdf_templates
product_categories
product_sales
product_specifications
products
role_permissions
roles
sale_items
sales
service_contracts
template_fields
tenants
ticket_attachments
ticket_comments
tickets
user_roles
users
```

---

## ✨ Test the Setup

### Create Test Tenant
In Studio SQL Editor:

```sql
-- Create test tenant
INSERT INTO tenants (name, domain, status, plan)
VALUES ('Dev Company', 'dev.local', 'active', 'enterprise')
RETURNING id, name, created_at;
```

**Output:**
```
id                      | name        | created_at
────────────────────────|─────────────|─────────────
550e8400-e29b-41d4-a716...| Dev Company | 2025-01-01...
```

✅ Copy the `id` value (this is your `tenant_id`)

### Create Test User
```sql
-- Replace TENANT_ID with the ID from above
INSERT INTO users (email, name, role, status, tenant_id)
VALUES (
  'admin@dev.local',
  'Admin User',
  'admin',
  'active',
  'TENANT_ID'
)
RETURNING id, email, role;
```

✅ User created successfully!

### Create Test Customer
```sql
-- Replace TENANT_ID with your tenant ID
INSERT INTO customers (
  company_name, contact_name, email, phone, 
  city, country, industry, status, tenant_id, created_by
)
VALUES (
  'Acme Corporation',
  'John Smith',
  'john@acme.com',
  '555-0123',
  'New York',
  'USA',
  'Technology',
  'active',
  'TENANT_ID',
  (SELECT id FROM users WHERE email = 'admin@dev.local' LIMIT 1)
)
RETURNING id, company_name, email;
```

✅ Customer created!

### List All Customers
```sql
SELECT id, company_name, email, status
FROM customers
WHERE tenant_id = 'TENANT_ID';
```

---

## 🔐 Verify RLS (Row Level Security)

### Check RLS is Enabled
```sql
-- View RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
LIMIT 10;
```

**Output should show `rowsecurity = true` for all tables**

### Check Policies
```sql
-- View all policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public'
LIMIT 5;
```

**You should see policies like:**
- `users_view_tenant_customers`
- `users_create_customers`
- `users_update_customers`

---

## 📈 Verify Indexes

### Check Performance Indexes
```sql
-- View all indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
```

**Key indexes should include:**
- `idx_customers_tenant_id` 
- `idx_sales_tenant_stage_created`
- `idx_tickets_tenant_assigned_status`
- `idx_contracts_tenant_status_end`
- `idx_customers_search_text`

---

## 🧪 Full-Text Search Test

### Enable Search
```sql
-- Update customer search index
UPDATE customers 
SET search_text = to_tsvector('english', company_name || ' ' || email)
WHERE tenant_id = 'TENANT_ID';

-- Search
SELECT company_name, email
FROM customers
WHERE search_text @@ to_tsquery('english', 'acme')
AND tenant_id = 'TENANT_ID';
```

---

## 🚨 Troubleshooting

### Issue: Migrations not running
```powershell
# Reset and restart
supabase stop
supabase start

# Check logs
supabase logs
```

### Issue: Can't connect to database
```bash
# Verify Docker is running
docker ps

# Check Supabase status
supabase status
```

### Issue: Port already in use
```powershell
# Find process using port 54321
Get-Process | Where-Object {$_.ProcessName -like "*docker*"}

# Kill if needed
Stop-Process -Name "docker" -Force
```

### Issue: Permission denied
```sql
-- Check user permissions
SELECT * FROM pg_user WHERE usename = 'postgres';

-- Ensure you're using correct connection string:
-- postgresql://postgres:postgres@localhost:5432/postgres
```

---

## 📋 Database Statistics

### Show table sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Show index sizes
```sql
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Count records
```sql
SELECT 
    'customers' as table_name, COUNT(*) FROM customers UNION ALL
SELECT 'sales', COUNT(*) FROM sales UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts;
```

---

## 🔄 Reset Database (If Needed)

### Complete Reset
```powershell
# Stop Supabase
supabase stop

# Remove local data
Remove-Item -Path "./.supabase" -Recurse -Force

# Start fresh
supabase start
```

### Reset without stopping
```sql
-- WARNING: This drops all data!
-- Only run if you're sure!

-- Drop all tables (migrations will recreate)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## ✅ Success Checklist

- [ ] `supabase start` runs without errors
- [ ] 7 migrations appear in `supabase migration list`
- [ ] All ~50 tables created in database
- [ ] Test tenant created successfully
- [ ] Test user created successfully
- [ ] Test customer created successfully
- [ ] RLS policies show 40+ policies
- [ ] Performance indexes created
- [ ] Full-text search working
- [ ] Studio UI accessible at localhost:54323

---

## 🎯 Next: Phase 2 Service Implementation

Once database is verified:

1. **Review** `src/services/supabase/baseService.ts` (CRUD foundation)
2. **Implement** service classes:
   - AuthService
   - CustomerService
   - SalesService
   - TicketService
   - ContractService
   - ProductService
   - CompanyService
   - NotificationService
3. **Test** each service with local data
4. **Integrate** with components

---

## 📚 Related Documentation

- **Schema Details**: `PHASE_2_DATABASE_SCHEMA.md`
- **Supabase Local Setup**: `LOCAL_SUPABASE_SETUP.md`
- **Quick Reference**: `SUPABASE_QUICK_REFERENCE.md`

---

## 💡 Tips

### Quick Database Access
```powershell
# Connect directly
psql "postgresql://postgres:postgres@localhost:5432/postgres"

# Run query from file
psql "postgresql://postgres:postgres@localhost:5432/postgres" -f query.sql
```

### Monitor Migrations
```powershell
# Watch migration progress
supabase db pull

# Check latest status
supabase migration list
```

### Backup Data
```powershell
# Export current database
pg_dump "postgresql://postgres:postgres@localhost:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres:postgres@localhost:5432/postgres" < backup.sql
```

---

**Status:** ✅ Database Schema Complete  
**Migration Files:** 7  
**Tables Created:** 50+  
**Indexes:** 25+  
**RLS Policies:** 40+  
**Ready for:** Service Implementation
