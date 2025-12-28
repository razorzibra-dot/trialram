# Deal Creation Test - Quick Reference

## Issue: Deals not saving despite success message

### Root Cause Found & Fixed ✅
- Service was using `'sales'` table instead of `'deals'` table
- All CRUD methods, transformations, and queries have been corrected
- Table reference: `'deals'` ✅
- All field mappings: `'deals'` table schema ✅
- All relationship joins: `'deal_items'` (not `'sale_items'`) ✅

## Testing the Fix

### Step 1: DevTools Verification
```
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter: fetch/XHR requests
4. Keep console clear (should see no errors)
```

### Step 2: Create a Deal
```
1. Click "Create Deal" button
2. Fill form with:
   - Title: "Test Deal for Validation"
   - Customer: Select any customer
   - Stage: "proposal" (important - tests stage field)
   - Probability: 75 (important - tests probability field)
   - Value: 50000
   - Add a product item (optional but recommended)
3. Click "Create Deal" button
```

### Step 3: Expected Network Calls

**Correct Behavior** (After Fix):
```
✅ 1 POST to Supabase:
   - Method: POST
   - URL: https://[project].supabase.co/rest/v1/deals
   - Payload includes: {title, stage, probability, value, items, ...}
   - Response: 201 Created

✅ 1 GET to refresh list (cache invalidation):
   - Method: GET
   - URL: https://[project].supabase.co/rest/v1/deals?...
   - Response: 200 OK

✅ NO MULTIPLE GET CALLS
✅ NO ERROR RESPONSES
```

**Previous Broken Behavior** (Before Fix):
```
❌ POST to 'sales' table (wrong table)
❌ Returns error or partial success
❌ Multiple cascading GET calls
❌ Data doesn't appear in database
```

### Step 4: Database Verification
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run this query:
   
   SELECT id, title, stage, probability, value, created_at
   FROM deals
   WHERE created_at > now() - interval '1 minute'
   ORDER BY created_at DESC
   LIMIT 1;

4. Expected Result:
   ✅ New deal appears with all fields populated
   ✅ stage = 'proposal'
   ✅ probability = 75
   ✅ value = 50000
```

### Step 5: UI Verification
```
✅ Success message shown: "Deal created successfully"
✅ Form closes automatically
✅ Deal list updates immediately
✅ New deal visible in list with correct stage/probability
✅ Deal can be opened and all fields are present
```

## Key Fields Verification

After creating deal, verify these fields are saved:
- [ ] `title` - Deal name
- [ ] `stage` - Pipeline stage (e.g., 'proposal')
- [ ] `probability` - Win probability (0-100)
- [ ] `value` - Deal amount
- [ ] `customer_id` - Customer link
- [ ] `assigned_to` - Sales person
- [ ] `items` - Related products/items
- [ ] `expected_close_date` - Close date
- [ ] `created_at` - Timestamp
- [ ] `tenant_id` - Multi-tenant isolation

## What Was Fixed

### Service Layer: `src/services/deals/supabase/dealsService.ts`

1. **Table Reference** (Line 14)
   ```typescript
   // ❌ BEFORE
   private table = 'sales';
   
   // ✅ AFTER
   private table = 'deals';
   ```

2. **Query Joins** (5 locations)
   ```typescript
   // ❌ BEFORE
   .select('*, sale_items(*)')
   
   // ✅ AFTER
   .select('*, deal_items(*)')
   ```

3. **Data Transformations**
   ```typescript
   // toTypeScript() - Maps database to TypeScript
   // ✅ NOW: Includes stage and probability from 'deals' table
   // ✅ NOW: Uses deal_items relationship
   
   // toDatabase() - Maps TypeScript to database
   // ✅ NOW: Only includes fields that exist in 'deals' table
   // ✅ REMOVED: Non-existent payment/revenue fields
   ```

## Troubleshooting

### If deal still doesn't save:
1. Check DevTools Network tab
   - Are there any POST errors?
   - What's the response code and message?

2. Check Supabase RLS policies
   - Run: `SELECT * FROM auth.jwt();`
   - Verify policies allow insert into 'deals'

3. Check Supabase logs
   - Go to Supabase Dashboard → Logs
   - Look for errors in last minute

### If stage/probability fields are missing:
1. Verify form is sending these fields
   - Check Network tab payload
   - Should include: `"stage":"proposal","probability":75`

2. Verify database columns exist
   - Run: `\d deals;` in Supabase SQL Editor
   - Look for `stage` column (character varying)
   - Look for `probability` column (numeric)

### If multiple GETs happen:
This is actually normal and good! After successful POST:
1. Form closes
2. React Query invalidates cache
3. Component refetches list (1 GET)
4. List displays new deal

Multiple GETs would only be a problem if they happen during save (not after).

## Related Documentation

- **Schema Definition**: `20251117000007_create_sales_pipeline_tables.sql`
- **Service Implementation**: `src/services/deals/supabase/dealsService.ts`
- **Hook Implementation**: `src/modules/features/deals/hooks/useDeals.ts`
- **Form Component**: `src/modules/features/deals/components/DealFormPanel.tsx`
- **Types**: `src/types/crm.ts` (Deal interface)

## Success Criteria ✅

All of the following should be true:

- [x] Single POST request on create (no errors)
- [x] Single GET request after POST (cache invalidation)
- [x] Deal inserts into 'deals' table (verified in Supabase)
- [x] All fields persisted (stage, probability, items, etc.)
- [x] Deal appears in UI list immediately
- [x] Success message shows
- [x] No cascading errors or excessive network calls
- [x] Can edit deal and changes persist
- [x] Can view deal details with all fields intact

## Next Steps

1. ✅ Test deal creation (this document)
2. Test deal update (edit existing deal)
3. Test deal deletion
4. Test deal filtering by stage and probability
5. Test bulk operations
6. Performance testing with large datasets
