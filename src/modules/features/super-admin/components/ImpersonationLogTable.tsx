/**
 * Impersonation Log Table Component
 * Displays audit logs of all impersonation sessions
 * 
 * Features:
 * - Sortable columns
 * - Pagination
 * - Date range filtering
 * - Super user/impersonated user filtering
 * - Duration calculation
 * - Detail view for each log
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  DatePicker,
  Tag,
  Spin,
  Empty,
  Row,
  Col,
  Drawer,
} from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useImpersonation } from '../hooks/useImpersonation';
import { ImpersonationLogType } from '@/types/superUserModule';
import dayjs from 'dayjs';

interface ImpersonationLogTableProps {
  /** Callback for detail view */
  onViewDetail?: (log: ImpersonationLogType) => void;
}

/**
 * ImpersonationLogTable Component
 * 
 * Displays impersonation audit logs with filtering and sorting
 */
export const ImpersonationLogTable: React.FC<ImpersonationLogTableProps> = ({
  onViewDetail,
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLog, setSelectedLog] = useState<ImpersonationLogType | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const { logs, loading } = useImpersonation();

  /**
   * Calculate duration between login and logout
   */
  const calculateDuration = (loginAt: string, logoutAt: string | null): string => {
    if (!logoutAt) return 'Ongoing';
    const start = new Date(loginAt).getTime();
    const end = new Date(logoutAt).getTime();
    const durationSeconds = Math.floor((end - start) / 1000);
    
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Filter logs based on search and date range
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
        ].join(' ');
        return searchFields.includes(lowerSearch);
      });
    }

    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      result = result.filter((log) => {
        const logDate = dayjs(log.loginAt);
        return logDate.isAfter(startDate.startOf('day')) &&
               logDate.isBefore(endDate.endOf('day'));
      });
    }

    return result;
  }, [logs, searchText, dateRange]);

  /**
   * Handle view detail
   */
  const handleViewDetail = (log: ImpersonationLogType) => {
    setSelectedLog(log);
    setDetailDrawerOpen(true);
    onViewDetail?.(log);
  };

  /**
   * Get status tag
   */
  const getStatusTag = (logoutAt: string | null) => {
    if (!logoutAt) {
      return <Tag color="blue">Active</Tag>;
    }
    return <Tag color="green">Completed</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Super User',
      dataIndex: 'superUserId',
      key: 'superUserId',
      width: 120,
      sorter: (a: ImpersonationLogType, b: ImpersonationLogType) =>
        (a.superUserId || '').localeCompare(b.superUserId || ''),
      render: (text: string) => <code className="text-xs">{text}</code>,
    },
    {
      title: 'Impersonated User',
      dataIndex: 'impersonatedUserId',
      key: 'impersonatedUserId',
      width: 140,
      sorter: (a: ImpersonationLogType, b: ImpersonationLogType) =>
        (a.impersonatedUserId || '').localeCompare(b.impersonatedUserId || ''),
      render: (text: string) => <code className="text-xs">{text}</code>,
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 120,
      sorter: (a: ImpersonationLogType, b: ImpersonationLogType) =>
        (a.tenantId || '').localeCompare(b.tenantId || ''),
      render: (text: string) => <code className="text-xs">{text}</code>,
    },
    {
      title: 'Start Time',
      dataIndex: 'loginAt',
      key: 'loginAt',
      width: 140,
      sorter: (a: ImpersonationLogType, b: ImpersonationLogType) =>
        new Date(a.loginAt || 0).getTime() -
        new Date(b.loginAt || 0).getTime(),
      render: (text: string) =>
        text ? new Date(text).toLocaleString() : 'N/A',
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_: string, record: ImpersonationLogType) =>
        calculateDuration(record.loginAt, record.logoutAt),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: string, record: ImpersonationLogType) =>
        getStatusTag(record.logoutAt),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <span title={text}>{text || '-'}</span>
      ),
    },
    {
      title: 'Actions',
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
    <div className="space-y-4">
      {/* Filters */}
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Input
            placeholder="Search by user ID, tenant, or reason..."
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
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      {/* Table */}
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
          showTotal: (total) => `Total ${total} impersonation logs`,
        }}
        loading={loading}
        locale={{
          emptyText: (
            <Empty description="No impersonation logs found" />
          ),
        }}
        scroll={{ x: 1400 }}
        className="bg-white rounded-lg"
      />

      {/* Detail Drawer */}
      <Drawer
        title="Impersonation Details"
        placement="right"
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
        width={500}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium text-xs text-gray-600">Super User ID</div>
              <code className="text-sm">{selectedLog.superUserId}</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-xs text-gray-600">Impersonated User ID</div>
              <code className="text-sm">{selectedLog.impersonatedUserId}</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-xs text-gray-600">Tenant ID</div>
              <code className="text-sm">{selectedLog.tenantId}</code>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-xs text-gray-600">Start Time</div>
              <div className="text-sm">
                {new Date(selectedLog.loginAt).toLocaleString()}
              </div>
            </div>
            {selectedLog.logoutAt && (
              <>
                <div className="space-y-2">
                  <div className="font-medium text-xs text-gray-600">End Time</div>
                  <div className="text-sm">
                    {new Date(selectedLog.logoutAt).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-xs text-gray-600">Duration</div>
                  <div className="text-sm">
                    {calculateDuration(selectedLog.loginAt, selectedLog.logoutAt)}
                  </div>
                </div>
              </>
            )}
            {selectedLog.reason && (
              <div className="space-y-2">
                <div className="font-medium text-xs text-gray-600">Reason</div>
                <div className="text-sm p-2 bg-gray-50 rounded">{selectedLog.reason}</div>
              </div>
            )}
            {selectedLog.ipAddress && (
              <div className="space-y-2">
                <div className="font-medium text-xs text-gray-600">IP Address</div>
                <code className="text-sm">{selectedLog.ipAddress}</code>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ImpersonationLogTable;