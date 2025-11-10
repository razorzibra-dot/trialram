---
title: Products Module Normalization - Complete 8-Layer Implementation Guide
description: Complete step-by-step implementation showing all 8 layers of application synchronized for Products module denormalization
date: 2025-01-30
version: 1.0.0
status: ready-for-implementation
projectName: PDS-CRM Database Normalization
checklistType: implementation
author: AI Agent
---

# Products Module Normalization - Complete Implementation

**Module**: Products (Masters)  
**Denormalized Fields**: 2 fields
- `category: string` → should be `category_id` (FK)
- `is_active: boolean` → redundant with `status` field

**Complexity**: ⭐⭐ LOW  
**Estimated Time**: 2 days  
**Files to Update**: 5-6 files

---

## Executive Summary

This document provides a **complete, production-ready implementation** of Product module normalization following strict 8-layer synchronization rules.

**Before**: `category` denormalized string + `is_active` redundant boolean  
**After**: `category_id` FK + only `status` for state management

### Layer Synchronization Overview

```
Layer 1: DATABASE SCHEMA
  └→ Remove: category (string)
  └→ Remove: is_active (boolean) - keep status instead
  └→ Add: category_id (UUID FK) - if not exists

Layer 2: TYPESCRIPT TYPES
  └→ Remove: category?: string
  └→ Remove: is_active?: boolean
  └→ Add: categoryId?: string (FK)
  └→ Keep: status field (single source of state)

Layer 3: MOCK SERVICE
  └→ Remove category/is_active from mock data
  └→ Add categoryId to mock data
  └→ Keep same validation rules

Layer 4: SUPABASE SERVICE
  └→ Update SELECT to include categoryId
  └→ Remove category/is_active columns from query
  └→ Add mapping: category_id as categoryId
  └→ Create row mapper function

Layer 5: SERVICE FACTORY
  └→ Verify routing works correctly
  └→ Update method signatures if needed

Layer 6: MODULE SERVICE
  └→ Use factory (no direct imports)
  └→ Maintain same public methods

Layer 7: HOOKS
  └→ Handle loading/error states
  └→ Cache invalidation for mutations
  └→ Same return types

Layer 8: UI COMPONENTS
  └→ Update form fields
  └→ Update field bindings
  └→ Add tooltips for constraints
  └→ Handle null FK values gracefully
```

---

## LAYER 1: DATABASE SCHEMA

### Current Schema (BEFORE)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,           -- ❌ DENORMALIZED
  brand VARCHAR(100),
  manufacturer VARCHAR(100),
  type VARCHAR(50),
  sku VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,           -- ❌ REDUNDANT with status
  stock_quantity INT DEFAULT 0,
  min_stock_level INT,
  max_stock_level INT,
  reorder_level INT,
  track_stock BOOLEAN DEFAULT TRUE,
  unit VARCHAR(20),
  min_order_quantity INT,
  weight DECIMAL(10,2),
  dimensions VARCHAR(100),
  supplier_id UUID,
  supplier_name VARCHAR(255),               -- ❌ DENORMALIZED (keep for backward compat)
  tags TEXT[],
  image_url VARCHAR(500),
  warranty_period INT,
  service_contract_available BOOLEAN,
  notes TEXT,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

### Migration: Normalized Schema (AFTER)

```sql
-- File: supabase/migrations/20250201000001_normalize_products_table.sql

BEGIN;

-- Step 1: Create product_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Step 2: Create category_id column
ALTER TABLE products ADD COLUMN category_id UUID;

-- Step 3: Migrate existing category strings to category references
-- Find or create category records for existing values
INSERT INTO product_categories (name, tenant_id, created_at, updated_at)
SELECT DISTINCT category, tenant_id, NOW(), NOW()
FROM products
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Step 4: Update products.category_id with FK references
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = pc.name AND p.tenant_id = pc.tenant_id;

-- Step 5: Add FK constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_category_id 
FOREIGN KEY (category_id) REFERENCES product_categories(id);

-- Step 6: Mark old columns for deprecation (keep for backward compat, will remove later)
COMMENT ON COLUMN products.category IS 'DEPRECATED: Use category_id + JOIN to product_categories instead';
COMMENT ON COLUMN products.is_active IS 'DEPRECATED: Use status field instead';

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- Step 8: Create view for backward compatibility during transition
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.*,
  pc.name as category_name
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id;

COMMIT;
```

### Migration Strategy

1. **Phase 1** (Deploy this migration): Add category_id, migrate data, add FK, add view
2. **Phase 2** (After code changes): Remove old columns (category, is_active)
3. **Rollback Plan** (If needed): 
   - Keep old columns for 1 week
   - Can restore from backup if critical issue
   - Views maintain read compatibility

---

## LAYER 2: TYPESCRIPT TYPES

### Current Types (BEFORE)

```typescript
// File: src/types/masters.ts (current)

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;                 // ❌ DENORMALIZED
  brand?: string;
  manufacturer?: string;
  type?: string;
  sku: string;
  
  price: number;
  cost_price?: number;
  currency?: string;
  
  status?: 'active' | 'inactive' | 'discontinued';
  is_active?: boolean;              // ❌ REDUNDANT
  
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  track_stock?: boolean;
  unit?: string;
  min_order_quantity?: number;
  
  weight?: number;
  dimensions?: string;
  
  supplier_id?: string;
  supplier_name?: string;           // ⚠️  Also denormalized but not in this scope
  
  tags?: string[];
  specifications?: ProductSpecification[];
  images?: string[];
  image_url?: string;
  warranty_period?: number;
  service_contract_available?: boolean;
  notes?: string;
  
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProductFormData {
  name: string;
  category: string;                 // ❌ Change this
  brand?: string;
  // ... rest
}
```

### Updated Types (AFTER)

```typescript
// File: src/types/masters.ts (updated)

import { z } from 'zod';

/**
 * Core Product Interface - Normalized
 * 
 * REMOVED denormalized fields:
 * - category: string → Use categoryId + JOIN to product_categories
 * - is_active: boolean → Use status field instead
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;              // ✅ FK instead of denormalized string
  category?: string;                // ✅ Optional: populated by detailed queries
  brand?: string;
  manufacturer?: string;
  type?: string;
  sku: string;
  
  price: number;
  cost_price?: number;
  currency?: string;
  
  // ✅ Single source of state (removed is_active)
  status?: 'active' | 'inactive' | 'discontinued';
  
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  track_stock?: boolean;
  unit?: string;
  min_order_quantity?: number;
  
  weight?: number;
  dimensions?: string;
  
  supplier_id?: string;
  supplier_name?: string;           // ⚠️  Still denormalized (Phase 2)
  
  tags?: string[];
  specifications?: ProductSpecification[];
  images?: string[];
  image_url?: string;
  warranty_period?: number;
  service_contract_available?: boolean;
  notes?: string;
  
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Input DTO for creating products
 * Excludes: id, created_at, updated_at, created_by
 */
export interface ProductCreateInput {
  name: string;
  description?: string;
  categoryId?: string;              // ✅ FK required for proper categorization
  brand?: string;
  manufacturer?: string;
  type?: string;
  sku: string;
  
  price: number;
  cost_price?: number;
  currency?: string;
  
  status?: 'active' | 'inactive' | 'discontinued';  // ✅ Single state field
  
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  track_stock?: boolean;
  unit?: string;
  min_order_quantity?: number;
  
  weight?: number;
  dimensions?: string;
  
  supplier_id?: string;
  
  tags?: string[];
  images?: string[];
  image_url?: string;
  warranty_period?: number;
  service_contract_available?: boolean;
  notes?: string;
}

/**
 * Input DTO for updating products
 * All fields optional
 */
export interface ProductUpdateInput {
  name?: string;
  description?: string;
  categoryId?: string;              // ✅ Can change category
  brand?: string;
  manufacturer?: string;
  type?: string;
  sku?: string;
  
  price?: number;
  cost_price?: number;
  currency?: string;
  
  status?: 'active' | 'inactive' | 'discontinued';
  
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  track_stock?: boolean;
  unit?: string;
  min_order_quantity?: number;
  
  weight?: number;
  dimensions?: string;
  
  supplier_id?: string;
  
  tags?: string[];
  images?: string[];
  image_url?: string;
  warranty_period?: number;
  service_contract_available?: boolean;
  notes?: string;
}

/**
 * Zod Validation Schema
 * Ensures data integrity at all layers
 */
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),           // ✅ FK validation
  category: z.string().optional(),                    // For detailed queries
  brand: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  sku: z.string().min(1).max(50),
  
  price: z.number().nonnegative(),
  cost_price: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  
  stock_quantity: z.number().int().nonnegative().optional(),
  min_stock_level: z.number().int().nonnegative().optional(),
  max_stock_level: z.number().int().nonnegative().optional(),
  reorder_level: z.number().int().nonnegative().optional(),
  track_stock: z.boolean().optional(),
  unit: z.string().max(20).optional(),
  min_order_quantity: z.number().int().positive().optional(),
  
  weight: z.number().nonnegative().optional(),
  dimensions: z.string().max(100).optional(),
  
  supplier_id: z.string().uuid().optional(),
  
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  image_url: z.string().url().optional(),
  warranty_period: z.number().int().nonnegative().optional(),
  service_contract_available: z.boolean().optional(),
  notes: z.string().optional(),
  
  tenant_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().optional(),
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  category: true, // Not in input
});

export type Product = z.infer<typeof ProductSchema>;
```

### Key Changes

| Change | Before | After | Reason |
|--------|--------|-------|--------|
| Category field | `category: string` | `categoryId?: string` | Use FK instead of denormalized data |
| is_active field | `is_active?: boolean` | Removed | Redundant - use status instead |
| Optional category | No | `category?: string` | Populated only in detailed queries |
| Validation | Manual/loose | Zod schema | Ensures consistency across layers |

---

## LAYER 3: MOCK SERVICE

### Current Mock Service (BEFORE)

```typescript
// File: src/services/productService.ts (current)

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Product A',
    description: 'Test product',
    category: 'Electronics',                // ❌ Denormalized string
    sku: 'SKU-001',
    price: 99.99,
    status: 'active',
    is_active: true,                        // ❌ Redundant with status
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export const mockProductService = {
  async getProducts(): Promise<Product[]> {
    return mockProducts;
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    // Currently accepts category string
    return {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
};
```

### Updated Mock Service (AFTER)

```typescript
// File: src/services/productService.ts (updated)

import { Product, ProductCreateInput, ProductUpdateInput, ProductCreateSchema } from '@/types/masters';
import { v4 as generateId } from 'uuid';

/**
 * Mock product data - NORMALIZED
 * No longer includes denormalized fields:
 * - category string → categoryId only
 * - is_active → status field only
 */
const mockCategories = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Software' },
  { id: 'cat-3', name: 'Services' },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Product A',
    description: 'Test product',
    categoryId: 'cat-1',                    // ✅ FK instead of string
    sku: 'SKU-001',
    price: 99.99,
    status: 'active',                       // ✅ Single state field
    // is_active removed
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Product B',
    description: 'Another test product',
    categoryId: 'cat-2',
    sku: 'SKU-002',
    price: 149.99,
    status: 'inactive',
    tenant_id: 'tenant-1',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
];

export const mockProductService = {
  /**
   * Get all products (without category names - use getProductsWithDetails for that)
   */
  async getProducts(filters?: any): Promise<Product[]> {
    let results = mockProducts;

    if (filters?.status) {
      results = results.filter(p => p.status === filters.status);
    }

    if (filters?.categoryId) {
      results = results.filter(p => p.categoryId === filters.categoryId);
    }

    return results;
  },

  /**
   * Get products with category details (JOIN simulation)
   */
  async getProductsWithDetails(filters?: any): Promise<(Product & { category: string })[]> {
    let results = await this.getProducts(filters);

    return results.map(product => ({
      ...product,
      category: mockCategories.find(c => c.id === product.categoryId)?.name || 'Unknown',
    }));
  },

  /**
   * Get single product
   */
  async getProduct(id: string): Promise<Product> {
    const product = mockProducts.find(p => p.id === id);
    if (!product) throw new Error(`Product ${id} not found`);
    return product;
  },

  /**
   * Get single product with details
   */
  async getProductWithDetails(id: string): Promise<Product & { category: string }> {
    const product = await this.getProduct(id);
    return {
      ...product,
      category: mockCategories.find(c => c.id === product.categoryId)?.name || 'Unknown',
    };
  },

  /**
   * Create new product
   * NOTE: categoryId is now FK, must reference existing category
   */
  async createProduct(data: ProductCreateInput): Promise<Product> {
    // Validate input
    try {
      ProductCreateSchema.parse(data);
    } catch (error: any) {
      throw new Error(`Validation failed: ${error.message}`);
    }

    // Validate categoryId references existing category
    if (data.categoryId) {
      const category = mockCategories.find(c => c.id === data.categoryId);
      if (!category) {
        throw new Error(`Category ${data.categoryId} does not exist`);
      }
    }

    // Validate status enum
    if (data.status && !['active', 'inactive', 'discontinued'].includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}. Must be active, inactive, or discontinued`);
    }

    const newProduct: Product = {
      id: generateId(),
      ...data,
      status: data.status || 'active',
      tenant_id: data.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockProducts.push(newProduct);
    return newProduct;
  },

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: ProductUpdateInput): Promise<Product> {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);

    // Validate categoryId if provided
    if (data.categoryId) {
      const category = mockCategories.find(c => c.id === data.categoryId);
      if (!category) {
        throw new Error(`Category ${data.categoryId} does not exist`);
      }
    }

    const updated = {
      ...mockProducts[index],
      ...data,
      id: mockProducts[index].id,           // Don't allow ID change
      created_at: mockProducts[index].created_at, // Don't change created_at
      updated_at: new Date().toISOString(),
    };

    mockProducts[index] = updated;
    return updated;
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);
    mockProducts.splice(index, 1);
  },

  /**
   * Helper: Get categories (for UI dropdowns)
   */
  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    return mockCategories;
  },
};
```

### Key Changes

| Aspect | Before | After | Why |
|--------|--------|-------|-----|
| Mock data | `category: 'Electronics'` | `categoryId: 'cat-1'` | Use FK reference |
| Mock data | `is_active: true` | Removed | Status field only |
| Create validation | Basic | Zod schema + FK check | Ensure data integrity |
| New method | N/A | `getProductsWithDetails()` | Support queries that need category names |
| Error handling | Minimal | Detailed messages | Help developers debug |

---

## LAYER 4: SUPABASE SERVICE

### Current Supabase Service (BEFORE)

```typescript
// File: src/services/supabase/productService.ts (current)

export const supabaseProductService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,                     // ❌ Denormalized
        sku,
        price,
        status,
        is_active,                    // ❌ Redundant
        // ... other fields
      `);

    if (error) throw error;
    return data || [];
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    const { data: result, error } = await supabase
      .from('products')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  },
};
```

### Updated Supabase Service (AFTER)

```typescript
// File: src/services/supabase/productService.ts (updated)

import { supabase } from './client';
import { Product, ProductCreateInput, ProductUpdateInput, ProductCreateSchema } from '@/types/masters';

/**
 * Centralized row mapper
 * Ensures consistent field mapping across all queries
 * Maps snake_case database columns → camelCase TypeScript fields
 */
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,              // ✅ Map FK column
    brand: row.brand,
    manufacturer: row.manufacturer,
    type: row.type,
    sku: row.sku,
    price: parseFloat(row.price),             // Decimal → number
    cost_price: row.cost_price ? parseFloat(row.cost_price) : undefined,
    currency: row.currency,
    status: row.status,                       // ✅ Single state field
    stock_quantity: row.stock_quantity,
    min_stock_level: row.min_stock_level,
    max_stock_level: row.max_stock_level,
    reorder_level: row.reorder_level,
    track_stock: row.track_stock,
    unit: row.unit,
    min_order_quantity: row.min_order_quantity,
    weight: row.weight ? parseFloat(row.weight) : undefined,
    dimensions: row.dimensions,
    supplier_id: row.supplier_id,
    tags: row.tags,
    image_url: row.image_url,
    warranty_period: row.warranty_period,
    service_contract_available: row.service_contract_available,
    notes: row.notes,
    tenant_id: row.tenant_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
  };
}

/**
 * Row mapper for detailed queries (with JOINed category data)
 */
function mapProductRowWithDetails(row: any): Product & { category?: string } {
  const product = mapProductRow(row);
  return {
    ...product,
    category: row.category_name,              // From JOINed product_categories
  };
}

export const supabaseProductService = {
  /**
   * Get all products (normalized schema)
   * NOTE: category_id returned instead of category string
   */
  async getProducts(filters?: any): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category_id,                  -- ✅ FK column
        brand,
        manufacturer,
        type,
        sku,
        price,
        cost_price,
        currency,
        status,
        -- is_active column removed from SELECT
        stock_quantity,
        min_stock_level,
        max_stock_level,
        reorder_level,
        track_stock,
        unit,
        min_order_quantity,
        weight,
        dimensions,
        supplier_id,
        tags,
        image_url,
        warranty_period,
        service_contract_available,
        notes,
        tenant_id,
        created_at,
        updated_at,
        created_by
      `);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(mapProductRow);
  },

  /**
   * Get products with category details (via JOIN)
   * Use this when you need category name in results
   */
  async getProductsWithDetails(filters?: any): Promise<(Product & { category?: string })[]> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category_id,
        brand,
        manufacturer,
        type,
        sku,
        price,
        cost_price,
        currency,
        status,
        stock_quantity,
        min_stock_level,
        max_stock_level,
        reorder_level,
        track_stock,
        unit,
        min_order_quantity,
        weight,
        dimensions,
        supplier_id,
        tags,
        image_url,
        warranty_period,
        service_contract_available,
        notes,
        tenant_id,
        created_at,
        updated_at,
        created_by,
        product_categories:category_id (name as category_name)  -- ✅ JOIN to get category name
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(mapProductRowWithDetails);
  },

  /**
   * Get single product
   */
  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, description, category_id, brand, manufacturer, type, sku,
        price, cost_price, currency, status, stock_quantity,
        min_stock_level, max_stock_level, reorder_level, track_stock,
        unit, min_order_quantity, weight, dimensions, supplier_id,
        tags, image_url, warranty_period, service_contract_available,
        notes, tenant_id, created_at, updated_at, created_by
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Product ${id} not found`);
    return mapProductRow(data);
  },

  /**
   * Get single product with category details
   */
  async getProductWithDetails(id: string): Promise<Product & { category?: string }> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, description, category_id, brand, manufacturer, type, sku,
        price, cost_price, currency, status, stock_quantity,
        min_stock_level, max_stock_level, reorder_level, track_stock,
        unit, min_order_quantity, weight, dimensions, supplier_id,
        tags, image_url, warranty_period, service_contract_available,
        notes, tenant_id, created_at, updated_at, created_by,
        product_categories:category_id (name as category_name)  -- ✅ JOIN
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Product ${id} not found`);
    return mapProductRowWithDetails(data);
  },

  /**
   * Create product (normalized schema)
   * Validates categoryId references existing category
   */
  async createProduct(data: ProductCreateInput): Promise<Product> {
    // Validate input with Zod
    try {
      ProductCreateSchema.parse(data);
    } catch (error: any) {
      throw new Error(`Validation failed: ${error.message}`);
    }

    // Validate categoryId if provided (FK constraint check)
    if (data.categoryId) {
      const { data: category, error: catError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('id', data.categoryId)
        .single();

      if (catError || !category) {
        throw new Error(`Category ${data.categoryId} does not exist`);
      }
    }

    const { data: result, error } = await supabase
      .from('products')
      .insert([{
        name: data.name,
        description: data.description,
        category_id: data.categoryId,         // ✅ Use categoryId FK
        brand: data.brand,
        manufacturer: data.manufacturer,
        type: data.type,
        sku: data.sku,
        price: data.price,
        cost_price: data.cost_price,
        currency: data.currency,
        status: data.status || 'active',      // ✅ No is_active
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        reorder_level: data.reorder_level,
        track_stock: data.track_stock,
        unit: data.unit,
        min_order_quantity: data.min_order_quantity,
        weight: data.weight,
        dimensions: data.dimensions,
        supplier_id: data.supplier_id,
        tags: data.tags,
        image_url: data.image_url,
        warranty_period: data.warranty_period,
        service_contract_available: data.service_contract_available,
        notes: data.notes,
        tenant_id: data.tenant_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapProductRow(result);
  },

  /**
   * Update product
   */
  async updateProduct(id: string, data: ProductUpdateInput): Promise<Product> {
    // Validate categoryId if provided
    if (data.categoryId) {
      const { data: category, error: catError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('id', data.categoryId)
        .single();

      if (catError || !category) {
        throw new Error(`Category ${data.categoryId} does not exist`);
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.cost_price !== undefined) updateData.cost_price = data.cost_price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
    if (data.min_stock_level !== undefined) updateData.min_stock_level = data.min_stock_level;
    if (data.max_stock_level !== undefined) updateData.max_stock_level = data.max_stock_level;
    if (data.reorder_level !== undefined) updateData.reorder_level = data.reorder_level;
    if (data.track_stock !== undefined) updateData.track_stock = data.track_stock;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.min_order_quantity !== undefined) updateData.min_order_quantity = data.min_order_quantity;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.supplier_id !== undefined) updateData.supplier_id = data.supplier_id;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.warranty_period !== undefined) updateData.warranty_period = data.warranty_period;
    if (data.service_contract_available !== undefined) updateData.service_contract_available = data.service_contract_available;
    if (data.notes !== undefined) updateData.notes = data.notes;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapProductRow(result);
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get categories for UI dropdowns
   */
  async getCategories(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },
};
```

### Key Changes

| Aspect | Before | After | Why |
|--------|--------|-------|-----|
| SELECT fields | `category` | `category_id` | FK reference |
| SELECT fields | `is_active` | Removed | Use status only |
| Row mapping | Minimal | `mapProductRow()` | Centralized type conversion |
| Detailed queries | N/A | `getProductsWithDetails()` | Support category name via JOIN |
| JOIN query | N/A | `product_categories:category_id` | Get category names with JOIN |
| FK validation | N/A | Check category exists | Maintain referential integrity |
| Error messages | Generic | Specific & helpful | Better debugging |

---

## LAYER 5: SERVICE FACTORY

### Update Service Factory

```typescript
// File: src/services/serviceFactory.ts

import { supabaseProductService } from './supabase/productService';
import { mockProductService } from './productService';

// ... existing code ...

function getProductService() {
  return apiMode === 'supabase'
    ? supabaseProductService
    : mockProductService;
}

/**
 * Product Service Factory Exports
 * Routes calls to mock or supabase based on VITE_API_MODE
 */
export const productService = {
  getProducts: (filters?: any) => 
    getProductService().getProducts(filters),
  
  getProductsWithDetails: (filters?: any) =>
    getProductService().getProductsWithDetails?.(filters) || 
    getProductService().getProducts(filters),
  
  getProduct: (id: string) =>
    getProductService().getProduct(id),
  
  getProductWithDetails: (id: string) =>
    getProductService().getProductWithDetails?.(id) || 
    getProductService().getProduct(id),
  
  createProduct: (data: ProductCreateInput) =>
    getProductService().createProduct(data),
  
  updateProduct: (id: string, data: ProductUpdateInput) =>
    getProductService().updateProduct(id, data),
  
  deleteProduct: (id: string) =>
    getProductService().deleteProduct(id),
  
  getCategories: () =>
    getProductService().getCategories(),
};

export { productService } from './serviceFactory';
```

---

## LAYER 6: MODULE SERVICE

### Module Service (No Changes Needed)

```typescript
// File: src/modules/features/masters/services/productService.ts

import { productService as factoryProductService } from '@/services/serviceFactory';
import { Product, ProductCreateInput, ProductUpdateInput } from '@/types/masters';

/**
 * Module-level service
 * Coordinates between UI hooks and factory services
 */
export const moduleProductService = {
  async getProducts(filters?: any): Promise<Product[]> {
    return await factoryProductService.getProducts(filters);
  },

  async getProductsWithDetails(filters?: any): Promise<(Product & { category?: string })[]> {
    return await factoryProductService.getProductsWithDetails(filters);
  },

  async getProduct(id: string): Promise<Product> {
    return await factoryProductService.getProduct(id);
  },

  async getProductWithDetails(id: string): Promise<Product & { category?: string }> {
    return await factoryProductService.getProductWithDetails(id);
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    return await factoryProductService.createProduct(data);
  },

  async updateProduct(id: string, data: ProductUpdateInput): Promise<Product> {
    return await factoryProductService.updateProduct(id, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return await factoryProductService.deleteProduct(id);
  },

  async getCategories() {
    return await factoryProductService.getCategories();
  },
};
```

---

## LAYER 7: HOOKS

### Updated Hooks

```typescript
// File: src/modules/features/masters/hooks/useProducts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleProductService } from '../services/productService';
import { Product, ProductCreateInput, ProductUpdateInput } from '@/types/masters';

// Query keys for consistency
const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
};

/**
 * Fetch all products (without category names)
 */
export function useProducts(filters?: any) {
  const { data: products = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => moduleProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });

  return { products, loading, error, refetch };
}

/**
 * Fetch products with category details (for display)
 */
export function useProductsWithDetails(filters?: any) {
  const { data: products = [], isLoading: loading, error } = useQuery({
    queryKey: [...PRODUCT_KEYS.list(filters), 'details'],
    queryFn: () => moduleProductService.getProductsWithDetails(filters),
    staleTime: 5 * 60 * 1000,
  });

  return { products, loading, error };
}

/**
 * Fetch single product
 */
export function useProduct(id: string) {
  const { data: product, isLoading: loading, error } = useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => moduleProductService.getProduct(id),
  });

  return { product, loading, error };
}

/**
 * Create product mutation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCreateInput) =>
      moduleProductService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
  });
}

/**
 * Update product mutation
   */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductUpdateInput) =>
      moduleProductService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
  });
}

/**
 * Delete product mutation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      moduleProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
  });
}

/**
 * Fetch categories for dropdowns
 */
export function useCategories() {
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => moduleProductService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  return { categories, loading };
}
```

---

## LAYER 8: UI COMPONENTS

### Updated Form Component

```typescript
// File: src/modules/features/masters/components/ProductForm.tsx

import { Form, Input, InputNumber, Select, Switch, Button, Spin, message } from 'antd';
import { useCreateProduct, useUpdateProduct, useCategories } from '../hooks';
import { Product, ProductCreateInput, ProductUpdateInput } from '@/types/masters';

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [form] = Form.useForm();
  const { categories, loading: categoriesLoading } = useCategories();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct(product?.id || '');

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values: any) => {
    try {
      const input: ProductCreateInput | ProductUpdateInput = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,        // ✅ Use categoryId instead of category
        brand: values.brand,
        manufacturer: values.manufacturer,
        type: values.type,
        sku: values.sku,
        price: values.price,
        cost_price: values.cost_price,
        currency: values.currency,
        status: values.status,                // ✅ Single status field (no is_active)
        stock_quantity: values.stock_quantity,
        min_stock_level: values.min_stock_level,
        max_stock_level: values.max_stock_level,
        reorder_level: values.reorder_level,
        track_stock: values.track_stock,
        unit: values.unit,
        min_order_quantity: values.min_order_quantity,
        weight: values.weight,
        dimensions: values.dimensions,
        supplier_id: values.supplier_id,
        tags: values.tags,
        image_url: values.image_url,
        warranty_period: values.warranty_period,
        service_contract_available: values.service_contract_available,
        notes: values.notes,
      };

      if (product) {
        updateProduct(input as ProductUpdateInput, {
          onSuccess: () => {
            message.success('Product updated successfully');
            onSuccess?.();
          },
          onError: (error: any) => {
            message.error(error.message);
          },
        });
      } else {
        createProduct({
          ...input,
          tenant_id: getTenantId(), // Get from context
        } as ProductCreateInput, {
          onSuccess: () => {
            message.success('Product created successfully');
            form.resetFields();
            onSuccess?.();
          },
          onError: (error: any) => {
            message.error(error.message);
          },
        });
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <Spin spinning={isLoading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={product}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Product Name"
          tooltip="Product name (max 255 characters)"
          rules={[
            { required: true, message: 'Product name is required' },
            { max: 255, message: 'Max 255 characters' },
          ]}
        >
          <Input placeholder="Enter product name" maxLength={255} />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          tooltip="Detailed product description"
        >
          <Input.TextArea rows={3} placeholder="Enter product description" />
        </Form.Item>

        {/* ✅ Changed: category string → categoryId dropdown */}
        <Form.Item
          name="categoryId"
          label="Category"
          tooltip="Select product category from dropdown (normalized)"
          rules={[
            { required: true, message: 'Please select a category' },
          ]}
        >
          <Select
            placeholder="Select category..."
            loading={categoriesLoading}
            options={categories.map(cat => ({
              label: cat.name,
              value: cat.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU"
          tooltip="Stock Keeping Unit (unique identifier, max 50 chars)"
          rules={[
            { required: true, message: 'SKU is required' },
            { max: 50, message: 'Max 50 characters' },
          ]}
        >
          <Input placeholder="Enter SKU" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="brand"
          label="Brand"
          tooltip="Product brand name (max 100 characters)"
          rules={[{ max: 100, message: 'Max 100 characters' }]}
        >
          <Input placeholder="Enter brand" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          tooltip="Unit price (decimal, 2 decimal places)"
          rules={[
            { required: true, message: 'Price is required' },
            { pattern: /^\d+(\.\d{1,2})?$/, message: 'Max 2 decimal places' },
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            placeholder="0.00"
            className="w-full"
          />
        </Form.Item>

        {/* ✅ Changed: Removed is_active field */}
        {/* Now using 'status' field only */}
        <Form.Item
          name="status"
          label="Status"
          tooltip="Database field: status (active, inactive, discontinued)"
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Discontinued', value: 'discontinued' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="stock_quantity"
          label="Stock Quantity"
          tooltip="Current stock quantity (integer, >= 0)"
          rules={[
            { type: 'number', message: 'Must be a number' },
            { pattern: /^\d+$/, message: 'Must be a positive integer' },
          ]}
        >
          <InputNumber min={0} step={1} placeholder="0" />
        </Form.Item>

        <Form.Item
          name="track_stock"
          label="Track Stock"
          tooltip="Enable stock tracking for this product"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} className="w-full">
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
```

### Updated List Component

```typescript
// File: src/modules/features/masters/components/ProductsList.tsx

import { Table, Space, Button, Popconfirm, Tag, Spin, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useProductsWithDetails, useDeleteProduct } from '../hooks';
import { Product } from '@/types/masters';

interface ProductsListProps {
  onEdit: (product: Product) => void;
}

export function ProductsList({ onEdit }: ProductsListProps) {
  const { products, loading } = useProductsWithDetails();
  const { mutate: deleteProduct } = useDeleteProduct();

  const handleDelete = (id: string) => {
    deleteProduct(id, {
      onSuccess: () => {
        message.success('Product deleted');
      },
      onError: (error: any) => {
        message.error(error.message);
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Category',                    // ✅ Display category name from JOIN
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag>{category || 'Uncategorized'}</Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 80,
    },
    {
      title: 'Status',                      // ✅ Show status (no is_active)
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record: Product) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Delete Product"
            description="Are you sure?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Spin>
  );
}
```

---

## Testing Implementation

### Unit Test

```typescript
// File: src/modules/features/masters/__tests__/productNormalization.test.ts

import { describe, it, expect } from 'vitest';
import { mockProductService } from '@/services/productService';
import { ProductCreateSchema } from '@/types/masters';

describe('Products Module Normalization', () => {
  
  it('should use categoryId FK instead of denormalized category string', async () => {
    const product = await mockProductService.getProduct('prod-1');
    
    // ✅ Has FK
    expect(product.categoryId).toBeDefined();
    expect(typeof product.categoryId).toBe('string');
    
    // ❌ No denormalized string
    expect(product).not.toHaveProperty('category');
  });

  it('should use status field only (no is_active)', async () => {
    const product = await mockProductService.getProduct('prod-1');
    
    // ✅ Has status
    expect(product.status).toBeDefined();
    expect(['active', 'inactive', 'discontinued']).toContain(product.status);
    
    // ❌ No is_active field
    expect(product).not.toHaveProperty('is_active');
  });

  it('should validate categoryId FK exists', async () => {
    const invalidInput = {
      name: 'Test',
      categoryId: 'non-existent-category',
      sku: 'TEST',
      price: 99.99,
      tenant_id: 'tenant-1',
    };

    try {
      await mockProductService.createProduct(invalidInput);
      expect.fail('Should throw FK error');
    } catch (error: any) {
      expect(error.message).toContain('category');
    }
  });

  it('should fetch product with category details via getProductsWithDetails', async () => {
    const products = await mockProductService.getProductsWithDetails();
    
    // ✅ Should have category name from JOIN simulation
    expect(products[0].category).toBeDefined();
    expect(typeof products[0].category).toBe('string');
    
    // ✅ Still has categoryId
    expect(products[0].categoryId).toBeDefined();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migration tested in staging
- [ ] All 8 layers verified synchronized
- [ ] Unit tests passing (100%)
- [ ] Integration tests passing (100%)
- [ ] Mock and Supabase services verified
- [ ] Performance benchmarks met
- [ ] Form bindings tested
- [ ] Category dropdown works correctly
- [ ] Backward compatibility maintained (views available)
- [ ] Team trained on changes

### Deployment Steps

1. **Database** (Maintenance window: 30 minutes)
   - [ ] Apply migration
   - [ ] Verify product_categories table created
   - [ ] Verify category_id populated
   - [ ] Verify indexes created

2. **Application** (No downtime)
   - [ ] Deploy updated code
   - [ ] Verify mock service works
   - [ ] Verify Supabase service works
   - [ ] Test API endpoints

3. **Verification**
   - [ ] Products list displays correctly
   - [ ] Products can be created
   - [ ] Categories render in dropdown
   - [ ] No console errors
   - [ ] Performance acceptable

4. **Post-Deployment**
   - [ ] Monitor error logs (24 hours)
   - [ ] Verify data accuracy
   - [ ] Check performance metrics
   - [ ] Remove old columns (after 1 week grace period)

---

## Rollback Plan

If critical issue occurs:

1. **Database Rollback** (10-15 minutes)
   ```sql
   -- Restore category strings from backup
   UPDATE products SET category = pc.name
   FROM product_categories pc
   WHERE products.category_id = pc.id;
   ```

2. **Application Rollback** (2-5 minutes)
   - Redeploy previous version
   - Revert to old type definitions
   - Revert to old service queries

3. **Communication**
   - Notify users immediately
   - Update status page
   - Post-mortem within 48 hours

---

## Summary

This implementation demonstrates complete 8-layer synchronization for Products module normalization:

1. ✅ **Database**: Migration to add category_id FK, remove denormalized fields
2. ✅ **Types**: Updated to use categoryId (FK), removed is_active
3. ✅ **Mock Service**: Updated mock data and validation
4. ✅ **Supabase Service**: Queries updated, mappers created, JOINs added
5. ✅ **Factory**: Routing verified
6. ✅ **Module Service**: Uses factory exclusively
7. ✅ **Hooks**: Cache invalidation, proper return types
8. ✅ **UI Components**: Forms and lists updated, category dropdown

All layers remain synchronized and production-ready.

---

**Ready for Implementation**: ✅ YES  
**Complexity Level**: ⭐⭐ LOW  
**Estimated Time**: 2 days  
**Risk Level**: 🟢 LOW (simple module, good example)