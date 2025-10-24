/**
 * Contract Detail Panel
 * Side drawer for viewing contract details in read-only mode
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty, Row, Col, Statistic } from 'antd';
import { EditOutlined, MailOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { Contract } from '@/types/contracts';

interface ContractDetailPanelProps {
  visible: boolean;
  contract: Contract | null;
  onClose: () => void;
  onEdit: () => void;
}

export const ContractDetailPanel: React.FC<ContractDetailPanelProps> = ({
  visible,
  contract,
  onClose,
  onEdit,
}) => {
  if (!contract) {
    return null;
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'active': 'green',
      'draft': 'default',
      'pending_approval': 'orange',
      'expired': 'red',
      'terminated': 'red',
      'renewed': 'blue',
    };
    return colorMap[status] || 'default';
  };

  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'service_agreement': 'blue',
      'nda': 'purple',
      'purchase_order': 'green',
      'employment': 'orange',
      'custom': 'default',
    };
    return colorMap[type] || 'default';
  };

  const getPriorityColor = (priority: string): string => {
    const colorMap: Record<string, string> = {
      'urgent': 'red',
      'high': 'orange',
      'medium': 'gold',
      'low': 'green',
    };
    return colorMap[priority] || 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: contract.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const displayType = contract.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const displayStatus = contract.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Drawer
      title="Contract Details"
      placement="right"
      width={550}
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
      {contract ? (
        <div>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12}>
              <Statistic
                title="Contract Value"
                value={formatCurrency(contract.value || 0)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 18 }}
              />
            </Col>
            <Col xs={12}>
              <Statistic
                title="Days Remaining"
                value={Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                suffix="days"
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
          </Row>

          <Divider />

          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Title">
              {contract.title}
            </Descriptions.Item>
            <Descriptions.Item label="Contract Number">
              {contract.contract_number}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {contract.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={getTypeColor(contract.type)}>
                {displayType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(contract.status)}>
                {displayStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(contract.priority)}>
                {contract.priority?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Party Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Party Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Customer Name">
              {contract.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              {contract.customer_contact ? (
                <a href={`mailto:${contract.customer_contact}`}>
                  <MailOutlined /> {contract.customer_contact}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned To">
              {contract.assigned_to_name || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Financial Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Financial Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Contract Value">
              {formatCurrency(contract.value || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Currency">
              {contract.currency || 'USD'}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {contract.payment_terms || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Delivery Terms">
              {contract.delivery_terms || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Duration */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Duration</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Start Date">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(contract.start_date)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(contract.end_date)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Renewal Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Renewal Settings</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Auto Renewal">
              <Tag color={contract.auto_renew ? 'green' : 'default'}>
                {contract.auto_renew ? 'Enabled' : 'Disabled'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Renewal Period">
              {contract.renewal_period_months ? `${contract.renewal_period_months} months` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Renewal Terms">
              {contract.renewal_terms || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Compliance */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Compliance</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Compliance Status">
              <Tag color={contract.compliance_status === 'compliant' ? 'green' : 'red'}>
                {contract.compliance_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {contract.notes && (
            <>
              <Divider />
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Notes</h3>
              <div style={{ 
                padding: 12, 
                background: '#f5f5f5', 
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {contract.notes}
              </div>
            </>
          )}
        </div>
      ) : (
        <Empty description="No contract selected" />
      )}
    </Drawer>
  );
};