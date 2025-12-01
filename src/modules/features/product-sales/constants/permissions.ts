/**
 * Product Sales Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const PRODUCT_SALES_PERMISSIONS = {
  // Read permissions
  READ: 'crm:product-sale:record:read',
  LIST: 'product_sales:list',
  VIEW: 'product_sales:view',
  
  // Create permissions
  CREATE: 'crm:product-sale:record:create',
  IMPORT: 'product_sales:import',
  
  // Update permissions
  UPDATE: 'crm:product-sale:record:update',
  EDIT: 'product_sales:edit',
  
  // Delete permissions
  DELETE: 'crm:product-sale:record:delete',
  BULK_DELETE: 'product_sales:bulk_delete',
  
  // Export permissions
  EXPORT: 'product_sales:export',
  
  // Special permissions
  MANAGE_INVOICES: 'product_sales:manage_invoices',
  MANAGE_WARRANTY: 'product_sales:manage_warranty',
  VIEW_ANALYTICS: 'product_sales:crm:analytics:insight:view',
  APPROVE: 'product_sales:approve',
  REJECT: 'product_sales:reject',
} as const;

export type ProductSalesPermission = typeof PRODUCT_SALES_PERMISSIONS[keyof typeof PRODUCT_SALES_PERMISSIONS];
