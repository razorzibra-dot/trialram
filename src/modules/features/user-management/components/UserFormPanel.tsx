/**
 * User Form Panel - Create/Edit Drawer
 * Form for creating or editing user information
 * ✅ Uses UserDTO for type safety and layer synchronization
 * ✅ RBAC permission checks integrated (Layer 3.1)
 */
import React, { useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Row, Col, message, Tooltip, Card, Alert } from 'antd';
import { SaveOutlined, CloseOutlined, InfoCircleOutlined, MailOutlined, UserOutlined, PhoneOutlined, TeamOutlined, BankOutlined, IdcardOutlined, LockOutlined } from '@ant-design/icons';
import { UserDTO, CreateUserDTO, UpdateUserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';
import { usePermissions } from '../hooks/usePermissions';

interface UserFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserDTO | null;
  onClose: () => void;
  onSave: (values: CreateUserDTO | UpdateUserDTO) => Promise<void>;
  loading: boolean;
  allRoles: UserRole[];
  allTenants: Array<{ id: string; name: string }>;
  allStatuses: UserStatus[];
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
  const [form] = Form.useForm<CreateUserDTO | UpdateUserDTO>();
  const { canCreateUsers, canEditUsers } = usePermissions();

  // Check if user has permission for this operation
  const hasPermission = useMemo(() => {
    if (mode === 'create') return canCreateUsers;
    if (mode === 'edit') return canEditUsers;
    return false;
  }, [mode, canCreateUsers, canEditUsers]);

  // Initialize form with user data when editing
  useEffect(() => {
    if (open && mode === 'edit' && user) {
      form.setFieldsValue({
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        mobile: user.mobile,
        companyName: user.companyName,
        department: user.department,
        position: user.position,
      });
    } else if (open && mode === 'create') {
      form.resetFields();
    }
  }, [open, mode, user, form]);

  const handleSave = async () => {
    try {
      // Verify permission before allowing save
      if (!hasPermission) {
        message.error(`You do not have permission to ${mode} users`);
        return;
      }

      const values = await form.validateFields();
      
      // Convert form values to appropriate DTO
      const data: CreateUserDTO | UpdateUserDTO = {
        name: values.name,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role as UserRole,
        status: values.status as UserStatus,
        phone: values.phone,
        mobile: values.mobile,
        companyName: values.companyName,
        department: values.department,
        position: values.position,
      };
      
      await onSave(data);
      message.success(mode === 'create' ? 'User created successfully!' : 'User updated successfully!');
      form.resetFields();
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message !== 'validateFields error') {
        message.error(error.message || (mode === 'create' ? 'Failed to create user' : 'Failed to update user'));
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
          <Button onClick={onClose} disabled={loading || !hasPermission}>
            <CloseOutlined /> Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSave}
            icon={<SaveOutlined />}
            disabled={!hasPermission}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </Space>
      }
    >
      {!hasPermission && (
        <Alert
          message="Permission Denied"
          description={`You do not have permission to ${mode} users. Please contact your administrator.`}
          type="error"
          icon={<LockOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        disabled={!hasPermission}
      >
        {/* Account Information Section */}
        <Card title="Account Information" style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            {/* Email - Read-only in edit mode */}
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Email <Tooltip title="Required. Valid email, max 255 chars. Unique per tenant. Cannot change after creation."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Invalid email format' },
                  { max: 255, message: 'Max 255 characters' }
                ]}
              >
                <Input
                  type="email"
                  placeholder="user@example.com"
                  prefix={<MailOutlined />}
                  disabled={mode === 'edit'}
                  maxLength={255}
                />
              </Form.Item>
            </Col>

            {/* Role - Required */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Role <Tooltip title="User role in the system. Determines permissions."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="role"
                rules={[{ required: true, message: 'Role is required' }]}
              >
                <Select placeholder="Select a role">
                  {allRoles.map(role => (
                    <Select.Option key={role} value={role}>
                      {role.replace(/_/g, ' ').charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Status - Required */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Status <Tooltip title="Account status: active, inactive, or suspended."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
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
          </Row>
        </Card>

        {/* Personal Information Section */}
        <Card title="Personal Information" style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            {/* Full Name */}
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Full Name <Tooltip title="Display name. Required. Max 255 chars."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="name"
                rules={[
                  { required: true, message: 'Full name is required' },
                  { max: 255, message: 'Max 255 characters' }
                ]}
              >
                <Input placeholder="John Doe" maxLength={255} />
              </Form.Item>
            </Col>

            {/* First Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    First Name <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="firstName"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input placeholder="John" maxLength={100} />
              </Form.Item>
            </Col>

            {/* Last Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Last Name <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="lastName"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input placeholder="Doe" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Contact Information Section */}
        <Card title="Contact Information" style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            {/* Phone */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Phone <Tooltip title="Optional. Max 50 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="phone"
                rules={[{ max: 50, message: 'Max 50 characters' }]}
              >
                <Input placeholder="+1 (555) 000-0000" prefix={<PhoneOutlined />} maxLength={50} />
              </Form.Item>
            </Col>

            {/* Mobile */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Mobile <Tooltip title="Optional. Max 50 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="mobile"
                rules={[{ max: 50, message: 'Max 50 characters' }]}
              >
                <Input placeholder="+1 (555) 000-0001" prefix={<PhoneOutlined />} maxLength={50} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Company Information Section */}
        <Card title="Company Information" style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            {/* Company Name */}
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Company Name <Tooltip title="Optional. Max 255 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="companyName"
                rules={[{ max: 255, message: 'Max 255 characters' }]}
              >
                <Input placeholder="Acme Corporation" prefix={<BankOutlined />} maxLength={255} />
              </Form.Item>
            </Col>

            {/* Department */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Department <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="department"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input placeholder="Sales" maxLength={100} />
              </Form.Item>
            </Col>

            {/* Position */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Position <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="position"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input placeholder="Manager" prefix={<IdcardOutlined />} maxLength={100} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Drawer>
  );
};

export default UserFormPanel;