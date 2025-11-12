/**
 * JobWorks Hooks
 * React hooks for job works operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobWorksService, JobWorksFilters, CreateJobWorkData } from '../services/jobWorksService';
import { useService } from '@/modules/core/hooks/useService';
import { useNotification } from '@/hooks/useNotification';
import { useTenantContext } from '@/hooks/useTenantContext';

// Query Keys
export const jobWorksKeys = {
  all: ['jobworks'] as const,
  jobworks: () => [...jobWorksKeys.all, 'jobworks'] as const,
  jobwork: (id: string) => [...jobWorksKeys.jobworks(), id] as const,
  stats: () => [...jobWorksKeys.all, 'stats'] as const,
};

/**
 * Hook for fetching job works with filters
 */
export const useJobWorks = (filters: JobWorksFilters = {}) => {
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { isInitialized: isTenantInitialized, tenantId } = useTenantContext();

  return useQuery({
    queryKey: [...jobWorksKeys.jobworks(), filters, tenantId],
    queryFn: () => jobWorksService.getJobWorks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: isTenantInitialized, // Wait for tenant to be initialized
    retry: 3, // Retry failed requests 3 times
  });
};

/**
 * Hook for fetching a single job work
 */
export const useJobWork = (id: string) => {
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery({
    queryKey: jobWorksKeys.jobwork(id),
    queryFn: () => jobWorksService.getJobWork(id),
    enabled: !!id && isTenantInitialized, // Wait for tenant and have ID
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

/**
 * Hook for fetching job work statistics
 */
export const useJobWorkStats = () => {
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery({
    queryKey: jobWorksKeys.stats(),
    queryFn: () => jobWorksService.getJobWorkStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: isTenantInitialized, // Wait for tenant to be initialized
    retry: 3, // Retry failed requests 3 times
  });
};

/**
 * Hook for creating a new job work
 */
export const useCreateJobWork = () => {
  const queryClient = useQueryClient();
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (data: CreateJobWorkData) => jobWorksService.createJobWork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.jobworks() });
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.stats() });
      success('Job work created successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to create job work');
    },
  });
};

/**
 * Hook for updating a job work
 */
export const useUpdateJobWork = () => {
  const queryClient = useQueryClient();
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobWorkData> }) => 
      jobWorksService.updateJobWork(id, data),
    onSuccess: (updatedJobWork) => {
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.jobwork(updatedJobWork.id) });
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.jobworks() });
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.stats() });
      success('Job work updated successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update job work');
    },
  });
};

/**
 * Hook for deleting a job work
 */
export const useDeleteJobWork = () => {
  const queryClient = useQueryClient();
  const jobWorksService = useService<JobWorksService>('jobWorksService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (id: string) => jobWorksService.deleteJobWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.jobworks() });
      queryClient.invalidateQueries({ queryKey: jobWorksKeys.stats() });
      success('Job work deleted successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete job work');
    },
  });
};
