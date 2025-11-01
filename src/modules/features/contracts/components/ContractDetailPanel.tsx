/**
 * Contract Detail Panel - Enterprise Edition
 * Side drawer for viewing contract details in read-only mode with professional UI/UX
 * ✨ Enhanced with:
 *   - Professional card-based layout
 *   - Clear visual hierarchy
 *   - Rich metric displays
 *   - Status indicators with badges
 *   - Organized sections
 */

import React from 'react';
import { 
  Drawer, Descriptions, Button, Space, Divider, Tag, Empty, Row, Col, Statistic, 
  Card, Alert, Progress
} from 'antd';
import { 
  EditOutlined, MailOutlined, CalendarOutlined, DollarOutlined, FileTextOutlined,
  UserOutlined, SafetyOutlined, CheckCircleOutlined, SyncOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { Contract } from '@/types/contracts';

interface ContractDetailPanelProps {
  visible: boolean;
  contract: Contract | null;
  onClose: () => void;
  onEdit: () => void;
}

// Status styling configurations
const statusConfig = {
  draft: { color: 'processing', icon: '📝', bg: '#f0f5ff' },
  pending_approval: { color: 'warning', icon: '⏳', bg: '#fffbe6' },
  active: { color: 'success', icon: '✅', bg: '#f6ffed' },
  renewed: { color: 'processing', icon: '🔄', bg: '#f0f5ff' },
  expired: { color: 'error', icon: '❌', bg: '#fff1f0' },
  terminated: { color: 'error', icon: '🛑', bg: '#fff1f0' },
};

const typeConfig = {
  service_agreement: { color: 'blue', icon: '📋' },
  nda: { color: 'purple', icon: '🔒' },
  purchase_order: { color: 'green', icon: '📦' },
  employment: { color: 'orange', icon: '👤' },
  custom: { color: 'default', icon: '⚙️' },
};

const priorityConfig = {
  low: { color: 'success', icon: '🟢' },
  medium: { color: 'processing', icon: '🟡' },
  high: { color: 'warning', icon: '🟠' },
  urgent: { color: 'error', icon: '🔴' },
};

const sectionStyles = {
  card: {
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '2px solid #f0f0f0',
  },
  headerIcon: {
    fontSize: 18,
    color: '#0ea5e9',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
};

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    const end = new Date(contract.end_date);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const displayType = contract.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const displayStatus = contract.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileTextOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
          <span>Contract Details</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Close
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={onEdit}
            size="large"
          >
            Edit Contract
          </Button>
        </Space>
      }
      styles={{
        header: { borderBottom: '1px solid #e5e7eb' },
        body: { padding: '24px', background: '#fafafa' }
      }}
    >
      {contract ? (
        <div>
          {/* Expiring Soon Alert */}
          {isExpiringSoon && (
            <Alert
              message={`Contract expires in ${daysRemaining} days`}
              description="Consider initiating renewal process or reviewing terms"
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Key Metrics Section */}
          <Card style={sectionStyles.card as any}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Contract Value"
                  value={formatCurrency(contract.value || 0)}
                  prefix={<DollarOutlined style={{ color: '#10b981' }} />}
                  valueStyle={{ color: '#1f2937', fontSize: 20, fontWeight: 700 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Days Remaining"
                  value={daysRemaining}
                  suffix={daysRemaining > 0 ? 'days' : 'Expired'}
                  prefix={<CalendarOutlined style={{ color: '#f59e0b' }} />}
                  valueStyle={{ color: daysRemaining > 0 ? '#1f2937' : '#dc2626', fontSize: 20, fontWeight: 700 }}
                />
              </Col>
            </Row>
          </Card>

          {/* Status Badges */}
          <Card style={sectionStyles.card as any}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div style={{ padding: '12px', background: statusConfig[contract.status as keyof typeof statusConfig]?.bg || '#f0f0f0', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Status</div>
                  <Tag color={getStatusColor(contract.status)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {statusConfig[contract.status as keyof typeof statusConfig]?.icon} {displayStatus}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ padding: '12px', background: '#f0f5ff', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Type</div>
                  <Tag color={getTypeColor(contract.type)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {typeConfig[contract.type as keyof typeof typeConfig]?.icon} {displayType}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Priority</div>
                  <Tag color={getPriorityColor(contract.priority)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {priorityConfig[contract.priority as keyof typeof priorityConfig]?.icon} {contract.priority?.toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Basic Information Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <FileTextOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Basic Information</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Title" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.title}
              </Descriptions.Item>
              <Descriptions.Item label="Contract Number" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                  {contract.contract_number}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="Description" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.description || <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Party Information Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <UserOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Party Information</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Customer Name" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Contact" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.customer_contact ? (
                  <a href={`mailto:${contract.customer_contact}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MailOutlined /> {contract.customer_contact}
                  </a>
                ) : <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned To" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.assigned_to_name ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserOutlined /> {contract.assigned_to_name}
                  </span>
                ) : <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Financial Information Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <DollarOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Financial Information</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Contract Value" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                  {formatCurrency(contract.value || 0)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Currency" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.currency || 'USD'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.payment_terms ? (
                  <Tag color="blue">{contract.payment_terms}</Tag>
                ) : <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Terms" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.delivery_terms || <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Duration Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <CalendarOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Duration</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Start Date" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined /> {formatDate(contract.start_date)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="End Date" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarOutlined /> {formatDate(contract.end_date)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Renewal Settings Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <SyncOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Renewal Settings</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Auto Renewal" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <Tag color={contract.auto_renew ? 'green' : 'default'}>
                  {contract.auto_renew ? '🔄 Enabled' : '⛔ Disabled'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Renewal Period" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.renewal_period_months ? (
                  <span>{contract.renewal_period_months} months</span>
                ) : <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Renewal Terms" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                {contract.renewal_terms || <span style={{ color: '#9ca3af' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Compliance Section */}
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <CheckCircleOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Compliance</h3>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Compliance Status" labelStyle={{ fontWeight: 600, color: '#374151' }}>
                <Tag color={contract.compliance_status === 'compliant' ? 'green' : contract.compliance_status === 'pending_review' ? 'orange' : 'red'}>
                  {contract.compliance_status === 'compliant' ? '✅' : contract.compliance_status === 'pending_review' ? '⏳' : '❌'} {contract.compliance_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Notes Section */}
          {contract.notes && (
            <Card style={sectionStyles.card as any}>
              <div style={sectionStyles.header as any}>
                <span style={{ fontSize: 16 }}>📝</span>
                <h3 style={sectionStyles.headerTitle as any}>Additional Notes</h3>
              </div>
              <div style={{ 
                padding: 12, 
                background: '#fffbeb', 
                borderRadius: 8,
                border: '1px solid #fcd34d',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#42342a',
                lineHeight: '1.6',
              }}>
                {contract.notes}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Empty description="No contract selected" />
      )}
    </Drawer>
  );
};