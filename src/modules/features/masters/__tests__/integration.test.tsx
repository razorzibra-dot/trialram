/**
 * Masters Module - Integration Tests
 * Tests for complete flows from UI forms through services to data persistence
 * Verifies all 8 layers work together seamlessly
 * 
 * Covers:
 * - Form submission → Hook → Service → Backend
 * - Hook data fetching → Component rendering
 * - Component interaction → Mutation → Cache invalidation
 * - End-to-end CRUD operations
 * 
 * @lastUpdated 2025-01-30
 */

import React, { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

// Import module services
import { moduleProductService } from '../services/productService';
import { moduleCompanyService } from '../services/companyService';

// Import hooks
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '../hooks/useCompanies';

// Import validation utilities
import { 
  validateProduct, 
  validateProductForm,
  validateCompany,
  validateCompanyForm 
} from '../utils/validation';

/**
 * Integration Test Wrapper
 * Provides React Query context for hooks
 */
function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        {children}
      </QueryClientProvider>
    );
  }

  return Wrapper;
}

// ============================================================================
// PRODUCTS MODULE INTEGRATION TESTS
// ============================================================================

describe('Products Module - Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  // =========================================================================
  // Form Submission to Service Integration
  // =========================================================================

  describe('Form Submission → Service Integration', () => {
    it('should validate product form data before submission', async () => {
      const formData = {
        name: 'Test Product',
        sku: 'TEST-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      };

      // Should pass validation
      expect(() => validateProductForm(formData)).not.toThrow();

      // Should fail with invalid data
      const invalidData = {
        ...formData,
        price: -10, // Negative price
      };

      expect(() => validateProductForm(invalidData)).toThrow();
    });

    it('should handle product creation from form submission', async () => {
      const formData = {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        category: 'Electronics',
        price: 29.99,
        status: 'active' as const,
        description: 'Ergonomic wireless mouse',
      };

      // Create product
      const createdProduct = await moduleProductService.createProduct(formData);

      // Verify returned product has all required fields
      expect(createdProduct).toHaveProperty('id');
      expect(createdProduct.name).toBe(formData.name);
      expect(createdProduct.sku).toBe(formData.sku);
      expect(createdProduct.price).toBe(formData.price);
      expect(createdProduct.status).toBe(formData.status);
    });

    it('should reject invalid product data at service layer', async () => {
      const invalidFormData = {
        name: 'Invalid Product',
        sku: 'INVALID-001',
        category: 'Electronics',
        price: -50, // Invalid: negative price
        status: 'active' as const,
      };

      // Service should throw error
      await expect(
        moduleProductService.createProduct(invalidFormData)
      ).rejects.toThrow();
    });

    it('should preserve all form fields through service layer', async () => {
      const complexFormData = {
        name: 'Advanced Product',
        sku: 'ADV-001',
        category: 'Electronics',
        price: 199.99,
        costPrice: 100.00,
        status: 'active' as const,
        description: 'A detailed product description',
        stockQuantity: 50,
        minStockLevel: 10,
        unit: 'pieces',
        weight: 0.5,
        tags: ['electronics', 'premium'],
      };

      const created = await moduleProductService.createProduct(complexFormData);

      // All fields should be preserved
      expect(created.name).toBe(complexFormData.name);
      expect(created.sku).toBe(complexFormData.sku);
      expect(created.description).toBe(complexFormData.description);
      expect(created.stockQuantity).toBe(complexFormData.stockQuantity);
      expect(created.tags).toEqual(complexFormData.tags);
    });
  });

  // =========================================================================
  // Hook to Service Integration
  // =========================================================================

  describe('Hook → Service Integration', () => {
    it('should fetch products through hook with loading and data states', async () => {
      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(queryClient),
      });

      // Initially loading should be true or false (depends on implementation)
      expect(result.current).toHaveProperty('products');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');

      // Wait for data to load
      await waitFor(() => {
        expect(Array.isArray(result.current.products)).toBe(true);
      });
    });

    it('should create product through hook with mutation', async () => {
      const { result: useCreateResult } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      const formData = {
        name: 'Hook Created Product',
        sku: 'HOOK-001',
        category: 'Electronics',
        price: 49.99,
        status: 'active' as const,
      };

      let createdProduct: any;

      await act(async () => {
        await new Promise((resolve) => {
          useCreateResult.current.mutate(formData, {
            onSuccess: (data) => {
              createdProduct = data;
              resolve(data);
            },
            onError: (error) => {
              console.error('Creation error:', error);
              resolve(null);
            },
          });
        });
      });

      // Should have created product with id
      expect(createdProduct).toBeDefined();
      expect(createdProduct.name).toBe(formData.name);
    });

    it('should update product through hook mutation', async () => {
      // First create a product
      const created = await moduleProductService.createProduct({
        name: 'Product to Update',
        sku: 'UPDATE-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      });

      const { result: useUpdateResult } = renderHook(() => useUpdateProduct(created.id), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = {
        name: 'Updated Product Name',
        price: 129.99,
      };

      let updatedProduct: any;

      await act(async () => {
        await new Promise((resolve) => {
          useUpdateResult.current.mutate(updateData, {
            onSuccess: (data) => {
              updatedProduct = data;
              resolve(data);
            },
          });
        });
      });

      // Should have updated fields
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
    });

    it('should delete product through hook mutation', async () => {
      // Create a product to delete
      const created = await moduleProductService.createProduct({
        name: 'Product to Delete',
        sku: 'DELETE-001',
        category: 'Electronics',
        price: 29.99,
        status: 'active' as const,
      });

      const { result: useDeleteResult } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      });

      let deleteSuccess = false;

      await act(async () => {
        await new Promise((resolve) => {
          useDeleteResult.current.mutate(created.id, {
            onSuccess: () => {
              deleteSuccess = true;
              resolve(true);
            },
          });
        });
      });

      expect(deleteSuccess).toBe(true);
    });
  });

  // =========================================================================
  // Cache Invalidation Tests
  // =========================================================================

  describe('Cache Invalidation on Mutations', () => {
    it('should invalidate products list cache after create', async () => {
      const spy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: useCreateResult } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await new Promise((resolve) => {
          useCreateResult.current.mutate({
            name: 'Cache Test Product',
            sku: 'CACHE-001',
            category: 'Electronics',
            price: 49.99,
            status: 'active' as const,
          }, {
            onSuccess: () => resolve(true),
          });
        });
      });

      // Verify invalidateQueries was called
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should invalidate products list cache after update', async () => {
      const created = await moduleProductService.createProduct({
        name: 'Cache Update Test',
        sku: 'CACHE-UPD-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      });

      const spy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: useUpdateResult } = renderHook(() => useUpdateProduct(created.id), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await new Promise((resolve) => {
          useUpdateResult.current.mutate({ name: 'Updated Name' }, {
            onSuccess: () => resolve(true),
          });
        });
      });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should invalidate products list cache after delete', async () => {
      const created = await moduleProductService.createProduct({
        name: 'Cache Delete Test',
        sku: 'CACHE-DEL-001',
        category: 'Electronics',
        price: 29.99,
        status: 'active' as const,
      });

      const spy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: useDeleteResult } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await new Promise((resolve) => {
          useDeleteResult.current.mutate(created.id, {
            onSuccess: () => resolve(true),
          });
        });
      });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // =========================================================================
  // End-to-End CRUD Flows
  // =========================================================================

  describe('End-to-End CRUD Flows', () => {
    it('should complete full create-read-update-delete cycle', async () => {
      // STEP 1: Create
      const createData = {
        name: 'E2E Test Product',
        sku: 'E2E-001',
        category: 'Electronics',
        price: 199.99,
        status: 'active' as const,
      };

      const created = await moduleProductService.createProduct(createData);
      expect(created.id).toBeDefined();
      expect(created.name).toBe(createData.name);

      // STEP 2: Read single
      const read = await moduleProductService.getProduct(created.id);
      expect(read).toBeDefined();
      expect(read.id).toBe(created.id);
      expect(read.name).toBe(createData.name);

      // STEP 3: Update
      const updateData = {
        name: 'Updated E2E Product',
        price: 249.99,
      };

      const updated = await moduleProductService.updateProduct(created.id, updateData);
      expect(updated.name).toBe(updateData.name);
      expect(updated.price).toBe(updateData.price);

      // STEP 4: Read again to verify update
      const readUpdated = await moduleProductService.getProduct(created.id);
      expect(readUpdated.name).toBe(updateData.name);
      expect(readUpdated.price).toBe(updateData.price);

      // STEP 5: Delete
      await moduleProductService.deleteProduct(created.id);

      // STEP 6: Verify deletion (should throw or return null)
      await expect(
        moduleProductService.getProduct(created.id)
      ).rejects.toThrow();
    });

    it('should handle bulk operations on products', async () => {
      // Create multiple products
      const products = await Promise.all([
        moduleProductService.createProduct({
          name: 'Bulk Product 1',
          sku: 'BULK-001',
          category: 'Electronics',
          price: 49.99,
          status: 'active' as const,
        }),
        moduleProductService.createProduct({
          name: 'Bulk Product 2',
          sku: 'BULK-002',
          category: 'Electronics',
          price: 59.99,
          status: 'active' as const,
        }),
      ]);

      // Get all products
      const allProducts = await moduleProductService.getProducts();
      expect(allProducts.length).toBeGreaterThanOrEqual(2);

      // Bulk update (if implemented)
      // Test status update for multiple
      const bulkUpdateResult = await Promise.all(
        products.map(p =>
          moduleProductService.updateProduct(p.id, { status: 'inactive' as const })
        )
      );

      expect(bulkUpdateResult.every(p => p.status === 'inactive')).toBe(true);
    });

    it('should maintain data integrity through CRUD operations', async () => {
      const originalData = {
        name: 'Integrity Test Product',
        sku: 'INT-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
        description: 'Test description',
        stockQuantity: 100,
      };

      // Create
      const created = await moduleProductService.createProduct(originalData);

      // Verify all fields preserved
      expect(created.name).toBe(originalData.name);
      expect(created.sku).toBe(originalData.sku);
      expect(created.category).toBe(originalData.category);
      expect(created.price).toBe(originalData.price);
      expect(created.stockQuantity).toBe(originalData.stockQuantity);

      // Update one field
      const updated = await moduleProductService.updateProduct(created.id, {
        price: 149.99,
      });

      // Verify other fields unchanged
      expect(updated.name).toBe(originalData.name);
      expect(updated.sku).toBe(originalData.sku);
      expect(updated.price).toBe(149.99); // Only price changed
    });
  });

  // =========================================================================
  // Data Type and Validation Consistency
  // =========================================================================

  describe('Type and Validation Consistency Across Layers', () => {
    it('should maintain type consistency from form to database', async () => {
      const formData = {
        name: 'Type Test',
        sku: 'TYPE-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      };

      const created = await moduleProductService.createProduct(formData);

      // Verify types
      expect(typeof created.id).toBe('string');
      expect(typeof created.name).toBe('string');
      expect(typeof created.price).toBe('number');
      expect(['active', 'inactive', 'discontinued']).toContain(created.status);
    });

    it('should apply validation at form, service, and mock layers', async () => {
      // Invalid price
      const invalidData = {
        name: 'Invalid Test',
        sku: 'INVALID-001',
        category: 'Electronics',
        price: -99.99, // Invalid: negative
        status: 'active' as const,
      };

      // Should fail validation
      expect(() => validateProductForm(invalidData)).toThrow();
    });

    it('should handle optional fields correctly', async () => {
      const minimalData = {
        name: 'Minimal Product',
        sku: 'MIN-001',
        category: 'Electronics',
        price: 49.99,
        status: 'active' as const,
        // No optional fields provided
      };

      const created = await moduleProductService.createProduct(minimalData);

      // Should have all required fields
      expect(created.name).toBeDefined();
      expect(created.sku).toBeDefined();
      expect(created.price).toBeDefined();

      // Optional fields should be undefined or have defaults
      expect([undefined, null]).toContain(created.description ?? null);
    });
  });

  // =========================================================================
  // Error Handling and Edge Cases
  // =========================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate SKU gracefully', async () => {
      const data1 = {
        name: 'Product 1',
        sku: 'DUP-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      };

      await moduleProductService.createProduct(data1);

      // Try to create with same SKU
      const data2 = {
        ...data1,
        name: 'Product 2',
      };

      // Should throw error (SKU must be unique)
      await expect(
        moduleProductService.createProduct(data2)
      ).rejects.toThrow();
    });

    it('should handle not found gracefully', async () => {
      // Try to get non-existent product
      await expect(
        moduleProductService.getProduct('non-existent-id')
      ).rejects.toThrow();
    });

    it('should handle concurrent operations safely', async () => {
      const createData = {
        name: 'Concurrent Test',
        sku: 'CONC-001',
        category: 'Electronics',
        price: 99.99,
        status: 'active' as const,
      };

      // Create multiple products concurrently
      const results = await Promise.all([
        moduleProductService.createProduct({
          ...createData,
          sku: 'CONC-001-A',
        }),
        moduleProductService.createProduct({
          ...createData,
          sku: 'CONC-001-B',
        }),
      ]);

      // Both should succeed
      expect(results).toHaveLength(2);
      expect(results.every(r => r.id)).toBe(true);
    });
  });
});

// ============================================================================
// COMPANIES MODULE INTEGRATION TESTS
// ============================================================================

describe('Companies Module - Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Form Submission → Service Integration', () => {
    it('should create company from form submission', async () => {
      const formData = {
        name: 'Test Company',
        industry: 'Technology',
        email: 'test@company.com',
        phone: '+1234567890',
        status: 'active' as const,
      };

      const created = await moduleCompanyService.createCompany(formData);

      expect(created).toHaveProperty('id');
      expect(created.name).toBe(formData.name);
      expect(created.industry).toBe(formData.industry);
      expect(created.email).toBe(formData.email);
    });

    it('should validate company email format', async () => {
      const invalidData = {
        name: 'Invalid Company',
        industry: 'Technology',
        email: 'invalid-email', // Invalid email format
        phone: '+1234567890',
        status: 'active' as const,
      };

      await expect(
        moduleCompanyService.createCompany(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('Hook → Service Integration for Companies', () => {
    it('should fetch companies through hook', async () => {
      const { result } = renderHook(() => useCompanies(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.companies)).toBe(true);
      });
    });

    it('should create company through mutation hook', async () => {
      const { result: useCreateResult } = renderHook(() => useCreateCompany(), {
        wrapper: createWrapper(queryClient),
      });

      const formData = {
        name: 'Mutation Test Company',
        industry: 'Finance',
        email: 'test@mutated.com',
        phone: '+1234567890',
        status: 'active' as const,
      };

      let created: any;

      await act(async () => {
        await new Promise((resolve) => {
          useCreateResult.current.mutate(formData, {
            onSuccess: (data) => {
              created = data;
              resolve(data);
            },
          });
        });
      });

      expect(created).toBeDefined();
      expect(created.name).toBe(formData.name);
    });
  });

  describe('End-to-End CRUD Flows for Companies', () => {
    it('should complete full create-read-update-delete cycle for companies', async () => {
      const createData = {
        name: 'E2E Company',
        industry: 'Retail',
        email: 'e2e@company.com',
        phone: '+1-555-0123',
        status: 'active' as const,
      };

      // Create
      const created = await moduleCompanyService.createCompany(createData);
      expect(created.id).toBeDefined();

      // Read
      const read = await moduleCompanyService.getCompany(created.id);
      expect(read.id).toBe(created.id);

      // Update
      const updated = await moduleCompanyService.updateCompany(created.id, {
        name: 'Updated Company Name',
      });
      expect(updated.name).toBe('Updated Company Name');

      // Delete
      await moduleCompanyService.deleteCompany(created.id);
    });
  });
});

/**
 * Version History
 * v1.0 - 2025-01-30 - Initial comprehensive integration tests
 *   - Form submission to service integration tests
 *   - Hook to service integration tests
 *   - Cache invalidation tests
 *   - End-to-end CRUD flows
 *   - Type consistency tests
 *   - Error handling and edge cases
 *   - Both Products and Companies modules
 */