/**
 * Config Override Table Component
 * Displays table of tenant configuration overrides
 * 
 * Features:
 * - Sortable columns
 * - Pagination
 * - Edit/delete buttons
 * - Expiration date display
 * - Key search/filter
 * - Empty states
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Popconfirm,
  Spin,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { TenantConfigOverrideType } from '@/types/superUserModule';
import { toast } from 'sonner';

interface ConfigOverrideTableProps {
  /** Tenant ID to show overrides for */
  tenantId: string;
  
  /** Callback when edit is clicked */
  onEdit?: (override: TenantConfigOverrideType) => void;
  
  /** Callback when delete is clicked */
  onDelete?: (overrideId: string) => void;
  
  /** Callback when new config button is clicked */
  onCreateNew?: () => void;
  
  /** Whether to show create button */
  showCreateButton?: boolean;
}

/**
 * ConfigOverrideTable Component
 * 
 * Displays and manages configuration overrides for a tenant
 */
export const ConfigOverrideTable: React.FC<ConfigOverrideTableProps> = ({
  tenantId,
  onEdit,
  onDelete,
  onCreateNew,
  showCreateButton = true,
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { overrides, loading, deleteOverride } = useTenantConfig(tenantId);

  /**
   * Filter overrides by search text
   */
  const filteredData = useMemo(() => {
    if (!searchText) return overrides || [];

    const lowerSearch = searchText.toLowerCase();
    return (overrides || []).filter((override) => {
      const searchFields = [
        override.configKey?.toLowerCase() || '',
      ].join(' ');
      return searchFields.includes(lowerSearch);
    });
  }, [overrides, searchText]);

  /**
   * Handle delete override
   */
  const handleDelete = async (overrideId: string) => {
    try {
      await deleteOverride(overrideId);
      toast.success('Configuration override deleted');
      onDelete?.(overrideId);
    } catch (error) {
      toast.error('Failed to delete configuration override');
      console.error('Delete error:', error);
    }
  };

  /**
   * Check if override is expired
   */
  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  /**
   * Get expiration status
   */
  const getExpirationTag = (expiresAt: string | null) => {
    if (!expiresAt) {
      return <Tag color="blue">No Expiry</Tag>;
    }

    if (isExpired(expiresAt)) {
      return <Tag color="error">Expired</Tag>;
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 7) {
      return <Tag color="warning">Expiring in {daysUntilExpiry}d</Tag>;
    }

    return <Tag color="success">Active</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Config Key',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 150,
      sorter: (a: TenantConfigOverrideType, b: TenantConfigOverrideType) =>
        (a.configKey || '').localeCompare(b.configKey || ''),
      render: (text: string) => <code className="text-xs">{text}</code>,
    },
    {
      title: 'Value',
      dataIndex: 'configValue',
      key: 'configValue',
      width: 200,
      render: (value: any) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return (
          <code className="text-xs p-1 bg-gray-100 rounded break-all">
            {stringValue.substring(0, 100)}
            {stringValue.length > 100 ? '...' : ''}
          </code>
        );
      },
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
      sorter: (a: TenantConfigOverrideType, b: TenantConfigOverrideType) =>
        (a.createdBy || '').localeCompare(b.createdBy || ''),
      render: (text: string) => <span>{text || 'System'}</span>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: (a: TenantConfigOverrideType, b: TenantConfigOverrideType) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Expiration',
      key: 'expiration',
      width: 130,
      render: (_: string, record: TenantConfigOverrideType) =>
        getExpirationTag(record.expiresAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: string, record: TenantConfigOverrideType) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
            title="Edit"
          />
          <Popconfirm
            title="Delete Override"
            description="Are you sure you want to delete this configuration override?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" tip="Loading configuration overrides..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Create Button */}
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Input
            placeholder="Search by config key..."
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
        {showCreateButton && (
          <Col>
            <Button
              type="primary"
              onClick={onCreateNew}
              size="large"
            >
              + New Override
            </Button>
          </Col>
        )}
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize,
          total: filteredData.length,
          onChange: setCurrentPage,
          onShowSizeChange: (_, size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} overrides`,
        }}
        loading={loading}
        locale={{
          emptyText: filteredData.length === 0 ? (
            <Empty description="No configuration overrides" />
          ) : undefined,
        }}
        scroll={{ x: 1000 }}
        className="bg-white rounded-lg"
      />
    </div>
  );
};

export default ConfigOverrideTable;