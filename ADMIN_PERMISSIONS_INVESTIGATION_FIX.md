# Admin User Permissions Issue - Investigation & Fix Guide

## Problem Statement
Admin users cannot see Create/Update/Delete action buttons in the UI for tenant modules even though they should have full permissions.

## Root Cause
The `user_roles` table in Supabase is **empty**, meaning NO role assignments exist for any users. The permission system is falling back to hardcoded role→permissions mappings, which should work BUT there may be issues with:

1. Admin user's `role` field not being set correctly in the `users` table
2. Permission checking logic not properly mapping resource:action format to base permissions
3. Missing role data in the `roles` table

## Investigation Steps

### Step 1: Check Current User's Role
```sql
-- Query your admin user
SELECT id, email, role, tenant_id FROM users WHERE email = 'admin@techcorp.com' LIMIT 1;

-- Expected output:
-- id | email              | role  | tenant_id
-- ---|-------------------|-------|----------
-- 1  | admin@techcorp.com| admin | techcorp
```

### Step 2: Check If Roles Exist
```sql
-- Check if any roles are defined
SELECT id, name, tenant_id, permissions FROM roles WHERE tenant_id = 'techcorp' LIMIT 5;

-- Should show at least 'admin' role
```

### Step 3: Check User-Role Mappings
```sql
-- Check if user has any role assignments
SELECT ur.user_id, ur.role_id, r.name 
FROM user_roles ur 
JOIN roles r ON r.id = ur.role_id 
WHERE ur.user_id = '12345' -- admin user ID
LIMIT 10;

-- If empty, this is the problem!
```

### Step 4: Check Current Admin User's Permissions (from browser console)
1. Open browser developer tools (F12)
2. Go to Application → Local Storage
3. Find `crm_user` key
4. Check if `role` field is set to 'admin'
5. Open Console and run:
   ```javascript
   const user = JSON.parse(localStorage.getItem('crm_user'));
   console.log('User role:', user.role);
   console.log('User tenantId:', user.tenantId);
   ```

## Permanent Fix: Populate user_roles Table

The correct solution is to create role assignments for all admin users. Here are the steps:

### Step 1: Ensure Admin Role Exists
```sql
-- Check if admin role exists for your tenant
SELECT * FROM roles WHERE name = 'Administrator' AND tenant_id = 'techcorp';

-- If it doesn't exist, create it:
INSERT INTO roles (id, name, description, tenant_id, permissions, is_system_role, created_at, updated_at)
VALUES (
  'admin_role_techcorp',
  'Administrator',
  'Tenant administrator with full permissions',
  'techcorp',
  '["read", "write", "delete", "manage_customers", "manage_sales", "manage_tickets", "manage_complaints", "manage_contracts", "manage_service_contracts", "manage_products", "manage_product_sales", "manage_job_works", "manage_users", "manage_roles", "view_analytics", "manage_settings", "manage_companies"]'::jsonb,
  true,
  NOW(),
  NOW()
);
```

### Step 2: Assign Admin Role to All Admin Users
```sql
-- Get all admin users
SELECT id, email FROM users WHERE role = 'admin' AND tenant_id = 'techcorp';

-- Then assign the admin role to each user:
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  'admin_role_techcorp',
  NOW()
FROM users u
WHERE u.role = 'admin' 
  AND u.tenant_id = 'techcorp'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = u.id 
    AND role_id = 'admin_role_techcorp'
  );
```

### Step 3: Verify Assignment
```sql
-- Verify the assignments were created
SELECT u.id, u.email, r.name, ur.assigned_at
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.tenant_id = 'techcorp' AND u.role = 'admin';
```

## Quick Fix SQL (All-in-One)

```sql
-- Run this entire script in Supabase SQL editor

-- Step 1: Ensure all required roles exist
INSERT INTO roles (id, name, description, tenant_id, permissions, is_system_role, created_at, updated_at)
SELECT 
  'admin_role_' || t.id,
  'Administrator',
  'Tenant administrator with full permissions',
  t.id,
  '["read", "write", "delete", "manage_customers", "manage_sales", "manage_tickets", "manage_complaints", "manage_contracts", "manage_service_contracts", "manage_products", "manage_product_sales", "manage_job_works", "manage_users", "manage_roles", "view_analytics", "manage_settings", "manage_companies"]'::jsonb,
  true,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT tenant_id as id FROM users WHERE role = 'admin'
) t
WHERE NOT EXISTS (
  SELECT 1 FROM roles r 
  WHERE r.name = 'Administrator' 
  AND r.tenant_id = t.id
);

-- Step 2: Assign admin role to all admin users
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  COALESCE(
    (SELECT id FROM roles WHERE name = 'Administrator' AND tenant_id = u.tenant_id LIMIT 1),
    'admin_role_' || u.tenant_id
  ),
  NOW()
FROM users u
WHERE u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id
  );

-- Step 3: Verify
SELECT COUNT(*) as total_assignments FROM user_roles;
SELECT u.id, u.email, r.name as role_name 
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
LIMIT 10;
```

## Alternative: Use Mock Backend for Testing

If the issue persists after fixing the database, you can temporarily switch to mock mode to test:

1. Edit `.env` and set `VITE_API_MODE=mock`
2. Restart the dev server
3. Login again
4. Admin should now see all actions

This will help determine if the issue is:
- **Database/Supabase related** (if mock works but Supabase doesn't)
- **Application code related** (if mock also fails)

## Code Changes Made

Updated `src/services/authService.ts`:
- Enhanced `hasPermission()` with better logging
- Added validation for user role
- Better handling of permission string parsing
- Improved error messages for debugging

## Testing the Fix

1. **Browser Console Check** (F12):
   ```javascript
   // Check what permissions the admin has
   const user = JSON.parse(localStorage.getItem('crm_user'));
   
   // This should log admin's permissions
   console.log('User role:', user.role);
   
   // In the Network tab, check API responses
   // Look for roles/permissions endpoints
   ```

2. **Expected Results**:
   - Create button should appear
   - Edit buttons should appear
   - Delete buttons should appear
   - All CRUD actions should be available

3. **If Still Not Working**:
   - Check browser console for permission check logs
   - Look for: `[hasPermission] Checking permission...`
   - Verify the user's role is 'admin'
   - Check if admin role exists in roles table

## Next Steps

1. Run the SQL fix script above in Supabase SQL editor
2. Clear browser local storage: `localStorage.clear()`
3. Logout and login again
4. Refresh the page (hard refresh: Ctrl+Shift+R)
5. Check if Create/Edit/Delete buttons now appear

## Debug Script for Browser Console

Paste this in your browser console (F12) to debug:

```javascript
// Check current user permissions
const user = JSON.parse(localStorage.getItem('crm_user'));
const authService = window.authService || {}; // If exposed

console.group('👤 User Info');
console.log('ID:', user.id);
console.log('Email:', user.email);
console.log('Role:', user.role);
console.log('Tenant:', user.tenantId);
console.groupEnd();

// Simulate permission checks
console.group('🔐 Permission Checks');
console.log('Role in system:', user.role);
console.log('Should have admin permissions:', user.role === 'admin');
console.groupEnd();

// Check what should be visible
console.group('👁️ Expected Visibility');
console.log('Create button (write permission):', user.role === 'admin');
console.log('Edit button (update/write permission):', user.role === 'admin');
console.log('Delete button (delete permission):', user.role === 'admin');
console.groupEnd();
```

## Support

If you still encounter issues:
1. Check the browser console (F12) → Console tab
2. Look for `[hasPermission]` logs
3. Check the Network tab for any API errors
4. Verify user_roles table is populated
5. Ensure user.role = 'admin' in the users table