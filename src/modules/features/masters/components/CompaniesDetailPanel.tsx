/**
 * Companies Detail Panel
 * Read-only side drawer for viewing company details
 */

import React from 'react';
import { Drawer, Button, Row, Col, Tag, Empty, Spin, Divider, Space, Card } from 'antd';
import { EditOutlined, BankOutlined, InfoCircleOutlined, PhoneOutlined, FileTextOutlined } from '@ant-design/icons';
import { Company } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';

interface CompaniesDetailPanelProps {
  company: Company | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

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
  
  // Database-driven lookups
  const { getColor: getStatusColor } = useReferenceDataLookup('company_status');
  const { getLabel: getSizeLabel } = useReferenceDataLookup('company_size');

  // Section styles configuration
  const sectionStyles = {
    card: {
      marginBottom: 20,
      borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '2px solid #e5e7eb',
    },
    headerIcon: {
      fontSize: 18,
      color: '#0ea5e9',
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: '#1f2937',
      margin: 0,
    },
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BankOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Company Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={650}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Close
          </Button>
          {hasPermission('crm:company:record:update') && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Edit Company
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Spin spinning={isLoading}>
          {/* Company Overview Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <BankOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Company Overview</h3>
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: 20, fontWeight: 600 }}>
              {company.name}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={getStatusColor(company.status || 'active')}>
                {(company.status || 'active').toUpperCase()}
              </Tag>
              <Tag color="blue">{getSizeLabel(company.size)}</Tag>
            </div>
          </Card>

          {/* Basic Information Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
            </div>
            <Descriptions
              items={[
                { label: 'Company ID', value: company.id },
                { label: 'Industry', value: company.industry },
                { label: 'Company Size', value: getSizeLabel(company.size) },
                { label: 'Status', value: company.status?.toUpperCase() },
              ]}
            />
          </Card>

          {/* Contact Information Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <PhoneOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Contact Information</h3>
            </div>
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
          </Card>

          {/* Additional Details Card */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <InfoCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Additional Details</h3>
            </div>
            <Descriptions
              items={[
                { label: 'Registration Number', value: company.registration_number },
                { label: 'Tax ID', value: company.tax_id },
                { label: 'Founded', value: company.founded_year },
                { label: 'Created', value: company.created_at ? new Date(company.created_at).toLocaleDateString() : '-' },
              ]}
            />
          </Card>

          {company.notes && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Notes</h3>
              </div>
              <p style={{ color: '#666', margin: 0, whiteSpace: 'pre-wrap' }}>
                {company.notes}
              </p>
            </Card>
          )}
        </Spin>
      </div>
    </Drawer>
  );
};