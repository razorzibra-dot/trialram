# Supabase Authentication Setup - Option 2 (Recommended)

This guide explains how to set up proper Supabase authentication for RLS to work correctly.

## Problem Solved

Previously, `auth.uid()` was returning NULL in RLS policies, causing all data queries to fail silently. This is now fixed by properly authenticating users through Supabase.

## Setup Steps

### Step 1: Create Test Users in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Navigate to: http://localhost:54323
   - Login if needed

2. **Create First User (Admin)**
   - Click: `Authentication` → `Users` (in left sidebar)
   - Click: `Add user` button (top right)
   - Enter:
     - Email: `admin@techcorp.com`
     - Password: `password123`
     - **Important**: Toggle OFF "Auto generate password"
   - Click: `Save`
   - **Copy the User ID** (looks like a UUID: `11111111-1111-1111-1111-111111111111`)

3. **Create Second User (Regular)**
   - Click: `Add user` again
   - Enter:
     - Email: `user@techcorp.com`
     - Password: `password123`
     - Toggle OFF "Auto generate password"
   - Click: `Save`
   - **Copy the User ID**

### Step 2: Update Migration File

1. **Open migration file:**
   ```
   supabase/migrations/20250101000013_add_test_auth_users.sql
   ```

2. **Replace the UUIDs:**
   - Find line with: `'11111111-1111-1111-1111-111111111111'::uuid` (FIRST occurrence)
   - Replace with: Your **admin user UUID** from step 1
   
   - Find: `'22222222-2222-2222-2222-222222222222'::uuid` (SECOND occurrence)
   - Replace with: Your **regular user UUID** from step 1

3. **Example:**
   ```sql
   -- If admin UUID is: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   INSERT INTO users (
     id,
     email,
     firstName,
     lastName,
     role,
     status,
     tenant_id,
     tenantName,
     created_at
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,  -- REPLACED
     'admin@techcorp.com',
     ...
   ```

### Step 3: Run Database Migration

```powershell
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME
supabase db push
```

You should see:
```
Applying migration 20250101000013_add_test_auth_users.sql
✓ Migration applied successfully
```

### Step 4: Verify Setup

In **Supabase SQL Editor**, run:

```sql
-- Check if users exist in app database
SELECT id, email, role, tenant_id FROM users 
WHERE email IN ('admin@techcorp.com', 'user@techcorp.com');

-- Check if auth works
SELECT auth.uid();
-- Should return NULL (because we're not authenticated in editor)
```

### Step 5: Update Application

The app code has been updated to use real Supabase authentication:

1. **Clear browser cache:** `Ctrl+Shift+Delete`
2. **Hard refresh:** `Ctrl+Shift+R`
3. **Stop dev server:** `Ctrl+C`
4. **Restart dev server:** `npm run dev`

### Step 6: Test Login

1. **Go to:** http://localhost:5173/login
2. **Enter credentials:**
   - Email: `admin@techcorp.com`
   - Password: `password123`
3. **Click:** `Login`

You should see:
- ✅ Successfully redirected to dashboard
- ✅ User info appears (top-right profile area)
- ✅ No "Unauthorized" errors

### Step 7: Verify RLS is Working

1. **Navigate to:** http://localhost:5173/user-management/roles
2. **Expected results:**
   - ✅ Roles data loads (not empty)
   - ✅ Permissions data loads
   - ✅ User roles display (if any exist)

3. **Check browser console (F12):**
   - Should see NO errors about "Unauthorized"
   - Should see successful requests to `/rest/v1/roles`, etc.

## How It Works

### Before (Mock Auth - Broken)
```
Browser Login → Mock Token → localStorage → RLS Query
                                          ↓
                                    auth.uid() = NULL
                                          ↓
                                    RLS Policy Fails
                                          ↓
                                    Returns Empty Array
```

### After (Supabase Auth - Working)
```
Browser Login → Supabase Auth → Session Token → Supabase Client
                                                      ↓
                                                auth.uid() = User UUID
                                                      ↓
                                                RLS Policy Checks User
                                                      ↓
                                                Returns User's Data
```

## What Changed in Code

### authService.ts
- ❌ Removed: Mock login with hardcoded users
- ✅ Added: Real Supabase authentication via `signInWithPassword()`
- ✅ Added: Session persistence in localStorage
- ✅ Added: `restoreSession()` method for page reloads

### database.ts
- ✅ Added: `initializeSession()` function
- ✅ Added: Session restore on app startup
- Result: `auth.uid()` will have value when authenticated

## Troubleshooting

### Issue: Login says "Invalid credentials"
**Solution:**
- Verify email/password matches what you created in Supabase Dashboard
- Check that auto-generate password was turned OFF
- Try recreating the user

### Issue: Login succeeds but "User profile not found" error
**Solution:**
- Verify UUIDs in migration match Supabase user IDs exactly
- Re-run migration: `supabase db push`
- Check users table: `SELECT * FROM users WHERE email = 'admin@techcorp.com';`

### Issue: Roles still not loading after login
**Solution:**
1. Open DevTools (F12) → Network tab
2. Go to `/user-management/roles`
3. Look for request to `/rest/v1/roles`
4. Check response:
   - ✅ If you see data: RLS is working!
   - ❌ If empty array: Check if auth.uid() has value in policies
   - ❌ If error: Check browser console for error messages

**Test in SQL Editor:**
```sql
-- Switch user to your test user (only works in Dashboard)
SELECT * FROM roles;
-- Should return results if policies are correct
```

### Issue: "Object reference not set to an instance of an object"
**Solution:**
- Make sure tenant exists: `SELECT * FROM tenants LIMIT 1;`
- Migration creates users linked to first tenant
- If no tenants, run earlier migrations first

## Reverting to Mock Auth (Not Recommended)

If you need to go back to mock authentication temporarily:

```typescript
// In authService.ts, around line 306
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Comment out real auth block and uncomment mock auth
  const user = this.mockUsers.find(u => u.email === credentials.email);
  // ... rest of old login code
}
```

**Note:** Mock auth will NOT work with RLS-protected data. Only use for UI testing.

## Next Steps

1. ✅ Users can now authenticate with real Supabase auth
2. ✅ RLS policies will have `auth.uid()` value
3. ✅ Data will load correctly
4. Create more users as needed (repeat Step 1)
5. Deploy app with proper auth credentials for production

## For Production

When deploying to production:

1. Use a real Supabase project (not local)
2. Update environment variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Create users through your own user management UI (not Dashboard)
4. Implement proper password reset flows
5. Consider MFA (Multi-Factor Authentication)