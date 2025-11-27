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
  message
} from 'antd';
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
import { useConvertLeadToCustomer } from '../hooks/useLeads';

const { Title, Text, Paragraph } = Typography;

interface LeadDetailPanelProps {
  visible: boolean;
  lead?: LeadDTO | null;
  onClose: () => void;
  onEdit?: (lead: LeadDTO) => void;
  onConvert?: (lead: LeadDTO) => void;
}

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  visible,
  lead,
  onClose,
  onEdit,
  onConvert
}) => {
  const convertLead = useConvertLeadToCustomer();

  if (!lead) return null;

  const handleConvert = async () => {
    try {
      // This would typically open a modal to select/create customer
      // For now, we'll just show a message
      message.info('Lead conversion would open customer selection modal');
      onConvert?.(lead);
    } catch (error) {
      message.error('Failed to convert lead');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'orange';
      case 'qualified': return 'green';
      case 'unqualified': return 'red';
      case 'converted': return 'purple';
      case 'lost': return 'gray';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          Lead Details
        </Space>
      }
      width={800}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={() => onEdit?.(lead)}>
            Edit Lead
          </Button>
          {!lead.convertedToCustomer && (
            <Button type="primary" onClick={handleConvert}>
              Convert to Customer
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ padding: '0 8px' }}>
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
              <Timeline mode="left" size="small">
                <Timeline.Item
                  dot={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                  label={formatDate(lead.audit.createdAt)}
                >
                  Lead created
                </Timeline.Item>
                {lead.lastContact && (
                  <Timeline.Item
                    dot={<PhoneOutlined style={{ color: '#52c41a' }} />}
                    label={formatDate(lead.lastContact)}
                  >
                    Last contact
                  </Timeline.Item>
                )}
                {lead.nextFollowUp && (
                  <Timeline.Item
                    dot={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    label={formatDate(lead.nextFollowUp)}
                  >
                    Next follow-up
                  </Timeline.Item>
                )}
                {lead.convertedToCustomer && lead.convertedAt && (
                  <Timeline.Item
                    dot={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                    label={formatDate(lead.convertedAt)}
                  >
                    Converted to customer
                  </Timeline.Item>
                )}
              </Timeline>
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
                <Descriptions.Item label="Created">
                  {formatDate(lead.audit.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} sm={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Last Updated">
                  {formatDate(lead.audit.updatedAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {lead.audit.createdBy || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </div>
    </Drawer>
  );
};