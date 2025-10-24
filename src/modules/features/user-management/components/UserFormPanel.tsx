/**
 * User Form Panel - Create/Edit Drawer
 * Form for creating or editing user information
 */
import React from 'react';
import { Drawer, Form, Input, Select, Button, Space, Row, Col, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { User as UserType } from '@/types/crm';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  status: string;
  tenantId: string;
}

interface UserFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserType | null;
  onClose: () => void;
  onSave: (values: UserFormData) => Promise<void>;
  loading: boolean;
  allRoles: string[];
  allTenants: Array<{ id: string; name: string }>;
  allStatuses: string[];
}

export const UserFormPanel: React.FC<UserFormPanelProps> = ({
  open,
  mode,
  user,
  onClose,
  onSave,
  loading,
  allRoles,
  allTenants,
  allStatuses
}) => {
  const [form] = Form.useForm();

  const handleFormChange = () => {
    // Form change handler
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields() as UserFormData;
      await onSave(values);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const title = mode === 'create' ? 'Create New User' : 'Edit User';

  return (
    <Drawer
      title={title}
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
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
        onValuesChange={handleFormChange}
        autoComplete="off"
      >
        <Row gutter={16}>
          {/* Email */}
          <Col span={24}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email format' }
              ]}
            >
              <Input
                type="email"
                placeholder="user@example.com"
                disabled={mode === 'edit'}
              />
            </Form.Item>
          </Col>

          {/* First Name */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input placeholder="John" />
            </Form.Item>
          </Col>

          {/* Last Name */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input placeholder="Doe" />
            </Form.Item>
          </Col>

          {/* Phone */}
          <Col span={24}>
            <Form.Item
              label="Phone"
              name="phone"
            >
              <Input placeholder="+1 (555) 000-0000" />
            </Form.Item>
          </Col>

          {/* Role */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Role is required' }]}
            >
              <Select placeholder="Select a role">
                {allRoles.map(role => (
                  <Select.Option key={role} value={role}>
                    {role}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Status */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Status is required' }]}
            >
              <Select placeholder="Select a status">
                {allStatuses.map(status => (
                  <Select.Option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Tenant */}
          <Col span={24}>
            <Form.Item
              label="Tenant"
              name="tenantId"
              rules={[{ required: true, message: 'Tenant is required' }]}
            >
              <Select placeholder="Select a tenant">
                {allTenants.map(tenant => (
                  <Select.Option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default UserFormPanel;