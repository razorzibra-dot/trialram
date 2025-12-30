/**
 * Generic Form Drawer Component
 * Enterprise-level form drawer wrapper for create/edit operations
 * Handles form lifecycle, permissions, and submission with full customization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Drawer, Button, Space, message, Spin, Alert, Form } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { FormConfig } from '@/types/forms';
import { GenericFormBuilder } from './GenericFormBuilder';
import { useAuth } from '@/contexts/AuthContext';

interface GenericFormDrawerProps {
  /**
   * Drawer title
   */
  title?: string;

  /**
   * Is drawer open
   */
  open: boolean;

  /**
   * Form configuration (replaces fields prop)
   */
  config?: FormConfig;

  /**
   * Initial form data (for edit mode)
   */
  data?: Record<string, unknown>;

  /**
   * Callbacks
   */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Submit button text
   */
  submitText?: string;

  /**
   * Drawer width
   */
  width?: number;

  /**
   * On success callback
   */
  onSuccess?: () => void;
  
  /**
   * Deprecated: Use config prop instead
   */
  fields?: any[];

  /**
   * Optional flag for legacy field-only usage to signal edit mode
   */
   isEdit?: boolean;
}

/**
 * GenericFormDrawer Component
 * 
 * New Enterprise Pattern - Use with FormConfig:
 * ```typescript
 * const formConfig: FormConfig = {
 *   id: 'customer-form',
 *   title: 'Customer Form',
 *   mode: 'create',
 *   sections: [
 *     {
 *       id: 'basic',
 *       title: 'Basic Information',
 *       fields: [
 *         {
 *           name: 'companyName',
 *           label: 'Company',
 *           type: 'text',
 *           required: true,
 *           permissions: { edit: 'crm:customer:edit' }
 *         }
 *       ]
 *     }
 *   ],
 *   onSubmit: async (values) => { ... }
 * };
 * ```
 */
export const GenericFormDrawer: React.FC<GenericFormDrawerProps> = ({
  title,
  open,
  config,
  data,
  fields,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Submit',
  width = 800,
  onSuccess,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { hasPermission } = useAuth();

  // Support legacy fields prop for backwards compatibility
  const effectiveConfig: FormConfig | undefined = useMemo(() => config ?? (fields ? {
    id: 'legacy-form',
    title: title || 'Form',
    mode: isEdit ? 'edit' : 'create',
    sections: [{
      id: 'default',
      title: 'Information',
      fields: fields || []
    }],
    onSubmit: async (values) => { await onSubmit(values); },
    permissions: undefined,
  } : undefined), [config, fields, title, isEdit, onSubmit]);

  // All hooks must be called before early returns
  const canPerformAction = useCallback(() => {
    if (!effectiveConfig) return true;
    if (effectiveConfig.mode === 'create' && effectiveConfig.permissions?.create) {
      return hasPermission(effectiveConfig.permissions.create);
    }
    if (effectiveConfig.mode === 'edit' && effectiveConfig.permissions?.update) {
      return hasPermission(effectiveConfig.permissions.update);
    }
    if (effectiveConfig.mode === 'view' && effectiveConfig.permissions?.view) {
      return hasPermission(effectiveConfig.permissions.view);
    }
    return true;
  }, [effectiveConfig, hasPermission]);

  if (!effectiveConfig) {
    return (
      <Drawer
        title={title || 'Form'}
        onClose={onCancel}
        open={open}
        width={width}
      >
        <Alert message="No form configuration provided" type="error" />
      </Drawer>
    );
  }

  const handleFormSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      if (!canPerformAction()) {
        setSubmitError('You do not have permission to perform this action');
        return;
      }

      await onSubmit(values);
      onSuccess?.();
      form.resetFields();
      onCancel();
      message.success(submitText + ' completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSubmitError(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={title || effectiveConfig.title}
      onClose={onCancel}
      open={open}
      width={width}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={submitting || loading}
          >
            Cancel
          </Button>
          {effectiveConfig.mode !== 'view' && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={submitting || loading}
              disabled={!canPerformAction()}
            >
              {submitText}
            </Button>
          )}
        </Space>
      }
    >
      <Spin spinning={submitting || loading}>
        {submitError && (
          <Alert
            message="Error"
            description={submitError}
            type="error"
            showIcon
            closable
            onClose={() => setSubmitError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {!canPerformAction() && effectiveConfig.mode !== 'view' && (
          <Alert
            message="Permission Denied"
            description={`You do not have permission to ${effectiveConfig.mode} this record.`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <GenericFormBuilder
          config={effectiveConfig}
          form={form}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          loading={submitting || loading}
          initialValues={data as Record<string, any> || {}}
        />
      </Spin>
    </Drawer>
  );
};
