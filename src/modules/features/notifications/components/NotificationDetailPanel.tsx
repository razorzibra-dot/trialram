/**
 * Notification Detail Panel - Read-only Drawer
 * Displays notification details
 */
import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Badge } from 'antd';
import { DeleteOutlined, CheckOutlined, CalendarOutlined } from '@ant-design/icons';
import { Notification } from '@/services/notificationService';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

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
        return <CheckCircle size={20} color="#52c41a" />;
      case 'warning':
        return <AlertTriangle size={20} color="#faad14" />;
      case 'error':
        return <XCircle size={20} color="#ff4d4f" />;
      default:
        return <Info size={20} color="#1890ff" />;
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
      title="Notification Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      extra={
        <Space>
          {!notification.is_read && onMarkAsRead && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => onMarkAsRead(notification.id)}
              size="small"
            >
              Mark Read
            </Button>
          )}
          {onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(notification.id)}
              size="small"
            >
              Delete
            </Button>
          )}
        </Space>
      }
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {getNotificationIcon(notification.type)}
          <h3 style={{ margin: 0, color: '#2C3E50', flex: 1 }}>
            {notification.title}
          </h3>
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
      </div>

      <Divider />

      {/* Content */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 12, color: '#2C3E50' }}>Content</h4>
        <p style={{ color: '#7A8691', lineHeight: 1.6 }}>
          {notification.message}
        </p>
      </div>

      {notification.data && Object.keys(notification.data).length > 0 && (
        <>
          <Divider />

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#2C3E50' }}>Additional Data</h4>
            <Descriptions column={1} size="small">
              {Object.entries(notification.data).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        </>
      )}

      <Divider />

      {/* Metadata */}
      <div>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Metadata</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={<><CalendarOutlined /> Created</>}>
            {new Date(notification.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Read Status">
            <Tag color={notification.is_read ? 'default' : 'blue'}>
              {notification.is_read ? 'Read' : 'Unread'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  );
};

export default NotificationDetailPanel;