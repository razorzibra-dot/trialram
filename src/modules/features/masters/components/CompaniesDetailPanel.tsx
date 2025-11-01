/**
 * Companies Detail Panel
 * Read-only side drawer for viewing company details
 */

import React from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Divider, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Company } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';

interface CompaniesDetailPanelProps {
  company: Company | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Status color mapping
 */
const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  prospect: 'blue',
};

/**
 * Size label mapping
 */
const sizeLabels: Record<string, string> = {
  startup: 'Startup',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  enterprise: 'Enterprise',
};

/**
 * Descriptions component for formatted display
 */
const Descriptions: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
}> = ({ items }) => (
  <div style={{ fontSize: 14 }}>
    {items.map((item, index) => (
      <Row key={index} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
        <Col span={8} style={{ color: '#666', fontWeight: 500 }}>
          {item.label}
        </Col>
        <Col span={16} style={{ color: '#000' }}>
          {item.value || '-'}
        </Col>
      </Row>
    ))}
  </div>
);

export const CompaniesDetailPanel: React.FC<CompaniesDetailPanelProps> = ({
  company,
  isOpen,
  isLoading = false,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();

  if (!company) {
    return (
      <Drawer
        title="Company Details"
        placement="right"
        onClose={onClose}
        open={isOpen}
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <Empty description="No company selected" />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Company Details</span>
          {hasPermission('companies:update') && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ marginRight: 16 }}
            >
              Edit
            </Button>
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={500}
      styles={{ body: { padding: '24px' } }}
    >
      <Spin spinning={isLoading}>
        {/* Name Section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
            {company.name}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={statusColors[company.status || 'active']}>
              {(company.status || 'active').toUpperCase()}
            </Tag>
            <Tag color="blue">{sizeLabels[company.size] || company.size}</Tag>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Basic Information
          </h3>
          <Descriptions
            items={[
              { label: 'Company ID', value: company.id },
              { label: 'Industry', value: company.industry },
              { label: 'Company Size', value: sizeLabels[company.size] || company.size },
              { label: 'Status', value: company.status?.toUpperCase() },
            ]}
          />
        </div>

        <Divider />

        {/* Contact Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Contact Information
          </h3>
          <Descriptions
            items={[
              { label: 'Email', value: company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : '-' },
              { label: 'Phone', value: company.phone },
              { label: 'Website', value: company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  {company.website}
                </a>
              ) : '-' },
              { label: 'Address', value: company.address },
            ]}
          />
        </div>

        <Divider />

        {/* Additional Details */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#111827' }}>
            Additional Details
          </h3>
          <Descriptions
            items={[
              { label: 'Registration Number', value: company.registration_number },
              { label: 'Tax ID', value: company.tax_id },
              { label: 'Founded', value: company.founded_year },
              { label: 'Created', value: company.created_at ? new Date(company.created_at).toLocaleDateString() : '-' },
            ]}
          />
        </div>

        {company.notes && (
          <>
            <Divider />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
                Notes
              </h3>
              <p style={{ color: '#666', margin: 0, whiteSpace: 'pre-wrap' }}>
                {company.notes}
              </p>
            </div>
          </>
        )}
      </Spin>
    </Drawer>
  );
};