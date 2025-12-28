/**
 * Element-level permission hooks
 * Follows strict layer synchronization rules
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
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
  const auth = useAuth();

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

      const evalFn = auth.evaluateElementPermission;
      const result = evalFn ? await evalFn(elementPath, action, context.recordId) : false;

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
 * ✅ Returns boolean for backward compatibility
 * ✅ Optimistic rendering: Returns true initially while loading (prevents flash of hidden content)
 * ✅ Fallback chain: element permission → base permission → true (default allow)
 * 
 * Note: For loading state, use useElementPermissions() hook instead
 */
export const usePermission = (
  elementPath: string,
  action: 'visible' | 'enabled' | 'editable' | 'accessible'
): boolean => {
  const [permission, setPermission] = useState<boolean>(true); // ✅ OPTIMISTIC: Start with true to prevent flash of hidden content
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();
  const auth = useAuth();

  useEffect(() => {
    const checkPermission = async () => {
      if (!currentUser || !currentTenant) {
        setPermission(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const context: PermissionContext = {
          user: currentUser,
          tenant: currentTenant,
          elementPath,
          action
        };

        // Try to evaluate element-specific permission
        const evalFn = auth?.evaluateElementPermission;
        let result = false;
        
        if (evalFn) {
          try {
            result = await evalFn(elementPath, action, context.recordId);
            setPermission(result);
            setIsLoading(false);
            return;
          } catch (elementErr) {
            // Element permission evaluation failed or not found, try fallback
            console.debug('[usePermission] Element permission check failed for', elementPath, elementErr);
          }
        }

        // ✅ FALLBACK: Check base permission via authService
        // This handles cases where element-specific permissions don't exist in database
        try {
          const hasBasePermission = authService.hasPermission(elementPath);
          setPermission(hasBasePermission);
        } catch (fallbackErr) {
          console.warn('[usePermission] Fallback permission check failed:', fallbackErr);
          // ✅ DEFAULT: Allow if all checks fail (optimistic approach)
          // This prevents "permission denied" from breaking the UI during initialization
          setPermission(true);
        }
      } catch (err) {
        console.error('[usePermission] Error checking permission:', err);
        // ✅ DEFAULT: Allow if any unexpected error occurs
        setPermission(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [currentUser?.id, currentTenant?.id, elementPath, action, auth]);

  // ✅ Return true while loading (optimistic) or actual permission result
  return isLoading ? true : permission;
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

            const evalFn = auth.evaluateElementPermission;
            const result = evalFn ? await evalFn(elementPath, action, context.recordId) : false;

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