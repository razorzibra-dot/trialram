/**
 * Compliance and Alert Management Types
 * Centralized types for compliance rules, alerts, and reporting
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertConditionType = 
  | 'unauthorized_attempts' 
  | 'long_session' 
  | 'sensitive_access' 
  | 'off_hours';

export interface AlertRule {
  ruleId: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  type: AlertConditionType;
  threshold?: number;
  parameters?: Record<string, unknown>;
}

export interface BusinessHours {
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday=0
}

export interface AlertAction {
  actionId: string;
  type: 'email' | 'sms' | 'notification' | 'webhook';
  recipients: string[];
  template?: string;
  enabled: boolean;
}

export interface ComplianceAlert {
  alertId: string;
  ruleId: string;
  severity: AlertSeverity;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'acknowledged' | 'resolved';
  details: Record<string, unknown>;
  affectedResources: string[];
}

export interface NotificationResult {
  notificationId: string;
  alertId: string;
  status: 'sent' | 'failed' | 'pending';
  recipient: string;
  channel: 'email' | 'sms' | 'notification' | 'webhook';
  sentAt: Date;
  error?: string;
}

export interface AlertCheckResult {
  rulesChecked: number;
  alertsTriggered: number;
  failedChecks: number;
  executionTime: number; // ms
  timestamp: Date;
}

// Compliance Reporting
export type ComplianceReportType = 
  | 'audit_summary' 
  | 'access_control' 
  | 'data_protection' 
  | 'incident_response' 
  | 'user_activity';

export type ReportExportFormat = 'csv' | 'json' | 'html' | 'pdf';

export interface ReportGenerationOptions {
  reportType: ComplianceReportType;
  startDate: Date;
  endDate: Date;
  format: ReportExportFormat;
  includeDetails: boolean;
  filters?: Record<string, unknown>;
}

export interface ComplianceReport {
  reportId: string;
  type: ComplianceReportType;
  generatedAt: Date;
  generatedBy: string;
  startDate: Date;
  endDate: Date;
  format: ReportExportFormat;
  fileSize: number;
  filePath: string;
  status: 'generated' | 'processing' | 'failed';
  summary: {
    totalRecords: number;
    criticalFindings: number;
    warnings: number;
  };
}