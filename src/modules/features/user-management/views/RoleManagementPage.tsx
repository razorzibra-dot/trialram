/**
 * Role Management Page - Enterprise Ant Design Version
 * Comprehensive role management with permission assignment and templates
 * ✅ Uses granular RBAC permission checks (Phase 3.1)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Drawer,
  Form,
  Row,
  Col,
  message,
  Empty,
  Spin,
  Tooltip,
  Badge,
  Popconfirm,
  Descriptions,
  Tree,
  Alert,
  
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  FileTextOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { usePermissions } from '../hooks';
import { UserPermission } from '../guards/permissionGuards';
import { shouldShowTenantIdField } from '@/utils/tenantIsolation';
import { Role, Permission, RoleTemplate } from '@/types/rbac';
import { groupPermissionsByCategory } from '@/modules/features/user-management/utils/permissions';
import { supabase } from '@/services/supabase/client';
import { isSuperAdmin, filterPermissionsByTenant } from '@/utils/tenantIsolation';


interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

export const RoleManagementPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { canManageRoles, isLoading: permLoading, hasPermission } = usePermissions();
  const rbacService = useService<any>('rbacService');
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [expandedPermissions, setExpandedPermissions] = useState<Permission[]>([]); // Expanded permissions for edit modal
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIX: Ensure permissions are loaded when modal opens for create
  // This ensures permissions are available when creating a new role
  // Use a ref to prevent infinite loops
  const permissionsLoadAttemptedRef = useRef(false);
  
  useEffect(() => {
    if (isModalVisible && !editingRole && permissions.length === 0 && !loading && !permissionsLoadAttemptedRef.current) {
      // If modal is open for create and permissions aren't loaded, reload them
      console.log('[RoleManagement] Permissions not loaded, reloading...');
      permissionsLoadAttemptedRef.current = true;
      loadData().finally(() => {
        permissionsLoadAttemptedRef.current = false;
      });
    }
    // Reset ref when modal closes
    if (!isModalVisible) {
      permissionsLoadAttemptedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalVisible, editingRole, permissions.length]);

  // ✅ FIX: Update selectedPermissions when editingRole changes and modal opens
  // This ensures permissions are properly loaded when the edit modal opens
  // Note: handleEdit now fetches permissions directly, so this is mainly a safety check
  useEffect(() => {
    if (isModalVisible && editingRole && selectedPermissions.length === 0) {
      // If permissions weren't loaded by handleEdit, try to use role.permissions as fallback
      const rolePermissions = editingRole.permissions ?? [];
      if (rolePermissions.length > 0) {
        const availablePermissionIds = permissions.map(p => p.id);
        const validPermissions = rolePermissions.filter(permId => 
          availablePermissionIds.includes(permId)
        );
        
        if (validPermissions.length > 0) {
          setSelectedPermissions(validPermissions);
          // Only set form fields after a small delay to ensure Form component is mounted
          setTimeout(() => {
            try {
              form.setFieldsValue({
                permissions: validPermissions
              });
            } catch (error) {
              // Form not ready; skip silently
            }
          }, 0);
        }
      }
    }
  }, [isModalVisible, editingRole, permissions, form, selectedPermissions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, templatesData] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions(),
        rbacService.getRoleTemplates()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setRoleTemplates(templatesData);
      
      if (permissionsData.length === 0) {
        message.warning('No permissions available. You may not have access to view permissions.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to load data: ${errorMessage}`);
      // Set empty arrays to prevent undefined errors
      setRoles([]);
      setPermissions([]);
      setRoleTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle create role
  const handleCreate = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    setExpandedPermissions([]); // Clear expanded permissions when creating new role
    
    // If permissions aren't loaded, load them first before opening modal
    if (permissions.length === 0 && !loading) {
      loadData().then(() => {
        // Open modal after permissions are loaded
        setIsModalVisible(true);
        // Reset form after a small delay to ensure Form component is mounted
        setTimeout(() => {
          try {
            form.resetFields();
          } catch (error) {
            // Form not ready yet; will reset on next render
          }
        }, 100);
      }).catch((error) => {
        // Still open modal even if permissions fail to load
        setIsModalVisible(true);
      });
    } else {
      // Permissions already loaded, open modal immediately
      setIsModalVisible(true);
      // Reset form after a small delay to ensure Form component is mounted
      setTimeout(() => {
        try {
          form.resetFields();
        } catch (error) {
          // Form not ready yet; will reset on next render
        }
      }, 100);
    }
  };

  // Handle create from template
  const handleCreateFromTemplate = () => {
    templateForm.resetFields();
    setSelectedTemplateId(null);
    setIsTemplateModalVisible(true);
  };

  // Handle edit role
  const handleEdit = async (role: Role) => {
    setEditingRole(role);
    
    // ✅ DATABASE-DRIVEN: Fetch role permissions directly from database for this specific role
    // This ensures permissions are loaded even if they're filtered by tenant isolation in the list view
    try {
      setLoading(true);
      
      // Use statically imported supabase client and utilities
      
      // Fetch permissions directly from role_permissions table for this specific role
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);
      
      if (rolePermissionsError) {
        throw rolePermissionsError;
      }
      
      // Extract permission IDs from the query result
      const rolePermissions = (rolePermissionsData || []).map((rp: any) => rp.permission_id).filter(Boolean);
      
      // ✅ FIX: Fetch ALL permissions that match the role's tenant context (not just user-visible ones)
      // This allows us to see and manage all permissions the role has, even if they're platform permissions
      let availablePermissionsForRole = permissions;
      
      // If user is super admin, fetch all permissions (no tenant filtering)
      if (isSuperAdmin(currentUser)) {
        // Super admin: fetch all permissions (no tenant filtering)
        const { data: allPermissionsData, error: allPermsError } = await supabase
          .from('permissions')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        
        if (!allPermsError && allPermissionsData) {
          availablePermissionsForRole = allPermissionsData.map((perm: any) => ({
            id: perm.id,
            name: perm.name,
            description: perm.description || '',
            category: perm.category as 'core' | 'module' | 'administrative' | 'system',
            resource: perm.resource || '',
            action: perm.action || '',
            is_system_permission: perm.is_system_permission || false
          }));
        }
      } else if (role.tenant_id && currentUser?.tenantId === role.tenant_id) {
        // Tenant admin editing role from their tenant: fetch all permissions
        // Permissions are global (no tenant_id column), but we filter by is_system_permission
        // Include system permissions if they're already assigned to the role (for display)
        const { data: allPermsData, error: allPermsError } = await supabase
          .from('permissions')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        
        if (allPermsError) {
          console.error('[RoleManagement] Error fetching permissions:', allPermsError);
        } else if (allPermsData) {
          // Filter out system permissions (tenant admins shouldn't see them)
          // But keep them if they're already assigned to the role (for display purposes)
          const filteredPerms = filterPermissionsByTenant(allPermsData, currentUser);
          
          // Add back any role permissions that were filtered out (so they're visible in tree)
          const rolePermIds = new Set(rolePermissions);
          const filteredPermIds = new Set(filteredPerms.map((p: any) => p.id));
          const missingRolePerms = allPermsData.filter((p: any) => 
            rolePermIds.has(p.id) && !filteredPermIds.has(p.id)
          );
          
          availablePermissionsForRole = [...filteredPerms, ...missingRolePerms].map((perm: any) => ({
            id: perm.id,
            name: perm.name,
            description: perm.description || '',
            category: perm.category as 'core' | 'module' | 'administrative' | 'system',
            resource: perm.resource || '',
            action: perm.action || '',
            is_system_permission: perm.is_system_permission || false
          }));
        }
      }
      // Otherwise, use the existing permissions list (already filtered by tenant)
      
      
      // Filter to only include permissions that exist in the available permissions list
      // This prevents "Tree missing keys" warnings while preserving all valid permissions
      const availablePermissionIds = availablePermissionsForRole.map(p => p.id);
      const validPermissions = rolePermissions.filter((permId: string) => 
        availablePermissionIds.includes(permId)
      );
      
      // If some permissions are not in the available list, log a warning (but don't show message)
      // If some permissions are not in the available list, ignore them for display
      
      
      setSelectedPermissions(validPermissions);
      form.setFieldsValue({
        name: role.name,
        description: role.description,
        permissions: validPermissions
      });
      
      // Store expanded permissions for this edit session
      // This ensures the Tree component can display all role permissions
      setExpandedPermissions(availablePermissionsForRole);
      
      // Only open modal after permissions are loaded
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to load role permissions. Please try again.');
      // Fallback to role.permissions if fetch fails
      const fallbackPermissions = role.permissions ?? [];
      setSelectedPermissions(fallbackPermissions);
      form.setFieldsValue({
        name: role.name,
        description: role.description,
        permissions: fallbackPermissions
      });
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete role
  const handleDelete = async (roleId: string) => {
    try {
      // Notifications handled by hook
      await rbacService.deleteRole(roleId);
      loadData();
    } catch (error: unknown) {
      console.error('Failed to delete role:', error);
    }
  };

  // Handle view role - fetch full permission details
  const handleViewRole = async (role: Role) => {
    setSelectedRole(role);
    setLoadingRolePermissions(true);
    
    try {
      // Fetch full permission details for this role
      // Use statically imported supabase client
      
      // Get permission IDs from role_permissions table
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);
      
      if (rolePermissionsError) {
        throw rolePermissionsError;
      }
      
      const permissionIds = (rolePermissionsData || []).map((rp: any) => rp.permission_id).filter(Boolean);
      
      if (permissionIds.length > 0) {
        // Fetch full permission details
        const { data: fullPermissions, error: permError } = await supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds)
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        
        if (permError) {
          throw permError;
        }
        
        const mappedPermissions: Permission[] = (fullPermissions || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category as 'core' | 'module' | 'administrative' | 'system',
          resource: p.resource || '',
          action: p.action || '',
          is_system_permission: p.is_system_permission || false
        }));
        
        setSelectedRolePermissions(mappedPermissions);
      } else {
        setSelectedRolePermissions([]);
      }
    } catch (error) {
      message.error('Failed to load role permissions');
      setSelectedRolePermissions([]);
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  // Handle duplicate role
  const handleDuplicate = (role: Role) => {
    setEditingRole(null);
    // ✅ FIX: Filter permissions to only include those that exist in current permissions list
    const availablePermissionIds = permissions.map(p => p.id);
    const validPermissions = (role.permissions ?? []).filter(permId => 
      availablePermissionIds.includes(permId)
    );
    setSelectedPermissions(validPermissions);
    form.setFieldsValue({
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: validPermissions
    });
    setIsModalVisible(true);
  };

  // Handle form submit
  const handleSubmit = async (values: RoleFormData) => {
    try {
      setSubmitting(true);
      const roleData = {
        ...values,
        permissions: selectedPermissions
      };

      if (editingRole) {
        // Notifications handled by hook
        await rbacService.updateRole(editingRole.id, roleData);
      } else {
        // Notifications handled by hook
        await rbacService.createRole(roleData);
      }
      setIsModalVisible(false);
      form.resetFields();
      setSelectedPermissions([]);
      loadData();
    } catch (error: unknown) {
      const error_message = error instanceof Error ? error.message : 'Failed to save role';
      console.error('Error saving role:', error_message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle template submit
  const handleTemplateSubmit = async (values: Record<string, unknown>) => {
    try {
      setSubmitting(true);
      const template = roleTemplates.find(t => t.id === values.templateId);
      if (!template) {
        console.error('Template not found');
        return;
      }

      // Notifications handled by hook
      await rbacService.createRole({
        name: values.roleName,
        description: template.description,
        permissions: template.permissions ?? []
      });
      setIsTemplateModalVisible(false);
      templateForm.resetFields();
      setSelectedTemplateId(null);
      loadData();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to create role from template';
      console.error('Error creating role from template:', error_msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Group permissions by category
  // Use expandedPermissions when editing (to show all role permissions), otherwise use regular permissions
  // Ensure we always have permissions to display (use regular permissions if expandedPermissions is empty)
  const permissionsForTree = (isModalVisible && editingRole && expandedPermissions.length > 0) 
    ? expandedPermissions 
    : (permissions.length > 0 ? permissions : []);
  
  
  const groupedPermissions = groupPermissionsByCategory(permissionsForTree);

  // Convert permissions to tree data
  const permissionTreeData: DataNode[] = Object.entries(groupedPermissions).map(([category, perms]) => ({
    title: category.charAt(0).toUpperCase() + category.slice(1),
    key: category,
    children: perms.map(p => ({
      title: (
        <Space>
          <span>{p.name}</span>
          <span style={{ color: '#7A8691', fontSize: 12 }}>({p.description})</span>
        </Space>
      ),
      key: p.id
    }))
  }));
  

  // Action menu removed in favor of explicit buttons with tooltips and Popconfirm

  // Table columns
  const columns: ColumnsType<Role> = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (name: string, record) => (
        <Space>
          {record.is_system_role ? (
            <LockOutlined style={{ color: '#faad14' }} />
          ) : (
            <UnlockOutlined style={{ color: '#52c41a' }} />
          )}
          <span style={{ fontWeight: 500, color: '#2C3E50' }}>{name}</span>
          {record.is_system_role && (
            <Tag color="gold" style={{ marginLeft: 8 }}>System</Tag>
          )}
        </Space>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes((value as string).toLowerCase()) ||
        record.description.toLowerCase().includes((value as string).toLowerCase())
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (description: string) => (
        <span style={{ color: '#7A8691' }}>{description}</span>
      )
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 120,
      render: (permissions?: string[]) => (
        <Badge
          count={(permissions ?? []).length}
          style={{ backgroundColor: '#1890ff' }}
          showZero
        />
      )
    },
    // ⚠️ SECURITY: Only show tenant_id column to super admins
    ...(shouldShowTenantIdField(currentUser) ? [{
      title: 'Tenant',
      dataIndex: 'tenant_id',
      key: 'tenant_id',
      width: 150,
      render: (tenantId: string) => (
        <Tag color={tenantId === 'platform' || tenantId === null ? 'purple' : 'blue'}>
          {tenantId === 'platform' || tenantId === null ? 'Platform' : tenantId}
        </Tag>
      )
    }] : []),
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
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
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewRole(record)}
            />
          </Tooltip>
          {canManageRoles && (
            <>
              <Tooltip title={record.is_system_role ? 'System roles cannot be edited' : 'Edit'}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  disabled={record.is_system_role}
                />
              </Tooltip>
              <Tooltip title="Duplicate">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleDuplicate(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete Role"
                description={`Are you sure you want to delete the role "${record.name}"?`}
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                disabled={record.is_system_role}
              >
                <Tooltip title={record.is_system_role ? 'System roles cannot be deleted' : 'Delete'}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={record.is_system_role} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  // Calculate stats
  const totalRoles = roles.length;
  const systemRoles = roles.filter(r => r.is_system_role).length;
  const customRoles = roles.filter(r => !r.is_system_role).length;
  const totalPermissions = permissions.length;

  // Filtered roles
  const filteredRoles = searchText
    ? roles.filter(role =>
        role.name.toLowerCase().includes(searchText.toLowerCase()) ||
        role.description.toLowerCase().includes(searchText.toLowerCase())
      )
    : roles;

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
          description="Please log in to access role management."
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
          description="You don't have permission to access role management."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Role Management"
        description="Manage roles and assign permissions"
        breadcrumbs={[
          { title: 'Home', path: '/' },
          { title: 'User Management', path: '/user-management' },
          { title: 'Roles' }
        ]}
        extra={
          canManageRoles ? (
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
              >
                Refresh
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={handleCreateFromTemplate}
              >
                From Template
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                disabled={!canManageRoles}
              >
                Create Role
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
              title="Total Roles"
              value={totalRoles}
              icon={<SafetyOutlined />}
              color="primary"
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
              title="Custom Roles"
              value={customRoles}
              icon={<UnlockOutlined />}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Permissions"
              value={totalPermissions}
              icon={<SettingOutlined />}
              color="info"
            />
          </Col>
        </Row>

        {/* Search */}
        <Card style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search roles by name or description..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
        </Card>

        {/* Roles Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredRoles}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredRoles.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} roles`
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No roles found"
                >
                  {hasPermission(UserPermission.ROLE_MANAGE) && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreate}
                    >
                      Create First Role
                    </Button>
                  )}
                </Empty>
              )
            }}
          />
        </Card>
      </div>

      {/* Create/Edit Role Drawer - Consistent Side Panel */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyOutlined style={{ color: '#0ea5e9', fontSize: 18 }} />
            <span>{editingRole ? 'Edit Role' : 'Create New Role'}</span>
          </div>
        }
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedPermissions([]);
          setExpandedPermissions([]);
        }}
        width={800}
        styles={{ body: { padding: 0, paddingTop: 24 } }}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              size="large"
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setSelectedPermissions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => form.submit()}
              loading={submitting || loading}
              icon={editingRole ? <EditOutlined /> : <PlusOutlined />}
              disabled={
                !canManageRoles ||
                submitting ||
                loading ||
                (!editingRole && selectedPermissions.length === 0)
              }
            >
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '0 24px 24px 24px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark="optional"
          >
            {/* Basic Information Section */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
                <FileTextOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Basic Information</h3>
              </div>

              <Form.Item
                name="name"
                label="Role Name"
                rules={[
                  { required: true, message: 'Please enter role name' },
                  { min: 3, message: 'Role name must be at least 3 characters' },
                  { max: 100, message: 'Role name must not exceed 100 characters' }
                ]}
                tooltip="Unique role identifier. 3-100 characters."
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="e.g., Senior Manager, Support Agent"
                  size="large"
                  maxLength={100}
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: 'Please enter description' },
                  { min: 10, message: 'Description must be at least 10 characters' },
                  { max: 500, message: 'Description must not exceed 500 characters' }
                ]}
                tooltip="Clear description of the role's purpose and responsibilities."
              >
                <Input.TextArea
                  placeholder="Describe the role's responsibilities, scope, and key functions..."
                  rows={3}
                  maxLength={500}
                  showCount
                  allowClear
                />
              </Form.Item>
            </Card>

            {/* Permissions Section */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
                <LockOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Permissions</h3>
              </div>

              <Form.Item
                label={
                  <span>
                    Assign Permissions <Tooltip title="Select which permissions this role will have"><InfoCircleOutlined style={{ marginLeft: 4 }} /></Tooltip>
                  </span>
                }
                required
              >
                <Card style={{ maxHeight: 400, overflow: 'auto', borderRadius: 6 }}>
                  {permissionTreeData.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      {loading ? (
                        <div>
                          <Spin size="large" />
                          <div style={{ marginTop: 16, color: '#7A8691' }}>Loading permissions...</div>
                        </div>
                      ) : (
                        <Empty
                          description="No permissions available"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={loadData}
                          >
                            Reload Permissions
                          </Button>
                        </Empty>
                      )}
                    </div>
                  ) : (
                    <Tree
                      key={editingRole?.id || 'new-role'}
                      checkable
                      defaultExpandAll
                      checkedKeys={selectedPermissions.filter(key => {
                        const existsInTree = permissionTreeData.some(category => 
                          category.key === key || 
                          (category.children || []).some(child => child.key === key)
                        );
                        return existsInTree;
                      })}
                      onCheck={(checkedKeys) => {
                        const keys = checkedKeys as string[];
                        const permissionsToCheck = (isModalVisible && editingRole && expandedPermissions.length > 0)
                          ? expandedPermissions
                          : permissions;
                        const permissionIds = keys.filter(key =>
                          permissionsToCheck.some(p => p.id === key)
                        );
                        setSelectedPermissions(permissionIds);
                      }}
                      treeData={permissionTreeData}
                    />
                  )}
                </Card>
              </Form.Item>
              <div style={{ marginTop: 12, color: '#7A8691', fontSize: 12 }}>
                ✓ Selected: {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
              </div>
            </Card>
          </Form>
        </div>
      </Drawer>

      {/* Create from Template Drawer - Consistent Side Panel */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextOutlined style={{ color: '#0ea5e9', fontSize: 18 }} />
            <span>Create Role from Template</span>
          </div>
        }
        open={isTemplateModalVisible}
        onClose={() => {
          setIsTemplateModalVisible(false);
          templateForm.resetFields();
          setSelectedTemplateId(null);
        }}
        width={600}
        styles={{ body: { padding: 0, paddingTop: 24 } }}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              size="large"
              onClick={() => {
                setIsTemplateModalVisible(false);
                templateForm.resetFields();
                setSelectedTemplateId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => templateForm.submit()}
              loading={submitting}
              icon={<PlusOutlined />}
            >
              Create Role
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '0 24px 24px 24px' }}>
          <Form
            form={templateForm}
            layout="vertical"
            onFinish={handleTemplateSubmit}
            requiredMark="optional"
          >
            {/* Template Selection */}
            <Form.Item
              name="templateId"
              label={
                <span>
                  Select Template <Tooltip title="Choose a pre-configured role template"><InfoCircleOutlined style={{ marginLeft: 4 }} /></Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Please select a template' }]}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {roleTemplates.length === 0 ? (
                  <Empty description="No templates available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  roleTemplates.map(template => (
                    <Card
                      key={template.id}
                      hoverable
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        templateForm.setFieldsValue({ templateId: template.id });
                      }}
                      style={{
                        border: selectedTemplateId === template.id
                          ? '2px solid #0ea5e9'
                          : '1px solid #d9d9d9',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <SafetyOutlined style={{ color: '#0ea5e9', fontSize: 16 }} />
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{template.name}</span>
                          {template.is_default && (
                            <Tag color="blue" style={{ marginLeft: 'auto' }}>Default</Tag>
                          )}
                        </Space>
                        <div style={{ color: '#7A8691', fontSize: 12, marginLeft: 24 }}>
                          {template.description}
                        </div>
                        <div style={{ color: '#9EAAB7', fontSize: 11, marginLeft: 24 }}>
                          <Badge color="#1890ff" text={`${template.permissions?.length ?? 0} permissions`} />
                          <span style={{ marginLeft: 16 }}>•</span>
                          <span style={{ marginLeft: 16 }}>{template.category}</span>
                        </div>
                      </Space>
                    </Card>
                  ))
                )}
              </Space>
            </Form.Item>

            {/* Role Name */}
            <Form.Item
              name="roleName"
              label="New Role Name"
              rules={[
                { required: true, message: 'Please enter role name' },
                { min: 3, message: 'Role name must be at least 3 characters' },
                { max: 100, message: 'Role name must not exceed 100 characters' }
              ]}
              tooltip="Unique name for the new role created from this template."
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="e.g., Senior Manager, Support Agent"
                size="large"
                maxLength={100}
                allowClear
              />
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      {/* Role Details Drawer - Consistent Side Panel */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
            <span>Role Details</span>
          </div>
        }
        open={!!selectedRole}
        onClose={() => {
          setSelectedRole(null);
          setSelectedRolePermissions([]);
        }}
        width={700}
        styles={{ body: { padding: 0, paddingTop: 24 } }}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              size="large"
              onClick={() => {
                setSelectedRole(null);
                setSelectedRolePermissions([]);
              }}
            >
              Close
            </Button>
            {canManageRoles && selectedRole && !selectedRole.is_system_role && (
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={() => {
                  const roleToEdit = selectedRole;
                  setSelectedRole(null);
                  setSelectedRolePermissions([]);
                  handleEdit(roleToEdit);
                }}
              >
                Edit Role
              </Button>
            )}
          </Space>
        }
      >
        {selectedRole && (
          <div style={{ padding: '0 24px 24px 24px' }}>
            {/* Basic Information Section */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
                <FileTextOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Basic Information</h3>
              </div>

              <Descriptions column={1} bordered={false}>
                <Descriptions.Item 
                  label={<span style={{ fontWeight: 500, color: '#6b7280' }}>Role Name</span>}
                  contentStyle={{ color: '#1f2937', fontWeight: 500 }}
                >
                  <Space>
                    {selectedRole.name}
                    {selectedRole.is_system_role && (
                      <Tag color="gold" icon={<LockOutlined />}>System</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<span style={{ fontWeight: 500, color: '#6b7280' }}>Description</span>}
                  contentStyle={{ color: '#4b5563' }}
                >
                  {selectedRole.description}
                </Descriptions.Item>
                {/* ⚠️ SECURITY: Only show tenant_id to super admins */}
                {shouldShowTenantIdField(currentUser) && (
                  <Descriptions.Item 
                    label={<span style={{ fontWeight: 500, color: '#6b7280' }}>Tenant</span>}
                    contentStyle={{ color: '#1f2937' }}
                  >
                    <Tag color={selectedRole.tenant_id === 'platform' || !selectedRole.tenant_id ? 'purple' : 'blue'}>
                      {selectedRole.tenant_id || 'Platform'}
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Permissions Section */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LockOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Permissions</h3>
                </div>
                <Badge 
                  count={selectedRolePermissions.length} 
                  style={{ backgroundColor: '#0ea5e9' }} 
                  showZero 
                />
              </div>

              {loadingRolePermissions ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Spin tip="Loading permissions..." />
                </div>
              ) : selectedRolePermissions.length > 0 ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {Object.entries(groupPermissionsByCategory(selectedRolePermissions)).map(([category, perms]) => (
                    <div key={category}>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue" style={{ fontWeight: 500 }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Tag>
                        <span style={{ marginLeft: 8, color: '#7A8691', fontSize: 12 }}>
                          ({perms.length} permission{perms.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <Space wrap style={{ marginLeft: 16 }}>
                        {perms.map(perm => (
                          <Tooltip key={perm.id} title={perm.description || perm.name}>
                            <Tag color="blue" icon={<CheckCircleOutlined />}>
                              {perm.name}
                            </Tag>
                          </Tooltip>
                        ))}
                      </Space>
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No permissions assigned"
                  style={{ padding: '16px 0' }}
                />
              )}
            </Card>

            {/* Activity Section */}
            <Card style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }} variant="borderless">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #e5e7eb' }}>
                <CheckCircleOutlined style={{ fontSize: 18, color: '#0ea5e9', marginRight: 10, fontWeight: 600 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', margin: 0 }}>Activity</h3>
              </div>

              <Descriptions column={1} bordered={false}>
                <Descriptions.Item 
                  label={<span style={{ fontWeight: 500, color: '#6b7280' }}>Created</span>}
                  contentStyle={{ color: '#4b5563' }}
                >
                  {new Date(selectedRole.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<span style={{ fontWeight: 500, color: '#6b7280' }}>Last Updated</span>}
                  contentStyle={{ color: '#4b5563' }}
                >
                  {new Date(selectedRole.updated_at).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default RoleManagementPage;