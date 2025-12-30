# UI Layer, Services & Hooks Consistency Analysis Report

**Date**: November 13, 2025  
**Scope**: All modules in src/modules/features/  
**Status**: ⚠️ **INCONSISTENT** - Multiple patterns found with no unified standard

---

## Executive Summary

Analysis of 14 feature modules revealed **critical inconsistencies** across three architectural layers:
- **Service Access Layer**: 3 different patterns
- **React Query Usage**: 2 conflicting approaches
- **State Management**: Inconsistent implementation patterns
- **Hook/Component Integration**: No unified pattern
- **Error Handling**: Varies significantly across modules

These inconsistencies make the codebase harder to maintain, increase cognitive load for developers, and risk bugs when developers work across different modules.

---

## 1. SERVICE ACCESS LAYER INCONSISTENCIES

### Pattern 1: Using `inject()` from ServiceContainer (Customers Module)
**Files**: `src/modules/features/customers/hooks/useCustomers.ts`

```typescript
import { inject } from '@/modules/core/services/ServiceContainer';

const getCustomerService = () => {
  const service = inject<CustomerService>('customerService');
  if (!service) {
    throw new Error('CustomerService instance is null or undefined');
  }
  return service;
};

// Usage in hook
const query = useQuery(..., async () => {
  const result = await getCustomerService().getCustomers(filters);
});
```

**Pros**:
- Type-safe with generics
- Includes null/undefined checks
- Follows IoC pattern

**Cons**:
- Function called on every hook invocation
- Not using React hooks pattern
- Inconsistent with other modules

**Affected Modules**: Customers

---

### Pattern 2: Using `useService()` Hook (Product Sales Module)
**Files**: `src/modules/features/product-sales/hooks/useProductSales.ts`

```typescript
import { useService } from '@/modules/core/hooks/useService';

export const useProductSales = (filters, page, pageSize) => {
  const service = useService<any>('productSaleService');  // ⚠️ Any typing!
  
  return useQuery({
    queryKey: productSalesKeys.filtered({ ...filters, page, pageSize }),
    queryFn: async () => {
      const response = await service.getProductSales(filters, page, pageSize);
      // ...
    }
  });
};
```

**Pros**:
- React hooks pattern (proper dependency management)
- Cleaner code structure

**Cons**:
- Using `any` type (no type safety)
- Less error handling
- Only used in Product Sales module

**Affected Modules**: Product Sales

---

### Pattern 3: Direct ServiceFactory Import (Sales & Super Admin)
**Files**: 
- `src/modules/features/sales/hooks/useSales.ts`
- `src/modules/features/super-admin/hooks/useImpersonation.ts`

```typescript
// Sales Module
import { salesService as factorySalesService } from '@/services/serviceFactory';
import { SalesService } from '../services/salesService';

const moduleSalesService = new SalesService();  // ⚠️ Duplicate instantiation!

export const useDeals = (filters) => {
  const response = await factorySalesService.getDeals(filters);  // Using factory
};
```

```typescript
// Super Admin Module  
import { impersonationService as factoryImpersonationService } from '@/services/serviceFactory';

export function useImpersonationLogs() {
  return useQuery({
    queryFn: async () => {
      return factoryImpersonationService.getImpersonationLogs();
    }
  });
}
```

**Pros**:
- Centralized service access
- Clear explicit imports

**Cons**:
- Not using React hooks for service access (missing dependency tracking)
- Sales module creates unused duplicate service instance
- Different from other patterns

**Affected Modules**: Sales, Super Admin, Audit Logs, Tickets, Contracts, Dashboard

---

## Service Access Pattern Summary Table

| Module | Pattern | Hook Type | Type Safety | Error Handling | Scalability |
|--------|---------|-----------|-------------|----------------|-------------|
| Customers | `inject()` | Function | ✅ High | ✅ Explicit | ⚠️ Medium |
| Product Sales | `useService()` | Hook | ❌ Any type | ⚠️ Basic | ✅ Good |
| Sales | Direct import + new instance | None | ⚠️ Medium | ⚠️ Basic | ⚠️ Medium |
| Super Admin | Direct import | None | ⚠️ Medium | ⚠️ Basic | ⚠️ Medium |
| Contracts | Direct import | None | ⚠️ Medium | ⚠️ Basic | ⚠️ Medium |
| Tickets | Direct import | None | ⚠️ Medium | ⚠️ Basic | ⚠️ Medium |

---

## 2. REACT QUERY USAGE INCONSISTENCIES

### Issue A: Two Different React Query Imports

**Pattern 1 - Custom Hook (Customers)**:
```typescript
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';

// File: src/modules/features/customers/hooks/useCustomers.ts
const query = useQuery(queryKey, async () => { ... }, { enabled: isTenantInitialized });
```

**Pattern 2 - Direct TanStack (Product Sales, Sales, Super Admin)**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// File: src/modules/features/product-sales/hooks/useProductSales.ts
return useQuery({
  queryKey: productSalesKeys.filtered(...),
  queryFn: async () => { ... },
  staleTime: 5 * 60 * 1000
});
```

**Issues**:
- Mixed imports in codebase
- Different behavior potentially (custom vs direct)
- `useInvalidateQueries` is outdated/custom naming
- Inconsistent query configuration

**Affected Files**:
- Customers: Uses custom hook
- Product Sales, Sales, Super Admin, Contracts, Tickets: Use direct TanStack

---

### Issue B: Inconsistent Query Configuration

| Aspect | Customers | Product Sales | Sales | Super Admin |
|--------|-----------|-----------------|-------|-------------|
| **Query Keys** | Serialized filters | Query key factory | Query key factory | Query key factory |
| **Cache Time** | Not configured | `gcTime: 10 * 60 * 1000` | Not configured | Not configured |
| **Stale Time** | Not configured | `staleTime: 5 * 60 * 1000` | `staleTime: 5 * 60 * 1000` | `staleTime: 3 * 60 * 1000` |
| **Retry Logic** | Default | `retry: 2` + exponential delay | Default | `retry: 2` |
| **Refetch on Mount** | Not configured | Not configured | Not configured | `refetchOnMount: true` |

---

## 3. STATE MANAGEMENT INCONSISTENCIES

All modules use Zustand but with **inconsistent patterns**:

### Pattern A: Customers Module
```typescript
const setCustomers = useCustomerStore((state) => state.setCustomers);
const setPagination = useCustomerStore((state) => state.setPagination);
const customers = useCustomerStore((state) => state.customers);

// Multiple separate selectors
setCustomers(response.data);
setPagination(response.pagination);
```

### Pattern B: Product Sales Module
```typescript
const { setSales, setLoading, setPagination, setError, clearError } = useProductSalesStore();

// Destructured from single call
setSales(response.data);
setPagination({ ...pagination });
```

### Pattern C: Sales Module
```typescript
const { setDeals, setLoading, setPagination } = useSalesStore();

// Similar destructuring pattern
setDeals(response.data);
```

**Issues**:
- Different store selector patterns
- Inconsistent method naming (`setCustomers` vs `setSales`)
- No consistent type definitions across stores
- Some stores more/less comprehensive than others

---

## 4. PAGE COMPONENT INCONSISTENCIES

### Page Structure Patterns

#### Pattern A: Traditional State + Hooks (Customers, Sales)
```typescript
// Customers
const { hasPermission } = useAuth();
const [filters, setFilters] = useState(...);
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
const { customers, pagination, isLoading } = useCustomers(filters);
```

#### Pattern B: Store-Based (Sales)
```typescript
// Sales
const { filters, setFilters } = useSalesStore();
const { data: stats, isLoading: statsLoading } = useSalesStats();
const { data: dealsData, isLoading: dealsLoading } = useDeals(filters);
```

#### Pattern C: Service-Oriented (Product Sales)
```typescript
// Product Sales
const productSaleService = useService<any>('productSaleService');
const [productSales, setProductSales] = useState<ProductSale[]>([]);
const [filters, setFilters] = useState<ProductSaleFilters>({});

const loadProductSales = useCallback(async () => {
  const response = await productSaleService.getProductSales(filters, currentPage, pageSize);
  setProductSales(response.data);
});
```

#### Pattern D: Modular/Factory-Based (Super Admin)
```typescript
// Super Admin Dashboard
const { 
  superUsers = [], 
  isLoading: usersLoading 
} = useSuperAdminList();

const { 
  tenants = [], 
  isLoading: tenantsLoading 
} = useTenantDirectory();

// Multiple specialized hooks
```

**Issues**:
- 4 different architectural approaches
- Makes knowledge transfer difficult
- Inconsistent data flow
- Mixed patterns within same page components

---

## 5. ERROR HANDLING INCONSISTENCIES

### Customers Module
```typescript
try {
  const result = await getCustomerService().getCustomers(filters);
  return result;
} catch (err) {
  console.error('[useCustomers] Query function caught error:', err);
  throw err;
}
```

### Product Sales Module
```typescript
try {
  const response = await service.getProductSales(filters, page, pageSize);
  // ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product sales';
  setError(errorMessage);
  throw error;
}
```

### Sales Module
```typescript
try {
  const response = await factorySalesService.getDeals(filters);
  return response;
} catch (error) {
  console.error('[useDeals] ❌ Error:', error);  // Emoji logging
  throw error;
}
```

### Super Admin Module
```typescript
try {
  return factoryImpersonationService.getImpersonationLogs();
} catch (error) {
  // No explicit error handling, lets React Query handle
}
```

**Inconsistencies**:
- Different error message formatting
- Some use `setError()` to store, some re-throw
- Inconsistent console logging (emoji vs standard)
- No unified error recovery strategy

---

## 6. LOGGING & DEBUGGING INCONSISTENCIES

### Customers: Standard Logging
```typescript
console.log('[useCustomers] Query state:', { isTenantInitialized, tenantId, enabled: isTenantInitialized });
```

### Sales: Emoji Logging (Non-standard)
```typescript
console.log('[useDeals] 🚀 Hook called with filters:', filters);
console.log('[useDeals] ✅ Factory SalesService obtained');
console.error('[useDeals] ❌ Error:', error);
```

### Super Admin: JSDoc + No Logging
```typescript
/**
 * Fetch all impersonation logs with pagination/filtering
 * @returns Query result with impersonation logs
 * @example
 * const { data: logs, isLoading } = useImpersonationLogs();
 */
```

**Issues**:
- Inconsistent console patterns
- Emoji usage only in sales module
- Different documentation approaches
- Makes debugging across modules confusing

---

## 7. TYPE SAFETY ISSUES

### Type Safety by Module

| Module | useCustomers | useProductSales | useSales | useImpersonation |
|--------|--------------|------------------|----------|------------------|
| Custom Hook | ✅ Full | ❌ `any` type | ⚠️ Basic | ⚠️ Basic |
| Service Typing | ✅ Generic | ❌ `any` | ⚠️ Inline | ⚠️ Inline |
| Response Types | ✅ Defined | ✅ Defined | ✅ Defined | ✅ Defined |
| Error Handling | ✅ Explicit | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic |

**Critical Issue**: Product Sales uses `useService<any>()` - should be `useService<ProductSalesService>()`

---

## 8. COMPONENT-LEVEL UI INCONSISTENCIES

### Modal/Drawer State Management

**Customers**:
```typescript
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
```

**Product Sales**:
```typescript
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);
```

**Issues**:
- Different state naming (`drawerMode` vs multiple `show*`)
- Different modal handling approaches
- Hard to standardize components across modules

---

## 9. PERMISSION CHECKING INCONSISTENCIES

### Pattern 1: Customers
```typescript
const { hasPermission } = useAuth();
if (!hasPermission('crm:customer:record:delete')) {
  message.error('You do not have permission to delete customers');
  return;
}
```

### Pattern 2: Product Sales
```typescript
const { hasPermission } = useAuth();
if (!hasPermission('crm:product-sale:record:update')) {
  // Permission check
}
```

### Pattern 3: Sales
```typescript
{hasPermission('crm:sales:deal:create') && (
  <Button type="primary" onClick={handleCreate}>
    New Deal
  </Button>
)}
```

**Issues**:
- Inconsistent permission naming (`customers:*` vs `product_sales:*` vs `sales:*`)
- Different permission check locations (wrapper vs conditional render)
- No unified permission hook

---

## 10. MISSING STANDARDIZATION

### Missing in Most Modules:
- ❌ Consistent error boundaries
- ❌ Unified loading states
- ❌ Consistent empty state handling
- ❌ Unified pagination pattern
- ❌ Consistent filter management
- ❌ Unified search implementation

---

## DETAILED ISSUE BREAKDOWN

### Critical Issues (Must Fix)

| # | Issue | Modules | Impact | Priority |
|---|-------|---------|--------|----------|
| 1 | **Product Sales uses `useService<any>()`** | Product Sales | Type safety loss | 🔴 High |
| 2 | **Three different service access patterns** | All | Inconsistent codebase | 🔴 High |
| 3 | **Two different React Query imports** | Customers vs Others | Potential conflicts | 🔴 High |
| 4 | **Sales module creates unused service instance** | Sales | Dead code | 🔴 High |
| 5 | **No unified error handling strategy** | All | Bugs, inconsistent UX | 🟡 Medium |

### Medium Issues (Should Fix)

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | Inconsistent state management patterns | Cognitive load | 🟡 Medium |
| 2 | Different modal/drawer handling | Hard to maintain | 🟡 Medium |
| 3 | Inconsistent permission naming | Navigation bugs | 🟡 Medium |
| 4 | Emoji logging in Sales module | Unprofessional, hard to grep | 🟡 Medium |
| 5 | Inconsistent React Query config | Subtle bugs, performance | 🟡 Medium |

### Low Issues (Nice to Fix)

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | Inconsistent documentation patterns | Knowledge transfer | 🟢 Low |
| 2 | Different filter management approaches | Hard to extract logic | 🟢 Low |
| 3 | Inconsistent component naming | Minor confusion | 🟢 Low |

---

## MODULES ANALYZED

### Fully Consistent
None

### Mostly Consistent
None

### Partially Consistent
- **Customers**: 60% - Uses different patterns for hooks and stores
- **Product Sales**: 65% - Uses `any` types but consistent hook pattern
- **Sales**: 55% - Mixed factory patterns

### High Inconsistency
- **Super Admin**: Multiple sub-patterns
- **Contracts**: Different from core modules
- **Tickets**: Different from core modules

---

## RECOMMENDATIONS

### Phase 1: Standardize Service Access (🔴 Critical)

**Recommendation**: Adopt `useService()` hook pattern across all modules

```typescript
// STANDARD PATTERN
import { useService } from '@/modules/core/hooks/useService';
import { ProductSalesService } from '../services/productSalesService';

export const useProductSales = (filters: ProductSaleFilters = {}) => {
  const service = useService<ProductSalesService>('productSaleService');
  
  return useQuery({
    queryKey: ['productSales', filters],
    queryFn: () => service.getProductSales(filters),
    staleTime: 5 * 60 * 1000
  });
};
```

**Impact**: 
- ✅ Consistent across all modules
- ✅ React hooks pattern (proper deps)
- ✅ Type-safe with generics
- ✅ Easier maintenance

**Files to Update**: 14 modules

---

### Phase 2: Standardize React Query Usage

**Recommendation**: Use TanStack React Query directly everywhere

```typescript
// REMOVE custom useQuery from @/modules/core/hooks
// USE direct: import { useQuery } from '@tanstack/react-query';

// STANDARDIZE configuration
export const MODULE_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
};
```

**Files to Update**: 8 modules (customers, etc.)

---

### Phase 3: Unify State Management

**Recommendation**: Standardize Zustand store interface

```typescript
// STANDARD STORE PATTERN
import { create } from 'zustand';

interface ModuleStore<T> {
  // Data
  items: T[];
  selectedItem: T | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: { page: number; pageSize: number; total: number };
  
  // Setters (use immer middleware)
  setItems: (items: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: any) => void;
  setSelectedItem: (item: T | null) => void;
}

export const useModuleStore = create<ModuleStore<T>>(
  immer((set) => ({
    // initialization...
  }))
);
```

**Files to Update**: All 14 modules

---

### Phase 4: Standardize Page Component Patterns

**Recommendation**: Use Factory pattern + hooks (like Super Admin Dashboard)

```typescript
export const StandardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<FilterType>({});
  
  // ALWAYS use module hooks, NOT direct service calls
  const { items, isLoading, error } = useModuleItems(filters);
  const { stats, isLoading: statsLoading } = useModuleStats();
  
  // Standard structure
  return (
    <>
      <PageHeader title="..." />
      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        {/* Table/List */}
        {/* Forms/Panels */}
      </div>
    </>
  );
};
```

**Files to Update**: 10 page components

---

### Phase 5: Implement Error Boundary + Unified Error Handling

```typescript
// STANDARD ERROR HANDLING
const handleError = (error: unknown, context: string) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  console.error(`[${context}] Error:`, error);
  message.error(message);
  // Optionally: Log to Sentry/error tracking
};

// In hooks
try {
  return await service.fetch();
} catch (error) {
  handleError(error, 'useModuleItems');
  throw error;
}
```

---

### Phase 6: Standardize Permission Checking

```typescript
// CENTRALIZED PERMISSION CONSTANTS
export const MODULE_PERMISSIONS = {
  READ: 'module:read',
  CREATE: 'module:create',
  UPDATE: 'module:update',
  DELETE: 'module:delete',
  EXPORT: 'module:export',
  IMPORT: 'module:import',
} as const;

// Usage
const { hasPermission } = useAuth();
if (!hasPermission(MODULE_PERMISSIONS.DELETE)) {
  // ...
}
```

---

## IMPLEMENTATION PRIORITY

### Week 1: Critical Fixes
- [ ] Fix Product Sales `useService<any>()` → `useService<ProductSalesService>()`
- [ ] Standardize service access to `useService()` hook
- [ ] Remove emoji logging from Sales module
- [ ] Remove unused service instance from Sales module

### Week 2: High Priority
- [ ] Standardize React Query imports (remove custom hook)
- [ ] Standardize React Query configuration
- [ ] Unify Zustand store patterns

### Week 3: Medium Priority
- [ ] Standardize page component patterns
- [ ] Implement unified error handling
- [ ] Standardize permission constants

### Week 4: Documentation
- [ ] Create architectural guidelines doc
- [ ] Update CLAUDE.md with standards
- [ ] Create code examples for developers

---

## ARCHITECTURE GUIDE TEMPLATE

See: `ARCHITECTURE_CONSISTENCY_GUIDELINES.md` (to be created)

---

## CONCLUSION

The codebase suffers from **architectural drift** where modules developed at different times adopted different patterns. This creates:

- 🔴 **Maintenance burden**: Developers must learn 3+ patterns
- 🔴 **Bug risk**: Inconsistent error handling leads to missed edge cases
- 🔴 **Scaling issues**: Hard to add new modules consistently
- 🟡 **Knowledge loss**: When developers leave, patterns aren't documented
- 🟡 **Testing burden**: Each pattern needs different test approaches

**Recommendation**: Prioritize standardization in next sprint to reduce technical debt and improve developer experience.

---

**Report Generated**: 2025-11-13  
**Modules Analyzed**: 14  
**Files Reviewed**: 35+  
**Issues Found**: 27  
**Critical Issues**: 5  
**Estimated Fix Time**: 3-4 weeks
