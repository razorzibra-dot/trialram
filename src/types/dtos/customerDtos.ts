/**
 * Customer Service DTOs
 * Standardized data transfer objects for customer operations
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, EntityStatus, PaginatedResponseDTO, DistributionDTO } from './commonDtos';

/**
 * Customer Profile DTO
 * Complete customer information
 * 
 * STANDARDIZED FIELD NAMES:
 * - Status: 'active' | 'inactive' | 'prospect' | 'inactive'
 * - Industry: string (e.g., 'Technology', 'Finance')
 * - Company size: 'startup' | 'small' | 'medium' | 'enterprise'
 */
export interface CustomerDTO {
  /** Unique customer identifier */
  id: string;
  
  /** Customer name */
  name: string;
  
  /** Customer email */
  email: string;
  
  /** Customer phone number */
  phone?: string;
  
  /** Customer company name */
  companyName?: string;
  
  /** Business industry */
  industry?: string;
  
  /** Company size: startup, small, medium, or enterprise */
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  
  /** Customer address */
  address?: string;
  
  /** Customer city */
  city?: string;
  
  /** Customer state/province */
  state?: string;
  
  /** Customer country */
  country?: string;
  
  /** Postal/ZIP code */
  postalCode?: string;
  
  /** Customer status: active, inactive, or prospect */
  status: 'active' | 'inactive' | 'prospect';
  
  /** Customer type: individual or organization */
  type?: 'individual' | 'organization';
  
  /** Annual revenue (if applicable) */
  annualRevenue?: number;
  
  /** Number of employees */
  numberOfEmployees?: number;
  
  /** Website URL */
  website?: string;
  
  /** Customer tags for categorization */
  tags?: string[];
  
  /** Primary contact person name */
  primaryContactName?: string;
  
  /** Primary contact phone */
  primaryContactPhone?: string;
  
  /** Primary contact email */
  primaryContactEmail?: string;
  
  /** Customer notes/description */
  notes?: string;
  
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  
  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Customer Statistics DTO
 * Key metrics and statistics for customer base
 * 
 * STANDARDIZED FIELD NAMES (fixed from previous customer.ts):
 * - totalCustomers (not: total)
 * - activeCustomers (not: active)
 * - prospectCustomers (not: prospects)
 * - inactiveCustomers (not: inactive)
 */
export interface CustomerStatsDTO {
  /** Total number of customers */
  totalCustomers: number;
  
  /** Number of active customers */
  activeCustomers: number;
  
  /** Number of prospect customers */
  prospectCustomers: number;
  
  /** Number of inactive customers */
  inactiveCustomers: number;
  
  /** New customers added this month */
  newCustomersThisMonth: number;
  
  /** Customer churn rate (percentage) */
  churnRate: number;
  
  /** Customers by industry */
  byIndustry: DistributionDTO;
  
  /** Customers by company size */
  bySize: DistributionDTO;
  
  /** Customers by status */
  byStatus: DistributionDTO;
  
  /** Customers by region */
  byRegion?: DistributionDTO;
  
  /** Top industries by customer count */
  topIndustries?: Array<{ industry: string; count: number }>;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create Customer Request DTO
 * Data required to create a new customer
 */
export interface CreateCustomerDTO {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: 'active' | 'inactive' | 'prospect';
  type?: 'individual' | 'organization';
  annualRevenue?: number;
  numberOfEmployees?: number;
  website?: string;
  tags?: string[];
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

/**
 * Update Customer Request DTO
 * Data for updating an existing customer (all fields optional)
 */
export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: 'active' | 'inactive' | 'prospect';
  type?: 'individual' | 'organization';
  annualRevenue?: number;
  numberOfEmployees?: number;
  website?: string;
  tags?: string[];
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

/**
 * Customer Filters DTO
 * Filtering parameters for customer list queries
 */
export interface CustomerFiltersDTO {
  search?: string;
  status?: 'active' | 'inactive' | 'prospect';
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  region?: string;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Customer List Response DTO
 */
export type CustomerListResponseDTO = PaginatedResponseDTO<CustomerDTO>;

/**
 * Customer Tag DTO
 */
export interface CustomerTagDTO {
  id: string;
  name: string;
  color?: string;
  description?: string;
  usageCount: number;
  tenantId: string;
}

/**
 * Bulk Customer Update DTO
 */
export interface BulkCustomerUpdateDTO {
  customerIds: string[];
  updates: Partial<UpdateCustomerDTO>;
}

/**
 * Bulk Customer Delete DTO
 */
export interface BulkCustomerDeleteDTO {
  customerIds: string[];
  reason?: string;
}

/**
 * Customer Export DTO
 */
export interface CustomerExportDTO {
  filters?: CustomerFiltersDTO;
  fields?: (keyof CustomerDTO)[];
  format: 'csv' | 'excel' | 'json';
}

/**
 * Customer Activity DTO
 */
export interface CustomerActivityDTO {
  customerId: string;
  lastSaleDate?: string;
  lastTicketDate?: string;
  totalSalesValue?: number;
  totalTickets?: number;
  totalContracts?: number;
}

/**
 * Customer Segment DTO
 */
export interface CustomerSegmentDTO {
  id: string;
  name: string;
  description?: string;
  criteria: CustomerFiltersDTO;
  customerCount: number;
  revenue?: number;
  createdAt: string;
}