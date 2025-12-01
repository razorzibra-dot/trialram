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
import { PageHeader, StatCard } from '@/components/common';
import { PermissionControlled } from '@/components/common/PermissionControlled';
import { usePermission } from '@/hooks/useElementPermissions';
import {
  RecentActivityWidget,
  TopCustomersWidget,
  TicketStatsWidget
} from '../components/DashboardWidgets';
import {
  useDashboardStats,
  useRecentActivity,
  useTopCustomers,
  useTicketStats,
  useSalesPipeline
} from '../hooks/useDashboard';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: topCustomers, isLoading: customersLoading } = useTopCustomers(5);
  const { data: ticketStats, isLoading: ticketStatsLoading } = useTicketStats();
  const { data: salesPipeline, isLoading: pipelineLoading } = useSalesPipeline();

  // Element-level permissions for dashboard
  const canViewDashboard = usePermission('crm:dashboard:panel:view', 'accessible');
  const canViewStats = usePermission('crm:dashboard:stats:view', 'visible');
  const canViewRecentActivity = usePermission('crm:dashboard:widget.recentactivity:view', 'visible');
  const canViewTopCustomers = usePermission('crm:dashboard:widget.topcrm:customer:record:read', 'visible');
  const canViewTicketStats = usePermission('crm:dashboard:widget.ticketstats:view', 'visible');
  const canViewSalesPipeline = usePermission('crm:dashboard:widget.salespipeline:view', 'visible');
  const canViewQuickActions = usePermission('crm:dashboard:section.quickactions:view', 'visible');
  const canDownloadReport = usePermission('crm:dashboard:button.downloadreport', 'visible');
  const canCreateCustomer = usePermission('crm:dashboard:button.newcustomer', 'visible');
  const canCreateDeal = usePermission('crm:dashboard:button.createdeal', 'visible');
  const canCreateTicket = usePermission('crm:dashboard:button.newticket', 'visible');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
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
            {canDownloadReport && <Button>Download Report</Button>}
            {canCreateCustomer && <Button type="primary" icon={<UserAddOutlined />}>New Customer</Button>}
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Main Statistics Cards */}
        {canViewStats && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Customers"
                value={stats?.totalCustomers || 0}
                description="Active customers"
                icon={Users}
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
                color="success"
                loading={statsLoading}
              />
            </Col>
          </Row>
        )}

        {/* Activity and Customers Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {canViewRecentActivity && (
            <Col xs={24} lg={16}>
              <RecentActivityWidget
                activities={recentActivity || []}
                loading={activityLoading}
              />
            </Col>
          )}
          {canViewTopCustomers && (
            <Col xs={24} lg={8}>
              <TopCustomersWidget
                customers={topCustomers || []}
                loading={customersLoading}
              />
            </Col>
          )}
        </Row>

        {/* Tickets and Sales Pipeline Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {canViewTicketStats && (
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
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="In Progress"
                    value={ticketStats?.inProgress || 0}
                    prefix={<ClockCircleOutlined style={{ color: '#3B82F6' }} />}
                    valueStyle={{ color: '#3B82F6' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Closed"
                    value={ticketStats?.closed || 0}
                    prefix={<CheckCircleOutlined style={{ color: '#6B7280' }} />}
                    valueStyle={{ color: '#6B7280' }}
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
          )}

          {canViewSalesPipeline && (
            <Col xs={24} lg={12}>
              <Card
                title="Sales Pipeline"
                variant="borderless"
                loading={pipelineLoading}
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
                      {formatCurrency(salesPipeline?.qualification?.value || 0)}
                    </span>
                  </div>
                  <Progress percent={salesPipeline?.qualification?.percentage || 0} strokeColor="#1B7CED" showInfo={false} />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Proposal</span>
                    <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(salesPipeline?.proposal?.value || 0)}
                    </span>
                  </div>
                  <Progress percent={salesPipeline?.proposal?.percentage || 0} strokeColor="#3B82F6" showInfo={false} />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Negotiation</span>
                    <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                      {formatCurrency(salesPipeline?.negotiation?.value || 0)}
                    </span>
                  </div>
                  <Progress percent={salesPipeline?.negotiation?.percentage || 0} strokeColor="#10B981" showInfo={false} />
                </div>
              </Space>
              </Card>
            </Col>
          )}
        </Row>

        {/* Quick Actions */}
        {canViewQuickActions && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title="Quick Actions"
                variant="borderless"
                style={{
                  borderRadius: 8,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Row gutter={[16, 16]}>
                  {canCreateCustomer && (
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
                  )}
                  {canCreateDeal && (
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
                  )}
                  {canCreateTicket && (
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
                  )}
                </Row>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
