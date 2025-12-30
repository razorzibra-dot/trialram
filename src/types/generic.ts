/**
 * Generic Type Utilities
 * Shared types for generic repository and service patterns
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Paginated Response
 * Standard structure for paginated list responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Query Filters
 * Standard filters applicable to most entities
 */
export interface QueryFilters {
  // Pagination
  page?: number;
  pageSize?: number;

  // Search
  search?: string;

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Common filters
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  assignedTo?: string;

  // Tenant (usually auto-applied via RLS)
  tenantId?: string;

  // Custom filters (extensible)
  [key: string]: unknown;
}

/**
 * Repository Configuration
 * Configuration for GenericRepository instances
 */
export interface RepositoryConfig<T, TRow = Record<string, unknown>> {
  /**
   * Table name in the database (for new simplified pattern)
   */
  tableName?: string;

  /**
   * Whether entity is tenant-scoped (applies tenant_id filter automatically)
   */
  tenantScoped?: boolean;

  /**
   * Fields to search in when search filter is provided
   */
  searchFields?: string[];

  /**
   * Default sort field
   */
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };

  /**
   * Mapper function to convert DB row to DTO
   */
  mapper: (row: TRow) => T;

  /**
   * Reverse mapper to convert DTO to DB row (for inserts/updates)
   */
  reverseMapper?: (dto: Partial<T>) => Partial<TRow>;

  /**
   * Custom filter handlers for specific fields
   */
  filterHandlers?: Record<string, (query: unknown, value: unknown) => unknown>;

  /**
   * Fields that should be excluded from updates
   */
  readOnlyFields?: string[];

  /**
   * Soft delete configuration
   */
  softDelete?: {
    enabled: boolean;
    field: string; // Usually 'deleted_at'
  };

  /**
   * Soft delete field (alternative short form)
   */
  softDeleteField?: string;

  /**
   * Tenant ID field name (default: 'tenant_id')
   */
  tenantIdField?: string;

  /**
   * Select fields (Supabase select string)
   * Default is '*'
   */
  selectFields?: string;
}

/**
 * Entity Hooks Configuration
 * Configuration for React hooks factory
 */
export interface EntityHooksConfig<T> {
  /**
   * Display name of entity (e.g., 'Deal', 'Customer')
   */
  entityName: string;

  /**
   * Service instance (GenericCrudService)
   */
  service: {
    getAll: (filters: QueryFilters, context: ServiceContext) => Promise<{ data: T[]; total: number }>;
    getById: (id: string, context: ServiceContext) => Promise<T>;
    create: (data: Partial<T>, context: ServiceContext) => Promise<T>;
    update: (id: string, data: Partial<T>, context: ServiceContext) => Promise<T>;
    delete: (id: string, context: ServiceContext) => Promise<void>;
  };

  /**
   * Query keys for React Query
   */
  queryKeys: {
    all: string[];
    list: (filters: QueryFilters) => string[];
    detail: (id: string) => string[];
  };

  /**
   * Optional configuration
   */
  options?: {
    /**
     * Cache time in ms (default: 300000 = 5 minutes)
     */
    staleTime?: number;

    /**
     * Number of retries (default: 1)
     */
    retry?: number;

    /**
     * Enable query by default (default: true)
     */
    enabledByDefault?: boolean;

    /**
     * Show success notifications (default: true)
     */
    showSuccessNotification?: boolean;

    /**
     * Show error notifications (default: true)
     */
    showErrorNotification?: boolean;

    /**
     * Callbacks
     */
    onCreateSuccess?: (entity: T) => void;
    onUpdateSuccess?: (entity: T) => void;
    onDeleteSuccess?: () => void;
    onCreateError?: (error: Error) => void;
    onUpdateError?: (error: Error) => void;
    onDeleteError?: (error: Error) => void;
  };
}

/**
 * Form Field Configuration
 * Configuration for generic form components
 */
export interface FormFieldConfig {
  type: 'text' | 'textarea' | 'number' | 'date' | 'dateRange' | 'select' | 'checkbox' | 'custom';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rules?: Array<{ required?: boolean; message?: string; min?: number; max?: number; pattern?: RegExp }>;
  options?: Array<{ label: string; value: string | number }>;
  render?: () => React.ReactNode;
  defaultValue?: unknown;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * Column Configuration for Tables
 * Configuration for generic table columns
 */
export interface ColumnConfig<T> {
  title: string;
  dataIndex?: keyof T | string;
  key: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  filters?: Array<{ text: string; value: string }>;
}

/**
 * Service Context
 * Provides user/tenant context to services
 */
export interface ServiceContext {
  userId: string;
  tenantId: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

/**
 * Audit Fields
 * Standard audit fields present in most tables
 */
export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string | null;
}

/**
 * Base Entity
 * Common fields in all entities
 */
export interface BaseEntity extends AuditFields {
  id: string;
  tenantId: string;
}

/**
 * Create/Update Input Base
 * Omits system-managed fields from create/update
 */
export type CreateInput<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'
>;

export type UpdateInput<T extends BaseEntity> = Partial<CreateInput<T>>;

/**
 * Database Row Type
 * Snake_case version of entity (matches DB columns)
 */
export type DatabaseRow<T> = {
  [K in keyof T as K extends string ? SnakeCase<K> : K]: T[K];
};

/**
 * Snake Case Type Utility
 */
type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
  : S;

/**
 * Supabase Query Type
 */
export type SupabaseQuery = ReturnType<SupabaseClient['from']>;

/**
 * Export helper to create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Export helper to extract query filters
 */
export function extractQueryFilters(filters?: QueryFilters): {
  pagination: { page: number; pageSize: number };
  sorting: { sortBy?: string; sortOrder: 'asc' | 'desc' };
  search?: string;
  custom: Record<string, unknown>;
} {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const sortBy = filters?.sortBy;
  const sortOrder = filters?.sortOrder || 'desc';
  const search = filters?.search;

  // Extract custom filters (exclude standard ones)
  const standardKeys = new Set([
    'page', 'pageSize', 'search', 'sortBy', 'sortOrder',
    'status', 'dateFrom', 'dateTo', 'createdBy', 'assignedTo', 'tenantId'
  ]);

  const custom: Record<string, unknown> = {};
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (!standardKeys.has(key) && value !== undefined) {
        custom[key] = value;
      }
    });
  }

  return {
    pagination: { page, pageSize },
    sorting: { sortBy, sortOrder },
    search,
    custom,
  };
}
