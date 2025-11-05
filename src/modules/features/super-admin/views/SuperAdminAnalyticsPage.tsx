/**
 * Super Admin Analytics Page - Multi-Tenant Metrics & Analytics
 * Comprehensive analytics dashboard with metrics comparison and trends
 * 
 * **Layer Synchronization**: 
 * - Uses factory-routed hooks from Phase 7
 * - Displays Phase 8 components (TenantMetricsCards, MultiTenantComparison)
 * - Integrates with Phase 5 service factory pattern
 * - No direct service imports (hooks only)
 * 
 * **Features**:
 * - View metrics for individual tenants
 * - Compare metrics across multiple tenants
 * - Trend analysis and visualization
 * - Export analytics data
 * - Drill-down capability to specific tenant
 */
import React, { useState } from 'react';
import { Row, Col, Card, Button, Space, Alert, Drawer, Select, Tag, Badge } from 'antd';
import { 
  ReloadOutlined,
  ExportOutlined,
  DownloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { 
  useTenantMetrics,
  useSuperUserManagement
} from '@/modules/features/super-admin/hooks';
import { 
  TenantMetricsCards,
  MultiTenantComparison
} from '@/modules/features/super-admin/components';
import { toast } from 'sonner';

/**
 * Analytics dashboard with comprehensive metrics
 * Enables super admins to monitor and compare tenant performance
 */
const SuperAdminAnalyticsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Hooks for data management with factory routing
  const { 
    statistics = [],
    isLoading: metricsLoading
  } = useTenantMetrics();
  
  const {
    superUsers = [],
    isLoading: usersLoading
  } = useSuperUserManagement();

  // UI State
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'details'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Permission check
  if (!hasPermission('super_user:view_analytics')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to view analytics."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const isLoading = metricsLoading || usersLoading;

  // Calculate aggregate statistics
  const totalActiveUsers = statistics.reduce((sum, s) => sum + (s.activeUsers || 0), 0);
  const totalContracts = statistics.reduce((sum, s) => sum + (s.totalContracts || 0), 0);
  const totalSales = statistics.reduce((sum, s) => sum + (s.totalSales || 0), 0);
  const totalTransactions = statistics.reduce((sum, s) => sum + (s.totalTransactions || 0), 0);

  // Handle export analytics
  const handleExportAnalytics = () => {
    try {
      const analyticsData = {
        exportDate: new Date().toISOString(),
        dateRange: dateRange,
        summary: {
          totalTenants: statistics.length,
          totalActiveUsers,
          totalContracts,
          totalSales,
          totalTransactions
        },
        tenants: statistics.map(s => ({
          tenantId: s.tenantId,
          activeUsers: s.activeUsers,
          totalContracts: s.totalContracts,
          totalSales: s.totalSales,
          totalTransactions: s.totalTransactions,
          diskUsage: s.diskUsage,
          apiCallsDaily: s.apiCallsDaily
        }))
      };

      const csv = [
        ['Tenant ID', 'Active Users', 'Total Contracts', 'Total Sales', 'Transactions', 'Disk Usage', 'API Calls/Day'],
        ...statistics.map(s => [
          s.tenantId,
          s.activeUsers || 0,
          s.totalContracts || 0,
          s.totalSales || 0,
          s.totalTransactions || 0,
          s.diskUsage ? `${(s.diskUsage / 1024 / 1024).toFixed(2)} MB` : '0 MB',
          s.apiCallsDaily || 0
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  return (
    <>
      <PageHeader
        title="Analytics & Metrics"
        description="Multi-tenant metrics, trends, and performance analysis"
        extra={
          <Space>
            <Select
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 120 }}
              options={[
                { label: 'Last 7 Days', value: '7d' },
                { label: 'Last 30 Days', value: '30d' },
                { label: 'Last 90 Days', value: '90d' },
                { label: 'Last Year', value: '1y' }
              ]}
            />
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => window.location.reload()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportAnalytics}
            >
              Export
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Summary Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Active Users"
              value={totalActiveUsers}
              description="Across all tenants"
              icon={Activity}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Contracts"
              value={totalContracts}
              description="All tenant contracts"
              icon={BarChart3}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Sales"
              value={`₹${totalSales.toLocaleString()}`}
              description="Revenue across tenants"
              icon={TrendingUp}
              color="warning"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Transactions"
              value={totalTransactions}
              description="All transactions"
              icon={Activity}
              color="info"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* View Mode Selector */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Space>
              <Button
                type={viewMode === 'overview' ? 'primary' : 'default'}
                onClick={() => setViewMode('overview')}
              >
                Overview
              </Button>
              <Button
                type={viewMode === 'comparison' ? 'primary' : 'default'}
                onClick={() => setViewMode('comparison')}
                disabled={statistics.length < 2}
              >
                Compare Tenants
              </Button>
              <Button
                type={viewMode === 'details' ? 'primary' : 'default'}
                onClick={() => setViewMode('details')}
              >
                Detailed Metrics
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card variant="borderless" loading={isLoading}>
                <TenantMetricsCards />
              </Card>
            </Col>
          </Row>
        )}

        {/* Comparison Mode */}
        {viewMode === 'comparison' && statistics.length >= 2 && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card variant="borderless" loading={isLoading}>
                <MultiTenantComparison />
              </Card>
            </Col>
          </Row>
        )}

        {/* Details Mode */}
        {viewMode === 'details' && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card>
                <Select
                  placeholder="Select tenant for details"
                  value={selectedTenant}
                  onChange={setSelectedTenant}
                  style={{ width: '100%' }}
                  optionLabelProp="label"
                >
                  {statistics.map(s => (
                    <Select.Option key={s.tenantId} value={s.tenantId}>
                      {s.tenantId}
                    </Select.Option>
                  ))}
                </Select>
              </Card>
            </Col>
            {selectedTenant && (
              <Col xs={24} lg={16}>
                <Card
                  title={`Details for ${selectedTenant}`}
                  variant="borderless"
                  loading={isLoading}
                >
                  {statistics
                    .filter(s => s.tenantId === selectedTenant)
                    .map(s => (
                      <div key={s.tenantId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Active Users:</span>
                          <Tag color="blue">{s.activeUsers || 0}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Contracts:</span>
                          <Tag color="green">{s.totalContracts || 0}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Sales:</span>
                          <Tag color="gold">₹{(s.totalSales || 0).toLocaleString()}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Transactions:</span>
                          <Tag color="cyan">{s.totalTransactions || 0}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Disk Usage:</span>
                          <Tag>{s.diskUsage ? `${(s.diskUsage / 1024 / 1024).toFixed(2)} MB` : '0 MB'}</Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>API Calls/Day:</span>
                          <Tag color="purple">{s.apiCallsDaily || 0}</Tag>
                        </div>
                      </div>
                    ))}
                </Card>
              </Col>
            )}
          </Row>
        )}
      </div>
    </>
  );
};

export default SuperAdminAnalyticsPage;