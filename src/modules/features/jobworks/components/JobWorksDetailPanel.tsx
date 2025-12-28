/**
 * Job Works Detail Panel
 * Side drawer for viewing job work details in read-only mode
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty, Card, Statistic, Row, Col } from 'antd';
import { EditOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, DollarOutlined, ToolOutlined } from '@ant-design/icons';
import { JobWork } from '../services/jobWorksService';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface JobWorksDetailPanelProps {
  open: boolean;
  jobWork: JobWork | null;
  onClose: () => void;
  onEdit: () => void;
}

export const JobWorksDetailPanel: React.FC<JobWorksDetailPanelProps> = ({
  open,
  jobWork,
  onClose,
  onEdit,
}) => {
  if (!jobWork) {
    return null;
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'blue';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'default';
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ToolOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Job Work Details</span>
        </div>
      }
      placement="right"
      width={650}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Close
          </Button>
          <Button type="primary" size="large" icon={<EditOutlined />} onClick={onEdit}>
            Edit Job Work
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Basic Information Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <InfoCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Title">
              {jobWork.title}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {jobWork.description || 'No description'}
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              {jobWork.customer_name || 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Status & Priority Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <InfoCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Status & Priority</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(jobWork.status)}>
                {jobWork.status?.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(jobWork.priority)}>
                {jobWork.priority?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Assignment & Timeline Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Assignment & Timeline</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Assigned To">
              {jobWork.assigned_to_name || 'Unassigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {formatDate(jobWork.start_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {formatDate(jobWork.due_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Completion Date">
              {formatDate(jobWork.completion_date)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Hours & Cost Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <ClockCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Hours & Cost</h3>
          </div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="Estimated Hours"
                value={jobWork.estimated_hours || 0}
                suffix="h"
                valueStyle={{ color: '#0ea5e9' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Actual Hours"
                value={jobWork.actual_hours || 0}
                suffix="h"
                valueStyle={{ color: '#10b981' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Cost"
                value={jobWork.cost || 0}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#8b5cf6' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Audit Information Card */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <InfoCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Audit Information</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Created">
              {formatDate(jobWork.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {formatDate(jobWork.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </Drawer>
  );
};