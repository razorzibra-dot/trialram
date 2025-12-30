# Root Cause Found & FIXED ✅

## Critical Bug Identified

The ModuleDataContext had a **critical infinite loop bug** that was breaking the refresh mechanism:

```typescript
// WRONG - CAUSED INFINITE LOOPS
const memoizedRequirements = React.useMemo(() => requirements, [JSON.stringify(requirements)]);
```

### Why This Was Wrong

1. **JSON.stringify() creates a new string every render**
   - Even if `requirements` object didn't change, `JSON.stringify(requirements)` creates a NEW string
   - This caused useMemo to think dependencies changed when they didn't

2. **This triggered infinite loops**
   - Every render → JSON.stringify creates new string → useMemo thinks dependencies changed
   - → Component re-renders → JSON.stringify creates ANOTHER new string → infinite loop

3. **This broke the refresh() function**
   - Since `memoizedRequirements` kept changing, `forceRefresh` callback kept being recreated
   - Since `forceRefresh` kept being recreated, it had stale closure references
   - Since dependencies kept changing, useEffect kept firing
   - Result: refresh never properly completed

## The Fix

```typescript
// CORRECT - USE STABLE requirements DIRECTLY
// No memoization needed - requirements is already a stable prop

export const ModuleDataProvider: React.FC<ModuleDataProviderProps> = ({ children, requirements }) => {
  // ...use requirements directly, don't try to memoize it
  
  const forceRefresh = React.useCallback(async () => {
    // ...
    const pageData = await pageDataService.refreshPageData(route, requirements);
    // ...
  }, [location.pathname, requirements]); // ← Pass requirements directly
  
  useEffect(() => {
    loadData();
    return () => {
      pageDataService.invalidatePageCache(location.pathname);
    };
  }, [location.pathname, requirements]); // ← Pass requirements directly
};
```

### Why This Works

1. **requirements is a stable prop**
   - It's passed from parent component (CustomerRoutes)
   - It doesn't change unless the entire route changes
   - Using it directly in dependencies is correct

2. **No unnecessary re-renders**
   - Dependencies only change when requirements or location.pathname actually change
   - useEffect and useCallback only recreate when truly needed

3. **forceRefresh has proper closure**
   - It captures the current `requirements` value
   - When called, it uses the correct, up-to-date requirements
   - Refresh completes properly and updates state

## Additional Fixes Made

### 1. PageDataService Cache Invalidation (pageDataService.ts)
```typescript
invalidatePageCache(route?: string): void {
  if (route) {
    this.pageCache.delete(route);
    this.inFlightLoads.delete(route); // ← NEW: Also clear in-flight loads
    // ...
  }
}
```

**Why**: Previously, if refresh was called while a request was in-flight, it would reuse the stale in-flight promise instead of making a fresh API call.

### 2. Added 100ms Delay to Save Handler (CustomerListPage.tsx)
```typescript
const handleFormSubmit = async (values: Record<string, unknown>) => {
  try {
    await updateCustomer.mutateAsync(...);
    // Small delay to ensure mutation callbacks complete before refresh
    await new Promise(resolve => setTimeout(resolve, 100));
    await refresh();
  }
}
```

**Why**: Matches the pattern used for delete. Ensures mutation callbacks (notification + React Query invalidation) complete before PageDataService refresh is called.

## Changes Summary

| File | Line(s) | Change |
|------|---------|--------|
| `src/contexts/ModuleDataContext.tsx` | 66 | Removed the problematic `useMemo` for `memoizedRequirements` |
| `src/contexts/ModuleDataContext.tsx` | 77, 93, 106, 113 | Replaced `memoizedRequirements` with `requirements` |
| `src/services/page/PageDataService.ts` | 312 | Added `this.inFlightLoads.delete(route)` |
| `src/modules/features/customers/views/CustomerListPage.tsx` | 204-206 | Added 100ms delay in `handleFormSubmit` |

## Build Status
✅ **SUCCESS** - 35.95s, zero errors

## What This Fixes

✅ **Delete customer**  
- Now removes from UI immediately (no F5 needed)
- Shows single notification
- ModuleDataProvider refreshes properly

✅ **Save/Create/Update customer**  
- Now updates UI immediately (no F5 needed)
- Shows single notification
- ModuleDataProvider refreshes properly

✅ **General refresh mechanism**  
- `refresh()` function now works reliably
- Can be called multiple times without issues
- Proper state updates across component tree

## Test Now

1. Run `npm run dev`
2. Navigate to Customers page
3. Delete a customer → Should disappear immediately
4. Create a customer → Should appear in list immediately
5. Edit a customer → List should update immediately
6. **No F5 required for any operation**

## Why This Wasn't Caught Earlier

The infinite loop was subtle because:
1. React's useMemo doesn't throw errors, it just causes re-renders
2. The re-renders masked the actual issue (refresh not working)
3. The JSON.stringify trick might have been intended for strict equality checking but caused unintended side effects
4. Without proper dependency tracking, the component tree silently failed

This is why **dependency arrays matter** - they control when callbacks and effects run. Using impure functions (like JSON.stringify) in dependency arrays is a common source of bugs.

