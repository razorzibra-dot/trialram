/**
 * Compliance Report Service - Supabase Implementation
 * 
 * **Architecture**: Layer 4 (Supabase Service) in 8-layer pattern
 * Generates compliance reports from Supabase audit logs
 * 
 * Uses row mapping to convert snake_case database columns to camelCase types
 */

import { getSupabaseClient } from '@/services/supabase/client';
import type { ComplianceReport, ComplianceReportType, ReportExportFormat, ReportGenerationOptions } from '../complianceReportService';

/**
 * Supabase compliance report service implementation
 */
class SupabaseComplianceReportService {
  private reportIdCounter = 2000;

  /**
   * Generate a compliance report from Supabase data
   */
  async generateReport(options: ReportGenerationOptions): Promise<ComplianceReport> {
    const {
      reportType,
      startDate,
      endDate,
      userId,
      tenantId,
    } = options;

    try {
      const supabase = getSupabaseClient();

      // Query audit logs from Supabase
      let query = supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.error('[SupabaseComplianceReportService] Error fetching logs:', error);
        throw error;
      }

      // Map database rows to camelCase
      const mappedLogs = (logs || []).map(log => this.mapAuditLogRow(log));

      // Generate report based on type
      let reportData: any[] = [];
      let title = '';
      let description = '';

      switch (reportType) {
        case 'super_admin_activity':
          reportData = this.generateSuperAdminActivityReport(mappedLogs);
          title = 'Super Admin Activity Report';
          description = 'All actions performed by super administrators';
          break;

        case 'impersonation_sessions':
          reportData = this.generateImpersonationSessionsReport(mappedLogs);
          title = 'Impersonation Sessions Report';
          description = 'All user impersonation sessions and activities';
          break;

        case 'unauthorized_access':
          reportData = this.generateUnauthorizedAccessReport(mappedLogs);
          title = 'Unauthorized Access Report';
          description = 'Failed access attempts and security incidents';
          break;

        case 'data_access_summary':
          reportData = this.generateDataAccessSummaryReport(mappedLogs);
          title = 'Data Access Summary Report';
          description = 'Summary of data resources accessed during period';
          break;
      }

      const report: ComplianceReport = {
        id: `report_${this.reportIdCounter++}_${Date.now()}`,
        type: reportType,
        title,
        description,
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate,
          end: endDate,
        },
        summary: {
          totalRecords: reportData.length,
          period: `${startDate} to ${endDate}`,
          generatedBy: 'supabase',
        },
        data: reportData,
        metadata: {
          version: '1.0',
          format: 'compliance-report-supabase',
        },
      };

      return report;
    } catch (error) {
      console.error('[SupabaseComplianceReportService] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export report (delegates to mock for now)
   */
  async exportReport(report: ComplianceReport, format: ReportExportFormat): Promise<string | Blob> {
    // In production, this could generate reports directly from Supabase
    // For now, we'll use the client-side export logic
    switch (format) {
      case 'csv':
        return this.exportAsCSV(report);
      case 'json':
        return this.exportAsJSON(report);
      case 'html':
        return this.exportAsHTML(report);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Download report
   */
  async downloadReport(
    report: ComplianceReport,
    format: ReportExportFormat,
    filename?: string
  ): Promise<void> {
    const content = await this.exportReport(report, format);
    const name = filename || `${report.type}_${new Date().toISOString().split('T')[0]}`;

    if (typeof content === 'string') {
      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      this.downloadBlob(blob, `${name}.${format}`);
    } else {
      this.downloadBlob(content, `${name}.${format}`);
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Map database row to camelCase
   */
  private mapAuditLogRow(row: any) {
    return {
      id: row.id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      userId: row.user_id,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      },
      changes: row.changes || {},
      metadata: row.metadata || {},
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      tenantId: row.tenant_id,
    };
  }

  /**
   * Generate super admin activity report
   */
  private generateSuperAdminActivityReport(logs: any[]) {
    return logs.map(log => ({
      timestamp: log.createdAt,
      superAdmin: log.user.name,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      status: 'completed',
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      changes: typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes),
    }));
  }

  /**
   * Generate impersonation sessions report
   */
  private generateImpersonationSessionsReport(logs: any[]) {
    return logs.map(log => ({
      timestamp: log.createdAt,
      superAdmin: log.user.name,
      action: log.action,
      duration: '0 min',
      impersonatedUser: log.resourceId,
      tenant: log.tenantId,
      reason: 'Support and investigation',
      status: 'active',
    }));
  }

  /**
   * Generate unauthorized access report
   */
  private generateUnauthorizedAccessReport(logs: any[]) {
    return logs
      .filter(log => ['DELETE', 'EXPORT', 'SEARCH'].includes(log.action))
      .map(log => ({
        timestamp: log.createdAt,
        user: log.user.name,
        resource: log.resource,
        action: log.action,
        result: 'denied',
        ipAddress: log.ipAddress,
        reason: 'Insufficient permissions',
        severity: 'medium',
      }));
  }

  /**
   * Generate data access summary report
   */
  private generateDataAccessSummaryReport(logs: any[]) {
    const resourceCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    logs.forEach(log => {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return [
      {
        category: 'Resources Accessed',
        details: resourceCounts,
        total: Object.values(resourceCounts).reduce((a, b) => a + b, 0),
      },
      {
        category: 'Action Types',
        details: actionCounts,
        total: Object.values(actionCounts).reduce((a, b) => a + b, 0),
      },
    ];
  }

  /**
   * Export report as CSV
   */
  private exportAsCSV(report: ComplianceReport): string {
    const headers = Object.keys(report.data[0] || {});
    const csv = [
      `# ${report.title}`,
      `# Generated: ${report.generatedAt}`,
      `# Period: ${report.period.start} to ${report.period.end}`,
      `# Total Records: ${report.summary.totalRecords}`,
      '',
      headers.join(','),
      ...report.data.map(row =>
        headers.map(h => {
          const value = row[h];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    return csv;
  }

  /**
   * Export report as JSON
   */
  private exportAsJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as HTML
   */
  private exportAsHTML(report: ComplianceReport): string {
    const rows = report.data
      .map(row =>
        `<tr>${Object.values(row)
          .map(v => `<td>${v}</td>`)
          .join('')}</tr>`
      )
      .join('\n');

    const headers = Object.keys(report.data[0] || {});
    const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .meta { color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <div class="meta">
          <p><strong>Generated:</strong> ${report.generatedAt}</p>
          <p><strong>Period:</strong> ${report.period.start} to ${report.period.end}</p>
          <p><strong>Total Records:</strong> ${report.summary.totalRecords}</p>
        </div>
        <table>
          <thead>${headerRow}</thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const supabaseComplianceReportService = new SupabaseComplianceReportService();