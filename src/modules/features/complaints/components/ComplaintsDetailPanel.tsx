/**
 * Complaints Detail Panel
 * Displays detailed information about a complaint in a drawer
 */

import React from 'react';
import { Drawer, Card, Button, Descriptions, Tag, Space, Alert, Divider } from 'antd';
import { EditOutlined, CloseOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { Complaint } from '@/types/complaints';
import { formatDate } from '@/modules/core/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataLookup } from '@/hooks/useReferenceDataLookup';

interface ComplaintsDetailPanelProps {
  open: boolean;
  complaint: Complaint | null;
  onClose: () => void;
  onEdit: () => void;
}

export const ComplaintsDetailPanel: React.FC<ComplaintsDetailPanelProps> = ({
  open,
  complaint,
  onClose,
  onEdit,
}) => {
  const { hasPermission } = useAuth();

  // Database-driven lookups
  const { getColor: getStatusColor, getLabel: getStatusLabel } = useReferenceDataLookup('complaint_status');
  const { getColor: getPriorityColor, getLabel: getPriorityLabel } = useReferenceDataLookup('complaint_priority');
  const { getLabel: getTypeLabel } = useReferenceDataLookup('complaint_type');

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

  if (!complaint) {
    return null;
  }

  const isClosed = complaint.status === 'closed';

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Complaint Details</span>
        </div>
      }
      placement="right"
      width={650}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" icon={<CloseOutlined />} onClick={onClose}>
            Close
          </Button>
          <Button type="primary" size="large" icon={<EditOutlined />} onClick={onEdit}>
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
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <InfoCircleOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Title">
              <strong>{complaint.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {complaint.description}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue">{getTypeLabel(complaint.type)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(complaint.status)}>
                {getStatusLabel(complaint.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(complaint.priority)}>
                {getPriorityLabel(complaint.priority)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Assignment Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Assignment & Timeline</h3>
          </div>
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
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <ClockCircleOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Resolution</h3>
            </div>
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
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <MessageOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Comments ({complaint.comments.length})</h3>
            </div>
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