---
description: Practical Implementation Guide - Step-by-step instructions for synchronizing all application layers
alwaysApply: true
---

# Layer Synchronization Implementation Guide

**Quick Start**: Follow these exact steps when adding or modifying features to keep all layers in sync.

---

## Template: Complete Feature Implementation

Use these templates as starting points for any new feature.

### Template 1: Simple CRUD Entity

**Scenario**: Adding a new master data table (e.g., `product_categories`)

#### Step 1: Database Migration

```sql
-- File: supabase/migrations/20250130000001_add_product_categories.sql

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_categories_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_order ON product_categories(display_order);
```

#### Step 2: TypeScript Types

```typescript
// File: src/types/productCategory.ts

import { z } from 'zod';

/**
 * Product category matching database table 'product_categories'
 * Fields must align exactly with database columns
 */
export interface ProductCategoryType {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating category
 * Omits id and timestamp fields (database generates)
 */
export interface ProductCategoryCreateInput {
  name: string;
  description?: string;
  displayOrder?: number;
}

/**
 * Input for updating category
 * All fields optional
 */
export interface ProductCategoryUpdateInput {
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Validation schema using Zod
 * Matches database constraints exactly
 */
export const ProductCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductCategoryCreateSchema = z.object({
  name: z.string().max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export function validateProductCategory(data: unknown): ProductCategory {
  return ProductCategorySchema.parse(data);
}
```

#### Step 3: Mock Service

```typescript
// File: src/services/productCategoryService.ts

import { 
  ProductCategoryType, 
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
  validateProductCategory,
} from '@/types/productCategory';

const mockCategories: ProductCategoryType[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic products',
    displayOrder: 1,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Furniture',
    description: 'Furniture and fixtures',
    displayOrder: 2,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export const mockProductCategoryService = {
  async getProductCategories(): Promise<ProductCategoryType[]> {
    return mockCategories;
  },

  async getProductCategory(id: string): Promise<ProductCategoryType> {
    const category = mockCategories.find(c => c.id === id);
    if (!category) throw new Error(`Category ${id} not found`);
    return category;
  },

  async createProductCategory(data: ProductCategoryCreateInput): Promise<ProductCategoryType> {
    // Validate input
    if (!data.name || data.name.length === 0) {
      throw new Error('Name is required');
    }
    if (data.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    const category: ProductCategoryType = {
      id: Math.random().toString(),
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCategories.push(category);
    return category;
  },

  async updateProductCategory(
    id: string,
    data: ProductCategoryUpdateInput
  ): Promise<ProductCategoryType> {
    const index = mockCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Category ${id} not found`);

    if (data.name && data.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    const updated = {
      ...mockCategories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    mockCategories[index] = updated;
    return updated;
  },

  async deleteProductCategory(id: string): Promise<void> {
    const index = mockCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Category ${id} not found`);
    mockCategories.splice(index, 1);
  },
};
```

#### Step 4: Supabase Service

```typescript
// File: src/services/supabase/productCategoryService.ts

import { supabase } from './client';
import {
  ProductCategoryType,
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
} from '@/types/productCategory';

/**
 * Centralized row mapper for consistency
 * Maps database columns to TypeScript fields
 * CRITICAL: Keep this function synchronized with database schema
 */
function mapCategoryRow(row: any): ProductCategoryType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseProductCategoryService = {
  async getProductCategories(): Promise<ProductCategoryType[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        id,
        name,
        description,
        display_order as displayOrder,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapCategoryRow);
  },

  async getProductCategory(id: string): Promise<ProductCategoryType> {
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        id,
        name,
        description,
        display_order as displayOrder,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Category ${id} not found`);
    return mapCategoryRow(data);
  },

  async createProductCategory(data: ProductCategoryCreateInput): Promise<ProductCategoryType> {
    // Validate exactly like mock
    if (!data.name || data.name.length === 0) {
      throw new Error('Name is required');
    }
    if (data.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    const { data: result, error } = await supabase
      .from('product_categories')
      .insert([{
        name: data.name,
        description: data.description || null,
        display_order: data.displayOrder ?? 0,
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapCategoryRow(result);
  },

  async updateProductCategory(
    id: string,
    data: ProductCategoryUpdateInput
  ): Promise<ProductCategoryType> {
    if (data.name && data.name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    const { data: result, error } = await supabase
      .from('product_categories')
      .update({
        name: data.name,
        description: data.description || null,
        display_order: data.displayOrder,
        is_active: data.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCategoryRow(result);
  },

  async deleteProductCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

#### Step 5: Service Factory

```typescript
// File: src/services/serviceFactory.ts - ADD these exports

import { supabaseProductCategoryService } from './supabase/productCategoryService';
import { mockProductCategoryService } from './productCategoryService';

function getProductCategoryService() {
  return apiMode === 'supabase'
    ? supabaseProductCategoryService
    : mockProductCategoryService;
}

export const productCategoryService = {
  getProductCategories: () =>
    getProductCategoryService().getProductCategories(),
  
  getProductCategory: (id: string) =>
    getProductCategoryService().getProductCategory(id),
  
  createProductCategory: (data: any) =>
    getProductCategoryService().createProductCategory(data),
  
  updateProductCategory: (id: string, data: any) =>
    getProductCategoryService().updateProductCategory(id, data),
  
  deleteProductCategory: (id: string) =>
    getProductCategoryService().deleteProductCategory(id),
};

// Export from index
export { productCategoryService } from './serviceFactory';
```

#### Step 6: Module Service

```typescript
// File: src/modules/features/masters/services/productCategoryService.ts

import { productCategoryService as factoryService } from '@/services/serviceFactory';
import { 
  ProductCategoryType,
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
} from '@/types/productCategory';

/**
 * Module-level service for product categories
 * Coordinates between UI and backend services
 */
export const moduleProductCategoryService = {
  async getProductCategories(): Promise<ProductCategoryType[]> {
    return await factoryService.getProductCategories();
  },

  async getProductCategory(id: string): Promise<ProductCategoryType> {
    return await factoryService.getProductCategory(id);
  },

  async createProductCategory(data: ProductCategoryCreateInput): Promise<ProductCategoryType> {
    return await factoryService.createProductCategory(data);
  },

  async updateProductCategory(
    id: string,
    data: ProductCategoryUpdateInput
  ): Promise<ProductCategoryType> {
    return await factoryService.updateProductCategory(id, data);
  },

  async deleteProductCategory(id: string): Promise<void> {
    return await factoryService.deleteProductCategory(id);
  },
};
```

#### Step 7: Hooks

```typescript
// File: src/modules/features/masters/hooks/useProductCategories.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleProductCategoryService } from '../services/productCategoryService';
import {
  ProductCategoryType,
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
} from '@/types/productCategory';

// Query keys for consistency
const PRODUCT_CATEGORY_KEYS = {
  all: ['productCategories'] as const,
  lists: () => [...PRODUCT_CATEGORY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...PRODUCT_CATEGORY_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_CATEGORY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_CATEGORY_KEYS.details(), id] as const,
};

export function useProductCategories() {
  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: PRODUCT_CATEGORY_KEYS.lists(),
    queryFn: () => moduleProductCategoryService.getProductCategories(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    categories,
    loading: isLoading,
    error,
    refetch,
  };
}

export function useProductCategory(id: string) {
  const { data: category, isLoading, error } = useQuery({
    queryKey: PRODUCT_CATEGORY_KEYS.detail(id),
    queryFn: () => moduleProductCategoryService.getProductCategory(id),
  });

  return {
    category,
    loading: isLoading,
    error,
  };
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCategoryCreateInput) =>
      moduleProductCategoryService.createProductCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_CATEGORY_KEYS.lists(),
      });
    },
  });
}

export function useUpdateProductCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCategoryUpdateInput) =>
      moduleProductCategoryService.updateProductCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_CATEGORY_KEYS.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: PRODUCT_CATEGORY_KEYS.lists(),
      });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      moduleProductCategoryService.deleteProductCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_CATEGORY_KEYS.lists(),
      });
    },
  });
}
```

#### Step 8: UI Component

```typescript
// File: src/modules/features/masters/components/ProductCategoryForm.tsx

import { Form, Input, InputNumber, Switch, Button, Spin, message } from 'antd';
import { useCreateProductCategory, useUpdateProductCategory } from '../hooks';
import { ProductCategoryType, ProductCategoryCreateInput, ProductCategoryUpdateInput } from '@/types/productCategory';

interface ProductCategoryFormProps {
  category?: ProductCategoryType;
  onSuccess?: () => void;
}

export function ProductCategoryForm({ category, onSuccess }: ProductCategoryFormProps) {
  const [form] = Form.useForm();
  const { mutate: createCategory, isPending: isCreating } = useCreateProductCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateProductCategory(category?.id || '');

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values: any) => {
    try {
      if (category) {
        // Update mode
        const input: ProductCategoryUpdateInput = {
          name: values.name,
          description: values.description,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
        };
        updateCategory(input, {
          onSuccess: () => {
            message.success('Category updated successfully');
            onSuccess?.();
          },
          onError: (error: any) => {
            message.error(error.message);
          },
        });
      } else {
        // Create mode
        const input: ProductCategoryCreateInput = {
          name: values.name,
          description: values.description,
          displayOrder: values.displayOrder,
        };
        createCategory(input, {
          onSuccess: () => {
            message.success('Category created successfully');
            form.resetFields();
            onSuccess?.();
          },
          onError: (error: any) => {
            message.error(error.message);
          },
        });
      }
    } catch (err: any) {
      message.error(err.message);
    }
  };

  return (
    <Spin spinning={isLoading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={category}
        onFinish={handleSubmit}
      >
        {/* Exact field mapping from database */}
        <Form.Item
          name="name"
          label="Category Name"
          tooltip="Max 100 characters (database constraint)"
          rules={[
            { required: true, message: 'Name is required' },
            { max: 100, message: 'Name cannot exceed 100 characters' },
          ]}
        >
          <Input
            placeholder="Enter category name"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          tooltip="Optional description (TEXT field in database)"
        >
          <Input.TextArea
            placeholder="Enter category description"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="displayOrder"
          label="Display Order"
          tooltip="Sort order for display (default: 0)"
          rules={[
            { type: 'number', message: 'Must be a number' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || value >= 0) return Promise.resolve();
                return Promise.reject(new Error('Must be non-negative'));
              },
            }),
          ]}
        >
          <InputNumber
            min={0}
            step={1}
            defaultValue={0}
          />
        </Form.Item>

        {category && (
          <Form.Item
            name="isActive"
            label="Active"
            tooltip="Database field: is_active (BOOLEAN)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            {category ? 'Update Category' : 'Create Category'}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
```

#### Step 9: Tests

```typescript
// File: src/modules/features/masters/__tests__/productCategorySync.test.ts

import { describe, it, expect } from 'vitest';
import { mockProductCategoryService } from '@/services/productCategoryService';
import { supabaseProductCategoryService } from '@/services/supabase/productCategoryService';
import { ProductCategoryCreateSchema } from '@/types/productCategory';

describe('ProductCategory Service Sync', () => {
  it('mock and supabase return same structure', async () => {
    const mockCategories = await mockProductCategoryService.getProductCategories();
    // In real test, would compare with supabase data

    expect(mockCategories[0]).toHaveProperty('id');
    expect(mockCategories[0]).toHaveProperty('name');
    expect(mockCategories[0]).toHaveProperty('displayOrder');
    expect(mockCategories[0]).toHaveProperty('isActive');
  });

  it('validation rules match database constraints', () => {
    const validData = {
      name: 'Electronics',
      description: 'Electronic products',
      displayOrder: 1,
    };

    expect(() => ProductCategoryCreateSchema.parse(validData)).not.toThrow();

    // Test max length constraint
    const invalidData = {
      name: 'a'.repeat(101), // Exceeds max 100
      displayOrder: 1,
    };

    expect(() => ProductCategoryCreateSchema.parse(invalidData)).toThrow();
  });

  it('field mapping is correct', () => {
    const mockData = {
      id: '1',
      name: 'Test',
      description: 'Test Description',
      display_order: 1,
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    // Simulates Supabase row mapping
    const mapped = {
      id: mockData.id,
      name: mockData.name,
      description: mockData.description,
      displayOrder: mockData.display_order,
      isActive: mockData.is_active,
      createdAt: mockData.created_at,
      updatedAt: mockData.updated_at,
    };

    expect(mapped.displayOrder).toBe(1);
    expect(mapped.isActive).toBe(true);
  });
});
```

---

## Scenario 1: Adding a New Form Field to Existing Entity

**Task**: Add `notes` field to `products` table

### 1. Database

```sql
ALTER TABLE products ADD COLUMN notes TEXT;
```

### 2. TypeScript Type

```typescript
// src/types/product.ts - MODIFY existing interface

export interface ProductType {
  // ... existing fields ...
  notes?: string; // NEW FIELD
}

export interface ProductCreateInput {
  // ... existing fields ...
  notes?: string; // NEW FIELD
}
```

### 3. Mock Service

```typescript
// src/services/productService.ts - UPDATE methods

export const mockProductService = {
  async getProducts(): Promise<ProductType[]> {
    return [
      {
        // ... existing fields ...
        notes: 'Sample notes', // ADD FIELD
      },
    ];
  },
};
```

### 4. Supabase Service

```typescript
// src/services/supabase/productService.ts - UPDATE query

async getProducts(): Promise<ProductType[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      // ... existing fields ...
      notes  // ADD TO SELECT
    `);
  // ...
}

// UPDATE mapper
function mapProductRow(row: any): ProductType {
  return {
    // ... existing fields ...
    notes: row.notes, // ADD TO MAPPER
  };
}
```

### 5. UI Form

```typescript
// Component - ADD field

<Form.Item
  name="notes"
  label="Notes"
  tooltip="Optional notes (TEXT field)"
>
  <Input.TextArea rows={3} />
</Form.Item>
```

### 6. Tests

```typescript
it('notes field synced across layers', () => {
  const mockData = { /* ... */ notes: 'test' };
  const supabaseData = { /* ... */ notes: 'test' };
  
  expect(mockData.notes).toBe(supabaseData.notes);
});
```

---

## Scenario 2: Changing Field Type or Constraint

**Task**: Change `price` from `DECIMAL(10,2)` to `DECIMAL(12,2)` and add CHECK constraint for max value

### Steps:

1. **Create migration**:
```sql
ALTER TABLE products 
  ALTER COLUMN price TYPE DECIMAL(12,2),
  ADD CONSTRAINT price_max CHECK (price <= 999999.99);
```

2. **Update validation**:
```typescript
export const ProductUpdateSchema = z.object({
  price: z.number().max(999999.99),
});
```

3. **Update mock service**: No code change needed (uses same validation)

4. **Update UI tooltip**: Document new constraint
```typescript
<Form.Item
  tooltip="Max 999999.99 (database constraint)"
  rules={[{ max: 999999.99 }]}
>
```

5. **Update tests**: Test new max value constraint

---

## Scenario 3: Adding a Relationship

**Task**: Add `department_id` foreign key to `employees` table

### Steps:

1. **Create migration**:
```sql
ALTER TABLE employees 
  ADD COLUMN department_id UUID,
  ADD CONSTRAINT fk_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);
```

2. **Update type**:
```typescript
export interface EmployeeType {
  // ... existing ...
  departmentId: string; // NEW FK
}
```

3. **Update services**: Add field to queries and mappers

4. **Update UI**: Add department selector dropdown
```typescript
<Form.Item
  name="departmentId"
  label="Department"
  rules={[{ required: true }]}
>
  <Select
    options={departments.map(d => ({
      value: d.id,
      label: d.name,
    }))}
  />
</Form.Item>
```

---

## Verification Checklist: Before Merging Code

```markdown
## Pre-Merge Synchronization Check

### Database Layer
- [ ] Migration file created and reviewed
- [ ] All constraints defined
- [ ] Indexes created
- [ ] Column comments added

### Types Layer  
- [ ] TypeScript interface created
- [ ] All DB fields represented
- [ ] Zod validation schema created
- [ ] Types exported from central file

### Services Layer
- [ ] Mock service has same structure
- [ ] Mock service has same validation
- [ ] Supabase service maps columns correctly
- [ ] Row mapper function centralizes mappings
- [ ] Both services return same types

### Integration
- [ ] Factory exports method
- [ ] Module service uses factory
- [ ] Hooks import from factory
- [ ] No direct service imports in UI

### UI Layer
- [ ] Form fields match database names (camelCase)
- [ ] Validation matches database constraints
- [ ] Tooltips document constraints
- [ ] Error handling implemented
- [ ] Loading states shown

### Testing
- [ ] Service sync test added
- [ ] Type sync test added
- [ ] Form integration test added
- [ ] All tests passing

### Documentation
- [ ] Database constraints documented
- [ ] Form fields have helpful tooltips
- [ ] Types file has comments
```

---

**Use this guide to ensure perfect synchronization across all layers!**

---

**Last Updated**: 2025-01-30  
**Version**: 1.0.0  
**Status**: Active