/**
 * Contract Form Panel
 * Side drawer for creating/editing contract information
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, Checkbox, DatePicker, Divider } from 'antd';
import dayjs from 'dayjs';
import { Contract } from '@/types/contracts';
import { useCreateContract, useUpdateContract } from '../hooks/useContracts';

interface ContractFormPanelProps {
  visible: boolean;
  contract: Contract | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContractFormPanel: React.FC<ContractFormPanelProps> = ({
  visible,
  contract,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const isEditMode = !!contract;

  useEffect(() => {
    if (visible && contract) {
      form.setFieldsValue({
        ...contract,
        start_date: contract.start_date ? dayjs(contract.start_date) : null,
        end_date: contract.end_date ? dayjs(contract.end_date) : null,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, contract, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert dayjs objects to date strings
      const formData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : '',
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : '',
      };

      if (isEditMode && contract) {
        await updateContract.mutateAsync({
          id: contract.id,
          data: formData,
        });
        message.success('Contract updated successfully');
      } else {
        await createContract.mutateAsync(formData);
        message.success('Contract created successfully');
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
      title={isEditMode ? 'Edit Contract' : 'Create New Contract'}
      placement="right"
      width={550}
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
          label="Contract Title"
          name="title"
          rules={[{ required: true, message: 'Please enter contract title' }]}
        >
          <Input placeholder="Enter contract title" />
        </Form.Item>

        <Form.Item
          label="Contract Number"
          name="contract_number"
          rules={[{ required: true, message: 'Please enter contract number' }]}
        >
          <Input placeholder="Enter contract number" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea rows={3} placeholder="Enter contract description" />
        </Form.Item>

        <Divider />

        {/* Contract Details */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Contract Details</h3>

        <Form.Item
          label="Type"
          name="type"
          rules={[{ required: true, message: 'Please select contract type' }]}
        >
          <Select placeholder="Select contract type">
            <Select.Option value="service_agreement">Service Agreement</Select.Option>
            <Select.Option value="nda">NDA</Select.Option>
            <Select.Option value="purchase_order">Purchase Order</Select.Option>
            <Select.Option value="employment">Employment</Select.Option>
            <Select.Option value="custom">Custom</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select placeholder="Select contract status">
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="pending_approval">Pending Approval</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="renewed">Renewed</Select.Option>
            <Select.Option value="expired">Expired</Select.Option>
            <Select.Option value="terminated">Terminated</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select placeholder="Select priority">
            <Select.Option value="low">Low</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="urgent">Urgent</Select.Option>
          </Select>
        </Form.Item>

        <Divider />

        {/* Party Information */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Party Information</h3>

        <Form.Item
          label="Customer Name"
          name="customer_name"
          rules={[{ required: true, message: 'Please enter customer name' }]}
        >
          <Input placeholder="Enter customer name" />
        </Form.Item>

        <Form.Item
          label="Customer Contact"
          name="customer_contact"
        >
          <Input placeholder="Enter customer contact (email or phone)" />
        </Form.Item>

        <Form.Item
          label="Assigned To"
          name="assigned_to_name"
        >
          <Input placeholder="Enter assigned person name" />
        </Form.Item>

        <Divider />

        {/* Financial Information */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Financial Information</h3>

        <Form.Item
          label="Contract Value"
          name="value"
          rules={[{ required: true, message: 'Please enter contract value' }]}
        >
          <InputNumber
            placeholder="Enter contract value"
            formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') as string)}
            min={0}
            precision={2}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Currency"
          name="currency"
          initialValue="USD"
        >
          <Select>
            <Select.Option value="USD">USD</Select.Option>
            <Select.Option value="EUR">EUR</Select.Option>
            <Select.Option value="GBP">GBP</Select.Option>
            <Select.Option value="INR">INR</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Payment Terms"
          name="payment_terms"
        >
          <Input placeholder="Enter payment terms" />
        </Form.Item>

        <Divider />

        {/* Dates */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Dates</h3>

        <Form.Item
          label="Start Date"
          name="start_date"
          rules={[{ required: true, message: 'Please select start date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="End Date"
          name="end_date"
          rules={[{ required: true, message: 'Please select end date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        {/* Renewal Information */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Renewal Settings</h3>

        <Form.Item
          label="Auto Renewal"
          name="auto_renew"
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>Enable automatic renewal</Checkbox>
        </Form.Item>

        <Form.Item
          label="Renewal Period (months)"
          name="renewal_period_months"
        >
          <InputNumber min={0} placeholder="Enter renewal period in months" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Renewal Terms"
          name="renewal_terms"
        >
          <Input.TextArea rows={2} placeholder="Enter renewal terms" />
        </Form.Item>

        <Divider />

        {/* Additional Information */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>

        <Form.Item
          label="Compliance Status"
          name="compliance_status"
          initialValue="compliant"
        >
          <Select>
            <Select.Option value="compliant">Compliant</Select.Option>
            <Select.Option value="non_compliant">Non-Compliant</Select.Option>
            <Select.Option value="pending_review">Pending Review</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea rows={3} placeholder="Enter any additional notes" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};