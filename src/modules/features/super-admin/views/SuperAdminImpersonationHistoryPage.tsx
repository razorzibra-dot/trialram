/**
 * Super Admin Impersonation History Page
 * Displays all past and current impersonation sessions with detailed tracking
 * 
 * Features:
 * - Table of all impersonation sessions with full audit trail
 * - Filters by date range, user, tenant
 * - Pagination and sorting
 * - Detailed view of each session showing:
 *   - Session metadata (user, tenant, time, duration, reason)
 *   - Actions taken during impersonation (from actionsTaken array)
 *   - IP address and timestamps
 * - Real-time updates for active sessions
 * 
 * Architecture:
 * - Uses useImpersonationLogs hook for data fetching
 * - Uses useImpersonationActionTracker for action tracking details
 * - Integrated with React Query for caching and synchronization
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Empty,
  Spin,
  DatePicker,
  Input,
  Button,
  Table,
  Drawer,
  Divider,
  Timeline,
  Tooltip,
  Alert,
  Select,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BgColorsOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useImpersonationLogs } from '../hooks/useImpersonation';
import { ImpersonationLogType, ImpersonationAction } from '@/types/superUserModule';
import dayjs from 'dayjs';

interface DetailDrawerProps {
  log: ImpersonationLogType | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Detailed view drawer for impersonation session
 * Shows complete session information and all actions taken
 */
const ImpersonationDetailDrawer: React.FC<DetailDrawerProps> = ({
  log,
  open,
  onClose,
}) => {
  const calculateDuration = (
    loginAt: string,
    logoutAt: string | null
  ): string => {
    if (!logoutAt) return 'Ongoing';
    const start = new Date(loginAt).getTime();
    const end = new Date(logoutAt).getTime();
    const durationMs = end - start;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getActionIcon = (actionType: string): string => {
    const iconMap: Record<string, string> = {
      PAGE_VIEW: '📄',
      API_CALL: '🔌',
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      EXPORT: '📥',
      SEARCH: '🔍',
      PRINT: '🖨️',
    };
    return iconMap[actionType] || '📋';
  };

  const getActionColor = (actionType: string): string => {
    const colorMap: Record<string, string> = {
      PAGE_VIEW: 'blue',
      API_CALL: 'cyan',
      CREATE: 'green',
      UPDATE: 'orange',
      DELETE: 'red',
      EXPORT: 'purple',
      SEARCH: 'geekblue',
      PRINT: 'volcano',
    };
    return colorMap[actionType] || 'default';
  };

  // Group actions by type
  const actionsByType = useMemo(() => {
    if (!log || !log.actionsTaken) return {};
    return log.actionsTaken.reduce(
      (acc, action) => {
        const actionTypeKey = action.actionType;
        if (!acc[actionTypeKey]) {
          acc[actionTypeKey] = [];
        }
        acc[actionTypeKey].push(action);
        return acc;
      },
      {} as Record<string, ImpersonationAction[]>
    );
  }, [log]);

  if (!log) return null;

  const isActive = !log.logoutAt;
  const duration = calculateDuration(log.loginAt, log.logoutAt);
  const actionCount = log.actionsTaken?.length || 0;

  return (
    <Drawer
      title={
        <Space>
          <span>Impersonation Session Details</span>
          {isActive && <Tag color="blue">Active</Tag>}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      bodyStyle={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
    >
      <Space direction="vertical" className="w-full" size="large">
        {/* Session Status Alert */}
        {isActive && (
          <Alert
            message="This session is currently active"
            type="info"
            showIcon
            closable={false}
          />
        )}

        {/* Session Overview */}
        <Card size="small" title="Session Overview" className="bg-gray-50">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Super User"
                value={log.superUserId || 'N/A'}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Impersonated User"
                value={log.impersonatedUserId || 'N/A'}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Tenant ID"
                value={log.tenantId || 'N/A'}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Duration"
                value={duration}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* Timing Information */}
        <Card size="small" title="Timing">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div className="text-xs text-gray-600 font-medium">Start Time</div>
              <div className="text-sm font-mono">
                {new Date(log.loginAt).toLocaleString()}
              </div>
            </Col>
            {log.logoutAt && (
              <Col span={24}>
                <div className="text-xs text-gray-600 font-medium">End Time</div>
                <div className="text-sm font-mono">
                  {new Date(log.logoutAt).toLocaleString()}
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {/* Reason */}
        {log.reason && (
          <Card size="small" title="Reason">
            <div className="p-2 bg-gray-50 rounded text-sm">{log.reason}</div>
          </Card>
        )}

        {/* IP Address */}
        {log.ipAddress && (
          <Card size="small" title="Network">
            <div className="text-xs text-gray-600 font-medium">IP Address</div>
            <div className="text-sm font-mono">{log.ipAddress}</div>
          </Card>
        )}

        {/* Actions Summary */}
        <Card size="small" title="Actions Summary">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Statistic
                title="Total Actions Tracked"
                value={actionCount}
                prefix={<BgColorsOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            {Object.entries(actionsByType).map(([actionType, actions]) => (
              <Col span={12} key={actionType}>
                <Statistic
                  title={actionType}
                  value={actions.length}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            ))}
          </Row>
        </Card>

        {/* Detailed Action Timeline */}
        {log.actionsTaken && log.actionsTaken.length > 0 ? (
          <Card size="small" title={`Action Timeline (${actionCount} actions)`}>
            <Timeline
              items={log.actionsTaken.map((action, idx) => ({
                key: idx,
                color: action.actionType === 'DELETE' ? 'red' : 
                       action.actionType === 'CREATE' ? 'green' :
                       action.actionType === 'UPDATE' ? 'orange' : 'blue',
                children: (
                  <div className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getActionIcon(action.actionType)}</span>
                      <Tag color={getActionColor(action.actionType)}>
                        {action.actionType}
                      </Tag>
                      <span className="text-gray-600">
                        {new Date(action.timestamp || 0).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {action.resource && (
                        <div>
                          <span className="text-gray-600">Resource:</span>{' '}
                          <code className="text-xs">{action.resource}</code>
                        </div>
                      )}
                      {action.resourceId && (
                        <div>
                          <span className="text-gray-600">ID:</span>{' '}
                          <code className="text-xs">{action.resourceId}</code>
                        </div>
                      )}
                      {action.method && (
                        <div>
                          <span className="text-gray-600">Method:</span>{' '}
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {action.method}
                          </code>
                        </div>
                      )}
                      {action.statusCode && (
                        <div>
                          <span className="text-gray-600">Status:</span>{' '}
                          <Tag color={action.statusCode < 400 ? 'green' : 'red'}>
                            {action.statusCode}
                          </Tag>
                        </div>
                      )}
                      {action.duration && (
                        <div>
                          <span className="text-gray-600">Duration:</span>{' '}
                          <span>{action.duration}ms</span>
                        </div>
                      )}
                      {action.metadata && (
                        <div>
                          <span className="text-gray-600">Metadata:</span>{' '}
                          <code className="text-xs">
                            {JSON.stringify(action.metadata).substring(0, 80)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        ) : (
          <Card size="small" title="Actions">
            <Empty description="No actions tracked in this session" />
          </Card>
        )}
      </Space>
    </Drawer>
  );
};

/**
 * Super Admin Impersonation History Page
 * Main page component displaying all impersonation sessions
 */
const SuperAdminImpersonationHistoryPage: React.FC = () => {
  const { data: logs, isLoading, error } = useImpersonationLogs();
  const [selectedLog, setSelectedLog] = useState<ImpersonationLogType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /**
   * Filter and process logs
   */
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    let result = [...logs];

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter((log) => {
        const searchFields = [
          log.superUserId?.toLowerCase() || '',
          log.impersonatedUserId?.toLowerCase() || '',
          log.tenantId?.toLowerCase() || '',
          log.reason?.toLowerCase() || '',
          log.ipAddress?.toLowerCase() || '',
        ].join(' ');
        return searchFields.includes(lowerSearch);
      });
    }

    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      result = result.filter((log) => {
        const logDate = dayjs(log.loginAt);
        return (
          logDate.isAfter(startDate.startOf('day')) &&
          logDate.isBefore(endDate.endOf('day'))
        );
      });
    }

    // Filter by status
    if (statusFilter === 'active') {
      result = result.filter((log) => !log.logoutAt);
    } else if (statusFilter === 'completed') {
      result = result.filter((log) => log.logoutAt);
    }

    return result;
  }, [logs, searchText, dateRange, statusFilter]);

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    if (!logs) return { total: 0, active: 0, completed: 0, totalActions: 0 };

    const total = logs.length;
    const active = logs.filter((log) => !log.logoutAt).length;
    const completed = total - active;
    const totalActions = logs.reduce((sum, log) => sum + (log.actionsTaken?.length || 0), 0);

    return { total, active, completed, totalActions };
  }, [logs]);

  /**
   * Handle view detail
   */
  const handleViewDetail = (log: ImpersonationLogType) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  /**
   * Format duration helper
   */
  const formatDuration = (loginAt: string, logoutAt: string | null): string => {
    if (!logoutAt) return 'Ongoing';
    const durationMs = new Date(logoutAt).getTime() - new Date(loginAt).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Table columns
  const columns = [
    {
      title: 'Start Time',
      dataIndex: 'loginAt',
      key: 'loginAt',
      width: 140,
      sorter: (a: ImpersonationLogType, b: ImpersonationLogType) =>
        new Date(a.loginAt).getTime() - new Date(b.loginAt).getTime(),
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'Super Admin',
      dataIndex: 'superUserId',
      key: 'superUserId',
      width: 120,
      render: (text: string) => (
        <Tooltip title={text}>
          <code className="text-xs">{text?.substring(0, 8)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'User',
      dataIndex: 'impersonatedUserId',
      key: 'impersonatedUserId',
      width: 120,
      render: (text: string) => (
        <Tooltip title={text}>
          <code className="text-xs">{text?.substring(0, 8)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 100,
      render: (text: string) => (
        <Tooltip title={text}>
          <code className="text-xs">{text?.substring(0, 8)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_: string, record: ImpersonationLogType) =>
        formatDuration(record.loginAt, record.logoutAt),
    },
    {
      title: 'Actions',
      key: 'actionCount',
      width: 80,
      render: (_: string, record: ImpersonationLogType) => (
        <Tag color="blue">{record.actionsTaken?.length || 0}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: string, record: ImpersonationLogType) =>
        record.logoutAt ? (
          <Tag color="green">Completed</Tag>
        ) : (
          <Tag color="blue">Active</Tag>
        ),
    },
    {
      title: 'Details',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: string, record: ImpersonationLogType) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          title="View Details"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Impersonation History</h1>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => {
            // TODO: Implement export functionality
          }}
        >
          Export
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={stats.active}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: stats.active > 0 ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Sessions"
              value={stats.completed}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#666' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Actions Tracked"
              value={stats.totalActions}
              prefix={<BgColorsOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="bg-gray-50">
        <Space direction="vertical" className="w-full" size="middle">
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by user ID, tenant, reason, or IP..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
                size="large"
              />
            </Col>
            <Col>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates ? [dates[0]!, dates[1]!] : null);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '140px' }}
              >
                <Select.Option value="all">All Statuses</Select.Option>
                <Select.Option value="active">Active Only</Select.Option>
                <Select.Option value="completed">Completed Only</Select.Option>
              </Select>
            </Col>
          </Row>
          <div className="text-xs text-gray-600">
            Showing {filteredLogs.length} of {logs?.length || 0} sessions
          </div>
        </Space>
      </Card>

      {/* Error State */}
      {error && (
        <Alert
          type="error"
          message="Error loading impersonation history"
          description={error instanceof Error ? error.message : 'Unknown error'}
          showIcon
        />
      )}

      {/* Table */}
      <Card>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredLogs.length,
              onChange: setCurrentPage,
              onShowSizeChange: (_, size) => {
                setPageSize(size);
                setCurrentPage(1);
              },
              showSizeChanger: true,
              showTotal: (total) => `${total} sessions`,
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: (
                <Empty description="No impersonation sessions found" />
              ),
            }}
          />
        </Spin>
      </Card>

      {/* Detail Drawer */}
      <ImpersonationDetailDrawer
        log={selectedLog}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};

export default SuperAdminImpersonationHistoryPage;