# 🔍 Super User - No Data Debug Guide

**Date**: 2025-02-12  
**Issue**: Logged in as super user but seeing no data on dashboard, tenant management, or other pages.

---

## 🎯 Quick Diagnosis

### Step 1: What email did you login with?

The seed data creates these super user accounts:
- ✅ `superuser1@platform.admin`
- ✅ `superuser2@platform.admin`
- ✅ `superuser.auditor@platform.admin`

**If you logged in with a DIFFERENT email address**, that's the problem! Your account is not marked as a super admin.

---

## 🔧 Verification Steps

### Step 1: Open Browser Console
1. Press `F12` in your browser
2. Go to "Console" tab
3. Check for any JavaScript errors

### Step 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to "Network" tab
3. **Log out and log back in**
4. Watch the network requests
5. Look for API calls like:
   - `/auth/login` 
   - `/api/super-admin` or similar
6. **Click on any failed requests** and check the response
7. **Common error responses:**
   - ❌ `401 Unauthorized` - Not authenticated
   - ❌ `403 Forbidden` - No permission
   - ❌ `200 OK but empty array []` - Your account isn't marked as super admin

### Step 3: Check Your Account Status

The dashboard queries for super admins using:
```sql
SELECT * FROM users 
WHERE is_super_admin = true 
ORDER BY created_at DESC;
```

Your account needs to have:
- ✅ `is_super_admin = TRUE`
- ✅ `role = 'super_admin'`
- ✅ `tenant_id = NULL` (super admins have NO tenant)
- ✅ `status = 'active'`

---

## 🚀 Solutions

### Solution 1: Use Correct Super Admin Account (FASTEST)

If you haven't already, log in with one of these accounts:

**Development Test Accounts:**
```
Email: superuser1@platform.admin
Email: superuser2@platform.admin
Email: superuser.auditor@platform.admin
```

These are pre-seeded super admin accounts with full access.

---

### Solution 2: Promote Your Current Account to Super Admin

If you want to use a different email, follow these steps:

#### Option A: Direct Database Update (Fastest for Development)

1. **Open Supabase Local Studio**
   - Go to: `http://localhost:54323`
   - Log in with credentials

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Create a new query

3. **Run this SQL** (replace email with YOUR email):

```sql
-- Find your user ID first
SELECT id, email, is_super_admin, tenant_id 
FROM users 
WHERE email = 'your.email@example.com'
LIMIT 1;

-- If found, update them to be super admin
UPDATE users
SET 
  is_super_admin = TRUE,
  role = 'super_admin',
  tenant_id = NULL,
  status = 'active'
WHERE email = 'your.email@example.com';

-- Verify the update
SELECT id, email, is_super_admin, role, tenant_id 
FROM users 
WHERE email = 'your.email@example.com';
```

4. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
5. **Log out and log back in**
6. **Check dashboard** - data should now appear!

#### Option B: Seed Data (If you haven't run it yet)

If you're using a fresh Supabase instance:

```bash
# Make sure Supabase is running
supabase start

# Run seed data
supabase db push  # Applies migrations
supabase db seed  # Applies seed.sql

# Restart dev server
npm run dev
```

---

## 🔐 Understanding Super Admin vs. Tenant Admin

### Super Admin (Platform-wide)
- ✅ `is_super_admin = TRUE`
- ✅ `tenant_id = NULL` (belongs to no tenant)
- ✅ `role = 'super_admin'`
- **Access**: All tenants, all data, super admin pages
- **Visible on**: Dashboard, Tenant Management, Analytics, Users, Logs

### Tenant Admin (Tenant-scoped)
- ❌ `is_super_admin = FALSE`
- ✅ `tenant_id = specific-tenant-uuid` (belongs to one tenant)
- ✅ `role = 'admin'`
- **Access**: Only their tenant's data
- **Not visible on**: Super admin dashboard, tenant management

---

## 📊 Current Data Structure

### Seeded Super Admins in Database

```
ID                                    | Email                          | Super Admin | Tenant ID
37b505b5-17e3-4fbc-8149-78ca6d39209e | superuser1@platform.admin      | TRUE        | NULL
a8f7352c-1d0a-4939-a252-9598790c5f57 | superuser2@platform.admin      | TRUE        | NULL
a2364a6a-48a9-4fa9-8b28-a1b17f867622 | superuser.auditor@platform.admin | TRUE       | NULL
```

### Seeded Tenant Access

These super admins have been granted access to all tenants:
- Acme Corporation (550e8400-e29b-41d4-a716-446655440001)
- Tech Solutions Inc (550e8400-e29b-41d4-a716-446655440002)
- Global Trading Ltd (550e8400-e29b-41d4-a716-446655440003)

---

## 🔍 Advanced Debugging

### Check if RLS Policy is Blocking

Open Supabase SQL Editor and run:

```sql
-- Check if current user is super admin
SELECT 
  auth.uid() as current_user_id,
  (SELECT is_super_admin FROM users WHERE id = auth.uid()) as is_super_admin,
  (SELECT tenant_id FROM users WHERE id = auth.uid()) as user_tenant_id;

-- Try to fetch super admins (what the dashboard does)
SELECT id, email, is_super_admin, tenant_id 
FROM users 
WHERE is_super_admin = true;

-- Check audit logs
SELECT * FROM audit_logs 
LIMIT 5;
```

### Check Service Factory Mode

Open browser console and run:

```javascript
// Check if service factory is working
import { superAdminManagementService } from '@/services/serviceFactory';
const admins = await superAdminManagementService.getAllSuperAdmins();
console.log('Super Admins:', admins);

// Or check environment
console.log('API Mode:', import.meta.env.VITE_API_MODE);
```

---

## 🧪 Testing Checklist

After making changes, verify:

- [ ] Logged in with correct super admin email
- [ ] Browser console shows no red errors
- [ ] Network tab shows API responses with data (not empty arrays)
- [ ] Dashboard shows "Active Tenants" count > 0
- [ ] Dashboard shows "Super Users" count > 0
- [ ] Tenant Management page shows tenant list
- [ ] Analytics page shows metrics
- [ ] Users page shows super user list

---

## 📋 Troubleshooting Flow

```
┌─ Is API in Supabase mode?
│  ├─ NO → Set VITE_API_MODE=supabase in .env
│  └─ YES ↓
├─ Did you run seed data?
│  ├─ NO → Run: supabase db seed
│  └─ YES ↓
├─ Is your account marked is_super_admin=true?
│  ├─ NO → Update using SQL above
│  └─ YES ↓
├─ Is your account's tenant_id = NULL?
│  ├─ NO → Update using SQL above
│  └─ YES ↓
├─ Do you see data in Network tab responses?
│  ├─ NO → Check RLS policies (see Advanced Debugging)
│  └─ YES → You're good! Refresh page ↓
└─ 🎉 Everything should work now!
```

---

## 🆘 Still No Data?

If you've done all steps and still see no data:

1. **Check browser console** for errors (F12 → Console)
2. **Check Network tab** for failed API requests
3. **Enable debug logging** by setting in `.env`:
   ```
   VITE_ENABLE_SERVICE_LOGGING=true
   VITE_DEBUG_SERVICE_FACTORY=true
   VITE_SHOW_API_LOGS=true
   ```
4. **Check Supabase logs** in local studio (check for permission errors)
5. **Verify database connection** is working

---

## 💡 Key Points

- Super Admin accounts need `is_super_admin = TRUE` AND `tenant_id = NULL`
- The dashboard queries all super users with `WHERE is_super_admin = true`
- Tenant Management shows all tenants the super user has access to
- If no data appears, either:
  1. Your account isn't marked as super admin
  2. Seed data hasn't been applied
  3. RLS policies are blocking the query
  4. API mode isn't set correctly

---

## 🚀 Quick Fix Summary

**Fastest way to get data showing:**

```bash
# 1. Make sure Supabase is running
supabase start

# 2. Run seed data (if not already done)
supabase db seed

# 3. Restart dev server
npm run dev

# 4. Log in with:
# Email: superuser1@platform.admin
# (Password: whatever you set during auth)

# 5. Refresh browser: Ctrl+F5
```

Done! Dashboard should show data now.