/**
 * Core Types
 * Shared TypeScript types used throughout the application
 */

// Re-export existing types
export * from '@/types/auth';
export * from '@/types/crm';
export * from '@/types/contracts';
export * from '@/types/notifications';

// Common utility types
export type ID = string | number;

export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

// Module types
export interface ModuleConfig {
  name: string;
  path: string;
  lazy?: boolean;
  permissions?: string[];
  dependencies?: string[];
}

export interface FeatureModule {
  name: string;
  path?: string;
  routes?: Array<Record<string, unknown>>;
  services?: string[];
  components?: Record<string, unknown>;
  dependencies?: string[];
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

// Component types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface FormState<T = unknown> extends LoadingState {
  data: T;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

// Service types
export interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'ttl';
}

// Event types
export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  source?: string;
}

export type EventHandler<T = unknown> = (event: AppEvent<T>) => void;

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

// Theme types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType<Record<string, unknown>>;
  exact?: boolean;
  permissions?: string[];
  layout?: React.ComponentType<Record<string, unknown>>;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}
