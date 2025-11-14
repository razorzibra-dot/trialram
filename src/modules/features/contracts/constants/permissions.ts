/**
 * Contracts Module Permission Constants
 * Use these instead of string literals throughout the module
 */

export const CONTRACTS_PERMISSIONS = {
  // Read permissions
  READ: 'contracts:read',
  LIST: 'contracts:list',
  VIEW: 'contracts:view',
  
  // Create permissions
  CREATE: 'contracts:create',
  IMPORT: 'contracts:import',
  
  // Update permissions
  UPDATE: 'contracts:update',
  EDIT: 'contracts:edit',
  
  // Delete permissions
  DELETE: 'contracts:delete',
  BULK_DELETE: 'contracts:bulk_delete',
  
  // Export permissions
  EXPORT: 'contracts:export',
  
  // Special permissions
  MANAGE_TERMS: 'contracts:manage_terms',
  MANAGE_RENEWALS: 'contracts:manage_renewals',
  VIEW_ANALYTICS: 'contracts:view_analytics',
  APPROVE: 'contracts:approve',
  SIGN: 'contracts:sign',
  TERMINATE: 'contracts:terminate',
} as const;

export type ContractsPermission = typeof CONTRACTS_PERMISSIONS[keyof typeof CONTRACTS_PERMISSIONS];
