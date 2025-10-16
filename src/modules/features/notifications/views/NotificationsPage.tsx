/**
 * Notifications Page - Enterprise Design
 * Manage user notifications with real-time updates
 */

import React, { useState, useEffect } from 'react';
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
  Switch,
  Form,
  Divider,
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
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';
import { notificationService, Notification, NotificationPreferences } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications((notification) => {
      message.info({
        content: notification.title,
        duration: 3
      });
      fetchNotifications();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [searchTerm, filterRead, filterCategory]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (filterRead !== 'all') filters.is_read = filterRead === 'read';
      if (filterCategory !== 'all') filters.category = filterCategory;

      const data = await notificationService.getNotifications(filters);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      message.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
      form.setFieldsValue(prefs);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      message.success('Marked as read');
      fetchNotifications();
    } catch (error: any) {
      message.error(error.message || 'Failed to mark as read');
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      await notificationService.markAsUnread(id);
      message.success('Marked as unread');
      fetchNotifications();
    } catch (error: any) {
      message.error(error.message || 'Failed to mark as unread');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      message.success('All notifications marked as read');
      fetchNotifications();
    } catch (error: any) {
      message.error(error.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Notification',
      content: 'Are you sure you want to delete this notification?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await notificationService.deleteNotification(id);
          message.success('Notification deleted');
          fetchNotifications();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete notification');
        }
      }
    });
  };

  const handleDeleteAllRead = async () => {
    Modal.confirm({
      title: 'Delete All Read Notifications',
      content: 'Are you sure you want to delete all read notifications?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await notificationService.deleteAllRead();
          message.success('All read notifications deleted');
          fetchNotifications();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete notifications');
        }
      }
    });
  };

  const handleSavePreferences = async (values: any) => {
    try {
      await notificationService.updateNotificationPreferences(values);
      message.success('Preferences saved successfully');
      setShowPreferencesModal(false);
      fetchPreferences();
    } catch (error: any) {
      message.error(error.message || 'Failed to save preferences');
    }
  };

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
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
    <EnterpriseLayout>
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
              onClick={() => setShowPreferencesModal(true)}
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
                        notification.is_read 
                          ? handleMarkAsUnread(notification.id)
                          : handleMarkAsRead(notification.id);
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

      {/* Notification Detail Modal */}
      <Modal
        title="Notification Details"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedNotification(null);
        }}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
          selectedNotification?.link && (
            <Button 
              key="view" 
              type="primary"
              onClick={() => {
                window.location.href = selectedNotification.link!;
              }}
            >
              View Details
            </Button>
          )
        ]}
      >
        {selectedNotification && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Space>
                {getNotificationIcon(selectedNotification.type)}
                <strong style={{ fontSize: '16px' }}>{selectedNotification.title}</strong>
              </Space>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <strong>Message:</strong>
              <p style={{ marginTop: 8 }}>{selectedNotification.message}</p>
            </div>
            <div>
              <strong>Category:</strong>{' '}
              <Tag color={getCategoryColor(selectedNotification.category)}>
                {selectedNotification.category.toUpperCase()}
              </Tag>
            </div>
            <div>
              <strong>Type:</strong>{' '}
              <Tag color={getNotificationColor(selectedNotification.type)}>
                {selectedNotification.type.toUpperCase()}
              </Tag>
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <Tag color={selectedNotification.is_read ? 'default' : 'blue'}>
                {selectedNotification.is_read ? 'Read' : 'Unread'}
              </Tag>
            </div>
            <div>
              <strong>Created:</strong> {new Date(selectedNotification.created_at).toLocaleString()}
            </div>
            {selectedNotification.read_at && (
              <div>
                <strong>Read:</strong> {new Date(selectedNotification.read_at).toLocaleString()}
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* Preferences Modal */}
      <Modal
        title="Notification Preferences"
        open={showPreferencesModal}
        onCancel={() => {
          setShowPreferencesModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePreferences}
        >
          <Divider orientation="left">Notification Channels</Divider>
          
          <Form.Item
            label={
              <Space>
                <MailOutlined />
                Email Notifications
              </Space>
            }
            name="email_notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <MessageOutlined />
                SMS Notifications
              </Space>
            }
            name="sms_notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <MobileOutlined />
                Push Notifications
              </Space>
            }
            name="push_notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">Notification Types</Divider>

          <Form.Item
            label="System Notifications"
            name={['notification_types', 'system']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="User Notifications"
            name={['notification_types', 'user']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Alert Notifications"
            name={['notification_types', 'alert']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Reminder Notifications"
            name={['notification_types', 'reminder']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default NotificationsPage;