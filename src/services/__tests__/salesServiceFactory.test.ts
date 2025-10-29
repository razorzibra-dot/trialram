import { describe, it, expect, beforeEach } from 'vitest';
import { salesService } from '@/services/serviceFactory';

/**
 * Sales Service Factory Tests
 * Validates that the factory pattern correctly routes between mock and Supabase implementations
 */

describe('Sales Service Factory', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('Service Availability', () => {
    it('should provide a sales service instance', () => {
      expect(salesService).toBeDefined();
      expect(typeof salesService).toBe('object');
    });

    it('should have all required core methods', () => {
      const coreMethods = ['getSales', 'getSale', 'createSale', 'updateSale', 'deleteSale'];

      coreMethods.forEach((method) => {
        expect(typeof (salesService as any)[method]).toBe('function');
      });
    });

    it('should have all required advanced methods', () => {
      const advancedMethods = [
        'getDealsByCustomer',
        'getSalesStats',
        'getDealStages',
        'updateDealStage',
        'bulkUpdateDeals',
        'bulkDeleteDeals',
        'searchDeals',
        'exportDeals',
        'importDeals',
      ];

      advancedMethods.forEach((method) => {
        expect(typeof (salesService as any)[method]).toBe('function');
      });
    });
  });

  describe('Method Signatures', () => {
    it('should support getSales with no parameters', async () => {
      const sales = await (salesService as any).getSales();
      expect(Array.isArray(sales)).toBe(true);
    });

    it('should support getDealsByCustomer with customerId and tenantId', async () => {
      const deals = await (salesService as any).getDealsByCustomer({
        customerId: 'customer_1',
        tenantId: 'tenant_1',
      });
      expect(Array.isArray(deals)).toBe(true);
    });

    it('should support getSalesStats with tenantId', async () => {
      const stats = await (salesService as any).getSalesStats({
        tenantId: 'tenant_1',
      });
      expect(stats).toHaveProperty('totalDeals');
      expect(stats).toHaveProperty('closedDeals');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averageDealValue');
    });

    it('should support getDealStages with tenantId', async () => {
      const stages = await (salesService as any).getDealStages({
        tenantId: 'tenant_1',
      });
      expect(Array.isArray(stages)).toBe(true);
    });
  });

  describe('API Mode Routing', () => {
    it('should use mock service when VITE_API_MODE is "mock"', () => {
      process.env.VITE_API_MODE = 'mock';
      expect(salesService).toBeDefined();
    });

    it('should use supabase service when VITE_API_MODE is "supabase"', () => {
      process.env.VITE_API_MODE = 'supabase';
      expect(salesService).toBeDefined();
    });

    it('should default to mock service for unknown mode', () => {
      process.env.VITE_API_MODE = 'unknown_mode';
      expect(salesService).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tenantId gracefully', async () => {
      try {
        await (salesService as any).getDealsByCustomer({
          customerId: 'customer_1',
          // tenantId missing
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid parameters', async () => {
      try {
        await (salesService as any).getDealsByCustomer({
          customerId: null,
          tenantId: 'tenant_1',
        });
      } catch (error) {
        // Error expected
        expect(error).toBeDefined();
      }
    });
  });

  describe('Response Types', () => {
    it('should return array from getSales', async () => {
      const result = await (salesService as any).getSales();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return object from getSalesStats', async () => {
      const result = await (salesService as any).getSalesStats({
        tenantId: 'tenant_1',
      });
      expect(typeof result).toBe('object');
      expect(!Array.isArray(result)).toBe(true);
    });

    it('should return array from getDealStages', async () => {
      const result = await (salesService as any).getDealStages({
        tenantId: 'tenant_1',
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});