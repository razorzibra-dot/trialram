/**
 * Tenant Context Types
 * Centralized types for multi-tenant context and management
 */

/**
 * Tenant context information for the current user
 * Contains tenant-specific data needed for request isolation and authorization
 */
export interface TenantContext {
  tenantId: string | null; // null for super admins
  tenantName?: string;
  userId: string;
  role?: string;
}

/**
 * Tenant information for directory and management
 */
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant subscription/billing information
 */
export interface TenantSubscription {
  tenantId: string;
  plan: 'free' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'suspended';
  startDate: string;
  endDate?: string;
  features: string[];
}