/**
 * RBAC (Role-Based Access Control) Hooks
 * React Query hooks for RBAC operations
 * Follows strict 8-layer architecture:
 * 7. HOOKS: loading/error/data states + cache invalidation
 * 
 * Provides hooks for:
 * - Fetching permissions
 * - Fetching roles
 * - Managing role assignments
 * - Permission validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService } from '@/services/serviceFactory';
import { Permission, Role, UserRole, AuditLog, RoleTemplate, PermissionMatrix } from '@/types/rbac';
import { useAuth } from '@/contexts/AuthContext';

// Query keys for cache management
export const rbacQueryKeys = {
  all: ['rbac'] as const,
  permissions: () => [...rbacQueryKeys.all, 'permissions'] as const,
  roles: (tenantId?: string) => [...rbacQueryKeys.all, 'roles', tenantId] as const,
  role: (roleId: string) => [...rbacQueryKeys.all, 'role', roleId] as const,
  permissionMatrix: (tenantId?: string) => [...rbacQueryKeys.all, 'permissionMatrix', tenantId] as const,
  roleTemplates: () => [...rbacQueryKeys.all, 'roleTemplates'] as const,
  auditLogs: (filters?: Record<string, unknown>) => [...rbacQueryKeys.all, 'auditLogs', filters] as const,
  usersByRole: (roleId: string) => [...rbacQueryKeys.all, 'usersByRole', roleId] as const,
};

/**
 * Hook: Fetch all permissions
 * @returns Query result with permissions array
 */
export function usePermissions() {
  return useQuery({
    queryKey: rbacQueryKeys.permissions(),
    queryFn: () => rbacService.getPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Fetch all roles
 * @param tenantId - Optional tenant ID to filter roles
 * @returns Query result with roles array
 */
export function useRoles(tenantId?: string) {
  const { user } = useAuth();
  const effectiveTenantId = tenantId || user?.tenantId;
  
  return useQuery({
    queryKey: rbacQueryKeys.roles(effectiveTenantId),
    queryFn: () => rbacService.getRoles(effectiveTenantId),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Fetch permission matrix (roles vs permissions)
 * @param tenantId - Optional tenant ID to filter matrix
 * @returns Query result with permission matrix
 */
export function usePermissionMatrix(tenantId?: string) {
  const { user } = useAuth();
  const effectiveTenantId = tenantId || user?.tenantId;
  
  return useQuery({
    queryKey: rbacQueryKeys.permissionMatrix(effectiveTenantId),
    queryFn: () => rbacService.getPermissionMatrix(effectiveTenantId),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Fetch role templates
 * @returns Query result with role templates array
 */
export function useRoleTemplates() {
  return useQuery({
    queryKey: rbacQueryKeys.roleTemplates(),
    queryFn: () => rbacService.getRoleTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes (templates change rarely)
  });
}

/**
 * Hook: Fetch audit logs
 * @param filters - Optional filters for audit logs
 * @returns Query result with audit logs array
 */
export function useAuditLogs(filters?: {
  user_id?: string;
  action?: string;
  resource?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: rbacQueryKeys.auditLogs(filters),
    queryFn: () => rbacService.getAuditLogs(filters),
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 1 * 60 * 1000, // 1 minute (audit logs change frequently)
  });
}

/**
 * Hook: Fetch users by role
 * @param roleId - Role ID to fetch users for
 * @returns Query result with users array
 */
export function useUsersByRole(roleId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: rbacQueryKeys.usersByRole(roleId),
    queryFn: () => rbacService.getUsersByRole(roleId),
    enabled: !!user && !!roleId, // Only fetch if user is authenticated and roleId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Create a new role
 * @returns Mutation for creating a role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>) =>
      rbacService.createRole(roleData),
    onSuccess: () => {
      // Invalidate roles queries to refetch
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.permissionMatrix() });
    },
  });
}

/**
 * Hook: Update a role
 * @returns Mutation for updating a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, updates }: { roleId: string; updates: Partial<Role> }) =>
      rbacService.updateRole(roleId, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific role and roles list
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.role(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.permissionMatrix() });
    },
  });
}

/**
 * Hook: Delete a role
 * @returns Mutation for deleting a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (roleId: string) => rbacService.deleteRole(roleId),
    onSuccess: () => {
      // Invalidate roles queries to refetch
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.permissionMatrix() });
    },
  });
}

/**
 * Hook: Assign role to user
 * @returns Mutation for assigning a role
 */
export function useAssignUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rbacService.assignUserRole(userId, roleId),
    onSuccess: (_, variables) => {
      // Invalidate users by role query
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.usersByRole(variables.roleId) });
      // Also invalidate user-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook: Remove role from user
 * @returns Mutation for removing a role
 */
export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rbacService.removeUserRole(userId, roleId),
    onSuccess: (_, variables) => {
      // Invalidate users by role query
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.usersByRole(variables.roleId) });
      // Also invalidate user-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook: Bulk assign role to multiple users
 * @returns Mutation for bulk assigning a role
 */
export function useBulkAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userIds, roleId }: { userIds: string[]; roleId: string }) =>
      rbacService.bulkAssignRole(userIds, roleId),
    onSuccess: (_, variables) => {
      // Invalidate users by role query
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.usersByRole(variables.roleId) });
      // Also invalidate user-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook: Bulk remove role from multiple users
 * @returns Mutation for bulk removing a role
 */
export function useBulkRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userIds, roleId }: { userIds: string[]; roleId: string }) =>
      rbacService.bulkRemoveRole(userIds, roleId),
    onSuccess: (_, variables) => {
      // Invalidate users by role query
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.usersByRole(variables.roleId) });
      // Also invalidate user-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook: Create role from template
 * @returns Mutation for creating a role from template
 */
export function useCreateRoleFromTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, roleName, tenantId }: { templateId: string; roleName: string; tenantId: string }) =>
      rbacService.createRoleFromTemplate(templateId, roleName, tenantId),
    onSuccess: () => {
      // Invalidate roles queries to refetch
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.permissionMatrix() });
    },
  });
}

/**
 * Hook: Validate role permissions
 * @param actionOrPermissions - Action string or array of permission IDs
 * @param context - Optional context for action-based validation
 * @returns Query result with validation result
 */
export function useValidateRolePermissions(
  actionOrPermissions: string | string[],
  context?: Record<string, any>
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...rbacQueryKeys.all, 'validate', actionOrPermissions, context],
    queryFn: () => rbacService.validateRolePermissions(actionOrPermissions, context),
    enabled: !!user, // Only validate if user is authenticated
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

