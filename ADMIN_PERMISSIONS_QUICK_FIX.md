# ✅ Admin Permissions Issue - Quick Fix Guide

## 🎯 Problem
Admin users cannot see Create/Edit/Delete buttons in the UI for modules like Customers, Sales, etc.

## 🔍 Root Cause
The `user_roles` table is empty → no role assignments exist in Supabase database

## 🚀 Quick Fix (5 minutes)

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. From your project root directory:
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# 2. Run the migration
supabase db push

# This will run all pending migrations, including the one that populates user_roles
```

### Option B: Manual SQL in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Copy the quick fix SQL:**

```sql
-- Quick Admin Fix
INSERT INTO public.roles (id, name, description, tenant_id, permissions, is_system_role, created_at, updated_at)
SELECT 
  'admin_' || t.id,
  'Administrator',
  'Tenant administrator',
  t.id,
  '["read", "write", "delete", "manage_customers", "manage_sales", "manage_tickets", "manage_complaints", "manage_contracts", "manage_service_contracts", "manage_products", "manage_product_sales", "manage_job_works", "manage_users", "manage_roles", "view_analytics", "manage_settings", "manage_companies"]'::jsonb,
  true,
  NOW(),
  NOW()
FROM (SELECT DISTINCT tenant_id as id FROM public.users WHERE role = 'admin') t
WHERE NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.name = 'Administrator' AND r.tenant_id = t.id);

INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  (SELECT r.id FROM public.roles r WHERE r.name = 'Administrator' AND r.tenant_id = u.tenant_id LIMIT 1),
  NOW()
FROM public.users u
WHERE u.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

SELECT 'User roles populated successfully!' as status;
```

3. **Click "Run" button**
4. **Verify:** Should see success message

### Option C: Using TypeScript/JavaScript

Create a file `scripts/fix-admin-permissions.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

async function fixAdminPermissions() {
  try {
    // 1. Get all unique tenants with admin users
    const { data: tenants, error: tenantError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('role', 'admin')
      .distinct();

    if (tenantError) throw tenantError;
    console.log(`Found ${tenants?.length || 0} tenants with admin users`);

    // 2. Create admin roles
    for (const tenant of tenants || []) {
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Administrator')
        .eq('tenant_id', tenant.tenant_id)
        .single();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('roles')
          .insert({
            name: 'Administrator',
            description: 'Tenant administrator with full permissions',
            tenant_id: tenant.tenant_id,
            permissions: [
              'read', 'write', 'delete',
              'manage_customers', 'manage_sales', 'manage_tickets',
              'manage_complaints', 'manage_contracts', 'manage_service_contracts',
              'manage_products', 'manage_product_sales', 'manage_job_works',
              'manage_users', 'manage_roles', 'view_analytics',
              'manage_settings', 'manage_companies'
            ],
            is_system_role: true
          });

        if (roleError) throw roleError;
        console.log(`✅ Created admin role for tenant: ${tenant.tenant_id}`);
      }
    }

    // 3. Assign roles to admin users
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('role', 'admin');

    if (usersError) throw usersError;

    for (const user of adminUsers || []) {
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Administrator')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (role) {
        const { error: assignError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role_id: role.id, assigned_at: new Date() })
          .select();

        if (assignError && !assignError.message.includes('duplicate')) {
          throw assignError;
        }
      }
    }

    console.log(`✅ Assigned roles to ${adminUsers?.length || 0} admin users`);
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
    process.exit(1);
  }
}

fixAdminPermissions();
```

Run with:
```bash
npx ts-node scripts/fix-admin-permissions.ts
```

## ✅ Verification Steps

### Step 1: Check Database
```sql
-- Verify admin roles exist
SELECT id, name, tenant_id FROM roles WHERE name = 'Administrator';

-- Verify user assignments
SELECT COUNT(*) as role_assignments FROM user_roles;

-- Verify admin users have roles
SELECT u.id, u.email, r.name 
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.role = 'admin';
```

### Step 2: Test in Browser
1. **Clear local storage:**
   ```javascript
   localStorage.clear()
   ```
2. **Logout completely** (if logged in)
3. **Close browser tab** and reopen
4. **Login again** with admin credentials
5. **Check Customers page** - Create button should appear

### Step 3: Verify Permission Checks
Open browser console (F12) and check logs:
```
[hasPermission] Checking permission "customers:update" for user role "admin". User permissions: ["read", "write", "delete", "manage_customers", ...]
[hasPermission] User has manage permission "manage_customers", granting access
```

## 🔧 If Still Not Working

### Check 1: User Role in Database
```sql
SELECT id, email, role FROM users WHERE id = '12345';
-- Should show: role = 'admin'
```

### Check 2: User Role in Browser
```javascript
// Open browser console (F12)
const user = JSON.parse(localStorage.getItem('crm_user'));
console.log('User role:', user.role);  // Should be 'admin'
```

### Check 3: Enable Debug Logging
Edit `.env`:
```
VITE_DEBUG_MODE=true
VITE_SHOW_API_LOGS=true
```
Restart dev server and check console for permission logs.

### Check 4: Component Code
For Customers page, verify the code uses:
```typescript
{hasPermission('customers:update') && <Edit button>}
{hasPermission('customers:delete') && <Delete button>}
```

### Check 5: Authentication Context
Verify AuthContext is properly providing `hasPermission`:
```javascript
const { hasPermission } = useAuth();
console.log('hasPermission function:', typeof hasPermission);  // Should be 'function'
```

## 📋 Checklist

- [ ] Ran migration or SQL script
- [ ] Verified `user_roles` table is populated
- [ ] Verified `roles` table has admin role
- [ ] Verified user.role = 'admin' in users table
- [ ] Cleared browser local storage
- [ ] Logged out and back in
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for permission logs
- [ ] Create/Edit/Delete buttons now visible

## 🆘 Still Need Help?

1. Check console logs for errors
2. Verify database has correct data
3. Check if using supabase backend (VITE_API_MODE=supabase in .env)
4. Try switching to mock mode temporarily: `VITE_API_MODE=mock`
5. If mock mode works but supabase doesn't, issue is in database setup

## 📝 What Was Changed

### Code Changes
- Enhanced `src/services/authService.ts` with better permission checking
- Improved logging for debugging
- Better role validation

### Database Changes
- Populated `roles` table with admin/manager/agent/engineer/customer roles
- Populated `user_roles` table with role assignments
- Ensured permissions array is properly formatted

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Testing