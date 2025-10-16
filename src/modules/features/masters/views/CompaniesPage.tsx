/**
 * Companies Page - Enterprise Layout Version
 * Main page for company master data management with consistent design
 */

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Popconfirm,
  Empty,
  Modal,
  message,
  Upload as AntUpload
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  RiseOutlined,
  TeamOutlined,
  SearchOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useCompanyStats, useImportCompanies, useCompanies, useDeleteCompany } from '../hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { Company, CompanyFilters } from '@/types/masters';

const { Search } = Input;
const { Option } = Select;

export const CompaniesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<CompanyFilters>({
    page: 1,
    pageSize: 20,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // Queries and mutations
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useCompanyStats();
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = useCompanies(filters);
  const importCompanies = useImportCompanies();
  const deleteCompany = useDeleteCompany();

  const handleRefresh = () => {
    refetchStats();
    refetchCompanies();
    message.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    setSelectedCompany(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setModalMode('view');
    setIsModalVisible(true);
  };

  const handleDelete = async (company: Company) => {
    try {
      await deleteCompany.mutateAsync(company.id);
      message.success(`Company "${company.name}" deleted successfully`);
      refetchCompanies();
      refetchStats();
    } catch (error) {
      message.error('Failed to delete company');
    }
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      importCompanies.mutate(csv, {
        onSuccess: () => {
          message.success('Companies imported successfully');
          refetchCompanies();
          refetchStats();
        },
        onError: () => {
          message.error('Failed to import companies');
        }
      });
    };
    reader.readAsText(file);
    return false;
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setFilters({ 
      ...filters, 
      status: value === 'all' ? undefined : value as any,
      page: 1 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'default';
      case 'prospect':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      startup: 'Startup',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      enterprise: 'Enterprise'
    };
    return labels[size] || size;
  };

  // Table columns
  const columns: ColumnsType<Company> = [
    {
      title: 'Company',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <Space>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            backgroundColor: '#e6f7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BankOutlined style={{ color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.industry}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>{record.email}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.phone}</span>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size) => (
        <Tag color="blue">{getSizeLabel(size)}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      width: 150,
      render: (website) => website ? (
        <a href={website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
          <GlobalOutlined /> Visit
        </a>
      ) : '-',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
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
          {hasPermission('companies:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {hasPermission('companies:delete') && (
            <Popconfirm
              title="Delete Company"
              description={`Are you sure you want to delete "${record.name}"?`}
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
    <EnterpriseLayout>
      <PageHeader
        title="Companies"
        description="Manage your company master data and business relationships"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Masters', path: '/masters' },
          { label: 'Companies' },
        ]}
        extra={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>,
          hasPermission('companies:create') && (
            <AntUpload
              key="import"
              accept=".csv"
              beforeUpload={handleFileImport}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={importCompanies.isPending}>
                Import CSV
              </Button>
            </AntUpload>
          ),
          hasPermission('companies:create') && (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Company
            </Button>
          ),
        ].filter(Boolean)}
      />

      <div style={{ padding: 24 }}>
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Companies"
              value={stats?.total || 0}
              icon={<BankOutlined />}
              color="primary"
              loading={statsLoading}
              suffix="companies"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Companies"
              value={stats?.activeCompanies || 0}
              icon={<RiseOutlined />}
              color="success"
              loading={statsLoading}
              suffix="active"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Prospects"
              value={stats?.prospectCompanies || 0}
              icon={<EyeOutlined />}
              color="info"
              loading={statsLoading}
              suffix="potential"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Recently Added"
              value={stats?.recentlyAdded || 0}
              icon={<TeamOutlined />}
              color="warning"
              loading={statsLoading}
              suffix="this week"
            />
          </Col>
        </Row>

        {/* Companies Table */}
        <Card>
          {/* Search and Filters */}
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space.Compact style={{ width: '100%' }}>
              <Search
                placeholder="Search companies by name, industry, or email..."
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

          <Table
            columns={columns}
            dataSource={companiesData?.data || []}
            rowKey="id"
            loading={companiesLoading}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: companiesData?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} companies`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, pageSize });
              },
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No companies found"
                >
                  {hasPermission('companies:create') && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                      Add Your First Company
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </Card>
      </div>

      {/* Company Modal (Create/Edit/View) */}
      <Modal
        title={
          modalMode === 'create' 
            ? 'Add New Company' 
            : modalMode === 'edit' 
            ? 'Edit Company' 
            : 'Company Details'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ] : null}
        width={800}
      >
        {/* TODO: Implement company form */}
        <p>Company form will be implemented here</p>
        {selectedCompany && (
          <div>
            <p><strong>Name:</strong> {selectedCompany.name}</p>
            <p><strong>Industry:</strong> {selectedCompany.industry}</p>
            <p><strong>Email:</strong> {selectedCompany.email}</p>
            <p><strong>Phone:</strong> {selectedCompany.phone}</p>
            <p><strong>Status:</strong> {selectedCompany.status}</p>
            <p><strong>Size:</strong> {getSizeLabel(selectedCompany.size)}</p>
          </div>
        )}
      </Modal>
    </EnterpriseLayout>
  );
};
