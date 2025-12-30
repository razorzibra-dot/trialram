# 🔍 Mutation Refresh Diagnostic Guide

## Expected Console Output Flow

When you **delete or save a customer**, you should see this **exact sequence** in the console:

### ✅ EXPECTED FLOW

```
1. [Customer] 🗑️ DELETE started for ID: xxx
2. [Customer] ✅ Delete mutation completed
3. [Customer] ⏱️ Waiting 150ms for cache invalidation...
4. [Customer] ⏱️ Wait complete
5. [Customer] 🔄 Calling refresh()...
6. [ModuleDataProvider] 🔄 forceRefresh called at 2025-12-29T...
7. [ModuleDataProvider] 📍 Current route: /tenant/customers
8. [ModuleDataProvider] 📞 Calling pageDataService.refreshPageData...
9. [PageDataService] 🔄 refreshPageData called for route: /tenant/customers
10. [PageDataService] 🔄 Cache invalidated, now loading fresh data...
11. [PageDataService] 📄 Loading data for route: /tenant/customers
12. [PageDataService] 🚀 Starting coordinated batch load for: /tenant/customers
13. [PageDataService] ⚡ Loading 2 data sets in parallel for: /tenant/customers
14. [PageDataService] ✅ Page data loaded in one batch for: /tenant/customers
15. [PageDataService] ✅ Fresh data loaded for route: /tenant/customers {hasCustomers: true, customersCount: X}
16. [ModuleDataProvider] ✅ Got fresh page data: {customersCount: X, customersIsArray: true}
17. [ModuleDataProvider] 🔧 Calling setData to update React state...
18. [ModuleDataProvider] ✅ setData called, state should update now
19. [Customer] ✅ Refresh completed
```

### 🚨 DIAGNOSTIC QUESTIONS

Use this checklist based on console output:

#### Q1: Does step 1-5 appear?
- ✅ YES → Mutation hook is working
- ❌ NO → Check if useEntityMutationWithRefresh is being called

#### Q2: Does step 6-8 appear?
- ✅ YES → refresh() function is being called
- ❌ NO → Check if refresh prop is passed to the hook

#### Q3: Does step 9-11 appear?
- ✅ YES → PageDataService.refreshPageData is executing
- ❌ NO → Check if pageDataService is imported correctly

#### Q4: Does step 12-15 appear?
- ✅ YES → Fresh data is being loaded from services
- ❌ NO → Check if customerService.findMany() is working

#### Q5: In step 15, is customersCount correct?
- ✅ YES (count decreased after delete) → Service returning fresh data
- ❌ NO (count unchanged) → Service may be returning cached/stale data

#### Q6: In step 16, is customersIsArray: true?
- ✅ YES → Data format is correct
- ❌ NO → PageDataService extracting wrong format (check line 267-290)

#### Q7: Does step 17-18 appear?
- ✅ YES → setData is being called
- ❌ NO → Error in ModuleDataProvider before setData

#### Q8: After step 19, does UI update?
- ✅ YES → **WORKING CORRECTLY** 🎉
- ❌ NO → React not detecting state change (see troubleshooting below)

---

## 🐛 Troubleshooting Steps

### Issue: Steps 1-5 appear, but 6-19 missing

**Problem:** refresh() function not being called  
**Check:**
```typescript
// In CustomerListPage, verify:
const { refresh } = useModuleData();  // ✅ Should be present
const { handleDelete } = useEntityMutationWithRefresh({
  deleteMutation: deleteCustomer,
  refresh,  // ✅ Must be passed here
  entityName: 'Customer',
});
```

---

### Issue: customersCount is wrong in step 15

**Problem:** Service returning stale/cached data  
**Check:**
1. Verify customerService has cache invalidation
2. Check if `pageDataService.invalidatePageCache(route)` is called (step 10)
3. Check if `this.inFlightLoads.delete(route)` is called in PageDataService

**Fix:** Clear all caches manually:
```javascript
// In browser console
sessionStorage.clear();
location.reload();
```

---

### Issue: customersIsArray: false in step 16

**Problem:** PageDataService not extracting data array properly  
**Check:** Line 267-290 in PageDataService.ts should have:
```typescript
customerService.findMany({ pageSize: 500, offset: 0 }).then(result => {
  return Array.isArray(result) ? result : (result?.data || []);
})
```

---

### Issue: Steps 1-19 all appear correctly, but UI doesn't update

**Problem:** React not detecting state change  
**Possible Causes:**

1. **Component not subscribed to moduleData:**
```typescript
// In CustomerListPage, verify:
const { data: moduleData } = useModuleData();  // ✅ Must be present
```

2. **Memo dependency not including moduleData:**
```typescript
// Check:
const customersList = useMemo(() => {
  // ... extract customers
}, [customersResponse]);  // ✅ customersResponse must come from moduleData
```

3. **Component rendering cached data:**
```typescript
// Add to CustomerListPage temporarily:
useEffect(() => {
  console.log('🔍 moduleData changed:', {
    hasData: !!moduleData,
    customersCount: moduleData?.moduleData?.customers?.length
  });
}, [moduleData]);
```

---

### Issue: Console shows error at step 6-8

**Common Errors:**

**Error:** "Cannot read property 'refreshPageData' of undefined"  
**Fix:** Ensure pageDataService is imported:
```typescript
import { pageDataService } from '@/services/page/PageDataService';
```

**Error:** "requirements is not defined"  
**Fix:** Check ModuleDataProvider has requirements prop:
```typescript
<ModuleDataProvider requirements={{ session: true, module: { customers: true, users: true } }}>
```

---

## 🧪 Manual Testing Steps

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Open DevTools Console** (F12)
3. **Clear console** (Ctrl+L or trash icon)
4. **Delete a customer**
5. **Watch console output**
6. **Compare with expected flow above**
7. **Note which step fails**
8. **Use diagnostic questions**

---

## 📊 What Each Step Means

| Step | Component | What It Does |
|------|-----------|--------------|
| 1-2 | useEntityMutationWithRefresh | Executes delete mutation |
| 3-4 | useEntityMutationWithRefresh | Waits for React Query cache clear |
| 5 | useEntityMutationWithRefresh | Calls refresh() |
| 6-8 | ModuleDataContext | Receives refresh request |
| 9 | PageDataService | Starts refresh process |
| 10 | PageDataService | Clears in-memory + sessionStorage cache |
| 11-14 | PageDataService | Loads fresh data from API |
| 15 | PageDataService | Returns fresh data with count |
| 16 | ModuleDataContext | Receives fresh data |
| 17-18 | ModuleDataContext | Updates React state via setData |
| 19 | useEntityMutationWithRefresh | Confirms refresh complete |

---

## 🔧 Quick Fix Commands

If nothing works, try these in order:

### 1. Clear All Caches
```javascript
// Browser console
sessionStorage.clear();
localStorage.clear();
location.reload();
```

### 2. Enable Debug Logging
```typescript
// src/services/page/PageDataService.ts (line 37)
const DEBUG_LOGGING = true;  // Change to true

// src/contexts/ModuleDataContext.tsx (line 12)
const DEBUG_LOGGING = true;  // Change to true
```

### 3. Increase Wait Time
```typescript
// src/hooks/useEntityMutationWithRefresh.ts
const { handleDelete } = useEntityMutationWithRefresh({
  // ...
  waitTimeMs: 300,  // Increase from 150ms to 300ms
});
```

---

## ✅ Success Indicators

You know it's working when:

1. ✅ Console shows all 19 steps
2. ✅ customersCount decreases by 1 after delete
3. ✅ customersIsArray: true in step 16
4. ✅ Deleted customer disappears from table
5. ✅ No F5 refresh needed
6. ✅ No error messages in console

---

**Next Step:** Test delete operation and share the console output here if it's not working.
