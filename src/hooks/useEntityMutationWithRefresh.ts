/**
 * Generic hook for entity mutations with automatic ModuleDataProvider refresh
 * 
 * ✅ USE THIS FOR: All CRUD operations that need UI refresh
 * ✅ BENEFITS:
 *   - Automatic cache invalidation (React Query + PageDataService)
 *   - Consistent timing for all mutations
 *   - Unified error handling
 *   - Better logging for debugging
 * 
 * @example
 * const { handleCreate, handleUpdate, handleDelete } = useEntityMutationWithRefresh({
 *   createMutation,
 *   updateMutation,
 *   deleteMutation,
 *   refresh,
 *   entityName: 'Customer'
 * });
 */

import { UseMutationResult } from '@tanstack/react-query';
import { useCallback } from 'react';

interface UseEntityMutationWithRefreshProps<T, TCreate, TUpdate> {
  createMutation?: UseMutationResult<T, Error, TCreate, unknown>;
  updateMutation?: UseMutationResult<T, Error, { id: string; data: TUpdate }, unknown>;
  deleteMutation?: UseMutationResult<void, Error, string, unknown>;
  refresh: () => Promise<void>;
  entityName?: string;
  waitTimeMs?: number; // Time to wait for cache invalidation (default: 150ms)
  onSuccess?: (operation: 'create' | 'update' | 'delete', data?: T) => void;
  onError?: (operation: 'create' | 'update' | 'delete', error: Error) => void;
}

export function useEntityMutationWithRefresh<T, TCreate = Partial<T>, TUpdate = Partial<T>>({
  createMutation,
  updateMutation,
  deleteMutation,
  refresh,
  entityName = 'Entity',
  waitTimeMs = 150,
  onSuccess,
  onError,
}: UseEntityMutationWithRefreshProps<T, TCreate, TUpdate>) {
  
  /**
   * Handle create operation with automatic refresh
   */
  const handleCreate = useCallback(async (data: TCreate): Promise<T | undefined> => {
    console.log(`[${entityName}] 🆕 CREATE started`);
    
    if (!createMutation) {
      console.error(`[${entityName}] ❌ Create mutation not provided`);
      return;
    }
    
    try {
      // Execute mutation (this triggers onSuccess which calls invalidateQueries)
      const result = await createMutation.mutateAsync(data);
      console.log(`[${entityName}] ✅ Create mutation completed`);
      
      // CRITICAL: Wait for React Query cache invalidation to complete
      // invalidateQueries is async, so we need to wait before refreshing PageDataService
      console.log(`[${entityName}] ⏱️  Waiting ${waitTimeMs}ms for cache invalidation...`);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      console.log(`[${entityName}] ⏱️  Wait complete`);
      
      // Now refresh PageDataService cache
      console.log(`[${entityName}] 🔄 Calling refresh()...`);
      await refresh();
      console.log(`[${entityName}] ✅ Refresh completed`);
      
      onSuccess?.('create', result);
      return result;
    } catch (error) {
      console.error(`[${entityName}] ❌ Create failed:`, error);
      onError?.('create', error as Error);
      throw error;
    }
  }, [createMutation, refresh, entityName, waitTimeMs, onSuccess, onError]);

  /**
   * Handle update operation with automatic refresh
   */
  const handleUpdate = useCallback(async (id: string, data: TUpdate): Promise<T | undefined> => {
    console.log(`[${entityName}] 📝 UPDATE started for ID: ${id}`);
    
    if (!updateMutation) {
      console.error(`[${entityName}] ❌ Update mutation not provided`);
      return;
    }
    
    try {
      // Execute mutation (this triggers onSuccess which calls invalidateQueries)
      const result = await updateMutation.mutateAsync({ id, data });
      console.log(`[${entityName}] ✅ Update mutation completed`);
      
      // CRITICAL: Wait for React Query cache invalidation to complete
      console.log(`[${entityName}] ⏱️  Waiting ${waitTimeMs}ms for cache invalidation...`);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      console.log(`[${entityName}] ⏱️  Wait complete`);
      
      // Now refresh PageDataService cache
      console.log(`[${entityName}] 🔄 Calling refresh()...`);
      await refresh();
      console.log(`[${entityName}] ✅ Refresh completed`);
      
      onSuccess?.('update', result);
      return result;
    } catch (error) {
      console.error(`[${entityName}] ❌ Update failed:`, error);
      onError?.('update', error as Error);
      throw error;
    }
  }, [updateMutation, refresh, entityName, waitTimeMs, onSuccess, onError]);

  /**
   * Handle delete operation with automatic refresh
   */
  const handleDelete = useCallback(async (id: string): Promise<void> => {
    console.log(`[${entityName}] 🗑️  DELETE started for ID: ${id}`);
    
    if (!deleteMutation) {
      console.error(`[${entityName}] ❌ Delete mutation not provided`);
      return;
    }
    
    try {
      // Execute mutation (this triggers onSuccess which calls invalidateQueries)
      await deleteMutation.mutateAsync(id);
      console.log(`[${entityName}] ✅ Delete mutation completed`);
      
      // CRITICAL: Wait for React Query cache invalidation to complete
      console.log(`[${entityName}] ⏱️  Waiting ${waitTimeMs}ms for cache invalidation...`);
      await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      console.log(`[${entityName}] ⏱️  Wait complete`);
      
      // Now refresh PageDataService cache
      console.log(`[${entityName}] 🔄 Calling refresh()...`);
      await refresh();
      console.log(`[${entityName}] ✅ Refresh completed`);
      
      onSuccess?.('delete');
    } catch (error) {
      console.error(`[${entityName}] ❌ Delete failed:`, error);
      onError?.('delete', error as Error);
      throw error;
    }
  }, [deleteMutation, refresh, entityName, waitTimeMs, onSuccess, onError]);

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    isCreating: createMutation?.isPending ?? false,
    isUpdating: updateMutation?.isPending ?? false,
    isDeleting: deleteMutation?.isPending ?? false,
  };
}
