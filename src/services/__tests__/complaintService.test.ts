import { describe, it, expect, beforeEach } from 'vitest';
import { complaintService } from '@/services/serviceFactory';

describe('Complaint Service - Normalized to camelCase', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('Type Contract Validation', () => {
    it('should have customerId field (not customer_id)', async () => {
      const complaints = await (complaintService as any).getComplaints();
      expect(complaints.length).toBeGreaterThan(0);
      complaints.forEach((c: any) => {
        expect(c).toHaveProperty('customerId');
        expect(c).not.toHaveProperty('customer_id');
      });
    });

    it('should have assignedEngineerId field', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        expect(complaints[0]).toHaveProperty('assignedEngineerId');
      }
    });

    it('should have createdAt, updatedAt timestamps', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        expect(complaints[0]).toHaveProperty('createdAt');
        expect(complaints[0]).toHaveProperty('updatedAt');
      }
    });
  });

  describe('Status Enum Values', () => {
    it('should use valid status values', async () => {
      const complaints = await (complaintService as any).getComplaints();
      const validStatuses = ['new', 'in_progress', 'closed'];
      complaints.forEach((c: any) => {
        expect(validStatuses).toContain(c.status);
      });
    });
  });

  describe('Comment Type Contract', () => {
    it('should have userId and complaintId in comments', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0 && complaints[0].comments?.length > 0) {
        complaints[0].comments.forEach((cmt: any) => {
          expect(cmt).toHaveProperty('userId');
          expect(cmt).toHaveProperty('complaintId');
          expect(cmt).toHaveProperty('createdAt');
        });
      }
    });
  });

  describe('CRUD Operations', () => {
    it('should create complaint with camelCase structure', async () => {
      const newComplaint = {
        customerId: 'cust_1',
        type: 'breakdown' as const,
        priority: 'high' as const,
      };
      
      const created = await (complaintService as any).createComplaint(newComplaint);
      expect(created.id).toBeDefined();
      expect(created.customerId).toBe('cust_1');
      expect(created.status).toBe('new');
    });

    it('should get complaint with camelCase fields', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const complaint = await (complaintService as any).getComplaint(complaints[0].id);
        expect(complaint).toBeDefined();
        expect(complaint).toHaveProperty('customerId');
        expect(complaint).toHaveProperty('assignedEngineerId');
      }
    });

    it('should update complaint with valid status', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const original = complaints[0];
        const updated = await (complaintService as any).updateComplaint(original.id, {
          status: 'in_progress',
        });
        
        expect(updated.customerId).toBe(original.customerId);
        expect(updated).toHaveProperty('assignedEngineerId');
      }
    });
  });

  describe('Filter Operations', () => {
    it('should filter by status', async () => {
      const results = await (complaintService as any).getComplaints({
        status: 'new',
      });
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach((c: any) => {
        expect(c.status).toBe('new');
      });
    });

    it('should filter by customerId', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const customerId = complaints[0].customerId;
        const results = await (complaintService as any).getComplaints({
          customerId: customerId,
        });
        
        results.forEach((c: any) => {
          expect(c.customerId).toBe(customerId);
        });
      }
    });

    it('should filter by type and priority', async () => {
      const results = await (complaintService as any).getComplaints({
        type: 'breakdown',
        priority: 'high',
      });
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Comments Management', () => {
    it('should add comment with camelCase fields', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const comment = {
          content: 'Test comment',
        };
        
        const result = await (complaintService as any).addComment(complaints[0].id, comment);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('complaintId');
        expect(result).toHaveProperty('createdAt');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain camelCase consistency across operations', async () => {
      const initial = await (complaintService as any).getComplaints();
      const count = initial.length;
      
      const newComplaint = {
        customerId: 'cust_test_integrity',
        type: 'preventive' as const,
        priority: 'medium' as const,
      };
      
      const created = await (complaintService as any).createComplaint(newComplaint);
      const all = await (complaintService as any).getComplaints();
      
      expect(all.length).toBeGreaterThan(count);
      const found = all.find((c: any) => c.id === created.id);
      expect(found).toBeDefined();
      expect(found.customerId).toBe('cust_test_integrity');
    });
  });
});
