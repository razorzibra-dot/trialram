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

export interface ProductCategory {
   id: string;
   name: string;
   description?: string;
   parent_id?: string; // For hierarchical categories
   level: number; // Category level (1 = root, 2 = child, etc.)
   path?: string; // Full path for quick lookups (e.g., "Electronics/Computers/Laptops")
   sort_order?: number;
   is_active: boolean;
   image_url?: string;
   icon?: string;
   color?: string;
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

  // Product Hierarchy
  parent_id?: string; // For product hierarchy (parent/child relationships)
  is_variant?: boolean; // Whether this is a variant of another product
  variant_group_id?: string; // Groups variants together

  // Pricing Information
  price: number;
  cost_price?: number;
  currency?: string;
  // Advanced pricing
  pricing_tiers?: PricingTier[];
  discount_rules?: DiscountRule[];

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

export interface PricingTier {
   id: string;
   min_quantity: number;
   max_quantity?: number;
   price: number;
   discount_percentage?: number;
   description?: string;
}

export interface DiscountRule {
   id: string;
   type: 'percentage' | 'fixed' | 'buy_x_get_y';
   value: number;
   conditions?: Record<string, any>;
   description?: string;
   is_active: boolean;
   valid_from?: string;
   valid_until?: string;
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
    type?: string;
    price: number;
    cost_price?: number;
    currency?: string;
    // Advanced pricing
    pricing_tiers?: PricingTier[];
    discount_rules?: DiscountRule[];
    stock_quantity?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_level?: number;
    unit?: string;
    // ✅ NORMALIZED: Use status enum only
    status?: 'active' | 'inactive' | 'discontinued';
    description?: string;
    notes?: string;
    // ✅ NORMALIZED: supplier_id instead of supplier_name
    supplier_id?: string;
    warranty_period?: number;
    service_contract_available?: boolean;

    // Product Hierarchy
    parent_id?: string;
    is_variant?: boolean;
    variant_group_id?: string;
}

export interface ProductCategoryFormData {
   name: string;
   description?: string;
   parent_id?: string;
   sort_order?: number;
   is_active?: boolean;
   image_url?: string;
   icon?: string;
   color?: string;
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

// Purchase Order Types for Inventory Management
export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string; // Populated via JOIN
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  total_amount: number;
  currency: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  ordered_by: string;
  ordered_at: string;
  received_by?: string;
  received_at?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string; // Populated via JOIN
  product_sku?: string; // Populated via JOIN
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderFormData {
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  currency?: string;
  notes?: string;
  items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
  product_id: string;
  quantity_ordered: number;
  unit_price: number;
  notes?: string;
}

export interface PurchaseOrderFilters {
  status?: string;
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrderStats {
  total_orders: number;
  pending_orders: number;
  approved_orders: number;
  received_orders: number;
  total_value: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  orders_by_supplier: Record<string, number>;
}