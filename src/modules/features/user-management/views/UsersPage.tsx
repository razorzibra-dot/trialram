/**
 * Users Page - Modular Version
 * Enhanced user management with role-based access control
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Spin,
  Alert,
  Modal,
  Avatar,
  Tooltip,
  Dropdown,
  Input,
  message,
  Empty,
  type MenuProps,
  type ColumnsType
} from 'antd';
import { 
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  LockOutlined,
  MoreOutlined,
  CrownOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined as UserAntIcon
} from '@ant-design/icons';
import { 
  Users as UsersIcon,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { useService } from '@/modules/core/hooks/useService';
import { User as UserType } from '@/types/crm';
import { UserDetailPanel } from '../components/UserDetailPanel';
import { UserFormPanel } from '../components/UserFormPanel';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  status: string;
  tenantId: string;
}

export const UsersPage: React.FC = () => {
  const { hasPermission, isAuthenticated, isLoading: authLoading } = useAuth();
  const userService = useService<any>('userService');
  
  // State
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allTenants, setAllTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [allRoles, setAllRoles] = useState<string[]>(['Admin', 'Manager', 'Viewer']);
  const [allStatuses] = useState<string[]>(['active', 'inactive', 'suspended']);

  // Load users and metadata on component mount
  // Note: Service layer handles authorization via RLS (Supabase) or database rules (mock)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadUsers();
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const tenants = await userService.getTenants();
      const roles = await userService.getRoles();
      setAllTenants(tenants || []);
      setAllRoles(roles || ['Admin', 'Manager', 'Viewer']);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch (error) {
      message.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create user
  const handleCreate = () => {
    setSelectedUser(null);
    setDrawerMode('create');
  };

  // Handle view user
  const handleView = (user: UserType) => {
    setSelectedUser(user);
    setDrawerMode('view');
  };

  // Handle edit user
  const handleEdit = (user: UserType) => {
    setSelectedUser(user);
    setDrawerMode('edit');
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedUser(null);
  };

  // Handle delete user
  const handleDelete = async (userId: string, userName: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${userName}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.deleteUser(userId);
          message.success('User deleted successfully');
          loadUsers();
        } catch (error: unknown) {
          const error_msg = error instanceof Error ? error.message : 'Failed to delete user';
          message.error(error_msg);
        }
      }
    });
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

  // Handle form save
  const handleFormSave = async (values: UserFormData) => {
    try {
      setIsSaving(true);
      if (drawerMode === 'edit' && selectedUser) {
        await userService.updateUser(selectedUser.id, values);
        message.success('User updated successfully');
      } else if (drawerMode === 'create') {
        await userService.createUser(values);
        message.success('User created successfully');
      }
      closeDrawer();
      loadUsers();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to save user';
      message.error(error_msg);
    } finally {
      setIsSaving(false);
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
        return <UserAntIcon />;
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
  const getActionMenu = (user: UserType): MenuProps['items'] => [
    {
      key: 'view',
      label: 'View Profile',
      onClick: () => handleView(user)
    },
    {
      key: 'edit',
      label: 'Edit User',
      icon: <EditOutlined />,
      onClick: () => handleEdit(user),
      disabled: !hasPermission('manage_users')
    },
    {
      key: 'reset',
      label: 'Reset Password',
      icon: <LockOutlined />,
      onClick: () => handleResetPassword(user.id),
      disabled: !hasPermission('manage_users')
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete User',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(user.id, `${user.firstName} ${user.lastName}`),
      disabled: !hasPermission('manage_users')
    }
  ];

  // Filtered users
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns: ColumnsType<UserType> = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserAntIcon />}
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
          {lastLogin ? new Date(lastLogin).toLocaleString() : 'Never'}
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
  const adminUsers = users.filter(u => u.role === 'Admin').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading authentication..." />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Authentication Required"
          description="Please log in to access user management."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (!hasPermission('manage_users')) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access user management."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts and access control"
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
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create User
              </Button>
            </Space>
          ) : null
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<UsersIcon />}
              color="primary"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={<UserCheck />}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Admin Users"
              value={adminUsers}
              icon={<CrownOutlined />}
              color="warning"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Suspended"
              value={suspendedUsers}
              icon={<UserX />}
              color="error"
            />
          </Col>
        </Row>

        {/* Users Table */}
        <Card
          title="Users"
          extra={
            <Space>
              <Input.Search
                placeholder="Search by name or email..."
                allowClear
                style={{ width: 250 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Space>
          }
        >
          <Spin spinning={loading} tip="Loading users...">
            {filteredUsers.length === 0 && !loading ? (
              <Empty
                description="No users found"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} users`
                }}
                scroll={{ x: 1200 }}
              />
            )}
          </Spin>
        </Card>
      </div>

      {/* User Detail Drawer */}
      {drawerMode === 'view' && selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          open={true}
          onClose={closeDrawer}
          onEdit={handleEdit}
        />
      )}

      {/* User Form Drawer - Create/Edit */}
      {(drawerMode === 'create' || drawerMode === 'edit') && (
        <UserFormPanel
          open={true}
          mode={drawerMode}
          user={selectedUser}
          onClose={closeDrawer}
          onSave={handleFormSave}
          loading={isSaving}
          allRoles={allRoles}
          allTenants={allTenants}
          allStatuses={allStatuses}
        />
      )}
    </>
  );
};

export default UsersPage;