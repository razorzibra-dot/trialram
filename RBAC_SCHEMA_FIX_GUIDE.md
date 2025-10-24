# RBAC Schema Fix Guide

## Problem
Your Supabase database is missing required RBAC schema:
- ❌ `permissions` table missing `category` column
- ❌ `role_templates` table doesn't exist

## Solution
A migration file has been created: `supabase/migrations/20250101000009_fix_rbac_schema.sql`

---

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Apply migrations to local Supabase
supabase db push

# If using cloud Supabase, link first:
# supabase link --project-ref your_project_ref
# supabase db push
```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard**
   - Open: https://app.supabase.com
   - Select your project
   - Go to: **SQL Editor**

2. **Create New Query**
   - Click: **New Query** → **New blank query**

3. **Copy and Paste** the entire content from:
   ```
   supabase/migrations/20250101000009_fix_rbac_schema.sql
   ```

4. **Execute** the query

### Option 3: Using Direct REST API

If you have the migration file, you can send it directly to Supabase:

```bash
# Using curl from PowerShell
$migration = Get-Content "supabase/migrations/20250101000009_fix_rbac_schema.sql" -Raw

$body = @{
    query = $migration
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://YOUR_PROJECT_REF.supabase.co/rest/v1/exec" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

---

## What Gets Fixed

### 1. **Permissions Table Updates**
- ✅ Adds `category` column (e.g., 'admin', 'crm', 'support', 'reporting', 'operations')
- ✅ Adds `is_system_permission` flag for core permissions

### 2. **New Role Templates Table**
Complete table structure for pre-configured role templates:
```sql
role_templates (
  id (UUID),
  name (VARCHAR),
  description (TEXT),
  category (VARCHAR),
  permissions (JSONB array),
  is_default (BOOLEAN),
  tenant_id (UUID),
  created_at, updated_at, created_by
)
```

### 3. **Pre-Loaded System Data**

**Default Permissions** (24 total):
- Admin: manage_users, manage_roles, manage_permissions, view_audit_logs
- CRM: create_customer, edit_customer, delete_customer, view_customer, manage_contracts
- Support: manage_tickets
- Sales: manage_sales, manage_job_works
- Reporting: view_reports
- Masters: manage_products

**Default Role Templates** (5 total):
- Super Admin (full access)
- Administrator (user/role management)
- Sales Manager (sales & customer management)
- Support Agent (ticket & customer support)
- Viewer (read-only access)

---

## Verification Steps

After applying the migration, verify it worked:

### Check 1: Permissions Table Has Category Column

Go to **SQL Editor** and run:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='permissions';
```

Expected columns: `id`, `name`, `description`, `resource`, `action`, `category`, `is_system_permission`, `created_at`

### Check 2: Role Templates Table Exists

```sql
SELECT * FROM role_templates LIMIT 5;
```

Expected result: 5 default templates with names and permissions

### Check 3: Sample Permissions Loaded

```sql
SELECT name, category FROM permissions ORDER BY category;
```

Expected result: Categories like 'admin', 'crm', 'support', 'reporting', 'operations'

---

## Browser Console Errors - After Fix

Once migration is applied, these errors will disappear:
- ❌ `column permissions.category does not exist` 
- ❌ `relation "tenant_*.role_templates" does not exist`
- ❌ `GET /rest/v1/role_templates` 404 errors

---

## Troubleshooting

### If you get "Column already exists" error:
This is normal on retry - the `IF NOT EXISTS` clauses prevent duplicates. Safe to ignore.

### If you get "Table already exists" error:
Same as above - the migration is idempotent and can be run multiple times safely.

### If queries still fail after migration:
1. Hard refresh browser: `Ctrl + Shift + R`
2. Check `.env` file has: `VITE_API_MODE=supabase`
3. Verify you're logged into correct Supabase project
4. Check Supabase connection string in `.env`

### If role_templates table shows no data:
Run the INSERT commands manually:
```sql
INSERT INTO role_templates (...) VALUES (...)
-- See migration file for full INSERT statements
```

---

## Next Steps

After successful migration:

1. ✅ Clear browser cache/refresh
2. ✅ Test RBAC module pages:
   - Users Page (`http://localhost:5173/users`)
   - User Management Page
   - Role Management Page
   - Permission Matrix Page
3. ✅ Verify no console errors
4. ✅ Test creating/editing roles and users
5. ✅ Commit the migration: `git add supabase/migrations/20250101000009_fix_rbac_schema.sql`

---

## Schema Diagram

```
permissions
├── id (PK)
├── name (UNIQUE)
├── description
├── resource
├── action
├── category ✨ NEW
├── is_system_permission ✨ NEW
└── created_at

role_templates ✨ NEW TABLE
├── id (PK)
├── name (UNIQUE per tenant)
├── description
├── category
├── permissions (JSONB array)
├── is_default
├── tenant_id (FK → tenants)
├── created_at
├── updated_at
└── created_by

roles (existing)
├── id (PK)
├── name
├── description
├── tenant_id
├── permissions
├── is_system_role
├── created_at
├── updated_at
└── created_by
```

---

## Questions?

If you encounter issues:
1. Check the migration file is in: `supabase/migrations/20250101000009_fix_rbac_schema.sql`
2. Verify Supabase database is running
3. Ensure you're connected to the correct project
4. Check `.env` file has correct connection details