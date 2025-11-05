/**
 * Rate Limit Warning Component - Layer 8
 * Super Admin Isolation & Impersonation - Task 6.1
 * 
 * Inline warning component for use in impersonation dialogs and action buttons.
 * Provides color-coded severity levels and automatic hiding when not relevant.
 * 
 * Features:
 * - ✅ Automatic severity detection (info/warning/error)
 * - ✅ Action recommendations
 * - ✅ Auto-hide when not relevant
 * - ✅ Responsive design
 * - ✅ Different messages for each limit type
 * 
 * Last Updated: 2025-02-22
 */

import React from 'react';
import { Alert, Space, Button } from 'antd';
import { ExclamationCircleOutlined, StopOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useValidateOperation } from '../hooks/useImpersonationRateLimit';

interface RateLimitWarningProps {
  /** Super admin user ID */
  superAdminId: string;
  /** Show warning even if operation can proceed */
  alwaysShow?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when validation completes */
  onValidated?: (canProceed: boolean) => void;
}

type WarningType = 'success' | 'info' | 'warning' | 'error';

/**
 * Get icon based on limit type
 */
function getLimitIcon(limitType?: string) {
  switch (limitType) {
    case 'hourly':
      return <ClockCircleOutlined />;
    case 'concurrent':
      return <StopOutlined />;
    case 'duration':
      return <ClockCircleOutlined />;
    default:
      return <ExclamationCircleOutlined />;
  }
}

/**
 * Get detailed message based on limit type
 */
function getLimitMessage(limitType?: string): string {
  switch (limitType) {
    case 'hourly':
      return 'You have reached the maximum number of impersonations allowed per hour. Please wait for your quota to reset.';
    case 'concurrent':
      return 'You have reached the maximum number of concurrent impersonation sessions. Please end an active session before starting a new one.';
    case 'duration':
      return 'An active impersonation session has exceeded the maximum allowed duration. Please end the session.';
    default:
      return 'Rate limit exceeded. Please try again later.';
  }
}

/**
 * Rate Limit Warning Component
 */
export const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  superAdminId,
  alwaysShow = false,
  className = '',
  onValidated,
}) => {
  const { data: validation, isLoading, error } = useValidateOperation(superAdminId);

  // Trigger callback when validation completes
  React.useEffect(() => {
    if (!isLoading && validation && onValidated) {
      onValidated(validation.canProceed);
    }
  }, [validation, isLoading, onValidated]);

  // Don't show if loading or error
  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Alert
        message="Unable to verify rate limit status"
        type="error"
        showIcon
        className={className}
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Don't show if operation can proceed and alwaysShow is false
  if (!validation) {
    return null;
  }

  if (validation.canProceed && !alwaysShow) {
    return null;
  }

  // Determine alert type and icon
  let alertType: WarningType = 'success';
  let icon = undefined;

  if (!validation.canProceed) {
    alertType = 'error';
    icon = getLimitIcon(validation.limitType);
  } else if (
    validation.usagePercentage.hourly > 80 ||
    validation.usagePercentage.concurrent > 80
  ) {
    alertType = 'warning';
    icon = <ExclamationCircleOutlined />;
  } else if (
    validation.usagePercentage.hourly > 50 ||
    validation.usagePercentage.concurrent > 50
  ) {
    alertType = 'info';
  }

  // Generate description
  let description = '';
  if (!validation.canProceed) {
    description = getLimitMessage(validation.limitType);
  } else {
    const alerts = [];
    if (validation.usagePercentage.hourly > 80) {
      alerts.push(`Hourly usage: ${validation.usagePercentage.hourly}%`);
    }
    if (validation.usagePercentage.concurrent > 80) {
      alerts.push(`Concurrent usage: ${validation.usagePercentage.concurrent}%`);
    }
    if (alerts.length > 0) {
      description = `Approaching limits: ${alerts.join(', ')}`;
    }
  }

  return (
    <Alert
      message={validation.canProceed ? 'Rate Limit Warning' : validation.message}
      description={description || validation.message}
      type={alertType}
      icon={icon}
      showIcon
      className={className}
      style={{ marginBottom: 16 }}
    />
  );
};

/**
 * Simple Rate Limit Check Component
 * Returns a result object with validation details
 * Useful for conditional rendering in dialogs
 */
export const useRateLimitCheck = (superAdminId: string) => {
  const { data: validation, isLoading, error } = useValidateOperation(superAdminId);

  return {
    canProceed: validation?.canProceed ?? true,
    message: validation?.message ?? '',
    limitType: validation?.limitType,
    hourlyPercentage: validation?.usagePercentage.hourly ?? 0,
    concurrentPercentage: validation?.usagePercentage.concurrent ?? 0,
    isLoading,
    error,
  };
};

export default RateLimitWarning;