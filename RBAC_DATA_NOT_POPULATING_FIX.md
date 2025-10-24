# RBAC Data Not Populating - Root Cause & Fix Guide

## Problem Description

**Symptom**: Role and Permission data exists in Supabase database but doesn't display on the UI. No console errors are visible.

**Pages Affected**:
- Role Management Page (`/user-management/roles`)
- Permission Matrix Page (`/user-management/permission-matrix`)

**What's Happening**: 
- `rbacService.getRoles()` returns empty array
- `rbacService.getPermissions()` returns empty array  
- `rbacService.getRoleTemplates()` returns empty array
- No API errors in Network tab

---

## Root Cause Analysis

### The Issue: Row-Level Security Without Policies = Deny All

**What happened:**
1. Migration `20250101000007_row_level_security.sql` **enabled RLS** on `permissions`, `roles`, and `user_roles` tables
2. **BUT** no READ policies were defined for these tables
3. When RLS is enabled **without any policies**, Supabase **denies ALL queries by default**
4. The queries silently return empty result sets instead of errors

### Code Evidence

**In RLS Migration (20250101000007):**
```sql
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
-- ... but NO CREATE POLICY statements for these tables!
```

**Missing policies that would have prevented this:**
```sql
-- This was missing for permissions table:
CREATE POLICY "users_view_all_permissions" ON permissions FOR SELECT ...

-- This was missing for roles table:
CREATE POLICY "users_view_tenant_roles" ON roles FOR SELECT ...

-- This was missing for user_roles table:
CREATE POLICY "users_view_tenant_user_roles" ON user_roles FOR SELECT ...
```

### Why the UI Shows Nothing

The RBAC components call:
```typescript
const [rolesData, permissionsData, templatesData] = await Promise.all([
  rbacService.getRoles(),           // Returns: []
  rbacService.getPermissions(),     // Returns: []  (or default fallback)
  rbacService.getRoleTemplates()    // Returns: []
]);
```

Since all queries return empty, the UI renders empty tables with no error messages.

---

## The Fix

### Solution Overview

**New Migration**: `20250101000010_add_rbac_rls_policies.sql`

This migration adds the missing RLS policies for:
1. **Permissions table** - System-wide policies allowing authenticated users to read
2. **Roles table** - Tenant-specific policies with admin management rights
3. **User_roles table** - Assignment policies for admins
4. **Role_templates table** - Default templates accessible to all users

### How to Apply the Fix

#### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Push the new migration to your database
supabase db push

# You should see output like:
# Applying migration 20250101000010_add_rbac_rls_policies.sql...
# ✓ Done
```

#### Option 2: Manual SQL Execution

1. Open **Supabase Dashboard** → SQL Editor
2. Create a new query
3. Copy entire content from `supabase/migrations/20250101000010_add_rbac_rls_policies.sql`
4. Paste into SQL Editor
5. Click "Run" button
6. Wait for confirmation: ✓ Success

#### Option 3: Docker Compose

If using local Supabase with Docker:

```bash
# Ensure Supabase is running
docker-compose -f docker-compose.local.yml up -d

# Apply migrations
supabase db push
```

---

## What Each Policy Does

### Permissions Policies
```sql
-- ANYONE can READ all permissions (system-wide resource)
CREATE POLICY "users_view_all_permissions" ON permissions FOR SELECT
USING (authenticated user exists)

-- ONLY ADMINS can CREATE/UPDATE permissions
CREATE POLICY "admins_create_permissions" ON permissions FOR INSERT
WITH CHECK (user is admin or super_admin)
```

**Why**: Permissions are global system resources, not tenant-specific. All authenticated users need to see them to understand what permissions exist.

### Roles Policies
```sql
-- Users READ only their tenant's roles
-- Super admin READS all roles
CREATE POLICY "users_view_tenant_roles" ON roles FOR SELECT
USING (role.tenant_id = user.tenant_id OR user is super_admin)

-- Tenant admins MANAGE roles (except system roles)
CREATE POLICY "admins_create_roles" ON roles FOR INSERT
WITH CHECK (user is admin in same tenant)

CREATE POLICY "admins_update_roles" ON roles FOR UPDATE
USING (user is admin in same tenant AND NOT is_system_role)

CREATE POLICY "admins_delete_roles" ON roles FOR DELETE
USING (user is admin in same tenant AND NOT is_system_role)
```

**Why**: Multi-tenant isolation - users should only see roles for their tenant. System roles cannot be modified.

### User Roles Policies
```sql
-- Users READ their own assignments
-- Admins READ tenant assignments
CREATE POLICY "users_view_tenant_user_roles" ON user_roles FOR SELECT
USING (
  user_roles.tenant_id = user.tenant_id 
  OR user_roles.user_id = auth.uid() 
  OR user is super_admin
)

-- Admins ASSIGN/REMOVE roles in their tenant
CREATE POLICY "admins_assign_roles" ON user_roles FOR INSERT
WITH CHECK (user is admin in same tenant)

CREATE POLICY "admins_remove_roles" ON user_roles FOR DELETE
USING (user is admin in same tenant)
```

**Why**: Users should only see their own role assignments. Admins can manage assignments within their tenant.

### Role Templates Policies
```sql
-- Users READ default templates (system) and tenant templates
CREATE POLICY "users_view_role_templates" ON role_templates FOR SELECT
USING (is_default = TRUE OR tenant_id IS NULL OR tenant_id = user.tenant_id)

-- Admins CREATE templates in their tenant
-- Super admins only DELETE templates
```

**Why**: Provides a library of role templates for quick role creation. Default templates are available to all.

---

## Testing the Fix

### After Applying Migration:

1. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete (Chrome/Firefox/Edge)
   ```

2. **Reload Page**
   ```
   F5 or Cmd+Shift+R (hard refresh)
   ```

3. **Test Role Management**
   - Navigate to: `http://localhost:5173/user-management/roles`
   - Should see roles list populated
   - Should see permissions in the permission selector

4. **Test Permission Matrix**
   - Navigate to: `http://localhost:5173/user-management/permission-matrix`
   - Should see roles and permissions in a matrix grid

5. **Check Browser Console**
   - Open DevTools: F12
   - Look for any errors in Console tab
   - Should be clean

6. **Check Network Tab**
   - Filter by "permissions" or "roles"
   - Verify requests return data (not empty arrays)
   - Look for 200 status codes (not 400/403/404)

### Verification Query (in Supabase SQL Editor)

```sql
-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('permissions', 'roles', 'user_roles', 'role_templates')
ORDER BY tablename, policyname;

-- You should see output like:
-- public | permissions | users_view_all_permissions
-- public | permissions | admins_create_permissions
-- public | permissions | admins_update_permissions
-- public | roles | users_view_tenant_roles
-- public | roles | admins_create_roles
-- public | roles | admins_update_roles
-- public | roles | admins_delete_roles
-- ...and more
```

---

## Column Naming Note

⚠️ **Important**: This is a SEPARATE issue from the User Service column naming we fixed earlier.

The column naming convention mismatch (camelCase vs snake_case) does NOT affect RBAC tables because:
- `permissions` table: `id`, `name`, `category` (snake_case matches TypeScript)
- `roles` table: `id`, `name`, `is_system_role` (already correct)
- `user_roles` table: `user_id`, `role_id` (snake_case matches)

---

## Troubleshooting

### Still seeing empty data after applying migration?

**1. Clear Browser Cache Completely**
```bash
# Close browser entirely
# Delete browser cache for localhost
# Restart browser
```

**2. Verify Migration Was Applied**
```bash
# In Supabase CLI
supabase db status

# Should show 20250101000010 as applied
```

**3. Check Supabase Studio**
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run: `SELECT * FROM auth.schema_migrations WHERE description LIKE '%rbac%';`
4. Verify 20250101000010 appears in results

**4. Test Query Directly**
```sql
-- In Supabase SQL Editor, run as authenticated user:
SELECT * FROM permissions LIMIT 5;
SELECT * FROM roles LIMIT 5;
SELECT * FROM role_templates LIMIT 5;

-- Should return data, not empty results
```

**5. Check User Authentication**
```typescript
// In browser console:
import { authService } from '@/services/authService';
const user = authService.getCurrentUser();
console.log(user); // Should have id, role, tenant_id, etc.
```

**If user is NULL**: Authentication issue, not RLS issue

### API Error Messages?

**`ERROR: operation violates RLS policy`**
→ Policies exist but user doesn't have permission
→ Check user role and tenant_id in auth token

**`column "category" does not exist`**
→ Run the earlier fix migration (20250101000009) first
→ This adds missing columns to permissions table

**`relation "role_templates" does not exist`**
→ Run fix migration (20250101000009) to create the table

---

## Prevention: What We Learned

**Key Takeaway**: When you `ENABLE ROW LEVEL SECURITY` on a table, you MUST immediately create at least one read policy, otherwise all queries fail silently.

### For Future Supabase Tables:

```sql
-- WRONG - RLS enabled but no policies = all queries denied
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
-- Application breaks silently

-- CORRECT - Enable RLS with read policy
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read" ON my_table
  FOR SELECT
  USING (some_condition);
```

---

## Summary

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| No roles/permissions on UI | RLS enabled without read policies | Add migration 20250101000010 |
| Silent data failure | Default deny-all behavior | Create read policies for each table |
| Multi-tenant isolation | No tenant checks in policies | Add tenant_id checks to policies |
| System role protection | No system role checks | Prevent deletion of system roles |

---

## Files Modified/Created

- ✅ **Created**: `supabase/migrations/20250101000010_add_rbac_rls_policies.sql` - Missing RLS policies
- 📄 **Created**: `RBAC_DATA_NOT_POPULATING_FIX.md` - This guide

---

## Next Steps

1. **Apply the migration**:
   ```bash
   supabase db push
   ```

2. **Clear browser cache and reload**

3. **Test the pages**:
   - Role Management Page
   - Permission Matrix Page

4. **Verify data displays correctly**

5. **Check DevTools Network tab** to see data is being returned

---

## Need Help?

**Check these in order:**

1. ✅ Run: `supabase db status` - confirm migration applied
2. ✅ Check Supabase Studio - verify data exists in tables
3. ✅ Test SQL query directly in Supabase Editor
4. ✅ Verify user is authenticated (check browser console)
5. ✅ Hard refresh browser (Ctrl+Shift+R)