/**
 * Role Management Page - Enterprise Ant Design Version
 * Comprehensive role management with permission assignment and templates
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
  Checkbox,
  message,
  Empty,
  Spin,
  Tooltip,
  Badge,
  Dropdown,
  Tabs,
  Descriptions,
  Tree,
  type MenuProps
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
  MoreOutlined,
  CopyOutlined,
  ExportOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useService } from '@/modules/core/hooks/useService';
import { Role, Permission, RoleTemplate } from '@/types/rbac';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

export const RoleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const rbacService = useService<any>('rbacService');
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

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
    } catch (error) {
      message.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create role
  const handleCreate = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle create from template
  const handleCreateFromTemplate = () => {
    templateForm.resetFields();
    setSelectedTemplateId(null);
    setIsTemplateModalVisible(true);
  };

  // Handle edit role
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setIsModalVisible(true);
  };

  // Handle delete role
  const handleDelete = async (roleId: string) => {
    try {
      await rbacService.deleteRole(roleId);
      message.success('Role deleted successfully');
      loadData();
    } catch (error: unknown) {
      const message_text = error instanceof Error ? error.message : 'Failed to delete role';
      message.error(message_text);
    }
  };

  // Handle duplicate role
  const handleDuplicate = (role: Role) => {
    setEditingRole(null);
    setSelectedPermissions(role.permissions);
    form.setFieldsValue({
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: role.permissions
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
        await rbacService.updateRole(editingRole.id, roleData);
        message.success('Role updated successfully');
      } else {
        await rbacService.createRole(roleData);
        message.success('Role created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setSelectedPermissions([]);
      loadData();
    } catch (error: unknown) {
      const error_message = error instanceof Error ? error.message : 'Failed to save role';
      message.error(error_message);
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
        message.error('Template not found');
        return;
      }

      await rbacService.createRole({
        name: values.roleName,
        description: template.description,
        permissions: template.permissions
      });
      message.success('Role created from template successfully');
      setIsTemplateModalVisible(false);
      templateForm.resetFields();
      setSelectedTemplateId(null);
      loadData();
    } catch (error: unknown) {
      const error_msg = error instanceof Error ? error.message : 'Failed to create role from template';
      message.error(error_msg);
    } finally {
      setSubmitting(false);
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

  // Action menu items
  const getActionMenu = (role: Role): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit Role',
      icon: <EditOutlined />,
      onClick: () => handleEdit(role),
      disabled: role.is_system_role
    },
    {
      key: 'duplicate',
      label: 'Duplicate Role',
      icon: <CopyOutlined />,
      onClick: () => handleDuplicate(role)
    },
    {
      key: 'view',
      label: 'View Details',
      icon: <FileTextOutlined />,
      onClick: () => setSelectedRole(role)
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete Role',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: role.is_system_role,
      onClick: () => {
        Modal.confirm({
          title: 'Delete Role',
          content: `Are you sure you want to delete the role "${role.name}"?`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => handleDelete(role.id)
        });
      }
    }
  ];

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
      render: (permissions: string[]) => (
        <Badge
          count={permissions.length}
          style={{ backgroundColor: '#1890ff' }}
          showZero
        />
      )
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant_id',
      key: 'tenant_id',
      width: 150,
      render: (tenantId: string) => (
        <Tag color={tenantId === 'platform' ? 'purple' : 'blue'}>
          {tenantId === 'platform' ? 'Platform' : tenantId}
        </Tag>
      )
    },
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
      width: 100,
      render: (_, record) => (
        <Space>
          {hasPermission('manage_roles') && (
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
          hasPermission('manage_roles') ? (
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
              >
                Create Role
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
                  {hasPermission('manage_roles') && (
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

      {/* Create/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedPermissions([]);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' }
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="Enter role name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please enter description' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
          >
            <TextArea
              placeholder="Enter role description"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Permissions"
            required
          >
            <Card style={{ maxHeight: 400, overflow: 'auto' }}>
              <Tree
                checkable
                defaultExpandAll
                checkedKeys={selectedPermissions}
                onCheck={(checkedKeys) => {
                  const keys = checkedKeys as string[];
                  // Filter out category keys, only keep permission IDs
                  const permissionIds = keys.filter(key =>
                    permissions.some(p => p.id === key)
                  );
                  setSelectedPermissions(permissionIds);
                }}
                treeData={permissionTreeData}
              />
            </Card>
            <div style={{ marginTop: 8, color: '#7A8691' }}>
              Selected: {selectedPermissions.length} permissions
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
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
                htmlType="submit"
                loading={submitting}
                icon={editingRole ? <EditOutlined /> : <PlusOutlined />}
                disabled={selectedPermissions.length === 0}
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create from Template Modal */}
      <Modal
        title="Create Role from Template"
        open={isTemplateModalVisible}
        onCancel={() => {
          setIsTemplateModalVisible(false);
          templateForm.resetFields();
          setSelectedTemplateId(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleTemplateSubmit}
        >
          <Form.Item
            name="templateId"
            label="Select Template"
            rules={[{ required: true, message: 'Please select a template' }]}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {roleTemplates.map(template => (
                <Card
                  key={template.id}
                  hoverable
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    templateForm.setFieldsValue({ templateId: template.id });
                  }}
                  style={{
                    border: selectedTemplateId === template.id
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontWeight: 500 }}>{template.name}</span>
                      {template.is_default && <Tag color="blue">Default</Tag>}
                    </Space>
                    <div style={{ color: '#7A8691', fontSize: 12 }}>
                      {template.description}
                    </div>
                    <div style={{ color: '#9EAAB7', fontSize: 12 }}>
                      {template.permissions.length} permissions • {template.category}
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          </Form.Item>

          <Form.Item
            name="roleName"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' }
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="Enter role name"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
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
                htmlType="submit"
                loading={submitting}
                icon={<PlusOutlined />}
              >
                Create Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Role Details Modal */}
      <Modal
        title="Role Details"
        open={!!selectedRole}
        onCancel={() => setSelectedRole(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedRole(null)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRole && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Role Name">{selectedRole.name}</Descriptions.Item>
              <Descriptions.Item label="Description">{selectedRole.description}</Descriptions.Item>
              <Descriptions.Item label="Tenant ID">{selectedRole.tenant_id}</Descriptions.Item>
              <Descriptions.Item label="System Role">
                {selectedRole.is_system_role ? (
                  <Tag color="gold">Yes</Tag>
                ) : (
                  <Tag color="green">No</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedRole.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {new Date(selectedRole.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Card title="Permissions" size="small">
              <Space wrap>
                {selectedRole.permissions.map(permId => {
                  const perm = permissions.find(p => p.id === permId);
                  return perm ? (
                    <Tag key={permId} color="blue" icon={<CheckCircleOutlined />}>
                      {perm.name}
                    </Tag>
                  ) : null;
                })}
              </Space>
            </Card>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default RoleManagementPage;