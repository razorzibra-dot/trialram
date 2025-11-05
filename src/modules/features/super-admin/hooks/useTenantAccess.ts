/**
 * Tenant Access Hook
 * Custom React hook for tenant access management
 * Handles: granting, revoking, updating access levels with cache invalidation
 *
 * @module useTenantAccess
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantAccessType, TenantAccessCreateInput } from '@/types/superUserModule';

/**
 * Mock implementation of tenant access service
 * The actual superUserService was archived in cleanup
 * This provides fallback data until a proper service implementation is added
 */
const mockTenantAccessService = {
  getTenantAccessList: async (
    _superUserId: string,
    _page: number,
    _limit: number
  ) => {
    return {
      data: [
        {
          id: 'access_1',
          superUserId: _superUserId,
          tenantId: 'tenant_1',
          accessLevel: 'full' as const,
          grantedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: _page,
      limit: _limit,
    };
  },
  grantTenantAccess: async (input: TenantAccessCreateInput): Promise<TenantAccessType> => {
    return {
      id: `access_${Date.now()}`,
      superUserId: input.superUserId,
      tenantId: input.tenantId,
      accessLevel: input.accessLevel || 'limited',
      grantedAt: new Date().toISOString(),
    };
  },
  revokeTenantAccess: async (_superUserId: string, _tenantId: string) => {
    // Mock implementation - just resolves
  },
  updateAccessLevel: async (
    superUserId: string,
    tenantId: string,
    newLevel: 'full' | 'limited' | 'read_only' | 'specific_modules'
  ): Promise<TenantAccessType> => {
    return {
      id: `access_${superUserId}_${tenantId}`,
      superUserId,
      tenantId,
      accessLevel: newLevel,
      grantedAt: new Date().toISOString(),
    };
  },
};

// Use the mock service as a fallback
const superUserService = mockTenantAccessService;

// Query keys for React Query cache management
export const TENANT_ACCESS_QUERY_KEYS = {
  all: ['tenantAccess'] as const,
  lists: () => [...TENANT_ACCESS_QUERY_KEYS.all, 'list'] as const,
  list: (superUserId: string) => [
    ...TENANT_ACCESS_QUERY_KEYS.lists(),
    superUserId,
  ] as const,
  detail: (superUserId: string, tenantId: string) =>
    [...TENANT_ACCESS_QUERY_KEYS.all, 'detail', superUserId, tenantId] as const,
};

/**
 * Tenant access management hook state
 */
interface UseTenantAccessState {
  // Data
  accessList: TenantAccessType[];
  selectedAccess: TenantAccessType | null;

  // Pagination
  page: number;
  limit: number;
  total: number;

  // Loading states
  loading: boolean;
  isGranting: boolean;
  isRevoking: boolean;
  isUpdating: boolean;

  // Error state
  error: string | null;

  // Actions
  grant: (input: TenantAccessCreateInput) => Promise<void>;
  revoke: (superUserId: string, tenantId: string) => Promise<void>;
  updateLevel: (
    superUserId: string,
    tenantId: string,
    newLevel: 'full' | 'limited' | 'read_only' | 'specific_modules'
  ) => Promise<void>;
  selectAccess: (access: TenantAccessType) => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing tenant access with grant/revoke operations
 * @param superUserId - Optional super user ID. If not provided, fetches all tenant access records
 * @returns Tenant access management state and actions
 */
export const useTenantAccess = (superUserId?: string): UseTenantAccessState => {
  const queryClient = useQueryClient();
  const [selectedAccess, setSelectedAccess] = useState<TenantAccessType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Use provided superUserId or empty string for "all access" mode
  const effectiveSuperUserId = superUserId || '';

  // Query: Fetch tenant access list
  const {
    data: accessData,
    isLoading: loading,
    refetch: refetchList,
    isError: hasAccessError,
    error: accessError,
  } = useQuery({
    queryKey: TENANT_ACCESS_QUERY_KEYS.list(effectiveSuperUserId),
    queryFn: async () => {
      try {
        const data = await superUserService.getTenantAccessList(
          effectiveSuperUserId,
          page,
          limit
        );
        setError(null);
        return data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch tenant access';
        setError(message);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnMount: true,  // Always fetch when component mounts
  });

  // Mutation: Grant tenant access
  const grantMutation = useMutation({
    mutationFn: async (input: TenantAccessCreateInput) => {
      try {
        const newAccess = await superUserService.grantTenantAccess(input);
        return newAccess;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to grant access';
        setError(message);
        throw err;
      }
    },
    onSuccess: (newAccess) => {
      queryClient.invalidateQueries({
        queryKey: TENANT_ACCESS_QUERY_KEYS.list(effectiveSuperUserId),
      });
      setSelectedAccess(newAccess);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to grant access';
      setError(message);
    },
  });

  // Mutation: Revoke tenant access
  const revokeMutation = useMutation({
    mutationFn: async ({
      superUserId: suid,
      tenantId: tid,
    }: {
      superUserId: string;
      tenantId: string;
    }) => {
      try {
        await superUserService.revokeTenantAccess(suid, tid);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to revoke access';
        setError(message);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANT_ACCESS_QUERY_KEYS.list(effectiveSuperUserId),
      });
      setSelectedAccess(null);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to revoke access';
      setError(message);
    },
  });

  // Mutation: Update access level
  const updateLevelMutation = useMutation({
    mutationFn: async ({
      superUserId: suid,
      tenantId: tid,
      newLevel,
    }: {
      superUserId: string;
      tenantId: string;
      newLevel: 'full' | 'limited' | 'read_only' | 'specific_modules';
    }) => {
      try {
        const updated = await superUserService.updateAccessLevel(
          suid,
          tid,
          newLevel
        );
        return updated;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to update access level';
        setError(message);
        throw err;
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: TENANT_ACCESS_QUERY_KEYS.list(effectiveSuperUserId),
      });
      setSelectedAccess(updated);
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update access level';
      setError(message);
    },
  });

  // Callback: Grant access
  const handleGrant = useCallback(async (input: TenantAccessCreateInput) => {
    await grantMutation.mutateAsync(input);
  }, [grantMutation]);

  // Callback: Revoke access
  const handleRevoke = useCallback(
    async (suid: string, tid: string) => {
      await revokeMutation.mutateAsync({
        superUserId: suid,
        tenantId: tid,
      });
    },
    [revokeMutation]
  );

  // Callback: Update access level
  const handleUpdateLevel = useCallback(
    async (
      suid: string,
      tid: string,
      newLevel: 'full' | 'limited' | 'read_only' | 'specific_modules'
    ) => {
      await updateLevelMutation.mutateAsync({
        superUserId: suid,
        tenantId: tid,
        newLevel,
      });
    },
    [updateLevelMutation]
  );

  // Callback: Refetch
  const handleRefetch = useCallback(async () => {
    try {
      await refetchList();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refetch';
      setError(message);
    }
  }, [refetchList]);

  // Callback: Set page
  const handleSetPage = useCallback(async (newPage: number) => {
    setCurrentPage(newPage);
    setError(null);
  }, []);

  return {
    // Data
    accessList: accessData?.data || [],
    selectedAccess,

    // Pagination
    page,
    limit,
    total: accessData?.total || 0,

    // Loading states
    loading:
      loading ||
      grantMutation.isPending ||
      revokeMutation.isPending ||
      updateLevelMutation.isPending,
    isGranting: grantMutation.isPending,
    isRevoking: revokeMutation.isPending,
    isUpdating: updateLevelMutation.isPending,

    // Error
    error:
      error ||
      (hasAccessError
        ? accessError instanceof Error
          ? accessError.message
          : 'Unknown error'
        : null),

    // Actions
    grant: handleGrant,
    revoke: handleRevoke,
    updateLevel: handleUpdateLevel,
    selectAccess: setSelectedAccess,
    setPage: handleSetPage,
    refetch: handleRefetch,
  };
};

export default useTenantAccess;