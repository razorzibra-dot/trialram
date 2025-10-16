/**
 * Page Header Component
 * Consistent page header across all pages
 * Salesforce-inspired design
 */

import React from 'react';
import { Space, Button, Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: {
    items: Array<{ title: string; path?: string }>;
  };
  extra?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  extra,
  onBack,
  showBack = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: '24px',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.items && breadcrumb.items.length > 0 && (
        <Breadcrumb
          items={breadcrumb.items}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Header Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Left Section */}
        <div style={{ flex: 1 }}>
          <Space size="middle" align="start">
            {showBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{
                  marginTop: 4,
                }}
              />
            )}
            <div>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h1>
              {description && (
                <p
                  style={{
                    fontSize: 14,
                    color: '#6B7280',
                    margin: '8px 0 0 0',
                    lineHeight: 1.5715,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
          </Space>
        </div>

        {/* Right Section - Actions */}
        {extra && (
          <div style={{ flexShrink: 0 }}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;