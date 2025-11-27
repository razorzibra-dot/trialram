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

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      // Clear template-specific fields when blank contract is selected
      form.setFieldsValue({
        type: undefined,
        status: 'draft',
        priority: 'medium',
        payment_terms: undefined,
        auto_renewal: false,
        renewal_period_months: undefined,
        renewal_terms: undefined,
        compliance_status: 'compliant',
      });
      return;
    }

    // Pre-fill form based on selected template
    const templateDefaults: Record<string, Partial<any>> = {
      service_agreement: {
        type: 'service_agreement',
        title: 'Service Agreement',
        status: 'draft',
        priority: 'medium',
        payment_terms: 'Net 30',
        auto_renewal: true,
        renewal_period_months: 12,
        renewal_terms: 'Automatic renewal for 12 months unless terminated with 30 days notice.',
        compliance_status: 'compliant',
        description: 'This Service Agreement outlines the terms and conditions for the provision of services.',
      },
      nda: {
        type: 'nda',
        title: 'Non-Disclosure Agreement',
        status: 'draft',
        priority: 'high',
        payment_terms: 'N/A',
        auto_renewal: true,
        renewal_period_months: 24,
        renewal_terms: 'This NDA remains in effect for 2 years from the date of execution.',
        compliance_status: 'compliant',
        description: 'This Non-Disclosure Agreement protects confidential information shared between parties.',
      },
      purchase_order: {
        type: 'purchase_order',
        title: 'Purchase Order',
        status: 'draft',
        priority: 'medium',
        payment_terms: 'Net 15',
        auto_renewal: false,
        compliance_status: 'compliant',
        description: 'This Purchase Order authorizes the procurement of goods and services.',
      },
      employment: {
        type: 'employment',
        title: 'Employment Contract',
        status: 'draft',
        priority: 'high',
        payment_terms: 'Monthly',
        auto_renewal: false,
        compliance_status: 'compliant',
        description: 'This Employment Contract establishes the terms of employment relationship.',
      },
      license: {
        type: 'license',
        title: 'Software License Agreement',
        status: 'draft',
        priority: 'medium',
        payment_terms: 'Annual',
        auto_renewal: true,
        renewal_period_months: 12,
        renewal_terms: 'License automatically renews annually unless cancelled 60 days prior.',
        compliance_status: 'compliant',
        description: 'This Software License Agreement grants rights to use the specified software.',
      },
    };

    const templateData = templateDefaults[templateId];
    if (templateData) {
      form.setFieldsValue(templateData);
      message.info(`Contract template "${templateId.replace('_', ' ')}" applied`);
    }
  };

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
        {/* Template Selection Section */}
        {!isEditMode && (
          <Card style={sectionStyles.card as any}>
            <div style={sectionStyles.header as any}>
              <FileTextOutlined style={sectionStyles.headerIcon as any} />
              <h3 style={sectionStyles.headerTitle as any}>Contract Template</h3>
            </div>

            <Form.Item
              label="Start from Template"
              name="template_id"
              tooltip="Select a template to pre-fill contract details, or choose 'Blank Contract' to start fresh"
            >
              <Select
                placeholder="Choose a contract template..."
                size="large"
                allowClear
                onChange={(value) => handleTemplateChange(value)}
              >
                <Select.Option value="">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined />
                    <span>Blank Contract - Start from scratch</span>
                  </div>
                </Select.Option>
                <Select.Option value="service_agreement">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Service Agreement</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>Standard service delivery contract</div>
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="nda">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Non-Disclosure Agreement</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>Confidentiality and non-disclosure terms</div>
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="purchase_order">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#faad14' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Purchase Order</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>Goods and services procurement</div>
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="employment">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#f5222d' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Employment Contract</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>Staff hiring and employment terms</div>
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="license">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: '#722ed1' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Software License</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>Software usage and licensing terms</div>
                    </div>
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>
          </Card>
        )}

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

        {/* Terms & Conditions Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <FileTextOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Terms & Conditions</h3>
          </div>

          <Form.Item
            label="Terms and Conditions"
            name="terms_and_conditions"
            tooltip="Detailed terms and conditions of the contract"
          >
            <Input.TextArea
              rows={6}
              placeholder="Enter the detailed terms and conditions of this contract..."
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Termination Clause"
                name="termination_clause"
                tooltip="Conditions under which the contract can be terminated"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Specify termination conditions..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Governing Law"
                name="governing_law"
                tooltip="Jurisdiction that governs this contract"
              >
                <Input
                  placeholder="e.g., State of California, USA"
                  size="large"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                label="Dispute Resolution"
                name="dispute_resolution"
                tooltip="Method for resolving disputes"
              >
                <Select size="large" placeholder="Select dispute resolution method">
                  <Select.Option value="court">Court Litigation</Select.Option>
                  <Select.Option value="arbitration">Arbitration</Select.Option>
                  <Select.Option value="mediation">Mediation</Select.Option>
                  <Select.Option value="negotiation">Direct Negotiation</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
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

        {/* Approval Workflow Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <CheckCircleOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Approval Workflow</h3>
          </div>

          <Form.Item
            label="Approval Stage"
            name="approval_stage"
            tooltip="Current stage in the approval process"
          >
            <Select
              placeholder="Select approval stage"
              size="large"
              allowClear
            >
              <Select.Option value="draft">📝 Draft</Select.Option>
              <Select.Option value="legal_review">⚖️ Legal Review</Select.Option>
              <Select.Option value="management_approval">👔 Management Approval</Select.Option>
              <Select.Option value="executive_approval">🏢 Executive Approval</Select.Option>
              <Select.Option value="final_approval">✅ Final Approval</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Approval Notes"
            name="approval_notes"
            tooltip="Notes for approvers or approval requirements"
          >
            <Input.TextArea
              rows={2}
              placeholder="Add approval requirements, special conditions, or notes for approvers..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {contract?.approval_history && contract.approval_history.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Approval History</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {contract.approval_history.map((record, index) => (
                  <div
                    key={record.id}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: '#f9fafb',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{record.stage}</span>
                      <span style={{
                        color: record.status === 'approved' ? '#10b981' : record.status === 'rejected' ? '#ef4444' : '#f59e0b',
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Approved by {record.approver} on {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                    {record.comments && (
                      <div style={{ fontSize: 12, marginTop: 4, color: '#374151' }}>
                        {record.comments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Digital Signing Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <FileTextOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Digital Signing</h3>
          </div>

          <Form.Item
            label="Signature Status"
            tooltip="Current status of digital signatures"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14 }}>
                {contract?.signature_status ? (
                  <>
                    <span style={{ fontWeight: 500 }}>
                      {contract.signature_status.completed}/{contract.signature_status.total_required} signatures completed
                    </span>
                    {contract.signature_status.pending.length > 0 && (
                      <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                        Pending: {contract.signature_status.pending.join(', ')}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#6b7280' }}>No signatures required yet</span>
                )}
              </span>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Customer Signature"
                tooltip="Status of customer signature"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {contract?.signed_by_customer ? (
                    <>
                      <CheckCircleOutlined style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 14 }}>Signed by {contract.signed_by_customer}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Not signed</span>
                    </>
                  )}
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Company Signature"
                tooltip="Status of company signature"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {contract?.signed_by_company ? (
                    <>
                      <CheckCircleOutlined style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 14 }}>Signed by {contract.signed_by_company}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Not signed</span>
                    </>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Signing Instructions"
            name="signing_instructions"
            tooltip="Instructions for parties who need to sign this contract"
          >
            <Input.TextArea
              rows={2}
              placeholder="Add instructions for digital signing process..."
              maxLength={300}
              showCount
            />
          </Form.Item>

          {contract && (
            <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 6, border: '1px solid #0ea5e9' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0ea5e9', marginBottom: 8 }}>
                Digital Signing Actions
              </div>
              <Space>
                <Button
                  type="default"
                  size="small"
                  icon={<FileTextOutlined />}
                  disabled={contract.signature_status?.completed === contract.signature_status?.total_required}
                >
                  Send Signing Request
                </Button>
                <Button
                  type="default"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  disabled={!contract.signature_status || contract.signature_status.completed === 0}
                >
                  View Signatures
                </Button>
              </Space>
            </div>
          )}
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