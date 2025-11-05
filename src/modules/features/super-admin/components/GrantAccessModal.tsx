/**
 * Grant Access Modal Component
 * Modal for granting tenant access to a super user
 * 
 * Features:
 * - Tenant selection with search
 * - Access level dropdown
 * - Conflict detection (already has access)
 * - Form validation
 * - Loading states
 * 
 * @component
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  Alert,
  Spin,
  Empty,
} from 'antd';
import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useTenantAccess } from '../hooks/useTenantAccess';
import { AccessLevelEnum, TenantAccessCreateInput } from '@/types/superUserModule';
import { toast } from 'sonner';

interface GrantAccessModalProps {
  /** Super user ID to grant access to */
  superUserId: string;
  
  /** Whether modal is visible */
  visible: boolean;
  
  /** Callback when modal is closed */
  onClose: () => void;
  
  /** Callback when access is granted */
  onGranted?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Mock tenant options (in real app, would fetch from service)
 */
const MOCK_TENANTS = [
  { id: 'tenant-1', name: 'Acme Corp' },
  { id: 'tenant-2', name: 'Tech Startups Inc' },
  { id: 'tenant-3', name: 'Global Enterprises' },
  { id: 'tenant-4', name: 'Local Business LLC' },
];

/**
 * Access level options
 */
const ACCESS_LEVELS = [
  { value: AccessLevelEnum.FULL, label: 'Full Access' },
  { value: AccessLevelEnum.LIMITED, label: 'Limited Access' },
  { value: AccessLevelEnum.READ_ONLY, label: 'Read Only' },
  { value: AccessLevelEnum.SPECIFIC_MODULES, label: 'Module Specific' },
];

/**
 * GrantAccessModal Component
 * 
 * Modal for granting tenant access to super users
 */
export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({
  superUserId,
  visible,
  onClose,
  onGranted,
  isLoading: externalLoading = false,
}) => {
  const [form] = Form.useForm();
  const { grant, isGranting, accessList } = useTenantAccess(superUserId);
  const isLoading = externalLoading || isGranting;

  // Get already assigned tenant IDs
  const assignedTenantIds = new Set(accessList?.map((a) => a.tenantId) || []);

  // Filter available tenants (not already assigned)
  const availableTenants = MOCK_TENANTS.filter(
    (t) => !assignedTenantIds.has(t.id)
  );

  // Get selected tenant to check for conflicts
  const selectedTenantId = Form.useFormInstance()?.getFieldValue('tenantId');
  const hasConflict = assignedTenantIds.has(selectedTenantId);

  /**
   * Handle grant access
   */
  const handleSubmit = async (values: any) => {
    try {
      const input: TenantAccessCreateInput = {
        superUserId,
        tenantId: values.tenantId,
        accessLevel: values.accessLevel,
      };
      await grant(input);
      toast.success('Tenant access granted successfully');
      form.resetFields();
      onGranted?.();
      onClose();
    } catch (error) {
      console.error('Grant access error:', error);
      toast.error('Failed to grant tenant access');
    }
  };

  if (availableTenants.length === 0 && assignedTenantIds.size > 0) {
    return (
      <Modal
        title="Grant Tenant Access"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        <Empty
          description="All tenants already assigned"
          style={{ marginTop: 48, marginBottom: 48 }}
        />
      </Modal>
    );
  }

  return (
    <Modal
      title="Grant Tenant Access"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={() => form.submit()}
        >
          Grant Access
        </Button>,
      ]}
      width={500}
    >
      <Spin spinning={isLoading} tip={isLoading ? 'Granting access...' : undefined}>
        {hasConflict && (
          <Alert
            message="Conflict Detected"
            description="This super user already has access to the selected tenant."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {/* Tenant Selection */}
          <Form.Item
            label="Tenant"
            name="tenantId"
            rules={[
              { required: true, message: 'Please select a tenant' },
            ]}
            tooltip="Select the tenant to grant access to"
          >
            <Select
              placeholder="Search and select tenant"
              options={availableTenants.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.id})`,
              }))}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              showSearch
            />
          </Form.Item>

          {/* Access Level Selection */}
          <Form.Item
            label="Access Level"
            name="accessLevel"
            rules={[
              { required: true, message: 'Please select an access level' },
            ]}
            tooltip="Define the level of access for this tenant"
            initialValue={AccessLevelEnum.LIMITED}
          >
            <Select
              placeholder="Select access level"
              options={ACCESS_LEVELS}
            />
          </Form.Item>

          {/* Info Message */}
          <Alert
            message="Information"
            description="After granting access, the super user will be able to manage this tenant according to the selected access level."
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default GrantAccessModal;