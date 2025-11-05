/**
 * Config Override Form Component
 * Form for creating/editing configuration overrides
 * 
 * Features:
 * - Config key validation with dropdown
 * - JSON value editor
 * - Optional expiration date picker
 * - Form validation
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
  DatePicker,
  Button,
  Card,
  Spin,
  Row,
  Col,
  Alert,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { TenantConfigOverrideType, ConfigOverrideInput } from '@/types/superUserModule';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface ConfigOverrideFormProps {
  /** Tenant ID */
  tenantId: string;
  
  /** Override to edit (undefined for create mode) */
  initialData?: TenantConfigOverrideType;
  
  /** Callback when form is submitted */
  onSubmit?: (data: ConfigOverrideInput) => void;
  
  /** Callback when form is cancelled */
  onCancel?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Valid configuration keys with descriptions
 */
const CONFIG_KEYS = [
  {
    value: 'feature_flags',
    label: 'Feature Flags',
    description: 'Enable/disable feature flags',
  },
  {
    value: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Enable maintenance mode',
  },
  {
    value: 'api_rate_limit',
    label: 'API Rate Limit',
    description: 'Set API rate limiting (requests per minute)',
  },
  {
    value: 'session_timeout',
    label: 'Session Timeout',
    description: 'Set session timeout in minutes',
  },
  {
    value: 'data_retention_days',
    label: 'Data Retention',
    description: 'Set data retention period in days',
  },
  {
    value: 'backup_frequency',
    label: 'Backup Frequency',
    description: 'Set backup frequency (hourly/daily/weekly)',
  },
  {
    value: 'notification_settings',
    label: 'Notification Settings',
    description: 'Configure notification preferences',
  },
  {
    value: 'audit_log_level',
    label: 'Audit Log Level',
    description: 'Set audit logging level (debug/info/warning/error)',
  },
];

/**
 * ConfigOverrideForm Component
 * 
 * Form for creating or editing configuration overrides
 */
export const ConfigOverrideForm: React.FC<ConfigOverrideFormProps> = ({
  tenantId,
  initialData,
  onSubmit,
  onCancel,
  isLoading: externalLoading = false,
}) => {
  const [form] = Form.useForm();
  const { create: createOverride, update: updateOverride, isCreating, isUpdating } = useTenantConfig(tenantId);
  const isLoading = externalLoading || isCreating || isUpdating;
  const isEditMode = !!initialData;

  // Populate form with initial data
  useEffect(() => {
    if (isEditMode && initialData) {
      form.setFieldsValue({
        configKey: initialData.configKey,
        configValue: typeof initialData.configValue === 'string'
          ? initialData.configValue
          : JSON.stringify(initialData.configValue, null, 2),
        expiresAt: initialData.expiresAt ? dayjs(initialData.expiresAt) : null,
        overrideReason: initialData.overrideReason,
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
      // Parse JSON value
      let configValue: any = values.configValue;
      try {
        configValue = JSON.parse(values.configValue);
      } catch {
        // If parsing fails, treat as string
        configValue = values.configValue;
      }

      const input: ConfigOverrideInput = {
        tenantId,
        configKey: values.configKey,
        configValue,
        overrideReason: values.overrideReason,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      };

      if (isEditMode && initialData) {
        await updateOverride(initialData.id, input.configValue);
        toast.success('Configuration override updated');
      } else {
        await createOverride(input);
        toast.success('Configuration override created');
        form.resetFields();
      }

      onSubmit?.(input);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save configuration override');
    }
  };

  const selectedKey = Form.useFormInstance()?.getFieldValue('configKey');
  const keyDescription = CONFIG_KEYS.find((k) => k.value === selectedKey)?.description;

  return (
    <Card
      title={isEditMode ? 'Edit Configuration Override' : 'Create Configuration Override'}
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
          {/* Tenant ID (Read-only) */}
          <Form.Item
            label="Tenant ID"
            tooltip="The tenant this override applies to"
          >
            <Input value={tenantId} disabled />
          </Form.Item>

          {/* Config Key */}
          <Form.Item
            label="Configuration Key"
            name="configKey"
            rules={[
              { required: true, message: 'Configuration key is required' },
            ]}
            tooltip="Select the configuration key to override"
          >
            <Select
              placeholder="Select configuration key"
              options={CONFIG_KEYS.map((k) => ({
                value: k.value,
                label: k.label,
              }))}
              disabled={isEditMode}
              optionLabelProp="label"
            />
          </Form.Item>

          {/* Key Description */}
          {keyDescription && (
            <Alert
              message="Configuration Description"
              description={keyDescription}
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Config Value */}
          <Form.Item
            label="Configuration Value"
            name="configValue"
            rules={[
              { required: true, message: 'Configuration value is required' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    // Allow non-JSON values
                    return Promise.resolve();
                  }
                },
                message: 'Invalid JSON format (or plain text)',
              },
            ]}
            tooltip="Enter JSON or plain text value"
          >
            <Input.TextArea
              placeholder='{"key": "value"} or plain text'
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          {/* Override Reason */}
          <Form.Item
            label="Override Reason"
            name="overrideReason"
            rules={[
              { max: 500, message: 'Reason must not exceed 500 characters' },
            ]}
            tooltip="Optional: Document why this override is needed"
          >
            <Input.TextArea
              placeholder="Explain the reason for this override (optional)"
              rows={3}
            />
          </Form.Item>

          {/* Expiration Date */}
          <Form.Item
            label="Expiration Date"
            name="expiresAt"
            tooltip="Optional: Set an expiration date for this override"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="Select expiration date (optional)"
              style={{ width: '100%' }}
            />
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
                  {isEditMode ? 'Update' : 'Create'} Override
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default ConfigOverrideForm;