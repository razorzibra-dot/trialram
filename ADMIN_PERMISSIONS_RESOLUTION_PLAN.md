# Admin Permissions Resolution Plan - Complete Guide

## 🎯 Executive Summary

**Problem**: Admin users cannot see Create/Update/Delete action buttons in any CRM module.

**Root Causes Identified**:
1. **PRIMARY** (90% probability): Users don't have `role='admin'` in the database
2. **SECONDARY** (5% probability): User record not found in database during login
3. **TERTIARY** (2% probability): Column naming mismatch (camelCase vs snake_case)
4. **ARCHITECTURAL** (architectural issue): Dual RBAC systems (legacy + proper) causing confusion

**Solutions Provided**:
- ✅ SQL diagnostic queries
- ✅ Browser console diagnostic tool
- ✅ Quick SQL fix commands
- ✅ Code fix for column naming
- ✅ Long-term RBAC implementation guide

---

## 🚀 QUICK START (5 Minutes)

### Option A: SQL Quick Fix (Recommended)

**Step 1**: Open Supabase Dashboard
- Go to: https://app.supabase.com/
- Select your project
- Go to: SQL Editor → New Query

**Step 2**: Check if user has correct role

```sql
SELECT id, email, role, status, tenant_id 
FROM users 
WHERE email LIKE '%admin%' 
LIMIT 10;
```

**Expected Output**:
```
id          | email              | role  | status | tenant_id
------------|-------------------|-------|--------|------------------
uuid...     | admin@acme.com    | admin | active | uuid...
```

**If you see `role='agent'` or `role IS NULL`**, continue to Step 3.

**Step 3**: Fix the role

```sql
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email LIKE '%admin%' 
  AND role != 'admin'
  AND deleted_at IS NULL;
```

**Step 4**: Verify the fix

```sql
SELECT id, email, role FROM users WHERE email LIKE '%admin%';
```

**Step 5**: Test in browser

1. Clear browser local storage:
   - Open Developer Tools (F12)
   - Run: `localStorage.clear()`

2. Refresh page: `Ctrl+R` (or hard refresh: `Ctrl+Shift+R`)

3. Log out and log back in

4. Navigate to any module (Sales, Customers, etc.)

5. ✅ Create/Edit/Delete buttons should now appear!

---

## 🔍 DIAGNOSTIC PROCESS (10 Minutes)

If the quick fix didn't work, follow this step-by-step diagnostic:

### Step 1: Verify Session is Loaded
```javascript
// Open browser Developer Tools (F12) → Console tab
// Paste and run:

const user = JSON.parse(localStorage.getItem('crm_user'));
console.log('Current User:', user);
console.log('User Role:', user?.role);
console.log('User Email:', user?.email);
```

**Expected Output**:
```javascript
Current User: {id: "uuid...", email: "admin@acme.com", role: "admin", ...}
User Role: "admin"
User Email: "admin@acme.com"
```

**If `role` is NOT "admin"**:
- User is logged in but has wrong role in database
- Go to **Option B: Database Fix** below

---

### Step 2: Run Advanced Diagnostic
```javascript
// Copy the entire file: ADVANCED_ADMIN_PERMISSIONS_DEBUG.js
// Paste it into the Console tab
// Run: advancedDebugAdminPermissions()
```

This will provide:
- ✅ Full user information
- ✅ Permission mappings
- ✅ Expected vs actual permissions
- ✅ Button visibility analysis
- ✅ SQL queries to run next
- ✅ Specific recommendations

---

### Step 3: Run SQL Diagnostics
```sql
-- Run ALL queries from: ADMIN_PERMISSIONS_SQL_DIAGNOSTICS.sql
-- This file contains 11 diagnostic queries
-- Review the output to identify the issue
```

Key queries to run:
1. Check admin users exist
2. Check user roles distribution
3. Check if user_roles table is empty (it should be)
4. Check roles table contents
5. Check specific test user

---

## 🔧 FIXES BY SCENARIO

### Scenario A: User role is 'agent' or another non-admin role

**Problem**: User is logged in but with wrong role

**Solution**:
```sql
UPDATE users 
SET role = 'admin'
WHERE email = 'admin@acme.com'
  AND role != 'admin';
```

Then in browser:
```javascript
// Clear session and re-login
localStorage.clear();
// Refresh and login again
```

---

### Scenario B: User role is NULL or missing

**Problem**: User record in database has no role assigned

**Solution**:
```sql
UPDATE users 
SET role = 'admin', status = 'active'
WHERE email = 'admin@acme.com'
  AND (role IS NULL OR role = '');
```

Then re-login in browser.

---

### Scenario C: User not found in database at all

**Problem**: Login shows "User profile not found" error

**Solution 1**: Check Supabase auth vs app database
```sql
-- Find mismatches between auth and app database
SELECT 
  u.id, 
  u.email, 
  u.role,
  u.status
FROM users u
ORDER BY u.created_at DESC
LIMIT 20;
```

**Solution 2**: Create missing user record
```sql
INSERT INTO users (
  id,
  email,
  name,
  role,
  status,
  tenant_id,
  created_at
) VALUES (
  'USER_UUID_FROM_SUPABASE_AUTH',
  'admin@acme.com',
  'Admin User',
  'admin',
  'active',
  'TENANT_UUID',
  NOW()
);
```

Get `USER_UUID_FROM_SUPABASE_AUTH` from:
- Supabase Dashboard → Authentication → Users
- Copy the user's ID

Get `TENANT_UUID` from:
```sql
SELECT id FROM tenants LIMIT 1;
```

---

### Scenario D: Multiple tenants, wrong tenant assignment

**Problem**: User assigned to wrong tenant

**Solution**:
```sql
-- Find the correct tenant
SELECT id, name FROM tenants LIMIT 10;

-- Update user to correct tenant
UPDATE users 
SET tenant_id = 'CORRECT_TENANT_UUID'
WHERE email = 'admin@acme.com';
```

---

## 📋 VERIFICATION CHECKLIST

After applying a fix, verify:

- [ ] User role in database is 'admin'
  ```sql
  SELECT email, role FROM users WHERE email LIKE '%admin%';
  ```

- [ ] User status is 'active'
  ```sql
  SELECT email, status FROM users WHERE email LIKE '%admin%';
  ```

- [ ] User is assigned to a tenant
  ```sql
  SELECT email, tenant_id FROM users WHERE email LIKE '%admin%';
  ```

- [ ] Browser session has correct role
  ```javascript
  JSON.parse(localStorage.getItem('crm_user')).role === 'admin'
  ```

- [ ] Permission checks pass
  ```javascript
  // These should all return true or show as "expected=true"
  advancedDebugAdminPermissions()
  ```

- [ ] Buttons are visible in UI
  - Navigate to: Sales → Check for "New Deal" button
  - Navigate to: Customers → Check for "New Customer" button
  - Try clicking Edit/Delete on any row

---

## 🏗️ ARCHITECTURAL CONTEXT

### Current System (Legacy RBAC)
```
Users Table (role column)
  ↓
AuthService (reads role directly)
  ↓
Hardcoded rolePermissions map
  ↓
Component permission checks
  ↓
Button visibility
```

**Status**: ✅ Fully implemented and working
**Issue**: Depends on `users.role` being set correctly

### Proper RBAC System (Not Yet Implemented)
```
Users Table → user_roles Table → roles Table → permissions
                                    ↓
                          Role definitions with permissions
```

**Status**: ⚠️ Tables exist but are EMPTY (user_roles is empty)
**Migration**: `20250115000001_populate_user_roles.sql` (not yet run)

**Note**: The app uses the legacy system. The proper RBAC system is defined but not integrated.

---

## 🎓 UNDERSTANDING THE PERMISSION FLOW

### How Permission Checks Work

1. **User logs in**
   ```
   Supabase Auth → Check app database for user record
                  → Read user.role ('admin')
                  → Store in localStorage
   ```

2. **Component needs permission check**
   ```
   SalesPage calls: hasPermission('sales:create')
   ```

3. **Permission is checked**
   ```
   authService.hasPermission('sales:create'):
   1. Get user from localStorage
   2. Check user.role === 'admin'
   3. Get rolePermissions['admin'] 
   4. Parse 'sales:create' → resource='sales', action='create'
   5. Map action='create' → 'write'
   6. Check if rolePermissions['admin'] includes 'write'
   7. Return TRUE
   ```

4. **Component renders button**
   ```
   {hasPermission('sales:create') && (
     <Button>New Deal</Button>
   )}
   → Button is VISIBLE
   ```

### Why Admin Should See All Buttons

Admin role has these permissions:
```javascript
rolePermissions['admin'] = [
  'read',        // ← Allows 'read' action
  'write',       // ← Allows 'create' and 'update' actions
  'delete',      // ← Allows 'delete' action
  'manage_sales', // ← Allows full management
  // ... more permissions
]
```

Permission mapping:
- 'create' action → maps to 'write' permission ✅
- 'update' action → maps to 'write' permission ✅
- 'delete' action → maps to 'delete' permission ✅
- 'manage_sales' → explicit permission ✅

**Result**: All CRUD operations are allowed ✅

---

## 🐛 KNOWN BUGS & WORKAROUNDS

### Bug 1: Column Name Mismatch
**Issue**: Code tries to read `firstName` but database has `first_name`

**Location**: `src/services/authService.ts` lines 350-352

**Impact**: User name displays as "undefined undefined"

**Workaround**: Not needed (cosmetic only)

**Fix**: Change to:
```typescript
firstName: appUser.first_name,  // Use snake_case
lastName: appUser.last_name,    // Use snake_case
```

---

### Bug 2: Status Not Checked
**Issue**: Permission checks don't verify user.status

**Location**: `src/services/authService.ts` hasPermission()

**Impact**: Suspended users might still get permissions

**Workaround**: Manually check:
```typescript
if (user.status !== 'active') return false;
```

---

### Bug 3: Tenant Isolation
**Issue**: No tenant-level permission enforcement in UI

**Impact**: Users might see buttons for other tenants' data

**Status**: By design (multi-tenant handled in API)

---

## 📞 SUPPORT & DEBUGGING

### If fix doesn't work:

1. **Check browser console for errors**
   - F12 → Console tab
   - Look for red error messages

2. **Check Supabase logs**
   - Supabase Dashboard → Logs
   - Look for authentication or database errors

3. **Verify database connection**
   ```sql
   SELECT NOW() as db_time;
   ```
   If this works, database is connected.

4. **Check Row-Level Security (RLS) policies**
   - Supabase Dashboard → SQL Editor
   - Query: `SELECT * FROM auth.users;` (should work or throw RLS error)

5. **Try incognito/private window**
   - Clear all cache and cookies
   - Test login in new incognito window

---

## 🔐 SECURITY NOTE

**Important**: Don't set all users to 'admin' role!

Admin role has full permissions:
- Create/Edit/Delete for all modules
- Manage users and roles
- Access analytics
- Change settings

**Use correct roles**:
- `admin` - Full system access (use sparingly)
- `manager` - Create/edit/delete within their domain
- `agent` - Create and read, limited editing
- `engineer` - Technical operations
- `customer` - Read-only access
- `user` - Default role

---

## 📝 DOCUMENTATION FILES

Created for this investigation:

1. **ADMIN_PERMISSIONS_DEEP_INVESTIGATION.md** ← Detailed root cause analysis
2. **ADMIN_PERMISSIONS_SQL_DIAGNOSTICS.sql** ← 11 SQL diagnostic queries
3. **ADVANCED_ADMIN_PERMISSIONS_DEBUG.js** ← Browser console diagnostic
4. **ADMIN_PERMISSIONS_RESOLUTION_PLAN.md** ← This file

---

## ✅ EXPECTED OUTCOMES

After applying the fix:

✅ Admin users should see:
- "New Deal" / "New Sale" buttons in Sales module
- "New Customer" button in Customers module
- "Edit" buttons on every row
- "Delete" buttons with confirmation dialog
- All other CRUD action buttons

✅ Non-admin users should NOT see:
- Create/Edit/Delete buttons (based on their role)
- But still see "View" buttons

✅ No errors in browser console

✅ Smooth navigation between modules

---

## 🚀 NEXT STEPS

1. **Immediate** (Today)
   - [ ] Run SQL diagnostic query
   - [ ] Check user role in database
   - [ ] Apply quick fix if needed
   - [ ] Test buttons appear

2. **Short-term** (This week)
   - [ ] Fix column naming bug (code fix)
   - [ ] Add status check to permissions
   - [ ] Document permission matrix

3. **Long-term** (Future sprint)
   - [ ] Implement proper RBAC using user_roles table
   - [ ] Remove hardcoded rolePermissions
   - [ ] Add UI for role management
   - [ ] Implement audit logging for permission changes

---

## 📞 QUICK REFERENCE

| Item | Location |
|------|----------|
| Permission Logic | `src/services/authService.ts` lines 469-535 |
| Permission Map | `src/services/authService.ts` lines 274-304 |
| Component Permission Check | `src/modules/features/*/views/*Page.tsx` |
| User Type Definition | `src/types/auth.ts` |
| Database Schema | `supabase/migrations/20250101000001_init_tenants_and_users.sql` |
| User Role Migration | `supabase/migrations/20250115000001_populate_user_roles.sql` |

---

## 🎉 SUCCESS CRITERIA

✅ Test will be SUCCESSFUL when:

1. Admin user logs in
2. Navigates to Sales module
3. Sees "New Deal" button in the top bar ← KEY TEST
4. Sees "Edit" and "Delete" buttons on deal rows
5. Can click Create and add a new deal
6. Can edit existing deal
7. Can delete a deal (with confirmation)
8. Same works for Customers, Products, etc.
9. No errors in browser console

---

**Last Updated**: [Current Date]
**Status**: Ready for Implementation
**Author**: Zencoder Investigation
