/**
 * Job Works Detail Panel
 * Side drawer for viewing job work details in read-only mode
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { JobWork } from '../services/jobWorksService';

interface JobWorksDetailPanelProps {
  visible: boolean;
  jobWork: JobWork | null;
  onClose: () => void;
  onEdit: () => void;
}

export const JobWorksDetailPanel: React.FC<JobWorksDetailPanelProps> = ({
  visible,
  jobWork,
  onClose,
  onEdit,
}) => {
  if (!jobWork) {
    return null;
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Drawer
      title="Job Work Details"
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
      {jobWork ? (
        <div>
          {/* Basic Information */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>
          <Descriptions column={1} size="small" bordered>
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

          <Divider />

          {/* Status & Priority */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Status & Priority</h3>
          <Descriptions column={1} size="small" bordered>
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

          <Divider />

          {/* Assignment & Timeline */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Assignment & Timeline</h3>
          <Descriptions column={1} size="small" bordered>
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

          <Divider />

          {/* Hours & Cost */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Hours & Cost</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Estimated Hours">
              {jobWork.estimated_hours || '-'} hours
            </Descriptions.Item>
            <Descriptions.Item label="Actual Hours">
              {jobWork.actual_hours || '-'} hours
            </Descriptions.Item>
            <Descriptions.Item label="Cost">
              {formatCurrency(jobWork.cost || 0)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Audit Info */}
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Audit Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Created">
              {formatDate(jobWork.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {formatDate(jobWork.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : (
        <Empty description="No job work data" />
      )}
    </Drawer>
  );
};