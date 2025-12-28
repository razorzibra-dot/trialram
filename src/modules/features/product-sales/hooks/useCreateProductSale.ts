/**
 * useCreateProductSale Hook
 * Mutation for creating new product sales
 * Handles validation, cache invalidation, and notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale, ProductSaleFormData } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import { useNotification } from '@/hooks/useNotification';
import { productSalesKeys } from './useProductSales';
import { productSalesAuditService } from '../services/productSalesAuditService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for creating a new product sale
 * @returns Mutation object with mutate function and states
 */
export const useCreateProductSale = () => {
  const queryClient = useQueryClient();
  const { addSale, setSaving, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();
  const service = useService<any>('productSaleService');
  const { evaluateElementPermission } = useAuth();

  return useMutation({
    mutationFn: async (data: ProductSaleFormData) => {
      clearError();
      setSaving(true);

      try {
        // Check permission using centralized context
        console.log('[useCreateProductSale] 🔍 Checking create permission using centralized context');

        const hasPermission = await evaluateElementPermission(
          'crm:product-sales:list:button.create:visible',
          'visible'
        );

        if (!hasPermission) {
          throw new Error('You do not have permission to create product sales');
        }

        if (!data.customer_id || !data.product_id) {
          throw new Error('Customer and Product are required');
        }

        if (data.units <= 0 || data.cost_per_unit <= 0) {
          throw new Error('Units and cost per unit must be greater than 0');
        }

        const newSale: ProductSale = await service.createProductSale(data);

        return newSale;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create product sale';
        setError(errorMessage);
        throw error;
      } finally {
        setSaving(false);
      }
    },

    onSuccess: (newSale: ProductSale) => {
      // Log audit trail for product sale creation
      productSalesAuditService.logCreateProductSale(
        newSale,
        { source: 'form_submission' }
      ).catch(error => {
        console.error('Audit logging failed:', error);
        // Don't block the flow
      });

      // Update store with new sale
      addSale(newSale);

      // Invalidate and refetch product sales list
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.lists(),
      });

      success('Product sale created successfully');

      return newSale;
    },

    onError: (err: Error) => {
      const errorMessage = err.message || 'Failed to create product sale';
      error(errorMessage);
      console.error('Create product sale error:', err);
    },
  });
};

/**
 * Hook for creating product sale with service contract
 * @returns Mutation object with contract creation capability
 */
export const useCreateProductSaleWithContract = () => {
  const queryClient = useQueryClient();
  const { addSale, setSaving, setError, clearError } = useProductSalesStore();
  const { success, error } = useNotification();
  const service = useService<any>('productSaleService');

  return useMutation({
    mutationFn: async (data: ProductSaleFormData & { generateContract: boolean }) => {
      clearError();
      setSaving(true);

      try {
        const result = await service.createProductSaleWithContract(
          data,
          data.generateContract
        );

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create product sale with contract';
        setError(errorMessage);
        throw error;
      } finally {
        setSaving(false);
      }
    },

    onSuccess: (result: any) => {
      // Log audit trail for product sale creation with contract
      productSalesAuditService.logCreateProductSale(
        result.productSale,
        { 
          source: 'form_submission',
          relatedContract: result.serviceContractId,
          withServiceContract: true
        }
      ).catch(error => {
        console.error('Audit logging failed:', error);
        // Don't block the flow
      });

      // Update store
      addSale(result.productSale);

      // Invalidate caches
      queryClient.invalidateQueries({
        queryKey: productSalesKeys.lists(),
      });

      success('Product sale and service contract created successfully');

      return result;
    },

    onError: (err: Error) => {
      error(err.message || 'Failed to create product sale with contract');
    },
  });
};