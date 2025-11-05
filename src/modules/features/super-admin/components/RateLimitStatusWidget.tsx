/**
 * Rate Limit Status Widget Component - Layer 8
 * Super Admin Isolation & Impersonation - Task 6.1
 * 
 * Displays comprehensive rate limit status information for super admins.
 * Shows real-time usage, remaining capacity, and reset countdown.
 * 
 * Features:
 * - ✅ Compact and detailed view modes
 * - ✅ Real-time progress bars with color coding
 * - ✅ Countdown timer to quota reset
 * - ✅ Responsive design (mobile/tablet/desktop)
 * - ✅ Loading and error states
 * - ✅ Status indicators (green/yellow/red)
 * 
 * Last Updated: 2025-02-22
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Space, Skeleton, Empty, Alert } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useRateLimitStatus, useRateLimitUsage } from '../hooks/useImpersonationRateLimit';

interface RateLimitStatusWidgetProps {
  /** Super admin user ID */
  superAdminId: string;
  /** Display mode: 'compact' for minimal display, 'detailed' for full info */
  mode?: 'compact' | 'detailed';
  /** Custom className for styling */
  className?: string;
  /** Show refresh button */
  showRefresh?: boolean;
}

/**
 * Calculate remaining time until reset in human-readable format
 */
function formatTimeRemaining(resetAtTime: string): string {
  const resetDate = new Date(resetAtTime);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Resetting now...';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }
  return `${seconds}s remaining`;
}

/**
 * Get status color based on usage percentage
 * Green: 0-70%, Yellow: 70-90%, Red: 90-100%
 */
function getStatusColor(percentage: number): string {
  if (percentage < 70) return '#52c41a'; // Green
  if (percentage < 90) return '#faad14'; // Yellow
  return '#ff4d4f'; // Red
}

/**
 * Get status tag color based on usage percentage
 */
function getStatusTagColor(percentage: number): 'success' | 'warning' | 'error' {
  if (percentage < 70) return 'success';
  if (percentage < 90) return 'warning';
  return 'error';
}

/**
 * Rate Limit Status Widget - Main Component
 */
export const RateLimitStatusWidget: React.FC<RateLimitStatusWidgetProps> = ({
  superAdminId,
  mode = 'detailed',
  className = '',
  showRefresh = false,
}) => {
  const { data: statusData, isLoading: statusLoading, error: statusError } = useRateLimitStatus(superAdminId);
  const { data: usageData, isLoading: usageLoading, error: usageError } = useRateLimitUsage(superAdminId);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!statusData?.resetAt) return;

    const updateTime = () => {
      setTimeRemaining(formatTimeRemaining(statusData.resetAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [statusData?.resetAt]);

  const isLoading = statusLoading || usageLoading;
  const error = statusError || usageError;

  if (isLoading) {
    return (
      <Card className={className}>
        <Skeleton active />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <Empty
          description="Failed to load rate limit status"
          style={{ marginTop: 48, marginBottom: 48 }}
        />
      </Card>
    );
  }

  if (!statusData || !usageData) {
    return (
      <Card className={className}>
        <Empty description="No rate limit data available" />
      </Card>
    );
  }

  const hourlyPercentage = (usageData.impersonationsThisHour / usageData.maxPerHour) * 100;
  const concurrentPercentage = (usageData.concurrentSessions / usageData.maxConcurrent) * 100;
  const isRateLimited = statusData.isRateLimited;

  // Compact mode
  if (mode === 'compact') {
    return (
      <Card
        size="small"
        className={className}
        style={{ borderColor: getStatusColor(Math.max(hourlyPercentage, concurrentPercentage)) }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Hourly Usage"
                value={usageData.impersonationsThisHour}
                suffix={`/ ${usageData.maxPerHour}`}
                valueStyle={{
                  color: getStatusColor(hourlyPercentage),
                  fontSize: '18px',
                }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Concurrent Sessions"
                value={usageData.concurrentSessions}
                suffix={`/ ${usageData.maxConcurrent}`}
                valueStyle={{
                  color: getStatusColor(concurrentPercentage),
                  fontSize: '18px',
                }}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              Hourly Limit
            </div>
            <Progress
              percent={Math.min(hourlyPercentage, 100)}
              strokeColor={getStatusColor(hourlyPercentage)}
              size="small"
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              Concurrent Limit
            </div>
            <Progress
              percent={Math.min(concurrentPercentage, 100)}
              strokeColor={getStatusColor(concurrentPercentage)}
              size="small"
            />
          </div>

          {isRateLimited && (
            <Alert
              message="Rate Limit Exceeded"
              type="error"
              icon={<StopOutlined />}
              showIcon
              style={{ marginTop: 12 }}
            />
          )}
        </Space>
      </Card>
    );
  }

  // Detailed mode
  return (
    <Card
      title={
        <Space>
          <span>Rate Limit Status</span>
          <Tag
            color={getStatusTagColor(Math.max(hourlyPercentage, concurrentPercentage))}
            icon={isRateLimited ? <StopOutlined /> : <CheckCircleOutlined />}
          >
            {isRateLimited ? 'RATE LIMITED' : 'OK'}
          </Tag>
        </Space>
      }
      className={className}
      extra={
        timeRemaining && (
          <Space>
            <ClockCircleOutlined />
            <span style={{ fontSize: '12px', color: '#666' }}>{timeRemaining}</span>
          </Space>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Hourly Impersonations */}
        <div>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Impersonations This Hour"
                value={usageData.impersonationsThisHour}
                suffix={`/ ${usageData.maxPerHour}`}
                valueStyle={{
                  color: getStatusColor(hourlyPercentage),
                }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ textAlign: 'right', paddingTop: 8 }}>
                <Tag
                  color={getStatusTagColor(hourlyPercentage)}
                >
                  {Math.round(hourlyPercentage)}% used
                </Tag>
              </div>
            </Col>
          </Row>
          <Progress
            percent={Math.min(hourlyPercentage, 100)}
            strokeColor={getStatusColor(hourlyPercentage)}
            format={() => `${usageData.impersonationsThisHour}/${usageData.maxPerHour}`}
          />
        </div>

        {/* Concurrent Sessions */}
        <div>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Concurrent Sessions"
                value={usageData.concurrentSessions}
                suffix={`/ ${usageData.maxConcurrent}`}
                valueStyle={{
                  color: getStatusColor(concurrentPercentage),
                }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ textAlign: 'right', paddingTop: 8 }}>
                <Tag
                  color={getStatusTagColor(concurrentPercentage)}
                >
                  {Math.round(concurrentPercentage)}% used
                </Tag>
              </div>
            </Col>
          </Row>
          <Progress
            percent={Math.min(concurrentPercentage, 100)}
            strokeColor={getStatusColor(concurrentPercentage)}
            format={() => `${usageData.concurrentSessions}/${usageData.maxConcurrent}`}
          />
        </div>

        {/* Session Duration */}
        {usageData.longestSessionMinutes > 0 && (
          <div>
            <Statistic
              title="Longest Active Session"
              value={usageData.longestSessionMinutes}
              suffix={`/ ${usageData.maxDurationMinutes} minutes`}
              valueStyle={{
                color: usageData.longestSessionMinutes > usageData.maxDurationMinutes ? '#ff4d4f' : '#1890ff',
              }}
            />
          </div>
        )}

        {/* Alerts */}
        {isRateLimited && (
          <Alert
            message="Rate Limit Exceeded"
            description="You have exceeded one or more rate limits. Please wait for the quota to reset."
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        )}

        {hourlyPercentage > 80 && !isRateLimited && (
          <Alert
            message="Approaching Hourly Limit"
            description={`You are using ${Math.round(hourlyPercentage)}% of your hourly impersonation quota.`}
            type="warning"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        )}

        {concurrentPercentage > 80 && !isRateLimited && (
          <Alert
            message="Approaching Concurrent Session Limit"
            description={`You have ${usageData.concurrentSessions} of ${usageData.maxConcurrent} concurrent sessions active.`}
            type="warning"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default RateLimitStatusWidget;