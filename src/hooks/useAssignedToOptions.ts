/**
 * useAssignedToOptions Hook
 * Generic hook for "Assigned To" dropdowns across all modules
 * 
 * ✅ Database-driven role configuration
 * ✅ Tenant-specific assignable users
 * ✅ Consistent across all modules
 * 
 * Replaces module-specific implementations with unified pattern
 * 
 * Usage:
 *   const { options, loading } = useAssignedToOptions('leads');
 *   <Select options={options} loading={loading} />
 */

import { useState, useEffect, useCallback } from 'react';
import { roleService } from '@/services/roleService';
import { useTenantContext } from './useTenantContext';

export interface AssignedToOption {
  value: string;
  label: string;
  role?: string;
}

/**
 * Hook to get assignable users for a module
 * @param moduleName - Module name ('leads', 'deals', 'tickets', etc.)
 * @returns Formatted options for Select components
 */
export const useAssignedToOptions = (moduleName: string) => {
  const { currentTenant } = useTenantContext();
  const [options, setOptions] = useState<AssignedToOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    if (!currentTenant?.id || !moduleName) {
      setOptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useAssignedToOptions] Loading assignable users:', {
        tenantId: currentTenant.id,
        moduleName
      });

      // Get assignable users from role service
      const users = await roleService.getAssignableUsers(currentTenant.id, moduleName);

      // Format for Select component
      const formattedOptions: AssignedToOption[] = users.map(user => ({
        value: user.id,
        label: user.name || user.email,
        role: user.role
      }));

      console.log('[useAssignedToOptions] Loaded options:', {
        count: formattedOptions.length,
        roles: [...new Set(users.map(u => u.role))]
      });

      setOptions(formattedOptions);
    } catch (err) {
      console.error('[useAssignedToOptions] Error loading options:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignable users');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, moduleName]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    options,
    loading,
    error,
    refresh: loadOptions
  };
};

/**
 * Hook variant: Return users with full details (for advanced use cases)
 */
export const useAssignableUsersDetailed = (moduleName: string) => {
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
      console.error('[useAssignableUsersDetailed] Error:', err);
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
