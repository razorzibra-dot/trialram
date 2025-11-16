/**
 * Super Admin Compliance Report Service - Layer 6 Module Service
 * 
 * **Architecture**: Layer 6 (Module Service) in 8-layer pattern
 * - Delegates to factory-routed services (Layer 5)
 * - Provides module-specific convenience methods
 * - No direct service imports (uses serviceFactory only)
 * - Implements business logic for compliance report operations
 * 
 * **Pattern**: Module services wrap factory services with:
 * - Helper methods for common report generation patterns
 * - Consistent error handling
 * - Caching hints for React Query
 * - Type-safe operations
 * 
 * @example
 * ```typescript
 * import { complianceReportServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Generate activity report for period
 * const report = await complianceReportServiceModule.generateActivityReport(
 *   '2024-01-01',
 *   '2024-01-31'
 * );
 * 
 * // Export to CSV
 * const csv = await complianceReportServiceModule.exportReportToFormat(report, 'csv');
 * ```
 */

import { auditComplianceReportService as factoryComplianceReportService } from '@/services/serviceFactory';
import type {
  ComplianceReport,
  ComplianceReportType,
  ReportExportFormat,
  ReportGenerationOptions,
} from '@/types';

interface ReportFilterOptions {
  startDate: string;
  endDate: string;
  userId?: string;
  tenantId?: string;
}

/**
 * Module-level compliance report service
 * Wraps factory-routed complianceReportService with helper methods
 */
const complianceReportServiceModule = {
  /**
   * Generate super admin activity report
   * Convenience method for common use case
   * 
   * @param startDate - Report start date (ISO format)
   * @param endDate - Report end date (ISO format)
   * @param userId - Optional user filter
   */
  async generateActivityReport(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<ComplianceReport> {
    try {
      const options: ReportGenerationOptions = {
        reportType: 'super_admin_activity',
        startDate,
        endDate,
        userId,
      };
      return await factoryComplianceReportService.generateReport(options);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating activity report:', error);
      throw error;
    }
  },

  /**
   * Generate impersonation sessions report
   * Convenience method for common use case
   * 
   * @param startDate - Report start date (ISO format)
   * @param endDate - Report end date (ISO format)
   * @param tenantId - Optional tenant filter
   */
  async generateImpersonationReport(
    startDate: string,
    endDate: string,
    tenantId?: string
  ): Promise<ComplianceReport> {
    try {
      const options: ReportGenerationOptions = {
        reportType: 'impersonation_sessions',
        startDate,
        endDate,
        tenantId,
      };
      return await factoryComplianceReportService.generateReport(options);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating impersonation report:', error);
      throw error;
    }
  },

  /**
   * Generate unauthorized access report
   * Convenience method for security investigations
   * 
   * @param startDate - Report start date (ISO format)
   * @param endDate - Report end date (ISO format)
   * @param userId - Optional user filter
   */
  async generateUnauthorizedAccessReport(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<ComplianceReport> {
    try {
      const options: ReportGenerationOptions = {
        reportType: 'unauthorized_access',
        startDate,
        endDate,
        userId,
      };
      return await factoryComplianceReportService.generateReport(options);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating unauthorized access report:', error);
      throw error;
    }
  },

  /**
   * Generate data access summary report
   * Convenience method for compliance audits
   * 
   * @param startDate - Report start date (ISO format)
   * @param endDate - Report end date (ISO format)
   * @param tenantId - Optional tenant filter
   */
  async generateAccessSummaryReport(
    startDate: string,
    endDate: string,
    tenantId?: string
  ): Promise<ComplianceReport> {
    try {
      const options: ReportGenerationOptions = {
        reportType: 'data_access_summary',
        startDate,
        endDate,
        tenantId,
      };
      return await factoryComplianceReportService.generateReport(options);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating data access summary report:', error);
      throw error;
    }
  },

  /**
   * Generate custom compliance report
   * Full control over report generation options
   * 
   * @param options - Report generation options
   */
  async generateCustomReport(options: ReportGenerationOptions): Promise<ComplianceReport> {
    try {
      return await factoryComplianceReportService.generateReport(options);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating custom report:', error);
      throw error;
    }
  },

  /**
   * Export report to specified format
   * 
   * @param report - Report to export
   * @param format - Export format (csv, json, html)
   */
  async exportReportToFormat(
    report: ComplianceReport,
    format: ReportExportFormat
  ): Promise<string | Blob> {
    try {
      return await factoryComplianceReportService.exportReport(report, format);
    } catch (error) {
      console.error('[Compliance Report Service] Error exporting report:', error);
      throw error;
    }
  },

  /**
   * Download report as file
   * Handles blob creation and file download
   * 
   * @param report - Report to download
   * @param format - Export format (csv, json, html)
   * @param filename - Optional custom filename
   */
  async downloadReport(
    report: ComplianceReport,
    format: ReportExportFormat,
    filename?: string
  ): Promise<void> {
    try {
      return await factoryComplianceReportService.downloadReport(report, format, filename);
    } catch (error) {
      console.error('[Compliance Report Service] Error downloading report:', error);
      throw error;
    }
  },

  /**
   * Generate and export report in one operation
   * Convenience method for simple workflows
   * 
   * @param options - Report generation options
   * @param format - Export format
   */
  async generateAndExport(
    options: ReportGenerationOptions,
    format: ReportExportFormat
  ): Promise<string | Blob> {
    try {
      const report = await factoryComplianceReportService.generateReport(options);
      return await factoryComplianceReportService.exportReport(report, format);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating and exporting report:', error);
      throw error;
    }
  },

  /**
   * Generate and download report in one operation
   * Convenience method for complete download workflow
   * 
   * @param options - Report generation options
   * @param format - Export format
   * @param filename - Optional custom filename
   */
  async generateAndDownload(
    options: ReportGenerationOptions,
    format: ReportExportFormat,
    filename?: string
  ): Promise<void> {
    try {
      const report = await factoryComplianceReportService.generateReport(options);
      return await factoryComplianceReportService.downloadReport(report, format, filename);
    } catch (error) {
      console.error('[Compliance Report Service] Error generating and downloading report:', error);
      throw error;
    }
  },

  /**
   * Generate multiple report types in sequence
   * Useful for comprehensive compliance audits
   * 
   * @param reportTypes - Array of report types to generate
   * @param startDate - Report start date
   * @param endDate - Report end date
   */
  async generateMultipleReports(
    reportTypes: ComplianceReportType[],
    startDate: string,
    endDate: string
  ): Promise<ComplianceReport[]> {
    try {
      const reports = await Promise.all(
        reportTypes.map((reportType) =>
          factoryComplianceReportService.generateReport({
            reportType,
            startDate,
            endDate,
          })
        )
      );
      return reports;
    } catch (error) {
      console.error('[Compliance Report Service] Error generating multiple reports:', error);
      throw error;
    }
  },

  /**
   * Get report metadata without full generation
   * Useful for previewing report characteristics
   * 
   * @param reportType - Type of report
   * @param startDate - Report start date
   * @param endDate - Report end date
   */
  async getReportMetadata(
    reportType: ComplianceReportType,
    startDate: string,
    endDate: string
  ): Promise<{
    type: ComplianceReportType;
    title: string;
    description: string;
    period: { start: string; end: string };
  }> {
    try {
      const metadata: Record<ComplianceReportType, { title: string; description: string }> = {
        super_admin_activity: {
          title: 'Super Admin Activity Report',
          description: 'All actions performed by super administrators',
        },
        impersonation_sessions: {
          title: 'Impersonation Sessions Report',
          description: 'All user impersonation sessions and activities',
        },
        unauthorized_access: {
          title: 'Unauthorized Access Report',
          description: 'Failed access attempts and security incidents',
        },
        data_access_summary: {
          title: 'Data Access Summary Report',
          description: 'Summary of data resources accessed during period',
        },
      };

      const info = metadata[reportType];
      return {
        type: reportType,
        title: info.title,
        description: info.description,
        period: { start: startDate, end: endDate },
      };
    } catch (error) {
      console.error('[Compliance Report Service] Error getting report metadata:', error);
      throw error;
    }
  },

  /**
   * Validate report generation options
   * Useful for form validation before generation
   * 
   * @param options - Options to validate
   */
  async validateReportOptions(options: ReportGenerationOptions): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!options.reportType) {
      errors.push('Report type is required');
    }

    if (!options.startDate) {
      errors.push('Start date is required');
    }

    if (!options.endDate) {
      errors.push('End date is required');
    }

    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate);
      const end = new Date(options.endDate);
      if (start > end) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get available export formats
   * Convenience method for UI options
   */
  getAvailableFormats(): ReportExportFormat[] {
    return ['csv', 'json', 'html'];
  },

  /**
   * Get available report types
   * Convenience method for UI options
   */
  getAvailableReportTypes(): ComplianceReportType[] {
    return ['super_admin_activity', 'impersonation_sessions', 'unauthorized_access', 'data_access_summary'];
  },
};

export default complianceReportServiceModule;
export type { ReportFilterOptions };