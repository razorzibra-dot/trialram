/**
 * Super Admin Users Page - Enterprise Ant Design Version
 * Cross-tenant user management for super administrators
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Select,
  message,
  Empty,
  Tooltip,
  Badge,
  Dropdown,
  Descriptions,
  type MenuProps
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CrownOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  LockOutlined,
  ReloadOutlined,
  ExportOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { tenantService } from '@/services/tenantService';
import { User } from '@/types/auth';
import { Tenant } from '@/types/rbac';

const { Option } = Select;

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  tenantId: string;
}

export const SuperAdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const [form] = Form.useForm();

  // Check super admin permission
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, tenantsData] = await Promise.all([
        userService.getUsers(),
        tenantService.getTenants()
      ]);
      setUsers(usersData);
      setTenants(tenantsData);
    } catch (error) {
      message.error('Failed to load data');
      console.error('Error loading data:', error);
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
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId
    });
    setIsModalVisible(true);
  };

  // Handle view details
  const handleViewDetails = (user: User) => {
    setViewingUser(user);
    setIsDetailModalVisible(true);
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      message.success('User deleted successfully');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user');
    }
  };

  // Handle reset password
  const handleResetPassword = async (userId: string) => {
    try {
      await userService.resetPassword(userId);
      message.success('Password reset email sent successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to reset password');
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
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <CrownOutlined style={{ color: '#722ed1' }} />;
      case 'admin':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'manager':
        return <SafetyOutlined style={{ color: '#1890ff' }} />;
      default:
        return <UserOutlined style={{ color: '#52c41a' }} />;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'purple';
      case 'admin':
        return 'gold';
      case 'manager':
        return 'blue';
      case 'agent':
        return 'cyan';
      case 'engineer':
        return 'green';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  // Action menu items
  const getActionMenu = (user: User): MenuProps['items'] => [
    {
      key: 'view',
      label: 'View Details',
      icon: <UserOutlined />,
      onClick: () => handleViewDetails(user)
    },
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
      onClick: () => {
        Modal.confirm({
          title: 'Reset Password',
          content: `Send password reset email to ${user.email}?`,
          okText: 'Send',
          onOk: () => handleResetPassword(user.id)
        });
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete User',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: user.id === currentUser?.id,
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
  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            {record.firstName?.[0]}{record.lastName?.[0]}
          </div>
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
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        `${record.firstName} ${record.lastName}`.toLowerCase().includes((value as string).toLowerCase()) ||
        record.email.toLowerCase().includes((value as string).toLowerCase())
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 180,
      render: (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        return (
          <Space>
            <GlobalOutlined style={{ color: '#1890ff' }} />
            <span>{tenant?.name || tenantId}</span>
          </Space>
        );
      },
      filters: tenants.map(t => ({ text: t.name, value: t.id })),
      filteredValue: selectedTenant !== 'all' ? [selectedTenant] : null,
      onFilter: (value, record) => record.tenantId === value
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) => (
        <Tag icon={getRoleIcon(role)} color={getRoleColor(role)}>
          {role.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Super Admin', value: 'super_admin' },
        { text: 'Admin', value: 'admin' },
        { text: 'Manager', value: 'manager' },
        { text: 'Agent', value: 'agent' },
        { text: 'Engineer', value: 'engineer' },
        { text: 'Customer', value: 'customer' }
      ],
      filteredValue: selectedRole !== 'all' ? [selectedRole] : null,
      onFilter: (value, record) => record.role === value
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) =>
        phone ? (
          <Space>
            <PhoneOutlined style={{ color: '#1890ff' }} />
            <span>{phone}</span>
          </Space>
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag
          color={getStatusColor(status)}
          icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Suspended', value: 'suspended' }
      ],
      filteredValue: selectedStatus !== 'all' ? [selectedStatus] : null,
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (lastLogin: string) =>
        lastLogin ? (
          <Space>
            <ClockCircleOutlined style={{ color: '#7A8691' }} />
            <span style={{ color: '#7A8691' }}>
              {new Date(lastLogin).toLocaleString()}
            </span>
          </Space>
        ) : (
          <span style={{ color: '#d9d9d9' }}>Never</span>
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
        </Space>
      )
    }
  ];

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const superAdmins = users.filter(u => u.role === 'super_admin').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  // Filtered users
  const filteredUsers = users.filter(user => {
    if (searchText && !(`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    if (selectedTenant !== 'all' && user.tenantId !== selectedTenant) {
      return false;
    }
    if (selectedRole !== 'all' && user.role !== selectedRole) {
      return false;
    }
    if (selectedStatus !== 'all' && user.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Check if user is super admin
  if (!isSuperAdmin) {
    return (
      <EnterpriseLayout>
        <PageHeader
          title="Super Admin Users"
          description="Cross-tenant user management"
          breadcrumbs={[
            { title: 'Home', path: '/' },
            { title: 'Super Admin', path: '/super-admin' },
            { title: 'Users' }
          ]}
        />
        <div style={{ padding: 24 }}>
          <Card>
            <Empty
              description="Super Admin access required"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </Empty>
          </Card>
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Super Admin Users"
        description="Cross-tenant user management"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'Super Admin', path: '/super-admin' },
          { title: 'Users' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add User
            </Button>
          </Space>
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
              title="Super Admins"
              value={superAdmins}
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
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by tenant"
                value={selectedTenant}
                onChange={setSelectedTenant}
              >
                <Option value="all">All Tenants</Option>
                {tenants.map(tenant => (
                  <Option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by role"
                value={selectedRole}
                onChange={setSelectedRole}
              >
                <Option value="all">All Roles</Option>
                <Option value="super_admin">Super Admin</Option>
                <Option value="admin">Admin</Option>
                <Option value="manager">Manager</Option>
                <Option value="agent">Agent</Option>
                <Option value="engineer">Engineer</Option>
                <Option value="customer">Customer</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by status"
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1600 }}
            pagination={{
              total: filteredUsers.length,
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
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Add First User
                  </Button>
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
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                <Input prefix={<UserOutlined />} placeholder="Enter first name" size="large" />
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
                <Input prefix={<UserOutlined />} placeholder="Enter last name" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter email"
              size="large"
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" size="large" />
          </Form.Item>

          <Form.Item
            name="tenantId"
            label="Tenant"
            rules={[{ required: true, message: 'Please select tenant' }]}
          >
            <Select
              placeholder="Select tenant"
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {tenants.map(tenant => (
                <Option key={tenant.id} value={tenant.id}>
                  <Space>
                    <GlobalOutlined />
                    {tenant.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role" size="large">
                  <Option value="super_admin">
                    <Space>
                      <CrownOutlined style={{ color: '#722ed1' }} />
                      Super Admin
                    </Space>
                  </Option>
                  <Option value="admin">
                    <Space>
                      <CrownOutlined style={{ color: '#faad14' }} />
                      Admin
                    </Space>
                  </Option>
                  <Option value="manager">
                    <Space>
                      <SafetyOutlined style={{ color: '#1890ff' }} />
                      Manager
                    </Space>
                  </Option>
                  <Option value="agent">
                    <Space>
                      <UserOutlined style={{ color: '#52c41a' }} />
                      Agent
                    </Space>
                  </Option>
                  <Option value="engineer">
                    <Space>
                      <UserOutlined style={{ color: '#52c41a' }} />
                      Engineer
                    </Space>
                  </Option>
                  <Option value="customer">
                    <Space>
                      <UserOutlined style={{ color: '#52c41a' }} />
                      Customer
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
                icon={editingUser ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        title="User Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {viewingUser && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Name">
              {viewingUser.firstName} {viewingUser.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{viewingUser.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{viewingUser.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Tenant">
              {tenants.find(t => t.id === viewingUser.tenantId)?.name || viewingUser.tenantId}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag icon={getRoleIcon(viewingUser.role)} color={getRoleColor(viewingUser.role)}>
                {viewingUser.role.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={getStatusColor(viewingUser.status)}
                icon={viewingUser.status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {viewingUser.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : 'Never'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(viewingUser.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </EnterpriseLayout>
  );
};

export default SuperAdminUsersPage;