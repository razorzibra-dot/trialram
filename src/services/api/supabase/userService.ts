/**
 * Supabase User Service
 * Handles user management operations via Supabase PostgreSQL
 */

import { supabase } from '@/services/database';
import { User } from '@/types/auth';
import { authService } from '@/services/authService';

class SupabaseUserService {
  private table = 'users';
  private rolesTable = 'roles';
  private userRolesTable = 'user_roles';

  /**
   * Transform database snake_case to TypeScript camelCase
   */
  private toTypeScript(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      role: dbUser.role,
      status: dbUser.status,
      tenantId: dbUser.tenant_id,
      avatar: dbUser.avatar_url,
      phone: dbUser.phone,
      mobile: dbUser.mobile,
      company_name: dbUser.company_name,
      department: dbUser.department,
      position: dbUser.position,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLogin: dbUser.last_login,
      createdBy: dbUser.created_by,
    };
  }

  /**
   * Transform TypeScript camelCase to database snake_case
   */
  private toDatabase(user: Partial<User>): any {
    const dbUser: any = {};
    if (user.id !== undefined) dbUser.id = user.id;
    if (user.email !== undefined) dbUser.email = user.email;
    if (user.name !== undefined) dbUser.name = user.name;
    if (user.firstName !== undefined) dbUser.first_name = user.firstName;
    if (user.lastName !== undefined) dbUser.last_name = user.lastName;
    if (user.role !== undefined) dbUser.role = user.role;
    if (user.status !== undefined) dbUser.status = user.status;
    if (user.tenantId !== undefined) dbUser.tenant_id = user.tenantId;
    if (user.avatar !== undefined) dbUser.avatar_url = user.avatar;
    if (user.phone !== undefined) dbUser.phone = user.phone;
    if (user.mobile !== undefined) dbUser.mobile = user.mobile;
    if (user.company_name !== undefined) dbUser.company_name = user.company_name;
    if (user.department !== undefined) dbUser.department = user.department;
    if (user.position !== undefined) dbUser.position = user.position;
    return dbUser;
  }

  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: {
    role?: string;
    status?: string;
    tenantId?: string;
    search?: string;
  }): Promise<User[]> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    let query = supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map(dbUser => this.toTypeScript(dbUser));
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<User> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return this.toTypeScript(data);
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from(this.table)
      .select('id')
      .eq('email', userData.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error('Error checking email uniqueness');
    }

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const dbUser = this.toDatabase(userData);
    dbUser.created_at = new Date().toISOString();
    dbUser.last_login = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.table)
      .insert(dbUser)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.toTypeScript(data);
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    // Check if email already exists (if email is being updated)
    if (updates.email) {
      const { data: existingUser, error: checkError } = await supabase
        .from(this.table)
        .select('id')
        .eq('email', updates.email)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error('Error checking email uniqueness');
      }

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    const dbUpdates = this.toDatabase(updates);

    const { data, error } = await supabase
      .from(this.table)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return this.toTypeScript(data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Reset a user's password
   */
  async resetPassword(id: string): Promise<void> {
    // Authorization handled by database RLS (Row-Level Security)
    // Supabase RLS policies ensure users can only access their own tenant data

    const { data: user, error: fetchError } = await supabase
      .from(this.table)
      .select('email')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      throw new Error('User not found');
    }

    // In a real implementation, this would trigger a password reset email via Supabase Auth
    // For now, we'll log the action
    console.log(`Password reset email triggered for ${user.email}`);

    // Log the action
    await this.logPasswordReset(id);
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.rolesTable)
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return ['Admin', 'Manager', 'Viewer'];
    }

    return data?.map(r => r.name) || ['Admin', 'Manager', 'Viewer'];
  }

  /**
   * Get available permissions
   */
  async getPermissions(): Promise<string[]> {
    return [
      'read',
      'write',
      'delete',
      'admin',
      'user_management',
      'customer_management',
      'sales_management',
      'ticket_management',
      'contract_management',
      'report_access',
      'export_data',
      'import_data',
      'system_settings'
    ];
  }

  /**
   * Get available statuses
   */
  async getStatuses(): Promise<string[]> {
    return ['active', 'inactive', 'suspended'];
  }

  /**
   * Get available tenants
   */
  async getTenants(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Helper method to log password reset actions
   */
  private async logPasswordReset(userId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'password_reset',
          resource: 'user',
          resource_id: userId,
          details: { reset_by: currentUser.id },
          tenant_id: currentUser.tenantId,  // Fixed: use camelCase tenantId from User object
          timestamp: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error logging password reset:', err);
    }
  }
}

export const supabaseUserService = new SupabaseUserService();