/**
 * Product Sales Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const PRODUCT_SALES_PERMISSIONS = {
  // Read permissions
  READ: 'product_sales:read',
  LIST: 'product_sales:list',
  VIEW: 'product_sales:view',
  
  // Create permissions
  CREATE: 'product_sales:create',
  IMPORT: 'product_sales:import',
  
  // Update permissions
  UPDATE: 'product_sales:update',
  EDIT: 'product_sales:edit',
  
  // Delete permissions
  DELETE: 'product_sales:delete',
  BULK_DELETE: 'product_sales:bulk_delete',
  
  // Export permissions
  EXPORT: 'product_sales:export',
  
  // Special permissions
  MANAGE_INVOICES: 'product_sales:manage_invoices',
  MANAGE_WARRANTY: 'product_sales:manage_warranty',
  VIEW_ANALYTICS: 'product_sales:view_analytics',
  APPROVE: 'product_sales:approve',
  REJECT: 'product_sales:reject',
} as const;

export type ProductSalesPermission = typeof PRODUCT_SALES_PERMISSIONS[keyof typeof PRODUCT_SALES_PERMISSIONS];
