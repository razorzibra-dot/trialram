/**
 * Customers Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const CUSTOMER_PERMISSIONS = {
  // Read permissions
  READ: 'customers:read',
  LIST: 'customers:list',
  VIEW: 'customers:view',
  
  // Create permissions
  CREATE: 'customers:create',
  IMPORT: 'customers:import',
  
  // Update permissions
  UPDATE: 'customers:update',
  EDIT: 'customers:edit',
  
  // Delete permissions
  DELETE: 'customers:delete',
  BULK_DELETE: 'customers:bulk_delete',
  
  // Export permissions
  EXPORT: 'customers:export',
  
  // Special permissions
  MANAGE_CONTACTS: 'customers:manage_contacts',
  MANAGE_CONTRACTS: 'customers:manage_contracts',
  VIEW_ANALYTICS: 'customers:view_analytics',
  MERGE: 'customers:merge',
} as const;

export type CustomerPermission = typeof CUSTOMER_PERMISSIONS[keyof typeof CUSTOMER_PERMISSIONS];
