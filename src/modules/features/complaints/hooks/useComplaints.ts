/**
 * Complaints Hooks
 * React hooks for complaints operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Complaint, ComplaintFilters, ComplaintFormData, ComplaintUpdateData, ComplaintStats } from '@/types/complaints';
import { useService } from '@/modules/core/hooks/useService';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import { complaintService } from '@/services/complaints/complaintService';

// Query Keys
export const complaintKeys = {
  all: ['complaints'] as const,
  lists: () => [...complaintKeys.all, 'list'] as const,
  list: (filters: ComplaintFilters) => [...complaintKeys.lists(), filters] as const,
  details: () => [...complaintKeys.all, 'detail'] as const,
  detail: (id: string) => [...complaintKeys.details(), id] as const,
  stats: () => [...complaintKeys.all, 'stats'] as const,
};

/**
 * Hook for fetching complaints with filters
 */
export const useComplaints = (filters: ComplaintFilters = {}) => {
  return useQuery({
    queryKey: complaintKeys.list(filters),
    queryFn: () => complaintService.getComplaints(filters),
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single complaint
 */
export const useComplaint = (id: string) => {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: () => complaintService.getComplaint(id),
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Hook for fetching complaint statistics
 */
export const useComplaintStats = () => {
  return useQuery({
    queryKey: complaintKeys.stats(),
    queryFn: () => complaintService.getComplaintStats(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a complaint
 */
export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ComplaintFormData) => complaintService.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useCreateComplaint');
    },
  });
};

/**
 * Hook for updating a complaint
 */
export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComplaintUpdateData }) =>
      complaintService.updateComplaint(id, data),
    onSuccess: (updatedComplaint) => {
      queryClient.setQueryData(
        complaintKeys.detail(updatedComplaint.id),
        updatedComplaint
      );
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useUpdateComplaint');
    },
  });
};

/**
 * Hook for deleting a complaint
 */
export const useDeleteComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => complaintService.deleteComplaint(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: complaintKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useDeleteComplaint');
    },
  });
};

/**
 * Hook for adding a comment to a complaint
 */
export const useAddComplaintComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ complaintId, commentData }: {
      complaintId: string;
      commentData: { content: string; parent_id?: string }
    }) => complaintService.addComment(complaintId, commentData),
    onSuccess: (_, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) });
    },
    onError: (error) => {
      handleError(error, 'useAddComplaintComment');
    },
  });
};

/**
 * Hook for bulk operations on complaints
 */
export const useBulkComplaints = () => {
  const queryClient = useQueryClient();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<ComplaintUpdateData> }) => {
      // For simplicity, update each complaint individually
      // In a real implementation, you'd have a bulk update method
      const results = [];
      for (const id of ids) {
        try {
          const result = await complaintService.updateComplaint(id, updates);
          results.push(result);
        } catch (error) {
          console.error(`Failed to update complaint ${id}:`, error);
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useBulkComplaints.bulkUpdate');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await complaintService.deleteComplaint(id);
      }
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useBulkComplaints.bulkDelete');
    },
  });

  return {
    bulkUpdate,
    bulkDelete,
  };
};

/**
 * Hook for exporting complaints
 */
export const useComplaintExport = () => {
  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => {
      // For now, return mock data - in real implementation this would call the service
      return Promise.resolve('Mock export data');
    },
    onError: (error) => {
      handleError(error, 'useComplaintExport');
    },
  });
};