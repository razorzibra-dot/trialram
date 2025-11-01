/**
 * Customer Form Panel - Enterprise Enhanced
 * Professional UI/UX redesign with card-based sections, enhanced validation,
 * tooltips, and visual hierarchy improvements.
 * 
 * Last Updated: 2025-01-31
 * Reference: CUSTOMER_FORMS_ENHANCEMENT_GUIDE.md
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  InputNumber,
  Card,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  FileTextOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TagsOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { Customer } from '@/types/crm';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { useIndustries } from '../hooks/useIndustries';
import { useCompanySizes } from '../hooks/useCompanySizes';
import { useActiveUsers } from '../hooks/useUsers';

interface CustomerFormPanelProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Professional styling configuration
const sectionStyles = {
  card: {
    marginBottom: 20,
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '2px solid #e5e7eb',
  },
  headerIcon: {
    fontSize: 20,
    color: '#0ea5e9',
    marginRight: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
};

// Configuration objects for consistent display
const statusConfig = {
  active: { emoji: '✅', color: '#f0f5ff' },
  inactive: { emoji: '❌', color: '#fafafa' },
  prospect: { emoji: '⏳', color: '#fffbe6' },
  suspended: { emoji: '🛑', color: '#fff1f0' },
};

const customerTypeConfig = {
  business: { emoji: '🏢', label: 'Business' },
  individual: { emoji: '👤', label: 'Individual' },
  corporate: { emoji: '🏛️', label: 'Corporate' },
  government: { emoji: '🏛️', label: 'Government' },
};

const ratingConfig = {
  hot: { emoji: '🔥', label: 'Hot Lead' },
  warm: { emoji: '☀️', label: 'Warm Lead' },
  cold: { emoji: '❄️', label: 'Cold Lead' },
};

const sourceConfig = {
  referral: { emoji: '👥', label: 'Referral' },
  website: { emoji: '🌐', label: 'Website' },
  sales_team: { emoji: '📞', label: 'Sales Team' },
  event: { emoji: '🎯', label: 'Event' },
  other: { emoji: '📋', label: 'Other' },
};

export const CustomerFormPanel: React.FC<CustomerFormPanelProps> = ({
  visible,
  customer,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  // Fetch dynamic dropdown data
  const { data: industries = [], isLoading: industriesLoading } = useIndustries();
  const { data: companySizes = [], isLoading: sizesLoading } = useCompanySizes();
  const { data: users = [], isLoading: usersLoading } = useActiveUsers();

  const isEditMode = !!customer;
  const isLoadingDropdowns = industriesLoading || sizesLoading || usersLoading;

  useEffect(() => {
    if (visible && customer) {
      form.setFieldsValue(customer);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, customer, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEditMode && customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          ...values,
        });
        message.success('Customer updated successfully');
      } else {
        await createCustomer.mutateAsync(values);
        message.success('Customer created successfully');
      }

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>{isEditMode ? 'Edit Customer' : 'Create New Customer'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
        style={{ padding: '0 24px 24px 24px' }}
      >
        {/* 📄 Basic Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <FileTextOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Company Name"
                name="company_name"
                rules={[
                  { required: true, message: 'Company name is required' },
                  { min: 2, message: 'Company name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., Acme Corporation"
                  allowClear
                  prefix={<ShoppingOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
                name="status"
                initialValue="active"
                rules={[{ required: true, message: 'Please select status' }]}
                tooltip="Status of the customer relationship"
              >
                <Select size="large" placeholder="Select status">
                  {Object.entries(statusConfig).map(([key, { emoji }]) => (
                    <Select.Option key={key} value={key}>
                      {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact Name"
                name="contact_name"
                rules={[
                  { required: true, message: 'Contact name is required' },
                  { min: 2, message: 'Contact name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., John Smith"
                  allowClear
                  prefix={<UserOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Assigned To"
                name="assignedTo"
                tooltip="Primary user responsible for this customer"
              >
                <Select
                  size="large"
                  placeholder="Select user (optional)"
                  loading={usersLoading}
                  disabled={usersLoading}
                  allowClear
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      👤 {user.firstName} {user.lastName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., john@acme.com"
                  allowClear
                  type="email"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Website" name="website">
                <Input
                  size="large"
                  placeholder="e.g., https://acme.com"
                  allowClear
                  prefix="🌐"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Phone" name="phone">
                <Input
                  size="large"
                  placeholder="e.g., +1 (555) 123-4567"
                  allowClear
                  prefix={<PhoneOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Mobile" name="mobile">
                <Input
                  size="large"
                  placeholder="e.g., +1 (555) 987-6543"
                  allowClear
                  prefix={<PhoneOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 🏢 Business Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <ShoppingOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Business Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Industry" name="industry">
                <Select
                  size="large"
                  placeholder="Select industry"
                  loading={industriesLoading}
                  disabled={industriesLoading}
                  allowClear
                >
                  {industries.map((industry) => (
                    <Select.Option key={industry.id} value={industry.name}>
                      🏭 {industry.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Company Size"
                name="size"
                tooltip="Approximate number of employees"
              >
                <Select
                  size="large"
                  placeholder="Select company size"
                  loading={sizesLoading}
                  disabled={sizesLoading}
                  allowClear
                >
                  {companySizes.map((size) => (
                    <Select.Option key={size.id} value={size.name}>
                      📊 {size.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Customer Type" name="customer_type">
                <Select size="large" placeholder="Select customer type" allowClear>
                  {Object.entries(customerTypeConfig).map(([key, { emoji, label }]) => (
                    <Select.Option key={key} value={key}>
                      {emoji} {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tax ID" name="tax_id">
                <Input
                  size="large"
                  placeholder="e.g., 12-3456789"
                  allowClear
                  prefix="📋"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📍 Address Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <EnvironmentOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Address Information</h3>
          </div>

          <Form.Item label="Street Address" name="address">
            <Input
              size="large"
              placeholder="e.g., 123 Main Street"
              allowClear
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="City" name="city">
                <Input
                  size="large"
                  placeholder="e.g., San Francisco"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Country" name="country">
                <Input
                  size="large"
                  placeholder="e.g., United States"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 💰 Financial Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <DollarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Financial Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Credit Limit"
                name="credit_limit"
                tooltip="Maximum credit extended to customer"
              >
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="e.g., 50000"
                  min={0}
                  formatter={(value) =>
                    `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) =>
                    parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')
                  }
                  prefix={<DollarOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Payment Terms"
                name="payment_terms"
                tooltip="Standard payment terms (e.g., Net 30, Net 60)"
              >
                <Input
                  size="large"
                  placeholder="e.g., Net 30 or Net 60"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 🎯 Lead Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <TagsOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Lead Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Lead Source"
                name="source"
                tooltip="How this customer was acquired"
              >
                <Select size="large" placeholder="Select source" allowClear>
                  {Object.entries(sourceConfig).map(([key, { emoji, label }]) => (
                    <Select.Option key={key} value={key}>
                      {emoji} {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Lead Rating"
                name="rating"
                tooltip="Quality rating of the lead opportunity"
              >
                <Select size="large" placeholder="Select rating" allowClear>
                  {Object.entries(ratingConfig).map(([key, { emoji, label }]) => (
                    <Select.Option key={key} value={key}>
                      {emoji} {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📝 Additional Notes */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <FileOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Additional Notes</h3>
          </div>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea
              size="large"
              placeholder="Add any additional notes about this customer..."
              rows={5}
              maxLength={1000}
              showCount
              style={{ fontFamily: 'inherit' }}
            />
          </Form.Item>
        </Card>
      </Form>
    </Drawer>
  );
};