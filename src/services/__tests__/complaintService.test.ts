import { describe, it, expect, beforeEach } from 'vitest';
import { complaintService } from '@/services/serviceFactory';

describe('Complaint Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name denormalized field', async () => {
      const complaints = await (complaintService as any).getComplaints();
      expect(complaints.length).toBeGreaterThan(0);
      complaints.forEach((c: any) => {
        expect(c).not.toHaveProperty('customer_name');
      });
    });

    it('should not have user_name, user_role in comments', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0 && complaints[0].comments) {
        complaints[0].comments.forEach((cmt: any) => {
          expect(cmt).not.toHaveProperty('user_name');
          expect(cmt).not.toHaveProperty('user_role');
        });
      }
    });
  });

  describe('FK Relationships Intact', () => {
    it('should have customer_id, complaint_by FKs', async () => {
      const complaints = await (complaintService as any).getComplaints();
      const complaint = complaints.find((c: any) => c.customer_id);
      
      expect(complaint).toBeDefined();
      expect(typeof complaint.customer_id).toBe('string');
    });
  });

  describe('CRUD Operations', () => {
    it('should create complaint with normalized structure', async () => {
      const newComplaint = {
        customer_id: 'cust_1',
        complaint_by: 'user_1',
        subject: 'Service Issue',
        description: 'Test complaint',
        category: 'service' as const,
        status: 'open' as const,
      };
      
      const created = await (complaintService as any).createComplaint(newComplaint);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
    });

    it('should get complaint without denormalized fields', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const complaint = await (complaintService as any).getComplaint(complaints[0].id);
        expect(complaint).toBeDefined();
        expect(complaint).not.toHaveProperty('customer_name');
      }
    });

    it('should update complaint while maintaining FKs', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const original = complaints[0];
        const updated = await (complaintService as any).updateComplaint(original.id, {
          status: 'resolved',
        });
        
        expect(updated.customer_id).toBe(original.customer_id);
        expect(updated).not.toHaveProperty('customer_name');
      }
    });
  });

  describe('Search and Filter Normalized', () => {
    it('should search by customer_id, not customer_name', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const customerId = complaints[0].customer_id;
        const results = await (complaintService as any).getComplaints({
          customer_id: customerId,
        });
        
        results.forEach((c: any) => {
          expect(c.customer_id).toBe(customerId);
          expect(c).not.toHaveProperty('customer_name');
        });
      }
    });

    it('should filter by status and category', async () => {
      const results = await (complaintService as any).getComplaints({
        status: 'open',
        category: 'service',
      });
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach((c: any) => {
        expect(c.status).toBe('open');
        expect(c.category).toBe('service');
      });
    });
  });

  describe('Comments Management Normalized', () => {
    it('should add comment without user_name, user_role', async () => {
      const complaints = await (complaintService as any).getComplaints();
      if (complaints.length > 0) {
        const comment = {
          text: 'Test comment',
          posted_by: 'user_123',
        };
        
        const result = await (complaintService as any).addComment(complaints[0].id, comment);
        expect(result).toBeDefined();
        expect(result).not.toHaveProperty('user_name');
        expect(result).not.toHaveProperty('user_role');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistency across operations', async () => {
      const initial = await (complaintService as any).getComplaints();
      const count = initial.length;
      
      const newComplaint = {
        customer_id: 'cust_new',
        complaint_by: 'user_new',
        subject: 'New',
        description: 'Test',
        category: 'service' as const,
        status: 'open' as const,
      };
      
      const created = await (complaintService as any).createComplaint(newComplaint);
      const all = await (complaintService as any).getComplaints();
      
      expect(all.length).toBeGreaterThan(count);
      expect(all.find((c: any) => c.id === created.id)).toBeDefined();
    });
  });
});
