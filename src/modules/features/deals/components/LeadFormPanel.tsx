/**
 * Lead Form Panel - Enterprise Enhanced Edition
 * Professional create/edit form with card-based sections, validation, and rich UI
 * ✨ Enterprise Grade UI/UX Enhancements
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
import type { LeadDTO, CreateLeadDTO, UpdateLeadDTO } from '@/types/dtos';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateLead, useUpdateLead } from '../hooks/useLeads';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useActiveUsers } from '@/hooks/useActiveUsers';

const { TextArea } = Input;
const { Option } = Select;

interface LeadFormPanelProps {
  open: boolean;
  lead?: LeadDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// ✨ Professional styling configuration (consistent with other modules)
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

export const LeadFormPanel: React.FC<LeadFormPanelProps> = ({
  open,
  lead,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const leadScore = Form.useWatch('leadScore', form);
  const isEdit = !!lead;

  // ✅ Base permissions for create/update actions (synchronous - consistent pattern)
  const { hasPermission } = useAuth();
  const canCreateLead = hasPermission('crm:lead:record:create');
  const canUpdateLead = hasPermission('crm:lead:record:update');
  const finalCanSaveLead = isEdit ? canUpdateLead : canCreateLead;

  // Mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  // ✅ Database-driven dropdowns - consistent pattern
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id;
  
  const { options: leadSourceOptions, isLoading: loadingLeadSources } = useReferenceDataByCategory(tenantId, 'lead_source');
  const { options: qualificationOptions, isLoading: loadingQualifications } = useReferenceDataByCategory(tenantId, 'lead_qualification');
  const { options: stageOptions, isLoading: loadingStages } = useReferenceDataByCategory(tenantId, 'lead_stage');
  const { options: statusOptions, isLoading: loadingStatuses } = useReferenceDataByCategory(tenantId, 'lead_status');
  const { options: companySizeOptions, isLoading: loadingCompanySizes } = useReferenceDataByCategory(tenantId, 'company_size');
  const { options: industryOptions, isLoading: loadingIndustries } = useReferenceDataByCategory(tenantId, 'industry');
  // ✅ Replace hardcoded arrays with database-driven reference data
  const { options: budgetRangeOptions, isLoading: loadingBudgetRanges } = useReferenceDataByCategory(tenantId, 'budget_range');
  const { options: timelineOptions, isLoading: loadingTimeline } = useReferenceDataByCategory(tenantId, 'decision_timeline');

  // Load active users for "Assigned To" dropdown
  const { data: activeUsers = [], isLoading: loadingUsers } = useActiveUsers();

  // Removed hardcoded budgetRangeOptions and timelineOptions in favor of reference data

  useEffect(() => {
    if (open && lead) {
      // Populate form with lead data
      form.setFieldsValue({
        firstName: lead.firstName,
        lastName: lead.lastName,
        companyName: lead.companyName,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        source: lead.source,
        campaign: lead.campaign,
        leadScore: lead.leadScore,
        qualificationStatus: lead.qualificationStatus,
        industry: lead.industry,
        companySize: lead.companySize,
        jobTitle: lead.jobTitle,
        budgetRange: lead.budgetRange,
        timeline: lead.timeline,
        status: lead.status,
        stage: lead.stage,
        assignedTo: lead.assignedTo,
        notes: lead.notes,
        nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp) : null,
        lastContact: lead.lastContact ? new Date(lead.lastContact) : null
      });
    } else if (open && !lead) {
      // Reset form for new lead
      form.resetFields();
      form.setFieldsValue({
        leadScore: 0,
        qualificationStatus: 'new',
        status: 'new',
        stage: 'awareness'
      });
    }
  }, [open, lead, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const leadData = {
        ...values,
        nextFollowUp: values.nextFollowUp?.toISOString(),
        lastContact: values.lastContact?.toISOString()
      };

      if (isEdit && lead) {
        await updateLead.mutateAsync({ id: lead.id, data: leadData });
      } else {
        await createLead.mutateAsync(leadData as CreateLeadDTO);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Lead save error:', error);
      // Notifications handled by useCreateLead/useUpdateLead hooks
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0ea5e9' }} />
          <span>{isEdit ? 'Edit Lead' : 'Create New Lead'}</span>
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
          {/* Auto actions moved to grid to reduce confusion */}
          <Space style={{ marginLeft: 'auto' }}>
            <Button
              size="large"
              icon={<CloseOutlined />}
              onClick={handleClose}
            >
              Cancel
            </Button>
            {finalCanSaveLead && (
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={() => form.submit()}
              >
                {isEdit ? 'Update Lead' : 'Create Lead'}
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
        {/* 📄 Personal Information */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Personal Information</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: 'First name is required' },
                  { min: 2, message: 'First name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., John"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  { required: true, message: 'Last name is required' },
                  { min: 2, message: 'Last name must be at least 2 characters' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g., Smith"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
          </Row>

          <Row gutter={16}>
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
            <Col xs={24} sm={12}>
              <Form.Item name="jobTitle" label="Job Title">
                <Input
                  size="large"
                  placeholder="e.g., Sales Director"
                  allowClear
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
              <Form.Item name="industry" label="Industry">
                <Select
                  size="large"
                  placeholder="Select industry"
                  loading={loadingIndustries}
                  disabled={loadingIndustries}
                  allowClear
                >
                  {industryOptions.map(option => (
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
              <Form.Item
                name="companySize"
                label="Company Size"
                tooltip="Approximate number of employees"
              >
                <Select
                  size="large"
                  placeholder="Select company size"
                  loading={loadingCompanySizes}
                  disabled={loadingCompanySizes}
                  allowClear
                >
                  {companySizeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="budgetRange"
                label="Budget Range"
                tooltip="Estimated budget for the project"
              >
                <Select
                  size="large"
                  placeholder="Select budget range"
                  loading={loadingBudgetRanges}
                  disabled={loadingBudgetRanges}
                  allowClear
                >
                  {budgetRangeOptions.map(option => (
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
              <Form.Item
                name="timeline"
                label="Decision Timeline"
                tooltip="Expected timeline for purchase decision"
              >
                <Select
                  size="large"
                  placeholder="Select timeline"
                  loading={loadingTimeline}
                  disabled={loadingTimeline}
                  allowClear
                >
                  {timelineOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 🎯 Lead Details & Qualification */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <TagsOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Lead Details & Qualification</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="source"
                label="Lead Source"
                tooltip="How this lead was acquired"
              >
                <Select
                  size="large"
                  placeholder="Select lead source"
                  loading={loadingLeadSources}
                  disabled={loadingLeadSources}
                  allowClear
                >
                  {leadSourceOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="campaign" label="Campaign">
                <Input
                  size="large"
                  placeholder="e.g., Summer 2025 Campaign"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="leadScore"
                label={
                  <Space>
                    Lead Score
                    {leadScore !== undefined && (
                      <Tag color={getLeadScoreColor(leadScore)}>
                        {leadScore}/100
                      </Tag>
                    )}
                  </Space>
                }
                rules={[
                  { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                ]}
                tooltip="Lead quality score from 0-100"
              >
                <InputNumber
                  size="large"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="qualificationStatus"
                label="Qualification Status"
                tooltip="Current qualification status of the lead"
              >
                <Select
                  size="large"
                  placeholder="Select status"
                  loading={loadingQualifications}
                  disabled={loadingQualifications}
                >
                  {qualificationOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="stage"
                label="Lead Stage"
                tooltip="Current stage in the buyer's journey"
              >
                <Select
                  size="large"
                  placeholder="Select stage"
                  loading={loadingStages}
                  disabled={loadingStages}
                >
                  {stageOptions.map(option => (
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
              <Form.Item name="status" label="Status">
                <Select
                  size="large"
                  placeholder="Select status"
                  loading={loadingStatuses}
                  disabled={loadingStatuses}
                >
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="assignedTo"
                label="Assigned To"
                tooltip="Team member responsible for this lead"
              >
                <Select
                  size="large"
                  placeholder="Select team member"
                  loading={loadingUsers}
                  disabled={loadingUsers}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {activeUsers.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      👤 {user.firstName} {user.lastName}
                    </Select.Option>
                  ))}
                </Select>
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
                name="nextFollowUp"
                label="Next Follow-up"
                tooltip="Schedule next follow-up date and time"
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
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastContact"
                label="Last Contact"
                tooltip="Date of last contact with lead"
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
              placeholder="Add any additional notes about this lead..."
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