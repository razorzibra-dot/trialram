/**
 * Admin Dashboard Page
 * Administrative dashboard with user management, role assignment, system settings, and analytics
 */

import React from 'react';
import { Row, Col, Card, Button, Space, Statistic, Progress, List, Avatar, Tag, Table } from 'antd';
import {
  UserAddOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  Users,
  Shield,
  Settings,
  TrendingUp
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { useAdminDashboardStats, useRecentUsers, useSystemHealth, useRoleDistribution } from '../hooks/useAdminDashboard';

const AdminDashboardPage: React.FC = () => {
  const { data: adminStats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: recentUsers, isLoading: usersLoading } = useRecentUsers(5);
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const { data: roleDistribution, isLoading: roleLoading } = useRoleDistribution();

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
        title="Admin Dashboard"
        description="Administrative overview and system management"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/' },
            { title: 'Admin Dashboard' }
          ]
        }}
        extra={
          <Space>
            <Button icon={<SettingOutlined />}>System Settings</Button>
            <Button type="primary" icon={<UserAddOutlined />}>Add User</Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Admin Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={adminStats?.totalUsers || 0}
              description="Active users in system"
              icon={Users}
              trend={{ value: 5.2, isPositive: true }}
              color="primary"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Tenants"
              value={adminStats?.activeTenants || 0}
              description="Active tenant organizations"
              icon={Shield}
              trend={{ value: 2.1, isPositive: true }}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="System Health"
              value={`${adminStats?.systemHealth || 0}%`}
              description="Overall system status"
              icon={DatabaseOutlined}
              trend={{ value: 0.5, isPositive: true }}
              color="success"
              loading={statsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Security Alerts"
              value={adminStats?.securityAlerts || 0}
              description="Active security alerts"
              icon={SafetyOutlined}
              trend={{ value: -15.3, isPositive: false }}
              color="warning"
              loading={statsLoading}
            />
          </Col>
        </Row>

        {/* User Management and Role Distribution */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Recent User Activity"
              variant="borderless"
              loading={usersLoading}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <List
                dataSource={recentUsers || []}
                renderItem={(user: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={`${user.name} (${user.email})`}
                      description={
                        <div>
                          <Tag color={user.status === 'active' ? 'green' : 'orange'}>
                            {user.status}
                          </Tag>
                          <span style={{ marginLeft: 8, color: '#6B7280' }}>
                            {user.role} • {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Role Distribution"
              variant="borderless"
              loading={roleLoading}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {roleDistribution?.map((role: any) => (
                  <div key={role.name}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{role.name}</span>
                      <span style={{ float: 'right', fontSize: 13, fontWeight: 500 }}>
                        {role.count} users ({role.percentage}%)
                      </span>
                    </div>
                    <Progress percent={role.percentage} strokeColor="#1B7CED" showInfo={false} />
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* System Health and Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              title="System Health Overview"
              variant="borderless"
              loading={healthLoading}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Database"
                    value={systemHealth?.database || 0}
                    suffix="%"
                    prefix={<DatabaseOutlined style={{ color: '#10B981' }} />}
                    valueStyle={{ color: '#10B981' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="API Response"
                    value={systemHealth?.api || 0}
                    suffix="ms"
                    prefix={<ClockCircleOutlined style={{ color: '#3B82F6' }} />}
                    valueStyle={{ color: '#3B82F6' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Memory Usage"
                    value={systemHealth?.memory || 0}
                    suffix="%"
                    prefix={<BarChartOutlined style={{ color: '#F97316' }} />}
                    valueStyle={{ color: '#F97316' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Active Sessions"
                    value={systemHealth?.sessions || 0}
                    prefix={<TeamOutlined style={{ color: '#8B5CF6' }} />}
                    valueStyle={{ color: '#8B5CF6' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="Quick Admin Actions"
              variant="borderless"
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="default"
                  icon={<UserOutlined />}
                  size="large"
                  block
                  style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Manage Users</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Create, edit, and manage user accounts
                    </div>
                  </div>
                </Button>

                <Button
                  type="default"
                  icon={<Shield />}
                  size="large"
                  block
                  style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Role Management</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Assign roles and manage permissions
                    </div>
                  </div>
                </Button>

                <Button
                  type="default"
                  icon={<Settings />}
                  size="large"
                  block
                  style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>System Settings</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Configure system-wide settings
                    </div>
                  </div>
                </Button>

                <Button
                  type="default"
                  icon={<TrendingUp />}
                  size="large"
                  block
                  style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>View Analytics</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      System and tenant analytics
                    </div>
                  </div>
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default AdminDashboardPage;