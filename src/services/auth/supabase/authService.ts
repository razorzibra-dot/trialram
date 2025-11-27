/**
 * Supabase Authentication Service
 * Follows strict 8-layer architecture:
 * 1. DATABASE: snake_case columns with constraints
 * 2. TYPES: camelCase interface matching DB exactly
 * 3. MOCK SERVICE: same fields + validation as DB
 * 4. SUPABASE SERVICE: SELECT with column mapping (snake → camel)
 * 5. FACTORY: route to correct backend
 * 6. MODULE SERVICE: use factory (never direct imports)
 * 7. HOOKS: loading/error/data states + cache invalidation
 * 8. UI: form fields = DB columns + tooltips documenting constraints
 */

import { supabase } from '@/services/supabase/client';
import backendConfig, { isSupabaseConfigured } from '@/config/backendConfig';
import { User, LoginCredentials, AuthResponse } from '@/types/auth';

class SupabaseAuthService {
  private tokenKey = 'crm_auth_token';
  private userKey = 'crm_user';
  private sessionKey = 'supabase_session';

  /**
   * Authenticate user with email/password
   * Uses mock-style authentication (Supabase auth is currently broken)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[SUPABASE_AUTH] Starting login for:', credentials.email);

      // If global backend mode is set to Supabase and client is configured, try real Supabase auth first
      if (backendConfig.mode === 'supabase' && isSupabaseConfigured()) {
        console.log('[SUPABASE_AUTH] Attempting real Supabase authentication');
        // Supabase JS v2: signInWithPassword
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (signInError || !signInData?.session) {
          // If credentials invalid, throw so caller can handle
          const errMsg = signInError?.message || 'Invalid credentials';
          console.error('[SUPABASE_AUTH] Supabase sign-in failed:', errMsg);
          throw new Error(errMsg);
        }

        // Grab user id returned by Supabase session
        const supaUser = signInData.user;
        
        // Fetch user from public.users and role_id separately to avoid RLS policy recursion
        const { data: appUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaUser.id)
          .single();
        
        // Get user's role assignment (separate query to avoid RLS issues)
        let userRole: { id: string; name: string } | null = null;
        if (appUser && !userError) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role_id, roles(id, name)')
            .eq('user_id', supaUser.id)
            .limit(1);
          if (roleData && roleData.length > 0) {
            userRole = roleData[0].roles as any;
          }
        }

        if (userError || !appUser) {
          console.warn('[SUPABASE_AUTH] Authenticated but app user not found in public.users:', userError?.message || 'no public user');
          // Return a minimal auth response using supabase user info
          const minimalAppUser = {
            id: supaUser.id,
            email: supaUser.email,
            name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0],
            first_name: '',
            last_name: '',
            role: 'agent',
            status: 'active',
            tenant_id: null,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };
          return this.createAuthResponse(minimalAppUser, signInData.session.access_token, signInData.session.expires_in || 3600);
        }

        // Resolve role from user_roles relationship if present (ensure appUser.role is populated)
        try {
          if (userRole) {
            const roleName = userRole.name;
            const roleMap: Record<string, string> = {
              'super_admin': 'super_admin',
              'Administrator': 'admin',
              'Manager': 'manager',
              'User': 'agent',
              'Engineer': 'engineer',
              'Customer': 'customer'
            };
            const resolved = roleMap[roleName] || appUser.role || 'agent';
            // normalize into same shape createAuthResponse expects
            (appUser as any).role = resolved;

            // Attempt to fetch role permissions dynamically from DB (role_permissions -> permissions)
            try {
              const roleId = userRole.id;
              if (roleId) {
                const { data: rolePerms, error: rpErr } = await supabase
                  .from('role_permissions')
                  .select('permission_id')
                  .eq('role_id', roleId);

                if (!rpErr && Array.isArray(rolePerms)) {
                  // Get permission names/IDs
                  const permIds = rolePerms.map((r: any) => r.permission_id).filter(Boolean);
                  
                  // Fetch permission details if we need names
                  if (permIds.length > 0) {
                    const { data: perms } = await supabase
                      .from('permissions')
                      .select('id, name')
                      .in('id', permIds);
                    
                    if (perms) {
                      const permNames = perms.map((p: any) => p.name).filter(Boolean);
                      (appUser as any).permissions = permNames;
                      console.log('[SUPABASE_AUTH] Fetched role permissions:', permNames);
                    }
                  }
                } else {
                  console.warn('[SUPABASE_AUTH] Could not fetch role_permissions for role', roleId, rpErr?.message);
                }
              }
            } catch (e) {
              console.warn('[SUPABASE_AUTH] Error fetching role permissions', e);
            }
          }
        } catch (e) {
          console.warn('[SUPABASE_AUTH] Failed to resolve role from user_roles relationship', e);
        }

        // Return auth response for the app user (role and permissions should now be set)
        return this.createAuthResponse(appUser, signInData.session.access_token, signInData.session.expires_in || 3600);
      }

      console.log('[SUPABASE_AUTH] Using mock-style authentication (Supabase auth skipped)');

      // Validate credentials against seeded users (same as mock service)
      const seededUsers = [
        { email: 'admin@acme.com', role: 'admin', tenantId: '550e8400-e29b-41d4-a716-446655440001' },
        { email: 'manager@acme.com', role: 'manager', tenantId: '550e8400-e29b-41d4-a716-446655440001' },
        { email: 'engineer@acme.com', role: 'engineer', tenantId: '550e8400-e29b-41d4-a716-446655440001' },
        { email: 'user@acme.com', role: 'agent', tenantId: '550e8400-e29b-41d4-a716-446655440001' },
        { email: 'admin@techsolutions.com', role: 'admin', tenantId: '550e8400-e29b-41d4-a716-446655440002' },
        { email: 'manager@techsolutions.com', role: 'manager', tenantId: '550e8400-e29b-41d4-a716-446655440002' },
        { email: 'admin@globaltrading.com', role: 'admin', tenantId: '550e8400-e29b-41d4-a716-446655440003' },
        { email: 'superadmin@platform.com', role: 'super_admin', tenantId: null },
        { email: 'superadmin2@platform.com', role: 'super_admin', tenantId: null },
        { email: 'superadmin3@platform.com', role: 'super_admin', tenantId: null }
      ];

      const userData = seededUsers.find(u => u.email === credentials.email);
      if (!userData || credentials.password !== 'password123') {
        throw new Error('Invalid credentials');
      }

      console.log('[SUPABASE_AUTH] Mock auth successful for:', userData.email);

      // Generate a proper UUID for the mock user
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Create mock user object (same structure as database)
      const mockUser = {
        id: generateUUID(),
        email: userData.email,
        name: userData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        first_name: userData.email.split('@')[0].split('.')[0] || '',
        last_name: userData.email.split('@')[0].split('.')[1] || '',
        role: userData.role,
        status: 'active',
        tenant_id: userData.tenantId,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      // Create mock JWT token
      const mockToken = `mock_jwt_${mockUser.id}_${Date.now()}`;
      const expiresIn = 3600;

      return this.createAuthResponse(mockUser, mockToken, expiresIn);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      console.error('[SUPABASE_AUTH] Login failed:', message);
      throw new Error(message);
    }
  }

  /**
   * Create standardized auth response (used by both Supabase and mock auth)
   */
  private createAuthResponse(appUser: any, token: string, expiresIn: number): AuthResponse {
    // Convert to app User type (snake_case → camelCase mapping)
    const isSuperAdmin = appUser.role === 'super_admin' && appUser.tenant_id === null;

    const user: User = {
      id: appUser.id,
      email: appUser.email,
      name: appUser.name || `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
      firstName: appUser.first_name || '',
      lastName: appUser.last_name || '',
      role: appUser.role,
      status: (appUser.status || 'active') as User['status'],
      tenantId: appUser.tenant_id,
      createdAt: appUser.created_at,
      lastLogin: new Date().toISOString(),
      isSuperAdmin,
      isSuperAdminMode: false,
      impersonatedAsUserId: undefined,
      impersonationLogId: undefined,
      permissions: (appUser as any).permissions || [],
    };

    // Create mock session for consistency
    const mockSession = {
      access_token: token,
      refresh_token: `refresh_${appUser.id}_${Date.now()}`,
      expires_in: expiresIn,
      user: {
        id: appUser.id,
        email: appUser.email
      }
    };

    // Store session and user
    localStorage.setItem(this.sessionKey, JSON.stringify(mockSession));
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    console.log('[SUPABASE_AUTH] Login successful, session stored');

    return {
      user,
      token,
      expires_in: expiresIn
    };
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase logout error:', err);
    }

    // Clear local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.sessionKey);
  }

  async restoreSession(): Promise<User | null> {
    try {
      // Check if session exists in localStorage
      const sessionStr = localStorage.getItem(this.sessionKey);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        await supabase.auth.setSession(session);
      }

      // Get current Supabase session
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return null;
      }

      // Get user from app database (without relationships to avoid RLS recursion)
      const { data: appUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError || !appUser) {
        console.error('[SUPABASE_AUTH] User not found in database:', userError);
        return null;
      }

      // Get user's role assignment separately
      let userRole: User['role'] = 'agent'; // default
      let roleId: string | null = null;
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role_id, roles(id, name)')
        .eq('user_id', data.session.user.id)
        .limit(1);
      
      if (roleData && roleData.length > 0) {
        const role = roleData[0].roles as any;
        roleId = role?.id;
        const roleName = role?.name;
        
        if (roleName) {
          // Map role names from database to User role enum
          const roleMap: Record<string, User['role']> = {
            'super_admin': 'super_admin',
            'Administrator': 'admin',
            'Manager': 'manager',
            'User': 'agent',
            'Engineer': 'engineer',
            'Customer': 'customer'
          };
          userRole = roleMap[roleName] || 'agent';
        }
      } else if (appUser.is_super_admin) {
        // Fallback to is_super_admin flag if no role found
        userRole = 'super_admin';
      }

      // Fetch permissions for resolved role (if present)
      try {
        if (roleId) {
          const { data: rolePerms, error: rpErr } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', roleId);

          if (!rpErr && Array.isArray(rolePerms)) {
            const permIds = rolePerms.map((r: any) => r.permission_id).filter(Boolean);
            
            // Fetch permission names
            if (permIds.length > 0) {
              const { data: perms } = await supabase
                .from('permissions')
                .select('id, name')
                .in('id', permIds);
              
              if (perms) {
                const permNames = perms.map((p: any) => p.name).filter(Boolean);
                (appUser as any).permissions = permNames;
              }
            }
          } else {
            console.warn('[SUPABASE_AUTH] Could not fetch role_permissions for role', roleId, rpErr?.message);
          }
        }
      } catch (e) {
        console.warn('[SUPABASE_AUTH] Error fetching role permissions during session restore', e);
      }

      // Convert to app User type (snake_case → camelCase mapping)
      const isSuperAdmin = (appUser.is_super_admin === true) || (userRole === 'super_admin' && appUser.tenant_id === null);

      const user: User = {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name || `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
        firstName: appUser.first_name || '',
        lastName: appUser.last_name || '',
        role: userRole,
        status: (appUser.status || 'active') as User['status'],
        tenantId: appUser.tenant_id,
        createdAt: appUser.created_at,
        lastLogin: appUser.last_login,
        isSuperAdmin,
        isSuperAdminMode: false,
        impersonatedAsUserId: undefined,
        impersonationLogId: undefined,
        permissions: (appUser as any).permissions || [],
      };

      localStorage.setItem(this.userKey, JSON.stringify(user));
      return user;
    } catch (err) {
      console.error('Session restore error:', err);
      return null;
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      console.log('[getCurrentUser] User:', { id: user.id, email: user.email, role: user.role, name: user.name });
    }
    return user;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has access to all roles
    if (user.role === 'super_admin') return true;

    return user.role === role;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      console.warn('[hasPermission] No user found');
      return false;
    }

    // Explicit check for "super_admin" pseudo-permission (used by legacy guards)
    if (permission === 'super_admin') {
      return user.role === 'super_admin';
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      console.log('[hasPermission] User is super_admin, granting all permissions');
      return true;
    }

    // Use dynamically-loaded permissions attached to user (derived from DB role_permissions)
    const userPermissions = (user.permissions && Array.isArray(user.permissions)) ? user.permissions : [];
    console.log(`[hasPermission] Checking permission "${permission}" for user role "${user.role}". User permissions:`, userPermissions);

    // Direct match
    if (userPermissions.includes(permission)) {
      console.log(`[hasPermission] Direct match found for "${permission}"`);
      return true;
    }

    // Handle resource/action combinations and synonyms
    if (permission.includes(':')) {
      const [resource, action] = permission.split(':');
      const hasResourceManage = userPermissions.some(
        p => p === `${resource}:manage` || p === `${resource}:admin`
      );
      if (hasResourceManage) {
        console.log(`[hasPermission] Granting via '${resource}:manage' super permission`);
        return true;
      }

      if (action === 'read' && userPermissions.includes(`${resource}:view`)) {
        console.log(`[hasPermission] Granting via ':view' synonym for resource "${resource}"`);
        return true;
      }
      if (action === 'view' && userPermissions.includes(`${resource}:read`)) {
        console.log(`[hasPermission] Granting via ':read' synonym for resource "${resource}"`);
        return true;
      }
    }

    // Support legacy/manage_* checks: 'manage_users' -> any permission that starts with 'users:'
    if (permission.startsWith('manage_')) {
      const resource = permission.replace(/^manage_/, '');
      if (userPermissions.some((p) => p.startsWith(`${resource}:`))) {
        console.log(`[hasPermission] Granting via manage_* fallback for resource "${resource}"`);
        return true;
      }
    }

    // Support short-form checks like 'read', 'write', 'delete' by checking resource-scoped permissions
    if (permission === 'read') {
      if (userPermissions.some((p) => p.endsWith(':read') || p.endsWith(':view') || p === 'read')) return true;
    }
    if (permission === 'write') {
      if (userPermissions.some((p) => p.endsWith(':create') || p.endsWith(':update') || p === 'write')) return true;
    }
    if (permission === 'delete') {
      if (userPermissions.some((p) => p.endsWith(':delete') || p === 'delete')) return true;
    }

    console.warn(`[hasPermission] No matching permission found for "${permission}". User role: "${user.role}", User permissions: ${JSON.stringify(userPermissions)}`);
    return false;
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin';
  }

  canAccessSuperAdminPortal(): boolean {
    return this.isSuperAdmin();
  }

  canAccessTenantPortal(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin can access any tenant portal
    if (user.role === 'super_admin') return true;

    // Other roles can access their own tenant portal
    return ['admin', 'manager', 'agent', 'engineer', 'customer'].includes(user.role);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  getUserTenant() {
    const user = this.getCurrentUser();
    if (!user) return null;

    // This would need tenant data from database - simplified for now
    return null;
  }

  getUserPermissions(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    // Return dynamic permissions attached to the stored user (derived from DB role_permissions)
    return Array.isArray((user as any).permissions) ? (user as any).permissions : [];
  }

  getAvailableRoles(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    if (user.role === 'super_admin') {
      return ['admin', 'manager', 'agent', 'engineer', 'customer'];
    }

    if (user.role === 'admin') {
      return ['manager', 'agent', 'engineer', 'customer'];
    }

    if (user.role === 'manager') {
      return ['agent', 'customer'];
    }

    return [];
  }

  async refreshToken(): Promise<string> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user found');

    // For Supabase, we can refresh the session
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      const newToken = data.session?.access_token || '';
      localStorage.setItem(this.tokenKey, newToken);
      return newToken;
    } catch (err) {
      console.error('Token refresh error:', err);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get current tenant ID from user
   * Convenience method for services that need tenant ID
   */
  getCurrentTenantId(): string | null {
    const user = this.getCurrentUser();
    return user?.tenantId || null;
  }

  /**
   * Assert that the current user has access to the specified tenant
   * Throws error if access is denied
   */
  assertTenantAccess(tenantId: string | null): void {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Super admins can access any tenant (including null)
    if (user.role === 'super_admin') {
      return;
    }

    // Regular users can only access their own tenant
    if (user.tenantId !== tenantId) {
      throw new Error('Access denied: Tenant mismatch');
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();