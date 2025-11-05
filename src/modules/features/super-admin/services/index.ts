/**
 * Super Admin Services Index
 * Exports all services
 * 
 * **Architecture**: Layer 6 (Module Services) in 8-layer pattern
 * All services delegate to factory-routed implementations (Layer 5)
 */

// Role Request Service
export { roleRequestService } from './roleRequestService';

// Health Service
export { healthService } from './healthService';

// Super User Service - ARCHIVED (cleanup complete)
// The old superUserService was archived in super-admin cleanup
// Functionality replaced with superAdminManagementService

// Audit Service (Layer 6 - Module Service)
export { default as auditServiceModule } from './auditService';
export type { AuditFilterOptions, AuditSearchQuery } from './auditService';

// Compliance Report Service (Layer 6 - Module Service)
export { default as complianceReportServiceModule } from './complianceReportService';
export type { ReportFilterOptions } from './complianceReportService';

// Audit Retention Service (Layer 6 - Module Service)
/**
 * Audit Retention Service Module
 * 
 * Manages audit log retention policies and cleanup operations.
 * Provides convenience methods for common retention workflows.
 * 
 * Layer 6 in 8-layer architecture - uses factory-routed services (Layer 5)
 * Never imports directly from mock or Supabase services
 * 
 * @example
 * ```typescript
 * import { auditRetentionServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Get all policies
 * const policies = await auditRetentionServiceModule.getRetentionPolicies();
 * 
 * // Execute cleanup
 * const result = await auditRetentionServiceModule.executeRetentionCleanup();
 * 
 * // Get stats
 * const stats = await auditRetentionServiceModule.getRetentionStats();
 * ```
 */
export { auditRetentionServiceModule } from './auditRetentionService';

// Audit Dashboard Service (Layer 6 - Module Service)
/**
 * Audit Dashboard Service Module
 * 
 * Provides aggregated metrics and statistics for audit dashboards.
 * Retrieves dashboard data including metrics, timelines, and user actions.
 * 
 * Layer 6 in 8-layer architecture - uses factory-routed services (Layer 5)
 * Never imports directly from mock or Supabase services
 * 
 * @example
 * ```typescript
 * import { auditDashboardServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Get dashboard metrics
 * const metrics = await auditDashboardServiceModule.getDashboardMetrics(from, to);
 * 
 * // Get complete dashboard data
 * const data = await auditDashboardServiceModule.getDashboardData(from, to);
 * 
 * // Get last 7 days data
 * const weekData = await auditDashboardServiceModule.getDashboardDataLastDays(7);
 * ```
 */
export { auditDashboardServiceModule } from './auditDashboardService';

// Compliance Notification Service (Layer 6 - Module Service)
/**
 * Compliance Notification Service Module
 * 
 * Manages compliance alerts and notifications for suspicious activity.
 * Provides alert rules management and notification delivery.
 * 
 * Layer 6 in 8-layer architecture - uses factory-routed services (Layer 5)
 * Never imports directly from mock or Supabase services
 * 
 * @example
 * ```typescript
 * import { complianceNotificationServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Get alert rules
 * const rules = await complianceNotificationServiceModule.getAlertRules();
 * 
 * // Check and send alerts
 * const result = await complianceNotificationServiceModule.checkAndNotifyAlerts(from, to);
 * 
 * // Get critical alerts
 * const critical = await complianceNotificationServiceModule.getCriticalAlerts(from, to);
 * ```
 */
export { complianceNotificationServiceModule } from './complianceNotificationService';

// Impersonation Rate Limit Service (Layer 6 - Module Service) - Task 6.1
/**
 * Impersonation Rate Limit Service Module
 * 
 * Manages rate limiting for super admin impersonation sessions to prevent abuse.
 * Enforces three key limits:
 * - Max 10 impersonations per hour per super admin
 * - Max 5 concurrent sessions per super admin
 * - Max 30 minutes per session
 * 
 * Layer 6 in 8-layer architecture - uses factory-routed services (Layer 5)
 * Never imports directly from mock or Supabase services
 * 
 * @example
 * ```typescript
 * import { impersonationRateLimitServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Check if can start impersonation
 * const result = await impersonationRateLimitServiceModule.canStartImpersonation('super-admin-1');
 * if (!result.allowed) {
 *   console.error(`Cannot start: ${result.reason}`);
 * }
 * 
 * // Start session
 * const sessionId = await impersonationRateLimitServiceModule.startSession(
 *   'super-admin-1',
 *   'user-123',
 *   'tenant-456',
 *   'Investigating issue'
 * );
 * 
 * // End session
 * await impersonationRateLimitServiceModule.endSession(sessionId);
 * 
 * // Get status
 * const status = await impersonationRateLimitServiceModule.getAdminStatus('super-admin-1');
 * console.log(`Usage: ${status.impersonationsThisHour}/10`);
 * ```
 */
export { default as impersonationRateLimitServiceModule } from './impersonationRateLimitService';

// Types
export type { ISuperAdminManagementService, ISuperAdminManagementServiceFactory } from './superAdminManagementService';