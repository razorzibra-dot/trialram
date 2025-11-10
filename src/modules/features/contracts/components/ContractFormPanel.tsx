/**
 * Contract Form Panel - Enterprise Edition
 * Side drawer for creating/editing contract information with professional UI/UX
 * ✨ Enhanced with:
 *   - Professional visual hierarchy
 *   - Organized section cards
 *   - Field grouping and descriptions
 *   - Improved spacing and typography
 *   - Better validation feedback
 */

import React, { useState, useEffect } from 'react';
import { 
  Drawer, Form, Input, Select, Button, Space, message, InputNumber, Checkbox, DatePicker, 
  Card, Row, Col, Divider, Alert
} from 'antd';
import { 
  FileTextOutlined, CalendarOutlined, DollarOutlined, UserOutlined, 
  SafetyOutlined, CheckCircleOutlined, SyncOutlined, SaveOutlined, CloseOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Contract } from '@/types/contracts';
import { useCreateContract, useUpdateContract } from '../hooks/useContracts';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

interface ContractFormPanelProps {
  visible: boolean;
  contract: Contract | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Professional section styling
const sectionStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '2px solid #f0f0f0',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  headerIcon: {
    fontSize: 18,
    color: '#0ea5e9',
  },
  card: {
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
  },
  fieldGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
    display: 'block',
  },
  fieldDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
  },
};

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
  const { getRefDataByCategory } = useReferenceData();

  const isEditMode = !!contract;

  const typeOptions = getRefDataByCategory('contract_type').map(t => ({ 
    label: t.label, 
    value: t.key 
  }));
  
  const statusOptions = getRefDataByCategory('contract_status').map(s => ({ 
    label: s.label, 
    value: s.key 
  }));
  
  const priorityOptions = getRefDataByCategory('contract_priority').map(p => ({ 
    label: p.label, 
    value: p.key 
  }));

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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileTextOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
          <span>{isEditMode ? 'Edit Contract' : 'Create New Contract'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right', gap: 8 }}>
          <Button 
            icon={<CloseOutlined />} 
            onClick={onClose}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            size="large"
            icon={<SaveOutlined />}
          >
            {isEditMode ? 'Update Contract' : 'Create Contract'}
          </Button>
        </Space>
      }
      styles={{
        header: { borderBottom: '1px solid #e5e7eb' },
        body: { padding: '24px', background: '#fafafa' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
      >
        {/* Basic Information Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <FileTextOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Basic Information</h3>
          </div>

          <Form.Item
            label="Contract Title"
            name="title"
            rules={[
              { required: true, message: 'Please enter contract title' },
              { min: 3, message: 'Title must be at least 3 characters' }
            ]}
            tooltip="Provide a clear, descriptive title for the contract"
          >
            <Input 
              placeholder="e.g., Software License Agreement 2025" 
              size="large"
              prefix={<FileTextOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Contract Number"
            name="contract_number"
            rules={[{ required: true, message: 'Please enter contract number' }]}
            tooltip="Unique identifier for tracking and reference"
          >
            <Input 
              placeholder="e.g., CNT-2025-001" 
              size="large"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            tooltip="Add details about the contract scope and key terms"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter contract description, objectives, and key terms..." 
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Contract Details Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <SafetyOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Contract Details</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true, message: 'Please select contract type' }]}
                tooltip="Choose the category of this contract"
              >
                <Select 
                  placeholder="Select contract type"
                  size="large"
                  optionLabelProp="label"
                  options={typeOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
                tooltip="Current state of the contract lifecycle"
              >
                <Select 
                  placeholder="Select contract status"
                  size="large"
                  optionLabelProp="label"
                  options={statusOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Please select priority' }]}
            tooltip="Set the importance level for this contract"
          >
            <Select 
              placeholder="Select priority level"
              size="large"
              optionLabelProp="label"
              options={priorityOptions}
            />
          </Form.Item>
        </Card>

        {/* Party Information Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <UserOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Party Information</h3>
          </div>

          <Form.Item
            label="Customer Name"
            name="customer_name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
            tooltip="Name of the organization or individual party"
          >
            <Input 
              placeholder="Enter customer/party name" 
              size="large"
              prefix={<UserOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Customer Contact"
            name="customer_contact"
            rules={[
              { type: 'email', message: 'Please enter a valid email' }
            ]}
            tooltip="Email or phone number for primary contact"
          >
            <Input 
              placeholder="contact@company.com or +1-xxx-xxx-xxxx" 
              size="large"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Assigned To"
            name="assigned_to_name"
            tooltip="Name of the internal person responsible for this contract"
          >
            <Input 
              placeholder="Enter assigned person name" 
              size="large"
              prefix={<UserOutlined />}
              allowClear
            />
          </Form.Item>
        </Card>

        {/* Financial Information Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <DollarOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Financial Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contract Value"
                name="value"
                rules={[
                  { required: true, message: 'Please enter contract value' },
                  { type: 'number', min: 0, message: 'Value must be positive' }
                ]}
                tooltip="Total monetary value of the contract"
              >
                <InputNumber
                  placeholder="0.00"
                  formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') as string) || 0}
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Currency"
                name="currency"
                initialValue="USD"
              >
                <Select size="large">
                  <Select.Option value="USD">🇺🇸 USD - US Dollar</Select.Option>
                  <Select.Option value="EUR">🇪🇺 EUR - Euro</Select.Option>
                  <Select.Option value="GBP">🇬🇧 GBP - British Pound</Select.Option>
                  <Select.Option value="INR">🇮🇳 INR - Indian Rupee</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Payment Terms"
            name="payment_terms"
            tooltip="e.g., Net 30, Net 60, Due on Receipt, etc."
          >
            <Input 
              placeholder="e.g., Net 30, Net 60, Due on Receipt" 
              size="large"
              allowClear
            />
          </Form.Item>
        </Card>

        {/* Dates Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <CalendarOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Dates</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Start Date"
                name="start_date"
                rules={[{ required: true, message: 'Please select start date' }]}
                tooltip="When does the contract become effective?"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Select start date"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="End Date"
                name="end_date"
                rules={[{ required: true, message: 'Please select end date' }]}
                tooltip="When does the contract expire or end?"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Select end date"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Renewal Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <SyncOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Renewal Settings</h3>
          </div>

          <Form.Item
            name="auto_renew"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox style={{ fontSize: 14 }}>
              Enable automatic renewal when contract expires
            </Checkbox>
          </Form.Item>

          <Form.Item
            label="Renewal Period"
            name="renewal_period_months"
            tooltip="How many months to renew for each cycle (if auto-renewal enabled)"
          >
            <InputNumber 
              min={0}
              placeholder="Enter renewal period in months"
              style={{ width: '100%' }}
              size="large"
              suffix="months"
            />
          </Form.Item>

          <Form.Item
            label="Renewal Terms"
            name="renewal_terms"
            tooltip="Any special conditions or terms for renewal"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Enter renewal terms and conditions..." 
              maxLength={300}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Compliance Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <CheckCircleOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Compliance & Notes</h3>
          </div>

          <Form.Item
            label="Compliance Status"
            name="compliance_status"
            initialValue="compliant"
            tooltip="Current compliance status of this contract"
          >
            <Select size="large">
              <Select.Option value="compliant">✅ Compliant</Select.Option>
              <Select.Option value="non_compliant">❌ Non-Compliant</Select.Option>
              <Select.Option value="pending_review">⏳ Pending Review</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Additional Notes"
            name="notes"
            tooltip="Any additional information or special conditions"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Add any important notes, special conditions, or additional information..." 
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Helper Alert */}
        {!isEditMode && (
          <Alert
            message="Contract Created"
            description="Once created, you can further manage this contract including approvals, signatures, and renewals."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Drawer>
  );
};