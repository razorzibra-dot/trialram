/**
 * Supabase Database Row Types
 * Centralized types for database row structures from Supabase
 */

// User DB types
export interface UserRow {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user' | 'engineer' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  tenant_id?: string | null;
  is_super_admin?: boolean;
  avatar_url?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  created_by?: string;
  deleted_at?: string;
  // MFA fields
  mfa_secret?: string;
  mfa_backup_codes?: unknown[];
  mfa_method?: 'none' | 'totp' | 'sms' | 'email';
  // Session management
  session_token?: string;
  session_expires_at?: string;
  concurrent_sessions_limit?: number;
  // Security audit fields
  failed_login_attempts?: number;
  locked_until?: string;
  last_failed_login?: string;
  password_changed_at?: string;
  last_password_reset?: string;
  security_questions?: unknown[];
  // Password policy
  password_strength_score?: number;
  password_expires_at?: string;
  require_password_change?: boolean;
  // Account lockout
  account_locked?: boolean;
  lock_reason?: string;
  // Security monitoring
  suspicious_activity_count?: number;
  last_suspicious_activity?: string;
  security_alerts_enabled?: boolean;
}

// Super Admin Tenant Access DB types
export interface SuperAdminTenantAccessRow {
  id: string;
  super_admin_id: string;
  tenant_id: string;
  access_level: 'full' | 'read_only' | 'admin';
  granted_at: string;
  expires_at?: string | null;
  reason?: string;
}

// Audit Log DB types
export interface AuditLogRow {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Alert and Compliance DB types
export interface AlertRuleRow {
  id: string;
  tenant_id: string;
  rule_id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  condition: Record<string, unknown>;
  actions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAlertRow {
  id: string;
  tenant_id: string;
  alert_id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_at: string;
  resolved_at?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  details: Record<string, unknown>;
  affected_resources: string[];
}

// Rate Limiting DB types
export interface RateLimitViolationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  endpoint: string;
  timestamp: string;
  ip_address: string;
  request_count: number;
  severity: 'warning' | 'block' | 'critical';
  resolved: boolean;
  resolved_at?: string;
}

export interface ImpersonationSessionRow {
  id: string;
  tenant_id: string;
  session_id: string;
  admin_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  reason: string;
  status: 'active' | 'ended' | 'revoked';
  actions: string[];
}

export interface ImpersonationLimitRow {
  id: string;
  tenant_id: string;
  admin_id: string;
  session_count: number;
  max_sessions: number;
  last_session_time: string;
}

// Auth response types
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

// Query options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface QueryOptions extends PaginationOptions {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

// Company/Tenant types
export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilters {
  name?: string;
  industry?: string;
  size?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// Contract types
export interface ContractFilters {
  customerId?: string;
  status?: string;
  type?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  userId: string;
  userRole: string;
  permissions: string[];
}

// Product types
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// Sales types
export interface SalesFilters {
  customerId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  createdAfter?: string;
  createdBefore?: string;
}

// Ticket types
export interface TicketFilters {
  customerId?: string;
  status?: string;
  priority?: string;
  createdAfter?: string;
  createdBefore?: string;
}