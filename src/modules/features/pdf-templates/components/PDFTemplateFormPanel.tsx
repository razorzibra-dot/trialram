/**
 * PDF Template Form Panel - Create/Edit Drawer
 * Form for creating or editing PDF templates
 */
import React from 'react';
import { Drawer, Form, Input, Select, Button, Space, Row, Col, Switch, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { PDFTemplate } from '@/services/pdfTemplateService';

const { TextArea } = Input;

interface PDFTemplateFormData {
  name: string;
  category: string;
  description: string;
  content: string;
  variables: string;
  is_active?: boolean;
}

interface PDFTemplateFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  template: PDFTemplate | null;
  onClose: () => void;
  onSave: (values: PDFTemplateFormData) => Promise<void>;
  loading: boolean;
}

export const PDFTemplateFormPanel: React.FC<PDFTemplateFormPanelProps> = ({
  open,
  mode,
  template,
  onClose,
  onSave,
  loading
}) => {
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields() as PDFTemplateFormData;
      await onSave(values);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const title = mode === 'create' ? 'Create PDF Template' : 'Edit PDF Template';

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose} disabled={loading}>
            <CloseOutlined /> Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            icon={<SaveOutlined />}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={template ? {
          name: template.name,
          category: template.category,
          description: template.description,
          content: template.content,
          variables: template.variables.join(', '),
          is_active: template.is_active
        } : undefined}
      >
        <Row gutter={16}>
          {/* Template Name */}
          <Col span={24}>
            <Form.Item
              label="Template Name"
              name="name"
              rules={[{ required: true, message: 'Template name is required' }]}
            >
              <Input placeholder="e.g., Invoice Template" />
            </Form.Item>
          </Col>

          {/* Category */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Category is required' }]}
            >
              <Select placeholder="Select category">
                <Select.Option value="invoice">Invoice</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
                <Select.Option value="report">Report</Select.Option>
                <Select.Option value="letter">Letter</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Status */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Status"
              name="is_active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>

          {/* Description */}
          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea 
                placeholder="Describe the template purpose and usage"
                rows={3}
              />
            </Form.Item>
          </Col>

          {/* Variables */}
          <Col span={24}>
            <Form.Item
              label="Template Variables"
              name="variables"
              rules={[{ required: true, message: 'At least one variable is required' }]}
            >
              <TextArea 
                placeholder="Enter variables separated by commas (e.g., customer_name, invoice_date, total_amount)"
                rows={4}
              />
            </Form.Item>
          </Col>

          {/* Content/Template */}
          <Col span={24}>
            <Form.Item
              label="HTML Content"
              name="content"
              rules={[{ required: true, message: 'Template content is required' }]}
            >
              <TextArea 
                placeholder="Enter HTML template content with variable placeholders like {{variable_name}}"
                rows={8}
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default PDFTemplateFormPanel;