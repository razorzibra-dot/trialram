/**
 * Compliance Notifications Hooks (Layer 7)
 * 
 * React Query hooks for compliance notification management with comprehensive state handling.
 * Provides caching, invalidation, and data synchronization for alert operations.
 * 
 * Layer 7 in 8-layer architecture - React Query Hooks
 * 
 * @module modules/features/super-admin/hooks/useComplianceNotifications
 * @example
 * ```typescript
 * import { useAlertRules, useCheckAlerts, useCriticalAlerts } from '@/modules/features/super-admin/hooks/useComplianceNotifications';
 * 
 * function AlertsPanel() {
 *   const { data: rules } = useAlertRules();
 *   const { mutate: checkAlerts } = useCheckAlerts();
 *   const { data: criticalAlerts } = useCriticalAlerts(new Date(), new Date());
 *   
 *   // Render alerts here
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { message } from 'antd';
import { complianceNotificationServiceModule } from '../services/complianceNotificationService';
import type {
  AlertRule,
  AlertCondition,
  AlertAction,
  ComplianceAlert,
  NotificationResult,
  AlertCheckResult,
} from '@/types';

// ============================================================================
// Cache Key Factory (Hierarchical for precise invalidation)
// ============================================================================

const alertQueryKeys = {
  all: () => ['complianceNotifications'],
  rules: () => [...alertQueryKeys.all(), 'rules'],
  rule: (ruleId: string) => [...alertQueryKeys.rules(), ruleId],
  rulesForTenant: (tenantId?: string) => [...alertQueryKeys.rules(), { tenantId }],
  generatedAlerts: () => [...alertQueryKeys.all(), 'generated'],
  generatedAlertsWithLimit: (limit: number) => [...alertQueryKeys.generatedAlerts(), limit],
  alertHistory: () => [...alertQueryKeys.all(), 'history'],
  alertHistoryRange: (from: Date, to: Date, tenantId?: string) => [
    ...alertQueryKeys.alertHistory(),
    { from: from.toISOString(), to: to.toISOString(), tenantId },
  ],
  alertStats: () => [...alertQueryKeys.all(), 'stats'],
  alertStatsRange: (from: Date, to: Date, tenantId?: string) => [
    ...alertQueryKeys.alertStats(),
    { from: from.toISOString(), to: to.toISOString(), tenantId },
  ],
  criticalAlerts: () => [...alertQueryKeys.all(), 'critical'],
  criticalAlertsRange: (from: Date, to: Date, tenantId?: string) => [
    ...alertQueryKeys.criticalAlerts(),
    { from: from.toISOString(), to: to.toISOString(), tenantId },
  ],
  highSeverityAlerts: () => [...alertQueryKeys.all(), 'highSeverity'],
  highSeverityAlertsRange: (from: Date, to: Date, tenantId?: string) => [
    ...alertQueryKeys.highSeverityAlerts(),
    { from: from.toISOString(), to: to.toISOString(), tenantId },
  ],
};

// ============================================================================
// Base Hooks (Direct factory service calls)
// ============================================================================

/**
 * Hook: Get all alert rules
 */
export function useAlertRules(
  tenantId?: string,
  options?: UseQueryOptions<AlertRule[], Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.rulesForTenant(tenantId),
    queryFn: () => complianceNotificationServiceModule.getAlertRules(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook: Get alert rule by ID
 */
export function useAlertRule(
  ruleId: string,
  options?: UseQueryOptions<AlertRule | null, Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.rule(ruleId),
    queryFn: () => complianceNotificationServiceModule.getAlertRule(ruleId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook: Get generated alerts
 */
export function useGeneratedAlerts(
  limit: number = 100,
  tenantId?: string,
  options?: UseQueryOptions<ComplianceAlert[], Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.generatedAlertsWithLimit(limit),
    queryFn: () => complianceNotificationServiceModule.getGeneratedAlerts(limit, tenantId),
    staleTime: 2 * 60 * 1000, // 2 minutes (more volatile)
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook: Get alert history
 */
export function useAlertHistory(
  from: Date,
  to: Date,
  limit: number = 1000,
  tenantId?: string,
  options?: UseQueryOptions<ComplianceAlert[], Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.alertHistoryRange(from, to, tenantId),
    queryFn: () => complianceNotificationServiceModule.getAlertHistory(from, to, limit, tenantId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

/**
 * Hook: Get alert statistics
 */
export function useAlertStats(
  from: Date,
  to: Date,
  tenantId?: string,
  options?: UseQueryOptions<Record<string, any>, Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.alertStatsRange(from, to, tenantId),
    queryFn: () => complianceNotificationServiceModule.getAlertStats(from, to, tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook: Get critical alerts only
 */
export function useCriticalAlerts(
  from: Date,
  to: Date,
  tenantId?: string,
  options?: UseQueryOptions<ComplianceAlert[], Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.criticalAlertsRange(from, to, tenantId),
    queryFn: () => complianceNotificationServiceModule.getCriticalAlerts(from, to, tenantId),
    staleTime: 2 * 60 * 1000, // 2 minutes (critical = more volatile)
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook: Get high and critical severity alerts
 */
export function useHighSeverityAlerts(
  from: Date,
  to: Date,
  tenantId?: string,
  options?: UseQueryOptions<ComplianceAlert[], Error>
) {
  return useQuery({
    queryKey: alertQueryKeys.highSeverityAlertsRange(from, to, tenantId),
    queryFn: () => complianceNotificationServiceModule.getHighSeverityAlerts(from, to, tenantId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Mutation Hooks (Create, Update, Delete operations)
// ============================================================================

/**
 * Mutation: Create alert rule
 */
export function useCreateAlertRule(
  options?: UseMutationOptions<
    AlertRule,
    Error,
    { rule: Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>; tenantId?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rule, tenantId }) => {
      return complianceNotificationServiceModule.createAlertRule(rule, tenantId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rulesForTenant(variables.tenantId) });
      message.success('Alert rule created successfully');
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error creating alert rule:', error);
      message.error('Failed to create alert rule');
    },
    ...options,
  });
}

/**
 * Mutation: Update alert rule
 */
export function useUpdateAlertRule(
  options?: UseMutationOptions<
    AlertRule | null,
    Error,
    { ruleId: string; updates: Partial<Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, updates }) => {
      return complianceNotificationServiceModule.updateAlertRule(ruleId, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rule(variables.ruleId) });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rules() });
      message.success('Alert rule updated successfully');
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error updating alert rule:', error);
      message.error('Failed to update alert rule');
    },
    ...options,
  });
}

/**
 * Mutation: Delete alert rule
 */
export function useDeleteAlertRule(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => complianceNotificationServiceModule.deleteAlertRule(ruleId),
    onSuccess: (data, ruleId) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rule(ruleId) });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rules() });
      message.success('Alert rule deleted successfully');
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error deleting alert rule:', error);
      message.error('Failed to delete alert rule');
    },
    ...options,
  });
}

/**
 * Mutation: Toggle alert rule
 */
export function useToggleAlertRule(
  options?: UseMutationOptions<AlertRule | null, Error, { ruleId: string; enabled: boolean }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, enabled }) => {
      return complianceNotificationServiceModule.toggleAlertRule(ruleId, enabled);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rule(variables.ruleId) });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rules() });
      message.success(`Alert rule ${variables.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error toggling alert rule:', error);
      message.error('Failed to toggle alert rule');
    },
    ...options,
  });
}

/**
 * Mutation: Check and notify alerts
 */
export function useCheckAlerts(
  options?: UseMutationOptions<
    AlertCheckResult,
    Error,
    { from: Date; to: Date; tenantId?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ from, to, tenantId }) => {
      return complianceNotificationServiceModule.checkAndNotifyAlerts(from, to, tenantId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.generatedAlerts() });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.alertHistoryRange(variables.from, variables.to, variables.tenantId) });
      if (data.alertsGenerated > 0) {
        message.warning(`${data.alertsGenerated} alerts generated and notifications sent`);
      } else {
        message.info('No alerts generated');
      }
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error checking alerts:', error);
      message.error('Failed to check alerts');
    },
    ...options,
  });
}

/**
 * Mutation: Acknowledge alert
 */
export function useAcknowledgeAlert(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => complianceNotificationServiceModule.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.generatedAlerts() });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.alertHistory() });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.criticalAlerts() });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.highSeverityAlerts() });
      message.success('Alert acknowledged');
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error acknowledging alert:', error);
      message.error('Failed to acknowledge alert');
    },
    ...options,
  });
}

/**
 * Mutation: Send test notification
 */
export function useSendTestNotification(
  options?: UseMutationOptions<NotificationResult, Error, string[]>
) {
  return useMutation({
    mutationFn: (recipients: string[]) => complianceNotificationServiceModule.sendTestNotification(recipients),
    onSuccess: (data) => {
      if (data.sent) {
        message.success('Test notification sent successfully');
      } else {
        message.warning('Test notification failed to send');
      }
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error sending test notification:', error);
      message.error('Failed to send test notification');
    },
    ...options,
  });
}

/**
 * Mutation: Bulk acknowledge alerts
 */
export function useBulkAcknowledgeAlerts(
  options?: UseMutationOptions<{ succeeded: number; failed: number }, Error, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertIds: string[]) => complianceNotificationServiceModule.bulkAcknowledgeAlerts(alertIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.generatedAlerts() });
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.alertHistory() });
      message.success(`Bulk acknowledged: ${data.succeeded} succeeded, ${data.failed} failed`);
    },
    onError: (error) => {
      console.error('[ComplianceNotification] Error in bulk acknowledge:', error);
      message.error('Failed to bulk acknowledge alerts');
    },
    ...options,
  });
}

// ============================================================================
// Composite Hooks (Multiple queries combined)
// ============================================================================

/**
 * Hook: Get alert rules summary
 */
export function useAlertRulesSummary(
  tenantId?: string,
  options?: UseQueryOptions<Record<string, any>, Error>
) {
  return useQuery({
    queryKey: [...alertQueryKeys.rulesForTenant(tenantId), 'summary'],
    queryFn: () => complianceNotificationServiceModule.getAlertRulesSummary(tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook: Get enabled alert rules only
 */
export function useEnabledAlertRules(
  tenantId?: string,
  options?: UseQueryOptions<AlertRule[], Error>
) {
  return useQuery({
    queryKey: [...alertQueryKeys.rulesForTenant(tenantId), 'enabled'],
    queryFn: () => complianceNotificationServiceModule.getEnabledAlertRules(tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Cache Management Hook
// ============================================================================

/**
 * Hook: Manual cache invalidation for alerts
 */
export function useComplianceNotificationCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAllAlerts: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.all() });
    },
    invalidateRules: () => {
      queryClient.invalidateQueries({ queryKey: alertQueryKeys.rules() });
    },
    invalidateAlerts: (from?: Date, to?: Date) => {
      if (from && to) {
        queryClient.invalidateQueries({ queryKey: alertQueryKeys.alertHistoryRange(from, to) });
      } else {
        queryClient.invalidateQueries({ queryKey: alertQueryKeys.alertHistory() });
      }
    },
    invalidateCriticalAlerts: (from?: Date, to?: Date) => {
      if (from && to) {
        queryClient.invalidateQueries({ queryKey: alertQueryKeys.criticalAlertsRange(from, to) });
      } else {
        queryClient.invalidateQueries({ queryKey: alertQueryKeys.criticalAlerts() });
      }
    },
    prefetchAlertRules: (tenantId?: string) => {
      return queryClient.prefetchQuery({
        queryKey: alertQueryKeys.rulesForTenant(tenantId),
        queryFn: () => complianceNotificationServiceModule.getAlertRules(tenantId),
      });
    },
    prefetchCriticalAlerts: (from: Date, to: Date, tenantId?: string) => {
      return queryClient.prefetchQuery({
        queryKey: alertQueryKeys.criticalAlertsRange(from, to, tenantId),
        queryFn: () => complianceNotificationServiceModule.getCriticalAlerts(from, to, tenantId),
      });
    },
  };
}