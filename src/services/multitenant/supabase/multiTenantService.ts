/**
 * Multi-Tenant Service
 * Manages tenant context and data isolation
 */

import { supabase as supabaseClient } from '@/services/supabase/client';

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

  /**
   * Initialize tenant context from session
   * ⭐ CRITICAL: Handles both tenant users, super admins (tenantId=null), and mock users
   */
  async initializeTenantContext(userId: string): Promise<TenantContext | null> {
    try {
      console.log('[MultiTenantService] Initializing tenant context for user:', userId);

      // First try to get user from database
      let { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('id, tenant_id')
        .eq('id', userId)
        .single();

      // If user not found in database, attempt to sync from auth.users
      if (userError && (userError.code === 'PGRST116' || userError.code === 'PGRST301')) { 
        // PGRST116 = no rows found, PGRST301 = not found
        console.log('[MultiTenantService] User not found in public.users - attempting to sync from auth.users');
        
        // Attempt to sync user from auth.users to public.users
        const syncResult = await this.syncUserFromAuth(userId);
        if (syncResult.success) {
          console.log('[MultiTenantService] User sync successful, retrying to fetch user from database');
          // Retry fetching the user after sync
          const retryResult = await supabaseClient
            .from('users')
            .select('id, tenant_id')
            .eq('id', userId)
            .single();
            
          user = retryResult.data;
          userError = retryResult.error;
        } else {
          console.warn('[MultiTenantService] User sync failed:', syncResult.error);
          console.warn('[MultiTenantService] User % not found. Please run the sync migration or execute fix_missing_user.sql', userId);
          
          // Check if this is a mock user by looking at localStorage
          const mockUserStr = localStorage.getItem('crm_user');
          if (mockUserStr) {
            try {
              const mockUser = JSON.parse(mockUserStr);
              if (mockUser.id === userId) {
                console.log('[MultiTenantService] Mock user found in localStorage, creating tenant context');

                // Create tenant context for mock user
                const tenantContext: TenantContext = {
                  tenantId: mockUser.tenantId || '550e8400-e29b-41d4-a716-446655440001', // Default to Acme tenant
                  tenantName: mockUser.tenantId === null ? 'Platform Administration' : 'Mock Tenant',
                  userId,
                  role: mockUser.role,
                };

                this.setCurrentTenant(tenantContext);
                console.log('[MultiTenantService] Mock tenant context initialized successfully');
                return tenantContext;
              }
            } catch (parseError) {
              console.warn('[MultiTenantService] Error parsing mock user data:', parseError);
            }
          }

          console.warn('[MultiTenantService] User not found in database and no mock user context available');
          return null;
        }
      } else if (userError) {
        // Other database error
        throw userError;
      }

      // If user still not found after sync attempt and not a mock user, return null
      if (!user) {
        console.warn('[MultiTenantService] User not found in database after sync attempt');
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
          tenantId: null as string | null, // Super admins have no tenant
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
      return this.bootstrapTenantFromLocalUser();
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