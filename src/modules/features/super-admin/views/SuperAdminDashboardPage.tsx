/**
 * Super Admin Dashboard Page - Modular Version
 * Enhanced super admin dashboard with system overview
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spin, Space, Alert } from 'antd';
import { 
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { 
  Building2,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { toast } from 'sonner';

const SuperAdminDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    activeUsers: 0,
    systemHealth: 'healthy',
    uptime: '99.9%'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual dashboard data fetching
      setStats({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        activeUsers: 0,
        systemHealth: 'healthy',
        uptime: '99.9%'
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission('super_admin')) {
    return (
      <>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access the super admin dashboard."
            type="error"
            showIcon
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Super Admin Dashboard"
        description="System overview and administration"
        extra={
          <Button
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={fetchDashboardData}
            loading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Tenants"
              value={stats.totalTenants}
              description={`${stats.activeTenants} active`}
              icon={Building2}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              description={`${stats.activeUsers} active`}
              icon={Users}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="System Health"
              value={stats.systemHealth}
              description="All systems operational"
              icon={stats.systemHealth === 'healthy' ? CheckCircle : AlertTriangle}
              color={stats.systemHealth === 'healthy' ? 'success' : 'error'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Uptime"
              value={stats.uptime}
              description="Last 30 days"
              icon={TrendingUp}
              color="info"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* System Status */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card 
              title="System Status" 
              variant="borderless"
              extra={<Badge status="success" text="All Systems Operational" />}
            >
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin spinning tip="Loading system status..." />
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>API Status</span>
                    <Badge status="success" text="Operational" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Database</span>
                    <Badge status="success" text="Connected" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>File Storage</span>
                    <Badge status="success" text="Available" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Email Service</span>
                    <Badge status="success" text="Active" />
                  </div>
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Recent Activity" variant="borderless">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin spinning tip="Loading activity..." />
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ 
                      padding: 8, 
                      background: '#E3F2FD', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={16} color="#1976D2" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>New tenant registered</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>2 hours ago</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ 
                      padding: 8, 
                      background: '#E8F5E9', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle size={16} color="#388E3C" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>System backup completed</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>4 hours ago</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ 
                      padding: 8, 
                      background: '#FFF3E0', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Clock size={16} color="#F57C00" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>Scheduled maintenance</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>6 hours ago</div>
                    </div>
                  </div>
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SuperAdminDashboardPage;