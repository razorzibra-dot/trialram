/**
 * Customer Edit Page - Redesigned with Ant Design
 * Comprehensive form for editing existing customers with audit trail
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  message,
  Spin,
  Empty,
  Timeline,
  Tag,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  BankOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { EnterpriseLayout } from '@/modules/core/components/EnterpriseLayout';
import { PageHeader } from '@/modules/core/components/PageHeader';
import { useCustomer } from '../hooks/useCustomers';
import type { CreateCustomerData } from '../services/customerService';

const { TextArea } = Input;
const { Option } = Select;

interface AuditEntry {
  id: string;
  action: string;
  field: string;
  old_value: string;
  new_value: string;
  user: string;
  timestamp: string;
}

const CustomerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { data: customer, isLoading, error, refetch } = useCustomer(id!);

  // Mock audit trail data (replace with real API call)
  const auditTrail: AuditEntry[] = [
    {
      id: '1',
      action: 'updated',
      field: 'status',
      old_value: 'prospect',
      new_value: 'active',
      user: 'John Doe',
      timestamp: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      action: 'updated',
      field: 'credit_limit',
      old_value: '10000',
      new_value: '25000',
      user: 'Jane Smith',
      timestamp: '2024-02-20T14:15:00Z',
    },
    {
      id: '3',
      action: 'created',
      field: 'customer',
      old_value: '',
      new_value: 'Customer created',
      user: 'Admin User',
      timestamp: '2024-01-10T09:00:00Z',
    },
  ];

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        company_name: customer.company_name,
        contact_name: customer.contact_name,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        website: customer.website,
        address: customer.address,
        city: customer.city,
        country: customer.country,
        status: customer.status,
        customer_type: customer.customer_type,
        industry: customer.industry,
        size: customer.size,
        source: customer.source,
        rating: customer.rating,
        credit_limit: customer.credit_limit,
        payment_terms: customer.payment_terms,
        tax_id: customer.tax_id,
        notes: customer.notes,
      });
    }
  }, [customer, form]);

  const handleSubmit = async (values: CreateCustomerData) => {
    if (!id) return;

    setLoading(true);
    try {
      // TODO: Implement update customer API call
      // const customerService = new CustomerService();
      // const updatedCustomer = await customerService.updateCustomer(id, values);
      
      console.log('Updating customer with data:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Customer updated successfully');
      await refetch();
      navigate(`/tenant/customers/${id}`);
    } catch (error) {
      message.error('Failed to update customer');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/tenant/customers/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: 'success',
      updated: 'blue',
      deleted: 'error',
    };
    return colors[action] || 'default';
  };

  if (isLoading) {
    return (
      <EnterpriseLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Loading customer data..." />
        </div>
      </EnterpriseLayout>
    );
  }

  if (error || !customer) {
    return (
      <EnterpriseLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Empty
            description={
              <span>
                <h2 style={{ color: '#ff4d4f', marginBottom: 16 }}>Customer Not Found</h2>
                <p style={{ color: '#8c8c8c' }}>
                  The customer you're trying to edit doesn't exist or has been deleted.
                </p>
              </span>
            }
          >
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/tenant/customers')}
            >
              Back to Customers
            </Button>
          </Empty>
        </div>
      </EnterpriseLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: '/tenant/dashboard' },
    { label: 'Customers', path: '/tenant/customers' },
    { label: customer.company_name, path: `/tenant/customers/${customer.id}` },
    { label: 'Edit' },
  ];

  const headerActions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
        Cancel
      </Button>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={loading}
        onClick={() => form.submit()}
      >
        Save Changes
      </Button>
    </Space>
  );

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Edit Customer"
        description={`Editing: ${customer.company_name} (ID: ${customer.id})`}
        breadcrumbs={breadcrumbs}
        extra={headerActions}
      />
      <div style={{ padding: 24 }}>
        <Row gutter={24}>
          {/* Main Form - Left Column */}
          <Col xs={24} lg={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              {/* Basic Information */}
              <Card title="Basic Information" bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Company Name"
                      name="company_name"
                      rules={[
                        { required: true, message: 'Please enter company name' },
                        { min: 2, message: 'Company name must be at least 2 characters' },
                      ]}
                    >
                      <Input
                        prefix={<BankOutlined />}
                        placeholder="Enter company name"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Contact Name"
                      name="contact_name"
                      rules={[
                        { required: true, message: 'Please enter contact name' },
                        { min: 2, message: 'Contact name must be at least 2 characters' },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Enter contact person name"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter email address' },
                        { type: 'email', message: 'Please enter a valid email address' },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="contact@company.com"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Phone"
                      name="phone"
                      rules={[
                        { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, message: 'Please enter a valid phone number' },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="+1 (555) 123-4567"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Mobile"
                      name="mobile"
                      rules={[
                        { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, message: 'Please enter a valid mobile number' },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="+1 (555) 987-6543"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Website"
                      name="website"
                      rules={[
                        { type: 'url', message: 'Please enter a valid URL' },
                      ]}
                    >
                      <Input
                        prefix={<GlobalOutlined />}
                        placeholder="https://www.company.com"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Address Information */}
              <Card title="Address Information" bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item label="Address" name="address">
                      <Input
                        prefix={<EnvironmentOutlined />}
                        placeholder="Street address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="City" name="city">
                      <Input placeholder="City" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Country" name="country">
                      <Select placeholder="Select country" size="large" showSearch>
                        <Option value="United States">United States</Option>
                        <Option value="Canada">Canada</Option>
                        <Option value="United Kingdom">United Kingdom</Option>
                        <Option value="Germany">Germany</Option>
                        <Option value="France">France</Option>
                        <Option value="Australia">Australia</Option>
                        <Option value="Japan">Japan</Option>
                        <Option value="China">China</Option>
                        <Option value="India">India</Option>
                        <Option value="Brazil">Brazil</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Business Information */}
              <Card title="Business Information" bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Status"
                      name="status"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select placeholder="Select status" size="large">
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                        <Option value="prospect">Prospect</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Customer Type"
                      name="customer_type"
                      rules={[{ required: true, message: 'Please select customer type' }]}
                    >
                      <Select placeholder="Select customer type" size="large">
                        <Option value="business">Business</Option>
                        <Option value="individual">Individual</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Industry" name="industry">
                      <Select placeholder="Select industry" size="large" showSearch>
                        <Option value="Technology">Technology</Option>
                        <Option value="Healthcare">Healthcare</Option>
                        <Option value="Finance">Finance</Option>
                        <Option value="Retail">Retail</Option>
                        <Option value="Manufacturing">Manufacturing</Option>
                        <Option value="Education">Education</Option>
                        <Option value="Real Estate">Real Estate</Option>
                        <Option value="Hospitality">Hospitality</Option>
                        <Option value="Transportation">Transportation</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Company Size" name="size">
                      <Select placeholder="Select company size" size="large">
                        <Option value="startup">Startup (1-10 employees)</Option>
                        <Option value="small">Small (11-50 employees)</Option>
                        <Option value="medium">Medium (51-250 employees)</Option>
                        <Option value="enterprise">Enterprise (250+ employees)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Source" name="source">
                      <Select placeholder="How did they find us?" size="large">
                        <Option value="website">Website</Option>
                        <Option value="referral">Referral</Option>
                        <Option value="social_media">Social Media</Option>
                        <Option value="advertising">Advertising</Option>
                        <Option value="trade_show">Trade Show</Option>
                        <Option value="cold_call">Cold Call</Option>
                        <Option value="other">Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Rating" name="rating">
                      <Select placeholder="Customer rating" size="large">
                        <Option value="hot">Hot - Ready to buy</Option>
                        <Option value="warm">Warm - Interested</Option>
                        <Option value="cold">Cold - Not interested</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Financial Information */}
              <Card title="Financial Information" bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Credit Limit"
                      name="credit_limit"
                      rules={[
                        { type: 'number', min: 0, message: 'Credit limit must be positive' },
                      ]}
                    >
                      <InputNumber
                        prefix={<DollarOutlined />}
                        placeholder="0.00"
                        style={{ width: '100%' }}
                        size="large"
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Payment Terms" name="payment_terms">
                      <Select placeholder="Select payment terms" size="large">
                        <Option value="net_15">Net 15</Option>
                        <Option value="net_30">Net 30</Option>
                        <Option value="net_45">Net 45</Option>
                        <Option value="net_60">Net 60</Option>
                        <Option value="due_on_receipt">Due on Receipt</Option>
                        <Option value="prepaid">Prepaid</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Tax ID" name="tax_id">
                      <Input placeholder="Tax identification number" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Additional Information */}
              <Card title="Additional Information" bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item label="Notes" name="notes">
                      <TextArea
                        rows={4}
                        placeholder="Add any additional notes about this customer..."
                        maxLength={1000}
                        showCount
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Form Actions */}
              <Card bordered={false}>
                <Space size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="large"
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                  <Button size="large" onClick={handleCancel}>
                    Cancel
                  </Button>
                </Space>
              </Card>
            </Form>
          </Col>

          {/* Audit Trail - Right Column */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Audit Trail</span>
                </Space>
              }
              bordered={false}
              style={{ position: 'sticky', top: 24 }}
            >
              <Timeline
                items={auditTrail.map(entry => ({
                  color: getActionColor(entry.action),
                  children: (
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={getActionColor(entry.action)}>
                          {entry.action.toUpperCase()}
                        </Tag>
                        {entry.field && (
                          <Tag color="blue">{entry.field}</Tag>
                        )}
                      </div>
                      {entry.old_value && entry.new_value && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                          <div>From: <strong>{entry.old_value}</strong></div>
                          <div>To: <strong>{entry.new_value}</strong></div>
                        </div>
                      )}
                      {!entry.old_value && entry.new_value && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                          {entry.new_value}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {entry.user}
                      </div>
                      <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4 }}>
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </EnterpriseLayout>
  );
};

export default CustomerEditPage;
