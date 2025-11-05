/**
 * Audit Dashboard Service - Module Layer
 * Layer 6: Module service wrapper for super-admin features
 * 
 * Provides convenience methods for dashboard data retrieval
 * Uses factory-routed service (never direct imports)
 */

import { auditDashboardService as factoryAuditDashboardService } from '@/services/serviceFactory';
import {
  AuditDashboardMetrics,
  ActionByType,
  ActionByUser,
  TimelineEvent,
  AuditDashboardData,
} from '@/types';

/**
 * Module service wrapper for audit dashboard operations
 */
class AuditDashboardServiceModule {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardMetrics> {
    try {
      console.log('[AuditDashboard] Module: Getting metrics:', { dateFrom, dateTo, tenantId });
      return await factoryAuditDashboardService.getDashboardMetrics(dateFrom, dateTo, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get actions grouped by type
   */
  async getActionsByType(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<ActionByType[]> {
    try {
      console.log('[AuditDashboard] Module: Getting actions by type:', { dateFrom, dateTo, tenantId });
      return await factoryAuditDashboardService.getActionsByType(dateFrom, dateTo, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting actions by type:', error);
      throw error;
    }
  }

  /**
   * Get actions grouped by user
   */
  async getActionsByUser(
    dateFrom: string,
    dateTo: string,
    limit?: number,
    tenantId?: string
  ): Promise<ActionByUser[]> {
    try {
      console.log('[AuditDashboard] Module: Getting actions by user:', { dateFrom, dateTo, limit, tenantId });
      return await factoryAuditDashboardService.getActionsByUser(dateFrom, dateTo, limit, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting actions by user:', error);
      throw error;
    }
  }

  /**
   * Get timeline events
   */
  async getTimeline(
    dateFrom: string,
    dateTo: string,
    limit?: number,
    tenantId?: string
  ): Promise<TimelineEvent[]> {
    try {
      console.log('[AuditDashboard] Module: Getting timeline:', { dateFrom, dateTo, limit, tenantId });
      return await factoryAuditDashboardService.getTimeline(dateFrom, dateTo, limit, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting timeline:', error);
      throw error;
    }
  }

  /**
   * Get top unauthorized users
   */
  async getTopUnauthorizedUsers(
    dateFrom: string,
    dateTo: string,
    limit?: number,
    tenantId?: string
  ): Promise<ActionByUser[]> {
    try {
      console.log('[AuditDashboard] Module: Getting top unauthorized users:', { dateFrom, dateTo, limit, tenantId });
      return await factoryAuditDashboardService.getTopUnauthorizedUsers(dateFrom, dateTo, limit, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting top unauthorized users:', error);
      throw error;
    }
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardData> {
    try {
      console.log('[AuditDashboard] Module: Getting complete dashboard data:', { dateFrom, dateTo, tenantId });
      return await factoryAuditDashboardService.getDashboardData(dateFrom, dateTo, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(
    dateFrom: string,
    dateTo: string,
    format?: 'csv' | 'json' | 'pdf',
    tenantId?: string
  ): Promise<string> {
    try {
      console.log('[AuditDashboard] Module: Exporting dashboard data:', { dateFrom, dateTo, format, tenantId });
      return await factoryAuditDashboardService.exportDashboardData(dateFrom, dateTo, format, tenantId);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error exporting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get data for last N days (convenience method)
   */
  async getDashboardDataLastDays(
    days: number = 7,
    tenantId?: string
  ): Promise<AuditDashboardData> {
    const dateTo = new Date().toISOString();
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return this.getDashboardData(dateFrom, dateTo, tenantId);
  }

  /**
   * Get data for current month
   */
  async getDashboardDataCurrentMonth(tenantId?: string): Promise<AuditDashboardData> {
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const dateTo = new Date().toISOString();
    return this.getDashboardData(dateFrom, dateTo, tenantId);
  }

  /**
   * Get high-severity events
   */
  async getHighSeverityEvents(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<TimelineEvent[]> {
    try {
      console.log('[AuditDashboard] Module: Getting high severity events:', { dateFrom, dateTo, tenantId });
      const timeline = await this.getTimeline(dateFrom, dateTo, 100, tenantId);
      return timeline.filter(event => event.severity === 'high' || event.severity === 'critical');
    } catch (error) {
      console.error('[AuditDashboard] Module: Error getting high severity events:', error);
      throw error;
    }
  }

  /**
   * Export dashboard data as file
   */
  async exportDashboardDataAsFile(
    dateFrom: string,
    dateTo: string,
    format: 'csv' | 'json' | 'pdf' = 'json',
    filename?: string
  ): Promise<void> {
    try {
      const data = await this.exportDashboardData(dateFrom, dateTo, format);
      const element = document.createElement('a');
      const file = new Blob([data], {
        type:
          format === 'csv'
            ? 'text/csv'
            : format === 'json'
              ? 'application/json'
              : 'application/pdf',
      });
      element.href = URL.createObjectURL(file);
      element.download = filename || `audit-dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('[AuditDashboard] Module: Error exporting file:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditDashboardServiceModule = new AuditDashboardServiceModule();