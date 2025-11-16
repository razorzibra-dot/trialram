/**
 * Ticket Hooks
 * React hooks for ticket operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Ticket } from '@/types/crm';
import { TicketService, TicketFilters, CreateTicketData } from '../services/ticketService';
import { useTicketStore } from '../store/ticketStore';
import { useService } from '@/modules/core/hooks/useService';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

// Query Keys
export const ticketKeys = {
  all: ['tickets'] as const,
  tickets: () => [...ticketKeys.all, 'tickets'] as const,
  ticket: (id: string) => [...ticketKeys.tickets(), id] as const,
  byCustomer: (customerId: string) => [...ticketKeys.all, 'by-customer', customerId] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
  statuses: () => [...ticketKeys.all, 'statuses'] as const,
  priorities: () => [...ticketKeys.all, 'priorities'] as const,
  categories: () => [...ticketKeys.all, 'categories'] as const,
};

/**
 * Hook for fetching tickets with filters
 */
export const useTickets = (filters: TicketFilters = {}) => {
  const ticketService = useService<TicketService>('ticketService');
  const { setTickets, setLoading, setPagination } = useTicketStore();

  return useQuery({
    queryKey: [...ticketKeys.tickets(), filters],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await ticketService.getTickets(filters);
        setTickets(response.data);
        setPagination(response.page, response.pageSize, response.totalPages, response.total);
        return response;
      } finally {
        setLoading(false);
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single ticket
 */
export const useTicket = (id: string) => {
  const ticketService = useService<TicketService>('ticketService');
  const { setSelectedTicket } = useTicketStore();

  return useQuery({
    queryKey: ticketKeys.ticket(id),
    queryFn: async () => {
      const ticket = await ticketService.getTicket(id);
      setSelectedTicket(ticket);
      return ticket;
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Hook for fetching tickets by customer ID
 */
export const useTicketsByCustomer = (customerId: string, filters: TicketFilters = {}) => {
  const ticketService = useService<TicketService>('ticketService');

  return useQuery({
    queryKey: [...ticketKeys.byCustomer(customerId), filters],
    queryFn: async () => {
      const response = await ticketService.getTicketsByCustomer(customerId, filters);
      return response;
    },
    ...LISTS_QUERY_CONFIG,
    enabled: !!customerId,
  });
};

/**
 * Hook for fetching ticket statistics
 */
export const useTicketStats = () => {
  const ticketService = useService<TicketService>('ticketService');
  const { setStats } = useTicketStore();

  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: async () => {
      const stats = await ticketService.getTicketStats();
      setStats(stats);
      return stats;
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a new ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const ticketService = useService<TicketService>('ticketService');
  const { addTicket, setCreating } = useTicketStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      setCreating(true);
      try {
        return await ticketService.createTicket(data);
      } finally {
        setCreating(false);
      }
    },
    onSuccess: (newTicket) => {
      addTicket(newTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success('Ticket created successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to create ticket');
    },
  });
};

/**
 * Hook for updating a ticket
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  const ticketService = useService<TicketService>('ticketService');
  const { updateTicket, setUpdating } = useTicketStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTicketData> }) => {
      setUpdating(true);
      try {
        return await ticketService.updateTicket(id, data);
      } finally {
        setUpdating(false);
      }
    },
    onSuccess: (updatedTicket) => {
      updateTicket(updatedTicket.id, updatedTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.ticket(updatedTicket.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success('Ticket updated successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update ticket');
    },
  });
};

/**
 * Hook for deleting a ticket
 */
export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  const ticketService = useService<TicketService>('ticketService');
  const { removeTicket, setDeleting } = useTicketStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      setDeleting(true);
      try {
        await ticketService.deleteTicket(id);
        return id;
      } finally {
        setDeleting(false);
      }
    },
    onSuccess: (deletedId) => {
      removeTicket(deletedId);
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success('Ticket deleted successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete ticket');
    },
  });
};

/**
 * Hook for updating ticket status
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  const ticketService = useService<TicketService>('ticketService');
  const { updateTicket } = useTicketStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await ticketService.updateTicketStatus(id, status);
    },
    onSuccess: (updatedTicket) => {
      updateTicket(updatedTicket.id, updatedTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success('Ticket status updated successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update ticket status');
    },
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkTickets = () => {
  const queryClient = useQueryClient();
  const ticketService = useService<TicketService>('ticketService');
  const { clearSelection } = useTicketStore();
  const { success, error } = useNotification();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateTicketData> }) => {
      return await ticketService.bulkUpdateTickets(ids, updates);
    },
    onSuccess: (updatedTickets) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success(`${updatedTickets.length} tickets updated successfully`);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update tickets');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await ticketService.bulkDeleteTickets(ids);
      return ids;
    },
    onSuccess: (deletedIds) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ticketKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      success(`${deletedIds.length} tickets deleted successfully`);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete tickets');
    },
  });

  return {
    bulkUpdate,
    bulkDelete,
  };
};

/**
 * Hook for searching tickets
 */
export const useSearchTickets = () => {
  const ticketService = useService<TicketService>('ticketService');

  return useCallback(
    async (query: string) => {
      if (!query.trim()) return [];
      return await ticketService.searchTickets(query);
    },
    [ticketService]
  );
};

/**
 * Hook for exporting tickets
 */
export const useExportTickets = () => {
  const ticketService = useService<TicketService>('ticketService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      return await ticketService.exportTickets(format);
    },
    onSuccess: (data, format) => {
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tickets.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Tickets exported successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to export tickets');
    },
  });
};
