/**
 * Tenant Metrics & Configuration Hooks
 * Provides React hooks for managing tenant metrics and configuration overrides
 * 
 * @module useTenantMetricsAndConfig
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Mock implementation
 * The actual superUserService was archived in cleanup
 */
const mockService = {
  getTenantStatistics: async (_tenantId: string) => [],
  getTenantConfigOverrides: async (_tenantId: string) => [],
};

const factorySuperUserService = mockService;
import {
  TenantStatisticType,
  TenantConfigOverrideType,
  TenantStatisticCreateInput,
  TenantConfigOverrideCreateInput,
  TenantConfigOverrideUpdateInput,
} from '@/types/superUserModule';

/**
 * Query key factory for metrics
 */
const METRICS_QUERY_KEYS = {
  all: ['metrics'] as const,
  lists: () => [...METRICS_QUERY_KEYS.all, 'list'] as const,
  list: () => [...METRICS_QUERY_KEYS.lists(), 'all'] as const,
  byTenant: (tenantId: string) =>
    [...METRICS_QUERY_KEYS.lists(), 'byTenant', tenantId] as const,
};

/**
 * Query key factory for config overrides
 */
const CONFIG_QUERY_KEYS = {
  all: ['configOverrides'] as const,
  lists: () => [...CONFIG_QUERY_KEYS.all, 'list'] as const,
  list: () => [...CONFIG_QUERY_KEYS.lists(), 'all'] as const,
  byTenant: (tenantId: string) =>
    [...CONFIG_QUERY_KEYS.lists(), 'byTenant', tenantId] as const,
  byId: (id: string) => [...CONFIG_QUERY_KEYS.all, 'byId', id] as const,
};

/**
 * Fetch all tenant statistics
 * 
 * @returns Query result with all statistics
 */
export function useTenantStatistics() {
  return useQuery({
    queryKey: METRICS_QUERY_KEYS.list(),
    queryFn: async () => {
      return factorySuperUserService.getTenantStatistics();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch statistics for a specific tenant
 * 
 * @param tenantId - Tenant ID
 * @returns Query result with tenant metrics
 */
export function useTenantStatisticsByTenantId(tenantId: string) {
  return useQuery({
    queryKey: METRICS_QUERY_KEYS.byTenant(tenantId),
    queryFn: async () => {
      return factorySuperUserService.getTenantStatisticsByTenantId(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Record a new tenant metric
 * 
 * @returns Mutation object
 */
export function useRecordTenantMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantStatisticCreateInput) => {
      return factorySuperUserService.recordTenantMetric(input);
    },
    onSuccess: () => {
      // Invalidate metrics queries
      queryClient.invalidateQueries({
        queryKey: METRICS_QUERY_KEYS.lists(),
      });
    },
    retry: 1,
  });
}

/**
 * Fetch all tenant configuration overrides
 * 
 * @returns Query result with all overrides
 */
export function useTenantConfigOverrides() {
  return useQuery({
    queryKey: CONFIG_QUERY_KEYS.list(),
    queryFn: async () => {
      return factorySuperUserService.getTenantConfigOverrides();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch configuration overrides for a specific tenant
 * 
 * @param tenantId - Tenant ID
 * @returns Query result with tenant config overrides
 */
export function useTenantConfigOverridesByTenantId(tenantId: string) {
  return useQuery({
    queryKey: CONFIG_QUERY_KEYS.byTenant(tenantId),
    queryFn: async () => {
      return factorySuperUserService.getTenantConfigOverridesByTenantId(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch a specific configuration override by ID
 * 
 * @param id - Override ID
 * @returns Query result with single override
 */
export function useTenantConfigOverrideById(id: string) {
  return useQuery({
    queryKey: CONFIG_QUERY_KEYS.byId(id),
    queryFn: async () => {
      return factorySuperUserService.getTenantConfigOverrideById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Create a new configuration override
 * 
 * @returns Mutation object
 */
export function useCreateTenantConfigOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TenantConfigOverrideCreateInput) => {
      return factorySuperUserService.createTenantConfigOverride(input);
    },
    onSuccess: (newOverride) => {
      // Invalidate config queries
      queryClient.invalidateQueries({
        queryKey: CONFIG_QUERY_KEYS.lists(),
      });
      queryClient.setQueryData(CONFIG_QUERY_KEYS.byId(newOverride.id), newOverride);
    },
    retry: 1,
  });
}

/**
 * Update a configuration override
 * 
 * @returns Mutation object
 */
export function useUpdateTenantConfigOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: TenantConfigOverrideUpdateInput;
    }) => {
      return factorySuperUserService.updateTenantConfigOverride(id, input);
    },
    onSuccess: (updatedOverride) => {
      // Invalidate config queries
      queryClient.invalidateQueries({
        queryKey: CONFIG_QUERY_KEYS.lists(),
      });
      queryClient.setQueryData(CONFIG_QUERY_KEYS.byId(updatedOverride.id), updatedOverride);
    },
    retry: 1,
  });
}

/**
 * Delete a configuration override
 * 
 * @returns Mutation object
 */
export function useDeleteTenantConfigOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return factorySuperUserService.deleteTenantConfigOverride(id);
    },
    onSuccess: () => {
      // Invalidate config queries
      queryClient.invalidateQueries({
        queryKey: CONFIG_QUERY_KEYS.lists(),
      });
    },
    retry: 1,
  });
}

/**
 * Combined metrics and config management hook
 * 
 * @param tenantId - Optional tenant ID for filtering
 * @returns Object with all metrics and config operations
 */
export function useTenantMetricsAndConfig(tenantId?: string) {
  const metricsQuery = useTenantStatistics();
  const tenantMetricsQuery = useTenantStatisticsByTenantId(tenantId || '');
  const configQuery = useTenantConfigOverrides();
  const tenantConfigQuery = useTenantConfigOverridesByTenantId(tenantId || '');
  
  const recordMetricMutation = useRecordTenantMetric();
  const createConfigMutation = useCreateTenantConfigOverride();
  const updateConfigMutation = useUpdateTenantConfigOverride();
  const deleteConfigMutation = useDeleteTenantConfigOverride();

  return {
    // Metrics queries
    allMetrics: metricsQuery.data || [],
    tenantMetrics: tenantMetricsQuery.data || [],
    
    // Config queries
    allConfigOverrides: configQuery.data || [],
    tenantConfigOverrides: tenantConfigQuery.data || [],
    
    // Loading states
    isLoading:
      metricsQuery.isLoading ||
      tenantMetricsQuery.isLoading ||
      configQuery.isLoading ||
      tenantConfigQuery.isLoading,
    
    // Error states
    error:
      metricsQuery.error ||
      tenantMetricsQuery.error ||
      configQuery.error ||
      tenantConfigQuery.error,
    
    // Metric mutations
    recordMetric: recordMetricMutation.mutate,
    isRecordingMetric: recordMetricMutation.isPending,
    
    // Config mutations
    createConfig: createConfigMutation.mutate,
    isCreatingConfig: createConfigMutation.isPending,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
    deleteConfig: deleteConfigMutation.mutate,
    isDeletingConfig: deleteConfigMutation.isPending,
    
    // Refetch all
    refetch: async () => {
      await Promise.all([
        metricsQuery.refetch(),
        tenantMetricsQuery.refetch(),
        configQuery.refetch(),
        tenantConfigQuery.refetch(),
      ]);
    },
  };
}

/**
 * Export all hooks and types
 */
export type {
  TenantStatisticType,
  TenantConfigOverrideType,
  TenantStatisticCreateInput,
  TenantConfigOverrideCreateInput,
  TenantConfigOverrideUpdateInput,
};