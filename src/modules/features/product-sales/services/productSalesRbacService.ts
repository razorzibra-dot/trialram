/**
 * Product Sales RBAC Service
 * Handles role-based access control and permission checks for product sales operations
 * Integrates with application-wide rbacService for permission validation
 * 
 * Pattern: Module-specific RBAC service that delegates to application-wide rbacService
 * Factory Pattern: Uses service factory for multi-mode support (mock/supabase)
 * Non-blocking: Permission failures are non-blocking and allow graceful degradation
 */

import { rbacService as factoryRbacService } from '@/services/serviceFactory';
import { ProductSale } from '@/types/productSales';

/**
 * RBAC actions specific to product sales module
 * Used for permission checking and audit logging
 */
export enum ProductSalesRbacAction {
  // Create operations
  CREATE_PRODUCT_SALE = 'crm:product-sale:record:create',
  CREATE_PRODUCT_SALE_WITH_CONTRACT = 'crm:product-sale:record:create_with_contract',
  
  // Read operations
  VIEW_PRODUCT_SALES = 'product_sales:view',
  VIEW_PRODUCT_SALE_DETAILS = 'product_sales:view_details',
  VIEW_AUDIT_TRAIL = 'product_sales:view_audit',
  EXPORT_PRODUCT_SALES = 'product_sales:export',
  
  // Update operations
  EDIT_PRODUCT_SALE = 'product_sales:edit',
  EDIT_PRODUCT_SALE_FIELDS = 'product_sales:edit_fields',
  CHANGE_STATUS = 'product_sales:change_status',
  
  // Delete operations
  DELETE_PRODUCT_SALE = 'crm:product-sale:record:delete',
  BULK_DELETE_PRODUCT_SALES = 'product_sales:bulk_delete',
  
  // Approval operations
  APPROVE_PRODUCT_SALE = 'product_sales:approve',
  REJECT_PRODUCT_SALE = 'product_sales:reject',
  
  // Bulk operations
  BULK_UPDATE_STATUS = 'product_sales:bulk_update_status',
  BULK_EXPORT = 'product_sales:bulk_export',
}

/**
 * RBAC permission result interface
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  denialCode?: 'ROLE_MISSING' | 'PERMISSION_DENIED' | 'TENANT_MISMATCH' | 'UNKNOWN';
}

/**
 * Product Sales RBAC Service
 * Provides permission checking and authorization logic for product sales operations
 */
export const productSalesRbacService = {
  /**
   * Check if user can create a product sale
   * @param tenantId - Tenant ID for multi-tenant validation
   * @param metadata - Optional metadata for detailed permission checks
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canCreateProductSale: async (
    tenantId?: string,
    metadata?: Record<string, any>
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.CREATE_PRODUCT_SALE,
        { tenantId, ...metadata }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to create product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking create permission:', error);
      // On error, log but allow (graceful degradation)
      return { allowed: true };
    }
  },

  /**
   * Check if user can view product sales list
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag
   */
  canViewProductSales: async (tenantId?: string): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.VIEW_PRODUCT_SALES,
        { tenantId }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to view product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking view permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can view product sale details
   * @param sale - The product sale record to check
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag
   */
  canViewProductSaleDetails: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.VIEW_PRODUCT_SALE_DETAILS,
        { tenantId, saleId: sale?.id }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to view this sale',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking view details permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can edit a product sale
   * @param sale - The product sale record to edit
   * @param tenantId - Tenant ID for multi-tenant validation
   * @param fieldNames - Specific fields being edited (optional, for fine-grained permissions)
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canEditProductSale: async (
    sale: ProductSale,
    tenantId?: string,
    fieldNames?: string[]
  ): Promise<PermissionResult> => {
    try {
      // Check general edit permission first
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.EDIT_PRODUCT_SALE,
        { tenantId, saleId: sale?.id, fields: fieldNames }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to edit this sale',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      // If specific fields provided, check field-level permissions
      if (fieldNames && fieldNames.length > 0) {
        for (const field of fieldNames) {
          // Certain fields might require special permissions
          if (['status', 'approvalStatus'].includes(field)) {
            const fieldResult = await factoryRbacService.validateRolePermissions(
              ProductSalesRbacAction.CHANGE_STATUS,
              { tenantId, saleId: sale?.id, field }
            );
            if (!fieldResult) {
              return {
                allowed: false,
                reason: `You do not have permission to modify the ${field} field`,
                denialCode: 'PERMISSION_DENIED',
              };
            }
          }
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking edit permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can delete a product sale
   * @param sale - The product sale record to delete
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canDeleteProductSale: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.DELETE_PRODUCT_SALE,
        { tenantId, saleId: sale?.id }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to delete product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking delete permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can change product sale status
   * @param sale - The product sale record
   * @param newStatus - The new status being set
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canChangeStatus: async (
    sale: ProductSale,
    newStatus: string,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.CHANGE_STATUS,
        { tenantId, saleId: sale?.id, newStatus }
      );

      if (!result) {
        return {
          allowed: false,
          reason: `You do not have permission to change status to ${newStatus}`,
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking status change permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can approve a product sale
   * @param sale - The product sale record to approve
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canApproveProductSale: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.APPROVE_PRODUCT_SALE,
        { tenantId, saleId: sale?.id }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to approve product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can reject a product sale
   * @param sale - The product sale record to reject
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canRejectProductSale: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.REJECT_PRODUCT_SALE,
        { tenantId, saleId: sale?.id }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to reject product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking reject permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can bulk delete product sales
   * @param recordCount - Number of records being deleted
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canBulkDeleteProductSales: async (
    recordCount: number,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.BULK_DELETE_PRODUCT_SALES,
        { tenantId, recordCount }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to bulk delete product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking bulk delete permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can bulk update status
   * @param recordCount - Number of records being updated
   * @param newStatus - The new status being set
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canBulkUpdateStatus: async (
    recordCount: number,
    newStatus: string,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.BULK_UPDATE_STATUS,
        { tenantId, recordCount, newStatus }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to bulk update status',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking bulk update permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can export product sales
   * @param recordCount - Number of records being exported
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canExportProductSales: async (
    recordCount: number,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.EXPORT_PRODUCT_SALES,
        { tenantId, recordCount }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to export product sales',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking export permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check if user can view audit trail
   * @param sale - The product sale record
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns PermissionResult with allowed flag and reason if denied
   */
  canViewAuditTrail: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<PermissionResult> => {
    try {
      const result = await factoryRbacService.validateRolePermissions(
        ProductSalesRbacAction.VIEW_AUDIT_TRAIL,
        { tenantId, saleId: sale?.id }
      );

      if (!result) {
        return {
          allowed: false,
          reason: 'You do not have permission to view audit trail',
          denialCode: 'PERMISSION_DENIED',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking audit trail permission:', error);
      return { allowed: true };
    }
  },

  /**
   * Check multiple permissions at once
   * Useful for determining which actions are available for a sale
   * @param sale - The product sale record
   * @param tenantId - Tenant ID for multi-tenant validation
   * @returns Object with boolean flags for each permission
   */
  getAvailableActions: async (
    sale: ProductSale,
    tenantId?: string
  ): Promise<{
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
    canApprove: boolean;
    canReject: boolean;
    canViewAudit: boolean;
  }> => {
    try {
      const [
        viewResult,
        editResult,
        deleteResult,
        statusResult,
        approveResult,
        rejectResult,
        auditResult,
      ] = await Promise.all([
        productSalesRbacService.canViewProductSaleDetails(sale, tenantId),
        productSalesRbacService.canEditProductSale(sale, tenantId),
        productSalesRbacService.canDeleteProductSale(sale, tenantId),
        productSalesRbacService.canChangeStatus(sale, '', tenantId),
        productSalesRbacService.canApproveProductSale(sale, tenantId),
        productSalesRbacService.canRejectProductSale(sale, tenantId),
        productSalesRbacService.canViewAuditTrail(sale, tenantId),
      ]);

      return {
        canView: viewResult.allowed,
        canEdit: editResult.allowed,
        canDelete: deleteResult.allowed,
        canChangeStatus: statusResult.allowed,
        canApprove: approveResult.allowed,
        canReject: rejectResult.allowed,
        canViewAudit: auditResult.allowed,
      };
    } catch (error) {
      console.error('Error getting available actions:', error);
      // On error, allow all actions (graceful degradation)
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canChangeStatus: true,
        canApprove: true,
        canReject: true,
        canViewAudit: true,
      };
    }
  },
};