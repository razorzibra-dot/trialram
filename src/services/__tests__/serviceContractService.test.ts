import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceContractService } from '@/services';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({ data: [], error: null })),
        })),
        range: vi.fn(() => ({ data: [], error: null, count: 0 })),
      })),
      insert: vi.fn(() => ({ data: null, error: null, select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })),
      update: vi.fn(() => ({ data: null, error: null, select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })),
      delete: vi.fn(() => ({ error: null })),
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user' } }, error: null })),
    },
  })),
}));

describe('Service Contract Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name, product_name, assigned_to_name, secondary_contact_name', async () => {
      const response = await (serviceContractService as any).getServiceContracts();
      const contracts = response.data;
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((sc: any) => {
        expect(sc).not.toHaveProperty('customer_name');
        expect(sc).not.toHaveProperty('product_name');
        expect(sc).not.toHaveProperty('assigned_to_name');
        expect(sc).not.toHaveProperty('secondary_contact_name');
      });
    });
  });

  describe('FK Relationships Intact', () => {
    it('should have customer_id, product_id, assigned_to FKs', async () => {
      const response = await (serviceContractService as any).getServiceContracts();
      const contracts = response.data;
      const sc = contracts.find((c: any) => c.customerId);

      expect(sc).toBeDefined();
      expect(typeof sc.customerId).toBe('string');
      if (sc.productId) {
        expect(typeof sc.productId).toBe('string');
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create service contract with normalized structure', async () => {
      const newContract = {
        title: 'Test Service Contract',
        customerId: 'cust_1',
        serviceType: 'support',
        productId: 'prod_1',
        value: 10000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const created = await (serviceContractService as any).createServiceContract(newContract);
      expect(created.id).toBeDefined();
      expect(created.customerId).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
      expect(created).not.toHaveProperty('product_name');
    });

    it('should get service contract without denormalized fields', async () => {
      const response = await (serviceContractService as any).getServiceContracts();
      const contracts = response.data;
      if (contracts.length > 0) {
        const contract = await (serviceContractService as any).getServiceContract(contracts[0].id);
        expect(contract).toBeDefined();
        expect(contract).not.toHaveProperty('customer_name');
      }
    });
  });

  describe('Search Normalized', () => {
    it('should search by customer_id, not customer_name', async () => {
      const response = await (serviceContractService as any).getServiceContracts();
      const contracts = response.data;
      if (contracts.length > 0) {
        const customerId = contracts[0].customerId;
        const results = await (serviceContractService as any).getServiceContracts({
          customerId: customerId,
        });

        results.data.forEach((sc: any) => {
          expect(sc.customerId).toBe(customerId);
          expect(sc).not.toHaveProperty('customer_name');
        });
      }
    });
  });
});
