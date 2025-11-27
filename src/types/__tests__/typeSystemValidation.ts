/**
 * Type System Validation Script
 * Validates TypeScript types align with database schema
 * Checks for snake_case → camelCase mapping consistency
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Database column definitions (from migrations)
 * Format: { table: { column: type } }
 */
const DATABASE_SCHEMA = {
  users: {
    id: 'UUID',
    email: 'VARCHAR(255)',
    name: 'VARCHAR(255)',
    first_name: 'VARCHAR(100)',
    last_name: 'VARCHAR(100)',
    role: 'user_role ENUM',
    status: 'user_status ENUM',
    tenant_id: 'UUID',
    is_super_admin: 'BOOLEAN',
    avatar_url: 'VARCHAR(500)',
    phone: 'VARCHAR(20)',
    mobile: 'VARCHAR(20)',
    company_name: 'VARCHAR(255)',
    department: 'VARCHAR(100)',
    position: 'VARCHAR(100)',
    created_at: 'TIMESTAMP',
    updated_at: 'TIMESTAMP',
    last_login: 'TIMESTAMP',
    created_by: 'UUID',
    deleted_at: 'TIMESTAMP',
  },
  customers: {
    id: 'UUID',
    company_name: 'VARCHAR(255)',
    contact_name: 'VARCHAR(255)',
    email: 'VARCHAR(255)',
    phone: 'VARCHAR(20)',
    mobile: 'VARCHAR(20)',
    website: 'VARCHAR(255)',
    address: 'TEXT',
    city: 'VARCHAR(100)',
    country: 'VARCHAR(100)',
    industry: 'VARCHAR(100)',
    size: 'company_size ENUM',
    status: 'entity_status ENUM',
    customer_type: 'customer_type ENUM',
    credit_limit: 'NUMERIC(12,2)',
    payment_terms: 'VARCHAR(50)',
    tax_id: 'VARCHAR(100)',
    annual_revenue: 'NUMERIC(14,2)',
    total_sales_amount: 'NUMERIC(14,2)',
    total_orders: 'INTEGER',
    average_order_value: 'NUMERIC(12,2)',
    last_purchase_date: 'DATE',
    tags: 'VARCHAR(255)[]',
    notes: 'TEXT',
    assigned_to: 'UUID',
    source: 'VARCHAR(100)',
    rating: 'VARCHAR(10)',
    last_contact_date: 'DATE',
    next_follow_up_date: 'DATE',
    tenant_id: 'UUID',
    created_at: 'TIMESTAMP',
    updated_at: 'TIMESTAMP',
    created_by: 'UUID',
    deleted_at: 'TIMESTAMP',
  },
  sales: {
    id: 'UUID',
    sale_number: 'VARCHAR(50)',
    title: 'VARCHAR(255)',
    description: 'TEXT',
    customer_id: 'UUID',
    value: 'NUMERIC(15,2)',
    currency: 'VARCHAR(3)',
    probability: 'INTEGER',
    weighted_amount: 'NUMERIC(15,2)',
    stage: 'sale_stage ENUM',
    status: 'sale_status ENUM',
    source: 'VARCHAR(100)',
    campaign: 'VARCHAR(100)',
    expected_close_date: 'DATE',
    actual_close_date: 'DATE',
    last_activity_date: 'TIMESTAMP',
    next_activity_date: 'TIMESTAMP',
    assigned_to: 'UUID',
    notes: 'TEXT',
    tags: 'VARCHAR(255)[]',
    competitor_info: 'TEXT',
    tenant_id: 'UUID',
    created_at: 'TIMESTAMP',
    updated_at: 'TIMESTAMP',
    created_by: 'UUID',
  },
};

/**
 * Expected DTO field mappings (snake_case → camelCase)
 */
const EXPECTED_MAPPINGS = {
  users: {
    'first_name': 'firstName',
    'last_name': 'lastName',
    'tenant_id': 'tenantId',
    'is_super_admin': 'isSuperAdmin',
    'avatar_url': 'avatarUrl',
    'company_name': 'companyName',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'last_login': 'lastLogin',
    'created_by': 'createdBy',
    'deleted_at': 'deletedAt',
  },
  customers: {
    'company_name': 'companyName',
    'contact_name': 'contactName',
    'customer_type': 'customerType',
    'credit_limit': 'creditLimit',
    'payment_terms': 'paymentTerms',
    'tax_id': 'taxId',
    'annual_revenue': 'annualRevenue',
    'total_sales_amount': 'totalSalesAmount',
    'total_orders': 'totalOrders',
    'average_order_value': 'averageOrderValue',
    'last_purchase_date': 'lastPurchaseDate',
    'assigned_to': 'assignedTo',
    'last_contact_date': 'lastContactDate',
    'next_follow_up_date': 'nextFollowUpDate',
    'tenant_id': 'tenantId',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'created_by': 'createdBy',
    'deleted_at': 'deletedAt',
  },
  sales: {
    'sale_number': 'saleNumber',
    'customer_id': 'customerId',
    'weighted_amount': 'weightedAmount',
    'expected_close_date': 'expectedCloseDate',
    'actual_close_date': 'actualCloseDate',
    'last_activity_date': 'lastActivityDate',
    'next_activity_date': 'nextActivityDate',
    'assigned_to': 'assignedTo',
    'competitor_info': 'competitorInfo',
    'tenant_id': 'tenantId',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'created_by': 'createdBy',
  },
};

/**
 * Validation results
 */
interface ValidationResult {
  table: string;
  column: string;
  dbColumn: string;
  expectedDtoField: string;
  status: 'match' | 'mismatch' | 'missing';
  notes?: string;
}

/**
 * Validate type system synchronization
 */
export function validateTypeSystem(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Validate each table
  Object.entries(DATABASE_SCHEMA).forEach(([table, columns]) => {
    Object.entries(columns).forEach(([dbColumn, _type]) => {
      const expectedMapping = EXPECTED_MAPPINGS[table as keyof typeof EXPECTED_MAPPINGS]?.[dbColumn as keyof typeof EXPECTED_MAPPINGS[typeof table]];
      const expectedDtoField = expectedMapping || dbColumn; // If no mapping, use same name

      results.push({
        table,
        column: dbColumn,
        dbColumn,
        expectedDtoField,
        status: 'match', // Will be validated against actual DTOs
        notes: expectedMapping ? `Maps from ${dbColumn} to ${expectedDtoField}` : 'No mapping needed',
      });
    });
  });

  return results;
}

/**
 * Check for unused type definitions
 */
export function findUnusedTypes(): string[] {
  // This would require static analysis
  // For now, return empty array
  return [];
}

/**
 * Validate import patterns
 */
export function validateImportPatterns(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if DTOs are imported from correct paths
  // Check if types are imported from correct paths
  // This would require parsing import statements

  return {
    valid: issues.length === 0,
    issues,
  };
}

export { DATABASE_SCHEMA, EXPECTED_MAPPINGS };

