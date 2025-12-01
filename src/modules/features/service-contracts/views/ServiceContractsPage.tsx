import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  message,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useService } from '@/modules/core/hooks/useService';
import ServiceContractFormModal from '../components/ServiceContractFormModal';
import {
  ServiceContractType,
  ServiceContractFilters,
  ServiceContractStats
} from '@/types/serviceContract';

const { Search } = Input;
const { Option } = Select;

const statusTagConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: 'default', icon: <ClockCircleOutlined /> },
  pending_approval: { color: 'warning', icon: <ClockCircleOutlined /> },
  active: { color: 'success', icon: <CheckCircleOutlined /> },
  on_hold: { color: 'warning', icon: <ClockCircleOutlined /> },
  completed: { color: 'blue', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'default', icon: <CloseCircleOutlined /> },
  expired: { color: 'error', icon: <CloseCircleOutlined /> },
};

const serviceTypeOptions: Array<ServiceContractType['serviceType']> = [
  'support',
  'maintenance',
  'consulting',
  'training',
  'hosting',
  'custom'
];

export const ServiceContractsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const serviceContractService = useService<any>('serviceContractService');

  const [contracts, setContracts] = useState<ServiceContractType[]>([]);
  const [stats, setStats] = useState<ServiceContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ServiceContractFilters>({});
  const [searchText, setSearchText] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeContract, setActiveContract] = useState<ServiceContractType | null>(null);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceContractService.getServiceContracts({
        ...filters,
        page: currentPage,
        pageSize
      });

      setContracts(response.data);
      setTotalItems(response.total || 0);

      const statsResponse = await serviceContractService.getServiceContractStats?.();
      if (statsResponse) {
        setStats(statsResponse);
      } else {
        calculateStats(response.data);
      }
    } catch (err) {
      message.error('Failed to load service contracts');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize, serviceContractService]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const calculateStats = (contractsData: ServiceContractType[]) => {
    const derivedStats = contractsData.reduce(
      (acc, contract) => {
        const endDate = new Date(contract.endDate);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        acc.total += 1;
        acc.totalValue += contract.value || 0;

        if (contract.status === 'active') acc.active += 1;
        if (contract.status === 'expired') acc.expired += 1;
        if (contract.status === 'active' && endDate >= now && endDate <= thirtyDaysFromNow) {
          acc.expiringSoon += 1;
        }

        return acc;
      },
      { total: 0, active: 0, expired: 0, expiringSoon: 0, totalValue: 0 }
    );

    setStats({
      total: derivedStats.total,
      byStatus: {},
      byServiceType: {},
      activeContracts: derivedStats.active,
      pendingApprovalContracts: 0,
      expiredContracts: derivedStats.expired,
      totalValue: derivedStats.totalValue,
      averageValue: derivedStats.total > 0 ? derivedStats.totalValue / derivedStats.total : 0,
      totalDocuments: 0,
      openIssues: 0,
      upcomingMilestones: derivedStats.expiringSoon
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
    message.success('Data refreshed successfully');
  };

  const openCreateModal = () => {
    setActiveContract(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (contract: ServiceContractType) => {
    setActiveContract(contract);
    setIsFormModalOpen(true);
  };

  const closeFormModal = (open: boolean) => {
    setIsFormModalOpen(open);
    if (!open) {
      setActiveContract(null);
    }
  };

  const handleFormSuccess = () => {
    void loadContracts();
  };

  const handleViewContract = (contract: ServiceContractType) => {
    navigate(`/tenant/service-contracts/${contract.id}`);
  };

  const handleDeleteContract = async (contract: ServiceContractType) => {
    try {
      await serviceContractService.deleteServiceContract(contract.id);
      message.success('Service contract deleted successfully');
      void loadContracts();
    } catch (err) {
      message.error('Failed to delete service contract');
      console.error('Error deleting contract:', err);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters((prev) => ({ ...prev, search: value || undefined }));
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value || undefined }));
    setCurrentPage(1);
  };

  const handleServiceTypeFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, serviceType: value || undefined }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setCurrentPage(1);
  };

  const getStatusTag = (status: string) => {
    const config = statusTagConfig[status] || { color: 'default', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Tag>
    );
  };

  const getServiceTypeTag = (type: string) => (
    <Tag color="blue">{type.toUpperCase()}</Tag>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  const columns: ColumnsType<ServiceContractType> = [
    {
      title: 'Contract #',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 160,
      render: (text: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.title}</div>
        </div>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 220,
      render: (text: string, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.productId || 'No product linked'}</div>
        </div>
      )
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 140,
      render: (type: string) => getServiceTypeTag(type)
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 140,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(value)}</span>
      )
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      render: (date: string) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <span>{formatDate(date)}</span>
        </Space>
      )
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 130,
      render: (date: string, record) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: isExpiringSoon(date, record.status) ? '#faad14' : '#8c8c8c' }} />
          <span style={{ color: isExpiringSoon(date, record.status) ? '#faad14' : 'inherit' }}>
            {formatDate(date)}
          </span>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Auto Renew',
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      width: 120,
      align: 'center',
      render: (autoRenew: boolean) => (
        autoRenew ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Yes</Tag>
        ) : (
          <Tag color="default">No</Tag>
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      align: 'center',
      render: (_: unknown, record: ServiceContractType) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewContract(record)} />
          </Tooltip>
          {hasPermission('crm:contract:service:update') && (
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPermission('crm:contract:service:update') && (
            <Popconfirm
              title="Delete Contract"
              description={`Are you sure you want to delete ${record.contractNumber}?`}
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
      )
    }
  ];

  if (!hasPermission('crm:contract:service:update')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access service contracts."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Create Contract
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Contracts"
              value={stats?.total ?? contracts.length}
              icon={<FileTextOutlined />}
              color="primary"
              description="All service contracts"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Contracts"
              value={stats?.activeContracts ?? contracts.filter((c) => c.status === 'active').length}
              icon={<CheckCircleOutlined />}
              color="success"
              description="Currently active"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Expiring Soon"
              value={stats?.upcomingMilestones ?? contracts.filter((c) => isExpiringSoon(c.endDate, c.status)).length}
              icon={<ClockCircleOutlined />}
              color="warning"
              description="Within 30 days"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Value"
              value={formatCurrency(stats?.totalValue ?? contracts.reduce((sum, c) => sum + (c.value || 0), 0))}
              icon={<DollarOutlined />}
              color="info"
              description="Contract value"
            />
          </Col>
        </Row>

        {contracts.some((c) => isExpiringSoon(c.endDate, c.status)) && (
          <Alert
            message="Contracts Expiring Soon"
            description={`${contracts.filter((c) => isExpiringSoon(c.endDate, c.status)).length} contract(s) will expire within the next 30 days.`}
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
            closable
            style={{ marginBottom: 16 }}
          />
        )}

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
                {Object.keys(statusTagConfig).map((status) => (
                  <Option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by service type"
                allowClear
                style={{ width: '100%' }}
                onChange={handleServiceTypeFilter}
                value={filters.serviceType}
              >
                {serviceTypeOptions.map((type) => (
                  <Option key={type} value={type}>
                    {type.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              {(filters.status || filters.serviceType || filters.search) && (
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

        <Card>
          <Table
            columns={columns}
            dataSource={contracts}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalItems,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} contracts`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No service contracts found"
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                  >
                    Create First Contract
                  </Button>
                </Empty>
              )
            }}
          />
        </Card>
      </div>

      <ServiceContractFormModal
        open={isFormModalOpen}
        onOpenChange={closeFormModal}
        serviceContract={activeContract}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default ServiceContractsPage;
