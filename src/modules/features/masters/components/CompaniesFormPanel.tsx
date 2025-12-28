/**
 * Companies Form Panel
 * Side drawer for creating and editing companies
 */

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Spin, message, Row, Col, Card } from 'antd';
import { LockOutlined, SaveOutlined, CloseOutlined, BankOutlined, ContactsOutlined, FileTextOutlined } from '@ant-design/icons';

const sectionStyles = {
  card: { marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' },
  header: { display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' },
  headerIcon: { fontSize: 20, color: '#0ea5e9', marginRight: 10, fontWeight: 600 },
  headerTitle: { fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 },
};
import { Company } from '@/types/masters';
import { useAuth } from '@/contexts/AuthContext';
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

  // ✅ Base permissions for create/update actions (synchronous - consistent pattern)
  const { hasPermission } = useAuth();
  const canCreateCompany = hasPermission('crm:company:record:create');
  const canUpdateCompany = hasPermission('crm:company:record:update');
  const finalCanSaveCompany = mode === 'edit' ? canUpdateCompany : canCreateCompany;

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
      width={600}
      destroyOnHidden
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={handleClose} icon={<CloseOutlined />}>Cancel</Button>
          <Button
            type="primary"
            size="large"
            loading={isSaving}
            onClick={handleSave}
            disabled={!finalCanSaveCompany}
            icon={!finalCanSaveCompany ? <LockOutlined /> : <SaveOutlined />}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading} indicator={<LoadingSpinner text={isLoading ? 'Loading company data...' : undefined} />}>
        <div style={{ padding: '0 24px 24px 24px' }}>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <BankOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Company Details</h3>
              </div>

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
                    <Input size="large" placeholder="Enter company name" />
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
                      size="large"
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
                    <Input size="large" placeholder="e.g., Technology, Manufacturing" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Company Size"
                    name="size"
                    rules={[{ required: true, message: 'Please select size' }]}
                  >
                    <Select
                      size="large"
                      options={sizeOptions}
                      placeholder="Select company size"
                    />
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
                    <Input size="large" placeholder="Enter registration number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tax ID"
                    name="tax_id"
                  >
                    <Input size="large" placeholder="Enter tax ID" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Founded Year */}
              <Form.Item
                label="Founded Year"
                name="founded_year"
              >
                <Input size="large" type="number" placeholder="e.g., 2020" />
              </Form.Item>
            </Card>

            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <ContactsOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Contact Information</h3>
              </div>

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
                    <Input size="large" type="email" placeholder="company@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                  >
                    <Input size="large" placeholder="+1 (555) 000-0000" />
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
                    <Input size="large" placeholder="https://example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address"
                    name="address"
                  >
                    <Input size="large" placeholder="123 Main St, City, State" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card style={sectionStyles.card} variant="borderless">
              <div style={sectionStyles.header}>
                <FileTextOutlined style={sectionStyles.headerIcon} />
                <h3 style={sectionStyles.headerTitle}>Additional Information</h3>
              </div>

              {/* Notes */}
              <Form.Item
                label="Notes"
                name="notes"
              >
                <Input.TextArea 
                  placeholder="Add any additional notes about this company"
                  rows={3}
                  style={{ fontFamily: 'inherit' }}
                />
              </Form.Item>
            </Card>
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};