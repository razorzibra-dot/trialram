/**
 * useSupabaseTickets Hook
 * Phase 4: Custom React hook for ticket/support data management
 * 
 * Provides:
 * - Real-time support ticket management
 * - Status and priority tracking
 * - Comment and attachment management
 * - SLA breach detection
 * - Assignment workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '@/services';
import type { Ticket } from '@/types/crm';

export interface UseSupabaseTicketsState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<Ticket>) => Promise<Ticket>;
  update: (id: string, data: Partial<Ticket>) => Promise<Ticket>;
  delete: (id: string) => Promise<void>;
  getByStatus: (status: string) => Ticket[];
  getByPriority: (priority: string) => Ticket[];
  getByAssignee: (assigneeId: string) => Ticket[];
  getSLABreached: () => Ticket[];
}

/**
 * Custom hook for managing tickets via Supabase service
 */
export function useSupabaseTickets(): UseSupabaseTicketsState {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getTickets();
      setTickets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setError(message);
      console.error('[useSupabaseTickets] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Create ticket
  const create = useCallback(async (data: Partial<Ticket>) => {
    try {
      setError(null);
      const created = await ticketService.createTicket(data);
      setTickets(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket';
      setError(message);
      throw err;
    }
  }, []);

  // Update ticket
  const update = useCallback(async (id: string, data: Partial<Ticket>) => {
    try {
      setError(null);
      const updated = await ticketService.updateTicket(id, data);
      setTickets(prev =>
        prev.map(t => (t.id === id ? updated : t))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update ticket';
      setError(message);
      throw err;
    }
  }, []);

  // Delete ticket
  const delete_ = useCallback(async (id: string) => {
    try {
      setError(null);
      await ticketService.deleteTicket(id);
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete ticket';
      setError(message);
      throw err;
    }
  }, []);

  // Get tickets by status
  const getByStatus = useCallback((status: string) => {
    return tickets.filter(t => t.status === status);
  }, [tickets]);

  // Get tickets by priority
  const getByPriority = useCallback((priority: string) => {
    return tickets.filter(t => t.priority === priority);
  }, [tickets]);

  // Get tickets by assignee
  const getByAssignee = useCallback((assigneeId: string) => {
    return tickets.filter(t => t.assigned_to === assigneeId);
  }, [tickets]);

  // Get SLA breached tickets
  const getSLABreached = useCallback(() => {
    return tickets.filter(t => t.is_sla_breached);
  }, [tickets]);

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    create,
    update,
    delete: delete_,
    getByStatus,
    getByPriority,
    getByAssignee,
    getSLABreached
  };
}

export default useSupabaseTickets;