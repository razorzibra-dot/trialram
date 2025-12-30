/**
 * Legacy customer form config (stub)
 * This module is retained for backward compatibility but returns empty configs.
 */

export const getCustomerCreateFormConfig = () => ({
  id: 'customer-create-form-disabled',
  title: 'Customer Form (disabled)',
  description: 'This form configuration has been deprecated.',
  mode: 'create',
  submitText: 'Create Customer',
  sections: [],
});

export const getCustomerEditFormConfig = (customer?: any) => ({
  ...getCustomerCreateFormConfig(),
  id: 'customer-edit-form-disabled',
  title: `Edit Customer: ${customer?.companyName ?? ''}`,
  mode: 'edit',
  submitText: 'Update Customer',
});

export const getCustomerViewFormConfig = (customer?: any) => ({
  ...getCustomerCreateFormConfig(),
  id: 'customer-view-form-disabled',
  title: `View Customer: ${customer?.companyName ?? ''}`,
  mode: 'view',
});
