/**
 * useProductSalesPermissions Hook
 * Manages RBAC permission checks for product sales actions
 * Provides permission state for UI button visibility control
 */

import { useCallback, useEffect, useState } from 'react';
import { ProductSale } from '@/types/productSales';
import { useAuth } from '@/contexts/AuthContext';

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
  const { evaluateElementPermission } = useAuth();
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
   * Load all permissions using centralized permission context
   */
  const loadPermissions = useCallback(async () => {
    try {
      console.log('[useProductSalesPermissions] 🔍 Loading permissions using centralized context');

      // Use centralized permission evaluation with caching
      const [
        canCreate,
        canView,
        canEdit,
        canDelete,
        canChangeStatus,
        canApprove,
        canReject,
        canBulkDelete,
        canBulkUpdateStatus,
        canExport,
        canViewAuditTrail,
      ] = await Promise.all([
        evaluateElementPermission('crm:product-sales:list:button.create:visible', 'visible'),
        evaluateElementPermission('crm:product-sales:list:view', 'visible'),
        evaluateElementPermission('crm:product-sales:record.{id}:field.customer_id:editable', 'editable'),
        evaluateElementPermission('crm:product-sale:record:delete', 'enabled'),
        evaluateElementPermission('crm:product-sales:record.{id}:field.status:editable', 'editable'),
        evaluateElementPermission('product_sales:approve', 'enabled'),
        evaluateElementPermission('product_sales:reject', 'enabled'),
        evaluateElementPermission('crm:product-sales:list:button.bulkdelete:visible', 'visible'),
        evaluateElementPermission('product_sales:bulk_update_status', 'enabled'),
        evaluateElementPermission('crm:product-sales:list:button.export:visible', 'visible'),
        evaluateElementPermission('crm:product-sales:record.{id}:tab.history:accessible', 'accessible'),
      ]);

      setPermissions({
        canCreate,
        canView,
        canEdit,
        canDelete,
        canChangeStatus,
        canApprove,
        canReject,
        canBulkDelete,
        canBulkUpdateStatus,
        canExport,
        canViewAuditTrail,
      });

      console.log('[useProductSalesPermissions] ✅ Permissions loaded:', {
        canCreate, canView, canEdit, canDelete
      });
    } catch (error) {
      console.error('Failed to load product sales permissions:', error);
      // Keep default denied state
    }
  }, [evaluateElementPermission]);

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
  const { evaluateElementPermission } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        console.log(`[useProductSalesActionPermission] 🔍 Checking ${action} permission using centralized context`);

        let permissionPath: string;
        let permissionAction: 'visible' | 'enabled' | 'editable' | 'accessible';

        switch (action) {
          case 'create':
            permissionPath = 'crm:product-sales:list:button.create:visible';
            permissionAction = 'visible';
            break;
          case 'view':
            permissionPath = 'crm:product-sales:list:view';
            permissionAction = 'visible';
            break;
          case 'edit':
            permissionPath = 'crm:product-sales:record.{id}:field.customer_id:editable';
            permissionAction = 'editable';
            break;
          case 'delete':
            permissionPath = 'crm:product-sale:record:delete';
            permissionAction = 'enabled';
            break;
          case 'changeStatus':
            permissionPath = 'crm:product-sales:record.{id}:field.status:editable';
            permissionAction = 'editable';
            break;
          case 'approve':
            permissionPath = 'product_sales:approve';
            permissionAction = 'enabled';
            break;
          case 'reject':
            permissionPath = 'product_sales:reject';
            permissionAction = 'enabled';
            break;
          case 'bulkDelete':
            permissionPath = 'crm:product-sales:list:button.bulkdelete:visible';
            permissionAction = 'visible';
            break;
          case 'bulkUpdateStatus':
            permissionPath = 'product_sales:bulk_update_status';
            permissionAction = 'enabled';
            break;
          case 'export':
            permissionPath = 'crm:product-sales:list:button.export:visible';
            permissionAction = 'visible';
            break;
          case 'viewAuditTrail':
            permissionPath = 'crm:product-sales:record.{id}:tab.history:accessible';
            permissionAction = 'accessible';
            break;
          default:
            setAllowed(false);
            return;
        }

        const result = await evaluateElementPermission(permissionPath, permissionAction);
        setAllowed(result);

        console.log(`[useProductSalesActionPermission] ✅ ${action} permission:`, result);
      } catch (error) {
        console.error(`Failed to check ${action} permission:`, error);
        setAllowed(false);
      }
    };

    checkPermission();
  }, [action, sale, tenantId, evaluateElementPermission]);

  return allowed;
};

export default useProductSalesPermissions;