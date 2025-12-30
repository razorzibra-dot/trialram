/**
 * Ticket Service
 * Extends GenericCrudService with ticket-specific business logic
 * Handles complex workflows: comments, attachments, status transitions
 */

import { GenericCrudService } from '@/services/core/GenericCrudService';
import { Ticket } from '@/types/crm';
import { TicketRepository, TicketRow } from './TicketRepository';
import { ValidationError } from '@/services/core/errors';
import { QueryFilters } from '@/types/generic';

/**
 * Ticket Service
 * Extends GenericCrudService to provide ticket-specific business logic
 */
export class TicketService extends GenericCrudService<Ticket, Partial<Ticket>, Partial<Ticket>, QueryFilters, TicketRow> {
  private ticketRepository: TicketRepository;

  constructor() {
    const repository = new TicketRepository();
    super(repository);
    this.ticketRepository = repository;
  }

  /**
   * Generate a unique ticket number
   * Format: TKT-YYYYMMDD-NNNN
   */
  private generateTicketNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `TKT-${year}${month}${day}-${random}`;
  }

  /**
   * Hook: Run before fetching all tickets
   * Filters tickets based on user role and permissions
   */
  protected async beforeGetAll(filters?: QueryFilters): Promise<void> {
    if (!filters) return;

    const customFilters = (filters as Record<string, unknown>).customFilters as
      | {
          status?: string;
          priority?: string;
          assignedEngineerId?: string;
          customerId?: string;
        }
      | undefined;

    if (!customFilters) return;

    const filterGroup = (filters as Record<string, any>).filters || {};

    if (customFilters.status) {
      filterGroup.status = customFilters.status;
    }
    if (customFilters.priority) {
      filterGroup.priority = customFilters.priority;
    }
    if (customFilters.assignedEngineerId) {
      filterGroup.assigned_to = customFilters.assignedEngineerId;
    }
    if (customFilters.customerId) {
      filterGroup.customer_id = customFilters.customerId;
    }

    (filters as Record<string, any>).filters = filterGroup;
  }

  /**
   * Hook: Run before creating a new ticket
   */
  protected async beforeCreate(data: Partial<Ticket>): Promise<void> {
    // Generate ticket number if not provided
    if (!data.ticket_number) {
      data.ticket_number = this.generateTicketNumber();
    }
  }

  /**
   * Hook: Validate ticket creation
   */
  protected async validateCreate(data: Partial<Ticket>): Promise<void> {
    const errors: Record<string, string | string[]> = {};

    if (!data.title || data.title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (data.title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters';
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.description = 'Description is required';
    }

    if (data.title && data.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (Object.keys(errors).length > 0) {
      throw ValidationError.fromFields(errors);
    }
  }

  /**
   * Hook: Validate ticket update
   */
  protected async validateUpdate(id: string, data: Partial<Ticket>): Promise<void> {
    const errors: Record<string, string | string[]> = {};

    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        errors.title = 'Title cannot be empty';
      } else if (data.title.length > 255) {
        errors.title = 'Title cannot exceed 255 characters';
      } else if (data.title.length < 3) {
        errors.title = 'Title must be at least 3 characters';
      }
    }

    if (data.description !== undefined && data.description.trim().length === 0) {
      errors.description = 'Description cannot be empty';
    }

    if (Object.keys(errors).length > 0) {
      throw ValidationError.fromFields(errors);
    }
  }

  /**
   * Hook: Transform response after read
   */
  protected async afterGetById(_ticket: Ticket): Promise<void> {
    // Load related data: comments, attachments (no-op placeholder)
  }

  /**
   * Hook: Handle successful create
   */
  protected async afterCreate(ticket: Ticket): Promise<void> {
    // Log ticket creation, send notifications, etc.
    console.log('Ticket created:', ticket.id);
  }

  /**
   * Hook: Handle successful update
   */
  protected async afterUpdate(_ticket: Ticket): Promise<void> {
    // Handle post-update side-effects (placeholder)
  }

  /**
   * Hook: Handle successful delete
   */
  protected async afterDelete(ticket: Ticket): Promise<void> {
    // Clean up related data if needed
    console.log('Ticket soft-deleted:', ticket.id);
  }

  /**
   * Get tickets by status
   * Useful for dashboard and filtering
   */
  async getTicketsByStatus(status: string, filters = {}) {
    return this.getAll({
      ...filters,
      customFilters: { status },
    });
  }

  /**
   * Get tickets for a specific customer
   */
  async getTicketsByCustomer(customerId: string, filters: Record<string, unknown> = {}) {
    return this.getAll({
      ...(filters as QueryFilters),
      customFilters: {
        ...(filters as Record<string, any>).customFilters,
        customerId,
      },
    });
  }

  /**
   * Get tickets by priority
   */
  async getTicketsByPriority(priority: string, filters = {}) {
    return this.getAll({
      ...filters,
      customFilters: { priority },
    });
  }

  /**
   * Get assigned tickets for a user
   */
  async getAssignedTickets(userId: string, filters = {}) {
    return this.getAll({
      ...filters,
      customFilters: { assignedEngineerId: userId },
    });
  }

  /**
   * Get ticket statistics
   * Count tickets by status and priority
   */
  async getTicketStats() {
    try {
      const allTickets = await this.getAll({ pageSize: 999 }); // Get all without pagination

      const stats = {
        total: allTickets.data.length,
        byStatus: {
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      };

      allTickets.data.forEach((ticket) => {
        // Status counts
        if (ticket.status === 'open') stats.byStatus.open++;
        else if (ticket.status === 'in_progress') stats.byStatus.inProgress++;
        else if (ticket.status === 'resolved') stats.byStatus.resolved++;
        else if (ticket.status === 'closed') stats.byStatus.closed++;

        // Priority counts
        if (ticket.priority === 'low') stats.byPriority.low++;
        else if (ticket.priority === 'medium') stats.byPriority.medium++;
        else if (ticket.priority === 'high') stats.byPriority.high++;
        else if (ticket.priority === 'urgent') stats.byPriority.urgent++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService();
