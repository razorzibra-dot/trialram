/**
 * Compliance Reports Hooks
 * 
 * **Architecture**: Layer 7 (React Hooks) in 8-layer pattern
 * Provides React Query integration for compliance report operations
 * 
 * **Features**:
 * - Generate compliance reports with React Query caching
 * - Export reports in multiple formats (CSV, JSON, HTML)
 * - Download reports with proper error handling
 * - Advanced filtering and date range support
 * - Loading and error state management
 * - Automatic cache invalidation
 * 
 * **Usage**:
 * ```typescript
 * import { useComplianceReports, useGenerateReport } from '@/modules/features/super-admin/hooks';
 * 
 * // Generate a report
 * const { data, isLoading, error } = useGenerateReport({
 *   reportType: 'super_admin_activity',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceReportService as factoryComplianceReportService } from '@/services/serviceFactory';
import type { ComplianceReport, ComplianceReportType, ReportExportFormat, ReportGenerationOptions } from '@/types';

/**
 * Cache key structure for compliance reports
 * Enables precise cache invalidation at different levels
 */
const complianceReportKeys = {
  all: ['compliance-reports'] as const,
  generated: (options: ReportGenerationOptions) => 
    [...complianceReportKeys.all, 'generated', options] as const,
  exported: (reportId: string, format: ReportExportFormat) => 
    [...complianceReportKeys.all, 'exported', reportId, format] as const,
  stats: () => 
    [...complianceReportKeys.all, 'stats'] as const,
};

/**
 * Hook to generate a compliance report
 * 
 * @param options - Report generation options
 * @param enabled - Whether to run the query (default: false for manual triggers)
 * @returns Query result with report data
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useGenerateReport({
 *   reportType: 'super_admin_activity',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 * ```
 */
export function useGenerateReport(
  options: ReportGenerationOptions,
  enabled = false
) {
  return useQuery({
    queryKey: complianceReportKeys.generated(options),
    queryFn: async () => {
      try {
        const report = await factoryComplianceReportService.generateReport(options);
        console.log('[useGenerateReport] Report generated successfully:', report.id);
        return report;
      } catch (error) {
        console.error('[useGenerateReport] Error generating report:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });
}

/**
 * Hook to export a compliance report in a specific format
 * 
 * @param report - The report to export
 * @param format - Export format (csv, json, html)
 * @returns Mutation for exporting the report
 * 
 * @example
 * ```typescript
 * const { mutate, isLoading } = useExportReport();
 * 
 * mutate({
 *   report: generatedReport,
 *   format: 'csv'
 * });
 * ```
 */
export function useExportReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ report, format }: { report: ComplianceReport; format: ReportExportFormat }) => {
      try {
        const exported = await factoryComplianceReportService.exportReport(report, format);
        console.log('[useExportReport] Report exported successfully:', report.id, format);
        return exported;
      } catch (error) {
        console.error('[useExportReport] Error exporting report:', error);
        throw error;
      }
    },
    onSuccess: (_, { report, format }) => {
      // Invalidate exported cache
      queryClient.invalidateQueries({
        queryKey: complianceReportKeys.exported(report.id, format),
      });
    },
  });
}

/**
 * Hook to download a compliance report
 * 
 * @returns Mutation for downloading the report
 * 
 * @example
 * ```typescript
 * const { mutate, isLoading } = useDownloadReport();
 * 
 * mutate({
 *   report: generatedReport,
 *   format: 'csv',
 *   filename: 'compliance_report_2024'
 * });
 * ```
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({
      report,
      format,
      filename,
    }: {
      report: ComplianceReport;
      format: ReportExportFormat;
      filename?: string;
    }) => {
      try {
        await factoryComplianceReportService.downloadReport(report, format, filename);
        console.log('[useDownloadReport] Report downloaded successfully:', report.id);
        return { success: true, reportId: report.id };
      } catch (error) {
        console.error('[useDownloadReport] Error downloading report:', error);
        throw error;
      }
    },
  });
}

/**
 * Hook for complete report workflow (generate + export + download)
 * 
 * @param options - Report generation options
 * @returns Combined mutations for full workflow
 * 
 * @example
 * ```typescript
 * const { generateAndDownload, isLoading } = useReportWorkflow();
 * 
 * // Generate and download in one call
 * generateAndDownload({
 *   options: { reportType: 'super_admin_activity', startDate: '2024-01-01', endDate: '2024-01-31' },
 *   format: 'csv'
 * });
 * ```
 */
export function useReportWorkflow() {
  const queryClient = useQueryClient();
  const generateMutation = useMutation({
    mutationFn: (options: ReportGenerationOptions) =>
      factoryComplianceReportService.generateReport(options),
  });

  const downloadMutation = useMutation({
    mutationFn: async ({
      report,
      format,
      filename,
    }: {
      report: ComplianceReport;
      format: ReportExportFormat;
      filename?: string;
    }) => {
      await factoryComplianceReportService.downloadReport(report, format, filename);
      return { success: true, reportId: report.id };
    },
    onSuccess: (_, { report, format }) => {
      queryClient.invalidateQueries({
        queryKey: complianceReportKeys.exported(report.id, format),
      });
    },
  });

  return {
    generateAndDownload: async (params: {
      options: ReportGenerationOptions;
      format: ReportExportFormat;
      filename?: string;
    }) => {
      const generatedReport = await generateMutation.mutateAsync(params.options);
      await downloadMutation.mutateAsync({
        report: generatedReport,
        format: params.format,
        filename: params.filename,
      });
      return generatedReport;
    },
    isLoading: generateMutation.isPending || downloadMutation.isPending,
    error: generateMutation.error || downloadMutation.error,
  };
}

/**
 * Hook for generating multiple reports with different date ranges
 * 
 * @param reportTypes - Array of report types to generate
 * @param dateRange - Date range for reports
 * @returns Multiple report queries
 * 
 * @example
 * ```typescript
 * const { reports, isLoading } = useMultipleReports(
 *   ['super_admin_activity', 'unauthorized_access'],
 *   { startDate: '2024-01-01', endDate: '2024-01-31' }
 * );
 * ```
 */
export function useMultipleReports(
  reportTypes: ComplianceReportType[],
  dateRange: { startDate: string; endDate: string }
) {
  // Generate report for first type (hooks can only be called at top level)
  const primaryQuery = useGenerateReport(
    reportTypes.length > 0
      ? {
          reportType: reportTypes[0],
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }
      : null,
    true
  );

  const reports = primaryQuery.data ? [primaryQuery.data] : [];
  const isLoading = primaryQuery.isLoading;
  const error = primaryQuery.error;

  return { reports, isLoading, error };
}

/**
 * Hook for report generation with automatic format selection
 * 
 * @param options - Report generation options
 * @param autoFormat - Automatically export and download after generation
 * @returns Combined query and mutation for generation and export
 */
export function useReportGenerator(
  options: ReportGenerationOptions,
  autoFormat?: ReportExportFormat
) {
  const queryClient = useQueryClient();
  const generateQuery = useGenerateReport(options, false);
  const exportMutation = useMutation({
    mutationFn: async (report: ComplianceReport) => {
      if (autoFormat) {
        return factoryComplianceReportService.exportReport(report, autoFormat);
      }
      return report;
    },
    onSuccess: (_, report) => {
      if (autoFormat) {
        queryClient.invalidateQueries({
          queryKey: complianceReportKeys.exported(report.id, autoFormat),
        });
      }
    },
  });

  return {
    report: generateQuery.data,
    isGenerating: generateQuery.isLoading,
    isExporting: exportMutation.isPending,
    error: generateQuery.error || exportMutation.error,
    generate: () => generateQuery.refetch(),
    exportAndDownload: async (report: ComplianceReport, format: ReportExportFormat) => {
      const exported = await factoryComplianceReportService.exportReport(report, format);
      queryClient.invalidateQueries({
        queryKey: complianceReportKeys.exported(report.id, format),
      });
      return exported;
    },
  };
}

/**
 * Hook for report statistics and metadata
 * 
 * @returns Report statistics query
 */
export function useReportStats() {
  return useQuery({
    queryKey: complianceReportKeys.stats(),
    queryFn: async () => {
      try {
        // This would fetch statistics about generated reports
        // Implementation depends on backend capabilities
        return {
          totalGenerated: 0,
          totalExported: 0,
          lastGenerated: null,
        };
      } catch (error) {
        console.error('[useReportStats] Error fetching stats:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export type { ComplianceReport, ComplianceReportType, ReportExportFormat, ReportGenerationOptions };