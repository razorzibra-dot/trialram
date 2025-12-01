/**
 * Customers Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const CUSTOMER_PERMISSIONS = {
  // Read permissions
  READ: 'crm:customer:record:read',
  LIST: 'customers:list',
  VIEW: 'crm:customer:record:read',
  
  // Create permissions
  CREATE: 'crm:customer:record:create',
  IMPORT: 'customers:import',
  
  // Update permissions
  UPDATE: 'crm:customer:record:update',
  EDIT: 'customers:edit',
  
  // Delete permissions
  DELETE: 'crm:customer:record:delete',
  BULK_DELETE: 'customers:bulk_delete',
  
  // Export permissions
  EXPORT: 'crm:customer:record:export',
  
  // Special permissions
  MANAGE_CONTACTS: 'customers:manage_contacts',
  MANAGE_CONTRACTS: 'customers:manage_contracts',
  VIEW_ANALYTICS: 'crm:customer:record:read_analytics',
  MERGE: 'customers:merge',
} as const;

export type CustomerPermission = typeof CUSTOMER_PERMISSIONS[keyof typeof CUSTOMER_PERMISSIONS];
