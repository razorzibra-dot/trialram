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

import { supabase } from '@/services/supabase/client';
import { authService } from '../../serviceFactory';
import {
  mapUserRoleToDatabaseRole,
  getValidUserRoles,
  isValidUserRole,
  isPlatformRoleByName,
} from '@/utils/roleMapping';
import { isSuperAdmin } from '@/utils/tenantIsolation';
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

const USER_SELECT_COLUMNS = `
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
  deleted_at,
  user_roles:user_roles!user_roles_user_id_fkey (
    role:roles!user_roles_role_id_fkey (
      name
    )
  )
`;

/**
 * Centralized row mapper for database to DTO transformation
 * CRITICAL: Keep synchronized with database schema and UserDTO interface
 * Now extracts role from user_roles relationship
 */
function mapUserRow(dbRow: any): UserDTO {
  const metadata = dbRow?.metadata || {};

  // Extract primary role from user_roles (take first one, or default to 'user')
  // Uses dynamic database-driven role mapping (synchronous normalization for mapping)
  let role: UserRole = 'user';
  if (dbRow.user_roles && dbRow.user_roles.length > 0) {
    const primaryRole = dbRow.user_roles[0]?.role?.name;
    if (primaryRole) {
      // Normalize role name directly (synchronous operation for mapping)
      // Full validation happens when roles are fetched from database
      const normalized = primaryRole.toLowerCase().trim();
      role = (normalized as UserRole) || 'user';
    }
  }

  return {
    id: dbRow.id,
    email: dbRow.email,
    name: dbRow.name,
    firstName: dbRow.first_name,
    lastName: dbRow.last_name,
    role: role,
    status: dbRow.status,
    tenantId: dbRow.tenant_id,
    avatarUrl: dbRow.avatar_url,
    phone: dbRow.phone,
    mobile: metadata.mobile,
    companyName: metadata.companyName,
    department: dbRow.department,
    position: dbRow.position,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    lastLogin: dbRow.last_login,
    createdBy: dbRow.created_by,
    deletedAt: dbRow.deleted_at,
    // MFA fields
    mfaSecret: dbRow.mfa_secret,
    mfaBackupCodes: dbRow.mfa_backup_codes,
    mfaMethod: dbRow.mfa_method,
    // Session management
    sessionToken: dbRow.session_token,
    sessionExpiresAt: dbRow.session_expires_at,
    concurrentSessionsLimit: dbRow.concurrent_sessions_limit,
    // Security audit fields
    failedLoginAttempts: dbRow.failed_login_attempts,
    lockedUntil: dbRow.locked_until,
    lastFailedLogin: dbRow.last_failed_login,
    passwordChangedAt: dbRow.password_changed_at,
    lastPasswordReset: dbRow.last_password_reset,
    securityQuestions: dbRow.security_questions,
    // Password policy
    passwordStrengthScore: dbRow.password_strength_score,
    passwordExpiresAt: dbRow.password_expires_at,
    requirePasswordChange: dbRow.require_password_change,
    // Account lockout
    accountLocked: dbRow.account_locked,
    lockReason: dbRow.lock_reason,
    // Security monitoring
    suspiciousActivityCount: dbRow.suspicious_activity_count,
    lastSuspiciousActivity: dbRow.last_suspicious_activity,
    securityAlertsEnabled: dbRow.security_alerts_enabled,
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
   * ⭐ SECURITY: Enforces tenant isolation - tenant admins only see their tenant's users
   */
  async getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]> {
    // ⭐ SECURITY: Apply tenant isolation
    const currentUser = authService.getCurrentUser();
    const currentTenantId = authService.getCurrentTenantId();

    let query = supabase
      .from(this.table)
      .select(USER_SELECT_COLUMNS)
      .is('deleted_at', null) // Soft delete filter
      .order('created_at', { ascending: false });

    // ⭐ SECURITY: Tenant isolation - non-super-admins can only see users in their tenant
    // Uses systematic tenant isolation utility instead of hardcoded permission check
    if (!isSuperAdmin(currentUser)) {
      if (currentTenantId) {
        query = query.eq('tenant_id', currentTenantId);
      } else {
        // If user has no tenant but isn't super admin, return empty (shouldn't happen)
        console.warn('[SECURITY] Non-super-admin user has no tenant ID');
        return [];
      }
    }
    // Super admins can see all users (no tenant filter)

    // Apply filters
    let roleFilterSet: Set<UserRole> | null = null;
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.role && filters.role.length > 0) {
        roleFilterSet = new Set(filters.role);
      }
      if (filters.department && filters.department.length > 0) {
        query = query.in('department', filters.department);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
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

    let users = (data || []).map(mapUserRow);

    if (roleFilterSet && roleFilterSet.size > 0) {
      users = users.filter((user) => roleFilterSet?.has(user.role));
    }

    return users;
  }

  /**
    * Get a single user by ID
    * ✅ Returns: UserDTO
    * ✅ Validation: Throws on not found
    * ⭐ SECURITY: Enforces tenant isolation - users can only access users in their tenant
    */
   async getUser(id: string): Promise<UserDTO> {
     // ⭐ SECURITY: First, validate tenant access by getting the target user
     const currentUser = authService.getCurrentUser();
     const currentTenantId = authService.getCurrentTenantId();

    let query = supabase
      .from(this.table)
      .select(USER_SELECT_COLUMNS)
       .eq('id', id)
       .is('deleted_at', null);

     // ⭐ SECURITY: Tenant isolation - non-super-admins can only access users in their tenant
     // Uses systematic tenant isolation utility instead of hardcoded permission check
     if (!isSuperAdmin(currentUser)) {
       if (currentTenantId) {
         query = query.eq('tenant_id', currentTenantId);
       } else {
         // If user has no tenant but isn't super admin, deny access
         console.warn('[SECURITY] Non-super-admin user has no tenant ID, denying access');
         throw new Error('Access denied: Invalid tenant context');
       }
     }
     // Super admins can access any user (no tenant filter)

     const { data, error } = await query.single();

     // Handle not found case (PGRST116) and other errors
     if (error) {
       if (error.code === 'PGRST116') {
         // Don't reveal if user exists in different tenant - generic error
         throw new Error('User not found or access denied');
       }
       console.error('[UserService] Error fetching user:', error);
       throw new Error(`Failed to fetch user: ${error.message}`);
     }

     if (!data) {
       throw new Error('User not found or access denied');
     }

     return mapUserRow(data);
   }

  /**
    * Create a new user
    * ✅ Returns: Created UserDTO with generated id and timestamps
    * ✅ Validation: Email uniqueness, required fields, field lengths, role/status values
    * ⭐ SECURITY: Enforces tenant isolation - tenant admins can only create users in their tenant
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

     // ⭐ SECURITY: Determine tenant assignment based on current user's permissions
     const currentUser = authService.getCurrentUser();
     const currentTenantId = authService.getCurrentTenantId();
     let assignedTenantId: string | null = null;

     // Uses systematic tenant isolation utility instead of hardcoded permission check
     if (isSuperAdmin(currentUser)) {
       // Super admins can assign users to any tenant or make them platform-wide
       // For now, super admins creating users will assign them to their current tenant context
       // TODO: Add tenant selection UI for super admins
       assignedTenantId = currentTenantId;
     } else {
       // Tenant admins can only create users in their own tenant
       assignedTenantId = currentTenantId;
       if (!assignedTenantId) {
         throw new Error('Cannot create user: Current user has no tenant assignment');
       }
     }

     // Validate tenant access if assigning to a specific tenant
     if (assignedTenantId) {
       authService.assertTenantAccess(assignedTenantId);
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

     // Validate role using dynamic database-driven utility
     const isValid = await isValidUserRole(data.role);
     if (!isValid) {
       const validRoles = await getValidUserRoles();
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

     // Insert new user (without role column)
     const now = new Date().toISOString();
    const { data: createdUser, error: insertError } = await supabase
      .from(this.table)
      .insert({
        email: data.email,
        name: data.name,
        first_name: data.firstName,
        last_name: data.lastName,
        status: data.status,
        tenant_id: assignedTenantId,
        avatar_url: data.avatarUrl,
        phone: data.phone,
        department: data.department,
        position: data.position,
        created_at: now,
        updated_at: now,
        last_login: now,
      })
      .select(USER_SELECT_COLUMNS)
      .single();

     if (insertError) {
       console.error('[UserService] Error creating user:', insertError);
       throw new Error(`Failed to create user: ${insertError.message}`);
     }

     // Assign role via user_roles table
     // Uses dynamic database-driven role mapping
     const dbRoleName = await mapUserRoleToDatabaseRole(data.role);
     if (dbRoleName) {
       // Check if role is platform role to determine tenant_id
       const isPlatform = await isPlatformRoleByName(data.role);
       const roleTenantId = isPlatform ? null : assignedTenantId;
       
       // Get role ID with tenant_id filter
       let roleQuery = supabase
         .from('roles')
         .select('id')
         .eq('name', dbRoleName);
       
       // Apply tenant_id filter based on platform role check
       if (roleTenantId === null) {
         roleQuery = roleQuery.is('tenant_id', null);
       } else {
         roleQuery = roleQuery.eq('tenant_id', roleTenantId);
       }
       
       const { data: roleData } = await roleQuery.single();

       if (roleData) {
         // Assign role
         await supabase
           .from('user_roles')
           .insert({
             user_id: createdUser.id,
             role_id: roleData.id,
             tenant_id: assignedTenantId,
             assigned_by: currentUser?.id,
             assigned_at: now
           });
       }
     }

     // Return user with role information
     return this.getUser(createdUser.id);
   }

  /**
   * Update a user
   * ✅ Returns: Updated UserDTO
   * ✅ Validation: Email uniqueness if updated, field lengths, role/status values
   * ⭐ SECURITY: Enforces tenant isolation - tenant admins can only update users in their tenant
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    // ⭐ SECURITY: First, get the target user to validate tenant access
    const targetUser = await this.getUser(id);
    if (!targetUser) {
      throw new Error(`User not found: ${id}`);
    }

    // ⭐ SECURITY: Validate tenant access
    authService.assertTenantAccess(targetUser.tenantId);

    // ⭐ SECURITY: Prevent tenant admins from changing tenant assignments
    const currentUser = authService.getCurrentUser();
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
    if (data.department && data.department.length > 100) {
      throw new Error('Department cannot exceed 100 characters');
    }
    if (data.position && data.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters');
    }

    // Validate role if provided using dynamic database-driven utility
    if (data.role) {
      const isValid = await isValidUserRole(data.role);
      if (!isValid) {
        const validRoles = await getValidUserRoles();
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
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.department !== undefined) updatePayload.department = data.department;
    if (data.position !== undefined) updatePayload.position = data.position;

    // Handle role updates via user_roles table
    // Uses dynamic database-driven role mapping
    if (data.role !== undefined) {
      const dbRoleName = await mapUserRoleToDatabaseRole(data.role);
      if (dbRoleName) {
        // Check if role is platform role to determine tenant_id
        const isPlatform = await isPlatformRoleByName(data.role);
        const roleTenantId = isPlatform ? null : targetUser.tenantId;
        
        // Get new role ID
        let roleQuery = supabase
          .from('roles')
          .select('id')
          .eq('name', dbRoleName);
        
        // Apply tenant_id filter based on platform role check
        if (roleTenantId === null) {
          roleQuery = roleQuery.is('tenant_id', null);
        } else {
          roleQuery = roleQuery.eq('tenant_id', roleTenantId);
        }
        
        const { data: roleData } = await roleQuery.single();

        if (roleData) {
          // Remove existing role assignments for this user
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', id);

          // Assign new role
          await supabase
            .from('user_roles')
            .insert({
              user_id: id,
              role_id: roleData.id,
              tenant_id: targetUser.tenantId,
              assigned_by: currentUser?.id,
              assigned_at: new Date().toISOString()
            });
        }
      }
    }

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
   * ⭐ SECURITY: Enforces tenant isolation - tenant admins can only delete users in their tenant
   */
  async deleteUser(id: string): Promise<void> {
    // ⭐ SECURITY: First, get the target user to validate tenant access
    const targetUser = await this.getUser(id);
    if (!targetUser) {
      throw new Error(`User not found: ${id}`);
    }

    // ⭐ SECURITY: Validate tenant access
    authService.assertTenantAccess(targetUser.tenantId);

    // ⭐ SECURITY: Prevent tenant admins from deleting other admins
    // Uses systematic tenant isolation utility instead of hardcoded role check
    const currentUser = authService.getCurrentUser();
    if (!isSuperAdmin(currentUser) && targetUser.role === 'admin') {
      throw new Error('Access denied: Cannot delete admin users');
    }

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
    * ⭐ SECURITY: Enforces tenant isolation - can only reset passwords for users in same tenant
    * Note: Real password reset would be handled by Supabase Auth
    */
   async resetPassword(id: string): Promise<void> {
     // ⭐ SECURITY: First, validate tenant access by getting the target user
     const currentUser = authService.getCurrentUser();
     const currentTenantId = authService.getCurrentTenantId();

     let query = supabase
       .from(this.table)
       .select('email, tenant_id')
       .eq('id', id)
       .is('deleted_at', null);

     // ⭐ SECURITY: Tenant isolation - non-super-admins can only reset passwords for users in their tenant
     // Uses systematic tenant isolation utility instead of hardcoded role check
     if (!isSuperAdmin(currentUser)) {
       if (currentTenantId) {
         query = query.eq('tenant_id', currentTenantId);
       } else {
         // If user has no tenant but isn't super admin, deny access
         console.warn('[SECURITY] Non-super-admin user has no tenant ID, denying password reset');
         throw new Error('Access denied: Invalid tenant context');
       }
     }
     // Super admins can reset passwords for any user (no tenant filter)

     const { data: user, error: fetchError } = await query.single();

     // Handle not found case (PGRST116) and other errors
     if (fetchError) {
       if (fetchError.code === 'PGRST116') {
         // Don't reveal if user exists in different tenant - generic error
         throw new Error('User not found or access denied');
       }
       console.error('[UserService] Error fetching user for password reset:', fetchError);
       throw new Error(`Failed to reset password: ${fetchError.message}`);
     }

     if (!user) {
       throw new Error('User not found or access denied');
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
    * ⭐ SECURITY: Enforces tenant isolation - non-super-admins see only their tenant's stats
    */
   async getUserStats(): Promise<UserStatsDTO> {
     // ⭐ SECURITY: Apply tenant isolation
     const currentUser = authService.getCurrentUser();
     const currentTenantId = authService.getCurrentTenantId();

     let query = supabase
       .from(this.table)
       .select(`
         id,
         status,
         created_at,
         tenant_id,
        user_roles:user_roles!user_roles_user_id_fkey (
          role:roles!user_roles_role_id_fkey (
            name
          )
        )
       `)
       .is('deleted_at', null);

     // ⭐ SECURITY: Tenant isolation - non-super-admins can only see stats for their tenant
     // Uses systematic tenant isolation utility instead of hardcoded permission check
     if (!isSuperAdmin(currentUser)) {
       if (currentTenantId) {
         query = query.eq('tenant_id', currentTenantId);
       } else {
         // If user has no tenant but isn't super admin, return empty stats
         console.warn('[SECURITY] Non-super-admin user has no tenant ID');
         return {
           totalUsers: 0,
           activeUsers: 0,
           inactiveUsers: 0,
           suspendedUsers: 0,
           usersByRole: {
             'super_admin': 0,
             'admin': 0,
             'manager': 0,
             'user': 0,
             'engineer': 0,
             'customer': 0,
           },
           newUsersLast30Days: 0,
           lastUpdated: new Date().toISOString(),
         };
       }
     }
     // Super admins can see all users (no tenant filter)

     const { data, error } = await query;

     if (error) {
       console.error('[UserService] Error fetching stats:', error);
       throw new Error(`Failed to fetch user statistics: ${error.message}`);
     }

     const users = (data || []).map(mapUserRow);
     const totalUsers = users.length;
     const activeUsers = users.filter(u => u.status === 'active').length;
     const inactiveUsers = users.filter(u => u.status === 'inactive').length;
     const suspendedUsers = users.filter(u => u.status === 'suspended').length;

     const usersByRole: Record<UserRole, number> = {
       'super_admin': users.filter(u => u.role === 'super_admin').length,
       'admin': users.filter(u => u.role === 'admin').length,
       'manager': users.filter(u => u.role === 'manager').length,
       'user': users.filter(u => u.role === 'user').length,
       'engineer': users.filter(u => u.role === 'engineer').length,
       'customer': users.filter(u => u.role === 'customer').length,
     };

     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
     const newUsersLast30Days = users.filter(u =>
       new Date(u.createdAt) > thirtyDaysAgo
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
  /**
   * Get available roles for the current user
   * ⚠️ TENANT ISOLATION: Uses systematic tenant isolation utilities
   * Fetches roles from database and filters based on tenant isolation rules
   * Maps database Role records to UserRole type strings
   */
  async getRoles(): Promise<UserRole[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    try {
      // Fetch roles from RBAC service (which applies tenant isolation)
      // Use service factory to get the correct service instance (mock or supabase)
      const { rbacService } = await import('../../serviceFactory');
      const roles = await rbacService.getRoles();

      // Map database Role records to UserRole type strings
      // Uses systematic role mapping utility instead of hardcoded map
      const { getValidUserRolesFromDatabaseRoles } = await import('@/utils/roleMapping');
      const userRoles = getValidUserRolesFromDatabaseRoles(roles);

      // Ensure we have at least the tenant-level roles if no roles were found
      // This is a fallback for edge cases, but should not normally happen
      if (userRoles.length === 0 && currentUser.tenantId) {
        console.warn('[UserService] No roles found from database, attempting to fetch from role mapping utility');
        try {
          const validRoles = await getValidUserRoles();
          // Filter out platform roles for tenant admins
          const { isPlatformRoleByName } = await import('@/utils/roleMapping');
          const filteredRoles: UserRole[] = [];
          for (const role of validRoles) {
            const isPlatform = await isPlatformRoleByName(role);
            if (!isPlatform) {
              filteredRoles.push(role);
            }
          }
          return filteredRoles.length > 0 ? filteredRoles : ['user']; // Fallback to 'user' if all filtered
        } catch (fallbackError) {
          console.error('[UserService] Error in fallback role fetch:', fallbackError);
          return ['user']; // Ultimate fallback
        }
      }

      return userRoles;
    } catch (error) {
      console.error('[UserService] Error fetching roles from RBAC service:', error);
      // Fallback: Return roles based on user's tenant isolation level
      // Uses dynamic database-driven utilities
      try {
        const validRoles = await getValidUserRoles();
        if (isSuperAdmin(currentUser)) {
          return validRoles; // Super admins see all roles
        }
        // Filter out platform roles for tenant admins
        const { isPlatformRoleByName } = await import('@/utils/roleMapping');
        const filteredRoles: UserRole[] = [];
        for (const role of validRoles) {
          const isPlatform = await isPlatformRoleByName(role);
          if (!isPlatform) {
            filteredRoles.push(role);
          }
        }
        return filteredRoles.length > 0 ? filteredRoles : ['user'];
      } catch (fallbackError) {
        console.error('[UserService] Error in fallback role fetch:', fallbackError);
        return ['user']; // Ultimate fallback
      }
    }
  }

  /**
   * Get available statuses
   */
  async getStatuses(): Promise<UserStatus[]> {
    return ['active', 'inactive', 'suspended'];
  }

  /**
    * Get user activity
    * ⭐ SECURITY: Enforces tenant isolation - can only view activity for users in same tenant
    */
   async getUserActivity(userId: string): Promise<UserActivityDTO[]> {
     // ⭐ SECURITY: First, validate tenant access by checking if we can access the target user
     const currentUser = authService.getCurrentUser();
     const currentTenantId = authService.getCurrentTenantId();

     // Check if current user can access the target user's data
     let userQuery = supabase
       .from(this.table)
       .select('tenant_id')
       .eq('id', userId)
       .is('deleted_at', null);

     // Apply tenant filter for non-super-admins
     // Uses systematic tenant isolation utility instead of hardcoded role check
     if (!isSuperAdmin(currentUser)) {
       if (currentTenantId) {
         userQuery = userQuery.eq('tenant_id', currentTenantId);
       } else {
         console.warn('[SECURITY] Non-super-admin user has no tenant ID, denying activity access');
         return [];
       }
     }

     const { data: userData, error: userError } = await userQuery.single();

     if (userError || !userData) {
       // User not found or not accessible
       return [];
     }

     // Now fetch activity for the accessible user
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
   * ⭐ SECURITY: Tenant admins only see their own tenant, super admins see all tenants
   */
  async getTenants(): Promise<any[]> {
    const currentUser = authService.getCurrentUser();
    const currentTenantId = authService.getCurrentTenantId();

    let query = supabase
      .from('tenants')
      .select('id, name, domain, created_at, updated_at')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    // ⭐ SECURITY: Tenant isolation - non-super-admins can only see their own tenant
    // Uses systematic tenant isolation utility instead of hardcoded role check
    if (!isSuperAdmin(currentUser)) {
      if (currentTenantId) {
        query = query.eq('id', currentTenantId);
      } else {
        // If user has no tenant but isn't super admin, return empty
        return [];
      }
    }
    // Super admins can see all tenants (no filter)

    const { data, error } = await query;

    if (error) {
      console.error('[UserService] Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    return data || [];
  }
}

export const supabaseUserService = new SupabaseUserService();