/**
 * Super Admin Hooks Index
 * Exports all custom hooks for super user module operations
 * 
 * Phase 7 Implementation: React Query Hooks
 * - Tenant Access Management
 * - Impersonation Sessions
 * - Metrics & Statistics
 * - Configuration Overrides
 */

// Super User Management Hooks
export {
  useSuperUserManagement,
  useSuperUserTenantAccess,
  useTenantAccessByUserId,
  useSuperUserTenantAccessById,
  useGrantTenantAccess,
  useUpdateAccessLevel,
  useRevokeTenantAccess,
  type SuperUserTenantAccessType,
  type SuperUserTenantAccessCreateInput,
  type SuperUserTenantAccessUpdateInput,
} from './useSuperUserManagement';

// Super Admin Management Hooks
export {
  useAllSuperAdmins,
  useSuperAdmin,
  useSuperAdminStats,
  useSuperAdminList,
  useDemoteSuperAdmin,
  type SuperAdminDTO,
} from './useSuperAdminManagement';

// Impersonation Management Hooks
export {
  useImpersonation,
  useImpersonationLogs,
  useImpersonationLogsByUserId,
  useImpersonationLogById,
  useActiveImpersonations,
  useStartImpersonation,
  useEndImpersonation,
  type ImpersonationLogType,
  type ImpersonationStartInput,
  type ImpersonationEndInput,
} from './useImpersonation';

// Metrics & Configuration Hooks
export {
  useTenantMetricsAndConfig,
  useTenantStatistics,
  useTenantStatisticsByTenantId,
  useRecordTenantMetric,
  useTenantConfigOverrides,
  useTenantConfigOverridesByTenantId,
  useTenantConfigOverrideById,
  useCreateTenantConfigOverride,
  useUpdateTenantConfigOverride,
  useDeleteTenantConfigOverride,
  type TenantStatisticType,
  type TenantConfigOverrideType,
  type TenantStatisticCreateInput,
  type TenantConfigOverrideCreateInput,
  type TenantConfigOverrideUpdateInput,
} from './useTenantMetricsAndConfig';

// Audit Log Hooks - Phase 5.1
export {
  useAuditLogs,
  useAuditLogDetail,
  useSearchAuditLogs,
  useAuditLogsByDateRange,
  useAuditLogsByUser,
  useAuditLogsByResource,
  useAuditLogsByAction,
  useAuditStats,
  useRecentAuditLogs,
  useAuditLogsWithFilters,
  useExportAuditLogs,
  useLogAction,
  useAuditDashboard,
  useAuditLogsFiltered,
  useInvalidateAuditLogs,
  auditQueryKeys,
  type AuditLog,
} from './useAuditLogs';

// Compliance Report Hooks - Phase 5.3
export {
  useGenerateReport,
  useExportReport,
  useDownloadReport,
  useReportWorkflow,
  useMultipleReports,
  useReportGenerator,
  useReportStats,
  type ComplianceReport,
  type ComplianceReportType,
  type ReportExportFormat,
  type ReportGenerationOptions,
} from './useComplianceReports';

// Audit Retention Hooks - Phase 5.5
/**
 * Audit Retention Management Hooks
 * 
 * Provides React Query hooks for managing audit log retention policies,
 * cleanup operations, and retention statistics.
 * 
 * Key hooks:
 * - useRetentionPolicies: Fetch all retention policies
 * - useCreateRetentionPolicy: Create new policy
 * - useUpdateRetentionPolicy: Update existing policy
 * - useDeleteRetentionPolicy: Delete policy
 * - useExecuteRetentionCleanup: Run cleanup
 * - useRetentionStats: Get retention statistics
 * - useRetentionDashboard: Combined dashboard query
 * - useRetentionPolicyManagement: Combined policy management
 * - useCleanupManagement: Combined cleanup management
 * 
 * @example
 * ```typescript
 * const { data: policies } = useRetentionPolicies();
 * const { mutate: executeCleanup } = useExecuteRetentionCleanup();
 * ```
 */
export {
  useRetentionPolicies,
  useRetentionPolicy,
  useCreateRetentionPolicy,
  useUpdateRetentionPolicy,
  useDeleteRetentionPolicy,
  useRetentionStats,
  useExecuteRetentionCleanup,
  useAuditArchives,
  useCleanupHistory,
  useScheduleRetentionCleanup,
  useCleanupStatus,
  useValidateRetentionPolicy,
  useRetentionMetadata,
  useRetentionDashboard,
  useRetentionPolicyManagement,
  useCleanupManagement,
  auditRetentionKeys,
  type AuditLogArchive,
  type RetentionCleanupResult,
  type RetentionStats,
} from './useAuditRetention';

// Compliance Notification Hooks - Phase 5.7
/**
 * Compliance Notification Management Hooks
 * 
 * Provides React Query hooks for managing compliance alerts, notification rules,
 * and suspicious activity detection.
 * 
 * Key hooks:
 * - useAlertRules: Fetch all alert rules
 * - useAlertRule: Fetch specific rule by ID
 * - useCreateAlertRule: Create new alert rule
 * - useUpdateAlertRule: Update existing rule
 * - useDeleteAlertRule: Delete rule
 * - useCheckAlerts: Detect and notify for alerts
 * - useCriticalAlerts: Get critical severity alerts
 * - useHighSeverityAlerts: Get high and critical alerts
 * - useAlertStats: Get alert statistics
 * - useComplianceNotificationCache: Manual cache invalidation
 * 
 * @example
 * ```typescript
 * const { data: rules } = useAlertRules();
 * const { mutate: checkAlerts } = useCheckAlerts();
 * const { data: critical } = useCriticalAlerts(from, to);
 * ```
 */
export {
  useAlertRules,
  useAlertRule,
  useGeneratedAlerts,
  useAlertHistory,
  useAlertStats,
  useCriticalAlerts,
  useHighSeverityAlerts,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
  useCheckAlerts,
  useAcknowledgeAlert,
  useSendTestNotification,
  useBulkAcknowledgeAlerts,
  useAlertRulesSummary,
  useEnabledAlertRules,
  useComplianceNotificationCache,
} from './useComplianceNotifications';

// Rate Limit Hooks - Phase 6.1
/**
 * Rate Limiting Management Hooks
 * 
 * Provides React Query hooks for managing impersonation rate limits,
 * session tracking, and violation monitoring.
 * 
 * Key hooks:
 * - useCheckRateLimit: Check if impersonation is allowed
 * - useRateLimitStats: Get rate limit statistics with auto-polling
 * - useActiveSessions: Get active impersonation sessions with polling
 * - useGetViolations: Get rate limit violations
 * - useCheckSessionDuration: Check if session exceeded 30-min limit
 * - useRecordImpersonationStart: Start impersonation session (mutation)
 * - useRecordImpersonationEnd: End impersonation session (mutation)
 * - useForceTerminateSession: Force terminate session (mutation)
 * - useClearViolations: Clear violations for admin (mutation)
 * - useCleanupExpiredSessions: Cleanup expired sessions (mutation)
 * - useResetRateLimits: Reset all limits for admin (mutation)
 * - useImpersonationSession: Combined workflow hook
 * - useRateLimitMonitoring: Combined monitoring hook
 * 
 * @example
 * ```typescript
 * const { data: stats } = useRateLimitStats(superAdminId, tenantId);
 * const { mutate: startSession } = useRecordImpersonationStart();
 * const { data: sessions } = useActiveSessions(superAdminId, tenantId);
 * ```
 */
export {
  useCheckRateLimit,
  useRateLimitStats,
  useActiveSessions,
  useGetViolations,
  useCheckSessionDuration,
  useRecordImpersonationStart,
  useRecordImpersonationEnd,
  useForceTerminateSession,
  useClearViolations,
  useCleanupExpiredSessions,
  useResetRateLimits,
  useImpersonationSession,
  useRateLimitMonitoring,
  rateLimitQueryKeys,
} from './useRateLimit';

// Impersonation Rate Limit Hooks - Phase 6.1
/**
 * Impersonation Rate Limit Management Hooks (Task 6.1)
 * 
 * Provides React Query hooks for managing impersonation rate limits,
 * capacity tracking, and validation.
 * 
 * Key hooks:
 * - useCanStartImpersonation: Check if super admin can start impersonation
 * - useRateLimitStatus: Get current rate limit status with reset timer
 * - useActiveImpersonationSessions: Get all active sessions
 * - useRateLimitConfig: Get rate limit configuration
 * - useStartImpersonationSession: Start session with rate limit check (mutation)
 * - useEndImpersonationSession: End session and update limits (mutation)
 * - useRateLimitUsage: Get detailed usage statistics
 * - useRemainingCapacity: Get remaining capacity before limit
 * - useValidateOperation: Get UI-ready validation for operations
 * - useIsRateLimited: Simple boolean check for rate limiting
 * - useImpersonationRateLimitStatus: Combined dashboard hook
 * - useRefreshRateLimits: Manual cache invalidation
 * 
 * @example
 * ```typescript
 * const { data: canStart } = useCanStartImpersonation();
 * const mutation = useStartImpersonationSession();
 * const { data: status } = useRateLimitStatus();
 * ```
 */
export {
  useCanStartImpersonation,
  useRateLimitStatus,
  useActiveImpersonationSessions,
  useRateLimitConfig,
  useStartImpersonationSession,
  useEndImpersonationSession,
  useRateLimitUsage,
  useRemainingCapacity,
  useValidateOperation,
  useIsRateLimited,
  useImpersonationRateLimitStatus,
  useRefreshRateLimits,
} from './useImpersonationRateLimit';

// Tenant Directory Hooks
export {
  useTenantDirectory,
  TENANT_DIRECTORY_QUERY_KEYS,
} from './useTenantDirectory';

// Legacy hooks (keep for backward compatibility)
export { useRoleRequests } from './useRoleRequests';
export { useSystemHealth } from './useSystemHealth';
export { useTenantAccess } from './useTenantAccess';
export { useTenantMetrics } from './useTenantMetrics';
export { useTenantConfig } from './useTenantConfig';