// Super Admin Types
export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent';
  tenant_id: string;
  tenant_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  avatar?: string;
  phone?: string;
  global_permissions?: string[];
}

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  plan: 'basic' | 'premium' | 'enterprise';
  features: string[];
  limits: {
    users: number;
    storage_gb: number;
    api_calls_per_month: number;
    custom_fields: number;
  };
  billing: {
    monthly_cost: number;
    currency: string;
    billing_cycle: 'monthly' | 'yearly';
    next_billing_date: string;
  };
  users_count: number;
  storage_used_gb: number;
  api_calls_this_month: number;
  created_at: string;
  updated_at: string;
  admin_contact: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface RoleRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  current_role: string;
  requested_role: string;
  tenant_id: string;
  tenant_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_comments?: string;
}

export interface PlatformUsage {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  active_users: number;
  total_api_calls: number;
  total_storage_gb: number;
  revenue: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  growth: {
    tenants_growth: number;
    users_growth: number;
    revenue_growth: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  services: {
    api: {
      status: 'up' | 'down' | 'degraded';
      response_time: number;
      error_rate: number;
    };
    database: {
      status: 'up' | 'down' | 'degraded';
      connections: number;
      query_time: number;
    };
    storage: {
      status: 'up' | 'down' | 'degraded';
      usage_percent: number;
      available_gb: number;
    };
    cache: {
      status: 'up' | 'down' | 'degraded';
      hit_rate: number;
      memory_usage: number;
    };
  };
  alerts: Array<{
    id: string;
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface AnalyticsData {
  tenant_metrics: {
    labels: string[];
    active_tenants: number[];
    new_signups: number[];
    churn_rate: number[];
  };
  user_metrics: {
    labels: string[];
    total_users: number[];
    active_users: number[];
    new_registrations: number[];
  };
  revenue_metrics: {
    labels: string[];
    monthly_revenue: number[];
    plan_distribution: {
      basic: number;
      premium: number;
      enterprise: number;
    };
  };
  api_usage: {
    labels: string[];
    total_calls: number[];
    error_rate: number[];
    response_time: number[];
  };
}

export interface SuperAdminFilters {
  tenants?: {
    status?: string;
    plan?: string;
    search?: string;
  };
  users?: {
    role?: string;
    status?: string;
    tenant_id?: string;
    search?: string;
  };
  role_requests?: {
    status?: string;
    tenant_id?: string;
    search?: string;
  };
}

/**
 * Tenant Directory Entry
 * Represents a tenant in the system with associated statistics
 * Used by Super Admin tenant directory/management pages
 */
export interface TenantDirectoryEntry {
  tenantId: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  activeUsers: number;
  totalContracts: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ CENTRALIZED SUPER ADMIN MANAGEMENT TYPES (moved from @/modules/features/super-admin/types to prevent circular dependencies)

/**
 * Super Admin DTO
 * Represents a platform-wide super administrator user
 */
export interface SuperAdminDTO {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  tenantId: null; // Must be null for super admin
  isSuperAdmin: true; // Must be true for super admin
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  phone?: string;
  mobile?: string;
}

/**
 * Create Super Admin Input
 * Fields required for creating a new super administrator
 */
export interface CreateSuperAdminInput {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
  phone?: string;
  mobile?: string;
}

/**
 * Promote User to Super Admin Input
 * Fields required for promoting an existing user
 */
export interface PromoteSuperAdminInput {
  userId: string;
  reason?: string;
}

/**
 * Super Admin Tenant Access
 * Represents a super admin's access to a specific tenant
 */
export interface SuperAdminTenantAccess {
  id: string;
  superAdminId: string;
  tenantId: string;
  accessLevel: 'full' | 'read_only' | 'admin';
  grantedAt: string;
  expiresAt?: string | null;
  reason?: string;
}

/**
 * Grant Tenant Access Input
 * Fields required for granting super admin access to a tenant
 */
export interface GrantTenantAccessInput {
  superAdminId: string;
  tenantId: string;
  accessLevel: 'full' | 'read_only' | 'admin';
  expiresAt?: string;
  reason?: string;
}

/**
 * Revoke Tenant Access Input
 * Fields required for revoking super admin access
 */
export interface RevokeTenantAccessInput {
  superAdminId: string;
  tenantId: string;
  reason?: string;
}

/**
 * Super Admin Stats
 * Analytics for super admin operations
 */
export interface SuperAdminStatsDTO {
  totalSuperAdmins: number;
  activeSuperAdmins: number;
  inactiveSuperAdmins: number;
  totalTenantAccesses: number;
  activeTenantAccesses: number;
  tenantsWithAccess: number;
  lastUpdated: string;
}

/**
 * Super Admin Action Log
 * Audit log entry for super admin actions
 */
export interface SuperAdminActionLog {
  id: string;
  superAdminId: string;
  action: string;
  targetId: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Super Admin Management Service Interface
 * Defines all operations for super admin management
 */
export interface ISuperAdminManagementService {
  createSuperAdmin(data: CreateSuperAdminInput): Promise<SuperAdminDTO>;
  getSuperAdmins(): Promise<SuperAdminDTO[]>;
  getSuperAdminById(id: string): Promise<SuperAdminDTO>;
  updateSuperAdmin(id: string, data: Partial<CreateSuperAdminInput>): Promise<SuperAdminDTO>;
  deleteSuperAdmin(id: string): Promise<void>;
  promoteSuperAdmin(data: PromoteSuperAdminInput): Promise<SuperAdminDTO>;
  demoteSuperAdmin(userId: string, reason?: string): Promise<void>;
  
  grantTenantAccess(data: GrantTenantAccessInput): Promise<SuperAdminTenantAccess>;
  revokeTenantAccess(data: RevokeTenantAccessInput): Promise<void>;
  getTenantAccess(superAdminId: string): Promise<SuperAdminTenantAccess[]>;
  
  getStats(): Promise<SuperAdminStatsDTO>;
  getActionLog(filters?: Record<string, any>): Promise<SuperAdminActionLog[]>;
  logAction(action: string, targetId: string, details?: Record<string, any>): Promise<SuperAdminActionLog>;
}