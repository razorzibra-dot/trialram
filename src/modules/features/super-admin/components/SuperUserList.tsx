/**
 * Super User List Component
 * Displays super users in a sortable, filterable, paginated table format
 * 
 * Features:
 * - Table with sortable columns
 * - Search/filter functionality
 * - Pagination support
 * - Actions (Edit, View Details, Delete)
 * - Loading and error states
 * 
 * @component
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
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
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useSuperAdminList, useDemoteSuperAdmin } from '../hooks';
import type { SuperAdminDTO } from '../hooks';
import { toast } from 'sonner';

interface SuperUserListProps {
  /** Callback when a super user is selected for details view */
  onSelectSuperUser?: (superUser: SuperAdminDTO) => void;
  
  /** Callback when edit action is clicked */
  onEdit?: (superUser: SuperAdminDTO) => void;
  
  /** Callback when delete action is clicked */
  onDelete?: (superUserId: string) => void;
  
  /** Whether to show action buttons */
  showActions?: boolean;
}

/**
 * SuperUserList Component
 * 
 * Renders a table of all super admins with options to view details, edit, or demote
 */
export const SuperUserList: React.FC<SuperUserListProps> = ({
  onSelectSuperUser,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const {
    superUsers,
    isLoading,
    error,
  } = useSuperAdminList();

  const {
    mutate: demoteSuperAdmin,
    isPending: isDemoting,
  } = useDemoteSuperAdmin();

  // Filter super users based on search text
  const filteredData = useMemo(() => {
    if (!searchText) return superUsers || [];
    
    const lowerSearch = searchText.toLowerCase();
    return (superUsers || []).filter((user) => {
      const searchFields = [
        user.userId?.toLowerCase() || '',
        user.accessLevel?.toLowerCase() || '',
      ].join(' ');
      return searchFields.includes(lowerSearch);
    });
  }, [superUsers, searchText]);

  // Handle delete action
  const handleDelete = async (superUserId: string) => {
    try {
      await deleteSuperUser(superUserId);
      toast.success('Super user deleted successfully');
      onDelete?.(superUserId);
    } catch (err) {
      toast.error('Failed to delete super user');
      console.error('Delete error:', err);
    }
  };

  // Table columns definition
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      sorter: (a: SuperAdminDTO, b: SuperAdminDTO) =>
        (a.email || '').localeCompare(b.email || ''),
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a: SuperAdminDTO, b: SuperAdminDTO) =>
        (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: (a: SuperAdminDTO, b: SuperAdminDTO) =>
        (a.status || '').localeCompare(b.status || ''),
      render: (text: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          inactive: 'red',
          pending: 'orange',
          suspended: 'volcano',
        };
        return <Tag color={colors[text] || 'default'}>{text || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: SuperAdminDTO, b: SuperAdminDTO) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: string, record: SuperAdminDTO) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onSelectSuperUser?.(record)}
            title="View Details"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
            title="Edit"
          />
          <Popconfirm
            title="Demote Super Admin"
            description="Are you sure you want to remove this user's super admin status?"
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDemote(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isDemoting}
              title="Demote"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" tip="Loading super users..." />
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        description="Error loading super users"
        style={{ marginTop: 48, marginBottom: 48 }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Row gutter={16}>
        <Col flex="auto">
          <Input
            placeholder="Search by email, name, or first/last name..."
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
          showTotal: (total) => `Total ${total} super users`,
        }}
        loading={isLoading}
        locale={{
          emptyText: filteredData.length === 0 ? (
            <Empty description="No super users found" />
          ) : undefined,
        }}
        scroll={{ x: 1200 }}
        className="bg-white rounded-lg"
      />
    </div>
  );
};

export default SuperUserList;