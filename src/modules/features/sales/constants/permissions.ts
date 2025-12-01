/**
 * Sales Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const SALES_PERMISSIONS = {
  // Read permissions
  READ: 'crm:sales:deal:read',
  LIST: 'sales:list',
  VIEW: 'sales:view',
  
  // Create permissions
  CREATE: 'crm:sales:deal:create',
  IMPORT: 'sales:import',
  
  // Update permissions
  UPDATE: 'crm:sales:deal:update',
  EDIT: 'sales:edit',
  
  // Delete permissions
  DELETE: 'crm:sales:deal:delete',
  BULK_DELETE: 'sales:bulk_delete',
  
  // Export permissions
  EXPORT: 'sales:export',
  
  // Special permissions
  MANAGE_DEALS: 'sales:manage_deals',
  MANAGE_PIPELINE: 'sales:manage_pipeline',
  VIEW_ANALYTICS: 'sales:crm:analytics:insight:view',
  CLOSE_DEAL: 'sales:close_deal',
  REOPEN_DEAL: 'sales:reopen_deal',
} as const;

export type SalesPermission = typeof SALES_PERMISSIONS[keyof typeof SALES_PERMISSIONS];
