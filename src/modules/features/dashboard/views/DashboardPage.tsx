/**
 * Dashboard Page - Unified Enterprise Design
 * Main dashboard with comprehensive overview statistics and widgets
 * Merged features from DashboardPage and DashboardPageNew
 */

import React from 'react';
import { Row, Col, Card, Button, Space, Statistic, Progress, List, Avatar, Tag } from 'antd';
import { 
  UserAddOutlined, 
  CustomerServiceOutlined, 
  RocketOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { 
  Users, 
  DollarSign, 
  Activity, 
  Target
} from 'lucide-react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import { 
  RecentActivityWidget, 
  TopCustomersWidget, 
  TicketStatsWidget 
} from '../components/DashboardWidgets';
import { 
  useDashboardStats, 
  useRecentActivity, 
  useTopCustomers, 
  useTicketStats 
} from '../hooks/useDashboard';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: topCustomers, isLoading: customersLoading } = useTopCustomers(5);
  const { data: ticketStats, isLoading: ticketStatsLoading } = useTicketStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your business today."
        breadcrumb={{
          items: [
            { title: 'Home', path: '/' },
            { title: 'Dashboard' }
          ]
        }}
        extra={
          <Space>
            <Button>Download Report</Button>
            <Button type="primary" icon={<UserAddOutlined />}>New Customer</Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Main Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              description="Active customers"
              icon={Users}
              trend={{ value: 12.5, isPositive: true }}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Deals"
              value={stats?.totalDeals || 0}
              description="Deals in pipeline"
              icon={Target}
              trend={{ value: 8.2, isPositive: true }}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Open Tickets"
              value={stats?.totalTickets || 0}
              description="Support requests"
              icon={Activity}
              trend={{ value: 3.1, isPositive: false }}
              color="warning"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              description="This month"
              icon={DollarSign}
              trend={{ value: 15.3, isPositive: true }}
              color="success"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* Activity and Customers Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <RecentActivityWidget
              activities={recentActivity || []}
              loading={activityLoading}
            />
          </Col>
          <Col xs={24} lg={8}>
            <TopCustomersWidget
              customers={topCustomers || []}
              loading={customersLoading}
            />
          </Col>
        </Row>

        {/* Tickets and Sales Pipeline Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Support Tickets Overview"
              bordered={false}
              loading={ticketStatsLoading}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Open Tickets"
                    value={ticketStats?.open || 0}
                    prefix={<ClockCircleOutlined style={{ color: '#F97316' }} />}
                    valueStyle={{ color: '#F97316' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Resolved"
                    value={ticketStats?.resolved || 0}
                    prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
                    valueStyle={{ color: '#10B981' }}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Resolution Rate</span>
                  <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                    {ticketStats?.resolutionRate || 0}%
                  </span>
                </div>
                <Progress
                  percent={ticketStats?.resolutionRate || 0}
                  strokeColor="#10B981"
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Sales Pipeline"
              bordered={false}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Qualification</span>
                    <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(125000)}
                    </span>
                  </div>
                  <Progress percent={75} strokeColor="#1B7CED" showInfo={false} />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Proposal</span>
                    <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(85000)}
                    </span>
                  </div>
                  <Progress percent={60} strokeColor="#3B82F6" showInfo={false} />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Negotiation</span>
                    <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(45000)}
                    </span>
                  </div>
                  <Progress percent={40} strokeColor="#10B981" showInfo={false} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              title="Quick Actions" 
              bordered={false}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="default"
                    icon={<UserAddOutlined />}
                    size="large"
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '16px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>Add New Customer</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 4 }}>
                        Create a new customer record
                      </div>
                    </div>
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="default"
                    icon={<RocketOutlined />}
                    size="large"
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '16px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>Create Deal</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 4 }}>
                        Start tracking a new opportunity
                      </div>
                    </div>
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="default"
                    icon={<CustomerServiceOutlined />}
                    size="large"
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '16px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>New Support Ticket</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 4 }}>
                        Create a support request
                      </div>
                    </div>
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </EnterpriseLayout>
  );
};
