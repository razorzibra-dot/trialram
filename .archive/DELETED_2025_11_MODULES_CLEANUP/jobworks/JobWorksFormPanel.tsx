/**
 * Job Works Form Panel
 * Side drawer for creating/editing job work information
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message, InputNumber, DatePicker, Divider } from 'antd';
import dayjs from 'dayjs';
import { JobWork, CreateJobWorkData } from '../services/jobWorksService';
import { useCreateJobWork, useUpdateJobWork } from '../hooks/useJobWorks';
import { DynamicSelect } from '@/components/forms';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

interface JobWorksFormPanelProps {
  visible: boolean;
  jobWork: JobWork | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobWorksFormPanel: React.FC<JobWorksFormPanelProps> = ({
  visible,
  jobWork,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createJobWork = useCreateJobWork();
  const updateJobWork = useUpdateJobWork();
  const { getRefDataByCategory } = useReferenceData();

  const isEditMode = !!jobWork;

  const statusOptions = getRefDataByCategory('jobwork_status').map(s => ({ 
    label: s.label, 
    value: s.key 
  }));
  
  const priorityOptions = getRefDataByCategory('jobwork_priority').map(p => ({ 
    label: p.label, 
    value: p.key 
  }));

  useEffect(() => {
    if (visible && jobWork) {
      form.setFieldsValue({
        ...jobWork,
        start_date: jobWork.start_date ? dayjs(jobWork.start_date) : null,
        due_date: jobWork.due_date ? dayjs(jobWork.due_date) : null,
        completion_date: jobWork.completion_date ? dayjs(jobWork.completion_date) : null,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, jobWork, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert dayjs to string for API
      const submitData = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
        completion_date: values.completion_date ? values.completion_date.format('YYYY-MM-DD') : undefined,
      };

      if (isEditMode && jobWork) {
        await updateJobWork.mutateAsync({
          id: jobWork.id,
          data: submitData,
        });
        message.success('Job work updated successfully');
      } else {
        await createJobWork.mutateAsync(submitData as CreateJobWorkData);
        message.success('Job work created successfully');
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
      title={isEditMode ? 'Edit Job Work' : 'Create New Job Work'}
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
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>

        <Form.Item
          label="Job Work Title"
          name="title"
          rules={[{ required: true, message: 'Please enter job work title' }]}
        >
          <Input placeholder="Enter job work title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea placeholder="Enter job work description" rows={3} />
        </Form.Item>

        <Form.Item
          label="Customer"
          name="customer_id"
          rules={[{ required: true, message: 'Please select a customer' }]}
        >
          <DynamicSelect 
            type="customers" 
            placeholder="Select customer"
          />
        </Form.Item>

        <Divider />

        {/* Status & Priority */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Status & Priority</h3>

        <Form.Item
          label="Status"
          name="status"
          initialValue="pending"
        >
          <Select placeholder="Select status" options={statusOptions} />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select placeholder="Select priority" options={priorityOptions} />
        </Form.Item>

        <Divider />

        {/* Assignment */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Assignment</h3>

        <Form.Item
          label="Assigned To (User ID)"
          name="assigned_to"
        >
          <Input placeholder="Enter user ID for assignment" />
        </Form.Item>

        <Divider />

        {/* Timeline */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Timeline</h3>

        <Form.Item
          label="Start Date"
          name="start_date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Due Date"
          name="due_date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Completion Date"
          name="completion_date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        {/* Hours & Cost */}
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Hours & Cost</h3>

        <Form.Item
          label="Estimated Hours"
          name="estimated_hours"
        >
          <InputNumber
            placeholder="Enter estimated hours"
            min={0}
            step={0.5}
            precision={1}
          />
        </Form.Item>

        <Form.Item
          label="Actual Hours"
          name="actual_hours"
        >
          <InputNumber
            placeholder="Enter actual hours"
            min={0}
            step={0.5}
            precision={1}
          />
        </Form.Item>

        <Form.Item
          label="Cost"
          name="cost"
        >
          <InputNumber
            placeholder="Enter cost"
            min={0}
            formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};