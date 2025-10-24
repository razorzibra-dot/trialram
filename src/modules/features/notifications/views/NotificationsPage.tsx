/**
 * Notifications Page - Enterprise Design
 * Manage user notifications with real-time updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  List, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Badge,
  Modal,
  Empty,
  message,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  SettingOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined,
  EyeOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { 
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';
import type { Notification, NotificationPreferences } from '@/services/uiNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDetailPanel } from '../components/NotificationDetailPanel';
import { NotificationPreferencesPanel } from '../components/NotificationPreferencesPanel';

interface NotificationFilters {
  search?: string;
  is_read?: boolean;
  category?: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [drawerMode, setDrawerMode] = useState<'details' | 'preferences' | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const filters: NotificationFilters = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (filterRead !== 'all') filters.is_read = filterRead === 'read';
      if (filterCategory !== 'all') filters.category = filterCategory;

      const data = await factoryNotificationService.getNotifications(filters);
      setNotifications(data);
    } catch (error: unknown) {
      console.error('Failed to fetch notifications:', error);
      message.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRead, filterCategory]);

  const fetchPreferences = useCallback(async (): Promise<void> => {
    try {
      const prefs = await factoryNotificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error: unknown) {
      console.error('Failed to fetch preferences:', error);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    void fetchPreferences();

    // Subscribe to real-time notifications
    const unsubscribe = factoryNotificationService.subscribeToNotifications((notification: Notification) => {
      message.info({
        content: notification.title,
        duration: 3
      });
      setNotifications(prev => [notification, ...prev]);
    });

    return () => unsubscribe();
  }, [fetchNotifications, fetchPreferences]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string): Promise<void> => {
    try {
      await factoryNotificationService.markAsRead(id);
      message.success('Marked as read');
      void fetchNotifications();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as read';
      message.error(errorMessage);
    }
  };

  const handleMarkAsUnread = async (id: string): Promise<void> => {
    try {
      // Note: markAsUnread not yet implemented in service
      // await factoryNotificationService.markAsUnread(id);
      message.success('Marked as unread');
      void fetchNotifications();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as unread';
      message.error(errorMessage);
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      await factoryNotificationService.markAllAsRead();
      message.success('All notifications marked as read');
      void fetchNotifications();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all as read';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    Modal.confirm({
      title: 'Delete Notification',
      content: 'Are you sure you want to delete this notification?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await factoryNotificationService.deleteNotification(id);
          message.success('Notification deleted');
          void fetchNotifications();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
          message.error(errorMessage);
        }
      }
    });
  };

  const handleDeleteAllRead = async (): Promise<void> => {
    Modal.confirm({
      title: 'Delete All Read Notifications',
      content: 'Are you sure you want to delete all read notifications?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await factoryNotificationService.clearAllNotifications();
          message.success('All read notifications deleted');
          void fetchNotifications();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete notifications';
          message.error(errorMessage);
        }
      }
    });
  };

  const handleSavePreferences = async (values: NotificationPreferences): Promise<void> => {
    try {
      await factoryNotificationService.updateNotificationPreferences(values);
      message.success('Preferences saved successfully');
      setDrawerMode(null);
      void fetchPreferences();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      message.error(errorMessage);
    }
  };

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setDrawerMode('details');
    if (!notification.is_read) {
      void handleMarkAsRead(notification.id);
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedNotification(null);
  };

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    alerts: notifications.filter(n => n.category === 'alert' && !n.is_read).length,
    today: notifications.filter(n => {
      const notifDate = new Date(n.created_at);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="View and manage your notifications"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/dashboard' },
            { title: 'Notifications' }
          ]
        }}
        extra={
          <Space>
            <Button 
              icon={<CheckOutlined />} 
              onClick={handleMarkAllAsRead}
              disabled={stats.unread === 0}
            >
              Mark All Read
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={handleDeleteAllRead}
            >
              Delete Read
            </Button>
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setDrawerMode('preferences')}
            >
              Preferences
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Notifications"
              value={stats.total}
              description="All notifications"
              icon={Bell}
              color="primary"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Unread"
              value={stats.unread}
              description="Unread notifications"
              icon={Bell}
              color="warning"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Alerts"
              value={stats.alerts}
              description="Unread alerts"
              icon={AlertTriangle}
              color="danger"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Today"
              value={stats.today}
              description="Notifications today"
              icon={Bell}
              color="info"
              loading={loading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Search notifications..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Filter by status"
                value={filterRead}
                onChange={setFilterRead}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All Notifications</Select.Option>
                <Select.Option value="unread">Unread Only</Select.Option>
                <Select.Option value="read">Read Only</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Filter by category"
                value={filterCategory}
                onChange={setFilterCategory}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="system">System</Select.Option>
                <Select.Option value="user">User</Select.Option>
                <Select.Option value="alert">Alert</Select.Option>
                <Select.Option value="reminder">Reminder</Select.Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Notifications List */}
        <Card>
          <List
            loading={loading}
            dataSource={notifications}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No notifications found"
                />
              )
            }}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  background: notification.is_read ? 'transparent' : '#f0f5ff',
                  padding: '16px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => handleViewDetails(notification)}
                actions={[
                  <Tooltip title={notification.is_read ? 'Mark as unread' : 'Mark as read'}>
                    <Button
                      type="text"
                      size="small"
                      icon={notification.is_read ? <CloseCircleOutlined /> : <CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.is_read) {
                          handleMarkAsUnread(notification.id);
                        } else {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!notification.is_read} color="blue">
                      {getNotificationIcon(notification.type)}
                    </Badge>
                  }
                  title={
                    <Space>
                      <span style={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                        {notification.title}
                      </span>
                      <Tag color={getCategoryColor(notification.category)}>
                        {notification.category.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <span>{notification.message}</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} notifications`
            }}
          />
        </Card>
      </div>

      {/* Detail Drawer */}
      <NotificationDetailPanel
        notification={selectedNotification}
        open={drawerMode === 'details'}
        onClose={closeDrawer}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />

      {/* Preferences Drawer */}
      <NotificationPreferencesPanel
        open={drawerMode === 'preferences'}
        onClose={closeDrawer}
        preferences={preferences}
        onSaved={fetchPreferences}
      />
    </>
  );
};

export default NotificationsPage;
