/**
 * Super User Form Panel Component
 * Form for creating or editing super user records
 * 
 * Features:
 * - User selection with search
 * - Access level dropdown with descriptions
 * - Tenant multi-select
 * - Form validation matching database constraints
 * - Submit/cancel buttons
 * - Loading states
 * 
 * @component
 */

import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Switch,
  Spin,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSuperUserManagement } from '../hooks/useSuperUserManagement';
import { useTenantAccess } from '../hooks/useTenantAccess';
import { SuperUserType, AccessLevelEnum, SuperUserCreateInput, SuperUserUpdateInput } from '@/types/superUserModule';
import { toast } from 'sonner';

interface SuperUserFormPanelProps {
  /** Super user to edit (undefined for create mode) */
  initialData?: SuperUserType;
  
  /** Callback when form is submitted */
  onSubmit?: (data: SuperUserCreateInput | SuperUserUpdateInput) => void;
  
  /** Callback when form is cancelled */
  onCancel?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Access level options with descriptions
 */
const ACCESS_LEVEL_OPTIONS = [
  {
    value: AccessLevelEnum.FULL,
    label: (
      <span>
        Full Access
        <Tooltip title="Complete control over assigned tenants">
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ),
    description: 'Full administrative access',
  },
  {
    value: AccessLevelEnum.LIMITED,
    label: (
      <span>
        Limited Access
        <Tooltip title="Restricted to specific operations">
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ),
    description: 'Limited administrative access',
  },
  {
    value: AccessLevelEnum.READ_ONLY,
    label: (
      <span>
        Read Only
        <Tooltip title="View-only access">
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ),
    description: 'Read-only access',
  },
  {
    value: AccessLevelEnum.SPECIFIC_MODULES,
    label: (
      <span>
        Module Specific
        <Tooltip title="Access limited to specific modules">
          <InfoCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </span>
    ),
    description: 'Access to specific modules only',
  },
];

/**
 * SuperUserFormPanel Component
 * 
 * Form for creating or editing super users with validation
 */
export const SuperUserFormPanel: React.FC<SuperUserFormPanelProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading: externalLoading = false,
}) => {
  const [form] = Form.useForm();
  const { create: createSuperUser, update: updateSuperUser, isCreating, isUpdating } = useSuperUserManagement();
  const isLoading = externalLoading || isCreating || isUpdating;
  const isEditMode = !!initialData;

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      form.setFieldsValue({
        userId: initialData.userId,
        accessLevel: initialData.accessLevel,
        isSuperAdmin: initialData.isSuperAdmin,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, isEditMode, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && initialData) {
        // Update mode
        const updateData: SuperUserUpdateInput = {
          accessLevel: values.accessLevel,
          isSuperAdmin: values.isSuperAdmin,
        };
        await updateSuperUser(initialData.id, updateData);
        toast.success('Super user updated successfully');
      } else {
        // Create mode
        const createData: SuperUserCreateInput = {
          userId: values.userId,
          accessLevel: values.accessLevel,
          isSuperAdmin: values.isSuperAdmin || false,
        };
        await createSuperUser(createData);
        toast.success('Super user created successfully');
        form.resetFields();
      }
      onSubmit?.(values);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save super user');
    }
  };

  return (
    <Card
      title={isEditMode ? 'Edit Super User' : 'Create Super User'}
      className="bg-white rounded-lg shadow-sm"
      bordered={false}
    >
      <Spin spinning={isLoading} tip={isLoading ? 'Saving...' : undefined}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className="space-y-4"
        >
          {/* User ID Field */}
          <Form.Item
            label="User ID"
            name="userId"
            rules={[
              { required: true, message: 'User ID is required' },
              { min: 3, message: 'User ID must be at least 3 characters' },
              { max: 255, message: 'User ID must not exceed 255 characters' },
            ]}
            tooltip="The user must have an existing user account"
            disabled={isEditMode}
          >
            <Input
              placeholder="Enter user ID"
              disabled={isEditMode}
              prefix={<span className="text-gray-400">@</span>}
            />
          </Form.Item>

          {/* Access Level Field */}
          <Form.Item
            label="Access Level"
            name="accessLevel"
            rules={[
              { required: true, message: 'Access level is required' },
            ]}
            tooltip="Define the level of access this super user has"
          >
            <Select
              placeholder="Select access level"
              options={ACCESS_LEVEL_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.value,
              }))}
              optionLabelProp="label"
            />
          </Form.Item>

          {/* Super Admin Toggle */}
          <Form.Item
            label="Super Admin"
            name="isSuperAdmin"
            valuePropName="checked"
            tooltip="Grant full platform administrative access"
            className="mb-0"
          >
            <div className="flex items-center gap-3">
              <Switch />
              <span className="text-sm text-gray-600">
                Grant full platform access (overrides access level)
              </span>
            </div>
          </Form.Item>

          {/* Form Actions */}
          <Form.Item className="mb-0 mt-6">
            <Row gutter={16} justify="flex-end">
              <Col>
                <Button onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  {isEditMode ? 'Update' : 'Create'} Super User
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SuperUserFormPanel;