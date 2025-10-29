/**
 * Notification History Panel
 * Displays all notifications sent for a specific product sale
 * Shows notification type, channels, timestamp, and status
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Empty,
  Tag,
  Space,
  Button,
  Spin,
  Tooltip,
  Badge,
  Timeline,
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ProductSale } from '@/types/productSales';
import { productSalesNotificationService } from '../services/productSalesNotificationService';

interface NotificationHistoryPanelProps {
  sale: ProductSale | null;
}

interface NotificationItem {
  id: string;
  type: string;
  channels: string[];
  title: string;
  message: string;
  createdAt: string;
  status: 'sent' | 'pending' | 'failed';
}

const notificationTypeConfig: Record<string, { label: string; color: string }> = {
  status_change: { label: 'Status Update', color: 'blue' },
  approval_required: { label: 'Approval', color: 'orange' },
  shipment_ready: { label: 'Shipment', color: 'cyan' },
  delivery_confirmed: { label: 'Delivered', color: 'green' },
  invoice_generated: { label: 'Invoice', color: 'purple' },
  payment_received: { label: 'Payment', color: 'gold' },
  sale_cancelled: { label: 'Cancelled', color: 'red' },
  refund_processed: { label: 'Refund', color: 'magenta' },
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email':
      return <MailOutlined title="Email" />;
    case 'sms':
      return <PhoneOutlined title="SMS" />;
    case 'in_app':
      return <BellOutlined title="In-App" />;
    default:
      return null;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sent':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'pending':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    case 'failed':
      return <CheckCircleOutlined style={{ color: '#f5222d' }} />;
    default:
      return null;
  }
};

export const NotificationHistoryPanel: React.FC<NotificationHistoryPanelProps> = ({
  sale,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sale?.id) {
      loadNotificationHistory();
    }
  }, [sale?.id]);

  const loadNotificationHistory = async () => {
    if (!sale?.id) return;

    try {
      setLoading(true);
      const history = await productSalesNotificationService.getNotificationHistory(sale.id);
      
      const mapped: NotificationItem[] = history.map(item => ({
        id: item.id,
        type: item.type,
        channels: item.channels_sent,
        title: item.title,
        message: item.message,
        createdAt: item.created_at,
        status: item.status,
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error('Error loading notification history:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadNotificationHistory();
  };

  if (!sale) {
    return (
      <Card title="Notification History">
        <Empty description="No sale selected" />
      </Card>
    );
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => {
        const config = notificationTypeConfig[type];
        return (
          <Tag color={config?.color || 'default'}>
            {config?.label || type}
          </Tag>
        );
      },
    },
    {
      title: 'Channels',
      dataIndex: 'channels',
      key: 'channels',
      width: 150,
      render: (channels: string[]) => (
        <Space size="small">
          {channels.map(channel => (
            <Tooltip key={channel} title={channel}>
              {getChannelIcon(channel)}
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: NotificationItem) => (
        <Tooltip title={record.message}>
          <span>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Space size="small">
          {getStatusIcon(status)}
          <Tag color={status === 'sent' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        try {
          return new Date(date).toLocaleString();
        } catch {
          return date;
        }
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>Notification History</span>
          <Badge count={notifications.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      }
      style={{ marginTop: 24 }}
    >
      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Empty description="No notifications sent yet" />
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <Timeline
                items={notifications.map(notif => ({
                  dot: getStatusIcon(notif.status),
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {notificationTypeConfig[notif.type]?.label || notif.type}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Space size="small">
                          {notif.channels.map(channel => (
                            <Tag key={channel} color="blue" style={{ fontSize: 11 }}>
                              {channel}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>

            <Table
              columns={columns}
              dataSource={notifications.map((n, i) => ({ ...n, key: n.id || i }))}
              pagination={{ pageSize: 10 }}
              size="small"
              bordered
            />
          </>
        )}
      </Spin>
    </Card>
  );
};

export default NotificationHistoryPanel;