/**
 * Masters Module - Utility Function Tests
 * Tests for all validation and helper functions
 * Ensures consistent validation across form and service layers
 * 
 * Coverage:
 * - Input sanitization (XSS prevention)
 * - Field format validation (SKU, Email, Phone, URL, Price, Quantity)
 * - Product validation (complete object + form data)
 * - Company validation (complete object + form data)
 * 
 * @lastUpdated 2025-01-30
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidSKU,
  isValidEmail,
  isValidPhone,
  isValidURL,
  isValidPrice,
  isValidQuantity,
  validateProduct,
  validateProductForm,
  validateCompany,
  validateCompanyForm,
} from '../utils/validation';

// ============================================================================
// INPUT SANITIZATION TESTS
// ============================================================================

describe('Input Sanitization (XSS Prevention)', () => {
  it('should sanitize HTML tags', () => {
    const dirty = '<script>alert("XSS")</script>Product Name';
    const clean = sanitizeInput(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('</script>');
  });

  it('should remove dangerous attributes', () => {
    const dirty = '<img src=x onerror="alert(\'XSS\')">';
    const clean = sanitizeInput(dirty);
    expect(clean).not.toContain('onerror');
  });

  it('should remove event handlers', () => {
    const dirty = '<div onclick="malicious()">Click me</div>';
    const clean = sanitizeInput(dirty);
    expect(clean).not.toContain('onclick');
  });

  it('should preserve safe text', () => {
    const safe = 'Normal Product Name';
    const cleaned = sanitizeInput(safe);
    expect(cleaned).toBe(safe);
  });

  it('should handle empty input', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(null as any)).toBe('');
  });

  it('should remove leading/trailing whitespace', () => {
    const dirty = '  Product Name  ';
    const clean = sanitizeInput(dirty);
    expect(clean).toBe('Product Name');
  });

  it('should handle special characters safely', () => {
    const special = 'Product & Company™ – Limited';
    const clean = sanitizeInput(special);
    expect(clean.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SKU VALIDATION TESTS
// ============================================================================

describe('SKU Validation', () => {
  it('should accept valid SKUs', () => {
    expect(isValidSKU('PRD-001')).toBe(true);
    expect(isValidSKU('PROD_100')).toBe(true);
    expect(isValidSKU('ABC123')).toBe(true);
    expect(isValidSKU('SKU-2025')).toBe(true);
  });

  it('should reject SKUs with invalid characters', () => {
    expect(isValidSKU('PRD@001')).toBe(false);
    expect(isValidSKU('PROD.100')).toBe(false);
    expect(isValidSKU('SKU$2025')).toBe(false);
    expect(isValidSKU('ABC#123')).toBe(false);
  });

  it('should enforce minimum length', () => {
    expect(isValidSKU('A')).toBe(false);
    expect(isValidSKU('AB')).toBe(true);
  });

  it('should enforce maximum length', () => {
    const longSKU = 'A'.repeat(51);
    expect(isValidSKU(longSKU)).toBe(false);

    const validSKU = 'A'.repeat(50);
    expect(isValidSKU(validSKU)).toBe(true);
  });

  it('should handle spaces and special punctuation', () => {
    expect(isValidSKU('PRD 001')).toBe(false);
    expect(isValidSKU('SKU!001')).toBe(false);
  });
});

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

describe('Email Validation', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@company.co.uk')).toBe(true);
    expect(isValidEmail('info+tag@domain.org')).toBe(true);
    expect(isValidEmail('a@b.c')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user..name@example.com')).toBe(false);
  });

  it('should reject emails without domain', () => {
    expect(isValidEmail('test@localhost')).toBe(false);
  });

  it('should reject emails with spaces', () => {
    expect(isValidEmail('test @example.com')).toBe(false);
    expect(isValidEmail('test@ example.com')).toBe(false);
  });
});

// ============================================================================
// PHONE VALIDATION TESTS
// ============================================================================

describe('Phone Validation', () => {
  it('should accept valid phone formats', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidPhone('+44-20-7946-0958')).toBe(true);
    expect(isValidPhone('555-123-4567')).toBe(true);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
    expect(isValidPhone('+1234567890')).toBe(true);
  });

  it('should reject invalid phone formats', () => {
    expect(isValidPhone('abc-def-ghij')).toBe(false);
    expect(isValidPhone('phone')).toBe(false);
    expect(isValidPhone('123')).toBe(false);
  });

  it('should handle international formats', () => {
    expect(isValidPhone('+86-10-1234-5678')).toBe(true); // China
    expect(isValidPhone('+81-3-1234-5678')).toBe(true); // Japan
    expect(isValidPhone('+33-1-42-68-53-00')).toBe(true); // France
  });
});

// ============================================================================
// URL VALIDATION TESTS
// ============================================================================

describe('URL Validation', () => {
  it('should accept valid URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true);
    expect(isValidURL('http://www.example.com')).toBe(true);
    expect(isValidURL('https://example.com/path')).toBe(true);
    expect(isValidURL('https://sub.example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidURL('not a url')).toBe(false);
    expect(isValidURL('ht!tp://example.com')).toBe(false);
    expect(isValidURL('example.com')).toBe(false);
  });

  it('should require protocol', () => {
    expect(isValidURL('www.example.com')).toBe(false);
  });
});

// ============================================================================
// PRICE VALIDATION TESTS
// ============================================================================

describe('Price Validation', () => {
  it('should accept valid prices', () => {
    expect(isValidPrice(0)).toBe(true);
    expect(isValidPrice(99.99)).toBe(true);
    expect(isValidPrice(1000)).toBe(true);
    expect(isValidPrice(0.01)).toBe(true);
  });

  it('should reject negative prices', () => {
    expect(isValidPrice(-1)).toBe(false);
    expect(isValidPrice(-99.99)).toBe(false);
  });

  it('should reject invalid values', () => {
    expect(isValidPrice(undefined)).toBe(false);
    expect(isValidPrice(null as any)).toBe(false);
    expect(isValidPrice(NaN)).toBe(false);
    expect(isValidPrice(Infinity)).toBe(false);
  });

  it('should accept zero', () => {
    expect(isValidPrice(0)).toBe(true);
  });
});

// ============================================================================
// QUANTITY VALIDATION TESTS
// ============================================================================

describe('Quantity Validation', () => {
  it('should accept valid quantities', () => {
    expect(isValidQuantity(0)).toBe(true);
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(100)).toBe(true);
    expect(isValidQuantity(999999)).toBe(true);
  });

  it('should reject negative quantities', () => {
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(-100)).toBe(false);
  });

  it('should reject decimals', () => {
    expect(isValidQuantity(99.5)).toBe(false);
    expect(isValidQuantity(1.1)).toBe(false);
  });

  it('should reject invalid values', () => {
    expect(isValidQuantity(undefined)).toBe(false);
    expect(isValidQuantity(null as any)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
  });

  it('should accept zero', () => {
    expect(isValidQuantity(0)).toBe(true);
  });
});

// ============================================================================
// PRODUCT VALIDATION TESTS
// ============================================================================

describe('Product Object Validation', () => {
  const validProduct = {
    id: 'prod-123',
    name: 'Test Product',
    sku: 'TEST-001',
    category: 'Electronics',
    price: 99.99,
    status: 'active',
  };

  it('should validate complete valid product', () => {
    expect(() => validateProduct(validProduct)).not.toThrow();
  });

  it('should reject null/undefined product', () => {
    expect(() => validateProduct(null)).toThrow('Product data is required');
    expect(() => validateProduct(undefined)).toThrow('Product data is required');
  });

  it('should require product name', () => {
    const noName = { ...validProduct, name: undefined };
    expect(() => validateProduct(noName)).toThrow('Valid product name is required');
  });

  it('should require valid SKU', () => {
    const invalidSKU = { ...validProduct, sku: 'INVALID@SKU' };
    expect(() => validateProduct(invalidSKU)).toThrow('SKU format is invalid');
  });

  it('should require valid price', () => {
    const invalidPrice = { ...validProduct, price: -10 };
    expect(() => validateProduct(invalidPrice)).toThrow('Valid price is required');

    const noPrice = { ...validProduct, price: undefined };
    expect(() => validateProduct(noPrice)).toThrow('Valid price is required');
  });

  it('should validate optional fields if present', () => {
    const productWithOptional = {
      ...validProduct,
      description: 'Valid description',
      stockQuantity: 100,
      costPrice: 50.00,
    };
    expect(() => validateProduct(productWithOptional)).not.toThrow();
  });

  it('should reject invalid optional field values', () => {
    const invalidStock = { ...validProduct, stockQuantity: -5 };
    expect(() => validateProduct(invalidStock)).toThrow('Stock quantity must be a non-negative integer');

    const invalidCost = { ...validProduct, costPrice: -10 };
    expect(() => validateProduct(invalidCost)).toThrow('Cost price must be a positive number');
  });
});

// ============================================================================
// PRODUCT FORM VALIDATION TESTS
// ============================================================================

describe('Product Form Validation', () => {
  const validFormData = {
    name: 'Test Product',
    sku: 'TEST-001',
    category: 'Electronics',
    price: 99.99,
    status: 'active',
  };

  it('should validate complete valid form data', () => {
    expect(() => validateProductForm(validFormData)).not.toThrow();
  });

  it('should enforce minimum name length', () => {
    const shortName = { ...validFormData, name: 'A' };
    expect(() => validateProductForm(shortName)).toThrow('at least 2 characters');
  });

  it('should enforce maximum name length', () => {
    const longName = { ...validFormData, name: 'A'.repeat(256) };
    expect(() => validateProductForm(longName)).toThrow('cannot exceed 255 characters');
  });

  it('should require valid status', () => {
    const invalidStatus = { ...validFormData, status: 'unknown' };
    expect(() => validateProductForm(invalidStatus)).toThrow('Status must be active');
  });

  it('should accept all valid statuses', () => {
    expect(() => validateProductForm({ ...validFormData, status: 'active' })).not.toThrow();
    expect(() => validateProductForm({ ...validFormData, status: 'inactive' })).not.toThrow();
    expect(() => validateProductForm({ ...validFormData, status: 'discontinued' })).not.toThrow();
  });

  it('should enforce description max length', () => {
    const longDesc = { ...validFormData, description: 'A'.repeat(1001) };
    expect(() => validateProductForm(longDesc)).toThrow('Description cannot exceed 1000 characters');
  });

  it('should accept optional fields', () => {
    const withOptionals = {
      ...validFormData,
      description: 'Optional description',
      costPrice: 50.00,
      stockQuantity: 100,
    };
    expect(() => validateProductForm(withOptionals)).not.toThrow();
  });
});

// ============================================================================
// COMPANY VALIDATION TESTS
// ============================================================================

describe('Company Object Validation', () => {
  const validCompany = {
    id: 'comp-123',
    name: 'Test Company',
    industry: 'Technology',
    status: 'active',
  };

  it('should validate complete valid company', () => {
    expect(() => validateCompany(validCompany)).not.toThrow();
  });

  it('should reject null/undefined company', () => {
    expect(() => validateCompany(null)).toThrow('Company data is required');
    expect(() => validateCompany(undefined)).toThrow('Company data is required');
  });

  it('should require company name', () => {
    const noName = { ...validCompany, name: undefined };
    expect(() => validateCompany(noName)).toThrow('Valid company name is required');
  });

  it('should validate email if present', () => {
    const invalidEmail = { ...validCompany, email: 'not-an-email' };
    expect(() => validateCompany(invalidEmail)).toThrow('Company email format is invalid');

    const validEmail = { ...validCompany, email: 'test@company.com' };
    expect(() => validateCompany(validEmail)).not.toThrow();
  });

  it('should validate phone if present', () => {
    const invalidPhone = { ...validCompany, phone: 'abc' };
    expect(() => validateCompany(invalidPhone)).toThrow('Company phone format is invalid');

    const validPhone = { ...validCompany, phone: '+1-555-0123' };
    expect(() => validateCompany(validPhone)).not.toThrow();
  });

  it('should validate website URL if present', () => {
    const invalidURL = { ...validCompany, website: 'not-a-url' };
    expect(() => validateCompany(invalidURL)).toThrow('Company website URL is invalid');

    const validURL = { ...validCompany, website: 'https://company.com' };
    expect(() => validateCompany(validURL)).not.toThrow();
  });
});

// ============================================================================
// COMPANY FORM VALIDATION TESTS
// ============================================================================

describe('Company Form Validation', () => {
  const validFormData = {
    name: 'Test Company',
    industry: 'Technology',
    status: 'active',
  };

  it('should validate complete valid form data', () => {
    expect(() => validateCompanyForm(validFormData)).not.toThrow();
  });

  it('should enforce minimum name length', () => {
    const shortName = { ...validFormData, name: 'A' };
    expect(() => validateCompanyForm(shortName)).toThrow('at least 2 characters');
  });

  it('should enforce maximum name length', () => {
    const longName = { ...validFormData, name: 'A'.repeat(256) };
    expect(() => validateCompanyForm(longName)).toThrow('cannot exceed 255 characters');
  });

  it('should accept valid statuses', () => {
    expect(() => validateCompanyForm({ ...validFormData, status: 'active' })).not.toThrow();
    expect(() => validateCompanyForm({ ...validFormData, status: 'inactive' })).not.toThrow();
  });

  it('should validate optional email field', () => {
    const invalidEmail = { ...validFormData, email: 'invalid-email' };
    expect(() => validateCompanyForm(invalidEmail)).toThrow('Invalid email format');

    const validEmail = { ...validFormData, email: 'test@company.com' };
    expect(() => validateCompanyForm(validEmail)).not.toThrow();
  });

  it('should validate optional phone field', () => {
    const invalidPhone = { ...validFormData, phone: 'bad' };
    expect(() => validateCompanyForm(invalidPhone)).toThrow('Invalid phone format');

    const validPhone = { ...validFormData, phone: '+1-555-0123' };
    expect(() => validateCompanyForm(validPhone)).not.toThrow();
  });

  it('should validate optional website field', () => {
    const invalidWebsite = { ...validFormData, website: 'not-a-url' };
    expect(() => validateCompanyForm(invalidWebsite)).toThrow('Invalid website URL');

    const validWebsite = { ...validFormData, website: 'https://company.com' };
    expect(() => validateCompanyForm(validWebsite)).not.toThrow();
  });

  it('should enforce address max length', () => {
    const longAddress = { ...validFormData, address: 'A'.repeat(501) };
    expect(() => validateCompanyForm(longAddress)).toThrow('Address cannot exceed 500 characters');
  });

  it('should validate founded year if present', () => {
    const invalidYear = { ...validFormData, foundedYear: 2030 }; // Future year
    expect(() => validateCompanyForm(invalidYear)).toThrow('Founded year is invalid');

    const validYear = { ...validFormData, foundedYear: 2000 };
    expect(() => validateCompanyForm(validYear)).not.toThrow();
  });
});

/**
 * Version History
 * v1.0 - 2025-01-30 - Initial comprehensive utility tests
 *   - Input sanitization/XSS prevention
 *   - SKU validation
 *   - Email validation
 *   - Phone validation
 *   - URL validation
 *   - Price validation
 *   - Quantity validation
 *   - Product object and form validation
 *   - Company object and form validation
 *   - All edge cases and error scenarios
 */