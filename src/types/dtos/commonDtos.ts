/**
 * Common DTO Types
 * Shared DTOs and interfaces used across all services
 * Ensures consistent data structures for all API responses
 */

/**
 * Standard paginated response format
 * Used by all list endpoints for consistency
 */
export interface PaginatedResponseDTO<T> {
  /** Array of data items */
  data: T[];
  
  /** Current page number (1-indexed) */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Total number of items across all pages */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there's a next page */
  hasNextPage: boolean;
  
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
}

/**
 * Standard stats/metrics response format
 * Used by all statistics endpoints
 */
export interface StatsResponseDTO {
  [key: string]: number | string | Record<string, any>;
}

/**
 * Standard error response format
 */
export interface ApiErrorDTO {
  /** Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
  code: string;
  
  /** User-friendly error message */
  message: string;
  
  /** Additional error details */
  details?: any;
  
  /** Timestamp when error occurred */
  timestamp: string;
  
  /** HTTP status code */
  statusCode?: number;
}

/**
 * Filter base interface for common filtering parameters
 */
export interface BaseFiltersDTO {
  /** Search query string */
  search?: string;
  
  /** Tenant ID for multi-tenant filtering */
  tenantId?: string;
  
  /** Date range filtering */
  dateRange?: {
    from: string;
    to: string;
  };
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction: 'asc' or 'desc' */
  sortDirection?: 'asc' | 'desc';
  
  /** Page number for pagination */
  page?: number;
  
  /** Items per page */
  pageSize?: number;
}

/**
 * Audit metadata included in all records
 */
export interface AuditMetadataDTO {
  /** Record creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** User ID who created the record */
  createdBy: string;
  
  /** Record last update timestamp (ISO 8601) */
  updatedAt: string;
  
  /** User ID who last updated the record */
  updatedBy: string;
  
  /** Soft delete timestamp (null if not deleted) */
  deletedAt?: string | null;
  
  /** User ID who deleted the record */
  deletedBy?: string;
  
  /** Version number for optimistic concurrency control */
  version: number;
}

/**
 * Status enumeration - used consistently across modules
 */
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'archived' | 'suspended';

/**
 * Priority enumeration - used for prioritization across modules
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Success response wrapper
 */
export interface SuccessResponseDTO<T> {
  /** Success flag */
  success: true;
  
  /** Response data */
  data: T;
  
  /** Optional message */
  message?: string;
}

/**
 * Error response wrapper
 */
export interface ErrorResponseDTO {
  /** Success flag */
  success: false;
  
  /** Error details */
  error: ApiErrorDTO;
}

/**
 * Generic response type
 */
export type ApiResponseDTO<T> = SuccessResponseDTO<T> | ErrorResponseDTO;

/**
 * Multi-select option for dropdowns and filters
 */
export interface SelectOptionDTO {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/**
 * Key-value metric for charts and analytics
 */
export interface MetricDTO {
  label: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

/**
 * Chart data for analytics
 */
export interface ChartDataDTO {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

/**
 * Time series data point
 */
export interface TimeSeriesDataDTO {
  timestamp: string;
  value: number;
}

/**
 * Distribution data (for pie charts, etc.)
 */
export interface DistributionDTO {
  [key: string]: number;
}

/**
 * User basic info - used in audit trails and assignments
 */
export interface UserBasicDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

/**
 * Attachment/File info
 */
export interface AttachmentDTO {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Activity/Event log entry
 */
export interface ActivityLogDTO {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'download';
  description: string;
  changedFields?: Record<string, { oldValue: any; newValue: any }>;
  performedBy: UserBasicDTO;
  performedAt: string;
}