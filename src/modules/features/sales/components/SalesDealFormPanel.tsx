/**
 * Sales Deal Form Panel
 * Side drawer for creating/editing deal information
 * TODO: Implement hooks (useCreateDeal, useUpdateDeal) and complete form fields
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, DatePicker } from 'antd';
import { Deal } from '@/types/crm';

interface SalesDealFormPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SalesDealFormPanel: React.FC<SalesDealFormPanelProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // TODO: Implement these hooks
  // const createDeal = useCreateDeal();
  // const updateDeal = useUpdateDeal();

  const isEditMode = !!deal;

  useEffect(() => {
    if (visible && deal) {
      form.setFieldsValue({
        ...deal,
        // Convert dates if needed
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, deal, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // TODO: Implement API calls
      // if (isEditMode && deal) {
      //   await updateDeal.mutateAsync({
      //     id: deal.id,
      //     ...values,
      //   });
      //   message.success('Deal updated successfully');
      // } else {
      //   await createDeal.mutateAsync(values);
      //   message.success('Deal created successfully');
      // }

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
      title={isEditMode ? 'Edit Deal' : 'Create New Deal'}
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
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Deal Information</h3>

        <Form.Item
          label="Deal Name"
          name="name"
          rules={[{ required: true, message: 'Please enter deal name' }]}
        >
          <Input placeholder="Enter deal name" />
        </Form.Item>

        <Form.Item
          label="Customer"
          name="customer_name"
          rules={[{ required: true, message: 'Please select customer' }]}
        >
          <Select placeholder="Select customer">
            {/* TODO: Load customers from API/service */}
            <Select.Option value="customer1">Customer 1</Select.Option>
            <Select.Option value="customer2">Customer 2</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Deal Value"
          name="amount"
          rules={[{ required: true, message: 'Please enter deal value' }]}
        >
          <InputNumber
            prefix="$"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
          />
        </Form.Item>

        <Form.Item
          label="Stage"
          name="stage"
          initialValue="lead"
        >
          <Select>
            <Select.Option value="lead">Lead</Select.Option>
            <Select.Option value="qualified">Qualified</Select.Option>
            <Select.Option value="proposal">Proposal</Select.Option>
            <Select.Option value="negotiation">Negotiation</Select.Option>
            <Select.Option value="closed_won">Closed Won</Select.Option>
            <Select.Option value="closed_lost">Closed Lost</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Sales Owner"
          name="owner_name"
          rules={[{ required: true, message: 'Please select sales owner' }]}
        >
          <Select placeholder="Select sales owner">
            {/* TODO: Load users/salespeople from API/service */}
            <Select.Option value="owner1">Owner 1</Select.Option>
            <Select.Option value="owner2">Owner 2</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Expected Close Date"
          name="expected_close_date"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label="Probability (%)"
          name="probability"
          initialValue={50}
        >
          <InputNumber min={0} max={100} />
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea placeholder="Add notes about this deal" rows={4} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};