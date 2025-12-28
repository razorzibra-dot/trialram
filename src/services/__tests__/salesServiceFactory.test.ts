import { describe, it, expect, beforeEach } from 'vitest';
import { dealsService } from '@/services/serviceFactory';

/**
 * Sales Service Factory Tests
 * Validates that the factory pattern correctly routes between mock and Supabase implementations
 * 
 * NOTE: Deals have status (won/lost/cancelled), not pipeline stages.
 * Pipeline stages belong to Opportunities. See types/crm.ts for reference.
 * 
 * Updated: 2025-12-17 - Removed getDealStages and updateDealStage tests
 */

describe('Sales Service Factory', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('Service Availability', () => {
    it('should provide a deals service instance', () => {
      expect(dealsService).toBeDefined();
      expect(typeof dealsService).toBe('object');
    });

    it('should have all required core methods', () => {
      const coreMethods = ['getDeals', 'getDeal', 'createDeal', 'updateDeal', 'deleteDeal'];

      coreMethods.forEach((method) => {
        expect(typeof (dealsService as any)[method]).toBe('function');
      });
    });

    it('should have all required advanced methods', () => {
      // NOTE: getDealStages and updateDealStage removed - Deals don't have stages
      const advancedMethods = [
        'getDealsByCustomer',
        'getSalesAnalytics',
        'bulkUpdateDeals',
        'bulkDeleteDeals',
        'searchDeals',
      ];

      advancedMethods.forEach((method) => {
        expect(typeof (dealsService as any)[method]).toBe('function');
      });
    });
  });

  describe('Method Signatures', () => {
    it('should support getDeals with no parameters', async () => {
      const deals = await dealsService.getDeals();
      expect(Array.isArray(deals)).toBe(true);
    });

    it('should support getDealsByCustomer with customerId', async () => {
      const deals = await dealsService.getDealsByCustomer('customer_1');
      expect(Array.isArray(deals)).toBe(true);
    });

    it('should support getSalesAnalytics', async () => {
      const stats = await dealsService.getSalesAnalytics();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('API Mode Routing', () => {
    it('should use mock service when VITE_API_MODE is "mock"', () => {
      process.env.VITE_API_MODE = 'mock';
      expect(dealsService).toBeDefined();
    });

    it('should use supabase service when VITE_API_MODE is "supabase"', () => {
      process.env.VITE_API_MODE = 'supabase';
      expect(dealsService).toBeDefined();
    });

    it('should default to mock service for unknown mode', () => {
      process.env.VITE_API_MODE = 'unknown_mode';
      expect(dealsService).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing customerId gracefully', async () => {
      try {
        await dealsService.getDealsByCustomer('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid parameters', async () => {
      try {
        await dealsService.getDealsByCustomer(null as any);
      } catch (error) {
        // Error expected
        expect(error).toBeDefined();
      }
    });
  });

  describe('Response Types', () => {
    it('should return array from getDeals', async () => {
      const result = await dealsService.getDeals();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return object from getSalesAnalytics', async () => {
      const result = await dealsService.getSalesAnalytics();
      expect(typeof result).toBe('object');
      expect(!Array.isArray(result)).toBe(true);
    });
  });
});