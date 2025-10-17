/**
 * Tenant Configuration Page - Enterprise Design
 * Comprehensive tenant settings management with tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Upload, 
  ColorPicker, 
  Divider,
  Space,
  message,
  Spin
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  UploadOutlined,
  SettingOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  MailOutlined,
  MessageOutlined,
  LockOutlined
} from '@ant-design/icons';
import { 
  Settings,
  Palette,
  Zap,
  Mail,
  MessageSquare,
  Shield,
  Globe,
  DollarSign,
  Clock
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { tenantService } from '@/services/tenantService';
import { useAuth } from '@/contexts/AuthContext';
import { TenantSettings } from '@/types/rbac';
import type { Color } from 'antd/es/color-picker';

const { TabPane } = Tabs;
const { TextArea } = Input;

export const TenantConfigurationPage: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const tenant = await tenantService.getCurrentTenant();
      if (tenant) {
        setSettings(tenant.settings);
        form.setFieldsValue({
          // General
          timezone: tenant.settings.timezone,
          date_format: tenant.settings.date_format,
          time_format: tenant.settings.time_format,
          currency: tenant.settings.currency,
          language: tenant.settings.language,
          
          // Branding
          company_name: tenant.settings.branding.company_name,
          logo_url: tenant.settings.branding.logo_url,
          primary_color: tenant.settings.branding.primary_color,
          secondary_color: tenant.settings.branding.secondary_color,
          
          // Features
          enable_customers: tenant.settings.features.enable_customers,
          enable_sales: tenant.settings.features.enable_sales,
          enable_contracts: tenant.settings.features.enable_contracts,
          enable_tickets: tenant.settings.features.enable_tickets,
          enable_complaints: tenant.settings.features.enable_complaints,
          enable_job_works: tenant.settings.features.enable_job_works,
          
          // Email
          email_enabled: tenant.settings.email?.enabled || false,
          smtp_host: tenant.settings.email?.smtp_host || '',
          smtp_port: tenant.settings.email?.smtp_port || 587,
          smtp_user: tenant.settings.email?.smtp_user || '',
          smtp_from: tenant.settings.email?.smtp_from || '',
          
          // SMS
          sms_enabled: tenant.settings.sms?.enabled || false,
          sms_provider: tenant.settings.sms?.provider || 'twilio',
          
          // Security
          mfa_enabled: tenant.settings.security?.mfa_enabled || false,
          password_expiry_days: tenant.settings.security?.password_expiry_days || 90,
          session_timeout_minutes: tenant.settings.security?.session_timeout_minutes || 30,
          ip_whitelist_enabled: tenant.settings.security?.ip_whitelist_enabled || false
        });
      }
    } catch (error: unknown) {
      console.error('Failed to fetch settings:', error);
      message.error('Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      const values = await form.validateFields() as Record<string, unknown>;
      
      if (!user?.tenant_id) {
        message.error('Tenant ID not found');
        return;
      }

      const allowedIps = typeof values.allowed_ips === 'string' 
        ? values.allowed_ips.split(',').map((ip: string) => ip.trim())
        : [];

      const updatedSettings: Partial<TenantSettings> = {
        timezone: values.timezone as string,
        date_format: values.date_format as string,
        time_format: values.time_format as string,
        currency: values.currency as string,
        language: values.language as string,
        branding: {
          company_name: values.company_name as string,
          logo_url: (values.logo_url as string) || '',
          primary_color: typeof values.primary_color === 'string' 
            ? values.primary_color 
            : (values.primary_color as { toHexString?: () => string })?.toHexString?.() || '#1890ff',
          secondary_color: typeof values.secondary_color === 'string'
            ? values.secondary_color
            : (values.secondary_color as { toHexString?: () => string })?.toHexString?.() || '#52c41a'
        },
        features: {
          enable_customers: values.enable_customers as boolean,
          enable_sales: values.enable_sales as boolean,
          enable_contracts: values.enable_contracts as boolean,
          enable_tickets: values.enable_tickets as boolean,
          enable_complaints: values.enable_complaints as boolean,
          enable_job_works: values.enable_job_works as boolean
        },
        email: {
          enabled: values.email_enabled as boolean,
          smtp_host: values.smtp_host as string,
          smtp_port: values.smtp_port as number,
          smtp_user: values.smtp_user as string,
          smtp_password: (values.smtp_password as string) || '',
          smtp_from: values.smtp_from as string
        },
        sms: {
          enabled: values.sms_enabled as boolean,
          provider: values.sms_provider as string,
          api_key: (values.sms_api_key as string) || '',
          sender_id: (values.sms_sender_id as string) || ''
        },
        security: {
          mfa_enabled: values.mfa_enabled as boolean,
          password_expiry_days: values.password_expiry_days as number,
          session_timeout_minutes: values.session_timeout_minutes as number,
          ip_whitelist_enabled: values.ip_whitelist_enabled as boolean,
          allowed_ips: allowedIps
        }
      };

      await tenantService.updateTenantSettings(user.tenant_id, updatedSettings);
      message.success('Settings saved successfully');
      void fetchSettings();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to save settings:', error.message);
        message.error(error.message || 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    message.info('Settings reset to saved values');
  };

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenant Configuration"
        description="Manage your tenant settings, branding, and features"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/dashboard' },
            { title: 'Configuration' }
          ]
        }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        <Card>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              {/* General Settings Tab */}
              <TabPane
                tab={
                  <span>
                    <SettingOutlined />
                    General
                  </span>
                }
                key="general"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <Globe size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Regional Settings
                    </h3>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Timezone"
                      name="timezone"
                      rules={[{ required: true, message: 'Please select timezone' }]}
                    >
                      <Select placeholder="Select timezone">
                        <Select.Option value="UTC">UTC</Select.Option>
                        <Select.Option value="America/New_York">Eastern Time (ET)</Select.Option>
                        <Select.Option value="America/Chicago">Central Time (CT)</Select.Option>
                        <Select.Option value="America/Denver">Mountain Time (MT)</Select.Option>
                        <Select.Option value="America/Los_Angeles">Pacific Time (PT)</Select.Option>
                        <Select.Option value="Europe/London">London (GMT)</Select.Option>
                        <Select.Option value="Europe/Paris">Paris (CET)</Select.Option>
                        <Select.Option value="Asia/Dubai">Dubai (GST)</Select.Option>
                        <Select.Option value="Asia/Kolkata">India (IST)</Select.Option>
                        <Select.Option value="Asia/Singapore">Singapore (SGT)</Select.Option>
                        <Select.Option value="Asia/Tokyo">Tokyo (JST)</Select.Option>
                        <Select.Option value="Australia/Sydney">Sydney (AEDT)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Language"
                      name="language"
                      rules={[{ required: true, message: 'Please select language' }]}
                    >
                      <Select placeholder="Select language">
                        <Select.Option value="en">English</Select.Option>
                        <Select.Option value="es">Spanish</Select.Option>
                        <Select.Option value="fr">French</Select.Option>
                        <Select.Option value="de">German</Select.Option>
                        <Select.Option value="ar">Arabic</Select.Option>
                        <Select.Option value="hi">Hindi</Select.Option>
                        <Select.Option value="zh">Chinese</Select.Option>
                        <Select.Option value="ja">Japanese</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Date Format"
                      name="date_format"
                      rules={[{ required: true, message: 'Please select date format' }]}
                    >
                      <Select placeholder="Select date format">
                        <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
                        <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
                        <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
                        <Select.Option value="DD-MMM-YYYY">DD-MMM-YYYY</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Time Format"
                      name="time_format"
                      rules={[{ required: true, message: 'Please select time format' }]}
                    >
                      <Select placeholder="Select time format">
                        <Select.Option value="12h">12 Hour (AM/PM)</Select.Option>
                        <Select.Option value="24h">24 Hour</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Currency"
                      name="currency"
                      rules={[{ required: true, message: 'Please select currency' }]}
                    >
                      <Select placeholder="Select currency">
                        <Select.Option value="USD">USD ($)</Select.Option>
                        <Select.Option value="EUR">EUR (€)</Select.Option>
                        <Select.Option value="GBP">GBP (£)</Select.Option>
                        <Select.Option value="AED">AED (د.إ)</Select.Option>
                        <Select.Option value="INR">INR (₹)</Select.Option>
                        <Select.Option value="JPY">JPY (¥)</Select.Option>
                        <Select.Option value="CNY">CNY (¥)</Select.Option>
                        <Select.Option value="AUD">AUD ($)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              {/* Branding Tab */}
              <TabPane
                tab={
                  <span>
                    <BgColorsOutlined />
                    Branding
                  </span>
                }
                key="branding"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <Palette size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Company Branding
                    </h3>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Company Name"
                      name="company_name"
                      rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                      <Input placeholder="Enter company name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Logo URL"
                      name="logo_url"
                    >
                      <Input placeholder="https://example.com/logo.png" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Primary Color"
                      name="primary_color"
                    >
                      <ColorPicker 
                        showText 
                        format="hex"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Secondary Color"
                      name="secondary_color"
                    >
                      <ColorPicker 
                        showText 
                        format="hex"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Divider />
                    <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
                      <strong>Note:</strong> Logo and color changes will be applied across the entire application.
                      Make sure to use high-quality images and accessible color combinations.
                    </p>
                  </Col>
                </Row>
              </TabPane>

              {/* Features Tab */}
              <TabPane
                tab={
                  <span>
                    <AppstoreOutlined />
                    Features
                  </span>
                }
                key="features"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <Zap size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Module Management
                    </h3>
                    <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
                      Enable or disable modules for your organization
                    </p>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Customer Management"
                        name="enable_customers"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Manage customer information and relationships
                      </p>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Sales Management"
                        name="enable_sales"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Track sales opportunities and product sales
                      </p>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Contract Management"
                        name="enable_contracts"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Manage contracts and service agreements
                      </p>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Support Tickets"
                        name="enable_tickets"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Handle customer support tickets
                      </p>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Complaints Management"
                        name="enable_complaints"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Track and resolve customer complaints
                      </p>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Form.Item
                        label="Job Works"
                        name="enable_job_works"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch />
                      </Form.Item>
                      <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 8 }}>
                        Manage job work assignments and tracking
                      </p>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Email Settings Tab */}
              <TabPane
                tab={
                  <span>
                    <MailOutlined />
                    Email
                  </span>
                }
                key="email"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <Mail size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Email Configuration
                    </h3>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Enable Email Notifications"
                      name="email_enabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Host"
                      name="smtp_host"
                    >
                      <Input placeholder="smtp.gmail.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Port"
                      name="smtp_port"
                    >
                      <Input type="number" placeholder="587" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Username"
                      name="smtp_user"
                    >
                      <Input placeholder="your-email@example.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMTP Password"
                      name="smtp_password"
                    >
                      <Input.Password placeholder="Enter SMTP password" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="From Email Address"
                      name="smtp_from"
                    >
                      <Input placeholder="noreply@example.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              {/* SMS Settings Tab */}
              <TabPane
                tab={
                  <span>
                    <MessageOutlined />
                    SMS
                  </span>
                }
                key="sms"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <MessageSquare size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      SMS Configuration
                    </h3>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Enable SMS Notifications"
                      name="sms_enabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="SMS Provider"
                      name="sms_provider"
                    >
                      <Select placeholder="Select SMS provider">
                        <Select.Option value="twilio">Twilio</Select.Option>
                        <Select.Option value="aws_sns">AWS SNS</Select.Option>
                        <Select.Option value="nexmo">Nexmo</Select.Option>
                        <Select.Option value="msg91">MSG91</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="API Key"
                      name="sms_api_key"
                    >
                      <Input.Password placeholder="Enter API key" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Sender ID"
                      name="sms_sender_id"
                    >
                      <Input placeholder="Enter sender ID" />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              {/* Security Tab */}
              <TabPane
                tab={
                  <span>
                    <LockOutlined />
                    Security
                  </span>
                }
                key="security"
              >
                <Row gutter={[24, 16]}>
                  <Col span={24}>
                    <h3 style={{ marginBottom: 16 }}>
                      <Shield size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Security Settings
                    </h3>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Enable Multi-Factor Authentication (MFA)"
                      name="mfa_enabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Password Expiry (Days)"
                      name="password_expiry_days"
                    >
                      <Input type="number" placeholder="90" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Session Timeout (Minutes)"
                      name="session_timeout_minutes"
                    >
                      <Input type="number" placeholder="30" />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Enable IP Whitelist"
                      name="ip_whitelist_enabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item
                      label="Allowed IP Addresses"
                      name="allowed_ips"
                      help="Enter comma-separated IP addresses (e.g., 192.168.1.1, 10.0.0.1)"
                    >
                      <TextArea 
                        rows={3} 
                        placeholder="192.168.1.1, 10.0.0.1, 172.16.0.1"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default TenantConfigurationPage;