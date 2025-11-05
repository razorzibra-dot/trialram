/**
 * Audit Summary Dashboard Component (Layer 8 - UI)
 * 
 * Comprehensive dashboard displaying audit metrics, trends, and compliance data.
 * Features real-time metrics, interactive charts, timeline visualization, and export capabilities.
 * 
 * Layer 8 in 8-layer architecture - consumes hooks from Layer 7
 * Uses factory-routed services through React Query hooks
 * 
 * @component
 * @example
 * ```tsx
 * import { AuditSummaryDashboard } from '@/modules/features/super-admin/components';
 * 
 * function ComplianceHub() {
 *   return <AuditSummaryDashboard />;
 * }
 * ```
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Space,
  Select,
  Spin,
  Empty,
  Badge,
  Tabs,
  Table,
  Tooltip,
  message,
  Modal,
  Segmented,
} from 'antd';
import {
  DownloadOutlined,
  BarsOutlined,
  WarningOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuditDashboard, useDashboardVisualizations } from '../hooks/useAuditDashboard';
import { auditDashboardServiceModule } from '../services';
import styles from './AuditSummaryDashboard.module.css';

interface DateRangeValue {
  start: Dayjs;
  end: Dayjs;
}

type ExportFormat = 'json' | 'csv' | 'html';

/**
 * Audit Summary Dashboard Component
 * 
 * Displays comprehensive audit metrics including:
 * - Real-time statistics (sessions, attempts, duration)
 * - Interactive visualizations (bar/pie/line charts)
 * - Timeline of events with severity color-coding
 * - High-risk alerts panel
 * - Advanced filtering and date range selection
 * - Export functionality (JSON, CSV, HTML)
 */
export const AuditSummaryDashboard: React.FC = () => {
  // State Management
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => ({
    start: dayjs().subtract(7, 'days'),
    end: dayjs(),
  }));

  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Query Hooks
  const dashboardQuery = useAuditDashboard(dateRange.start.toDate(), dateRange.end.toDate());
  const visualizationsQuery = useDashboardVisualizations(dateRange.start.toDate(), dateRange.end.toDate());

  // Derived Data
  const metrics = dashboardQuery.data?.metrics;
  const timeline = dashboardQuery.data?.timeline || [];
  const topUsers = dashboardQuery.data?.topUnauthorizedUsers || [];
  const highSeverityEvents = dashboardQuery.data?.highSeverityEvents || [];

  const isLoading = dashboardQuery.isLoading || visualizationsQuery.isLoading;
  const isFetching = dashboardQuery.isFetching || visualizationsQuery.isFetching;
  const error = dashboardQuery.error || visualizationsQuery.error;

  // Handlers
  const handleDateRangeChange = (preset?: '7d' | '30d' | '90d') => {
    if (preset) {
      setSelectedTimeRange(preset);
      const start = dayjs().subtract(parseInt(preset), 'days');
      setDateRange({ start, end: dayjs() });
    }
  };

  const handleCustomDateRange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setSelectedTimeRange('custom');
      setDateRange({ start: dates[0], end: dates[1] });
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const dashboardData = await auditDashboardServiceModule.getDashboardData(
        dateRange.start.toDate(),
        dateRange.end.toDate()
      );

      if (exportFormat === 'csv') {
        const csv = await auditDashboardServiceModule.exportDashboardData(dashboardData, 'csv');
        downloadFile(csv, `audit-dashboard-${dateRange.start.format('YYYY-MM-DD')}-to-${dateRange.end.format('YYYY-MM-DD')}.csv`, 'text/csv');
      } else if (exportFormat === 'json') {
        const json = JSON.stringify(dashboardData, null, 2);
        downloadFile(json, `audit-dashboard-${dateRange.start.format('YYYY-MM-DD')}-to-${dateRange.end.format('YYYY-MM-DD')}.json`, 'application/json');
      } else if (exportFormat === 'html') {
        const html = generateHtmlReport(dashboardData, dateRange);
        downloadFile(html, `audit-dashboard-${dateRange.start.format('YYYY-MM-DD')}-to-${dateRange.end.format('YYYY-MM-DD')}.html`, 'text/html');
      }

      message.success(`Dashboard exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error('[AuditDashboard] Export failed:', err);
      message.error('Failed to export dashboard');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    dashboardQuery.refetch();
    visualizationsQuery.refetch();
  };

  // Formatted Data for Charts
  const actionsByTypeData = useMemo(() => {
    if (!visualizationsQuery.data?.actionsByType) return [];
    return visualizationsQuery.data.actionsByType.map(item => ({
      name: item.actionType,
      value: item.count,
      displayName: formatActionType(item.actionType),
    }));
  }, [visualizationsQuery.data?.actionsByType]);

  const actionsByUserData = useMemo(() => {
    if (!visualizationsQuery.data?.actionsByUser) return [];
    return visualizationsQuery.data.actionsByUser
      .slice(0, 10)
      .map(item => ({
        userName: item.userName,
        count: item.count,
      }));
  }, [visualizationsQuery.data?.actionsByUser]);

  const timelineChartData = useMemo(() => {
    return timeline
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reduce((acc: any[], event) => {
        const date = dayjs(event.timestamp).format('YYYY-MM-DD');
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.count += 1;
          if (event.severity === 'critical') existing.critical += 1;
          if (event.severity === 'high') existing.high += 1;
        } else {
          acc.push({
            date,
            count: 1,
            critical: event.severity === 'critical' ? 1 : 0,
            high: event.severity === 'high' ? 1 : 0,
          });
        }
        return acc;
      }, [])
      .slice(-30); // Last 30 days
  }, [timeline]);

  // Render: Loading State
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading audit dashboard..." />
      </div>
    );
  }

  // Render: Error State
  if (error) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Failed to load audit dashboard"
          style={{ marginTop: 48, marginBottom: 48 }}
        >
          <Button type="primary" onClick={handleRefresh}>
            Retry
          </Button>
        </Empty>
      </Card>
    );
  }

  // Render: Main Dashboard
  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <Card className={styles.header}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col>
            <h1>
              <LineChartOutlined /> Audit Summary Dashboard
            </h1>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setExportFormat('csv')}
                disabled={isExporting}
                loading={isExporting && exportFormat === 'csv'}
              >
                Export CSV
              </Button>
              <Tooltip title="Refresh data">
                <Button
                  onClick={handleRefresh}
                  loading={isFetching}
                >
                  Refresh
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card className={styles.filters} title="Filters & Date Range">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <label className={styles.label}>Quick Select</label>
            <Segmented
              value={selectedTimeRange}
              onChange={(value: any) => handleDateRangeChange(value)}
              options={[
                { label: '7 Days', value: '7d' },
                { label: '30 Days', value: '30d' },
                { label: '90 Days', value: '90d' },
                { label: 'Custom', value: 'custom' },
              ]}
              block
            />
          </Col>
          <Col xs={24} sm={12} md={12}>
            <label className={styles.label}>Custom Date Range</label>
            <DatePicker.RangePicker
              value={[dateRange.start, dateRange.end]}
              onChange={handleCustomDateRange}
              style={{ width: '100%' }}
              disabled={selectedTimeRange !== 'custom'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label className={styles.label}>Chart View</label>
            <Select
              value={chartView}
              onChange={setChartView}
              options={[
                { label: 'Bar Chart', value: 'bar' },
                { label: 'Pie Chart', value: 'pie' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Card title="Key Metrics" className={styles.metricsCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Sessions"
              value={metrics?.totalSessions || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Active Sessions"
              value={metrics?.activeSessions || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Unauthorized Attempts"
              value={metrics?.unauthorizedAttempts || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Avg Session Duration"
              value={metrics?.averageSessionDuration ? `${Math.round(metrics.averageSessionDuration)}m` : 'N/A'}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Peak Activity Hour"
              value={metrics?.peakActivityHour ? `${metrics.peakActivityHour}:00` : 'N/A'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Unique Users"
              value={metrics?.totalUniqueUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Charts Section */}
      <Row gutter={16}>
        {/* Actions by Type Chart */}
        <Col xs={24} md={12}>
          <Card title="Actions by Type" className={styles.chartCard}>
            {actionsByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartView === 'bar' ? (
                  <BarChart data={actionsByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#1890ff" />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={actionsByTypeData}
                      dataKey="value"
                      nameKey="displayName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {actionsByTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>

        {/* Actions by User Chart */}
        <Col xs={24} md={12}>
          <Card title="Top Users by Activity" className={styles.chartCard}>
            {actionsByUserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionsByUserData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="userName" type="category" width={100} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Timeline Chart */}
      <Card title="Activity Timeline (Last 30 Days)" className={styles.chartCard}>
        {timelineChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#1890ff" name="Total Events" />
              <Line type="monotone" dataKey="critical" stroke="#ff4d4f" name="Critical Events" />
              <Line type="monotone" dataKey="high" stroke="#faad14" name="High Severity" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No timeline data available" />
        )}
      </Card>

      {/* High Severity Alerts */}
      {highSeverityEvents.length > 0 && (
        <Card title={<><WarningOutlined /> High Severity Alerts</>} className={styles.alertsCard}>
          <Table
            columns={[
              {
                title: 'Timestamp',
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
              },
              {
                title: 'Severity',
                dataIndex: 'severity',
                key: 'severity',
                render: (severity) => (
                  <Badge
                    color={severity === 'critical' ? '#ff4d4f' : '#faad14'}
                    text={severity.toUpperCase()}
                  />
                ),
              },
              {
                title: 'Action',
                dataIndex: 'actionType',
                key: 'actionType',
                render: (text) => formatActionType(text),
              },
              {
                title: 'User',
                dataIndex: 'userName',
                key: 'userName',
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
            ]}
            dataSource={highSeverityEvents.map((event: any, idx: number) => ({
              key: idx,
              ...event,
            }))}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}

      {/* Timeline Table */}
      <Card title={<><ClockCircleOutlined /> Recent Events</>} className={styles.timelineCard}>
        <Table
          columns={[
            {
              title: 'Timestamp',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
              sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            },
            {
              title: 'Severity',
              dataIndex: 'severity',
              key: 'severity',
              render: (severity) => {
                let color = '#d9d9d9';
                if (severity === 'critical') color = '#ff4d4f';
                else if (severity === 'high') color = '#faad14';
                else if (severity === 'medium') color = '#1890ff';
                return <Badge color={color} text={severity.toUpperCase()} />;
              },
            },
            {
              title: 'Action',
              dataIndex: 'actionType',
              key: 'actionType',
              render: (text) => formatActionType(text),
            },
            {
              title: 'User',
              dataIndex: 'userName',
              key: 'userName',
            },
            {
              title: 'Details',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
            },
          ]}
          dataSource={timeline.map((event: any, idx: number) => ({
            key: idx,
            ...event,
          }))}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>

      {/* Top Unauthorized Users */}
      {topUsers.length > 0 && (
        <Card title={<><WarningOutlined /> Top Unauthorized Users</>} className={styles.topUsersCard}>
          <Table
            columns={[
              {
                title: 'User',
                dataIndex: 'userName',
                key: 'userName',
              },
              {
                title: 'Attempts',
                dataIndex: 'attemptCount',
                key: 'attemptCount',
                sorter: (a: any, b: any) => a.attemptCount - b.attemptCount,
              },
              {
                title: 'Last Attempt',
                dataIndex: 'lastAttemptTime',
                key: 'lastAttemptTime',
                render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
              },
            ]}
            dataSource={topUsers.map((user: any, idx: number) => ({
              key: idx,
              ...user,
            }))}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

// Helper Functions
function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    IMPERSONATION: 'Impersonation',
    UNAUTHORIZED_ACCESS: 'Unauthorized Access',
    DATA_ACCESS: 'Data Access',
    DATA_MODIFICATION: 'Data Modification',
    DATA_DELETION: 'Data Deletion',
    EXPORT: 'Export',
    LOGIN: 'Login',
    LOGOUT: 'Logout',
  };
  return actionMap[actionType] || actionType;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function generateHtmlReport(data: any, dateRange: DateRangeValue): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Summary Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1890ff; }
    h2 { color: #595959; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 10px; text-align: left; border: 1px solid #d9d9d9; }
    th { background-color: #fafafa; }
    .metric { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Audit Summary Report</h1>
  <p><strong>Date Range:</strong> ${dateRange.start.format('YYYY-MM-DD')} to ${dateRange.end.format('YYYY-MM-DD')}</p>
  <p><strong>Generated:</strong> ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
  
  <h2>Key Metrics</h2>
  <div class="metric"><strong>Total Sessions:</strong> ${data.metrics?.totalSessions || 0}</div>
  <div class="metric"><strong>Active Sessions:</strong> ${data.metrics?.activeSessions || 0}</div>
  <div class="metric"><strong>Unauthorized Attempts:</strong> ${data.metrics?.unauthorizedAttempts || 0}</div>
  <div class="metric"><strong>Average Duration:</strong> ${data.metrics?.averageSessionDuration ? Math.round(data.metrics.averageSessionDuration) + ' minutes' : 'N/A'}</div>
  
  <h2>Timeline Summary</h2>
  <p>Total events: ${data.timeline?.length || 0}</p>
</body>
</html>`;
}

const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#f5222d'];