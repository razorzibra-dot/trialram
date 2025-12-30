/**
 * Refactored Ticket Hooks
 * Uses createEntityHooks factory + minimal custom hooks
 */

import { useQuery } from '@tanstack/react-query';
import { createEntityHooks } from '@/hooks/factories/createEntityHooks';
import { ticketService as supabaseTicketService } from '@/services/ticket/supabase/TicketService';
import { Ticket } from '@/types/crm';

// Query Keys
export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: unknown) => [...ticketKeys.all, 'list', filters] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  byCustomer: (customerId: string, filters: unknown) => [...ticketKeys.all, 'by-customer', customerId, filters] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
};

// Factory-generated CRUD hooks
const hooks = createEntityHooks<Ticket>({
  entityName: 'Ticket',
  service: supabaseTicketService,
  queryKeys: {
    all: ticketKeys.all as unknown as string[],
    list: (filters: unknown) => ticketKeys.list(filters) as unknown as string[],
    detail: (id: string) => ticketKeys.detail(id) as unknown as string[],
  },
});

export const useTickets = hooks.useEntities;
export const useTicket = hooks.useEntity;
export const useCreateTicket = hooks.useCreateEntity;
export const useUpdateTicket = hooks.useUpdateEntity;
export const useDeleteTicket = hooks.useDeleteEntity;

// Custom hooks leveraging service methods
export const useTicketsByCustomer = (customerId: string, filters: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ticketKeys.byCustomer(customerId, filters),
    queryFn: () => supabaseTicketService.getTicketsByCustomer(customerId, filters),
    enabled: !!customerId,
  });
};

export const useTicketStats = () => {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: () => supabaseTicketService.getTicketStats(),
  });
};
