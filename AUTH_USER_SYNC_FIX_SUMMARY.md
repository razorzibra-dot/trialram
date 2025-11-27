# Auth User Sync Fix - Summary

## Issue
User ID `6accb17c-5faa-4c49-9187-00a1ba01fd39` exists in Supabase Auth (`auth.users`) but not in the database users table (`public.users`), causing the error:
```
{
  "code": "PGRST116",
  "details": "The result contains 0 rows",
  "message": "Cannot coerce the result to a single JSON object"
}
```

## Root Cause
- Auth users can be created manually or through the application
- The `public.users` table was not automatically synced with `auth.users`
- Seed data had hardcoded UUIDs that didn't match real auth user IDs

## Solution Implemented

### 1. Created Migration: `20251121000001_sync_auth_users_to_public_users.sql`

**Features:**
- ✅ **Auto-sync trigger**: Automatically creates `public.users` entry when new auth user is created
- ✅ **One-time sync**: Syncs all existing auth users that don't have `public.users` entries
- ✅ **Smart role detection**: Determines role from email pattern (admin, manager, engineer, etc.)
- ✅ **Tenant mapping**: Maps email domains to tenants automatically
- ✅ **Super admin handling**: Properly handles super admins with `tenant_id = NULL`
- ✅ **Updates existing users**: Updates email/name if auth user metadata changes

**How it works:**
1. Creates a trigger function `sync_auth_user_to_public_user()` that runs on INSERT/UPDATE of `auth.users`
2. Extracts user metadata (name, email, etc.) from auth user
3. Determines role and tenant based on email patterns
4. Inserts or updates the corresponding `public.users` entry

### 2. Fixed seed.sql

**Changes:**
- ✅ Added `role` column to INSERT statement
- ✅ Added `first_name` and `last_name` columns
- ✅ Added `updated_at` column
- ✅ Changed `ON CONFLICT` to `DO UPDATE` to handle existing users
- ✅ Properly typed enum values (`'admin'::user_role`)

### 3. Migration Execution

**To apply the fix:**
```bash
# Run the migration
supabase migration up

# Or reset database (will run all migrations including the new one)
supabase db reset
```

**The migration will:**
1. Create the sync trigger function
2. Create the trigger on `auth.users`
3. Sync all existing auth users to `public.users`
4. Show verification queries to confirm sync

## Verification

After running the migration, verify with:

```sql
-- Check for auth users without public.users entries (should be empty)
SELECT 
  au.id,
  au.email,
  'Missing in public.users' as status
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  );

-- Check sync statistics
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(pu.id) as synced_users,
  COUNT(*) - COUNT(pu.id) as missing_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email IS NOT NULL AND au.email != '';
```

## Future Prevention

The trigger ensures that:
- ✅ New auth users are automatically synced to `public.users`
- ✅ No manual intervention needed
- ✅ Consistent data between auth and database
- ✅ Proper role and tenant assignment

## Files Modified

1. ✅ `supabase/migrations/20251121000001_sync_auth_users_to_public_users.sql` - **NEW** migration file
2. ✅ `supabase/seed.sql` - Updated to include all required columns

## No Duplicates

- ✅ No duplicate migration files
- ✅ No duplicate seed files
- ✅ Consistent implementation across all files

## Testing

After applying the migration:
1. The user `6accb17c-5faa-4c49-9187-00a1ba01fd39` will be automatically synced to `public.users`
2. Any new auth users created will automatically get `public.users` entries
3. The API endpoint `/rest/v1/users?select=id,tenant_id&id=eq.6accb17c-5faa-4c49-9187-00a1ba01fd39` will return the user data

