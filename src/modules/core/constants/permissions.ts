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

export const createModulePermissions = (moduleName: string) => {
  return {
    READ: `${moduleName}:read`,
    CREATE: `${moduleName}:create`,
    UPDATE: `${moduleName}:update`,
    DELETE: `${moduleName}:delete`,
    APPROVE: `${moduleName}:approve`,
    REJECT: `${moduleName}:reject`,
    EXPORT: `${moduleName}:export`,
    IMPORT: `${moduleName}:import`,
    MANAGE: `${moduleName}:manage`,
  } as const;
};
