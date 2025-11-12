/**
 * useProductSalesForm Hook
 * Form state management using Ant Design Form
 * Handles form validation, submission, and error handling
 */

import { Form, FormInstance } from 'antd';
import { useCallback, useEffect } from 'react';
import { ProductSale, ProductSaleFormData, ProductSaleFilters } from '@/types/productSales';
import { useCreateProductSale } from './useCreateProductSale';
import { useUpdateProductSale } from './useUpdateProductSale';

/**
 * Form mode enumeration
 */
export type FormMode = 'create' | 'edit' | 'view';

/**
 * Hook for managing product sales form
 * @param initialData Optional initial form data for edit mode
 * @param mode Form mode (create, edit, or view)
 * @param onSubmitSuccess Callback after successful submit
 * @returns Form management utilities
 */
export const useProductSalesForm = (
  initialData?: ProductSale,
  mode: FormMode = 'create',
  onSubmitSuccess?: (data: ProductSale) => void
) => {
  const [form] = Form.useForm();
  const createMutation = useCreateProductSale();
  const updateMutation = useUpdateProductSale();

  // Populate form with initial data in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.setFieldsValue({
        customer_id: initialData.customer_id,
        product_id: initialData.product_id,
        units: initialData.units,
        cost_per_unit: initialData.cost_per_unit,
        delivery_date: initialData.delivery_date,
        warranty_expiry: initialData.warranty_expiry,
        status: initialData.status,
        notes: initialData.notes,
      });
    }
  }, [mode, initialData, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (values: ProductSaleFormData) => {
      try {
        let result: ProductSale;

        if (mode === 'edit' && initialData) {
          // Update existing sale
          const { data } = await updateMutation.mutateAsync({
            id: initialData.id,
            updates: values as Partial<ProductSale>,
          });
          result = data;
        } else {
          // Create new sale
          result = await createMutation.mutateAsync(values);
        }

        // Clear form
        form.resetFields();

        // Call success callback
        if (onSubmitSuccess) {
          onSubmitSuccess(result);
        }

        return result;
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    },
    [mode, initialData, form, createMutation, updateMutation, onSubmitSuccess]
  );

  /**
   * Reset form to initial state
   */
  const handleReset = useCallback(() => {
    if (mode === 'edit' && initialData) {
      // Reset to initial data in edit mode
      form.setFieldsValue({
        customer_id: initialData.customer_id,
        product_id: initialData.product_id,
        units: initialData.units,
        cost_per_unit: initialData.cost_per_unit,
        delivery_date: initialData.delivery_date,
        warranty_expiry: initialData.warranty_expiry,
        status: initialData.status,
        notes: initialData.notes,
      });
    } else {
      // Clear form in create mode
      form.resetFields();
    }
  }, [mode, initialData, form]);

  /**
   * Validate form fields
   */
  const validateFields = useCallback(async () => {
    try {
      const values = await form.validateFields();
      return { valid: true, values };
    } catch (error) {
      return { valid: false, error };
    }
  }, [form]);

  /**
   * Get form field errors
   */
  const getFieldErrors = useCallback(() => {
    return form.getFieldsError();
  }, [form]);

  /**
   * Set field error message
   */
  const setFieldError = useCallback(
    (fieldName: string, errorMessage: string) => {
      form.setFields([
        {
          name: fieldName as any,
          errors: [errorMessage],
        },
      ]);
    },
    [form]
  );

  /**
   * Calculate total cost based on units and cost per unit
   */
  const calculateTotal = useCallback(
    (units: number, costPerUnit: number) => {
      return units * costPerUnit;
    },
    []
  );

  /**
   * Auto-calculate total when units or cost changes
   */
  const handleFieldsChange = useCallback(
    (_changedFields: any, allFields: any) => {
      const units = form.getFieldValue('units');
      const costPerUnit = form.getFieldValue('cost_per_unit');

      if (units && costPerUnit) {
        const total = calculateTotal(units, costPerUnit);
        // Note: This would typically update a read-only display field
        // form.setFieldValue('total_cost', total);
      }
    },
    [form, calculateTotal]
  );

  /**
   * Get form state
   */
  const getFormState = useCallback(
    () => ({
      mode,
      isLoading: createMutation.isPending || updateMutation.isPending,
      isValid: form.isFieldsTouched() && !form.getFieldsError().some((f) => f.errors.length),
      isDirty: form.isFieldsTouched(),
      values: form.getFieldsValue(),
    }),
    [mode, form, createMutation.isPending, updateMutation.isPending]
  );

  return {
    // Form instance
    form,

    // State
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
    mode,

    // Methods
    handleSubmit,
    handleReset,
    validateFields,
    getFieldErrors,
    setFieldError,
    calculateTotal,
    handleFieldsChange,
    getFormState,

    // Mutation states
    createMutation,
    updateMutation,
  };
};

/**
 * Hook for validating product sale form data
 * @param data Form data to validate
 * @returns Validation result with errors if any
 */
export const useProductSalesFormValidation = (data: Partial<ProductSaleFormData>) => {
  const errors: Record<string, string> = {};

  // Validate customer_id
  if (!data.customer_id) {
    errors.customer_id = 'Customer is required';
  }

  // Validate product_id
  if (!data.product_id) {
    errors.product_id = 'Product is required';
  }

  // Validate units
  if (!data.units || data.units <= 0) {
    errors.units = 'Units must be greater than 0';
  }

  // Validate cost_per_unit
  if (!data.cost_per_unit || data.cost_per_unit <= 0) {
    errors.cost_per_unit = 'Cost per unit must be greater than 0';
  }

  // Validate delivery_date
  if (!data.delivery_date) {
    errors.delivery_date = 'Delivery date is required';
  } else if (new Date(data.delivery_date) < new Date()) {
    errors.delivery_date = 'Delivery date must be in the future';
  }

  // Validate notes (optional but max length)
  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Notes cannot exceed 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
};