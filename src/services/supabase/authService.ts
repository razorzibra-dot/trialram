/**
 * Supabase Authentication Service
 * Handles user authentication, JWT tokens, role-based access
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService, QueryOptions } from './baseService';
import { getSupabaseClient } from './client';
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
      
      this.log('Authenticating user', { email });

      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user details from users table
      const user = await this.getUserByEmail(email);
      if (!user) throw new Error('User not found in database');

      // Store auth data in localStorage
      const token = data.session?.access_token || '';
      this.storeAuthData(token, user);

      this.log('User authenticated successfully', { email });

      return {
        user,
        session: {
          access_token: token,
          refresh_token: data.session?.refresh_token || '',
          expires_in: data.session?.expires_in || 3600,
        },
      };
    } catch (error) {
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

      // Create user record in database
      const { data: user, error: dbError } = await client
        .from('users')
        .insert([
          {
            id: authData.user?.id,
            email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            tenantId: userData.tenantId,
            role: userData.role,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

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
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const client = getSupabaseClient();
      const { data } = await client.auth.getSession();

      if (!data.session) return null;

      const user = await this.getById<any>(data.session.user.id);
      return user ? this.mapUserResponse(user) : null;
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

      const users = await this.getAll<any>({
        filters: { email },
      });

      if (users.length === 0) return null;

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

      const updated = await this.update<any>(userId, {
        firstName: updates.firstName,
        lastName: updates.lastName,
        avatar: updates.avatar,
        phone: updates.phone,
        updated_at: new Date().toISOString(),
      });

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

      const users = await this.getAll<any>(options);
      return users.map((user) => this.mapUserResponse(user));
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

      const users = await this.getAll<any>({
        filters: { role },
      });

      return users.map((user) => this.mapUserResponse(user));
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

      const users = await this.getAll<any>({
        filters: { tenantId },
      });

      return users.map((user) => this.mapUserResponse(user));
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

      await this.update(userId, {
        status: 'inactive',
        updated_at: new Date().toISOString(),
      } as any);

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
      
      // Super admin has access to all roles
      if (user.role === 'super_admin') return true;
      
      return user.role === role;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    try {
      const userStr = localStorage.getItem('sb_current_user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr) as User;
      
      // Super admin has all permissions
      if (user.role === 'super_admin') return true;
      
      // Define role-based permissions
      const rolePermissions: Record<string, string[]> = {
        super_admin: ['*'],
        admin: [
          'view_dashboard',
          'manage_users',
          'manage_customers',
          'manage_sales',
          'manage_tickets',
          'manage_contracts',
          'manage_products',
          'view_reports',
          'export_data',
        ],
        manager: [
          'view_dashboard',
          'view_customers',
          'create_customers',
          'edit_customers',
          'view_sales',
          'create_sales',
          'edit_sales',
          'view_tickets',
          'create_tickets',
          'edit_tickets',
          'view_contracts',
        ],
        agent: [
          'view_dashboard',
          'view_customers',
          'create_customers',
          'view_sales',
          'create_sales',
          'view_tickets',
          'create_tickets',
          'edit_tickets',
        ],
        engineer: [
          'view_dashboard',
          'view_tickets',
          'edit_tickets',
          'view_customers',
        ],
        customer: [
          'view_dashboard',
          'view_own_tickets',
          'create_tickets',
        ],
        viewer: [
          'view_dashboard',
          'view_customers',
          'view_sales',
          'view_tickets',
          'view_contracts',
        ],
      };
      
      const userPermissions = rolePermissions[user.role] || [];
      
      // Check if user has specific permission
      return userPermissions.includes('*') || userPermissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Store token and user in localStorage (called after successful login)
   */
  private storeAuthData(token: string, user: User): void {
    try {
      localStorage.setItem('sb_access_token', token);
      localStorage.setItem('sb_current_user', JSON.stringify(user));
    } catch (error) {
      this.logError('Failed to store auth data', error);
    }
  }

  /**
   * Clear auth data from storage (called during logout)
   */
  private clearAuthData(): void {
    try {
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_current_user');
    } catch (error) {
      this.logError('Failed to clear auth data', error);
    }
  }

  /**
   * Map database user response to UI User type
   */
  private mapUserResponse(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      role: (dbUser.role || 'viewer') as User['role'],
      status: (dbUser.status || 'active') as User['status'],
      tenantId: dbUser.tenantId,
      tenantName: dbUser.tenantName || '',
      lastLogin: dbUser.lastLogin || '',
      createdAt: dbUser.created_at || new Date().toISOString(),
      avatar: dbUser.avatar || '',
      phone: dbUser.phone || '',
    };
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();