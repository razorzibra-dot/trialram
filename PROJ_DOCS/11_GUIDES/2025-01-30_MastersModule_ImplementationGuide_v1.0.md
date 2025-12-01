---
title: Masters Module Implementation Guide
description: Comprehensive guide for implementing and maintaining the Masters module with strict architectural rules and best practices
date: 2025-01-30
author: AI Agent
version: 1.0
status: active
projectName: PDS-CRM-Application
guideType: implementation
scope: Masters module development and maintenance
audience: developers
difficulty: intermediate
estimatedTime: 120 minutes
previousVersions: []
nextReview: 2025-02-15
---

# Masters Module Implementation Guide v1.0

## Overview & Purpose

This guide provides comprehensive instructions for implementing, maintaining, and extending the Masters module (Products and Companies management) following strict architectural rules and best practices. The Masters module serves as the foundation for master data management across the entire CRM system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Steps](#implementation-steps)
4. [Code Standards & Rules](#code-standards--rules)
5. [Testing Requirements](#testing-requirements)
6. [Performance Guidelines](#performance-guidelines)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance Procedures](#maintenance-procedures)

## Prerequisites/Requirements

### Technical Prerequisites
- ✅ Node.js 18+ and npm/yarn
- ✅ TypeScript 5.0+
- ✅ React 18+ with hooks
- ✅ Supabase client configured
- ✅ Ant Design 5.x components
- ✅ React Query 5.x for state management
- ✅ Service Factory pattern implemented

### Knowledge Prerequisites
- ✅ TypeScript advanced types and generics
- ✅ React hooks and custom hook patterns
- ✅ Ant Design component library
- ✅ Supabase database operations
- ✅ RESTful API design principles
- ✅ React Query caching strategies

### Environment Setup
```bash
# Clone and setup the project
git clone <repository-url>
cd CRMV9_NEWTHEME
npm install

# Environment configuration
cp .env.example .env
# Configure VITE_API_MODE, SUPABASE_URL, SUPABASE_ANON_KEY

# Start development server
npm run dev
```

## Architecture Overview

### 8-Layer Architecture Compliance

```
┌─────────────────────────────────────┐
│         Layer 8: Testing           │ ← Start here for new features
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Layer 7: React Components     │ ← UI implementation
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│       Layer 6: React Hooks         │ ← Data fetching logic
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Layer 5: Module Services      │ ← Business logic
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│    Layer 4: Service Factory        │ ← Backend routing
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│     Layer 3: Supabase Services     │ ← Database operations
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Layer 2: Mock Services        │ ← Development data
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│   Layer 1: Database Schema         │ ← Data structure
└─────────────────────────────────────┘
```

### Module Structure
```
src/modules/features/masters/
├── DOC.md                    # Module documentation
├── index.ts                  # Module exports
├── routes.tsx               # Route definitions
├── services/                # Business logic layer
│   ├── productService.ts    # Product operations
│   └── companyService.ts    # Company operations
├── hooks/                   # React Query hooks
│   ├── useProducts.ts       # Product hooks
│   └── useCompanies.ts      # Company hooks
├── components/              # Reusable UI components
│   ├── ProductsList.tsx     # Product table
│   ├── ProductsFormPanel.tsx # Product form
│   ├── CompaniesList.tsx    # Company table
│   └── CompaniesFormPanel.tsx # Company form
├── views/                   # Page components
│   ├── ProductsPage.tsx     # Products management page
│   └── CompaniesPage.tsx    # Companies management page
└── __tests__/              # Test files
    ├── services/
    ├── hooks/
    └── components/
```

## Implementation Steps

### Step 1: Database Schema Implementation

#### 1.1 Create Migration Files
```sql
-- File: supabase/migrations/20250130000001_add_products_table.sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pieces',
  weight DECIMAL(8,3),
  dimensions VARCHAR(50),
  supplier_id UUID,
  supplier_name VARCHAR(255),
  tags TEXT[],
  specifications JSONB,
  image_url VARCHAR(500),
  warranty_period INTEGER, -- in months
  service_contract_available BOOLEAN DEFAULT false,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Indexes for performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_supplier ON products(supplier_id);
```

#### 1.2 TypeScript Types Definition
```typescript
// File: src/types/masters.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  type?: string;
  price: number;
  cost_price?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  supplier_id?: string;
  supplier_name?: string;
  tags?: string[];
  specifications?: ProductSpecification[];
  image_url?: string;
  warranty_period?: number;
  service_contract_available?: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  category: string;
  type?: string;
  price: number;
  cost_price?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  supplier_id?: string;
  supplier_name?: string;
  tags?: string[];
  warranty_period?: number;
  service_contract_available?: boolean;
}
```

### Step 2: Mock Service Implementation

#### 2.1 Product Mock Service
```typescript
// File: src/services/productService.ts
import { Product, ProductFormData, ProductFilters } from '@/types/masters';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    description: 'Premium wireless headphones with noise cancellation',
    category: 'Electronics',
    type: 'Consumer Electronics',
    price: 299.99,
    cost_price: 150.00,
    currency: 'USD',
    status: 'active',
    stock_quantity: 50,
    min_stock_level: 10,
    reorder_level: 20,
    unit: 'pieces',
    weight: 0.3,
    dimensions: '20x15x8 cm',
    tags: ['wireless', 'audio', 'premium'],
    tenant_id: 'tenant-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export const mockProductService = {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    let filtered = [...mockProducts];

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    return filtered;
  },

  async getProduct(id: string): Promise<Product | null> {
    return mockProducts.find(p => p.id === id) || null;
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    // Validation
    if (!data.name || !data.sku || !data.category) {
      throw new Error('Name, SKU, and category are required');
    }

    if (data.price < 0) {
      throw new Error('Price must be non-negative');
    }

    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      tenant_id: 'tenant-1', // Mock tenant
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockProducts.push(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    const updated = {
      ...mockProducts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    mockProducts[index] = updated;
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    mockProducts.splice(index, 1);
  },

  // Additional methods...
};
```

### Step 3: Supabase Service Implementation

#### 3.1 Product Supabase Service
```typescript
// File: src/services/supabase/productService.ts
import { supabase } from './client';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';

function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    category: row.category,
    type: row.type,
    price: parseFloat(row.price),
    cost_price: row.cost_price ? parseFloat(row.cost_price) : undefined,
    currency: row.currency,
    status: row.status,
    stock_quantity: row.stock_quantity,
    min_stock_level: row.min_stock_level,
    max_stock_level: row.max_stock_level,
    reorder_level: row.reorder_level,
    unit: row.unit,
    weight: row.weight ? parseFloat(row.weight) : undefined,
    dimensions: row.dimensions,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    tags: row.tags,
    specifications: row.specifications,
    image_url: row.image_url,
    warranty_period: row.warranty_period,
    service_contract_available: row.service_contract_available,
    tenant_id: row.tenant_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
  };
}

export const supabaseProductService = {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(mapProductRow);
  },

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapProductRow(data);
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const { data: result, error } = await supabase
      .from('products')
      .insert([{
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        type: data.type,
        price: data.price,
        cost_price: data.cost_price,
        currency: data.currency,
        status: data.status,
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        reorder_level: data.reorder_level,
        unit: data.unit,
        weight: data.weight,
        dimensions: data.dimensions,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        tags: data.tags,
        warranty_period: data.warranty_period,
        service_contract_available: data.service_contract_available,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapProductRow(result);
  },

  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const { data: result, error } = await supabase
      .from('products')
      .update({
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        type: data.type,
        price: data.price,
        cost_price: data.cost_price,
        currency: data.currency,
        status: data.status,
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        reorder_level: data.reorder_level,
        unit: data.unit,
        weight: data.weight,
        dimensions: data.dimensions,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        tags: data.tags,
        warranty_period: data.warranty_period,
        service_contract_available: data.service_contract_available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapProductRow(result);
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### Step 4: Service Factory Integration

#### 4.1 Update Service Factory
```typescript
// File: src/services/serviceFactory.ts (add these exports)

// ... existing imports ...

// Add to factory exports
export const productService = {
  getProducts: (...args: Parameters<typeof supabaseProductService.getProducts>) =>
    serviceFactory.getProductService().getProducts(...args),
  getProduct: (...args: Parameters<typeof supabaseProductService.getProduct>) =>
    serviceFactory.getProductService().getProduct(...args),
  createProduct: (...args: Parameters<typeof supabaseProductService.createProduct>) =>
    serviceFactory.getProductService().createProduct(...args),
  updateProduct: (...args: Parameters<typeof supabaseProductService.updateProduct>) =>
    serviceFactory.getProductService().updateProduct(...args),
  deleteProduct: (...args: Parameters<typeof supabaseProductService.deleteProduct>) =>
    serviceFactory.getProductService().deleteProduct(...args),
  // Add other methods...
};
```

### Step 5: Module Service Implementation

#### 5.1 Product Module Service
```typescript
// File: src/modules/features/masters/services/productService.ts
import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';
import { productService as factoryProductService } from '@/services/serviceFactory';

export class ProductService extends BaseService {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const products = await factoryProductService.getProducts(filters);

      return {
        data: Array.isArray(products) ? products : products.data || [],
        total: Array.isArray(products) ? products.length : products.total || 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        totalPages: Math.ceil((Array.isArray(products) ? products.length : products.total || 0) / (filters.pageSize || 20)),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Tenant context not initialized')) {
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
      }
      this.handleError('Failed to fetch products', error);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const product = await factoryProductService.getProduct(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      this.handleError(`Failed to fetch product ${id}`, error);
      throw error;
    }
  }

  async createProduct(data: ProductFormData): Promise<Product> {
    try {
      return await factoryProductService.createProduct(data);
    } catch (error) {
      this.handleError('Failed to create product', error);
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    try {
      return await factoryProductService.updateProduct(id, data);
    } catch (error) {
      this.handleError(`Failed to update product ${id}`, error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await factoryProductService.deleteProduct(id);
    } catch (error) {
      this.handleError(`Failed to delete product ${id}`, error);
      throw error;
    }
  }

  // Additional business logic methods...
}
```

### Step 6: React Hooks Implementation

#### 6.1 Product Hooks
```typescript
// File: src/modules/features/masters/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProductService } from '../services/productService';
import { useService } from '@/modules/core/hooks/useService';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
};

export const useProducts = (filters: ProductFilters = {}) => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (data: ProductFormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      productService.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    },
  });
};
```

### Step 7: React Components Implementation

#### 7.1 Products List Component
```typescript
// File: src/modules/features/masters/components/ProductsList.tsx
import { Table, Button, Tag, Space, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useProducts } from '../hooks/useProducts';
import { Product, ProductFilters } from '@/types/masters';

const { Search } = Input;
const { Option } = Select;

interface ProductsListProps {
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
}

export const ProductsList = ({ onEdit, onDelete, onView }: ProductsListProps) => {
  const [filters, setFilters] = useState<ProductFilters>({});
  const { data: productsResponse, isLoading } = useProducts(filters);

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
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
      render: (stock: number) => stock || 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'inactive' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            size="small"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.id)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Search
          placeholder="Search products..."
          onSearch={(value) => setFilters({ ...filters, search: value })}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by category"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, category: value })}
        >
          {/* Category options */}
        </Select>
        <Select
          placeholder="Filter by status"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
          <Option value="discontinued">Discontinued</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={productsResponse?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          total: productsResponse?.total || 0,
          pageSize: productsResponse?.pageSize || 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
        }}
      />
    </div>
  );
};
```

### Step 8: Testing Implementation

#### 8.1 Unit Tests
```typescript
// File: src/modules/features/masters/__tests__/services/productService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ProductService } from '../../services/productService';
import { productService as factoryService } from '@/services/serviceFactory';

// Mock the factory service
vi.mock('@/services/serviceFactory', () => ({
  productService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService();
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      vi.mocked(factoryService.getProducts).mockResolvedValue(mockProducts);

      const result = await service.getProducts();

      expect(result).toEqual({
        data: mockProducts,
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
      expect(factoryService.getProducts).toHaveBeenCalledWith({});
    });

    it('should handle tenant context errors gracefully', async () => {
      const error = new Error('Tenant context not initialized');
      vi.mocked(factoryService.getProducts).mockRejectedValue(error);

      const result = await service.getProducts();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1' };
      vi.mocked(factoryService.getProduct).mockResolvedValue(mockProduct);

      const result = await service.getProduct('1');

      expect(result).toBe(mockProduct);
      expect(factoryService.getProduct).toHaveBeenCalledWith('1');
    });

    it('should throw error for non-existent product', async () => {
      vi.mocked(factoryService.getProduct).mockResolvedValue(null);

      await expect(service.getProduct('999')).rejects.toThrow('Product not found');
    });
  });

  // Additional tests...
});
```

## Code Standards & Rules

### Strict Naming Conventions
```typescript
// ✅ CORRECT: Consistent camelCase
interface Product {
  productId: string;      // Foreign key
  productName: string;    // Property name
  createdAt: string;      // Timestamp
  isActive: boolean;      // Boolean flag
}

// ❌ WRONG: Mixed conventions
interface Product {
  product_id: string;     // Snake case in TypeScript
  ProductName: string;    // Pascal case
  created_at: string;     // Snake case
  active: boolean;        // Unclear boolean
}
```

### Service Factory Usage Rules
```typescript
// ✅ CORRECT: Always use factory service
import { productService as factoryProductService } from '@/services/serviceFactory';

// ❌ WRONG: Direct service import
import { supabaseProductService } from '@/services/supabase/productService';
import { mockProductService } from '@/services/productService';
```

### Error Handling Standards
```typescript
// ✅ CORRECT: Structured error handling
try {
  const result = await service.operation();
  return result;
} catch (error) {
  this.handleError('Operation failed', error);
  throw error; // Re-throw for UI handling
}

// ❌ WRONG: Silent failures or console logs
try {
  const result = await service.operation();
  return result;
} catch (error) {
  console.error(error); // Never use console in production
  return null; // Silent failure
}
```

### React Hook Patterns
```typescript
// ✅ CORRECT: Proper hook structure
export const useProducts = (filters) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => service.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// ❌ WRONG: Missing query keys or stale time
export const useProducts = (filters) => {
  return useQuery({
    queryKey: ['products'], // Too generic
    queryFn: () => service.getProducts(filters),
    // Missing staleTime - causes unnecessary refetches
  });
};
```

### Component Props Interface
```typescript
// ✅ CORRECT: Explicit interface
interface ProductFormProps {
  product?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

// ❌ WRONG: Implicit any
const ProductForm = ({ product, onSuccess, onCancel }) => {
  // No type safety
};
```

## Testing Requirements

### Unit Test Coverage
- **Services**: 100% method coverage
- **Hooks**: All success/error scenarios
- **Components**: Props validation, user interactions
- **Utilities**: Edge cases and error conditions

### Test Structure
```typescript
describe('ProductService', () => {
  describe('CRUD Operations', () => {
    it('should create product successfully', async () => {
      // Arrange
      const mockData = { name: 'Test Product', sku: 'TEST-001' };
      
      // Act
      const result = await service.createProduct(mockData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(mockData.name);
    });
  });
});
```

### Mock Strategy
```typescript
// Use factories for consistent test data
const createMockProduct = (overrides = {}): Product => ({
  id: 'test-id',
  name: 'Test Product',
  sku: 'TEST-001',
  category: 'Electronics',
  price: 99.99,
  status: 'active',
  tenant_id: 'tenant-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});
```

## Performance Guidelines

### Query Optimization
```typescript
// ✅ CORRECT: Selective field queries
const { data } = await supabase
  .from('products')
  .select('id, name, sku, price, status') // Only needed fields
  .eq('status', 'active');

// ❌ WRONG: Select all fields
const { data } = await supabase
  .from('products')
  .select('*'); // Expensive for large tables
```

### Caching Strategy
```typescript
// ✅ CORRECT: Appropriate stale time
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5 minutes for master data
});

// ❌ WRONG: Over-caching or under-caching
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 60 * 60 * 1000, // 1 hour - too stale for inventory
});
```

### Pagination Implementation
```typescript
// ✅ CORRECT: Server-side pagination
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1);

// ❌ WRONG: Client-side pagination
const allProducts = await getAllProducts(); // Loads everything
const paginated = allProducts.slice(start, end); // Client-side
```

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy for tenant isolation
CREATE POLICY "Users can only see their tenant's products" ON products
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Input Validation
```typescript
// ✅ CORRECT: Server and client validation
const productSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  price: z.number().positive(),
});

// Use in both client and server
const validatedData = productSchema.parse(inputData);
```

### Authorization Checks
```typescript
// ✅ CORRECT: Permission-based access
const canEditProducts = usePermission('crm:reference:data:manage');

if (!canEditProducts) {
  throw new Error('Insufficient permissions');
}
```

## Troubleshooting

### Common Issues

#### Issue: Products not loading
**Symptoms**: Empty table, loading forever
**Causes**: 
- Service factory not configured
- API mode incorrect
- Network connectivity issues

**Solutions**:
```bash
# Check API mode
echo $VITE_API_MODE

# Verify factory exports
grep "productService" src/services/serviceFactory.ts

# Check network tab in browser dev tools
```

#### Issue: Form validation errors
**Symptoms**: Form won't submit, unexpected errors
**Causes**:
- Type mismatches between form and service
- Missing validation rules
- Incorrect field mapping

**Solutions**:
```typescript
// Debug form data
console.log('Form values:', form.getFieldsValue());

// Check service contract
console.log('Service expects:', ProductFormData);

// Compare field by field
```

#### Issue: Cache not updating
**Symptoms**: UI shows stale data after mutations
**Causes**:
- Missing query invalidation
- Wrong query keys
- Optimistic updates not implemented

**Solutions**:
```typescript
// Check query keys match
const queryKey = productKeys.list(filters); // Used in useQuery
queryClient.invalidateQueries({ queryKey }); // Used in mutation
```

### Debug Commands
```bash
# Check service factory routing
npm run dev
# Open browser console and check:
console.log('API Mode:', import.meta.env.VITE_API_MODE);

# Verify database connection
# Check Supabase dashboard for table existence

# Test service methods
const products = await productService.getProducts();
console.log('Products:', products);
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs for patterns
- [ ] Check test coverage metrics
- [ ] Update dependencies if needed
- [ ] Verify database performance

#### Monthly
- [ ] Archive old test data
- [ ] Review and update documentation
- [ ] Check for security vulnerabilities
- [ ] Performance benchmarking

#### Quarterly
- [ ] Major version updates
- [ ] Architecture review
- [ ] User feedback analysis
- [ ] Feature planning

### Adding New Features

1. **Start with tests**: Write failing tests first
2. **Database first**: Create migration and types
3. **Service layer**: Implement in both mock and Supabase
4. **Factory update**: Add to service factory routing
5. **Module service**: Add business logic
6. **Hooks**: Create React Query hooks
7. **UI**: Implement components
8. **Integration**: Test end-to-end flow

### Breaking Changes Process

1. **Deprecation notice**: Mark old API as deprecated
2. **Migration guide**: Document upgrade path
3. **Gradual rollout**: Support both old and new APIs
4. **Full migration**: Remove deprecated code
5. **Documentation update**: Update all guides

## Version History
- v1.0 - 2025-01-30 - Initial comprehensive implementation guide for Masters module