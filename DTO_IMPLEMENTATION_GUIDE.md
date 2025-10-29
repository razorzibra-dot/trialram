# DTO Implementation Guide 📚

**Date**: 2025-01-30  
**Status**: Reference Implementation Guide  
**Scope**: How to implement standardized DTOs across all modules

---

## Quick Start

### Where DTOs Are Located

```
src/types/dtos/
├── index.ts ........................... Main export file
├── commonDtos.ts ...................... Shared DTOs
├── customerDtos.ts .................... Customer module DTOs
├── salesDtos.ts ....................... Sales/Deals module DTOs
├── productSalesDtos.ts ................ Product Sales module DTOs
└── ticketDtos.ts ...................... Support Tickets module DTOs
```

### Import DTOs in Your Code

```typescript
// ✅ Correct way - import from centralized location
import type { 
  CustomerStatsDTO,
  PaginatedResponseDTO,
  CustomerDTO 
} from '@/types/dtos';

// ❌ Wrong way - don't import from individual files
import type { CustomerStatsDTO } from '@/types/dtos/customerDtos';
```

---

## Part 1: Standardizing a Module Service

### Example: Fixing Product Sales Service

#### Step 1: Identify Current Field Names

**Current Implementation** (supabase/productSaleService.ts):

```typescript
// Returns analytics with inconsistent field names
async getProductSalesAnalytics() {
  return {
    total: 100,              // ❌ Should be: totalSales
    completed: 80,           // ❌ Should be: completedSales
    pending: 20,             // ❌ Should be: pendingSales
    revenue: 50000,          // ❌ Should be: totalRevenue
    avg_value: 500,          // ❌ Should be: averageSaleValue
  };
}
```

#### Step 2: Apply DTO Type Annotation

```typescript
import type { ProductSalesAnalyticsDTO } from '@/types/dtos';

class SupabaseProductSaleService {
  async getProductSalesAnalytics(): Promise<ProductSalesAnalyticsDTO> {
    const data = await this.fetchAnalytics();
    
    // Map old field names to DTO structure
    return {
      totalSales: data.total,
      completedSales: data.completed,
      pendingSales: data.pending,
      totalRevenue: data.revenue,
      averageSaleValue: data.avg_value,
      totalQuantity: data.quantity,
      byStatus: this.groupByStatus(data),
      topProducts: this.getTopProducts(data),
      topCustomers: this.getTopCustomers(data),
      revenueByMonth: this.getMonthlyRevenue(data),
      lastUpdated: new Date().toISOString(),
    };
  }
}
```

#### Step 3: Update Consuming Components

**Before**:
```typescript
// src/modules/features/product-sales/views/ProductSalesPage.tsx
const { data: stats } = useQuery({
  queryFn: async () => {
    const result = await productSaleService.getProductSalesAnalytics();
    return result;
  },
});

// ❌ Old field names don't exist
const totalSales = stats?.total;        // undefined!
const completedSales = stats?.completed; // undefined!
```

**After**:
```typescript
import type { ProductSalesAnalyticsDTO } from '@/types/dtos';

const { data: stats } = useQuery<ProductSalesAnalyticsDTO>({
  queryFn: async () => {
    const result = await productSaleService.getProductSalesAnalytics();
    return result;
  },
});

// ✅ Correct field names with type safety
const totalSales = stats?.totalSales;        // 100
const completedSales = stats?.completedSales; // 80
const completionRate = (stats?.completedSales ?? 0) / (stats?.totalSales ?? 1) * 100;
```

#### Step 4: Update Hooks

**Before**:
```typescript
// src/modules/features/product-sales/hooks/useProductSalesAnalytics.ts
export const useProductSalesAnalytics = () => {
  const query = useQuery({
    queryKey: ['productSalesAnalytics'],
    queryFn: async () => {
      const data = await service.getProductSalesAnalytics();
      // No validation - field names are just assumed
      return data;
    },
  });
  
  return query;
};
```

**After**:
```typescript
import type { ProductSalesAnalyticsDTO } from '@/types/dtos';

export const useProductSalesAnalytics = () => {
  const query = useQuery<ProductSalesAnalyticsDTO>({
    queryKey: ['productSalesAnalytics'],
    queryFn: async () => {
      const data = await service.getProductSalesAnalytics();
      
      // ✅ Add validation with detailed logging
      if (!data.totalSales || !data.totalRevenue) {
        console.error('[useProductSalesAnalytics] ❌ Invalid analytics data structure', data);
        throw new Error('Invalid analytics response');
      }
      
      console.log('[useProductSalesAnalytics] ✅ Analytics loaded', {
        totalSales: data.totalSales,
        totalRevenue: data.totalRevenue,
      });
      
      return data;
    },
  });
  
  return query;
};
```

#### Step 5: Test Both Backends

```typescript
// Test that both mock and Supabase return same structure
import { serviceFactory } from '@/services/serviceFactory';

async function testDtoConsistency() {
  console.log('Testing DTO consistency across backends...\n');
  
  // Test Supabase
  console.log('🔄 Testing Supabase backend...');
  serviceFactory.setApiMode('supabase');
  const supabaseData = await productSaleService.getProductSalesAnalytics();
  console.log('✅ Supabase returned:', Object.keys(supabaseData).sort());
  
  // Test Mock
  console.log('\n🔄 Testing Mock backend...');
  serviceFactory.setApiMode('mock');
  const mockData = await productSaleService.getProductSalesAnalytics();
  console.log('✅ Mock returned:', Object.keys(mockData).sort());
  
  // Compare
  const supabaseKeys = Object.keys(supabaseData).sort().join(',');
  const mockKeys = Object.keys(mockData).sort().join(',');
  
  if (supabaseKeys === mockKeys) {
    console.log('✅ PASS: Both backends return identical structure');
  } else {
    console.log('❌ FAIL: Structure mismatch');
    console.log('  Supabase:', supabaseKeys);
    console.log('  Mock:    ', mockKeys);
  }
}
```

---

## Part 2: Common DTO Patterns

### Pattern 1: Paginated Responses

**Always use this for list endpoints**:

```typescript
import type { PaginatedResponseDTO } from '@/types/dtos';

interface Customer { id: string; name: string; }

// ✅ Correct
async function getCustomers(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponseDTO<Customer>> {
  const { data, count } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .range((page - 1) * pageSize, page * pageSize - 1);
    
  const totalPages = Math.ceil(count / pageSize);
  
  return {
    data,
    page,
    pageSize,
    total: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
```

### Pattern 2: Statistics Endpoints

**Always use structured stats DTOs**:

```typescript
import type { CustomerStatsDTO } from '@/types/dtos';

// ✅ Correct - all fields properly named
async function getCustomerStats(): Promise<CustomerStatsDTO> {
  const stats = await calculateStats();
  
  return {
    totalCustomers: stats.total_count,
    activeCustomers: stats.active_count,
    prospectCustomers: stats.prospect_count,
    inactiveCustomers: stats.inactive_count,
    newCustomersThisMonth: stats.new_this_month,
    churnRate: stats.churn_percentage,
    byIndustry: stats.by_industry_map,
    bySize: stats.by_size_map,
    byStatus: stats.by_status_map,
    lastUpdated: new Date().toISOString(),
  };
}
```

### Pattern 3: Error Handling

```typescript
import type { ApiErrorDTO } from '@/types/dtos';

// ✅ Correct - standardized error format
async function handleServiceError(error: any): Promise<ApiErrorDTO> {
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    details: error.details,
    timestamp: new Date().toISOString(),
    statusCode: error.status || 500,
  };
}
```

---

## Part 3: Module-by-Module Implementation Order

### Priority 1: Critical Modules (🔴 URGENT)

These have active users and visible bugs:

#### 1. Product Sales Module
- **File**: `src/services/supabase/productSaleService.ts`
- **Impact**: High - analytics dashboard broken
- **Estimated Time**: 2-3 hours
- **Changes**:
  1. Add `ProductSalesAnalyticsDTO` to getProductSalesAnalytics()
  2. Update `ProductSaleListResponseDTO` for list endpoints
  3. Update component in `ProductSalesPage.tsx`
  4. Update hooks in `useProductSalesAnalytics.ts`
  5. Test with mock backend

#### 2. Sales (Deals) Module
- **File**: `src/services/supabase/salesService.ts`
- **Impact**: High - pipeline dashboard affected
- **Estimated Time**: 2-3 hours
- **Changes**:
  1. Add `SalesStatsDTO` to stats endpoints
  2. Add `DealListResponseDTO` to list endpoints
  3. Update `SalesPage.tsx`
  4. Update `useSalesStats()` hook
  5. Test with mock backend

#### 3. Tickets Module
- **File**: `src/services/supabase/ticketService.ts`
- **Impact**: Medium - support dashboard
- **Estimated Time**: 1-2 hours
- **Changes**:
  1. Add `TicketStatsDTO`
  2. Add `TicketListResponseDTO`
  3. Update `TicketsPage.tsx`
  4. Update hooks
  5. Test with mock backend

### Priority 2: Secondary Modules (🟡 MEDIUM)

#### 4. Contract Service
#### 5. Service Contract Service
#### 6. Job Work Service
#### 7. User Management

### Priority 3: Supporting Services (🟢 LOW)

#### 8. Notification Service
#### 9. Complaint Service (if Supabase version created)

---

## Part 4: Mock Service Updates

### When to Update Mock Services

Mock services in `src/services/` should also return the same DTO structure as Supabase services. This ensures seamless switching.

**Example: Updating Mock Customer Service**

```typescript
// src/services/customerService.ts (mock)
import type { CustomerStatsDTO } from '@/types/dtos';

export const customerService = {
  async getCustomerStats(): Promise<CustomerStatsDTO> {
    // Return mock data matching DTO exactly
    return {
      totalCustomers: 50,
      activeCustomers: 40,
      prospectCustomers: 8,
      inactiveCustomers: 2,
      newCustomersThisMonth: 5,
      churnRate: 2.5,
      byIndustry: {
        'Technology': 20,
        'Finance': 15,
        'Healthcare': 10,
        'Retail': 5,
      },
      bySize: {
        'startup': 15,
        'small': 20,
        'medium': 10,
        'enterprise': 5,
      },
      byStatus: {
        'active': 40,
        'inactive': 2,
        'prospect': 8,
      },
      lastUpdated: new Date().toISOString(),
    };
  },
};
```

---

## Part 5: Testing DTO Changes

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos';
import { supabaseProductSaleService } from '@/services/supabase/productSaleService';
import { productSaleService as mockProductSaleService } from '@/services/productSaleService';

describe('ProductSales DTO Consistency', () => {
  it('Supabase service returns valid ProductSalesAnalyticsDTO', async () => {
    const data = await supabaseProductSaleService.getProductSalesAnalytics();
    
    expect(data).toBeDefined();
    expect(data.totalSales).toBe(typeof 'number');
    expect(data.completedSales).toBe(typeof 'number');
    expect(data.totalRevenue).toBe(typeof 'number');
    expect(data.averageSaleValue).toBe(typeof 'number');
    expect(data.byStatus).toBeDefined();
    expect(data.lastUpdated).toBeDefined();
  });
  
  it('Mock service returns identical structure', async () => {
    const mockData = await mockProductSaleService.getProductSalesAnalytics();
    const supabaseData = await supabaseProductSaleService.getProductSalesAnalytics();
    
    // Both should have same top-level keys
    const mockKeys = Object.keys(mockData).sort();
    const supabaseKeys = Object.keys(supabaseData).sort();
    
    expect(mockKeys).toEqual(supabaseKeys);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { serviceFactory } from '@/services/serviceFactory';

describe('Service Factory DTO Routing', () => {
  beforeEach(() => {
    serviceFactory.setApiMode('mock');
  });
  
  it('Routes to mock backend and returns valid DTO', async () => {
    const mockService = serviceFactory.getProductSaleService();
    const data = await mockService.getProductSalesAnalytics();
    
    expect(data.totalSales).toBeGreaterThanOrEqual(0);
    expect(data.byStatus).toBeDefined();
  });
  
  it('Switches to Supabase and returns valid DTO', async () => {
    serviceFactory.setApiMode('supabase');
    const supabaseService = serviceFactory.getProductSaleService();
    const data = await supabaseService.getProductSalesAnalytics();
    
    expect(data.totalSales).toBeGreaterThanOrEqual(0);
    expect(data.byStatus).toBeDefined();
  });
});
```

---

## Part 6: Checklist for Each Module

Use this checklist for each module you standardize:

### Service Implementation
- [ ] Review existing service methods
- [ ] Identify return types that need DTOs
- [ ] Map old field names to new DTO fields
- [ ] Update Supabase implementation
- [ ] Update Mock implementation
- [ ] Add DTO type annotations

### Component Updates
- [ ] Find all components using this service
- [ ] Update state initialization to use DTO
- [ ] Update field access to use standardized names
- [ ] Update JSX bindings
- [ ] Add TypeScript strict typing

### Hook Updates
- [ ] Add DTO type to useQuery
- [ ] Add validation for required fields
- [ ] Add diagnostic logging
- [ ] Handle error cases

### Testing
- [ ] Write unit tests for service
- [ ] Write integration tests for both backends
- [ ] Verify mock and Supabase return identical structure
- [ ] Test component rendering with real data

### Documentation
- [ ] Update module DOC.md
- [ ] Document breaking changes if any
- [ ] Add examples to IMPLEMENTATION_GUIDE.md
- [ ] Update type definitions

---

## Part 7: Debugging DTO Issues

### Common Issues and Solutions

#### Issue 1: "Property 'totalCustomers' does not exist"

**Cause**: Service returning old field names, component expecting new ones

**Fix**:
```typescript
// Step 1: Log service response
console.log('[Debug] Service returned:', response);

// Step 2: Check field names
console.log('[Debug] Has totalCustomers?', 'totalCustomers' in response);
console.log('[Debug] Has total?', 'total' in response);

// Step 3: Update service to use DTO
// Map old → new field names in service.ts
```

#### Issue 2: "Type 'any' is not assignable to type 'CustomerDTO'"

**Cause**: Service not typed with DTO

**Fix**:
```typescript
// Before
const data = await service.getCustomer(id);

// After
import type { CustomerDTO } from '@/types/dtos';
const data: CustomerDTO = await service.getCustomer(id);
```

#### Issue 3: Mock and Supabase return different field names

**Cause**: Implementations not synchronized

**Fix**:
```typescript
// In mock service
return {
  totalCustomers: mockData.total,      // ✅ Transform to DTO format
  activeCustomers: mockData.active,
  // ... map all fields
};

// In Supabase service
return {
  totalCustomers: supabaseRow.total_customers, // ✅ Transform to DTO format
  activeCustomers: supabaseRow.active_customers,
  // ... map all fields
};
```

---

## Part 8: Performance Considerations

### DTO Size Impact

DTOs are TypeScript types - they have **zero runtime impact**:

```typescript
// This is just a type - it's removed at compile time
export interface ProductSalesAnalyticsDTO {
  totalSales: number;
  // ... fields
}

// No DTO object is created at runtime
const data: ProductSalesAnalyticsDTO = { /* actual data */ };
// 'data' is just regular JavaScript object
```

### Best Practices

1. **Don't create DTO classes** - use type/interface only
2. **Don't instantiate DTOs** - just use shape validation
3. **DTOs are for type safety**, not runtime serialization

```typescript
// ❌ Wrong - unnecessary complexity
class ProductSalesAnalyticsDTO {
  constructor(public totalSales: number) {}
}

// ✅ Correct - just use type
type ProductSalesAnalyticsDTO = {
  totalSales: number;
};
```

---

## Conclusion

By implementing these standardized DTOs:

✅ Field naming is consistent across backends  
✅ Type safety prevents bugs  
✅ Easy to switch between mock/Supabase  
✅ Components get better IDE autocomplete  
✅ Debugging becomes easier  
✅ Future developers understand the contract  

**Next Steps**: Start with Priority 1 modules (ProductSales, Sales, Tickets) and work through the checklist for each.