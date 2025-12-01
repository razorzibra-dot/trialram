/**
 * Customer Analytics Dashboard
 * Advanced analytics and insights for customer management
 */

import React from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tabs, Select, DatePicker } from 'antd';
import { PageHeader, StatCard } from '@/components/common';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ShoppingCart,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  useCustomerAnalytics,
  useCustomerSegmentationAnalytics,
  useCustomerLifecycleAnalytics,
  useCustomerBehaviorAnalytics
} from '../hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const CustomerAnalyticsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  // Analytics data
  const { data: analytics, isLoading: analyticsLoading } = useCustomerAnalytics();
  const { data: segmentation, isLoading: segmentationLoading } = useCustomerSegmentationAnalytics();
  const { data: lifecycle, isLoading: lifecycleLoading } = useCustomerLifecycleAnalytics();
  const { data: behavior, isLoading: behaviorLoading } = useCustomerBehaviorAnalytics();

  // Check permissions
  if (!hasPermission('crm:customer:record:read')) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <AlertTriangle size={48} style={{ color: '#faad14', marginBottom: 16 }} />
        <h3>You don't have permission to view customer analytics</h3>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Customer Analytics"
        description="Advanced insights and analytics for customer management"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Customers', path: '/tenant/customers' },
            { title: 'Analytics' }
          ]
        }}
      />

      <div style={{ padding: 24 }}>
        {/* Key Metrics Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={analytics?.totalRevenue || 0}
                prefix={<DollarSign size={16} style={{ color: '#10b981' }} />}
                suffix="$"
                valueStyle={{ color: '#10b981' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                All-time customer revenue
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Order Value"
                value={analytics?.averageOrderValue || 0}
                prefix={<ShoppingCart size={16} style={{ color: '#3b82f6' }} />}
                suffix="$"
                valueStyle={{ color: '#3b82f6' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Average per order
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Customer LTV"
                value={analytics?.customerLifetimeValue || 0}
                prefix={<TrendingUp size={16} style={{ color: '#f59e0b' }} />}
                suffix="$"
                valueStyle={{ color: '#f59e0b' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Lifetime value per customer
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="NPS Score"
              value={analytics?.npsScore || 0}
              description="Net Promoter Score"
              icon={Target}
              color="primary"
              loading={analyticsLoading}
            />
          </Col>
        </Row>

        {/* Performance Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Retention Rate"
                value={analytics?.retentionRate ? analytics.retentionRate * 100 : 0}
                suffix="%"
                valueStyle={{ color: '#10b981' }}
                prefix={<UserCheck size={16} />}
              />
              <Progress
                percent={analytics?.retentionRate ? analytics.retentionRate * 100 : 0}
                strokeColor="#10b981"
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Churn Rate"
                value={analytics?.churnRate ? analytics.churnRate * 100 : 0}
                suffix="%"
                valueStyle={{ color: '#ef4444' }}
                prefix={<UserX size={16} />}
              />
              <Progress
                percent={analytics?.churnRate ? analytics.churnRate * 100 : 0}
                strokeColor="#ef4444"
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Acquisition Rate"
                value={analytics?.acquisitionRate ? analytics.acquisitionRate * 100 : 0}
                suffix="%"
                prefix={<Users size={16} style={{ color: '#3b82f6' }} />}
                valueStyle={{ color: '#3b82f6' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                New customer acquisition
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Satisfaction"
                value={analytics?.customerSatisfaction || 0}
                suffix="/5"
                prefix={<Activity size={16} style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                Customer satisfaction score
              </div>
            </Card>
          </Col>
        </Row>

        {/* Detailed Analytics Tabs */}
        <Card>
          <Tabs defaultActiveKey="segmentation" size="large">
            {/* Customer Segmentation */}
            <TabPane
              tab={
                <span>
                  <PieChart size={16} style={{ marginRight: 8 }} />
                  Segmentation
                </span>
              }
              key="segmentation"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Segment Distribution" size="small">
                    {segmentation?.segments.map((segment, index) => (
                      <div key={segment.name} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>{segment.name}</span>
                          <span>{segment.customerCount} customers</span>
                        </div>
                        <Progress
                          percent={(segment.customerCount / segmentation.segments.reduce((sum, s) => sum + s.customerCount, 0)) * 100}
                          strokeColor={`hsl(${index * 60}, 70%, 50%)`}
                          showInfo={false}
                        />
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          Avg Value: ${segment.averageValue.toLocaleString()} |
                          Churn Risk: {(segment.churnRisk * 100).toFixed(1)}% |
                          Engagement: {segment.engagementScore.toFixed(1)}/5
                        </div>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Top Customers" size="small">
                    <Table
                      dataSource={analytics?.topCustomers || []}
                      columns={[
                        {
                          title: 'Customer',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: 'Value',
                          dataIndex: 'value',
                          key: 'value',
                          render: (value: number) => `$${value.toLocaleString()}`,
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* Customer Lifecycle */}
            <TabPane
              tab={
                <span>
                  <Activity size={16} style={{ marginRight: 8 }} />
                  Lifecycle
                </span>
              }
              key="lifecycle"
            >
              <Row gutter={[16, 16]}>
                {lifecycle?.lifecycleStages.map((stage, index) => (
                  <Col xs={24} sm={12} lg={8} key={stage.stage}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                          {stage.stage}
                        </div>
                        <Statistic
                          value={stage.customerCount}
                          title="Customers"
                          valueStyle={{ fontSize: 24 }}
                        />
                        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                          Avg {stage.averageDays} days |
                          {(stage.conversionRate * 100).toFixed(1)}% conversion |
                          {(stage.dropOffRate * 100).toFixed(1)}% drop-off
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </TabPane>

            {/* Customer Behavior */}
            <TabPane
              tab={
                <span>
                  <BarChart3 size={16} style={{ marginRight: 8 }} />
                  Behavior
                </span>
              }
              key="behavior"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Engagement Metrics" size="small">
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Average Interactions</span>
                        <span style={{ fontWeight: 500 }}>
                          {behavior?.engagementMetrics.averageInteractionsPerCustomer.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Most Active Time</span>
                        <span style={{ fontWeight: 500 }}>
                          {behavior?.engagementMetrics.mostActiveTime}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Response Time (Avg)</span>
                        <span style={{ fontWeight: 500 }}>
                          {behavior?.engagementMetrics.responseTimes.average.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>Preferred Channels</div>
                      {behavior?.engagementMetrics.preferredChannels &&
                        Object.entries(behavior.engagementMetrics.preferredChannels).map(([channel, percentage]) => (
                          <div key={channel} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                            <span>{(percentage * 100).toFixed(1)}%</span>
                          </div>
                        ))
                      }
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Purchase Patterns" size="small">
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Avg Order Frequency</span>
                        <span style={{ fontWeight: 500 }}>
                          {behavior?.purchasePatterns.averageOrderFrequency} days
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>Top Categories</div>
                      {behavior?.purchasePatterns.commonProductCategories &&
                        Object.entries(behavior.purchasePatterns.commonProductCategories)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([category, percentage]) => (
                            <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span>{category}</span>
                              <span>{(percentage * 100).toFixed(1)}%</span>
                            </div>
                          ))
                      }
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Churn Risk Indicators */}
              {behavior?.churnIndicators && behavior.churnIndicators.length > 0 && (
                <Card title="Churn Risk Alerts" size="small" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={behavior.churnIndicators}
                    columns={[
                      {
                        title: 'Customer ID',
                        dataIndex: 'customerId',
                        key: 'customerId',
                      },
                      {
                        title: 'Risk Score',
                        dataIndex: 'riskScore',
                        key: 'riskScore',
                        render: (score: number) => (
                          <span style={{
                            color: score > 0.8 ? '#ef4444' : score > 0.6 ? '#f59e0b' : '#10b981',
                            fontWeight: 500
                          }}>
                            {(score * 100).toFixed(1)}%
                          </span>
                        ),
                      },
                      {
                        title: 'Indicators',
                        dataIndex: 'indicators',
                        key: 'indicators',
                        render: (indicators: string[]) => (
                          <div>
                            {indicators.map((indicator, index) => (
                              <span key={index} style={{
                                display: 'inline-block',
                                backgroundColor: '#f0f0f0',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 12,
                                margin: '0 2px 2px 0'
                              }}>
                                {indicator}
                              </span>
                            ))}
                          </div>
                        ),
                      },
                      {
                        title: 'Predicted Churn',
                        dataIndex: 'predictedChurnDate',
                        key: 'predictedChurnDate',
                        render: (date?: string) => date ? new Date(date).toLocaleDateString() : '-',
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}
            </TabPane>

            {/* Revenue Trends */}
            <TabPane
              tab={
                <span>
                  <TrendingUp size={16} style={{ marginRight: 8 }} />
                  Revenue Trends
                </span>
              }
              key="revenue"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card title="Monthly Revenue" size="small">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {analytics?.revenueByMonth &&
                        Object.entries(analytics.revenueByMonth)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([month, revenue]) => (
                            <div key={month} style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{month}</div>
                              <div style={{ fontSize: 16, fontWeight: 600 }}>
                                ${(revenue / 1000).toFixed(0)}k
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card title="Customer Growth" size="small">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      {analytics?.customerGrowth &&
                        Object.entries(analytics.customerGrowth)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([month, count]) => (
                            <div key={month} style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{month}</div>
                              <div style={{ fontSize: 16, fontWeight: 600 }}>
                                +{count}
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </>
  );
};

export default CustomerAnalyticsPage;