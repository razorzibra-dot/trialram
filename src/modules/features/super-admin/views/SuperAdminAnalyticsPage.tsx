/**
 * Super Admin Analytics Page
 * Platform-wide analytics dashboard with charts and metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Space,
  Button,
  Progress,
  Tag,
  Spin,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { PageHeader, StatCard } from '@/components/common';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  mrr: number;
  churnRate: number;
  avgRevenuePerTenant: number;
}

interface TenantUsage {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  users: number;
  storage_gb: number;
  api_calls: number;
  revenue: number;
  status: string;
}

export const SuperAdminAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tenantUsage, setTenantUsage] = useState<TenantUsage[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock metrics
      setMetrics({
        totalTenants: 156,
        activeTenants: 142,
        totalUsers: 3847,
        activeUsers: 2956,
        totalRevenue: 487650,
        mrr: 42500,
        churnRate: 2.8,
        avgRevenuePerTenant: 3126,
      });

      // Mock tenant usage data
      setTenantUsage([
        {
          tenant_id: '1',
          tenant_name: 'TechCorp Solutions',
          plan: 'Enterprise',
          users: 245,
          storage_gb: 1250,
          api_calls: 1250000,
          revenue: 12500,
          status: 'active',
        },
        {
          tenant_id: '2',
          tenant_name: 'Global Manufacturing Inc',
          plan: 'Premium',
          users: 180,
          storage_gb: 850,
          api_calls: 890000,
          revenue: 8900,
          status: 'active',
        },
        {
          tenant_id: '3',
          tenant_name: 'StartupXYZ',
          plan: 'Basic',
          users: 45,
          storage_gb: 120,
          api_calls: 125000,
          revenue: 1250,
          status: 'active',
        },
        {
          tenant_id: '4',
          tenant_name: 'Retail Giants Ltd',
          plan: 'Premium',
          users: 320,
          storage_gb: 1850,
          api_calls: 2100000,
          revenue: 15600,
          status: 'active',
        },
        {
          tenant_id: '5',
          tenant_name: 'Healthcare Plus',
          plan: 'Enterprise',
          users: 420,
          storage_gb: 2400,
          api_calls: 3200000,
          revenue: 18900,
          status: 'active',
        },
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const revenueData = [
    { month: 'Jan', revenue: 38500, mrr: 35000 },
    { month: 'Feb', revenue: 39200, mrr: 36200 },
    { month: 'Mar', revenue: 40100, mrr: 37500 },
    { month: 'Apr', revenue: 41800, mrr: 38900 },
    { month: 'May', revenue: 42300, mrr: 40200 },
    { month: 'Jun', revenue: 42500, mrr: 42500 },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 2845, active: 2156 },
    { month: 'Feb', users: 3012, active: 2345 },
    { month: 'Mar', users: 3245, active: 2567 },
    { month: 'Apr', users: 3456, active: 2678 },
    { month: 'May', users: 3689, active: 2834 },
    { month: 'Jun', users: 3847, active: 2956 },
  ];

  const planDistributionData = [
    { name: 'Basic', value: 45, color: '#faad14' },
    { name: 'Premium', value: 67, color: '#1890ff' },
    { name: 'Enterprise', value: 44, color: '#722ed1' },
  ];

  const apiUsageData = [
    { day: 'Mon', calls: 450000 },
    { day: 'Tue', calls: 520000 },
    { day: 'Wed', calls: 480000 },
    { day: 'Thu', calls: 550000 },
    { day: 'Fri', calls: 620000 },
    { day: 'Sat', calls: 380000 },
    { day: 'Sun', calls: 320000 },
  ];

  const tenantColumns = [
    {
      title: 'Tenant',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      sorter: (a: TenantUsage, b: TenantUsage) => a.tenant_name.localeCompare(b.tenant_name),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => {
        const colors: Record<string, string> = {
          Basic: 'orange',
          Premium: 'blue',
          Enterprise: 'purple',
        };
        return <Tag color={colors[plan]}>{plan}</Tag>;
      },
      filters: [
        { text: 'Basic', value: 'Basic' },
        { text: 'Premium', value: 'Premium' },
        { text: 'Enterprise', value: 'Enterprise' },
      ],
      onFilter: (value: string | number | boolean, record: TenantUsage) => record.plan === value,
    },
    {
      title: 'Users',
      dataIndex: 'users',
      key: 'users',
      sorter: (a: TenantUsage, b: TenantUsage) => a.users - b.users,
      render: (users: number) => users.toLocaleString(),
    },
    {
      title: 'Storage (GB)',
      dataIndex: 'storage_gb',
      key: 'storage_gb',
      sorter: (a: TenantUsage, b: TenantUsage) => a.storage_gb - b.storage_gb,
      render: (storage: number) => (
        <Space direction="vertical" size={0}>
          <span>{storage.toLocaleString()} GB</span>
          <Progress
            percent={Math.min((storage / 3000) * 100, 100)}
            size="small"
            showInfo={false}
            strokeColor={storage > 2000 ? '#ff4d4f' : '#52c41a'}
          />
        </Space>
      ),
    },
    {
      title: 'API Calls',
      dataIndex: 'api_calls',
      key: 'api_calls',
      sorter: (a: TenantUsage, b: TenantUsage) => a.api_calls - b.api_calls,
      render: (calls: number) => calls.toLocaleString(),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: TenantUsage, b: TenantUsage) => a.revenue - b.revenue,
      render: (revenue: number) => `$${revenue.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const handleExport = () => {
    // Export analytics data
    const csvContent = [
      ['Tenant', 'Plan', 'Users', 'Storage (GB)', 'API Calls', 'Revenue', 'Status'],
      ...tenantUsage.map(t => [
        t.tenant_name,
        t.plan,
        t.users,
        t.storage_gb,
        t.api_calls,
        t.revenue,
        t.status,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-analytics-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Platform Analytics"
        description="Comprehensive analytics and insights across all tenants"
        breadcrumb={{
          items: [
            { title: 'Super Admin', path: '/super-admin/dashboard' },
            { title: 'Analytics' },
          ],
        }}
        extra={
          <Space>
            <Select value={timeframe} onChange={setTimeframe} style={{ width: 120 }}>
              <Select.Option value="7d">Last 7 days</Select.Option>
              <Select.Option value="30d">Last 30 days</Select.Option>
              <Select.Option value="90d">Last 90 days</Select.Option>
              <Select.Option value="1y">Last year</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadAnalyticsData}>
              Refresh
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Key Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tenants"
                value={metrics?.totalTenants}
                prefix={<ShopOutlined />}
                suffix={
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {metrics?.activeTenants} active
                  </Tag>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={metrics?.totalUsers}
                prefix={<UserOutlined />}
                suffix={
                  <span style={{ fontSize: 14, color: '#52c41a' }}>
                    <ArrowUpOutlined /> 12.5%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Monthly Recurring Revenue"
                value={metrics?.mrr}
                prefix={<DollarOutlined />}
                precision={0}
                suffix={
                  <span style={{ fontSize: 14, color: '#52c41a' }}>
                    <ArrowUpOutlined /> 8.3%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Churn Rate"
                value={metrics?.churnRate}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: metrics && metrics.churnRate < 5 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Revenue Trends" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1890ff"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Total Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="#52c41a"
                    fillOpacity={1}
                    fill="url(#colorMRR)"
                    name="MRR"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Plan Distribution" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={planDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="User Growth" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#1890ff"
                    strokeWidth={2}
                    name="Total Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#52c41a"
                    strokeWidth={2}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="API Usage (Last 7 Days)" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={apiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                  <Bar dataKey="calls" fill="#722ed1" name="API Calls" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Tenant Usage Table */}
        <Card title="Tenant Usage & Revenue">
          <Table
            columns={tenantColumns}
            dataSource={tenantUsage}
            rowKey="tenant_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </>
  );
};

export default SuperAdminAnalyticsPage;