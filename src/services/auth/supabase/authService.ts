/**
 * Supabase Authentication Service
 * Handles user authentication, JWT tokens, role-based access
 * Extends BaseSupabaseService for common database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const getSupabaseClient = () => supabaseClient;

// Simple base service implementation since the import is missing
class BaseSupabaseService {
  constructor(private tableName: string, private useTenant: boolean) {}

  log(message: string, data?: any) {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }

  logError(message: string, error: any) {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  subscribeToChanges(options: any, callback: any) {
    // Stub implementation
    return () => {};
  }
}

type QueryOptions = any;
import { User } from '@/types/auth';

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export class SupabaseAuthService extends BaseSupabaseService {
  constructor() {
    super('users', true);
  }

  /**
   * Authenticate user with email/password
   */
  async login(credentials: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const email = credentials.email as string;
      const password = credentials.password as string;
      
      console.log('[SUPABASE_AUTH] Starting login for:', email);

      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[SUPABASE_AUTH] Auth error:', error.message);
        throw error;
      }

      if (!data.session) {
        throw new Error('No session returned from Supabase');
      }

      console.log('[SUPABASE_AUTH] Auth successful, user ID:', data.session.user.id);

      // Fetch user details from users table
      const user = await this.getUserByEmail(email);
      if (!user) throw new Error('User not found in database');

      console.log('[SUPABASE_AUTH] User found:', user.email);

      // Store BOTH the session object and auth data
      const session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        user: data.session.user,
      };

      this.storeAuthData(session, user);

      console.log('[SUPABASE_AUTH] Login successful, session stored');

      return {
        user,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
        },
      };
    } catch (error) {
      console.error('[SUPABASE_AUTH] Login failed:', error);
      this.logError('Login failed', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    userData: {
      firstName: string;
      lastName: string;
      tenantId: string;
      role: 'admin' | 'manager' | 'agent' | 'engineer' | 'customer';
    }
  ): Promise<AuthResponse> {
    try {
      this.log('Registering new user', { email });

      const client = getSupabaseClient();

      // Create auth user
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create user record in database (role will be assigned via user_roles table)
      const { data: user, error: dbError } = await client
        .from('users')
        .insert([
          {
            id: authData.user?.id,
            email,
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            tenant_id: userData.tenantId,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Assign role via user_roles table
      const roleNameMap: Record<string, string> = {
        'admin': 'Administrator',
        'manager': 'Manager',
        'agent': 'User',
        'engineer': 'Engineer',
        'customer': 'Customer'
      };

      const dbRoleName = roleNameMap[userData.role];
      if (dbRoleName) {
        // Get role ID
        const { data: roleData, error: roleError } = await client
          .from('roles')
          .select('id')
          .eq('name', dbRoleName)
          .eq('tenant_id', userData.tenantId)
          .single();

        if (roleData && !roleError) {
          // Assign role
          await client
            .from('user_roles')
            .insert({
              user_id: user.id,
              role_id: roleData.id,
              tenant_id: userData.tenantId,
              assigned_by: user.id, // Self-assigned during registration
              assigned_at: new Date().toISOString()
            });
        } else {
          console.warn(`[SUPABASE_AUTH] Role '${dbRoleName}' not found for tenant ${userData.tenantId} during registration`);
        }
      }

      this.log('User registered successfully', { email });

      return {
        user: this.mapUserResponse(user),
        session: {
          access_token: authData.session?.access_token || '',
          refresh_token: authData.session?.refresh_token || '',
          expires_in: authData.session?.expires_in || 3600,
        },
      };
    } catch (error) {
      this.logError('Registration failed', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      this.log('Logging out user');

      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();

      if (error) throw error;

      // Clear auth data from localStorage
      this.clearAuthData();

      this.log('User logged out successfully');
    } catch (error) {
      this.logError('Logout failed', error);
      throw error;
    }
  }

  /**
   * Get current user (synchronous - from localStorage)
   * Used by AuthContext and other sync code paths
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('sb_current_user');
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * Get current user (async - from Supabase session)
   * More reliable for actual server-side user data
   */
  async getCurrentUserAsync(): Promise<User | null> {
    try {
      const client = getSupabaseClient();
      const { data } = await client.auth.getSession();

      if (!data.session) return null;

      const { data: user, error } = await client
        .from('users')
        .select(`
          id, email, name, first_name, last_name, tenant_id, status, avatar:avatar_url, phone, created_at, updated_at, deleted_at,
          user_roles!user_id(
            role:roles(name)
          )
        `)
        .eq('id', data.session.user.id)
        .single();

      if (error || !user) return null;

      return this.mapUserResponse(user);
    } catch (error) {
      this.logError('Error getting current user', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      this.log('Fetching user by email', { email });

      const { data: users, error } = await getSupabaseClient()
        .from('users')
        .select(`
          id, email, name, first_name, last_name, tenant_id, status, avatar:avatar_url, phone, created_at, updated_at, deleted_at,
          user_roles!user_id(
            role:roles(name)
          )
        `)
        .eq('email', email);

      if (error) throw error;
      if (!users || users.length === 0) return null;

      return this.mapUserResponse(users[0]);
    } catch (error) {
      this.logError('Error fetching user by email', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      this.log('Refreshing authentication token');

      const client = getSupabaseClient();
      const { data, error } = await client.auth.refreshSession();

      if (error) throw error;

      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not found');

      const token = data.session?.access_token || '';
      
      // Store new token
      this.storeAuthData(token, user);

      this.log('Token refreshed successfully');

      return token;
    } catch (error) {
      this.logError('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      this.log('Changing user password');

      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      this.log('Password changed successfully');
    } catch (error) {
      this.logError('Password change failed', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      this.log('Requesting password reset', { email });

      const client = getSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(email);

      if (error) throw error;

      this.log('Password reset email sent');
    } catch (error) {
      this.logError('Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      this.log('Updating user profile', { userId });

      const { data: updated, error } = await getSupabaseClient()
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar_url: updates.avatar,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      this.log('Profile updated successfully', { userId });

      return this.mapUserResponse(updated);
    } catch (error) {
      this.logError('Profile update failed', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options?: QueryOptions): Promise<User[]> {
    try {
      this.log('Fetching all users');

      const { data: users, error } = await getSupabaseClient()
        .from('users')
        .select('id, email, name, first_name, last_name, tenant_id, status, avatar:avatar_url, phone, created_at, updated_at, deleted_at');

      if (error) throw error;

      return (users || []).map((user) => this.mapUserResponse(user));
    } catch (error) {
      this.logError('Error fetching users', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      this.log('Fetching users by role', { role });

      // Map role names to database role names
      const roleNameMap: Record<string, string> = {
        'admin': 'Administrator',
        'manager': 'Manager',
        'agent': 'User',
        'engineer': 'Engineer',
        'customer': 'Customer',
        'super_admin': 'super_admin'
      };

      const dbRoleName = roleNameMap[role] || role;

      const { data: users, error } = await getSupabaseClient()
        .from('users')
        .select(`
          id, email, name, first_name, last_name, tenant_id, status, avatar:avatar_url, phone, created_at, updated_at, deleted_at,
          user_roles!user_id(
            role:roles(name)
          )
        `)
        .eq('user_roles.role.name', dbRoleName);

      if (error) throw error;

      return (users || []).map((user) => this.mapUserResponse(user));
    } catch (error) {
      this.logError('Error fetching users by role', error);
      throw error;
    }
  }

  /**
   * Get users by tenant
   */
  async getUsersByTenant(tenantId: string): Promise<User[]> {
    try {
      this.log('Fetching users by tenant', { tenantId });

      const { data: users, error } = await getSupabaseClient()
        .from('users')
        .select('id, email, name, first_name, last_name, tenant_id, status, avatar:avatar_url, phone, created_at, updated_at, deleted_at')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      return (users || []).map((user) => this.mapUserResponse(user));
    } catch (error) {
      this.logError('Error fetching users by tenant', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      this.log('Deactivating user', { userId });

      const { error } = await getSupabaseClient()
        .from('users')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      this.log('User deactivated successfully', { userId });
    } catch (error) {
      this.logError('User deactivation failed', error);
      throw error;
    }
  }

  /**
   * Get current authentication token (synchronous - from storage)
   */
  getToken(): string | null {
    try {
      // Try to get token from localStorage (set during login)
      const token = localStorage.getItem('sb_access_token');
      return token || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    try {
      const userStr = localStorage.getItem('sb_current_user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr) as User;
      
      // Admin has access to all tenant roles
      if (user.role === 'admin') return true;
      
      return user.role === role;
    } catch {
      return false;
    }
  }


  /**
   * Cache for user permissions (to avoid repeated DB queries)
   */
  private permissionCache: Map<string, Set<string>> = new Map();

  /**
   * Load user permissions from database dynamically
   */
  private async loadUserPermissions(userId: string): Promise<Set<string>> {
    // Check cache first
    if (this.permissionCache.has(userId)) {
      return this.permissionCache.get(userId) || new Set();
    }

    try {
      const client = getSupabaseClient();

      // Get permissions through user_roles -> roles -> role_permissions -> permissions
      const { data: userPermissions } = await client
        .from('user_roles')
        .select(`
          role:roles(
            role_permissions(
              permission:permissions(name)
            )
          )
        `)
        .eq('user_id', userId);

      const permissions = new Set<string>();

      if (userPermissions) {
        userPermissions.forEach((ur: any) => {
          if (ur.role?.role_permissions) {
            ur.role.role_permissions.forEach((rp: any) => {
              if (rp.permission?.name) {
                permissions.add(rp.permission.name);
              }
            });
          }
        });
      }

      // Cache the permissions
      this.permissionCache.set(userId, permissions);

      return permissions;
    } catch (error) {
      this.logError('Error loading user permissions', error);
      return new Set();
    }
  }

  /**
   * Clear permission cache (useful after role changes)
   */
  clearPermissionCache(userId?: string): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }

  /**
   * Check if user has a specific permission (synchronous with fallback)
   * Now uses database-driven RBAC system with fallback to basic role checks
   */
  hasPermission(permission: string): boolean {
    try {
      const userStr = localStorage.getItem('sb_current_user');
      if (!userStr) {
        console.warn('[Supabase hasPermission] No user found');
        return false;
      }

      const user = JSON.parse(userStr) as User;

      // First, try to get permissions from cache/database
      const cachedPermissions = this.permissionCache.get(user.id);
      if (cachedPermissions && cachedPermissions.size > 0) {
        console.log(`[Supabase hasPermission] Using cached permissions for user ${user.id}`);
        return cachedPermissions.has(permission) || cachedPermissions.has('*') || cachedPermissions.has('super_admin');
      }

      // Fallback: Basic role-based permissions when DB permissions not available
      // This ensures the app works during migration period
      const basicRolePermissions: Record<string, string[]> = {
        'super_admin': ['*'], // Super admin has all permissions
        'admin': [
          'read', 'write', 'delete',
          'manage_users', 'manage_roles', 'manage_customers', 'manage_sales',
          'manage_tickets', 'manage_contracts', 'manage_products', 'view_dashboard'
        ],
        'manager': [
          'read', 'write', 'manage_customers', 'manage_sales', 'manage_tickets',
          'manage_contracts', 'manage_products', 'view_dashboard'
        ],
        'user': [
          'read', 'write', 'manage_customers', 'manage_tickets', 'view_dashboard'
        ],
        'engineer': [
          'read', 'write', 'manage_products', 'manage_tickets', 'view_dashboard'
        ],
        'customer': [
          'read', 'view_dashboard'
        ]
      };

      // For backward compatibility, map old role names to new permission checks
      const userPermissions = basicRolePermissions[user.role] || [];
      console.log(`[Supabase hasPermission] Using fallback permissions for role "${user.role}":`, userPermissions);

      // Check for wildcard permission
      if (userPermissions.includes('*')) {
        return true;
      }

      // Direct permission match
      if (userPermissions.includes(permission)) {
        return true;
      }

      // Handle resource-specific permission format (e.g., "customers:read")
      const separator = permission.includes(':') ? ':' : '.';
      const [resource, action] = permission.split(separator);

      if (resource && action) {
        const actionPermissionMap: Record<string, string> = {
          'read': 'read',
          'create': 'write',
          'update': 'write',
          'delete': 'delete',
          'manage': `manage_${resource}`,
          'view': 'read',
          'edit': 'write'
        };

        const mappedPermission = actionPermissionMap[action];
        if (mappedPermission && userPermissions.includes(mappedPermission)) {
          return true;
        }

        // Check resource-specific manage permission
        const managePermission = `manage_${resource}`;
        if (userPermissions.includes(managePermission)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[Supabase hasPermission] Error:', error);
      return false;
    }
  }

  /**
   * Check if user has permission (async version - loads from database)
   * Use this for critical permission checks that need real-time accuracy
   */
  async hasPermissionAsync(permission: string): Promise<boolean> {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;


      // Load permissions from database
      const permissions = await this.loadUserPermissions(user.id);
      return permissions.has(permission) || permissions.has('*');
    } catch (error) {
      this.logError('Error checking permission (async)', error);
      // Fallback to synchronous check
      return this.hasPermission(permission);
    }
  }

  /**
   * Get all permissions for current user (from database)
   */
  async getCurrentUserPermissions(): Promise<string[]> {
    try {
      const user = this.getCurrentUser();
      if (!user) return [];

      const permissions = await this.loadUserPermissions(user.id);
      return Array.from(permissions);
    } catch (error) {
      this.logError('Error getting user permissions', error);
      return [];
    }
  }

  /**
   * Store token and user in localStorage (called after successful login)
   * Also includes tenant_id for RLS enforcement
   */
  private storeAuthData(session: any, user: User): void {
    try {
      // Store session for Supabase auth restoration
      localStorage.setItem('supabase_session', JSON.stringify(session));
      
      // Store individual tokens and user for compatibility
      localStorage.setItem('sb_access_token', session.access_token);
      localStorage.setItem('sb_current_user', JSON.stringify(user));
      localStorage.setItem('crm_auth_token', session.access_token);
      localStorage.setItem('crm_user', JSON.stringify(user));
      
      // Store tenant_id separately for RLS policy enforcement
      if (user.tenantId) {
        localStorage.setItem('sb_tenant_id', user.tenantId);
        localStorage.setItem('crm_tenant_id', user.tenantId);
        console.log('[SUPABASE_AUTH] Tenant ID stored:', user.tenantId);
      } else {
        console.warn('[SUPABASE_AUTH] WARNING: No tenantId found in user object!', user);
      }
      
      console.log('[SUPABASE_AUTH] Auth data stored in localStorage');
    } catch (error) {
      this.logError('Failed to store auth data', error);
    }
  }

  /**
    * Get current user's tenant ID (for multi-tenant isolation)
    * ⭐ SECURE: Validates tenant ID integrity and prevents tampering/injection
    */
   getCurrentTenantId(): string | null {
     try {
       const user = this.getCurrentUser();
       const storedTenantId = localStorage.getItem('sb_tenant_id');


       // For regular users, validate stored tenant ID matches user's tenant
       if (user?.tenantId) {
         // ⭐ SECURITY: Validate tenant ID format to prevent injection
         if (!this.isValidTenantId(user.tenantId)) {
           console.error('[SECURITY] Invalid tenant ID format detected:', user.tenantId);
           this.clearAuthData();
           throw new Error('Invalid tenant ID format');
         }

         if (storedTenantId && storedTenantId !== user.tenantId) {
           console.error('[SECURITY] Tenant ID mismatch detected! Stored:', storedTenantId, 'User:', user.tenantId);
           // Clear corrupted data and re-store correct tenant ID
           this.clearAuthData();
           this.storeAuthData({ access_token: this.getToken() || '' }, user);
           return user.tenantId;
         }
         return user.tenantId;
       }

       // Fallback to stored value if user data not available, but validate it
       if (storedTenantId && !this.isValidTenantId(storedTenantId)) {
         console.error('[SECURITY] Invalid stored tenant ID format:', storedTenantId);
         localStorage.removeItem('sb_tenant_id');
         localStorage.removeItem('crm_tenant_id');
         return null;
       }

       return storedTenantId;
     } catch (error) {
       console.error('[SECURITY] Error validating tenant ID:', error);
       return null;
     }
   }

   /**
    * Validate tenant ID format to prevent injection attacks
    * ⭐ SECURITY: Only allows alphanumeric characters, hyphens, and underscores
    */
   private isValidTenantId(tenantId: string): boolean {
     // Allow UUID format, slug format, or numeric IDs
     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
     const slugRegex = /^[a-zA-Z0-9_-]+$/;

     return uuidRegex.test(tenantId) || slugRegex.test(tenantId);
   }

  /**
   * Clear auth data from storage (called during logout)
   */
  private clearAuthData(): void {
    try {
      // Clear all auth storage keys
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_current_user');
      localStorage.removeItem('sb_tenant_id');
      localStorage.removeItem('crm_auth_token');
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_tenant_id');
      
      console.log('[SUPABASE_AUTH] Auth data cleared from localStorage');
    } catch (error) {
      this.logError('Failed to clear auth data', error);
    }
  }

  /**
   * Validate tenant access for current user
   * ⭐ SECURITY: Ensures tenant isolation and prevents cross-tenant access
   */
  validateTenantAccess(targetTenantId: string | null): boolean {
    const currentUser = this.getCurrentUser();
    const currentTenantId = this.getCurrentTenantId();


    // Regular users can only access their own tenant
    return currentTenantId === targetTenantId;
  }

  /**
    * Assert tenant access for current user
    * ⭐ SECURITY: Throws error if tenant access is denied or tenant ID is invalid
    */
   assertTenantAccess(targetTenantId: string | null): void {
     // ⭐ SECURITY: Validate target tenant ID format to prevent injection
     if (targetTenantId && !this.isValidTenantId(targetTenantId)) {
       console.error('[SECURITY] Invalid target tenant ID format:', targetTenantId);
       throw new Error('Access denied: Invalid tenant ID format');
     }

     if (!this.validateTenantAccess(targetTenantId)) {
       const currentUser = this.getCurrentUser();
       const currentTenantId = this.getCurrentTenantId();
       throw new Error(
         `Access denied: User ${currentUser?.email} (tenant: ${currentTenantId}) cannot access tenant ${targetTenantId}`
       );
     }
   }

  /**
   * Map database user response to UI User type
   * Converts snake_case database fields to camelCase
   * ⭐ CRITICAL: Sets isSuperAdmin flag based on role (role='super_admin' only)
   * Now extracts role from user_roles relationship
   */
  private mapUserResponse(dbUser: any): User {
    // Extract role from user_roles (for backward compatibility)
    let role: User['role'] = 'agent';
    if (dbUser.user_roles && dbUser.user_roles.length > 0) {
      const primaryRole = dbUser.user_roles[0]?.role?.name;
      if (primaryRole) {
        // Map role names to User role enum
        const roleMap: Record<string, User['role']> = {
          'Administrator': 'admin',
          'Manager': 'manager',
          'User': 'agent',
          'Engineer': 'engineer',
          'Customer': 'customer',
          'super_admin': 'super_admin'
        };
        role = roleMap[primaryRole] || 'agent';
      }
    } else {
      // Fallback for cases where user_roles is not loaded
      role = (dbUser.role || 'agent') as User['role'];
    }

    const isSuperAdmin = role === 'super_admin';

    // Super admins don't have tenant_id, regular users do
    const tenantId = dbUser.tenantId || dbUser.tenant_id;

    const firstName = dbUser.firstName || dbUser.first_name || '';
    const lastName = dbUser.lastName || dbUser.last_name || '';
    const tenantName = dbUser.tenantName || dbUser.tenant_name || '';
    const lastLogin = dbUser.lastLogin || dbUser.last_login || '';
    const createdAt = dbUser.createdAt || dbUser.created_at || new Date().toISOString();

    console.log('[SUPABASE_AUTH] Mapping user - role:', role, 'isSuperAdmin:', isSuperAdmin, 'tenantId:', tenantId);

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || `${firstName} ${lastName}`.trim() || dbUser.email,
      firstName,
      lastName,
      role,
      status: (dbUser.status || 'active') as User['status'],
      tenantId,
      tenantName,
      lastLogin,
      createdAt,
      avatar: dbUser.avatar_url || dbUser.avatar || '',
      phone: dbUser.phone || '',
      isSuperAdmin,
    };
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();