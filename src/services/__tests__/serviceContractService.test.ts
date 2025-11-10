import { describe, it, expect, beforeEach } from 'vitest';
import { serviceContractService } from '@/services/serviceContractService';

describe('Service Contract Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name, product_name, assigned_to_name, secondary_contact_name', async () => {
      const contracts = await (serviceContractService as any).getServiceContracts();
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
      const contracts = await (serviceContractService as any).getServiceContracts();
      const sc = contracts.find((c: any) => c.customer_id);
      
      expect(sc).toBeDefined();
      expect(typeof sc.customer_id).toBe('string');
      if (sc.product_id) {
        expect(typeof sc.product_id).toBe('string');
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create service contract with normalized structure', async () => {
      const newContract = {
        customer_id: 'cust_1',
        product_id: 'prod_1',
        service_level: 'premium',
        start_date: new Date().toISOString(),
        status: 'active' as const,
      };
      
      const created = await (serviceContractService as any).createServiceContract(newContract);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
      expect(created).not.toHaveProperty('product_name');
    });

    it('should get service contract without denormalized fields', async () => {
      const contracts = await (serviceContractService as any).getServiceContracts();
      if (contracts.length > 0) {
        const contract = await (serviceContractService as any).getServiceContract(contracts[0].id);
        expect(contract).toBeDefined();
        expect(contract).not.toHaveProperty('customer_name');
      }
    });
  });

  describe('Search Normalized', () => {
    it('should search by customer_id, not customer_name', async () => {
      const contracts = await (serviceContractService as any).getServiceContracts();
      if (contracts.length > 0) {
        const customerId = contracts[0].customer_id;
        const results = await (serviceContractService as any).getServiceContracts({
          customer_id: customerId,
        });
        
        results.forEach((sc: any) => {
          expect(sc.customer_id).toBe(customerId);
          expect(sc).not.toHaveProperty('customer_name');
        });
      }
    });
  });
});
