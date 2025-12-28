/**
 * Configuration Test Page - Complete Refactor
 * Test and validate system configurations with drawer-based results, consistent UI
 */
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/utils/tenantIsolation';
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Space,
  Alert,
  message,
  Divider,
  Typography,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SendOutlined,
  MailOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  ApiOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common';
import { useService } from '@/modules/core/hooks/useService';
import { ConfigTestResultPanel } from '../components/ConfigTestResultPanel';
import type {
  EmailTestConfig,
  SMSTestConfig,
  PaymentTestConfig,
  APITestConfig,
  ConfigTestResult,
  ConfigTestHistory,
} from '../types/configTest';

const { TextArea } = Input;
const { Title } = Typography;

const ConfigurationTestPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const configTestService = useService<any>('configTestService');
  const [emailForm] = Form.useForm();
  const [smsForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [apiForm] = Form.useForm();

  // State
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConfigTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<ConfigTestHistory[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Handle email test
  const handleEmailTest = async (values: EmailTestConfig) => {
    try {
      setLoading(true);
      setActiveTest('email');
      const result = await configTestService.testEmail(values);
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.success('Email test completed');
    } catch (error: any) {
      const result = error as ConfigTestResult;
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle SMS test
  const handleSMSTest = async (values: SMSTestConfig) => {
    try {
      setLoading(true);
      setActiveTest('sms');
      const result = await configTestService.testSMS(values);
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.success('SMS test completed');
    } catch (error: any) {
      const result = error as ConfigTestResult;
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment gateway test
  const handlePaymentTest = async (values: PaymentTestConfig) => {
    try {
      setLoading(true);
      setActiveTest('payment');
      const result = await configTestService.testPaymentGateway(values);
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.success('Payment gateway test completed');
    } catch (error: any) {
      const result = error as ConfigTestResult;
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle API test
  const handleAPITest = async (values: APITestConfig) => {
    try {
      setLoading(true);
      setActiveTest('api');
      const result = await configTestService.testAPI(values);
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.success('API test completed');
    } catch (error: any) {
      const result = error as ConfigTestResult;
      setTestResult(result);
      setTestHistory(configTestService.getTestHistory());
      setIsPanelVisible(true);
      message.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Test history columns
  const historyColumns: ColumnsType<ConfigTestHistory> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      flex: 1,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
  ];

  // Uses systematic tenant isolation utility instead of hardcoded permission check
  const auth = useAuth();
  const currentUser = auth?.user;
  if (!isSuperAdmin(currentUser)) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access configuration tests. Only super administrators can test configurations."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Configuration Tests"
        description="Test and validate system configurations"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Configuration', path: '/configuration' },
          { label: 'Configuration Tests' },
        ]}
      />

      <div style={{ padding: 24 }}>
        <Alert
          message="Configuration Testing"
          description="Use this page to test and validate your system configurations for email, SMS, payment gateways, and APIs. Test results are displayed in the side panel."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* Email Configuration Test */}
        <Card
          title={
            <Space>
              <MailOutlined />
              <span>Email Configuration Test</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Form
            form={emailForm}
            layout="vertical"
            onFinish={handleEmailTest}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Test Email Address"
                  name="recipientEmail"
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter valid email' },
                  ]}
                >
                  <Input
                    placeholder="test@example.com"
                    prefix={<MailOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading && activeTest === 'email'}
                    icon={<SendOutlined />}
                    block
                  >
                    Send Test Email
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Test Message (Optional)"
              name="testMessage"
            >
              <TextArea
                rows={3}
                placeholder="Enter a custom test message (optional)"
              />
            </Form.Item>
          </Form>
        </Card>

        {/* SMS Configuration Test */}
        <Card
          title={
            <Space>
              <PhoneOutlined />
              <span>SMS Configuration Test</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Form
            form={smsForm}
            layout="vertical"
            onFinish={handleSMSTest}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Test Phone Number"
                  name="phoneNumber"
                  rules={[
                    { required: true, message: 'Please enter phone number' },
                  ]}
                >
                  <Input
                    placeholder="+1234567890"
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading && activeTest === 'sms'}
                    icon={<SendOutlined />}
                    block
                  >
                    Send Test SMS
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Test Message (Optional)"
              name="testMessage"
            >
              <TextArea
                rows={2}
                placeholder="Enter a custom test message (optional)"
                maxLength={160}
              />
            </Form.Item>
          </Form>
        </Card>

        {/* Payment Gateway Test */}
        <Card
          title={
            <Space>
              <CreditCardOutlined />
              <span>Payment Gateway Test</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Form
            form={paymentForm}
            layout="vertical"
            onFinish={handlePaymentTest}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Payment Gateway"
                  name="gateway"
                  rules={[
                    { required: true, message: 'Please select payment gateway' },
                  ]}
                >
                  <Select placeholder="Select gateway">
                    <Select.Option value="stripe">Stripe</Select.Option>
                    <Select.Option value="paypal">PayPal</Select.Option>
                    <Select.Option value="razorpay">Razorpay</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading && activeTest === 'payment'}
                    icon={<SendOutlined />}
                    block
                  >
                    Test Payment Gateway
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* API Endpoint Test */}
        <Card
          title={
            <Space>
              <ApiOutlined />
              <span>API Endpoint Test</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Form
            form={apiForm}
            layout="vertical"
            onFinish={handleAPITest}
          >
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="API Endpoint URL"
                  name="endpoint"
                  rules={[
                    { required: true, message: 'Please enter endpoint URL' },
                    { type: 'url', message: 'Please enter valid URL' },
                  ]}
                >
                  <Input
                    placeholder="https://api.example.com/health"
                    prefix={<ApiOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="HTTP Method"
                  name="method"
                  initialValue="GET"
                >
                  <Select>
                    <Select.Option value="GET">GET</Select.Option>
                    <Select.Option value="POST">POST</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading && activeTest === 'api'}
                icon={<SendOutlined />}
              >
                Test API Endpoint
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Test History */}
        {testHistory.length > 0 && (
          <Card
            title="Test History"
            extra={
              <Button
                size="small"
                onClick={() => {
                  configTestService.clearTestHistory();
                  setTestHistory([]);
                }}
              >
                Clear History
              </Button>
            }
          >
            <Table<ConfigTestHistory>
              columns={historyColumns}
              dataSource={testHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
              size="small"
            />
          </Card>
        )}
      </div>

      {/* Result Panel */}
      <ConfigTestResultPanel
        open={isPanelVisible}
        result={testResult}
        history={testHistory}
        loading={loading}
        onClose={() => setIsPanelVisible(false)}
      />
    </>
  );
};

export default ConfigurationTestPage;