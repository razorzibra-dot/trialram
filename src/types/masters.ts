// Master Data Type Definitions for Phase 5

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status?: 'active' | 'inactive' | 'prospect';
  description?: string;
  logo_url?: string;
  registration_number?: string;
  tax_id?: string;
  founded_year?: string | number;
  notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  // ✅ NORMALIZED: category_id instead of category (remove denormalized string)
  category_id?: string;
  categoryName?: string; // Optional: populated via JOIN or view if needed
  brand?: string;
  manufacturer?: string;
  type?: string;
  sku: string;

  // Pricing Information
  price: number;
  cost_price?: number;
  currency?: string;

  // Product Classification
  // ✅ NORMALIZED: Use status enum only (removed redundant is_active)
  status?: 'active' | 'inactive' | 'discontinued';
  is_service?: boolean;

  // Stock Management
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  track_stock?: boolean;
  unit?: string;
  min_order_quantity?: number;

  // Physical Properties
  weight?: number;
  dimensions?: string;

  // Supplier Information
  // ✅ NORMALIZED: supplier_id only (removed denormalized supplier_name)
  supplier_id?: string;

  // Additional Information
  tags?: string[];
  specifications?: ProductSpecification[];
  images?: string[];
  image_url?: string;
  warranty_period?: number; // in months
  service_contract_available?: boolean;
  notes?: string;

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
}

// CustomerMaster is now unified with Customer in crm.ts
// Use Customer interface from crm.ts instead

// Form interfaces for creating/editing
export interface CompanyFormData {
  name: string;
  industry: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status?: 'active' | 'inactive' | 'prospect';
  registration_number?: string;
  tax_id?: string;
  founded_year?: string | number;
  notes?: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  // ✅ NORMALIZED: Use category_id (user selects from dropdown)
  category_id?: string;
  brand?: string;
  manufacturer?: string;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
  unit?: string;
  // ✅ NORMALIZED: Use status enum only
  status?: 'active' | 'inactive' | 'discontinued';
  description?: string;
  notes?: string;
  // ✅ NORMALIZED: supplier_id instead of supplier_name
  supplier_id?: string;
}

// Customer form data - unified interface for all customer forms
export interface CustomerFormData {
  // Company Information
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  mobile?: string;
  website?: string;

  // Address Information
  address: string;
  city: string;
  country: string;

  // Business Information
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect' | 'suspended';
  customer_type: 'individual' | 'business' | 'enterprise';

  // Financial Information
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  annual_revenue?: number;

  // Relationship Information
  notes?: string;
  assigned_to?: string;
  source?: string;
  rating?: string;
}

// Filter interfaces
export interface CompanyFilters {
  search?: string;
  industry?: string;
  size?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductFilters {
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  price_min?: number;
  price_max?: number;
  page?: number;
  pageSize?: number;
}

// CustomerMasterFilters removed - use CustomerFilters from crm.ts instead

// Dropdown option interfaces
export interface MasterDataOption {
  value: string;
  label: string;
  description?: string;
}

// Constants for dropdowns
export const COMPANY_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Media',
  'Transportation',
  'Energy',
  'Agriculture',
  'Other'
] as const;

export const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
] as const;

export const PRODUCT_TYPES = [
  'Software',
  'Hardware',
  'Service',
  'Subscription',
  'License',
  'Support',
  'Training',
  'Consulting',
  'Other'
] as const;

export const PRODUCT_CATEGORIES = [
  'CRM',
  'ERP',
  'Analytics',
  'Security',
  'Infrastructure',
  'Development Tools',
  'Communication',
  'Productivity',
  'Marketing',
  'Sales',
  'Support',
  'Other'
] as const;

export const CUSTOMER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
] as const;

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'INR',
  'SGD'
] as const;

export const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Due on Receipt',
  'Cash on Delivery',
  'Prepaid',
  'Custom'
] as const;

// API Response interfaces
export interface MasterDataResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MasterDataStats {
  total_companies: number;
  active_companies: number;
  total_products: number;
  active_products: number;
  total_customers: number;
  active_customers: number;
}