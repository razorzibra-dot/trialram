/**
 * LAYER 2: TYPES - Reference Data Types
 * ============================================================================
 * TypeScript interfaces matching database schema exactly (snake_case → camelCase)
 * Part of 8-layer sync pattern for dynamic data loading architecture
 */

// ============================================================================
// 1. STATUS OPTIONS TYPES
// ============================================================================

export interface StatusOption {
  id: string;
  tenantId: string;
  module: string;  // 'sales', 'tickets', 'contracts', 'jobwork', 'complaints', etc.
  statusKey: string;  // 'pending', 'completed', 'cancelled', etc.
  displayLabel: string;  // 'Pending Review', 'In Progress', etc.
  description?: string;
  colorCode?: string;  // '#FF5733'
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateStatusOptionDTO {
  tenantId: string;
  module: string;
  statusKey: string;
  displayLabel: string;
  description?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateStatusOptionDTO {
  displayLabel?: string;
  description?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// 2. REFERENCE DATA TYPES
// ============================================================================

export interface ReferenceData {
  id: string;
  tenantId: string;
  category: string;  // 'priority', 'severity', 'department', etc.
  key: string;  // 'high', 'low', 'critical', etc.
  label: string;  // User-friendly label
  description?: string;
  metadata?: Record<string, any>;  // {color: '#FF5733', icon: 'AlertCircle'}
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateReferenceDataDTO {
  tenantId: string;
  category: string;
  key: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateReferenceDataDTO {
  label?: string;
  description?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// 3. PRODUCT CATEGORIES TYPES
// ============================================================================

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateProductCategoryDTO {
  tenantId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateProductCategoryDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================================================
// 4. SUPPLIERS TYPES
// ============================================================================

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  country?: string;
  isActive: boolean;
  sortOrder: number;
  notes?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface CreateSupplierDTO {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  country?: string;
  isActive?: boolean;
  sortOrder?: number;
  notes?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface UpdateSupplierDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  country?: string;
  isActive?: boolean;
  sortOrder?: number;
  notes?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

// ============================================================================
// 5. COMPOSITE TYPES - All Reference Data
// ============================================================================

export interface AllReferenceData {
  statusOptions: StatusOption[];
  referenceData: ReferenceData[];
  categories: ProductCategory[];
  suppliers: Supplier[];
}

export interface ReferenceDataLoadResult {
  statusOptions: StatusOption[];
  referenceData: ReferenceData[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  loadedAt: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// 6. HOOK RETURN TYPES
// ============================================================================

export interface UseReferenceDataReturn {
  statusOptions: StatusOption[];
  referenceData: ReferenceData[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  loading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
  getStatusesByModule: (module: string) => StatusOption[];
  getRefDataByCategory: (category: string) => ReferenceData[];
  getCategoryById: (id: string) => ProductCategory | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
}

// ============================================================================
// 7. RESPONSE TYPES - Service responses
// ============================================================================

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ServiceListResponse<T> {
  data: T[];
  error?: string;
  success: boolean;
  total?: number;
}