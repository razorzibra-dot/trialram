/**
 * useUpdateProductSale Hook
 * Mutation for updating existing product sales
 * Handles cache invalidation and notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import { useNotification } from '@/hooks/useNotification';
import { productSalesKeys } from './useProductSales';
import { productSalesAuditService } from '../services/productSalesAuditService';
import { productSalesRbacService } from '../services/productSalesRbacService';

/**
 * Hook for updating a product sale
 * @returns Mutation object with mutate function and states
 */
export const useUpdateProductSale = () => {
  const queryClient = useQueryClient();
  const { updateSale, setSaving, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();
  const service = useService<any>('productSaleService');

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      oldSale,
    }: {
      id: string;
      updates: Partial<ProductSale>;
      oldSale?: ProductSale;
    }) => {
      clearError();
      setSaving(true);

      try {
        if (!id) {
          throw new Error('Product sale ID is required');
        }

        // Check RBAC permission for edit operation
        if (oldSale) {
          const permissionResult = await productSalesRbacService.canEditProductSale(
            oldSale,
            undefined,
            Object.keys(updates) as string[]
          );
          if (!permissionResult.allowed) {
            throw new Error(permissionResult.reason || 'You do not have permission to edit this product sale');
          }
        }

        const updatedSale: ProductSale = await service.updateProductSale(id, updates);

        return { updatedSale, oldSale };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update product sale';
        setError(errorMessage);
        throw error;
      } finally {
        setSaving(false);
      }
    },

    onSuccess: (result: { updatedSale: ProductSale; oldSale?: ProductSale }, variables) => {
      const { updatedSale, oldSale } = result;

      // Log audit trail for product sale update
      if (oldSale) {
        productSalesAuditService.logUpdateProductSale(
          oldSale,
          updatedSale,
          { source: 'form_submission' }
        ).catch(error => {
          console.error('Audit logging failed:', error);
          // Don't block the flow
        });
      }

      // Update store
      updateSale(variables.id, updatedSale);

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.detail(variables.id),
      });

      queryClient.invalidateQueries({
        queryKey: productSalesKeys.list(),
      });

      success('Product sale updated successfully');

      return updatedSale;
    },

    onError: (err: Error) => {
      const errorMessage = err.message || 'Failed to update product sale';
      error(errorMessage);
      console.error('Update product sale error:', err);
    },
  });
};

/**
 * Hook for bulk updating multiple product sales
 * @returns Mutation object for bulk updates
 */
export const useBulkUpdateProductSales = () => {
  const queryClient = useQueryClient();
  const { bulkUpdateSales, setSaving, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();
  const service = useService<any>('productSaleService');

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: Partial<ProductSale>;
    }) => {
      clearError();
      setSaving(true);

      try {
        if (!ids || ids.length === 0) {
          throw new Error('At least one product sale ID is required');
        }

        const results = await Promise.all(
          ids.map((id) => service.updateProductSale(id, updates))
        );

        return results;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update product sales';
        setError(errorMessage);
        throw error;
      } finally {
        setSaving(false);
      }
    },

    onSuccess: (results: ProductSale[], variables) => {
      // Log audit trail for bulk product sale updates
      productSalesAuditService.logBulkStatusChange(
        variables.ids,
        'bulk',
        'updated',
        'Bulk update operation',
        { source: 'bulk_update', recordCount: results.length }
      ).catch(error => {
        console.error('Audit logging failed:', error);
        // Don't block the flow
      });

      // Update store with bulk updates
      bulkUpdateSales(variables.ids, variables.updates);

      // Invalidate caches
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.list(),
      });

      success(`${variables.ids.length} product sales updated successfully`);

      return results;
    },

    onError: (err: Error) => {
      error(err.message || 'Failed to update product sales');
    },
  });
};