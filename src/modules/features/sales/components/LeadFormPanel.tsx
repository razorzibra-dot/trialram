/**
 * Lead Form Panel - Enterprise Design
 * Comprehensive lead capture and editing form with validation
 * Unified drawer panel for create/edit operations
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
  Divider,
  DatePicker,
  InputNumber,
  Tag,
  Typography
} from 'antd';
import { SaveOutlined, CloseOutlined, UserOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, CalculatorOutlined, UserAddOutlined } from '@ant-design/icons';
import type { LeadDTO, CreateLeadDTO, UpdateLeadDTO } from '@/types/dtos';
import { useCreateLead, useUpdateLead, useAutoCalculateLeadScore, useAutoAssignLead } from '../hooks/useLeads';
import { useLeadSource } from '@/modules/features/customers/hooks/useLeadSource';
import { useLeadRating } from '@/modules/features/customers/hooks/useLeadRating';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface LeadFormPanelProps {
  visible: boolean;
  lead?: LeadDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LeadFormPanel: React.FC<LeadFormPanelProps> = ({
  visible,
  lead,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!lead;

  // Reference data hooks
  const { data: leadSources } = useLeadSource();
  const { data: leadRatings } = useLeadRating();

  // Mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const autoCalculateScore = useAutoCalculateLeadScore();
  const autoAssignLead = useAutoAssignLead();

  // Qualification status options
  const qualificationStatuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' }
  ];

  // Lead stage options
  const leadStages = [
    { value: 'awareness', label: 'Awareness' },
    { value: 'interest', label: 'Interest' },
    { value: 'consideration', label: 'Consideration' },
    { value: 'intent', label: 'Intent' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'purchase', label: 'Purchase' }
  ];

  // Status options
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'converted', label: 'Converted' },
    { value: 'lost', label: 'Lost' }
  ];

  // Company size options
  const companySizeOptions = [
    { value: 'startup', label: 'Startup (1-10)' },
    { value: 'small', label: 'Small (11-50)' },
    { value: 'medium', label: 'Medium (51-200)' },
    { value: 'large', label: 'Large (201-1000)' },
    { value: 'enterprise', label: 'Enterprise (1000+)' }
  ];

  // Industry options
  const industryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'education', label: 'Education' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  // Budget range options
  const budgetRangeOptions = [
    { value: 'under_25k', label: 'Under $25K' },
    { value: '25k_50k', label: '$25K - $50K' },
    { value: '50k_100k', label: '$50K - $100K' },
    { value: '100k_250k', label: '$100K - $250K' },
    { value: '250k_500k', label: '$250K - $500K' },
    { value: 'over_500k', label: 'Over $500K' }
  ];

  // Timeline options
  const timelineOptions = [
    { value: 'immediate', label: 'Immediate (within 1 month)' },
    { value: '1_3_months', label: '1-3 months' },
    { value: '3_6_months', label: '3-6 months' },
    { value: '6_12_months', label: '6-12 months' },
    { value: 'over_12_months', label: 'Over 12 months' }
  ];

  useEffect(() => {
    if (visible && lead) {
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
    } else if (visible && !lead) {
      // Reset form for new lead
      form.resetFields();
      form.setFieldsValue({
        leadScore: 0,
        qualificationStatus: 'new',
        status: 'new',
        stage: 'awareness'
      });
    }
  }, [visible, lead, form]);

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
        message.success('Lead updated successfully');
      } else {
        await createLead.mutateAsync(leadData as CreateLeadDTO);
        message.success('Lead created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Lead save error:', error);
      // Error handling is done in the hooks
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
        <Space>
          <UserOutlined />
          {isEdit ? 'Edit Lead' : 'Create New Lead'}
        </Space>
      }
      width={800}
      open={visible}
      onClose={handleClose}
      maskClosable={false}
      extra={
        <Space>
          {isEdit && (
            <>
              <Button
                onClick={() => lead && autoCalculateScore.mutate(lead.id)}
                loading={autoCalculateScore.isPending}
                icon={<CalculatorOutlined />}
              >
                Auto Calculate Score
              </Button>
              <Button
                onClick={() => lead && autoAssignLead.mutate(lead.id)}
                loading={autoAssignLead.isPending}
                icon={<UserAddOutlined />}
              >
                Auto Assign
              </Button>
            </>
          )}
          <Button onClick={handleClose} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            icon={<SaveOutlined />}
          >
            {isEdit ? 'Update Lead' : 'Create Lead'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <div style={{ padding: '0 8px' }}>
          {/* Personal Information */}
          <Card
            title={
              <Space>
                <UserOutlined />
                Personal Information
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true, message: 'First name is required' }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true, message: 'Last name is required' }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { type: 'email', message: 'Please enter a valid email' },
                    { required: true, message: 'Email is required' }
                  ]}
                >
                  <Input
                    placeholder="Enter email address"
                    prefix={<MailOutlined />}
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
                    placeholder="Enter phone number"
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="mobile" label="Mobile">
                  <Input
                    placeholder="Enter mobile number"
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="jobTitle" label="Job Title">
                  <Input placeholder="Enter job title" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Company Information */}
          <Card
            title={
              <Space>
                <GlobalOutlined />
                Company Information
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  rules={[{ required: true, message: 'Company name is required' }]}
                >
                  <Input placeholder="Enter company name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="industry" label="Industry">
                  <Select placeholder="Select industry" allowClear>
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
                <Form.Item name="companySize" label="Company Size">
                  <Select placeholder="Select company size" allowClear>
                    {companySizeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="budgetRange" label="Budget Range">
                  <Select placeholder="Select budget range" allowClear>
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
                <Form.Item name="timeline" label="Timeline">
                  <Select placeholder="Select timeline" allowClear>
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

          {/* Lead Details */}
          <Card title="Lead Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="source" label="Lead Source">
                  <Select placeholder="Select lead source" allowClear>
                    {leadSources?.map(source => (
                      <Option key={source.id} value={source.label}>
                        {source.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="campaign" label="Campaign">
                  <Input placeholder="Enter campaign name" />
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
                      {form.getFieldValue('leadScore') !== undefined && (
                        <Tag color={getLeadScoreColor(form.getFieldValue('leadScore'))}>
                          {form.getFieldValue('leadScore')}/100
                        </Tag>
                      )}
                    </Space>
                  }
                  rules={[
                    { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    placeholder="0-100"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="qualificationStatus" label="Qualification Status">
                  <Select placeholder="Select qualification status">
                    {qualificationStatuses.map(status => (
                      <Option key={status.value} value={status.value}>
                        {status.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="stage" label="Lead Stage">
                  <Select placeholder="Select lead stage">
                    {leadStages.map(stage => (
                      <Option key={stage.value} value={stage.value}>
                        {stage.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="status" label="Status">
                  <Select placeholder="Select status">
                    {statusOptions.map(status => (
                      <Option key={status.value} value={status.value}>
                        {status.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="assignedTo" label="Assigned To">
                  <Input placeholder="Enter assignee ID or name" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Follow-up Information */}
          <Card title="Follow-up Information" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="nextFollowUp" label="Next Follow-up">
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Select next follow-up date"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="lastContact" label="Last Contact">
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Select last contact date"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes">
              <TextArea
                rows={4}
                placeholder="Enter any additional notes about this lead..."
              />
            </Form.Item>
          </Card>
        </div>
      </Form>
    </Drawer>
  );
};