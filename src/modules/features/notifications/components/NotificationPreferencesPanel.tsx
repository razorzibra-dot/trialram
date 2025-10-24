/**
 * Notification Preferences Panel - Drawer Form
 * Manage notification channels and preferences
 */
import React from 'react';
import { Drawer, Form, Switch, Divider, Button, Space, message } from 'antd';
import { MailOutlined, MessageOutlined, MobileOutlined } from '@ant-design/icons';
import { NotificationPreferences, notificationService } from '@/services/notificationService';

interface NotificationPreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: NotificationPreferences | null;
  onSaved?: () => void;
}

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  open,
  onClose,
  preferences,
  onSaved
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && preferences) {
      form.setFieldsValue(preferences);
    }
  }, [open, preferences, form]);

  const handleSave = async (values: NotificationPreferences) => {
    try {
      setLoading(true);
      await notificationService.updateNotificationPreferences(values);
      message.success('Preferences saved successfully');
      onClose();
      onSaved?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Notification Preferences"
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="primary" 
            onClick={() => form.submit()}
            loading={loading}
          >
            Save Changes
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        autoComplete="off"
      >
        {/* Notification Channels */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 16, color: '#2C3E50', fontWeight: 600 }}>
            Notification Channels
          </h4>

          <Form.Item
            label={
              <Space>
                <MailOutlined />
                Email Notifications
              </Space>
            }
            name="email_notifications"
            valuePropName="checked"
            tooltip="Receive notifications via email"
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
            tooltip="Receive notifications via SMS"
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
            tooltip="Receive push notifications in-app"
          >
            <Switch />
          </Form.Item>
        </div>

        <Divider />

        {/* Notification Types */}
        <div>
          <h4 style={{ marginBottom: 16, color: '#2C3E50', fontWeight: 600 }}>
            Notification Types
          </h4>

          <Form.Item
            label="System Notifications"
            name={['notification_types', 'system']}
            valuePropName="checked"
            tooltip="Receive system and maintenance notifications"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="User Notifications"
            name={['notification_types', 'user']}
            valuePropName="checked"
            tooltip="Receive user-related notifications"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Alert Notifications"
            name={['notification_types', 'alert']}
            valuePropName="checked"
            tooltip="Receive critical alerts"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Reminder Notifications"
            name={['notification_types', 'reminder']}
            valuePropName="checked"
            tooltip="Receive reminders and follow-ups"
          >
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default NotificationPreferencesPanel;
