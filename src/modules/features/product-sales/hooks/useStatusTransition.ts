/**
 * useStatusTransition Hook
 * Manages status transitions with validation, UI feedback, and notifications
 */

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { ProductSale } from '@/types/productSales';
import { statusTransitionService } from '../services/statusTransitionService';
import { productSalesNotificationService } from '../services/productSalesNotificationService';
import { productSalesAuditService } from '../services/productSalesAuditService';
import { productSalesRbacService } from '../services/productSalesRbacService';
import { ProductSaleStatus, getValidNextStatuses } from '../utils/statusTransitions';

interface UseStatusTransitionResult {
  transitionStatus: (sale: ProductSale, newStatus: ProductSaleStatus, reason?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  validNextStatuses: ProductSaleStatus[];
  setValidNextStatuses: (statuses: ProductSaleStatus[]) => void;
}

export const useStatusTransition = (sale: ProductSale | null): UseStatusTransitionResult => {
  const queryClient = useQueryClient();
  const [validNextStatuses, setValidNextStatuses] = useState<ProductSaleStatus[]>([]);

  // Update valid next statuses when sale changes
  const updateValidStatuses = useCallback(() => {
    if (sale?.status) {
      const nextStatuses = getValidNextStatuses(sale.status as ProductSaleStatus);
      setValidNextStatuses(nextStatuses);
    }
  }, [sale?.status]);

  // Call updateValidStatuses when sale changes
  if (sale?.status) {
    const nextStatuses = getValidNextStatuses(sale.status as ProductSaleStatus);
    if (nextStatuses !== validNextStatuses) {
      updateValidStatuses();
    }
  }

  const mutation = useMutation({
    mutationFn: async (params: { 
      sale: ProductSale; 
      newStatus: ProductSaleStatus; 
      reason?: string 
    }) => {
      // Check RBAC permission for status change
      const permissionCheck = await productSalesRbacService.canChangeStatus(
        params.sale,
        params.newStatus,
        params.sale.tenantId
      );

      if (!permissionCheck.allowed) {
        throw new Error(
          permissionCheck.reason || 'You do not have permission to change the status of this product sale'
        );
      }

      const result = await statusTransitionService.transitionStatus(
        params.sale,
        params.newStatus,
        params.reason
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    },
    onSuccess: (result, params) => {
      message.success(result.message);
      
      // Log audit trail for status change
      if (params.sale && params.sale.status) {
        try {
          productSalesAuditService.logStatusChange(
            params.sale,
            params.sale.status as string,
            params.newStatus as string,
            params.reason,
            { source: 'status_transition_modal' }
          ).catch(error => {
            console.error('Failed to log status change audit:', error);
            // Don't block the flow if audit logging fails
          });
        } catch (error) {
          console.error('Error logging status change:', error);
        }
      }
      
      // Send notification for status change
      if (params.sale && params.sale.status) {
        try {
          productSalesNotificationService.notifyStatusChange(
            params.sale,
            params.sale.status as ProductSaleStatus,
            params.newStatus,
            params.reason
          ).catch(error => {
            console.error('Failed to send notification:', error);
            // Don't block the flow if notification fails
          });
        } catch (error) {
          console.error('Error triggering notification:', error);
        }
      }
      
      // Invalidate product sales queries
      queryClient.invalidateQueries({
        queryKey: ['productSales'],
      });
      
      // Invalidate specific sale
      if (params.sale?.id) {
        queryClient.invalidateQueries({
          queryKey: ['productSales', params.sale.id],
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to transition status';
      message.error(errorMessage);
    },
  });

  const transitionStatus = useCallback(
    async (targetSale: ProductSale, newStatus: ProductSaleStatus, reason?: string) => {
      await mutation.mutateAsync({
        sale: targetSale,
        newStatus,
        reason,
      });
    },
    [mutation]
  );

  return {
    transitionStatus,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
    validNextStatuses,
    setValidNextStatuses,
  };
};

export default useStatusTransition;