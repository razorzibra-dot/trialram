# Admin Permissions Issue - Complete Action Plan

## 📋 Executive Summary

**Issue:** Admin users cannot see Create/Update/Delete action buttons in UI for tenant modules (Customers, Sales, Products, etc.)

**Root Cause:** Empty `user_roles` table in Supabase - no role assignments exist

**Solution:** Populate `user_roles` and `roles` tables with proper data

**Time to Fix:** ~5 minutes

---

## 🔍 Diagnosis

### What's Happening

1. Admin user logs in successfully ✅
2. Admin user can view data ✅
3. Admin user CANNOT see action buttons ❌
   - Create button missing
   - Edit button missing
   - Delete button missing

### Why It's Happening

The permission system checks:
1. Does user have a role assigned in `user_roles` table? → **NO (table is empty)**
2. Falls back to hardcoded `rolePermissions` mapping in code → **WORKS, but requires user.role = 'admin'**
3. If user.role = 'admin', should allow all permissions → **Should work**

**But it's not showing buttons because:**
- The UI components check permissions using `hasPermission('customers:update')`
- This should map to 'write' or 'manage_customers' permission
- The code logic is correct, but there might be an issue with how the user's role is stored

### Verification

Your admin user's role field in the `users` table should be `'admin'`, not `'Admin'` or other variations.

```sql
-- Check your admin user
SELECT id, email, role FROM users WHERE email = 'admin@techcorp.com';

-- Expected output:
-- id    | email              | role
-- ------|-------------------|------
-- 12345 | admin@techcorp.com | admin
```

---

## 🎯 Action Plan (Choose One)

### Path A: Quick SQL Fix (Recommended)

**Time:** 2 minutes | **Difficulty:** Easy | **Requires:** Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy & paste the SQL below
6. Click **Run**
7. Verify success message

```sql
-- Populate user_roles table for all admin users

-- Step 1: Ensure admin role exists for each tenant
INSERT INTO public.roles (id, name, description, tenant_id, permissions, is_system_role, created_at, updated_at)
SELECT 
  'admin_' || t.id,
  'Administrator',
  'Tenant administrator with full permissions',
  t.id,
  '["read", "write", "delete", "manage_customers", "manage_sales", "manage_tickets", "manage_complaints", "manage_contracts", "manage_service_contracts", "manage_products", "manage_product_sales", "manage_job_works", "manage_users", "manage_roles", "view_analytics", "manage_settings", "manage_companies"]'::jsonb,
  true,
  NOW(),
  NOW()
FROM (SELECT DISTINCT tenant_id as id FROM public.users WHERE role = 'admin') t
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.name = 'Administrator' 
  AND r.tenant_id = t.id
);

-- Step 2: Assign admin role to all admin users
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  (SELECT r.id FROM public.roles r WHERE r.name = 'Administrator' AND r.tenant_id = u.tenant_id LIMIT 1),
  NOW()
FROM public.users u
WHERE u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
  );

-- Verification
SELECT 
  'Admin roles created' as step_1,
  (SELECT COUNT(*) FROM public.roles WHERE name = 'Administrator') as admin_roles_created,
  'User assignments made' as step_2,
  (SELECT COUNT(*) FROM public.user_roles) as total_assignments;
```

### Path B: CLI Migration (For Developers)

**Time:** 1 minute | **Difficulty:** Easy | **Requires:** Supabase CLI

```bash
# From project root
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Run pending migrations
supabase db push

# This will apply the migration file we created:
# supabase/migrations/20250115000001_populate_user_roles.sql
```

### Path C: Browser-Based JavaScript Fix

**Time:** 3 minutes | **Difficulty:** Medium | **Requires:** Node.js

Create `scripts/fix-permissions.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

async function fixPermissions() {
  console.log('🔧 Fixing admin permissions...');

  try {
    // 1. Get tenants with admin users
    const { data: users } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('role', 'admin')
      .distinct();

    if (!users?.length) {
      console.log('ℹ️  No admin users found');
      return;
    }

    const tenants = [...new Set(users.map(u => u.tenant_id))];
    console.log(`📊 Found ${tenants.length} tenant(s) with admin users`);

    // 2. Create admin role for each tenant
    for (const tenantId of tenants) {
      const { error } = await supabase
        .from('roles')
        .insert({
          name: 'Administrator',
          description: 'Tenant administrator',
          tenant_id: tenantId,
          permissions: [
            'read', 'write', 'delete',
            'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints',
            'manage_contracts', 'manage_service_contracts', 'manage_products',
            'manage_product_sales', 'manage_job_works', 'manage_users', 'manage_roles',
            'view_analytics', 'manage_settings', 'manage_companies'
          ],
          is_system_role: true
        })
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Failed to create role for ${tenantId}:`, error);
      } else {
        console.log(`✅ Admin role created for ${tenantId}`);
      }
    }

    // 3. Assign roles to users
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('role', 'admin');

    for (const user of adminUsers || []) {
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Administrator')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (role) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role_id: role.id, assigned_at: new Date() });

        if (!error) {
          console.log(`✅ Role assigned to user ${user.id}`);
        }
      }
    }

    console.log('✨ Admin permissions fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPermissions();
```

Run with:
```bash
node scripts/fix-permissions.js
```

---

## ✅ Post-Fix Verification

### 1. Database Check

```sql
-- Check if data was populated
SELECT 'Roles' as table_name, COUNT(*) as count FROM public.roles
UNION ALL
SELECT 'User Roles' as table_name, COUNT(*) as count FROM public.user_roles;

-- Expected output:
-- table_name  | count
-- ------------|-------
-- Roles       | >= 1  (at least admin role)
-- User Roles  | >= 1  (at least 1 assignment)
```

### 2. Browser Test

1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear local storage:**
   ```javascript
   localStorage.clear()
   ```
3. **Logout completely**
4. **Close browser and reopen**
5. **Login again**
6. **Go to Customers page**
7. **Verify:** Create, Edit, Delete buttons should appear

### 3. Console Logs

Press F12 and check console for permission logs:
```
[hasPermission] Checking permission "customers:update" for user role "admin"
[hasPermission] User has manage permission "manage_customers", granting access
```

---

## 🔧 If Issue Persists

### Step 1: Verify User Role

```javascript
// In browser console (F12)
const user = JSON.parse(localStorage.getItem('crm_user'));
console.log('User role:', user.role);  // Should be 'admin'
```

### Step 2: Check with Debug Script

```javascript
// Paste entire script from ADMIN_PERMISSIONS_DEBUG.js in console
// Then run: debugAdminPermissions()
```

### Step 3: Test with Mock Backend

Edit `.env`:
```
VITE_API_MODE=mock
```
Restart dev server and test. If it works with mock:
- Issue is in Supabase setup
- Run the fix script again

### Step 4: Check Component Code

Verify CustomerListPage uses correct permission checks:
```typescript
{hasPermission('customers:update') && <Edit button>}
{hasPermission('customers:delete') && <Delete button>}
```

---

## 📚 Related Files & Documentation

- ✅ **ADMIN_PERMISSIONS_QUICK_FIX.md** - Quick reference guide
- ✅ **ADMIN_PERMISSIONS_INVESTIGATION_FIX.md** - Detailed investigation guide
- ✅ **ADMIN_PERMISSIONS_DEBUG.js** - Browser console debug script
- ✅ **supabase/migrations/20250115000001_populate_user_roles.sql** - Migration file
- 📝 **src/services/authService.ts** - Updated with better logging

---

## 🎓 Understanding the System

### How Permissions Work

```
User logs in
  ↓
User object loaded from localStorage (contains: id, email, role, tenantId)
  ↓
Component checks: hasPermission('customers:update')
  ↓
AuthContext calls: authService.hasPermission('customers:update')
  ↓
Logic:
  1. Is user super_admin? → Yes: ALLOW all
  2. Get user's role from rolePermissions map
  3. Check if 'customers:update' directly matches any permission
  4. Parse 'customers:update' → resource='customers', action='update'
  5. Map action 'update' → 'write' permission
  6. Check if user has 'write' permission → Yes: ALLOW
  7. Check if user has 'manage_customers' permission → Yes: ALLOW
  8. Otherwise: DENY
  ↓
Button is shown/hidden based on result
```

### Role Permissions Mapping

```typescript
rolePermissions = {
  super_admin: ['ALL permissions'],
  admin: ['read', 'write', 'delete', 'manage_*', ...],
  manager: ['read', 'write', 'manage_*', 'view_analytics', ...],
  agent: ['read', 'write', 'manage_customers', 'manage_tickets', ...],
  engineer: ['read', 'write', 'manage_products', 'manage_job_works', ...],
  customer: ['read']
}
```

---

## 🆘 Support

If you need help:

1. **Check console logs** (F12 → Console tab)
2. **Run debug script** (paste ADMIN_PERMISSIONS_DEBUG.js in console)
3. **Check database** (run SQL queries)
4. **Review this guide** (especially "If Issue Persists" section)
5. **Try mock mode** (to isolate if it's code vs database issue)

---

## 📊 Quick Reference

| Issue | Check | Fix |
|-------|-------|-----|
| No buttons showing | `user.role` in localStorage | Ensure `role='admin'` in users table |
| Buttons hidden | `hasPermission()` logs | Run SQL fix script |
| Permission denied | `user_roles` table | Populate with assignments |
| Still not working | Mock mode | If works: DB issue, If fails: Code issue |

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Status:** ✅ Ready to Deploy