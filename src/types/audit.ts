/**
 * Audit Logging and Dashboard Types
 * Centralized types for audit tracking, retention, and visualization
 */

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  tenantId: string;
}

export interface AuditDashboardMetrics {
  totalActions: number;
  criticalActions: number;
  highRiskActions: number;
  lastUpdated: Date;
}

export interface ActionByType {
  type: string;
  count: number;
  percentage: number;
}

export interface ActionByUser {
  userId: string;
  userName: string;
  actionCount: number;
  lastAction: Date;
}

export interface TimelineEvent {
  timestamp: Date;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
}

export interface AuditDashboardData {
  metrics: AuditDashboardMetrics;
  actionsByType: ActionByType[];
  actionsByUser: ActionByUser[];
  timeline: TimelineEvent[];
  summary: string;
}

export interface DashboardFilterOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actionType?: string;
  resource?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionDays: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogArchive {
  id: string;
  archivedAt: Date;
  fromDate: Date;
  toDate: Date;
  recordCount: number;
  archiveLocation: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface RetentionCleanupResult {
  recordsDeleted: number;
  recordsArchived: number;
  deletionDate: Date;
  status: 'success' | 'partial' | 'failed';
  message: string;
}

export interface RetentionStats {
  totalRecords: number;
  oldestRecord: Date;
  newestRecord: Date;
  averageRecordsPerDay: number;
  projectedCleanupDate: Date;
  projectedDeletedCount: number;
}