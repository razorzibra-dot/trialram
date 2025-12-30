/**
 * Backend Configuration Service
 * Centralized configuration for all three backends: Mock, Real API, and Supabase
 * 
 * USAGE:
 * - Set VITE_API_MODE=mock|real|supabase in .env for global backend
 * - Override per-service with VITE_*_BACKEND=mock|real|supabase
 * - All services automatically switch based on configuration
 * 
 * Example:
 *   VITE_API_MODE=supabase           # All services use Supabase
 *   VITE_CUSTOMER_BACKEND=mock       # Except customers use Mock
 *   VITE_SALES_BACKEND=real          # And sales use Real API
 */

export type BackendMode = 'mock' | 'real' | 'supabase';
export type ServiceBackend = BackendMode | 'auto';

export interface BackendConfig {
  mode: BackendMode;
  supabase?: {
    url: string;
    anonKey: string;
    serviceKey?: string;
    enableRealtime: boolean;
    enableOffline: boolean;
    syncInterval: number;
    authMethod: 'jwt' | 'oauth' | 'magic_link';
  };
  realApi?: {
    baseUrl: string;
    environment: 'development' | 'staging' | 'production';
    timeout: number;
  };
  featureFlags?: Record<string, ServiceBackend>;
  cache?: {
    enabled: boolean;
    ttl: number;
    deduplication: boolean;
    referenceTtlMs?: number;
    navigationTtlMs?: number;
    pageDataTtlMs?: number;
  };
  monitoring?: {
    enableLogging: boolean;
    enableMetrics: boolean;
    enableErrorTracking: boolean;
    debugFactory: boolean;
  };
  businessRules?: {
    leadConversionMinScore: number;
  };
}

/**
 * Global backend configuration
 * Loads from environment variables at startup
 */
export const backendConfig: BackendConfig = {
  mode: (import.meta.env.VITE_API_MODE || 'mock') as BackendMode,

  supabase: import.meta.env.VITE_SUPABASE_URL ? {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
    enableRealtime: import.meta.env.VITE_SUPABASE_ENABLE_REALTIME === 'true',
    enableOffline: import.meta.env.VITE_SUPABASE_ENABLE_OFFLINE === 'true',
    syncInterval: parseInt(import.meta.env.VITE_SUPABASE_SYNC_INTERVAL || '5000'),
    authMethod: (import.meta.env.VITE_SUPABASE_AUTH_METHOD || 'jwt') as any,
  } : undefined,

  realApi: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5137/api/v1',
    environment: (import.meta.env.VITE_API_ENVIRONMENT || 'development') as any,
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },

  featureFlags: {
    customer: (import.meta.env.VITE_CUSTOMER_BACKEND || 'auto') as ServiceBackend,
    sales: (import.meta.env.VITE_SALES_BACKEND || 'auto') as ServiceBackend,
    ticket: (import.meta.env.VITE_TICKET_BACKEND || 'auto') as ServiceBackend,
    contract: (import.meta.env.VITE_CONTRACT_BACKEND || 'auto') as ServiceBackend,
    user: (import.meta.env.VITE_USER_BACKEND || 'auto') as ServiceBackend,
    dashboard: (import.meta.env.VITE_DASHBOARD_BACKEND || 'auto') as ServiceBackend,
    notification: (import.meta.env.VITE_NOTIFICATION_BACKEND || 'auto') as ServiceBackend,
    file: (import.meta.env.VITE_FILE_BACKEND || 'auto') as ServiceBackend,
    audit: (import.meta.env.VITE_AUDIT_BACKEND || 'auto') as ServiceBackend,
  },

  cache: {
    enabled: import.meta.env.VITE_ENABLE_SERVICE_CACHE !== 'false',
    ttl: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
    deduplication: import.meta.env.VITE_ENABLE_REQUEST_DEDUPLICATION !== 'false',
    referenceTtlMs: parseInt(import.meta.env.VITE_REF_DATA_TTL_MS || '300000'),
    navigationTtlMs: parseInt(import.meta.env.VITE_NAV_ITEMS_TTL_MS || '60000'),
    pageDataTtlMs: parseInt(import.meta.env.VITE_PAGE_DATA_TTL_MS || '300000'),
  },

  monitoring: {
    enableLogging: import.meta.env.VITE_ENABLE_SERVICE_LOGGING !== 'false',
    enableMetrics: import.meta.env.VITE_ENABLE_PERFORMANCE_METRICS !== 'false',
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'false',
    debugFactory: import.meta.env.VITE_DEBUG_SERVICE_FACTORY === 'true',
  },
  businessRules: {
    leadConversionMinScore: parseInt(import.meta.env.VITE_LEAD_CONVERSION_MIN_SCORE || '55'),
  },
};

/**
 * Get backend for specific service
 * Returns the appropriate backend mode for a given service
 */
export function getServiceBackend(serviceName: keyof typeof backendConfig.featureFlags): BackendMode {
  const serviceBackend = backendConfig.featureFlags?.[serviceName];
  return (serviceBackend === 'auto' ? backendConfig.mode : serviceBackend) as BackendMode;
}

/**
 * Validation & Helper Functions
 */
export function isSupabaseConfigured(): boolean {
  return !!backendConfig.supabase?.url && !!backendConfig.supabase?.anonKey;
}

export function isRealApiConfigured(): boolean {
  return !!backendConfig.realApi?.baseUrl;
}

export function getSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '❌ Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    );
  }
  return backendConfig.supabase!;
}

export function validateBackendConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!backendConfig.mode) {
    errors.push('❌ VITE_API_MODE not set');
  }

  if (backendConfig.mode === 'supabase' && !isSupabaseConfigured()) {
    errors.push('❌ Supabase mode selected but credentials not configured');
    errors.push('   Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  }

  if (backendConfig.mode === 'real' && !isRealApiConfigured()) {
    errors.push('❌ Real API mode selected but VITE_API_BASE_URL not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Print configuration for debugging
 */
export function printBackendConfig(): void {
  if (typeof window !== 'undefined') {
    const validation = validateBackendConfig();
    const statusIcon = validation.valid ? '✅' : '❌';

    console.log(`
╔════════════════════════════════════════════════════════════╗
║       MULTI-BACKEND CONFIGURATION                          ║
╠════════════════════════════════════════════════════════════╣
║  Status: ${statusIcon} ${backendConfig.mode.toUpperCase().padEnd(45)} ║
║  Supabase Configured: ${isSupabaseConfigured() ? '✅' : '❌'} ${' '.padEnd(40)} ║
║  Real API Configured: ${isRealApiConfigured() ? '✅' : '❌'} ${' '.padEnd(40)} ║
╠════════════════════════════════════════════════════════════╣
║  FEATURE FLAGS:                                            ║
║  • Customer: ${getServiceBackend('customer').padEnd(52)} ║
║  • Sales: ${getServiceBackend('sales').padEnd(54)} ║
║  • Ticket: ${getServiceBackend('ticket').padEnd(53)} ║
║  • Contract: ${getServiceBackend('contract').padEnd(51)} ║
║  • File: ${getServiceBackend('file').padEnd(55)} ║
║  • User: ${getServiceBackend('user').padEnd(54)} ║
╚════════════════════════════════════════════════════════════╝
    `);

    if (!validation.valid) {
      console.warn('⚠️  Configuration errors:');
      validation.errors.forEach((error) => console.warn(error));
    }
  }
}

// Validate and print on startup
if (typeof window !== 'undefined') {
  const validation = validateBackendConfig();
  if (!validation.valid) {
    console.warn('[BackendConfig] Validation errors:', validation.errors);
  } else {
    console.log('[BackendConfig] ✅ Configuration valid');
  }
  
  // Only print detailed config in debug mode
  if (backendConfig.monitoring?.debugFactory) {
    printBackendConfig();
  }
}

export default backendConfig;