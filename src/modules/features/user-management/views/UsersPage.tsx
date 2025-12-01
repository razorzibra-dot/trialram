/**
 * Users Page - Modular Version
 * Enhanced user management with role-based access control
 * ✅ Uses UserDTO for type safety and layer synchronization
 * ✅ RBAC permission checks integrated (Phase 3.1)
 */
import React, { useState, useEffect, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
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
  Select,
  DatePicker,
  type MenuProps,
  type ColumnsType,
  type RangePickerProps
} from 'antd';
import { PermissionControlled } from '@/components/common/PermissionControlled';
import { usePermission } from '@/hooks/useElementPermissions';
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
  UserCheck,
  UserX
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { UserDTO, CreateUserDTO, UpdateUserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';
import { UserDetailPanel, UserFormPanel } from '../components';
import {
  useUsers,
  useUserStats,
  useTenants,
  useUserRoles,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
  usePermissions
} from '../hooks';

export const UsersPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    canCreate: canCreateUsers,
    canEdit: canEditUsers,
    canDelete: canDeleteUsers,
    canResetPassword: canResetPasswords,
    canManageUsers,
    isLoading: permLoading
  } = usePermissions();

  // Element-level permissions for user management (with fallback to record-level)
  const canViewUsers = usePermission('crm:user:list:view', 'accessible') || canCreateUsers;
  const canCreateUser = usePermission('crm:user:list:button.create', 'visible') || canCreateUsers;
  const canExportUsers = usePermission('crm:user:list:button.export', 'visible') || canCreateUsers;
  const canFilterUsers = usePermission('crm:user:list:filters', 'visible') || canCreateUsers;
  const canRefreshUsers = usePermission('crm:user:list:button.refresh', 'visible') || canCreateUsers;

  // Hooks for data fetching
  const { users, loading, refetch } = useUsers();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { tenants: allTenants } = useTenants();
  const { roles: allRoles } = useUserRoles();

  // State for UI
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterTenant, setFilterTenant] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  // Mutations - declared after state to avoid TDZ (Temporal Dead Zone) issues
  const createUser = useCreateUser();
  // Initialize with empty string - will be updated when selectedUser changes
  // Note: React Query mutations don't re-initialize, so we need to ensure
  // the user ID is always correct when calling the mutation
  const updateUser = useUpdateUser(selectedUser?.id || '');
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const allStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];

  // Filter users based on search text and filters
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Text search - email or name
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Role filter
    if (filterRole) {
      result = result.filter(user => user.role === filterRole);
    }
    
    // Status filter
    if (filterStatus) {
      result = result.filter(user => user.status === filterStatus);
    }
    
    // Tenant filter (for super-admin only)
    if (filterTenant) {
      result = result.filter(user => user.tenantId === filterTenant);
    }
    
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      endDate.setHours(23, 59, 59, 999); // Include entire end day
      result = result.filter(user => {
        const createdDate = new Date(user.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }
    
    return result;
  }, [users, searchText, filterRole, filterStatus, filterTenant, dateRange]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText('');
    setFilterRole(undefined);
    setFilterStatus(undefined);
    setFilterTenant(undefined);
    setDateRange(null);
  };

  // Data is automatically loaded by hooks

  // Handle create user
  const handleCreate = () => {
    setSelectedUser(null);
    setDrawerMode('create');
  };

  // Handle view user
  const handleView = (user: UserDTO) => {
    setSelectedUser(user);
    setDrawerMode('view');
  };

  // Handle edit user
  const handleEdit = (user: UserDTO) => {
    setSelectedUser(user);
    setDrawerMode('edit');
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedUser(null);
    refetch(); // Refresh users list
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteUser.mutateAsync(userId);
          message.success('User deleted successfully');
          refetch();
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
      await resetPassword.mutateAsync(userId);
      message.success('Password reset email sent to user');
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to reset password';
      message.error(error_msg);
    }
  };

  // Handle form save (create or update)
  const handleFormSave = async (values: CreateUserDTO | UpdateUserDTO) => {
    try {
      if (drawerMode === 'edit' && selectedUser) {
        // Ensure we have a valid user ID before updating
        if (!selectedUser.id) {
          message.error('Invalid user ID');
          return;
        }
        // Use the hook with the current selectedUser.id
        // The hook will be re-created when selectedUser changes due to useMemo
        await updateUser.mutateAsync(values as UpdateUserDTO);
        message.success('User updated successfully');
      } else if (drawerMode === 'create') {
        await createUser.mutateAsync(values as CreateUserDTO);
        message.success('User created successfully');
      }
      closeDrawer();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to save user';
      message.error(error_msg);
    }
  };

  // ⚠️ NOTE: These switch cases are for UI display only (icons/colors), not security checks.
  // For security checks, use permission-based checks (authService.hasPermission()).
  // These role names are acceptable for UI rendering as they're derived from database.
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <CrownOutlined />;
      case 'manager':
        return <SafetyOutlined />;
      case 'user':
        return <UserAntIcon />;
      default:
        return <TeamOutlined />;
    }
  };

  // ⚠️ NOTE: UI display only - not used for security checks
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'blue';
      case 'user':
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
            icon={<UserAntIcon />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 500, color: '#2C3E50' }}>
              {record.name}
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
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (companyName: string) => (
        <span style={{ color: '#2C3E50' }}>{companyName || '-'}</span>
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
        <UserActionButtons
          user={record}
          canEditUsers={canEditUsers}
          canDeleteUsers={canDeleteUsers}
          canResetPasswords={canResetPasswords}
          handleEdit={handleEdit}
          handleView={handleView}
          handleDelete={handleDelete}
          handleResetPassword={handleResetPassword}
        />
      )
    }
  ];

  // Calculate stats from userStats service (preferred) or fallback to users array
  // ✅ Use stats from service for accurate counts (includes all users, not just loaded page)
  const totalUsers = userStats?.totalUsers ?? users.length;
  const activeUsers = userStats?.activeUsers ?? users.filter(u => u.status === 'active').length;
  // ✅ Use usersByRole from stats service for accurate role counts
  const adminUsers = userStats?.usersByRole?.admin ?? users.filter(u => u.role === 'admin').length;
  const suspendedUsers = userStats?.suspendedUsers ?? users.filter(u => u.status === 'suspended').length;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading authentication..." />
      </div>
    );
  }

  // Check if user is authenticated
  // Show loading state while auth is being checked
  if (authLoading || permLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading permissions..." />
      </div>
    );
  }

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

  if (!canManageUsers) {
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
          canCreateUsers ? (
            <Space>
              {canRefreshUsers && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
              )}
              {canCreateUser && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  disabled={!canCreateUsers}
                >
                  Create User
                </Button>
              )}
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
          {/* Filter Controls */}
          {canFilterUsers && (
            <div style={{ marginBottom: 16, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space wrap>
              <Select
                placeholder="Filter by Role"
                style={{ width: 150 }}
                value={filterRole}
                onChange={setFilterRole}
                allowClear
                options={allRoles.map(role => ({ label: role, value: role }))}
              />
              <Select
                placeholder="Filter by Status"
                style={{ width: 150 }}
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
                options={allStatuses.map(status => ({ 
                  label: status.charAt(0).toUpperCase() + status.slice(1), 
                  value: status 
                }))}
              />
              {allTenants.length > 1 && (
                <Select
                  placeholder="Filter by Company"
                  style={{ width: 150 }}
                  value={filterTenant}
                  onChange={setFilterTenant}
                  allowClear
                  options={allTenants.map(tenant => ({ 
                    label: tenant.name, 
                    value: tenant.id 
                  }))}
                />
              )}
              <DatePicker.RangePicker
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                placeholder={['Start Date', 'End Date']}
                value={dateRange}
              />
              {(searchText || filterRole || filterStatus || filterTenant || dateRange) && (
                <Button onClick={handleClearFilters} type="default">
                  Clear Filters
                </Button>
              )}
            </Space>
          </div>
          )}
        </Card>

        {/* Users Table */}
        <Card
          style={{ marginTop: 16 }}
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
          user={selectedUser || undefined}
          onClose={closeDrawer}
          onSave={handleFormSave}
          loading={createUser.isPending || updateUser.isPending}
          allRoles={allRoles}
          allTenants={allTenants}
          allStatuses={allStatuses}
        />
      )}
    </>
  );
};

export default UsersPage;

interface UserActionButtonsProps {
  user: UserDTO;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canResetPasswords: boolean;
  handleEdit: (user: UserDTO) => void;
  handleView: (user: UserDTO) => void;
  handleDelete: (userId: string) => void;
  handleResetPassword: (userId: string) => void;
}

const UserActionButtons: React.FC<UserActionButtonsProps> = ({
  user,
  canEditUsers,
  canDeleteUsers,
  canResetPasswords,
  handleEdit,
  handleView,
  handleDelete,
  handleResetPassword
}) => {
  // Use element permissions with fallback to record-level permissions
  // If element-level permission is true, use it; otherwise fall back to record-level permission
  const elementEditPermission = usePermission(`crm:user.${user.id}:button.edit`, 'visible');
  const elementResetPermission = usePermission(`crm:user.${user.id}:button.resetpassword`, 'visible');
  const elementDeletePermission = usePermission(`crm:user.${user.id}:button.delete`, 'visible');
  
  // Element-level permission takes precedence if true, otherwise fall back to record-level
  const canEditButton = elementEditPermission || canEditUsers;
  const canResetButton = elementResetPermission || canResetPasswords;
  const canDeleteButton = elementDeletePermission || canDeleteUsers;

  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: 'View Profile',
      onClick: () => handleView(user),
    },
  ];

  if (canEditButton) {
    menuItems.push({
      key: 'edit',
      label: 'Edit User',
      icon: <EditOutlined />,
      onClick: () => handleEdit(user),
      disabled: !canEditUsers,
    });
  }

  if (canResetButton) {
    menuItems.push({
      key: 'reset',
      label: 'Reset Password',
      icon: <LockOutlined />,
      onClick: () => handleResetPassword(user.id),
      disabled: !canResetPasswords,
    });
  }

  if (canDeleteButton) {
    if (menuItems.length > 0) {
      menuItems.push({ type: 'divider' });
    }
    menuItems.push({
      key: 'delete',
      label: 'Delete User',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(user.id),
      disabled: !canDeleteUsers,
    });
  }

  const hasMenuActions = menuItems.length > 1 || Boolean(menuItems.find((item) => item.key !== 'view'));

  return (
    <Space>
      {canEditUsers && (
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(user)}
            disabled={!canEditButton}
          />
        </Tooltip>
      )}
      {hasMenuActions && (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      )}
    </Space>
  );
};