/**
 * Generic Form Builder Component
 * Enterprise-level form builder with full customization, validation, and permission control
 * Handles all form rendering logic, dependencies, and field state management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Form,
  Row,
  Col,
  Card,
  Spin,
  Button,
  Space,
  Alert,
  Collapse,
  Empty,
  Tooltip,
} from 'antd';
import { SaveOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { FormConfig, FormSectionConfig, FormFieldConfig, FormFieldOption } from '@/types/forms';
import { GenericFormField } from './GenericFormField';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

interface GenericFormBuilderProps {
  config: FormConfig;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  loading?: boolean;
  form?: any;
  initialValues?: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
}

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

export const GenericFormBuilder: React.FC<GenericFormBuilderProps> = ({
  config,
  onSubmit,
  onCancel,
  loading = false,
  form: externalForm,
  initialValues = {},
  className,
  style,
}) => {
  const [form] = Form.useForm(externalForm);
  const [fieldOptions, setFieldOptions] = useState<Record<string, FormFieldOption[]>>({});
  const [optionsLoading, setOptionsLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldDependencies, setFieldDependencies] = useState<Record<string, any>>({});

  const { hasPermission } = useAuth();
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id;

  // Load options for all fields that need them
  useEffect(() => {
    const loadOptions = async () => {
      const allFields: FormFieldConfig[] = [];
      config.sections.forEach((section) => {
        allFields.push(...section.fields);
      });

      for (const field of allFields) {
        if (!field.options) continue;

        if (typeof field.options === 'function') {
          setOptionsLoading((prev) => ({ ...prev, [field.name]: true }));
          try {
            const loadedOptions = await field.options(tenantId);
            setFieldOptions((prev) => ({ ...prev, [field.name]: loadedOptions }));
          } catch (error) {
            console.error(`Failed to load options for field ${field.name}:`, error);
          } finally {
            setOptionsLoading((prev) => ({ ...prev, [field.name]: false }));
          }
        } else {
          setFieldOptions((prev) => ({ ...prev, [field.name]: field.options as FormFieldOption[] }));
        }
      }
    };

    loadOptions();
  }, [config, tenantId]);

  // Handle field dependencies (show/hide, enable/disable, etc.)
  const evaluateDependencies = useCallback((allValues: Record<string, any>) => {
    const deps: Record<string, any> = {};

    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.dependencies && field.dependencies.length > 0) {
          field.dependencies.forEach((dep) => {
            const depValue = allValues[dep.fieldName];
            let conditionMet = false;

            switch (dep.operator) {
              case 'equals':
                conditionMet = depValue === dep.value;
                break;
              case 'notEquals':
                conditionMet = depValue !== dep.value;
                break;
              case 'contains':
                conditionMet = String(depValue).includes(dep.value);
                break;
              case 'greaterThan':
                conditionMet = Number(depValue) > Number(dep.value);
                break;
              case 'lessThan':
                conditionMet = Number(depValue) < Number(dep.value);
                break;
              case 'in':
                conditionMet = Array.isArray(dep.value) ? dep.value.includes(depValue) : false;
                break;
              default:
                conditionMet = false;
            }

            if (conditionMet) {
              if (!deps[field.name]) {
                deps[field.name] = {};
              }

              switch (dep.action) {
                case 'show':
                  deps[field.name].hidden = false;
                  break;
                case 'hide':
                  deps[field.name].hidden = true;
                  break;
                case 'enable':
                  deps[field.name].disabled = false;
                  break;
                case 'disable':
                  deps[field.name].disabled = true;
                  break;
                case 'setRequired':
                  deps[field.name].required = true;
                  break;
                case 'removeRequired':
                  deps[field.name].required = false;
                  break;
              }
            }
          });
        }
      });
    });

    setFieldDependencies(deps);
  }, [config]);

  const handleValuesChange = useCallback((_changedValues: any, allValues: Record<string, any>) => {
    evaluateDependencies(allValues);
  }, [evaluateDependencies]);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setErrors({});

      // Run validation
      const validationErrors: Record<string, string> = {};
      for (const section of config.sections) {
        for (const field of section.fields) {
          if (field.validation?.required && !values[field.name]) {
            validationErrors[field.name] = field.validation.message || `${field.label} is required`;
          }

          if (field.validation?.validators) {
            for (const validator of field.validation.validators) {
              if (validator.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (values[field.name] && !emailRegex.test(values[field.name])) {
                  validationErrors[field.name] = validator.message || 'Invalid email';
                }
              } else if (validator.type === 'minLength' && typeof validator.value === 'number') {
                const candidate = values[field.name] ?? '';
                if (String(candidate).length < validator.value) {
                  validationErrors[field.name] = validator.message || `Minimum length is ${validator.value}`;
                }
              } else if (validator.type === 'custom' && validator.custom) {
                if (!validator.custom(values[field.name])) {
                  validationErrors[field.name] = validator.message || 'Validation failed';
                }
              }
            }
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Transform values if needed
      let finalValues = values;
      if (config.beforeSubmit) {
        finalValues = await config.beforeSubmit(values);
      }

      // Submit
      await onSubmit(finalValues);

      // Call after submit hook
      if (config.afterSubmit) {
        config.afterSubmit(finalValues);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _form: String(error) });
    }
  };

  const visibleSections = useMemo(() => {
    return config.sections.filter((section) => {
      if (!section.permissions?.view) return true;
      return hasPermission(section.permissions.view);
    });
  }, [config.sections, hasPermission]);

  if (visibleSections.length === 0) {
    return (
      <Empty
        description="No sections available"
        style={{ marginTop: 48, marginBottom: 48 }}
      />
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      onFinish={handleSubmit}
      initialValues={initialValues}
      className={className}
      style={style}
    >
      {/* Form title and description */}
      {(config.title || config.description) && (
        <div style={{ marginBottom: 24 }}>
          {config.title && (
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>
              {config.title}
            </h2>
          )}
          {config.description && (
            <p style={{ color: '#8c8c8c', margin: 0 }}>
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* Form-level errors */}
      {errors._form && (
        <Alert
          message="Form Error"
          description={errors._form}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {/* Render sections */}
      {visibleSections.map((section) => (
        <Card key={section.id} style={sectionStyles.card}>
          {/* Section header */}
          <div style={sectionStyles.header}>
            {section.icon && <span style={sectionStyles.headerIcon}>{section.icon}</span>}
            <h3 style={sectionStyles.headerTitle}>{section.title}</h3>
          </div>

          {section.description && (
            <p style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 16 }}>
              {section.description}
            </p>
          )}

          {/* Section fields in grid */}
          <Row gutter={[16, 16]}>
            {section.fields.map((field) => {
              const fieldDep = fieldDependencies[field.name] || {};
              const isHidden = fieldDep.hidden || field.hidden;
              const isDisabled = fieldDep.disabled || field.disabled;
              const isRequired = fieldDep.required !== undefined ? fieldDep.required : field.required;

              if (isHidden) {
                return null;
              }

              return (
                <Col key={field.name} xs={24} sm={24} md={config.columns ? 24 / config.columns : 12} lg={config.columns ? 24 / config.columns : 12}>
                  <Form.Item
                    name={field.name}
                    label={
                      <Tooltip title={field.tooltip}>
                        {field.label}
                        {isRequired && <span style={{ color: 'red' }}>*</span>}
                      </Tooltip>
                    }
                    rules={[
                      {
                        required: isRequired,
                        message: `${field.label} is required`,
                      },
                    ]}
                    validateStatus={errors[field.name] ? 'error' : undefined}
                    help={errors[field.name]}
                  >
                    <GenericFormField
                      field={{ ...field, disabled: isDisabled, required: isRequired }}
                      form={form}
                      value={form.getFieldValue(field.name)}
                      onChange={(value) => form.setFieldValue(field.name, value)}
                      onBlur={() => {}}
                      disabled={isDisabled}
                      error={errors[field.name]}
                      loading={optionsLoading[field.name]}
                      options={fieldOptions[field.name] || []}
                      permissions={field.permissions}
                    />
                  </Form.Item>
                </Col>
              );
            })}
          </Row>
        </Card>
      ))}

      {/* Form actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <Button onClick={onCancel} icon={<CloseOutlined />}>
          {config.cancelText || 'Cancel'}
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={loading}
        >
          {config.submitText || 'Submit'}
        </Button>
      </div>
    </Form>
  );
};

export default GenericFormBuilder;
