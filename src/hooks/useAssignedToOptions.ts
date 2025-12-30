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
import { userService } from '@/services/serviceFactory';
import { useTenantContext } from './useTenantContext';

export interface AssignedToOption {
  value: string;
  label: string;
  role?: string;
}

export interface AssignedToOptionsResult {
  options: AssignedToOption[];
  labelMap: Record<string, string>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get assignable users for a module
 * @param moduleName - Module name ('leads', 'deals', 'tickets', etc.)
 * @returns Formatted options for Select components
 */
export const useAssignedToOptions = (moduleName: string): AssignedToOptionsResult => {
  const { tenant, tenantId } = useTenantContext();
  const [options, setOptions] = useState<AssignedToOption[]>([]);
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    if (!tenantId || !moduleName) {
      setOptions([]);
      setLabelMap({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Load active tenant users (tenant isolation enforced in service)
      const allUsers = await userService.getUsers({ status: ['active'] as any });

      // Filter to internal roles (exclude customer-facing roles)
      const internalUsers = allUsers.filter(u => u.role !== 'customer');

      // Format for Select component and build label map
      const formattedOptions: AssignedToOption[] = internalUsers
        .map(user => ({
          value: user.id,
          label: user.name || user.email,
          role: user.role
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const map = formattedOptions.reduce<Record<string, string>>((acc, opt) => {
        acc[String(opt.value)] = opt.label;
        return acc;
      }, {});

      setOptions(formattedOptions);
      setLabelMap(map);
    } catch (err) {
      console.error('[useAssignedToOptions] Error loading options:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignable users');
      setOptions([]);
      setLabelMap({});
    } finally {
      setLoading(false);
    }
  }, [tenantId, moduleName]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    options,
    labelMap,
    loading,
    error,
    refresh: loadOptions
  };
};

/**
 * Hook variant: Return users with full details (for advanced use cases)
 */
export const useAssignableUsersDetailed = (moduleName: string) => {
  const { tenantId } = useTenantContext();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!tenantId || !moduleName) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allUsers = await userService.getUsers({ status: ['active'] as any });
      const internalUsers = allUsers.filter(u => u.role !== 'customer');
      setUsers(internalUsers.map(u => ({ id: u.id, name: u.name || u.email, email: u.email, role: u.role as string })));
    } catch (err) {
      console.error('[useAssignableUsersDetailed] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, moduleName]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, refresh: loadUsers };
};
