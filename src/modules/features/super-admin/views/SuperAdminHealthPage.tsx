/**
 * Super Admin Health Page - Complete Refactor
 * System health monitoring with drawer-based details, consistent UI
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Badge,
  Space,
  Alert,
  Spin,
  Progress,
  Tooltip,
  Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageHeader, StatCard } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { ServiceDetailPanel } from '../components/ServiceDetailPanel';
import type { ServiceHealth, SystemMetrics, IncidentLog } from '../types/health';
import { Activity, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const SuperAdminHealthPage: React.FC = () => {
  const { user } = useAuth();
  const healthService = useService<any>('healthService');

  // State
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    systemLoad: 0,
    memoryUsage: 0,
    databaseStatus: 'unknown',
    operationalServices: 0,
    totalServices: 0,
  });
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Auto-refresh every 30 seconds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      const data = await healthService.getSystemHealth();
      setServices(data.services);
      setMetrics(data.metrics);
      setIncidents(data.incidents);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'down':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const handleViewService = (service: ServiceHealth) => {
    setSelectedService(service);
    setIsPanelVisible(true);
  };

  // Service health table
  const serviceColumns: ColumnsType<ServiceHealth> = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record) => (
        <Space>
          {getStatusIcon(record.status)}
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge status={getStatusColor(status) as any} text={status.charAt(0).toUpperCase() + status.slice(1)} />
      ),
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 120,
      render: (uptime: number) => (
        <Tooltip title={`${uptime}% in last 30 days`}>
          <Progress
            type="circle"
            percent={Math.round(uptime)}
            width={50}
            strokeColor={uptime > 99 ? '#52c41a' : uptime > 95 ? '#faad14' : '#ff4d4f'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 120,
      render: (time: number) => `${time}ms`,
    },
    {
      title: 'Last Checked',
      dataIndex: 'lastChecked',
      key: 'lastChecked',
      width: 150,
      render: (time: string) => new Date(time).toLocaleTimeString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          onClick={() => handleViewService(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="System Health"
        description="Monitor system services, performance, and incidents"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'System Health' },
        ]}
        extra={
          <Button
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={fetchHealthData}
            loading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* System Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="System Load"
              value={`${Math.round(metrics.systemLoad)}%`}
              icon={Activity}
              color={metrics.systemLoad > 70 ? 'error' : metrics.systemLoad > 50 ? 'warning' : 'success'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Memory Usage"
              value={`${Math.round(metrics.memoryUsage)}%`}
              icon={Zap}
              color={metrics.memoryUsage > 70 ? 'error' : metrics.memoryUsage > 50 ? 'warning' : 'success'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Database Status"
              value={metrics.databaseStatus === 'connected' ? 'Connected' : 'Disconnected'}
              icon={AlertCircle}
              color={metrics.databaseStatus === 'connected' ? 'success' : 'error'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Services Operational"
              value={`${metrics.operationalServices}/${metrics.totalServices}`}
              icon={CheckCircle}
              color="success"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Service Health */}
        <Card
          title="Service Status"
          extra={<Spin spinning={isLoading} size="small" />}
          style={{ marginBottom: 24 }}
        >
          <Table<ServiceHealth>
            columns={serviceColumns}
            dataSource={services}
            loading={isLoading}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Incidents Log */}
        <Card title="Recent Incidents" style={{ marginBottom: 24 }}>
          {incidents.length === 0 ? (
            <Alert
              message="No incidents"
              description="All systems are operating normally"
              type="success"
              showIcon
            />
          ) : (
            <Timeline
              items={incidents.map((incident) => ({
                dot: <div style={{
                  width: 12,
                  height: 12,
                  backgroundColor: getSeverityColor(incident.severity),
                  borderRadius: '50%',
                }} />,
                children: (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {incident.title}
                      {incident.resolved && (
                        <Badge
                          count="RESOLVED"
                          style={{
                            backgroundColor: '#52c41a',
                            marginLeft: 8,
                            fontSize: 10,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {incident.description}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {new Date(incident.timestamp).toLocaleString()}
                    </div>
                  </div>
                ),
              }))}
            />
          )}
        </Card>

        {/* Performance Overview */}
        <Card title="Performance Overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{
                padding: 16,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Average Response Time</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                  {Math.round(services.reduce((acc, s) => acc + s.responseTime, 0) / services.length)}ms
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{
                padding: 16,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Average Uptime</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                  {(services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2)}%
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Service Detail Panel */}
      <ServiceDetailPanel
        visible={isPanelVisible}
        data={selectedService}
        loading={isLoading}
        onClose={() => setIsPanelVisible(false)}
        onRefresh={() => fetchHealthData()}
        isRefreshing={isLoading}
      />
    </>
  );
};

export default SuperAdminHealthPage;