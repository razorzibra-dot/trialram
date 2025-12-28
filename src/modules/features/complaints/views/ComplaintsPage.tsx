/**
 * Complaints Page - Enterprise Design
 * Main page for managing customer complaints with statistics and inline Ant Design table
 */

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, message, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageHeader, StatCard } from '@/components/common';
import { ComplaintsDetailPanel } from '../components/ComplaintsDetailPanel';
import { ComplaintsFormPanel } from '../components/ComplaintsFormPanel';
import { useComplaints, useComplaintStats, useDeleteComplaint } from '../hooks/useComplaints';
import { Complaint } from '@/types/complaints';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

type DrawerMode = 'create' | 'edit' | 'view' | null;

export const ComplaintsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data: stats, isLoading: statsLoading } = useComplaintStats();
  const { data: complaintsData, isLoading: complaintsLoading } = useComplaints();
  const deleteComplaint = useDeleteComplaint();

  // Database-driven color lookups
  const { getColor: getStatusColor } = useReferenceDataLookup('complaint_status');
  const { getColor: getPriorityColor } = useReferenceDataLookup('complaint_priority');

  // State management
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);

  // Filtered data based on search and filters
  const filteredComplaints = useMemo(() => {
    let result = complaintsData || [];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (complaint) =>
          complaint.title.toLowerCase().includes(search) ||
          complaint.description?.toLowerCase().includes(search) ||
          complaint.customer_name?.toLowerCase().includes(search) ||
          complaint.id.includes(search)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((complaint) => complaint.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      result = result.filter((complaint) => complaint.priority === priorityFilter);
    }

    return result;
  }, [complaintsData, searchText, statusFilter, priorityFilter]);

  // Handler functions
  const handleCreate = () => {
    setSelectedComplaint(null);
    setDrawerMode('create');
  };

  const handleView = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDrawerMode('view');
  };

  const handleEdit = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDrawerMode('edit');
  };

  const handleDelete = async (complaint: Complaint) => {
    try {
      await deleteComplaint.mutateAsync(complaint.id);
      message.success('Complaint deleted successfully');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      message.error('Failed to delete complaint');
    }
  };

  const handleDrawerClose = () => {
    setDrawerMode(null);
    setSelectedComplaint(null);
  };

  const handleEditFromDetail = () => {
    setDrawerMode('edit');
  };

  // Table columns configuration
  const columns: ColumnsType<Complaint> = [
    {
      title: 'Complaint ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{id.substring(0, 8)}</span>,
      sorter: (a: Complaint, b: Complaint) => a.id.localeCompare(b.id),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Complaint) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#666', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
      sorter: (a: Complaint, b: Complaint) => a.title.localeCompare(b.title),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text: string) => text || <span style={{ color: '#999' }}>Unassigned</span>,
      sorter: (a: Complaint, b: Complaint) => (a.customer_name || '').localeCompare(b.customer_name || ''),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color="blue" style={{ fontSize: 12, padding: '4px 12px' }}>
          {(type || 'general').replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      sorter: (a: Complaint, b: Complaint) => (a.type || '').localeCompare(b.type || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status || 'new')} style={{ fontSize: 12, padding: '4px 12px' }}>
          {(status || 'new').replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      sorter: (a: Complaint, b: Complaint) => (a.status || '').localeCompare(b.status || ''),
      filters: [
        { text: 'New', value: 'new' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value: string | number | boolean, record: Complaint) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority || 'medium')} style={{ fontSize: 12, padding: '4px 12px' }}>
          {(priority || 'medium').toUpperCase()}
        </Tag>
      ),
      sorter: (a: Complaint, b: Complaint) => (a.priority || '').localeCompare(b.priority || ''),
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Urgent', value: 'urgent' },
      ],
      onFilter: (value: string | number | boolean, record: Complaint) => record.priority === value,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_engineer_name',
      key: 'assigned_engineer_name',
      width: 130,
      render: (text: string) => text || <span style={{ color: '#999' }}>Unassigned</span>,
      sorter: (a: Complaint, b: Complaint) => (a.assigned_engineer_name || '').localeCompare(b.assigned_engineer_name || ''),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (created_at: string) => dayjs(created_at).format('MMM DD, YYYY'),
      sorter: (a: Complaint, b: Complaint) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      align: 'center',
      render: (_: unknown, record: Complaint) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {hasPermission('crm:complaints:update') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {hasPermission('crm:complaints:delete') && (
            <Popconfirm
              title="Delete Complaint"
              description="Are you sure you want to delete this complaint?"
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];


  return (
    <>
      <PageHeader
        title="Complaints Management"
        description="Track and manage customer complaints and service requests"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Complaints' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Complaint
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Complaints"
              value={stats?.total || 0}
              description="All complaints"
              icon={AlertCircle}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="New Complaints"
              value={stats?.new || 0}
              description="Awaiting review"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="In Progress"
              value={stats?.in_progress || 0}
              description="Being addressed"
              icon={Clock}
              color="info"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Resolved"
              value={stats?.closed || 0}
              description="Completed"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Filters and Table */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Filter Controls */}
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Search
                  placeholder="Search complaints..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  placeholder="Filter by status"
                  allowClear
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">All Statuses</Option>
                  <Option value="new">New</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  placeholder="Filter by priority"
                  allowClear
                  style={{ width: '100%' }}
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                >
                  <Option value="all">All Priorities</Option>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Col>
            </Row>

            {/* Data Table */}
            <Table<Complaint>
              columns={columns}
              dataSource={filteredComplaints}
              rowKey="id"
              loading={complaintsLoading}
              pagination={{
                total: filteredComplaints.length,
                pageSize: 20,
                showTotal: (total) => `Total ${total} complaints`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    description="No complaints found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Space>
        </Card>
      </div>

      {/* Detail Panel (View) */}
      <ComplaintsDetailPanel
        open={drawerMode === 'view'}
        complaint={selectedComplaint}
        onClose={handleDrawerClose}
        onEdit={handleEditFromDetail}
      />

      {/* Form Panel (Create/Edit) */}
      <ComplaintsFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        complaint={drawerMode === 'edit' ? selectedComplaint : null}
        onClose={handleDrawerClose}
        onSuccess={() => {
          setDrawerMode(null);
        }}
      />
    </>
  );
};