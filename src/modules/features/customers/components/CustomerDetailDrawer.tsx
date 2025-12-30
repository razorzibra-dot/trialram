/**
 * Customer Detail Drawer - Enterprise Enhanced Edition
 * Professional read-only detail view with card-based sections and rich UI
 * ✨ Enterprise Grade UI/UX Enhancements (Matching Lead Module)
 */

import React, { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Empty,
  message,
  Spin,
  Avatar,
  Badge,
  Tooltip,
} from 'antd';
import {
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  GlobalOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Customer } from '@/types/crm';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_PERMISSIONS } from '../constants/permissions';
import { useAssignedToOptions } from '@/hooks/useAssignedToOptions';
import { ConfirmDelete } from '@/components/modals/ConfirmDelete';

dayjs.extend(relativeTime);

interface CustomerDetailDrawerProps {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

// ✨ Professional styling configuration (consistent with lead module)
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

// Status badge color mapping
const STATUS_COLORS: Record<string, string> = {
  prospect: 'blue',
  qualified: 'cyan',
  active: 'green',
  inactive: 'orange',
  archived: 'gray',
  lost: 'red',
};

// Helper to format currency
const formatCurrency = (value?: number | null): string => {
  if (!value) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Helper to format date
const formatDate = (date?: string | null): string => {
  if (!date) return '-';
  return dayjs(date).format('MMM DD, YYYY');
};

// Helper to format date with time
const formatDateTime = (date?: string | null): string => {
  if (!date) return '-';
  return dayjs(date).format('MMM DD, YYYY HH:mm');
};

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  open,
  customer,
  onClose,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const [deleting, setDeleting] = useState(false);
  const { hasPermission } = useAuth();
  const assignedToOptions = useAssignedToOptions('customers');

  const canEditCustomer = hasPermission(CUSTOMER_PERMISSIONS.UPDATE);
  const canDeleteCustomer = hasPermission(CUSTOMER_PERMISSIONS.DELETE);

  const handleDelete = async () => {
    if (!customer?.id) return;
    setDeleting(true);
    try {
      await onDelete?.();
      // Note: Success notification is shown by the mutation hook (useDeleteCustomer)
      // Don't show duplicate notification here
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  if (!customer) {
    return (
      <Drawer
        title="Customer Details"
        placement="right"
        width={600}
        onClose={onClose}
        open={open}
      >
        <Empty description="No customer selected" />
      </Drawer>
    );
  }

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
      destroyOnClose
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Space>
            {canDeleteCustomer && (
              <ConfirmDelete
                title="Delete Customer"
                description={`Are you sure you want to delete "${customer.companyName}"? This action cannot be undone.`}
                okText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                disabled={isLoading || deleting}
              >
                <Button danger icon={<DeleteOutlined />} loading={deleting} disabled={isLoading || deleting}>
                  Delete
                </Button>
              </ConfirmDelete>
            )}
          </Space>
          <Space style={{ marginLeft: 'auto' }}>
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              disabled={deleting || isLoading}
            >
              Close
            </Button>
            {canEditCustomer && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={onEdit}
                disabled={isLoading || deleting}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Spin spinning={isLoading}>
        <div style={{ padding: '0 24px 24px 24px' }}>
          {/* Header Card - Name & Company Info */}
          <Card
            style={{
              ...sectionStyles.card,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
            }}
            variant="borderless"
          >
            <Row align="middle" gutter={16}>
              <Col>
                <Avatar
                  size={80}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 40,
                  }}
                />
              </Col>
              <Col flex={1}>
                <h2
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {customer.contactName}
                </h2>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {customer.companyName}
                </p>
                <div>
                  <Tag
                    color={STATUS_COLORS[customer.status || 'prospect']}
                    style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    {customer.status?.toUpperCase()}
                  </Tag>
                  {customer.rating && (
                    <Tag style={{ marginLeft: 8, background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: 'none' }}>
                      ⭐ {customer.rating}
                    </Tag>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Contact Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <PhoneOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Contact Information</h3>
            </div>

            <Descriptions size="small" column={1} bordered={false}>
              <Descriptions.Item
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MailOutlined style={{ color: '#6b7280' }} />
                    Email
                  </span>
                }
              >
                <a href={`mailto:${customer.email}`}>{customer.email || '-'}</a>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PhoneOutlined style={{ color: '#6b7280' }} />
                    Phone
                  </span>
                }
              >
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              {customer.mobile && (
                <Descriptions.Item
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PhoneOutlined style={{ color: '#6b7280' }} />
                      Mobile
                    </span>
                  }
                >
                  <a href={`tel:${customer.mobile}`}>{customer.mobile}</a>
                </Descriptions.Item>
              )}
              {customer.website && (
                <Descriptions.Item
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GlobalOutlined style={{ color: '#6b7280' }} />
                      Website
                    </span>
                  }
                >
                  <a href={customer.website} target="_blank" rel="noopener noreferrer">
                    {customer.website}
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Company Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <ShoppingOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Company Information</h3>
            </div>

            <Descriptions size="small" column={2} layout="vertical" bordered={false}>
              {customer.industry && (
                <Descriptions.Item label="Industry">
                  <Tag>{customer.industry}</Tag>
                </Descriptions.Item>
              )}
              {customer.size && (
                <Descriptions.Item label="Company Size">
                  <Tag>{customer.size}</Tag>
                </Descriptions.Item>
              )}
              {customer.city && (
                <Descriptions.Item label="City">
                  {customer.city}
                </Descriptions.Item>
              )}
              {customer.country && (
                <Descriptions.Item label="Country">
                  {customer.country}
                </Descriptions.Item>
              )}
              {customer.address && (
                <Descriptions.Item label="Address" span={2}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{customer.address}</div>
                </Descriptions.Item>
              )}
              {customer.customerType && (
                <Descriptions.Item label="Customer Type">
                  <Tag>{customer.customerType}</Tag>
                </Descriptions.Item>
              )}
              {customer.source && (
                <Descriptions.Item label="Source">
                  {customer.source}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Financial Information */}
          {(customer.creditLimit || customer.annualRevenue || customer.paymentTerms || customer.taxId) && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <DollarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Financial Information</h3>
              </div>

              <Descriptions size="small" column={2} layout="vertical" bordered={false}>
                {customer.creditLimit && (
                  <Descriptions.Item label="Credit Limit">
                    {formatCurrency(customer.creditLimit)}
                  </Descriptions.Item>
                )}
                {customer.annualRevenue && (
                  <Descriptions.Item label="Annual Revenue">
                    {formatCurrency(customer.annualRevenue)}
                  </Descriptions.Item>
                )}
                {customer.paymentTerms && (
                  <Descriptions.Item label="Payment Terms">
                    {customer.paymentTerms}
                  </Descriptions.Item>
                )}
                {customer.taxId && (
                  <Descriptions.Item label="Tax ID">
                    {customer.taxId}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* Assignment Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <TeamOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Assignment</h3>
            </div>

            <Descriptions size="small" column={1} layout="vertical" bordered={false}>
              <Descriptions.Item label="Assigned To">
                {customer.assignedTo ? (
                  <Tag icon={<UserOutlined />}>
                    {assignedToOptions.labelMap[customer.assignedTo] || (customer as any).assignedToName || customer.assignedTo}
                  </Tag>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Not assigned</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Follow-up Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <CalendarOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Follow-up Timeline</h3>
            </div>

            <Descriptions size="small" column={1} layout="vertical" bordered={false}>
              <Descriptions.Item label="Last Contact">
                {customer.lastContactDate ? (
                  <Tooltip title={formatDateTime(customer.lastContactDate)}>
                    {dayjs(customer.lastContactDate).fromNow()}
                  </Tooltip>
                ) : (
                  <span style={{ color: '#9ca3af' }}>No contact recorded</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Next Follow-up">
                {customer.nextFollowUpDate ? (
                  <Badge
                    status={
                      dayjs(customer.nextFollowUpDate).isBefore(dayjs())
                        ? 'error'
                        : 'processing'
                    }
                    text={formatDate(customer.nextFollowUpDate)}
                  />
                ) : (
                  <span style={{ color: '#9ca3af' }}>Not scheduled</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Notes Section */}
          {customer.notes && (
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Notes</h3>
              </div>

              <div
                style={{
                  backgroundColor: '#f9fafb',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#4b5563',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {customer.notes}
              </div>
            </Card>
          )}

          {/* Audit Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <FileTextOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Audit Information</h3>
            </div>

            <Descriptions size="small" column={1} layout="vertical" bordered={false}>
              <Descriptions.Item label="Created">
                {customer.createdAt ? (
                  <Tooltip title={formatDateTime(customer.createdAt)}>
                    {dayjs(customer.createdAt).format('MMM DD, YYYY')}
                  </Tooltip>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {customer.updatedAt ? (
                  <Tooltip title={formatDateTime(customer.updatedAt)}>
                    {dayjs(customer.updatedAt).fromNow()}
                  </Tooltip>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Spin>
    </Drawer>
  );
};

export default CustomerDetailDrawer;
