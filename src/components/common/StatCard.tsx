/**
 * Stat Card Component
 * Professional statistics card for dashboards
 * Salesforce-inspired design with trend indicators
 */

import React from 'react';
import { Card, Skeleton, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon | React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

const colorMap = {
  primary: {
    bg: '#EFF6FF',
    color: '#1B7CED',
  },
  success: {
    bg: '#ECFDF5',
    color: '#10B981',
  },
  warning: {
    bg: '#FFF7ED',
    color: '#F97316',
  },
  error: {
    bg: '#FEF2F2',
    color: '#EF4444',
  },
  info: {
    bg: '#EFF6FF',
    color: '#3B82F6',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  color = 'primary',
  onClick,
}) => {
  const colors = colorMap[color];

  if (loading) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  return (
    <Card
      bordered={false}
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderRadius: 8,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid #E5E7EB',
      }}
      styles={{
        body: {
          padding: 20,
        },
      }}
    >
      {/* Header with Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: colors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.color,
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {value}
      </div>

      {/* Description and Trend */}
      <Space
        direction="vertical"
        size={4}
        style={{ width: '100%' }}
      >
        {description && (
          <div
            style={{
              fontSize: 13,
              color: '#6B7280',
            }}
          >
            {description}
          </div>
        )}
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: trend.isPositive ? '#10B981' : '#EF4444',
            }}
          >
            {trend.isPositive ? (
              <ArrowUpOutlined style={{ fontSize: 12 }} />
            ) : (
              <ArrowDownOutlined style={{ fontSize: 12 }} />
            )}
            <span>{Math.abs(trend.value)}%</span>
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>vs last period</span>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default StatCard;