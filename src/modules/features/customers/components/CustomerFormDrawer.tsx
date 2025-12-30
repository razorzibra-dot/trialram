/**
 * Customer Form Drawer - Enterprise Enhanced Edition
 * Professional create/edit form with card-based sections, validation, and rich UI
 * ✨ Enterprise Grade UI/UX Enhancements (Matching Lead Module)
 */

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Card,
  DatePicker,
  InputNumber,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  TagsOutlined,
  CalendarOutlined,
  DollarOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { Customer } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_PERMISSIONS } from '../constants/permissions';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface CustomerFormDrawerProps {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  statusOptions: Array<{ label: string; value: string }>;
  industryOptions: Array<{ label: string; value: string }>;
  sizeOptions: Array<{ label: string; value: string }>;
  typeOptions: Array<{ label: string; value: string }>;
  assignedToOptions: Array<{ value: string; label: string }>;
  isLoading?: boolean;
}

// ✨ Professional styling configuration (consistent with lead module)
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

export const CustomerFormDrawer: React.FC<CustomerFormDrawerProps> = ({
  open,
  customer,
  onClose,
  onSuccess,
  onSubmit,
  statusOptions,
  industryOptions,
  sizeOptions,
  typeOptions,
  assignedToOptions,
  isLoading = false,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!customer;

  // ✅ Base permissions for create/update actions
  const { hasPermission } = useAuth();
  const canCreateCustomer = hasPermission(CUSTOMER_PERMISSIONS.CREATE);
  const canUpdateCustomer = hasPermission(CUSTOMER_PERMISSIONS.UPDATE);
  const finalCanSave = isEdit ? canUpdateCustomer : canCreateCustomer;

  useEffect(() => {
    if (open && customer) {
      // Populate form with customer data
      form.setFieldsValue({
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        website: customer.website,
        address: customer.address,
        city: customer.city,
        country: customer.country,
        industry: customer.industry,
        size: customer.size,
        status: customer.status,
        customerType: customer.customerType,
        creditLimit: customer.creditLimit,
        paymentTerms: customer.paymentTerms,
        taxId: customer.taxId,
        annualRevenue: customer.annualRevenue,
        notes: customer.notes,
        assignedTo: customer.assignedTo,
        source: customer.source,
        rating: customer.rating,
        lastContactDate: customer.lastContactDate ? dayjs(customer.lastContactDate) : null,
        nextFollowUpDate: customer.nextFollowUpDate ? dayjs(customer.nextFollowUpDate) : null,
      });
    } else if (open && !customer) {
      // Reset form for new customer
      form.resetFields();
      form.setFieldsValue({
        status: 'prospect',
      });
    }
  }, [open, customer, form]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const toIso = (d?: Dayjs | string | Date | null) =>
        d ? dayjs(d).toISOString() : undefined;

      const customerData = {
        ...values,
        lastContactDate: toIso(values.lastContactDate),
        nextFollowUpDate: toIso(values.nextFollowUpDate),
      };

      await onSubmit(customerData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Customer save error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>{isEdit ? 'Edit Customer' : 'Create New Customer'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={handleClose}
      open={open}
      forceRender
      destroyOnClose={false}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Space style={{ marginLeft: 'auto' }}>
            <Button
              size="large"
              icon={<CloseOutlined />}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            {finalCanSave && (
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting || isLoading}
                onClick={() => form.submit()}
              >
                {isEdit ? 'Update Customer' : 'Create Customer'}
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleSubmit}
        autoComplete="off"
        style={{ padding: '0 24px 24px 24px' }}
      >
        {/* 👤 Personal Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Personal Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contactName"
                label="Contact Name"
                rules={[
                  { required: true, message: 'Contact name is required' },
                  { min: 2, message: 'Contact name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., John Smith"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., john.smith@company.com"
                  allowClear
                  type="email"
                  prefix={<MailOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input
                  size="large"
                  placeholder="e.g., +1 (555) 123-4567"
                  allowClear
                  prefix={<PhoneOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="mobile" label="Mobile">
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

        {/* 🏢 Company Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <ShoppingOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Company Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[
                  { required: true, message: 'Company name is required' },
                  { min: 2, message: 'Company name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., Acme Corporation"
                  allowClear
                  prefix={<GlobalOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="website" label="Website">
                <Input
                  size="large"
                  placeholder="e.g., https://company.com"
                  allowClear
                  prefix={<GlobalOutlined style={{ color: '#6b7280' }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="industry" label="Industry">
                <Select
                  size="large"
                  placeholder="Select industry"
                  allowClear
                >
                  {industryOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="size" label="Company Size">
                <Select
                  size="large"
                  placeholder="Select company size"
                  allowClear
                >
                  {sizeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="city" label="City">
                <Input
                  size="large"
                  placeholder="e.g., New York"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="country" label="Country">
                <Input
                  size="large"
                  placeholder="e.g., United States"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea
              size="large"
              placeholder="Enter company address"
              rows={2}
            />
          </Form.Item>
        </Card>

        {/* 💼 Customer Details & Status */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <TagsOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Customer Details & Status</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status is required' }]}
              >
                <Select
                  size="large"
                  placeholder="Select status"
                >
                  {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="customerType" label="Customer Type">
                <Select
                  size="large"
                  placeholder="Select type"
                  allowClear
                >
                  {typeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="source" label="Source">
                <Input
                  size="large"
                  placeholder="e.g., Referral, LinkedIn, Cold Call"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="rating" label="Rating">
                <Input
                  size="large"
                  placeholder="e.g., Gold, Silver, Bronze"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="assignedTo"
                label="Assigned To"
                tooltip="Team member responsible for this customer"
              >
                <Select
                  size="large"
                  placeholder="Select team member"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {assignedToOptions.map((user) => (
                    <Option key={user.value} value={user.value}>
                      👤 {user.label}
                    </Option>
                  ))}
                </Select>
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
              <Form.Item name="creditLimit" label="Credit Limit">
                <InputNumber
                  size="large"
                  placeholder="0"
                  style={{ width: '100%' }}
                  formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') || '0')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="annualRevenue" label="Annual Revenue">
                <InputNumber
                  size="large"
                  placeholder="0"
                  style={{ width: '100%' }}
                  formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') || '0')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="paymentTerms" label="Payment Terms">
                <Input
                  size="large"
                  placeholder="e.g., Net 30, Net 60, COD"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="taxId" label="Tax ID">
                <Input
                  size="large"
                  placeholder="e.g., 12-3456789"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📅 Follow-up Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <CalendarOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Follow-up Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastContactDate"
                label="Last Contact"
                tooltip="Date of last contact with customer"
              >
                <DatePicker
                  size="large"
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select last contact date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nextFollowUpDate"
                label="Next Follow-up"
                tooltip="Schedule next follow-up date"
              >
                <DatePicker
                  size="large"
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select next follow-up date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 📝 Additional Notes */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <FileTextOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Additional Notes</h3>
          </div>

          <Form.Item name="notes" label="Notes">
            <TextArea
              size="large"
              rows={5}
              placeholder="Add any additional notes about this customer..."
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

export default CustomerFormDrawer;
