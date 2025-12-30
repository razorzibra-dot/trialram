/**
 * ENTERPRISE SESSION SERVICE
 * ============================================================================
 * Centralized session management to eliminate redundant API calls
 * 
 * DESIGN PRINCIPLES:
 * 1. Single Source of Truth - All user/tenant data cached in one place
 * 2. Load Once - Fetch user + tenant ONLY on login
 * 3. Memory + Storage - Dual cache (memory for speed, storage for persistence)
 * 4. Zero API Calls - Services read from cache, never hit API for session data
 * 5. Invalidate on Logout - Clear all caches
 * 
 * ENTERPRISE BENEFITS:
 * - Eliminates duplicate user/tenant API calls
 * - Faster app performance (no network latency)
 * - Consistent data across services
 * - Survives page refresh without API calls
 * - Reduced database load
 * 
 * USAGE:
 * ```typescript
 * // On login: Load once
 * await sessionService.initializeSession(userId);
 * 
 * // Anywhere in app: Read from cache (zero API calls)
 * const user = sessionService.getCurrentUser();
 * const tenantId = sessionService.getTenantId();
 * 
 * // On logout: Clear everything
 * sessionService.clearSession();
 * ```
 */

import { supabase } from '@/services/supabase/client';
import { User } from '@/types/auth';

interface TenantInfo {
  id: string;
  name: string;
  status?: string;
}

interface SessionData {
  user: User;
  tenant: TenantInfo | null;
  loadedAt: number;
}

class SessionService {
  private static instance: SessionService;
  private sessionCache: SessionData | null = null;
  private readonly STORAGE_KEY = 'crm_session_cache';
  private readonly CACHE_VERSION = 'v1';

  private constructor() {
    // Private constructor for singleton
    this.loadFromStorage();
  }

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * ENTERPRISE: Initialize session - Load user + tenant ONCE on login
   * This replaces multiple scattered API calls across services
   */
  async initializeSession(userId: string): Promise<SessionData> {
    console.log('[SessionService] 🚀 Initializing session for user:', userId);

    try {
      // SINGLE API CALL for user data (with role relationship)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          first_name,
          last_name,
          avatar_url,
          phone,
          department,
          position,
          status,
          tenant_id,
          is_super_admin,
          preferences,
          metadata,
          last_login,
          created_at,
          updated_at,
          user_roles:user_roles!user_roles_user_id_fkey(
            role:roles!user_roles_role_id_fkey(
              name
            )
          )
        `)
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (userError || !userData) {
        console.error('[SessionService] ❌ Failed to load user:', userError);
        throw new Error('Failed to load user data');
      }

      // Extract role from relationship
      const roleName = userData.user_roles?.[0]?.role?.name || 'user';
      
      // Map to User type
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: roleName as any,
        status: userData.status,
        tenantId: userData.tenant_id,
        avatarUrl: userData.avatar_url,
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        isSuperAdmin: userData.is_super_admin,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        lastLogin: userData.last_login,
      };

      let tenant: TenantInfo | null = null;

      // SINGLE API CALL for tenant data (only if user has tenant)
      if (user.tenantId && !user.isSuperAdmin) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, status')
          .eq('id', user.tenantId)
          .single();

        if (!tenantError && tenantData) {
          tenant = {
            id: tenantData.id,
            name: tenantData.name,
            status: tenantData.status,
          };
        } else {
          console.warn('[SessionService] ⚠️ Tenant not found for user');
        }
      } else if (user.isSuperAdmin) {
        // Super admins have no tenant
        tenant = null;
        console.log('[SessionService] 👑 Super admin - no tenant context');
      }

      const sessionData: SessionData = {
        user,
        tenant,
        loadedAt: Date.now(),
      };

      // Cache in memory + storage
      this.sessionCache = sessionData;
      this.saveToStorage(sessionData);

      console.log('[SessionService] ✅ Session initialized:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant?.id || 'none',
        tenantName: tenant?.name || 'Platform Administration',
      });

      return sessionData;
    } catch (error) {
      console.error('[SessionService] ❌ Session initialization failed:', error);
      throw error;
    }
  }

  /**
   * ENTERPRISE: Get current user from cache (ZERO API calls)
   * Services use this instead of making API calls
   */
  getCurrentUser(): User | null {
    if (!this.sessionCache) {
      // Try to load from storage first
      this.loadFromStorage();
    }
    return this.sessionCache?.user || null;
  }

  /**
   * ENTERPRISE: Get tenant ID from cache (ZERO API calls)
   * Services use this instead of making API calls
   */
  getTenantId(): string | null {
    return this.sessionCache?.tenant?.id || null;
  }

  /**
   * ENTERPRISE: Get tenant info from cache (ZERO API calls)
   */
  getTenant(): TenantInfo | null {
    return this.sessionCache?.tenant || null;
  }

  /**
   * ENTERPRISE: Check if session is initialized
   */
  isSessionLoaded(): boolean {
    return this.sessionCache !== null;
  }

  /**
   * ENTERPRISE: Clear session on logout
   * Removes all cached data
   */
  clearSession(): void {
    console.log('[SessionService] 🧹 Clearing session');
    this.sessionCache = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('crm_user'); // Clear legacy storage
  }

  /**
   * ENTERPRISE: Refresh session data (e.g., after profile update)
   * Re-fetches user + tenant from database
   */
  async refreshSession(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.warn('[SessionService] ⚠️ Cannot refresh - no active session');
      return;
    }
    await this.initializeSession(currentUser.id);
  }

  /**
   * Private: Load session from sessionStorage (survives page refresh)
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.CACHE_VERSION) {
          this.sessionCache = parsed.data;
          console.log('[SessionService] 📦 Loaded session from storage');
        }
      }
    } catch (error) {
      console.warn('[SessionService] ⚠️ Failed to load from storage:', error);
    }
  }

  /**
   * Private: Save session to sessionStorage
   */
  private saveToStorage(data: SessionData): void {
    try {
      const payload = {
        version: this.CACHE_VERSION,
        data,
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('[SessionService] ⚠️ Failed to save to storage:', error);
    }
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();
