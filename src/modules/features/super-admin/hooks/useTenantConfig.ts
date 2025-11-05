/**
 * Tenant Configuration Hook
 * Custom React hook for tenant configuration override management
 * Handles: create, update, delete, expire configuration overrides with validation
 *
 * @module useTenantConfig
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TenantConfigOverrideType,
  ConfigOverrideInput,
} from '@/types/superUserModule';

/**
 * Mock implementation of tenant config service
 * The actual superUserService was archived in cleanup
 * This provides fallback data until a proper service implementation is added
 */
const mockTenantConfigService = {
  getConfigOverrides: async (
    tenantId: string
  ): Promise<TenantConfigOverrideType[]> => {
    return [
      {
        id: `override_${tenantId}_1`,
        tenantId,
        configKey: 'maintenance_mode',
        value: false,
        expiresAt: null,
        createdAt: new Date().toISOString(),
      },
    ];
  },
  createOverride: async (
    input: ConfigOverrideInput
  ): Promise<TenantConfigOverrideType> => {
    return {
      id: `override_${Date.now()}`,
      tenantId: input.tenantId,
      configKey: input.configKey,
      value: input.value,
      expiresAt: input.expiresAt || null,
      createdAt: new Date().toISOString(),
    };
  },
  updateOverride: async (
    id: string,
    value: unknown
  ): Promise<TenantConfigOverrideType> => {
    return {
      id,
      tenantId: 'tenant_1',
      configKey: 'maintenance_mode',
      value,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };
  },
  expireOverride: async (_id: string) => {
    // Mock implementation - just resolves
  },
};

// Use the mock service as a fallback
const superUserService = mockTenantConfigService;

// Query keys for React Query cache management
export const TENANT_CONFIG_QUERY_KEYS = {
  all: ['tenantConfig'] as const,
  lists: () => [...TENANT_CONFIG_QUERY_KEYS.all, 'list'] as const,
  list: (tenantId: string) =>
    [...TENANT_CONFIG_QUERY_KEYS.lists(), tenantId] as const,
  detail: (tenantId: string, configKey: string) =>
    [...TENANT_CONFIG_QUERY_KEYS.all, 'detail', tenantId, configKey] as const,
};

// Valid configuration keys
export const VALID_CONFIG_KEYS = [
  'feature_flags',
  'maintenance_mode',
  'api_rate_limit',
  'session_timeout',
  'data_retention_days',
  'backup_frequency',
  'notification_settings',
  'audit_log_level',
] as const;

/**
 * Tenant configuration management hook state
 */
interface UseTenantConfigState {
  // Data
  overrides: TenantConfigOverrideType[];
  selectedOverride: TenantConfigOverrideType | null;

  // Filtering
  filterByKey: string | null;

  // Loading states
  loading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isValidating: boolean;

  // Error state
  error: string | null;

  // Actions
  loadOverrides: (tenantId: string) => Promise<void>;
  create: (input: ConfigOverrideInput) => Promise<void>;
  update: (id: string, value: unknown) => Promise<void>;
  expire: (id: string) => Promise<void>;
  selectOverride: (override: TenantConfigOverrideType) => void;
  setFilterByKey: (key: string | null) => void;
  validateConfigKey: (key: string) => boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing tenant configuration overrides
 * @returns Tenant configuration management state and actions
 */
export const useTenantConfig = (): UseTenantConfigState => {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedOverride, setSelectedOverride] =
    useState<TenantConfigOverrideType | null>(null);
  const [filterByKey, setFilterByKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query: Fetch configuration overrides for tenant
  const {
    data: overrides = [],
    isLoading: loading,
    refetch: refetchOverrides,
    isError: hasOverridesError,
    error: overridesError,
  } = useQuery({
    queryKey: selectedTenantId
      ? TENANT_CONFIG_QUERY_KEYS.list(selectedTenantId)
      : ['disabled'],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      try {
        const data = await superUserService.getConfigOverrides(selectedTenantId);
        setError(null);
        return data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch config overrides';
        setError(message);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    enabled: !!selectedTenantId,
  });

  // Filter overrides by key
  const filteredOverrides = filterByKey
    ? overrides.filter((o) => o.configKey === filterByKey)
    : overrides;

  // Mutation: Create configuration override
  const createMutation = useMutation({
    mutationFn: async (input: ConfigOverrideInput) => {
      try {
        const newOverride = await superUserService.createOverride(input);
        return newOverride;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to create config override';
        setError(message);
        throw err;
      }
    },
    onSuccess: (newOverride) => {
      if (selectedTenantId) {
        queryClient.invalidateQueries({
          queryKey: TENANT_CONFIG_QUERY_KEYS.list(selectedTenantId),
        });
      }
      setSelectedOverride(newOverride);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create config override';
      setError(message);
    },
  });

  // Mutation: Update configuration override
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: unknown }) => {
      try {
        const updated = await superUserService.updateOverride(id, value);
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update config override';
        setError(message);
        throw err;
      }
    },
    onSuccess: (updated) => {
      if (selectedTenantId) {
        queryClient.invalidateQueries({
          queryKey: TENANT_CONFIG_QUERY_KEYS.list(selectedTenantId),
        });
      }
      setSelectedOverride(updated);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update config override';
      setError(message);
    },
  });

  // Mutation: Delete/Expire configuration override
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await superUserService.expireOverride(id);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to expire config override';
        setError(message);
        throw err;
      }
    },
    onSuccess: () => {
      if (selectedTenantId) {
        queryClient.invalidateQueries({
          queryKey: TENANT_CONFIG_QUERY_KEYS.list(selectedTenantId),
        });
      }
      setSelectedOverride(null);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to expire config override';
      setError(message);
    },
  });

  // Callback: Load overrides for tenant
  const handleLoadOverrides = useCallback(async (tenantId: string) => {
    try {
      setSelectedTenantId(tenantId);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load overrides';
      setError(message);
    }
  }, []);

  // Callback: Create override
  const handleCreate = useCallback(async (input: ConfigOverrideInput) => {
    // Validate config key
    if (!handleValidateConfigKey(input.configKey)) {
      throw new Error(`Invalid config key: ${input.configKey}`);
    }
    await createMutation.mutateAsync(input);
  }, [createMutation, handleValidateConfigKey]);

  // Callback: Update override
  const handleUpdate = useCallback(
    async (id: string, value: unknown) => {
      await updateMutation.mutateAsync({ id, value });
    },
    [updateMutation]
  );

  // Callback: Delete/Expire override
  const handleExpire = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  // Callback: Validate config key
  const handleValidateConfigKey = useCallback((key: string): boolean => {
    return VALID_CONFIG_KEYS.includes(key as typeof VALID_CONFIG_KEYS[number]);
  }, []);

  // Callback: Refetch
  const handleRefetch = useCallback(async () => {
    try {
      await refetchOverrides();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refetch';
      setError(message);
    }
  }, [refetchOverrides]);

  return {
    // Data
    overrides: filteredOverrides,
    selectedOverride,

    // Filtering
    filterByKey,

    // Loading states
    loading:
      loading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isValidating: false,

    // Error
    error:
      error ||
      (hasOverridesError
        ? overridesError instanceof Error
          ? overridesError.message
          : 'Unknown error'
        : null),

    // Actions
    loadOverrides: handleLoadOverrides,
    create: handleCreate,
    update: handleUpdate,
    expire: handleExpire,
    selectOverride: setSelectedOverride,
    setFilterByKey,
    validateConfigKey: handleValidateConfigKey,
    refetch: handleRefetch,
  };
};

export default useTenantConfig;