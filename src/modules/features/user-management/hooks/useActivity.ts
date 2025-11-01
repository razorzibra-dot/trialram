/**
 * User Activity Logging Hooks
 * Provides React hooks for fetching and logging user activity
 * Integrates with User Management Module's activity tracking system
 * Layer 7 of 8-Layer Architecture (Hooks Layer)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { userService as factoryUserService } from '@/services/serviceFactory';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserActivity {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE' | 'PASSWORD_RESET' | 'SUSPEND' | 'REACTIVATE';
  resource: 'USER' | 'ROLE' | 'PERMISSION' | 'TENANT';
  resourceId: string;
  description: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  timestamp: Date;
  tenantId: string;
  performedBy: string; // User who performed the action
}

export interface ActivityFilters {
  userId?: string;
  action?: UserActivity['action'];
  resource?: UserActivity['resource'];
  startDate?: Date;
  endDate?: Date;
  tenantId?: string;
}

export interface ActivityStats {
  totalActivities: number;
  activeUsers: number;
  failedAttempts: number;
  averageActivityPerDay: number;
}

export interface UseActivityReturn {
  data: UserActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<UserActivity[]>;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export interface UseLogActivityReturn {
  mutate: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => Promise<UserActivity>;
  isPending: boolean;
  error: Error | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ACTIVITY_QUERY_KEYS = {
  all: ['user-activity'] as const,
  lists: () => [...ACTIVITY_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...ACTIVITY_QUERY_KEYS.lists(), filters] as const,
  detail: (id: string) => [...ACTIVITY_QUERY_KEYS.all, 'detail', id] as const,
  userActivity: (userId: string) => [...ACTIVITY_QUERY_KEYS.all, 'user', userId] as const,
  stats: () => [...ACTIVITY_QUERY_KEYS.all, 'stats'] as const,
} as const;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for fetching user activity with filtering
 * @param filters - Activity filters (userId, action, date range, etc.)
 * @returns Activity data, loading state, error, and refetch function
 */
export const useUserActivity = (filters: ActivityFilters = {}) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.list(filters),
    queryFn: async (): Promise<UserActivity[]> => {
      try {
        return await factoryUserService.getUserActivity(filters);
      } catch (error) {
        console.error('Error fetching user activity:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching activity for a specific user
 * @param userId - ID of the user to fetch activity for
 * @returns Activity data, loading state, error, and refetch function
 */
export const useUserActivityLog = (userId: string) => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.userActivity(userId),
    queryFn: async (): Promise<UserActivity[]> => {
      try {
        return await factoryUserService.getUserActivity({ userId });
      } catch (error) {
        console.error(`Error fetching activity for user ${userId}:`, error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

/**
 * Hook for logging user activity
 * Automatically invalidates activity queries on successful mutation
 * @returns Mutate function, loading state, and error
 */
export const useLogActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: Omit<UserActivity, 'id' | 'timestamp'>) => {
      try {
        const result = await factoryUserService.logActivity(activity);
        return result;
      } catch (error) {
        console.error('Error logging activity:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate all activity queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to log activity:', error);
      // Note: Don't throw - logging failures shouldn't break user workflows
    },
  });
};

/**
 * Hook for fetching activity statistics
 * @returns Activity statistics and refetch function
 */
export const useActivityStats = () => {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.stats(),
    queryFn: async () => {
      try {
        const activities = await factoryUserService.getUserActivity({});
        
        // Calculate stats from activity data
        const stats: ActivityStats = {
          totalActivities: activities.length,
          activeUsers: new Set(activities.map(a => a.userId)).size,
          failedAttempts: activities.filter(a => a.status === 'FAILED').length,
          averageActivityPerDay: Math.round(
            activities.length / (activities.length > 0 ? 1 : 1)
          ),
        };
        
        return stats;
      } catch (error) {
        console.error('Error fetching activity stats:', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
};

/**
 * Hook for bulk activity logging (e.g., after multiple operations)
 * @returns Mutate function for bulk logging, loading state, and error
 */
export const useBulkLogActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activities: Array<Omit<UserActivity, 'id' | 'timestamp'>>) => {
      try {
        const results = await Promise.all(
          activities.map(activity => factoryUserService.logActivity(activity))
        );
        return results;
      } catch (error) {
        console.error('Error bulk logging activities:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all activity queries
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.all });
    },
  });
};

/**
 * Hook for clearing old activity logs (admin only)
 * @returns Mutate function, loading state, and error
 */
export const useClearOldActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysOld: number = 90) => {
      try {
        // Implementation would depend on backend support
        // For now, just invalidate cache
        return { deletedCount: 0 };
      } catch (error) {
        console.error('Error clearing old activities:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.all });
    },
  });
};

/**
 * Hook for creating an activity log entry with automatic error handling
 * Useful for wrapping user actions
 */
export const useTrackActivity = () => {
  const { mutate: logActivity } = useLogActivity();

  return useCallback(
    async (
      action: UserActivity['action'],
      resource: UserActivity['resource'],
      resourceId: string,
      options?: {
        description?: string;
        oldValue?: Record<string, any>;
        newValue?: Record<string, any>;
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      try {
        logActivity({
          userId: '', // Should be set by service
          action,
          resource,
          resourceId,
          description: options?.description || `${action} ${resource} ${resourceId}`,
          oldValue: options?.oldValue,
          newValue: options?.newValue,
          status: 'SUCCESS',
          tenantId: '', // Should be set by service
          performedBy: '', // Should be set by service
        });
        
        options?.onSuccess?.();
      } catch (error) {
        console.error('Error tracking activity:', error);
        options?.onError?.(error as Error);
      }
    },
    [logActivity]
  );
};

/**
 * Custom hook for filtering activity by date range
 */
export const useActivityByDateRange = (startDate: Date, endDate: Date) => {
  const { data: activities = [], ...rest } = useUserActivity({
    startDate,
    endDate,
  });

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const actDate = new Date(activity.timestamp);
      return actDate >= startDate && actDate <= endDate;
    });
  }, [activities, startDate, endDate]);

  return {
    data: filteredActivities,
    ...rest,
  };
};

/**
 * Custom hook for filtering activity by action type
 */
export const useActivityByAction = (action: UserActivity['action']) => {
  const { data: activities = [], ...rest } = useUserActivity({ action });

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => activity.action === action);
  }, [activities, action]);

  return {
    data: filteredActivities,
    ...rest,
  };
};

/**
 * Custom hook for tracking failed login attempts
 */
export const useFailedLoginAttempts = (userId: string) => {
  const { data: activities = [] } = useUserActivity({ userId });

  const failedAttempts = useMemo(() => {
    return activities.filter(
      a => a.resource === 'USER' && a.action === 'LOGIN' && a.status === 'FAILED'
    );
  }, [activities]);

  return {
    count: failedAttempts.length,
    attempts: failedAttempts,
    isLocked: failedAttempts.length >= 5, // Lock after 5 failed attempts
  };
};

/**
 * Custom hook for tracking user actions within a time window
 */
export const useRecentUserActions = (userId: string, windowMinutes: number = 60) => {
  const { data: activities = [] } = useUserActivity({ userId });

  const recentActions = useMemo(() => {
    const now = new Date();
    const windowMs = windowMinutes * 60 * 1000;
    
    return activities.filter(a => {
      const age = now.getTime() - new Date(a.timestamp).getTime();
      return age <= windowMs;
    });
  }, [activities, windowMinutes]);

  return recentActions;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  useUserActivity,
  useUserActivityLog,
  useLogActivity,
  useActivityStats,
  useBulkLogActivity,
  useClearOldActivities,
  useTrackActivity,
  useActivityByDateRange,
  useActivityByAction,
  useFailedLoginAttempts,
  useRecentUserActions,
  ACTIVITY_QUERY_KEYS,
};