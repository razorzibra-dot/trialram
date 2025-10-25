import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { Tenant, TenantUser } from '@/types/rbac';
import { supabase } from '@/services/database';

class AuthService {
  private baseUrl = '/api/auth';
  private tokenKey = 'crm_auth_token';
  private userKey = 'crm_user';
  private sessionKey = 'supabase_session';

  private mockTenants: Tenant[] = [
    {
      id: 'platform',
      name: 'Platform Administration',
      domain: 'platform.altan.ai',
      status: 'active',
      plan: 'enterprise',
      created_at: '2024-01-01T00:00:00Z',
      settings: {
        branding: {
          primary_color: '#6366f1',
          secondary_color: '#8b5cf6',
          company_name: 'Altan Platform'
        },
        features: {
          advanced_analytics: true,
          custom_fields: true,
          api_access: true,
          white_labeling: true
        },
        security: {
          two_factor_required: true,
          password_policy: {
            min_length: 12,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_symbols: true,
            expiry_days: 90
          },
          session_timeout: 3600
        }
      },
      usage: {
        users: 1,
        max_users: -1,
        storage_used: 0,
        storage_limit: -1,
        api_calls_month: 0,
        api_calls_limit: -1
      }
    },
    {
      id: 'techcorp',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      status: 'active',
      plan: 'enterprise',
      created_at: '2024-01-01T00:00:00Z',
      settings: {
        branding: {
          primary_color: '#3b82f6',
          secondary_color: '#1d4ed8',
          company_name: 'TechCorp Solutions'
        },
        features: {
          advanced_analytics: true,
          custom_fields: true,
          api_access: true,
          white_labeling: false
        },
        security: {
          two_factor_required: false,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_symbols: false,
            expiry_days: 180
          },
          session_timeout: 7200
        }
      },
      usage: {
        users: 5,
        max_users: 50,
        storage_used: 2.5,
        storage_limit: 100,
        api_calls_month: 15420,
        api_calls_limit: 100000
      }
    },
    {
      id: 'innovatecorp',
      name: 'InnovateCorp',
      domain: 'innovatecorp.io',
      status: 'active',
      plan: 'professional',
      created_at: '2024-01-15T00:00:00Z',
      settings: {
        branding: {
          primary_color: '#10b981',
          secondary_color: '#059669',
          company_name: 'InnovateCorp'
        },
        features: {
          advanced_analytics: true,
          custom_fields: false,
          api_access: true,
          white_labeling: false
        },
        security: {
          two_factor_required: false,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: false,
            require_symbols: false,
            expiry_days: 365
          },
          session_timeout: 3600
        }
      },
      usage: {
        users: 5,
        max_users: 25,
        storage_used: 1.2,
        storage_limit: 50,
        api_calls_month: 8750,
        api_calls_limit: 50000
      }
    }
  ];

  private mockUsers: User[] = [
    {
      id: 'super_admin_1',
      email: 'superadmin@platform.com',
      name: 'Platform Administrator',
      role: 'super_admin',
      tenantId: 'platform',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'admin_techcorp_1',
      email: 'admin@techcorp.com',
      name: 'John Anderson',
      role: 'admin',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'manager_techcorp_1',
      email: 'manager@techcorp.com',
      name: 'Sarah Johnson',
      role: 'manager',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'agent_techcorp_1',
      email: 'agent@techcorp.com',
      name: 'Mike Wilson',
      role: 'agent',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'engineer_techcorp_1',
      email: 'engineer@techcorp.com',
      name: 'Alex Rodriguez',
      role: 'engineer',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'customer_techcorp_1',
      email: 'customer@techcorp.com',
      name: 'Emma Davis',
      role: 'customer',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'admin_innovate_1',
      email: 'admin@innovatecorp.com',
      name: 'David Chen',
      role: 'admin',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString()
    },
    {
      id: 'manager_innovate_1',
      email: 'manager@innovatecorp.com',
      name: 'Lisa Thompson',
      role: 'manager',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString()
    },
    {
      id: 'agent_innovate_1',
      email: 'agent@innovatecorp.com',
      name: 'Robert Kim',
      role: 'agent',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString()
    },
    {
      id: 'engineer_innovate_1',
      email: 'engineer@innovatecorp.com',
      name: 'Maria Garcia',
      role: 'engineer',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString()
    },
    {
      id: 'customer_innovate_1',
      email: 'customer@innovatecorp.com',
      name: 'James Miller',
      role: 'customer',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString()
    }
  ];

  private permissions = {
    read: 'View and read data',
    write: 'Create and edit data',
    delete: 'Delete data',
    manage_customers: 'Manage customer data and relationships',
    manage_sales: 'Manage sales processes and deals',
    manage_tickets: 'Manage support tickets and issues',
    manage_complaints: 'Handle customer complaints',
    manage_contracts: 'Manage service contracts and agreements',
    manage_service_contracts: 'Manage service contracts and agreements',
    manage_products: 'Manage product catalog and inventory',
    manage_product_sales: 'Manage product sales and transactions',
    manage_job_works: 'Manage job work orders and tasks',
    manage_users: 'Manage user accounts and access',
    manage_roles: 'Manage roles and permissions',
    view_analytics: 'Access analytics and reports',
    manage_settings: 'Configure system settings',
    manage_companies: 'Manage company information',
    platform_admin: 'Platform administration access',
    super_admin: 'Full system administration',
    manage_tenants: 'Manage tenant accounts',
    system_monitoring: 'Monitor system health and performance'
  };

  private rolePermissions = {
    super_admin: [
      'read', 'write', 'delete',
      'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints', 
      'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'manage_job_works',
      'manage_users', 'manage_roles', 'view_analytics', 'manage_settings', 'manage_companies',
      'platform_admin', 'super_admin', 'manage_tenants', 'system_monitoring'
    ],
    admin: [
      'read', 'write', 'delete',
      'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints',
      'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'manage_job_works',
      'manage_users', 'manage_roles', 'view_analytics', 'manage_settings', 'manage_companies'
    ],
    manager: [
      'read', 'write',
      'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints',
      'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'view_analytics'
    ],
    agent: [
      'read', 'write',
      'manage_customers', 'manage_tickets', 'manage_complaints'
    ],
    engineer: [
      'read', 'write',
      'manage_products', 'manage_product_sales', 'manage_job_works', 'manage_tickets'
    ],
    customer: [
      'read'
    ]
  };

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[AUTH] Starting login for:', credentials.email);
      
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('[AUTH] Supabase auth error:', error.message);
        throw new Error(error.message || 'Invalid credentials');
      }

      if (!data.user || !data.session) {
        throw new Error('No session returned from authentication');
      }

      console.log('[AUTH] Auth successful, user ID:', data.user.id);

      // Step 2: Get user from app database (linked by auth.uid)
      console.log('[AUTH] Fetching user from database with ID:', data.user.id);
      const { data: appUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('[AUTH] User fetch error:', userError);
        throw new Error('User profile not found. Contact administrator.');
      }

      if (!appUser) {
        throw new Error('User profile not found in database.');
      }

      console.log('[AUTH] User found:', appUser.email);

      // Step 3: Convert to app User type
      const user: User = {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name || `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
        firstName: appUser.first_name || '',
        lastName: appUser.last_name || '',
        role: appUser.role,
        tenantId: appUser.tenant_id,
        tenant_id: appUser.tenant_id,
        createdAt: appUser.created_at,
        lastLogin: new Date().toISOString(),
      };

      // Step 4: Store session and user
      localStorage.setItem(this.sessionKey, JSON.stringify(data.session));
      localStorage.setItem(this.tokenKey, data.session.access_token);
      localStorage.setItem(this.userKey, JSON.stringify(user));

      console.log('[AUTH] Login successful, session stored');

      return {
        user,
        token: data.session.access_token,
        expires_in: data.session.expires_in || 3600
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      console.error('[AUTH] Login failed:', message);
      throw new Error(message);
    }
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

      // Get user from app database
      const { data: appUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError || !appUser) {
        return null;
      }

      const user: User = {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name || `${appUser.first_name || ''} ${appUser.last_name || ''}`.trim(),
        firstName: appUser.first_name || '',
        lastName: appUser.last_name || '',
        role: appUser.role,
        tenantId: appUser.tenant_id,
        tenant_id: appUser.tenant_id,
        createdAt: appUser.created_at,
        lastLogin: appUser.last_login,
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

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      console.log('[hasPermission] User is super_admin, granting all permissions');
      return true;
    }

    // FIX: Ensure role is properly set - if role is empty or invalid, default to checking the role field
    const userRole = user.role || user.role;
    if (!userRole) {
      console.warn('[hasPermission] User role is not set, denying access');
      return false;
    }

    const userPermissions = this.rolePermissions[userRole] || [];
    console.log(`[hasPermission] Checking permission "${permission}" for user role "${userRole}". User permissions:`, userPermissions);
    
    // Direct permission check (for legacy permission names like 'read', 'write', 'delete')
    if (userPermissions.includes(permission)) {
      console.log(`[hasPermission] Direct match found for "${permission}"`);
      return true;
    }

    // Handle resource-specific permission format (e.g., "customers:read", "customers:update", "customers:delete")
    // Parse the permission string to extract resource and action
    const separator = permission.includes(':') ? ':' : '.';
    const parts = permission.split(separator);
    
    if (parts.length === 2) {
      const [resource, action] = parts;
      
      // Map action to generic permission
      const actionPermissionMap: Record<string, string> = {
        'read': 'read',
        'create': 'write',
        'update': 'write',
        'delete': 'delete',
        'manage': `manage_${resource}`
      };

      const mappedPermission = actionPermissionMap[action];
      console.log(`[hasPermission] Parsed: resource="${resource}", action="${action}", mappedPermission="${mappedPermission}"`);
      
      // Check if user has the generic permission
      if (mappedPermission && userPermissions.includes(mappedPermission)) {
        console.log(`[hasPermission] User has mapped permission "${mappedPermission}", granting access`);
        return true;
      }

      // Check if user has the resource-specific manage permission
      const managePermission = `manage_${resource}`;
      if (userPermissions.includes(managePermission)) {
        // User can manage this resource, so they can do most operations
        console.log(`[hasPermission] User has manage permission "${managePermission}", granting access`);
        return true;
      }
    }

    console.warn(`[hasPermission] No matching permission found for "${permission}". User role: "${userRole}", User permissions: ${JSON.stringify(userPermissions)}`);
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

  getUserTenant(): Tenant | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    return this.mockTenants.find(t => t.id === user.tenant_id) || null;
  }

  getTenantUsers(tenantId?: string): User[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    const targetTenantId = tenantId || user.tenant_id;
    
    if (user.role === 'super_admin') {
      return tenantId ? this.mockUsers.filter(u => u.tenant_id === tenantId) : this.mockUsers;
    }
    
    return this.mockUsers.filter(u => u.tenant_id === targetTenantId);
  }

  getAllTenants(): Tenant[] {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'super_admin') return [];
    
    return this.mockTenants;
  }

  getUserPermissions(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    return this.rolePermissions[user.role] || [];
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

  private generateMockToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = btoa('mock_signature');
    
    return `${header}.${payload}.${signature}`;
  }

  async refreshToken(): Promise<string> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user found');
    
    const newToken = this.generateMockToken(user);
    localStorage.setItem(this.tokenKey, newToken);
    return newToken;
  }

  getDemoAccounts(): { tenant: string; users: User[] }[] {
    const tenantGroups = this.mockUsers.reduce((acc, user) => {
      if (!acc[user.tenantId]) {
        acc[user.tenantId] = [];
      }
      acc[user.tenantId].push(user);
      return acc;
    }, {} as Record<string, User[]>);

    return Object.entries(tenantGroups).map(([tenantId, users]) => {
      const tenant = this.mockTenants.find(t => t.id === tenantId);
      return {
        tenant: tenant?.name || tenantId,
        users
      };
    });
  }

  getPermissionDescription(permission: string): string {
    return this.permissions[permission] || permission;
  }

  getRoleHierarchy(): Record<string, number> {
    return {
      super_admin: 6,
      admin: 5,
      manager: 4,
      agent: 3,
      engineer: 3,
      customer: 1
    };
  }

  canManageUser(targetUserId: string): boolean {
    const currentUser = this.getCurrentUser();
    const targetUser = this.mockUsers.find(u => u.id === targetUserId);
    
    if (!currentUser || !targetUser) return false;
    
    if (currentUser.role === 'super_admin') return true;
    
    if (currentUser.tenant_id !== targetUser.tenant_id) return false;
    
    const hierarchy = this.getRoleHierarchy();
    const currentLevel = hierarchy[currentUser.role] || 0;
    const targetLevel = hierarchy[targetUser.role] || 0;
    
    return currentLevel > targetLevel;
  }
}

export const authService = new AuthService();