---
description: Standardized Multi-Layer Development Process - Ensures complete synchronization across UI, Hooks, Services, Supabase, Mock, and Database layers
alwaysApply: true
---

# Standardized Multi-Layer Development Process

**Last Updated**: 2025-01-30  
**Version**: 1.0.0  
**Status**: Active Enforcement

## Core Philosophy

**One Source of Truth Per Feature**: Every feature must maintain a single, synchronized definition across all layers. Field mapping, validation rules, defaults, and business logic must align perfectly from database to UI.

---

## Application Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                             │
│           (React Components, Forms, Controls)            │
└────────────────────┬────────────────────────────────────┘
                     │ Field Binding, Event Handlers
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Hooks Layer                            │
│        (Custom React Hooks, Data Fetching Logic)         │
└────────────────────┬────────────────────────────────────┘
                     │ API Calls, State Management
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 Service Layer                            │
│           (Module-Level Services, Business Logic)        │
└────────────────────┬────────────────────────────────────┘
                     │ Factory Routing
                     ↓
        ┌────────────┴───────────┐
        │                        │
        ↓                        ↓
┌──────────────────┐    ┌──────────────────┐
│  Mock Service    │    │ Supabase Service │
│  (Development)   │    │  (Production)    │
└──────────────────┘    └────────┬─────────┘
                                 │
                                 ↓
                      ┌──────────────────────┐
                      │   Supabase Client    │
                      │  (PostgreSQL)        │
                      └──────────────────────┘
                                 │
                                 ↓
                      ┌──────────────────────┐
                      │  Database Schema     │
                      │  & Tables            │
                      └──────────────────────┘
```

---

## Layer Definitions & Responsibilities

### 1. **Database Layer** (Source of Truth)
**Location**: `/supabase/migrations/` and PostgreSQL schema  
**Responsibility**: Define tables, columns, types, constraints, and relationships

**Key Rules**:
- ✅ Define all fields with explicit types
- ✅ Add NOT NULL constraints where required
- ✅ Define foreign keys and relationships
- ✅ Add indexes for performance-critical fields
- ✅ Include CHECK constraints for business rules
- ✅ Use enums for fixed sets of values
- ✅ Include default values where applicable
- ❌ Never change column types after deployment without migration
- ❌ Never remove columns without archival strategy

**Field Documentation**:
```sql
-- Example: Well-documented table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,           -- Product name (max 255 chars)
  sku VARCHAR(50) NOT NULL UNIQUE,      -- Stock keeping unit (max 50 chars)
  category_id UUID NOT NULL,            -- Reference to product_categories
  price DECIMAL(10, 2) NOT NULL,        -- Unit price (2 decimal places, >= 0)
  stock_qty INT NOT NULL DEFAULT 0,     -- Current stock quantity (>= 0)
  status product_status NOT NULL        -- Enum: active|inactive|discontinued
    DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  CONSTRAINT price_check CHECK (price >= 0),
  CONSTRAINT stock_check CHECK (stock_qty >= 0)
);
```

### 2. **Mock Service Layer** (Development Data)
**Location**: `/src/services/{serviceName}.ts`  
**Responsibility**: Provide mock data that mirrors database schema exactly

**Key Rules**:
- ✅ Mirror all fields from database table definition
- ✅ Use identical field names (case-sensitive)
- ✅ Use identical data types
- ✅ Use identical validation rules
- ✅ Include all required fields in mock data
- ✅ Apply same business logic as Supabase service
- ✅ Return exact same TypeScript interfaces
- ❌ Never modify mock data structure without updating database
- ❌ Never use different field names than database

**Mock Service Template**:
```typescript
// src/services/productService.ts
import { ProductType } from '@/types/product'; // Centralized types

export const mockProductService = {
  async getProducts(): Promise<ProductType[]> {
    // Return exact same structure as Supabase
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Product A',
        sku: 'SKU-001',
        categoryId: 'cat-001',
        price: 99.99,
        stockQty: 100,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async createProduct(data: ProductCreateInput): Promise<ProductType> {
    // Apply same validation as Supabase
    validateProductInput(data);
    
    return {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
```

### 3. **Supabase Service Layer** (Production Data)
**Location**: `/src/services/supabase/{serviceName}.ts`  
**Responsibility**: Query PostgreSQL database and return typed data

**Key Rules**:
- ✅ Use exact same field names as returned by database
- ✅ Map database columns to TypeScript interfaces
- ✅ Apply same validation as mock service
- ✅ Return exact same types as mock service
- ✅ Include all database constraints in client-side validation
- ✅ Handle NULL values appropriately
- ✅ Use parameterized queries for security
- ❌ Never return raw database columns without mapping
- ❌ Never apply different validation than mock service

**Supabase Service Template**:
```typescript
// src/services/supabase/productService.ts
import { supabase } from './client';
import { ProductType } from '@/types/product';

export const supabaseProductService = {
  async getProducts(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category_id as categoryId,
        price,
        stock_qty as stockQty,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      `)
      .eq('status', 'active');

    if (error) throw error;
    
    // Map and validate exactly like mock service
    return (data || []).map(mapProductRow);
  },

  async createProduct(data: ProductCreateInput): Promise<ProductType> {
    // Apply same validation
    validateProductInput(data);

    const { data: result, error } = await supabase
      .from('products')
      .insert([{
        name: data.name,
        sku: data.sku,
        category_id: data.categoryId,
        price: data.price,
        stock_qty: data.stockQty,
        status: data.status || 'active',
      }])
      .select()
      .single();

    if (error) throw error;
    return mapProductRow(result);
  },
};

// Centralized row mapper (CRITICAL for sync)
function mapProductRow(row: any): ProductType {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    categoryId: row.categoryId,
    price: parseFloat(row.price),
    stockQty: parseInt(row.stockQty, 10),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
```

### 4. **Module Service Layer** (Business Logic Coordinator)
**Location**: `/src/modules/features/{moduleName}/services/{moduleName}Service.ts`  
**Responsibility**: Coordinate between hooks and backend services, apply module-specific logic

**Key Rules**:
- ✅ Use factory pattern to call correct backend (mock/supabase)
- ✅ Apply module-specific business rules
- ✅ Transform data for module consumption
- ✅ Handle errors consistently
- ✅ Never duplicate backend service logic
- ✅ Always use same types as backend services
- ❌ Never call backend services directly (use factory)
- ❌ Never modify fields that don't align with database

**Module Service Template**:
```typescript
// src/modules/features/products/services/productService.ts
import { productService as factoryProductService } from '@/services/serviceFactory';
import { ProductType } from '@/types/product';

export const moduleProductService = {
  async getProducts(filters?: ProductFilters): Promise<ProductType[]> {
    // Call factory (which routes to mock or supabase)
    const products = await factoryProductService.getProducts();
    
    // Apply module-level filtering (not DB filtering)
    return applyFilters(products, filters);
  },

  async getProductWithInventory(id: string): Promise<ProductWithInventory> {
    const product = await factoryProductService.getProduct(id);
    const inventory = await factoryProductService.getInventory(id);
    
    // Combine data from different backend calls
    return enrichProductWithInventory(product, inventory);
  },
};
```

### 5. **Hooks Layer** (Data Fetching & State Management)
**Location**: `/src/modules/features/{moduleName}/hooks/use{Feature}.ts`  
**Responsibility**: Fetch data and manage component-level state

**Key Rules**:
- ✅ Use exact same types as services
- ✅ Return object with data, loading, error, refetch
- ✅ Handle loading and error states
- ✅ Use React Query for remote data
- ✅ Use Zustand store only for local state
- ✅ Never transform data types in hooks
- ✅ Document all returned fields
- ✅ Include TypeScript types for all returns
- ❌ Never fetch data without loading/error handling
- ❌ Never modify service data directly in hook

**Hook Template**:
```typescript
// src/modules/features/products/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { moduleProductService } from '../services/productService';
import { ProductType } from '@/types/product';

export interface UseProductsReturn {
  products: ProductType[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProducts(filters?: ProductFilters): UseProductsReturn {
  const { 
    data: products = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => moduleProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    products,
    loading,
    error,
    refetch,
  };
}
```

### 6. **UI Layer** (React Components & Forms)
**Location**: `/src/modules/features/{moduleName}/components/` and `/views/`  
**Responsibility**: Render data and capture user input

**Key Rules**:
- ✅ Use hooks to fetch data
- ✅ Bind form fields to exact database fields
- ✅ Apply same validation as database
- ✅ Use exact same TypeScript types
- ✅ Handle loading and error states
- ✅ Show validation errors from database
- ✅ Include field tooltips documenting database constraints
- ❌ Never fetch data directly from services
- ❌ Never modify data before sending to service
- ❌ Never rename fields from database

**UI Component Template**:
```typescript
// src/modules/features/products/components/ProductForm.tsx
import { Form, Input, Select, InputNumber, Spin } from 'antd';
import { useProducts, useCreateProduct } from '../hooks';
import { ProductType, ProductCreateInput } from '@/types/product';

interface ProductFormProps {
  initialValues?: ProductType;
  onSuccess?: () => void;
}

export function ProductForm({ initialValues, onSuccess }: ProductFormProps) {
  const [form] = Form.useForm();
  const { mutate: createProduct, isLoading } = useCreateProduct();

  const handleSubmit = async (values: any) => {
    // Map form values to exact service input type
    const input: ProductCreateInput = {
      name: values.name,
      sku: values.sku,
      categoryId: values.categoryId,
      price: parseFloat(values.price),
      stockQty: parseInt(values.stockQty, 10),
      status: values.status || 'active',
    };

    createProduct(input, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Spin spinning={isLoading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {/* Exact field names from database */}
        <Form.Item
          name="name"
          label="Product Name"
          tooltip="Max 255 characters (from database constraint)"
          rules={[
            { required: true, message: 'Name is required' },
            { max: 255, message: 'Max 255 characters' },
          ]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU"
          tooltip="Max 50 characters, must be unique"
          rules={[
            { required: true, message: 'SKU is required' },
            { max: 50, message: 'Max 50 characters' },
          ]}
        >
          <Input placeholder="Enter product SKU" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          tooltip="Must be >= 0 (decimal with 2 places)"
          rules={[
            { required: true, message: 'Price is required' },
            { 
              pattern: /^\d+(\.\d{1,2})?$/,
              message: 'Max 2 decimal places',
            },
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
          tooltip="Options: active, inactive, discontinued"
        >
          <Select
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Discontinued', value: 'discontinued' },
            ]}
          />
        </Form.Item>
      </Form>
    </Spin>
  );
}
```

---

## TypeScript Interface Definition Standard

**Location**: `/src/types/{moduleName}.ts`  
**Responsibility**: Single source of truth for all data types

```typescript
// src/types/product.ts

/**
 * Defines exact structure matching database table 'products'
 * Update whenever database schema changes
 */
export interface ProductType {
  // Column: id (UUID PRIMARY KEY)
  id: string;
  
  // Column: name (VARCHAR NOT NULL)
  name: string;
  
  // Column: sku (VARCHAR NOT NULL UNIQUE)
  sku: string;
  
  // Column: category_id (UUID NOT NULL FK)
  categoryId: string;
  
  // Column: price (DECIMAL NOT NULL)
  price: number;
  
  // Column: stock_qty (INT NOT NULL)
  stockQty: number;
  
  // Column: status (ENUM NOT NULL)
  status: 'active' | 'inactive' | 'discontinued';
  
  // Column: created_at (TIMESTAMP)
  createdAt: string;
  
  // Column: updated_at (TIMESTAMP)
  updatedAt: string;
}

/**
 * Input type for creating new products
 * Omits id and timestamp fields (database generates)
 */
export interface ProductCreateInput {
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  stockQty: number;
  status?: 'active' | 'inactive' | 'discontinued';
}

/**
 * Input type for updating products
 * All fields optional for PATCH operations
 */
export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  categoryId?: string;
  price?: number;
  stockQty?: number;
  status?: 'active' | 'inactive' | 'discontinued';
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message?: string;
}

/**
 * Pagination wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Field Mapping & Naming Conventions

### Database to TypeScript Naming

| Database (snake_case) | TypeScript (camelCase) | Reason |
|---|---|---|
| `product_id` | `productId` | JavaScript/TypeScript convention |
| `created_at` | `createdAt` | Consistent with JS Date conventions |
| `is_active` | `isActive` | Boolean prefix convention |
| `user_email` | `userEmail` | Compound noun convention |
| `category_id_ref` | `categoryIdRef` | Complex name handling |

### Critical Rule: Naming Consistency

```typescript
// ❌ WRONG: Inconsistent naming
const { data } = await supabase
  .from('products')
  .select('product_id, productName, created_date'); // Mixed conventions

// ✅ CORRECT: Consistent mapping
const { data } = await supabase
  .from('products')
  .select(`
    id as productId,
    name as productName,
    created_at as createdAt
  `);

// Then map to TypeScript type
const product: ProductType = {
  productId: data.productId,
  productName: data.productName,
  createdAt: data.createdAt,
};
```

---

## Step-by-Step: Adding a New Feature

### **Phase 1: Database Design**

```sql
-- 1. Create migration file: 20250130000001_add_product_reviews.sql

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,                    -- FK to products
  user_id UUID NOT NULL,                       -- FK to users
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,                                -- Nullable
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
```

### **Phase 2: TypeScript Types**

```typescript
// src/types/product.ts - ADD to existing file

export interface ProductReviewType {
  id: string;
  productId: string;
  userId: string;
  rating: number;     // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewCreateInput {
  productId: string;
  userId: string;
  rating: number;
  comment?: string;
}
```

### **Phase 3: Mock Service**

```typescript
// src/services/productService.ts - ADD method

export const mockProductService = {
  // ... existing methods ...

  async getProductReviews(productId: string): Promise<ProductReviewType[]> {
    return [
      {
        id: '1',
        productId,
        userId: 'user-1',
        rating: 5,
        comment: 'Great product!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async createProductReview(data: ProductReviewCreateInput): Promise<ProductReviewType> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    return {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
```

### **Phase 4: Supabase Service**

```typescript
// src/services/supabase/productService.ts - ADD method

export const supabaseProductService = {
  // ... existing methods ...

  async getProductReviews(productId: string): Promise<ProductReviewType[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        id,
        product_id as productId,
        user_id as userId,
        rating,
        comment,
        created_at as createdAt,
        updated_at as updatedAt
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createProductReview(data: ProductReviewCreateInput): Promise<ProductReviewType> {
    // Validate exactly like mock
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data: result, error } = await supabase
      .from('product_reviews')
      .insert([{
        product_id: data.productId,
        user_id: data.userId,
        rating: data.rating,
        comment: data.comment || null,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: result.id,
      productId: result.product_id,
      userId: result.user_id,
      rating: result.rating,
      comment: result.comment,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },
};
```

### **Phase 5: Service Factory**

```typescript
// src/services/serviceFactory.ts - ADD export

export const productReviewService = {
  getProductReviews: (productId: string) => 
    getProductService().getProductReviews(productId),
  
  createProductReview: (data: ProductReviewCreateInput) =>
    getProductService().createProductReview(data),
};
```

### **Phase 6: Module Service**

```typescript
// src/modules/features/products/services/productService.ts - ADD method

export const moduleProductService = {
  // ... existing methods ...

  async getProductReviews(productId: string): Promise<ProductReviewType[]> {
    return await productReviewService.getProductReviews(productId);
  },

  async createProductReview(data: ProductReviewCreateInput): Promise<ProductReviewType> {
    return await productReviewService.createProductReview(data);
  },
};
```

### **Phase 7: Custom Hook**

```typescript
// src/modules/features/products/hooks/useProductReviews.ts - NEW FILE

import { useQuery, useMutation } from '@tanstack/react-query';
import { moduleProductService } from '../services/productService';
import { ProductReviewType, ProductReviewCreateInput } from '@/types/product';

export interface UseProductReviewsReturn {
  reviews: ProductReviewType[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProductReviews(productId: string): UseProductReviewsReturn {
  const { data: reviews = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['productReviews', productId],
    queryFn: () => moduleProductService.getProductReviews(productId),
  });

  return { reviews, loading, error, refetch };
}

export function useCreateProductReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductReviewCreateInput) =>
      moduleProductService.createProductReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['productReviews', variables.productId],
      });
    },
  });
}
```

### **Phase 8: UI Component**

```typescript
// src/modules/features/products/components/ProductReviewForm.tsx - NEW FILE

import { Form, Input, Rate, Button, List, Empty, Spin } from 'antd';
import { useProductReviews, useCreateProductReview } from '../hooks';
import { ProductReviewCreateInput } from '@/types/product';

interface ProductReviewFormProps {
  productId: string;
}

export function ProductReviewForm({ productId }: ProductReviewFormProps) {
  const [form] = Form.useForm();
  const { reviews, loading } = useProductReviews(productId);
  const { mutate: createReview, isPending } = useCreateProductReview();

  const handleSubmit = async (values: any) => {
    const input: ProductReviewCreateInput = {
      productId,
      userId: getCurrentUserId(), // Get from context
      rating: values.rating,
      comment: values.comment,
    };

    createReview(input, {
      onSuccess: () => {
        form.resetFields();
      },
    });
  };

  return (
    <div>
      {/* Review Form - Exact field mapping from database */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="rating"
          label="Rating"
          tooltip="Select rating from 1 to 5 (database constraint: 1-5)"
          rules={[{ required: true, message: 'Rating is required' }]}
        >
          <Rate count={5} />
        </Form.Item>

        <Form.Item
          name="comment"
          label="Comment"
          tooltip="Optional comment (TEXT field)"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={isPending}>
          Submit Review
        </Button>
      </Form>

      {/* Reviews List */}
      <Spin spinning={loading}>
        {reviews.length === 0 ? (
          <Empty description="No reviews yet" />
        ) : (
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <div>
                  <Rate disabled defaultValue={review.rating} />
                  <p>{review.comment}</p>
                </div>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );
}
```

---

## Validation Synchronization

### Database Constraints (Source of Truth)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'shipped', 'delivered')),
  notes TEXT,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Validation Mirror

```typescript
// src/types/order.ts
import { z } from 'zod';

// Define Zod schema matching database constraints
export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().max(50),           // VARCHAR(50)
  quantity: z.number().int().positive(),     // CHECK (quantity > 0)
  totalAmount: z.number().nonnegative(),     // CHECK (total_amount >= 0)
  status: z.enum(['pending', 'shipped', 'delivered']), // CHECK constraint
  notes: z.string().optional(),              // TEXT nullable
  deliveryDate: z.string().date().optional(),
  createdAt: z.string().datetime(),
});

export type OrderType = z.infer<typeof OrderSchema>;

// Validation helper used in both mock and supabase
export function validateOrder(data: unknown): OrderType {
  return OrderSchema.parse(data);
}
```

### Hook Level

```typescript
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: OrderCreateInput) => {
      // Validate before sending (catches errors early)
      validateOrder(input);
      return moduleOrderService.createOrder(input);
    },
    onError: (error) => {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        // Show field-level errors
        error.errors.forEach(err => {
          console.error(`${err.path.join('.')}: ${err.message}`);
        });
      }
    },
  });
}
```

### UI Level

```typescript
<Form.Item
  name="quantity"
  label="Quantity"
  tooltip="Must be > 0 (database constraint)"
  rules={[
    { required: true },
    { 
      pattern: /^[1-9]\d*$/,
      message: 'Quantity must be positive integer',
    },
  ]}
>
  <InputNumber min={1} step={1} />
</Form.Item>

<Form.Item
  name="status"
  label="Status"
  rules={[{ required: true }]}
  tooltip="Database constraint: pending, shipped, or delivered"
>
  <Select options={[
    { label: 'Pending', value: 'pending' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ]} />
</Form.Item>
```

---

## Synchronization Verification Checklist

Before implementing any feature, use this checklist to ensure all layers are synchronized:

### ✅ Database Layer

- [ ] Table created with all required columns
- [ ] Column types match TypeScript types exactly
- [ ] Constraints defined (NOT NULL, CHECK, UNIQUE, FK)
- [ ] Indexes created for performance
- [ ] Enums defined for fixed value sets
- [ ] Migration file created
- [ ] Documentation comments on critical columns

### ✅ Types Layer

- [ ] TypeScript interface created
- [ ] All database fields represented
- [ ] Field names are camelCase
- [ ] Optional fields marked with `?`
- [ ] Validation schema created (Zod/Joi)
- [ ] Input/Create/Update types defined separately
- [ ] Types exported from central location

### ✅ Mock Service Layer

- [ ] Service methods created
- [ ] Mock data includes all fields
- [ ] Same field names as TypeScript types
- [ ] Same validation as Supabase service
- [ ] Returns exactly same types
- [ ] Error handling implemented
- [ ] Matches service interface

### ✅ Supabase Service Layer

- [ ] Queries select all required fields
- [ ] Column names mapped to camelCase
- [ ] Same validation as mock service
- [ ] Returns same TypeScript types
- [ ] Error handling matches mock
- [ ] Row mapper function centralizes transformations
- [ ] Parameterized queries used (security)

### ✅ Service Factory

- [ ] Method exported from factory
- [ ] Routes to correct backend (mock/supabase)
- [ ] Same method signature as backends
- [ ] Returns same types

### ✅ Module Service

- [ ] Imports from factory (not direct backend)
- [ ] Methods coordinate data flows
- [ ] Module-specific logic applied
- [ ] Same types used throughout
- [ ] No data transformation without reason

### ✅ Hooks Layer

- [ ] Hook created for each operation
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Return types documented
- [ ] React Query keys consistent
- [ ] Mutation hooks include cache invalidation
- [ ] TypeScript types imported correctly

### ✅ UI Component Layer

- [ ] Form fields match database columns exactly
- [ ] Form field names in camelCase
- [ ] Validation rules match database constraints
- [ ] Tooltips document database constraints
- [ ] Input types match TypeScript types
- [ ] Error messages from validation shown
- [ ] Loading states displayed
- [ ] No data transformation in component

---

## Common Pitfalls & Prevention

### ❌ Pitfall 1: Field Name Mismatch

**Problem**:
```typescript
// Database: first_name
// UI Form: firstName
// But service returns: firstname (wrong!)

const user = await userService.getUser();
console.log(user.firstname); // undefined - should be firstName
```

**Prevention**:
- ✅ Always use camelCase in TypeScript
- ✅ Always use snake_case in SQL
- ✅ Map explicitly in service: `first_name as firstName`
- ✅ Test field mapping with unit tests

### ❌ Pitfall 2: Type Mismatch

**Problem**:
```typescript
// Database: price DECIMAL(10,2)
// Mock service: price as number (correct)
// But Supabase returns: price as string (wrong!)

const { price } = await service.getProduct();
console.log(typeof price); // "string" instead of "number"
```

**Prevention**:
- ✅ Always parse numeric types: `parseFloat(price)`
- ✅ Write tests comparing mock vs supabase types
- ✅ Use TypeScript strict mode
- ✅ Use type guards in hooks

### ❌ Pitfall 3: Validation Mismatch

**Problem**:
```typescript
// Database: CHECK (quantity > 0)
// Mock service: allows 0
// UI: requires positive
// Result: inconsistent behavior in dev vs production
```

**Prevention**:
- ✅ Define validation once (Zod schema)
- ✅ Use validation in all layers
- ✅ Document database constraints in code
- ✅ Test validation in all services

### ❌ Pitfall 4: Missing Null Handling

**Problem**:
```typescript
// Database: notes TEXT (nullable)
// Supabase returns: null
// UI tries: notes.toUpperCase() - Error!
```

**Prevention**:
- ✅ Mark optional fields with `?` in TypeScript
- ✅ Always check for null in services
- ✅ Use optional chaining in UI: `notes?.toUpperCase()`
- ✅ Test with null values

### ❌ Pitfall 5: Enum Mismatch

**Problem**:
```sql
-- Database enum
CREATE TYPE order_status AS ENUM ('pending', 'shipped', 'delivered');

// TypeScript - WRONG
type OrderStatus = string; // Too permissive

// TypeScript - CORRECT
type OrderStatus = 'pending' | 'shipped' | 'delivered';
```

**Prevention**:
- ✅ Use TypeScript unions for enums
- ✅ Use Zod for validation: `z.enum(['pending', 'shipped'])`
- ✅ Test all enum values
- ✅ Add to UI dropdown with exact values

### ❌ Pitfall 6: Cache Invalidation

**Problem**:
```typescript
// Created product but UI still shows old list
useMutation({
  mutationFn: createProduct,
  // WRONG: No cache invalidation!
});
```

**Prevention**:
- ✅ Invalidate related queries after mutation
- ✅ Use consistent queryKey structure
- ✅ Test cache invalidation

```typescript
useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['products'], // Matches useQuery key
    });
  },
});
```

---

## Testing & Verification

### Mock vs Supabase Parity Test

```typescript
// __tests__/serviceSync.test.ts
import { mockProductService } from '@/services/productService';
import { supabaseProductService } from '@/services/supabase/productService';

describe('Service Parity', () => {
  it('mock and supabase return same type structure', async () => {
    // Setup mock data
    const mockData = await mockProductService.getProducts();
    
    // Get supabase data (in test environment)
    const supabaseData = await supabaseProductService.getProducts();

    // Compare structure
    expect(Object.keys(mockData[0])).toEqual(Object.keys(supabaseData[0]));
  });

  it('validation rules match', () => {
    const invalidData = {
      name: '',
      sku: 'a'.repeat(100), // Exceeds max
      price: -10, // Negative
      stockQty: -1,
    };

    expect(() => mockProductService.validate(invalidData))
      .toThrow();
    
    expect(() => supabaseProductService.validate(invalidData))
      .toThrow();
  });
});
```

### Field Mapping Test

```typescript
it('database columns map to correct TypeScript fields', async () => {
  const result = await supabaseProductService.getProduct('123');

  // Check all fields exist and have correct types
  expect(result).toHaveProperty('id');
  expect(typeof result.id).toBe('string');
  
  expect(result).toHaveProperty('categoryId'); // snake_case → camelCase
  expect(typeof result.categoryId).toBe('string');
  
  expect(result).toHaveProperty('price');
  expect(typeof result.price).toBe('number'); // DECIMAL → number
  
  expect(result).toHaveProperty('stockQty');
  expect(typeof result.stockQty).toBe('number'); // INT → number
});
```

### Form Integration Test

```typescript
it('form values bind correctly to service', async () => {
  const formValues = {
    name: 'Test Product',
    sku: 'TEST-123',
    price: 99.99,
    stockQty: 10,
  };

  const input: ProductCreateInput = {
    name: formValues.name,
    sku: formValues.sku,
    categoryId: 'cat-1',
    price: formValues.price,
    stockQty: formValues.stockQty,
  };

  const result = await moduleProductService.createProduct(input);

  // Verify all fields persisted correctly
  expect(result.name).toBe(formValues.name);
  expect(result.sku).toBe(formValues.sku);
  expect(result.price).toBe(formValues.price);
  expect(result.stockQty).toBe(formValues.stockQty);
});
```

---

## Enforcement Rules

### Code Review Checklist

All PRs adding/modifying features must pass:

```markdown
## Layer Synchronization Verification

- [ ] Database: Schema defined with constraints
- [ ] Types: TypeScript interfaces created
- [ ] Types: Validation schema (Zod) created
- [ ] Mock Service: Mock data matches database structure
- [ ] Mock Service: Validation rules implemented
- [ ] Supabase Service: Column mapping correct (snake → camel)
- [ ] Supabase Service: Same validation as mock
- [ ] Factory: Method exported and routed correctly
- [ ] Module Service: Uses factory pattern
- [ ] Hook: Returns loading/error/data states
- [ ] Hook: Cache keys consistent
- [ ] Hook: Mutation includes cache invalidation
- [ ] UI: Form fields match database columns
- [ ] UI: Form validation matches database constraints
- [ ] UI: Types used consistently
- [ ] Test: Service parity test added
- [ ] Test: Field mapping test added
- [ ] Test: Form integration test added
- [ ] Documentation: Database constraints documented
- [ ] Documentation: Form fields have tooltips
```

### Violation Penalties

| Violation | Severity | Action |
|-----------|----------|--------|
| Field name mismatch | Critical | PR rejected, must fix |
| Type mismatch | Critical | PR rejected, must fix |
| Validation inconsistency | Critical | PR rejected, must fix |
| Missing null handling | High | Must add before merge |
| No cache invalidation | High | Must add before merge |
| Missing tests | Medium | Must add before merge |
| No documentation | Low | Requested in review |

---

## Quick Reference: 7-Step Feature Implementation

1. **Database** → Create table with constraints
2. **Types** → Define TypeScript interface + Zod schema
3. **Mock Service** → Add method with mock data matching types
4. **Supabase Service** → Add query with proper column mapping
5. **Factory** → Export method routing to backends
6. **Module Service** → Add method using factory
7. **Hook** → Create hook with loading/error handling
8. **UI** → Build form binding to exact types
9. **Tests** → Add parity + mapping tests
10. **Docs** → Document database constraints in tooltips

---

## Related Documentation

- **Service Factory Pattern**: `.zencoder/rules/repo.md`
- **Code Quality Standards**: `.zencoder/rules/new-zen-rule.md`
- **Documentation Sync**: `.zencoder/rules/documentation-sync.md`
- **Module Examples**: `/src/modules/features/*/DOC.md`
- **Database Schema**: `/supabase/migrations/`

---

**Last Updated**: 2025-01-30  
**Next Review**: Monthly  
**Version**: 1.0.0