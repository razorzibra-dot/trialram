/**
 * Customer Analytics Dashboard
 * Advanced analytics and insights for customer management
 */

import React, { useMemo } from 'react';
import { Empty } from 'antd';
import { PageHeader } from '@/components/common';
import GenericAnalyticsPage from '@/components/generics/GenericAnalyticsPage';
import { AnalyticsConfig } from '@/types/analytics';
import { CUSTOMER_PERMISSIONS } from '../constants/permissions';
import { Customer } from '@/types/crm';
import { useModuleData } from '@/contexts/ModuleDataContext';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Activity,
  ShoppingCart,
  UserCheck,
  UserX
} from 'lucide-react';

const customerAnalyticsConfig: AnalyticsConfig = {
  title: 'Customer Analytics',
  description: 'Advanced insights and analytics for customer management',
  breadcrumb: [
    { title: 'Dashboard', path: '/tenant/dashboard' },
    { title: 'Customers', path: '/tenant/customers' },
    { title: 'Analytics' }
  ],
  permission: CUSTOMER_PERMISSIONS.READ,
  sections: [
    {
      id: 'key-metrics',
      type: 'grid',
      columns: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6 },
      widgets: [
        {
          id: 'total-revenue',
          type: 'stat',
          title: 'Total Revenue',
          value: ({ analytics }) => analytics?.totalRevenue || 0,
          suffix: '$',
          prefix: <DollarSign size={16} style={{ color: '#10b981' }} />,
          color: '#10b981',
          description: 'All-time customer revenue',
          loadingKey: 'analytics'
        },
        {
          id: 'avg-order-value',
          type: 'stat',
          title: 'Avg Order Value',
          value: ({ analytics }) => analytics?.averageOrderValue || 0,
          suffix: '$',
          prefix: <ShoppingCart size={16} style={{ color: '#3b82f6' }} />,
          color: '#3b82f6',
          description: 'Average per order',
          loadingKey: 'analytics'
        },
        {
          id: 'ltv',
          type: 'stat',
          title: 'Customer LTV',
          value: ({ analytics }) => analytics?.customerLifetimeValue || 0,
          suffix: '$',
          prefix: <TrendingUp size={16} style={{ color: '#f59e0b' }} />,
          color: '#f59e0b',
          description: 'Lifetime value per customer',
          loadingKey: 'analytics'
        },
        {
          id: 'nps',
          type: 'stat',
          title: 'NPS Score',
          value: ({ analytics }) => analytics?.npsScore || 0,
          description: 'Net Promoter Score',
          prefix: <Target size={16} style={{ color: '#6366f1' }} />,
          color: '#6366f1',
          loadingKey: 'analytics'
        }
      ]
    },
    {
      id: 'performance-metrics',
      type: 'grid',
      columns: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6 },
      widgets: [
        {
          id: 'retention-rate',
          type: 'progress',
          title: 'Retention Rate',
          value: ({ analytics }) => (analytics?.retentionRate || 0) * 100,
          percent: ({ analytics }) => (analytics?.retentionRate || 0) * 100,
          suffix: '%',
          color: '#10b981',
          prefix: <UserCheck size={16} style={{ color: '#10b981' }} />,
          description: 'Active customers retained',
          loadingKey: 'analytics'
        },
        {
          id: 'churn-rate',
          type: 'progress',
          title: 'Churn Rate',
          value: ({ analytics }) => (analytics?.churnRate || 0) * 100,
          percent: ({ analytics }) => (analytics?.churnRate || 0) * 100,
          suffix: '%',
          color: '#ef4444',
          prefix: <UserX size={16} style={{ color: '#ef4444' }} />,
          description: 'Inactive or lost customers',
          loadingKey: 'analytics'
        },
        {
          id: 'acquisition-rate',
          type: 'progress',
          title: 'Acquisition Rate',
          value: ({ analytics }) => (analytics?.acquisitionRate || 0) * 100,
          percent: ({ analytics }) => (analytics?.acquisitionRate || 0) * 100,
          suffix: '%',
          color: '#3b82f6',
          prefix: <Users size={16} style={{ color: '#3b82f6' }} />,
          description: 'New customers acquired',
          loadingKey: 'analytics'
        },
        {
          id: 'satisfaction',
          type: 'stat',
          title: 'Satisfaction',
          value: ({ analytics }) => analytics?.customerSatisfaction || 0,
          suffix: '/5',
          prefix: <Activity size={16} style={{ color: '#10b981' }} />,
          color: '#10b981',
          description: 'Customer satisfaction score',
          loadingKey: 'analytics'
        }
      ]
    },
    {
      id: 'analytics-tabs',
      type: 'tabs',
      tabs: [
        {
          key: 'segmentation',
          label: (
            <span>
              <PieChart size={16} style={{ marginRight: 8 }} />
              Segmentation
            </span>
          ),
          sections: [
            {
              id: 'segmentation-grid',
              type: 'grid',
              columns: { xs: 24, lg: 12 },
              widgets: [
                {
                  id: 'segment-distribution',
                  type: 'custom',
                  title: 'Segment Distribution',
                  loadingKey: 'segmentation',
                  render: ({ segmentation }) => {
                    const segments = segmentation?.segments || [];

                    if (!segments.length) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No segment data" />;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {segments.map((segment: any, index: number) => {
                          const entries = segment.data
                            ? Object.entries(segment.data)
                            : [];
                          const total = entries.reduce((sum, [, count]) => sum + (count as number), 0) || 1;

                          return (
                            <div key={segment.name || index}>
                              <div style={{ fontWeight: 600, marginBottom: 8 }}>{segment.name || 'Segment'}</div>
                              {entries.map(([label, count], idx) => (
                                <div key={label} style={{ marginBottom: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>{label}</span>
                                    <span>{count as number} customers</span>
                                  </div>
                                  <div
                                    style={{
                                      height: 8,
                                      borderRadius: 4,
                                      background: '#f0f0f0',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${((count as number) / total) * 100}%`,
                                        height: '100%',
                                        background: `hsl(${(index + idx) * 40}, 70%, 50%)`
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                },
                {
                  id: 'top-customers',
                  type: 'table',
                  title: 'Top Customers',
                  columns: [
                    {
                      title: 'Customer',
                      dataIndex: 'name',
                      key: 'name'
                    },
                    {
                      title: 'Value',
                      dataIndex: 'value',
                      key: 'value',
                      render: (value: number) => `$${(value || 0).toLocaleString()}`
                    }
                  ],
                  dataSource: ({ analytics }) => analytics?.topCustomers || [],
                  rowKey: 'id',
                  loadingKey: 'analytics',
                  emptyText: 'No top customers found'
                }
              ]
            }
          ]
        },
        {
          key: 'lifecycle',
          label: (
            <span>
              <Activity size={16} style={{ marginRight: 8 }} />
              Lifecycle
            </span>
          ),
          sections: [
            {
              id: 'lifecycle-grid',
              type: 'grid',
              columns: { xs: 24, sm: 12, lg: 8 },
              widgets: [
                {
                  id: 'lifecycle-stages',
                  type: 'custom',
                  title: 'Lifecycle Stages',
                  loadingKey: 'lifecycle',
                  render: ({ lifecycle }) => {
                    const stages = lifecycle?.lifecycleStages || lifecycle?.stages || [];

                    if (!stages.length) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No lifecycle data" />;
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {stages.map((stage: any) => (
                          <div key={stage.stage} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{stage.stage}</div>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{stage.customerCount ?? stage.count ?? 0}</div>
                            {stage.averageDays !== undefined && (
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Avg {stage.averageDays} days</div>
                            )}
                            {(stage.conversionRate !== undefined || stage.dropOffRate !== undefined) && (
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                {stage.conversionRate !== undefined && `${(stage.conversionRate * 100).toFixed(1)}% conversion`}
                                {stage.conversionRate !== undefined && stage.dropOffRate !== undefined && ' | '}
                                {stage.dropOffRate !== undefined && `${(stage.dropOffRate * 100).toFixed(1)}% drop-off`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                }
              ]
            }
          ]
        },
        {
          key: 'behavior',
          label: (
            <span>
              <BarChart3 size={16} style={{ marginRight: 8 }} />
              Behavior
            </span>
          ),
          sections: [
            {
              id: 'behavior-grid',
              type: 'grid',
              columns: { xs: 24, lg: 12 },
              widgets: [
                {
                  id: 'engagement-metrics',
                  type: 'custom',
                  title: 'Engagement Metrics',
                  loadingKey: 'behavior',
                  render: ({ behavior }) => {
                    const metrics = behavior?.engagementMetrics;

                    if (!metrics) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No engagement data" />;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Average Interactions</span>
                          <span style={{ fontWeight: 600 }}>
                            {metrics.averageInteractionsPerCustomer?.toFixed ? metrics.averageInteractionsPerCustomer.toFixed(1) : metrics.averageInteractionsPerCustomer || 0}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Most Active Time</span>
                          <span style={{ fontWeight: 600 }}>{metrics.mostActiveTime || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Response Time (Avg)</span>
                          <span style={{ fontWeight: 600 }}>
                            {metrics.responseTimes?.average ? `${metrics.responseTimes.average.toFixed(1)}h` : '-'}
                          </span>
                        </div>
                        <div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>Preferred Channels</div>
                          {metrics.preferredChannels
                            ? Object.entries(metrics.preferredChannels).map(([channel, percentage]) => (
                                <div key={channel} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                                  <span>{((percentage as number) * 100).toFixed(1)}%</span>
                                </div>
                              ))
                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No channel data" />}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  id: 'purchase-patterns',
                  type: 'custom',
                  title: 'Purchase Patterns',
                  loadingKey: 'behavior',
                  render: ({ behavior }) => {
                    const patterns = behavior?.purchasePatterns;

                    if (!patterns) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No purchase data" />;
                    }

                    const topCategories = patterns.commonProductCategories
                      ? Object.entries(patterns.commonProductCategories)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 5)
                      : [];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Avg Order Frequency</span>
                          <span style={{ fontWeight: 600 }}>
                            {patterns.averageOrderFrequency ? `${patterns.averageOrderFrequency} days` : '-'}
                          </span>
                        </div>
                        <div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>Top Categories</div>
                          {topCategories.length ? (
                            topCategories.map(([category, percentage]) => (
                              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span>{category}</span>
                                <span>{((percentage as number) * 100).toFixed(1)}%</span>
                              </div>
                            ))
                          ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No category data" />
                          )}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  id: 'churn-indicators',
                  type: 'table',
                  title: 'Churn Risk Alerts',
                  loadingKey: 'behavior',
                  columns: [
                    { title: 'Customer ID', dataIndex: 'customerId', key: 'customerId' },
                    {
                      title: 'Risk Score',
                      dataIndex: 'riskScore',
                      key: 'riskScore',
                      render: (score: number) => (
                        <span
                          style={{
                            color: score > 0.8 ? '#ef4444' : score > 0.6 ? '#f59e0b' : '#10b981',
                            fontWeight: 500
                          }}
                        >
                          {(score * 100).toFixed(1)}%
                        </span>
                      )
                    },
                    {
                      title: 'Indicators',
                      dataIndex: 'indicators',
                      key: 'indicators',
                      render: (indicators: string[]) => (
                        <div>
                          {indicators?.map((indicator, index) => (
                            <span
                              key={`${indicator}-${index}`}
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#f0f0f0',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 12,
                                margin: '0 2px 2px 0'
                              }}
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      )
                    },
                    {
                      title: 'Predicted Churn',
                      dataIndex: 'predictedChurnDate',
                      key: 'predictedChurnDate',
                      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '-')
                    }
                  ],
                  dataSource: ({ behavior }) => behavior?.churnIndicators || [],
                  rowKey: 'customerId',
                  emptyText: 'No churn risk alerts'
                }
              ]
            }
          ]
        },
        {
          key: 'revenue',
          label: (
            <span>
              <TrendingUp size={16} style={{ marginRight: 8 }} />
              Revenue Trends
            </span>
          ),
          sections: [
            {
              id: 'revenue-trends',
              type: 'grid',
              columns: { xs: 24 },
              widgets: [
                {
                  id: 'monthly-revenue',
                  type: 'custom',
                  title: 'Monthly Revenue',
                  loadingKey: 'analytics',
                  render: ({ analytics }) => {
                    const revenueByMonth = analytics?.revenueByMonth;
                    if (!revenueByMonth || !Object.keys(revenueByMonth).length) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No revenue data" />;
                    }

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {Object.entries(revenueByMonth)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([month, revenue]) => (
                            <div key={month} style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{month}</div>
                              <div style={{ fontSize: 16, fontWeight: 600 }}>${((revenue as number) / 1000).toFixed(0)}k</div>
                            </div>
                          ))}
                      </div>
                    );
                  }
                },
                {
                  id: 'customer-growth',
                  type: 'custom',
                  title: 'Customer Growth',
                  loadingKey: 'analytics',
                  render: ({ analytics }) => {
                    const customerGrowth = analytics?.customerGrowth;
                    if (!customerGrowth || !Object.keys(customerGrowth).length) {
                      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No growth data" />;
                    }

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {Object.entries(customerGrowth)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([month, count]) => (
                            <div key={month} style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{month}</div>
                              <div style={{ fontSize: 16, fontWeight: 600 }}>+{count as number}</div>
                            </div>
                          ))}
                      </div>
                    );
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const normalizeCustomers = (raw: unknown): Customer[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Customer[];
  if (typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) return data as Customer[];
  }
  return [];
};

const buildDerivedAnalytics = (customers: Customer[]) => {
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + ((c as any).totalSalesAmount || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + ((c as any).totalOrders || 0), 0);
  const activeCount = customers.filter(c => c.status === 'active').length;
  const inactiveCount = customers.filter(c => c.status === 'inactive').length;
  const newLast30 = customers.filter(c => {
    if (!c.createdAt) return false;
    const created = new Date(c.createdAt);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);
    return created >= threshold;
  }).length;

  const topCustomers = [...customers]
    .sort((a, b) => (((b as any).totalSalesAmount || 0) as number) - (((a as any).totalSalesAmount || 0) as number))
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      name: c.companyName || c.contactName || 'Customer',
      value: ((c as any).totalSalesAmount || 0) as number,
    }));

  const analytics = {
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    customerLifetimeValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
    churnRate: totalCustomers > 0 ? inactiveCount / totalCustomers : 0,
    retentionRate: totalCustomers > 0 ? activeCount / totalCustomers : 0,
    acquisitionRate: totalCustomers > 0 ? newLast30 / totalCustomers : 0,
    customerSatisfaction: 0,
    npsScore: 0,
    topCustomers,
    customerGrowth: customers.reduce<Record<string, number>>((acc, customer) => {
      if (!customer.createdAt) return acc;
      const d = new Date(customer.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  };

  const segmentation = {
    segments: [
      customers.reduce<Record<string, number>>((acc, c) => {
        acc[c.industry || 'Unknown'] = (acc[c.industry || 'Unknown'] || 0) + 1;
        return acc;
      }, {}),
      customers.reduce<Record<string, number>>((acc, c) => {
        acc[c.size || 'Unknown'] = (acc[c.size || 'Unknown'] || 0) + 1;
        return acc;
      }, {}),
      customers.reduce<Record<string, number>>((acc, c) => {
        acc[c.status || 'Unknown'] = (acc[c.status || 'Unknown'] || 0) + 1;
        return acc;
      }, {}),
    ].map((data, idx) => {
      const names = ['By Industry', 'By Size', 'By Status'];
      return { name: names[idx], data };
    }),
  };

  const lifecycleStages = (() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const newCustomers = customers.filter(c => c.createdAt && new Date(c.createdAt) > thirtyDaysAgo).length;
    const activeRecently = customers.filter(c => c.lastContactDate && new Date(c.lastContactDate) > thirtyDaysAgo).length;
    const atRisk = customers.filter(
      c => c.lastContactDate && new Date(c.lastContactDate) < ninetyDaysAgo && c.status === 'active'
    ).length;

    return [
      { stage: 'New (30d)', customerCount: newCustomers },
      { stage: 'Active (30d)', customerCount: activeRecently },
      { stage: 'At Risk (90d+)', customerCount: atRisk },
      { stage: 'Churned', customerCount: inactiveCount },
    ];
  })();

  const behavior = {
    engagementMetrics: undefined,
    purchasePatterns: undefined,
  };

  return {
    analytics,
    segmentation,
    lifecycle: { lifecycleStages, stages: lifecycleStages },
    behavior,
  };
};

const CustomerAnalyticsPage: React.FC = () => {
  const { data: moduleData, isLoading, error, refresh } = useModuleData();

  const customers = useMemo(
    () => normalizeCustomers(moduleData?.moduleData?.customers),
    [moduleData?.moduleData?.customers]
  );

  const derived = useMemo(() => buildDerivedAnalytics(customers), [customers]);

  const loadingMap = useMemo(
    () => ({
      analytics: isLoading,
      segmentation: isLoading,
      lifecycle: isLoading,
      behavior: isLoading,
    }),
    [isLoading]
  );

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

      <GenericAnalyticsPage
        config={customerAnalyticsConfig}
        data={derived}
        loading={isLoading}
        loadingMap={loadingMap}
        error={error}
        onRetry={refresh}
      />
    </>
  );
};

export default CustomerAnalyticsPage;