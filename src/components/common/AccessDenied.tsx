/**
 * Access Denied Component
 * Consistent permission denied UI for all pages
 * Configurable with custom messages and actions
 */

import React from 'react';
import { Alert, Button, Result, Space } from 'antd';
import { LockOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface AccessDeniedProps {
  /** Type of display - alert or result */
  variant?: 'alert' | 'result';
  /** Module or resource name */
  resource?: string;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Show back to home button */
  showHomeButton?: boolean;
  /** Custom action buttons */
  actions?: React.ReactNode;
  /** Padding around the component */
  padding?: number;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  variant = 'result',
  resource,
  title,
  description,
  showHomeButton = true,
  actions,
  padding = 24,
}) => {
  const navigate = useNavigate();

  const defaultTitle = title || 'Access Denied';
  const defaultDescription =
    description ||
    (resource
      ? `You don't have permission to access ${resource}.`
      : "You don't have permission to access this page.");

  if (variant === 'alert') {
    return (
      <div style={{ padding }}>
        <Alert
          message={defaultTitle}
          description={
            <div>
              <p style={{ marginBottom: actions || showHomeButton ? 16 : 0 }}>
                {defaultDescription}
              </p>
              {(actions || showHomeButton) && (
                <Space>
                  {actions}
                  {showHomeButton && (
                    <Button
                      type="primary"
                      icon={<HomeOutlined />}
                      onClick={() => navigate('/tenant/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </Space>
              )}
            </div>
          }
          type="warning"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }

  return (
    <div style={{ padding }}>
      <Result
        status="403"
        icon={<LockOutlined style={{ fontSize: 72, color: '#faad14' }} />}
        title={defaultTitle}
        subTitle={defaultDescription}
        extra={
          <Space size="middle">
            {actions}
            {showHomeButton && (
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => navigate('/tenant/dashboard')}
                size="large"
              >
                Go to Dashboard
              </Button>
            )}
          </Space>
        }
      />
    </div>
  );
};

export default AccessDenied;
