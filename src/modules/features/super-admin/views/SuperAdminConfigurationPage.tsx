/**
 * Super Admin Configuration Page
 * Platform-wide settings including email, SMS, payment gateways, and system configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Tabs,
  Space,
  message,
  Divider,
  Alert,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  SaveOutlined,
  MailOutlined,
  MessageOutlined,
  CreditCardOutlined,
  SettingOutlined,
  LockOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PlatformConfig {
  // Email Configuration
  email: {
    provider: string;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
    use_tls: boolean;
  };
  // SMS Configuration
  sms: {
    provider: string;
    account_sid: string;
    auth_token: string;
    from_number: string;
  };
  // Payment Gateway
  payment: {
    stripe_enabled: boolean;
    stripe_public_key: string;
    stripe_secret_key: string;
    stripe_webhook_secret: string;
    paypal_enabled: boolean;
    paypal_client_id: string;
    paypal_secret: string;
  };
  // System Settings
  system: {
    platform_name: string;
    support_email: string;
    max_tenants: number;
    max_users_per_tenant: number;
    default_storage_gb: number;
    session_timeout_minutes: number;
    enable_signup: boolean;
    require_email_verification: boolean;
    enable_maintenance_mode: boolean;
    maintenance_message: string;
  };
  // Security Settings
  security: {
    enforce_mfa: boolean;
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_numbers: boolean;
    password_require_special: boolean;
    password_expiry_days: number;
    max_login_attempts: number;
    lockout_duration_minutes: number;
  };
  // Storage Settings
  storage: {
    provider: string;
    aws_access_key: string;
    aws_secret_key: string;
    aws_region: string;
    aws_bucket: string;
    azure_connection_string: string;
    azure_container: string;
  };
}

const SuperAdminConfigurationPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [activeTab, setActiveTab] = useState('email');

  const loadConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockConfig: PlatformConfig = {
        email: {
          provider: 'smtp',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_username: 'noreply@platform.com',
          smtp_password: '••••••••',
          from_email: 'noreply@platform.com',
          from_name: 'Platform Support',
          use_tls: true,
        },
        sms: {
          provider: 'twilio',
          account_sid: 'AC••••••••••••••••••••••••••••••',
          auth_token: '••••••••••••••••••••••••••••••••',
          from_number: '+1234567890',
        },
        payment: {
          stripe_enabled: true,
          stripe_public_key: 'pk_test_••••••••••••••••••••••••',
          stripe_secret_key: 'sk_test_••••••••••••••••••••••••',
          stripe_webhook_secret: 'whsec_••••••••••••••••••••••••',
          paypal_enabled: false,
          paypal_client_id: '',
          paypal_secret: '',
        },
        system: {
          platform_name: 'Enterprise CRM Platform',
          support_email: 'support@platform.com',
          max_tenants: 1000,
          max_users_per_tenant: 500,
          default_storage_gb: 100,
          session_timeout_minutes: 60,
          enable_signup: true,
          require_email_verification: true,
          enable_maintenance_mode: false,
          maintenance_message: 'System is under maintenance. Please check back later.',
        },
        security: {
          enforce_mfa: false,
          password_min_length: 8,
          password_require_uppercase: true,
          password_require_lowercase: true,
          password_require_numbers: true,
          password_require_special: true,
          password_expiry_days: 90,
          max_login_attempts: 5,
          lockout_duration_minutes: 30,
        },
        storage: {
          provider: 'aws',
          aws_access_key: 'AKIA••••••••••••••••',
          aws_secret_key: '••••••••••••••••••••••••••••••••••••••••',
          aws_region: 'us-east-1',
          aws_bucket: 'platform-storage',
          azure_connection_string: '',
          azure_container: '',
        },
      };

      setConfig(mockConfig);
      form.setFieldsValue(mockConfig);
    } catch (error) {
      if (error instanceof Error) {
        message.error('Failed to load configuration');
        console.error('Error loading config:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleSave = async (values: PlatformConfig) => {
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setConfig(values);
      message.success('Configuration saved successfully');
    } catch (error) {
      if (error instanceof Error) {
        message.error('Failed to save configuration');
        console.error('Error saving config:', error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const emailConfig = form.getFieldValue('email');
      message.loading('Sending test email...', 0);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.destroy();
      message.success('Test email sent successfully!');
    } catch (error) {
      message.destroy();
      message.error('Failed to send test email');
    }
  };

  const handleTestSMS = async () => {
    try {
      const smsConfig = form.getFieldValue('sms');
      message.loading('Sending test SMS...', 0);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.destroy();
      message.success('Test SMS sent successfully!');
    } catch (error) {
      message.destroy();
      message.error('Failed to send test SMS');
    }
  };

  return (
    <>
      <PageHeader
        title="Platform Configuration"
        description="Configure platform-wide settings and integrations"
        breadcrumb={{
          items: [
            { title: 'Super Admin', path: '/super-admin/dashboard' },
            { title: 'Configuration' },
          ],
        }}
      />

      <div style={{ padding: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={config || undefined}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Email Configuration */}
            <TabPane
              tab={
                <span>
                  <MailOutlined />
                  Email
                </span>
              }
              key="email"
            >
              <Card>
                <Alert
                  message="Email Configuration"
                  description="Configure SMTP settings for sending platform emails"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Email Provider"
                      name={['email', 'provider']}
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Select.Option value="smtp">SMTP</Select.Option>
                        <Select.Option value="sendgrid">SendGrid</Select.Option>
                        <Select.Option value="mailgun">Mailgun</Select.Option>
                        <Select.Option value="ses">Amazon SES</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Host"
                      name={['email', 'smtp_host']}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="smtp.gmail.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Port"
                      name={['email', 'smtp_port']}
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Use TLS"
                      name={['email', 'use_tls']}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Username"
                      name={['email', 'smtp_username']}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Password"
                      name={['email', 'smtp_password']}
                      rules={[{ required: true }]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="From Email"
                      name={['email', 'from_email']}
                      rules={[{ required: true, type: 'email' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="From Name" name={['email', 'from_name']}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Button onClick={handleTestEmail}>Send Test Email</Button>
              </Card>
            </TabPane>

            {/* SMS Configuration */}
            <TabPane
              tab={
                <span>
                  <MessageOutlined />
                  SMS
                </span>
              }
              key="sms"
            >
              <Card>
                <Alert
                  message="SMS Configuration"
                  description="Configure SMS provider for sending notifications"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMS Provider"
                      name={['sms', 'provider']}
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Select.Option value="twilio">Twilio</Select.Option>
                        <Select.Option value="nexmo">Nexmo</Select.Option>
                        <Select.Option value="sns">Amazon SNS</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="From Number"
                      name={['sms', 'from_number']}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="+1234567890" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Account SID"
                      name={['sms', 'account_sid']}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Auth Token"
                      name={['sms', 'auth_token']}
                      rules={[{ required: true }]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                </Row>

                <Button onClick={handleTestSMS}>Send Test SMS</Button>
              </Card>
            </TabPane>

            {/* Payment Configuration */}
            <TabPane
              tab={
                <span>
                  <CreditCardOutlined />
                  Payment
                </span>
              }
              key="payment"
            >
              <Card title="Stripe Configuration" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="Enable Stripe"
                  name={['payment', 'stripe_enabled']}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Stripe Public Key"
                      name={['payment', 'stripe_public_key']}
                    >
                      <Input placeholder="pk_test_..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Stripe Secret Key"
                      name={['payment', 'stripe_secret_key']}
                    >
                      <Input.Password placeholder="sk_test_..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Stripe Webhook Secret"
                      name={['payment', 'stripe_webhook_secret']}
                    >
                      <Input.Password placeholder="whsec_..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="PayPal Configuration">
                <Form.Item
                  label="Enable PayPal"
                  name={['payment', 'paypal_enabled']}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="PayPal Client ID" name={['payment', 'paypal_client_id']}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="PayPal Secret" name={['payment', 'paypal_secret']}>
                      <Input.Password />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* System Settings */}
            <TabPane
              tab={
                <span>
                  <SettingOutlined />
                  System
                </span>
              }
              key="system"
            >
              <Card>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Platform Name"
                      name={['system', 'platform_name']}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Support Email"
                      name={['system', 'support_email']}
                      rules={[{ required: true, type: 'email' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Max Tenants" name={['system', 'max_tenants']}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Max Users Per Tenant"
                      name={['system', 'max_users_per_tenant']}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Default Storage (GB)"
                      name={['system', 'default_storage_gb']}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Session Timeout (minutes)"
                      name={['system', 'session_timeout_minutes']}
                    >
                      <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Space>
                      <Form.Item
                        label="Enable Signup"
                        name={['system', 'enable_signup']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        label="Require Email Verification"
                        name={['system', 'require_email_verification']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Space>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Maintenance Mode"
                      name={['system', 'enable_maintenance_mode']}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Maintenance Message"
                      name={['system', 'maintenance_message']}
                    >
                      <TextArea rows={3} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* Security Settings */}
            <TabPane
              tab={
                <span>
                  <LockOutlined />
                  Security
                </span>
              }
              key="security"
            >
              <Card>
                <Title level={5}>Password Policy</Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Minimum Password Length"
                      name={['security', 'password_min_length']}
                    >
                      <InputNumber min={6} max={32} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Password Expiry (days)"
                      name={['security', 'password_expiry_days']}
                    >
                      <InputNumber min={0} max={365} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Space direction="vertical">
                      <Form.Item
                        label="Require Uppercase"
                        name={['security', 'password_require_uppercase']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        label="Require Lowercase"
                        name={['security', 'password_require_lowercase']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        label="Require Numbers"
                        name={['security', 'password_require_numbers']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        label="Require Special Characters"
                        name={['security', 'password_require_special']}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Space>
                  </Col>
                </Row>

                <Divider />

                <Title level={5}>Authentication</Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Enforce MFA"
                      name={['security', 'enforce_mfa']}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Max Login Attempts"
                      name={['security', 'max_login_attempts']}
                    >
                      <InputNumber min={3} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Lockout Duration (minutes)"
                      name={['security', 'lockout_duration_minutes']}
                    >
                      <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* Storage Settings */}
            <TabPane
              tab={
                <span>
                  <CloudOutlined />
                  Storage
                </span>
              }
              key="storage"
            >
              <Card>
                <Form.Item
                  label="Storage Provider"
                  name={['storage', 'provider']}
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="aws">Amazon S3</Select.Option>
                    <Select.Option value="azure">Azure Blob Storage</Select.Option>
                    <Select.Option value="local">Local Storage</Select.Option>
                  </Select>
                </Form.Item>

                <Divider>AWS S3 Configuration</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="AWS Access Key" name={['storage', 'aws_access_key']}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="AWS Secret Key" name={['storage', 'aws_secret_key']}>
                      <Input.Password />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="AWS Region" name={['storage', 'aws_region']}>
                      <Input placeholder="us-east-1" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="AWS Bucket" name={['storage', 'aws_bucket']}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Azure Blob Storage Configuration</Divider>

                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item
                      label="Azure Connection String"
                      name={['storage', 'azure_connection_string']}
                    >
                      <TextArea rows={3} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Azure Container" name={['storage', 'azure_container']}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>
          </Tabs>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save Configuration
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form>
      </div>
    </>
  );
};

export default SuperAdminConfigurationPage;