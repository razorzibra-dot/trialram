/**
 * Super Admin Management Hooks
 * Provides React hooks for managing super admin users
 * 
 * Uses React Query for data fetching and caching
 * Integrates with the factory-routed super admin management service
 * 
 * @module useSuperAdminManagement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminManagementService as factorySuperAdminManagementService } from '@/services/serviceFactory';
import type { SuperAdminDTO } from '@/modules/features/super-admin/types/superAdminManagement';

/**
 * Query key factory for cache management
 */
const SUPER_ADMIN_QUERY_KEYS = {
  all: ['superAdmin'] as const,
  list: () => [...SUPER_ADMIN_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...SUPER_ADMIN_QUERY_KEYS.all, 'detail', id] as const,
  stats: () => [...SUPER_ADMIN_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * Fetch all super admins
 * 
 * @returns Query result with super admin data
 * 
 * @example
 * const { data: superUsers, isLoading, error } = useAllSuperAdmins();
 */
export function useAllSuperAdmins() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.list(),
    queryFn: async () => {
      const result = await factorySuperAdminManagementService.getAllSuperAdmins();
      return result || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnMount: true, // ✅ Force fetch when component mounts
  });
}

/**
 * Fetch a specific super admin by ID
 * 
 * @param superAdminId - Super admin ID to fetch
 * @returns Query result with single super admin
 * 
 * @example
 * const { data: superAdmin } = useSuperAdmin(adminId);
 */
export function useSuperAdmin(superAdminId: string) {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.detail(superAdminId),
    queryFn: async () => {
      return factorySuperAdminManagementService.getSuperAdmin(superAdminId);
    },
    enabled: !!superAdminId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetch super admin statistics
 * 
 * @returns Query result with stats data
 * 
 * @example
 * const { data: stats } = useSuperAdminStats();
 */
export function useSuperAdminStats() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.stats(),
    queryFn: async () => {
      return factorySuperAdminManagementService.getSuperAdminStats();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Demote a super admin (remove super admin status)
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: demote, isPending } = useDemoteSuperAdmin();
 * demote(superAdminId, {
 *   onSuccess: () => console.log('Super admin demoted'),
 *   onError: (error) => console.error(error),
 * });
 */
export function useDemoteSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (superAdminId: string) => {
      return factorySuperAdminManagementService.demoteSuperAdmin(superAdminId);
    },
    onSuccess: () => {
      // Invalidate super admin list
      queryClient.invalidateQueries({
        queryKey: SUPER_ADMIN_QUERY_KEYS.list(),
      });
    },
    retry: 1,
  });
}

/**
 * Combined super admin list hook with error handling
 * Returns super admins suitable for display in dashboard
 * 
 * @returns Object with super admin data and status
 * 
 * @example
 * const { superUsers, isLoading, error } = useSuperAdminList();
 */
export function useSuperAdminList() {
  const { data = [], isLoading, error } = useAllSuperAdmins();

  return {
    superUsers: data,
    isLoading,
    error,
    isEmpty: data.length === 0,
  };
}

/**
 * Export types for type safety
 */
export type { SuperAdminDTO };