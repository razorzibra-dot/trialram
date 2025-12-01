/**
 * Super Admin Tenants Page - Tenant Management
 * Comprehensive multi-tenant management and monitoring
 * 
 * **Layer Synchronization**: 
 * - Uses factory-routed hooks from Phase 7
 * - Displays Phase 4 components (TenantDirectoryGrid) and Phase 8 components (TenantAccessList, TenantMetricsCards)
 * - Integrates with Phase 5 service factory pattern
 * - No direct service imports (hooks only)
 * 
 * **Features**:
 * - Grid view and table view for browsing tenants
 * - List all tenants with health status
 * - View tenant details and configuration
 * - Monitor tenant metrics and statistics
 * - Manage super user access to tenants
 * - Export tenant information
 * - Enhanced with Phase 4 TenantDirectoryGrid for better UX
 */
import React, { useState } from 'react';
import { Row, Col, Card, Button, Space, Alert, Drawer, Table, Tag, Badge, Tabs, Empty } from 'antd';
import { 
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined,
  ExportOutlined,
  BgColorsOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { Building2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { 
  useTenantAccess,
  useTenantDirectory,
  useSystemHealth
} from '@/modules/features/super-admin/hooks';
import { 
  TenantAccessList,
  TenantMetricsCards,
  MultiTenantComparison,
  TenantDirectoryGrid
} from '@/modules/features/super-admin/components';
import { toast } from 'sonner';

/**
 * Tenant management page with comprehensive monitoring
 * Enables super admins to manage all tenants and their configurations
 */
const SuperAdminTenantsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Hooks for data management with factory routing
  const { 
    tenantAccess = [],
    isLoading: accessLoading
  } = useTenantAccess();
  
  const { 
    tenants = [],
    stats = null,
    isLoading: tenantsLoading
  } = useTenantDirectory();
  
  const { 
    health = {},
    isLoading: healthLoading
  } = useSystemHealth();

  // UI State
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // Grid or Table view

  // Permission check
  if (!hasPermission('crm:platform:tenant:manage')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to manage tenants."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isLoading = accessLoading || tenantsLoading || healthLoading;

  // Calculate stats
  const totalTenants = stats?.totalTenants || tenants.length;
  const activeTenants = stats?.activeTenants || tenants.filter(t => t.status === 'active').length;
  const inactiveTenants = stats?.inactiveTenants || tenants.filter(t => t.status === 'inactive').length;

  // Handle tenant selection for details
  const handleViewTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsDetailDrawerOpen(true);
  };

  // Handle export
  const handleExportTenants = () => {
    try {
      const csv = [
        ['Tenant ID', 'Name', 'Status', 'Plan', 'Active Users', 'Total Contracts', 'Total Sales'],
        ...tenants.map(t => [
          t.tenantId,
          t.name,
          t.status,
          t.plan,
          t.activeUsers || 0,
          t.totalContracts || 0,
          t.totalSales || 0
        ])
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Tenants exported successfully');
    } catch (error) {
      toast.error('Failed to export tenants');
    }
  };

  // Table columns for tenant list
  const columns = [
    {
      title: 'Tenant Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <Building2 size={16} />
          <div>
            <div><strong>{name}</strong></div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.tenantId}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color={plan === 'enterprise' ? 'purple' : plan === 'professional' ? 'blue' : 'default'}>
          {plan?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : status === 'inactive' ? 'default' : 'error'}
          text={status?.toUpperCase() || 'UNKNOWN'}
        />
      ),
    },
    {
      title: 'Active Users',
      dataIndex: 'activeUsers',
      key: 'activeUsers',
      render: (value: number) => <Tag color="blue">{value || 0}</Tag>,
    },
    {
      title: 'Total Contracts',
      dataIndex: 'totalContracts',
      key: 'totalContracts',
      render: (value: number) => <Tag color="green">{value || 0}</Tag>,
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      render: (value: number) => <Tag color="gold">₹{(value || 0).toLocaleString()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTenant(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tenants Management"
        description="Monitor and manage all tenants across the platform"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => window.location.reload()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportTenants}
            >
              Export
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Tenants"
              value={totalTenants}
              description={`${totalTenants} registered tenants`}
              icon={Building2}
              color="primary"
              loading={tenantsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active"
              value={activeTenants}
              description={`${activeTenants} tenants active`}
              icon={Building2}
              color="success"
              loading={tenantsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Inactive"
              value={inactiveTenants}
              description={`${inactiveTenants} suspended/inactive`}
              icon={Building2}
              color="warning"
              loading={tenantsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Tenant Access"
              value={tenantAccess.length}
              description={`${tenantAccess.length} access records`}
              icon={Building2}
              color="info"
              loading={accessLoading}
            />
          </Col>
        </Row>

        {/* Tenant Directory - Grid/Table View */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card variant="borderless" loading={isLoading}>
              <Tabs
                activeKey={viewMode}
                onChange={(key) => setViewMode(key as 'grid' | 'table')}
                tabBarExtraContent={
                  <Space>
                    <Button
                      type={viewMode === 'grid' ? 'primary' : 'default'}
                      icon={<BgColorsOutlined />}
                      onClick={() => setViewMode('grid')}
                    >
                      Grid View
                    </Button>
                    <Button
                      type={viewMode === 'table' ? 'primary' : 'default'}
                      icon={<UnorderedListOutlined />}
                      onClick={() => setViewMode('table')}
                    >
                      Table View
                    </Button>
                  </Space>
                }
              >
                {/* Grid View Tab */}
                <Tabs.TabPane
                  tab="Grid View"
                  key="grid"
                  label={<span><BgColorsOutlined /> Grid</span>}
                >
                  <TenantDirectoryGrid
                    onTenantSelect={handleViewTenant}
                    showActions={true}
                  />
                </Tabs.TabPane>

                {/* Table View Tab */}
                <Tabs.TabPane
                  tab="Table View"
                  key="table"
                  label={<span><UnorderedListOutlined /> Table</span>}
                >
                  <Table
                    columns={columns}
                    dataSource={tenants}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    rowKey="tenantId"
                    loading={tenantsLoading}
                  />
                </Tabs.TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>

        {/* Metrics Overview - Optional Section */}
        {/* Tenant metrics can be loaded separately if needed */}

        {/* Tenant Access Information */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Tenant Access" variant="borderless" loading={accessLoading}>
              <TenantAccessList />
            </Card>
          </Col>
        </Row>

        {/* Comparison Mode */}
        {tenants.length > 1 && (
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <Card
                title="Multi-Tenant Comparison"
                variant="borderless"
                extra={
                  <Button
                    type={isComparisonMode ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setIsComparisonMode(!isComparisonMode)}
                  >
                    {isComparisonMode ? 'Hide Comparison' : 'Show Comparison'}
                  </Button>
                }
              >
                {isComparisonMode && <MultiTenantComparison />}
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Tenant Detail Drawer */}
      <Drawer
        title="Tenant Details"
        placement="right"
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        width={500}
      >
        {isDetailDrawerOpen && selectedTenant && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Tenant ID:</strong> {selectedTenant.tenantId}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge
                    status={selectedTenant.status === 'healthy' ? 'success' : 'warning'}
                    text={selectedTenant.status?.toUpperCase()}
                  />
                </div>
                <div>
                  <strong>Active Users:</strong> {selectedTenant.activeUsers || 0}
                </div>
                <div>
                  <strong>Total Contracts:</strong> {selectedTenant.totalContracts || 0}
                </div>
                <div>
                  <strong>Total Sales:</strong> ₹{(selectedTenant.totalSales || 0).toLocaleString()}
                </div>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  );
};

export default SuperAdminTenantsPage;