/**
 * Permission Matrix Page - Enterprise Ant Design Version
 * Comprehensive permission matrix view with role-permission mapping
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Empty,
  Checkbox,
  Row,
  Col,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Switch,
  Spin
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyOutlined,
  ExportOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { usePermissions } from '../hooks';
import { UserPermission } from '../guards/permissionGuards';
import { Role, Permission } from '@/types/rbac';

interface PermissionMatrixRow {
  key: string;
  category: string;
  permissionId: string;
  permissionName: string;
  permissionDescription: string;
  [roleId: string]: unknown; // Dynamic role columns
}

interface RBACService {
  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
  updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
}

export const PermissionMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canManageRoles, isLoading: permLoading } = usePermissions();
  const rbacService = useService<RBACService>('rbacService');

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [matrixData, setMatrixData] = useState<PermissionMatrixRow[]>([]);
  const [changes, setChanges] = useState<Map<string, Set<string>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [showSystemRoles, setShowSystemRoles] = useState(true);

  // Build matrix data
  const buildMatrixData = React.useCallback((rolesData: Role[], permissionsData: Permission[]) => {
    const matrix: PermissionMatrixRow[] = permissionsData.map(permission => {
      const row: PermissionMatrixRow = {
        key: permission.id,
        category: permission.category,
        permissionId: permission.id,
        permissionName: permission.name,
        permissionDescription: permission.description
      };

      // Add role columns
      rolesData.forEach(role => {
        row[role.id] = role.permissions.includes(permission.id);
      });

      return row;
    });

    setMatrixData(matrix);
  }, []);

  // Load data function
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions()
      ]);
      
      // Filter roles based on showSystemRoles
      const filteredRoles = showSystemRoles 
        ? rolesData 
        : rolesData.filter(r => !r.is_system_role);
      
      setRoles(filteredRoles);
      setPermissions(permissionsData);
      buildMatrixData(filteredRoles, permissionsData);
    } catch (error) {
      message.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [showSystemRoles, buildMatrixData, rbacService]);

  // Load data on component mount and when showSystemRoles changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, roleId: string, checked: boolean) => {
    if (!canManageRoles) {
      message.warning('You do not have permission to modify roles');
      return;
    }

    const role = roles.find(r => r.id === roleId);
    if (role?.is_system_role) {
      message.warning('System roles cannot be modified');
      return;
    }

    // Update matrix data
    setMatrixData(prev =>
      prev.map(row =>
        row.permissionId === permissionId
          ? { ...row, [roleId]: checked }
          : row
      )
    );

    // Track changes
    setChanges(prev => {
      const newChanges = new Map(prev);
      if (!newChanges.has(roleId)) {
        newChanges.set(roleId, new Set());
      }
      newChanges.get(roleId)!.add(permissionId);
      return newChanges;
    });
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      message.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      
      // Update each modified role
      for (const [roleId, modifiedPermissions] of changes.entries()) {
        const role = roles.find(r => r.id === roleId);
        if (!role || role.is_system_role) continue;

        // Get current permissions for this role from matrix
        const newPermissions = matrixData
          .filter(row => row[roleId] === true)
          .map(row => row.permissionId);

        await rbacService.updateRole(roleId, {
          name: role.name,
          description: role.description,
          permissions: newPermissions
        });
      }

      message.success('Changes saved successfully');
      setChanges(new Map());
      loadData();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to save changes';
      message.error(error_msg);
    } finally {
      setSaving(false);
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    setChanges(new Map());
    loadData();
    message.info('Changes discarded');
  };

  // Export matrix
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Permission', 'Category', 'Description', ...roles.map(r => r.name)];
      const rows = matrixData.map(row => [
        row.permissionName,
        row.category,
        row.permissionDescription,
        ...roles.map(role => row[role.id] ? 'Yes' : 'No')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `permission-matrix-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('Permission matrix exported successfully');
    } catch (error) {
      message.error('Failed to export permission matrix');
      console.error('Export error:', error);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Calculate stats
  const totalPermissions = permissions.length;
  const totalRoles = roles.length;
  const systemRoles = roles.filter(r => r.is_system_role).length;
  const customRoles = roles.filter(r => !r.is_system_role).length;
  const totalAssignments = matrixData.reduce((sum, row) => {
    return sum + roles.filter(role => row[role.id] === true).length;
  }, 0);

  // Table columns
  const columns: ColumnsType<PermissionMatrixRow> = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      fixed: 'left',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Tag>
      ),
      filters: Object.keys(groupedPermissions).map(cat => ({
        text: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: cat
      })),
      onFilter: (value, record) => record.category === value
    },
    {
      title: 'Permission',
      dataIndex: 'permissionName',
      key: 'permissionName',
      fixed: 'left',
      width: 200,
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500, color: '#2C3E50' }}>{name}</span>
          <span style={{ fontSize: 12, color: '#7A8691' }}>
            {record.permissionDescription}
          </span>
        </Space>
      )
    },
    ...roles.map(role => ({
      title: (
        <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
          <Space>
            {role.is_system_role ? (
              <LockOutlined style={{ color: '#faad14' }} />
            ) : (
              <UnlockOutlined style={{ color: '#52c41a' }} />
            )}
            <span>{role.name}</span>
          </Space>
          {role.is_system_role && (
            <Tag color="gold" style={{ fontSize: 10 }}>System</Tag>
          )}
        </Space>
      ),
      dataIndex: role.id,
      key: role.id,
      width: 150,
      align: 'center' as const,
      render: (hasPermission: boolean, record: PermissionMatrixRow) => {
        const isModified = changes.has(role.id) && changes.get(role.id)!.has(record.permissionId);
        return (
          <Tooltip title={role.is_system_role ? 'System role - cannot modify' : hasPermission ? 'Remove permission' : 'Grant permission'}>
            <Checkbox
              checked={hasPermission}
              onChange={(e) => handlePermissionToggle(record.permissionId, role.id, e.target.checked)}
              disabled={!canManageRoles || role.is_system_role}
              style={{
                backgroundColor: isModified ? '#fff7e6' : 'transparent',
                padding: isModified ? '4px 8px' : 0,
                borderRadius: 4
              }}
            />
          </Tooltip>
        );
      }
    }))
  ];

  // Show loading state while auth and permissions are being checked
  if (authLoading || permLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading permissions..." />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Authentication Required"
          description="Please log in to access permission matrix."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // Check if user can manage roles
  if (!canManageRoles) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access permission matrix management."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Permission Matrix"
        description="View and manage role-permission assignments"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'User Management', path: '/user-management' },
          { title: 'Permission Matrix' }
        ]}
        extra={
          <Space>
            <Tooltip title="Toggle system roles visibility">
              <Space>
                <span style={{ fontSize: 12, color: '#7A8691' }}>Show System Roles</span>
                <Switch
                  checked={showSystemRoles}
                  onChange={setShowSystemRoles}
                  size="small"
                />
              </Space>
            </Tooltip>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            {canManageRoles && changes.size > 0 && (
              <>
                <Button
                  onClick={handleDiscardChanges}
                >
                  Discard Changes
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveChanges}
                  loading={saving}
                >
                  Save Changes ({changes.size})
                </Button>
              </>
            )}
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Permissions"
              value={totalPermissions}
              icon={<SafetyOutlined />}
              color="primary"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Roles"
              value={totalRoles}
              icon={<UnlockOutlined />}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="System Roles"
              value={systemRoles}
              icon={<LockOutlined />}
              color="warning"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Assignments"
              value={totalAssignments}
              icon={<CheckCircleOutlined />}
              color="info"
            />
          </Col>
        </Row>

        {/* Info Alert */}
        {!canManageRoles && (
          <Alert
            message="View Only Mode"
            description="You do not have permission to modify role permissions. Contact your administrator for access."
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Changes Alert */}
        {changes.size > 0 && (
          <Alert
            message="Unsaved Changes"
            description={`You have unsaved changes for ${changes.size} role(s). Click "Save Changes" to apply or "Discard Changes" to revert.`}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Legend */}
        <Card style={{ marginBottom: 16 }}>
          <Space split={<Divider type="vertical" />} wrap>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontSize: 12, color: '#7A8691' }}>Permission Granted</span>
            </Space>
            <Space>
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
              <span style={{ fontSize: 12, color: '#7A8691' }}>Permission Not Granted</span>
            </Space>
            <Space>
              <LockOutlined style={{ color: '#faad14' }} />
              <span style={{ fontSize: 12, color: '#7A8691' }}>System Role (Read-only)</span>
            </Space>
            <Space>
              <UnlockOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontSize: 12, color: '#7A8691' }}>Custom Role (Editable)</span>
            </Space>
            <Space>
              <div style={{ width: 16, height: 16, backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: '#7A8691' }}>Modified (Unsaved)</span>
            </Space>
          </Space>
        </Card>

        {/* Permission Matrix Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={matrixData}
            loading={loading}
            scroll={{ x: 800 + (roles.length * 150) }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} permissions`
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No permissions found"
                >
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={loadData}
                  >
                    Reload Data
                  </Button>
                </Empty>
              )
            }}
            bordered
            size="small"
          />
        </Card>

        {/* Summary by Category */}
        <Card title="Permission Summary by Category" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Col xs={24} sm={12} lg={6} key={category}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <SafetyOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontWeight: 500 }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </Space>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#2C3E50' }}>
                      {perms.length}
                    </div>
                    <div style={{ fontSize: 12, color: '#7A8691' }}>
                      permissions
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </>
  );
};

export default PermissionMatrixPage;