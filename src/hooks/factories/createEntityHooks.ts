/**
 * Entity Hooks Factory
 * Layer 6: React hooks layer - Factory for generating standardized entity hooks
 * 
 * This factory creates a complete set of hooks for any entity using TanStack Query,
 * with proper cache invalidation, loading states, and error handling.
 * 
 * Usage example:
 * ```typescript
 * const auditLogHooks = createEntityHooks({
 *   entityName: 'audit-log',
 *   service: auditLogService,
 *   queryKeys: {
 *     all: ['audit-logs'],
 *     detail: (id: string) => ['audit-logs', id],
 *     list: (filters: QueryFilters) => ['audit-logs', 'list', filters]
 *   }
 * });
 * 
 * // In components:
 * const { data, loading, error } = auditLogHooks.useEntities({ page: 1, limit: 10 });
 * const { data: entity } = auditLogHooks.useEntity(entityId);
 * const createMutation = auditLogHooks.useCreateEntity();
 * ```
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { GenericCrudService } from '@/services/core/GenericCrudService';
import { QueryFilters, ServiceContext, EntityHooksConfig } from '@/types/generic';
import { ServiceError } from '@/services/core/errors';
import { useNotification } from '@/hooks/useNotification';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

/**
 * Entity hooks return type
 */
interface EntityHooks<T> {
  useEntities: (filters?: QueryFilters) => UseQueryResult<{ data: T[]; total: number }, Error>;
  useEntity: (id: string | undefined) => UseQueryResult<T, Error>;
  useCreateEntity: () => UseMutationResult<T, Error, Partial<T>, unknown>;
  useUpdateEntity: () => UseMutationResult<T, Error, { id: string; data: Partial<T> }, unknown>;
  useDeleteEntity: () => UseMutationResult<void, Error, string, unknown>;
}

/**
 * Create entity hooks factory
 * 
 * @param config Configuration for the entity hooks
 * @returns Set of standardized hooks for the entity
 */
export function createEntityHooks<T>(
  config: EntityHooksConfig<T>
): EntityHooks<T> {
  const { entityName, service, queryKeys, options } = config;

  /**
   * Hook: Get list of entities with filtering, pagination, and search
   */
  const useEntities = (filters?: QueryFilters): UseQueryResult<{ data: T[]; total: number }, Error> => {
    const user = useCurrentUser();
    const currentTenant = useCurrentTenant();
    
    const context: ServiceContext = {
      userId: user?.id,
      tenantId: currentTenant?.id || user?.tenantId
    };

    return useQuery({
      queryKey: queryKeys.list(filters || {}),
      queryFn: async () => {
        try {
          return await service.getAll(filters || {}, context);
        } catch (error) {
          if (error instanceof ServiceError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },
      enabled: !!user && (options?.enabledByDefault ?? true),
      staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
      retry: options?.retry ?? 1
    });
  };

  /**
   * Hook: Get single entity by ID
   */
  const useEntity = (id: string | undefined): UseQueryResult<T, Error> => {
    const user = useCurrentUser();
    const currentTenant = useCurrentTenant();

    const context: ServiceContext = {
      userId: user?.id,
      tenantId: currentTenant?.id || user?.tenantId
    };

    return useQuery({
      queryKey: queryKeys.detail(id!),
      queryFn: async () => {
        try {
          return await service.getById(id!, context);
        } catch (error) {
          if (error instanceof ServiceError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },
      enabled: !!id && !!user,
      staleTime: options?.staleTime ?? 5 * 60 * 1000,
      retry: options?.retry ?? 1
    });
  };

  /**
   * Hook: Create new entity
   */
  const useCreateEntity = (): UseMutationResult<T, Error, Partial<T>, unknown> => {
    const queryClient = useQueryClient();
    const { success, error } = useNotification();
    const user = useCurrentUser();
    const currentTenant = useCurrentTenant();

    const context: ServiceContext = {
      userId: user?.id,
      tenantId: currentTenant?.id || user?.tenantId
    };

    return useMutation({
      mutationFn: async (data: Partial<T>) => {
        try {
          return await service.create(data, context);
        } catch (error) {
          if (error instanceof ServiceError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },
      onSuccess: (data) => {
        // Invalidate list queries (use exact: false to match all list queries with different filters)
        queryClient.invalidateQueries({ queryKey: queryKeys.all, exact: false });
        
        // Optionally show success notification
        if (options?.showSuccessNotification ?? true) {
          success(`${entityName} created successfully`);
        }
        
        // Call custom success handler
        if (options?.onCreateSuccess) {
          options.onCreateSuccess(data);
        }
      },
      onError: (err) => {
        // Show error notification
        if (options?.showErrorNotification ?? true) {
          error(`Failed to create ${entityName}: ${err.message}`);
        }
        
        // Call custom error handler
        if (options?.onCreateError) {
          options.onCreateError(err);
        }
      }
    });
  };

  /**
   * Hook: Update existing entity
   */
  const useUpdateEntity = (): UseMutationResult<T, Error, { id: string; data: Partial<T> }, unknown> => {
    const queryClient = useQueryClient();
    const { success, error } = useNotification();
    const user = useCurrentUser();
    const currentTenant = useCurrentTenant();

    const context: ServiceContext = {
      userId: user?.id,
      tenantId: currentTenant?.id || user?.tenantId
    };

    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
        try {
          return await service.update(id, data, context);
        } catch (error) {
          if (error instanceof ServiceError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },
      onSuccess: (data, variables) => {
        // Invalidate list queries (use exact: false to match all list queries with different filters)
        queryClient.invalidateQueries({ queryKey: queryKeys.all, exact: false });
        
        // Optionally invalidate detail query for this entity
        if (options?.invalidateDetailOnUpdate ?? true) {
          queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.id) });
        }
        
        // Optionally show success notification
        if (options?.showSuccessNotification ?? true) {
          success(`${entityName} updated successfully`);
        }
        
        // Call custom success handler
        if (options?.onUpdateSuccess) {
          options.onUpdateSuccess(data);
        }
      },
      onError: (err) => {
        // Show error notification
        if (options?.showErrorNotification ?? true) {
          error(`Failed to update ${entityName}: ${err.message}`);
        }
        
        // Call custom error handler
        if (options?.onUpdateError) {
          options.onUpdateError(err);
        }
      }
    });
  };

  /**
   * Hook: Delete entity
   */
  const useDeleteEntity = (): UseMutationResult<void, Error, string, unknown> => {
    const queryClient = useQueryClient();
    const { success, error } = useNotification();
    const user = useCurrentUser();
    const currentTenant = useCurrentTenant();

    const context: ServiceContext = {
      userId: user?.id,
      tenantId: currentTenant?.id || user?.tenantId
    };

    return useMutation({
      mutationFn: async (id: string) => {
        try {
          return await service.delete(id, context);
        } catch (error) {
          if (error instanceof ServiceError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },
      onSuccess: (_, id) => {
        // Invalidate all queries with the entity's base key
        // Use exact: false to match all variations (list with different filters, etc.)
        queryClient.invalidateQueries({ queryKey: queryKeys.all, exact: false });
        
        // Remove detail query for this entity
        queryClient.removeQueries({ queryKey: queryKeys.detail(id) });
        
        // Optionally show success notification
        if (options?.showSuccessNotification ?? true) {
          success(`${entityName} deleted successfully`);
        }
        
        // Call custom success handler
        if (options?.onDeleteSuccess) {
          options.onDeleteSuccess();
        }
      },
      onError: (err) => {
        // Show error notification
        if (options?.showErrorNotification ?? true) {
          error(`Failed to delete ${entityName}: ${err.message}`);
        }
        
        // Call custom error handler
        if (options?.onDeleteError) {
          options.onDeleteError(err);
        }
      }
    });
  };

  return {
    useEntities,
    useEntity,
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity
  };
}
