/**
 * React Query hook for bulk operations on product sales
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ProductSale } from '@/types/productSales';
import { bulkOperationsService, BulkStatusUpdateRequest, BulkDeleteRequest } from '../services/bulkOperationsService';

interface UseBulkOperationsResult {
  bulkUpdateStatus: {
    mutate: (request: BulkStatusUpdateRequest) => void;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  bulkDelete: {
    mutate: (request: BulkDeleteRequest) => void;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
  bulkExport: {
    mutate: (data: { sales: ProductSale[]; format: 'csv' | 'xlsx'; columns: string[] }) => void;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
  };
}

/**
 * Hook for bulk operations
 */
export const useBulkOperations = (): UseBulkOperationsResult => {
  const queryClient = useQueryClient();

  // Bulk status update mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: (request: BulkStatusUpdateRequest) =>
      bulkOperationsService.bulkUpdateStatus(request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['productSales'] });
      message.success({
        content: result.message,
        duration: 3
      });
    },
    onError: (error: Error) => {
      message.error({
        content: `Bulk status update failed: ${error.message}`,
        duration: 3
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (request: BulkDeleteRequest) =>
      bulkOperationsService.bulkDelete(request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['productSales'] });
      message.success({
        content: result.message,
        duration: 3
      });
    },
    onError: (error: Error) => {
      message.error({
        content: `Bulk delete failed: ${error.message}`,
        duration: 3
      });
    }
  });

  // Bulk export mutation
  const bulkExportMutation = useMutation({
    mutationFn: (data: { sales: ProductSale[]; format: 'csv' | 'xlsx'; columns: string[] }) => {
      return bulkOperationsService.bulkExport(data.sales, data.format, data.columns);
    },
    onSuccess: (content: string, variables) => {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `product-sales-${timestamp}.${variables.format === 'csv' ? 'csv' : 'xlsx'}`;
      const mimeType = variables.format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
      
      bulkOperationsService.downloadFile(content, filename, mimeType);
      message.success({
        content: `Exported ${variables.sales.length} records successfully`,
        duration: 3
      });
    },
    onError: (error: Error) => {
      message.error({
        content: `Export failed: ${error.message}`,
        duration: 3
      });
    }
  });

  return {
    bulkUpdateStatus: {
      mutate: (request: BulkStatusUpdateRequest) =>
        bulkUpdateStatusMutation.mutate(request),
      isLoading: bulkUpdateStatusMutation.isPending,
      error: bulkUpdateStatusMutation.error,
      reset: () => bulkUpdateStatusMutation.reset()
    },
    bulkDelete: {
      mutate: (request: BulkDeleteRequest) =>
        bulkDeleteMutation.mutate(request),
      isLoading: bulkDeleteMutation.isPending,
      error: bulkDeleteMutation.error,
      reset: () => bulkDeleteMutation.reset()
    },
    bulkExport: {
      mutate: (data: { sales: ProductSale[]; format: 'csv' | 'xlsx'; columns: string[] }) =>
        bulkExportMutation.mutate(data),
      isLoading: bulkExportMutation.isPending,
      error: bulkExportMutation.error,
      reset: () => bulkExportMutation.reset()
    }
  };
};

export default useBulkOperations;