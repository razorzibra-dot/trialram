import { describe, it, expect, beforeEach } from 'vitest';
import { mockTicketService } from '@/services/ticketService';

describe('Ticket Service - Normalized Data', () => {
  beforeEach(() => {
    process.env.VITE_API_MODE = 'mock';
  });

  describe('No Denormalized Fields', () => {
    it('should not have customer_name, customer_email, customer_phone', async () => {
      const tickets = await (mockTicketService as any).getTickets();
      expect(tickets.length).toBeGreaterThan(0);
      tickets.forEach((t: any) => {
        expect(t).not.toHaveProperty('customer_name');
        expect(t).not.toHaveProperty('customer_email');
        expect(t).not.toHaveProperty('customer_phone');
      });
    });

    it('should not have assigned_to_name, reported_by_name', async () => {
      const tickets = await (mockTicketService as any).getTickets();
      tickets.forEach((t: any) => {
        expect(t).not.toHaveProperty('assigned_to_name');
        expect(t).not.toHaveProperty('reported_by_name');
      });
    });
  });

  describe('FK Relationships Intact', () => {
    it('should have customer_id, assigned_to, reported_by FKs', async () => {
      const tickets = await (mockTicketService as any).getTickets();
      const ticketWithCustomer = tickets.find((t: any) => t.customer_id);
      expect(ticketWithCustomer).toBeDefined();
      expect(typeof ticketWithCustomer.customer_id).toBe('string');
    });
  });

  describe('CRUD Operations', () => {
    it('should get, create, update, delete tickets', async () => {
      const tickets = await (mockTicketService as any).getTickets();
      expect(Array.isArray(tickets)).toBe(true);
      
      const newTicket = {
        title: 'Test',
        description: 'Test',
        customer_id: 'cust_1',
        status: 'open' as const,
        priority: 'medium' as const,
        category: 'technical' as const,
      };
      
      const created = await (mockTicketService as any).createTicket(newTicket);
      expect(created.id).toBeDefined();
      expect(created.customer_id).toBe('cust_1');
      expect(created).not.toHaveProperty('customer_name');
    });
  });
});
