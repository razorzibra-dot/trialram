/**
 * Base Permission Constants Template
 * Use this as a template for creating module-specific permission constants
 * 
 * Each module should create its own permissions.ts file following this pattern.
 * This ensures consistent permission naming across the application.
 * 
 * Example module structure:
 * src/modules/features/{moduleName}/constants/permissions.ts
 */

/**
 * Base permission operations that all modules should support
 */
export const BASE_PERMISSIONS = {
  // Read operations
  READ: ':read',
  LIST: ':list',
  VIEW: ':view',
  
  // Create operations
  CREATE: ':create',
  IMPORT: ':import',
  
  // Update operations
  UPDATE: ':update',
  EDIT: ':edit',
  
  // Delete operations
  DELETE: ':delete',
  BULK_DELETE: ':bulk_delete',
  
  // Export operations
  EXPORT: ':export',
  DOWNLOAD: ':download',
  
  // Approval operations
  APPROVE: ':approve',
  REJECT: ':reject',
  
  // Manage operations
  MANAGE: ':manage',
  CONFIGURE: ':configure',
} as const;

/**
 * Template for creating module permissions
 * 
 * @example
 * // File: src/modules/features/customers/constants/permissions.ts
 * 
 * const MODULE_NAME = 'customers';
 * 
 * export const CUSTOMER_PERMISSIONS = {
 *   READ: `${MODULE_NAME}:read`,
 *   LIST: `${MODULE_NAME}:list`,
 *   CREATE: `${MODULE_NAME}:create`,
 *   UPDATE: `${MODULE_NAME}:update`,
 *   DELETE: `${MODULE_NAME}:delete`,
 *   EXPORT: `${MODULE_NAME}:export`,
 *   APPROVE_CREDIT: `${MODULE_NAME}:approve_credit`,
 * } as const;
 * 
 * // Usage in components
 * const canEdit = hasPermission(CUSTOMER_PERMISSIONS.UPDATE);
 * 
 * // Usage in conditionals
 * if (permissions.includes(CUSTOMER_PERMISSIONS.DELETE)) {
 *   // Show delete button
 * }
 */

/**
 * Helper function to create module permissions
 * 
 * @param moduleName - The name of the module
 * @param customPermissions - Additional permissions specific to the module
 * @returns Object with all permissions for the module
 * 
 * @example
 * const permissions = createModulePermissions('products', {
 *   IMPORT: 'products:import',
 *   EXPORT: 'products:export',
 *   BULK_EDIT: 'products:bulk_edit',
 * });
 */
export function createModulePermissions(
  moduleName: string,
  customPermissions: Record<string, string> = {}
) {
  const basePerms = Object.fromEntries(
    Object.entries(BASE_PERMISSIONS).map(([key, value]) => [
      key,
      `${moduleName}${value}`
    ])
  );

  return {
    ...basePerms,
    ...customPermissions,
  } as const;
}

/**
 * Type helper to extract permission values
 * 
 * @example
 * type CustomerPermission = PermissionValue<typeof CUSTOMER_PERMISSIONS>;
 */
export type PermissionValue<T> = T[keyof T];

/**
 * Standard permission group definitions
 * Use these to assign permissions to roles
 */
export const PERMISSION_GROUPS = {
  // Viewer role - read-only access
  VIEWER: ['read', 'list', 'view'],
  
  // Editor role - can create and update
  EDITOR: ['read', 'list', 'view', 'create', 'update', 'export'],
  
  // Manager role - can create, update, and delete
  MANAGER: ['read', 'list', 'view', 'create', 'update', 'delete', 'export', 'manage'],
  
  // Admin role - full access
  ADMIN: ['*'],
  
  // Custom roles can be built from these groups
} as const;

/**
 * Usage in role definition:
 * 
 * const roles = {
 *   viewer: {
 *     name: 'Viewer',
 *     permissions: PERMISSION_GROUPS.VIEWER.map(p => `${moduleName}:${p}`),
 *   },
 *   editor: {
 *     name: 'Editor',
 *     permissions: PERMISSION_GROUPS.EDITOR.map(p => `${moduleName}:${p}`),
 *   },
 * };
 */
