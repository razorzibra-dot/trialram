# React Query Quick Reference Guide

**TL;DR**: Follow these patterns for consistent, bug-free React Query implementation.

---

## 🚀 Quick Start: Which Pattern to Use?

```
┌─ Is it simple data fetching?
│  └─ YES → Use Pattern A (Direct React Query)
│     └─ NO → Continue
├─ Are you syncing with Zustand store?
│  └─ YES → Use Pattern B (Custom Wrapper)
│     └─ NO → Use Pattern A
├─ Is it just local state (no server)?
│  └─ YES → Use Pattern C (Custom Hooks)
     └─ NO → Pattern A or B
```

---

## Pattern A: Direct React Query (Recommended)

**When to use**: Dashboard, Tickets, Contracts, Sales, JobWorks, Masters

### Query Hook Template

```typescript
import { useQuery } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';

// 1. Create query keys
export const myFeatureKeys = {
  all: ['myFeature'] as const,
  lists: () => [...myFeatureKeys.all, 'list'] as const,
  list: (filters: MyFilters) => [...myFeatureKeys.lists(), filters] as const,
  details: () => [...myFeatureKeys.all, 'detail'] as const,
  detail: (id: string) => [...myFeatureKeys.details(), id] as const,
  stats: () => [...myFeatureKeys.all, 'stats'] as const,
};

// 2. Create query hook
export const useMyFeatureList = (filters: MyFilters = {}) => {
  const service = useService<MyService>('myService');
  const { setData } = useMyStore(); // If using Zustand

  return useQuery({
    queryKey: myFeatureKeys.list(filters),
    queryFn: async () => {
      const result = await service.getList(filters);
      setData(result.data);              // Update store
      return result;
    },
    staleTime: 5 * 60 * 1000,           // 5 minutes
    gcTime: 10 * 60 * 1000,             // 10 minutes
  });
};

// 3. Create detail hook
export const useMyFeatureDetail = (id: string) => {
  const service = useService<MyService>('myService');
  const { setSelected } = useMyStore();

  return useQuery({
    queryKey: myFeatureKeys.detail(id),
    queryFn: async () => {
      const item = await service.getById(id);
      setSelected(item);
      return item;
    },
    enabled: !!id,                      // Only run if id exists
    staleTime: 5 * 60 * 1000,
  });
};

// 4. Create mutation hooks
export const useCreateMyFeature = () => {
  const queryClient = useQueryClient();
  const service = useService<MyService>('myService');
  const { addItem } = useMyStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMyFeatureData) => service.create(data),
    onSuccess: (newItem) => {
      addItem(newItem);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: myFeatureKeys.lists() });
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create',
        variant: 'destructive',
      });
    },
  });
};
```

✅ **Modules using this pattern**: Dashboard, Tickets, Contracts, Sales, JobWorks, Masters

---

## Pattern B: Custom Wrapper (With Deduplication)

**When to use**: Complex state sync with Zustand + automatic deduplication needed (like Customers)

### Query Hook Template

```typescript
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';
import { useService } from '@/modules/core/hooks/useService';

// Uses same query key structure
export const myFeatureKeys = { /* ... */ };

// Use custom wrapper instead of direct React Query
export const useMyFeatureList = (filters: MyFilters = {}) => {
  const service = useService<MyService>('myService');
  const { setData } = useMyStore();
  const { isInitialized } = useTenantContext(); // If needed

  return useQuery(
    myFeatureKeys.list(filters),
    () => service.getList(filters),
    {
      enabled: isInitialized,           // Conditional execution
      onSuccess: (data) => {
        setData(data.data);             // Update store
      },
      onError: (error) => {
        // Error handling
        console.error('Failed to fetch:', error);
      },
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Mutations are similar but use invalidate helper
export const useCreateMyFeature = () => {
  const { invalidate } = useInvalidateQueries();
  const service = useService<MyService>('myService');
  const { addItem } = useMyStore();

  return useMutation(
    (data: CreateMyFeatureData) => service.create(data),
    {
      onSuccess: (newItem) => {
        addItem(newItem);
        invalidate(myFeatureKeys.lists());  // Refetch lists
      },
      showSuccessNotification: true,
      successMessage: 'Item created successfully',
    }
  );
};
```

✅ **Modules using this pattern**: Customers (Primary implementation)

**Key Differences**:
- ✅ Automatic callback deduplication
- ✅ Built-in error notifications
- ✅ Cache management helpers
- ⚠️ Use only when needed (extra overhead)

---

## Pattern C: Custom Hooks (No React Query)

**When to use**: Configuration tests, simple state management without server caching

```typescript
import { useState, useCallback } from 'react';

export const useMyFeature = (options = {}) => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.execute(params);
      setResult(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, execute };
};
```

✅ **Modules using this pattern**: Configuration Tests

---

## 📋 Configuration Checklist

### For Every Query Hook

- [ ] Define query keys (lists, list, details, detail, stats)
- [ ] Check `queryKey` includes all filter parameters
- [ ] Set `staleTime` (usually 5-10 minutes)
- [ ] Set `gcTime` (usually 10 minutes)
- [ ] Use `enabled` flag for conditional queries
- [ ] Handle `onSuccess` to update store if needed
- [ ] Handle `onError` for error display
- [ ] Update store from `queryFn` (Pattern A) OR `onSuccess` (Pattern B)

### For Every Mutation Hook

- [ ] Call `queryClient.invalidateQueries()` on success
- [ ] Show success/error toast
- [ ] Update local store if needed
- [ ] Handle error cases gracefully
- [ ] Disable button during mutation (`isPending` state)

---

## 🐛 Debugging Console Logs

When something isn't working, check browser console (F12) for these patterns:

```
✅ onSuccess FIRED (React Query)      → Good: callback fired once
🔄 FALLBACK: Calling manually          → OK: fallback stepped in
⭐ Query state - isLoading: true       → Expected: loading state
[useQuery wrapper] Creating query     → Debug: hook initialized
```

**Red Flags** (Should NOT see):
- Multiple `✅ onSuccess FIRED` messages → Duplicate callback firing 🚨
- Infinite `[useQuery wrapper]` logs → Infinite loop 🚨
- No success message, blank data → Query not executing 🚨

---

## 🔧 Common Issues & Fixes

### Issue 1: Data Not Loading
```javascript
// ❌ WRONG: Query not executing
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
  // Missing 'enabled' but it should auto-run
});

// ✅ RIGHT: Ensure query runs
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
  enabled: !!currentUser, // Only if user loaded
});
```

### Issue 2: Infinite Re-renders
```javascript
// ❌ WRONG: Function created on every render
const onSuccess = (data) => setStore(data);
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
  onSuccess, // This changes every render!
});

// ✅ RIGHT: Memoize callback
const onSuccess = useCallback(
  (data) => setStore(data),
  [setStore]
);
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
  onSuccess,
});
```

### Issue 3: Filters Not Applied
```javascript
// ❌ WRONG: Filter not in query key
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(filters),
  // Filter changes won't trigger new query!
});

// ✅ RIGHT: Include filters in key
return useQuery({
  queryKey: ['items', filters],
  queryFn: () => service.getItems(filters),
  // Now query re-runs when filters change
});
```

### Issue 4: Store Updates Not Syncing
```javascript
// ❌ WRONG: Store update in component, not callback
function MyComponent() {
  const { data } = useQuery({ /* ... */ });
  const { setData } = useStore();
  
  useEffect(() => {
    setData(data); // Side effect - not ideal
  }, [data]);
}

// ✅ RIGHT: Update in onSuccess
return useQuery({
  queryKey: ['items'],
  queryFn: () => service.getItems(),
  onSuccess: (data) => {
    setData(data); // Direct callback - better
  },
});
```

---

## 🎯 Performance Tips

### ✅ DO

- ✅ Use `staleTime` to reduce API calls
- ✅ Set `gcTime` appropriately
- ✅ Use `enabled` to skip unnecessary queries
- ✅ Memoize callbacks with `useCallback`
- ✅ Invalidate only affected queries
- ✅ Use query key factory for consistency

### ❌ DON'T

- ❌ Don't call `refetch()` too often
- ❌ Don't set `staleTime` to 0 (will always refetch)
- ❌ Don't create query keys dynamically
- ❌ Don't call service methods in components
- ❌ Don't duplicate query key definitions
- ❌ Don't forget to handle loading states

---

## 📊 Query Key Structure Example

```typescript
// Good structure:
const keys = {
  all: ['customers'] as const,                    // Feature root
  lists: () => [...keys.all, 'list'] as const,    // List queries
  list: (filters) => [...keys.lists(), filters],   // Specific list
  details: () => [...keys.all, 'detail'],          // Detail root
  detail: (id) => [...keys.details(), id],         // Specific detail
  stats: () => [...keys.all, 'stats'],             // Stats
};

// Usage:
queryKey: keys.list({ status: 'active', page: 1 })
// Result: ['customers', 'list', { status: 'active', page: 1 }]

// Invalidate all customer lists when updating
queryClient.invalidateQueries({ queryKey: keys.lists() })
// Matches: keys.list({...}), keys.list({...}), etc.
```

---

## 🚀 New Module Checklist

Creating a new feature module?

- [ ] Choose pattern (A, B, or C)
- [ ] Create query keys with factory
- [ ] Implement query hooks
- [ ] Implement mutation hooks
- [ ] Add to ServiceContainer
- [ ] Register service
- [ ] Write store if needed
- [ ] Test with F12 console
- [ ] Verify no infinite loops
- [ ] Check build succeeds
- [ ] Manual test in browser

---

## 📚 Reference Modules

Copy from these when creating new hooks:

| Module | Pattern | File |
|--------|---------|------|
| Customers | B (Wrapper) | `features/customers/hooks/useCustomers.ts` |
| Dashboard | A (Direct) | `features/dashboard/hooks/useDashboard.ts` |
| Tickets | A (Direct) | `features/tickets/hooks/useTickets.ts` |
| Contracts | A (Direct) | `features/contracts/hooks/useContracts.ts` |
| Sales | A (Direct) | `features/sales/hooks/useSales.ts` |

---

## 🆘 Need Help?

1. Check `REACT_QUERY_STANDARDIZATION_GUIDE.md` for detailed docs
2. Search for pattern in reference modules
3. Check console logs with F12
4. Look for similar pattern in existing code
5. Review `queryPatterns.ts` for utilities

---

## ✅ Final Checklist Before Commit

```
Code Quality:
- [ ] No TypeScript errors: npm run build
- [ ] No console warnings in dev
- [ ] Query keys follow factory pattern
- [ ] Callbacks use useCallback
- [ ] Filter parameters in query key
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Store sync verified

Testing:
- [ ] Data loads correctly
- [ ] No "No data" messages
- [ ] Filters work as expected
- [ ] Pagination works
- [ ] Create/Update/Delete succeed
- [ ] Error messages show
- [ ] No infinite loops (check console)
- [ ] Page can navigate away cleanly
```

---

**Status**: ✅ Complete and Production-Ready
**Last Updated**: 2024
**Pattern Version**: 2.0