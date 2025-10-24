/**
 * Customer Detail Panel
 * Side drawer for viewing customer details in read-only mode
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty } from 'antd';
import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Customer } from '@/types/crm';

interface CustomerDetailPanelProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: () => void;
}

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  visible,
  customer,
  onClose,
  onEdit,
}) => {
  if (!customer) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'default';
      case 'prospect': return 'blue';
      default: return 'default';
    }
  };

  return (
    <Drawer
      title="Customer Details"
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
        </Space>
      }
    >
      {customer ? (
        <div>
          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Company Name">
              {customer.company_name}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Name">
              {customer.contact_name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {customer.email ? (
                <a href={`mailto:${customer.email}`}>
                  <MailOutlined /> {customer.email}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {customer.phone ? (
                <a href={`tel:${customer.phone}`}>
                  <PhoneOutlined /> {customer.phone}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              {customer.mobile ? (
                <a href={`tel:${customer.mobile}`}>
                  <PhoneOutlined /> {customer.mobile}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(customer.status || 'active')}>
                {(customer.status || 'active').toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Business Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Business Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Industry">
              {customer.industry || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Company Size">
              {customer.size ? customer.size.charAt(0).toUpperCase() + customer.size.slice(1) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Type">
              {customer.customer_type ? customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Website">
              {customer.website ? (
                <a href={customer.website} target="_blank" rel="noopener noreferrer">
                  {customer.website}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tax ID">
              {customer.tax_id || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Address Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Address</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Address">
              {customer.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="City">
              {customer.city || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Country">
              {customer.country || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Additional Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Credit Limit">
              {customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {customer.payment_terms || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              {customer.source || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Rating">
              {customer.rating || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : '-'}
            </Descriptions.Item>
          </Descriptions>

          {customer.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div style={{
                padding: 12,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {customer.notes}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No customer selected" />
      )}
    </Drawer>
  );
};