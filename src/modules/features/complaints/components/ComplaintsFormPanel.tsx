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
import { useAuth } from '@/contexts/AuthContext';
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';

interface ComplaintsFormPanelProps {
  visible: boolean;
  complaint: Complaint | null;
  onClose: () => void;
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

  // Load customers for dropdown using shared hook
  const { data: customerOptions = [], isLoading: loadingCustomers } = useCustomersDropdown();

  // ✅ Database-driven dropdowns - no hardcoded values
  const currentTenant = useCurrentTenant();
  const { data: complaintTypes = [], isLoading: loadingTypes } = useReferenceDataByCategory(currentTenant?.id, 'complaint_type');
  const { data: priorities = [], isLoading: loadingPriorities } = useReferenceDataByCategory(currentTenant?.id, 'complaint_priority');

  // Load active users for "Assigned Engineer" dropdown
  const { data: activeUsers = [], isLoading: loadingUsers } = useActiveUsers();

  const categoryOptions = complaintTypes.map(type => ({
    label: type.label,
    value: type.key,
  }));

  const priorityOptions = priorities.map(priority => {
    const metadata = (priority.metadata as any) || {};
    const icon = metadata.icon || '';
    return {
      label: `${icon} ${priority.label}`,
      value: priority.key,
    };
  });

  // customerOptions provided by useCustomersDropdown hook

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
        category: values.category,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined,
      };

      if (isEditMode && complaint) {
        await updateComplaint.mutateAsync({
          id: complaint.id,
          data: {
            status: values.status,
            assigned_to: values.assigned_to,
            resolution: values.resolution,
            priority: values.priority,
          },
        });
      } else {
        await createComplaint.mutateAsync(formData);
      }

      onSuccess();
    } catch (error) {
      // Notifications handled by hooks
      console.error('Error submitting complaint form:', error);
    } finally {
      setLoading(false);
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
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
            icon={<SaveOutlined />}
          >
            {isEditMode ? 'Update Complaint' : 'Create Complaint'}
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          autoComplete="off"
        >
          {/* Basic Information Section */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <FileTextOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Basic Information</h3>
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
              size="large"
              allowClear
              placeholder="e.g., Equipment malfunction in production line"
              prefix={<ExclamationCircleOutlined />}
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
              style={{ fontFamily: 'inherit' }}
            />
          </Form.Item>
        </Card>

        {/* Complaint Details Section */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <SettingOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Complaint Details</h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select complaint category' }]}
                tooltip="Categorize the complaint using reference data"
              >
                <Select
                  placeholder="Select complaint category"
                  size="large"
                  loading={loadingTypes}
                  optionLabelProp="label"
                  options={categoryOptions}
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
                  loading={loadingPriorities}
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
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Customer Information</h3>
          </div>

          <Form.Item
            label="Customer"
            name="customer_id"
            rules={[{ required: true, message: 'Please select a customer' }]}
            tooltip="Select the customer who reported this complaint"
          >
            <Select
              size="large"
              placeholder="Select customer"
              showSearch
              optionFilterProp="label"
              options={customerOptions}
              loading={loadingCustomers}
            />
          </Form.Item>
        </Card>

        {/* Assignment Section */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <UserOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Assignment</h3>
          </div>

          <Form.Item
            label="Assigned To"
            name="assigned_to"
            tooltip="Assign an engineer or owner to handle this complaint (optional)"
          >
            <Select
              size="large"
              placeholder="Select owner (optional)"
              allowClear
              showSearch
              optionFilterProp="children"
              loading={loadingUsers}
            >
              {activeUsers.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  👤 {user.firstName} {user.lastName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {isEditMode && (
              <Form.Item
                label="Resolution"
                name="resolution"
                tooltip="Resolution notes from the owner or engineer"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Enter resolution details, actions taken, and final outcome..."
                  maxLength={500}
                  showCount
                  style={{ fontFamily: 'inherit' }}
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
      </div>
    </Drawer>
  );
};
