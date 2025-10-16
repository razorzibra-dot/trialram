/**
 * Service Contracts Page - Enterprise Version
 * Redesigned with Ant Design and EnterpriseLayout
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Row,
  Col,
  Popconfirm,
  Alert,
  Empty,
  Modal,
  message,
  Tooltip,
  Badge
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { serviceContractService } from '@/services/serviceContractService';
import { 
  ServiceContract, 
  ServiceContractFilters,
  ServiceContractsResponse 
} from '@/types/productSales';

const { Search } = Input;
const { Option } = Select;

interface ContractStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  total_value: number;
}

export const ServiceContractsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // State management
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    active: 0,
    expiring_soon: 0,
    expired: 0,
    total_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ServiceContractFilters>({});
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);

  // Load data
  useEffect(() => {
    loadContracts();
  }, [currentPage, pageSize, filters]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await serviceContractService.getServiceContracts(filters, currentPage, pageSize);
      setContracts(response.data);
      setTotalItems(response.total);
      
      // Calculate stats
      calculateStats(response.data);
    } catch (err) {
      message.error('Failed to load service contracts');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contractsData: ServiceContract[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const active = contractsData.filter(c => c.status === 'active').length;
    const expired = contractsData.filter(c => c.status === 'expired').length;
    const expiringSoon = contractsData.filter(c => {
      const endDate = new Date(c.end_date);
      return c.status === 'active' && endDate <= thirtyDaysFromNow && endDate >= now;
    }).length;
    const totalValue = contractsData.reduce((sum, c) => sum + (c.contract_value || 0), 0);

    setStats({
      total: contractsData.length,
      active,
      expiring_soon: expiringSoon,
      expired,
      total_value: totalValue
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
    message.success('Data refreshed successfully');
  };

  const handleCreateContract = () => {
    setShowCreateModal(true);
  };

  const handleViewContract = (contract: ServiceContract) => {
    navigate(`/tenant/service-contracts/${contract.id}`);
  };

  const handleDeleteContract = async (contract: ServiceContract) => {
    try {
      await serviceContractService.deleteServiceContract(contract.id);
      message.success('Service contract deleted successfully');
      loadContracts();
    } catch (err) {
      message.error('Failed to delete service contract');
      console.error('Error deleting contract:', err);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value || undefined }));
    setCurrentPage(1);
  };

  const handleServiceLevelFilter = (value: string) => {
    setFilters(prev => ({ ...prev, service_level: value || undefined }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setCurrentPage(1);
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'active': { color: 'success', icon: <CheckCircleOutlined /> },
      'expired': { color: 'error', icon: <CloseCircleOutlined /> },
      'pending': { color: 'processing', icon: <ClockCircleOutlined /> },
      'cancelled': { color: 'default', icon: <CloseCircleOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getServiceLevelTag = (level: string) => {
    const levelConfig: Record<string, string> = {
      'basic': 'default',
      'standard': 'blue',
      'premium': 'gold',
      'enterprise': 'purple'
    };

    return (
      <Tag color={levelConfig[level] || 'default'}>
        {level.toUpperCase()}
      </Tag>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (endDate: string, status: string) => {
    if (status !== 'active') return false;
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return end <= thirtyDaysFromNow && end >= now;
  };

  // Table columns
  const columns: ColumnsType<ServiceContract> = [
    {
      title: 'Contract #',
      dataIndex: 'contract_number',
      key: 'contract_number',
      width: 150,
      render: (text: string, record: ServiceContract) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>ID: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (text: string, record: ServiceContract) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.product_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Service Level',
      dataIndex: 'service_level',
      key: 'service_level',
      width: 130,
      render: (level: string) => getServiceLevelTag(level),
    },
    {
      title: 'Contract Value',
      dataIndex: 'contract_value',
      key: 'contract_value',
      width: 140,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <span>{formatDate(date)}</span>
        </Space>
      ),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string, record: ServiceContract) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: isExpiringSoon(date, record.status) ? '#faad14' : '#8c8c8c' }} />
          <span style={{ color: isExpiringSoon(date, record.status) ? '#faad14' : 'inherit' }}>
            {formatDate(date)}
          </span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Auto Renewal',
      dataIndex: 'auto_renewal',
      key: 'auto_renewal',
      width: 120,
      align: 'center',
      render: (autoRenewal: boolean) => (
        autoRenewal ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Yes</Tag>
        ) : (
          <Tag color="default">No</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_: any, record: ServiceContract) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewContract(record)}
            />
          </Tooltip>
          {record.pdf_url && (
            <Tooltip title="Download PDF">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => window.open(record.pdf_url, '_blank')}
              />
            </Tooltip>
          )}
          {hasPermission('manage_service_contracts') && (
            <Popconfirm
              title="Delete Contract"
              description={`Are you sure you want to delete contract ${record.contract_number}?`}
              onConfirm={() => handleDeleteContract(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission('manage_service_contracts')) {
    return (
      <EnterpriseLayout>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access service contracts."
            type="warning"
            showIcon
          />
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Service Contracts"
        description="Manage service contracts and agreements"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/tenant/dashboard' },
            { title: 'Sales', path: '/tenant/sales' },
            { title: 'Service Contracts' }
          ]
        }}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            {hasPermission('manage_service_contracts') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateContract}
              >
                Create Contract
              </Button>
            )}
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Contracts"
              value={stats.total}
              icon={<FileTextOutlined />}
              color="primary"
              description="All service contracts"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Contracts"
              value={stats.active}
              icon={<CheckCircleOutlined />}
              color="success"
              description="Currently active"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Expiring Soon"
              value={stats.expiring_soon}
              icon={<ClockCircleOutlined />}
              color="warning"
              description="Within 30 days"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats.total_value)}
              icon={<DollarOutlined />}
              color="info"
              description="Contract value"
            />
          </Col>
        </Row>

        {/* Expiring Soon Alert */}
        {stats.expiring_soon > 0 && (
          <Alert
            message="Contracts Expiring Soon"
            description={`${stats.expiring_soon} contract(s) will expire within the next 30 days. Please review and take necessary action.`}
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search contracts..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusFilter}
                value={filters.status}
              >
                <Option value="active">Active</Option>
                <Option value="expired">Expired</Option>
                <Option value="pending">Pending</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by service level"
                allowClear
                style={{ width: '100%' }}
                onChange={handleServiceLevelFilter}
                value={filters.service_level}
              >
                <Option value="basic">Basic</Option>
                <Option value="standard">Standard</Option>
                <Option value="premium">Premium</Option>
                <Option value="enterprise">Enterprise</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              {Object.keys(filters).length > 0 && (
                <Button
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                  block
                >
                  Clear Filters
                </Button>
              )}
            </Col>
          </Row>
        </Card>

        {/* Contracts Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={contracts}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} contracts`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No service contracts found"
                >
                  {hasPermission('manage_service_contracts') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateContract}
                    >
                      Create First Contract
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        </Card>
      </div>
    </EnterpriseLayout>
  );
};

export default ServiceContractsPage;