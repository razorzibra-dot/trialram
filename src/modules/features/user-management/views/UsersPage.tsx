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
  Popconfirm
} from 'antd';
import { 
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { 
  Users as UsersIcon,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import { PageHeader, StatCard } from '@/components/common';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual user fetching
      setUsers([]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission('manage_users')) {
    return (
      <>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access user management."
            type="error"
            showIcon
          />
        </div>
      </>
    );
  }

  const stats = {
    total: users.length,
    active: users.filter((u: any) => u.status === 'active').length,
    inactive: users.filter((u: any) => u.status === 'inactive').length,
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            padding: 8, 
            background: '#DBEAFE', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={16} color="#1E40AF" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => console.log('View user:', record.id)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => console.log('Edit user:', record.id)}
          />
          <Popconfirm
            title="Delete user"
            description="Are you sure you want to delete this user?"
            onConfirm={() => console.log('Delete user:', record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage users and their roles"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'User Management' }
        ]}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={fetchUsers}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => console.log('Create user')}
            >
              Create User
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              title="Total Users"
              value={stats.total}
              icon={UsersIcon}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              title="Active Users"
              value={stats.active}
              icon={UserCheck}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              title="Inactive Users"
              value={stats.inactive}
              icon={UserX}
              color="error"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Users Table */}
        <Card 
          title={`Users (${users.length})`}
          extra={<span style={{ color: '#6B7280', fontWeight: 'normal' }}>Manage all users in the system</span>}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="Loading users..." />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <UsersIcon size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No users found</h3>
              <p style={{ color: '#6B7280', marginBottom: 16 }}>
                Get started by creating your first user
              </p>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => console.log('Create user')}
              >
                Create User
              </Button>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} users`,
              }}
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default UsersPage;