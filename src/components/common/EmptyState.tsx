/**
 * Empty State Component
 * Professional empty state for tables and lists
 * Salesforce-inspired design
 */

import React from 'react';
import { Empty, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  image?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  description,
  icon,
  action,
  image,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{
          height: 80,
          marginBottom: 16,
        }}
        description={
          <Space direction="vertical" size="small">
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#111827',
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  maxWidth: 400,
                  margin: '0 auto',
                }}
              >
                {description}
              </div>
            )}
          </Space>
        }
      >
        {action && (
          <Button
            type="primary"
            icon={action.icon || <PlusOutlined />}
            onClick={action.onClick}
            size="large"
            style={{ marginTop: 16 }}
          >
            {action.text}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;