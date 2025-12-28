/**
 * Lead Detail Panel - Enterprise Design
 * Comprehensive lead detail view with conversion tracking
 */

import React from 'react';
import {
  Drawer,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  Descriptions,
  Timeline,
  Avatar,
  Tooltip,
} from 'antd';
import { formatDate } from '@/utils/formatters';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  StarOutlined,
  StarFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { LeadDTO } from '@/types/dtos';

const { Title, Text, Paragraph } = Typography;

interface LeadDetailPanelProps {
  open: boolean;
  lead?: LeadDTO | null;
  onClose: () => void;
  onEdit?: (lead: LeadDTO) => void;
}

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  open,
  lead,
  onClose,
  onEdit
}) => {
  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'orange';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      case 'converted': return 'purple';
      case 'lost': return 'gray';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'awareness': return 'blue';
      case 'interest': return 'cyan';
      case 'consideration': return 'orange';
      case 'intent': return 'gold';
      case 'evaluation': return 'purple';
      case 'purchase': return 'green';
      default: return 'default';
    }
  };

  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'blue';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Lead Details</span>
        </div>
      }
      width={800}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>Close</Button>
          {!lead.convertedToCustomer && (
            <Button size="large" type="primary" onClick={() => onEdit?.(lead)}>
              Edit Lead
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Lead Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Avatar size={64} icon={<UserOutlined />} />
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ margin: 0 }}>
                {lead.firstName} {lead.lastName}
              </Title>
              {lead.companyName && (
                <Text type="secondary" style={{ fontSize: 16 }}>
                  <GlobalOutlined style={{ marginRight: 8 }} />
                  {lead.companyName}
                </Text>
              )}
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Tag color={getStatusColor(lead.status)}>
                    {lead.status.toUpperCase()}
                  </Tag>
                  <Tag color={getStageColor(lead.stage)}>
                    {lead.stage.toUpperCase()}
                  </Tag>
                  <Tag color={getQualificationColor(lead.qualificationStatus)}>
                    {lead.qualificationStatus.toUpperCase()}
                  </Tag>
                </Space>
              </div>
            </Col>
            <Col>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {lead.leadScore >= 75 ? (
                    <StarFilled style={{ color: '#faad14', fontSize: 20 }} />
                  ) : (
                    <StarOutlined style={{ color: '#d9d9d9', fontSize: 20 }} />
                  )}
                  <Tag color={getScoreColor(lead.leadScore)} style={{ fontSize: 16, padding: '4px 8px' }}>
                    {lead.leadScore}/100
                  </Tag>
                </div>
                {lead.convertedToCustomer && (
                  <Tag color="purple" icon={<CheckCircleOutlined />}>
                    CONVERTED
                  </Tag>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Contact Information */}
        <Card title="Contact Information" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={<><MailOutlined /> Email</>}>
                  {lead.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                  {formatPhone(lead.phone)}
                </Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined /> Mobile</>}>
                  {formatPhone(lead.mobile)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} sm={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={<><TeamOutlined /> Job Title</>}>
                  {lead.jobTitle || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={<><GlobalOutlined /> Industry</>}>
                  {lead.industry || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> Company Size</>}>
                  {lead.companySize || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>

        {/* Lead Details */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Lead Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Source">
                  {lead.source || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Campaign">
                  {lead.campaign || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Budget Range">
                  {lead.budgetRange || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Timeline">
                  {lead.timeline || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Activity Timeline">
              <Timeline 
                mode="left" 
                size="small"
                items={[
                  {
                    dot: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
                    label: formatDate(lead.audit.createdAt),
                    children: 'Lead created'
                  },
                  ...(lead.lastContact ? [{
                    dot: <PhoneOutlined style={{ color: '#52c41a' }} />,
                    label: formatDate(lead.lastContact),
                    children: 'Last contact'
                  }] : []),
                  ...(lead.nextFollowUp ? [{
                    dot: <ClockCircleOutlined style={{ color: '#faad14' }} />,
                    label: formatDate(lead.nextFollowUp),
                    children: 'Next follow-up'
                  }] : []),
                  ...(lead.convertedToCustomer && lead.convertedAt ? [{
                    dot: <CheckCircleOutlined style={{ color: '#722ed1' }} />,
                    label: formatDate(lead.convertedAt),
                    children: 'Converted to customer'
                  }] : [])
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Notes */}
        {lead.notes && (
          <Card title="Notes" style={{ marginBottom: 16 }}>
            <Paragraph style={{ margin: 0 }}>
              {lead.notes}
            </Paragraph>
          </Card>
        )}

        {/* Assignment Information */}
        <Card title="Assignment & Audit" size="small">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Assigned To">
                  {lead.assignedToName || lead.assignedTo || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {lead.audit.createdByName || lead.audit.createdBy || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {formatDate(lead.audit.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} sm={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Last Updated By">
                  {lead.audit.updatedByName || lead.audit.updatedBy || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {formatDate(lead.audit.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </div>
    </Drawer>
  );
};