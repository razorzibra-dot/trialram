/**
 * Complaints Detail Panel
 * Displays detailed information about a complaint in a drawer
 */

import React from 'react';
import { Drawer, Card, Button, Descriptions, Tag, Space, Alert, Divider } from 'antd';
import { EditOutlined, CloseOutlined } from '@ant-design/icons';
import { MessageSquare, User, Calendar, Clock } from 'lucide-react';
import { Complaint } from '@/types/complaints';
import { formatDate } from '@/modules/core/utils';

interface ComplaintsDetailPanelProps {
  visible: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  onEdit: () => void;
}

const statusColors: Record<string, string> = {
  new: 'blue',
  in_progress: 'orange',
  resolved: 'green',
  closed: 'default',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const typeLabels: Record<string, string> = {
  breakdown: 'Equipment Breakdown',
  preventive: 'Preventive Maintenance',
  software_update: 'Software Update',
  optimize: 'Optimization',
};

export const ComplaintsDetailPanel: React.FC<ComplaintsDetailPanelProps> = ({
  visible,
  complaint,
  onClose,
  onEdit,
}) => {
  if (!complaint) {
    return null;
  }

  const isClosed = complaint.status === 'closed';

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Complaint Details</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            Close
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit Complaint
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Status Alert */}
        {isClosed && (
          <Alert
            message="This complaint has been resolved"
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        {/* Basic Information */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare style={{ fontSize: 16, color: '#0ea5e9' }} />
              <span>Basic Information</span>
            </div>
          }
          style={{ marginBottom: 20 }}
          variant="borderless"
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Title">
              <strong>{complaint.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {complaint.description}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue">{typeLabels[complaint.type] || complaint.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[complaint.status]}>
                {complaint.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={priorityColors[complaint.priority]}>
                {complaint.priority.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Assignment Information */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User style={{ fontSize: 16, color: '#0ea5e9' }} />
              <span>Assignment & Timeline</span>
            </div>
          }
          style={{ marginBottom: 20 }}
          variant="borderless"
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Assigned Engineer">
              {complaint.assigned_engineer_id ? 'Assigned' : 'Unassigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {formatDate(complaint.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {formatDate(complaint.updated_at)}
            </Descriptions.Item>
            {complaint.closed_at && (
              <Descriptions.Item label="Closed Date">
                {formatDate(complaint.closed_at)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Resolution */}
        {complaint.engineer_resolution && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ fontSize: 16, color: '#0ea5e9' }} />
                <span>Resolution</span>
              </div>
            }
            style={{ marginBottom: 20 }}
            variant="borderless"
          >
            <div style={{
              padding: 12,
              backgroundColor: '#f6ffed',
              borderRadius: 8,
              border: '1px solid #b7eb8f',
              color: '#52c41a'
            }}>
              {complaint.engineer_resolution}
            </div>
          </Card>
        )}

        {/* Comments */}
        {complaint.comments && complaint.comments.length > 0 && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare style={{ fontSize: 16, color: '#0ea5e9' }} />
                <span>Comments ({complaint.comments.length})</span>
              </div>
            }
            variant="borderless"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {complaint.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    Comment by User {comment.user_id}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    {comment.content}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        )}
      </div>
    </Drawer>
  );
};