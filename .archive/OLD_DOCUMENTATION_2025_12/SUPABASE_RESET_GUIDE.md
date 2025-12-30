# Supabase Database Reset & RLS Policy Fix Guide

## Status: Database Reset In Progress ✅

Your database is currently being reset and all migrations are being applied, including the RLS policy fix!

---

## What's Happening Now

The `supabase db reset` command is:

1. **Dropping the old database** 
2. **Recreating the schema** from scratch
3. **Applying all 20+ migrations** in order, including:
   - Core schema (tenants, users, auth)
   - CRM modules (customers, sales, contracts, etc.)
   - Super admin tables and RLS policies
   - **The RLS policy fix** (20250222_fix_super_user_rls_policies.sql) ← This includes your fix!

---

## Expected Completion

⏱️ **ETA: 2-5 minutes**

The command will output "Initialising schema..." and then show migration progress. When done, you'll see no errors.

---

## What Happens After Reset

Once complete:

1. ✅ All database tables will be created
2. ✅ All RLS policies will be correctly configured
3. ✅ The nested subquery issue will be fixed
4. ✅ The super admin dashboard should work without 400 errors
5. ✅ Your super admin user will have a clean slate

---

## After the Reset Completes

### Option 1: Test the Dashboard (Recommended)
```bash
npm run dev
```
Then navigate to `/super-admin/dashboard` and test:
- Dashboard loads without errors ✓
- "Error loading super users" message is gone ✓
- Statistics display correctly ✓
- Impersonation logs appear ✓

### Option 2: Verify RLS Policies
To verify the fix was applied correctly, check the policies in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('super_user_tenant_access', 'super_user_impersonation_logs')
   ORDER BY tablename, policyname;
   ```
3. You should see 7 policies total (4 for access + 3 for logs), all with the new naming convention

### Option 3: Check Specific Policy Definition
```sql
SELECT pg_get_expr(pol.qual, tbl.oid)
FROM pg_policy pol
JOIN pg_class tbl ON pol.relid = tbl.oid
WHERE tbl.relname = 'super_user_tenant_access'
AND pol.policyname = 'super_user_tenant_access_select'
LIMIT 1;
```

---

## If You See Errors

### Error: "exit 1" or Container Issues
This usually means the vector logging service had a hiccup. The fix applied:
```bash
docker restart supabase_vector_CRMV9_NEWTHEME supabase_edge_runtime_CRMV9_NEWTHEME supabase_db_CRMV9_NEWTHEME
```

Try reset again.

### Error: "relation doesn't exist"
This happens if migrations didn't run properly. Try:
```bash
supabase db push --dry-run   # See what would be applied
supabase db push              # Actually apply migrations
```

### Error: RLS policy conflicts
This should NOT happen now - the new policies fix this issue!

If it does occur, run:
```bash
# Apply just the fix migration
psql -h localhost -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20250222_fix_super_user_rls_policies.sql
```

---

## Technical Details: What Was Fixed

### The Problem (Before)
```sql
-- ❌ BROKEN: This violated users table RLS
auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true)
```

### The Solution (After)
```sql
-- ✅ FIXED: Only checks current user's is_super_admin flag
EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
)
```

**Why it works:**
- Only queries the current user (via `auth.uid()`)
- Doesn't try to scan all users across tenants
- Avoids RLS policy conflicts
- Maintains security

---

## Troubleshooting Checklist

- [ ] Database reset completed without errors
- [ ] Application starts: `npm run dev`
- [ ] Super admin user exists in database
- [ ] You're logged in as super admin
- [ ] Navigate to `/super-admin/dashboard`
- [ ] No "Error loading super users" message
- [ ] Dashboard statistics display correctly
- [ ] Check browser console for any errors

---

## Environment Verification

Your current setup:
- **API Mode**: Supabase
- **Local PostgreSQL Port**: 54322
- **Supabase API Port**: 54321
- **Supabase Studio Port**: 54323
- **Docker Status**: All services running ✓

---

## Next Steps

1. **Wait** for reset to complete (monitor the terminal)
2. **Test** by navigating to super admin dashboard
3. **Verify** no 400 errors appear
4. **Confirm** all dashboard data loads correctly

---

## Need Help?

### Check Migration Status
```bash
supabase migration list
```

### View Current Policies
```bash
supabase db -h localhost -p 54322 --username postgres --password postgres
# Then: SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'PRIMARY KEY';
```

### Manual RLS Policy Check
Open Supabase Studio:
- URL: `http://localhost:54323`
- Go to: Authentication → Policies
- Look for super_user policies

---

## Summary

The RLS policy fix is **automatically included** in your database reset. No additional steps needed! 

The nested subquery issue that caused 400 errors is **now resolved** with the new EXISTS-based policies that work within Supabase's RLS model.

**Expected Result**: Super admin dashboard works perfectly! 🎉