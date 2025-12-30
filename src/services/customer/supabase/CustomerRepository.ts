/**
 * Customer Repository
 * Layer 4: Database access layer using GenericRepository pattern
 * 
 * Extends GenericRepository to provide customer-specific database operations
 * with built-in tenant isolation, filtering, and search capabilities.
 */

import { GenericRepository } from '@/services/core/GenericRepository';
import { Customer, CustomerTag } from '@/types/crm';
import { RepositoryConfig } from '@/types/generic';

/**
 * Database row type for customers table (snake_case from DB)
 * 
 * Note: Computed fields (total_sales_amount, total_orders, average_order_value, last_purchase_date)
 * were removed from the customers table. They are now computed in the customer_summary materialized view.
 * These fields are NOT included here as they don't exist in the base table.
 */
export interface CustomerRow {
  id: string;
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  size?: string;
  status: string;
  customer_type?: string;
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  annual_revenue?: number;
  tags?: string[];
  notes?: string;
  assigned_to?: string;
  source?: string;
  rating?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
}

/**
 * Mapper: Converts snake_case DB row to camelCase TypeScript type
 * 
 * Note: Computed fields (totalSalesAmount, totalOrders, averageOrderValue, lastPurchaseDate)
 * are NOT included here as they don't exist in the customers table.
 * These must be loaded separately from customer_summary view or computed via getCustomerStats().
 */
const mapCustomerRow = (row: CustomerRow): Customer => ({
  id: row.id,
  companyName: row.company_name,
  contactName: row.contact_name,
  email: row.email,
  phone: row.phone,
  mobile: row.mobile,
  website: row.website,
  address: row.address,
  city: row.city,
  country: row.country,
  industry: row.industry,
  size: row.size as any,
  status: row.status as any,
  customerType: row.customer_type as any,
  creditLimit: row.credit_limit,
  paymentTerms: row.payment_terms,
  taxId: row.tax_id,
  annualRevenue: row.annual_revenue,
  // Computed fields - these come from customer_summary view, not base table
  totalSalesAmount: undefined,
  totalOrders: undefined,
  averageOrderValue: undefined,
  lastPurchaseDate: undefined,
  // Convert database string array to CustomerTag objects
  tags: row.tags ? row.tags.map((tagName, index) => ({
    id: `tag-${index}`,
    name: tagName,
    color: '#1890ff' // Default color
  })) : [],
  notes: row.notes,
  assignedTo: row.assigned_to,
  source: row.source,
  rating: row.rating,
  lastContactDate: row.last_contact_date,
  nextFollowUpDate: row.next_follow_up_date,
  tenantId: row.tenant_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  deletedAt: row.deleted_at
});

/**
 * Reverse mapper: Converts camelCase type back to snake_case for DB insert/update
 * Only includes fields that can be set by users (excludes computed/read-only fields)
 */
const unmapCustomerRow = (customer: Partial<Customer>): Partial<CustomerRow> => {
  const mapped: Partial<CustomerRow> = {};

  // Normalize enums to match database constraints
  const allowedCustomerTypes = new Set(['individual', 'business', 'enterprise']);
  const normalizeCustomerType = (val?: string): string | undefined => {
    if (!val) return undefined;
    const v = String(val).toLowerCase();
    if (allowedCustomerTypes.has(v)) return v;
    const legacyMap: Record<string, string> = {
      corporate: 'enterprise',
      gov: 'business',
      government: 'business',
    };
    return legacyMap[v] || undefined;
  };
  
  // Only map fields that are explicitly provided and are not computed/read-only
  if (customer.companyName !== undefined) mapped.company_name = customer.companyName;
  if (customer.contactName !== undefined) mapped.contact_name = customer.contactName;
  if (customer.email !== undefined) mapped.email = customer.email;
  if (customer.phone !== undefined) mapped.phone = customer.phone;
  if (customer.mobile !== undefined) mapped.mobile = customer.mobile;
  if (customer.website !== undefined) mapped.website = customer.website;
  if (customer.address !== undefined) mapped.address = customer.address;
  if (customer.city !== undefined) mapped.city = customer.city;
  if (customer.country !== undefined) mapped.country = customer.country;
  if (customer.industry !== undefined) mapped.industry = customer.industry;
  if (customer.size !== undefined) mapped.size = customer.size;
  if (customer.status !== undefined) mapped.status = customer.status;
  if (customer.customerType !== undefined) {
    const normalized = normalizeCustomerType(customer.customerType as any);
    if (normalized) mapped.customer_type = normalized as any;
  }
  if (customer.creditLimit !== undefined) mapped.credit_limit = customer.creditLimit;
  if (customer.paymentTerms !== undefined) mapped.payment_terms = customer.paymentTerms;
  if (customer.taxId !== undefined) mapped.tax_id = customer.taxId;
  if (customer.annualRevenue !== undefined) mapped.annual_revenue = customer.annualRevenue;
  if (customer.notes !== undefined) mapped.notes = customer.notes;
  if (customer.assignedTo !== undefined) mapped.assigned_to = customer.assignedTo;
  if (customer.source !== undefined) mapped.source = customer.source;
  if (customer.rating !== undefined) mapped.rating = customer.rating;
  if (customer.lastContactDate !== undefined) mapped.last_contact_date = customer.lastContactDate;
  if (customer.nextFollowUpDate !== undefined) mapped.next_follow_up_date = customer.nextFollowUpDate;
  
  // Convert tags back to database format: array of tag names (strings)
  // Tags come from form as either CustomerTag objects or strings
  if (customer.tags !== undefined) {
    if (Array.isArray(customer.tags)) {
      // Extract tag names: if objects with 'name' property, use that; otherwise use as-is
      mapped.tags = customer.tags.map(tag => 
        typeof tag === 'string' ? tag : (tag as any).name || ''
      ).filter(Boolean); // Remove empty strings
    } else {
      mapped.tags = [];
    }
  }
  
  // Explicitly DO NOT map these computed/read-only fields:
  // - total_sales_amount, total_orders, average_order_value, last_purchase_date
  // These are calculated by the database and should never be set by the application
  
  return mapped;
};

/**
 * CustomerRepository
 * 
 * Repository configuration:
 * - Table: customers
 * - Search fields: company_name, contact_name, email, city, country
 * - Soft delete: Yes (deleted_at)
 * - Mapper: mapCustomerRow
 */
export class CustomerRepository extends GenericRepository<Customer, Partial<Customer>, Partial<Customer>, CustomerRow> {
  constructor() {
    const config: RepositoryConfig<Customer, CustomerRow> = {
      tableName: 'customers',
      searchFields: ['company_name', 'contact_name', 'email', 'city', 'country'],
      softDelete: {
        enabled: true,
        field: 'deleted_at'
      },
      mapper: mapCustomerRow,
      reverseMapper: unmapCustomerRow,
      // Note: Computed fields (total_sales_amount, total_orders, average_order_value, last_purchase_date)
      // were removed from customers table and moved to customer_summary view. Only select actual table columns.
      selectFields: 'id,company_name,contact_name,email,phone,mobile,website,address,city,country,industry,size,status,customer_type,credit_limit,payment_terms,tax_id,annual_revenue,notes,assigned_to,source,rating,last_contact_date,next_follow_up_date,tags,tenant_id,created_at,updated_at,created_by,deleted_at',
      // Read-only fields: auto-generated, tenant isolation, and audit fields
      // Note: customers table has created_by but NOT updated_by (column doesn't exist)
      readOnlyFields: ['id', 'created_at', 'updated_at', 'created_by', 'deleted_at', 'tenant_id', 'updated_by'],
      // Allow UI filters to map directly to database columns (case-insensitive)
      filterHandlers: {
        industry: (query, value) => (query as any).ilike('industry', value),
        size: (query, value) => (query as any).ilike('size', value),
        customerType: (query, value) => (query as any).ilike('customer_type', value),
        rating: (query, value) => (query as any).ilike('rating', value),
        source: (query, value) => (query as any).ilike('source', value),
        assignedTo: (query, value) => (query as any).ilike('assigned_to', value),
      }
    };
    
    super(config);
  }
}
