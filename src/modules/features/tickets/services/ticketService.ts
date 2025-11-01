/**
 * Ticket Service (Module-level)
 * Business logic for ticket management and support operations
 * 
 * ARCHITECTURE:
 * This service delegates all core operations to the Service Factory pattern,
 * which provides automatic switching between mock (development) and Supabase 
 * (production) backends based on VITE_API_MODE environment variable.
 * 
 * MULTI-BACKEND ROUTING:
 * - VITE_API_MODE=mock    → Mock service (src/services/ticketService.ts)
 * - VITE_API_MODE=supabase → Supabase service (src/services/supabase/ticketService.ts)
 * 
 * This ensures:
 * ✅ Single backend routing point via serviceFactory
 * ✅ Proper multi-tenant context maintained throughout stack
 * ✅ Eliminates "Unauthorized" errors from mixed backend imports
 * ✅ All module services follow consistent pattern
 * 
 * @see /src/services/serviceFactory.ts - Central router for backend switching
 * @see /src/modules/features/contracts/services/contractService.ts - Reference implementation (Phase 4)
 * @see /src/modules/features/sales/services/salesService.ts - Sales module implementation (Phase 5.1)
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Ticket, TicketComment } from '@/types/crm';
import { PaginatedResponse } from '@/modules/core/types';
import { ticketService as factoryTicketService } from '@/services/serviceFactory';

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  customer?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  customer_id: string;
  assigned_to?: string;
  category?: string;
  tags?: string[];
  due_date?: string;
}

export interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageResolutionTime: number;
  openTickets: number;
  resolvedToday: number;
  overdueTickets: number;
  satisfactionScore: number;
  responseTime: {
    average: number;
    target: number;
  };
}

export class TicketService extends BaseService {
  /**
   * Get tickets with filtering and pagination
   * Delegates to factory-routed backend service
   */
  async getTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
    return factoryTicketService.getTickets(filters);
  }

  /**
   * Get a single ticket by ID
   * Delegates to factory-routed backend service
   */
  async getTicket(id: string): Promise<Ticket> {
    return factoryTicketService.getTicket(id);
  }

  /**
   * Create a new ticket
   * Delegates to factory-routed backend service
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    return factoryTicketService.createTicket(data);
  }

  /**
   * Update an existing ticket
   * Delegates to factory-routed backend service
   */
  async updateTicket(id: string, data: Partial<CreateTicketData>): Promise<Ticket> {
    return factoryTicketService.updateTicket(id, data);
  }

  /**
   * Delete a ticket
   * Delegates to factory-routed backend service
   */
  async deleteTicket(id: string): Promise<void> {
    return factoryTicketService.deleteTicket(id);
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    try {
      const typedStatus = status as 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
      return await this.updateTicket(id, { status: typedStatus });
    } catch (error) {
      this.handleError(`Failed to update ticket status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(id: string, priority: string): Promise<Ticket> {
    try {
      const typedPriority = priority as 'low' | 'medium' | 'high' | 'urgent';
      return await this.updateTicket(id, { priority: typedPriority });
    } catch (error) {
      this.handleError(`Failed to update ticket priority for ${id}`, error);
      throw error;
    }
  }

  /**
   * Assign ticket to user
   */
  async assignTicket(id: string, userId: string): Promise<Ticket> {
    try {
      return await this.updateTicket(id, { assigned_to: userId });
    } catch (error) {
      this.handleError(`Failed to assign ticket ${id}`, error);
      throw error;
    }
  }

  /**
   * Bulk update tickets
   * Delegates to factory-routed backend service
   */
  async bulkUpdateTickets(ids: string[], updates: Partial<CreateTicketData>): Promise<Ticket[]> {
    return factoryTicketService.bulkUpdateTickets(ids, updates);
  }

  /**
   * Bulk delete tickets
   * Delegates to factory-routed backend service
   */
  async bulkDeleteTickets(ids: string[]): Promise<void> {
    return factoryTicketService.bulkDeleteTickets(ids);
  }

  /**
   * Get ticket statistics
   * Delegates to factory-routed backend service
   */
  async getTicketStats(): Promise<TicketStats> {
    return factoryTicketService.getTicketStats();
  }

  /**
   * Get tickets by customer ID
   * Delegates to factory-routed backend service
   */
  async getTicketsByCustomer(
    customerId: string,
    filters: TicketFilters = {}
  ): Promise<PaginatedResponse<Ticket>> {
    return factoryTicketService.getTicketsByCustomer(customerId, filters);
  }

  /**
   * Search tickets
   * Delegates to factory-routed backend service
   */
  async searchTickets(query: string): Promise<Ticket[]> {
    return factoryTicketService.searchTickets(query);
  }

  /**
   * Get ticket statuses
   */
  async getTicketStatuses(): Promise<string[]> {
    return ['open', 'in_progress', 'resolved', 'closed'];
  }

  /**
   * Get ticket priorities
   */
  async getTicketPriorities(): Promise<string[]> {
    return ['low', 'medium', 'high', 'urgent'];
  }

  /**
   * Get ticket categories
   */
  async getTicketCategories(): Promise<string[]> {
    return [
      'technical_support',
      'billing',
      'feature_request',
      'bug_report',
      'general_inquiry',
      'account_issue'
    ];
  }

  /**
   * Export tickets
   * Delegates to factory-routed backend service
   */
  async exportTickets(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const response = await this.getTickets({ pageSize: 10000 });
    const tickets = response.data;

    if (format === 'json') {
      return JSON.stringify(tickets, null, 2);
    }

    // CSV format
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Customer', 'Assigned To', 'Created Date', 'Due Date'];
    const rows = tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.status || '',
      ticket.priority || '',
      ticket.customer_name || '',
      ticket.assigned_to_name || '',
      ticket.created_at || '',
      ticket.due_date || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\r\n');

    return csv;
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, comment: string): Promise<void> {
    try {
      // This would typically call a separate comments endpoint
      // For now, we'll update the ticket with a note
      await this.updateTicket(ticketId, {
        description: comment // This is a simplified approach
      });
    } catch (error) {
      this.handleError(`Failed to add comment to ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Get ticket comments
   */
  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    try {
      // This would typically fetch from a separate comments endpoint
      // For now, return empty array
      return [];
    } catch (error) {
      this.handleError(`Failed to fetch comments for ticket ${ticketId}`, error);
      throw error;
    }
  }
}
