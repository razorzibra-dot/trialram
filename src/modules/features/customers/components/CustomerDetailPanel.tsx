/**
 * Customer Detail Panel - Enterprise Enhanced
 * Professional UI/UX redesign with key metrics cards, status badges,
 * enhanced information display, and visual hierarchy improvements.
 * 
 * Last Updated: 2025-01-31
 * Reference: CUSTOMER_FORMS_ENHANCEMENT_GUIDE.md
 */

import React from 'react';
import {
  Drawer,
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Descriptions,
  Alert,
  Statistic,
  Divider,
} from 'antd';
import {
  EditOutlined,
  CloseOutlined,
  MailOutlined,
  PhoneOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  TagsOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Customer } from '@/types/crm';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PermissionControlled } from '@/components/common/PermissionControlled';
import { PermissionSection } from '@/components/layout/PermissionSection';
import { usePermission } from '@/hooks/useElementPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerDetailPanelProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: () => void;
}

// Professional styling configuration
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
    fontSize: 20,
    color: '#0ea5e9',
    marginRight: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
};

// Configuration objects for consistent display
const statusConfig = {
  active: {
    emoji: '✅',
    label: 'Active',
    color: '#f0f5ff',
    textColor: '#0050b3',
  },
  inactive: {
    emoji: '❌',
    label: 'Inactive',
    color: '#fafafa',
    textColor: '#000000',
  },
  prospect: {
    emoji: '⏳',
    label: 'Prospect',
    color: '#fffbe6',
    textColor: '#ad6800',
  },
  suspended: {
    emoji: '🛑',
    label: 'Suspended',
    color: '#fff1f0',
    textColor: '#cf1322',
  },
};

const customerTypeConfig = {
  business: { emoji: '🏢', label: 'Business' },
  individual: { emoji: '👤', label: 'Individual' },
  corporate: { emoji: '🏛️', label: 'Corporate' },
  government: { emoji: '🏛️', label: 'Government' },
};

const ratingConfig = {
  hot: { emoji: '🔥', label: 'Hot Lead', color: '#ff4d4f' },
  warm: { emoji: '☀️', label: 'Warm Lead', color: '#fa8c16' },
  cold: { emoji: '❄️', label: 'Cold Lead', color: '#1890ff' },
};

const sourceConfig = {
  referral: { emoji: '👥', label: 'Referral' },
  website: { emoji: '🌐', label: 'Website' },
  sales_team: { emoji: '📞', label: 'Sales Team' },
  event: { emoji: '🎯', label: 'Event' },
  other: { emoji: '📋', label: 'Other' },
};

// Helper functions
const getDaysAsCustomer = (createdAt: string | null | undefined): number => {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};



export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = (props) => {
  if (!props.customer) {
    return null;
  }

  return <CustomerDetailPanelContent {...props} customer={props.customer} />;
};

const CustomerDetailPanelContent: React.FC<
  Omit<CustomerDetailPanelProps, 'customer'> & { customer: Customer }
> = ({
  open,
  customer,
  onClose,
  onEdit,
}) => {

  // Element-level permissions
  // ✅ Check record-specific permission first, then fallback to detail button and base permissions
  const canEditCustomerRecord = usePermission(`crm:contacts:record.${customer.id}:button.edit`, 'visible');
  const canEditCustomerDetail = usePermission('crm:contacts:detail:button.edit', 'visible');
  
  // ✅ FALLBACK: Check base record permissions if element permissions don't exist
  const { hasPermission } = useAuth();
  const canUpdateCustomer = hasPermission('crm:customer:record:update');
  
  // Final check: use record-specific permission if available, otherwise fallback to detail button or base permission
  const canEditCustomer = canEditCustomerRecord || canEditCustomerDetail || canUpdateCustomer;
  
  // Section permissions
  const canViewBasicInfo = usePermission('crm:contacts:detail:section.basic', 'accessible');
  const canViewBusinessInfo = usePermission('crm:contacts:detail:section.business', 'accessible');
  const canViewAddressInfo = usePermission('crm:contacts:detail:section.address', 'accessible');
  const canViewFinancialInfo = usePermission('crm:contacts:detail:section.financial', 'accessible');
  const canViewNotes = usePermission('crm:contacts:detail:section.notes', 'accessible');

  const statusInfo = statusConfig[customer.status as keyof typeof statusConfig] || statusConfig.prospect;
  const daysAsCustomer = getDaysAsCustomer(customer.created_at);
  const isInactive = customer.status === 'inactive' || customer.status === 'suspended';
  const isProspect = customer.status === 'prospect';

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Customer Details</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Close
          </Button>
          {canEditCustomer && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Edit Customer
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Alert for inactive or suspended customers */}
        {isInactive && (
          <Alert
            message={
              customer.status === 'suspended'
                ? 'This customer account is suspended'
                : 'This customer account is inactive'
            }
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
            closable
          />
        )}

        {isProspect && (
          <Alert
            message="This is a prospect - no business yet established"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
            closable
          />
        )}

        {/* 📊 Key Metrics Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <CheckCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Key Metrics</h3>
          </div>

          <Row gutter={24}>
            <Col xs={12} sm={8}>
              <Statistic
                title="Annual Commitment"
                value={customer.credit_limit || 0}
                prefix={<DollarOutlined style={{ color: '#10b981' }} />}
                formatter={(value) => formatCurrency(value as number)}
                valueStyle={{ color: '#10b981', fontSize: 20, fontWeight: 700 }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                title="Days as Customer"
                value={daysAsCustomer}
                suffix="days"
                valueStyle={{ color: '#3b82f6', fontSize: 20, fontWeight: 700 }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <div>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
                  Current Status
                </div>
                <Tag
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    backgroundColor: statusInfo.color,
                    color: statusInfo.textColor,
                    border: 'none',
                  }}
                >
                  {statusInfo.emoji} {statusInfo.label}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 📋 Status Badges Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <TagsOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Classification</h3>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#f0f5ff',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  Customer Type
                </div>
                <Tag style={{ padding: '6px 10px', fontSize: 12 }}>
                  {customerTypeConfig[customer.customer_type as keyof typeof customerTypeConfig]?.emoji ||
                    '📋'}{' '}
                  {customerTypeConfig[customer.customer_type as keyof typeof customerTypeConfig]?.label ||
                    'Unknown'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#fffbe6',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  Company Size
                </div>
                <Tag style={{ padding: '6px 10px', fontSize: 12 }}>
                  📊 {customer.size ? customer.size.charAt(0).toUpperCase() + customer.size.slice(1) : 'N/A'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#f6ffed',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  Lead Rating
                </div>
                <Tag
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    color:
                      ratingConfig[customer.rating as keyof typeof ratingConfig]?.color ||
                      '#1890ff',
                  }}
                >
                  {ratingConfig[customer.rating as keyof typeof ratingConfig]?.emoji || '❓'}{' '}
                  {ratingConfig[customer.rating as keyof typeof ratingConfig]?.label ||
                    'N/A'}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 📄 Basic Information */}
        <PermissionSection
          elementPath="crm:contacts:detail:section.basic"
          title="Basic Information"
        >
          <Card style={sectionStyles.card} variant="borderless">
            <Descriptions column={1} size="small">
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Company Name</span>}
            >
              {customer.company_name || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Contact Name</span>}
            >
              {customer.contact_name || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Email</span>}
            >
              {customer.email ? (
                <a href={`mailto:${customer.email}`}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {customer.email}
                </a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Phone</span>}
            >
              {customer.phone ? (
                <a href={`tel:${customer.phone}`}>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {customer.phone}
                </a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Mobile</span>}
            >
              {customer.mobile ? (
                <a href={`tel:${customer.mobile}`}>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {customer.mobile}
                </a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
          </Descriptions>
          </Card>
        </PermissionSection>

        {/* 🏢 Business Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <ShoppingOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Business Information</h3>
          </div>

          <Descriptions column={1} size="small">
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Industry</span>}
            >
              {customer.industry ? `🏭 ${customer.industry}` : '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Website</span>}
            >
              {customer.website ? (
                <a href={customer.website} target="_blank" rel="noopener noreferrer">
                  🌐 {customer.website}
                </a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Tax ID</span>}
            >
              <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: 3 }}>
                {customer.tax_id || '—'}
              </code>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 📍 Address Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <EnvironmentOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Address Information</h3>
          </div>

          <Descriptions column={1} size="small">
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Address</span>}
            >
              {customer.address || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>City</span>}
            >
              {customer.city || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Country</span>}
            >
              {customer.country || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 💰 Financial & Lead Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <DollarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Financial & Lead Information</h3>
          </div>

          <Descriptions column={1} size="small">
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Payment Terms</span>}
            >
              {customer.payment_terms || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Lead Source</span>}
            >
              {sourceConfig[customer.source as keyof typeof sourceConfig]?.emoji || '📋'}{' '}
              {sourceConfig[customer.source as keyof typeof sourceConfig]?.label || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 📅 Timeline Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <CalendarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Timeline</h3>
          </div>

          <Descriptions column={1} size="small">
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Created Date</span>}
            >
              {formatDate(customer.created_at)}
            </Descriptions.Item>
            <Descriptions.Item
              label={<span style={{ fontWeight: 600, color: '#374151' }}>Last Updated</span>}
            >
              {formatDate(customer.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 📝 Notes Section */}
        {customer.notes && (
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <FileTextOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Notes</h3>
            </div>

            <div
              style={{
                padding: 12,
                backgroundColor: '#fffbe6',
                borderRadius: 8,
                border: '1px solid #ffd591',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#574400',
                lineHeight: 1.6,
                fontSize: 13,
              }}
            >
              {customer.notes}
            </div>
          </Card>
        )}
      </div>
    </Drawer>
  );
};