/**
 * Role Context & Hooks
 * React integration for tenant-aware role management
 * 
 * ✅ Provides role data to components
 * ✅ Caches role configurations
 * ✅ Updates on tenant/user changes
 * 
 * Usage:
 *   const { assignableRoles, loading } = useAssignableRoles('leads');
 *   const { tenantRoles } = useTenantRoles();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { roleService, TenantRole, AssignableRole } from '@/services/roleService';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantContext } from '@/hooks/useTenantContext';

interface RoleContextValue {
  tenantRoles: TenantRole[];
  loading: boolean;
  error: string | null;
  refreshRoles: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/**
 * Role Provider
 * Manages tenant role state and distribution
 */
export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentTenant } = useTenantContext();
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!currentTenant?.id) {
      setTenantRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const roles = await roleService.getTenantRoles(currentTenant.id);
      setTenantRoles(roles);
    } catch (err) {
      console.error('[RoleContext] Error loading roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      setTenantRoles([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  const refreshRoles = useCallback(async () => {
    if (currentTenant?.id) {
      roleService.clearCache(currentTenant.id);
      await loadRoles();
    }
  }, [currentTenant?.id, loadRoles]);

  // Load roles when tenant changes
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const value: RoleContextValue = {
    tenantRoles,
    loading,
    error,
    refreshRoles
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

/**
 * Hook: useTenantRoles
 * Access all roles for current tenant
 */
export const useTenantRoles = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useTenantRoles must be used within RoleProvider');
  }
  return context;
};

/**
 * Hook: useAssignableRoles
 * Get roles that can be assigned to entities in a module
 */
export const useAssignableRoles = (moduleName: string) => {
  const { currentTenant } = useTenantContext();
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignableRoles = useCallback(async () => {
    if (!currentTenant?.id || !moduleName) {
      setAssignableRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const roles = await roleService.getAssignableRoles(currentTenant.id, moduleName);
      setAssignableRoles(roles);
    } catch (err) {
      console.error('[useAssignableRoles] Error loading assignable roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignable roles');
      setAssignableRoles([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, moduleName]);

  useEffect(() => {
    loadAssignableRoles();
  }, [loadAssignableRoles]);

  return { assignableRoles, loading, error, refresh: loadAssignableRoles };
};

/**
 * Hook: useAssignableUsers
 * Get users with assignable roles for a module (for dropdowns)
 */
export const useAssignableUsers = (moduleName: string) => {
  const { currentTenant } = useTenantContext();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!currentTenant?.id || !moduleName) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const assignableUsers = await roleService.getAssignableUsers(currentTenant.id, moduleName);
      setUsers(assignableUsers);
    } catch (err) {
      console.error('[useAssignableUsers] Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, moduleName]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, refresh: loadUsers };
};

/**
 * Hook: useRolePermissions
 * Get permissions for a specific role
 */
export const useRolePermissions = (roleId: string | null) => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roleId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const perms = await roleService.getRolePermissions(roleId);
        setPermissions(perms);
      } catch (err) {
        console.error('[useRolePermissions] Error loading permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [roleId]);

  return { permissions, loading, error };
};
