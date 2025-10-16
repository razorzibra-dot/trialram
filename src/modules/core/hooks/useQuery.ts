/**
 * Enhanced Query Hooks
 * Wrapper around React Query with additional functionality
 */

import { 
  useQuery as useReactQuery, 
  useMutation as useReactMutation,
  useQueryClient,
  QueryKey,
  QueryFunction,
  UseQueryOptions,
  UseMutationOptions,
  MutationFunction,
} from '@tanstack/react-query';
import { useNotifications } from '../store';

// Enhanced query hook with error handling and notifications
export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> & {
    showErrorNotification?: boolean;
    errorMessage?: string;
  }
) {
  const { addNotification } = useNotifications();
  
  const result = useReactQuery({
    queryKey,
    queryFn,
    ...options,
  });

  // Handle errors manually since onError is deprecated
  if (result.error && options?.showErrorNotification !== false) {
    addNotification({
      type: 'error',
      title: 'Error',
      message: options?.errorMessage || (result.error as Error)?.message || 'An error occurred',
    });
  }

  return result;
}

// Enhanced mutation hook with success/error notifications
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext> & {
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const { addNotification } = useNotifications();
  
  return useReactMutation({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      if (options?.showSuccessNotification) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: options?.successMessage || 'Operation completed successfully',
        });
      }
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: options?.errorMessage || (error as Error)?.message || 'An error occurred',
        });
      }
      options?.onError?.(error, variables, context);
    },
  });
}

// Optimistic update helper
export function useOptimisticMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    queryKey: QueryKey;
    updateFn: (oldData: any, variables: TVariables) => any;
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  
  return useReactMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(options.queryKey);
      
      // Optimistically update
      queryClient.setQueryData(options.queryKey, (oldData: any) => 
        options.updateFn(oldData, variables)
      );
      
      // Return context with previous data
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
      
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: options?.errorMessage || (error as Error)?.message || 'An error occurred',
        });
      }
      
      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (options?.showSuccessNotification) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: options?.successMessage || 'Operation completed successfully',
        });
      }
      options?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      options?.onSettled?.(data, error, variables, context);
    },
  });
}

// Infinite query hook
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: any
) {
  const { addNotification } = useNotifications();
  
  return useReactQuery({
    queryKey,
    queryFn,
    ...options,
    onError: (error: any) => {
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: options?.errorMessage || error?.message || 'An error occurred',
        });
      }
      options?.onError?.(error);
    },
  });
}

// Query invalidation helpers
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidate: (queryKey: QueryKey) => queryClient.invalidateQueries({ queryKey }),
    invalidateAll: () => queryClient.invalidateQueries(),
    refetch: (queryKey: QueryKey) => queryClient.refetchQueries({ queryKey }),
    remove: (queryKey: QueryKey) => queryClient.removeQueries({ queryKey }),
    clear: () => queryClient.clear(),
  };
}

// Cache management hooks
export function useQueryCache() {
  const queryClient = useQueryClient();
  
  return {
    get: <T = unknown>(queryKey: QueryKey): T | undefined => 
      queryClient.getQueryData<T>(queryKey),
    set: <T = unknown>(queryKey: QueryKey, data: T) => 
      queryClient.setQueryData<T>(queryKey, data),
    update: <T = unknown>(queryKey: QueryKey, updater: (oldData: T | undefined) => T) => 
      queryClient.setQueryData<T>(queryKey, updater),
    prefetch: <T = unknown>(queryKey: QueryKey, queryFn: QueryFunction<T>) => 
      queryClient.prefetchQuery({ queryKey, queryFn }),
  };
}
