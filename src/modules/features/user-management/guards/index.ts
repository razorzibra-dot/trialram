/**
 * Permission Guards & Decorators Export
 * Central location for all permission checking utilities
 */

export {
  UserPermission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionGuard,
  assertPermission,
  getRolePermissions,
  canPerformUserAction,
  type PermissionGuardResult,
} from './permissionGuards';