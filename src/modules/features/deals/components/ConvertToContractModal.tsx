/**
 * Convert to Contract Modal
 * Phase 3.3: Workflow modal for converting closed deals to contracts
 * Handles deal validation, contract pre-filling, and creation
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  InputNumber,
  DatePicker,
  Divider,
  Alert,
  Spin,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import { Deal } from '@/types/crm';
import { ContractFormData } from '@/types/contracts';
import { useService } from '@/modules/core/hooks/useService';
import { SalesService } from '../services/salesService';
import { useCreateContract } from '@/modules/features/contracts/hooks/useContracts';

interface ConvertToContractModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: (contractId: string) => void;
}

export const ConvertToContractModal: React.FC<ConvertToContractModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [prefilledData, setPrefilledData] = useState<Partial<ContractFormData> | null>(null);

  const salesService = useService<SalesService>('salesService');
  const createContract = useCreateContract();

  // Validate deal and prefill contract data when modal opens
  useEffect(() => {
    if (!visible || !deal || !salesService) {
      return;
    }

    const validateAndPrefill = async () => {
      try {
        setValidating(true);
        setValidationErrors([]);

        // Validate deal can be converted
        const validation = await salesService.validateDealForConversion(deal.id);
        if (!validation.isValid) {
          setValidationErrors(validation.errors);
          return;
        }

        // Prepare contract data from deal
        const contractData = await salesService.prepareContractFromDeal(deal.id);
        setPrefilledData(contractData);

        // Set form fields with pre-filled data
        form.setFieldsValue({
          title: contractData.title,
          description: contractData.description,
          type: 'service_agreement', // Default type
          customer_id: contractData.customer_id,
          value: contractData.value,
          currency: contractData.currency,
          start_date: dayjs(contractData.start_date),
          end_date: contractData.end_date ? dayjs(contractData.end_date) : null,
          assigned_to: contractData.assigned_to,
          notes: contractData.notes,
          priority: 'medium',
          auto_renew: false,
          reminder_days: [],
          tags: [],
          parties: [],
        });
      } catch (error) {
        console.error('Error validating/prefilling contract:', error);
        setValidationErrors([(error as Error).message || 'Validation failed']);
      } finally {
        setValidating(false);
      }
    };

    validateAndPrefill();
  }, [visible, deal, form, salesService]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert dayjs objects to date strings
      const contractData: ContractFormData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : '',
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : '',
        deal_id: deal?.id,
        deal_title: deal?.title,
      };

      // Create contract via mutation
      const result = await createContract.mutateAsync(contractData);

      message.success('Contract created successfully from deal');
      onSuccess(result.id || result);
      form.resetFields();
      onClose();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Please complete all required fields')) {
        message.error((error as Error).message || 'Failed to create contract');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Convert Deal to Contract"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={validationErrors.length > 0 || validating}
        >
          Create Contract
        </Button>,
      ]}
    >
      <Spin spinning={validating}>
        {/* Deal Information */}
        {deal && (
          <>
            <Alert
              message="Converting Sales Deal to Contract"
              description={`Deal: ${deal.title} (Customer ID: ${deal.customer_id})`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert
            message="Cannot Convert Deal"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Contract Form */}
        {validationErrors.length === 0 && (
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            disabled={validating}
          >
            {/* Deal Information Section */}
            <Divider>Deal Reference Information (Read-only)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Deal Title">
                  <Input value={deal?.title} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Deal Value">
                  <InputNumber
                    value={deal?.value}
                    disabled
                    formatter={(value) => `$${value}`}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Contract Information</Divider>

            {/* Contract Title */}
            <Form.Item
              name="title"
              label="Contract Title"
              rules={[{ required: true, message: 'Title is required' }]}
            >
              <Input placeholder="Enter contract title" />
            </Form.Item>

            {/* Contract Description */}
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea placeholder="Enter contract description" rows={3} />
            </Form.Item>

            {/* Contract Type */}
            <Form.Item
              name="type"
              label="Contract Type"
              rules={[{ required: true, message: 'Type is required' }]}
              initialValue="service_agreement"
            >
              <Select>
                <Select.Option value="service_agreement">Service Agreement</Select.Option>
                <Select.Option value="nda">NDA</Select.Option>
                <Select.Option value="purchase_order">Purchase Order</Select.Option>
                <Select.Option value="employment">Employment</Select.Option>
                <Select.Option value="custom">Custom</Select.Option>
              </Select>
            </Form.Item>

            {/* Customer Information */}
            <Form.Item
              name="customer_id"
              label="Customer ID"
              rules={[{ required: true, message: 'Customer is required' }]}
            >
              <Input disabled />
            </Form.Item>

            {/* Financial Information */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="value"
                  label="Contract Value"
                  rules={[{ required: true, message: 'Value is required' }]}
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currency"
                  label="Currency"
                  initialValue="USD"
                >
                  <Select>
                    <Select.Option value="USD">USD</Select.Option>
                    <Select.Option value="EUR">EUR</Select.Option>
                    <Select.Option value="GBP">GBP</Select.Option>
                    <Select.Option value="CAD">CAD</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Dates */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="start_date"
                  label="Start Date"
                  rules={[{ required: true, message: 'Start date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="end_date"
                  label="End Date"
                  rules={[{ required: true, message: 'End date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            {/* Terms & Conditions */}
            <Form.Item
              name="auto_renew"
              label="Auto Renewal"
              valuePropName="checked"
              initialValue={false}
            >
              <Input type="checkbox" />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Notes"
            >
              <Input.TextArea placeholder="Enter additional notes" rows={3} />
            </Form.Item>

            {/* Assignment */}
            <Form.Item
              name="assigned_to"
              label="Assigned To"
            >
              <Input placeholder="Assign to user" />
            </Form.Item>

            {/* Priority */}
            <Form.Item
              name="priority"
              label="Priority"
              initialValue="medium"
            >
              <Select>
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="urgent">Urgent</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
};