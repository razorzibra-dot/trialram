# Admin Permissions Debugging Guide

## Issue Summary
Admin users cannot see Create/Update/Delete action buttons on module pages (Customers, Sales, etc.) despite the permission fix being applied.

## Root Cause Analysis

The issue could be caused by several factors:

### 1. **User Role Not Being Set Correctly**
When authenticating with Supabase, the user's role may not be set to "admin". The app reads the user record from the database, and if the role field is incorrect, the permission check will fail.

### 2. **Supabase Not Running**
If `VITE_API_MODE=supabase` but Supabase is not running locally, the login will either fail or use mock data.

### 3. **User Not Existing in Supabase Database**
The users table in Supabase may not have the admin user record, or the user record may have incorrect data.

---

## Debug Steps

### Step 1: Check Browser Console Logs

1. Open your app: `npm run dev`
2. Open Browser Developer Tools (F12)
3. Go to the **Console** tab
4. Login as admin user
5. Look for these debug logs:

```
[getCurrentUser] User: { id: "...", email: "admin@company.com", role: "admin", name: "..." }
[hasPermission] Checking permission "customers:update" for user role "admin". User permissions: ['read', 'write', 'delete', ...]
[hasPermission] Parsed: resource="customers", action="update", mappedPermission="write"
[hasPermission] User has mapped permission "write", granting access
```

**Expected Result:** All debug logs should show the user role as "admin" and permissions should be found.

**If role is NOT "admin":**
The admin user is being authenticated with a different role. Check the Supabase database.

---

### Step 2: Check Current API Mode

1. Check your `.env` file:
```bash
VITE_API_MODE=supabase  # or "mock" or "real"
```

2. If using **Supabase mode**:
   - Ensure Supabase is running: `supabase start`
   - Check if users table exists in Supabase
   - Verify admin user is in the database with role = "admin"

3. If using **Mock mode**:
   - Change `.env`: `VITE_API_MODE=mock`
   - Restart the app: `npm run dev`
   - The mock authService has built-in admin users

---

### Step 3: Verify Admin User Exists (Supabase)

If using Supabase, verify the user in the database:

1. Go to Supabase Studio: http://localhost:54323
2. Navigate to **Tables** → **users**
3. Look for admin user record:
   - Email: `admin@company.com` (or your admin email)
   - Role: `admin`
   - Status: `active`
   - TenantId: Should be populated

**If user doesn't exist:**
Create the admin user manually in Supabase.

**If role is not "admin":**
Update the user record to have role = "admin".

---

### Step 4: Check localStorage User Data

Open Browser DevTools and check localStorage:

1. Press F12 → Application tab → Local Storage
2. Find key: `crm_user`
3. Check the value - it should show:
```json
{
  "id": "...",
  "email": "admin@company.com",
  "name": "Admin User",
  "role": "admin",
  "tenantId": "..."
}
```

If `role` is not "admin", the Supabase user record has the wrong role.

---

### Step 5: Test with Mock Mode

To quickly test if the permission fix works:

1. Edit `.env`:
```bash
VITE_API_MODE=mock
```

2. Restart the app: `npm run dev`

3. Login with:
   - Email: `admin@techcorp.com`
   - Password: `password` (or any password)

4. Navigate to Customers page

5. Check console logs - buttons should now appear

**If buttons appear in mock mode:**
The permission fix is working. The issue is with Supabase setup.

**If buttons still don't appear:**
The fix may not have been applied correctly. Continue to Step 6.

---

### Step 6: Verify Permission Fix Is Applied

Check that the hasPermission() method has been updated:

1. Open: `src/services/authService.ts`
2. Look at the `hasPermission()` method (around line 465)
3. Verify it includes:
   - Resource parsing logic (lines 481-482)
   - Action mapping (lines 486-492)
   - Console logs for debugging

If not present, the fix wasn't applied.

---

## Solution by Scenario

### Scenario A: Using Supabase Backend

**Problem:** User role is not "admin" in Supabase

**Solution:**
1. Start Supabase: `supabase start`
2. Go to: http://localhost:54323
3. Navigate to **SQL Editor**
4. Run:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@company.com';
```
5. Logout and login again to refresh the user data
6. Check console logs to verify role is now "admin"

### Scenario B: Using Mock Backend

**Problem:** Buttons still not showing despite mock mode

**Solution:**
1. Verify `.env` is set to: `VITE_API_MODE=mock`
2. Run: `npm run build` and check for errors
3. Clear browser cache: Ctrl+Shift+Delete
4. Restart dev server: `npm run dev`
5. Login as: `admin@techcorp.com`
6. Check console for debug logs

### Scenario C: Permission Mapping Issue

**Problem:** Debug logs show "No matching permission found"

**Solution:**
1. Check that the permission string format is correct:
   - Should be: `customers:update` or `customers.update`
   - Not: `customers:update:admin`

2. Verify admin role has 'write' permission:
   - Open `authService.ts` line 282-287
   - Check that admin role includes: `'write', 'delete', 'manage_customers'`

3. If missing, add them:
```typescript
admin: [
  'read', 'write', 'delete',  // ← These are required
  'manage_customers', 'manage_sales', 'manage_tickets', ...
]
```

---

## Console Log Interpretation

### ✅ Good Logs (Buttons Will Show)
```
[getCurrentUser] User: { role: "admin" ... }
[hasPermission] Checking permission "customers:update" for user role "admin". User permissions: [...'write'...]
[hasPermission] User has mapped permission "write", granting access
```

### ❌ Bad Logs (Buttons Won't Show)
```
[getCurrentUser] User: { role: "manager" ... }  ← Wrong role!
[hasPermission] Checking permission "customers:update" for user role "manager". User permissions: [...'write'...]
[hasPermission] No matching permission found  ← Permission not found!
```

---

## Quick Checklist

- [ ] Run `npm run build` - builds successfully
- [ ] Check `.env` - correct API_MODE is set
- [ ] If Supabase: `supabase start` is running
- [ ] Login with correct admin email
- [ ] Check console logs for role = "admin"
- [ ] Check localStorage for role = "admin"
- [ ] Look for debug messages about permission mapping
- [ ] Buttons should now be visible

---

## Next Steps If Still Not Working

1. **Provide console logs** - Copy the permission-related console logs
2. **Provide localStorage data** - Export the crm_user value
3. **Provide .env settings** - Show VITE_API_MODE and other auth settings
4. **Describe the issue** - What buttons are missing, which page

This will help diagnose the exact issue.