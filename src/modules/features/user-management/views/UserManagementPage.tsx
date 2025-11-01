/**
 * User Management Page - Enterprise Ant Design Version
 * Comprehensive user management with role assignment and activity tracking
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Row,
  Col,
  Popconfirm,
  message,
  Empty,
  Spin,
  Tooltip,
  Badge,
  Dropdown,
  type MenuProps
} from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
  CrownOutlined,
  SafetyOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import type { UserDTO, CreateUserDTO, UpdateUserDTO } from '@/types/dtos/userDtos';

const { Option } = Select;

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const userService = useService<any>('userService');
  const [form] = Form.useForm();

  // State
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load users
   
  React.useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, tenantFilter, searchText]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        tenantId: tenantFilter || undefined,
        search: searchText || undefined
      });
      setUsers(data);
    } catch (error) {
      message.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create user
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit user
  const handleEdit = (user: UserDTO) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      status: user.status,
      tenantId: user.tenantId
    });
    setIsModalVisible(true);
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      message.success('User deleted successfully');
      loadUsers();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to delete user';
      message.error(error_msg);
    }
  };

  // Handle reset password
  const handleResetPassword = async (userId: string) => {
    try {
      await userService.resetPassword(userId);
      message.success('Password reset email sent');
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to reset password';
      message.error(error_msg);
    }
  };

  // Handle form submit
  const handleSubmit = async (values: UserFormData) => {
    try {
      setSubmitting(true);
      if (editingUser) {
        await userService.updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await userService.createUser(values);
        message.success('User created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadUsers();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to save user';
      message.error(error_msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <CrownOutlined />;
      case 'manager':
        return <SafetyOutlined />;
      case 'viewer':
        return <UserOutlined />;
      default:
        return <TeamOutlined />;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'blue';
      case 'viewer':
        return 'default';
      default:
        return 'green';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  // Action menu items
  const getActionMenu = (user: UserDTO): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit User',
      icon: <EditOutlined />,
      onClick: () => handleEdit(user)
    },
    {
      key: 'reset',
      label: 'Reset Password',
      icon: <LockOutlined />,
      onClick: () => handleResetPassword(user.id)
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete User',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Delete User',
          content: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => handleDelete(user.id)
        });
      }
    }
  ];

  // Table columns
  const columns: ColumnsType<UserDTO> = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            src={record.avatarUrl}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 500, color: '#2C3E50' }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#7A8691' }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag icon={getRoleIcon(role)} color={getRoleColor(role)}>
          {role}
        </Tag>
      )
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 180,
      render: (tenantName: string) => (
        <span style={{ color: '#2C3E50' }}>{tenantName}</span>
      )
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => (
        phone ? (
          <span style={{ color: '#7A8691' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {phone}
          </span>
        ) : (
          <span style={{ color: '#9EAAB7' }}>-</span>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (lastLogin: string) => (
        <span style={{ color: '#7A8691' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {new Date(lastLogin).toLocaleString()}
        </span>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => (
        <span style={{ color: '#7A8691' }}>
          {new Date(createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          {hasPermission('manage_users') && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </>
          )}
        </Space>
      )
    }
  ];

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'User Management' }
        ]}
        extra={
          hasPermission('manage_users') ? (
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadUsers}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
              >
                Export
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleCreate}
              >
                Add User
              </Button>
            </Space>
          ) : undefined
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<TeamOutlined />}
              color="primary"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={<UserOutlined />}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Administrators"
              value={adminUsers}
              icon={<CrownOutlined />}
              color="warning"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Suspended"
              value={suspendedUsers}
              icon={<LockOutlined />}
              color="error"
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Search by name, email, or tenant..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Role"
                style={{ width: '100%' }}
                value={roleFilter || undefined}
                onChange={setRoleFilter}
                allowClear
              >
                <Option value="">All Roles</Option>
                <Option value="Admin">Admin</Option>
                <Option value="Manager">Manager</Option>
                <Option value="Viewer">Viewer</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Status"
                style={{ width: '100%' }}
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Filter by Tenant"
                style={{ width: '100%' }}
                value={tenantFilter || undefined}
                onChange={setTenantFilter}
                allowClear
              >
                <Option value="">All Tenants</Option>
                <Option value="tenant_1">Acme Corporation</Option>
                <Option value="tenant_2">TechStart Inc</Option>
                <Option value="tenant_3">Global Solutions Ltd</Option>
                <Option value="tenant_4">Innovation Labs</Option>
                <Option value="tenant_5">Enterprise Systems</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              total: users.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} users`
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No users found"
                >
                  {hasPermission('manage_users') && (
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      onClick={handleCreate}
                    >
                      Add First User
                    </Button>
                  )}
                </Empty>
              )
            }}
          />
        </Card>
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: 'Please enter first name' },
                  { min: 2, message: 'First name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter first name"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  { required: true, message: 'Please enter last name' },
                  { min: 2, message: 'Last name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter last name"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter email address"
              size="large"
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Enter phone number"
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select
                  placeholder="Select role"
                  size="large"
                >
                  <Option value="Admin">
                    <Space>
                      <CrownOutlined />
                      Admin
                    </Space>
                  </Option>
                  <Option value="Manager">
                    <Space>
                      <SafetyOutlined />
                      Manager
                    </Space>
                  </Option>
                  <Option value="Viewer">
                    <Space>
                      <UserOutlined />
                      Viewer
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <Select
                  placeholder="Select status"
                  size="large"
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tenantId"
            label="Tenant"
            rules={[{ required: true, message: 'Please select a tenant' }]}
          >
            <Select
              placeholder="Select tenant"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="tenant_1">Acme Corporation</Option>
              <Option value="tenant_2">TechStart Inc</Option>
              <Option value="tenant_3">Global Solutions Ltd</Option>
              <Option value="tenant_4">Innovation Labs</Option>
              <Option value="tenant_5">Enterprise Systems</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={editingUser ? <EditOutlined /> : <UserAddOutlined />}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserManagementPage;