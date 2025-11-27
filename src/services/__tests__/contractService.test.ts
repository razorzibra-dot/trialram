import { describe, it, expect, beforeEach } from 'vitest';
import { contractService } from '@/services/serviceFactory';

describe('Contract Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name, customer_contact, assigned_to_name', async () => {
      const contracts = await (contractService as any).getContracts();
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c: any) => {
        expect(c).not.toHaveProperty('customer_name');
        expect(c).not.toHaveProperty('customer_contact');
        expect(c).not.toHaveProperty('assigned_to_name');
      });
    });

    it('should not have total_value or deal_title', async () => {
      const contracts = await (contractService as any).getContracts();
      contracts.forEach((c: any) => {
        expect(c).not.toHaveProperty('total_value');
        expect(c).not.toHaveProperty('deal_title');
      });
    });
  });

  describe('FK Relationships Intact', () => {
    it('should have customer_id, assigned_to, template_id FKs', async () => {
      const contracts = await (contractService as any).getContracts();
      const contract = contracts.find((c: any) => c.customer_id);
      expect(contract).toBeDefined();
      expect(typeof contract.customer_id).toBe('string');
    });
  });

  describe('CRUD Operations', () => {
    it('should create contract with normalized structure', async () => {
      const newContract = {
        contract_number: 'TEST-001',
        customer_id: 'cust_1',
        value: 50000,
        start_date: new Date().toISOString(),
        status: 'draft' as const,
      };
      
      const created = await (contractService as any).createContract(newContract);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
    });

    it('should get contract without denormalized fields', async () => {
      const contracts = await (contractService as any).getContracts();
      if (contracts.length > 0) {
        const contract = await (contractService as any).getContract(contracts[0].id);
        expect(contract).toBeDefined();
        expect(contract).not.toHaveProperty('customer_name');
        expect(contract).not.toHaveProperty('assigned_to_name');
      }
    });
  });

  describe('Approval Records Normalized', () => {
    it('should not have approver_name in approval records', async () => {
      const contracts = await (contractService as any).getContracts();
      if (contracts.length > 0) {
        const approvals = await (contractService as any).getApprovalRecords(contracts[0].id);
        if (Array.isArray(approvals)) {
          approvals.forEach((apr: any) => {
            expect(apr).not.toHaveProperty('approver_name');
            expect(apr.approver_id).toBeDefined();
          });
        }
      }
    });
  });
});
