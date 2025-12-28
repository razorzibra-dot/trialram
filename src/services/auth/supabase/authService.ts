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
import { validateTenantAccess } from '@/utils/tenantValidation';
import { doesPermissionGrant, normalizePermissionToken } from '@/utils/permissionMatcher';

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
            .select(`
              role_id,
              roles!user_roles_role_id_fkey(id, name)
            `)
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
            role: 'user',
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
            // ✅ Database role names are normalized to match UserRole enum exactly
            // No mapping needed - use role name directly (normalized)
            // Trust the database - if role exists in DB, it's valid
            const normalizedRole = roleName.toLowerCase().trim();
            const resolved = normalizedRole || appUser.role || 'user';
            // normalize into same shape createAuthResponse expects
            (appUser as any).role = resolved;

            // Attempt to fetch role permissions dynamically from DB (role_permissions -> permissions)
            try {
              const roleId = userRole.id;
              if (roleId) {
                console.log('[SUPABASE_AUTH] Fetching permissions for role:', roleId, userRole.name);
                const { data: rolePerms, error: rpErr } = await supabase
                  .from('role_permissions')
                  .select('permission_id')
                  .eq('role_id', roleId);

                if (!rpErr && Array.isArray(rolePerms)) {
                  // Get permission names/IDs
                  const permIds = rolePerms.map((r: any) => r.permission_id).filter(Boolean);
                  console.log('[SUPABASE_AUTH] Found % permission IDs for role', permIds.length);
                  
                  // Fetch permission details if we need names
                  if (permIds.length > 0) {
                    const { data: perms, error: permErr } = await supabase
                      .from('permissions')
                      .select('id, name')
                      .in('id', permIds);
                    
                    if (!permErr && perms) {
                      const permNames = perms.map((p: any) => p.name).filter(Boolean);
                      (appUser as any).permissions = permNames;
                      console.log('[SUPABASE_AUTH] ✅ Fetched % role permissions:', permNames.length, permNames);
                    } else {
                      console.error('[SUPABASE_AUTH] ❌ Error fetching permission names:', permErr);
                      (appUser as any).permissions = [];
                    }
                  } else {
                    console.warn('[SUPABASE_AUTH] ⚠️ No permission IDs found for role', roleId);
                    (appUser as any).permissions = [];
                  }
                } else {
                  console.error('[SUPABASE_AUTH] ❌ Could not fetch role_permissions for role', roleId, rpErr?.message);
                  (appUser as any).permissions = [];
                }
              } else {
                console.warn('[SUPABASE_AUTH] ⚠️ No role ID found, cannot fetch permissions');
                (appUser as any).permissions = [];
              }
            } catch (e) {
              console.error('[SUPABASE_AUTH] ❌ Error fetching role permissions:', e);
              (appUser as any).permissions = [];
            }
          }
        } catch (e) {
          console.warn('[SUPABASE_AUTH] Failed to resolve role from user_roles relationship', e);
        }

        // Return auth response for the app user (role and permissions should now be set)
        return this.createAuthResponse(appUser, signInData.session.access_token, signInData.session.expires_in || 3600);
      }

      console.log('[SUPABASE_AUTH] Using mock-style authentication (Supabase auth skipped)');

      // ❌ REMOVED: Hardcoded user arrays violate database-driven principle
      // For mock authentication, we should fetch users from database instead
      // This ensures consistency and allows dynamic user/role management

      let userData: { email: string; role: string; tenantId: string | null } | null = null;

      // Try to authenticate against database users first
      try {
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (userError || !dbUser) {
          throw new Error('Invalid credentials');
        }

        // For mock auth, accept any password (simplified for development)
        // In production, this should use proper password hashing
        if (credentials.password !== 'password123') {
          throw new Error('Invalid credentials');
        }

        // Use database user data
        userData = {
          email: dbUser.email,
          role: dbUser.role || 'user',
          tenantId: dbUser.tenant_id
        };

        console.log('[SUPABASE_AUTH] Mock auth successful for:', userData.email);
      } catch (dbError) {
        console.warn('[SUPABASE_AUTH] Database authentication failed, using fallback:', dbError);
        throw new Error('Invalid credentials');
      }

      if (!userData) {
        throw new Error('Authentication failed');
      }

      console.log('[SUPABASE_AUTH] Mock auth successful for:', userData.email);

       // For mock auth, try to find the real user in database and load their permissions
       let mockUser: any;
       let userPermissions: string[] = [];
       console.log('[SUPABASE_AUTH] 🔄 Attempting to load permissions from database for mock user...');

      try {
        // Try to find the user in the database
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single();

        if (!userError && dbUser) {
          console.log('[SUPABASE_AUTH] Found user in database, loading permissions');

          // Get user's role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles!user_roles_role_id_fkey(id, name)
            `)
            .eq('user_id', dbUser.id)
            .limit(1);

          if (roleData && roleData.length > 0) {
            const role = roleData[0].roles as any;
            const roleId = role?.id;

            if (roleId) {
              // Fetch permissions for the role
              const { data: rolePerms } = await supabase
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', roleId);

              if (rolePerms && rolePerms.length > 0) {
                const permIds = rolePerms.map((r: any) => r.permission_id).filter(Boolean);

                if (permIds.length > 0) {
                  const { data: perms } = await supabase
                    .from('permissions')
                    .select('id, name')
                    .in('id', permIds);

                  if (perms) {
                    userPermissions = perms.map((p: any) => p.name).filter(Boolean);
                    console.log('[SUPABASE_AUTH] ✅ Loaded permissions from database:', userPermissions.length, userPermissions);
                  }
                }
              }
            }
          }

          // Use database user data
          mockUser = {
            ...dbUser,
            permissions: userPermissions
          };
        } else {
          console.log('[SUPABASE_AUTH] User not found in database, using mock data');
          // Generate a proper UUID for the mock user
          const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };

          // Create mock user object (same structure as database)
          mockUser = {
            id: generateUUID(),
            email: userData.email,
            name: userData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            first_name: userData.email.split('@')[0].split('.')[0] || '',
            last_name: userData.email.split('@')[0].split('.')[1] || '',
            role: userData.role,
            status: 'active',
            tenant_id: userData.tenantId,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            permissions: userPermissions
          };
        }
      } catch (error) {
        console.warn('[SUPABASE_AUTH] Error loading permissions from database:', error);
        // Fallback to mock user
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        mockUser = {
          id: generateUUID(),
          email: userData.email,
          name: userData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          first_name: userData.email.split('@')[0].split('.')[0] || '',
          last_name: userData.email.split('@')[0].split('.')[1] || '',
          role: userData.role,
          status: 'active',
          tenant_id: userData.tenantId,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          permissions: userPermissions
        };
      }

      // Create mock JWT token
      const mockToken = `mock_jwt_${mockUser.id}_${Date.now()}`;
      const expiresIn = 3600;

      console.log('[SUPABASE_AUTH] 🎯 Creating auth response with permissions:', userPermissions.length);
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

        // If it's a mock session (starts with mock_jwt_), handle mock restore
        if (session.access_token?.startsWith('mock_jwt_')) {
          console.log('[SUPABASE_AUTH] Restoring mock session');

          // Get user from localStorage
          const userStr = localStorage.getItem(this.userKey);
          if (userStr) {
            const user = JSON.parse(userStr);
            console.log('[SUPABASE_AUTH] Restored mock user:', { id: user.id, email: user.email, role: user.role });

            // For mock sessions, permissions should already be loaded during login
            // But let's double-check and reload if needed
            if (!user.permissions || user.permissions.length === 0) {
              console.log('[SUPABASE_AUTH] No permissions in mock user, attempting to reload from database');

              try {
                // Try to find the user in database and reload permissions
                const { data: dbUser } = await supabase
                  .from('users')
                  .select('*')
                  .eq('email', user.email)
                  .single();

                if (dbUser) {
                  // Get user's role and permissions
                  const { data: roleData } = await supabase
                    .from('user_roles')
                    .select(`
                      role_id,
                      roles!user_roles_role_id_fkey(id, name)
                    `)
                    .eq('user_id', dbUser.id)
                    .limit(1);

                  if (roleData && roleData.length > 0) {
                    const role = roleData[0].roles as any;
                    const roleId = role?.id;

                    if (roleId) {
                      const { data: rolePerms } = await supabase
                        .from('role_permissions')
                        .select('permission_id')
                        .eq('role_id', roleId);

                      if (rolePerms && rolePerms.length > 0) {
                        const permIds = rolePerms.map((r: any) => r.permission_id).filter(Boolean);

                        if (permIds.length > 0) {
                          const { data: perms } = await supabase
                            .from('permissions')
                            .select('id, name')
                            .in('id', permIds);

                          if (perms) {
                            user.permissions = perms.map((p: any) => p.name).filter(Boolean);
                            console.log('[SUPABASE_AUTH] Reloaded permissions for mock user:', user.permissions.length);
                            localStorage.setItem(this.userKey, JSON.stringify(user));
                          }
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.warn('[SUPABASE_AUTH] Error reloading permissions for mock user:', error);
              }
            }

            return user;
          }
          return null;
        }

        // For real Supabase sessions, proceed with normal flow
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
      let userRole: User['role'] = 'user'; // default
      let roleId: string | null = null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles!user_roles_role_id_fkey(id, name)
        `)
        .eq('user_id', data.session.user.id)
        .limit(1);

      if (roleData && roleData.length > 0) {
        const role = roleData[0].roles as any;
        roleId = role?.id;
        const roleName = role?.name;

        if (roleName) {
          // Map role names from database to User role enum
          // ✅ Database role names are normalized to match UserRole enum exactly
          // No mapping needed - use role name directly (normalized)
          // Trust the database - if role exists in DB, it's valid
          const normalizedRole = roleName.toLowerCase().trim();
          userRole = (normalizedRole || 'user') as User['role'];
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
      console.log('[getCurrentUser] 🔍 User:', {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        permissionsCount: user.permissions?.length || 0,
        permissions: user.permissions?.slice(0, 3) // Show first 3 permissions
      });
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

    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    const normalizedUserPermissions = userPermissions
      .map((perm) => normalizePermissionToken(perm))
      .filter(Boolean);
    const normalizedPermission = normalizePermissionToken(permission);

    console.log(
      `[hasPermission] 🔍 Checking permission "${permission}" (normalized: "${normalizedPermission}") for user role "${user.role}". User permissions:`,
      userPermissions,
    );

    const granted = normalizedUserPermissions.some((userPerm) =>
      doesPermissionGrant(userPerm, normalizedPermission),
    );

    if (granted) {
      console.log(`[hasPermission] ✅ Permission granted for "${permission}" via canonical comparison`);
      return true;
    }

    console.warn(
      `[hasPermission] No matching permission found for "${permission}". User role: "${user.role}", User permissions: ${JSON.stringify(
        userPermissions,
      )}`,
    );
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
    const isSuperAdmin = (user.role as string) === 'super_admin';
    if (isSuperAdmin) return true;

    // ✅ Database-driven: Check if role exists in database (tenant-level roles can access portal)
    // For synchronous check, trust that if role is set, it's valid (database ensures correctness)
    // Non-super-admin roles with valid role assignment can access their tenant portal
    return !!user.role;
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

  /**
   * Get available roles for the current user
   * ✅ Database-driven: Fetches roles from database and filters based on user's role hierarchy
   * This method should be async, but kept sync for backward compatibility
   * For async usage, use rbacService.getRoles() directly
   */
  getAvailableRoles(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    // ⚠️ NOTE: This is a synchronous method for backward compatibility
    // For fully database-driven approach, use rbacService.getRoles() which is async
    // This method returns empty array - callers should use async rbacService.getRoles() instead
    // TODO: Deprecate this method in favor of async rbacService.getRoles()
    console.warn('[AuthService] getAvailableRoles() is deprecated. Use rbacService.getRoles() for database-driven role fetching.');
    return [];
  }

  /**
   * Get available roles for the current user (async, database-driven)
   * ✅ Fetches roles from database and applies tenant isolation
   */
  async getAvailableRolesAsync(): Promise<string[]> {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      // ✅ Database-driven: Fetch roles from RBAC service (applies tenant isolation)
      const { rbacService } = await import('../../serviceFactory');
      const roles = await rbacService.getRoles();
      
      // Extract role names (already normalized in database)
      const { getValidUserRolesFromDatabaseRoles } = await import('@/utils/roleMapping');
      return getValidUserRolesFromDatabaseRoles(roles);
    } catch (error) {
      console.error('[AuthService] Error fetching available roles:', error);
      return [];
    }
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
   * ⚠️ SECURITY: Assert that the current user has access to the specified tenant
   * 
   * **DEPRECATED**: Use `validateTenantAccess()` from `@/utils/tenantValidation` instead.
   * This method is kept for backward compatibility but now delegates to the centralized validation.
   * 
   * @param tenantId - The tenant_id to validate access for
   * @param resource - Optional resource name for logging (defaults to 'unknown')
   * @param resourceId - Optional resource ID for logging
   * 
   * @deprecated Use validateTenantAccess() from @/utils/tenantValidation directly for better logging and audit trail
   */
  async assertTenantAccess(tenantId: string | null, resource: string = 'unknown', resourceId?: string): Promise<void> {
    // Delegate to centralized validation for consistency and logging
    // Use 'GET' as default operation type for backward compatibility
    await validateTenantAccess(tenantId, 'GET', resource, resourceId);
  }
}

export const supabaseAuthService = new SupabaseAuthService();