/**
 * Sales Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const SALES_PERMISSIONS = {
  // Read permissions
  READ: 'sales:read',
  LIST: 'sales:list',
  VIEW: 'sales:view',
  
  // Create permissions
  CREATE: 'sales:create',
  IMPORT: 'sales:import',
  
  // Update permissions
  UPDATE: 'sales:update',
  EDIT: 'sales:edit',
  
  // Delete permissions
  DELETE: 'sales:delete',
  BULK_DELETE: 'sales:bulk_delete',
  
  // Export permissions
  EXPORT: 'sales:export',
  
  // Special permissions
  MANAGE_DEALS: 'sales:manage_deals',
  MANAGE_PIPELINE: 'sales:manage_pipeline',
  VIEW_ANALYTICS: 'sales:view_analytics',
  CLOSE_DEAL: 'sales:close_deal',
  REOPEN_DEAL: 'sales:reopen_deal',
} as const;

export type SalesPermission = typeof SALES_PERMISSIONS[keyof typeof SALES_PERMISSIONS];
