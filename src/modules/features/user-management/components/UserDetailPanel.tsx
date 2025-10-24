/**
 * User Detail Panel - Read-only Drawer
 * Displays user profile information
 */
import React from 'react';
import { Drawer, Descriptions, Row, Col, Avatar, Tag, Button, Space, Divider, Badge } from 'antd';
import { EditOutlined, MailOutlined, PhoneOutlined, CrownOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { User as UserType } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';

interface UserDetailPanelProps {
  user: UserType | null;
  open: boolean;
  onClose: () => void;
  onEdit: (user: UserType) => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  open,
  onClose,
  onEdit
}) => {
  const { hasPermission } = useAuth();

  if (!user) return null;

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <CrownOutlined />;
      case 'manager':
        return <EditOutlined />;
      case 'viewer':
        return <UserOutlined />;
      default:
        return <UserOutlined />;
    }
  };

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

  return (
    <Drawer
      title={`User Profile`}
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      extra={
        hasPermission('manage_users') && (
          <Space>
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
          </Space>
        )
      }
    >
      {/* User Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar
          size={80}
          src={user.avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
        />
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>
            {user.firstName} {user.lastName}
          </h2>
        </div>
        <Space wrap style={{ justifyContent: 'center' }}>
          <Tag icon={getRoleIcon(user.role)} color={getRoleColor(user.role)}>
            {user.role}
          </Tag>
          <Tag color={getStatusColor(user.status)}>
            {user.status?.toUpperCase()}
          </Tag>
        </Space>
      </div>

      <Divider />

      {/* User Information */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Contact Information</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
            {user.phone || '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      {/* Account Information */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Account Information</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Tenant">
            {user.tenantName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            <Tag icon={getRoleIcon(user.role)} color={getRoleColor(user.role)}>
              {user.role}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(user.status)}>
              {user.status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      {/* Login Information */}
      <div>
        <h4 style={{ marginBottom: 16, color: '#2C3E50' }}>Login Information</h4>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={<><CalendarOutlined /> Last Login</>}>
            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> Created</>}>
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  );
};

export default UserDetailPanel;