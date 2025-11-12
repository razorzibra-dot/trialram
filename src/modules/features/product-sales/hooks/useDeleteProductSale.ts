/**
 * useDeleteProductSale Hook
 * Mutation for deleting product sales
 * Handles confirmation, cache invalidation, and notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { productSaleService } from '@/services/serviceFactory';
import { useNotification } from '@/hooks/useNotification';
import { productSalesKeys } from './useProductSales';
import { productSalesAuditService } from '../services/productSalesAuditService';
import { productSalesRbacService } from '../services/productSalesRbacService';

/**
 * Hook for deleting a product sale
 * Requires confirmation before deletion
 * @returns Mutation object with mutate function and states
 */
export const useDeleteProductSale = () => {
  const queryClient = useQueryClient();
  const { deleteSale, setDeleting, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, sale }: { id: string; sale?: ProductSale }) => {
      clearError();
      setDeleting(true);

      try {
        if (!id) {
          throw new Error('Product sale ID is required');
        }

        // Check RBAC permission for delete operation
        if (sale) {
          const permissionResult = await productSalesRbacService.canDeleteProductSale(sale);
          if (!permissionResult.allowed) {
            throw new Error(permissionResult.reason || 'You do not have permission to delete this product sale');
          }
        }

        // Request confirmation
        const isConfirmed = window.confirm(
          'Are you sure you want to delete this product sale? This action cannot be undone.'
        );

        if (!isConfirmed) {
          throw new Error('Deletion cancelled by user');
        }

        await productSaleService.deleteProductSale(id);

        return { id, sale };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete product sale';
        if (!errorMessage.includes('cancelled')) {
          setError(errorMessage);
        }
        throw error;
      } finally {
        setDeleting(false);
      }
    },

    onSuccess: (result: { id: string; sale?: ProductSale }) => {
      const { id, sale } = result;

      // Log audit trail for product sale deletion
      if (sale) {
        productSalesAuditService.logDeleteProductSale(
          sale,
          'User initiated deletion',
          { source: 'manual_deletion' }
        ).catch(error => {
          console.error('Audit logging failed:', error);
          // Don't block the flow
        });
      }

      // Update store
      deleteSale(id);

      // Invalidate and refetch list
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.list(),
      });

      success('Product sale deleted successfully');
    },

    onError: (err: Error) => {
      if (!err.message.includes('cancelled')) {
        const errorMessage = err.message || 'Failed to delete product sale';
        error(errorMessage);
        console.error('Delete product sale error:', err);
      }
    },
  });
};

/**
 * Hook for bulk deleting multiple product sales
 * Requires confirmation for all deletions
 * @returns Mutation object for bulk deletion
 */
export const useBulkDeleteProductSales = () => {
  const queryClient = useQueryClient();
  const { bulkDeleteSales, setDeleting, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      clearError();
      setDeleting(true);

      try {
        if (!ids || ids.length === 0) {
          throw new Error('At least one product sale ID is required');
        }

        // Request confirmation
        const isConfirmed = window.confirm(
          `Are you sure you want to delete ${ids.length} product sale(s)? This action cannot be undone.`
        );

        if (!isConfirmed) {
          throw new Error('Deletion cancelled by user');
        }

        await Promise.all(ids.map((id) => productSaleService.deleteProductSale(id)));

        return ids;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete product sales';
        if (!errorMessage.includes('cancelled')) {
          setError(errorMessage);
        }
        throw error;
      } finally {
        setDeleting(false);
      }
    },

    onSuccess: (ids: string[]) => {
      // Log audit trail for bulk product sale deletion
      productSalesAuditService.logBulkDelete(
        ids,
        'Bulk deletion initiated',
        { source: 'bulk_deletion', recordCount: ids.length }
      ).catch(error => {
        console.error('Audit logging failed:', error);
        // Don't block the flow
      });

      // Update store with bulk deletion
      bulkDeleteSales(ids);

      // Invalidate caches
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.list(),
      });

      success(`${ids.length} product sale(s) deleted successfully`);
    },

    onError: (err: Error) => {
      if (!err.message.includes('cancelled')) {
        error(err.message || 'Failed to delete product sales');
      }
    },
  });
};