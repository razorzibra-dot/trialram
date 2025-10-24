/**
 * Service Detail Panel
 * Side drawer panel for viewing service health details
 */

import React from 'react';
import {
  Drawer,
  Button,
  Descriptions,
  Progress,
  Tag,
  Row,
  Col,
  Statistic,
  Empty,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ServiceHealth } from '../types/health';

interface ServiceDetailPanelProps {
  visible: boolean;
  data: ServiceHealth | null;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: (serviceId: string) => void;
  isRefreshing?: boolean;
}

export const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({
  visible,
  data,
  loading = false,
  onClose,
  onRefresh,
  isRefreshing = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
      case 'degraded':
        return <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />;
      case 'down':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
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

  const getUptimeColor = (uptime: number) => {
    if (uptime > 99) return '#52c41a';
    if (uptime > 95) return '#faad14';
    return '#ff4d4f';
  };

  if (!data) {
    return (
      <Drawer
        title="Service Details"
        placement="right"
        onClose={onClose}
        open={visible}
        width={500}
      >
        <Empty description="No service selected" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={data.name}
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      loading={loading}
      footer={
        <Row gutter={8} justify="end">
          <Col>
            <Button onClick={onClose}>Close</Button>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => onRefresh?.(data.id)}
              loading={isRefreshing}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      }
    >
      <div style={{ marginBottom: 24 }}>
        {/* Status Overview */}
        <div style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Status</div>
                <Badge
                  status={getStatusColor(data.status) as any}
                  text={
                    <span style={{ fontWeight: 500 }}>
                      {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                    </span>
                  }
                />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Last Checked</div>
                <span>{new Date(data.lastChecked).toLocaleTimeString()}</span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Key Metrics */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Performance Metrics</div>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Uptime"
                value={data.uptime}
                precision={2}
                suffix="%"
                valueStyle={{ color: getUptimeColor(data.uptime) }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Response Time"
                value={data.responseTime}
                suffix="ms"
              />
            </Col>
          </Row>
        </div>

        {/* Detailed Information */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Details</div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Service Name" span={1}>
              {data.name}
            </Descriptions.Item>

            <Descriptions.Item label="Status" span={1}>
              <Tag color={getStatusColor(data.status)}>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Uptime (30 days)" span={1}>
              <Progress
                percent={Math.round(data.uptime * 100) / 100}
                strokeColor={getUptimeColor(data.uptime)}
                size="small"
              />
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                {data.uptime.toFixed(2)}%
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Response Time" span={1}>
              {data.responseTime}ms
            </Descriptions.Item>

            <Descriptions.Item label="Last Status Check" span={1}>
              {new Date(data.lastChecked).toLocaleString()}
            </Descriptions.Item>

            {data.details && (
              <Descriptions.Item label="Additional Details" span={1}>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {data.details}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* Status Indicators */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Status Indicators</div>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                textAlign: 'center',
              }}>
                {getStatusIcon(data.status)}
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>Current Status</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                textAlign: 'center',
                backgroundColor: data.uptime > 99 ? '#f6ffed' : data.uptime > 95 ? '#fffbe6' : '#fff1f0',
              }}>
                <span style={{ color: getUptimeColor(data.uptime), fontWeight: 600 }}>
                  {data.uptime.toFixed(2)}%
                </span>
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>Uptime</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                textAlign: 'center',
              }}>
                <span style={{ fontWeight: 600 }}>{data.responseTime}ms</span>
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>Avg Response</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Drawer>
  );
};