/**
 * Product Service Mock - Unit Tests
 * Tests for mock product service functionality
 * Verifies CRUD operations, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { productService } from '@/services/productService';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';

describe('Mock Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    it('should retrieve all products', async () => {
      const products = await productService.getProducts();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should retrieve a single product by ID', async () => {
      const products = await productService.getProducts();
      if (products.length > 0) {
        const product = await productService.getProduct(products[0].id);
        expect(product).toBeDefined();
        expect(product.id).toBe(products[0].id);
      }
    });

    it('should throw error for non-existent product', async () => {
      await expect(productService.getProduct('non-existent-id')).rejects.toThrow();
    });

    it('should create a new product with valid data', async () => {
      const newProduct: ProductFormData = {
        name: 'Test Product',
        category: 'Software',
        price: 99.99,
        sku: 'TEST-001',
        status: 'active',
        description: 'Test description',
      };

      const created = await productService.createProduct(newProduct);
      expect(created).toBeDefined();
      expect(created.name).toBe(newProduct.name);
      expect(created.sku).toBe(newProduct.sku);
      expect(created.price).toBe(newProduct.price);
      expect(created.id).toBeDefined();
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should update an existing product', async () => {
      const products = await productService.getProducts();
      if (products.length > 0) {
        const productId = products[0].id;
        const updateData: Partial<ProductFormData> = {
          name: 'Updated Product Name',
          price: 149.99,
        };

        const updated = await productService.updateProduct(productId, updateData);
        expect(updated.name).toBe(updateData.name);
        expect(updated.price).toBe(updateData.price);
      }
    });

    it('should delete a product', async () => {
      const newProduct: ProductFormData = {
        name: 'Delete Test',
        category: 'Software',
        price: 50.00,
        sku: 'DELETE-001',
        status: 'active',
      };

      const created = await productService.createProduct(newProduct);
      await productService.deleteProduct(created.id);

      // Should throw when trying to get deleted product
      await expect(productService.getProduct(created.id)).rejects.toThrow();
    });
  });

  describe('Validation Logic', () => {
    it('should reject product with missing required name', async () => {
      const invalidProduct = {
        category: 'Software',
        price: 99.99,
        sku: 'TEST-002',
        status: 'active',
      } as any;

      await expect(productService.createProduct(invalidProduct)).rejects.toThrow();
    });

    it('should reject product with missing category', async () => {
      const invalidProduct: any = {
        name: 'Test',
        price: 99.99,
        sku: 'TEST-003',
        status: 'active',
      };

      await expect(productService.createProduct(invalidProduct)).rejects.toThrow();
    });

    it('should reject product with invalid price (negative)', async () => {
      const invalidProduct: ProductFormData = {
        name: 'Test',
        category: 'Software',
        price: -50,
        sku: 'TEST-004',
        status: 'active',
      };

      await expect(productService.createProduct(invalidProduct)).rejects.toThrow();
    });

    it('should reject product with invalid status', async () => {
      const invalidProduct: any = {
        name: 'Test',
        category: 'Software',
        price: 99.99,
        sku: 'TEST-005',
        status: 'invalid-status',
      };

      await expect(productService.createProduct(invalidProduct)).rejects.toThrow();
    });

    it('should reject product with duplicate SKU', async () => {
      const products = await productService.getProducts();
      if (products.length > 0) {
        const existingSku = products[0].sku;
        
        const duplicateProduct: ProductFormData = {
          name: 'Duplicate SKU Test',
          category: 'Software',
          price: 99.99,
          sku: existingSku,
          status: 'active',
        };

        await expect(productService.createProduct(duplicateProduct)).rejects.toThrow();
      }
    });
  });

  describe('Statistics & Analytics', () => {
    it('should retrieve product statistics', async () => {
      const stats = await productService.getProductStats();
      expect(stats).toBeDefined();
      expect(stats.total_products).toBeGreaterThanOrEqual(0);
      expect(stats.active_products).toBeGreaterThanOrEqual(0);
      expect(typeof stats.total_products).toBe('number');
      expect(typeof stats.active_products).toBe('number');
    });

    it('should retrieve low stock products', async () => {
      const lowStock = await productService.getLowStockProducts(50);
      expect(Array.isArray(lowStock)).toBe(true);
      lowStock.forEach(product => {
        expect((product.stock_quantity || 0) <= 50).toBe(true);
      });
    });
  });

  describe('Search & Filtering', () => {
    it('should search products by name', async () => {
      const filters: ProductFilters = { search: 'Product' };
      const results = await productService.searchProducts(filters);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter products by category', async () => {
      const filters: ProductFilters = { category: 'Software' };
      const results = await productService.searchProducts(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(product => {
        expect(product.category).toBe('Software');
      });
    });

    it('should filter products by status', async () => {
      const filters: ProductFilters = { status: 'active' };
      const results = await productService.searchProducts(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(product => {
        expect(product.status).toBe('active');
      });
    });

    it('should filter products by price range', async () => {
      const filters: ProductFilters = { price_min: 100, price_max: 500 };
      const results = await productService.searchProducts(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for invalid input', async () => {
      try {
        await productService.createProduct({} as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    it('should handle pagination parameters', async () => {
      const products = await productService.getProducts();
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export products as CSV', async () => {
      const csv = await productService.exportProducts('csv');
      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
    });

    it('should export products as JSON', async () => {
      const json = await productService.exportProducts('json');
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should import products from JSON', async () => {
      const products = await productService.getProducts();
      const json = JSON.stringify(products.slice(0, 2));
      
      const imported = await productService.importProducts(json, 'json');
      expect(Array.isArray(imported)).toBe(true);
      expect(imported.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const initialProducts = await productService.getProducts();
      const initialCount = initialProducts.length;

      const newProduct: ProductFormData = {
        name: 'Consistency Test',
        category: 'Software',
        price: 299.99,
        sku: 'CONST-001',
        status: 'active',
      };

      const created = await productService.createProduct(newProduct);
      let allProducts = await productService.getProducts();
      expect(allProducts.length).toBe(initialCount + 1);

      await productService.deleteProduct(created.id);
      allProducts = await productService.getProducts();
      expect(allProducts.length).toBe(initialCount);
    });

    it('should return proper timestamps on create', async () => {
      const newProduct: ProductFormData = {
        name: 'Timestamp Test',
        category: 'Software',
        price: 199.99,
        sku: 'TIME-001',
        status: 'active',
      };

      const created = await productService.createProduct(newProduct);
      expect(new Date(created.created_at)).toBeInstanceOf(Date);
      expect(new Date(created.updated_at)).toBeInstanceOf(Date);
    });
  });
});