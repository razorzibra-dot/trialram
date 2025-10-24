/**
 * Contracts Page - Enterprise Design
 * Main page for contract management and lifecycle tracking
 * Fully refactored with modern architecture synchronized with Customers module
 */

import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Input, Select, Space, Tag, Popconfirm, message, Empty, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { FileText, Clock, DollarSign, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { ContractDetailPanel } from '../components/ContractDetailPanel';
import { ContractFormPanel } from '../components/ContractFormPanel';
import { Contract, ContractFilters } from '@/types/contracts';
import { useContracts, useDeleteContract, useContractStats, useExpiringContracts, useContractsDueForRenewal } from '../hooks/useContracts';
import { useAuth } from '@/contexts/AuthContext';

const { Search } = Input;
const { Option } = Select;

const ContractsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<Partial<ContractFilters>>({
    page: 1,
    pageSize: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Drawer states
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);

  // Queries
  const { contracts, pagination, isLoading: contractsLoading, refetch } = useContracts(filters as ContractFilters);
  const deleteContract = useDeleteContract();
  const { data: contractStats, isLoading: statsLoading } = useContractStats();
  const { data: expiringContracts } = useExpiringContracts(30);
  const { data: renewalsDue } = useContractsDueForRenewal(30);

  const handleRefresh = () => {
    refetch();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedContract(null);
    setDrawerMode('create');
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setDrawerMode('edit');
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setDrawerMode('view');
  };

  const handleDelete = async (contract: Contract) => {
    try {
      await deleteContract.mutateAsync(contract.id);
      message.success(`Contract "${contract.title}" deleted successfully`);
      refetch();
    } catch (error) {
      message.error('Failed to delete contract');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const statusValue = value === 'all' ? undefined : value;
    setFilters({ ...filters, status: statusValue, page: 1 });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    const typeValue = value === 'all' ? undefined : value;
    setFilters({ ...filters, type: typeValue, page: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending_approval': return 'orange';
      case 'draft': return 'default';
      case 'expired': return 'red';
      case 'terminated': return 'red';
      case 'renewed': return 'blue';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service_agreement': return 'blue';
      case 'nda': return 'purple';
      case 'purchase_order': return 'green';
      case 'employment': return 'orange';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'gold';
      case 'low': return 'green';
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

  // Table columns
  const columns: ColumnsType<Contract> = [
    {
      title: 'Contract',
      key: 'title',
      dataIndex: 'title',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.contract_number}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer_name',
      dataIndex: 'customer_name',
      width: 180,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.customer_contact && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.customer_contact}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      dataIndex: 'type',
      width: 140,
      render: (type) => {
        const displayType = type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return <Tag color={getTypeColor(type)}>{displayType}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      width: 140,
      render: (status) => {
        const displayStatus = status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return <Tag color={getStatusColor(status)}>{displayStatus}</Tag>;
      },
    },
    {
      title: 'Value',
      key: 'value',
      dataIndex: 'value',
      width: 130,
      render: (value) => <span>{formatCurrency(value || 0)}</span>,
    },
    {
      title: 'End Date',
      key: 'end_date',
      dataIndex: 'end_date',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
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
          {hasPermission('contracts:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {hasPermission('contracts:delete') && (
            <Popconfirm
              title="Delete Contract"
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
        title="Contracts"
        description="Manage contracts, track renewals, and monitor compliance"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Contracts' }
          ]
        }}
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            {hasPermission('contracts:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                New Contract
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
              title="Total Contracts"
              value={contractStats?.total || 0}
              description="Active agreements"
              icon={FileText}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Contracts"
              value={contractStats?.activeContracts || 0}
              description="Currently in effect"
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Pending Approval"
              value={contractStats?.pendingApproval || 0}
              description="Awaiting approval"
              icon={Clock}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(contractStats?.totalValue || 0)}
              description="Contract portfolio value"
              icon={DollarSign}
              color="info"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Alerts Section */}
        {((expiringContracts?.length || 0) > 0 || (renewalsDue?.length || 0) > 0) && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {(expiringContracts?.length || 0) > 0 && (
              <Col xs={24} lg={12}>
                <Alert
                  message={
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      <WarningOutlined style={{ marginRight: 8 }} />
                      Expiring Soon
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>Contracts expiring within 30 days</p>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {expiringContracts?.length || 0}
                      </div>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Require immediate attention</p>
                    </div>
                  }
                  type="error"
                  showIcon
                  style={{ borderRadius: 8 }}
                />
              </Col>
            )}

            {(renewalsDue?.length || 0) > 0 && (
              <Col xs={24} lg={12}>
                <Alert
                  message={
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      <Calendar style={{ marginRight: 8 }} />
                      Renewals Due
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ marginBottom: 8 }}>Contracts due for renewal within 30 days</p>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {renewalsDue?.length || 0}
                      </div>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Need renewal processing</p>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ borderRadius: 8 }}
                />
              </Col>
            )}
          </Row>
        )}

        {/* Contracts Table */}
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
                placeholder="Search contracts by title, number, or customer..."
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
                <Option value="draft">Draft</Option>
                <Option value="pending_approval">Pending Approval</Option>
                <Option value="active">Active</Option>
                <Option value="renewed">Renewed</Option>
                <Option value="expired">Expired</Option>
                <Option value="terminated">Terminated</Option>
              </Select>
              <Select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                style={{ width: 150 }}
                size="large"
              >
                <Option value="all">All Types</Option>
                <Option value="service_agreement">Service Agreement</Option>
                <Option value="nda">NDA</Option>
                <Option value="purchase_order">Purchase Order</Option>
                <Option value="employment">Employment</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </Space.Compact>
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={contracts || []}
            loading={contractsLoading}
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
              emptyText: <Empty description="No contracts found" style={{ marginTop: 48, marginBottom: 48 }} />,
            }}
          />
        </Card>
      </div>

      {/* Detail Panel (View) */}
      <ContractDetailPanel
        visible={drawerMode === 'view'}
        contract={selectedContract}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
      />

      {/* Form Panel (Create/Edit) */}
      <ContractFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        contract={drawerMode === 'edit' ? selectedContract : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={() => {
          setDrawerMode(null);
          refetch();
        }}
      />
    </>
  );
};

export default ContractsPage;