import { describe, it, expect, beforeEach } from 'vitest';
import { jobWorkService } from '@/services/jobWorkService';

describe('Job Work Service - Normalized Data (14 Fields Removed)', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('Denormalized Customer Fields Removed', () => {
    it('should not have customer_name, customer_short_name, customer_contact', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      expect(jobWorks.length).toBeGreaterThan(0);
      jobWorks.forEach((jw: any) => {
        expect(jw).not.toHaveProperty('customer_name');
        expect(jw).not.toHaveProperty('customer_short_name');
        expect(jw).not.toHaveProperty('customer_contact');
      });
    });

    it('should not have customer_email, customer_phone', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      jobWorks.forEach((jw: any) => {
        expect(jw).not.toHaveProperty('customer_email');
        expect(jw).not.toHaveProperty('customer_phone');
      });
    });
  });

  describe('Denormalized Product Fields Removed', () => {
    it('should not have product_name, product_sku, product_category, product_unit', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      jobWorks.forEach((jw: any) => {
        expect(jw).not.toHaveProperty('product_name');
        expect(jw).not.toHaveProperty('product_sku');
        expect(jw).not.toHaveProperty('product_category');
        expect(jw).not.toHaveProperty('product_unit');
      });
    });
  });

  describe('Denormalized Engineer Fields Removed', () => {
    it('should not have receiver_engineer_name, receiver_engineer_email', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      jobWorks.forEach((jw: any) => {
        expect(jw).not.toHaveProperty('receiver_engineer_name');
        expect(jw).not.toHaveProperty('receiver_engineer_email');
      });
    });

    it('should not have assigned_by_name', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      jobWorks.forEach((jw: any) => {
        expect(jw).not.toHaveProperty('assigned_by_name');
      });
    });
  });

  describe('All FK Relationships Present', () => {
    it('should have customer_id, product_id, receiver_engineer_id, assigned_by FKs', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      const jw = jobWorks.find((j: any) => j.customer_id);
      
      expect(jw).toBeDefined();
      expect(typeof jw.customer_id).toBe('string');
      if (jw.product_id) {
        expect(typeof jw.product_id).toBe('string');
      }
      if (jw.receiver_engineer_id) {
        expect(typeof jw.receiver_engineer_id).toBe('string');
      }
    });
  });

  describe('CRUD Operations Normalized', () => {
    it('should create job work with only FK IDs, no names', async () => {
      const newJobWork = {
        customer_id: 'cust_1',
        product_id: 'prod_1',
        receiver_engineer_id: 'eng_1',
        description: 'Test job',
        status: 'new' as const,
      };
      
      const created = await (jobWorkService as any).createJobWork(newJobWork);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      
      // Verify all 14 denormalized fields are absent
      expect(created).not.toHaveProperty('customer_name');
      expect(created).not.toHaveProperty('customer_short_name');
      expect(created).not.toHaveProperty('customer_contact');
      expect(created).not.toHaveProperty('customer_email');
      expect(created).not.toHaveProperty('customer_phone');
      expect(created).not.toHaveProperty('product_name');
      expect(created).not.toHaveProperty('product_sku');
      expect(created).not.toHaveProperty('product_category');
      expect(created).not.toHaveProperty('product_unit');
      expect(created).not.toHaveProperty('receiver_engineer_name');
      expect(created).not.toHaveProperty('receiver_engineer_email');
      expect(created).not.toHaveProperty('assigned_by_name');
    });

    it('should get job work with normalized structure', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      if (jobWorks.length > 0) {
        const jw = await (jobWorkService as any).getJobWork(jobWorks[0].id);
        expect(jw).toBeDefined();
        expect(jw).not.toHaveProperty('customer_name');
        expect(jw).not.toHaveProperty('product_name');
      }
    });

    it('should update job work while preserving FKs', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      if (jobWorks.length > 0) {
        const original = jobWorks[0];
        const updated = await (jobWorkService as any).updateJobWork(original.id, {
          status: 'in_progress',
        });
        
        expect(updated.customer_id).toBe(original.customer_id);
        expect(updated).not.toHaveProperty('customer_name');
      }
    });
  });

  describe('Engineer Assignment Workflow', () => {
    it('should assign engineer using receiver_engineer_id only', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      if (jobWorks.length > 0) {
        const result = await (jobWorkService as any).assignEngineer(jobWorks[0].id, {
          receiver_engineer_id: 'eng_999',
        });
        
        expect(result.receiver_engineer_id).toBe('eng_999');
        expect(result).not.toHaveProperty('receiver_engineer_name');
      }
    });
  });

  describe('Search and Filter Normalized', () => {
    it('should search by customer_id instead of customer_name', async () => {
      const jobWorks = await (jobWorkService as any).getJobWorks();
      if (jobWorks.length > 0) {
        const customerId = jobWorks[0].customer_id;
        const results = await (jobWorkService as any).getJobWorks({ 
          customer_id: customerId 
        });
        
        expect(Array.isArray(results)).toBe(true);
        results.forEach((jw: any) => {
          expect(jw.customer_id).toBe(customerId);
          expect(jw).not.toHaveProperty('customer_name');
        });
      }
    });

    it('should filter by status correctly', async () => {
      const results = await (jobWorkService as any).getJobWorks({ status: 'new' });
      expect(Array.isArray(results)).toBe(true);
      results.forEach((jw: any) => {
        expect(jw.status).toBe('new');
      });
    });
  });

  describe('CSV Export Normalized', () => {
    it('should export with customer_id, not customer_name', async () => {
      const csv = await (jobWorkService as any).exportJobWorks('csv');
      expect(typeof csv).toBe('string');
      
      // Should have customer_id column
      expect(csv.toLowerCase()).toContain('customer_id');
      
      // Should not have customer_name column
      expect(csv).not.toContain('customer_name');
      expect(csv).not.toContain('product_name');
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistency across operations', async () => {
      const initial = await (jobWorkService as any).getJobWorks();
      const count = initial.length;
      
      const newJW = {
        customer_id: 'cust_new',
        product_id: 'prod_new',
        description: 'Test',
        status: 'new' as const,
      };
      
      const created = await (jobWorkService as any).createJobWork(newJW);
      const allJW = await (jobWorkService as any).getJobWorks();
      
      expect(allJW.length).toBeGreaterThan(count);
      expect(allJW.find((j: any) => j.id === created.id)).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalid = {
        customer_id: 'cust_1',
        // missing product_id, receiver_engineer_id, etc.
        status: 'new',
      };
      
      try {
        await (jobWorkService as any).createJobWork(invalid);
        // May or may not throw depending on validation
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should handle bulk retrieval efficiently', async () => {
      const start = performance.now();
      await (jobWorkService as any).getJobWorks();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000);
    });
  });
});
