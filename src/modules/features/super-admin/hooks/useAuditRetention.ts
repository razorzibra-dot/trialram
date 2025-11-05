/**
 * Audit Retention Hooks - React Query Integration
 * Layer 7: Custom hooks for audit retention management
 * 
 * Provides hooks for fetching and managing retention policies, cleanup,
 * and statistics with React Query caching and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditRetentionServiceModule } from '../services/auditRetentionService';
import {
  RetentionPolicy,
  AuditLogArchive,
  RetentionCleanupResult,
  RetentionStats
} from '@/types';
import { message } from 'antd';

/**
 * Cache key factory for hierarchical cache management
 */
export const auditRetentionKeys = {
  all: ['auditRetention'] as const,
  policies: () => [...auditRetentionKeys.all, 'policies'] as const,
  policy: (id: string) => [...auditRetentionKeys.policies(), id] as const,
  stats: () => [...auditRetentionKeys.all, 'stats'] as const,
  archives: () => [...auditRetentionKeys.all, 'archives'] as const,
  cleanupHistory: () => [...auditRetentionKeys.all, 'cleanupHistory'] as const,
  cleanupStatus: () => [...auditRetentionKeys.all, 'cleanupStatus'] as const,
};

/**
 * Hook: Fetch all retention policies
 */
export function useRetentionPolicies(tenantId?: string) {
  return useQuery({
    queryKey: [...auditRetentionKeys.policies(), tenantId],
    queryFn: () => auditRetentionServiceModule.getRetentionPolicies(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });
}

/**
 * Hook: Fetch a specific retention policy
 */
export function useRetentionPolicy(policyId: string) {
  return useQuery({
    queryKey: auditRetentionKeys.policy(policyId),
    queryFn: () => auditRetentionServiceModule.getRetentionPolicy(policyId),
    enabled: !!policyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Create a new retention policy
 */
export function useCreateRetentionPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>) =>
      auditRetentionServiceModule.createRetentionPolicy(policy),
    onSuccess: (newPolicy) => {
      // Invalidate policies list
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.policies() });
      // Add new policy to cache
      queryClient.setQueryData(auditRetentionKeys.policy(newPolicy.id), newPolicy);
      message.success('Retention policy created successfully');
    },
    onError: (error) => {
      console.error('Error creating retention policy:', error);
      message.error('Failed to create retention policy');
    },
  });
}

/**
 * Hook: Update a retention policy
 */
export function useUpdateRetentionPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyId,
      updates
    }: {
      policyId: string;
      updates: Partial<Omit<RetentionPolicy, 'id' | 'createdAt'>>;
    }) => auditRetentionServiceModule.updateRetentionPolicy(policyId, updates),
    onSuccess: (updatedPolicy, variables) => {
      // Update specific policy cache
      queryClient.setQueryData(auditRetentionKeys.policy(variables.policyId), updatedPolicy);
      // Invalidate policies list
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.policies() });
      message.success('Retention policy updated successfully');
    },
    onError: (error) => {
      console.error('Error updating retention policy:', error);
      message.error('Failed to update retention policy');
    },
  });
}

/**
 * Hook: Delete a retention policy
 */
export function useDeleteRetentionPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policyId: string) => auditRetentionServiceModule.deleteRetentionPolicy(policyId),
    onSuccess: (_, policyId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: auditRetentionKeys.policy(policyId) });
      // Invalidate policies list
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.policies() });
      message.success('Retention policy deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting retention policy:', error);
      message.error('Failed to delete retention policy');
    },
  });
}

/**
 * Hook: Fetch retention statistics
 */
export function useRetentionStats(tenantId?: string) {
  return useQuery({
    queryKey: [...auditRetentionKeys.stats(), tenantId],
    queryFn: () => auditRetentionServiceModule.getRetentionStats(tenantId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook: Execute retention cleanup
 */
export function useExecuteRetentionCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId?: string) => auditRetentionServiceModule.executeRetentionCleanup(tenantId),
    onSuccess: (result) => {
      // Invalidate affected caches
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.archives() });
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.cleanupHistory() });
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.cleanupStatus() });

      message.success(
        `Retention cleanup completed: ${result.logsArchived} archived, ${result.logsDeleted} deleted`
      );
    },
    onError: (error) => {
      console.error('Error executing retention cleanup:', error);
      message.error('Failed to execute retention cleanup');
    },
  });
}

/**
 * Hook: Fetch audit log archives
 */
export function useAuditArchives(tenantId?: string, limit?: number) {
  return useQuery({
    queryKey: [...auditRetentionKeys.archives(), tenantId, limit],
    queryFn: () => auditRetentionServiceModule.getArchives(tenantId, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook: Fetch cleanup history
 */
export function useCleanupHistory(limit?: number) {
  return useQuery({
    queryKey: [...auditRetentionKeys.cleanupHistory(), limit],
    queryFn: () => auditRetentionServiceModule.getCleanupHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook: Schedule retention cleanup
 */
export function useScheduleRetentionCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay: string;
      timezone: string;
    }) => auditRetentionServiceModule.scheduleRetentionCleanup(config),
    onSuccess: (result) => {
      // Invalidate cleanup status
      queryClient.invalidateQueries({ queryKey: auditRetentionKeys.cleanupStatus() });
      message.success(`Retention cleanup scheduled: ${result.message}`);
    },
    onError: (error) => {
      console.error('Error scheduling retention cleanup:', error);
      message.error('Failed to schedule retention cleanup');
    },
  });
}

/**
 * Hook: Get cleanup status (combined query)
 */
export function useCleanupStatus() {
  return useQuery({
    queryKey: auditRetentionKeys.cleanupStatus(),
    queryFn: () => auditRetentionServiceModule.getCleanupStatus(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook: Validate retention policy
 * (No query, local validation only)
 */
export function useValidateRetentionPolicy() {
  return (policy: Partial<RetentionPolicy>) => {
    return auditRetentionServiceModule.validateRetentionPolicy(policy);
  };
}

/**
 * Hook: Get retention metadata
 */
export function useRetentionMetadata() {
  return auditRetentionServiceModule.getRetentionMetadata();
}

/**
 * Combined hook: For dashboard that needs stats and recent history
 */
export function useRetentionDashboard(tenantId?: string) {
  const stats = useRetentionStats(tenantId);
  const cleanupHistory = useCleanupHistory(5);
  const archives = useAuditArchives(tenantId, 10);

  return {
    stats,
    cleanupHistory,
    archives,
    isLoading: stats.isLoading || cleanupHistory.isLoading || archives.isLoading,
    isError: stats.isError || cleanupHistory.isError || archives.isError,
    error: stats.error || cleanupHistory.error || archives.error,
  };
}

/**
 * Combined hook: For policy management
 */
export function useRetentionPolicyManagement(tenantId?: string) {
  const policies = useRetentionPolicies(tenantId);
  const createPolicy = useCreateRetentionPolicy();
  const updatePolicy = useUpdateRetentionPolicy();
  const deletePolicy = useDeleteRetentionPolicy();
  const validatePolicy = useValidateRetentionPolicy();
  const metadata = useRetentionMetadata();

  return {
    policies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    validatePolicy,
    metadata,
    isLoading: policies.isLoading || createPolicy.isPending || updatePolicy.isPending || deletePolicy.isPending,
  };
}

/**
 * Combined hook: For cleanup management
 */
export function useCleanupManagement(tenantId?: string) {
  const executeCleanup = useExecuteRetentionCleanup();
  const scheduleCleanup = useScheduleRetentionCleanup();
  const stats = useRetentionStats(tenantId);
  const history = useCleanupHistory(10);
  const cleanupStatus = useCleanupStatus();

  return {
    executeCleanup,
    scheduleCleanup,
    stats,
    history,
    cleanupStatus,
    isLoading:
      executeCleanup.isPending ||
      scheduleCleanup.isPending ||
      stats.isLoading ||
      history.isLoading ||
      cleanupStatus.isLoading,
  };
}