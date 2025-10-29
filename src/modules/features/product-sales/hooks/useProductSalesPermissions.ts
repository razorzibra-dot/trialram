/**
 * useProductSalesPermissions Hook
 * Manages RBAC permission checks for product sales actions
 * Provides permission state for UI button visibility control
 */

import { useCallback, useEffect, useState } from 'react';
import { ProductSale } from '@/types/productSales';
import { productSalesRbacService } from '../services/productSalesRbacService';

/**
 * Available actions with their permissions
 */
export interface ProductSalesPermissions {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canApprove: boolean;
  canReject: boolean;
  canBulkDelete: boolean;
  canBulkUpdateStatus: boolean;
  canExport: boolean;
  canViewAuditTrail: boolean;
}

/**
 * Props for the hook
 */
interface UseProductSalesPermissionsProps {
  sale?: ProductSale | null;
  tenantId?: string;
  autoLoad?: boolean;
}

/**
 * useProductSalesPermissions Hook
 * Automatically checks permissions for product sales actions
 * 
 * @param sale - Current product sale record (optional)
 * @param tenantId - Tenant ID for multi-tenant support
 * @param autoLoad - Whether to automatically load permissions on mount (default: true)
 * @returns Permissions object with boolean flags
 */
export const useProductSalesPermissions = ({
  sale,
  tenantId,
  autoLoad = true,
}: UseProductSalesPermissionsProps): ProductSalesPermissions => {
  const [permissions, setPermissions] = useState<ProductSalesPermissions>({
    canCreate: false,
    canView: false,
    canEdit: false,
    canDelete: false,
    canChangeStatus: false,
    canApprove: false,
    canReject: false,
    canBulkDelete: false,
    canBulkUpdateStatus: false,
    canExport: false,
    canViewAuditTrail: false,
  });

  /**
   * Load all permissions
   */
  const loadPermissions = useCallback(async () => {
    try {
      // Check individual permissions (no sale needed for create, view, etc.)
      const [
        createResult,
        viewResult,
        editResult,
        deleteResult,
        changeStatusResult,
        approveResult,
        rejectResult,
        bulkDeleteResult,
        bulkUpdateStatusResult,
        exportResult,
        viewAuditResult,
      ] = await Promise.all([
        productSalesRbacService.canCreateProductSale(tenantId),
        productSalesRbacService.canViewProductSales(tenantId),
        // For edit/delete/etc without a specific sale, we need to check the permission
        // These will return true/false based on role permissions alone
        productSalesRbacService.canEditProductSale({ id: 'temp' } as any, tenantId),
        productSalesRbacService.canDeleteProductSale({ id: 'temp' } as any, tenantId),
        productSalesRbacService.canChangeStatus({ id: 'temp' } as any, 'new', tenantId),
        productSalesRbacService.canApproveProductSale({ id: 'temp' } as any, tenantId),
        productSalesRbacService.canRejectProductSale({ id: 'temp' } as any, tenantId),
        productSalesRbacService.canBulkDeleteProductSales(1, tenantId),
        productSalesRbacService.canBulkUpdateStatus(1, 'new', tenantId),
        productSalesRbacService.canExportProductSales(1, tenantId),
        productSalesRbacService.canViewAuditTrail({ id: 'temp' } as any, tenantId),
      ]);

      setPermissions({
        canCreate: createResult.allowed || false,
        canView: viewResult.allowed || false,
        canEdit: editResult.allowed || false,
        canDelete: deleteResult.allowed || false,
        canChangeStatus: changeStatusResult.allowed || false,
        canApprove: approveResult.allowed || false,
        canReject: rejectResult.allowed || false,
        canBulkDelete: bulkDeleteResult.allowed || false,
        canBulkUpdateStatus: bulkUpdateStatusResult.allowed || false,
        canExport: exportResult.allowed || false,
        canViewAuditTrail: viewAuditResult.allowed || false,
      });
    } catch (error) {
      console.error('Failed to load product sales permissions:', error);
      // Keep default denied state
    }
  }, [tenantId]);

  /**
   * Load permissions on mount or when dependencies change
   */
  useEffect(() => {
    if (autoLoad) {
      loadPermissions();
    }
  }, [autoLoad, loadPermissions]);

  return permissions;
};

/**
 * useProductSalesActionPermission Hook
 * Checks a single action permission with optional sale context
 * Useful for checking specific actions
 * 
 * @param action - Action to check (create, edit, delete, etc.)
 * @param sale - Product sale for context-specific checks
 * @param tenantId - Tenant ID
 * @returns Boolean indicating if action is allowed
 */
export const useProductSalesActionPermission = (
  action: 'create' | 'view' | 'edit' | 'delete' | 'changeStatus' | 'approve' | 'reject' | 'bulkDelete' | 'bulkUpdateStatus' | 'export' | 'viewAuditTrail',
  sale?: ProductSale | null,
  tenantId?: string
): boolean => {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        let result;

        switch (action) {
          case 'create':
            result = await productSalesRbacService.canCreateProductSale(tenantId);
            break;
          case 'view':
            result = await productSalesRbacService.canViewProductSales(tenantId);
            break;
          case 'edit':
            result = sale
              ? await productSalesRbacService.canEditProductSale(sale, tenantId)
              : { allowed: false };
            break;
          case 'delete':
            result = sale
              ? await productSalesRbacService.canDeleteProductSale(sale, tenantId)
              : { allowed: false };
            break;
          case 'changeStatus':
            result = sale
              ? await productSalesRbacService.canChangeStatus(sale, 'new', tenantId)
              : { allowed: false };
            break;
          case 'approve':
            result = sale
              ? await productSalesRbacService.canApproveProductSale(sale, tenantId)
              : { allowed: false };
            break;
          case 'reject':
            result = sale
              ? await productSalesRbacService.canRejectProductSale(sale, tenantId)
              : { allowed: false };
            break;
          case 'bulkDelete':
            result = await productSalesRbacService.canBulkDeleteProductSales(tenantId);
            break;
          case 'bulkUpdateStatus':
            result = await productSalesRbacService.canBulkUpdateStatus(tenantId);
            break;
          case 'export':
            result = await productSalesRbacService.canExportProductSales(tenantId);
            break;
          case 'viewAuditTrail':
            result = sale
              ? await productSalesRbacService.canViewAuditTrail(sale, tenantId)
              : { allowed: false };
            break;
          default:
            result = { allowed: false };
        }

        setAllowed(result?.allowed || false);
      } catch (error) {
        console.error(`Failed to check ${action} permission:`, error);
        setAllowed(false);
      }
    };

    checkPermission();
  }, [action, sale, tenantId]);

  return allowed;
};

export default useProductSalesPermissions;