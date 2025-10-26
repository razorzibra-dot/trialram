# 🔧 Quick Fix: Notifications Schema (5 Minutes)

## The Error You're Seeing
```
Error: Could not find the 'action_label' column of 'notifications' in the schema cache
```

## Why This Happens
The notification service was updated to support rich notifications with labels and categories, but the database schema wasn't updated to match.

## What We Fixed
✅ **Database Schema**: Added 5 missing columns to notifications table
✅ **Service Layer**: Updated to handle both old and new schema formats  
✅ **Backward Compatibility**: No breaking changes - old code still works

## Quick Fix (Choose One)

### 🟢 EASIEST: Using Supabase CLI
```bash
# Navigate to project
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Push migrations to Supabase
supabase db push
```

### 🟡 MANUAL: Supabase Dashboard SQL
1. Open Supabase Dashboard
2. Go to **SQL Editor** → **New Query**
3. Copy file: `supabase/migrations/20250101000014_add_missing_notification_columns.sql`
4. Click **Execute**

### 🔴 DOCKER: Local Supabase
```bash
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres < supabase/migrations/20250101000014_add_missing_notification_columns.sql
```

## Verify It Works
1. Create a new sale in the app
2. Look at browser console (F12 → Console tab)
3. Should see: `[sales] Notification created successfully`
4. Should NOT see: `PGRST204` error

## What Changed in Code

### Database
- ✅ Added `action_label` column
- ✅ Added `category` column
- ✅ Added `data` column
- ✅ Added `read` column
- ✅ Added `user_id` column
- ✅ Added `updated_at` column

### Service Code
- ✅ Enhanced create methods to use new columns
- ✅ Smart mapping function handles old + new schema
- ✅ Automatic sync triggers keep data consistent

## No Downtime Required
✅ Fully backward compatible
✅ Existing data preserved
✅ No app restart needed
✅ Can be applied anytime

## Files Changed
| File | Change | Lines |
|------|--------|-------|
| `supabase/migrations/20250101000014_add_missing_notification_columns.sql` | NEW | 50 |
| `src/services/supabase/notificationService.ts` | UPDATED | 30 |

## Still Having Issues?

### If column still missing after migration:
1. Check migration ran successfully in Supabase Dashboard
2. Go to **SQL Editor** and run:
   ```sql
   \d notifications
   ```
   Should list all columns including `action_label`, `category`, `data`, `read`, `user_id`, `updated_at`

### If getting PGRST204 after applying migration:
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh page (Ctrl+Shift+R)
3. Check that notifications table columns are there (run \d notifications query)

### If notifications still not working:
1. Check `.env` file has `VITE_API_MODE=supabase`
2. Check user is authenticated
3. Look for other errors in console (besides PGRST204)

## Next Steps
✅ Apply the migration (choose method above)
✅ Test by creating/updating a sale
✅ Verify notification appears without errors
✅ You're done! 🎉

---
**Estimated Time**: 5 minutes
**Complexity**: Simple
**Risk**: Very Low (backward compatible)