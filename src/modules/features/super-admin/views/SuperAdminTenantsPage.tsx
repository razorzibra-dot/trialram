/**
 * Super Admin Tenants Page - Enterprise Ant Design Version
 * Comprehensive tenant management for super administrators with full CRUD operations
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  Descriptions,
  message,
  Dropdown,
  type MenuProps
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  SettingOutlined,
  MoreOutlined,
  ExportOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  Building2,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { tenantService } from '@/services/tenantService';
import { Tenant } from '@/types/crm';
import { TenantSettings } from '@/types/rbac';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface TenantFormData {
  name: string;
  domain: string;
  status: string;
  maxUsers?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export const SuperAdminTenantsPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load tenants
  useEffect(() => {
    fetchTenants();
  }, [statusFilter, searchText]);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const data = await tenantService.getTenants({
        status: statusFilter || undefined,
        search: searchText || undefined
      });
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      message.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create tenant
  const handleCreate = () => {
    setEditingTenant(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit tenant
  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.status,
      maxUsers: tenant.maxUsers,
      description: tenant.description,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone
    });
    setIsModalVisible(true);
  };

  // Handle view details
  const handleViewDetails = async (tenant: Tenant) => {
    try {
      const fullTenant = await tenantService.getTenant(tenant.id);
      setViewingTenant(fullTenant);
      setIsDetailsModalVisible(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tenant details';
      message.error(errorMessage);
    }
  };

  // Handle tenant settings
  const handleSettings = async (tenant: Tenant) => {
    try {
      const settings = await tenantService.getTenantSettings(tenant.id);
      setEditingTenant(tenant);
      settingsForm.setFieldsValue(settings);
      setIsSettingsModalVisible(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tenant settings';
      message.error(errorMessage);
    }
  };

  // Handle delete tenant
  const handleDelete = async (tenantId: string) => {
    try {
      await tenantService.deleteTenant(tenantId);
      message.success('Tenant deleted successfully');
      void fetchTenants();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
      message.error(errorMessage);
    }
  };

  // Handle suspend/activate tenant
  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
      await tenantService.updateTenantStatus(tenant.id, newStatus);
      message.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      void fetchTenants();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant status';
      message.error(errorMessage);
    }
  };

  // Handle form submit
  const handleSubmit = async (values: TenantFormData) => {
    try {
      setSubmitting(true);
      if (editingTenant) {
        await tenantService.updateTenant(editingTenant.id, values);
        message.success('Tenant updated successfully');
      } else {
        await tenantService.createTenant(values);
        message.success('Tenant created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      void fetchTenants();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save tenant';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle settings submit
  const handleSettingsSubmit = async (values: TenantSettings) => {
    if (!editingTenant) return;
    
    try {
      setSubmitting(true);
      await tenantService.updateTenantSettings(editingTenant.id, values);
      message.success('Tenant settings updated successfully');
      setIsSettingsModalVisible(false);
      settingsForm.resetFields();
      void fetchTenants();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant settings';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Permission check
  const canManageTenants = user?.role === 'super_admin';

  if (!canManageTenants) {
    return (
      <>
        <div style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You don't have permission to access tenant management. Only super administrators can manage tenants."
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => window.history.back()}>
                Go Back
              </Button>
            }
          />
        </div>
      </>
    );
  }

  // Statistics
  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
    totalUsers: tenants.reduce((sum, tenant) => sum + (tenant.userCount || 0), 0),
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchText || 
      tenant.name.toLowerCase().includes(searchText.toLowerCase()) ||
      tenant.domain?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action menu for each tenant
  const getActionMenu = (tenant: Tenant): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => handleViewDetails(tenant),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Tenant',
      onClick: () => handleEdit(tenant),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => handleSettings(tenant),
    },
    { type: 'divider' },
    {
      key: 'toggle-status',
      icon: tenant.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />,
      label: tenant.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant',
      onClick: () => handleToggleStatus(tenant),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Tenant',
      danger: true,
      disabled: tenant.id === 'platform',
      onClick: () => {
        Modal.confirm({
          title: 'Delete Tenant',
          content: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will delete all associated data.`,
          okText: 'Delete',
          okType: 'danger',
          onOk: () => handleDelete(tenant.id),
        });
      },
    },
  ];

  // Table columns
  const columns: ColumnsType<Tenant> = [
    {
      title: 'Tenant',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, record: Tenant) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            padding: 8, 
            background: '#DBEAFE', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={16} color="#1E40AF" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{record.domain}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <Space>
          <Users size={14} color="#6B7280" />
          <span>{count || 0}</span>
        </Space>
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
      align: 'right',
      fixed: 'right',
      width: 120,
      render: (_: unknown, record: Tenant) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
          <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tenant Management"
        description="Manage all tenants across the platform"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Tenants' }
        ]}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={fetchTenants}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.info('Export functionality coming soon')}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Tenant
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Tenants"
              value={stats.total}
              icon={Building2}
              color="primary"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Tenants"
              value={stats.active}
              icon={CheckCircle}
              color="success"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Suspended"
              value={stats.suspended}
              icon={XCircle}
              color="error"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="info"
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search tenants..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="suspended">Suspended</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Tenants Table */}
        <Card 
          title={
            <Space>
              <GlobalOutlined />
              <span>Tenants ({filteredTenants.length})</span>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredTenants}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tenants`,
            }}
            locale={{
              emptyText: (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <GlobalOutlined style={{ fontSize: 48, color: '#9CA3AF', marginBottom: 16 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No tenants found</h3>
                  <p style={{ color: '#6B7280', marginBottom: 16 }}>
                    {searchText || statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first tenant'}
                  </p>
                  {!searchText && !statusFilter && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreate}
                    >
                      Create Tenant
                    </Button>
                  )}
                </div>
              ),
            }}
          />
        </Card>
      </div>

      {/* Create/Edit Tenant Modal */}
      <Modal
        title={editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
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
          <Form.Item
            name="name"
            label="Tenant Name"
            rules={[{ required: true, message: 'Please enter tenant name' }]}
          >
            <Input placeholder="Enter tenant name" prefix={<GlobalOutlined />} />
          </Form.Item>

          <Form.Item
            name="domain"
            label="Domain"
            rules={[
              { required: true, message: 'Please enter domain' },
              { pattern: /^[a-z0-9-]+$/, message: 'Domain must contain only lowercase letters, numbers, and hyphens' }
            ]}
          >
            <Input placeholder="tenant-domain" addonBefore="https://" addonAfter=".yourapp.com" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
                initialValue="active"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="suspended">Suspended</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxUsers"
                label="Max Users"
                rules={[{ required: true, message: 'Please enter max users' }]}
                initialValue={10}
              >
                <Input type="number" min={1} placeholder="10" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter tenant description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactEmail"
                label="Contact Email"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="contact@example.com" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="Contact Phone"
              >
                <Input placeholder="+1 234 567 8900" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingTenant ? 'Update Tenant' : 'Create Tenant'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tenant Details Modal */}
      <Modal
        title="Tenant Details"
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setIsDetailsModalVisible(false);
            if (viewingTenant) handleEdit(viewingTenant);
          }}>
            Edit Tenant
          </Button>,
        ]}
        width={700}
      >
        {viewingTenant && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tenant Name" span={2}>
              <Space>
                <GlobalOutlined />
                {viewingTenant.name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Domain" span={2}>
              {viewingTenant.domain}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={viewingTenant.status === 'active' ? 'green' : 'red'}>
                {viewingTenant.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User Count">
              <Space>
                <UserOutlined />
                {viewingTenant.userCount || 0} / {viewingTenant.maxUsers || 'Unlimited'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {viewingTenant.description || 'No description'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Email">
              {viewingTenant.contactEmail || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Phone">
              {viewingTenant.contactPhone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              <Space>
                <CalendarOutlined />
                {new Date(viewingTenant.createdAt).toLocaleString()}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Last Active">
              <Space>
                <ClockCircleOutlined />
                {viewingTenant.lastActive ? new Date(viewingTenant.lastActive).toLocaleString() : 'Never'}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Tenant Settings Modal */}
      <Modal
        title={`Tenant Settings - ${editingTenant?.name}`}
        open={isSettingsModalVisible}
        onCancel={() => {
          setIsSettingsModalVisible(false);
          settingsForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSettingsSubmit}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              <Form.Item
                name="timezone"
                label="Timezone"
              >
                <Select placeholder="Select timezone">
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York</Option>
                  <Option value="America/Los_Angeles">America/Los_Angeles</Option>
                  <Option value="Europe/London">Europe/London</Option>
                  <Option value="Asia/Tokyo">Asia/Tokyo</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="dateFormat"
                label="Date Format"
              >
                <Select placeholder="Select date format">
                  <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                  <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="currency"
                label="Currency"
              >
                <Select placeholder="Select currency">
                  <Option value="USD">USD - US Dollar</Option>
                  <Option value="EUR">EUR - Euro</Option>
                  <Option value="GBP">GBP - British Pound</Option>
                  <Option value="JPY">JPY - Japanese Yen</Option>
                </Select>
              </Form.Item>
            </TabPane>

            <TabPane tab="Features" key="features">
              <Form.Item
                name="enableTickets"
                label="Enable Tickets"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableContracts"
                label="Enable Contracts"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableReports"
                label="Enable Reports"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableAPI"
                label="Enable API Access"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>

            <TabPane tab="Security" key="security">
              <Form.Item
                name="requireMFA"
                label="Require Multi-Factor Authentication"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="passwordExpiry"
                label="Password Expiry (days)"
              >
                <Input type="number" min={0} placeholder="90" />
              </Form.Item>

              <Form.Item
                name="sessionTimeout"
                label="Session Timeout (minutes)"
              >
                <Input type="number" min={5} placeholder="30" />
              </Form.Item>

              <Form.Item
                name="ipWhitelist"
                label="IP Whitelist"
              >
                <TextArea rows={3} placeholder="Enter IP addresses (one per line)" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsSettingsModalVisible(false);
                settingsForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Save Settings
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SuperAdminTenantsPage;