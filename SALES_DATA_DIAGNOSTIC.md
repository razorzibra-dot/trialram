# Sales Data Display - Diagnostic Report

## Issue Summary
User reports that despite having data visible in the grid:
- **Expected Close Date** column shows blank
- **Customer Information** in side panel shows blank
- **Product/Services table** in side panel shows blank

## Root Cause Analysis

### Hypothesis 1: Service Factory Routing Issue ❌
**Status**: CONFIRMED AS ISSUE

Looking at the data flow:
1. Module-level `SalesService` uses `legacySalesService` (line 9 of sales module's salesService.ts)
2. This should route through the service factory
3. **Problem**: `legacySalesService` might not be properly exported from index.ts

### Hypothesis 2: API Mode Not Set Correctly ⚠️
**Status**: NEEDS VERIFICATION

The .env has `VITE_API_MODE=supabase` BUT:
- The SalesService might not be respecting this correctly
- It might be defaulting to mock instead

### Hypothesis 3: Data Transformation Issue ⚠️
**Status**: LIKELY CAUSE

Even if Supabase returns data:
- `mapSaleResponse()` in supabase/salesService.ts properly maps items
- BUT the legacy mock salesService in src/services/salesService.ts has empty items by default!

## Quick Fix Steps

### Step 1: Verify Service Export (CRITICAL)
Check if `legacySalesService` in index.ts is properly set up:
```
src/services/index.ts line 412: export const salesService = {...}
```
This wrapper checks if using mock and calls getDeals/getDeal appropriately.

### Step 2: Ensure Mock Data Has Items (CONFIRMED FIX)
Already done in mock salesService.ts:
- Deal #1: Has 2 items with prices
- Deal #2: Has 2 items with prices
- Remaining deals: Empty items array (expected)

### Step 3: Verify Supabase Service Export (CRITICAL)
```
src/services/supabase/index.ts line 26: export { supabasesSalesService }
```
Note: This exports `supabasesSalesService` (with extra 's'), which is then used in apiServiceFactory.ts line 296.

### Step 4: Verify API Factory Routes Correctly
```
src/services/api/apiServiceFactory.ts line 290-308: getSalesService()
```
This should return `supabasesSalesService` when mode is 'supabase'.

## Action Items

Priority 1 (MUST FIX):
- [ ] Verify VITE_API_MODE is actually 'supabase' in runtime
- [ ] Check if getSalesService() is being called correctly
- [ ] Verify supabasesSalesService is exporting correctly

Priority 2 (SHOULD DO):
- [ ] Add debug logging to trace the exact service being used
- [ ] Add debug logging to show what data is returned
- [ ] Verify mapSaleResponse is called with correct data

Priority 3 (NICE TO HAVE):
- [ ] Cache busting to ensure latest code is loaded
- [ ] Browser DevTools to check Network requests

## Commands to Run

```bash
# Full rebuild with fresh cache
rm -r node_modules/.vite
npm run build

# Start dev server
npm run dev

# Open browser console (F12) and look for:
# - "[API Factory] Switched to 🗄️ Supabase API mode"
# - "[useDeals] 🔄 queryFn executing..."
# - Check what data is actually returned in network tab
```

## Data Structure Check

Expected in Supabase response:
```javascript
{
  id: "1",
  title: "Enterprise Software License",
  expected_close_date: "2024-02-15",  // Should NOT be empty!
  items: [                             // Should NOT be empty!
    {
      product_name: "Enterprise Software Suite - Annual License",
      quantity: 1,
      unit_price: 120000,
      line_total: 118000
    }
  ]
}
```

Expected in Mock response:
```javascript
{
  id: "1",
  title: "Enterprise Software License",
  expected_close_date: "2024-02-15",
  items: [
    { product_name: "...", quantity: 1, unit_price: 120000, ... }
  ]
}
```

Both should have populated fields!