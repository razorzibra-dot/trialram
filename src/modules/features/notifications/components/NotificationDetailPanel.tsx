/**
 * Notification Detail Panel - Read-only Drawer
 * Displays notification details
 */
import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Badge, Card } from 'antd';
import { DeleteOutlined, CheckOutlined, CalendarOutlined, BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Notification } from '@/services/uiNotificationService';

interface NotificationDetailPanelProps {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationDetailPanel: React.FC<NotificationDetailPanelProps> = ({
  notification,
  open,
  onClose,
  onMarkAsRead,
  onDelete
}) => {
  if (!notification) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ fontSize: 20, color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'processing';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'blue';
      case 'user':
        return 'green';
      case 'alert':
        return 'red';
      case 'reminder':
        return 'orange';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>Notification Details</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={onClose}>Close</Button>
          {!notification.is_read && onMarkAsRead && (
            <Button
              size="large"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark Read
            </Button>
          )}
          {onDelete && (
            <Button
              size="large"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(notification.id)}
            >
              Delete
            </Button>
          )}
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Header Card */}
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            {getNotificationIcon(notification.type)}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: 16, fontWeight: 600 }}>
                {notification.title}
              </h3>
            </div>
          </div>
          <Space wrap>
            <Tag color={getNotificationColor(notification.type)}>
              {notification.type.toUpperCase()}
            </Tag>
            <Tag color={getCategoryColor(notification.category)}>
              {notification.category.toUpperCase()}
            </Tag>
            {!notification.is_read && (
              <Badge status="processing" text="Unread" />
            )}
          </Space>
        </Card>

        {/* Content Card */}
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
            <InfoCircleOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Message</h4>
          </div>
          <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>
            {notification.message}
          </p>
        </Card>

        {notification.data && Object.keys(notification.data).length > 0 && (
          <Card size="small" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
              <InfoCircleOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Additional Data</h4>
            </div>
            <Descriptions column={1} size="small">
              {Object.entries(notification.data).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}

        {/* Metadata Card */}
        <Card size="small" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
            <CalendarOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Metadata</h4>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Created">
              {new Date(notification.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Read Status">
              <Tag color={notification.is_read ? 'default' : 'blue'}>
                {notification.is_read ? 'Read' : 'Unread'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </Drawer>
  );
};

export default NotificationDetailPanel;
