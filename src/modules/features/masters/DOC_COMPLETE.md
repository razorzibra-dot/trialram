---
title: Masters Module Complete Documentation
description: Comprehensive documentation for the Masters module (Products and Companies management) including architecture, components, state management, and API reference
lastUpdated: 2025-02-11
relatedModules: [sales, productSales, contracts, serviceContract, customers]
category: module
author: AI Agent
---

# Masters Module - Complete Documentation

## Overview & Purpose

The **Masters Module** manages core master data for the CRM system including **Products** and **Companies**. It provides a complete CRUD interface with advanced filtering, bulk operations, statistics, and import/export capabilities.

**Key Responsibilities**:
- ✅ Product lifecycle management (create, read, update, delete)
- ✅ Company/Supplier management
- ✅ Inventory and stock tracking
- ✅ Advanced filtering and search
- ✅ Bulk operations (update, delete, export)
- ✅ Statistics and analytics
- ✅ Multi-backend support (Mock & Supabase)
- ✅ RBAC-based access control

---

## Architecture & Structure

```
src/modules/features/masters/
├── DOC.md                              # Module documentation
├── index.ts                            # Module exports
├── routes.tsx                          # Route definitions
├── services/
│   ├── productService.ts               # Product business logic
│   └── companyService.ts               # Company business logic
├── hooks/
│   ├── useProducts.ts                  # Products data fetching & mutations
│   └── useCompanies.ts                 # Companies data fetching & mutations
├── components/
│   ├── ProductsList.tsx                # Products table with filtering
│   ├── ProductsDetailPanel.tsx         # Product detail view (drawer)
│   ├── ProductsFormPanel.tsx           # Product create/edit form
│   ├── CompaniesList.tsx               # Companies table with filtering
│   ├── CompaniesDetailPanel.tsx        # Company detail view (drawer)
│   └── CompaniesFormPanel.tsx          # Company create/edit form
├── views/
│   ├── ProductsPage.tsx                # Main products page
│   └── CompaniesPage.tsx               # Main companies page
└── __tests__/
    ├── productService.test.ts          # Product service unit tests
    ├── companyService.test.ts          # Company service unit tests
    ├── hooks.test.ts                   # Custom hooks tests
    ├── components.test.tsx             # React component tests
    └── serviceParity.test.ts           # Mock vs Supabase parity tests
```

---

## 8-Layer Architecture Implementation

### Layer 1: Database Schema
**Location**: `supabase/migrations/`

**Products Table**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(12,2),
  sku VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'discontinued')),
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE,
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level INT,
  max_stock_level INT,
  track_stock BOOLEAN DEFAULT TRUE,
  supplier_id UUID,
  supplier_name VARCHAR(255),
  tags TEXT[],
  images TEXT[],
  warranty_period INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  tenant_id UUID NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (supplier_id) REFERENCES companies(id),
  INDEX idx_products_status (status),
  INDEX idx_products_category (category),
  INDEX idx_products_sku (sku),
  INDEX idx_products_tenant (tenant_id)
);
```

**Companies Table**:
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(20) NOT NULL CHECK (phone ~ '^\+?[\d\s\-()]+$'),
  email VARCHAR(255) NOT NULL UNIQUE CHECK (email LIKE '%@%.%'),
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(20) CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  description TEXT,
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  tenant_id UUID NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_companies_status (status),
  INDEX idx_companies_industry (industry),
  INDEX idx_companies_tenant (tenant_id)
);
```

### Layer 2: TypeScript Types
**Location**: `src/types/masters.ts`

```typescript
export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  cost_price?: number;
  sku: string;
  status: 'active' | 'inactive' | 'discontinued';
  is_active: boolean;
  is_service: boolean;
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  track_stock: boolean;
  supplier_id?: string;
  supplier_name?: string;
  tags?: string[];
  images?: string[];
  warranty_period?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect';
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  description?: string;
  price: number;
  cost?: number;
  sku: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock_quantity?: number;
  supplier_id?: string;
  tags?: string[];
  warranty_period?: number;
}

export interface CompanyFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect';
  description?: string;
}
```

### Layer 3: Mock Services
**Location**: `src/services/productService.ts`, `src/services/companyService.ts`

Provides mock data and business logic for development and testing.

**Key Methods**:
- `getProducts()` - Fetch all products
- `getProduct(id)` - Fetch single product
- `createProduct(data)` - Create new product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Delete product
- `searchProducts(filters)` - Search with filters
- `getProductStats()` - Get statistics
- `getLowStockProducts(threshold)` - Get low stock items
- `exportProducts(format)` - Export as CSV/JSON
- `importProducts(data, format)` - Import from CSV/JSON

### Layer 4: Supabase Services
**Location**: `src/services/supabase/productService.ts`, `src/services/supabase/companyService.ts`

Production implementation with PostgreSQL queries.

**Key Features**:
- ✅ Column mapping (snake_case → camelCase)
- ✅ Centralized row mapper functions
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Multi-tenant RLS support
- ✅ Proper error handling

### Layer 5: Service Factory
**Location**: `src/services/serviceFactory.ts`

Routes requests to correct backend based on `VITE_API_MODE`:

```typescript
export const productService = {
  getProducts: () => getProductService().getProducts(),
  getProduct: (id) => getProductService().getProduct(id),
  createProduct: (data) => getProductService().createProduct(data),
  // ... all methods
};
```

### Layer 6: Module Services
**Location**: `src/modules/features/masters/services/`

Coordinates business logic between UI and backend:

```typescript
export const moduleProductService = {
  async getProducts(filters?: ProductFilters) {
    return await productService.getProducts();
  },
  
  async createProduct(data: ProductFormData) {
    return await productService.createProduct(data);
  },
  
  // ... other methods
};
```

### Layer 7: Custom Hooks
**Location**: `src/modules/features/masters/hooks/`

React Query integration for data fetching and mutations:

```typescript
export function useProducts(filters?: ProductFilters) {
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => moduleProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });

  return { products, loading: isLoading, error, refetch };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProductFormData) =>
      moduleProductService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### Layer 8: React Components
**Location**: `src/modules/features/masters/components/`

UI components with Ant Design:

**ProductsList**:
- Displays products in table format
- Supports sorting, filtering, pagination
- Bulk selection and operations
- Export/Import buttons

**ProductsFormPanel**:
- Create/Edit form in drawer
- Field validation with Ant Design rules
- Tooltips documenting database constraints
- Loading states during submission

**CompaniesPage**:
- Main page component
- Breadcrumb navigation
- Statistics cards
- Create button

---

## Component Relationships

```
ProductsPage
  ├── ProductsList (table)
  │   ├── Bulk Actions
  │   └── Detail/Edit Drawers
  │       ├── ProductsDetailPanel
  │       └── ProductsFormPanel
  └── Statistics Cards

CompaniesPage
  ├── CompaniesList (table)
  │   ├── Bulk Actions
  │   └── Detail/Edit Drawers
  │       ├── CompaniesDetailPanel
  │       └── CompaniesFormPanel
  └── Statistics Cards
```

---

## State Management

### React Query
- **Query Keys**: Structured for cache management
- **Stale Time**: 5 minutes for list data
- **Mutations**: Include automatic cache invalidation
- **Error Handling**: Toast notifications for user feedback

### Zustand (if needed)
- Filter state (search, category, etc.)
- UI state (drawer visibility, selected rows)
- Local form state

### Context (if needed)
- Multi-tenant context
- Current user/permissions context

---

## Public API Reference

### useProducts Hook

```typescript
function useProducts(filters?: ProductFilters): {
  products: Product[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Parameters**:
- `filters.search` - Search by name
- `filters.category` - Filter by category
- `filters.status` - Filter by status
- `filters.price_min` - Minimum price
- `filters.price_max` - Maximum price

### useCreateProduct Hook

```typescript
function useCreateProduct() {
  mutate: (data: ProductFormData) => void;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
}
```

### useCompanies Hook

```typescript
function useCompanies(filters?: CompanyFilters): {
  companies: Company[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### Service Methods

**ProductService**:
```typescript
// CRUD
getProducts(): Promise<Product[]>
getProduct(id: string): Promise<Product>
createProduct(data: ProductFormData): Promise<Product>
updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product>
deleteProduct(id: string): Promise<void>

// Search
searchProducts(filters: ProductFilters): Promise<Product[]>

// Analytics
getProductStats(): Promise<MasterDataStats>
getLowStockProducts(threshold: number): Promise<Product[]>

// Import/Export
exportProducts(format: 'csv' | 'json'): Promise<string>
importProducts(data: string, format: 'csv' | 'json'): Promise<Product[]>
```

---

## Integration Points

### With Other Modules

**Sales Module**:
- Uses products for deal line items
- References companies for customer accounts

**Product Sales Module**:
- Creates product transactions
- Updates product inventory

**Contracts Module**:
- Uses products for contract line items
- References companies for supplier/customer

**Customer Module**:
- Uses companies data
- Cross-references for company-based customers

### RBAC Permissions

Required permissions:
- `products:view` - View products list
- `products:create` - Create new product
- `products:edit` - Edit products
- `products:delete` - Delete products
- `products:export` - Export data
- `products:import` - Import data
- `companies:view` - View companies
- `companies:create` - Create company
- `companies:edit` - Edit company
- `companies:delete` - Delete company

---

## Data Types & Interfaces

### Enums

**Product Status**:
```typescript
type ProductStatus = 'active' | 'inactive' | 'discontinued';
```

**Company Size**:
```typescript
type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
```

**Company Status**:
```typescript
type CompanyStatus = 'active' | 'inactive' | 'prospect';
```

### Filter Interfaces

```typescript
interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  price_min?: number;
  price_max?: number;
}

interface CompanyFilters {
  search?: string;
  industry?: string;
  size?: CompanySize;
  status?: CompanyStatus;
}
```

### Response Interfaces

```typescript
interface MasterDataResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MasterDataStats {
  total_products: number;
  active_products: number;
  total_companies: number;
  active_companies: number;
  total_customers: number;
  active_customers: number;
}
```

---

## Testing Guide

### Unit Tests
- **File**: `__tests__/productService.test.ts`
- **Coverage**: Service methods, validation, error handling
- **Run**: `npm run test -- productService.test.ts`

### Hook Tests
- **File**: `__tests__/hooks.test.ts`
- **Coverage**: Data fetching, mutations, cache invalidation
- **Setup**: Uses React Query test utils

### Component Tests
- **File**: `__tests__/components.test.tsx`
- **Coverage**: Rendering, user interactions, validation
- **Library**: React Testing Library + Vitest

### Parity Tests
- **File**: `__tests__/serviceParity.test.ts`
- **Coverage**: Mock vs Supabase consistency
- **Verification**: Type safety, validation rules, error handling

### Running All Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- productService.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Common Use Cases & Examples

### Example 1: Display Products List

```typescript
import { useProducts } from '@/modules/features/masters/hooks/useProducts';

export function MyComponent() {
  const { products, loading, error } = useProducts({ category: 'Software' });

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error.message} />;

  return (
    <List
      dataSource={products}
      renderItem={(product) => (
        <List.Item>
          <List.Item.Meta
            title={product.name}
            description={`$${product.price}`}
          />
        </List.Item>
      )}
    />
  );
}
```

### Example 2: Create New Product

```typescript
import { useCreateProduct } from '@/modules/features/masters/hooks/useProducts';

export function CreateProductForm() {
  const { mutate: createProduct, isPending } = useCreateProduct();

  const handleSubmit = (data: ProductFormData) => {
    createProduct(data, {
      onSuccess: () => {
        message.success('Product created!');
      },
      onError: (error) => {
        message.error(error.message);
      },
    });
  };

  return <ProductsFormPanel onSubmit={handleSubmit} isLoading={isPending} />;
}
```

### Example 3: Search and Filter

```typescript
import { useProducts } from '@/modules/features/masters/hooks/useProducts';
import { ProductFilters } from '@/types/masters';

export function SearchProducts() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const { products } = useProducts(filters);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleCategoryFilter = (category: string) => {
    setFilters({ ...filters, category });
  };

  return (
    <div>
      <Input.Search onChange={(e) => handleSearch(e.target.value)} />
      <Select onChange={handleCategoryFilter} placeholder="Select category">
        {/* options */}
      </Select>
      <List dataSource={products} renderItem={/* ... */} />
    </div>
  );
}
```

---

## Troubleshooting & Common Issues

### Issue 1: Products Not Loading

**Symptoms**: Empty list, loading spinner stuck

**Solutions**:
1. Check `VITE_API_MODE` environment variable
2. Verify Supabase connection (if using supabase mode)
3. Check browser console for errors
4. Verify RBAC permissions
5. Check network tab in DevTools

### Issue 2: Validation Errors on Submit

**Symptoms**: Form won't submit, error messages appear

**Solutions**:
1. Verify all required fields are filled
2. Check field constraints (max length, format, etc.)
3. Check the error message for specific constraint
4. Refer to form tooltips for field requirements
5. Check browser console for detailed error

### Issue 3: Cache Not Updating

**Symptoms**: After create/update, list doesn't refresh

**Solutions**:
1. Verify mutation includes `onSuccess` cache invalidation
2. Check React Query DevTools
3. Manually trigger refetch
4. Clear browser cache and reload
5. Check for console errors

### Issue 4: Performance Issues

**Symptoms**: Slow loading, laggy interactions

**Solutions**:
1. Enable React Query DevTools to check cache
2. Verify query stale times
3. Implement pagination for large lists
4. Check for unnecessary re-renders
5. Profile with Chrome DevTools Performance tab

### Issue 5: Multi-Tenant Issues

**Symptoms**: Wrong data showing for tenant, permission denied

**Solutions**:
1. Verify tenant context is set correctly
2. Check RLS policies in Supabase
3. Verify current user has correct tenant_id
4. Check for tenant_id in all queries
5. Review RBAC role permissions

---

## Related Documentation

- **Service Factory Pattern**: `.zencoder/rules/repo.md`
- **Layer Sync Rules**: `.zencoder/rules/standardized-layer-development.md`
- **Testing Standards**: `.zencoder/rules/layer-sync-implementation-guide.md`
- **RBAC System**: `src/modules/features/rbac/DOC.md`
- **Database Schema**: `supabase/migrations/`

---

## Version History

- **v1.0** - 2025-02-11 - Initial comprehensive documentation for Masters module completion
  - Complete 8-layer architecture documented
  - All CRUD operations fully implemented
  - Comprehensive test coverage (unit, integration, parity)
  - Component documentation with examples
  - Integration points with other modules
  - Troubleshooting section added

---

## Support & Contact

For questions or issues:
1. Check the **Troubleshooting** section above
2. Review **Common Use Cases & Examples**
3. Check module test files for implementation details
4. Review `.zencoder/rules/` for architecture patterns

---

**Module Status**: ✅ Complete & Production Ready (2025-02-11)  
**Last Verified**: 2025-02-11  
**Test Coverage**: Unit ✅ Integration ✅ Parity ✅  
**Documentation**: Complete ✅