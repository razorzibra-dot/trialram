# Super Admin Dashboard - Supabase 400 Error Fix Guide

## Problem Summary

The super-admin dashboard UI renders but shows **"Error loading super users"** with multiple 400 Bad Request errors when querying:
- `super_user_tenant_access`
- `super_user_impersonation_logs`

### Root Cause

The RLS (Row-Level Security) policies on these tables contained **nested subqueries that violated the users table's own RLS policies**.

**Original problematic policy:**
```sql
CREATE POLICY "super_user_tenant_access_select" ON super_user_tenant_access 
FOR SELECT USING (
    super_user_id = auth.uid() OR
    auth.uid() IN (
        SELECT id FROM users WHERE is_super_admin = true  -- ❌ VIOLATES USERS TABLE RLS
    )
);
```

**Why it failed:**
- The users table has RLS that restricts queries to only rows in the current user's tenant
- The subquery tried to read ALL users with `is_super_admin = true` across ALL tenants
- This violated the users table's RLS, causing a 400 error

## Solution

Replace nested `IN (SELECT ...)` subqueries with `EXISTS` checks that directly verify the current user's status:

**Fixed policy:**
```sql
CREATE POLICY "super_user_tenant_access_select" ON super_user_tenant_access 
FOR SELECT USING (
    super_user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()  -- ✅ Only check current user
        AND users.is_super_admin = true
        AND users.deleted_at IS NULL
    )
);
```

## Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Run this migration:**
   - Open the file: `supabase/migrations/20250222_fix_super_user_rls_policies.sql`
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **"Run"** button

3. **Verify the fix:**
   - Go back to your application
   - Log in as super admin
   - Navigate to `/super-admin/dashboard`
   - Data should now load correctly ✅

### Option 2: Using Supabase CLI

```bash
# Navigate to project root
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Apply the migration
supabase db push
```

### Option 3: Manual Fix (If migrations aren't running automatically)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run these commands in order:

```sql
-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "super_user_tenant_access_select" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_insert" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_update" ON super_user_tenant_access;
DROP POLICY IF EXISTS "super_user_tenant_access_delete" ON super_user_tenant_access;

DROP POLICY IF EXISTS "super_user_impersonation_logs_select" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_insert" ON super_user_impersonation_logs;
DROP POLICY IF EXISTS "super_user_impersonation_logs_update" ON super_user_impersonation_logs;

DROP POLICY IF EXISTS "tenant_statistics_select" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_insert" ON tenant_statistics;
DROP POLICY IF EXISTS "tenant_statistics_update" ON tenant_statistics;

DROP POLICY IF EXISTS "tenant_config_overrides_select" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_insert" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_update" ON tenant_config_overrides;
DROP POLICY IF EXISTS "tenant_config_overrides_delete" ON tenant_config_overrides;

-- 2. Create fixed policies (copy from 20250222_fix_super_user_rls_policies.sql)
-- ... paste the CREATE POLICY statements from the migration file
```

## After Applying the Fix

### Test the Dashboard
1. **Navigate to:** `http://localhost:5173/super-admin/dashboard`
2. **Should see:**
   - Dashboard loads without errors
   - "Error loading super users" message is gone
   - Statistics and data display properly
   - All hooks work: `useSuperUserManagement()`, `useSystemHealth()`, `useImpersonation()`, `useTenantMetrics()`

### Check Supabase Logs
In Supabase Dashboard → Logs:
```
✅ No more "unauthorized" or 400 errors
✅ Queries return data successfully
```

## Technical Details: What Changed

### Affected Tables & Policies

| Table | Policies Fixed | Issue |
|-------|--|--|
| `super_user_tenant_access` | SELECT, INSERT, UPDATE, DELETE | Nested subquery violated RLS |
| `super_user_impersonation_logs` | SELECT, INSERT, UPDATE | Nested subquery violated RLS |
| `tenant_statistics` | SELECT, INSERT, UPDATE | Nested subquery violated RLS |
| `tenant_config_overrides` | SELECT, INSERT, UPDATE, DELETE | Nested subquery violated RLS |

### Key Pattern Used

**Before (❌ Fails):**
```sql
auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true)
```

**After (✅ Works):**
```sql
EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
)
```

## Rollback (If Needed)

If you need to rollback:
```sql
-- Delete the new migration
-- Restore from supabase/migrations/20250214_add_super_user_rls_policies.sql
```

## Related Files

- **Migration:** `supabase/migrations/20250222_fix_super_user_rls_policies.sql`
- **Dashboard Component:** `src/modules/features/super-admin/views/SuperAdminDashboardPage.tsx`
- **Service Layer:** `src/services/api/supabase/superUserService.ts`
- **Repository Info:** `.zencoder/rules/repo.md`

## Support

If issues persist after applying this fix:

1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Check auth.uid()** - Verify super admin user is authenticated correctly
3. **Check logs** - Go to Supabase Dashboard → Logs to see actual error messages
4. **Verify is_super_admin flag** - Run: `SELECT id, email, is_super_admin FROM users WHERE email = 'superuser1@platform.admin'`

---

**Last Updated:** 2025-02-22
**Status:** ✅ READY TO APPLY