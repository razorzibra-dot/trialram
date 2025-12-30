/**
 * Generic Form Control Types & Configuration
 * Enterprise-level, fully customizable, permission-based form system
 * Enables zero-redundancy form creation across all modules
 */

export type FormFieldType = 'text' | 'password' | 'email' | 'number' | 'textarea' | 'select' | 'multi-select' | 'checkbox' | 'radio' | 'date' | 'date-range' | 'time' | 'datetime' | 'switch' | 'cascader' | 'auto-complete' | 'custom';

export type FormFieldValidationType = 'required' | 'email' | 'phone' | 'url' | 'number' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';

export interface FormFieldOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
  color?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface FormFieldValidator {
  type: FormFieldValidationType;
  message: string;
  value?: string | number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface FormFieldValidation {
  required?: boolean;
  message?: string;
  validators?: FormFieldValidator[];
}

export interface FormFieldPermission {
  view?: string; // permission token to view field
  edit?: string; // permission token to edit field
  required?: string; // permission token to make field required
  hidden?: string; // permission token to hide field
  disabled?: string; // permission token to disable field
}

export interface FormFieldDependency {
  fieldName: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'setRequired' | 'removeRequired';
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp | string;
  validation?: FormFieldValidation;
  permissions?: FormFieldPermission;
  dependencies?: FormFieldDependency[];
  options?: FormFieldOption[] | ((tenantId?: string) => Promise<FormFieldOption[]>);
  defaultValue?: any;
  initialValue?: any;
  customRenderer?: (value: any, config: FormFieldConfig, props: any) => React.ReactNode;
  onChange?: (value: any, allValues: Record<string, any>) => void;
  onBlur?: (value: any) => void;
  converter?: {
    toForm?: (value: any) => any;
    fromForm?: (value: any) => any;
  };
  metadata?: Record<string, any>;
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields: FormFieldConfig[];
  permissions?: {
    view?: string;
    edit?: string;
  };
  collapsible?: boolean;
  collapsed?: boolean;
  style?: React.CSSProperties;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  mode: 'create' | 'edit' | 'view';
  submitText?: string;
  cancelText?: string;
  sections: FormSectionConfig[];
  permissions?: {
    create?: string;
    update?: string;
    view?: string;
  };
  layout?: 'horizontal' | 'vertical' | 'inline';
  columns?: number;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  beforeSubmit?: (values: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>;
  afterSubmit?: (values: Record<string, any>) => void;
  validation?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface FormBuilderOptions {
  form?: any; // Ant Design Form instance
  initialValues?: Record<string, any>;
  disabled?: boolean;
  loading?: boolean;
  showLabels?: boolean;
  showTooltips?: boolean;
  columns?: number;
  gutter?: [number, number];
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
  colon?: boolean;
  preserve?: boolean;
  requiredMark?: 'optional' | 'required' | false;
  size?: 'large' | 'middle' | 'small';
  variant?: 'outlined' | 'borderless' | 'filled';
  className?: string;
  style?: React.CSSProperties;
}

export interface FormFieldRenderProps {
  field: FormFieldConfig;
  form: any;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  disabled: boolean;
  error?: string;
  loading?: boolean;
  options?: FormFieldOption[];
  dependencies?: Record<string, any>;
  permissions?: FormFieldPermission;
}

/**
 * Module-specific form configuration factory type
 * Used by each module to define its form structure
 */
export interface ModuleFormConfigFactory {
  getCreateFormConfig(options?: any): FormConfig;
  getEditFormConfig(data: any, options?: any): FormConfig;
  getViewFormConfig(data: any, options?: any): FormConfig;
  validateField(name: string, value: any): { valid: boolean; error?: string };
  transformToForm(data: any): Record<string, any>;
  transformFromForm(values: Record<string, any>): Record<string, any>;
}

/**
 * Enterprise form result type with full context
 */
export interface FormResult {
  status: 'success' | 'error' | 'cancelled';
  data?: Record<string, any>;
  error?: string;
  mode: 'create' | 'edit' | 'view';
  duration: number;
}
