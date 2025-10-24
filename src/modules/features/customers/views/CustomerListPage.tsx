/**
 * Customer List Page - Enterprise Design
 * Main page for displaying and managing customers
 * Unified grid control with side drawer panels for CRUD operations
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Users, Mail, Phone } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { CustomerDetailPanel } from '../components/CustomerDetailPanel';
import { CustomerFormPanel } from '../components/CustomerFormPanel';
import { Customer, CustomerFilters } from '@/types/crm';
import { useCustomers, useDeleteCustomer, useCustomerStats } from '../hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';

const { Search } = Input;
const { Option } = Select;

const CustomerListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<Partial<CustomerFilters>>({
    page: 1,
    pageSize: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  // Queries
  const { customers, pagination, isLoading: customersLoading, refetch } = useCustomers(filters as CustomerFilters);
  const deleteCustomer = useDeleteCustomer();
  const { data: statsData, isLoading: statsLoading } = useCustomerStats();

  // Real stats from service
  const stats = statsData || {
    total: 0,
    active: 0,
    prospects: 0,
    byIndustry: {}
  };

  const handleRefresh = () => {
    refetch();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setDrawerMode('create');
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('edit');
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('view');
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await deleteCustomer.mutateAsync(customer.id);
      message.success(`Customer "${customer.company_name}" deleted successfully`);
      refetch();
    } catch (error) {
      message.error('Failed to delete customer');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const statusValue: 'active' | 'inactive' | 'prospect' | undefined = value === 'all' ? undefined : (value as 'active' | 'inactive' | 'prospect');
    setFilters({ ...filters, status: statusValue, page: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'prospect': return 'blue';
      default: return 'default';
    }
  };

  // Table columns
  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      key: 'company_name',
      dataIndex: 'company_name',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.contact_name}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.email && (
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
              <Mail size={12} style={{ marginRight: 6 }} />
              {record.email}
            </div>
          )}
          {record.phone && (
            <div style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', alignItems: 'center' }}>
              <Phone size={12} style={{ marginRight: 6 }} />
              {record.phone}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Industry',
      key: 'industry',
      dataIndex: 'industry',
      width: 120,
      render: (industry) => (
        <Tag color="blue">{industry || 'Not specified'}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      key: 'created_at',
      dataIndex: 'created_at',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
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
          {hasPermission('customers:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {hasPermission('customers:delete') && (
            <Popconfirm
              title="Delete Customer"
              description={`Are you sure you want to delete "${record.company_name}"?`}
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
        title="Customers"
        description="Manage your customer relationships and interactions"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Customers' }
          ]
        }}
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            {hasPermission('customers:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Add Customer
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
              title="Total Customers"
              value={stats.total}
              description="All customers"
              icon={Users}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Customers"
              value={stats.active}
              description={`${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total`}
              icon={Users}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Prospects"
              value={stats.prospects}
              description="Potential customers"
              icon={Users}
              color="info"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Top Industry"
              value={Object.entries(stats.byIndustry).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              description="Most common"
              icon={Users}
              color="warning"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Customers Table */}
        <Card
          style={{
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Search and Filters */}
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space.Compact style={{ width: '100%' }}>
              <Search
                placeholder="Search customers by name, email, or phone..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ flex: 1 }}
              />
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: 150 }}
                size="large"
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="prospect">Prospect</Option>
              </Select>
            </Space.Compact>
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={customers || []}
            loading={customersLoading}
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
              emptyText: <Empty description="No customers found" style={{ marginTop: 48, marginBottom: 48 }} />,
            }}
          />
        </Card>
      </div>

      {/* Detail Panel (View) */}
      <CustomerDetailPanel
        visible={drawerMode === 'view'}
        customer={selectedCustomer}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <CustomerFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        customer={drawerMode === 'edit' ? selectedCustomer : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={() => {
          setDrawerMode(null);
          refetch();
        }}
      />
    </>
  );
};

export default CustomerListPage;
