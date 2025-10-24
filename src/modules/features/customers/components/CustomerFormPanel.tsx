/**
 * Customer Form Panel
 * Side drawer for creating/editing customer information
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, Checkbox } from 'antd';
import { Customer } from '@/types/crm';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';

interface CustomerFormPanelProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

  const isEditMode = !!customer;

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
      title={isEditMode ? 'Edit Customer' : 'Create New Customer'}
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
      >
        {/* Basic Information */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>

        <Form.Item
          label="Company Name"
          name="company_name"
          rules={[{ required: true, message: 'Please enter company name' }]}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>

        <Form.Item
          label="Contact Name"
          name="contact_name"
          rules={[{ required: true, message: 'Please enter contact name' }]}
        >
          <Input placeholder="Enter contact name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item
          label="Mobile"
          name="mobile"
        >
          <Input placeholder="Enter mobile number" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          initialValue="active"
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
            <Select.Option value="prospect">Prospect</Select.Option>
          </Select>
        </Form.Item>

        {/* Business Information */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Business Information</h3>
        </div>

        <Form.Item
          label="Industry"
          name="industry"
        >
          <Select placeholder="Select industry">
            <Select.Option value="Technology">Technology</Select.Option>
            <Select.Option value="Finance">Finance</Select.Option>
            <Select.Option value="Retail">Retail</Select.Option>
            <Select.Option value="Healthcare">Healthcare</Select.Option>
            <Select.Option value="Manufacturing">Manufacturing</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Company Size"
          name="size"
        >
          <Select placeholder="Select company size">
            <Select.Option value="startup">Startup</Select.Option>
            <Select.Option value="small">Small</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="enterprise">Enterprise</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Customer Type"
          name="customer_type"
        >
          <Select placeholder="Select customer type">
            <Select.Option value="business">Business</Select.Option>
            <Select.Option value="individual">Individual</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Website"
          name="website"
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          label="Tax ID"
          name="tax_id"
        >
          <Input placeholder="Enter tax ID" />
        </Form.Item>

        {/* Address Information */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Address</h3>
        </div>

        <Form.Item
          label="Address"
          name="address"
        >
          <Input placeholder="Enter street address" />
        </Form.Item>

        <Form.Item
          label="City"
          name="city"
        >
          <Input placeholder="Enter city" />
        </Form.Item>

        <Form.Item
          label="Country"
          name="country"
        >
          <Input placeholder="Enter country" />
        </Form.Item>

        {/* Financial Information */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Financial Information</h3>
        </div>

        <Form.Item
          label="Credit Limit"
          name="credit_limit"
        >
          <InputNumber
            placeholder="Enter credit limit"
            min={0}
            formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
          />
        </Form.Item>

        <Form.Item
          label="Payment Terms"
          name="payment_terms"
        >
          <Input placeholder="E.g., Net 30, Net 60" />
        </Form.Item>

        {/* Additional Information */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>
        </div>

        <Form.Item
          label="Source"
          name="source"
        >
          <Select placeholder="Select source">
            <Select.Option value="referral">Referral</Select.Option>
            <Select.Option value="website">Website</Select.Option>
            <Select.Option value="sales_team">Sales Team</Select.Option>
            <Select.Option value="event">Event</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Rating"
          name="rating"
        >
          <Select placeholder="Select rating">
            <Select.Option value="hot">Hot Lead</Select.Option>
            <Select.Option value="warm">Warm Lead</Select.Option>
            <Select.Option value="cold">Cold Lead</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea
            placeholder="Add any additional notes"
            rows={4}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};