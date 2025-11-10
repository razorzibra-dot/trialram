/**
 * Companies Form Panel
 * Side drawer for creating and editing companies
 */

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Spin, message, Row, Col } from 'antd';
import { Company } from '@/types/masters';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

interface CompaniesFormPanelProps {
  company: Company | null;
  isOpen: boolean;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: Partial<Company>) => Promise<void>;
}



export const CompaniesFormPanel: React.FC<CompaniesFormPanelProps> = ({
  company,
  isOpen,
  mode,
  isLoading = false,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { getRefDataByCategory } = useReferenceData();
  const title = mode === 'create' ? 'Add New Company' : 'Edit Company';

  const sizeOptions = getRefDataByCategory('company_size').map(s => ({ 
    label: s.label, 
    value: s.key 
  }));
  
  const statusOptions = getRefDataByCategory('company_status').map(s => ({ 
    label: s.label, 
    value: s.key 
  }));

  useEffect(() => {
    if (isOpen && company && mode === 'edit') {
      form.setFieldsValue({
        name: company.name,
        industry: company.industry,
        email: company.email,
        phone: company.phone,
        website: company.website,
        address: company.address,
        size: company.size,
        status: company.status,
        registration_number: company.registration_number,
        tax_id: company.tax_id,
        founded_year: company.founded_year,
        notes: company.notes,
      });
    } else if (mode === 'create') {
      form.resetFields();
    }
  }, [isOpen, company, mode, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={550}
      destroyOnHidden
      styles={{ body: { padding: '24px' } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={isSaving} onClick={handleSave}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading} indicator={<LoadingSpinner text={isLoading ? 'Loading company data...' : undefined} />}>
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          {/* Company Name and Status Row */}
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Company Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter company name' },
                  { min: 2, message: 'Company name must be at least 2 characters' },
                ]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Status"
                name="status"
                initialValue="active"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select
                  options={statusOptions}
                  placeholder="Select status"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Industry and Size Row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Industry"
                name="industry"
                rules={[{ required: true, message: 'Please enter industry' }]}
              >
                <Input placeholder="e.g., Technology, Manufacturing" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Company Size"
                name="size"
                rules={[{ required: true, message: 'Please select size' }]}
              >
                <Select
                  options={sizeOptions}
                  placeholder="Select company size"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Email and Phone Row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input type="email" placeholder="company@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
              >
                <Input placeholder="+1 (555) 000-0000" />
              </Form.Item>
            </Col>
          </Row>

          {/* Website and Address Row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Website"
                name="website"
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input placeholder="123 Main St, City, State" />
              </Form.Item>
            </Col>
          </Row>

          {/* Registration Number and Tax ID Row */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Registration Number"
                name="registration_number"
              >
                <Input placeholder="Enter registration number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tax ID"
                name="tax_id"
              >
                <Input placeholder="Enter tax ID" />
              </Form.Item>
            </Col>
          </Row>

          {/* Founded Year */}
          <Form.Item
            label="Founded Year"
            name="founded_year"
          >
            <Input type="number" placeholder="e.g., 2020" />
          </Form.Item>

          {/* Notes */}
          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea 
              placeholder="Add any additional notes about this company"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};