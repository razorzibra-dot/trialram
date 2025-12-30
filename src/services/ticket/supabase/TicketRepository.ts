/**
 * Ticket Repository
 * Extends GenericRepository for ticket-specific database operations
 * Handles soft deletes, tenant isolation, and specialized queries
 */

import { GenericRepository } from '@/services/core/GenericRepository';
import { Ticket } from '@/types/crm';

/**
 * TicketRow represents the database row structure (snake_case)
 */
export interface TicketRow {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: Ticket['status'];
  priority: Ticket['priority'];
  category: Ticket['category'];
  sub_category: string | null;
  source: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  reported_by: string | null;
  reported_by_name: string | null;
  due_date: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  first_response_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  first_response_time: number | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Map database row (snake_case) to domain model (camelCase)
 */
function mapTicketRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    title: row.title,
    description: row.description,
    customer_id: row.customer_id ?? undefined,
    customer_name: row.customer_name ?? undefined,
    status: row.status,
    priority: row.priority,
    category: row.category,
    sub_category: row.sub_category ?? undefined,
    source: row.source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    assigned_to_name: row.assigned_to_name ?? undefined,
    reported_by: row.reported_by ?? undefined,
    due_date: row.due_date ?? undefined,
    resolved_at: row.resolved_at ?? undefined,
    closed_at: row.closed_at ?? undefined,
    first_response_date: row.first_response_date ?? undefined,
    estimated_hours: row.estimated_hours ?? undefined,
    actual_hours: row.actual_hours ?? undefined,
    first_response_time: row.first_response_time ?? undefined,
    resolution: row.resolution ?? undefined,
    tenant_id: row.tenant_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by ?? undefined,
  };
}

/**
 * Ticket Repository
 * Provides database access for ticket operations
 */
export class TicketRepository extends GenericRepository<Ticket, Partial<Ticket>, Partial<Ticket>, TicketRow> {
  constructor() {
    super({
      tableName: 'tickets',
      mapper: mapTicketRow,
      searchFields: ['title', 'description', 'ticket_number'],
      softDeleteField: 'deleted_at',
      tenantIdField: 'tenant_id',
    });
  }
}

// Export singleton instance
export const ticketRepository = new TicketRepository();
