# ⚡ Super Admin Data Loading - Quick Fix Guide

## 🚨 IMMEDIATE DIAGNOSTIC (5 minutes)

### Step 1: Check Your Browser Console
1. **Open DevTools**: Press `F12`
2. **Go to Console Tab**
3. **Look for this output** when you visit the Super Admin Dashboard:
   ```
   🔍 [SuperAdminDashboard] Auth State: {
     userRole: 'super_admin',           ← Should be 'super_admin'
     isSuperAdmin: true,                ← Should be true
     hasPermission: true,               ← Should be true
     userId: '...',
     email: '...'
   }
   ```

**If you see different values**, write them down - that's the problem!

---

## 🔧 STEP 2: Run Database Diagnostic

**Copy-paste this into Supabase SQL Editor** (http://localhost:54323):

```sql
-- Check your super admin user
SELECT 
  id, email, role, is_super_admin, tenant_id, status
FROM users
WHERE email = 'YOUR_EMAIL_HERE'
LIMIT 1;
```

Replace `YOUR_EMAIL_HERE` with your actual email.

**Expected output:**
```
| id       | email          | role        | is_super_admin | tenant_id | status |
|----------|----------------|-------------|----------------|-----------|--------|
| user_xxx | admin@...      | super_admin | true           | NULL      | active |
```

**If you see different values** (especially role ≠ 'super_admin' or tenant_id ≠ NULL), go to Step 3.

---

## ✅ STEP 3: Apply Database Fix (if needed)

**If the role or tenant_id was wrong, run this:**

```sql
-- Get your user ID first
SELECT id, email, role, is_super_admin, tenant_id 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';

-- Copy the 'id' value, then run:
UPDATE users 
SET 
  role = 'super_admin',
  tenant_id = NULL,
  is_super_admin = true,
  updated_at = NOW()
WHERE id = 'PASTE_USER_ID_HERE';

-- Verify the fix:
SELECT id, email, role, is_super_admin, tenant_id FROM users WHERE id = 'PASTE_USER_ID_HERE';
```

---

## 🔄 STEP 4: Clear Everything & Test

1. **Close Super Admin pages completely**
2. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Click "Clear Now"
3. **Local storage clear**:
   - Open DevTools Console
   - Paste: `localStorage.clear(); location.reload();`
   - Press Enter
4. **Full logout/login**:
   - Sign out completely
   - Sign back in with your super admin account

**Result:** Dashboard should now load with data ✅

---

## 📋 Checklist

- [ ] Viewed browser console, noted the role/isSuperAdmin values
- [ ] Ran SQL diagnostic query
- [ ] Database showed `role = 'super_admin'` and `tenant_id = NULL`
- [ ] Cleared browser cache
- [ ] Logged out and back in
- [ ] Dashboard now shows data ✅

---

## 🆘 If It STILL Doesn't Work

**Check migration status:**

```sql
-- Verify RLS policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%super%';
```

Should return policies like:
- `users_view_with_super_admin_access` ✅
- `users_manage_with_super_admin_access` ✅

**If policies are missing:**
1. Apply migration `20250304_fix_super_admin_users_tenants_visibility.sql` manually
2. Go to Supabase SQL Editor
3. Paste the entire migration file
4. Click **Run**

**Migration location:**
```
supabase/migrations/20250304_fix_super_admin_users_tenants_visibility.sql
```

---

## 📞 Debug Information to Collect

If you're stuck, provide:

1. **Browser console output** (F12 → Console)
   ```
   🔍 [SuperAdminDashboard] Auth State: { ... }
   ```

2. **Database query results**:
   ```sql
   SELECT id, email, role, is_super_admin, tenant_id FROM users WHERE email = 'YOUR_EMAIL';
   ```

3. **RLS Policies output**:
   ```sql
   SELECT tablename, policyname FROM pg_policies WHERE tablename = 'users' AND policyname LIKE '%super%';
   ```

---

## 🎯 Why This Happens

The permission check (`hasPermission('super_admin:crm:analytics:insight:view')`) happens BEFORE queries run. If the check fails:

```javascript
❌ Check fails → Component shows "Access Denied" → Queries never execute
✅ Check passes → Component renders → Queries execute → Data loads
```

The check looks for:
1. **User role = 'super_admin'** (from localStorage, set during login from database)
2. **tenant_id = NULL** (ensures platform-wide access)

If either is wrong in the database, the check fails and queries never run.
