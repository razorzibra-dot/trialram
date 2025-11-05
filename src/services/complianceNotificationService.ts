/**
 * Compliance Notification Service - Mock Implementation (Layer 3)
 * 
 * Provides alert system for suspicious activity detection and notification delivery.
 * Monitors audit events for compliance violations and triggers appropriate notifications.
 * 
 * Layer 3 in 8-layer architecture - Mock implementation with realistic data
 * 
 * @module services/complianceNotificationService
 * @example
 * ```typescript
 * import { mockComplianceNotificationService } from '@/services/complianceNotificationService';
 * 
 * // Check and send alerts
 * const alerts = await mockComplianceNotificationService.checkAndNotifyAlerts(from, to);
 * 
 * // Get alert rules
 * const rules = await mockComplianceNotificationService.getAlertRules();
 * ```
 */

// ============================================================================
// Imports
// ============================================================================

import {
  AlertRule,
  AlertCondition,
  BusinessHours,
  AlertAction,
  ComplianceAlert,
  NotificationResult,
  AlertCheckResult
} from '@/types';

// ============================================================================
// Mock Service Implementation
// ============================================================================

class MockComplianceNotificationService {
  private rules: AlertRule[] = [];
  private generatedAlerts: ComplianceAlert[] = [];
  private alertHistory: ComplianceAlert[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules() {
    this.rules = [
      {
        ruleId: 'rule_ua_001',
        name: 'Multiple Unauthorized Access Attempts',
        description: 'Alerts when more than 5 unauthorized access attempts occur within 1 hour',
        severity: 'high',
        enabled: true,
        condition: {
          type: 'unauthorized_attempts',
          threshold: 5,
          timeWindow: 60,
        },
        actions: [
          { type: 'email', recipients: ['security@company.com', 'admin@company.com'] },
          { type: 'in_app' },
        ],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        ruleId: 'rule_ls_001',
        name: 'Long Impersonation Session',
        description: 'Alerts when impersonation session exceeds 30 minutes',
        severity: 'medium',
        enabled: true,
        condition: {
          type: 'long_session',
          maxDuration: 30,
        },
        actions: [
          { type: 'email', recipients: ['admin@company.com'] },
          { type: 'in_app' },
        ],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        ruleId: 'rule_sa_001',
        name: 'Sensitive Data Access During Impersonation',
        description: 'Alerts when sensitive data is accessed during super admin impersonation',
        severity: 'critical',
        enabled: true,
        condition: {
          type: 'sensitive_access',
        },
        actions: [
          { type: 'email', recipients: ['ciso@company.com', 'security@company.com', 'admin@company.com'] },
          { type: 'in_app' },
        ],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        ruleId: 'rule_oh_001',
        name: 'Off-Hours Access',
        description: 'Alerts when super admin access occurs outside business hours',
        severity: 'medium',
        enabled: true,
        condition: {
          type: 'off_hours',
          businessHours: {
            startHour: 9,
            endHour: 18,
            timezone: 'America/New_York',
            workDays: [1, 2, 3, 4, 5], // Monday to Friday
          },
        },
        actions: [
          { type: 'email', recipients: ['security@company.com'] },
          { type: 'in_app' },
        ],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ];
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.rules);
      }, 300);
    });
  }

  /**
   * Get alert rule by ID
   */
  async getAlertRule(ruleId: string): Promise<AlertRule | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.rules.find(r => r.ruleId === ruleId) || null);
      }, 300);
    });
  }

  /**
   * Create new alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRule: AlertRule = {
          ...rule,
          ruleId: `rule_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.rules.push(newRule);
        resolve(newRule);
      }, 300);
    });
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rule = this.rules.find(r => r.ruleId === ruleId);
        if (!rule) {
          resolve(null);
          return;
        }
        Object.assign(rule, updates, { updatedAt: new Date() });
        resolve(rule);
      }, 300);
    });
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.rules.findIndex(r => r.ruleId === ruleId);
        if (index === -1) {
          resolve(false);
          return;
        }
        this.rules.splice(index, 1);
        resolve(true);
      }, 300);
    });
  }

  /**
   * Enable/disable alert rule
   */
  async toggleAlertRule(ruleId: string, enabled: boolean): Promise<AlertRule | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rule = this.rules.find(r => r.ruleId === ruleId);
        if (!rule) {
          resolve(null);
          return;
        }
        rule.enabled = enabled;
        rule.updatedAt = new Date();
        resolve(rule);
      }, 300);
    });
  }

  /**
   * Check for compliance violations and generate alerts
   */
  async checkAndNotifyAlerts(from: Date, to: Date): Promise<AlertCheckResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const generatedAlerts: ComplianceAlert[] = [];
        const notificationResults: NotificationResult[] = [];

        // Simulate alert generation based on rules
        const alertsToGenerate = this.simulateAlertDetection();

        for (const alertData of alertsToGenerate) {
          const rule = this.rules.find(r => r.ruleId === alertData.ruleId);
          if (!rule || !rule.enabled) continue;

          const alert: ComplianceAlert = {
            alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.ruleId,
            severity: rule.severity,
            title: rule.name,
            description: alertData.description,
            triggeredBy: alertData.triggeredBy,
            triggeredAt: alertData.triggeredAt,
            details: alertData.details,
            delivered: false,
            deliveredChannels: [],
            deliveryStatus: {},
          };

          generatedAlerts.push(alert);

          // Send notifications
          const notificationResult = this.sendNotifications(alert, rule);
          notificationResults.push(notificationResult);

          alert.delivered = notificationResult.sent;
          alert.deliveredChannels = notificationResult.channels;
          alert.deliveryStatus = this.buildDeliveryStatus(rule.actions, notificationResult.failedChannels);

          this.generatedAlerts.push(alert);
          this.alertHistory.push(alert);
        }

        resolve({
          alertsGenerated: generatedAlerts.length,
          alertsTriggered: generatedAlerts,
          notificationsSent: notificationResults,
          timestamp: new Date(),
        });
      }, 400);
    });
  }

  /**
   * Get generated alerts
   */
  async getGeneratedAlerts(limit: number = 100): Promise<ComplianceAlert[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.generatedAlerts.slice(-limit));
      }, 300);
    });
  }

  /**
   * Get alert history
   */
  async getAlertHistory(from?: Date, to?: Date, limit: number = 1000): Promise<ComplianceAlert[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = this.alertHistory;
        if (from) filtered = filtered.filter(a => a.triggeredAt >= from);
        if (to) filtered = filtered.filter(a => a.triggeredAt <= to);
        resolve(filtered.slice(-limit));
      }, 300);
    });
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(from: Date, to: Date): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const alerts = this.alertHistory.filter(a => a.triggeredAt >= from && a.triggeredAt <= to);
        const statsBySeverity = {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length,
        };
        const statsByRule = alerts.reduce((acc, a) => {
          acc[a.ruleId] = (acc[a.ruleId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        resolve({
          totalAlerts: alerts.length,
          bySeverity: statsBySeverity,
          byRule: statsByRule,
          deliveryRate: alerts.length > 0 ? (alerts.filter(a => a.delivered).length / alerts.length) * 100 : 0,
        });
      }, 300);
    });
  }

  /**
   * Send test notification
   */
  async sendTestNotification(recipients: string[]): Promise<NotificationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sent: true,
          alertId: `test_${Date.now()}`,
          channels: ['email', 'in_app'],
          failedChannels: [],
          timestamp: new Date(),
        });
      }, 500);
    });
  }

  /**
   * Acknowledge alert (mark as reviewed)
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const alert = this.generatedAlerts.find(a => a.alertId === alertId);
        if (alert) {
          // Mark as acknowledged
          resolve(true);
        }
        resolve(false);
      }, 200);
    });
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private simulateAlertDetection(): Array<{
    ruleId: string;
    description: string;
    triggeredBy: string;
    triggeredAt: Date;
    details: Record<string, any>;
  }> {
    const alerts = [];

    // Random chance of alerts (mock data)
    if (Math.random() > 0.7) {
      alerts.push({
        ruleId: 'rule_ua_001',
        description: '7 unauthorized access attempts detected in 45 minutes',
        triggeredBy: 'audit_system',
        triggeredAt: new Date(),
        details: {
          attemptCount: 7,
          timeWindow: 45,
          affectedUser: 'user_123',
          sourceIp: '192.168.1.100',
        },
      });
    }

    if (Math.random() > 0.8) {
      alerts.push({
        ruleId: 'rule_ls_001',
        description: 'Impersonation session exceeds 45 minutes',
        triggeredBy: 'audit_system',
        triggeredAt: new Date(),
        details: {
          sessionDuration: 45,
          impersonatedUser: 'user_456',
          superAdmin: 'admin_789',
          startTime: new Date(Date.now() - 45 * 60000),
        },
      });
    }

    if (Math.random() > 0.85) {
      alerts.push({
        ruleId: 'rule_sa_001',
        description: 'Sensitive financial data accessed during impersonation session',
        triggeredBy: 'audit_system',
        triggeredAt: new Date(),
        details: {
          dataType: 'FINANCIAL_RECORDS',
          impersonatedUser: 'user_101',
          superAdmin: 'admin_202',
          recordsAccessed: 15,
          severity: 'CRITICAL',
        },
      });
    }

    if (Math.random() > 0.75) {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 9 || hour > 18) {
        alerts.push({
          ruleId: 'rule_oh_001',
          description: `Super admin access detected outside business hours (${hour}:00)`,
          triggeredBy: 'audit_system',
          triggeredAt: now,
          details: {
            accessTime: hour,
            superAdmin: 'admin_303',
            action: 'DATA_EXPORT',
            businessHoursStart: 9,
            businessHoursEnd: 18,
          },
        });
      }
    }

    return alerts;
  }

  private sendNotifications(alert: ComplianceAlert, rule: AlertRule): NotificationResult {
    const channels: string[] = [];
    const failedChannels: string[] = [];

    for (const action of rule.actions) {
      // Simulate sending (mock always succeeds unless random failure)
      if (Math.random() > 0.05) {
        // 95% success rate
        channels.push(action.type);
      } else {
        failedChannels.push(action.type);
      }
    }

    return {
      sent: channels.length > 0,
      alertId: alert.alertId,
      channels,
      failedChannels,
      timestamp: new Date(),
    };
  }

  private buildDeliveryStatus(
    actions: AlertAction[],
    failedChannels: string[]
  ): Record<string, 'pending' | 'sent' | 'failed'> {
    return actions.reduce((acc, action) => {
      acc[action.type] = failedChannels.includes(action.type) ? 'failed' : 'sent';
      return acc;
    }, {} as Record<string, 'pending' | 'sent' | 'failed'>);
  }
}

// Export singleton instance
export const mockComplianceNotificationService = new MockComplianceNotificationService();