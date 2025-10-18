/**
 * Enterprise API Configuration
 * Centralized configuration for switching between mock, real, and Supabase APIs
 * 
 * MULTI-BACKEND SUPPORT:
 * =====================
 * 1. VITE_API_MODE=mock      → Mock/Static Data (development/testing)
 * 2. VITE_API_MODE=real      → .NET Core Backend API (production)
 * 3. VITE_API_MODE=supabase  → Supabase PostgreSQL (modern production)
 * 
 * BACKWARD COMPATIBILITY:
 * - VITE_USE_MOCK_API=true/false still works (legacy)
 * - VITE_API_MODE takes precedence if set
 * 
 * PER-SERVICE OVERRIDES:
 * - VITE_CUSTOMER_BACKEND=mock|real|supabase
 * - VITE_SALES_BACKEND=mock|real|supabase
 * - etc...
 * 
 * USAGE:
 * - Set VITE_API_MODE in .env to switch globally
 * - Use VITE_*_BACKEND for per-service overrides
 * - Restart development server after changing
 */

export type ApiMode = 'mock' | 'real' | 'supabase';

export interface ApiEnvironment {
  name: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    refresh: string;
    profile: string;
    permissions: string;
  };
  customers: {
    base: string;
    search: string;
    export: string;
    import: string;
    tags: string;
    bulk: string;
  };
  sales: {
    base: string;
    pipeline: string;
    analytics: string;
    forecasting: string;
  };
  tickets: {
    base: string;
    priorities: string;
    categories: string;
    assignments: string;
  };
  contracts: {
    base: string;
    templates: string;
    renewals: string;
    analytics: string;
  };
  users: {
    base: string;
    roles: string;
    permissions: string;
    invitations: string;
  };
  dashboard: {
    metrics: string;
    analytics: string;
    reports: string;
    widgets: string;
  };
  notifications: {
    base: string;
    templates: string;
    queue: string;
    preferences: string;
  };
  files: {
    upload: string;
    download: string;
    delete: string;
    metadata: string;
  };
  audit: {
    logs: string;
    export: string;
    search: string;
  };
}

// Environment configurations
const environments: Record<string, ApiEnvironment> = {
  development: {
    name: 'Development',
    baseUrl: (typeof import.meta !== 'undefined' && (import.meta.env as unknown as Record<string, string>)?.VITE_API_BASE_URL) || 'http://localhost:5137/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true,
  },
  staging: {
    name: 'Staging',
    baseUrl: 'https://api-staging.yourcompany.com/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true,
  },
  production: {
    name: 'Production',
    baseUrl: 'https://api.yourcompany.com/api/v1',
    timeout: 30000,
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: false,
    enableMetrics: true,
  },
  mock: {
    name: 'Mock Development',
    baseUrl: '/mock-api',
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 500,
    enableLogging: true,
    enableMetrics: false,
  },
};

// API endpoints configuration
export const apiEndpoints: ApiEndpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    permissions: '/auth/permissions',
  },
  customers: {
    base: '/customers',
    search: '/customers/search',
    export: '/customers/export',
    import: '/customers/import',
    tags: '/customers/tags',
    bulk: '/customers/bulk',
  },
  sales: {
    base: '/sales',
    pipeline: '/sales/pipeline',
    analytics: '/sales/analytics',
    forecasting: '/sales/forecasting',
  },
  tickets: {
    base: '/tickets',
    priorities: '/tickets/priorities',
    categories: '/tickets/categories',
    assignments: '/tickets/assignments',
  },
  contracts: {
    base: '/contracts',
    templates: '/contracts/templates',
    renewals: '/contracts/renewals',
    analytics: '/contracts/analytics',
  },
  users: {
    base: '/users',
    roles: '/users/roles',
    permissions: '/users/permissions',
    invitations: '/users/invitations',
  },
  dashboard: {
    metrics: '/dashboard/metrics',
    analytics: '/dashboard/analytics',
    reports: '/dashboard/reports',
    widgets: '/dashboard/widgets',
  },
  notifications: {
    base: '/notifications',
    templates: '/notifications/templates',
    queue: '/notifications/queue',
    preferences: '/notifications/preferences',
  },
  files: {
    upload: '/files/upload',
    download: '/files/download',
    delete: '/files/delete',
    metadata: '/files/metadata',
  },
  audit: {
    logs: '/audit/logs',
    export: '/audit/export',
    search: '/audit/search',
  },
};

/**
 * Get current API configuration
 */
export function getApiConfig(): ApiEnvironment {
  // Check environment variables
  const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
  const environment = import.meta.env.VITE_API_ENVIRONMENT || 'development';
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  
  if (useMockApi) {
    return environments.mock;
  }

  const envConfig = environments[environment] || environments.development;
  if (explicitBaseUrl) {
    return { ...envConfig, baseUrl: explicitBaseUrl };
  }
  return envConfig;
}

/**
 * Get current API mode with multi-backend support
 * Priority: VITE_API_MODE > VITE_USE_MOCK_API
 */
export function getApiMode(): ApiMode {
  // Check new VITE_API_MODE first (takes precedence)
  const apiMode = (import.meta.env.VITE_API_MODE as string | undefined)?.toLowerCase();
  if (apiMode && ['mock', 'real', 'supabase'].includes(apiMode)) {
    return apiMode as ApiMode;
  }

  // Fall back to legacy VITE_USE_MOCK_API for backward compatibility
  const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
  return useMockApi ? 'mock' : 'real';
}

/**
 * Check if using mock API (legacy - use getApiMode() instead)
 */
export function isUsingMockApi(): boolean {
  return getApiMode() === 'mock';
}

/**
 * Check if using Supabase API
 */
export function isUsingSupabaseApi(): boolean {
  return getApiMode() === 'supabase';
}

/**
 * Check if using real .NET Core API
 */
export function isUsingRealApi(): boolean {
  return getApiMode() === 'real';
}

/**
 * Get per-service backend override (or global if not set)
 */
export function getServiceBackend(serviceType: string): ApiMode {
  const overrideKey = `VITE_${serviceType.toUpperCase()}_BACKEND`;
  const override = (import.meta.env as Record<string, string>)[overrideKey]?.toLowerCase();
  
  if (override && ['mock', 'real', 'supabase'].includes(override)) {
    return override as ApiMode;
  }
  
  return getApiMode();
}

/**
 * Get full API URL
 */
export function getApiUrl(endpoint: string): string {
  const config = getApiConfig();
  return `${config.baseUrl}${endpoint}`;
}

/**
 * Get API headers
 */
export function getApiHeaders(includeAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'web',
  };

  if (includeAuth) {
    const token = localStorage.getItem('crm_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * API Configuration for different environments
 */
export const apiConfig = {
  ...getApiConfig(),
  endpoints: apiEndpoints,
  headers: getApiHeaders,
  getUrl: getApiUrl,
  isMock: isUsingMockApi(),
};

/**
 * Log current API mode on initialization
 */
if (typeof window !== 'undefined') {
  const apiMode = getApiMode();
  const modeLabel = {
    'mock': '🎭 MOCK/STATIC DATA',
    'real': '🔌 REAL .NET CORE BACKEND',
    'supabase': '🗄️ SUPABASE POSTGRESQL'
  }[apiMode];
  const baseUrl = getApiConfig().baseUrl;
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              CRM API CONFIGURATION - PHASE 4               ║
╠════════════════════════════════════════════════════════════╣
║  Mode: ${(modeLabel || '').padEnd(48)} ║
║  Base URL: ${baseUrl.padEnd(44)} ║
║  Environment: ${(import.meta.env.VITE_API_ENVIRONMENT || 'development').padEnd(41)} ║
╚════════════════════════════════════════════════════════════╝
  `);
}

export default apiConfig;
