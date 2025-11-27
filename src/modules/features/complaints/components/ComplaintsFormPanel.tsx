/**
 * Complaints Form Panel - Enterprise Edition
 * Side drawer for creating/editing complaint information with professional UI/UX
 * ✨ Enhanced with:
 *   - Professional visual hierarchy
 *   - Organized section cards
 *   - Field grouping and descriptions
 *   - Improved spacing and typography
 *   - Better validation feedback
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer, Form, Input, Select, Button, Space, message, Card, Row, Col, Divider, Alert
} from 'antd';
import {
  ExclamationCircleOutlined, UserOutlined, SettingOutlined,
  SaveOutlined, CloseOutlined, FileTextOutlined
} from '@ant-design/icons';
import { Complaint, ComplaintFormData } from '@/types/complaints';
import { useCreateComplaint, useUpdateComplaint } from '../hooks/useComplaints';
import { useCustomers } from '@/modules/features/customers/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';

interface ComplaintsFormPanelProps {
  visible: boolean;
  complaint: Complaint | null;
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

export const ComplaintsFormPanel: React.FC<ComplaintsFormPanelProps> = ({
  visible,
  complaint,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createComplaint = useCreateComplaint();
  const updateComplaint = useUpdateComplaint();
  const { hasPermission } = useAuth();

  const isEditMode = !!complaint;

  // Fetch customers for dropdown
  const { data: customersData } = useCustomers({ page: 1, pageSize: 100 });
  const customers = customersData?.data || [];

  const typeOptions = [
    { label: 'Equipment Breakdown', value: 'breakdown' },
    { label: 'Preventive Maintenance', value: 'preventive' },
    { label: 'Software Update', value: 'software_update' },
    { label: 'System Optimization', value: 'optimize' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const customerOptions = customers.map(customer => ({
    label: `${customer.company_name} (${customer.email})`,
    value: customer.id,
  }));

  useEffect(() => {
    if (visible && complaint) {
      form.setFieldsValue(complaint);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, complaint, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData: ComplaintFormData = {
        title: values.title,
        description: values.description,
        customer_id: values.customer_id,
        type: values.type,
        priority: values.priority,
        assigned_engineer_id: values.assigned_engineer_id || undefined,
      };

      if (isEditMode && complaint) {
        await updateComplaint.mutateAsync({
          id: complaint.id,
          data: {
            status: values.status,
            assigned_engineer_id: values.assigned_engineer_id,
            engineer_resolution: values.engineer_resolution,
            priority: values.priority,
          },
        });
        message.success('Complaint updated successfully');
      } else {
        await createComplaint.mutateAsync(formData);
        message.success('Complaint created successfully');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#faad14';
      case 'medium': return '#1890ff';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'breakdown': return '#ff4d4f';
      case 'preventive': return '#1890ff';
      case 'software_update': return '#722ed1';
      case 'optimize': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ExclamationCircleOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
          <span>{isEditMode ? 'Edit Complaint' : 'Create New Complaint'}</span>
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
            {isEditMode ? 'Update Complaint' : 'Create Complaint'}
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
            label="Complaint Title"
            name="title"
            rules={[
              { required: true, message: 'Please enter complaint title' },
              { min: 5, message: 'Title must be at least 5 characters' }
            ]}
            tooltip="Provide a clear, descriptive title for the complaint"
          >
            <Input
              placeholder="e.g., Equipment malfunction in production line"
              size="large"
              prefix={<AlertCircleOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter complaint description' },
              { min: 20, message: 'Description must be at least 20 characters' }
            ]}
            tooltip="Detailed description of the issue, symptoms, and impact"
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe the complaint in detail, including when it started, what symptoms are observed, and any impact on operations..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Complaint Details Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <SettingOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Complaint Details</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true, message: 'Please select complaint type' }]}
                tooltip="Categorize the type of complaint"
              >
                <Select
                  placeholder="Select complaint type"
                  size="large"
                  optionLabelProp="label"
                  options={typeOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
                tooltip="Set the urgency level for resolution"
              >
                <Select
                  placeholder="Select priority level"
                  size="large"
                  optionLabelProp="label"
                  options={priorityOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          {isEditMode && (
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
              tooltip="Current status of the complaint"
            >
              <Select
                placeholder="Select status"
                size="large"
              >
                <Select.Option value="new">New</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="closed">Closed</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Card>

        {/* Customer Information Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <UserOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Customer Information</h3>
          </div>

          <Form.Item
            label="Customer"
            name="customer_id"
            rules={[{ required: true, message: 'Please select a customer' }]}
            tooltip="Select the customer who reported this complaint"
          >
            <Select
              placeholder="Select customer"
              size="large"
              showSearch
              optionFilterProp="label"
              options={customerOptions}
              loading={!customersData}
            />
          </Form.Item>
        </Card>

        {/* Assignment Section */}
        <Card style={sectionStyles.card as any}>
          <div style={sectionStyles.header as any}>
            <UserOutlined style={sectionStyles.headerIcon as any} />
            <h3 style={sectionStyles.headerTitle as any}>Assignment</h3>
          </div>

          <Form.Item
            label="Assigned Engineer"
            name="assigned_engineer_id"
            tooltip="Assign an engineer to handle this complaint (optional)"
          >
            <Select
              placeholder="Select engineer (optional)"
              size="large"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {/* TODO: Fetch engineers from user service */}
              <Select.Option value="eng1">John Smith (Senior Engineer)</Select.Option>
              <Select.Option value="eng2">Sarah Johnson (Technical Specialist)</Select.Option>
              <Select.Option value="eng3">Mike Davis (Field Engineer)</Select.Option>
            </Select>
          </Form.Item>

          {isEditMode && (
            <Form.Item
              label="Engineer Resolution"
              name="engineer_resolution"
              tooltip="Resolution notes from the assigned engineer"
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter resolution details, actions taken, and final outcome..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}
        </Card>

        {/* Helper Alert */}
        {!isEditMode && (
          <Alert
            message="Complaint Creation"
            description="Once created, this complaint will be tracked and assigned for resolution. Status updates and resolution notes can be added later."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Drawer>
  );
};