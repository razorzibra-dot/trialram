/**
 * Super Admin Dashboard Page - Modular Version
 * Enhanced super admin dashboard with system overview and real-time metrics
 * 
 * **Layer Synchronization**: 
 * - Uses factory-routed hooks from Phase 7
 * - Displays Phase 8 components (ImpersonationActiveCard, TenantMetricsCards)
 * - Integrates with Phase 5 service factory pattern
 * 
 * **Architectural Pattern**:
 * - No direct service imports (uses hooks only)
 * - Proper error handling and loading states
 * - Permission checks via RBAC
 * - Toast notifications for user feedback
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Spin, Space, Alert, Table, Divider } from 'antd';
import { 
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { 
  Building2,
  Users,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import { 
  useSuperAdminList, 
  useTenantDirectory,
  useImpersonation,
  useSystemHealth 
} from '@/modules/features/super-admin/hooks';
import { 
  TenantMetricsCards, 
  ImpersonationActiveCard,
  SuperUserList,
  QuickImpersonationWidget
} from '@/modules/features/super-admin/components';
import { toast } from 'sonner';

/**
 * Dashboard component with comprehensive system overview
 * Shows key metrics, active sessions, and quick access to major operations
 */
const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  
  // Hooks for data fetching with proper factory routing
  const { 
    superUsers = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useSuperAdminList();
  
  const { 
    health = {}, 
    isLoading: healthLoading 
  } = useSystemHealth();
  
  const { 
    activeSessions = [], 
    isLoading: impersonationLoading 
  } = useImpersonation();
  
  const { 
    tenants = [], 
    isLoading: tenantsLoading 
  } = useTenantDirectory();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Diagnostic logging for permission/auth issues
  React.useEffect(() => {
    console.log('🔍 [SuperAdminDashboard] Auth State:', {
      userRole: user?.role,
      isSuperAdmin: user?.isSuperAdmin,
      hasPermission: hasPermission('super_admin:crm:analytics:insight:view'),
      userId: user?.id,
      email: user?.email,
    });
  }, [user, hasPermission]);

  // Handle refresh action
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Dashboard refreshed');
  };

  // Permission check - show access denied if not authorized
  // ⚠️ DIAGNOSTIC MODE: Temporarily showing debug info
  const hasAccess = hasPermission('super_admin:crm:analytics:insight:view');
  
  if (!hasAccess) {
    console.warn('❌ [SuperAdminDashboard] Permission denied for super_admin:crm:analytics:insight:view', {
      userRole: user?.role,
      isSuperAdmin: user?.isSuperAdmin,
      userId: user?.id,
    });
    
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description={`You don't have permission to access the super admin dashboard. Role: ${user?.role}, IsSuperAdmin: ${user?.isSuperAdmin}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p style={{ fontSize: 12, color: '#666' }}>
          Check browser console (F12) for detailed diagnostic logs.
        </p>
      </div>
    );
  }

  const isLoading = usersLoading || healthLoading || impersonationLoading || tenantsLoading;

  // Calculate summary stats
  const activeTenants = tenants.length;
  const totalSuperUsers = superUsers.length;
  const systemHealthStatus = health?.status === 'healthy' ? 'healthy' : 'warning';

  return (
    <>
      <PageHeader
        title="Super Admin Dashboard"
        description="System overview, tenant metrics, and administration controls"
        extra={
          <Button
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Error alerts */}
        {usersError && (
          <Alert
            message="Error loading super users"
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Key Metrics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Tenants"
              value={activeTenants}
              description={`${activeTenants} tenants available`}
              icon={Building2}
              color="primary"
              loading={tenantsLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Super Users"
              value={totalSuperUsers}
              description={`${totalSuperUsers} administrators`}
              icon={Users}
              color="success"
              loading={usersLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="System Health"
              value={systemHealthStatus === 'healthy' ? 'Healthy' : 'Warning'}
              description={health?.message || 'All systems operational'}
              icon={systemHealthStatus === 'healthy' ? CheckCircle : AlertTriangle}
              color={systemHealthStatus === 'healthy' ? 'success' : 'warning'}
              loading={healthLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Sessions"
              value={activeSessions?.length > 0 ? 1 : 0}
              description={activeSessions?.length > 0 ? 'Impersonation active' : 'No active sessions'}
              icon={activeSessions?.length > 0 ? LogOut : TrendingUp}
              color={activeSessions?.length > 0 ? 'warning' : 'info'}
              loading={impersonationLoading}
            />
          </Col>
        </Row>

        {/* Active Impersonation Alert */}
        {activeSessions && activeSessions.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <ImpersonationActiveCard />
            </Col>
          </Row>
        )}

        {/* System Status and Recent Activity */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card 
              title="System Status" 
              variant="borderless"
              loading={healthLoading}
              extra={<Badge status={systemHealthStatus === 'healthy' ? 'success' : 'warning'} text="Status" />}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>API Service</span>
                  <Badge status={health?.api?.status === 'operational' ? 'success' : 'error'} text={health?.api?.status || 'unknown'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>Database</span>
                  <Badge status={health?.database?.status === 'connected' ? 'success' : 'error'} text={health?.database?.status || 'unknown'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>Storage</span>
                  <Badge status={health?.storage?.status === 'available' ? 'success' : 'error'} text={health?.storage?.status || 'unknown'} />
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title="Quick Actions" 
              variant="borderless"
              extra={<Settings size={16} />}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  type="primary" 
                  block 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    navigate('/super-admin/users');
                    toast.success('Navigating to Super Users page');
                  }}
                >
                  Manage Super Users
                </Button>
                <Button 
                  block 
                  icon={<Building2 size={16} />}
                  onClick={() => {
                    navigate('/super-admin/tenants');
                    toast.success('Navigating to Tenants page');
                  }}
                >
                  View All Tenants
                </Button>
                <Button 
                  block 
                  icon={<TrendingUp size={16} />}
                  onClick={() => {
                    navigate('/super-admin/analytics');
                    toast.success('Navigating to Analytics page');
                  }}
                >
                  View Analytics
                </Button>
                <Divider style={{ margin: '12px 0' }} />
                <Button 
                  block 
                  icon={<EyeOutlined />}
                  onClick={() => {
                    navigate('/super-admin/impersonation-history');
                    toast.success('Navigating to Impersonation History');
                  }}
                >
                  View Impersonation History
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Quick Impersonation Widget */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <QuickImpersonationWidget
              onSuccess={() => {
                toast.success('Impersonation session started');
              }}
            />
          </Col>
        </Row>

        {/* Tenant Metrics Overview - Optional Section */}
        {/* Metrics are now loaded separately if needed */}

        {/* Recent Super Users */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              title="Super Users Overview" 
              variant="borderless"
              loading={usersLoading}
              extra={
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    navigate('/super-admin/users');
                    toast.success('Navigating to Super Users page');
                  }}
                >
                  View All
                </Button>
              }
            >
              {superUsers.length === 0 ? (
                <Alert
                  message="No super users"
                  description="Create a super user to manage the system"
                  type="info"
                  showIcon
                />
              ) : (
                <Table
                  dataSource={superUsers.slice(0, 5)}
                  columns={[
                    {
                      title: 'User ID',
                      dataIndex: 'userId',
                      key: 'userId',
                    },
                    {
                      title: 'Access Level',
                      dataIndex: 'accessLevel',
                      key: 'accessLevel',
                      render: (level: string) => (
                        <Badge 
                          color={level === 'full' ? 'green' : 'orange'} 
                          text={level}
                        />
                      ),
                    },
                    {
                      title: 'Super Admin',
                      dataIndex: 'isSuperAdmin',
                      key: 'isSuperAdmin',
                      render: (value: boolean) => (
                        <Badge status={value ? 'success' : 'default'} text={value ? 'Yes' : 'No'} />
                      ),
                    },
                    {
                      title: 'Last Activity',
                      dataIndex: 'lastActivityAt',
                      key: 'lastActivityAt',
                      render: (date: string) => new Date(date).toLocaleDateString(),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SuperAdminDashboardPage;