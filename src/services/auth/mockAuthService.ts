/**
 * Mock Authentication Service
 * Follows strict 8-layer architecture:
 * 1. DATABASE: snake_case columns with constraints
 * 2. TYPES: camelCase interface matching DB exactly
 * 3. MOCK SERVICE: same fields + validation as DB (NO Supabase dependencies)
 * 4. SUPABASE SERVICE: SELECT with column mapping (snake → camel)
 * 5. FACTORY: route to correct backend
 * 6. MODULE SERVICE: use factory (never direct imports)
 * 7. HOOKS: loading/error/data states + cache invalidation
 * 8. UI: form fields = DB columns + tooltips documenting constraints
 */

import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { Tenant, TenantUser } from '@/types/rbac';

class MockAuthService {
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
      tenantId: null, // ← Super admins have NULL tenantId
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      // ⭐ NEW: Super Admin Isolation Fields
      isSuperAdmin: true,
      isSuperAdminMode: false,
      impersonatedAsUserId: undefined,
      impersonationLogId: undefined,
    },
    {
      id: 'admin_techcorp_1',
      email: 'admin@techcorp.com',
      name: 'John Anderson',
      role: 'admin',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'manager_techcorp_1',
      email: 'manager@techcorp.com',
      name: 'Sarah Johnson',
      role: 'manager',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'agent_techcorp_1',
      email: 'agent@techcorp.com',
      name: 'Mike Wilson',
      role: 'agent',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'engineer_techcorp_1',
      email: 'engineer@techcorp.com',
      name: 'Alex Rodriguez',
      role: 'engineer',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'customer_techcorp_1',
      email: 'customer@techcorp.com',
      name: 'Emma Davis',
      role: 'customer',
      tenantId: 'techcorp',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'admin_innovate_1',
      email: 'admin@innovatecorp.com',
      name: 'David Chen',
      role: 'admin',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'manager_innovate_1',
      email: 'manager@innovatecorp.com',
      name: 'Lisa Thompson',
      role: 'manager',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'agent_innovate_1',
      email: 'agent@innovatecorp.com',
      name: 'Robert Kim',
      role: 'agent',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'engineer_innovate_1',
      email: 'engineer@innovatecorp.com',
      name: 'Maria Garcia',
      role: 'engineer',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString(),
      isSuperAdmin: false,
    },
    {
      id: 'customer_innovate_1',
      email: 'customer@innovatecorp.com',
      name: 'James Miller',
      role: 'customer',
      tenantId: 'innovatecorp',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=face',
      created_at: '2024-01-15T00:00:00Z',
      last_login: new Date().toISOString(),
      isSuperAdmin: false,
    }
  ];

  private permissions = {
    // Core permissions
    read: 'View and read data',
    write: 'Create and edit data',
    delete: 'Delete data',
    
    // Module permissions using {resource}:{action} format
    'crm:customer:record:read': 'View customer data and relationships',
    'crm:customer:record:create': 'Create new customer records',
    'crm:customer:record:update': 'Edit customer information',
    'crm:customer:record:delete': 'Remove customer records',
    
    'crm:sales:deal:read': 'View sales processes and deals',
    'crm:sales:deal:create': 'Create new sales records',
    'crm:sales:deal:update': 'Edit sales information',
    'crm:sales:deal:delete': 'Remove sales records',
    
    'crm:support:ticket:read': 'View support tickets and issues',
    'crm:support:ticket:create': 'Create new support tickets',
    'crm:support:ticket:update': 'Edit ticket information',
    'crm:support:ticket:delete': 'Remove ticket records',
    
    'crm:support:complaint:read': 'View customer complaints',
    'crm:support:complaint:create': 'Create complaint records',
    'crm:support:complaint:update': 'Edit complaint information',
    'crm:support:complaint:delete': 'Remove complaint records',
    
    'crm:contract:record:read': 'View service contracts and agreements',
    'crm:contract:record:create': 'Create new contracts',
    'crm:contract:record:update': 'Edit contract information',
    'crm:contract:record:delete': 'Remove contract records',
    
    'crm:contract:service:read': 'View service contracts and agreements',
    'crm:contract:service:create': 'Create new service contracts',
    'crm:contract:service:update': 'Edit service contract information',
    'crm:contract:service:delete': 'Remove service contract records',
    
    'crm:product:record:read': 'View product catalog and inventory',
    'crm:product:record:create': 'Create new product records',
    'crm:product:record:update': 'Edit product information',
    'crm:product:record:delete': 'Remove product records',
    
    'crm:product-sale:record:read': 'View product sales transactions',
    'crm:product-sale:record:create': 'Create new product sales records',
    'crm:product-sale:record:update': 'Edit product sales information',
    'crm:product-sale:record:delete': 'Remove product sales records',
    
    'crm:project:record:read': 'View job work orders and tasks',
    'crm:project:record:create': 'Create new job work orders',
    'crm:project:record:update': 'Edit job work information',
    'crm:project:record:delete': 'Remove job work records',
    
    'crm:dashboard:panel:view': 'Access tenant dashboard and analytics',
    'crm:reference:data:read': 'Access master data and configuration',
    
    // Administrative permissions using {resource}:{action} format
    'crm:user:record:read': 'View user accounts and access',
    'crm:user:record:create': 'Create new user accounts',
    'crm:user:record:update': 'Edit user accounts',
    'crm:user:record:delete': 'Remove user accounts',
    
    'crm:role:record:read': 'View roles and permissions',
    'crm:role:record:create': 'Create new roles',
    'crm:role:record:update': 'Edit roles and permissions',
    'crm:role:record:delete': 'Remove roles',
    
    'crm:analytics:insight:view': 'Access analytics and reports',
    'crm:system:config:read': 'Configure system settings',
    'crm:system:config:manage': 'Update system settings',
    'crm:company:record:read': 'View company information',
    'crm:company:record:update': 'Edit company information',
    
    // System permissions using {resource}:{action} format
    'platform:admin': 'Platform administration access',
    'system:admin': 'Full system administration',
    'crm:platform:tenant:manage': 'Manage tenant accounts',
    'system:monitor': 'Monitor system health and performance'
  };

  private rolePermissions = {
    super_admin: [
      'read', 'write', 'delete',
      'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update', 'crm:customer:record:delete',
      'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete',
      'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:delete',
      'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update', 'crm:support:complaint:delete',
      'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
      'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
      'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update', 'crm:product:record:delete',
      'crm:product-sale:record:read', 'crm:product-sale:record:create', 'crm:product-sale:record:update', 'crm:product-sale:record:delete',
      'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
      'crm:dashboard:panel:view', 'crm:reference:data:read', 'crm:user:record:read',
      'crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete',
      'crm:role:record:read', 'crm:role:record:create', 'crm:role:record:update', 'crm:role:record:delete',
      'crm:analytics:insight:view', 'crm:system:config:read', 'crm:system:config:manage', 'crm:company:record:read', 'crm:company:record:update',
      'platform:admin', 'system:admin', 'crm:platform:tenant:manage', 'system:monitor'
    ],
    admin: [
      'read', 'write', 'delete',
      'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update', 'crm:customer:record:delete',
      'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update', 'crm:sales:deal:delete',
      'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update', 'crm:support:ticket:delete',
      'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update', 'crm:support:complaint:delete',
      'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update', 'crm:contract:record:delete',
      'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update', 'crm:contract:service:delete',
      'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update', 'crm:product:record:delete',
      'crm:product-sale:record:read', 'crm:product-sale:record:create', 'crm:product-sale:record:update', 'crm:product-sale:record:delete',
      'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update', 'crm:project:record:delete',
      'crm:dashboard:panel:view', 'crm:reference:data:read', 'crm:user:record:read',
      'crm:user:record:read', 'crm:user:record:create', 'crm:user:record:update', 'crm:user:record:delete',
      'crm:role:record:read', 'crm:role:record:create', 'crm:role:record:update', 'crm:role:record:delete',
      'crm:analytics:insight:view', 'crm:system:config:read', 'crm:system:config:manage', 'crm:company:record:read', 'crm:company:record:update'
    ],
    manager: [
      'read', 'write',
      'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
      'crm:sales:deal:read', 'crm:sales:deal:create', 'crm:sales:deal:update',
      'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
      'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update',
      'crm:contract:record:read', 'crm:contract:record:create', 'crm:contract:record:update',
      'crm:contract:service:read', 'crm:contract:service:create', 'crm:contract:service:update',
      'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update',
      'crm:product-sale:record:read', 'crm:product-sale:record:create', 'crm:product-sale:record:update',
      'crm:dashboard:panel:view', 'crm:reference:data:read', 'crm:user:record:read',
      'crm:analytics:insight:view'
    ],
    agent: [
      'read', 'write',
      'crm:customer:record:read', 'crm:customer:record:create', 'crm:customer:record:update',
      'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
      'crm:support:complaint:read', 'crm:support:complaint:create', 'crm:support:complaint:update'
    ],
    engineer: [
      'read', 'write',
      'crm:product:record:read', 'crm:product:record:create', 'crm:product:record:update',
      'crm:product-sale:record:read', 'crm:product-sale:record:create', 'crm:product-sale:record:update',
      'crm:project:record:read', 'crm:project:record:create', 'crm:project:record:update',
      'crm:support:ticket:read', 'crm:support:ticket:create', 'crm:support:ticket:update',
      'crm:dashboard:panel:view', 'crm:reference:data:read'
    ],
    customer: [
      'read'
    ]
  };

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[AUTH_MOCK] Starting login for:', credentials.email);
      
      // Mock authentication - find user in mock data
      const mockUser = this.mockUsers.find(u => u.email === credentials.email);
      
      if (!mockUser || credentials.password !== 'password123') {
        throw new Error('Invalid credentials');
      }

      console.log('[AUTH_MOCK] User found:', mockUser.email);

      // Create user object with proper structure
      const user: User = {
        ...mockUser,
        status: mockUser.status || 'active',
        lastLogin: new Date().toISOString(),
      };

      // Generate mock token
      const token = this.generateMockToken(user);
      const expiresIn = 3600;

      // Store session and user
      const mockSession = {
        access_token: token,
        refresh_token: `refresh_${user.id}_${Date.now()}`,
        expires_in: expiresIn,
        user: {
          id: user.id,
          email: user.email
        }
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(mockSession));
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));

      console.log('[AUTH_MOCK] Login successful, session stored');

      return {
        user,
        token,
        expires_in: expiresIn
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      console.error('[AUTH_MOCK] Login failed:', message);
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    // Clear local storage (mock service - no backend call needed)
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.sessionKey);
    console.log('[AUTH_MOCK] Logout successful');
  }

  async restoreSession(): Promise<User | null> {
    try {
      // Check if session exists in localStorage (mock service)
      const userStr = localStorage.getItem(this.userKey);
      const token = localStorage.getItem(this.tokenKey);
      
      if (!userStr || !token) {
        return null;
      }

      const user = JSON.parse(userStr) as User;
      
      // Verify user still exists in mock data
      const mockUser = this.mockUsers.find(u => u.id === user.id);
      if (!mockUser) {
        // Clear invalid session
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.sessionKey);
        return null;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      localStorage.setItem(this.userKey, JSON.stringify(user));
      
      return user;
    } catch (err) {
      console.error('[AUTH_MOCK] Session restore error:', err);
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

    const userRole = user.role;
    if (!userRole) {
      console.warn('[hasPermission] User role is not set, denying access');
      return false;
    }

    const userPermissions = this.rolePermissions[userRole] || [];
    console.log(`[hasPermission] Checking permission "${permission}" for user role "${userRole}". User permissions:`, userPermissions);
    
    // Direct permission check (works for both old and new format)
    if (userPermissions.includes(permission)) {
      console.log(`[hasPermission] Direct match found for "${permission}"`);
      return true;
    }

    // ⭐ ENHANCEMENT: Provide fallback permissions for common navigation permissions
    // If user has any role that should have dashboard access, grant crm:dashboard:panel:view
    if (permission === 'crm:dashboard:panel:view' && ['admin', 'manager', 'agent', 'engineer', 'customer'].includes(userRole)) {
      console.log(`[hasPermission] Granting fallback crm:dashboard:panel:view permission to ${userRole}`);
      return true;
    }

    // Grant crm:reference:data:read to roles that need it
    if (permission === 'crm:reference:data:read' && ['admin', 'manager', 'engineer'].includes(userRole)) {
      console.log(`[hasPermission] Granting fallback crm:reference:data:read permission to ${userRole}`);
      return true;
    }

    // Grant crm:user:record:read to admin and manager roles
    if (permission === 'crm:user:record:read' && ['admin', 'manager'].includes(userRole)) {
      console.log(`[hasPermission] Granting fallback crm:user:record:read permission to ${userRole}`);
      return true;
    }

    // ⭐ COMPATIBILITY: Check for old-style permissions as fallbacks
    const permissionMappings: Record<string, string[]> = {
      'crm:dashboard:panel:view': ['read', 'write'], // Any user with read access gets dashboard
      'crm:reference:data:read': ['read'],            // Users with read get masters access
    };

    const mappedPermissions = permissionMappings[permission];
    if (mappedPermissions) {
      for (const mappedPerm of mappedPermissions) {
        if (userPermissions.includes(mappedPerm)) {
          console.log(`[hasPermission] Fallback match found via "${mappedPerm}" for "${permission}"`);
          return true;
        }
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
    
    // Generate new mock token
    const newToken = this.generateMockToken(user);
    localStorage.setItem(this.tokenKey, newToken);
    
    // Update session
    const sessionStr = localStorage.getItem(this.sessionKey);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      session.access_token = newToken;
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }
    
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

export const mockAuthService = new MockAuthService();