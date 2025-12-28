/**
 * User Form Panel - Create/Edit Drawer - ENTERPRISE EDITION
 * Form for creating or editing user information with professional UI/UX
 * ✨ Enhanced with:
 *   - Professional visual hierarchy
 *   - Organized section cards
 *   - Field grouping and descriptions
 *   - Improved spacing and typography
 *   - Better validation feedback
 * ✅ Uses UserDTO for type safety and layer synchronization
 * ✅ RBAC permission checks integrated (Layer 3.1)
 */
import React, { useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Row, Col, message, Tooltip, Card, Alert, Tag } from 'antd';
import { SaveOutlined, CloseOutlined, InfoCircleOutlined, MailOutlined, UserOutlined, PhoneOutlined, TeamOutlined, BankOutlined, IdcardOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import { UserDTO, CreateUserDTO, UpdateUserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowTenantIdField, getFormTenantId, shouldShowOrganizationSection } from '@/utils/tenantIsolation';

// Professional styling configuration - matches enterprise standards
const sectionStyles = {
  card: {
    marginBottom: 20,
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '2px solid #e5e7eb',
  },
  headerIcon: {
    fontSize: 20,
    color: '#0ea5e9',
    marginRight: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
};

interface UserFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserDTO | null;
  onClose: () => void;
  onSave: (values: CreateUserDTO | UpdateUserDTO) => Promise<void>;
  loading: boolean;
  allRoles: UserRole[];
  allTenants: Array<{ id: string; name: string }>;
  allStatuses: UserStatus[];
}

export const UserFormPanel: React.FC<UserFormPanelProps> = ({
  open,
  mode,
  user,
  onClose,
  onSave,
  loading,
  allRoles,
  allTenants,
  allStatuses
}) => {
  const [form] = Form.useForm<CreateUserDTO | UpdateUserDTO>();
  const { canCreateUsers, canEditUsers, isLoading } = usePermissions();
  const auth = useAuth();
  const currentUser = auth?.user;
  const permissionsLoaded = !!(currentUser?.permissions && currentUser.permissions.length > 0);

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('[UserFormPanel] Form opened in mode:', mode);
      console.log('[UserFormPanel] Permission values:', {
        canCreateUsers,
        canEditUsers,
        isLoading,
        permissionsLoaded,
        userPermissions: currentUser?.permissions
      });
    }
  }, [open, mode, canCreateUsers, canEditUsers, isLoading, permissionsLoaded, currentUser?.permissions]);

  // Check if user has permission for this operation
  // Wait for permissions to load before checking
  const hasPermission = useMemo(() => {
    console.log('[UserFormPanel] Computing hasPermission for mode:', mode, {
      canCreateUsers,
      canEditUsers,
      permissionsLoaded,
      isLoading
    });
    
    // If permissions haven't loaded yet, don't show permission denied
    if (!permissionsLoaded && isLoading) {
      console.log('[UserFormPanel] Permissions still loading, allowing access temporarily');
      return true; // Optimistically allow until permissions are loaded
    }
    const result = mode === 'create' ? canCreateUsers : (mode === 'edit' ? canEditUsers : false);
    console.log('[UserFormPanel] Final hasPermission result:', result);
    return result;
  }, [mode, canCreateUsers, canEditUsers, permissionsLoaded, isLoading]);

  // Initialize form with user data when editing
  useEffect(() => {
    if (open && mode === 'edit' && user) {
      form.setFieldsValue({
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        mobile: user.mobile,
        companyName: user.companyName,
        department: user.department,
        position: user.position,
      });
    } else if (open && mode === 'create') {
      form.resetFields();
    }
  }, [open, mode, user, form]);

  const handleSave = async () => {
    try {
      // Verify permission before allowing save
      if (!hasPermission) {
        message.error(`You do not have permission to ${mode} users`);
        return;
      }

      // ⚠️ SECURITY: Only validate tenantId field if it's visible (super admin)
      const showTenantField = shouldShowTenantIdField(currentUser);
      
      // If tenant field is hidden, exclude it from validation
      // Use validateFields with field names to skip tenantId validation for tenant users
      const fieldsToValidate = showTenantField 
        ? undefined // Validate all fields including tenantId (super admin)
        : ['name', 'firstName', 'lastName', 'email', 'role', 'status', 'phone', 'mobile', 'companyName', 'department', 'position']; // Exclude tenantId (tenant user)

      const values = await form.validateFields(fieldsToValidate);
      
      // ⚠️ SECURITY: Get tenant_id using utility function
      // For tenant users, this returns null and backend will auto-set from current user context
      // For super admins, this returns the selected tenant_id
      const tenantId = getFormTenantId(currentUser, values.tenantId);
      
      // Convert form values to appropriate DTO
      const data: CreateUserDTO | UpdateUserDTO = {
        name: values.name,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role as UserRole,
        status: values.status as UserStatus,
        phone: values.phone,
        mobile: values.mobile,
        companyName: values.companyName,
        department: values.department,
        position: values.position,
        // ⚠️ SECURITY: Only include tenantId if user is super admin
        // For tenant users, backend will auto-set tenant_id from current user context
        ...(tenantId && { tenantId }),
      };
      
      await onSave(data);
      // Success message is shown by the parent component (UsersPage)
      form.resetFields();
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message !== 'validateFields error') {
        message.error(error.message || (mode === 'create' ? 'Failed to create user' : 'Failed to update user'));
      }
    }
  };

  const title = mode === 'create' ? 'Create New User' : 'Edit User';

  /**
   * ⚠️ SECURITY: Render tenant field - ONLY visible to super admins
   * 
   * **Security Rule**: Tenant users should NEVER see or be able to select tenant_id.
   * Tenant_id is automatically set from current user context in backend services.
   * Only super admins can see/manage tenant_id for cross-tenant management.
   */
  const renderTenantField = (): React.ReactNode => {
    // ⚠️ SECURITY: Only show tenant_id field to super admins
    const showTenantField = shouldShowTenantIdField(currentUser);
    
    if (!showTenantField) {
      // Tenant users: Don't show tenant_id field at all
      // Backend will automatically set tenant_id from current user context
      return null;
    }

    // Super admin: Show tenant selector
    const isEditingSuperAdmin = mode === 'edit' && user && (user.isSuperAdmin === true || user.tenantId === null);
    
    if (isEditingSuperAdmin) {
      return (
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Platform-Wide Super Admin"
            description="This user is a platform-wide super administrator and has access to all tenants. Tenant assignment is not applicable."
            type="info"
            icon={<CrownOutlined />}
            showIcon
          />
        </div>
      );
    }

    // Super admin creating/editing regular user: Show tenant selector
    return (
      <Form.Item
        label={
          <span>
            Tenant <Tooltip title="Organization/Tenant this user belongs to. Only super admins can see this field."><InfoCircleOutlined /></Tooltip>
          </span>
        }
        name="tenantId"
        rules={showTenantField ? [{ required: true, message: 'Tenant is required' }] : []}
      >
        <Select
          size="large"
          placeholder="Select a tenant"
          prefix={<TeamOutlined />}
        >
          {allTenants.map(tenant => (
            <Select.Option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
          <span>{mode === 'create' ? 'Create New User' : 'Edit User'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
            disabled={loading || !hasPermission}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSave}
            icon={<SaveOutlined />}
            disabled={!hasPermission}
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      }
    >
      {!hasPermission && (
        <Alert
          message="Permission Denied"
          description={`You do not have permission to ${mode} users. Please contact your administrator.`}
          type="error"
          icon={<LockOutlined />}
          showIcon
          style={{ marginBottom: 16, marginLeft: 24, marginRight: 24 }}
        />
      )}
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          disabled={!hasPermission}
          requiredMark="optional"
        >
          {/* Account Information Section */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <UserOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Account Information</h3>
            </div>
            <Row gutter={16}>
              {/* Email - Read-only in edit mode */}
              <Col span={24}>
                <Form.Item
                  label={
                    <span>
                      Email <Tooltip title="Required. Valid email, max 255 chars. Unique per tenant. Cannot change after creation."><InfoCircleOutlined /></Tooltip>
                    </span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Invalid email format' },
                    { max: 255, message: 'Max 255 characters' }
                  ]}
                >
                  <Input
                    size="large"
                    type="email"
                    placeholder="user@example.com"
                    prefix={<MailOutlined />}
                    disabled={mode === 'edit'}
                    maxLength={255}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Role - Required */}
              <Col xs={24} sm={12}>
                <Form.Item
                  label={
                    <span>
                      Role <Tooltip title="User role in the system. Determines permissions."><InfoCircleOutlined /></Tooltip>
                    </span>
                  }
                  name="role"
                  rules={[{ required: true, message: 'Role is required' }]}
                >
                  <Select size="large" placeholder="Select a role">
                    {allRoles.map(role => (
                      <Select.Option key={role} value={role}>
                        {role.replace(/_/g, ' ').charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

        {/* Organization Section - ✅ Only visible to super admins */}
        {shouldShowOrganizationSection(currentUser) && (
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <TeamOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Organization</h3>
            </div>
            {renderTenantField()}
          </Card>
        )}

        {/* Personal Information Section */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <IdcardOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Personal Information</h3>
          </div>
          <Row gutter={16}>
            {/* Full Name */}
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Full Name <Tooltip title="Display name. Required. Max 255 chars."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="name"
                rules={[
                  { required: true, message: 'Full name is required' },
                  { max: 255, message: 'Max 255 characters' }
                ]}
              >
                <Input size="large" placeholder="John Doe" maxLength={255} allowClear />
              </Form.Item>
            </Col>

            {/* First Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    First Name <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="firstName"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input size="large" placeholder="John" maxLength={100} allowClear />
              </Form.Item>
            </Col>

            {/* Last Name */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Last Name <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="lastName"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input size="large" placeholder="Doe" maxLength={100} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Contact Information Section */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <PhoneOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Contact Information</h3>
          </div>
          <Row gutter={16}>
            {/* Phone */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Phone <Tooltip title="Optional. Max 50 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="phone"
                rules={[{ max: 50, message: 'Max 50 characters' }]}
              >
                <Input size="large" placeholder="+1 (555) 000-0000" prefix={<PhoneOutlined />} maxLength={50} allowClear />
              </Form.Item>
            </Col>

            {/* Mobile */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Mobile <Tooltip title="Optional. Max 50 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="mobile"
                rules={[{ max: 50, message: 'Max 50 characters' }]}
              >
                <Input size="large" placeholder="+1 (555) 000-0001" prefix={<PhoneOutlined />} maxLength={50} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Company Information Section */}
        <Card style={sectionStyles.card} variant="borderless">
          <div style={sectionStyles.header}>
            <BankOutlined style={sectionStyles.headerIcon} />
            <h3 style={sectionStyles.headerTitle}>Company Information</h3>
          </div>
          <Row gutter={16}>
            {/* Company Name */}
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    Company Name <Tooltip title="Optional. Max 255 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="companyName"
                rules={[{ max: 255, message: 'Max 255 characters' }]}
              >
                <Input size="large" placeholder="Acme Corporation" prefix={<BankOutlined />} maxLength={255} allowClear />
              </Form.Item>
            </Col>

            {/* Department */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Department <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="department"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input size="large" placeholder="Sales" maxLength={100} allowClear />
              </Form.Item>
            </Col>

            {/* Position */}
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span>
                    Position <Tooltip title="Optional. Max 100 characters."><InfoCircleOutlined /></Tooltip>
                  </span>
                }
                name="position"
                rules={[{ max: 100, message: 'Max 100 characters' }]}
              >
                <Input size="large" placeholder="Manager" prefix={<IdcardOutlined />} maxLength={100} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        </Form>
      </div>
    </Drawer>
  );
};

export default UserFormPanel;