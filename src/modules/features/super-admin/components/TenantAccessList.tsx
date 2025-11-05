/**
 * Tenant Access List Component
 * Displays list of tenants accessible by a super user
 * 
 * Features:
 * - Sortable columns
 * - Pagination
 * - Grant/revoke access buttons
 * - Access level display
 * - Loading and empty states
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Spin,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  LinkOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTenantAccess } from '../hooks/useTenantAccess';
import { TenantAccessType } from '@/types/superUserModule';
import { toast } from 'sonner';

interface TenantAccessListProps {
  /** Super user ID to show access for */
  superUserId: string;
  
  /** Callback when grant access is clicked */
  onGrantAccess?: () => void;
  
  /** Callback when revoke access is clicked */
  onRevokeAccess?: (superUserId: string, tenantId: string) => void;
  
  /** Whether to show grant button */
  showGrantButton?: boolean;
}

/**
 * TenantAccessList Component
 * 
 * Displays tenants and access levels for a specific super user
 */
export const TenantAccessList: React.FC<TenantAccessListProps> = ({
  superUserId,
  onGrantAccess,
  onRevokeAccess,
  showGrantButton = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [revoking, setRevoking] = useState<string | null>(null);

  const { accessList, loading, error, refetch } = useTenantAccess(superUserId);

  /**
   * Handle revoke access
   */
  const handleRevoke = async (tenantId: string) => {
    try {
      setRevoking(tenantId);
      onRevokeAccess?.(superUserId, tenantId);
      await refetch();
      toast.success('Tenant access revoked successfully');
    } catch (err) {
      toast.error('Failed to revoke tenant access');
      console.error('Revoke error:', err);
    } finally {
      setRevoking(null);
    }
  };

  // Memoized table data
  const tableData = useMemo(
    () => accessList || [],
    [accessList]
  );

  // Table columns definition
  const columns = [
    {
      title: 'Tenant ID',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 150,
      sorter: (a: TenantAccessType, b: TenantAccessType) =>
        (a.tenantId || '').localeCompare(b.tenantId || ''),
      render: (text: string) => <code className="text-xs">{text}</code>,
    },
    {
      title: 'Access Level',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 120,
      sorter: (a: TenantAccessType, b: TenantAccessType) =>
        (a.accessLevel || '').localeCompare(b.accessLevel || ''),
      render: (text: string) => {
        const colors: Record<string, string> = {
          full: 'red',
          limited: 'orange',
          read_only: 'blue',
          specific_modules: 'green',
        };
        return <Tag color={colors[text] || 'default'}>{text || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: (a: TenantAccessType, b: TenantAccessType) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      sorter: (a: TenantAccessType, b: TenantAccessType) =>
        new Date(a.updatedAt || 0).getTime() -
        new Date(b.updatedAt || 0).getTime(),
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: string, record: TenantAccessType) => (
        <Popconfirm
          title="Revoke Tenant Access"
          description={`Are you sure you want to revoke access to this tenant?`}
          okText="Yes, Revoke"
          okType="danger"
          cancelText="Cancel"
          onConfirm={() => handleRevoke(record.tenantId)}
        >
          <Button
            type="text"
            size="small"
            danger
            icon={<DisconnectOutlined />}
            loading={revoking === record.tenantId}
            title="Revoke Access"
          />
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" tip="Loading tenant access..." />
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        description="Error loading tenant access"
        style={{ marginTop: 48, marginBottom: 48 }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Grant Button */}
      {showGrantButton && (
        <Row justify="space-between" align="middle">
          <Col>
            <span className="text-sm text-gray-600">
              {tableData.length} tenant{tableData.length !== 1 ? 's' : ''} accessible
            </span>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={onGrantAccess}
              size="small"
            >
              Grant Access
            </Button>
          </Col>
        </Row>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize,
          total: tableData.length,
          onChange: setCurrentPage,
          onShowSizeChange: (_, size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} entries`,
        }}
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              description="No tenant access"
              style={{ marginTop: 24, marginBottom: 24 }}
            />
          ),
        }}
        scroll={{ x: 800 }}
        className="bg-white rounded-lg"
        size="small"
      />
    </div>
  );
};

export default TenantAccessList;