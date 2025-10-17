/**
 * Super Admin Logs Page
 * System-wide audit logs with cross-tenant viewing capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Typography,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '@/components/common';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface AuditLog {
  id: string;
  timestamp: string;
  tenant_id: string;
  tenant_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
}

interface LogStats {
  total_logs: number;
  success_count: number;
  failure_count: number;
  active_tenants: number;
}

export const SuperAdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LogStats>({
    total_logs: 0,
    success_count: 0,
    failure_count: 0,
    active_tenants: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<string | undefined>(undefined);
  const [selectedResource, setSelectedResource] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    loadLogs();
  }, [selectedTenant, selectedAction, selectedResource, selectedStatus, dateRange]);

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00Z',
          tenant_id: 'tenant-1',
          tenant_name: 'Acme Corporation',
          user_id: 'user-1',
          user_name: 'John Doe',
          user_email: 'john@acme.com',
          action: 'create',
          resource_type: 'customer',
          resource_id: 'cust-123',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success',
          details: 'Created new customer: ABC Industries',
          changes: {
            before: {},
            after: { name: 'ABC Industries', email: 'contact@abc.com' },
          },
        },
        {
          id: '2',
          timestamp: '2024-01-15T10:25:00Z',
          tenant_id: 'tenant-2',
          tenant_name: 'TechStart Inc',
          user_id: 'user-2',
          user_name: 'Jane Smith',
          user_email: 'jane@techstart.com',
          action: 'update',
          resource_type: 'ticket',
          resource_id: 'ticket-456',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'success',
          details: 'Updated ticket status from Open to In Progress',
          changes: {
            before: { status: 'open' },
            after: { status: 'in_progress' },
          },
        },
        {
          id: '3',
          timestamp: '2024-01-15T10:20:00Z',
          tenant_id: 'tenant-1',
          tenant_name: 'Acme Corporation',
          user_id: 'user-3',
          user_name: 'Bob Wilson',
          user_email: 'bob@acme.com',
          action: 'delete',
          resource_type: 'user',
          resource_id: 'user-789',
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'failure',
          details: 'Failed to delete user: Insufficient permissions',
        },
        {
          id: '4',
          timestamp: '2024-01-15T10:15:00Z',
          tenant_id: 'tenant-3',
          tenant_name: 'Global Solutions',
          user_id: 'user-4',
          user_name: 'Alice Johnson',
          user_email: 'alice@global.com',
          action: 'login',
          resource_type: 'auth',
          resource_id: 'session-001',
          ip_address: '192.168.1.103',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64)',
          status: 'success',
          details: 'User logged in successfully',
        },
        {
          id: '5',
          timestamp: '2024-01-15T10:10:00Z',
          tenant_id: 'tenant-2',
          tenant_name: 'TechStart Inc',
          user_id: 'user-5',
          user_name: 'Charlie Brown',
          user_email: 'charlie@techstart.com',
          action: 'export',
          resource_type: 'report',
          resource_id: 'report-202401',
          ip_address: '192.168.1.104',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success',
          details: 'Exported monthly sales report',
        },
        {
          id: '6',
          timestamp: '2024-01-15T10:05:00Z',
          tenant_id: 'tenant-1',
          tenant_name: 'Acme Corporation',
          user_id: 'user-1',
          user_name: 'John Doe',
          user_email: 'john@acme.com',
          action: 'update',
          resource_type: 'settings',
          resource_id: 'tenant-settings',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'warning',
          details: 'Updated tenant settings with potential security implications',
          changes: {
            before: { mfa_required: true },
            after: { mfa_required: false },
          },
        },
      ];

      setLogs(mockLogs);
      setStats({
        total_logs: mockLogs.length,
        success_count: mockLogs.filter(l => l.status === 'success').length,
        failure_count: mockLogs.filter(l => l.status === 'failure').length,
        active_tenants: new Set(mockLogs.map(l => l.tenant_id)).size,
      });
    } catch (error) {
      message.error('Failed to load audit logs');
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const filteredLogs = getFilteredLogs();

      if (format === 'csv') {
        const headers = [
          'Timestamp',
          'Tenant',
          'User',
          'Action',
          'Resource Type',
          'Resource ID',
          'Status',
          'IP Address',
          'Details',
        ];
        const rows = filteredLogs.map(log => [
          log.timestamp,
          log.tenant_name,
          log.user_name,
          log.action,
          log.resource_type,
          log.resource_id,
          log.status,
          log.ip_address,
          log.details,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.csv`;
        a.click();
      } else {
        const json = JSON.stringify(filteredLogs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.json`;
        a.click();
      }

      message.success(`Logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Failed to export logs');
      console.error('Export error:', error);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (searchText && !log.details.toLowerCase().includes(searchText.toLowerCase()) &&
          !log.user_name.toLowerCase().includes(searchText.toLowerCase()) &&
          !log.user_email.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (selectedTenant && log.tenant_id !== selectedTenant) return false;
      if (selectedAction && log.action !== selectedAction) return false;
      if (selectedResource && log.resource_type !== selectedResource) return false;
      if (selectedStatus && log.status !== selectedStatus) return false;
      if (dateRange) {
        const logDate = dayjs(log.timestamp);
        if (logDate.isBefore(dateRange[0]) || logDate.isAfter(dateRange[1])) {
          return false;
        }
      }
      return true;
    });
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(timestamp).format('YYYY-MM-DD')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(timestamp).format('HH:mm:ss')}
          </Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      width: 150,
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user_email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const colors: Record<string, string> = {
          create: 'green',
          update: 'blue',
          delete: 'red',
          login: 'purple',
          logout: 'orange',
          export: 'cyan',
        };
        return <Tag color={colors[action] || 'default'}>{action.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Resource',
      key: 'resource',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.resource_type}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.resource_id}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          success: 'success',
          failure: 'error',
          warning: 'warning',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const tenantOptions = Array.from(new Set(logs.map(l => l.tenant_id))).map(id => {
    const log = logs.find(l => l.tenant_id === id);
    return { label: log?.tenant_name || id, value: id };
  });

  const actionOptions = Array.from(new Set(logs.map(l => l.action))).map(action => ({
    label: action.toUpperCase(),
    value: action,
  }));

  const resourceOptions = Array.from(new Set(logs.map(l => l.resource_type))).map(type => ({
    label: type,
    value: type,
  }));

  return (
    <>
      <PageHeader
        title="System Audit Logs"
        description="View and analyze system-wide audit logs across all tenants"
        breadcrumb={{
          items: [
            { title: 'Super Admin', path: '/super-admin/dashboard' },
            { title: 'Audit Logs' },
          ],
        }}
        extra={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadLogs}>
            Refresh
          </Button>,
          <Button
            key="export-csv"
            icon={<DownloadOutlined />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>,
          <Button
            key="export-json"
            icon={<DownloadOutlined />}
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>,
        ]}
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Logs"
                value={stats.total_logs}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Successful Actions"
                value={stats.success_count}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Failed Actions"
                value={stats.failure_count}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Tenants"
                value={stats.active_tenants}
                prefix={<GlobalOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col xs={24} md={12} lg={6}>
                <Input
                  placeholder="Search logs..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Select
                  placeholder="Filter by tenant"
                  style={{ width: '100%' }}
                  value={selectedTenant}
                  onChange={setSelectedTenant}
                  options={tenantOptions}
                  allowClear
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Select
                  placeholder="Filter by action"
                  style={{ width: '100%' }}
                  value={selectedAction}
                  onChange={setSelectedAction}
                  options={actionOptions}
                  allowClear
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Select
                  placeholder="Filter by resource"
                  style={{ width: '100%' }}
                  value={selectedResource}
                  onChange={setSelectedResource}
                  options={resourceOptions}
                  allowClear
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12} lg={6}>
                <Select
                  placeholder="Filter by status"
                  style={{ width: '100%' }}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { label: 'Success', value: 'success' },
                    { label: 'Failure', value: 'failure' },
                    { label: 'Warning', value: 'warning' },
                  ]}
                  allowClear
                />
              </Col>
              <Col xs={24} md={12} lg={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={setDateRange}
                  showTime
                />
              </Col>
            </Row>
          </Space>
        </Card>

        {/* Logs Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={getFilteredLogs()}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} logs`,
            }}
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title="Audit Log Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedLog && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Timestamp">
                {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Tenant">
                <Tag color="blue">{selectedLog.tenant_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {selectedLog.user_name} ({selectedLog.user_email})
              </Descriptions.Item>
              <Descriptions.Item label="Action">
                <Tag color="blue">{selectedLog.action.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Resource Type">
                {selectedLog.resource_type}
              </Descriptions.Item>
              <Descriptions.Item label="Resource ID">
                {selectedLog.resource_id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={
                    selectedLog.status === 'success'
                      ? 'success'
                      : selectedLog.status === 'failure'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {selectedLog.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                {selectedLog.ip_address}
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                {selectedLog.user_agent}
              </Descriptions.Item>
              <Descriptions.Item label="Details">{selectedLog.details}</Descriptions.Item>
              {selectedLog.changes && (
                <>
                  <Descriptions.Item label="Before">
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      {JSON.stringify(selectedLog.changes.before, null, 2)}
                    </pre>
                  </Descriptions.Item>
                  <Descriptions.Item label="After">
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      {JSON.stringify(selectedLog.changes.after, null, 2)}
                    </pre>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          )}
        </Modal>
      </div>
    </>
  );
};

export default SuperAdminLogsPage;