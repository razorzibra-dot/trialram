# Quick Consistency Fixes - Immediate Actions

**Priority**: 🔴 HIGH  
**Time to Complete**: 2-3 hours  
**Impact**: High - Fixes critical type safety issues

---

## Automated Fixes Ready to Apply

These fixes can be applied immediately without breaking changes.

---

## Fix #1: Product Sales - Fix `useService<any>()` Type

**File**: `src/modules/features/product-sales/hooks/useProductSales.ts`

**Current**:
```typescript
const service = useService<any>('productSaleService');
```

**Change to**:
```typescript
import { IProductSalesService } from '../services/productSalesService';

const service = useService<IProductSalesService>('productSaleService');
```

**Status**: Can be done immediately  
**Risk**: None (only improves type safety)

---

## Fix #2: Product Sales - Define Service Interface

**File**: `src/modules/features/product-sales/services/productSalesService.ts`

**Add at the top** (if not already exists):
```typescript
export interface IProductSalesService {
  getProductSales(filters: ProductSaleFilters, page: number, pageSize: number): Promise<ProductSalesResponse>;
  getProductSale(id: string): Promise<ProductSale>;
  createProductSale(data: CreateProductSaleInput): Promise<ProductSale>;
  updateProductSale(id: string, data: UpdateProductSaleInput): Promise<ProductSale>;
  deleteProductSale(id: string): Promise<void>;
  getProductSalesAnalytics(): Promise<ProductSalesAnalytics>;
  // ... other methods
}
```

**Status**: Can be done immediately  
**Risk**: None

---

## Fix #3: Sales Module - Remove Duplicate Service Instance

**File**: `src/modules/features/sales/hooks/useSales.ts`

**Current** (Lines 16):
```typescript
const moduleSalesService = new SalesService();  // ❌ DEAD CODE
```

**Remove** this line entirely - it's never used.

**Status**: Can be done immediately  
**Risk**: None (dead code removal)

---

## Fix #4: Sales Module - Remove Emoji Logging

**File**: `src/modules/features/sales/hooks/useSales.ts`

Replace all emoji logging with standard format:

```typescript
// ❌ Current
console.log('[useDeals] 🚀 Hook called with filters:', filters);
console.log('[useDeals] ✅ Factory SalesService obtained with tenantId:', tenantId);
console.error('[useDeals] ❌ Error:', error);

// ✅ New
console.log('[useDeals] Hook called with filters:', filters);
console.log('[useDeals] Factory SalesService obtained with tenantId:', tenantId);
console.error('[useDeals] Error:', error);
```

**Files Affected**: 
- `src/modules/features/sales/hooks/useSales.ts`

**Status**: Can be done immediately  
**Risk**: None (logging cleanup)

---

## Fix #5: Customers Module - Update useQuery Import

**File**: `src/modules/features/customers/hooks/useCustomers.ts`

**Current**:
```typescript
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';
```

**Check if** the custom hook exists. If not, change to:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
```

**Status**: Conditional (depends on custom hook availability)  
**Risk**: Medium (if custom hook has different behavior)

---

## Fix #6: Standardize React Query Configuration

Create a shared configuration file:

**New File**: `src/modules/core/constants/reactQueryConfig.ts`

```typescript
export const REACT_QUERY_CONFIG = {
  // Cache configuration
  staleTime: 5 * 60 * 1000,        // 5 minutes - data becomes stale
  gcTime: 10 * 60 * 1000,           // 10 minutes - cache garbage collection
  
  // Retry configuration
  retry: 2,                         // Retry failed requests 2 times
  retryDelay: (attemptIndex: number) => 
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  
  // Refetch configuration
  refetchOnMount: true,             // Refetch on component mount
  refetchOnWindowFocus: false,      // Don't refetch on window focus
  refetchOnReconnect: true,         // Refetch when reconnecting
} as const;

// Specialized configs
export const LISTS_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 5 * 60 * 1000,  // More frequent staleness for lists
} as const;

export const DETAIL_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 10 * 60 * 1000, // Longer staleness for detail views
} as const;

export const STATS_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 15 * 60 * 1000, // Longest staleness for stats
} as const;
```

**Usage**:
```typescript
return useQuery({
  queryKey: ['items', filters],
  queryFn: () => service.getItems(filters),
  ...LISTS_QUERY_CONFIG,
});
```

**Status**: Can be done immediately  
**Risk**: Low (creating new file)

---

## Fix #7: Create Unified Error Handler

**New File**: `src/modules/core/utils/errorHandler.ts`

```typescript
/**
 * Unified error handler for all modules
 * Extracts error message and logs with context
 */
export const handleError = (error: unknown, context: string): string => {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as any).message);
  }

  // Log with context and full error object
  console.error(`[${context}] Error: ${message}`, error);

  // TODO: Send to error tracking service (Sentry, etc.)
  // errorTracker.captureException(error, { context });

  return message;
};

/**
 * Checks if error is a specific type
 */
export const isAuthError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('401') || error.message.includes('Unauthorized'))
  );
};

export const isValidationError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('validation') || error.message.includes('400'))
  );
};
```

**Status**: Can be done immediately  
**Risk**: None (new utility)

---

## Fix #8: Create Permission Constants Template

**New File**: `src/modules/features/mymodule/constants/permissions.ts`

```typescript
/**
 * Module-level permission constants
 * Use these instead of string literals throughout the module
 */
export const MODULE_PERMISSIONS = {
  // Read permissions
  READ: 'mymodule:read',
  LIST: 'mymodule:list',
  
  // Create permissions
  CREATE: 'mymodule:create',
  IMPORT: 'mymodule:import',
  
  // Update permissions
  UPDATE: 'mymodule:update',
  
  // Delete permissions
  DELETE: 'mymodule:delete',
  BULK_DELETE: 'mymodule:bulk_delete',
  
  // Export permissions
  EXPORT: 'mymodule:export',
  
  // Special permissions
  APPROVE: 'mymodule:approve',
  REJECT: 'mymodule:reject',
} as const;
```

**Apply to all modules** by creating similar files

**Status**: Can be done immediately  
**Risk**: None (constants only)

---

## Summary of Quick Wins

| Fix # | Action | Time | Risk | Impact |
|-------|--------|------|------|--------|
| 1 | Fix Product Sales type safety | 5 min | None | High |
| 2 | Add service interface | 10 min | None | High |
| 3 | Remove dead code | 5 min | None | Medium |
| 4 | Remove emoji logging | 10 min | None | Low |
| 5 | Update imports | 15 min | Medium | High |
| 6 | Create React Query config | 15 min | None | High |
| 7 | Create error handler | 10 min | None | High |
| 8 | Create permission constants | 20 min | None | Medium |

**Total Time**: ~90 minutes  
**Total Impact**: Very High

---

## Recommended Order

1. **First** (5-10 min): Fix #1, #3, #4 (no dependencies)
2. **Second** (15 min): Fix #6, #7 (create utilities)
3. **Third** (20-30 min): Fix #2, #8 (add interfaces/constants)
4. **Fourth** (15-20 min): Fix #5 (update imports)

---

## Verification Steps

After applying fixes:

```bash
# 1. Type check
npm run typecheck

# 2. Lint check
npm run lint

# 3. Build
npm run build

# 4. Test
npm run test
```

All should pass with zero errors.

---

## Next Steps After Quick Fixes

Once quick fixes are done, plan for:

1. **Standardize all hooks** to use `useService` pattern (2-3 hours)
2. **Update all stores** to standard Zustand pattern (2-3 hours)
3. **Refactor page components** to follow guidelines (4-6 hours)
4. **Add permission constants** to all modules (1-2 hours)

**Estimated Total**: 9-14 hours across 1-2 days

---

## Support

For questions:
- See `CONSISTENCY_ANALYSIS_REPORT.md` for context
- See `ARCHITECTURE_CONSISTENCY_GUIDELINES.md` for patterns
- Check existing modules: Customers or Product Sales

---

**Created**: November 13, 2025  
**Status**: Ready for Implementation
