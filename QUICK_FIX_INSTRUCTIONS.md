# Quick Fix: Sync Missing User

## Problem
User `903d5e30-7799-44a1-90c8-f9a448edf64c` exists in `auth.users` but not in `public.users`, causing login to fail.

## Solution: Run SQL Fix Immediately

### Method 1: Supabase Dashboard (Easiest)
1. Open Supabase Dashboard: http://localhost:54323 (or your Supabase URL)
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix_missing_user.sql`
4. Click **Run** or press `Ctrl+Enter`
5. Check the output - you should see "User synced to public.users"

### Method 2: Supabase CLI
```bash
# Run the SQL file directly
supabase db execute --file fix_missing_user.sql
```

### Method 3: psql (if you have direct database access)
```bash
psql -h localhost -p 54322 -U postgres -d postgres -f fix_missing_user.sql
```

## After Running the Fix

1. **Verify the user was created:**
   ```sql
   SELECT id, email, tenant_id, is_super_admin 
   FROM public.users 
   WHERE id = '903d5e30-7799-44a1-90c8-f9a448edf64c';
   ```

2. **Check role assignment:**
   ```sql
   SELECT u.email, r.name as role_name
   FROM public.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id
   LEFT JOIN roles r ON ur.role_id = r.id
   WHERE u.id = '903d5e30-7799-44a1-90c8-f9a448edf64c';
   ```

3. **Try logging in again** - the error should be resolved.

## Long-term Fix

After fixing the immediate issue, run the migrations to prevent this in the future:

```bash
# Apply all pending migrations (including the sync trigger)
supabase migration up
```

This will:
- Create a trigger to auto-sync new auth users
- Sync all existing missing auth users
- Prevent this issue from happening again

