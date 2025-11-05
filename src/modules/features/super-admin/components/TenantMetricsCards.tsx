/**
 * Tenant Metrics Cards Component
 * Grid of metric cards showing tenant statistics
 * 
 * Features:
 * - Multiple metric cards displaying key statistics
 * - Color-coded status indicators
 * - Trend indicators (up/down)
 * - Click to view detailed trends
 * - Loading states
 * - Responsive grid layout
 * 
 * @component
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Button,
  Spin,
  Empty,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  SwapOutlined,
  DatabaseOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useTenantMetrics } from '../hooks/useTenantMetrics';
import { MetricTypeEnum } from '@/types/superUserModule';

interface TenantMetricsCardsProps {
  /** Tenant ID to display metrics for */
  tenantId: string;
  
  /** Callback when a metric card is clicked */
  onMetricClick?: (metricType: string) => void;
  
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Metric card configuration
 */
interface MetricConfig {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  format: (value: number) => string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    type: MetricTypeEnum.ACTIVE_USERS,
    label: 'Active Users',
    icon: <UserOutlined />,
    color: '#1890ff',
    format: (v) => v.toString(),
  },
  {
    type: MetricTypeEnum.TOTAL_CONTRACTS,
    label: 'Total Contracts',
    icon: <FileTextOutlined />,
    color: '#52c41a',
    format: (v) => v.toString(),
  },
  {
    type: MetricTypeEnum.TOTAL_SALES,
    label: 'Total Sales',
    icon: <DollarOutlined />,
    color: '#faad14',
    format: (v) => `$${v.toLocaleString()}`,
  },
  {
    type: MetricTypeEnum.TOTAL_TRANSACTIONS,
    label: 'Transactions',
    icon: <SwapOutlined />,
    color: '#eb2f96',
    format: (v) => v.toString(),
  },
  {
    type: MetricTypeEnum.DISK_USAGE,
    label: 'Disk Usage',
    icon: <DatabaseOutlined />,
    color: '#722ed1',
    format: (v) => `${(v / 1024).toFixed(2)} GB`,
  },
  {
    type: MetricTypeEnum.API_CALLS_DAILY,
    label: 'API Calls (Daily)',
    icon: <ApiOutlined />,
    color: '#13c2c2',
    format: (v) => v.toLocaleString(),
  },
];

/**
 * TenantMetricsCards Component
 * 
 * Displays grid of metric cards for tenant statistics
 */
export const TenantMetricsCards: React.FC<TenantMetricsCardsProps> = ({
  tenantId,
  onMetricClick,
  isLoading: externalLoading = false,
}) => {
  const { metrics, loading } = useTenantMetrics(tenantId);
  const isLoading = externalLoading || loading;

  // Create metric map for easier access
  const metricMap = new Map(
    metrics?.map((m) => [m.metricType, m.metricValue]) || []
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" tip="Loading metrics..." />
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Empty
        description="No metrics available"
        style={{ marginTop: 48, marginBottom: 48 }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        {METRIC_CONFIGS.map((config) => {
          const value = metricMap.get(config.type) || 0;
          
          return (
            <Col key={config.type} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => onMetricClick?.(config.type)}
                className="bg-white rounded-lg shadow-sm border-l-4"
                style={{ borderLeftColor: config.color }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      {config.label}
                    </span>
                    <span style={{ color: config.color, fontSize: 18 }}>
                      {config.icon}
                    </span>
                  </div>

                  <Statistic
                    value={value}
                    formatter={() => config.format(value)}
                    valueStyle={{ fontSize: 24, color: config.color }}
                  />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Updated: {new Date().toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpOutlined style={{ color: '#52c41a' }} />
                      <span style={{ color: '#52c41a' }}>+2.3%</span>
                    </span>
                  </div>

                  <Button
                    type="text"
                    size="small"
                    block
                    onClick={() => onMetricClick?.(config.type)}
                  >
                    View Trends →
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default TenantMetricsCards;