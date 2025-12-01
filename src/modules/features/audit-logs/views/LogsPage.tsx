/**
 * Logs Page - Enterprise Design
 * Audit log viewer with advanced filtering and export
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Tag, 
  Space, 
  Modal,
  Descriptions,
  message,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  SearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { 
  FileText,
  Activity,
  User,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services/serviceFactory';
import dayjs, { Dayjs } from 'dayjs';
import type { AuditLog } from '@/types';

const { RangePicker } = DatePicker;

interface AuditLogFilters {
  search?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const LogsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchLogs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const filters: AuditLogFilters = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (actionFilter) filters.action = actionFilter;
      if (resourceFilter) filters.resource = resourceFilter;
      if (dateRange[0]) filters.dateFrom = dateRange[0].toISOString();
      if (dateRange[1]) filters.dateTo = dateRange[1].toISOString();

      const data = await auditService.getAuditLogs(filters);
      setLogs(data);
    } catch (error: unknown) {
      console.error('Failed to fetch logs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, actionFilter, resourceFilter, dateRange]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const filters: AuditLogFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (actionFilter) filters.action = actionFilter;
      if (resourceFilter) filters.resource = resourceFilter;
      if (dateRange[0]) filters.dateFrom = dateRange[0].toISOString();
      if (dateRange[1]) filters.dateTo = dateRange[1].toISOString();

      const blob = await auditService.exportAuditLogs(filters, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(`Logs exported as ${format.toUpperCase()}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export logs';
      message.error(errorMessage);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'processing';
      case 'DELETE':
        return 'error';
      case 'LOGIN':
        return 'cyan';
      case 'LOGOUT':
        return 'default';
      case 'EXPORT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getResourceColor = (resource: string) => {
    const colors: Record<string, string> = {
      customer: 'blue',
      deal: 'green',
      contract: 'purple',
      ticket: 'orange',
      user: 'magenta',
      auth: 'cyan',
      product: 'geekblue',
      company: 'gold'
    };
    return colors[resource.toLowerCase()] || 'default';
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'user',
      width: 150,
      render: (_, record) => (
        <Tooltip title={record.user.email}>
          <Space>
            <User size={14} />
            {record.user.name}
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
      render: (resource) => (
        <Tag color={getResourceColor(resource)}>
          {resource.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Resource ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 120,
      ellipsis: true
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      )
    }
  ];

  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.createdAt);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    creates: logs.filter(log => log.action === 'CREATE').length,
    updates: logs.filter(log => log.action === 'UPDATE').length
  };

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="View system audit logs and user activity"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/dashboard' },
            { title: 'Audit Logs' }
          ]
        }}
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchLogs}
            >
              Refresh
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExport('csv')}
              disabled={!hasPermission('crm:audit:log:export')}
            >
              Export CSV
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExport('json')}
              disabled={!hasPermission('crm:audit:log:export')}
            >
              Export JSON
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Logs"
              value={stats.total}
              description="All audit logs"
              icon={FileText}
              color="primary"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Today's Activity"
              value={stats.today}
              description="Logs from today"
              icon={Activity}
              color="info"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Creates"
              value={stats.creates}
              description="Create operations"
              icon={FileText}
              color="success"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Updates"
              value={stats.updates}
              description="Update operations"
              icon={AlertCircle}
              color="warning"
              loading={loading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Search logs..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Filter by action"
                value={actionFilter}
                onChange={setActionFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="">All Actions</Select.Option>
                <Select.Option value="CREATE">Create</Select.Option>
                <Select.Option value="UPDATE">Update</Select.Option>
                <Select.Option value="DELETE">Delete</Select.Option>
                <Select.Option value="LOGIN">Login</Select.Option>
                <Select.Option value="LOGOUT">Logout</Select.Option>
                <Select.Option value="EXPORT">Export</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={5}>
              <Select
                placeholder="Filter by resource"
                value={resourceFilter}
                onChange={setResourceFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="">All Resources</Select.Option>
                <Select.Option value="customer">Customer</Select.Option>
                <Select.Option value="deal">Deal</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
                <Select.Option value="ticket">Ticket</Select.Option>
                <Select.Option value="user">User</Select.Option>
                <Select.Option value="auth">Auth</Select.Option>
                <Select.Option value="product">Product</Select.Option>
                <Select.Option value="company">Company</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>
        </Card>

        {/* Logs Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} logs`
            }}
          />
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        title="Audit Log Details"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Log ID" span={2}>
                {selectedLog.id}
              </Descriptions.Item>
              <Descriptions.Item label="Action">
                <Tag color={getActionColor(selectedLog.action)}>
                  {selectedLog.action.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Resource">
                <Tag color={getResourceColor(selectedLog.resource)}>
                  {selectedLog.resource.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Resource ID" span={2}>
                {selectedLog.resourceId}
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {selectedLog.user.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedLog.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                {selectedLog.ipAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {new Date(selectedLog.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="User Agent" span={2}>
                <div style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                  {selectedLog.userAgent}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.changes && (
              <Card title="Changes" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <h4>Before:</h4>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: 12, 
                      borderRadius: 4,
                      fontSize: 12,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(selectedLog.changes.before, null, 2)}
                    </pre>
                  </Col>
                  <Col span={12}>
                    <h4>After:</h4>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: 12, 
                      borderRadius: 4,
                      fontSize: 12,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(selectedLog.changes.after, null, 2)}
                    </pre>
                  </Col>
                </Row>
              </Card>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <Card title="Metadata" size="small">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};

export default LogsPage;