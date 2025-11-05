/**
 * Super Admin Logs Page - Audit & Impersonation Logs
 * Comprehensive audit trail and impersonation session monitoring
 * 
 * **Layer Synchronization**: 
 * - Uses factory-routed hooks from Phase 7
 * - Displays Phase 8 components (ImpersonationLogTable)
 * - Integrates with Phase 5 service factory pattern
 * - No direct service imports (hooks only)
 * 
 * **Features**:
 * - View impersonation audit logs
 * - Filter by date range, user, tenant
 * - Search functionality
 * - Export to CSV
 * - Detail view for each session
 * - Track all admin actions
 */
import React, { useState } from 'react';
import { Row, Col, Card, Button, Space, Alert, Drawer, DatePicker, Select, Input, Table, Tag, Badge } from 'antd';
import { 
  ReloadOutlined,
  ExportOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { LogOut, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { 
  useImpersonation,
  useSuperUserManagement
} from '@/modules/features/super-admin/hooks';
import { 
  ImpersonationLogTable
} from '@/modules/features/super-admin/components';
import { toast } from 'sonner';
import dayjs from 'dayjs';

/**
 * Logs page with comprehensive audit trail
 * Tracks all impersonation sessions and admin actions
 */
const SuperAdminLogsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Hooks for data management with factory routing
  const { 
    impersonationLogs = [],
    isLoading: logsLoading,
    error: logsError,
    getLogsWithFilters
  } = useImpersonation();
  
  const {
    superUsers = [],
    isLoading: usersLoading
  } = useSuperUserManagement();

  // UI State
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedSuperUser, setSelectedSuperUser] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'ended'>('all');

  // Permission check
  if (!hasPermission('super_user:view_audit_logs')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to view audit logs."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isLoading = logsLoading || usersLoading;

  // Filter logs based on current filters
  const filteredLogs = impersonationLogs.filter(log => {
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const logDate = dayjs(log.loginAt);
      if (!logDate.isBetween(dateRange[0], dateRange[1], null, '[]')) {
        return false;
      }
    }

    // Super user filter
    if (selectedSuperUser && log.superUserId !== selectedSuperUser) {
      return false;
    }

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      if (
        !log.superUserId?.toLowerCase().includes(searchLower) &&
        !log.impersonatedUserId?.toLowerCase().includes(searchLower) &&
        !log.tenantId?.toLowerCase().includes(searchLower) &&
        !log.reason?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Status filter
    if (filterMode === 'active' && log.logoutAt) return false;
    if (filterMode === 'ended' && !log.logoutAt) return false;

    return true;
  });

  // Calculate statistics
  const activeSessions = impersonationLogs.filter(log => !log.logoutAt).length;
  const totalSessions = impersonationLogs.length;
  const totalDuration = impersonationLogs.reduce((sum, log) => {
    if (log.loginAt && log.logoutAt) {
      const start = new Date(log.loginAt).getTime();
      const end = new Date(log.logoutAt).getTime();
      return sum + (end - start);
    }
    return sum;
  }, 0);
  const avgDurationMinutes = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60000) : 0;

  // Handle export
  const handleExport = () => {
    try {
      const csv = [
        ['Super User', 'Impersonated User', 'Tenant', 'Login Time', 'Logout Time', 'Duration', 'Reason'],
        ...filteredLogs.map(log => [
          log.superUserId,
          log.impersonatedUserId,
          log.tenantId,
          new Date(log.loginAt).toLocaleString(),
          log.logoutAt ? new Date(log.logoutAt).toLocaleString() : 'Active',
          log.logoutAt ? `${Math.round((new Date(log.logoutAt).getTime() - new Date(log.loginAt).getTime()) / 60000)} min` : 'Ongoing',
          log.reason || 'N/A'
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impersonation-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setDateRange(null);
    setSelectedSuperUser('');
    setSearchText('');
    setFilterMode('all');
  };

  return (
    <>
      <PageHeader
        title="Audit & Impersonation Logs"
        description="Monitor all impersonation sessions and administrative actions"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => window.location.reload()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Error alerts */}
        {logsError && (
          <Alert
            message="Error loading logs"
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Sessions"
              value={totalSessions}
              description={`${totalSessions} impersonations recorded`}
              icon={LogOut}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Sessions"
              value={activeSessions}
              description={`${activeSessions} currently active`}
              icon={LogOut}
              color={activeSessions > 0 ? 'warning' : 'success'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Avg Duration"
              value={`${avgDurationMinutes}m`}
              description="Average session length"
              icon={Clock}
              color="info"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Super Users"
              value={superUsers.length}
              description={`${superUsers.length} administrators`}
              icon={User}
              color="success"
              loading={usersLoading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={6}>
            <Input
              placeholder="Search by user, tenant, or reason..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} lg={6}>
            <Select
              placeholder="Filter by super user"
              value={selectedSuperUser || undefined}
              onChange={setSelectedSuperUser}
              allowClear
              optionLabelProp="label"
            >
              {superUsers.map(user => (
                <Select.Option key={user.id} value={user.userId}>
                  {user.userId}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} lg={6}>
            <Select
              placeholder="Filter by status"
              value={filterMode}
              onChange={setFilterMode}
            >
              <Select.Option value="all">All Sessions</Select.Option>
              <Select.Option value="active">Active Only</Select.Option>
              <Select.Option value="ended">Ended Only</Select.Option>
            </Select>
          </Col>
          <Col xs={24} lg={6}>
            <Button 
              block 
              onClick={handleResetFilters}
              type="default"
            >
              Reset Filters
            </Button>
          </Col>
        </Row>

        {/* Date Range Picker */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
            />
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ color: '#999', fontSize: 12 }}>
              Showing {filteredLogs.length} of {impersonationLogs.length} logs
            </div>
          </Col>
        </Row>

        {/* Logs Table */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card variant="borderless" loading={isLoading}>
              <ImpersonationLogTable
                logs={filteredLogs}
                onViewDetails={(log) => {
                  setSelectedLog(log);
                  setIsDetailDrawerOpen(true);
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Detail Drawer */}
      <Drawer
        title="Impersonation Session Details"
        placement="right"
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        width={500}
      >
        {isDetailDrawerOpen && selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Super User ID:</strong> {selectedLog.superUserId}
                </div>
                <div>
                  <strong>Impersonated User:</strong> {selectedLog.impersonatedUserId}
                </div>
                <div>
                  <strong>Tenant ID:</strong> {selectedLog.tenantId}
                </div>
                <div>
                  <strong>Login Time:</strong> {new Date(selectedLog.loginAt).toLocaleString()}
                </div>
                {selectedLog.logoutAt && (
                  <div>
                    <strong>Logout Time:</strong> {new Date(selectedLog.logoutAt).toLocaleString()}
                  </div>
                )}
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge
                    status={selectedLog.logoutAt ? 'default' : 'success'}
                    text={selectedLog.logoutAt ? 'Ended' : 'Active'}
                  />
                </div>
                {selectedLog.reason && (
                  <div>
                    <strong>Reason:</strong> {selectedLog.reason}
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <strong>IP Address:</strong> {selectedLog.ipAddress}
                  </div>
                )}
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  );
};

export default SuperAdminLogsPage;