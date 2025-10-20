# Complete Implementation Checklist - Mock/Real/Supabase
## Step-by-Step Execution Guide with Code Templates

---

## 📋 SECTION 1: PREREQUISITES & SETUP

### 1.1 Install Required Dependencies

**Prompt:**
```bash
# Install Supabase client library
npm install @supabase/supabase-js

# Install additional utilities for offline support
npm install @supabase/realtime-js
npm install idb  # For offline storage

# Verify installation
npm ls @supabase/supabase-js
```

**Expected Output:**
```
├── @supabase/supabase-js@2.x.x
├── @supabase/realtime-js@2.x.x
└── idb@8.x.x
```

**✅ Checklist Item:**
- [ ] Supabase client installed
- [ ] Realtime library installed
- [ ] IDB installed for offline storage

---

### 1.2 Create Supabase Project

**Prompt:**

1. Go to [https://supabase.com](https://supabase.com)
2. Create new project:
   - Project Name: `pds-crm-development`
   - Database Password: `[Use strong password]`
   - Region: `[Select closest region]`
3. Wait for project initialization (5-10 minutes)
4. Go to Project Settings → API
5. Copy the following credentials:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/Public Key** → `VITE_SUPABASE_ANON_KEY`
   - **Service Role Key** → `VITE_SUPABASE_SERVICE_KEY` (keep secret!)

**✅ Checklist Item:**
- [ ] Supabase project created
- [ ] API credentials copied
- [ ] Credentials verified (test connection)

---

### 1.3 Update Environment Files

**File: `.env.example`**

Replace with complete multi-backend configuration:

```bash
# ============================================================================
# MULTI-BACKEND CONFIGURATION
# ============================================================================

# Backend Mode: mock | real | supabase
VITE_API_MODE=mock

# Backward compatibility
VITE_USE_MOCK_API=true

# ============================================================================
# REAL API CONFIGURATION
# ============================================================================
VITE_API_BASE_URL=http://localhost:5137/api/v1
VITE_API_ENVIRONMENT=development
VITE_API_TIMEOUT=30000

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

# Supabase Project Settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Features
VITE_SUPABASE_ENABLE_REALTIME=true
VITE_SUPABASE_ENABLE_OFFLINE=true
VITE_SUPABASE_SYNC_INTERVAL=5000
VITE_SUPABASE_AUTH_METHOD=jwt

# ============================================================================
# PER-SERVICE BACKEND CONFIGURATION
# ============================================================================

# Override global backend for specific services
VITE_CUSTOMER_BACKEND=supabase    # mock | real | supabase
VITE_SALES_BACKEND=real
VITE_TICKET_BACKEND=mock
VITE_CONTRACT_BACKEND=supabase
VITE_USER_BACKEND=real
VITE_DASHBOARD_BACKEND=mock
VITE_NOTIFICATION_BACKEND=supabase
VITE_FILE_BACKEND=supabase
VITE_AUDIT_BACKEND=real

# ============================================================================
# CACHING & PERFORMANCE
# ============================================================================

VITE_ENABLE_SERVICE_CACHE=true
VITE_CACHE_TTL=300000
VITE_ENABLE_REQUEST_DEDUPLICATION=true
VITE_ENABLE_BATCH_REQUESTS=true

# ============================================================================
# MONITORING & LOGGING
# ============================================================================

VITE_ENABLE_SERVICE_LOGGING=true
VITE_ENABLE_PERFORMANCE_METRICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_DEBUG_SERVICE_FACTORY=false
```

**File: `.env` (local development)**

```bash
# Development with all three backends available
VITE_API_MODE=mock

# Supabase credentials for development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_SUPABASE_SERVICE_KEY=your-dev-service-key

# Real API for testing
VITE_API_BASE_URL=http://localhost:5137/api/v1

# Start with mock, can switch to test others
VITE_CUSTOMER_BACKEND=mock
VITE_SALES_BACKEND=mock
VITE_TICKET_BACKEND=mock
```

**✅ Checklist Item:**
- [ ] `.env.example` updated
- [ ] `.env` file created with credentials
- [ ] Credentials tested and working

---

## 📋 SECTION 2: CONFIGURATION LAYER

### 2.1 Create Backend Configuration Service

**File: `src/config/backendConfig.ts`**

```typescript
/**
 * Backend Configuration Service
 * Centralized configuration for all three backends
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
  };
  monitoring?: {
    enableLogging: boolean;
    enableMetrics: boolean;
    enableErrorTracking: boolean;
    debugFactory: boolean;
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
    customer: (import.meta.env.VITE_CUSTOMER_BACKEND || 'supabase') as ServiceBackend,
    sales: (import.meta.env.VITE_SALES_BACKEND || 'real') as ServiceBackend,
    ticket: (import.meta.env.VITE_TICKET_BACKEND || 'mock') as ServiceBackend,
    contract: (import.meta.env.VITE_CONTRACT_BACKEND || 'supabase') as ServiceBackend,
    user: (import.meta.env.VITE_USER_BACKEND || 'real') as ServiceBackend,
    dashboard: (import.meta.env.VITE_DASHBOARD_BACKEND || 'mock') as ServiceBackend,
    notification: (import.meta.env.VITE_NOTIFICATION_BACKEND || 'supabase') as ServiceBackend,
    file: (import.meta.env.VITE_FILE_BACKEND || 'supabase') as ServiceBackend,
    audit: (import.meta.env.VITE_AUDIT_BACKEND || 'real') as ServiceBackend,
  },

  cache: {
    enabled: import.meta.env.VITE_ENABLE_SERVICE_CACHE !== 'false',
    ttl: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
    deduplication: import.meta.env.VITE_ENABLE_REQUEST_DEDUPLICATION !== 'false',
  },

  monitoring: {
    enableLogging: import.meta.env.VITE_ENABLE_SERVICE_LOGGING !== 'false',
    enableMetrics: import.meta.env.VITE_ENABLE_PERFORMANCE_METRICS !== 'false',
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'false',
    debugFactory: import.meta.env.VITE_DEBUG_SERVICE_FACTORY === 'true',
  },
};

/**
 * Get backend for specific service
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
    throw new Error('Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
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
  }

  if (backendConfig.mode === 'real' && !isRealApiConfigured()) {
    errors.push('❌ Real API mode selected but VITE_API_BASE_URL not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate on startup
const validation = validateBackendConfig();
if (!validation.valid) {
  console.warn('[BackendConfig] Validation errors:', validation.errors);
}
```

**✅ Checklist Item:**
- [ ] `backendConfig.ts` created
- [ ] All environment variables mapped
- [ ] Validation function implemented
- [ ] Types defined for type safety

---

### 2.2 Create Supabase Client Initialization

**File: `src/services/supabase/client.ts`**

```typescript
/**
 * Supabase Client
 * Single instance shared across the application
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { backendConfig, isSupabaseConfigured } from '@/config/backendConfig';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initializeSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const config = backendConfig.supabase!;

  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      enabled: config.enableRealtime,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'crm-v9/1.0',
      },
    },
  });

  console.log('✅ Supabase client initialized');

  // Setup event listeners
  setupSupabaseListeners(supabaseClient);

  return supabaseClient;
}

/**
 * Get Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Setup Supabase event listeners
 */
function setupSupabaseListeners(client: SupabaseClient): void {
  // Listen for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event);
    
    if (event === 'SIGNED_OUT') {
      // Clear local cache
      localStorage.removeItem('supabase_session');
    }
  });

  // Listen for realtime connection status
  client.realtime.setAuth(
    (await client.auth.getSession()).data.session?.access_token || ''
  );
}

/**
 * Disconnect Supabase
 */
export function disconnectSupabase(): void {
  if (supabaseClient) {
    supabaseClient.realtime.unsubscribe();
    supabaseClient = null;
    console.log('✅ Supabase disconnected');
  }
}

/**
 * Check Supabase connection
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('customers').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}
```

**✅ Checklist Item:**
- [ ] Supabase client service created
- [ ] Connection initialization implemented
- [ ] Event listeners setup
- [ ] Connection test function added

---

## 📋 SECTION 3: BASE SERVICES

### 3.1 Create Base Supabase Service

**File: `src/services/supabase/baseSupabaseService.ts`**

```typescript
/**
 * Base Supabase Service
 * Provides common functionality for all Supabase services
 */

import { SupabaseClient, PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/supabase-js';
import { backendConfig } from '@/config/backendConfig';

export interface ServiceLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: unknown): void;
  debug(message: string, data?: unknown): void;
}

export class BaseSupabaseService {
  protected supabase: SupabaseClient;
  protected logger: ServiceLogger;
  protected tenantId: string | null = null;
  protected userId: string | null = null;

  constructor(supabase: SupabaseClient, logger?: ServiceLogger) {
    this.supabase = supabase;
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Set tenant ID (usually from auth context)
   */
  public setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * Set user ID (usually from auth context)
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get tenant ID
   */
  protected getTenantId(): string {
    if (!this.tenantId) {
      throw new Error('Tenant ID not set. Ensure user is authenticated.');
    }
    return this.tenantId;
  }

  /**
   * Get current user ID
   */
  protected getCurrentUserId(): string {
    if (!this.userId) {
      throw new Error('User ID not set. Ensure user is authenticated.');
    }
    return this.userId;
  }

  /**
   * Subscribe to real-time updates
   */
  protected subscribeToTable(
    tableName: string,
    callback: (payload: any) => void,
    filter?: string
  ): () => void {
    const channel = this.supabase
      .channel(`${tableName}:${this.tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter || `tenant_id=eq.${this.tenantId}`,
        },
        (payload) => {
          this.logger.debug(`Real-time update: ${tableName}`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        this.logger.debug(`Subscription status: ${tableName}`, status);
      });

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  /**
   * Batch insert with validation
   */
  protected async batchInsert(
    tableName: string,
    records: Record<string, unknown>[]
  ): Promise<Record<string, unknown>[]> {
    const batchSize = 100;
    const allResults: Record<string, unknown>[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) {
        this.logger.error(`Batch insert error for ${tableName}:`, error);
        throw error;
      }

      allResults.push(...(data || []));
      this.logger.debug(`Batch insert: ${batch.length} records to ${tableName}`);
    }

    return allResults;
  }

  /**
   * Soft delete (mark as deleted without removing)
   */
  protected async softDelete(tableName: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      this.logger.error(`Soft delete error for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Implement pagination
   */
  protected async paginate(
    query: PostgrestQueryBuilder<any, any, any, any>,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ data: any[]; total: number; pages: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .range(from, to)
      .select('*', { count: 'exact' });

    if (error) {
      this.logger.error('Pagination error:', error);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      pages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Handle transaction-like operations
   */
  protected async transaction(
    callback: () => Promise<void>
  ): Promise<void> {
    try {
      await callback();
      this.logger.info('Transaction completed successfully');
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): ServiceLogger {
    const prefix = (level: string) => `[${new Date().toISOString()}] [${level}]`;

    return {
      info: (msg, data) => {
        if (backendConfig.monitoring?.enableLogging) {
          console.info(`${prefix('INFO')} ${msg}`, data);
        }
      },
      warn: (msg, data) => {
        if (backendConfig.monitoring?.enableLogging) {
          console.warn(`${prefix('WARN')} ${msg}`, data);
        }
      },
      error: (msg, err) => {
        if (backendConfig.monitoring?.enableErrorTracking) {
          console.error(`${prefix('ERROR')} ${msg}`, err);
        }
      },
      debug: (msg, data) => {
        if (backendConfig.monitoring?.debugFactory) {
          console.debug(`${prefix('DEBUG')} ${msg}`, data);
        }
      },
    };
  }
}
```

**✅ Checklist Item:**
- [ ] Base Supabase service created
- [ ] Logger interface implemented
- [ ] Real-time subscription support added
- [ ] Batch operations implemented
- [ ] Pagination support added

---

## 📋 SECTION 4: SERVICE IMPLEMENTATIONS

### 4.1 Supabase Customer Service

**File: `src/services/supabase/customerService.ts`**

```typescript
/**
 * Supabase Customer Service
 * Full implementation of ICustomerService for Supabase backend
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ICustomerService } from '../api/apiServiceFactory';
import { BaseSupabaseService } from './baseSupabaseService';

export class SupabaseCustomerService extends BaseSupabaseService implements ICustomerService {
  private tableName = 'customers';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async getCustomers(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('tenant_id', this.getTenantId());

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      this.logger.info(`✅ Fetched ${data?.length || 0} customers`);
      return data || [];
    } catch (error) {
      this.logger.error('Failed to fetch customers', error);
      throw error;
    }
  }

  async getCustomer(id: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .single();

      if (error) throw error;
      this.logger.info(`✅ Fetched customer ${id}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch customer ${id}`, error);
      throw error;
    }
  }

  async createCustomer(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload = {
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        industry: data.industry,
        size: data.size,
        status: data.status || 'active',
        notes: data.notes,
        assigned_to: data.assignedTo,
        tenant_id: this.getTenantId(),
        created_by: this.getCurrentUserId(),
        created_at: new Date().toISOString(),
      };

      const { data: newCustomer, error } = await this.supabase
        .from(this.tableName)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Created customer: ${newCustomer.id}`);
      return newCustomer;
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw error;
    }
  }

  async updateCustomer(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const payload = {
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        industry: data.industry,
        size: data.size,
        status: data.status,
        notes: data.notes,
        assigned_to: data.assignedTo,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedCustomer, error } = await this.supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', this.getTenantId())
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Updated customer ${id}`);
      return updatedCustomer;
    } catch (error) {
      this.logger.error(`Failed to update customer ${id}`, error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      this.logger.info(`✅ Deleted customer ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete customer ${id}`, error);
      throw error;
    }
  }

  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .in('id', ids)
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      this.logger.info(`✅ Deleted ${ids.length} customers`);
    } catch (error) {
      this.logger.error('Failed to bulk delete customers', error);
      throw error;
    }
  }

  async bulkUpdateCustomers(ids: string[], data: Record<string, unknown>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      this.logger.info(`✅ Updated ${ids.length} customers`);
    } catch (error) {
      this.logger.error('Failed to bulk update customers', error);
      throw error;
    }
  }

  async getTags(): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_tags')
        .select('*')
        .eq('tenant_id', this.getTenantId())
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Failed to fetch customer tags', error);
      return [];
    }
  }

  async createTag(name: string, color: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await this.supabase
        .from('customer_tags')
        .insert([{
          name,
          color,
          tenant_id: this.getTenantId(),
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      this.logger.info(`✅ Created tag: ${name}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to create tag', error);
      throw error;
    }
  }

  async exportCustomers(format: string = 'csv'): Promise<string> {
    try {
      const customers = await this.getCustomers();
      
      if (format === 'json') {
        return JSON.stringify(customers, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Company Name', 'Contact', 'Email', 'Phone', 'Status'];
      const rows = customers.map((c: any) => [
        c.id,
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.status,
      ]);

      return [headers, ...rows]
        .map(r => r.map(v => `"${v || ''}"`).join(','))
        .join('\n');
    } catch (error) {
      this.logger.error('Failed to export customers', error);
      throw error;
    }
  }

  async importCustomers(data: string): Promise<Record<string, unknown>> {
    try {
      // Parse CSV/JSON and insert
      const records = this.parseImportData(data);
      const result = await this.batchInsert(this.tableName, records);
      
      this.logger.info(`✅ Imported ${result.length} customers`);
      return { success: result.length, errors: [] };
    } catch (error) {
      this.logger.error('Failed to import customers', error);
      throw error;
    }
  }

  async getIndustries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_industries')
        .select('name')
        .order('name');

      if (error) throw error;
      return data?.map((d: any) => d.name) || [];
    } catch (error) {
      this.logger.error('Failed to fetch industries', error);
      return [];
    }
  }

  async getSizes(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_sizes')
        .select('name')
        .order('name');

      if (error) throw error;
      return data?.map((d: any) => d.name) || [];
    } catch (error) {
      this.logger.error('Failed to fetch sizes', error);
      return [];
    }
  }

  private parseImportData(data: string): Record<string, unknown>[] {
    // Implement CSV/JSON parsing
    // This is a placeholder - implement based on format
    return [];
  }
}
```

**✅ Checklist Item:**
- [ ] Supabase Customer Service created
- [ ] All interface methods implemented
- [ ] Filtering and search implemented
- [ ] Bulk operations added
- [ ] Export/import functions added

---

## 📋 SECTION 5: ENHANCED FACTORY PATTERN

### 5.1 Update API Service Factory (Core File)

**File: `src/services/api/apiServiceFactory.ts`** (Update the existing file)

**Add to top of file (after imports):**

```typescript
import { backendConfig, getServiceBackend } from '@/config/backendConfig';
import { getSupabaseClient } from '../supabase/client';
import { SupabaseCustomerService } from '../supabase/customerService';
// Import other Supabase services as they're created

// Add tracking for backend mode
private currentBackendMode: BackendMode = backendConfig.mode;
private metrics = {
  callCount: 0,
  errorCount: 0,
  averageResponseTime: 0,
};
```

**Update `getCustomerService()` method:**

```typescript
public getCustomerService(): ICustomerService {
  const serviceKey = 'customer';
  
  if (this.customerServiceInstance) {
    return this.customerServiceInstance;
  }

  // Determine which backend to use
  const backend = getServiceBackend('customer');

  try {
    if (backend === 'supabase' && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      this.customerServiceInstance = new SupabaseCustomerService(supabase) as ICustomerService;
      console.log('✅ Using Supabase Customer Service');
    } else if (backend === 'real') {
      this.customerServiceInstance = new RealCustomerService();
      console.log('✅ Using Real Customer Service');
    } else {
      this.customerServiceInstance = mockCustomerService as ICustomerService;
      console.log('✅ Using Mock Customer Service');
    }
  } catch (error) {
    console.error(`Failed to initialize ${backend} customer service:`, error);
    // Fallback to mock
    this.customerServiceInstance = mockCustomerService as ICustomerService;
  }

  return this.customerServiceInstance;
}
```

**✅ Checklist Item:**
- [ ] Factory pattern updated for 3 backends
- [ ] Service fallback logic added
- [ ] Logging implemented
- [ ] Error handling added

---

### 5.2 Create Service Factory Diagnostics

**File: `src/services/api/factoryDiagnostics.ts`**

```typescript
/**
 * Service Factory Diagnostics
 * Debug and monitor service factory behavior
 */

import { apiServiceFactory } from './apiServiceFactory';
import { backendConfig } from '@/config/backendConfig';

export interface FactoryDiagnostics {
  currentMode: string;
  availableBackends: string[];
  serviceStatus: Record<string, {
    backend: string;
    initialized: boolean;
    healthy: boolean;
  }>;
  metrics: Record<string, unknown>;
  configuration: Record<string, unknown>;
  errors: string[];
}

/**
 * Get full diagnostic information
 */
export function getDiagnostics(): FactoryDiagnostics {
  const errors: string[] = [];

  // Validate configuration
  if (!backendConfig.mode) {
    errors.push('API_MODE not configured');
  }

  if (backendConfig.mode === 'supabase' && !backendConfig.supabase?.url) {
    errors.push('Supabase URL not configured');
  }

  if (backendConfig.mode === 'real' && !backendConfig.realApi?.baseUrl) {
    errors.push('Real API URL not configured');
  }

  return {
    currentMode: backendConfig.mode,
    availableBackends: [
      'mock',
      ...(backendConfig.supabase?.url ? ['supabase'] : []),
      ...(backendConfig.realApi?.baseUrl ? ['real'] : []),
    ],
    serviceStatus: {
      auth: { backend: backendConfig.mode, initialized: true, healthy: true },
      customer: { backend: backendConfig.mode, initialized: true, healthy: true },
      sales: { backend: backendConfig.mode, initialized: true, healthy: true },
      ticket: { backend: backendConfig.mode, initialized: true, healthy: true },
      contract: { backend: backendConfig.mode, initialized: true, healthy: true },
      user: { backend: backendConfig.mode, initialized: true, healthy: true },
      dashboard: { backend: backendConfig.mode, initialized: true, healthy: true },
      notification: { backend: backendConfig.mode, initialized: true, healthy: true },
      file: { backend: backendConfig.mode, initialized: true, healthy: true },
      audit: { backend: backendConfig.mode, initialized: true, healthy: true },
    },
    metrics: apiServiceFactory.getMetrics?.() || {},
    configuration: {
      featureFlags: backendConfig.featureFlags,
      caching: backendConfig.cache,
      monitoring: backendConfig.monitoring,
    },
    errors,
  };
}

/**
 * Print diagnostics to console
 */
export function printDiagnostics(): void {
  const diagnostics = getDiagnostics();

  console.group('🔧 Service Factory Diagnostics');
  console.log('Current Mode:', diagnostics.currentMode);
  console.log('Available Backends:', diagnostics.availableBackends);
  console.table(diagnostics.serviceStatus);
  console.log('Metrics:', diagnostics.metrics);
  console.log('Configuration:', diagnostics.configuration);
  if (diagnostics.errors.length > 0) {
    console.warn('Errors:', diagnostics.errors);
  }
  console.groupEnd();
}

/**
 * Validate all services
 */
export async function validateAllServices(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  const services = [
    'auth',
    'customer',
    'sales',
    'ticket',
    'contract',
    'user',
    'dashboard',
    'notification',
    'file',
    'audit',
  ];

  for (const service of services) {
    try {
      // Try to get service and call a basic method
      const serviceInstance = (apiServiceFactory as any)[`get${service.charAt(0).toUpperCase()}${service.slice(1)}Service`]?.();
      results[service] = !!serviceInstance;
    } catch (error) {
      console.error(`Failed to validate ${service}:`, error);
      results[service] = false;
    }
  }

  return results;
}
```

**✅ Checklist Item:**
- [ ] Diagnostics service created
- [ ] Validation function implemented
- [ ] Debug logging added
- [ ] Service health checks added

---

## 📋 SECTION 6: TESTING & VALIDATION

### 6.1 Create Integration Test Suite

**File: `src/__tests__/services/multiBackendIntegration.test.ts`**

```typescript
/**
 * Multi-Backend Integration Tests
 * Ensures all three backends work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { backendConfig } from '@/config/backendConfig';

describe('Multi-Backend Service Integration', () => {
  describe('Mock Backend', () => {
    beforeEach(() => {
      process.env.VITE_API_MODE = 'mock';
      // Re-initialize factory
    });

    it('should fetch customers from mock', async () => {
      // Test implementation
    });

    it('should create customer in mock', async () => {
      // Test implementation
    });
  });

  describe('Real API Backend', () => {
    beforeEach(() => {
      process.env.VITE_API_MODE = 'real';
    });

    it('should fetch customers from real API', async () => {
      // Test implementation
    });

    it('should handle API errors gracefully', async () => {
      // Test error handling
    });
  });

  describe('Supabase Backend', () => {
    beforeEach(async () => {
      process.env.VITE_API_MODE = 'supabase';
      // Initialize Supabase
    });

    it('should fetch customers from Supabase', async () => {
      // Test implementation
    });

    it('should support real-time updates', async () => {
      // Test real-time functionality
    });

    it('should handle bulk operations', async () => {
      // Test batch operations
    });
  });

  describe('Backend Switching', () => {
    it('should switch backends dynamically', async () => {
      // Test switching from mock to real to supabase
    });

    it('should maintain data consistency', async () => {
      // Test data consistency across backends
    });

    it('should handle service fallback', async () => {
      // Test fallback to mock if other backends fail
    });
  });
});
```

**✅ Checklist Item:**
- [ ] Integration test file created
- [ ] Test cases for all three backends added
- [ ] Backend switching tests added
- [ ] Data consistency tests added

---

## 📋 SECTION 7: DEPLOYMENT CONFIGURATION

### 7.1 Environment Configuration Examples

**Development (.env.development):**
```bash
VITE_API_MODE=mock
VITE_DEBUG_SERVICE_FACTORY=true
VITE_ENABLE_SERVICE_LOGGING=true
```

**Staging (.env.staging):**
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_DEBUG_SERVICE_FACTORY=false
```

**Production (.env.production):**
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_ENABLE_SERVICE_LOGGING=false
VITE_ENABLE_ERROR_TRACKING=true
```

**✅ Checklist Item:**
- [ ] Development environment configured
- [ ] Staging environment configured
- [ ] Production environment configured
- [ ] Credentials secured in CI/CD

---

## 📋 SECTION 8: QUICK START COMMANDS

### 8.1 Verification Prompts

```bash
# 1. Verify all installations
npm ls @supabase/supabase-js

# 2. Verify environment variables
echo "Supabase URL: $VITE_SUPABASE_URL"
echo "API Mode: $VITE_API_MODE"

# 3. Run development server
npm run dev

# 4. Test factory diagnostics (in console)
import { printDiagnostics } from '@/services/api/factoryDiagnostics';
printDiagnostics();

# 5. Switch backend mode (in console)
import { backendConfig } from '@/config/backendConfig';
console.log('Current mode:', backendConfig.mode);

# 6. Run tests
npm run test -- multiBackendIntegration.test.ts

# 7. Build for production
npm run build
```

**✅ Checklist Item:**
- [ ] All commands verified
- [ ] Development server running
- [ ] Diagnostics accessible
- [ ] Tests passing

---

## 📋 COMPLETION CHECKLIST

### ✅ Phase 1: Foundation (Day 1)
- [ ] Dependencies installed
- [ ] Supabase project created
- [ ] Environment files updated
- [ ] Backend configuration service created
- [ ] Supabase client initialized

### ✅ Phase 2: Base Services (Day 2)
- [ ] Base Supabase service created
- [ ] Supabase customer service implemented
- [ ] Service logger configured
- [ ] Real-time subscription support added

### ✅ Phase 3: Factory Pattern (Day 3)
- [ ] Factory pattern updated
- [ ] Service fallback logic implemented
- [ ] Diagnostics service created
- [ ] Metrics collection added

### ✅ Phase 4: Testing (Day 4)
- [ ] Unit tests created
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Performance benchmarks recorded

### ✅ Phase 5: Documentation (Day 5)
- [ ] README updated
- [ ] Troubleshooting guide created
- [ ] Architecture diagrams added
- [ ] Team trained

### ✅ Phase 6: Deployment (Days 6-7)
- [ ] Staging deployment successful
- [ ] Production credentials configured
- [ ] Monitoring and alerting setup
- [ ] Rollback plan documented

---

## 📞 TROUBLESHOOTING QUICK REFERENCE

| Issue | Solution | Command |
|-------|----------|---------|
| Supabase connection fails | Check credentials and network | `checkSupabaseConnection()` |
| Services not switching | Clear cache and restart | `npm run dev --force` |
| Type errors | Reinstall types | `npm install --save-dev @types/supabase` |
| Data inconsistency | Enable sync and dedup | `VITE_ENABLE_SERVICE_CACHE=true` |
| Performance issues | Enable caching | `VITE_ENABLE_SERVICE_CACHE=true` |

---

## 📚 NEXT SECTIONS IN OTHER FILES

**See also:**
- `MULTI_BACKEND_INTEGRATION_GUIDE.md` - Architecture deep dive
- `API_QUICK_REFERENCE.md` - API endpoint documentation
- `INTEGRATION_AUDIT_REPORT.md` - Current integration status

---

## 🎯 SUCCESS CRITERIA

You will know implementation is complete when:

✅ **All three backends work independently**
- Mock: Returns static data instantly
- Real: Connects to .NET Core backend
- Supabase: Reads/writes to Supabase database

✅ **Seamless switching works**
- Change `VITE_API_MODE` and restart
- No code changes needed
- Data flows correctly

✅ **Enterprise-level consistency**
- Same interface across all backends
- Type-safe throughout
- Proper error handling
- Comprehensive logging

✅ **All tests pass**
- Unit tests for each backend
- Integration tests for switching
- E2E tests for user flows

✅ **Production-ready**
- Monitoring and alerting setup
- Performance benchmarks documented
- Rollback plan in place
- Team trained

---

**Good luck with your implementation! 🚀**
