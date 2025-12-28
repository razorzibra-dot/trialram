/**
 * Opportunities Hooks
 * React hooks for opportunity operations using React Query
 * Opportunities are typically deals in qualified stages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Deal, SalesFilters } from '@/types';
import { CreateDealDTO } from '@/types/dtos';
import { dealsService as factoryDealsService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

// Query Keys
export const opportunitiesKeys = {
  all: ['opportunities'] as const,
  opportunities: () => [...opportunitiesKeys.all, 'opportunities'] as const,
  opportunity: (id: string) => [...opportunitiesKeys.opportunities(), id] as const,
  stats: () => [...opportunitiesKeys.all, 'stats'] as const,
  pipeline: () => [...opportunitiesKeys.all, 'pipeline'] as const,
};

/**
 * Hook for fetching opportunities (qualified deals)
 * Opportunities are deals in stages: qualified, proposal, negotiation
 */
export const useOpportunities = (filters: SalesFilters = {}) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: [...opportunitiesKeys.opportunities(), filters, tenantId],
    queryFn: async () => {
      // Filter for opportunity stages
      const opportunityFilters = {
        ...filters,
        stage: ['qualified', 'proposal', 'negotiation']
      };

      const response = await factorySalesService.getDeals(opportunityFilters);
      return response;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single opportunity
 */
export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: opportunitiesKeys.opportunity(id),
    queryFn: async () => {
      const deal = await factorySalesService.getDeal(id);

      // ✅ Note: Stage validation removed as stage belongs to opportunities table
      // This deal service retrieves from deals table which has no stage field
      // Opportunity staging is managed separately in opportunities table

      return deal;
    },
    enabled: !!id,
    ...DETAIL_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a new opportunity
 */
export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateDealDTO) => {
      // ✅ Stage is managed in opportunities table, not in deals
      // This creates a deal record without stage field
      return await factorySalesService.createDeal(data);
    },
    onSuccess: (newOpportunity) => {
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.pipeline() });
      success('Opportunity created successfully');
    },
    onError: (err) => {
      console.error('[useCreateOpportunity] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to create opportunity');
    },
  });
};

/**
 * Hook for updating an opportunity
 */
export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDealDTO> }) => {
      return await factorySalesService.updateDeal(id, data);
    },
    onSuccess: (updatedOpportunity) => {
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunity(updatedOpportunity.id) });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.pipeline() });
      success('Opportunity updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateOpportunity] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update opportunity');
    },
  });
};

/**
 * Hook for converting opportunity to deal (moving to closed stages)
 */
export const useConvertOpportunityToDeal = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, stage, closeDate }: {
      id: string;
      stage: 'closed_won' | 'closed_lost';
      closeDate?: string
    }) => {
      const updates: Partial<CreateDealDTO> = {
        stage,
        actual_close_date: closeDate
      };

      return await factorySalesService.updateDeal(id, updates);
    },
    onSuccess: (convertedDeal) => {
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunity(convertedDeal.id) });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.pipeline() });

      // ✅ Status field used instead of stage for deals
      const statusMessage = convertedDeal.status === 'won' ? 'won' : 'lost';
      success(`Opportunity marked as ${statusMessage}`);
    },
    onError: (err) => {
      console.error('[useConvertOpportunityToDeal] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to convert opportunity');
    },
  });
};

/**
 * Hook for opportunity statistics
 */
export const useOpportunityStats = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: [...opportunitiesKeys.stats(), tenantId],
    queryFn: async () => {
      // Get stats for opportunity stages only
      const allStats = await factorySalesService.getSalesStats();

      // Filter stats for opportunity stages
      const opportunityStages = ['qualified', 'proposal', 'negotiation'];
      const opportunityStats = {
        ...allStats,
        byStage: allStats.byStage?.filter(stage => opportunityStages.includes(stage.stage)) || [],
        totalValue: allStats.byStage
          ?.filter(stage => opportunityStages.includes(stage.stage))
          ?.reduce((sum, stage) => sum + (stage.totalValue || 0), 0) || 0,
        totalCount: allStats.byStage
          ?.filter(stage => opportunityStages.includes(stage.stage))
          ?.reduce((sum, stage) => sum + (stage.count || 0), 0) || 0,
      };

      return opportunityStats;
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for opportunity pipeline view
 */
export const useOpportunityPipeline = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: [...opportunitiesKeys.pipeline(), tenantId],
    queryFn: async () => {
      // ✅ Deals use status field (won, lost, cancelled), not stages
      // Stage is in opportunities table only
      const statuses = ['won', 'lost', 'cancelled'];

      const pipelineData = await Promise.all(
        statuses.map(async (status) => {
          const response = await factorySalesService.getDeals({ /* status filter not available in getDeals */ });
          const filteredDeals = response.filter(deal => deal.status === status);
          return {
            status,
            deals: filteredDeals,
            count: filteredDeals.length,
            totalValue: filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
          };
        })
      );

      return pipelineData;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for bulk opportunity operations
 */
export const useBulkOpportunities = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateDealDTO> }) => {
      return await factorySalesService.bulkUpdateDeals(ids, updates);
    },
    onSuccess: (updatedOpportunities) => {
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: opportunitiesKeys.pipeline() });
      success(`${updatedOpportunities.length} opportunities updated successfully`);
    },
    onError: (err) => {
      console.error('[useBulkOpportunities] bulkUpdate Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update opportunities');
    },
  });

  return {
    bulkUpdate,
  };
};