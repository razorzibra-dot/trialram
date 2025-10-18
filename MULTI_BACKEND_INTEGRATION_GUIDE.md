# Multi-Backend Integration Guide
## Mock + Real API + Supabase Support

**Enterprise-Level Architecture for Seamless Backend Switching**

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Implementation Checklist](#implementation-checklist)
4. [Service Implementation Examples](#service-implementation-examples)
5. [Factory Pattern Enhancement](#factory-pattern-enhancement)
6. [Testing & Validation](#testing--validation)
7. [Migration Strategy](#migration-strategy)
8. [Troubleshooting](#troubleshooting)

---

## ARCHITECTURE OVERVIEW

### Multi-Backend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                    Service Index (index.ts)                 │
│              (Transformation & Normalization Layer)         │
├─────────────────────────────────────────────────────────────┤
│                    API Service Factory                      │
│        ┌──────────────────────────────────────────┐        │
│        │  Determines Backend Mode & Creates       │        │
│        │  Service Instances (Mock/Real/Supabase) │        │
│        └──────────────────────────────────────────┘        │
├──────────────┬─────────────────┬──────────────────┤
│              │                 │                  │
▼              ▼                 ▼                  ▼
Mock         Real API       Supabase           Future
Services     (.NET Core)    Services           Services
- Static     - REST API     - Real-time DB    (GraphQL,
- In-Memory  - JWT Auth     - PostGIS        etc.)
- Generators - Complex      - Auth
             Queries        - Edge Functions
```

### Key Design Principles

**1. Factory Pattern (3-Mode Support)**
```typescript
API_MODE = 'mock' | 'real' | 'supabase'
```

**2. Interface-First Approach**
- All backends implement same interface
- Type-safe across all modes
- No breaking changes on mode switch

**3. Service Abstraction Layer**
- Data transformation happens at service level
- Components remain backend-agnostic
- Consistent UI regardless of backend

**4. Configuration-Driven**
- Environment variables control behavior
- No code changes needed for mode switching
- Runtime environment detection

**5. Gradual Migration**
- Mix backends simultaneously
- Migrate services one-by-one
- Rollback capability at service level

---

## ENVIRONMENT CONFIGURATION

### Step 1: Extend .env File

```bash
# ============================================================================
# MULTI-BACKEND CONFIGURATION
# ============================================================================

# Backend Mode Selection (mock | real | supabase)
VITE_API_MODE=mock

# Mock API (Development/Testing)
VITE_USE_MOCK_API=true  # Keep for backward compatibility

# Real API (.NET Core Backend)
VITE_API_BASE_URL=http://localhost:5137/api/v1
VITE_API_ENVIRONMENT=development
VITE_API_TIMEOUT=30000

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

# Supabase Project Settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-key  # Backend only

# Supabase Features
VITE_SUPABASE_ENABLE_REALTIME=true
VITE_SUPABASE_ENABLE_OFFLINE=true
VITE_SUPABASE_SYNC_INTERVAL=5000

# Authentication Mode
VITE_SUPABASE_AUTH_METHOD=jwt  # jwt | oauth | magic_link

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Enable specific backend features per service
VITE_CUSTOMER_BACKEND=supabase      # Mock | Real | Supabase
VITE_SALES_BACKEND=real             # Mock | Real | Supabase
VITE_TICKET_BACKEND=mock            # Mock | Real | Supabase
VITE_CONTRACT_BACKEND=supabase      # Mock | Real | Supabase
VITE_USER_BACKEND=real              # Mock | Real | Supabase
VITE_DASHBOARD_BACKEND=mock         # Mock | Real | Supabase
VITE_NOTIFICATION_BACKEND=supabase  # Mock | Real | Supabase
VITE_FILE_BACKEND=supabase          # Mock | Real | Supabase (use Supabase Storage)
VITE_AUDIT_BACKEND=real             # Mock | Real | Supabase

# ============================================================================
# CACHING & PERFORMANCE
# ============================================================================

VITE_ENABLE_SERVICE_CACHE=true
VITE_CACHE_TTL=300000              # 5 minutes
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

### Step 2: Create Config Service

**File: `src/config/backendConfig.ts`**

```typescript
/**
 * Backend Configuration Service
 * Manages multi-backend configuration and feature flags
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
  featureFlags?: {
    [serviceKey: string]: ServiceBackend;
  };
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
 */
export const backendConfig: BackendConfig = {
  // Main backend mode
  mode: (import.meta.env.VITE_API_MODE || 'mock') as BackendMode,

  // Supabase configuration
  supabase: import.meta.env.VITE_SUPABASE_URL ? {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
    enableRealtime: import.meta.env.VITE_SUPABASE_ENABLE_REALTIME === 'true',
    enableOffline: import.meta.env.VITE_SUPABASE_ENABLE_OFFLINE === 'true',
    syncInterval: parseInt(import.meta.env.VITE_SUPABASE_SYNC_INTERVAL || '5000'),
    authMethod: (import.meta.env.VITE_SUPABASE_AUTH_METHOD || 'jwt') as 'jwt' | 'oauth' | 'magic_link',
  } : undefined,

  // Real API configuration
  realApi: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5137/api/v1',
    environment: (import.meta.env.VITE_API_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },

  // Service-level backend configuration
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

  // Caching configuration
  cache: {
    enabled: import.meta.env.VITE_ENABLE_SERVICE_CACHE !== 'false',
    ttl: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
    deduplication: import.meta.env.VITE_ENABLE_REQUEST_DEDUPLICATION !== 'false',
  },

  // Monitoring configuration
  monitoring: {
    enableLogging: import.meta.env.VITE_ENABLE_SERVICE_LOGGING !== 'false',
    enableMetrics: import.meta.env.VITE_ENABLE_PERFORMANCE_METRICS !== 'false',
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'false',
    debugFactory: import.meta.env.VITE_DEBUG_SERVICE_FACTORY === 'true',
  },
};

/**
 * Get backend mode for a specific service
 * Falls back to global mode if not specified
 */
export function getServiceBackend(serviceName: keyof typeof backendConfig.featureFlags): BackendMode {
  const serviceBackend = backendConfig.featureFlags?.[serviceName];
  
  if (serviceBackend === 'auto' || !serviceBackend) {
    return backendConfig.mode;
  }
  
  return serviceBackend as BackendMode;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!backendConfig.supabase?.url && !!backendConfig.supabase?.anonKey;
}

/**
 * Check if Real API is configured
 */
export function isRealApiConfigured(): boolean {
  return !!backendConfig.realApi?.baseUrl;
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }
  return backendConfig.supabase!;
}

/**
 * Validate configuration
 */
export function validateBackendConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!backendConfig.mode) {
    errors.push('VITE_API_MODE is not set');
  }

  if (backendConfig.mode === 'supabase' && !isSupabaseConfigured()) {
    errors.push('Supabase mode selected but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured');
  }

  if (backendConfig.mode === 'real' && !isRealApiConfigured()) {
    errors.push('Real API mode selected but VITE_API_BASE_URL not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation Setup (Day 1)
- [ ] Extend `.env.example` with all three backend configurations
- [ ] Create `src/config/backendConfig.ts`
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create Supabase initialization service
- [ ] Create enhanced API Service Factory
- [ ] Create service-level backend resolver

### Phase 2: Supabase Service Infrastructure (Days 2-3)
- [ ] Create base Supabase service class
- [ ] Implement Supabase auth service
- [ ] Implement Supabase customer service
- [ ] Implement Supabase sales service
- [ ] Implement Supabase ticket service
- [ ] Create data sync manager
- [ ] Create offline queue manager

### Phase 3: Factory Enhancement (Days 3-4)
- [ ] Update API Service Factory for 3 modes
- [ ] Add service-level backend selection
- [ ] Add service warm-up logic
- [ ] Add health check endpoints
- [ ] Add metrics collection

### Phase 4: Service Migration (Days 5-10)
- [ ] Migrate Customer Service to Supabase
- [ ] Migrate Sales Service
- [ ] Migrate Ticket Service
- [ ] Migrate Notification Service
- [ ] Migrate File Service
- [ ] Update transformers and mappers

### Phase 5: Testing & Validation (Days 11-14)
- [ ] Unit tests for each service implementation
- [ ] Integration tests for factory pattern
- [ ] End-to-end tests for data flow
- [ ] Performance benchmarks
- [ ] Data consistency validation
- [ ] Offline mode testing

### Phase 6: Deployment & Monitoring (Days 15-21)
- [ ] Set up monitoring and alerting
- [ ] Create migration scripts
- [ ] Document production configuration
- [ ] Train team on switching backends
- [ ] Create runbooks for troubleshooting

---

## SERVICE IMPLEMENTATION EXAMPLES

### Example 1: Supabase Customer Service

**File: `src/services/supabase/customerService.ts`**

```typescript
/**
 * Supabase Customer Service
 * Implements ICustomerService interface for Supabase backend
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
        .select('*');

      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.industry) {
          query = query.eq('industry', filters.industry);
        }
        if (filters.assignedTo) {
          query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters.search) {
          query = query.or(`company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
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
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch customer ${id}`, error);
      throw error;
    }
  }

  async createCustomer(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { data: newCustomer, error } = await this.supabase
        .from(this.tableName)
        .insert([{
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
          created_at: new Date().toISOString(),
          created_by: this.getCurrentUserId(),
        }])
        .select()
        .single();

      if (error) throw error;
      return newCustomer;
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw error;
    }
  }

  async updateCustomer(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const { data: updatedCustomer, error } = await this.supabase
        .from(this.tableName)
        .update({
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
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
        .eq('id', id);

      if (error) throw error;
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
        .in('id', ids);

      if (error) throw error;
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
        .in('id', ids);

      if (error) throw error;
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
        .eq('tenant_id', this.getTenantId());

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.logger.error('Failed to fetch customer tags', error);
      return [];
    }
  }

  async exportCustomers(format: string = 'csv'): Promise<string> {
    try {
      const customers = await this.getCustomers();
      
      if (format === 'json') {
        return JSON.stringify(customers, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Company Name', 'Contact Name', 'Email', 'Phone', 'Status', 'Created At'];
      const rows = customers.map((c: Record<string, unknown>) => [
        c.id,
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.status,
        new Date(c.created_at as string).toLocaleDateString(),
      ]);

      return [headers, ...rows]
        .map(row => row.map(v => `"${v ?? ''}"`).join(','))
        .join('\n');
    } catch (error) {
      this.logger.error('Failed to export customers', error);
      throw error;
    }
  }

  async importCustomers(data: string): Promise<Record<string, unknown>> {
    try {
      // Parse CSV or JSON
      const parsed = this.parseImportData(data);
      
      // Validate and insert
      const { error } = await this.supabase
        .from(this.tableName)
        .insert(parsed);

      if (error) throw error;

      return { success: parsed.length, errors: [] };
    } catch (error) {
      this.logger.error('Failed to import customers', error);
      throw error;
    }
  }

  private parseImportData(data: string): Record<string, unknown>[] {
    // Implement CSV/JSON parsing logic
    return [];
  }

  async createTag(name: string, color: string): Promise<Record<string, unknown>> {
    try {
      const { data: newTag, error } = await this.supabase
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
      return newTag;
    } catch (error) {
      this.logger.error('Failed to create tag', error);
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
      return data?.map((d: Record<string, unknown>) => d.name as string) || [];
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
      return data?.map((d: Record<string, unknown>) => d.name as string) || [];
    } catch (error) {
      this.logger.error('Failed to fetch sizes', error);
      return [];
    }
  }
}
```

### Example 2: Base Supabase Service

**File: `src/services/supabase/baseSupabaseService.ts`**

```typescript
/**
 * Base Supabase Service
 * Provides common functionality for all Supabase services
 */

import { SupabaseClient } from '@supabase/supabase-js';

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
    this.logger = logger || this.getDefaultLogger();
    this.extractUserInfo();
  }

  /**
   * Extract tenant and user info from session
   */
  private async extractUserInfo(): Promise<void> {
    try {
      const { data } = await this.supabase.auth.getSession();
      if (data.session?.user) {
        this.userId = data.session.user.id;
        // Extract tenant_id from user metadata or JWT
        const claims = data.session.user.user_metadata || {};
        this.tenantId = claims.tenant_id || null;
      }
    } catch (error) {
      this.logger.warn('Failed to extract user info', error);
    }
  }

  /**
   * Get tenant ID for multi-tenant filtering
   */
  protected getTenantId(): string {
    if (!this.tenantId) {
      throw new Error('Tenant ID not found. Ensure user is authenticated.');
    }
    return this.tenantId;
  }

  /**
   * Get current user ID
   */
  protected getCurrentUserId(): string {
    if (!this.userId) {
      throw new Error('User ID not found. Ensure user is authenticated.');
    }
    return this.userId;
  }

  /**
   * Handle real-time subscriptions
   */
  protected subscribeToTable(
    tableName: string,
    schema: string = 'public',
    onUpdate: (payload: unknown) => void
  ): () => void {
    const channel = this.supabase
      .channel(`${tableName}:${this.tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table: tableName,
          filter: `tenant_id=eq.${this.tenantId}`,
        },
        (payload) => {
          this.logger.debug(`Received update for ${tableName}`, payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
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
    const batches = [];

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    const allResults: Record<string, unknown>[] = [];

    for (const batch of batches) {
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) throw error;
      allResults.push(...(data || []));
    }

    return allResults;
  }

  /**
   * Implement soft deletes
   */
  protected async softDelete(
    tableName: string,
    id: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get default logger
   */
  private getDefaultLogger(): ServiceLogger {
    return {
      info: (msg, data) => console.info(`[${new Date().toISOString()}] ${msg}`, data),
      warn: (msg, data) => console.warn(`[${new Date().toISOString()}] ${msg}`, data),
      error: (msg, err) => console.error(`[${new Date().toISOString()}] ${msg}`, err),
      debug: (msg, data) => console.debug(`[${new Date().toISOString()}] ${msg}`, data),
    };
  }
}
```

### Example 3: Enhanced API Service Factory

**File: `src/services/api/apiServiceFactoryV3.ts`**

```typescript
/**
 * API Service Factory V3 - Multi-Backend Support
 * Supports Mock, Real API, and Supabase backends
 */

import { backendConfig, getServiceBackend, isSupabaseConfigured } from '@/config/backendConfig';
import type { BackendMode } from '@/config/backendConfig';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

// Service interfaces (unchanged)
export interface IAuthService {
  login(credentials: Record<string, unknown>): Promise<Record<string, unknown>>;
  logout(): Promise<void>;
  getCurrentUser(): Record<string, unknown> | null;
  getToken(): string | null;
  isAuthenticated(): boolean;
  // ... other methods
}

// ... Other service interfaces

/**
 * Multi-Backend Service Factory
 */
class MultiBackendServiceFactory {
  private static instance: MultiBackendServiceFactory;
  private currentMode: BackendMode;
  private supabaseClient: SupabaseClient | null = null;
  private serviceInstances: Map<string, unknown> = new Map();
  private healthChecks: Map<string, { lastCheck: number; isHealthy: boolean }> = new Map();

  // Service metrics
  private metrics = {
    callCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastError: null as Error | null,
  };

  private constructor() {
    this.currentMode = backendConfig.mode;
    this.initializeSupabase();
    this.setupEnvironmentListener();
    this.logConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MultiBackendServiceFactory {
    if (!MultiBackendServiceFactory.instance) {
      MultiBackendServiceFactory.instance = new MultiBackendServiceFactory();
    }
    return MultiBackendServiceFactory.instance;
  }

  /**
   * Initialize Supabase client if configured
   */
  private initializeSupabase(): void {
    if (isSupabaseConfigured() && backendConfig.supabase) {
      try {
        this.supabaseClient = createClient(
          backendConfig.supabase.url,
          backendConfig.supabase.anonKey,
          {
            auth: {
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: true,
            },
            realtime: {
              enabled: backendConfig.supabase.enableRealtime,
            },
          }
        );

        console.log('[ServiceFactory] Supabase client initialized');
      } catch (error) {
        console.error('[ServiceFactory] Failed to initialize Supabase', error);
      }
    }
  }

  /**
   * Setup environment change listener
   */
  private setupEnvironmentListener(): void {
    setInterval(() => {
      const newMode = backendConfig.mode;
      if (newMode !== this.currentMode) {
        this.switchBackendMode(newMode);
      }
    }, 1000);
  }

  /**
   * Switch backend mode
   */
  public switchBackendMode(newMode: BackendMode): void {
    if (newMode !== this.currentMode) {
      console.log(`[ServiceFactory] Switching from ${this.currentMode} to ${newMode}`);
      this.currentMode = newMode;
      this.clearServiceInstances();
    }
  }

  /**
   * Clear all service instances
   */
  private clearServiceInstances(): void {
    this.serviceInstances.clear();
    this.healthChecks.clear();
  }

  /**
   * Get Auth Service
   */
  public getAuthService(): IAuthService {
    const key = 'auth';
    const backend = getServiceBackend('auth' as any);

    if (this.serviceInstances.has(key)) {
      return this.serviceInstances.get(key) as IAuthService;
    }

    let service: IAuthService;

    if (backend === 'supabase' && this.supabaseClient) {
      // Implement Supabase Auth Service
      // service = new SupabaseAuthService(this.supabaseClient);
    } else if (backend === 'real') {
      // Use existing Real Auth Service
      // service = new RealAuthService();
    } else {
      // Use Mock Auth Service
      // service = mockAuthService as IAuthService;
    }

    this.serviceInstances.set(key, service!);
    return service!;
  }

  /**
   * Get Customer Service
   */
  public getCustomerService() {
    const key = 'customer';
    const backend = getServiceBackend('customer' as any);

    if (this.serviceInstances.has(key)) {
      return this.serviceInstances.get(key);
    }

    let service;

    if (backend === 'supabase' && this.supabaseClient) {
      // service = new SupabaseCustomerService(this.supabaseClient);
    } else if (backend === 'real') {
      // service = new RealCustomerService();
    } else {
      // service = mockCustomerService;
    }

    this.serviceInstances.set(key, service!);
    return service!;
  }

  /**
   * Record service call metrics
   */
  public recordMetric(success: boolean, responseTime: number): void {
    this.metrics.callCount++;
    if (!success) this.metrics.errorCount++;
    
    // Calculate running average
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.callCount - 1) + responseTime) / this.metrics.callCount;
  }

  /**
   * Get service health status
   */
  public async checkServiceHealth(serviceName: string): Promise<boolean> {
    const cached = this.healthChecks.get(serviceName);
    
    // Cache for 30 seconds
    if (cached && Date.now() - cached.lastCheck < 30000) {
      return cached.isHealthy;
    }

    try {
      // Implement health check based on backend type
      const isHealthy = true; // Placeholder
      
      this.healthChecks.set(serviceName, {
        lastCheck: Date.now(),
        isHealthy,
      });

      return isHealthy;
    } catch (error) {
      this.healthChecks.set(serviceName, {
        lastCheck: Date.now(),
        isHealthy: false,
      });
      return false;
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime?.() || 0,
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage?.() : {},
    };
  }

  /**
   * Log configuration
   */
  private logConfiguration(): void {
    if (backendConfig.monitoring?.debugFactory) {
      console.log('[ServiceFactory] Configuration:', {
        mode: this.currentMode,
        featureFlags: backendConfig.featureFlags,
        supabaseEnabled: !!this.supabaseClient,
      });
    }
  }

  /**
   * Validate all services
   */
  public async validateServices(): Promise<Record<string, boolean>> {
    const validation: Record<string, boolean> = {};

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
      validation[service] = await this.checkServiceHealth(service);
    }

    return validation;
  }
}

export const multiBackendFactory = MultiBackendServiceFactory.getInstance();
```

---

## FACTORY PATTERN ENHANCEMENT

### Complete Implementation Pattern

```typescript
// Usage in components
import { authService, customerService } from '@/services';

function MyComponent() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Service automatically uses configured backend
    customerService.getCustomers().then(setCustomers);
  }, []);

  return <div>{/* render customers */}</div>;
}

// Service switching (no code changes needed)
// Just change environment variables and restart:
//   Development with Mock:    VITE_API_MODE=mock
//   Development with Real:    VITE_API_MODE=real
//   Development with Supabase: VITE_API_MODE=supabase
```

---

## TESTING & VALIDATION

### Unit Testing Template

```typescript
// tests/services/customerService.test.ts

describe('Customer Service - Multi-Backend', () => {
  describe('Mock Backend', () => {
    beforeEach(() => {
      process.env.VITE_API_MODE = 'mock';
    });

    it('should fetch customers', async () => {
      const customers = await customerService.getCustomers();
      expect(customers).toBeArray();
    });
  });

  describe('Real Backend', () => {
    beforeEach(() => {
      process.env.VITE_API_MODE = 'real';
    });

    it('should fetch customers from API', async () => {
      // Mock API response
      const customers = await customerService.getCustomers();
      expect(customers).toBeArray();
    });
  });

  describe('Supabase Backend', () => {
    beforeEach(() => {
      process.env.VITE_API_MODE = 'supabase';
    });

    it('should fetch customers from Supabase', async () => {
      const customers = await customerService.getCustomers();
      expect(customers).toBeArray();
    });
  });
});
```

---

## MIGRATION STRATEGY

### Gradual Migration Path

**Phase 1: Parallel Run (Week 1)**
- Keep all three backends available
- Use feature flags per service
- Mirror data to validate consistency

**Phase 2: Service Migration (Weeks 2-4)**
- Migrate Customer → Supabase
- Migrate Sales → Supabase
- Migrate Ticket → Supabase
- Migrate Notification → Supabase

**Phase 3: Cutover (Week 5)**
- Switch production to Supabase
- Keep real API as fallback
- Monitor for 1 week

**Phase 4: Cleanup (Week 6)**
- Remove fallback backend
- Archive old code
- Document lessons learned

---

## TROUBLESHOOTING

### Common Issues & Solutions

**Issue 1: Services not switching modes**
```bash
# Solution: Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

**Issue 2: Supabase authentication fails**
```typescript
// Check configuration
const config = backendConfig.supabase;
console.log('URL:', config?.url);
console.log('Key exists:', !!config?.anonKey);
```

**Issue 3: Data inconsistency between backends**
```typescript
// Enable data sync
VITE_ENABLE_SERVICE_CACHE=true
VITE_ENABLE_REQUEST_DEDUPLICATION=true
```

---

## PERFORMANCE METRICS

### Benchmarking Template

```typescript
async function benchmarkBackends() {
  const iterations = 100;
  const backends = ['mock', 'real', 'supabase'];

  for (const backend of backends) {
    backendConfig.mode = backend;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await customerService.getCustomers();
    }

    const duration = performance.now() - start;
    console.log(`${backend}: ${duration}ms average per call`);
  }
}
```

---

## BEST PRACTICES

1. **Always use factory pattern** - Never import services directly
2. **Implement all three backends** - Even if only using one initially
3. **Use feature flags** - Migrate per-service, not all-or-nothing
4. **Monitor carefully** - Watch metrics during migrations
5. **Test thoroughly** - Unit, integration, and E2E tests for all backends
6. **Document everything** - Running books for troubleshooting
7. **Keep feature parity** - All backends implement same interface
8. **Plan rollbacks** - Have strategy to revert changes quickly

---

## NEXT STEPS

1. ✅ Review this guide
2. ✅ Create configuration files
3. ✅ Implement Supabase services
4. ✅ Update factory pattern
5. ✅ Run tests and benchmarks
6. ✅ Deploy to staging
7. ✅ Monitor and validate
8. ✅ Deploy to production
