/**
 * Supabase Ticket Service
 * Handles support tickets, comments, attachments
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';
import { Ticket } from '@/types/crm';

export interface TicketFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  customerId?: string;
  tenantId?: string;
  search?: string;
}

export class SupabaseTicketService extends BaseSupabaseService {
  constructor() {
    super('tickets', true);
  }

  /**
   * Get all tickets with optional filtering
   */
  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    try {
      this.log('Fetching tickets', filters);

      let query = getSupabaseClient()
        .from('tickets')
        .select(
          `*,
          customer:customers(*),
          assigned_user:assigned_to(id, first_name, last_name, email),
          comments:ticket_comments(*),
          attachments:ticket_attachments(*)`
        );

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      this.log('Tickets fetched', { count: data?.length });
      return data?.map((t) => this.mapTicketResponse(t)) || [];
    } catch (error) {
      this.logError('Error fetching tickets', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(id: string): Promise<Ticket | null> {
    try {
      this.log('Fetching ticket', { id });

      const { data, error } = await getSupabaseClient()
        .from('tickets')
        .select(
          `*,
          customer:customers(*),
          assigned_user:assigned_to(id, first_name, last_name, email),
          comments:ticket_comments(*),
          attachments:ticket_attachments(*)`
        )
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapTicketResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching ticket', error);
      throw error;
    }
  }

  /**
   * Create new ticket
   */
  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    try {
      this.log('Creating ticket', { customer_id: data.customer_id });

      const { data: created, error } = await getSupabaseClient()
        .from('tickets')
        .insert([
          {
            ticket_number: data.ticket_number,
            title: data.title,
            description: data.description,
            customer_id: data.customer_id,
            status: data.status || 'open',
            priority: data.priority || 'medium',
            category: data.category || 'general',
            sub_category: data.sub_category,
            assigned_to: data.assigned_to,
            due_date: data.due_date,
            estimated_hours: data.estimated_hours,
            resolution: data.resolution,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select(
          `*,
          customer:customers(*),
          assigned_user:assigned_to(id, first_name, last_name, email),
          comments:ticket_comments(*),
          attachments:ticket_attachments(*)`
        )
        .single();

      if (error) throw error;

      this.log('Ticket created successfully', { id: created.id });
      return this.mapTicketResponse(created);
    } catch (error) {
      this.logError('Error creating ticket', error);
      throw error;
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    try {
      this.log('Updating ticket', { id });

      const { data, error } = await getSupabaseClient()
        .from('tickets')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          category: updates.category,
          sub_category: updates.sub_category,
          assigned_to: updates.assigned_to,
          due_date: updates.due_date,
          resolved_at: updates.resolved_at,
          closed_at: updates.closed_at,
          estimated_hours: updates.estimated_hours,
          actual_hours: updates.actual_hours,
          resolution: updates.resolution,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `*,
          customer:customers(*),
          assigned_user:assigned_to(id, first_name, last_name, email),
          comments:ticket_comments(*),
          attachments:ticket_attachments(*)`
        )
        .single();

      if (error) throw error;

      this.log('Ticket updated successfully', { id });
      return this.mapTicketResponse(data);
    } catch (error) {
      this.logError('Error updating ticket', error);
      throw error;
    }
  }

  /**
   * Delete ticket (soft delete)
   */
  async deleteTicket(id: string): Promise<void> {
    try {
      this.log('Deleting ticket', { id });

      const { error } = await getSupabaseClient()
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Ticket deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting ticket', error);
      throw error;
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, content: string, userId: string): Promise<any> {
    try {
      this.log('Adding comment to ticket', { ticketId });

      const { data, error } = await getSupabaseClient()
        .from('ticket_comments')
        .insert([
          {
            ticket_id: ticketId,
            content,
            author_id: userId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.log('Comment added successfully');
      return data;
    } catch (error) {
      this.logError('Error adding comment', error);
      throw error;
    }
  }

  /**
   * Upload ticket attachment
   */
  async uploadAttachment(
    ticketId: string,
    file: File,
    uploadedBy: string
  ): Promise<any> {
    try {
      this.log('Uploading attachment', { ticketId, filename: file.name });

      const client = getSupabaseClient();
      const filePath = `tickets/${ticketId}/${Date.now()}-${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await client.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error: dbError } = await client
        .from('ticket_attachments')
        .insert([
          {
            ticket_id: ticketId,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            content_type: file.type,
            uploaded_by: uploadedBy,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      this.log('Attachment uploaded successfully');
      return data;
    } catch (error) {
      this.logError('Error uploading attachment', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics and SLA metrics
   */
  async getTicketStats(tenantId: string): Promise<{
    total: number;
    open: number;
    closed: number;
    avgResolutionTime: number;
    slaBreach: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      this.log('Fetching ticket statistics', { tenantId });

      const tickets = await this.getTickets({ tenantId });

      const stats = {
        total: tickets.length,
        open: 0,
        closed: 0,
        avgResolutionTime: 0,
        slaBreach: 0,
        byPriority: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      };

      let totalResolutionTime = 0;
      let resolutionCount = 0;

      tickets.forEach((t) => {
        // Count by status
        stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
        if (t.status === 'open') stats.open++;
        if (t.status === 'closed') stats.closed++;

        // Count by priority
        stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1;

        // Count SLA breaches
        if (t.is_sla_breached) stats.slaBreach++;

        // Calculate average resolution time
        if (t.resolved_at) {
          const created = new Date(t.created_at).getTime();
          const resolved = new Date(t.resolved_at).getTime();
          totalResolutionTime += resolved - created;
          resolutionCount++;
        }
      });

      if (resolutionCount > 0) {
        stats.avgResolutionTime = totalResolutionTime / resolutionCount;
      }

      return stats;
    } catch (error) {
      this.logError('Error fetching ticket statistics', error);
      throw error;
    }
  }

  /**
   * Subscribe to ticket changes
   */
  subscribeToTickets(
    tenantId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'tickets',
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback
    );
  }

  /**
   * Map database ticket response to UI Ticket type
   */
  private mapTicketResponse(dbTicket: any): Ticket {
    return {
      id: dbTicket.id,
      ticket_number: dbTicket.ticket_number,
      title: dbTicket.title,
      description: dbTicket.description || '',
      customer_id: dbTicket.customer_id,
      customer_name: dbTicket.customer?.company_name || '',
      customer_email: dbTicket.customer?.email || '',
      customer_phone: dbTicket.customer?.phone || '',
      status: (dbTicket.status || 'open') as Ticket['status'],
      priority: (dbTicket.priority || 'medium') as Ticket['priority'],
      category: (dbTicket.category || 'general') as Ticket['category'],
      sub_category: dbTicket.sub_category || '',
      source: dbTicket.source || '',
      assigned_to: dbTicket.assigned_to,
      assigned_to_name: dbTicket.assigned_user?.first_name
        ? `${dbTicket.assigned_user.first_name} ${dbTicket.assigned_user.last_name}`
        : '',
      reported_by: dbTicket.reported_by || '',
      reported_by_name: dbTicket.reported_by_name || '',
      due_date: dbTicket.due_date,
      resolved_at: dbTicket.resolved_at,
      closed_at: dbTicket.closed_at,
      first_response_date: dbTicket.first_response_date,
      estimated_hours: dbTicket.estimated_hours,
      actual_hours: dbTicket.actual_hours,
      first_response_time: dbTicket.first_response_time,
      resolution_time: dbTicket.resolution_time,
      is_sla_breached: dbTicket.is_sla_breached || false,
      resolution: dbTicket.resolution || '',
      tags: dbTicket.tags || [],
      comments: dbTicket.comments || [],
      attachments: dbTicket.attachments || [],
      tenant_id: dbTicket.tenant_id,
      created_at: dbTicket.created_at,
      updated_at: dbTicket.updated_at,
      created_by: dbTicket.created_by || '',
    };
  }
}

// Export singleton instance
export const supabaseTicketService = new SupabaseTicketService();