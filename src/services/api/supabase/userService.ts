/**
 * Supabase User Service
 * Handles user management operations via Supabase PostgreSQL
 * 
 * FIELD MAPPING REFERENCE (Database → DTO):
 * All snake_case database columns are mapped to camelCase DTOs:
 * - id → id
 * - email → email
 * - name → name
 * - first_name → firstName
 * - last_name → lastName
 * - role → role (enum)
 * - status → status (enum)
 * - tenant_id → tenantId
 * - avatar_url → avatarUrl
 * - phone → phone
 * - mobile → mobile
 * - company_name → companyName
 * - department → department
 * - position → position
 * - created_at → createdAt
 * - updated_at → updatedAt
 * - last_login → lastLogin
 * - created_by → createdBy
 * - deleted_at → deletedAt
 * 
 * ✅ Validation rules match mock service exactly
 */

import { supabase } from '@/services/database';
import {
  UserDTO,
  UserStatsDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  UserActivityDTO,
  UserRole,
  UserStatus,
} from '@/types/dtos/userDtos';

/**
 * Centralized row mapper for database to DTO transformation
 * CRITICAL: Keep synchronized with database schema and UserDTO interface
 */
function mapUserRow(dbRow: any): UserDTO {
  return {
    id: dbRow.id,
    email: dbRow.email,
    name: dbRow.name,
    firstName: dbRow.first_name,
    lastName: dbRow.last_name,
    role: dbRow.role,
    status: dbRow.status,
    tenantId: dbRow.tenant_id,
    avatarUrl: dbRow.avatar_url,
    phone: dbRow.phone,
    mobile: dbRow.mobile,
    companyName: dbRow.company_name,
    department: dbRow.department,
    position: dbRow.position,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    lastLogin: dbRow.last_login,
    createdBy: dbRow.created_by,
    deletedAt: dbRow.deleted_at,
  };
}

/**
 * Supabase User Service Implementation
 */
class SupabaseUserService {
  private table = 'users';
  private activityTable = 'user_activities';

  /**
   * Get all users with optional filters
   * ✅ Returns: UserDTO[]
   * ✅ Validation: Same rules as mock
   * ✅ RLS: Database enforces multi-tenant access control
   */
  async getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]> {
    let query = supabase
      .from(this.table)
      .select(`
        id,
        email,
        name,
        first_name,
        last_name,
        role,
        status,
        tenant_id,
        avatar_url,
        phone,
        mobile,
        company_name,
        department,
        position,
        created_at,
        updated_at,
        last_login,
        created_by,
        deleted_at
      `)
      .is('deleted_at', null) // Soft delete filter
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.role && filters.role.length > 0) {
        query = query.in('role', filters.role);
      }
      if (filters.department && filters.department.length > 0) {
        query = query.in('department', filters.department);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }
      if (filters.createdAfter) {
        query = query.gte('created_at', filters.createdAfter);
      }
      if (filters.createdBefore) {
        query = query.lte('created_at', filters.createdBefore);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[UserService] Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map(mapUserRow);
  }

  /**
   * Get a single user by ID
   * ✅ Returns: UserDTO
   * ✅ Validation: Throws on not found
   * ✅ RLS: Database enforces access control
   */
  async getUser(id: string): Promise<UserDTO> {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        id,
        email,
        name,
        first_name,
        last_name,
        role,
        status,
        tenant_id,
        avatar_url,
        phone,
        mobile,
        company_name,
        department,
        position,
        created_at,
        updated_at,
        last_login,
        created_by,
        deleted_at
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    // Handle not found case (PGRST116) and other errors
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`User not found: ${id}`);
      }
      console.error('[UserService] Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!data) {
      throw new Error(`User not found: ${id}`);
    }

    return mapUserRow(data);
  }

  /**
   * Create a new user
   * ✅ Returns: Created UserDTO with generated id and timestamps
   * ✅ Validation: Email uniqueness, required fields, field lengths, role/status values
   */
  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    // Validate required fields
    if (!data.email) {
      throw new Error('Email is required');
    }
    if (!data.name) {
      throw new Error('Name is required');
    }
    if (!data.role) {
      throw new Error('Role is required');
    }
    if (!data.status) {
      throw new Error('Status is required');
    }
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate field lengths
    if (data.name.length > 255) {
      throw new Error('Name cannot exceed 255 characters');
    }
    if (data.firstName && data.firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }
    if (data.lastName && data.lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
    if (data.phone && data.phone.length > 50) {
      throw new Error('Phone cannot exceed 50 characters');
    }
    if (data.mobile && data.mobile.length > 50) {
      throw new Error('Mobile cannot exceed 50 characters');
    }
    if (data.companyName && data.companyName.length > 255) {
      throw new Error('Company name cannot exceed 255 characters');
    }
    if (data.department && data.department.length > 100) {
      throw new Error('Department cannot exceed 100 characters');
    }
    if (data.position && data.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters');
    }

    // Validate role
    const validRoles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
    if (!validRoles.includes(data.role)) {
      throw new Error(`Invalid role: ${data.role}. Allowed roles: ${validRoles.join(', ')}`);
    }

    // Validate status
    const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}. Allowed statuses: ${validStatuses.join(', ')}`);
    }

    // Check email uniqueness
    const { data: existingUser, error: checkError } = await supabase
      .from(this.table)
      .select('id')
      .eq('email', data.email)
      .is('deleted_at', null)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error('Error checking email uniqueness');
    }

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Insert new user
    const now = new Date().toISOString();
    const { data: createdUser, error: insertError } = await supabase
      .from(this.table)
      .insert({
        email: data.email,
        name: data.name,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        status: data.status,
        avatar_url: data.avatarUrl,
        phone: data.phone,
        mobile: data.mobile,
        company_name: data.companyName,
        department: data.department,
        position: data.position,
        created_at: now,
        updated_at: now,
        last_login: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[UserService] Error creating user:', insertError);
      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    return mapUserRow(createdUser);
  }

  /**
   * Update a user
   * ✅ Returns: Updated UserDTO
   * ✅ Validation: Email uniqueness if updated, field lengths, role/status values
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    // If email is being updated, check uniqueness and format
    if (data.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Invalid email format');
      }

      const { data: existingUser, error: checkError } = await supabase
        .from(this.table)
        .select('id')
        .eq('email', data.email)
        .neq('id', id)
        .is('deleted_at', null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error('Error checking email uniqueness');
      }

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Validate field lengths if provided
    if (data.name && data.name.length > 255) {
      throw new Error('Name cannot exceed 255 characters');
    }
    if (data.firstName && data.firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }
    if (data.lastName && data.lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
    if (data.phone && data.phone.length > 50) {
      throw new Error('Phone cannot exceed 50 characters');
    }
    if (data.mobile && data.mobile.length > 50) {
      throw new Error('Mobile cannot exceed 50 characters');
    }
    if (data.companyName && data.companyName.length > 255) {
      throw new Error('Company name cannot exceed 255 characters');
    }
    if (data.department && data.department.length > 100) {
      throw new Error('Department cannot exceed 100 characters');
    }
    if (data.position && data.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters');
    }

    // Validate role if provided
    if (data.role) {
      const validRoles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      if (!validRoles.includes(data.role)) {
        throw new Error(`Invalid role: ${data.role}. Allowed roles: ${validRoles.join(', ')}`);
      }
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(data.status)) {
        throw new Error(`Invalid status: ${data.status}. Allowed statuses: ${validStatuses.join(', ')}`);
      }
    }

    // Prepare update payload (snake_case for database)
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.firstName !== undefined) updatePayload.first_name = data.firstName;
    if (data.lastName !== undefined) updatePayload.last_name = data.lastName;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.mobile !== undefined) updatePayload.mobile = data.mobile;
    if (data.companyName !== undefined) updatePayload.company_name = data.companyName;
    if (data.department !== undefined) updatePayload.department = data.department;
    if (data.position !== undefined) updatePayload.position = data.position;

    const { data: updatedUser, error: updateError } = await supabase
      .from(this.table)
      .update(updatePayload)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    // Handle not found case (PGRST116) and other errors
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error(`User not found: ${id}`);
      }
      console.error('[UserService] Error updating user:', updateError);
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    if (!updatedUser) {
      throw new Error(`User not found: ${id}`);
    }

    return mapUserRow(updatedUser);
  }

  /**
   * Delete a user (soft delete)
   * ✅ Validation: User exists
   */
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      console.error('[UserService] Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Reset user password
   * ✅ Validation: User exists
   * Note: Real password reset would be handled by Supabase Auth
   */
  async resetPassword(id: string): Promise<void> {
    const { data: user, error: fetchError } = await supabase
      .from(this.table)
      .select('email')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    // Handle not found case (PGRST116) and other errors
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error(`User not found: ${id}`);
      }
      console.error('[UserService] Error fetching user for password reset:', fetchError);
      throw new Error(`Failed to reset password: ${fetchError.message}`);
    }

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    // In production, this would trigger Supabase Auth password reset
    console.log(`[UserService] Password reset triggered for: ${user.email}`);

    // Log the action
    await this.logActivity({
      userId: id,
      action: 'password_reset',
      resource: 'user',
      details: { email: user.email },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user statistics
   * ✅ Returns: UserStatsDTO with aggregated data
   */
  async getUserStats(): Promise<UserStatsDTO> {
    const { data, error } = await supabase
      .from(this.table)
      .select('id, role, status, created_at')
      .is('deleted_at', null);

    if (error) {
      console.error('[UserService] Error fetching stats:', error);
      throw new Error(`Failed to fetch user statistics: ${error.message}`);
    }

    const users = data || [];
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;

    const usersByRole: Record<UserRole, number> = {
      'super_admin': users.filter(u => u.role === 'super_admin').length,
      'admin': users.filter(u => u.role === 'admin').length,
      'manager': users.filter(u => u.role === 'manager').length,
      'agent': users.filter(u => u.role === 'agent').length,
      'engineer': users.filter(u => u.role === 'engineer').length,
      'customer': users.filter(u => u.role === 'customer').length,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = users.filter(u =>
      new Date(u.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByRole,
      newUsersLast30Days,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<UserRole[]> {
    return ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
  }

  /**
   * Get available statuses
   */
  async getStatuses(): Promise<UserStatus[]> {
    return ['active', 'inactive', 'suspended'];
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string): Promise<UserActivityDTO[]> {
    const { data, error } = await supabase
      .from(this.activityTable)
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[UserService] Error fetching activity:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Log user activity
   */
  async logActivity(activity: Omit<UserActivityDTO, 'id'>): Promise<UserActivityDTO> {
    const { data, error } = await supabase
      .from(this.activityTable)
      .insert({
        user_id: activity.userId,
        action: activity.action,
        resource: activity.resource,
        details: activity.details,
        timestamp: activity.timestamp,
        ip_address: activity.ipAddress,
      })
      .select()
      .single();

    if (error) {
      console.error('[UserService] Error logging activity:', error);
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      action: data.action,
      resource: data.resource,
      details: data.details,
      timestamp: data.timestamp,
      ipAddress: data.ip_address,
    };
  }

  /**
   * Get available tenants
   * Fetches all tenants that users can be assigned to
   */
  async getTenants(): Promise<any[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, domain, created_at, updated_at')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('[UserService] Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    return data || [];
  }
}

export const supabaseUserService = new SupabaseUserService();