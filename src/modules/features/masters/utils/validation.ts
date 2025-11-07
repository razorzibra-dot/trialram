/**
 * Validation utilities for Masters module (Products and Companies)
 * Ensures consistent input validation across all forms and services
 * Implements XSS prevention through input sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input: string | undefined): string => {
  if (!input) return '';
  // Remove any HTML/script tags and sanitize
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
};

/**
 * Validates SKU format (alphanumeric with hyphens/underscores allowed)
 * @param {string} sku - SKU to validate
 * @returns {boolean} True if valid SKU format
 */
export const isValidSKU = (sku: string): boolean => {
  // Allow alphanumeric, hyphens, and underscores
  const skuRegex = /^[A-Z0-9_-]{2,50}$/i;
  return skuRegex.test(sku);
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone format (international format)
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid phone format
 */
export const isValidPhone = (phone: string): boolean => {
  // Allow various phone formats: +1 (555) 000-0000, 555-000-0000, etc.
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates price is non-negative and has valid precision
 * @param {number} price - Price to validate
 * @returns {boolean} True if valid price
 */
export const isValidPrice = (price: number | undefined): boolean => {
  if (price === undefined || price === null) return false;
  return price >= 0 && Number.isFinite(price);
};

/**
 * Validates stock quantity is non-negative integer
 * @param {number} quantity - Quantity to validate
 * @returns {boolean} True if valid quantity
 */
export const isValidQuantity = (quantity: number | undefined): boolean => {
  if (quantity === undefined || quantity === null) return false;
  return Number.isInteger(quantity) && quantity >= 0;
};

/**
 * Validation rules for Product form fields
 */
export const productValidationRules = {
  name: [
    { required: true, message: 'Product name is required' },
    { min: 2, message: 'Product name must be at least 2 characters' },
    { max: 255, message: 'Product name cannot exceed 255 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Product name contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  sku: [
    { required: true, message: 'SKU is required' },
    { min: 2, message: 'SKU must be at least 2 characters' },
    { max: 50, message: 'SKU cannot exceed 50 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        if (!isValidSKU(value)) {
          return Promise.reject(
            new Error('SKU must contain only letters, numbers, hyphens, or underscores')
          );
        }
        return Promise.resolve();
      },
    },
  ],
  category: [
    { required: true, message: 'Category is required' },
    { min: 2, message: 'Category must be at least 2 characters' },
    { max: 100, message: 'Category cannot exceed 100 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Category contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  brand: [
    { max: 100, message: 'Brand name cannot exceed 100 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Brand name contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  manufacturer: [
    { max: 100, message: 'Manufacturer name cannot exceed 100 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Manufacturer name contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  price: [
    { required: true, message: 'Selling price is required' },
    {
      validator: (_: any, value: number) => {
        if (value === undefined || value === null) return Promise.resolve();
        if (!isValidPrice(value)) {
          return Promise.reject(new Error('Price must be a positive number'));
        }
        return Promise.resolve();
      },
    },
  ],
  cost_price: [
    {
      validator: (_: any, value: number) => {
        if (value === undefined || value === null) return Promise.resolve();
        if (!isValidPrice(value)) {
          return Promise.reject(new Error('Cost price must be a positive number'));
        }
        return Promise.resolve();
      },
    },
  ],
  stock_quantity: [
    { required: true, message: 'Current stock is required' },
    {
      validator: (_: any, value: number) => {
        if (value === undefined || value === null) return Promise.resolve();
        if (!isValidQuantity(value)) {
          return Promise.reject(new Error('Stock quantity must be a non-negative whole number'));
        }
        return Promise.resolve();
      },
    },
  ],
  reorder_level: [
    {
      validator: (_: any, value: number) => {
        if (value === undefined || value === null) return Promise.resolve();
        if (!isValidQuantity(value)) {
          return Promise.reject(new Error('Reorder level must be a non-negative whole number'));
        }
        return Promise.resolve();
      },
    },
  ],
  unit: [
    { required: true, message: 'Unit of measurement is required' },
  ],
  status: [
    { required: true, message: 'Status is required' },
  ],
  description: [
    { max: 1000, message: 'Description cannot exceed 1000 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Description contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  notes: [
    { max: 1000, message: 'Notes cannot exceed 1000 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Notes contain invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
};

/**
 * Validation rules for Company form fields
 */
export const companyValidationRules = {
  name: [
    { required: true, message: 'Company name is required' },
    { min: 2, message: 'Company name must be at least 2 characters' },
    { max: 255, message: 'Company name cannot exceed 255 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Company name contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  industry: [
    { required: true, message: 'Industry is required' },
    { min: 2, message: 'Industry must be at least 2 characters' },
    { max: 100, message: 'Industry cannot exceed 100 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Industry contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  size: [
    { required: true, message: 'Company size is required' },
  ],
  status: [
    { required: true, message: 'Status is required' },
  ],
  email: [
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        if (!isValidEmail(value)) {
          return Promise.reject(new Error('Please enter a valid email address'));
        }
        return Promise.resolve();
      },
    },
  ],
  phone: [
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        if (!isValidPhone(value)) {
          return Promise.reject(new Error('Please enter a valid phone number'));
        }
        return Promise.resolve();
      },
    },
  ],
  website: [
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        if (!isValidURL(value)) {
          return Promise.reject(new Error('Please enter a valid website URL (e.g., https://example.com)'));
        }
        return Promise.resolve();
      },
    },
  ],
  address: [
    { max: 500, message: 'Address cannot exceed 500 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Address contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  registration_number: [
    { max: 50, message: 'Registration number cannot exceed 50 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Registration number contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  tax_id: [
    { max: 50, message: 'Tax ID cannot exceed 50 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Tax ID contains invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
  founded_year: [
    {
      validator: (_: any, value: number) => {
        if (value === undefined || value === null) return Promise.resolve();
        const currentYear = new Date().getFullYear();
        if (value < 1800 || value > currentYear) {
          return Promise.reject(
            new Error(`Founded year must be between 1800 and ${currentYear}`)
          );
        }
        return Promise.resolve();
      },
    },
  ],
  notes: [
    { max: 1000, message: 'Notes cannot exceed 1000 characters' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        const sanitized = sanitizeInput(value);
        if (sanitized !== value) {
          return Promise.reject(new Error('Notes contain invalid characters'));
        }
        return Promise.resolve();
      },
    },
  ],
};

/**
 * Validates a complete Product object
 * Used at service layer to ensure data integrity
 * @param {any} data - Product data to validate
 * @returns {boolean} True if product is valid
 * @throws {Error} If product is invalid
 */
export const validateProduct = (data: any): boolean => {
  if (!data) throw new Error('Product data is required');
  if (!data.name || typeof data.name !== 'string') throw new Error('Valid product name is required');
  if (!data.sku || typeof data.sku !== 'string') throw new Error('Valid SKU is required');
  if (!isValidSKU(data.sku)) throw new Error('SKU format is invalid');
  if (data.price === undefined || !isValidPrice(data.price)) throw new Error('Valid price is required');
  if (data.category && typeof data.category !== 'string') throw new Error('Category must be a string');
  
  // Optional fields validation if present
  if (data.description && typeof data.description !== 'string') throw new Error('Description must be a string');
  if (data.stockQuantity !== undefined && !isValidQuantity(data.stockQuantity)) throw new Error('Stock quantity must be a non-negative integer');
  if (data.costPrice !== undefined && !isValidPrice(data.costPrice)) throw new Error('Cost price must be a positive number');
  
  return true;
};

/**
 * Validates Product form input data
 * Used at form submission to catch errors early
 * @param {any} formData - Form data to validate
 * @returns {boolean} True if form data is valid
 * @throws {Error} If form data is invalid
 */
export const validateProductForm = (formData: any): boolean => {
  if (!formData) throw new Error('Form data is required');
  
  // Required fields
  if (!formData.name) throw new Error('Product name is required');
  if (formData.name.length < 2) throw new Error('Product name must be at least 2 characters');
  if (formData.name.length > 255) throw new Error('Product name cannot exceed 255 characters');
  
  if (!formData.sku) throw new Error('SKU is required');
  if (!isValidSKU(formData.sku)) throw new Error('SKU format is invalid');
  
  if (!formData.category) throw new Error('Category is required');
  
  if (formData.price === undefined) throw new Error('Price is required');
  if (!isValidPrice(formData.price)) throw new Error('Price must be a non-negative number');
  
  if (!formData.status) throw new Error('Status is required');
  if (!['active', 'inactive', 'discontinued'].includes(formData.status)) throw new Error('Status must be active, inactive, or discontinued');
  
  // Optional fields validation if present
  if (formData.description && formData.description.length > 1000) throw new Error('Description cannot exceed 1000 characters');
  if (formData.costPrice !== undefined && !isValidPrice(formData.costPrice)) throw new Error('Cost price must be a positive number');
  if (formData.stockQuantity !== undefined && !isValidQuantity(formData.stockQuantity)) throw new Error('Stock quantity must be a non-negative integer');
  
  return true;
};

/**
 * Validates a complete Company object
 * Used at service layer to ensure data integrity
 * @param {any} data - Company data to validate
 * @returns {boolean} True if company is valid
 * @throws {Error} If company is invalid
 */
export const validateCompany = (data: any): boolean => {
  if (!data) throw new Error('Company data is required');
  if (!data.name || typeof data.name !== 'string') throw new Error('Valid company name is required');
  if (data.industry && typeof data.industry !== 'string') throw new Error('Industry must be a string');
  if (data.email && !isValidEmail(data.email)) throw new Error('Company email format is invalid');
  if (data.phone && !isValidPhone(data.phone)) throw new Error('Company phone format is invalid');
  if (data.website && !isValidURL(data.website)) throw new Error('Company website URL is invalid');
  
  return true;
};

/**
 * Validates Company form input data
 * Used at form submission to catch errors early
 * @param {any} formData - Form data to validate
 * @returns {boolean} True if form data is valid
 * @throws {Error} If form data is invalid
 */
export const validateCompanyForm = (formData: any): boolean => {
  if (!formData) throw new Error('Form data is required');
  
  // Required fields
  if (!formData.name) throw new Error('Company name is required');
  if (formData.name.length < 2) throw new Error('Company name must be at least 2 characters');
  if (formData.name.length > 255) throw new Error('Company name cannot exceed 255 characters');
  
  if (!formData.industry) throw new Error('Industry is required');
  
  if (!formData.status) throw new Error('Status is required');
  if (!['active', 'inactive'].includes(formData.status)) throw new Error('Status must be active or inactive');
  
  // Optional fields validation if present
  if (formData.email && !isValidEmail(formData.email)) throw new Error('Invalid email format');
  if (formData.phone && !isValidPhone(formData.phone)) throw new Error('Invalid phone format');
  if (formData.website && !isValidURL(formData.website)) throw new Error('Invalid website URL');
  if (formData.address && formData.address.length > 500) throw new Error('Address cannot exceed 500 characters');
  if (formData.foundedYear && (formData.foundedYear < 1800 || formData.foundedYear > new Date().getFullYear())) throw new Error('Founded year is invalid');
  
  return true;
};