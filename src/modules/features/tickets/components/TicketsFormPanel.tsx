/**
 * Tickets Form Panel
 * Create and edit tickets in a side drawer
 * Manages form state, validation, and submission for ticket CRUD operations
 */

import React, { useEffect, useCallback } from 'react';
import { Drawer, Form, Input, Button, Select, DatePicker, Spin, Space } from 'antd';
import { Ticket } from '@/types/crm';
import { useCreateTicket, useUpdateTicket } from '../hooks/useTickets';
import dayjs from 'dayjs';

interface TicketsFormPanelProps {
  ticket: Ticket | null;
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
}

const STATUSES = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const PRIORITIES = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const CATEGORIES = [
  { label: 'Technical Support', value: 'technical_support' },
  { label: 'Billing', value: 'billing' },
  { label: 'Feature Request', value: 'feature_request' },
  { label: 'Bug Report', value: 'bug_report' },
  { label: 'General Inquiry', value: 'general_inquiry' },
  { label: 'Account Issue', value: 'account_issue' },
];

export const TicketsFormPanel: React.FC<TicketsFormPanelProps> = ({
  ticket,
  mode,
  isOpen,
  onClose,
}) => {
  const [form] = Form.useForm();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const isLoading = createTicket.isPending || updateTicket.isPending;

  /**
   * Initialize form with ticket data when opening/editing
   * Properly resets form when drawer closes to prevent instance warning
   */
  useEffect(() => {
    if (!isOpen) {
      // Reset form fields when drawer closes
      form.resetFields();
      return;
    }

    if (mode === 'edit' && ticket) {
      // Populate form with existing ticket data
      form.setFieldsValue({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        customer_id: ticket.customer_id,
        assigned_to: ticket.assigned_to,
        category: ticket.category,
        due_date: ticket.due_date ? dayjs(ticket.due_date) : undefined,
        tags: ticket.tags?.join(', '),
      });
    } else if (mode === 'create') {
      // Reset form for creating new ticket
      form.resetFields();
    }
  }, [mode, ticket, isOpen, form]);

  /**
   * Handle form submission for create/update operations
   * Validates data, calls appropriate mutation, and closes drawer on success
   * Note: Toast notifications are handled by the mutation hooks
   */
  const handleSubmit = useCallback(
    async (values: any) => {
      try {
        const data = {
          title: values.title,
          description: values.description,
          priority: values.priority,
          status: values.status || 'open',
          customer_id: values.customer_id,
          assigned_to: values.assigned_to,
          category: values.category,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
          tags: values.tags
            ? values.tags
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0)
            : [],
        };

        if (mode === 'create') {
          // Toast notification is handled by useCreateTicket hook
          await createTicket.mutateAsync(data);
        } else if (ticket) {
          // Toast notification is handled by useUpdateTicket hook
          await updateTicket.mutateAsync({
            id: ticket.id,
            data,
          });
        }

        // Close drawer and reset form after successful submission
        onClose();
        form.resetFields();
      } catch (error) {
        // Error notification is handled by mutation hook onError
        console.error('Error submitting ticket form:', error);
      }
    },
    [mode, ticket, createTicket, updateTicket, form, onClose]
  );

  /**
   * Handle drawer close event
   * Ensures form is reset and any pending changes are discarded
   */
  const handleDrawerClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  return (
    <Drawer
      title={mode === 'create' ? 'Create New Ticket' : 'Edit Ticket'}
      placement="right"
      onClose={handleDrawerClose}
      open={isOpen}
      width={500}
      bodyStyle={{ padding: '24px' }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleDrawerClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={isLoading}
            onClick={() => {
              // Validate and submit form
              form
                .validateFields()
                .then((values) => {
                  handleSubmit(values);
                })
                .catch((err) => {
                  console.error('Form validation failed:', err);
                });
            }}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          scrollToFirstError
        >
          {/* Title */}
          <Form.Item
            label="Ticket Title"
            name="title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input
              placeholder="Enter ticket title"
              maxLength={255}
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea
              placeholder="Enter ticket description"
              rows={4}
              maxLength={2000}
            />
          </Form.Item>

          {/* Customer ID */}
          <Form.Item
            label="Customer"
            name="customer_id"
            rules={[{ required: true, message: 'Customer is required' }]}
          >
            <Input
              placeholder="Enter customer ID"
            />
          </Form.Item>

          {/* Status & Priority Row */}
          <Form.Item
            label="Status"
            name="status"
          >
            <Select
              placeholder="Select status"
              options={STATUSES}
            />
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Priority is required' }]}
          >
            <Select
              placeholder="Select priority"
              options={PRIORITIES}
            />
          </Form.Item>

          {/* Category */}
          <Form.Item
            label="Category"
            name="category"
          >
            <Select
              placeholder="Select category"
              options={CATEGORIES}
            />
          </Form.Item>

          {/* Assigned To */}
          <Form.Item
            label="Assigned To"
            name="assigned_to"
          >
            <Input
              placeholder="Enter user ID or name"
            />
          </Form.Item>

          {/* Due Date */}
          <Form.Item
            label="Due Date"
            name="due_date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Select due date"
            />
          </Form.Item>

          {/* Tags */}
          <Form.Item
            label="Tags"
            name="tags"
          >
            <Input
              placeholder="Enter tags separated by commas"
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};