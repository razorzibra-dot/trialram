import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Form, Input, Button, Select, DatePicker, Spin, Space, message, InputNumber, Checkbox, Card, Row, Col, Divider, Alert } from 'antd';
import { SaveOutlined, CloseOutlined, CalendarOutlined, DollarOutlined, FileTextOutlined, CheckCircleOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ServiceContractType, ServiceContractCreateInput, ServiceContractUpdateInput } from '@/types/serviceContract';
import { useCreateServiceContract, useUpdateServiceContract } from '../hooks/useServiceContracts';
import { useReferenceData } from '@/contexts/ReferenceDataContext';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

interface ServiceContractFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceContract?: ServiceContractType | null;
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
  
  const currentTenant = useCurrentTenant();
  const { data: statuses = [], isLoading: loadingStatuses } = useReferenceDataByCategory(currentTenant?.id, 'service_contract_status');
  const { data: serviceTypes = [], isLoading: loadingTypes } = useReferenceDataByCategory(currentTenant?.id, 'service_contract_type');
  const { data: priorities = [], isLoading: loadingPriorities } = useReferenceDataByCategory(currentTenant?.id, 'service_contract_priority');

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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ToolOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>{serviceContract ? 'Edit Service Contract' : 'Create Service Contract'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={() => onOpenChange(false)}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" icon={<CloseOutlined />} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={isLoading}
            onClick={() => form.submit()}
          >
            {serviceContract ? 'Update' : 'Create'}
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark="optional"
            autoComplete="off"
          >
            {/* Basic Information Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
              </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="title"
                label="Contract Title"
                rules={[{ required: true, message: 'Please enter contract title' }]}
              >
                <Input size="large" allowClear placeholder="Enter contract title" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select 
                  size="large"
                  placeholder="Select status" 
                  loading={loadingStatuses}
                  options={statuses.map(s => ({ label: s.label, value: s.key }))} 
                />
              </Form.Item>
            </Col>
          </Row>
            </Card>

            {/* Contract Details Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <CalendarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Contract Details</h3>
              </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
            </Card>

            {/* Financial Information Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <DollarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Financial Information</h3>
              </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true }]}
              >
                <Select 
                  size="large"
                  placeholder="Select service type" 
                  loading={loadingTypes}
                  options={serviceTypes.map(t => ({ label: t.label, value: t.key }))} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
              >
                <Select 
                  size="large"
                  placeholder="Select priority" 
                  loading={loadingPriorities}
                  options={priorities.map(p => ({ label: p.label, value: p.key }))} 
                />
              </Form.Item>
            </Col>
          </Row>
            </Card>

            {/* Contract Details Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <CalendarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Contract Details</h3>
              </div>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="startDate"
                    label="Start Date"
                    rules={[{ required: true, message: 'Please select start date' }]}
                  >
                    <DatePicker size="large" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="endDate"
                    label="End Date"
                    rules={[{ required: true, message: 'Please select end date' }]}
                  >
                    <DatePicker size="large" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Financial Information Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <DollarOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Financial Information</h3>
              </div>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="value"
                    label="Contract Value"
                  >
                    <InputNumber size="large" style={{ width: '100%' }} min={0} step={0.01} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                  >
                    <Select size="large" placeholder="Select currency" options={[
                      { label: 'USD', value: 'USD' },
                      { label: 'EUR', value: 'EUR' },
                      { label: 'GBP', value: 'GBP' },
                      { label: 'INR', value: 'INR' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Renewal Settings Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <CheckCircleOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Renewal Settings</h3>
              </div>

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
                    <InputNumber size="large" style={{ width: '100%' }} min={1} step={1} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Description & Terms Card */}
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Description & Terms</h3>
              </div>

              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea rows={3} placeholder="Enter contract description" style={{ fontFamily: 'inherit' }} />
              </Form.Item>

              <Form.Item
                name="slaTerms"
                label="SLA Terms"
              >
                <Input.TextArea rows={2} placeholder="Enter SLA terms" style={{ fontFamily: 'inherit' }} />
              </Form.Item>

              <Form.Item
                name="renewalTerms"
                label="Renewal Terms"
              >
                <Input.TextArea rows={2} placeholder="Enter renewal terms" style={{ fontFamily: 'inherit' }} />
              </Form.Item>

              <Form.Item
                name="serviceScope"
                label="Service Scope"
              >
                <Input.TextArea rows={2} placeholder="Enter service scope" style={{ fontFamily: 'inherit' }} />
              </Form.Item>
            </Card>
          </Form>
        </Spin>
      </div>
    </Drawer>
  );
};

export default ServiceContractFormModal;
