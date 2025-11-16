/**
 * User Management Hooks
 * React Query hooks for user data fetching and mutations
 * 
 * STANDARDIZED LAYER SYNC:
 * ✅ Uses React Query for remote data fetching
 * ✅ Consistent query keys for cache management
 * ✅ Loading/error/data states in all hooks
 * ✅ Cache invalidation on mutations
 * ✅ Returns DTOs matching database exactly
 * ✅ TypeScript types imported from centralized location
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import type { IUserService } from '../services/userService';
import {
  UserDTO,
  UserStatsDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  UserActivityDTO,
} from '@/types/dtos/userDtos';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/**
 * Query keys for user data - centralized for consistency
 * Enables automatic cache invalidation across the application
 */
const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: UserFiltersDTO) => [...USER_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  stats: () => [...USER_QUERY_KEYS.all, 'stats'] as const,
  activity: () => [...USER_QUERY_KEYS.all, 'activity'] as const,
  activityUser: (userId: string) => [...USER_QUERY_KEYS.activity(), userId] as const,
};

/**
 * Hook: Get all users
 * ✅ Returns: users, loading, error, refetch
 * ✅ Supports: Filtering by status, role, department, search
 * ✅ Cache: Shared across application
 */
export function useUsers(filters?: UserFiltersDTO) {
  const userService = useService<IUserService>('userService');
  const { 
    data: users = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: USER_QUERY_KEYS.list(filters),
    queryFn: () => userService.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    users,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Get single user by ID
 * ✅ Returns: user, loading, error
 * ✅ Cache: Query-specific for individual user detail
 */
export function useUser(id: string) {
  const userService = useService<IUserService>('userService');
  const {
    data: user,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: USER_QUERY_KEYS.detail(id),
    queryFn: () => userService.getUser(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!id, // Only fetch if ID exists
  });

  return {
    user,
    loading,
    error,
  };
}

/**
 * Hook: Get user statistics
 * ✅ Returns: stats, loading, error, refetch
 */
export function useUserStats() {
  const userService = useService<IUserService>('userService');
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_QUERY_KEYS.stats(),
    queryFn: () => userService.getUserStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return {
    stats,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Create user
 * ✅ Returns: mutate function, isPending, error
 * ✅ Cache: Invalidates user list on success
 */
export function useCreateUser() {
  const userService = useService<IUserService>('userService');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => userService.createUser(data),
    onSuccess: (newUser) => {
      // Invalidate list to refresh with new user
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
      // Add new user to cache
      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(newUser.id),
        newUser
      );
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.stats(),
      });
    },
    onError: (error) => {
      console.error('[useCreateUser] Error:', error);
    },
  });
}

/**
 * Hook: Update user
 * ✅ Returns: mutate function, isPending, error
 * ✅ Cache: Invalidates user list and detail on success
 */
export function useUpdateUser(userId: string) {
  const userService = useService<IUserService>('userService');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDTO) => userService.updateUser(userId, data),
    onSuccess: (updatedUser) => {
      // Update cache with new data
      queryClient.setQueryData(
        USER_QUERY_KEYS.detail(userId),
        updatedUser
      );
      // Invalidate list to reflect changes
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
      // Invalidate stats if status changed
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.stats(),
      });
    },
    onError: (error) => {
      console.error('[useUpdateUser] Error:', error);
    },
  });
}

/**
 * Hook: Delete user
 * ✅ Returns: mutate function, isPending, error
 * ✅ Cache: Invalidates user list and detail on success
 */
export function useDeleteUser() {
  const userService = useService<IUserService>('userService');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: (_, deletedUserId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: USER_QUERY_KEYS.detail(deletedUserId),
      });
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.stats(),
      });
    },
    onError: (error) => {
      console.error('[useDeleteUser] Error:', error);
    },
  });
}

/**
 * Hook: Reset user password
 * ✅ Returns: mutate function, isPending, error
 */
export function useResetPassword() {
  const userService = useService<IUserService>('userService');
  return useMutation({
    mutationFn: (userId: string) => userService.resetPassword(userId),
    onSuccess: () => {
      console.log('[useResetPassword] Password reset email sent');
    },
    onError: (error) => {
      console.error('[useResetPassword] Error:', error);
    },
  });
}

/**
 * Hook: Get user activity log
 * ✅ Returns: activities, loading, error
 */
export function useUserActivity(userId: string) {
  const userService = useService<IUserService>('userService');
  const {
    data: activities = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: USER_QUERY_KEYS.activityUser(userId),
    queryFn: () => userService.getUserActivity(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    enabled: !!userId,
  });

  return {
    activities,
    loading,
    error,
  };
}

/**
 * Hook: Get available roles
 * ✅ Returns: roles, loading, error
 */
export function useUserRoles() {
  const userService = useService<IUserService>('userService');
  const {
    data: roles = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['userRoles'],
    queryFn: () => userService.getRoles(),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    roles,
    loading,
    error,
  };
}

/**
 * Hook: Get available user statuses
 * ✅ Returns: statuses, loading, error
 */
export function useUserStatuses() {
  const userService = useService<IUserService>('userService');
  const {
    data: statuses = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['userStatuses'],
    queryFn: () => userService.getStatuses(),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    statuses,
    loading,
    error,
  };
}

/**
 * Hook: Get all tenants
 * ✅ Returns: tenants, loading, error
 * ✅ Cache: Tenants are rarely updated, cache for 1 hour
 */
export function useTenants() {
  const userService = useService<IUserService>('userService');
  const {
    data: tenants = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => userService.getTenants(),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    tenants,
    loading,
    error,
  };
}

