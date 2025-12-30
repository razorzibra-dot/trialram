# Customer Deletion Issue - Debugging Guide

If customer deletion still requires F5 refresh after applying the fixes, use this guide to diagnose the root cause.

---

## Browser Developer Tools Checklist

### 1. Check Network Tab
- [ ] Delete API call succeeds (200 response)
- [ ] No additional API calls are made after delete
- [ ] No error responses from backend

**Debug**: Open DevTools → Network tab → Delete customer → Check response

---

### 2. Check Console for Errors

**Expected Console Output**:
```
[PageDataService] 📄 Loading data for route: /tenant/customers
[PageDataService] ♻️ Using cached data for route: /tenant/customers
[PageDataService] 🚀 Starting coordinated batch load for: /tenant/customers
[PageDataService] ✅ Page data loaded in one batch for: /tenant/customers
[ModuleDataProvider] Error refreshing page data: (if error)
```

**Red Flags**:
- ❌ `[ModuleDataProvider] Error refreshing page data:`
- ❌ `Cannot read property 'customers' of undefined`
- ❌ Unhandled promise rejections

**Debug**: Open DevTools → Console → Delete customer → Review output

---

### 3. Check Notifications

**Expected**:
- ✅ ONE notification: "Customer deleted successfully"

**If Issue**:
- ❌ TWO notifications → Duplicate from drawer (should be fixed)
- ❌ ZERO notifications → showSuccessNotification is false
- ❌ Error notification instead → Delete mutation failed

**Debug**: Delete customer → Watch notification area

---

### 4. Check React Query DevTools

**Setup** (if not installed):
```bash
npm install @tanstack/react-query-devtools --save-dev
```

**Add to App.tsx**:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function App() {
  return (
    <>
      {/* ... */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

**Debug Steps**:
1. Delete customer
2. Open React Query DevTools (bottom right corner)
3. Look for `customers` query
4. Check "Observers" → should see 0 (indicates invalidation worked)
5. Check "Cache Time" → should be recent time (just invalidated)

**Red Flags**:
- ❌ Query still shows data after deletion
- ❌ No invalidation occurred
- ❌ Query shows error state

---

## Code-Level Debugging

### 1. Add Console Logs to Delete Handler

**File**: `src/modules/features/customers/views/CustomerListPage.tsx`

```typescript
const handleDelete = async (customer: Customer) => {
  console.log('[DELETE] Starting delete for:', customer.id);
  try {
    console.log('[DELETE] Calling deleteCustomer.mutateAsync...');
    await deleteCustomer.mutateAsync(customer.id);
    console.log('[DELETE] Delete mutation completed');
    
    // Small delay to ensure mutation callbacks complete before refresh
    console.log('[DELETE] Waiting 100ms for callbacks...');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[DELETE] 100ms delay complete, calling refresh()...');
    
    console.log('[DELETE] Calling refresh()...');
    await refresh();
    console.log('[DELETE] Refresh completed!');
  } catch (error) {
    console.error('[DELETE] Delete failed:', error);
  }
};
```

**Expected Output**:
```
[DELETE] Starting delete for: uuid-here
[DELETE] Calling deleteCustomer.mutateAsync...
[DELETE] Delete mutation completed
[DELETE] Waiting 100ms for callbacks...
[PageDataService] 🚀 Starting coordinated batch load for: /tenant/customers
[DELETE] 100ms delay complete, calling refresh()...
[DELETE] Calling refresh()...
[PageDataService] ✅ Page data loaded in one batch for: /tenant/customers
[DELETE] Refresh completed!
```

---

### 2. Add Logging to ModuleDataContext

**File**: `src/contexts/ModuleDataContext.tsx`

```typescript
const forceRefresh = async () => {
  try {
    console.log('[ModuleDataContext] Force refresh started');
    setIsLoading(true);
    setError(null);
    const route = location.pathname;
    console.log('[ModuleDataContext] Calling refreshPageData for route:', route);
    const pageData = await pageDataService.refreshPageData(route, requirements);
    console.log('[ModuleDataContext] Got new pageData:', pageData);
    console.log('[ModuleDataContext] Setting data (will trigger re-render)...');
    setData(pageData);
    console.log('[ModuleDataContext] Data set complete');
  } catch (err) {
    console.error('[ModuleDataContext] Error refreshing page data:', err);
    setError(err instanceof Error ? err : new Error('Failed to refresh page data'));
  } finally {
    setIsLoading(false);
  }
};
```

**Expected Output**:
```
[ModuleDataContext] Force refresh started
[ModuleDataContext] Calling refreshPageData for route: /tenant/customers
[PageDataService] 🧹 Invalidated cache for: /tenant/customers
[PageDataService] 🚀 Starting coordinated batch load for: /tenant/customers
[PageDataService] ✅ Page data loaded in one batch for: /tenant/customers
[ModuleDataContext] Got new pageData: {data object}
[ModuleDataContext] Setting data (will trigger re-render)...
[ModuleDataContext] Data set complete
```

---

### 3. Add Logging to Component Render

**File**: `src/modules/features/customers/views/CustomerListPage.tsx`

```typescript
export const CustomerListPageEnhanced: React.FC<...> = (...) => {
  const { data: moduleData, ... } = useModuleData();
  const customersResponse = moduleData?.moduleData?.customers;
  
  console.log('[CustomerList] Component render:', {
    moduleDataExists: !!moduleData,
    customersResponseLength: Array.isArray(customersResponse) ? customersResponse.length : 'not-array',
    customersResponseType: typeof customersResponse,
  });
  
  const customersList = useMemo(() => {
    const result = /* ... existing logic ... */;
    console.log('[CustomerList] customersList memoized:', {
      length: result.length,
      firstItem: result[0]?.id,
    });
    return result;
  }, [customersResponse]);
  
  // ... rest of component
};
```

**Expected Output After Delete**:
```
[CustomerList] Component render: {
  moduleDataExists: true,
  customersResponseLength: 9,  // One less than before
  customersResponseType: "object"
}
[CustomerList] customersList memoized: {
  length: 9,
  firstItem: "uuid-of-first-customer"
}
```

---

## Diagnostic Flowchart

```
Delete Customer Button Clicked
  │
  ├─ Check: Delete API call succeeds?
  │  ├─ ❌ NO → Backend issue, not UI caching
  │  └─ ✅ YES → Continue
  │
  ├─ Check: Notification appears?
  │  ├─ ❌ NO → showSuccessNotification might be false
  │  ├─ ❌ TWO → Detail drawer not removed (should be fixed)
  │  └─ ✅ YES (1) → Continue
  │
  ├─ Check: React Query invalidation fired?
  │  ├─ ❌ NO → Check queryKeys match in factory
  │  ├─ ❌ NO → Check exact: false is applied
  │  └─ ✅ YES → Continue
  │
  ├─ Check: PageDataService refresh called?
  │  ├─ ❌ NO → refresh() function not wired up correctly
  │  ├─ ❌ NO → ModuleDataContext not providing refresh
  │  └─ ✅ YES → Continue
  │
  ├─ Check: customerService.findMany() called?
  │  ├─ ❌ NO → Refresh might have failed
  │  ├─ ❌ NO → Requirements might not include customers
  │  └─ ✅ YES → Continue
  │
  ├─ Check: New data returned from API?
  │  ├─ ❌ NO → Customer still in database (check backend)
  │  └─ ✅ YES (no deleted customer) → Continue
  │
  ├─ Check: setData() called in ModuleDataContext?
  │  ├─ ❌ NO → Refresh completed but state not updated
  │  └─ ✅ YES → Continue
  │
  └─ Check: Component re-rendered with new data?
     ├─ ❌ NO → Memo dependencies might be wrong
     ├─ ❌ NO → customersResponse not properly extracted
     └─ ✅ YES (deleted customer gone) → SUCCESS!
```

---

## Common Issues & Fixes

### Issue 1: "Refresh completed but UI didn't update"

**Symptom**: Console shows `[DELETE] Refresh completed!` but customer still in table

**Cause**: Component memo dependencies are wrong

**Fix**: Check `customersList` useMemo dependencies:
```typescript
// WRONG
const customersList = useMemo(() => {
  // ...
}, []); // Missing customersResponse dependency!

// CORRECT
const customersList = useMemo(() => {
  // ...
}, [customersResponse]); // Includes customersResponse
```

---

### Issue 2: "ModuleDataContext refresh throws error"

**Symptom**: Console shows `[ModuleDataContext] Error refreshing page data:`

**Cause**: PageDataService.refreshPageData() failed

**Possible Reasons**:
1. `requirements` object is missing `module: { customers: true }`
2. `customerService.findMany()` threw an error
3. Customer is missing from response after deletion (backend issue)

**Debug**:
```typescript
// Add to ModuleDataContext
const forceRefresh = async () => {
  try {
    console.log('[ModuleDataContext] Requirements:', requirements);
    const pageData = await pageDataService.refreshPageData(route, requirements);
  } catch (err) {
    console.error('[ModuleDataContext] Full error:', err);
    if (err instanceof Error) {
      console.error('[ModuleDataContext] Error message:', err.message);
      console.error('[ModuleDataContext] Stack:', err.stack);
    }
  }
};
```

---

### Issue 3: "Two notifications still appearing"

**Symptom**: Two "Customer deleted successfully" messages show

**Cause**: Detail drawer notification not removed (should be fixed)

**Fix**: Verify line 133 in `CustomerDetailDrawer.tsx` is removed:
```typescript
// This line should NOT exist:
// message.success('Customer deleted successfully');
```

---

### Issue 4: "Delete works sometimes, not always"

**Symptom**: Refresh works randomly, sometimes fails

**Cause**: Race condition - 100ms delay might be too short in slow networks

**Fix**: Increase delay temporarily for testing:
```typescript
// Increase to 500ms for slow networks
await new Promise(resolve => setTimeout(resolve, 500));
```

If this fixes it, the issue is timing. Check:
- Network latency (DevTools → Network)
- Server response time
- Browser performance (DevTools → Performance)

---

## Performance Analysis

### Check Cache Hit Rate

Add to PageDataService (temporary debugging):

```typescript
private cacheHits = 0;
private cacheMisses = 0;

async loadPageData(route: string, requirements: PageDataRequirements): Promise<PageData> {
  const cached = this.pageCache.get(route);
  if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
    this.cacheHits++;
    console.log(`[PageDataService] Cache stats: hits=${this.cacheHits}, misses=${this.cacheMisses}, hitRate=${(this.cacheHits/(this.cacheHits+this.cacheMisses)*100).toFixed(1)}%`);
    return cached.data;
  }
  this.cacheMisses++;
  // ...
}
```

Expected behavior after delete:
- Delete triggers cache miss → fresh data loaded → customer removed ✅

---

## Still Stuck?

If none of the above helps, collect:

1. **Browser console logs** (copy full output after delete)
2. **Network tab screenshot** (show API calls)
3. **React Query DevTools state** (show query cache)
4. **Chrome DevTools Recorder** (record the delete action)
5. **Specific error messages** (full stack traces)

Create a new issue with this information for detailed support.

---

## Quick Test Script

Add this to browser console to quickly test the delete flow:

```javascript
// Paste into browser console on Customers page
console.log('=== CUSTOMER DELETE TEST ===');
console.log('1. Look for console logs starting with [DELETE]');
console.log('2. Should see: [DELETE] Refresh completed!');
console.log('3. Customer should disappear from table');
console.log('4. One notification should appear');
console.log('');
console.log('Ready? Click delete on any customer now...');
console.log('');
console.log('=== POST-DELETE CHECKS ===');

// After delete completes, run:
console.log('Check 1: moduleData exists?', !!document.querySelector('[data-testid="customer-table"]'));
console.log('Check 2: Table visible?', !!document.querySelector('table'));
console.log('Check 3: Notification visible?', !!document.querySelector('.ant-notification'));

// Copy console output and share for debugging
```

---

