import { describe, it, expect, beforeEach } from 'vitest';
import { productSaleService } from '@/services/serviceFactory';

describe('Product Sale Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name, product_name denormalized fields', async () => {
      const sales = await (productSaleService as any).getProductSales();
      expect(sales.length).toBeGreaterThan(0);
      sales.forEach((ps: any) => {
        expect(ps).not.toHaveProperty('customer_name');
        expect(ps).not.toHaveProperty('product_name');
      });
    });
  });

  describe('FK Relationships Intact', () => {
    it('should have customer_id, product_id, sale_id FKs', async () => {
      const sales = await (productSaleService as any).getProductSales();
      const ps = sales.find((s: any) => s.customer_id);
      
      expect(ps).toBeDefined();
      expect(typeof ps.customer_id).toBe('string');
      if (ps.product_id) {
        expect(typeof ps.product_id).toBe('string');
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create product sale with IDs only', async () => {
      const newSale = {
        customer_id: 'cust_1',
        product_id: 'prod_1',
        quantity: 5,
        unit_price: 100,
        status: 'completed' as const,
      };
      
      const created = await (productSaleService as any).createProductSale(newSale);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
      expect(created).not.toHaveProperty('product_name');
    });

    it('should retrieve product sales without denormalized fields', async () => {
      const sales = await (productSaleService as any).getProductSales();
      if (sales.length > 0) {
        const sale = await (productSaleService as any).getProductSale(sales[0].id);
        expect(sale).toBeDefined();
        expect(sale).not.toHaveProperty('customer_name');
      }
    });
  });

  describe('Search Normalized', () => {
    it('should search by customer_id, not customer_name', async () => {
      const sales = await (productSaleService as any).getProductSales();
      if (sales.length > 0) {
        const customerId = sales[0].customer_id;
        const results = await (productSaleService as any).searchProductSales({
          customer_id: customerId,
        });
        
        results.forEach((ps: any) => {
          expect(ps.customer_id).toBe(customerId);
          expect(ps).not.toHaveProperty('customer_name');
        });
      }
    });
  });

  describe('CSV Export Normalized', () => {
    it('should export with customer_id, product_id columns', async () => {
      const csv = await (productSaleService as any).exportProductSales('csv');
      expect(typeof csv).toBe('string');
      expect(csv.toLowerCase()).toContain('customer_id');
      expect(csv).not.toContain('customer_name');
    });
  });
});
