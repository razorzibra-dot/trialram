/**
 * Multi-Tenant Service
 * Manages tenant context and data isolation
 * ENTERPRISE: Now uses centralized SessionService to avoid duplicate API calls
 */

import { supabase as supabaseClient } from '@/services/supabase/client';
import { sessionService } from '@/services/session/SessionService';

interface TenantContext {
  tenantId: string | null;
  tenantName?: string;
  userId: string;
  role?: string;
}

interface TenantInfo {
  id: string;
  name: string;
  created_at?: string;
}

class MultiTenantService {
  private currentTenant: TenantContext | null = null;
  private tenantListeners: Set<(tenant: TenantContext | null) => void> = new Set();
  // Prevent duplicate initialization per user (React 18 StrictMode double effects)
  private initPromises: Map<string, Promise<TenantContext | null>> = new Map();

  /**
   * Initialize tenant context from session
   * ⭐ ENTERPRISE: Uses centralized SessionService - ZERO API calls
   * SessionService already loaded user + tenant on login
   */
  async initializeTenantContext(userId: string): Promise<TenantContext | null> {
    // Return in-flight init if already running for this user
    const existing = this.initPromises.get(userId);
    if (existing) return existing;

    const initPromise = (async () => {
      try {
        console.log('[MultiTenantService] Initializing tenant context for user:', userId);

        // ENTERPRISE: Use cached session data (ZERO API calls)
        const user = sessionService.getCurrentUser();
        const tenant = sessionService.getTenant();

        if (!user) {
          console.warn('[MultiTenantService] No user in SessionService - may need to initialize');
          return null;
        }

        // Build tenant context from cached session
        const tenantContext: TenantContext = {
          tenantId: tenant?.id || null,
          tenantName: tenant?.name || (user.isSuperAdmin ? 'Platform Administration' : undefined),
          userId: user.id,
          role: user.role,
        };

        this.setCurrentTenant(tenantContext);
        console.log('[MultiTenantService] ✅ Tenant context initialized from cache:', {
          userId: user.id,
          tenantId: tenant?.id || 'none',
          tenantName: tenantContext.tenantName,
        });
        
        return tenantContext;
      } catch (error) {
        console.error('[MultiTenantService] Error initializing tenant context:', error);
        return this.bootstrapTenantFromLocalUser();
      } finally {
        this.initPromises.delete(userId);
      }
    })();

    this.initPromises.set(userId, initPromise);
    return initPromise;
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
   * ENTERPRISE: Uses SessionService cache (zero API calls)
   */
  getCurrentTenantId(): string {
    // Try SessionService first (zero API calls)
    const tenantId = sessionService.getTenantId();
    if (tenantId) {
      return tenantId;
    }

    // Fallback to in-memory context
    if (!this.currentTenant) {
      const fallback = this.bootstrapTenantFromLocalUser();
      if (!fallback) {
        throw new Error('Tenant context not initialized');
      }
    }
    
    // Ensure admin can only access their own tenant
    this.enforceAdminTenantIsolation();
    
    return this.currentTenant!.tenantId;
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
      const fallback = this.bootstrapTenantFromLocalUser();
      if (!fallback) {
        throw new Error('Tenant context not initialized');
      }
    }
    return this.currentTenant!.userId;
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
  async getUserTenants(): Promise<TenantInfo[]> {
    // ENTERPRISE RULE: Session data must come from SessionService cache (zero API calls)
    const tenant = sessionService.getTenant();
    const user = sessionService.getCurrentUser();

    if (user?.isSuperAdmin) {
      // Super admins have no tenant scope
      return [];
    }

    if (tenant) {
      return [{ id: tenant.id, name: tenant.name, created_at: undefined }];
    }

    // Fallback to locally bootstrapped context (still no network)
    const fallback = this.bootstrapTenantFromLocalUser();
    if (fallback?.tenantId) {
      return [{ id: fallback.tenantId, name: fallback.tenantName || '', created_at: undefined }];
    }

    console.warn('[MultiTenantService] No tenant found in SessionService cache');
    return [];
  }

  /**
   * Switch to different tenant
   */
  async switchTenant(tenantId: string): Promise<boolean> {
    // ENTERPRISE RULE: No API calls for tenant/user; rely on SessionService cache
    const cachedTenant = sessionService.getTenant();
    const cachedUser = sessionService.getCurrentUser();

    if (!cachedUser) {
      console.warn('[MultiTenantService] Cannot switch tenant - no user in session cache');
      return false;
    }

    if (!cachedTenant) {
      console.warn('[MultiTenantService] Cannot switch tenant - no tenant in session cache');
      return false;
    }

    if (cachedTenant.id !== tenantId) {
      console.warn('[MultiTenantService] Requested tenant not in session cache; skipping network call per enterprise rule');
      return false;
    }

    this.setCurrentTenant({
      tenantId: cachedTenant.id,
      tenantName: cachedTenant.name,
      userId: cachedUser.id,
      role: cachedUser.role,
    });
    return true;
  }

  /**
   * Sync user from auth.users to public.users
   * This method calls the database function that handles the sync logic
   */
  private async syncUserFromAuth(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[MultiTenantService] Starting sync for user:', userId);
      
      // First, verify the user exists in auth.users
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        console.warn('[MultiTenantService] User not found in auth.users:', authError?.message);
        return { success: false, error: 'User not found in auth.users' };
      }

      console.log('[MultiTenantService] User found in auth.users, triggering database sync');
      
      // Call the database function to sync the user
      // The trigger should automatically sync the user when we update their record
      // For now, we'll manually call the function if it exists
      const { data, error } = await supabaseClient.rpc('sync_single_auth_user', {
        target_user_id: userId
      });
      
      if (error) {
        // If the RPC function doesn't exist, try a different approach
        console.warn('[MultiTenantService] RPC function failed, trying alternative sync method:', error.message);
        return await this.manualSyncUserFromAuth(userId);
      }
      
      console.log('[MultiTenantService] Database sync completed:', data);
      return { success: true };
      
    } catch (error) {
      console.error('[MultiTenantService] Error during user sync:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown sync error' };
    }
  }

  /**
   * Manual sync method when the database function approach fails
   */
  private async manualSyncUserFromAuth(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[MultiTenantService] Attempting manual sync for user:', userId);
      
      // Get the user from auth.users directly
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        return { success: false, error: 'User not found in auth.users' };
      }

      const user = authUser.user;
      
      // Determine tenant_id based on email domain
      let tenantId: string | null = null;
      let isSuperAdmin = false;
      
      // Check if user is super admin
      if (user.email?.includes('superadmin') || 
          user.email?.includes('@platform.com') || 
          user.email?.includes('@platform.')) {
        tenantId = null;
        isSuperAdmin = true;
      } else {
        // Map email domain to tenant
        const { data: tenant } = await supabaseClient
          .from('tenants')
          .select('id')
          .or([
            user.email?.includes('@acme.com') || user.email?.includes('@acme.') ? 'name.eq.Acme Corporation' : '',
            user.email?.includes('@techsolutions.com') || user.email?.includes('@techsolutions.') ? 'name.eq.Tech Solutions Inc' : '',
            user.email?.includes('@globaltrading.com') || user.email?.includes('@globaltrading.') ? 'name.eq.Global Trading Ltd' : ''
          ].filter(Boolean).join(','))
          .single();
          
        tenantId = tenant?.id || null;
      }
      
      // Extract user name from metadata or email
      const fullName = user.user_metadata?.name || 
                      user.user_metadata?.display_name || 
                      user.email?.split('@')[0] || 
                      'User';
      
      const firstName = fullName.split(' ')[0];
      const lastName = fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : null;
      
      // Insert or update user in public.users
      const { error: insertError } = await supabaseClient
        .from('users')
        .upsert({
          id: userId,
          email: user.email,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          status: 'active',
          tenant_id: tenantId,
          is_super_admin: isSuperAdmin,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: null
        }, {
          onConflict: 'id'
        });
        
      if (insertError) {
        console.error('[MultiTenantService] Failed to insert user:', insertError);
        return { success: false, error: insertError.message };
      }
      
      console.log('[MultiTenantService] Manual sync successful for user:', userId);
      return { success: true };
      
    } catch (error) {
      console.error('[MultiTenantService] Manual sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Manual sync failed' };
    }
  }

  /**
   * Clear tenant context (on logout)
   */
  clearTenantContext(): void {
    this.setCurrentTenant(null);
  }

  /**
   * Bootstrap tenant context from locally stored user (Auth service)
   * Used when database lookup fails but session data exists
   */
  private bootstrapTenantFromLocalUser(): TenantContext | null {
    try {
      const storedUser = localStorage.getItem('crm_user');
      if (!storedUser) return null;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser?.id) return null;

      const tenantContext: TenantContext = {
        tenantId: typeof parsedUser.tenantId === 'string' || parsedUser.tenantId === null
          ? parsedUser.tenantId
          : null,
        tenantName: parsedUser.tenantName,
        userId: parsedUser.id,
        role: parsedUser.role,
      };

      this.setCurrentTenant(tenantContext);
      console.log('[MultiTenantService] Tenant context bootstrapped from local session');
      return tenantContext;
    } catch (error) {
      console.warn('[MultiTenantService] Failed to bootstrap tenant from local storage:', error);
      return null;
    }
  }
}

// Export singleton instance
export const multiTenantService = new MultiTenantService();

// Export type
export type { TenantContext };