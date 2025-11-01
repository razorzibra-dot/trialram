/**
 * User Management Hooks Export
 * Central location for all user management hooks
 */

export {
  useUsers,
  useUser,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
  useUserActivity,
  useUserRoles,
  useUserStatuses,
  useTenants,
} from './useUsers';

export {
  usePermissions,
  useRequirePermission,
  useUserManagementPermissions,
} from './usePermissions';

// Activity tracking and audit logging hooks (Phase 5)
export {
  useUserActivity as useActivityLog,
  useUserActivityLog,
  useLogActivity,
  useActivityStats,
  useBulkLogActivity,
  useTrackActivity,
  useActivityByDateRange,
  useActivityByAction,
  useFailedLoginAttempts,
  useRecentUserActions,
  ACTIVITY_QUERY_KEYS,
  type UserActivity,
  type ActivityFilters,
  type ActivityStats,
} from './useActivity';

/**
 * Note: useRoles was removed due to duplication with useUserRoles
 * Use useUserRoles() instead - it provides the same functionality
 */