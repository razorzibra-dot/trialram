/**
 * User interface representing authenticated user in the system
 * 
 * Super Admin Requirements:
 * - isSuperAdmin: true indicates user is a platform-level super admin
 * - isSuperAdminMode?: true indicates user is currently in impersonation mode
 * - impersonatedAsUserId?: Set when impersonating another user
 * - impersonationLogId?: Tracks the current impersonation session ID
 * 
 * @interface User
 */
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user' | 'engineer' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  tenantId: string | null; // NULL for super admins (platform-level access)
  tenantName?: string;
  avatar?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  createdBy?: string;
  
  // ⭐ NEW: Super Admin Isolation Fields (Phase 2)
  /**
   * Indicates if user is a platform-level super admin
   * Super admins: cannot access regular tenant modules
   * Super admins: can only access super-admin module
   * Super admins: can impersonate any tenant user
   * 
   * @type {boolean}
   */
  isSuperAdmin: boolean;
  
  /**
   * Indicates if user is currently in impersonation mode
   * When true: user is operating as another tenant user
   * When false: user is operating with their actual role
   * 
   * @type {boolean}
   * @optional
   */
  isSuperAdminMode?: boolean;
  
  /**
   * ID of the user being impersonated (if in impersonation mode)
   * Used to track which user the super admin is impersonating
   * Cleared when impersonation session ends
   * 
   * @type {string}
   * @optional
   */
  impersonatedAsUserId?: string;
  
  /**
   * ID of the current impersonation log entry
   * Links to super_user_impersonation_logs table
   * Used for audit trail and session tracking
   * 
   * @type {string}
   * @optional
   */
  impersonationLogId?: string;
  /**
   * Permissions assigned to the user (derived from role_permissions)
   * This should be dynamically loaded from the DB at login/restore
   */
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Auth response returned from authentication endpoints
 * Includes authenticated user with super admin fields set
 * 
 * @interface AuthResponse
 */
export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}