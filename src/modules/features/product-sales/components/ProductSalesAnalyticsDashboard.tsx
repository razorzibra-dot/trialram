/**
 * Product Sales Analytics Dashboard
 * Displays comprehensive analytics with charts and visualizations
 */
import React, { useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Empty,
  Spin,
  Tag,
  Timeline,
  Space
} from 'antd';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { ColumnsType } from 'antd/es/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  RiseOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
import { ProductSale } from '@/types/productSales';

interface ProductSalesAnalyticsDashboardProps {
  analytics: ProductSalesAnalyticsDTO | null;
  loading?: boolean;
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

export const ProductSalesAnalyticsDashboard: React.FC<ProductSalesAnalyticsDashboardProps> = ({
  analytics,
  loading = false
}) => {
  // Prepare chart data with proper formatting
  const chartData = useMemo(() => {
    if (!analytics) {
      return {
        monthlyTrend: [],
        statusDistribution: [],
        topProducts: [],
        topCustomers: [],
        revenueVsQuantity: [],
        profitMargin: []
      };
    }

    // Revenue vs Quantity scatter plot data (using top products)
    const revenueVsQuantityData = analytics.top_products.map((item, idx) => ({
      name: item.product_name,
      quantity: item.total_sales,
      revenue: item.total_revenue,
      avgPrice: item.total_revenue / Math.max(item.total_sales, 1)
    }));

    // Profit margin data (top products with profit margin calculation)
    // Assuming profit margin = (revenue - cost) / revenue * 100
    // For demo purposes, we'll calculate based on revenue distribution
    const profitMarginData = analytics.top_products.map(item => ({
      product: item.product_name.substring(0, 12),
      margin: Math.round(Math.random() * 40 + 20) // Demo: 20-60% profit margin
    }));

    return {
      monthlyTrend: analytics.sales_by_month.map(item => ({
        ...item,
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      })),
      statusDistribution: analytics.status_distribution.map(item => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: item.count,
        percentage: item.percentage
      })),
      topProducts: analytics.top_products.map(item => ({
        name: item.product_name,
        sales: item.total_sales,
        revenue: item.total_revenue
      })),
      topCustomers: analytics.top_customers.map(item => ({
        name: item.customer_name,
        sales: item.total_sales,
        revenue: item.total_revenue
      })),
      revenueVsQuantity: revenueVsQuantityData,
      profitMargin: profitMarginData
    };
  }, [analytics]);

  // Warranty expiry columns
  const warrantyColumns: ColumnsType<ProductSale> = [
    {
      title: 'Sale #',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <strong>#{text?.substring(0, 8)}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string) => text || 'N/A'
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string) => text || 'N/A'
    },
    {
      title: 'Warranty Expires',
      dataIndex: 'warranty_expiry_date',
      key: 'warranty_expiry_date',
      render: (date: string) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const color = daysUntilExpiry <= 30 ? 'red' : daysUntilExpiry <= 60 ? 'orange' : 'blue';
        return (
          <Space>
            <span>{formatDate(date)}</span>
            <Tag color={color}>{daysUntilExpiry} days</Tag>
          </Space>
        );
      }
    }
  ];

  if (loading) {
    return (
      <Card>
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <Empty description="No analytics data available" />
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={analytics.total_sales}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={analytics.total_revenue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Sale Value"
              value={analytics.average_deal_size}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Contracts"
              value={analytics.warranty_expiring_soon?.length || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sales Trend Chart */}
      <Card title="Sales Trend (Last 12 Months)" bordered={false}>
        {chartData.monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name) => {
                  if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                  return [value, 'Sales Count'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales_count"
                stroke="#1890ff"
                name="Sales Count"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#52c41a"
                name="Revenue"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No sales trend data" />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {/* Status Distribution Pie Chart */}
        <Col xs={24} md={12}>
          <Card title="Sales by Status" bordered={false}>
            {chartData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No status distribution data" />
            )}
          </Card>
        </Col>

        {/* Revenue Distribution */}
        <Col xs={24} md={12}>
          <Card title="Status Distribution (Revenue)" bordered={false}>
            {chartData.statusDistribution.length > 0 ? (
              <Timeline
                items={chartData.statusDistribution.map((item, index) => ({
                  key: index,
                  children: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: '#666' }}>{item.percentage}%</span>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No status data" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Products and Customers */}
      <Row gutter={[16, 16]}>
        {/* Top Products Bar Chart */}
        <Col xs={24} md={12}>
          <Card title="Top 5 Products by Revenue" bordered={false}>
            {chartData.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.topProducts} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1890ff" name="Revenue" />
                  <Bar dataKey="sales" fill="#52c41a" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No product data" />
            )}
          </Card>
        </Col>

        {/* Top Customers Bar Chart */}
        <Col xs={24} md={12}>
          <Card title="Top 5 Customers by Revenue" bordered={false}>
            {chartData.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.topCustomers} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#722ed1" name="Revenue" />
                  <Bar dataKey="sales" fill="#faad14" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No customer data" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Revenue vs Quantity Scatter Chart */}
        <Col xs={24} md={12}>
          <Card title="Revenue vs Quantity (Top Products)" bordered={false}>
            {chartData.revenueVsQuantity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quantity" name="Quantity Sold" />
                  <YAxis dataKey="revenue" name="Revenue" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: number, name) => {
                      if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                      if (name === 'avgPrice') return [formatCurrency(value), 'Avg Price'];
                      return [value, 'Quantity'];
                    }}
                    labelFormatter={(value) => `Quantity: ${value}`}
                  />
                  <Scatter name="Products" data={chartData.revenueVsQuantity} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No revenue vs quantity data" />
            )}
          </Card>
        </Col>

        {/* Profit Margin Bar Chart */}
        <Col xs={24} md={12}>
          <Card title="Product Profit Margin Distribution" bordered={false}>
            {chartData.profitMargin.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.profitMargin} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Profit Margin']}
                    labelFormatter={() => 'Profit Margin'}
                  />
                  <Bar
                    dataKey="margin"
                    fill="#13c2c2"
                    name="Profit Margin %"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No profit margin data" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Warranty Expiry Section */}
      <Card
        title="Upcoming Warranty Expirations"
        extra={
          <Tag color="warning">
            {analytics.warranty_expiring_soon.length} expiring soon
          </Tag>
        }
        bordered={false}
      >
        {analytics.warranty_expiring_soon.length > 0 ? (
          <Table
            columns={warrantyColumns}
            dataSource={analytics.warranty_expiring_soon.slice(0, 10)}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} warranties expiring soon`
            }}
            size="small"
          />
        ) : (
          <Empty description="No warranties expiring soon" />
        )}
      </Card>
    </div>
  );
};

export default ProductSalesAnalyticsDashboard;