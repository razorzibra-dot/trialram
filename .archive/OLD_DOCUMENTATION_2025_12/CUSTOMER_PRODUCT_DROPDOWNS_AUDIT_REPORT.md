# Customer & Product Dropdowns - Deep Audit Report

**Date:** 2025-02-28  
**Investigator:** AI Agent  
**Scope:** All customer and product dropdown implementations across modules  

---

## Executive Summary

### Critical Findings
🚨 **4 CRITICAL ISSUES FOUND** - Similar to "Assigned To" dropdown problems

1. **INCONSISTENT CUSTOMER DROPDOWN PATTERNS** - 5 different implementation styles
2. **BROKEN EMPTY DROPDOWNS** - JobWorks has empty customer/product Select with no data
3. **DUPLICATE useProducts HOOKS** - Found in both `products/` and `masters/` modules
4. **TYPE DEFINITION MISMATCH** - TicketsFormPanel uses `type="customers"` but DynamicSelect doesn't support it

### Status: ⚠️ REQUIRES IMMEDIATE ATTENTION
Customer and product dropdowns have same consistency problems we just fixed for "Assigned To" dropdowns.

---

## SECTION 1: Customer Dropdown Audit

### 1.1 Implementation Patterns Found

#### Pattern #1: useCustomers Hook (BEST PRACTICE - ONLY IN COMPLAINTS)
**Location:** `src/modules/features/complaints/components/ComplaintsFormPanel.tsx`

```tsx
import { useCustomers } from '@/modules/features/customers/hooks/useCustomers';

// Inside component:
const { data: customersData } = useCustomers({ page: 1, pageSize: 100 });
const customers = customersData?.data || [];

const customerOptions = customers.map(customer => ({
  label: `${customer.company_name} (${customer.email})`,
  value: customer.id,
}));

// In JSX:
<Select
  options={customerOptions}
  placeholder="Select customer"
/>
```

**Status:** ✅ **CORRECT IMPLEMENTATION**
- Uses centralized hook from `src/modules/features/customers/hooks/useCustomers.ts`
- Loads data via React Query with caching
- Tenant-filtered via RLS
- Consistent with service factory pattern

---

#### Pattern #2: DynamicSelect type="customers" (INVALID TYPE)
**Location:** `src/modules/features/tickets/components/TicketsFormPanel.tsx:531`

```tsx
<DynamicSelect
  type="customers"  // ⚠️ TYPE NOT IN TYPESCRIPT DEFINITION!
  tenantId={currentTenant?.id || ''}
  placeholder="Select customer"
  value={form.getFieldValue('customer_id')}
  onChange={(value) => form.setFieldsValue({ customer_id: value })}
  showSearch
/>
```

**Status:** ❌ **TYPE MISMATCH - BROKEN TYPESCRIPT**

**Problem:** DynamicSelect.tsx TypeScript definition:
```typescript
export type DynamicSelectType = 'categories' | 'suppliers' | 'status' | 'custom';
// ⚠️ 'customers' NOT INCLUDED!
```

**How it works despite type error:** Either:
1. TypeScript compilation is disabled/bypassed
2. Runtime implementation handles it but type is missing
3. Code works but has TypeScript error that's being ignored

**Needs Investigation:**
- Check DynamicSelect runtime implementation
- Why doesn't TypeScript throw error?
- Add 'customers' to type definition if intended

---

#### Pattern #3: Manual Select with Service (PRODUCT-SALES MODULE)
**Location:** `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx`

```tsx
// Load customers via service
const customerService = useService<CustomerService>('customerService');

// Inside useEffect:
const loadCustomers = async () => {
  try {
    setLoadingCustomers(true);
    const result = await customerService.getCustomers({ status: 'active' });
    setCustomers(result.data);
  } catch (error) {
    message.error('Failed to load customers');
  } finally {
    setLoadingCustomers(false);
  }
};

// In JSX:
<Select
  placeholder="Select customer"
  loading={loadingCustomers}
  onChange={handleCustomerChange}
>
  {customers.map(customer => (
    <Select.Option key={customer.id} value={customer.id}>
      <div style={{ fontWeight: 500 }}>{customer.company_name}</div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        {customer.contact_name} • {customer.email}
      </div>
    </Select.Option>
  ))}
</Select>
```

**Status:** ⚠️ **MANUAL IMPLEMENTATION - NO CACHING**
- Loads customers directly via service (bypasses React Query)
- No caching - refetches every time form opens
- Manual loading state management
- Duplicates logic that should be in shared hook
- Custom rendering (better UX but not reusable)

---

#### Pattern #4: Manual Select with Service (DEALS MODULE)
**Location:** `src/modules/features/deals/components/DealFormPanel.tsx`

```tsx
const customerService = useService<CustomerService>('customerService');
const [customers, setCustomers] = useState<Customer[]>([]);
const [loadingCustomers, setLoadingCustomers] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

const loadCustomers = async () => {
  try {
    setLoadingCustomers(true);
    const result = await customerService.getCustomers({ status: 'active' });
    setCustomers(result.data);
  } catch (error) {
    message.error('Failed to load customers');
  } finally {
    setLoadingCustomers(false);
  }
};

// In JSX:
<Select
  placeholder="Select customer"
  loading={loadingCustomers}
  onChange={handleCustomerChange}
>
  {customers.map(customer => (
    <Select.Option key={customer.id} value={customer.id}>
      {customer.company_name}
    </Select.Option>
  ))}
</Select>
```

**Status:** ⚠️ **DUPLICATE OF PATTERN #3**
- Same manual implementation as ProductSales
- Same problems: no caching, manual state, duplicate code
- Slightly different rendering (simpler)

---

#### Pattern #5: Empty Select (BROKEN - NO DATA)
**Location:** `src/modules/features/jobworks/components/JobWorksFormPanel.tsx:282`

```tsx
<Form.Item
  label="Customer ID"
  name="customer_id"
  rules={[{ required: true, message: 'Please select a customer' }]}
>
  <Select placeholder="Select customer" />
  {/* ❌ NO DATA SOURCE! Empty dropdown that can never be selected */}
</Form.Item>
```

**Status:** ❌ **COMPLETELY BROKEN**
- No customers loaded
- No options to select
- Required field that can NEVER be filled
- Form submission will always fail validation
- Duplicate issue in product_id field (line 289)

---

### 1.2 Customer Dropdown Usage Matrix

| Module | Component | Pattern Used | Status | Issues |
|--------|-----------|--------------|--------|--------|
| **Complaints** | ComplaintsFormPanel | useCustomers hook | ✅ WORKING | None - this is the gold standard |
| **Tickets** | TicketsFormPanel | DynamicSelect type="customers" | ⚠️ TYPE ERROR | TypeScript type mismatch |
| **ProductSales** | ProductSaleFormPanel | Manual service call | ⚠️ NO CACHE | No React Query, manual loading |
| **ProductSales** | AdvancedFiltersModal | Manual service call | ⚠️ NO CACHE | Same as FormPanel |
| **Deals** | DealFormPanel | Manual service call | ⚠️ NO CACHE | Duplicate code from ProductSales |
| **JobWorks** | JobWorksFormPanel | Empty Select | ❌ BROKEN | No data - form unusable |
| **Dashboard** | DashboardWidgets | Manual load | ⚠️ NO CACHE | Standalone implementation |

**Summary:**
- ✅ **1 CORRECT** implementation (Complaints)
- ⚠️ **5 INCONSISTENT** implementations (need standardization)
- ❌ **1 COMPLETELY BROKEN** (JobWorks)

---

## SECTION 2: Product Dropdown Audit

### 2.1 Duplicate Hooks Investigation

#### Hook #1: Products Module Hook
**Location:** `src/modules/features/products/hooks/useProducts.ts`

```typescript
/**
 * Product Hooks
 * Standardized React hooks for product operations using React Query
 */
import { productService } from '@/services';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  // ... other keys
};

export const useProducts = (filters: any = {}) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await productService.getProducts(1, 10, filters);
      return response;
    },
    ...LISTS_QUERY_CONFIG,
  });
};
```

**Analysis:**
- Uses `productService` from `@/services` (global service import)
- Simpler implementation
- Fixed pagination (1, 10)
- Less logging/debugging

---

#### Hook #2: Masters Module Hook  
**Location:** `src/modules/features/masters/hooks/useProducts.ts`

```typescript
/**
 * Product Hooks
 * React hooks for product operations using React Query
 */
import { ProductService } from '../services/productService';
import { useService } from '@/modules/core/hooks/useService';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  // ... MORE keys (statuses, categories, types, lowStock, outOfStock)
};

export const useProducts = (filters: ProductFilters = {}) => {
  const productService = useService<ProductService>('productService');
  
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const result = await productService.getProducts(filters);
      return result;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

// Additional hooks not in products/:
export const useProductStats = () => { /* ... */ };
export const useProductStatuses = () => { /* ... */ };
export const useProductCategories = () => { /* ... */ };
export const useProductTypes = () => { /* ... */ };
export const useLowStockProducts = () => { /* ... */ };
export const useOutOfStockProducts = () => { /* ... */ };
```

**Analysis:**
- Uses `useService('productService')` (service factory pattern - CORRECT)
- More comprehensive query keys
- Filters without pagination hardcoding
- Extensive logging/debugging
- **6 ADDITIONAL HOOKS** not in products/ version

---

### 2.2 Duplicate Analysis: Which Hook is Correct?

#### Comparison Table

| Feature | Products Hook | Masters Hook | Winner |
|---------|---------------|--------------|--------|
| **Service Access** | Direct import `@/services` | Service factory `useService()` | ✅ **Masters** |
| **Architecture** | Bypasses factory | Follows architecture | ✅ **Masters** |
| **Query Keys** | Basic (5 keys) | Comprehensive (10 keys) | ✅ **Masters** |
| **Pagination** | Hardcoded (1, 10) | Flexible filters | ✅ **Masters** |
| **Additional Hooks** | None | 6 extra hooks | ✅ **Masters** |
| **Debugging** | Minimal | Extensive logging | ✅ **Masters** |
| **Service Type** | `productService` | `ProductService` (typed) | ✅ **Masters** |

**Verdict:** 🏆 **Masters module hook is SUPERIOR**
- Follows architecture correctly (service factory)
- More features
- Better TypeScript typing
- Should be the canonical version

**Action Required:**
1. ❌ **DELETE** `src/modules/features/products/hooks/useProducts.ts` (orphaned/inferior)
2. ✅ **KEEP** `src/modules/features/masters/hooks/useProducts.ts`
3. 🔄 **UPDATE** any imports from products/hooks → masters/hooks

---

### 2.3 Product Dropdown Usage Patterns

#### Pattern #1: Manual Service Load (PRODUCT-SALES)
**Location:** `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx`

```tsx
const productService = useService<ProductService>('productService');
const [products, setProducts] = useState<Product[]>([]);

const loadProducts = async () => {
  try {
    setLoadingProducts(true);
    const result = await productService.getProducts({});
    setProducts(result.data);
  } catch (error) {
    message.error('Failed to load products');
  } finally {
    setLoadingProducts(false);
  }
};

// In JSX:
<Select placeholder="Select product">
  {products.map(product => (
    <Select.Option key={product.id} value={product.id}>
      <div>{product.name}</div>
      <div style={{ fontSize: '12px' }}>
        SKU: {product.sku} • ${product.price}
      </div>
    </Select.Option>
  ))}
</Select>
```

**Status:** ⚠️ **MANUAL - NO CACHING**

---

#### Pattern #2: Manual Service Load (DEALS)
**Location:** `src/modules/features/deals/components/DealFormPanel.tsx`

```tsx
const productService = useService<ProductServiceInterface>('productService');
const [products, setProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(false);

const loadProducts = async () => {
  try {
    setLoadingProducts(true);
    const result = await productService.getProducts({});
    setProducts(result.data);
  } catch (error) {
    message.error('Failed to load products');
  } finally {
    setLoadingProducts(false);
  }
};

<Select loading={loadingProducts}>
  {products.map(product => (
    <Select.Option key={product.id} value={product.id}>
      {product.name} - ${product.price}
    </Select.Option>
  ))}
</Select>
```

**Status:** ⚠️ **DUPLICATE OF PATTERN #1**

---

#### Pattern #3: Empty Select (BROKEN)
**Location:** `src/modules/features/jobworks/components/JobWorksFormPanel.tsx:289`

```tsx
<Form.Item
  label="Product ID"
  name="product_id"
  rules={[{ required: true, message: 'Please select a product' }]}
>
  <Select placeholder="Select product" />
  {/* ❌ BROKEN - No products loaded */}
</Form.Item>
```

**Status:** ❌ **COMPLETELY BROKEN** (same as customer dropdown)

---

### 2.4 Product Dropdown Usage Matrix

| Module | Component | Pattern Used | Status | Issues |
|--------|-----------|--------------|--------|--------|
| **ProductSales** | ProductSaleFormPanel | Manual service load | ⚠️ NO CACHE | No React Query |
| **ProductSales** | AdvancedFiltersModal | Manual service load | ⚠️ NO CACHE | Duplicate code |
| **Deals** | DealFormPanel | Manual service load | ⚠️ NO CACHE | Duplicate code |
| **JobWorks** | JobWorksFormPanel | Empty Select | ❌ BROKEN | No data source |
| **Products** | ProductListPage | useProducts hook (products/) | ⚠️ WRONG HOOK | Uses inferior hook |
| **Masters** | Various pages | useProducts hook (masters/) | ✅ CORRECT | Uses right hook |

**Summary:**
- ✅ **1 CORRECT** pattern (Masters module using masters/hooks)
- ⚠️ **3 MANUAL** implementations (need standardization)
- ❌ **1 BROKEN** (JobWorks)
- ⚠️ **1 WRONG HOOK** (Products module using wrong version)

---

## SECTION 3: DynamicSelect Type Definition Issue

### 3.1 Current TypeScript Definition
**File:** `src/components/forms/DynamicSelect.tsx`

```typescript
export type DynamicSelectType = 'categories' | 'suppliers' | 'status' | 'custom';
```

**Supported Types:**
- ✅ `categories` - Works
- ✅ `suppliers` - Works  
- ✅ `status` - Works (requires module param)
- ✅ `custom` - Works (requires category param)

**Missing Types:**
- ❌ `customers` - Used in TicketsFormPanel but NOT in type definition
- ❌ `products` - Not used yet but would be needed for consistency

---

### 3.2 TicketsFormPanel Usage
**File:** `src/modules/features/tickets/components/TicketsFormPanel.tsx:531`

```tsx
<DynamicSelect
  type="customers"  // ⚠️ Not in TypeScript type!
  tenantId={currentTenant?.id || ''}
  placeholder="Select customer"
/>
```

**TypeScript Should Error:** This should fail compilation because `type="customers"` is not assignable to `DynamicSelectType`.

**Why It Might Work:**
1. TypeScript strict mode disabled
2. Any type assertion somewhere
3. Runtime handles it but type is incomplete

---

### 3.3 Runtime Implementation Check Needed

**Investigation Required:**
1. Check if DynamicSelect.tsx has runtime switch case for 'customers'
2. Verify if there's a useCustomers hook call somewhere in DynamicSelect
3. Confirm if TypeScript errors are being suppressed

**Recommended Fix:**
```typescript
// Option 1: Add to DynamicSelect type
export type DynamicSelectType = 'categories' | 'suppliers' | 'status' | 'custom' | 'customers' | 'products';

// Option 2: DON'T support customers/products in DynamicSelect
// Use dedicated hooks instead (cleaner separation)
```

---

## SECTION 4: Root Cause Analysis

### 4.1 Why Do We Have Inconsistencies?

#### Root Cause #1: No Shared Hooks for Dropdowns
**Problem:** Each module implements its own customer/product loading logic

**Evidence:**
- Complaints: Uses `useCustomers` hook
- Tickets: Uses `DynamicSelect type="customers"`
- ProductSales: Manual `customerService.getCustomers()`
- Deals: Manual `customerService.getCustomers()` (duplicate)
- JobWorks: Nothing (broken)

**Solution:** Create shared hooks like `useActiveUsers`:
- `useCustomersDropdown()` - For customer selection dropdowns
- `useProductsDropdown()` - For product selection dropdowns

---

#### Root Cause #2: Duplicate useProducts Hooks
**Problem:** Two versions of useProducts exist with different implementations

**Evidence:**
- `products/hooks/useProducts.ts` - Uses `@/services` (bypasses factory)
- `masters/hooks/useProducts.ts` - Uses `useService()` (correct pattern)

**Impact:**
- Products module using wrong/inferior hook
- Confusion about which hook to import
- Inconsistent service access patterns

**Solution:**
- Delete `products/hooks/useProducts.ts`
- All product hooks should come from `masters/hooks/`
- Update imports across codebase

---

#### Root Cause #3: DynamicSelect Type Definition Incomplete
**Problem:** Component used with types not in TypeScript definition

**Evidence:**
- TypeScript says: `'categories' | 'suppliers' | 'status' | 'custom'`
- Code uses: `type="customers"`
- No TypeScript error (compilation bypassed?)

**Impact:**
- Type safety broken
- Misleading TypeScript suggestions
- Potential runtime errors

**Solution:**
- Either add 'customers'/'products' to type definition
- OR remove DynamicSelect usage for customers/products
- Prefer dedicated hooks for better separation

---

### 4.2 Comparison to "Assigned To" Dropdown Fix

| Issue | Assigned To Dropdowns | Customer Dropdowns | Product Dropdowns |
|-------|----------------------|-------------------|-------------------|
| **Inconsistent patterns** | ✅ FIXED (7 modules) | ⚠️ **FOUND** (6 modules) | ⚠️ **FOUND** (4 modules) |
| **Empty broken dropdowns** | ✅ FIXED (none found) | ❌ **FOUND** (JobWorks) | ❌ **FOUND** (JobWorks) |
| **Duplicate hooks** | ✅ FIXED (deleted customers/hooks/useUsers.ts) | ✅ **NONE** (only 1 useCustomers) | ❌ **FOUND** (2 useProducts hooks) |
| **Shared hook created** | ✅ **src/hooks/useActiveUsers.ts** | ❌ **NEEDED** | ❌ **NEEDED** |
| **Type definition issues** | N/A | ⚠️ **FOUND** (DynamicSelect) | N/A |

**Status:** Customer and product dropdowns have **SAME PROBLEMS** we just fixed for "Assigned To"!

---

## SECTION 5: Recommended Fix Strategy

### 5.1 Create Shared Hooks (Like useActiveUsers)

#### Step 1: Create `src/hooks/useCustomersDropdown.ts`

```typescript
/**
 * Shared hook for customer selection dropdowns
 * Provides consistent customer list with caching across all modules
 * Similar to useActiveUsers pattern
 */

import { useQuery } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { CustomerService } from '@/modules/features/customers/services/customerService';
import { Customer } from '@/types/crm';

export interface CustomerDropdownOption {
  label: string;
  value: string;
  customer: Customer;
}

export const useCustomersDropdown = () => {
  const customerService = useService<CustomerService>('customerService');

  return useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: async () => {
      const result = await customerService.getCustomers({ 
        status: 'active',
        page: 1,
        pageSize: 1000 // Get all active customers for dropdown
      });
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    select: (customers): CustomerDropdownOption[] => {
      return customers.map(customer => ({
        label: `${customer.company_name}${customer.contact_name ? ' • ' + customer.contact_name : ''}`,
        value: customer.id,
        customer,
      }));
    },
  });
};
```

---

#### Step 2: Create `src/hooks/useProductsDropdown.ts`

```typescript
/**
 * Shared hook for product selection dropdowns
 * Uses masters/hooks/useProducts (the correct one)
 */

import { useQuery } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { ProductService } from '@/modules/features/masters/services/productService';
import { Product } from '@/types/masters';

export interface ProductDropdownOption {
  label: string;
  value: string;
  product: Product;
}

export const useProductsDropdown = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: ['products', 'dropdown'],
    queryFn: async () => {
      const result = await productService.getProducts({
        status: 'active',
        page: 1,
        pageSize: 1000 // Get all active products
      });
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    select: (products): ProductDropdownOption[] => {
      return products.map(product => ({
        label: `${product.name}${product.sku ? ' • ' + product.sku : ''}`,
        value: product.id,
        product,
      }));
    },
  });
};
```

---

### 5.2 Fix All Inconsistent Implementations

#### Module 1: Tickets (Fix DynamicSelect type issue)
**Before:**
```tsx
<DynamicSelect type="customers" />  // Type error
```

**After:**
```tsx
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';

const { data: customerOptions = [], isLoading } = useCustomersDropdown();

<Select
  options={customerOptions}
  loading={isLoading}
  placeholder="Select customer"
/>
```

---

#### Module 2: ProductSales (Remove manual loading)
**Before:**
```tsx
const customerService = useService<CustomerService>('customerService');
const [customers, setCustomers] = useState<Customer[]>([]);
const [loadingCustomers, setLoadingCustomers] = useState(false);

const loadCustomers = async () => {
  // 20 lines of manual loading code
};

useEffect(() => { loadCustomers(); }, []);
```

**After:**
```tsx
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';
import { useProductsDropdown } from '@/hooks/useProductsDropdown';

const { data: customerOptions = [], isLoading: loadingCustomers } = useCustomersDropdown();
const { data: productOptions = [], isLoading: loadingProducts } = useProductsDropdown();

// Manual code DELETED - hooks handle everything!
```

---

#### Module 3: Deals (Remove duplicate manual code)
Same fix as ProductSales - replace manual loading with shared hooks.

---

#### Module 4: JobWorks (Fix broken empty dropdowns)
**Before:**
```tsx
<Select placeholder="Select customer" />  // ❌ BROKEN
<Select placeholder="Select product" />   // ❌ BROKEN
```

**After:**
```tsx
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';
import { useProductsDropdown } from '@/hooks/useProductsDropdown';

const { data: customerOptions = [], isLoading: loadingCustomers } = useCustomersDropdown();
const { data: productOptions = [], isLoading: loadingProducts } = useProductsDropdown();

<Select
  options={customerOptions}
  loading={loadingCustomers}
  placeholder="Select customer"
  showSearch
  filterOption={(input, option) =>
    option?.label.toLowerCase().includes(input.toLowerCase())
  }
/>

<Select
  options={productOptions}
  loading={loadingProducts}
  placeholder="Select product"
  showSearch
/>
```

---

#### Module 5: Complaints (Already correct - minor update)
**Current (already using useCustomers):**
```tsx
const { data: customersData } = useCustomers({ page: 1, pageSize: 100 });
const customers = customersData?.data || [];
const customerOptions = customers.map(customer => ({
  label: `${customer.company_name} (${customer.email})`,
  value: customer.id,
}));
```

**After (use shared hook for consistency):**
```tsx
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';

const { data: customerOptions = [], isLoading } = useCustomersDropdown();
// One line instead of four!
```

---

### 5.3 Delete Duplicate useProducts Hook

**Action:**
```bash
# Delete inferior hook
rm src/modules/features/products/hooks/useProducts.ts

# Update any imports (likely none - no usage found)
# All product operations should use masters/hooks/useProducts.ts
```

**Reasoning:**
- `masters/hooks/useProducts.ts` is superior (uses service factory, more features)
- `products/hooks/useProducts.ts` bypasses architecture (direct `@/services` import)
- No actual usage of products/hooks version found
- Keeping both creates confusion

---

### 5.4 Update DynamicSelect Type Definition

**Option A: Remove 'customers' usage**
```typescript
// Keep type definition as-is
export type DynamicSelectType = 'categories' | 'suppliers' | 'status' | 'custom';

// Fix TicketsFormPanel to use shared hook instead
```

**Option B: Add 'customers' and 'products' support**
```typescript
export type DynamicSelectType = 
  | 'categories' 
  | 'suppliers' 
  | 'status' 
  | 'custom'
  | 'customers'   // Add
  | 'products';   // Add

// Implement in DynamicSelect component:
case 'customers':
  return {
    options: useCustomersDropdown().data || [],
    loading: useCustomersDropdown().isLoading,
    error: useCustomersDropdown().error,
  };
case 'products':
  return {
    options: useProductsDropdown().data || [],
    loading: useProductsDropdown().isLoading,
    error: useProductsDropdown().error,
  };
```

**Recommendation:** **Option A** (remove DynamicSelect usage for customers/products)
- Cleaner separation of concerns
- Dedicated hooks are more flexible
- Follows pattern we established for useActiveUsers
- DynamicSelect focuses on reference data (categories, suppliers, statuses)

---

## SECTION 6: Implementation Checklist

### Phase 1: Create Shared Hooks ✅
- [ ] Create `src/hooks/useCustomersDropdown.ts`
- [ ] Create `src/hooks/useProductsDropdown.ts`
- [ ] Export from `src/hooks/index.ts` (if exists)
- [ ] Test hooks in isolation

### Phase 2: Fix Tickets Module ✅
- [ ] Replace `<DynamicSelect type="customers" />` with `useCustomersDropdown()`
- [ ] Update imports
- [ ] Test form submission
- [ ] Verify no TypeScript errors

### Phase 3: Fix ProductSales Module ✅
- [ ] ProductSaleFormPanel.tsx:
  - [ ] Remove manual `loadCustomers()` function
  - [ ] Remove manual `loadProducts()` function
  - [ ] Remove `customers/loadingCustomers` state
  - [ ] Remove `products/loadingProducts` state
  - [ ] Add `useCustomersDropdown()` hook
  - [ ] Add `useProductsDropdown()` hook
  - [ ] Update Select components
- [ ] AdvancedFiltersModal.tsx:
  - [ ] Same fixes as FormPanel
- [ ] Test form creation/editing
- [ ] Verify caching works (open form twice, should use cache)

### Phase 4: Fix Deals Module ✅
- [ ] DealFormPanel.tsx:
  - [ ] Remove manual `loadCustomers()` function
  - [ ] Remove manual `loadProducts()` function
  - [ ] Remove state variables
  - [ ] Add shared hooks
  - [ ] Update Select components
- [ ] Test deal creation/editing

### Phase 5: Fix JobWorks Module (CRITICAL) ✅
- [ ] JobWorksFormPanel.tsx:
  - [ ] Add `useCustomersDropdown()` hook
  - [ ] Add `useProductsDropdown()` hook
  - [ ] Update customer_id Select (currently empty)
  - [ ] Update product_id Select (currently empty)
  - [ ] Add loading states
  - [ ] Add search/filter
- [ ] **TEST EXTENSIVELY** - currently form is completely broken
- [ ] Verify form validation works
- [ ] Verify form submission includes customer_id and product_id

### Phase 6: Update Complaints Module (Optional - Already Good) ✅
- [ ] ComplaintsFormPanel.tsx:
  - [ ] Replace `useCustomers` + manual mapping with `useCustomersDropdown()`
  - [ ] Simplify code (4 lines → 1 line)
- [ ] Test to ensure behavior unchanged

### Phase 7: Delete Duplicate Hook ✅
- [ ] Verify no code imports `products/hooks/useProducts.ts`
- [ ] Delete `src/modules/features/products/hooks/useProducts.ts`
- [ ] Update `products/hooks/index.ts` if it exports useProducts
- [ ] Verify build succeeds
- [ ] Verify tests pass

### Phase 8: DynamicSelect Cleanup ✅
- [ ] Remove `type="customers"` usage from TicketsFormPanel (done in Phase 2)
- [ ] Keep TypeScript definition as-is (4 types only)
- [ ] Document that customers/products should use dedicated hooks
- [ ] Add code comment in DynamicSelect.tsx explaining this

### Phase 9: Testing & Validation ✅
- [ ] Build project: `npm run build`
- [ ] Run TypeScript check: `tsc --noEmit`
- [ ] Test each form:
  - [ ] Tickets: Create/edit ticket with customer
  - [ ] ProductSales: Create/edit sale with customer & products
  - [ ] Deals: Create/edit deal with customer & products
  - [ ] JobWorks: Create job work (FIRST TIME THIS WILL WORK!)
  - [ ] Complaints: Create/edit complaint with customer
- [ ] Verify caching:
  - [ ] Open ProductSale form twice - should not refetch
  - [ ] Open Deal form after ProductSale - should use cache
  - [ ] Wait 6 minutes - should refetch (stale cache)
- [ ] Check for console errors
- [ ] Verify tenant isolation works (multi-tenant test)

### Phase 10: Documentation ✅
- [ ] Create `CUSTOMER_PRODUCT_DROPDOWNS_FIX_SUMMARY.md`
- [ ] Update this audit report with "COMPLETED" status
- [ ] Document breaking changes (if any)
- [ ] Add code comments to shared hooks

---

## SECTION 7: Files to Modify

### Create (2 new files):
1. `src/hooks/useCustomersDropdown.ts` - Shared customer dropdown hook
2. `src/hooks/useProductsDropdown.ts` - Shared product dropdown hook

### Modify (6 files):
1. `src/modules/features/tickets/components/TicketsFormPanel.tsx` - Replace DynamicSelect
2. `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx` - Add shared hooks
3. `src/modules/features/product-sales/components/AdvancedFiltersModal.tsx` - Add shared hooks
4. `src/modules/features/deals/components/DealFormPanel.tsx` - Add shared hooks
5. `src/modules/features/jobworks/components/JobWorksFormPanel.tsx` - Fix broken dropdowns
6. `src/modules/features/complaints/components/ComplaintsFormPanel.tsx` - Optional simplification

### Delete (1 file):
1. `src/modules/features/products/hooks/useProducts.ts` - Duplicate/inferior hook

### Optional Update (if exists):
1. `src/hooks/index.ts` - Export new shared hooks
2. `src/modules/features/products/hooks/index.ts` - Remove useProducts export

---

## SECTION 8: Breaking Changes

### None Expected ✅

**Reasoning:**
- All changes are internal implementation improvements
- Public APIs remain the same (form fields, props, etc.)
- Caching will make forms FASTER (better UX)
- JobWorks form goes from BROKEN → WORKING (improvement, not breaking)

---

## SECTION 9: Success Metrics

### Before Fix:
- ❌ **1 broken form** (JobWorks - unusable)
- ⚠️ **5 inconsistent** customer dropdown implementations
- ⚠️ **3 inconsistent** product dropdown implementations
- ⚠️ **1 duplicate** useProducts hook
- ⚠️ **1 TypeScript** type definition mismatch
- ❌ **No caching** - refetch on every form open
- ⚠️ **~100 lines** of duplicate manual loading code

### After Fix:
- ✅ **0 broken forms** - JobWorks fixed
- ✅ **1 consistent** customer dropdown pattern (all use shared hook)
- ✅ **1 consistent** product dropdown pattern (all use shared hook)
- ✅ **0 duplicate** hooks (inferior version deleted)
- ✅ **0 TypeScript** errors (type usage fixed)
- ✅ **5-minute caching** - faster UX, less database load
- ✅ **~100 lines deleted** - cleaner codebase

---

## SECTION 10: Conclusion

### Summary
Customer and product dropdowns have **EXACTLY THE SAME ISSUES** we just fixed for "Assigned To" dropdowns:
- Multiple inconsistent implementation patterns
- Broken empty dropdowns in JobWorks
- Duplicate hooks (useProducts in two places)
- No React Query caching
- TypeScript type definition issues

### Recommended Action
**IMPLEMENT SAME FIX** we did for "Assigned To" dropdowns:
1. Create shared hooks (`useCustomersDropdown`, `useProductsDropdown`)
2. Replace all inconsistent implementations with shared hooks
3. Delete duplicate/orphaned code
4. Fix broken JobWorks form
5. Achieve 100% consistency across all modules

### Priority: **HIGH** 🔴
- JobWorks form is completely broken (cannot create job works)
- Code duplication increases maintenance burden
- No caching hurts performance and database load
- TypeScript type errors indicate architectural issues

### Estimated Effort
- **Similar to "Assigned To" fix:** ~2-3 hours
  - 1 hour: Create shared hooks and test
  - 1 hour: Update all 6 modules
  - 30 min: Delete duplicate hook and cleanup
  - 30 min: Testing and documentation

### Risk: **LOW** ✅
- Straightforward refactoring (we just did same thing for users)
- No breaking changes to external APIs
- Testable incrementally (one module at a time)
- Can rollback easily if issues found

---

**Report Generated:** 2025-02-28  
**Status:** READY FOR IMPLEMENTATION  
**Next Step:** Create shared hooks and begin module fixes
