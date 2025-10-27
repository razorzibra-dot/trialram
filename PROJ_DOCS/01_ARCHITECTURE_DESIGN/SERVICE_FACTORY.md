---
title: Service Factory Pattern Architecture
description: Multi-backend service routing system for mock and Supabase implementations
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: all
---

# Service Factory Pattern Architecture

## 🎯 Overview

The **Service Factory Pattern** is the routing layer that determines whether API calls go to mock services (development) or Supabase services (production) based on the `VITE_API_MODE` environment variable.

**Why This Matters:**
- Prevents "Unauthorized" errors from mixing mock and Supabase calls
- Ensures proper multi-tenant context in all API operations
- Enables seamless switching between development and production modes
- Maintains separation of concerns between business logic and implementation

---

## ⚙️ Core Concept

```
┌─────────────────────────────────────────────┐
│         Application Module Service          │
│  (e.g., CustomerModule, ProductModule)      │
└────────────────┬────────────────────────────┘
                 │
                 │ calls
                 ▼
    ┌────────────────────────────┐
    │   Service Factory          │
    │  (serviceFactory.ts)       │
    │                            │
    │ VITE_API_MODE === 'mock'?  │
    │    ├─→ YES → Mock Service  │
    │    └─→ NO  → Supabase API  │
    └─────┬──────────────┬───────┘
          │              │
    ┌─────▼───┐    ┌─────▼──────────┐
    │  Mock   │    │ Supabase API   │
    │ Service │    │ (PostgreSQL)   │
    │         │    │ (RLS)          │
    │ In-mem  │    │ (Multi-tenant) │
    │ data    │    │ (Audit logs)   │
    └─────────┘    └────────────────┘
```

---

## 📋 How It Works

### 1. Environment Variable Control

**In `.env` file:**
```bash
# Development - use mock data
VITE_API_MODE=mock

# Production - use real Supabase
VITE_API_MODE=supabase
```

### 2. Factory Implementation

**Location**: `src/services/serviceFactory.ts`

```typescript
// Read the API mode from environment
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

// Example: Product Service Factory
import { mockProductService } from './productService';
import { supabaseProductService } from './api/supabase/productService';

// Factory function returns appropriate implementation
export function getProductService() {
  return apiMode === 'supabase' 
    ? supabaseProductService 
    : mockProductService;
}

// Exported proxy that routes calls
export const productService = {
  getProducts: (tenantId) => getProductService().getProducts(tenantId),
  getProduct: (id, tenantId) => getProductService().getProduct(id, tenantId),
  createProduct: (data, tenantId) => getProductService().createProduct(data, tenantId),
  updateProduct: (id, data, tenantId) => getProductService().updateProduct(id, data, tenantId),
  deleteProduct: (id, tenantId) => getProductService().deleteProduct(id, tenantId),
  // ... all other methods
};
```

### 3. Module Service Usage

**Location**: `src/modules/features/products/services/productModuleService.ts`

```typescript
// ✅ CORRECT: Import from factory
import { productService as factoryProductService } from '@/services/serviceFactory';

export class ProductModuleService {
  async getProductStats(tenantId: string) {
    // Calls correct implementation based on VITE_API_MODE
    return factoryProductService.getProducts(tenantId);
  }

  async createNewProduct(data: ProductData, tenantId: string) {
    return factoryProductService.createProduct(data, tenantId);
  }
}
```

---

## 🏗️ File Structure

### Mock Implementation

```
src/services/
├── productService.ts                 # Mock implementation
├── customerService.ts
├── salesService.ts
├── notificationService.ts
├── userService.ts
├── rbacService.ts
├── jobWorkService.ts
├── contractService.ts
├── productSaleService.ts
└── ... (all other services)
```

**Example Mock Service** (`productService.ts`):
```typescript
// In-memory mock data
const mockProducts: Product[] = [
  { id: '1', name: 'Product A', price: 100, tenantId: 'tenant_1' },
  { id: '2', name: 'Product B', price: 200, tenantId: 'tenant_1' },
];

export const mockProductService = {
  getProducts: async (tenantId: string): Promise<Product[]> => {
    // Filter by tenant
    return mockProducts.filter(p => p.tenantId === tenantId);
  },

  createProduct: async (data: Partial<Product>, tenantId: string): Promise<Product> => {
    const product = { 
      id: generateUUID(),
      ...data,
      tenantId
    };
    mockProducts.push(product);
    return product;
  },

  // ... other methods
};
```

### Supabase Implementation

```
src/services/api/supabase/
├── productService.ts                 # Supabase implementation
├── customerService.ts
├── salesService.ts
├── notificationService.ts
├── userService.ts
├── rbacService.ts
├── jobWorkService.ts
├── contractService.ts
├── productSaleService.ts
└── ... (all other services)
```

**Example Supabase Service** (`api/supabase/productService.ts`):
```typescript
import { supabase } from '@/config/supabase';

export const supabaseProductService = {
  getProducts: async (tenantId: string): Promise<Product[]> => {
    // Supabase RLS automatically filters by tenant
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  },

  createProduct: async (data: Partial<Product>, tenantId: string): Promise<Product> => {
    const { data: product, error } = await supabase
      .from('products')
      .insert([{ ...data, tenant_id: tenantId }])
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  // ... other methods
};
```

---

## 🔑 Key Principles

### 1. **Same Interface, Different Implementation**

Both mock and Supabase services **must** have identical method signatures:

```typescript
// Both must have these methods with same signatures
interface IProductService {
  getProducts(tenantId: string): Promise<Product[]>;
  getProduct(id: string, tenantId: string): Promise<Product>;
  createProduct(data: Partial<Product>, tenantId: string): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>, tenantId: string): Promise<Product>;
  deleteProduct(id: string, tenantId: string): Promise<void>;
}
```

### 2. **Always Include Tenant Context**

Every API call must pass `tenantId`:

```typescript
// ✅ CORRECT
const products = await productService.getProducts(tenantId);

// ❌ WRONG - Missing tenant context
const products = await productService.getProducts();
```

### 3. **Transparent Implementation Switching**

Component code shouldn't care which implementation is used:

```typescript
// Component doesn't need to know if it's mock or Supabase
const { data: products } = useQuery({
  queryKey: ['products', tenantId],
  queryFn: () => productService.getProducts(tenantId)
});
```

### 4. **Consistent Error Handling**

Both implementations should throw/return errors in the same format:

```typescript
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Both mock and Supabase should use same error format
throw new Error(JSON.stringify({
  message: 'Product not found',
  code: 'NOT_FOUND',
  details: { id }
}));
```

---

## 📝 Adding a New Service to Factory

### Step 1: Create Mock Implementation

**File**: `src/services/newFeatureService.ts`

```typescript
const mockData: NewFeature[] = [
  // In-memory test data
];

export const mockNewFeatureService = {
  getAll: async (tenantId: string) => {
    return mockData.filter(item => item.tenantId === tenantId);
  },
  
  create: async (data: Partial<NewFeature>, tenantId: string) => {
    const newItem = { id: generateUUID(), ...data, tenantId };
    mockData.push(newItem);
    return newItem;
  },

  update: async (id: string, data: Partial<NewFeature>, tenantId: string) => {
    const index = mockData.findIndex(item => item.id === id && item.tenantId === tenantId);
    if (index === -1) throw new Error('Not found');
    mockData[index] = { ...mockData[index], ...data };
    return mockData[index];
  },

  delete: async (id: string, tenantId: string) => {
    const index = mockData.findIndex(item => item.id === id && item.tenantId === tenantId);
    if (index === -1) throw new Error('Not found');
    mockData.splice(index, 1);
  },
};
```

### Step 2: Create Supabase Implementation

**File**: `src/services/api/supabase/newFeatureService.ts`

```typescript
import { supabase } from '@/config/supabase';

export const supabaseNewFeatureService = {
  getAll: async (tenantId: string) => {
    const { data, error } = await supabase
      .from('new_features')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  create: async (data: Partial<NewFeature>, tenantId: string) => {
    const { data: result, error } = await supabase
      .from('new_features')
      .insert([{ ...data, tenant_id: tenantId }])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Partial<NewFeature>, tenantId: string) => {
    const { data: result, error } = await supabase
      .from('new_features')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  delete: async (id: string, tenantId: string) => {
    const { error } = await supabase
      .from('new_features')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  },
};
```

### Step 3: Update Service Factory

**File**: `src/services/serviceFactory.ts`

```typescript
// Add imports
import { mockNewFeatureService } from './newFeatureService';
import { supabaseNewFeatureService } from './api/supabase/newFeatureService';

// Add factory getter
export function getNewFeatureService() {
  return apiMode === 'supabase' 
    ? supabaseNewFeatureService 
    : mockNewFeatureService;
}

// Add exported proxy (with all methods from interface)
export const newFeatureService = {
  getAll: (tenantId: string) => getNewFeatureService().getAll(tenantId),
  create: (data: Partial<NewFeature>, tenantId: string) => 
    getNewFeatureService().create(data, tenantId),
  update: (id: string, data: Partial<NewFeature>, tenantId: string) =>
    getNewFeatureService().update(id, data, tenantId),
  delete: (id: string, tenantId: string) =>
    getNewFeatureService().delete(id, tenantId),
};
```

### Step 4: Update Module Service

**File**: `src/modules/features/new-feature/services/newFeatureModuleService.ts`

```typescript
import { newFeatureService as factoryNewFeatureService } from '@/services/serviceFactory';

export class NewFeatureModuleService {
  async getAllItems(tenantId: string) {
    return factoryNewFeatureService.getAll(tenantId);
  }

  async createItem(data: Partial<NewFeature>, tenantId: string) {
    return factoryNewFeatureService.create(data, tenantId);
  }

  // ... other methods
}
```

### Step 5: Update Main Services Export

**File**: `src/services/index.ts`

```typescript
// Export from factory
export { newFeatureService } from './serviceFactory';
```

---

## 🚨 Common Mistakes & How to Avoid Them

### ❌ Mistake 1: Direct Import of Supabase Service

```typescript
// WRONG - This bypasses factory pattern!
import { supabaseProductService } from '@/services/api/supabase/productService';
const products = await supabaseProductService.getProducts(tenantId);
```

**Why It's Wrong**: 
- Breaks abstraction
- Ignores mock mode completely
- Causes "Unauthorized" errors when VITE_API_MODE is 'mock'

**✅ Correct Way:**
```typescript
import { productService } from '@/services/serviceFactory';
const products = await productService.getProducts(tenantId);
```

### ❌ Mistake 2: Direct Import of Mock Service

```typescript
// WRONG - Makes it hard to switch to Supabase
import { mockProductService } from '@/services/productService';
const products = await mockProductService.getProducts(tenantId);
```

**Why It's Wrong**:
- Code tied to mock implementation
- Can't switch to production Supabase mode
- Makes refactoring difficult

**✅ Correct Way:**
```typescript
import { productService } from '@/services/serviceFactory';
const products = await productService.getProducts(tenantId);
```

### ❌ Mistake 3: Missing Tenant Context

```typescript
// WRONG - No tenant isolation
const products = await productService.getProducts();
```

**Why It's Wrong**:
- Multi-tenant data leakage
- RLS violations
- Security breach

**✅ Correct Way:**
```typescript
import { useSessionStore } from '@/stores/sessionStore';
const { currentUser } = useSessionStore();
const products = await productService.getProducts(currentUser.tenantId);
```

### ❌ Mistake 4: Inconsistent Method Signatures

```typescript
// WRONG - Mock and Supabase have different signatures!
// Mock version:
mockProductService.getProducts = async () => { ... }

// Supabase version:
supabaseProductService.getProducts = async (tenantId, filters) => { ... }
```

**Why It's Wrong**:
- Factory pattern breaks
- Unexpected behavior based on API mode
- Hard to debug

**✅ Correct Way:**
Both implementations must have identical signatures:
```typescript
interface IProductService {
  getProducts(tenantId: string, filters?: ProductFilters): Promise<Product[]>;
}
```

---

## 🔍 Debugging Service Factory Issues

### Issue: "Unauthorized" Error

**Likely Causes:**
1. Using direct Supabase service import instead of factory
2. VITE_API_MODE is set to 'supabase' but calling code expects mock
3. Missing or invalid JWT token in Supabase mode
4. User permissions not set up in Supabase

**Debug Steps:**
```typescript
// 1. Check which mode is active
console.log('VITE_API_MODE:', import.meta.env.VITE_API_MODE);

// 2. Verify factory is being used
import { productService } from '@/services/serviceFactory';
console.log('Service implementation:', productService);

// 3. Check tenant context
import { useSessionStore } from '@/stores/sessionStore';
const { currentUser } = useSessionStore();
console.log('Current tenant:', currentUser?.tenantId);

// 4. Verify JWT in localStorage (Supabase mode only)
console.log('Auth token:', localStorage.getItem('sb-auth-token'));
```

### Issue: Mock Data Not Showing Up

**Likely Causes:**
1. VITE_API_MODE is set to 'supabase' instead of 'mock'
2. Mock service methods not implemented
3. Missing mock data in array

**Debug Steps:**
```typescript
// 1. Verify mock mode
console.log('Mode:', import.meta.env.VITE_API_MODE); // Should be 'mock'

// 2. Test mock service directly
import { mockProductService } from '@/services/productService';
const data = await mockProductService.getProducts('test-tenant');
console.log('Mock data:', data);

// 3. Check if data is being filtered by tenant
console.log('All mock items:', mockProducts); // Check inside service
```

### Issue: Switching Modes Doesn't Work

**Likely Causes:**
1. Environment variable not set correctly
2. Code needs restart to pick up env changes
3. Factory getter not reading env var correctly

**Debug Steps:**
```typescript
// 1. Verify env file has correct variable
cat .env  // Check VITE_API_MODE value

// 2. Restart dev server after changing .env
npm run dev

// 3. Verify factory reads env correctly
console.log('API Mode:', import.meta.env.VITE_API_MODE);

// 4. Check which service is being used
import { getProductService } from '@/services/serviceFactory';
const service = getProductService();
console.log('Using service:', service === mockProductService ? 'MOCK' : 'SUPABASE');
```

---

## 📊 Currently Factory-Routed Services

These services use the factory pattern:

| Service | Status | Mock | Supabase |
|---------|--------|------|----------|
| Product Service | ✅ Active | ✅ | ✅ |
| Customer Service | ✅ Active | ✅ | ✅ |
| Sales Service | ✅ Active | ✅ | ✅ |
| Notification Service | ✅ Active | ✅ | ✅ |
| Job Work Service | ✅ Active | ✅ | ✅ |
| Contract Service | ✅ Active | ✅ | ✅ |
| Product Sale Service | ✅ Active | ✅ | ✅ |
| User Service | ✅ Active | ✅ | ✅ |
| RBAC Service | ✅ Active | ✅ | ✅ |
| Company Service | ✅ Active | ✅ | ✅ |

---

## ✅ Implementation Checklist

When implementing service factory:

- [ ] Created mock service with in-memory data
- [ ] Created Supabase service with API calls
- [ ] Both services have identical method signatures
- [ ] All methods include tenantId parameter
- [ ] Added factory getter function
- [ ] Added exported proxy service
- [ ] Updated src/services/index.ts exports
- [ ] Module service imports from factory, not directly
- [ ] Tested in mock mode (VITE_API_MODE=mock)
- [ ] Tested in Supabase mode (VITE_API_MODE=supabase)
- [ ] Error handling consistent between implementations
- [ ] Tenant filtering works in both modes
- [ ] RLS policies set up in Supabase (if needed)

---

## 🔗 Related Documentation

- [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md) - Access control at API layer
- [Session Management](./SESSION_MANAGEMENT.md) - Tenant context
- [Authentication System](./AUTHENTICATION.md) - JWT token handling
- [React Query](./REACT_QUERY.md) - Data fetching pattern

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team  
**Related Modules**: All 16 Feature Modules