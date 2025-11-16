/**
 * Multi-Tenant Service
 * Manages tenant context and data isolation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface TenantContext {
  tenantId: string;
  tenantName?: string;
  userId: string;
  role?: string;
}

class MultiTenantService {
  private currentTenant: TenantContext | null = null;
  private tenantListeners: Set<(tenant: TenantContext | null) => void> = new Set();

  /**
   * Initialize tenant context from session
   * ⭐ CRITICAL: Handles both tenant users and super admins (tenantId=null)
   */
  async initializeTenantContext(userId: string): Promise<TenantContext | null> {
    try {
      // Get user's basic info (avoid relationship queries due to RLS)
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('id, tenant_id')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw userError;
      }

      if (!user) {
        console.warn('[MultiTenantService] User not found');
        return null;
      }

      // Check if user is a super admin by querying user_roles
      const { data: userRoles, error: roleError } = await supabaseClient
        .from('user_roles')
        .select(`
          roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('roles.name', 'super_admin');

      const isSuperAdmin = !roleError && userRoles && userRoles.length > 0;

      // ⭐ CRITICAL: Check if user is a super admin (tenant_id = null or has super_admin role)
      if (user.tenant_id === null || isSuperAdmin) {
        console.log('[MultiTenantService] Super admin detected - skipping tenant fetch');

        const tenantContext: TenantContext = {
          tenantId: null as any, // Super admins have no tenant
          tenantName: 'Platform Administration',
          userId,
          role: isSuperAdmin ? 'super_admin' : undefined,
        };

        this.setCurrentTenant(tenantContext);
        return tenantContext;
      }

      // Validate tenant_id for regular users
      if (!user.tenant_id || user.tenant_id === 'undefined' || user.tenant_id === null) {
        console.warn('[MultiTenantService] Invalid tenant_id for user:', user.tenant_id);
        return null;
      }

      // Fetch tenant info separately for regular tenant users
      let tenantName: string | undefined;
      try {
        const { data: tenant } = await supabaseClient
          .from('tenants')
          .select('id, name')
          .eq('id', user.tenant_id)
          .single();

        tenantName = tenant?.name;
      } catch (tenantError) {
        console.warn('[MultiTenantService] Could not fetch tenant details:', tenantError);
        // If tenant doesn't exist, return null
        return null;
      }

      const tenantContext: TenantContext = {
        tenantId: user.tenant_id,
        tenantName,
        userId,
        role: undefined, // Role will be determined by hasRole method when needed
      };

      this.setCurrentTenant(tenantContext);
      return tenantContext;
    } catch (error) {
      console.error('[MultiTenantService] Error initializing tenant context:', error);
      return null;
    }
  }

  /**
   * Set current tenant context
   */
  setCurrentTenant(tenant: TenantContext | null): void {
    this.currentTenant = tenant;
    this.notifyListeners();
  }

  /**
   * Get current tenant ID (enforces tenant isolation for admins)
   */
  getCurrentTenantId(): string {
    if (!this.currentTenant) {
      throw new Error('Tenant context not initialized');
    }
    
    // Ensure admin can only access their own tenant
    this.enforceAdminTenantIsolation();
    
    return this.currentTenant.tenantId;
  }

  /**
   * Enforce tenant isolation for admin users
   * Admins should only see data from their own tenant, not all tenants
   */
  private enforceAdminTenantIsolation(): void {
    if (!this.currentTenant) return;

    // Get tenant ID from localStorage (set during login)
    try {
      const storedTenantId = localStorage.getItem('sb_tenant_id');
      const currentTenantId = this.currentTenant.tenantId;

      // If tenant IDs don't match, something is wrong - clear tenant context
      if (storedTenantId && storedTenantId !== currentTenantId) {
        console.warn(
          `[SECURITY] Tenant mismatch detected: stored=${storedTenantId}, current=${currentTenantId}. Enforcing isolation.`
        );
        // Keep the stored tenant ID (which came from user's record)
        this.currentTenant.tenantId = storedTenantId;
      }
    } catch (error) {
      console.error('Error enforcing tenant isolation:', error);
    }
  }

  /**
   * Get current tenant (enforces tenant isolation for admins)
   */
  getCurrentTenant(): TenantContext | null {
    if (this.currentTenant) {
      this.enforceAdminTenantIsolation();
    }
    return this.currentTenant;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    if (!this.currentTenant) {
      throw new Error('Tenant context not initialized');
    }
    return this.currentTenant.userId;
  }

  /**
   * Check if user has specific role
   * Note: This is a simplified check based on tenant context.
   * For full RBAC, use authService.hasRole() instead.
   */
  hasRole(requiredRole: string): boolean {
    if (!this.currentTenant) {
      return false;
    }

    // For super admin check, we can determine from tenant context
    if (requiredRole === 'super_admin') {
      return this.currentTenant.tenantId === null;
    }

    // For other roles, we would need to query user_roles table
    // But since this is used synchronously in many places, we return false for now
    // The main role checking should be done via authService.hasRole()
    return false;
  }

  /**
   * Subscribe to tenant changes
   */
  subscribe(callback: (tenant: TenantContext | null) => void): () => void {
    this.tenantListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.tenantListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of tenant change
   */
  private notifyListeners(): void {
    this.tenantListeners.forEach(callback => {
      callback(this.currentTenant);
    });
  }

  /**
   * Get all tenants for current user
   */
  async getUserTenants(): Promise<any[]> {
    try {
      const currentUserId = this.getCurrentUserId();
      
      // Get user's tenant_id
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('tenant_id')
        .eq('id', currentUserId)
        .single();

      if (userError) throw userError;
      if (!user?.tenant_id) return [];

      // Fetch tenant details
      const { data: tenant, error: tenantError } = await supabaseClient
        .from('tenants')
        .select('id, name, created_at')
        .eq('id', user.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      return tenant ? [tenant] : [];
    } catch (error) {
      console.error('Error fetching user tenants:', error);
      return [];
    }
  }

  /**
   * Switch to different tenant
   */
  async switchTenant(tenantId: string): Promise<boolean> {
    try {
      // Verify user has access to this tenant
      const currentUserId = this.currentTenant?.userId;
      if (!currentUserId) {
        console.warn('No current user context');
        return false;
      }

      // Verify user has access to this tenant (basic check)
      const { data: user, error } = await supabaseClient
        .from('users')
        .select('id, tenant_id')
        .eq('id', currentUserId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!user) {
        console.warn('User does not have access to this tenant');
        return false;
      }

      // Fetch tenant info separately
      let tenantName: string | undefined;
      try {
        const { data: tenant } = await supabaseClient
          .from('tenants')
          .select('id, name')
          .eq('id', tenantId)
          .single();
        
        tenantName = tenant?.name;
      } catch (tenantError) {
        console.warn('Could not fetch tenant details:', tenantError);
      }

      const tenantContext: TenantContext = {
        tenantId: user.tenant_id,
        tenantName,
        userId: currentUserId,
        role: undefined, // Role will be determined by hasRole method when needed
      };

      this.setCurrentTenant(tenantContext);
      return true;
    } catch (error) {
      console.error('Error switching tenant:', error);
      return false;
    }
  }

  /**
   * Clear tenant context (on logout)
   */
  clearTenantContext(): void {
    this.setCurrentTenant(null);
  }
}

// Export singleton instance
export const multiTenantService = new MultiTenantService();

// Export type
export type { TenantContext };