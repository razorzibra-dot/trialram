/**
 * JobWorks Page - Enterprise Design
 * Main job works list with statistics, filtering, and side drawer-based CRUD operations
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, Tooltip, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Briefcase, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { formatCurrency } from '@/utils/formatters';
import { JobWorksDetailPanel } from '../components/JobWorksDetailPanel';
import { JobWorksFormPanel } from '../components/JobWorksFormPanel';
import { JobWork } from '../services/jobWorksService';
import { useJobWorks, useDeleteJobWork, useJobWorkStats } from '../hooks/useJobWorks';
import { useAuth } from '@/contexts/AuthContext';

const { Search } = Input;
const { Option } = Select;

const JobWorksPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
  });

  // Drawer states
  const [selectedJobWork, setSelectedJobWork] = useState<JobWork | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Queries
  const { data: response, isLoading: jobWorksLoading, refetch } = useJobWorks(filters);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useJobWorkStats();
  const deleteJobWork = useDeleteJobWork();

  const jobWorks = response?.data || [];
  const pagination = response ? { page: response.page, pageSize: response.pageSize, total: response.total } : null;

  const handleRefresh = () => {
    refetch();
    refetchStats();
    message.success('Data refreshed');
  };

  const handleCreateJobWork = () => {
    setSelectedJobWork(null);
    setFormMode('create');
    setShowFormPanel(true);
  };

  const handleEditJobWork = (jobWork: JobWork) => {
    setSelectedJobWork(jobWork);
    setFormMode('edit');
    setShowFormPanel(true);
  };

  const handleCloseFormPanel = () => {
    setShowFormPanel(false);
    setSelectedJobWork(null);
  };

  const handleCreate = () => {
    setSelectedJobWork(null);
    setDrawerMode('create');
  };

  const handleEdit = (jobWork: JobWork) => {
    setSelectedJobWork(jobWork);
    setDrawerMode('edit');
  };

  const handleView = (jobWork: JobWork) => {
    setSelectedJobWork(jobWork);
    setDrawerMode('view');
  };

  const handleDelete = async (jobWork: JobWork) => {
    // Notifications handled by useDeleteJobWork hook
    await deleteJobWork.mutateAsync(jobWork.id);
    refetch();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setFilters({ ...filters, page: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'blue';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'default';
    }
  };


  const columns: ColumnsType<JobWork> = [
    {
      title: 'Job Work',
      key: 'title',
      dataIndex: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.customer_name && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.customer_name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 110,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      dataIndex: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Assigned To',
      key: 'assigned_to_name',
      dataIndex: 'assigned_to_name',
      width: 130,
      render: (name) => name || 'Unassigned',
    },
    {
      title: 'Due Date',
      key: 'due_date',
      dataIndex: 'due_date',
      width: 110,
      render: (date) => {
        if (!date) return '-';
        const dueDate = new Date(date);
        const isOverdue = dueDate < new Date() && dueDate;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: 'Cost',
      key: 'cost',
      dataIndex: 'cost',
      width: 100,
      render: (cost) => formatCurrency(cost || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {hasPermission('crm:project:record:update') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditJobWork(record)}
              />
            </Tooltip>
          )}
          {hasPermission('crm:project:record:delete') && (
            <Popconfirm
              title="Delete Job Work"
              description={`Are you sure you want to delete "${record.title}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
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
        title="Job Works"
        description="Manage and track job work assignments and progress"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Job Works' }
          ]
        }}
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            {hasPermission('crm:project:record:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateJobWork}>
                New Job Work
              </Button>
            )}
          </>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Job Works"
              value={stats?.total || 0}
              description="All assignments"
              icon={Briefcase}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="In Progress"
              value={stats?.byStatus?.in_progress || 0}
              description="Active jobs"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Completed"
              value={stats?.completedThisMonth || 0}
              description="This month"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalCost || 0)}
              description="Combined value"
              icon={DollarSign}
              color="info"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Job Works Table */}
        <Card
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Search */}
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Search
              placeholder="Search by job work title or customer..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={jobWorks || []}
            loading={jobWorksLoading}
            pagination={{
              current: filters.page || 1,
              pageSize: filters.pageSize || 20,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, pageSize });
              },
            }}
            rowKey="id"
            locale={{
              emptyText: <Empty description="No job works found" style={{ marginTop: 48, marginBottom: 48 }} />,
            }}
          />
        </Card>
      </div>

      {/* Detail Panel (View) */}
      <JobWorksDetailPanel
        open={drawerMode === 'view'}
        jobWork={selectedJobWork}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <JobWorksFormPanel
        jobWork={selectedJobWork}
        mode={formMode}
        isOpen={showFormPanel}
        onClose={handleCloseFormPanel}
        onSuccess={() => {
          refetch();
          handleCloseFormPanel();
        }}
      />
    </>
  );
};

export default JobWorksPage;
