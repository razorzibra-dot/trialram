/**
 * Dashboard Page - Enterprise Design
 * Redesigned with Ant Design and Salesforce-inspired UI
 * Professional, clean, and consistent design
 */

import React from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Tag, Space, Button } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { 
  Users, 
  DollarSign, 
  Target, 
  TrendingUp,
  Activity,
  Package
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { 
  useDashboardStats, 
  useRecentActivity, 
  useTopCustomers, 
  useTicketStats 
} from '../hooks/useDashboard';

export const DashboardPageNew: React.FC = () => {
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
    <div>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your business today."
        breadcrumb={[
          { title: 'Home', href: '/' },
          { title: 'Dashboard' },
        ]}
        extra={
          <Space>
            <Button>Download Report</Button>
            <Button type="primary">New Customer</Button>
          </Space>
        }
      />

      {/* Page Content */}
      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              description="Active customers"
              icon={Users}
              trend={{ value: 12.5, isPositive: true }}
              loading={statsLoading}
              color="primary"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Deals"
              value={stats?.totalDeals || 0}
              description="Deals in pipeline"
              icon={Target}
              trend={{ value: 8.2, isPositive: true }}
              loading={statsLoading}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Open Tickets"
              value={stats?.totalTickets || 0}
              description="Support requests"
              icon={Activity}
              trend={{ value: 3.1, isPositive: false }}
              loading={statsLoading}
              color="warning"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              description="This month"
              icon={DollarSign}
              trend={{ value: 15.3, isPositive: true }}
              loading={statsLoading}
              color="success"
            />
          </Col>
        </Row>

        {/* Charts and Lists */}
        <Row gutter={[16, 16]}>
          {/* Recent Activity */}
          <Col xs={24} lg={16}>
            <Card
              title="Recent Activity"
              variant="borderless"
              loading={activityLoading}
              extra={<Button type="link">View All</Button>}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentActivity || []}
                renderItem={(item: { title: string; description: string; type: string; timestamp: string }) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: '#1B7CED' }}
                        />
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 500 }}>{item.title}</span>
                          <Tag color={item.type === 'success' ? 'success' : 'default'}>
                            {item.type}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span style={{ color: '#6B7280' }}>{item.description}</span>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                            {item.timestamp}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Top Customers */}
          <Col xs={24} lg={8}>
            <Card
              title="Top Customers"
              variant="borderless"
              loading={customersLoading}
              extra={<Button type="link">View All</Button>}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={topCustomers || []}
                renderItem={(item: { name: string; revenue: number }, index: number) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: index === 0 ? '#10B981' : '#1B7CED',
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      }
                      description={
                        <span style={{ color: '#10B981', fontWeight: 500 }}>
                          {formatCurrency(item.revenue)}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* Ticket Statistics */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Support Tickets Overview"
              variant="borderless"
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
              variant="borderless"
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
      </div>
    </div>
  );
};

export default DashboardPageNew;