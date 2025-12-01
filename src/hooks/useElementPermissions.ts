/**
 * Element-level permission hooks
 * Follows strict layer synchronization rules
 */

import { useState, useEffect, useCallback } from 'react';
import { elementPermissionService } from '@/services/serviceFactory';
import { useCurrentUser } from './useCurrentUser';
import { useCurrentTenant } from './useCurrentTenant';
import { PermissionContext } from '@/types/rbac';

export interface UseElementPermissionsReturn {
  hasPermission: (elementPath: string, action: 'visible' | 'enabled' | 'editable' | 'accessible') => boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

/**
 * Hook for element-level permission checking
 */
export const useElementPermissions = (): UseElementPermissionsReturn => {
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();

  const hasPermission = useCallback((
    elementPath: string,
    action: 'visible' | 'enabled' | 'editable' | 'accessible'
  ): boolean | null => {
    const key = `${elementPath}:${action}`;
    return permissions.get(key) ?? null;
  }, [permissions]);

  const evaluatePermission = useCallback(async (
    elementPath: string,
    action: 'visible' | 'enabled' | 'editable' | 'accessible'
  ) => {
    if (!currentUser || !currentTenant) {
      setPermissions(prev => new Map(prev).set(`${elementPath}:${action}`, false));
      return;
    }

    try {
      const context: PermissionContext = {
        user: currentUser,
        tenant: currentTenant,
        elementPath,
        action
      };

      const result = await elementPermissionService.evaluateElementPermission(
        elementPath,
        action,
        context
      );

      setPermissions(prev => new Map(prev).set(`${elementPath}:${action}`, result));
    } catch (err) {
      console.error('[useElementPermissions] Error evaluating permission:', err);
      setError(err instanceof Error ? err.message : 'Permission evaluation failed');
      setPermissions(prev => new Map(prev).set(`${elementPath}:${action}`, false));
    }
  }, [currentUser, currentTenant]);

  const refreshPermissions = useCallback(async () => {
    if (!currentUser || !currentTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear existing permissions
      setPermissions(new Map());

      // Re-evaluate all permissions (this is a simplified approach)
      // In a real implementation, you might want to track which permissions
      // are being used and only refresh those

    } catch (err) {
      console.error('[useElementPermissions] Error refreshing permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh permissions');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentTenant]);

  // Effect to clear cache when user/tenant changes
  useEffect(() => {
    setPermissions(new Map());
    setError(null);
  }, [currentUser?.id, currentTenant?.id]);

  return {
    hasPermission,
    isLoading,
    error,
    refreshPermissions
  };
};

/**
 * Hook for simple permission checking (single permission)
 */
export const usePermission = (
  elementPath: string,
  action: 'visible' | 'enabled' | 'editable' | 'accessible'
): boolean => {
  const [permission, setPermission] = useState<boolean>(false);
  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();

  useEffect(() => {
    const checkPermission = async () => {
      if (!currentUser || !currentTenant) {
        setPermission(false);
        return;
      }

      try {
        const context: PermissionContext = {
          user: currentUser,
          tenant: currentTenant,
          elementPath,
          action
        };

        const result = await elementPermissionService.evaluateElementPermission(
          elementPath,
          action,
          context
        );

        setPermission(result);
      } catch (err) {
        console.error('[usePermission] Error checking permission:', err);
        setPermission(false);
      }
    };

    checkPermission();
  }, [currentUser?.id, currentTenant?.id, elementPath, action]);

  return permission;
};

/**
 * Hook for checking multiple permissions at once
 */
export const useBulkPermissions = (
  permissions: Array<{ elementPath: string; action: 'visible' | 'enabled' | 'editable' | 'accessible' }>
): {
  results: Map<string, boolean>;
  isLoading: boolean;
  error: string | null;
} => {
  const [results, setResults] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser || !currentTenant || permissions.length === 0) {
        const emptyResults = new Map();
        permissions.forEach(({ elementPath, action }) => {
          emptyResults.set(`${elementPath}:${action}`, false);
        });
        setResults(emptyResults);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newResults = new Map<string, boolean>();

        for (const { elementPath, action } of permissions) {
          try {
            const context: PermissionContext = {
              user: currentUser,
              tenant: currentTenant,
              elementPath,
              action
            };

            const result = await elementPermissionService.evaluateElementPermission(
              elementPath,
              action,
              context
            );

            newResults.set(`${elementPath}:${action}`, result);
          } catch (err) {
            console.error(`[useBulkPermissions] Error checking ${elementPath}:${action}:`, err);
            newResults.set(`${elementPath}:${action}`, false);
          }
        }

        setResults(newResults);
      } catch (err) {
        console.error('[useBulkPermissions] Error checking permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to check permissions');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [currentUser, currentTenant, JSON.stringify(permissions)]);

  return { results, isLoading, error };
};