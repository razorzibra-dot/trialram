/**
 * Ticket Service
 * Business logic for ticket management and support operations
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Ticket, TicketComment } from '@/types/crm';
import { PaginatedResponse } from '@/modules/core/types';
import { ticketService as legacyTicketService } from '@/services';

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
   */
  async getTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
    try {
      // Use legacy service for now, but wrap in new interface
      const tickets = await legacyTicketService.getTickets(filters);
      
      // Transform to paginated response format
      return {
        data: Array.isArray(tickets) ? tickets : [],
        total: Array.isArray(tickets) ? tickets.length : 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        totalPages: Math.ceil((Array.isArray(tickets) ? tickets.length : 0) / (filters.pageSize || 20)),
      };
    } catch (error) {
      this.handleError('Failed to fetch tickets', error);
      throw error;
    }
  }

  /**
   * Get a single ticket by ID
   */
  async getTicket(id: string): Promise<Ticket> {
    try {
      return await legacyTicketService.getTicket(id);
    } catch (error) {
      this.handleError(`Failed to fetch ticket ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    try {
      return await legacyTicketService.createTicket(data);
    } catch (error) {
      this.handleError('Failed to create ticket', error);
      throw error;
    }
  }

  /**
   * Update an existing ticket
   */
  async updateTicket(id: string, data: Partial<CreateTicketData>): Promise<Ticket> {
    try {
      return await legacyTicketService.updateTicket(id, data);
    } catch (error) {
      this.handleError(`Failed to update ticket ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(id: string): Promise<void> {
    try {
      await legacyTicketService.deleteTicket(id);
    } catch (error) {
      this.handleError(`Failed to delete ticket ${id}`, error);
      throw error;
    }
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
   */
  async bulkUpdateTickets(ids: string[], updates: Partial<CreateTicketData>): Promise<Ticket[]> {
    try {
      const promises = ids.map(id => this.updateTicket(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk update tickets', error);
      throw error;
    }
  }

  /**
   * Bulk delete tickets
   */
  async bulkDeleteTickets(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteTicket(id));
      await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk delete tickets', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    try {
      // Get all tickets for stats calculation
      const response = await this.getTickets({ pageSize: 1000 });
      const tickets = response.data;

      const stats: TicketStats = {
        total: tickets.length,
        byStatus: {},
        byPriority: {},
        averageResolutionTime: 0,
        openTickets: 0,
        resolvedToday: 0,
        overdueTickets: 0,
        satisfactionScore: 0,
        responseTime: {
          average: 0,
          target: 24, // 24 hours target
        },
      };

      const today = new Date().toDateString();

      // Calculate statistics
      tickets.forEach(ticket => {
        // Status stats
        const status = ticket.status || 'open';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Priority stats
        const priority = ticket.priority || 'medium';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

        // Open tickets
        if (status === 'open' || status === 'in_progress') {
          stats.openTickets++;
        }

        // Resolved today
        if (status === 'resolved' && ticket.updated_at && 
            new Date(ticket.updated_at).toDateString() === today) {
          stats.resolvedToday++;
        }

        // Overdue tickets
        if (ticket.due_date && new Date(ticket.due_date) < new Date() && 
            status !== 'resolved' && status !== 'closed') {
          stats.overdueTickets++;
        }
      });

      return stats;
    } catch (error) {
      this.handleError('Failed to fetch ticket statistics', error);
      throw error;
    }
  }

  /**
   * Search tickets
   */
  async searchTickets(query: string): Promise<Ticket[]> {
    try {
      const response = await this.getTickets({ search: query });
      return response.data;
    } catch (error) {
      this.handleError('Failed to search tickets', error);
      throw error;
    }
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
   */
  async exportTickets(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
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
    } catch (error) {
      this.handleError('Failed to export tickets', error);
      throw error;
    }
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
