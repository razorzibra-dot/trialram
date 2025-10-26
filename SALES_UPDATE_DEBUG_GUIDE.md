# Sales Update - Debug Troubleshooting Guide

## Issue Summary
The sales deal update form processes correctly up to the point where Supabase is called, but **no network request is being made**. The mutation is firing, form validation passes, deal data is prepared - but the actual API call to Supabase fails silently.

## Root Cause Analysis
**Problem**: When clicking "Update Deal", the logs show:
- ✅ Form submission handler fires
- ✅ Form validation passes
- ✅ Deal data is prepared
- ✅ UPDATE mutation is called
- ✅ Service method is invoked (`updateSale`)
- ❌ NO network request appears in Network tab
- ❌ Data is NOT saved

**Most Likely Causes** (in order of probability):
1. **Row Level Security (RLS) Policy Blocking** - Supabase RLS may be preventing the UPDATE
2. **Missing Authentication** - Supabase client not properly authenticated
3. **Column Name Mismatch** - Database columns don't match the update payload keys
4. **Table Doesn't Exist** - The `sales` table missing or wrong schema
5. **Permission/Role Issue** - Authenticated user doesn't have UPDATE permission

## New Debug Logging Added

### 1. Supabase Service Logging (`src/services/supabase/salesService.ts`)
Enhanced `updateSale` method now logs:
```
🔄 [SUPABASE] Making updateSale request: { id, payload }
🔄 [SUPABASE] updateSale response: { data, error }
❌ [SUPABASE] Update error detail: { message, code, details, hint, fullError }
⚠️ [SUPABASE] Update returned no data
```

### 2. React Query Hook Logging (`src/modules/features/sales/hooks/useSales.ts`)
Enhanced `useUpdateDeal` hook now logs:
```
🎯 [useUpdateDeal] mutationFn starting: { id, dataKeys }
✅ [useUpdateDeal] mutationFn completed: { id, resultId }
❌ [useUpdateDeal] mutationFn error: error
✅ [useUpdateDeal] onSuccess triggered: id
❌ [useUpdateDeal] onError triggered: error
```

## Testing Steps

### Step 1: Enable Debug Console
1. Open the application in your browser
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Make sure you can see logs (not filtered)

### Step 2: Reproduce the Issue
1. Navigate to **Sales** module
2. Find an existing deal (or create one first)
3. Click **Edit** button on any deal
4. Modify any field (e.g., title, stage, probability)
5. Click **Update Deal** button
6. **Watch the console immediately**

### Step 3: Analyze Console Output

#### Expected Output (Success)
```
=== SUBMIT HANDLER CALLED ===
Step 1: Validating form fields...
Step 2: Form values validated: {...}
Step 4: Deal value calculated: 10000
Step 5: Deal data prepared: {...}
Step 6a: Calling UPDATE mutation for deal: b50e8400-...
🎯 [useUpdateDeal] mutationFn starting: { id: 'b50e8400-...', dataKeys: [...] }
🔄 [SUPABASE] Making updateSale request: { id: 'b50e8400-...', payload: {...} }

// Network request appears here in Network tab
🔄 [SUPABASE] updateSale response: { data: {...}, error: null }
✅ [useUpdateDeal] mutationFn completed: { id: 'b50e8400-...', resultId: 'b50e8400-...' }
✅ [useUpdateDeal] onSuccess triggered: b50e8400-...
Step 6b: UPDATE completed successfully
Step 7: Calling onSuccess callback
Step 8: Calling onClose callback
```

#### Failure Output (What to Look For)
- If you see `🔄 [SUPABASE] Making updateSale request` but NO network request in Network tab, it's an **authentication or RLS issue**
- If you see `❌ [SUPABASE] Update error detail`, check the `code`, `details`, and `hint` fields
- If `data` is `null` after response, you may have a permission issue

### Step 4: Check Network Tab
1. Open **Developer Tools** → **Network** tab
2. Filter by **XHR** requests
3. Click **Update Deal**
4. Look for a `PATCH` request to your Supabase URL
5. If NO request appears, see **Debugging RLS Issues** below

## Common Error Messages & Fixes

### Error: "column X does not exist"
```
❌ [SUPABASE] Update error detail: {
  code: '42703',
  message: 'column "expected_close_date" does not exist'
}
```
**Fix**: Verify column names in your `sales` table match what the form is sending. Check:
1. Go to Supabase Dashboard
2. Navigate to your project
3. Find `sales` table in SQL Editor
4. Check if the column exists and is spelled correctly

### Error: Permission Denied / RLS Policy
```
❌ [SUPABASE] Update error detail: {
  code: 'PGRST109',
  message: 'insufficient permissions'
}
```
**Fix**: Check your RLS policies:
1. Go to Supabase → **Authentication** → **Policies**
2. Find policies for `sales` table
3. Ensure there's an UPDATE policy that allows authenticated users
4. Check the policy condition - may need to allow access based on `tenant_id` or `created_by`

### Error: "No rows to RETURN"
```
⚠️ [SUPABASE] Update returned no data
```
**Fix**: This happens when `.single()` expects exactly one row but gets zero. Possible causes:
- The `id` doesn't exist
- RLS is filtering it out
- The record was deleted
- `tenant_id` mismatch

## Debugging RLS Issues

### 1. Check if Request is Being Made
```javascript
// In console, paste this:
fetch(new Request('http://127.0.0.1:54321/rest/v1/sales', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'Test' })
})).then(r => r.json()).then(console.log)
```

### 2. Check Supabase Logs
1. Go to **Supabase Dashboard** → **Logs** → **SQL Editor**
2. Run: `SELECT * FROM sql_requests LIMIT 10;`
3. Look for your UPDATE attempts

### 3. Verify Authentication
Add this to your browser console:
```javascript
import { supabaseClient } from '@/services/supabase/client';
const { data: { user } } = await supabaseClient.auth.getUser();
console.log('Current user:', user);
```

If `user` is `null`, you're not authenticated!

### 4. Test RLS Policy Directly
```javascript
// Try a simple update with admin client
const { data, error } = await supabaseClient
  .from('sales')
  .update({ title: 'Test Update' })
  .eq('id', 'YOUR_ID')
  .select()
  .single();

console.log('Result:', { data, error });
```

## Quick Fixes Checklist

- [ ] Verify Supabase is running (`supabase status`)
- [ ] Check `.env` has `VITE_API_MODE=supabase`
- [ ] Verify user is logged in (check console for user info)
- [ ] Check Network tab shows PATCH requests (if no requests, it's RLS)
- [ ] Verify `sales` table exists in Supabase
- [ ] Check column names in `sales` table match form fields
- [ ] Verify RLS policies allow UPDATE operations
- [ ] Check `tenant_id` is correctly set on the record being updated

## Next Steps

1. **Test the Update** with debug logging enabled
2. **Copy Full Console Output** including error details
3. **Check Network Tab** - is there a request?
4. **Send Screenshot** of:
   - Console logs with error messages
   - Network tab showing request (or absence of request)
   - Error details from `[SUPABASE] Update error detail`

## Files Modified
- `src/services/supabase/salesService.ts` - Added detailed error logging
- `src/modules/features/sales/hooks/useSales.ts` - Added mutation tracking logs

## Debug Log Format Reference

All debug logs use this format:
- 🔄 = Network/API call
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 🎯 = Target/Entry point
- 🔧 = Configuration/Setup

Watch for these prefixes to trace execution flow!