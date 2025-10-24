# ⚡ Quick Start: Supabase Authentication Setup

**5 minutes to get RLS working!**

## 🚀 Quick Steps

### 1️⃣ Create Users in Supabase Dashboard (2 min)

```
http://localhost:54323
→ Authentication → Users
→ Add User button

CREATE TWO USERS:
  User 1: admin@techcorp.com / password123
  User 2: user@techcorp.com / password123
  
⚠️ IMPORTANT: Turn OFF "Auto generate password" for each!
```

### 2️⃣ Copy User IDs (1 min)

After creating each user, you'll see a UUID in the User ID column:
```
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Copy both UUIDs** - you'll need them next.

### 3️⃣ Update Migration File (1 min)

File: `supabase/migrations/20250101000013_add_test_auth_users.sql`

Find and replace:
```
'11111111-1111-1111-1111-111111111111' → Your ADMIN user UUID
'22222222-2222-2222-2222-222222222222' → Your REGULAR user UUID
```

### 4️⃣ Push Migration (1 min)

```powershell
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME
supabase db push
```

✅ You should see: `✓ Migration applied successfully`

### 5️⃣ Restart App (1 min)

```powershell
# Stop server: Ctrl+C
# Clear cache: Ctrl+Shift+Delete
# Restart: npm run dev
# Hard refresh: Ctrl+Shift+R
```

## 🧪 Test It

1. **Go to:** http://localhost:5173/login
2. **Enter:**
   - Email: `admin@techcorp.com`
   - Password: `password123`
3. **Click:** Login

## ✅ Verify Success

After login, check:

✅ Dashboard loads (no errors)  
✅ Go to: http://localhost:5173/user-management/roles  
✅ Roles data displays (not empty!)  
✅ Browser console has NO "Unauthorized" errors  

## 🎯 What This Fixed

| Before | After |
|--------|-------|
| `auth.uid()` = NULL ❌ | `auth.uid()` = Your User ID ✅ |
| RLS policies blocked all queries | RLS policies allow authenticated users |
| Roles/Permissions returned empty `[]` | Roles/Permissions return actual data |
| Silent failures, hard to debug | Clear authentication flow |

## 🔍 Debug Commands

If something doesn't work, run in **Supabase SQL Editor**:

```sql
-- Check your users exist
SELECT email, role, tenant_id FROM users 
WHERE email LIKE '%techcorp%';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('roles', 'user_roles', 'permissions');
-- All should show: rowsecurity = true
```

## 📚 Full Details

See: `SUPABASE_AUTH_SETUP.md` for complete setup guide and troubleshooting

## 💡 Key Points

- Uses **real Supabase authentication** (not mock)
- Session persists in **localStorage**
- RLS policies now work because `auth.uid()` has value
- Works for both local dev and production

---

**Questions?** Check the errors in:
- Browser console (F12)
- DevTools Network tab
- Supabase logs (Dashboard → Logs)