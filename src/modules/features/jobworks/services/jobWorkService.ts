/**
 * Ticket Service Interface
 * Defines the contract for ticket management operations
 */

import { Ticket, TicketFilters } from '@/types';

/**
 * Ticket Service Interface
 * All ticket operations must implement this interface
 */
export interface ITicketService {
  getTickets(filters?: TicketFilters): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket>;
  createTicket(ticketData: Omit<Ticket, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;
  deleteTicket(id: string): Promise<void>;
  getStatuses(): Promise<string[]>;
  getPriorities(): Promise<string[]>;
  getCategories(): Promise<string[]>;
  getTicketStats(): Promise<Array<{ status: string; count: number }>>;
  getTicketCategories(): Promise<Array<{ id: string; name: string }>>;
  getTicketPriorities(): Promise<Array<{ id: string; name: string }>>;
}
