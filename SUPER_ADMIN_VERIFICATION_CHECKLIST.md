# Super Admin Access - Quick Verification Checklist

## Step 1: Verify Super User Account in Database

Before testing, ensure your super admin user exists with correct data:

```sql
-- Check super user account (use Supabase Studio)
SELECT id, email, role, tenant_id, status 
FROM users 
WHERE role = 'super_admin' 
LIMIT 1;

-- Expected output:
-- id: <user_id>
-- email: superuser1@platform.admin (or your super admin email)
-- role: super_admin
-- tenant_id: NULL (must be null for super admins!)
-- status: active
```

⚠️ **CRITICAL**: If `tenant_id` is NOT NULL, your super user is misconfigured!

## Step 2: Clear Browser Cache

```javascript
// Open browser DevTools Console and run:
localStorage.clear();
sessionStorage.clear();
// Refresh page
location.reload();
```

## Step 3: Test Login Flow

### Start Fresh
1. Close any open tabs with the app
2. Open browser DevTools → Console tab (keep it open)
3. Navigate to `http://localhost:5173` (or your dev URL)
4. Click "Login"

### Login with Super Admin

```
Email: superuser1@platform.admin
Password: <your_super_admin_password>
```

### Check Console Logs (Critical)

**GOOD** ✅ - You should see these messages:
```
[SUPABASE_AUTH] Starting login for: superuser1@platform.admin
[SUPABASE_AUTH] Auth successful, user ID: 37b505b5-17e3-4fbc-8149-78ca6d39209e
[SUPABASE_AUTH] User found: superuser1@platform.admin
[SUPABASE_AUTH] Mapping user - role: super_admin, isSuperAdmin: true, tenantId: null
[SUPABASE_AUTH] Login successful, session stored
[RootRedirect] Super admin detected, redirecting to super-admin dashboard
[MultiTenantService] Super admin detected - skipping tenant fetch
```

**BAD** ❌ - If you see these, the fix didn't work:
```
[SUPABASE_AUTH] Mapping user - role: super_admin, isSuperAdmin: false, tenantId: <something>
[RootRedirect] Regular user detected, redirecting to tenant dashboard
[ModuleProtectedRoute] ❌ Access denied to module: super-admin
```

## Step 4: Check Redirect URL

After login, check the URL:

✅ **CORRECT**: `http://localhost:5173/super-admin/dashboard`

❌ **WRONG**: `http://localhost:5173/tenant/dashboard`

## Step 5: Test Manual Navigation

1. If you're at `/super-admin/dashboard`, it's working! ✅
2. If redirected elsewhere, manually type: `http://localhost:5173/super-admin/`
3. You should see super-admin module content (not "Access Denied")

## Step 6: Check Network Tab

Open DevTools → Network tab and look for this query:

❌ **BAD** (indicates old code):
```
GET http://127.0.0.1:54321/rest/v1/tenants?select=id%2Cname&id=eq.null
→ Status: 400 Bad Request
```

✅ **GOOD** (with fix):
- NO 400 Bad Request error for tenants query
- Tenant fetch skipped for super admins

## Troubleshooting

### Issue 1: Still redirected to tenant dashboard

**Cause**: `isSuperAdmin` flag not being set
**Solution**:
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear node modules cache
rm -rf node_modules/.vite
# 3. Restart dev server
npm run dev
# 4. Clear browser cache and login again
```

### Issue 2: Still getting "Access Denied"

**Cause**: Module registry not recognizing super admin
**Solution**:
```javascript
// In DevTools Console, check:
console.log(localStorage.getItem('sb_current_user'));
// Should show: {..., isSuperAdmin: true, tenantId: null, ...}
```

### Issue 3: 400 Bad Request on tenants query

**Cause**: multiTenantService not detecting super admin
**Solution**:
```javascript
// Check user in localStorage:
const user = JSON.parse(localStorage.getItem('sb_current_user'));
console.log('User role:', user.role);
console.log('User tenantId:', user.tenant_id || user.tenantId);
// Should be: role='super_admin', tenantId=null
```

### Issue 4: Login fails completely

**Cause**: Database connection or credentials
**Solution**:
```bash
# 1. Verify Supabase is running
supabase status

# 2. Check super user exists
# Use Supabase Studio: http://localhost:54323
# Go to SQL Editor and run:
SELECT * FROM users WHERE email = 'superuser1@platform.admin';

# 3. Verify .env has correct Supabase URL
cat .env | grep VITE_SUPABASE_URL
# Should be: VITE_SUPABASE_URL=http://127.0.0.1:54321
```

## Quick Diagnostic Command

Open DevTools Console and run:

```javascript
// Diagnostic check
const user = JSON.parse(localStorage.getItem('sb_current_user'));
console.log({
  email: user?.email,
  role: user?.role,
  isSuperAdmin: user?.isSuperAdmin,
  tenantId: user?.tenantId,
  isCorrect: user?.role === 'super_admin' && user?.isSuperAdmin === true && user?.tenantId === null
});
```

**Expected output**:
```javascript
{
  email: "superuser1@platform.admin",
  role: "super_admin",
  isSuperAdmin: true,
  tenantId: null,
  isCorrect: true
}
```

## Files to Check

After applying fixes, verify these files were updated:

1. ✅ `src/services/supabase/authService.ts` - Line 823 should have `isSuperAdmin,`
2. ✅ `src/services/supabase/multiTenantService.ts` - Line 42 should check for null tenantId

```bash
# Verify changes
grep -n "isSuperAdmin," src/services/supabase/authService.ts
grep -n "tenant_id === null" src/services/supabase/multiTenantService.ts
```

## What Changed

### Before Fix ❌
```
super_admin login → Missing isSuperAdmin flag → Treated as regular user → Denied access
```

### After Fix ✅
```
super_admin login → isSuperAdmin: true set → Recognized as super admin → Full access granted
```

## Need Help?

If tests still fail:

1. Check the [Super Admin Access Fix Summary](./SUPER_ADMIN_ACCESS_FIX_SUMMARY.md)
2. Review console logs for error messages
3. Verify database has super user with correct role and null tenantId
4. Ensure `.env` has `VITE_API_MODE=supabase`
5. Try clearing all caches and restarting dev server

---

**Last Updated**: 2025
**Status**: ✅ Ready for Testing