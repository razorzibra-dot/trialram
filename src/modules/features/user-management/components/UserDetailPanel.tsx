/**
 * User Detail Panel - Read-only Drawer
 * Displays user profile information
 * ✅ Uses UserDTO for type safety and layer synchronization
 */
import React from 'react';
import { Drawer, Descriptions, Row, Col, Avatar, Tag, Button, Space, Divider, Badge, Card, Empty, Spin, Tooltip } from 'antd';
import { EditOutlined, MailOutlined, PhoneOutlined, CrownOutlined, CalendarOutlined, UserOutlined, BankOutlined, IdcardOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { UserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';
import { useAuth } from '@/contexts/AuthContext';

interface UserDetailPanelProps {
  user: UserDTO | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onEdit?: (user: UserDTO) => void;
  onDelete?: (userId: string) => void;
  onResetPassword?: (userId: string) => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  open,
  loading = false,
  onClose,
  onEdit,
  onDelete,
  onResetPassword
}) => {
  const { hasPermission } = useAuth();

  // ⚠️ NOTE: These switch cases are for UI display only (icons/colors), not security checks.
  // For security checks, use permission-based checks (authService.hasPermission()).
  // These role names are acceptable for UI rendering as they're derived from database.
  const getRoleIcon = (role: UserRole): React.ReactNode => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <CrownOutlined />;
      case 'manager':
        return <EditOutlined />;
      case 'agent':
      case 'engineer':
        return <UserOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  // ⚠️ NOTE: UI display only - not used for security checks
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'super_admin':
        return 'volcano';
      case 'admin':
        return 'red';
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

  const getStatusColor = (status: UserStatus): string => {
    switch (status) {
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

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * ✅ Task 2.5: Get tenant display for super admins
   * Shows "Platform-Wide Super Admin" badge for super admins (tenantId=null)
   * Shows tenant ID for regular users
   */
  const getTenantDisplay = (): React.ReactNode => {
    // Super admin has null tenantId and isSuperAdmin=true
    if (user.isSuperAdmin || user.tenantId === null) {
      return (
        <Tag color="purple" icon={<CrownOutlined />}>
          Platform-Wide Super Admin
        </Tag>
      );
    }
    // Regular users have a tenant ID
    return <code style={{ fontSize: '11px' }}>{user.tenantId}</code>;
  };

  if (loading) {
    return (
      <Drawer
        title="User Profile"
        placement="right"
        onClose={onClose}
        open={open}
        width={550}
      >
        <Spin />
      </Drawer>
    );
  }

  if (!user) {
    return (
      <Drawer
        title="User Profile"
        placement="right"
        onClose={onClose}
        open={open}
        width={550}
      >
        <Empty description="No user selected" />
      </Drawer>
    );
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Drawer
      title={`User Profile`}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      footer={
        hasPermission('manage_users') && (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Close</Button>
            {onEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  onEdit(user);
                  onClose();
                }}
              >
                Edit
              </Button>
            )}
            {onResetPassword && (
              <Button
                icon={<LockOutlined />}
                onClick={() => {
                  onResetPassword(user.id);
                  onClose();
                }}
              >
                Reset Password
              </Button>
            )}
            {onDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  onDelete(user.id);
                  onClose();
                }}
              >
                Delete
              </Button>
            )}
          </Space>
        )
      }
    >
      {/* User Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar
          size={80}
          src={user.avatarUrl}
          style={{ backgroundColor: '#1890ff', marginBottom: 16, fontSize: 32, lineHeight: '80px' }}
        >
          {getInitials(user.name)}
        </Avatar>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, marginBottom: 8 }}>{user.name}</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{user.email}</p>
        </div>
        <Space wrap style={{ justifyContent: 'center', marginTop: 12 }}>
          <Tag icon={getRoleIcon(user.role)} color={getRoleColor(user.role)}>
            {user.role.replace(/_/g, ' ')}
          </Tag>
          <Tag color={getStatusColor(user.status)}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </Tag>
        </Space>
      </div>

      <Divider />

      {/* Contact Information */}
      <Card title="Contact Information" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            {user.email}
          </Descriptions.Item>
          {user.phone && (
            <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
              {user.phone}
            </Descriptions.Item>
          )}
          {user.mobile && (
            <Descriptions.Item label={<><PhoneOutlined /> Mobile</>}>
              {user.mobile}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Company Information */}
      {(user.companyName || user.department || user.position) && (
        <Card title="Company Information" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={1} size="small">
            {user.companyName && (
              <Descriptions.Item label={<><BankOutlined /> Company</>}>
                {user.companyName}
              </Descriptions.Item>
            )}
            {user.department && (
              <Descriptions.Item label="Department">
                {user.department}
              </Descriptions.Item>
            )}
            {user.position && (
              <Descriptions.Item label={<><IdcardOutlined /> Position</>}>
                {user.position}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Account Information */}
      <Card title="Account Information" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Role">
            <Tag icon={getRoleIcon(user.role)} color={getRoleColor(user.role)}>
              {user.role.replace(/_/g, ' ')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(user.status)}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tenant">
            {getTenantDisplay()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Activity Information */}
      <Card title="Activity Information" size="small">
        <Descriptions column={1} size="small">
          {user.lastLogin && (
            <Descriptions.Item label={<><CalendarOutlined /> Last Login</>}>
              {formatDate(user.lastLogin)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={<><CalendarOutlined /> Created</>}>
            {formatDate(user.createdAt)}
          </Descriptions.Item>
          {user.updatedAt && (
            <Descriptions.Item label="Last Updated">
              {formatDate(user.updatedAt)}
            </Descriptions.Item>
          )}
          {user.createdBy && (
            <Descriptions.Item label="Created By">
              <code style={{ fontSize: '11px' }}>{user.createdBy}</code>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Drawer>
  );
};

export default UserDetailPanel;