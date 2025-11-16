/**
 * Base Permission Constants Template
 * Standardized permission structure for all modules
 */

/**
 * Base Permissions Interface
 * Defines the standard permission types available across all modules
 *
 * @example
 * // For customers module
 * export const CUSTOMER_PERMISSIONS: BasePermissions = {
 *   READ: 'customers:read',
 *   CREATE: 'customers:create',
 *   UPDATE: 'customers:update',
 *   DELETE: 'customers:delete',
 *   APPROVE: 'customers:approve',
 *   REJECT: 'customers:reject',
 *   EXPORT: 'customers:export',
 *   IMPORT: 'customers:import',
 * };
 */
export interface BasePermissions {
  readonly READ: string;
  readonly CREATE: string;
  readonly UPDATE: string;
  readonly DELETE: string;
  readonly APPROVE: string;
  readonly REJECT: string;
  readonly EXPORT: string;
  readonly IMPORT: string;
}

export const BASE_PERMISSIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

export type BasePermissionType = typeof BASE_PERMISSIONS[keyof typeof BASE_PERMISSIONS];

export const createModulePermissions = (moduleName: string): BasePermissions => {
  return {
    READ: `${moduleName}:read`,
    CREATE: `${moduleName}:create`,
    UPDATE: `${moduleName}:update`,
    DELETE: `${moduleName}:delete`,
    APPROVE: `${moduleName}:approve`,
    REJECT: `${moduleName}:reject`,
    EXPORT: `${moduleName}:export`,
    IMPORT: `${moduleName}:import`,
  } as const;
};
