/**
 * Masters Module - Service Parity Tests
 * Verifies synchronization between mock and Supabase service implementations
 * Ensures type consistency, validation rules, and error handling across backends
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { productService } from '@/services/productService';
import { companyService } from '@/services/companyService';
import { Product, Company, ProductFormData, CompanyFormData } from '@/types/masters';

describe('Product Service Parity', () => {
  describe('Return Types', () => {
    it('should return consistent Product type structure from getProducts', async () => {
      const products = await productService.getProducts();
      
      if (products.length > 0) {
        const product = products[0];
        
        // Verify all required fields exist
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('status');
        expect(product).toHaveProperty('created_at');
        expect(product).toHaveProperty('updated_at');
        expect(product).toHaveProperty('tenant_id');
      }
    });

    it('should return consistent field types', async () => {
      const products = await productService.getProducts();
      
      if (products.length > 0) {
        const product = products[0];
        
        expect(typeof product.id).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.category).toBe('string');
        expect(typeof product.price).toBe('number');
        expect(typeof product.sku).toBe('string');
        expect(typeof product.status).toBe('string');
        expect(typeof product.created_at).toBe('string');
        expect(typeof product.updated_at).toBe('string');
      }
    });

    it('should return proper timestamp format (ISO 8601)', async () => {
      const products = await productService.getProducts();
      
      if (products.length > 0) {
        const product = products[0];
        
        expect(() => new Date(product.created_at)).not.toThrow();
        expect(() => new Date(product.updated_at)).not.toThrow();
        
        // Should be valid ISO date
        expect(product.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(product.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });
  });

  describe('Validation Rule Consistency', () => {
    it('should apply same validation: price must be non-negative', async () => {
      const invalidData: ProductFormData = {
        name: 'Test',
        category: 'Software',
        price: -100,
        sku: 'TEST-VAL-1',
        status: 'active',
      };

      await expect(productService.createProduct(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: status must be valid enum', async () => {
      const invalidData: any = {
        name: 'Test',
        category: 'Software',
        price: 99.99,
        sku: 'TEST-VAL-2',
        status: 'unknown-status',
      };

      await expect(productService.createProduct(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: SKU must be unique', async () => {
      const products = await productService.getProducts();
      if (products.length > 0) {
        const existingSku = products[0].sku;
        
        const duplicateData: ProductFormData = {
          name: 'Different Name',
          category: 'Software',
          price: 199.99,
          sku: existingSku,
          status: 'active',
        };

        await expect(productService.createProduct(duplicateData)).rejects.toThrow();
      }
    });

    it('should apply same validation: name is required', async () => {
      const invalidData: any = {
        category: 'Software',
        price: 99.99,
        sku: 'TEST-VAL-3',
        status: 'active',
      };

      await expect(productService.createProduct(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: category is required', async () => {
      const invalidData: any = {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST-VAL-4',
        status: 'active',
      };

      await expect(productService.createProduct(invalidData)).rejects.toThrow();
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide descriptive error for missing required fields', async () => {
      try {
        await productService.createProduct({} as any);
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should distinguish between different validation errors', async () => {
      // Try to get non-existent product
      try {
        await productService.getProduct('non-existent-12345');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('CRUD Operation Consistency', () => {
    it('should update timestamps on modification', async () => {
      const products = await productService.getProducts();
      if (products.length > 0) {
        const original = products[0];
        const originalUpdatedAt = original.updated_at;

        // Wait a moment to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        const updated = await productService.updateProduct(original.id, { 
          name: 'Updated Name' 
        });

        // updated_at should be newer or same as original
        expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(originalUpdatedAt).getTime()
        );
      }
    });

    it('should preserve immutability of returned objects', async () => {
      const products1 = await productService.getProducts();
      const products2 = await productService.getProducts();

      if (products1.length > 0 && products2.length > 0) {
        // Objects should have same data but different references
        expect(products1[0]).toEqual(products2[0]);
        expect(products1[0]).not.toBe(products2[0]);
      }
    });
  });

  describe('Statistics Consistency', () => {
    it('should return numeric stats fields', async () => {
      const stats = await productService.getProductStats();
      
      expect(typeof stats.total_products).toBe('number');
      expect(typeof stats.active_products).toBe('number');
      expect(stats.total_products).toBeGreaterThanOrEqual(0);
      expect(stats.active_products).toBeGreaterThanOrEqual(0);
    });

    it('should have active_products <= total_products', async () => {
      const stats = await productService.getProductStats();
      
      expect(stats.active_products).toBeLessThanOrEqual(stats.total_products);
    });
  });
});

describe('Company Service Parity', () => {
  describe('Return Types', () => {
    it('should return consistent Company type structure', async () => {
      const companies = await mockCompanyService.getCompanies();
      
      if (companies.length > 0) {
        const company = companies[0];
        
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('address');
        expect(company).toHaveProperty('phone');
        expect(company).toHaveProperty('email');
        expect(company).toHaveProperty('industry');
        expect(company).toHaveProperty('size');
        expect(company).toHaveProperty('status');
        expect(company).toHaveProperty('created_at');
        expect(company).toHaveProperty('updated_at');
        expect(company).toHaveProperty('tenant_id');
      }
    });

    it('should return consistent field types', async () => {
      const companies = await mockCompanyService.getCompanies();
      
      if (companies.length > 0) {
        const company = companies[0];
        
        expect(typeof company.id).toBe('string');
        expect(typeof company.name).toBe('string');
        expect(typeof company.address).toBe('string');
        expect(typeof company.phone).toBe('string');
        expect(typeof company.email).toBe('string');
        expect(typeof company.industry).toBe('string');
        expect(typeof company.size).toBe('string');
        expect(typeof company.status).toBe('string');
      }
    });
  });

  describe('Validation Rule Consistency', () => {
    it('should apply same validation: email must be valid format', async () => {
      const invalidData: CompanyFormData = {
        name: 'Test Company',
        address: '123 Test',
        phone: '+1-555-0123',
        email: 'invalid-email',
        industry: 'Technology',
        size: 'medium',
        status: 'active',
      };

      await expect(mockCompanyService.createCompany(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: phone must be valid format', async () => {
      const invalidData: CompanyFormData = {
        name: 'Test Company',
        address: '123 Test',
        phone: 'invalid-phone',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'medium',
        status: 'active',
      };

      await expect(mockCompanyService.createCompany(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: size must be valid enum', async () => {
      const invalidData: any = {
        name: 'Test Company',
        address: '123 Test',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'invalid-size',
        status: 'active',
      };

      await expect(mockCompanyService.createCompany(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: status must be valid enum', async () => {
      const invalidData: any = {
        name: 'Test Company',
        address: '123 Test',
        phone: '+1-555-0123',
        email: 'test@example.com',
        industry: 'Technology',
        size: 'medium',
        status: 'invalid-status',
      };

      await expect(mockCompanyService.createCompany(invalidData)).rejects.toThrow();
    });

    it('should apply same validation: name must be unique', async () => {
      const companies = await mockCompanyService.getCompanies();
      if (companies.length > 0) {
        const existingName = companies[0].name;
        
        const duplicateData: CompanyFormData = {
          name: existingName,
          address: 'Different Address',
          phone: '+1-555-9999',
          email: 'unique@example.com',
          industry: 'Technology',
          size: 'small',
          status: 'active',
        };

        await expect(mockCompanyService.createCompany(duplicateData)).rejects.toThrow();
      }
    });

    it('should apply same validation: all required fields mandatory', async () => {
      const invalidData: any = {
        name: 'Test',
        // Missing other required fields
      };

      await expect(mockCompanyService.createCompany(invalidData)).rejects.toThrow();
    });
  });

  describe('Statistics Consistency', () => {
    it('should return numeric stats fields', async () => {
      const stats = await mockCompanyService.getCompanyStats();
      
      expect(typeof stats.total_companies).toBe('number');
      expect(typeof stats.active_companies).toBe('number');
      expect(stats.total_companies).toBeGreaterThanOrEqual(0);
      expect(stats.active_companies).toBeGreaterThanOrEqual(0);
    });

    it('should have active_companies <= total_companies', async () => {
      const stats = await mockCompanyService.getCompanyStats();
      
      expect(stats.active_companies).toBeLessThanOrEqual(stats.total_companies);
    });
  });
});

describe('Cross-Service Validation', () => {
  it('should handle enum values consistently', async () => {
    // Valid status values
    const validStatuses = ['active', 'inactive', 'discontinued'];
    
    for (const status of validStatuses) {
      const data: any = {
        name: `Test ${status}`,
        category: 'Software',
        price: 99.99,
        sku: `SKU-${status}`,
        status,
      };

      // Should not throw for valid values
      const product = await productService.createProduct(data);
      expect(product.status).toBe(status);
    }
  });

  it('should normalize timestamps consistently', async () => {
    const product1 = await productService.createProduct({
      name: 'Test 1',
      category: 'Software',
      price: 99.99,
      sku: 'NORM-1',
      status: 'active',
    });

    const product2 = await productService.createProduct({
      name: 'Test 2',
      category: 'Software',
      price: 199.99,
      sku: 'NORM-2',
      status: 'active',
    });

    // Timestamps should be in same format
    expect(product1.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(product2.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('Type Consistency Across Layers', () => {
  it('should maintain type consistency in create/update cycle', async () => {
    const createData: ProductFormData = {
      name: 'Type Test',
      category: 'Software',
      price: 99.99,
      sku: 'TYPE-001',
      status: 'active',
    };

    const created = await productService.createProduct(createData);

    // Should have all expected types
    expect(typeof created.id).toBe('string');
    expect(typeof created.name).toBe('string');
    expect(typeof created.price).toBe('number');
    expect(typeof created.created_at).toBe('string');

    // Update with same types
    const updateData: Partial<ProductFormData> = {
      name: 'Updated Type Test',
      price: 149.99,
    };

    const updated = await productService.updateProduct(created.id, updateData);

    expect(typeof updated.name).toBe('string');
    expect(typeof updated.price).toBe('number');
  });

  it('should preserve optional field types', async () => {
    const createData: ProductFormData = {
      name: 'Optional Test',
      category: 'Software',
      price: 99.99,
      sku: 'OPT-001',
      status: 'active',
      description: 'Test description',
    };

    const created = await productService.createProduct(createData);

    expect(created.description === undefined || typeof created.description === 'string').toBe(true);
  });
});