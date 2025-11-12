import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Form, Input, Button, Select, DatePicker, Spin, Space, message, InputNumber, Checkbox, Card, Row, Col, Divider, Alert } from 'antd';
import { SaveOutlined, CloseOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ServiceContractType, ServiceContractCreateInput, ServiceContractUpdateInput } from '@/types/serviceContract';
import { useCreateServiceContract, useUpdateServiceContract } from '../hooks/useServiceContracts';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

interface ServiceContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceContract?: ServiceContractType | null;
  onSuccess: () => void;
}

const ServiceContractFormModal: React.FC<ServiceContractFormModalProps> = ({
  open,
  onOpenChange,
  serviceContract,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const { data: referenceData } = useReferenceData();
  const { mutate: createContract, isPending: isCreating } = useCreateServiceContract();
  const { mutate: updateContract, isPending: isUpdating } = useUpdateServiceContract();

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values: any) => {
    try {
      const basePayload = {
        title: values.title,
        customerId: values.customerId,
        customerName: values.customerName,
        productId: values.productId,
        productName: values.productName,
        serviceType: values.serviceType,
        priority: values.priority,
        value: values.value,
        currency: values.currency,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        autoRenew: values.autoRenew,
        renewalPeriodMonths: values.renewalPeriodMonths,
        description: values.description,
        slaTerms: values.slaTerms,
        renewalTerms: values.renewalTerms,
        serviceScope: values.serviceScope,
      };

      if (serviceContract) {
        const updatePayload: ServiceContractUpdateInput = {
          ...basePayload,
          status: values.status,
        };
        updateContract(
          { id: serviceContract.id, data: updatePayload },
          {
            onSuccess: () => {
              message.success('Service contract updated successfully');
              onSuccess();
              onOpenChange(false);
              form.resetFields();
            },
            onError: (error: any) => {
              message.error(error.message || 'Failed to update service contract');
            },
          }
        );
      } else {
        const createPayload: ServiceContractCreateInput = {
          ...basePayload,
          status: values.status || 'draft',
        };
        createContract(createPayload, {
          onSuccess: () => {
            message.success('Service contract created successfully');
            onSuccess();
            onOpenChange(false);
            form.resetFields();
          },
          onError: (error: any) => {
            message.error(error.message || 'Failed to create service contract');
          },
        });
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to save service contract');
    }
  };

  useEffect(() => {
    if (open) {
      if (serviceContract) {
        form.setFieldsValue({
          title: serviceContract.title,
          customerId: serviceContract.customerId,
          customerName: serviceContract.customerName,
          productId: serviceContract.productId,
          productName: serviceContract.productName,
          serviceType: serviceContract.serviceType,
          priority: serviceContract.priority,
          status: serviceContract.status,
          value: serviceContract.value,
          currency: serviceContract.currency,
          startDate: dayjs(serviceContract.startDate),
          endDate: dayjs(serviceContract.endDate),
          autoRenew: serviceContract.autoRenew,
          renewalPeriodMonths: serviceContract.renewalPeriodMonths,
          description: serviceContract.description,
          slaTerms: serviceContract.slaTerms,
          renewalTerms: serviceContract.renewalTerms,
          serviceScope: serviceContract.serviceScope,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, serviceContract, form]);

  return (
    <Drawer
      title={serviceContract ? 'Edit Service Contract' : 'Create Service Contract'}
      placement="right"
      width={800}
      onClose={() => onOpenChange(false)}
      open={open}
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="title"
                label="Contract Title"
                rules={[{ required: true, message: 'Please enter contract title' }]}
              >
                <Input placeholder="Enter contract title" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select status" options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Pending Approval', value: 'pending_approval' },
                  { label: 'Active', value: 'active' },
                  { label: 'On Hold', value: 'on_hold' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                  { label: 'Expired', value: 'expired' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select service type" options={[
                  { label: 'Support', value: 'support' },
                  { label: 'Maintenance', value: 'maintenance' },
                  { label: 'Consulting', value: 'consulting' },
                  { label: 'Training', value: 'training' },
                  { label: 'Hosting', value: 'hosting' },
                  { label: 'Custom', value: 'custom' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select priority" options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                  { label: 'Urgent', value: 'urgent' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="value"
                label="Contract Value"
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="currency"
                label="Currency"
              >
                <Select placeholder="Select currency" options={[
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                  { label: 'GBP', value: 'GBP' },
                  { label: 'INR', value: 'INR' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="autoRenew"
                label="Auto Renew"
                valuePropName="checked"
              >
                <Checkbox>Enable automatic renewal</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="renewalPeriodMonths"
                label="Renewal Period (Months)"
              >
                <InputNumber style={{ width: '100%' }} min={1} step={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter contract description" />
          </Form.Item>

          <Divider />

          <Form.Item
            name="slaTerms"
            label="SLA Terms"
          >
            <Input.TextArea rows={2} placeholder="Enter SLA terms" />
          </Form.Item>

          <Form.Item
            name="renewalTerms"
            label="Renewal Terms"
          >
            <Input.TextArea rows={2} placeholder="Enter renewal terms" />
          </Form.Item>

          <Form.Item
            name="serviceScope"
            label="Service Scope"
          >
            <Input.TextArea rows={2} placeholder="Enter service scope" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading} icon={<SaveOutlined />}>
                {serviceContract ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => onOpenChange(false)} icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default ServiceContractFormModal;
