/**
 * Tenant Directory Hook
 * Custom React hook for loading all available tenants
 * Used by Super Admin for tenant management pages
 *
 * @module useTenantDirectory
 */

import { useQuery } from '@tanstack/react-query';
import { TenantDirectoryEntry } from '@/types/superAdmin';
import { tenantDirectoryService } from '@/services/serviceFactory';

/**
 * Query keys for React Query cache management
 */
export const TENANT_DIRECTORY_QUERY_KEYS = {
  all: ['tenantDirectory'] as const,
  lists: () => [...TENANT_DIRECTORY_QUERY_KEYS.all, 'list'] as const,
  all_tenants: () => [...TENANT_DIRECTORY_QUERY_KEYS.lists(), 'all'] as const,
  by_status: () => [...TENANT_DIRECTORY_QUERY_KEYS.lists(), 'by_status'] as const,
  status: (status: string) => [...TENANT_DIRECTORY_QUERY_KEYS.by_status(), status] as const,
  stats: () => [...TENANT_DIRECTORY_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * Tenant directory hook state
 */
interface UseTenantDirectoryState {
  // Data
  tenants: TenantDirectoryEntry[];
  stats: {
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    suspendedTenants: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;

  // Error state
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}

/**
 * Hook for managing tenant directory
 * Loads all available tenants without requiring impersonation
 * @returns Tenant directory management state and actions
 */
export const useTenantDirectory = (): UseTenantDirectoryState => {
  // Query: Fetch all tenants
  const {
    data: tenants = [],
    isLoading,
    refetch: refetchTenants,
    error: tenantsError,
  } = useQuery({
    queryKey: TENANT_DIRECTORY_QUERY_KEYS.all_tenants(),
    queryFn: async () => {
      try {
        console.log('📡 Loading tenant directory...');
        const data = await tenantDirectoryService.getAllTenants();
        console.log(`✅ Loaded ${data.length} tenants`);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load tenants';
        console.error('❌ Error loading tenants:', message);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnMount: true, // Always fetch when component mounts
  });

  // Query: Fetch tenant statistics
  const {
    data: stats = null,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: TENANT_DIRECTORY_QUERY_KEYS.stats(),
    queryFn: async () => {
      try {
        console.log('📡 Loading tenant statistics...');
        const data = await tenantDirectoryService.getTenantStats();
        console.log('✅ Loaded tenant statistics:', data);
        return data;
      } catch (err) {
        console.error('❌ Error loading tenant statistics:', err);
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnMount: true,
  });

  // Determine error message
  const error =
    tenantsError instanceof Error
      ? tenantsError.message
      : tenantsError
        ? 'Failed to load tenants'
        : null;

  // Refetch all queries
  const handleRefetch = async () => {
    try {
      console.log('🔄 Refreshing tenant directory...');
      await Promise.all([refetchTenants(), refetchStats()]);
      console.log('✅ Tenant directory refreshed');
    } catch (err) {
      console.error('❌ Error refreshing tenant directory:', err);
    }
  };

  return {
    // Data
    tenants,
    stats: stats || {
      totalTenants: 0,
      activeTenants: 0,
      inactiveTenants: 0,
      suspendedTenants: 0,
    },

    // Loading states
    isLoading,
    isLoadingStats,

    // Error
    error,

    // Actions
    refetch: handleRefetch,
  };
};

export default useTenantDirectory;