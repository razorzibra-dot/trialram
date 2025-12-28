/**
 * Lead Management Hooks
 * React hooks for lead operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { LeadDTO, CreateLeadDTO, UpdateLeadDTO, LeadFiltersDTO, LeadConversionMetricsDTO } from '@/types/dtos';
import { leadsService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

// Query Keys
export const leadsKeys = {
  all: ['leads'] as const,
  leads: () => [...leadsKeys.all, 'leads'] as const,
  lead: (id: string) => [...leadsKeys.leads(), id] as const,
  stats: () => [...leadsKeys.all, 'stats'] as const,
  conversionMetrics: () => [...leadsKeys.all, 'conversion-metrics'] as const,
};

/**
 * Hook for fetching leads with filters
 */
export const useLeads = (filters: LeadFiltersDTO = {}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...leadsKeys.leads(), filters, tenantId],
    queryFn: async () => {
      const response = await leadsService.getLeads(filters);
      return response;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single lead
 */
export const useLead = (id: string) => {
  return useQuery({
    queryKey: leadsKeys.lead(id),
    queryFn: async () => {
      return await leadsService.getLead(id);
    },
    enabled: !!id,
    ...DETAIL_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a new lead
 */
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateLeadDTO) => {
      return await leadsService.createLead(data);
    },
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success('Lead created successfully');
    },
    onError: (err) => {
      console.error('[useCreateLead] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to create lead');
    },
  });
};

/**
 * Hook for updating a lead
 */
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeadDTO }) => {
      return await leadsService.updateLead(id, data);
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lead(updatedLead.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success('Lead updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateLead] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update lead');
    },
  });
};

/**
 * Hook for deleting a lead
 */
export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      await leadsService.deleteLead(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success('Lead deleted successfully');
    },
    onError: (err) => {
      console.error('[useDeleteLead] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to delete lead');
    },
  });
};

/**
 * Hook for converting lead to customer
 */
export const useConvertLeadToCustomer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ leadId, customerId }: { leadId: string; customerId?: string }) => {
      return await leadsService.convertToCustomer(leadId, customerId);
    },
    onSuccess: (convertedLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lead(convertedLead.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success('Lead converted to customer successfully');
    },
    onError: (err) => {
      console.error('[useConvertLeadToCustomer] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to convert lead');
    },
  });
};

/**
 * Hook for updating lead score
 */
export const useUpdateLeadScore = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, score }: { id: string; score: number }) => {
      return await leadsService.updateLeadScore(id, score);
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lead(updatedLead.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      success('Lead score updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateLeadScore] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update lead score');
    },
  });
};

/**
 * Hook for fetching lead conversion metrics
 */
export const useLeadConversionMetrics = () => {
  return useQuery({
    queryKey: leadsKeys.conversionMetrics(),
    queryFn: async () => {
      return await leadsService.getConversionMetrics();
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for bulk operations on leads
 */
export const useBulkLeads = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: UpdateLeadDTO }) => {
      return await leadsService.bulkUpdateLeads(ids, updates);
    },
    onSuccess: (updatedLeads) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success(`${updatedLeads.length} leads updated successfully`);
    },
    onError: (err) => {
      console.error('[useBulkLeads] bulkUpdate Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update leads');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await leadsService.deleteLead(id);
      }
      return ids;
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.conversionMetrics() });
      success(`${deletedIds.length} leads deleted successfully`);
    },
    onError: (err) => {
      console.error('[useBulkLeads] bulkDelete Error:', err);
      error(err instanceof Error ? err.message : 'Failed to delete leads');
    },
  });

  return {
    bulkUpdate,
    bulkDelete,
  };
};

/**
 * Hook for searching leads
 */
export const useSearchLeads = () => {
  return useCallback(
    async (query: string) => {
      if (!query.trim()) return [];
      // Use the existing getLeads method with search filter
      const response = await leadsService.getLeads({ search: query, pageSize: 50 });
      return response.data;
    },
    []
  );
};

/**
 * Hook for exporting leads
 */
export const useExportLeads = () => {
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      return await leadsService.exportLeads(format);
    },
    onSuccess: (data, format) => {
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Leads exported successfully');
    },
    onError: (err) => {
      console.error('[useExportLeads] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to export leads');
    },
  });
};

/**
 * Hook for auto-calculating lead score
 */
export const useAutoCalculateLeadScore = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      return await leadsService.autoCalculateLeadScore(id);
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lead(updatedLead.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      success('Lead score auto-calculated successfully');
    },
    onError: (err) => {
      console.error('[useAutoCalculateLeadScore] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to auto-calculate lead score');
    },
  });
};

/**
 * Hook for auto-assigning leads
 */
export const useAutoAssignLead = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      return await leadsService.autoAssignLead(id);
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lead(updatedLead.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      success('Lead auto-assigned successfully');
    },
    onError: (err) => {
      console.error('[useAutoAssignLead] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to auto-assign lead');
    },
  });
};

/**
 * Hook for bulk auto-assigning leads
 */
export const useBulkAutoAssignLeads = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return await leadsService.bulkAutoAssignLeads(ids);
    },
    onSuccess: (updatedLeads) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      success(`${updatedLeads.length} leads auto-assigned successfully`);
    },
    onError: (err) => {
      console.error('[useBulkAutoAssignLeads] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to auto-assign leads');
    },
  });
};

/**
 * Hook for lead follow-up reminders
 */
export const useLeadFollowUps = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...leadsKeys.leads(), 'follow-ups', tenantId],
    queryFn: async () => {
      // Get leads that need follow-up (have nextFollowUp date and are not converted)
      const response = await leadsService.getLeads({
        convertedToCustomer: false,
        pageSize: 100
      });

      const now = new Date();
      const followUps = response.data.filter(lead => {
        if (!lead.nextFollowUp) return false;
        const followUpDate = new Date(lead.nextFollowUp);
        return followUpDate <= now;
      });

      return followUps;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...LISTS_QUERY_CONFIG,
  });
};