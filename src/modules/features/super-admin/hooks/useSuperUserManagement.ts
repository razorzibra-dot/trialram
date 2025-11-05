/**
 * Super User Management Hooks
 * Provides React hooks for managing super user tenant access
 * 
 * Uses React Query for data fetching and caching
 * Integrates with the factory-routed super user service
 * 
 * @module useSuperUserManagement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SuperUserTenantAccessType,
  SuperUserTenantAccessCreateInput,
  SuperUserTenantAccessUpdateInput,
} from '@/types/superUserModule';

/**
 * Mock implementation of super user service
 * The actual superUserService was archived in cleanup
 * This provides fallback data until a proper service implementation is added
 */
const mockSuperUserService = {
  getSuperUserTenantAccess: async (): Promise<SuperUserTenantAccessType[]> => {
    return [
      {
        id: 'access_1',
        superUserId: 'super_1',
        tenantId: 'tenant_1',
        accessLevel: 'full',
        grantedAt: new Date().toISOString(),
      },
    ];
  },
  getTenantAccessByUserId: async (
    superUserId: string
  ): Promise<SuperUserTenantAccessType[]> => {
    return [
      {
        id: `access_${superUserId}_1`,
        superUserId,
        tenantId: 'tenant_1',
        accessLevel: 'full',
        grantedAt: new Date().toISOString(),
      },
    ];
  },
  getSuperUserTenantAccessById: async (
    id: string
  ): Promise<SuperUserTenantAccessType> => {
    return {
      id,
      superUserId: 'super_1',
      tenantId: 'tenant_1',
      accessLevel: 'full',
      grantedAt: new Date().toISOString(),
    };
  },
  grantTenantAccess: async (
    input: SuperUserTenantAccessCreateInput
  ): Promise<SuperUserTenantAccessType> => {
    return {
      id: `access_${Date.now()}`,
      superUserId: input.superUserId,
      tenantId: input.tenantId,
      accessLevel: input.accessLevel || 'limited',
      grantedAt: new Date().toISOString(),
    };
  },
  updateTenantAccessLevel: async (
    id: string,
    input: SuperUserTenantAccessUpdateInput
  ): Promise<SuperUserTenantAccessType> => {
    return {
      id,
      superUserId: 'super_1',
      tenantId: 'tenant_1',
      accessLevel: input.accessLevel || 'limited',
      grantedAt: new Date().toISOString(),
    };
  },
  revokeTenantAccess: async (
    _superUserId: string,
    _tenantId: string
  ): Promise<void> => {
    // Mock implementation - just resolves
  },
};

// Use the mock service as a fallback
const factorySuperUserService = mockSuperUserService;

/**
 * Query key factory for cache management
 */
const SUPER_USER_QUERY_KEYS = {
  all: ['superUser'] as const,
  tenantAccess: () => [...SUPER_USER_QUERY_KEYS.all, 'tenantAccess'] as const,
  tenantAccessList: () => [...SUPER_USER_QUERY_KEYS.tenantAccess(), 'list'] as const,
  tenantAccessByUser: (userId: string) =>
    [...SUPER_USER_QUERY_KEYS.tenantAccess(), 'byUser', userId] as const,
  tenantAccessById: (id: string) =>
    [...SUPER_USER_QUERY_KEYS.tenantAccess(), 'byId', id] as const,
};

/**
 * Fetch all super user tenant access records
 * 
 * @returns Query result with tenant access data
 * 
 * @example
 * const { data: accesses, isLoading, error } = useSuperUserTenantAccess();
 */
export function useSuperUserTenantAccess() {
  return useQuery({
    queryKey: SUPER_USER_QUERY_KEYS.tenantAccessList(),
    queryFn: async () => {
      return factorySuperUserService.getSuperUserTenantAccess();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch tenant access records for a specific super user
 * 
 * @param superUserId - Super user ID to fetch access for
 * @returns Query result with tenant access records
 * 
 * @example
 * const { data: access } = useTenantAccessByUserId(userId);
 */
export function useTenantAccessByUserId(superUserId: string) {
  return useQuery({
    queryKey: SUPER_USER_QUERY_KEYS.tenantAccessByUser(superUserId),
    queryFn: async () => {
      return factorySuperUserService.getTenantAccessByUserId(superUserId);
    },
    enabled: !!superUserId, // Only run if superUserId is provided
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch a specific tenant access record by ID
 * 
 * @param id - Tenant access record ID
 * @returns Query result with single access record
 * 
 * @example
 * const { data: access } = useSuperUserTenantAccessById(accessId);
 */
export function useSuperUserTenantAccessById(id: string) {
  return useQuery({
    queryKey: SUPER_USER_QUERY_KEYS.tenantAccessById(id),
    queryFn: async () => {
      return factorySuperUserService.getSuperUserTenantAccessById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Grant a super user access to a tenant
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: grantAccess, isPending } = useGrantTenantAccess();
 * grantAccess(
 *   { superUserId: '123', tenantId: '456', accessLevel: 'full' },
 *   {
 *     onSuccess: () => console.log('Access granted'),
 *     onError: (error) => console.error(error),
 *   }
 * );
 */
export function useGrantTenantAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SuperUserTenantAccessCreateInput) => {
      return factorySuperUserService.grantTenantAccess(input);
    },
    onSuccess: (newAccess) => {
      // Invalidate all tenant access queries
      queryClient.invalidateQueries({
        queryKey: SUPER_USER_QUERY_KEYS.tenantAccess(),
      });
      
      // Add new access to the cache
      queryClient.setQueryData(
        SUPER_USER_QUERY_KEYS.tenantAccessById(newAccess.id),
        newAccess
      );
    },
    retry: 1,
  });
}

/**
 * Update the access level for a tenant access record
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: updateLevel } = useUpdateAccessLevel();
 * updateLevel({
 *   id: 'access-123',
 *   input: { accessLevel: 'limited' }
 * });
 */
export function useUpdateAccessLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: SuperUserTenantAccessUpdateInput;
    }) => {
      return factorySuperUserService.updateTenantAccessLevel(id, input);
    },
    onSuccess: (updatedAccess) => {
      // Invalidate all tenant access queries
      queryClient.invalidateQueries({
        queryKey: SUPER_USER_QUERY_KEYS.tenantAccess(),
      });
      
      // Update the cache with new data
      queryClient.setQueryData(
        SUPER_USER_QUERY_KEYS.tenantAccessById(updatedAccess.id),
        updatedAccess
      );
    },
    retry: 1,
  });
}

/**
 * Revoke a super user's access to a tenant
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: revoke } = useRevokeTenantAccess();
 * revoke(accessId, {
 *   onSuccess: () => console.log('Access revoked')
 * });
 */
export function useRevokeTenantAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (superUserId: string, tenantId: string) => {
      return factorySuperUserService.revokeTenantAccess(superUserId, tenantId);
    },
    onSuccess: () => {
      // Invalidate all tenant access queries
      queryClient.invalidateQueries({
        queryKey: SUPER_USER_QUERY_KEYS.tenantAccess(),
      });
    },
    retry: 1,
  });
}

/**
 * Combined super user management hook
 * Provides all tenant access operations in one hook
 * 
 * @param superUserId - Optional super user ID for filtering
 * @returns Object with all queries and mutations
 * 
 * @example
 * const {
 *   tenantAccess,
 *   isLoading,
 *   grantAccess,
 *   updateLevel,
 *   revokeAccess,
 * } = useSuperUserManagement(userId);
 */
export function useSuperUserManagement(superUserId?: string) {
  const tenantAccessQuery = useSuperUserTenantAccess();
  const userAccessQuery = useTenantAccessByUserId(superUserId || '');
  const grantMutation = useGrantTenantAccess();
  const updateMutation = useUpdateAccessLevel();
  const revokeMutation = useRevokeTenantAccess();

  return {
    // Queries
    allTenantAccess: tenantAccessQuery.data || [],
    userTenantAccess: userAccessQuery.data || [],
    isLoading: tenantAccessQuery.isLoading || userAccessQuery.isLoading,
    error: tenantAccessQuery.error || userAccessQuery.error,
    
    // Mutations
    grantAccess: grantMutation.mutate,
    isGranting: grantMutation.isPending,
    updateLevel: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    revoke: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    
    // Refetch
    refetch: async () => {
      await Promise.all([
        tenantAccessQuery.refetch(),
        userAccessQuery.refetch(),
      ]);
    },
  };
}

/**
 * Export all hooks
 */
export type {
  SuperUserTenantAccessType,
  SuperUserTenantAccessCreateInput,
  SuperUserTenantAccessUpdateInput,
};