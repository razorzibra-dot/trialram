/**
 * JobWorks Page - Enterprise Design
 * Main job works list with statistics, filtering, and side drawer-based CRUD operations
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Briefcase, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
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

  // Queries
  const { data: response, isLoading: jobWorksLoading, refetch } = useJobWorks(filters);
  const { data: stats, isLoading: statsLoading } = useJobWorkStats();
  const deleteJobWork = useDeleteJobWork();

  const jobWorks = response?.data || [];
  const pagination = response ? { page: response.page, pageSize: response.pageSize, total: response.total } : null;

  const handleRefresh = () => {
    refetch();
    message.success('Data refreshed');
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
    try {
      await deleteJobWork.mutateAsync(jobWork.id);
      message.success(`Job work "${jobWork.title}" deleted`);
      refetch();
    } catch (error) {
      message.error('Failed to delete job work');
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Table columns - minimal and focused
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
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {hasPermission('jobworks:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {hasPermission('jobworks:delete') && (
            <Popconfirm
              title="Delete Job Work"
              description={`Are you sure you want to delete "${record.title}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
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
            {hasPermission('jobworks:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
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
        visible={drawerMode === 'view'}
        jobWork={selectedJobWork}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <JobWorksFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        jobWork={drawerMode === 'edit' ? selectedJobWork : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={() => {
          setDrawerMode(null);
          refetch();
        }}
      />
    </>
  );
};

export default JobWorksPage;
