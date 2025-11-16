/**
 * Impersonation Management Hooks
 * Provides React hooks for managing user impersonation sessions
 * 
 * Includes audit logging, session tracking, and lifecycle management
 * 
 * @module useImpersonation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ImpersonationLogType,
  ImpersonationStartInput,
  ImpersonationEndInput,
} from '@/types/superUserModule';
import { useService } from '@/modules/core/hooks/useService';
import type { IImpersonationService } from '@/services/api/supabase/impersonationService';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/**
 * Query key factory for impersonation queries
 */
const IMPERSONATION_QUERY_KEYS = {
  all: ['impersonation'] as const,
  logs: () => [...IMPERSONATION_QUERY_KEYS.all, 'logs'] as const,
  logsList: () => [...IMPERSONATION_QUERY_KEYS.logs(), 'list'] as const,
  logsByUser: (userId: string) =>
    [...IMPERSONATION_QUERY_KEYS.logs(), 'byUser', userId] as const,
  logsById: (id: string) => [...IMPERSONATION_QUERY_KEYS.logs(), 'byId', id] as const,
  active: () => [...IMPERSONATION_QUERY_KEYS.all, 'active'] as const,
};

/**
 * Fetch all impersonation logs with pagination/filtering
 * 
 * @returns Query result with impersonation logs
 * 
 * @example
 * const { data: logs, isLoading } = useImpersonationLogs();
 */
export function useImpersonationLogs() {
  const impersonationService = useService<IImpersonationService>('impersonationService');
  
  return useQuery({
    queryKey: IMPERSONATION_QUERY_KEYS.logsList(),
    queryFn: async () => {
      return impersonationService.getImpersonationLogs();
    },
    ...LISTS_QUERY_CONFIG,
    refetchOnMount: true,
  });
}

/**
 * Fetch impersonation logs for a specific super user
 * If no superUserId is provided, returns empty array
 * 
 * @param superUserId - Optional super user ID. If not provided, returns empty array
 * @returns Query result with logs for that user
 * 
 * @example
 * const { data: logs } = useImpersonationLogsByUserId(userId);
 */
export function useImpersonationLogsByUserId(superUserId?: string) {
  const impersonationService = useService<IImpersonationService>('impersonationService');
  
  return useQuery({
    queryKey: IMPERSONATION_QUERY_KEYS.logsByUser(superUserId || ''),
    queryFn: async () => {
      if (!superUserId) return [];
      return impersonationService.getImpersonationLogsByUserId(superUserId);
    },
    ...LISTS_QUERY_CONFIG,
    refetchOnMount: true,
  });
}

/**
 * Fetch a specific impersonation log by ID
 * 
 * @param id - Impersonation log ID
 * @returns Query result with single log entry
 * 
 * @example
 * const { data: log } = useImpersonationLogById(logId);
 */
export function useImpersonationLogById(id: string) {
  const impersonationService = useService<IImpersonationService>('impersonationService');
  
  return useQuery({
    queryKey: IMPERSONATION_QUERY_KEYS.logsById(id),
    queryFn: async () => {
      return impersonationService.getImpersonationLogById(id);
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
}

/**
 * Fetch all currently active impersonation sessions
 * 
 * @returns Query result with active sessions (where logout_at is NULL)
 * 
 * @example
 * const { data: activeSessions } = useActiveImpersonations();
 */
export function useActiveImpersonations() {
  const impersonationService = useService<IImpersonationService>('impersonationService');
  
  return useQuery({
    queryKey: IMPERSONATION_QUERY_KEYS.active(),
    queryFn: async () => {
      return impersonationService.getActiveImpersonations();
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}

/**
 * Start a new impersonation session
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: startImpersonation } = useStartImpersonation();
 * startImpersonation(
 *   {
 *     impersonatedUserId: '123',
 *     tenantId: '456',
 *     reason: 'Troubleshooting customer issue',
 *   },
 *   {
 *     onSuccess: (log) => console.log('Impersonation started:', log.id),
 *   }
 * );
 */
export function useStartImpersonation() {
  const queryClient = useQueryClient();
  const impersonationService = useService<IImpersonationService>('impersonationService');

  return useMutation({
    mutationFn: async (input: ImpersonationStartInput) => {
      return impersonationService.startImpersonation(input);
    },
    onSuccess: (newLog) => {
      queryClient.invalidateQueries({
        queryKey: IMPERSONATION_QUERY_KEYS.logs(),
      });
      queryClient.invalidateQueries({
        queryKey: IMPERSONATION_QUERY_KEYS.active(),
      });
      
      queryClient.setQueryData(IMPERSONATION_QUERY_KEYS.logsById(newLog.id), newLog);
    },
    retry: 1,
  });
}

/**
 * End an impersonation session
 * 
 * @returns Mutation object with mutate function
 * 
 * @example
 * const { mutate: endImpersonation } = useEndImpersonation();
 * endImpersonation(
 *   {
 *     logId: 'log-123',
 *     actionsTaken: [{ action: 'viewed_contracts' }],
 *   },
 *   {
 *     onSuccess: () => console.log('Session ended'),
 *   }
 * );
 */
export function useEndImpersonation() {
  const queryClient = useQueryClient();
  const impersonationService = useService<IImpersonationService>('impersonationService');

  return useMutation({
    mutationFn: async (input: ImpersonationEndInput) => {
      return impersonationService.endImpersonation(input);
    },
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries({
        queryKey: IMPERSONATION_QUERY_KEYS.logs(),
      });
      queryClient.invalidateQueries({
        queryKey: IMPERSONATION_QUERY_KEYS.active(),
      });
      
      queryClient.setQueryData(IMPERSONATION_QUERY_KEYS.logsById(updatedLog.id), updatedLog);
    },
    retry: 1,
  });
}

/**
 * Combined impersonation management hook
 * Provides all impersonation operations
 * 
 * @param superUserId - Optional filter for super user
 * @returns Object with queries and mutations
 * 
 * @example
 * const {
 *   logs,
 *   activeSessions,
 *   startImpersonation,
 *   endImpersonation,
 * } = useImpersonation(userId);
 */
export function useImpersonation(superUserId?: string) {
  const logsQuery = useImpersonationLogs();
  const userLogsQuery = useImpersonationLogsByUserId(superUserId || '');
  const activeQuery = useActiveImpersonations();
  const startMutation = useStartImpersonation();
  const endMutation = useEndImpersonation();

  return {
    // Queries
    allLogs: logsQuery.data || [],
    userLogs: userLogsQuery.data || [],
    activeSessions: activeQuery.data || [],
    isLoading: logsQuery.isLoading || userLogsQuery.isLoading || activeQuery.isLoading,
    error: logsQuery.error || userLogsQuery.error || activeQuery.error,
    
    // Mutations
    startImpersonation: startMutation.mutate,
    isStarting: startMutation.isPending,
    endImpersonation: endMutation.mutate,
    isEnding: endMutation.isPending,
    
    // Refetch
    refetch: async () => {
      await Promise.all([
        logsQuery.refetch(),
        userLogsQuery.refetch(),
        activeQuery.refetch(),
      ]);
    },
  };
}

/**
 * Export all hooks and types
 */
export type { ImpersonationLogType, ImpersonationStartInput, ImpersonationEndInput };