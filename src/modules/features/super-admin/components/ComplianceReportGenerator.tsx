/**
 * Compliance Report Generator Component
 * 
 * **Architecture**: Layer 8 (UI Component) in 8-layer pattern
 * Provides user interface for generating and downloading compliance reports
 * 
 * **Features**:
 * - Report type selector (4 types)
 * - Date range picker (customizable period)
 * - Export format selector (CSV, JSON, HTML)
 * - Generate and download workflow
 * - Loading and error states
 * - Report preview metadata
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Alert,
  Spin,
  Tag,
  Divider,
  Progress,
  Empty,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'sonner';
import {
  useGenerateReport,
  useExportReport,
  useDownloadReport,
  useReportGenerator,
} from '../hooks/useComplianceReports';
import complianceReportServiceModule from '../services/complianceReportService';
import type { ComplianceReportType, ReportExportFormat } from '@/types';

interface ComplianceReportGeneratorProps {
  /** Callback when report is successfully generated */
  onReportGenerated?: () => void;

  /** Show compact version */
  compact?: boolean;

  /** Pre-selected report type */
  initialReportType?: ComplianceReportType;

  /** Pre-selected date range */
  initialDateRange?: [string, string];
}

/**
 * Report type options with descriptions
 */
const REPORT_TYPE_OPTIONS = [
  {
    label: 'Super Admin Activity',
    value: 'super_admin_activity' as ComplianceReportType,
    description: 'All actions performed by super administrators',
  },
  {
    label: 'Impersonation Sessions',
    value: 'impersonation_sessions' as ComplianceReportType,
    description: 'All user impersonation sessions and activities',
  },
  {
    label: 'Unauthorized Access',
    value: 'unauthorized_access' as ComplianceReportType,
    description: 'Failed access attempts and security incidents',
  },
  {
    label: 'Data Access Summary',
    value: 'data_access_summary' as ComplianceReportType,
    description: 'Summary of data resources accessed during period',
  },
];

/**
 * Export format options
 */
const EXPORT_FORMAT_OPTIONS = [
  { label: 'CSV', value: 'csv' as ReportExportFormat, description: 'Comma-separated values' },
  { label: 'JSON', value: 'json' as ReportExportFormat, description: 'JSON format' },
  { label: 'HTML', value: 'html' as ReportExportFormat, description: 'HTML report' },
];

/**
 * ComplianceReportGenerator Component
 * Manages compliance report generation and export
 */
export const ComplianceReportGenerator: React.FC<ComplianceReportGeneratorProps> = ({
  onReportGenerated,
  compact = false,
  initialReportType,
  initialDateRange,
}) => {
  const [form] = Form.useForm();
  const [reportType, setReportType] = useState<ComplianceReportType | undefined>(initialReportType);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(
    initialDateRange ? [dayjs(initialDateRange[0]), dayjs(initialDateRange[1])] : null
  );
  const [exportFormat, setExportFormat] = useState<ReportExportFormat>('csv');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [reportMetadata, setReportMetadata] = useState<any>(null);

  // Use combined report generation and download hook
  const { generateAndDownload, isLoading: isGeneratingDownload, error: generationError } =
    useReportGenerator();

  // Use individual hooks for separate steps (if needed)
  const { mutate: generateReport, isPending: isGenerating } = useGenerateReport();
  const { mutate: exportReport, isPending: isExporting } = useExportReport();
  const { mutate: downloadReport, isPending: isDownloading } = useDownloadReport();

  // Fetch report metadata when type changes
  useEffect(() => {
    if (reportType && dateRange?.[0] && dateRange?.[1]) {
      const loadMetadata = async () => {
        try {
          const metadata = await complianceReportServiceModule.getReportMetadata(
            reportType,
            dateRange[0].format('YYYY-MM-DD'),
            dateRange[1].format('YYYY-MM-DD')
          );
          setReportMetadata(metadata);
        } catch (error) {
          console.error('Error loading report metadata:', error);
        }
      };
      loadMetadata();
    }
  }, [reportType, dateRange]);

  /**
   * Validate form inputs
   */
  const validateInputs = (): boolean => {
    if (!reportType) {
      toast.error('Please select a report type');
      return false;
    }

    if (!dateRange || dateRange.length !== 2) {
      toast.error('Please select a date range');
      return false;
    }

    if (dateRange[0].isAfter(dateRange[1])) {
      toast.error('Start date must be before end date');
      return false;
    }

    return true;
  };

  /**
   * Handle generate report only
   */
  const handleGenerateReport = async () => {
    if (!validateInputs()) return;

    const options = {
      reportType: reportType!,
      startDate: dateRange![0].format('YYYY-MM-DD'),
      endDate: dateRange![1].format('YYYY-MM-DD'),
    };

    generateReport(options, {
      onSuccess: (report) => {
        setGeneratedReport(report);
        toast.success(`${reportMetadata?.title} generated successfully`);
        onReportGenerated?.();
      },
      onError: (error) => {
        toast.error('Failed to generate report');
        console.error('Report generation error:', error);
      },
    });
  };

  /**
   * Handle generate and download
   */
  const handleGenerateAndDownload = async () => {
    if (!validateInputs()) return;

    const options = {
      reportType: reportType!,
      startDate: dateRange![0].format('YYYY-MM-DD'),
      endDate: dateRange![1].format('YYYY-MM-DD'),
    };

    generateAndDownload(options, exportFormat, {
      onSuccess: () => {
        toast.success('Report generated and downloaded successfully');
        setGeneratedReport(null);
        onReportGenerated?.();
      },
      onError: (error) => {
        toast.error('Failed to generate and download report');
        console.error('Error:', error);
      },
    });
  };

  /**
   * Handle export and download
   */
  const handleExportAndDownload = async () => {
    if (!generatedReport) {
      toast.error('Please generate a report first');
      return;
    }

    downloadReport(
      { report: generatedReport, format: exportFormat },
      {
        onSuccess: () => {
          toast.success('Report downloaded successfully');
        },
        onError: (error) => {
          toast.error('Failed to download report');
          console.error('Download error:', error);
        },
      }
    );
  };

  const isLoading = isGenerating || isExporting || isDownloading || isGeneratingDownload;

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Compliance Report Generator</span>
        </Space>
      }
      className={compact ? 'compliance-report-generator-compact' : ''}
    >
      {generationError && (
        <Alert
          message="Error generating report"
          description={generationError instanceof Error ? generationError.message : 'Unknown error'}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" form={form}>
        <Row gutter={[16, 16]}>
          {/* Report Type Selector */}
          <Col xs={24} sm={12}>
            <Form.Item label="Report Type" required>
              <Select
                placeholder="Select report type"
                value={reportType}
                onChange={setReportType}
                disabled={isLoading}
              >
                {REPORT_TYPE_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <div>
                      <div>{option.label}</div>
                      <small style={{ color: '#999' }}>{option.description}</small>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Export Format Selector */}
          <Col xs={24} sm={12}>
            <Form.Item label="Export Format" required>
              <Select
                placeholder="Select export format"
                value={exportFormat}
                onChange={setExportFormat}
                disabled={isLoading}
              >
                {EXPORT_FORMAT_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <div>
                      <div>{option.label}</div>
                      <small style={{ color: '#999' }}>{option.description}</small>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Date Range Picker */}
          <Col xs={24}>
            <Form.Item label="Date Range" required>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                format="YYYY-MM-DD"
                disabled={isLoading}
                style={{ width: '100%' }}
                presets={[
                  { label: 'Last 7 days', value: [dayjs().add(-7, 'd'), dayjs()] },
                  { label: 'Last 30 days', value: [dayjs().add(-30, 'd'), dayjs()] },
                  { label: 'Last 90 days', value: [dayjs().add(-90, 'd'), dayjs()] },
                  { label: 'This month', value: [dayjs().startOf('month'), dayjs()] },
                  { label: 'Last month', value: [dayjs().add(-1, 'M').startOf('month'), dayjs().add(-1, 'M').endOf('month')] },
                ]}
              />
            </Form.Item>
          </Col>

          {/* Report Metadata / Preview */}
          {reportMetadata && (
            <Col xs={24}>
              <Alert
                message={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <strong>{reportMetadata.title}</strong>
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {reportMetadata.description}
                    </div>
                    <div style={{ fontSize: '0.85em' }}>
                      Period: {reportMetadata.period.start} to {reportMetadata.period.end}
                    </div>
                  </Space>
                }
                type="info"
                icon={<FileTextOutlined />}
              />
            </Col>
          )}

          {/* Generated Report Info */}
          {generatedReport && (
            <Col xs={24}>
              <Alert
                message={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <strong>Report Generated Successfully</strong>
                    </div>
                    <div style={{ fontSize: '0.9em' }}>
                      Total Records: <strong>{generatedReport.summary?.totalRecords || 0}</strong>
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      Generated: {new Date(generatedReport.generatedAt).toLocaleString()}
                    </div>
                  </Space>
                }
                type="success"
              />
            </Col>
          )}

          {/* Action Buttons */}
          <Col xs={24}>
            <Divider />
            <Space wrap style={{ width: '100%' }}>
              {!generatedReport ? (
                <>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleGenerateReport}
                    loading={isGenerating}
                    disabled={!reportType || !dateRange}
                  >
                    Generate Report
                  </Button>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleGenerateAndDownload}
                    loading={isGeneratingDownload}
                    disabled={!reportType || !dateRange}
                  >
                    Generate & Download
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportAndDownload}
                    loading={isDownloading}
                  >
                    Download Report
                  </Button>

                  <Button onClick={() => setGeneratedReport(null)}>Clear</Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Form>

      {/* Loading Progress */}
      {isLoading && (
        <div style={{ marginTop: 16 }}>
          <Spin tip="Generating report..." />
        </div>
      )}

      <style>{`
        .compliance-report-generator-compact {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02);
        }

        .compliance-report-generator-compact .ant-card-head {
          padding: 12px 16px;
        }

        .compliance-report-generator-compact .ant-card-body {
          padding: 16px;
        }
      `}</style>
    </Card>
  );
};

export default ComplianceReportGenerator;