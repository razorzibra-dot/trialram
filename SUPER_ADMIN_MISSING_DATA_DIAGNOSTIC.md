# 🔍 Super Admin Dashboard - Missing Data Diagnostic

## Problem
Super Admin pages show "Access Denied" or no data loads - permission check fails before queries run.

## Root Cause
Permission check at line 89 of `SuperAdminDashboardPage.tsx`:
```typescript
if (!hasPermission('super_admin:crm:analytics:insight:view')) {
  return <Alert message="Access Denied" />;  // ← Queries blocked!
}
```

## Why It Fails

### Check 1: Is user role set to 'super_admin'?
**File**: `src/services/authService.ts` (line 373)
```typescript
role: appUser.role  // Must be 'super_admin' from database
```

**Fix**: The role MUST be 'super_admin' in the database users table.

---

## 🎯 Step-by-Step Diagnostic

### Step 1: Check Browser Console Logs
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for logs like:
   ```
   [hasPermission] User is super_admin, granting all permissions
   [getCurrentUser] User: { id: '...', email: '...', role: 'super_admin', ... }
   ```

**What you should see:**
- `role: 'super_admin'` ✅
- NOT `role: 'admin'` or `role: 'manager'` ❌

### Step 2: Check Database - User Record
**In Supabase SQL Editor:**
```sql
-- Find super admin users
SELECT id, email, name, role, is_super_admin, tenant_id 
FROM users 
WHERE is_super_admin = true;
```

**What you should see:**
```
| id        | email             | role        | is_super_admin | tenant_id |
|-----------|-------------------|-------------|----------------|-----------|
| user_123  | admin@platform... | super_admin | true           | NULL      |
```

**If it shows:**
- `role: 'admin'` instead of `'super_admin'` → ❌ **This is the bug!**
- `tenant_id: 'some_value'` instead of `NULL` → ❌ **This is the bug!**

### Step 3: Fix the User Role (if needed)
**In Supabase SQL Editor:**
```sql
-- Fix super admin user role and tenant
UPDATE users 
SET role = 'super_admin', 
    tenant_id = NULL,
    updated_at = NOW()
WHERE id = 'YOUR_SUPER_ADMIN_USER_ID';
```

---

## 💾 Full Permission Flow

```
Component renders
  ↓
Calls: hasPermission('super_admin:crm:analytics:insight:view')
  ↓
AuthContext calls: authService.hasPermission()
  ↓
authService.getCurrentUser() reads from localStorage
  ↓
Checks if user.role === 'super_admin'
  ↓
IF YES → returns true → queries run ✅
IF NO  → returns false → "Access Denied" shown ❌
```

---

## ✅ Solution Checklist

- [ ] **Database Check**: Super admin user has `role = 'super_admin'` and `tenant_id = NULL`
- [ ] **Permission Check**: Browser console shows `[hasPermission] User is super_admin, granting all permissions`
- [ ] **Migration Applied**: Migration `20250304_fix_super_admin_users_tenants_visibility.sql` was applied
- [ ] **Cache Cleared**: Clear browser cache (Ctrl+Shift+Delete) + full logout/login cycle
- [ ] **Verify**: Dashboard loads with data ✅

---

## 🔧 Alternative: Temporary Override (Testing Only)

If you just want to test, temporarily remove the permission check:

**File**: `src/modules/features/super-admin/views/SuperAdminDashboardPage.tsx` (line 88-100)

```typescript
// ⚠️ TEMPORARY TEST ONLY - Remove permission check
// Original code commented out:
// if (!hasPermission('super_admin:crm:analytics:insight:view')) {
//   return <Alert message="Access Denied" ... />
// }

// After testing, RESTORE the permission check!
```

This will let you see if the queries work (they should once migration is applied).

---

## 📋 Commands to Run

**Check the super admin user in database:**
```bash
# Run in Supabase SQL Editor
SELECT id, email, role, is_super_admin, tenant_id FROM users WHERE email = 'YOUR_EMAIL@...' LIMIT 1;
```

**See all super admins:**
```bash
SELECT id, email, role, tenant_id FROM users WHERE role = 'super_admin';
```

**Fix a super admin user:**
```bash
UPDATE users SET role = 'super_admin', tenant_id = NULL WHERE id = 'USER_ID';
```

---

## 🚀 Once Fixed

After fixing the database:
1. Clear browser cache
2. Sign out completely
3. Sign back in
4. Dashboard should show data ✅

---

## 🆘 Still Not Working?

Run this SQL to verify RLS policies exist:
```sql
SELECT tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%super%';
```

Should return policies like:
- `users_view_with_super_admin_access`
- `users_manage_with_super_admin_access`
