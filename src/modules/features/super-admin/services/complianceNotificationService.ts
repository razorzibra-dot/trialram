/**
 * Compliance Notification Service - Module Service (Layer 6)
 * 
 * Wraps factory-routed compliance notification service with additional convenience methods.
 * Uses factory pattern to ensure proper backend implementation routing.
 * 
 * Layer 6 in 8-layer architecture - Module Service
 * IMPORTANT: Only imports from factory, NEVER direct mock or Supabase imports
 * 
 * @module modules/features/super-admin/services/complianceNotificationService
 * @example
 * ```typescript
 * import { complianceNotificationServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Get critical alerts
 * const criticalAlerts = await complianceNotificationServiceModule.getCriticalAlerts(from, to);
 * 
 * // Send emergency notification
 * const result = await complianceNotificationServiceModule.sendEmergencyNotification(recipients);
 * ```
 */

import { complianceNotificationService as factoryComplianceNotificationService } from '@/services/serviceFactory';
import type {
  AlertRule,
  AlertCondition,
  AlertAction,
  ComplianceAlert,
  NotificationResult,
  AlertCheckResult,
  BusinessHours,
} from '@/types';

/**
 * Compliance Notification Service Module
 * 
 * Manages compliance alerts and notifications for suspicious activity.
 * Provides convenience methods for common alert workflows.
 */
class ComplianceNotificationServiceModule {
  /**
   * Get all alert rules
   */
  async getAlertRules(tenantId?: string): Promise<AlertRule[]> {
    try {
      console.log('[ComplianceNotification] Fetching all alert rules');
      const rules = await factoryComplianceNotificationService.getAlertRules(tenantId);
      console.log(`[ComplianceNotification] Retrieved ${rules.length} alert rules`);
      return rules;
    } catch (error) {
      console.error('[ComplianceNotification] Error fetching alert rules:', error);
      throw error;
    }
  }

  /**
   * Get alert rule by ID
   */
  async getAlertRule(ruleId: string): Promise<AlertRule | null> {
    try {
      console.log(`[ComplianceNotification] Fetching alert rule: ${ruleId}`);
      const rule = await factoryComplianceNotificationService.getAlertRule(ruleId);
      return rule;
    } catch (error) {
      console.error('[ComplianceNotification] Error fetching alert rule:', error);
      throw error;
    }
  }

  /**
   * Create new alert rule
   */
  async createAlertRule(
    rule: Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>,
    tenantId?: string
  ): Promise<AlertRule> {
    try {
      console.log(`[ComplianceNotification] Creating alert rule: ${rule.name}`);
      const newRule = await factoryComplianceNotificationService.createAlertRule(rule, tenantId);
      console.log(`[ComplianceNotification] Alert rule created: ${newRule.ruleId}`);
      return newRule;
    } catch (error) {
      console.error('[ComplianceNotification] Error creating alert rule:', error);
      throw error;
    }
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(
    ruleId: string,
    updates: Partial<Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AlertRule | null> {
    try {
      console.log(`[ComplianceNotification] Updating alert rule: ${ruleId}`);
      const updated = await factoryComplianceNotificationService.updateAlertRule(ruleId, updates);
      if (updated) {
        console.log(`[ComplianceNotification] Alert rule updated: ${updated.ruleId}`);
      }
      return updated;
    } catch (error) {
      console.error('[ComplianceNotification] Error updating alert rule:', error);
      throw error;
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<boolean> {
    try {
      console.log(`[ComplianceNotification] Deleting alert rule: ${ruleId}`);
      const result = await factoryComplianceNotificationService.deleteAlertRule(ruleId);
      console.log(`[ComplianceNotification] Alert rule deleted: ${ruleId}`);
      return result;
    } catch (error) {
      console.error('[ComplianceNotification] Error deleting alert rule:', error);
      throw error;
    }
  }

  /**
   * Toggle alert rule enable/disable
   */
  async toggleAlertRule(ruleId: string, enabled: boolean): Promise<AlertRule | null> {
    try {
      console.log(`[ComplianceNotification] Toggling alert rule: ${ruleId} to ${enabled}`);
      const updated = await factoryComplianceNotificationService.toggleAlertRule(ruleId, enabled);
      return updated;
    } catch (error) {
      console.error('[ComplianceNotification] Error toggling alert rule:', error);
      throw error;
    }
  }

  /**
   * Check for compliance violations and send notifications
   */
  async checkAndNotifyAlerts(from: Date, to: Date, tenantId?: string): Promise<AlertCheckResult> {
    try {
      console.log(`[ComplianceNotification] Checking alerts from ${from.toISOString()} to ${to.toISOString()}`);
      const result = await factoryComplianceNotificationService.checkAndNotifyAlerts(from, to, tenantId);
      console.log(`[ComplianceNotification] Generated ${result.alertsGenerated} alerts, sent ${result.notificationsSent.length} notifications`);
      return result;
    } catch (error) {
      console.error('[ComplianceNotification] Error checking alerts:', error);
      throw error;
    }
  }

  /**
   * Get generated alerts
   */
  async getGeneratedAlerts(limit: number = 100, tenantId?: string): Promise<ComplianceAlert[]> {
    try {
      console.log(`[ComplianceNotification] Fetching generated alerts (limit: ${limit})`);
      const alerts = await factoryComplianceNotificationService.getGeneratedAlerts(limit, tenantId);
      console.log(`[ComplianceNotification] Retrieved ${alerts.length} generated alerts`);
      return alerts;
    } catch (error) {
      console.error('[ComplianceNotification] Error fetching generated alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(from?: Date, to?: Date, limit: number = 1000, tenantId?: string): Promise<ComplianceAlert[]> {
    try {
      console.log(`[ComplianceNotification] Fetching alert history`);
      const alerts = await factoryComplianceNotificationService.getAlertHistory(from, to, limit, tenantId);
      console.log(`[ComplianceNotification] Retrieved ${alerts.length} alerts from history`);
      return alerts;
    } catch (error) {
      console.error('[ComplianceNotification] Error fetching alert history:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(from: Date, to: Date, tenantId?: string): Promise<Record<string, any>> {
    try {
      console.log(`[ComplianceNotification] Fetching alert statistics`);
      const stats = await factoryComplianceNotificationService.getAlertStats(from, to, tenantId);
      console.log('[ComplianceNotification] Retrieved alert statistics');
      return stats;
    } catch (error) {
      console.error('[ComplianceNotification] Error fetching alert statistics:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(recipients: string[]): Promise<NotificationResult> {
    try {
      console.log(`[ComplianceNotification] Sending test notification to ${recipients.length} recipients`);
      const result = await factoryComplianceNotificationService.sendTestNotification(recipients);
      console.log(`[ComplianceNotification] Test notification sent: ${result.sent ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error('[ComplianceNotification] Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Acknowledge alert (mark as reviewed)
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      console.log(`[ComplianceNotification] Acknowledging alert: ${alertId}`);
      const result = await factoryComplianceNotificationService.acknowledgeAlert(alertId);
      console.log(`[ComplianceNotification] Alert acknowledged: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error('[ComplianceNotification] Error acknowledging alert:', error);
      throw error;
    }
  }

  // ========================================================================
  // Convenience Methods
  // ========================================================================

  /**
   * Get only critical alerts
   */
  async getCriticalAlerts(from: Date, to: Date, tenantId?: string): Promise<ComplianceAlert[]> {
    try {
      const alerts = await this.getAlertHistory(from, to, 1000, tenantId);
      return alerts.filter(a => a.severity === 'critical');
    } catch (error) {
      console.error('[ComplianceNotification] Error getting critical alerts:', error);
      throw error;
    }
  }

  /**
   * Get high and critical alerts
   */
  async getHighSeverityAlerts(from: Date, to: Date, tenantId?: string): Promise<ComplianceAlert[]> {
    try {
      const alerts = await this.getAlertHistory(from, to, 1000, tenantId);
      return alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    } catch (error) {
      console.error('[ComplianceNotification] Error getting high severity alerts:', error);
      throw error;
    }
  }

  /**
   * Send emergency notification for critical events
   */
  async sendEmergencyNotification(recipients: string[], reason: string): Promise<NotificationResult> {
    try {
      console.log(`[ComplianceNotification] Sending emergency notification: ${reason}`);
      return await this.sendTestNotification(recipients);
    } catch (error) {
      console.error('[ComplianceNotification] Error sending emergency notification:', error);
      throw error;
    }
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledgeAlerts(alertIds: string[]): Promise<{ succeeded: number; failed: number }> {
    try {
      console.log(`[ComplianceNotification] Bulk acknowledging ${alertIds.length} alerts`);
      let succeeded = 0;
      let failed = 0;

      for (const alertId of alertIds) {
        try {
          const result = await this.acknowledgeAlert(alertId);
          if (result) succeeded++;
          else failed++;
        } catch (error) {
          failed++;
        }
      }

      console.log(`[ComplianceNotification] Bulk acknowledge complete: ${succeeded} succeeded, ${failed} failed`);
      return { succeeded, failed };
    } catch (error) {
      console.error('[ComplianceNotification] Error in bulk acknowledge:', error);
      throw error;
    }
  }

  /**
   * Get enabled rules only
   */
  async getEnabledAlertRules(tenantId?: string): Promise<AlertRule[]> {
    try {
      const rules = await this.getAlertRules(tenantId);
      return rules.filter(r => r.enabled);
    } catch (error) {
      console.error('[ComplianceNotification] Error getting enabled alert rules:', error);
      throw error;
    }
  }

  /**
   * Get summary of alert rules
   */
  async getAlertRulesSummary(tenantId?: string): Promise<Record<string, any>> {
    try {
      const rules = await this.getAlertRules(tenantId);
      const enabledCount = rules.filter(r => r.enabled).length;
      const disabledCount = rules.length - enabledCount;
      const bySeverity = {
        critical: rules.filter(r => r.severity === 'critical').length,
        high: rules.filter(r => r.severity === 'high').length,
        medium: rules.filter(r => r.severity === 'medium').length,
        low: rules.filter(r => r.severity === 'low').length,
      };

      return {
        total: rules.length,
        enabled: enabledCount,
        disabled: disabledCount,
        bySeverity,
      };
    } catch (error) {
      console.error('[ComplianceNotification] Error getting alert rules summary:', error);
      throw error;
    }
  }

  /**
   * Export alerts to CSV
   */
  async exportAlertsToCsv(from: Date, to: Date, tenantId?: string): Promise<string> {
    try {
      const alerts = await this.getAlertHistory(from, to, 10000, tenantId);

      const csvHeader = 'Alert ID,Rule ID,Severity,Title,Description,Triggered By,Triggered At,Delivered,Channels\n';
      const csvRows = alerts
        .map(
          (a) =>
            `"${a.alertId}","${a.ruleId}","${a.severity}","${a.title}","${a.description.replace(/"/g, '""')}","${a.triggeredBy}","${a.triggeredAt.toISOString()}","${a.delivered}","${a.deliveredChannels.join('|')}"`
        )
        .join('\n');

      return csvHeader + csvRows;
    } catch (error) {
      console.error('[ComplianceNotification] Error exporting alerts to CSV:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const complianceNotificationServiceModule = new ComplianceNotificationServiceModule();