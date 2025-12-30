/**
 * Generic Form Field Component
 * Renders any form field type with permission controls, validation, and custom handlers
 */

import React, { useMemo } from 'react';
import {
  Input,
  Select,
  Checkbox,
  Radio,
  DatePicker,
  TimePicker,
  InputNumber,
  Switch,
  Cascader,
  AutoComplete,
  Empty,
  Spin,
} from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { FormFieldConfig, FormFieldRenderProps, FormFieldOption } from '@/types/forms';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';

export const GenericFormField: React.FC<FormFieldRenderProps> = ({
  field,
  form,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  loading = false,
  options = [],
  permissions,
}) => {
  const { hasPermission } = useAuth();

  // Check field-level permissions
  const canView = !permissions?.view || hasPermission(permissions.view);
  const canEdit = !permissions?.edit || hasPermission(permissions.edit);
  const isRequired = field.required || (permissions?.required && hasPermission(permissions.required));
  const isHidden = permissions?.hidden && hasPermission(permissions.hidden);
  const isDisabled = disabled || canEdit === false || field.readOnly || (permissions?.disabled && hasPermission(permissions.disabled));

  if (isHidden || !canView) {
    return null;
  }

  const fieldValue = field.converter?.toForm ? field.converter.toForm(value) : value;

  const fieldStatus: 'error' | 'warning' | undefined = error ? 'error' : undefined;

  const commonProps = {
    value: fieldValue,
    onChange: (newValue: any) => {
      const transformedValue = field.converter?.fromForm ? field.converter.fromForm(newValue) : newValue;
      onChange(transformedValue);
    },
    onBlur,
    disabled: isDisabled,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    status: fieldStatus,
  };

  let component: React.ReactNode = null;

  switch (field.type) {
    case 'text':
      component = <Input {...commonProps} type="text" />;
      break;

    case 'password':
      component = <Input {...commonProps} type="password" />;
      break;

    case 'email':
      component = <Input {...commonProps} type="email" />;
      break;

    case 'number':
      component = <InputNumber {...commonProps} min={field.min} max={field.max} />;
      break;

    case 'textarea':
      component = (
        <Input.TextArea
          {...commonProps}
          rows={field.rows || 4}
          showCount={!!field.maxLength}
        />
      );
      break;

    case 'select':
      component = (
        <Select
          {...commonProps}
          options={options}
          loading={loading}
          optionLabelProp="label"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      );
      break;

    case 'multi-select':
      component = (
        <Select
          {...commonProps}
          mode="multiple"
          options={options}
          loading={loading}
          maxTagCount="responsive"
        />
      );
      break;

    case 'checkbox':
      component = (
        <Checkbox
          {...commonProps}
          checked={fieldValue}
          onChange={(e) => commonProps.onChange(e.target.checked)}
        >
          {field.label}
        </Checkbox>
      );
      break;

    case 'radio':
      component = (
        <Radio.Group {...commonProps} options={options} />
      );
      break;

    case 'date':
      component = (
        <DatePicker
          {...commonProps}
          value={fieldValue ? dayjs(fieldValue) : undefined}
          onChange={(date) => commonProps.onChange(date?.toISOString())}
          format="YYYY-MM-DD"
        />
      );
      break;

    case 'date-range':
      component = (
        <DatePicker.RangePicker
          {...commonProps}
          value={fieldValue ? [dayjs(fieldValue[0]), dayjs(fieldValue[1])] : undefined}
          onChange={(dates) =>
            commonProps.onChange(dates ? [dates[0]?.toISOString(), dates[1]?.toISOString()] : undefined)
          }
          format="YYYY-MM-DD"
          placeholder={field.placeholder ? [field.placeholder, field.placeholder] : undefined}
        />
      );
      break;

    case 'time':
      component = (
        <TimePicker
          {...commonProps}
          value={fieldValue ? dayjs(fieldValue) : undefined}
          onChange={(time) => commonProps.onChange(time?.toISOString())}
          format="HH:mm"
        />
      );
      break;

    case 'datetime':
      component = (
        <DatePicker
          {...commonProps}
          showTime
          value={fieldValue ? dayjs(fieldValue) : undefined}
          onChange={(date) => commonProps.onChange(date?.toISOString())}
          format="YYYY-MM-DD HH:mm:ss"
        />
      );
      break;

    case 'switch':
      component = (
        <Switch
          {...commonProps}
          checked={fieldValue}
          onChange={(checked) => commonProps.onChange(checked)}
        />
      );
      break;

    case 'cascader':
      component = (
        <Cascader
          {...commonProps}
          options={options as any}
          placeholder={field.placeholder}
        />
      );
      break;

    case 'auto-complete':
      component = (
        <AutoComplete
          {...commonProps}
          options={options}
          filterOption={(inputValue, option) =>
            (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
          }
        />
      );
      break;

    case 'custom':
      if (field.customRenderer) {
        component = field.customRenderer(fieldValue, field, commonProps);
      } else {
        component = <Input {...commonProps} />;
      }
      break;

    default:
      component = <Input {...commonProps} />;
  }

  if (loading && field.type === 'select') {
    return <Spin />;
  }

  return (
    <div className="generic-form-field">
      {component}
      {error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ExclamationCircleOutlined />
          {error}
        </div>
      )}
      {field.tooltip && (
        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <InfoCircleOutlined />
          {field.tooltip}
        </div>
      )}
    </div>
  );
};

export default GenericFormField;
