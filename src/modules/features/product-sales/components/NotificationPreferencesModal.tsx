/**
 * Notification Preferences Modal
 * Allows users to configure notification preferences for different events and channels
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Switch,
  Card,
  Row,
  Col,
  Divider,
  Space,
  Spin,
  message,
  Alert,
  Button,
  Tabs,
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  AppstoreOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { productSalesNotificationService } from '../services/productSalesNotificationService';

interface NotificationPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PreferencesData {
  email: boolean;
  sms: boolean;
  push: boolean;
  in_app: boolean;
  categories: Record<
    string,
    {
      email: boolean;
      sms: boolean;
      push: boolean;
      in_app: boolean;
    }
  >;
}

const notificationTypes = [
  {
    key: 'status_change',
    label: 'Status Updates',
    description: 'Get notified when your order status changes',
  },
  {
    key: 'approval_required',
    label: 'Approval Required',
    description: 'Get notified when an approval is needed',
  },
  {
    key: 'shipment_ready',
    label: 'Shipment Ready',
    description: 'Get notified when your order is ready to ship',
  },
  {
    key: 'delivery_confirmed',
    label: 'Delivery Confirmed',
    description: 'Get notified when your order is delivered',
  },
  {
    key: 'invoice_generated',
    label: 'Invoice Generated',
    description: 'Get notified when an invoice is generated',
  },
  {
    key: 'payment_received',
    label: 'Payment Received',
    description: 'Get notified when payment is received',
  },
  {
    key: 'sale_cancelled',
    label: 'Order Cancelled',
    description: 'Get notified when an order is cancelled',
  },
  {
    key: 'refund_processed',
    label: 'Refund Processed',
    description: 'Get notified when a refund is processed',
  },
];

const channels = [
  { key: 'email', label: 'Email', icon: <MailOutlined /> },
  { key: 'sms', label: 'SMS', icon: <PhoneOutlined /> },
  { key: 'push', label: 'Push', icon: <BellOutlined /> },
  { key: 'in_app', label: 'In-App', icon: <AppstoreOutlined /> },
];

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await productSalesNotificationService.getUserNotificationPreferences();
      setPreferences(prefs);
      form.setFieldsValue(prefs);
      setChanged(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
      message.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      await productSalesNotificationService.updateUserNotificationPreferences(values);
      message.success('Notification preferences updated successfully');
      setChanged(false);
      setPreferences(values);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      message.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (changed) {
      Modal.confirm({
        icon: <ExclamationCircleOutlined />,
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to close?',
        okText: 'Close',
        cancelText: 'Continue Editing',
        onOk: () => {
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  const handleFormChange = () => {
    setChanged(true);
  };

  return (
    <Modal
      title={
        <Space>
          <BellOutlined />
          <span>Notification Preferences</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave} loading={saving} disabled={!changed || loading}>
            Save Changes
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          initialValues={preferences || {}}
        >
          {/* Global Channel Preferences */}
          <div style={{ marginBottom: 24 }}>
            <h4>Global Notification Channels</h4>
            <Alert
              message="Configure which channels to use for all notifications"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              {channels.map(channel => (
                <Col key={channel.key} xs={24} sm={12} md={6}>
                  <Card size="small" hoverable>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        {channel.icon}
                        <span>{channel.label}</span>
                      </Space>
                      <Form.Item
                        name={channel.key}
                        valuePropName="checked"
                        style={{ margin: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <Divider />

          {/* Notification Type Preferences */}
          <div>
            <h4>Notification Type Preferences</h4>
            <Alert
              message="Configure channels for specific notification types"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs
              items={notificationTypes.map(type => ({
                key: type.key,
                label: (
                  <CustomTooltip title={type.description}>
                    {type.label}
                  </CustomTooltip>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
                      {type.description}
                    </p>
                    <Row gutter={[16, 16]}>
                      {channels.map(channel => (
                        <Col key={channel.key} xs={24} sm={12} md={6}>
                          <Card size="small" hoverable>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space>
                                {channel.icon}
                                <span>{channel.label}</span>
                              </Space>
                              <Form.Item
                                name={['categories', type.key, channel.key]}
                                valuePropName="checked"
                                style={{ margin: 0 }}
                              >
                                <Switch />
                              </Form.Item>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ),
              }))}
            />
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

interface CustomTooltipProps {
  title: string;
  children: React.ReactNode;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ title, children }) => (
  <div title={title}>{children}</div>
);

export default NotificationPreferencesModal;