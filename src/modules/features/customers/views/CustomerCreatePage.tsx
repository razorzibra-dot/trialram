/**
 * Customer Create Page - Redesigned with Ant Design
 * Comprehensive form for creating new customers
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@ant-design/icons';
import { PageHeader } from '@/modules/core/components/PageHeader';
import type { CreateCustomerData } from '../services/customerService';

const { TextArea } = Input;
const { Option } = Select;

const CustomerCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateCustomerData) => {
    setLoading(true);
    try {
      // TODO: Implement create customer API call
      // const customerService = new CustomerService();
      // const newCustomer = await customerService.createCustomer(values);
      
      console.log('Creating customer with data:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Customer created successfully');
      navigate('/tenant/customers');
    } catch (error) {
      message.error('Failed to create customer');
      console.error('Create error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tenant/customers');
  };

  const breadcrumbs = [
    { label: 'Home', path: '/tenant/dashboard' },
    { label: 'Customers', path: '/tenant/customers' },
    { label: 'Create Customer' },
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
        Create Customer
      </Button>
    </Space>
  );

  return (
    <>
      <PageHeader
        title="Create Customer"
        description="Add a new customer to your CRM system"
        breadcrumbs={breadcrumbs}
        extra={headerActions}
      />
      <div style={{ padding: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            customer_type: 'business',
            size: 'small',
          }}
        >
          {/* Basic Information */}
          <Card title="Basic Information" variant="borderless" style={{ marginBottom: 24 }}>
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
                Create Customer
              </Button>
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
            </Space>
          </Card>
        </Form>
      </div>
    </>
  );
};

export default CustomerCreatePage;
