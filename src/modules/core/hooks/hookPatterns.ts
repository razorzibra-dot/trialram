/**
 * Hook Pattern Templates
 * Standard patterns for creating hooks across all modules
 * 
 * These patterns ensure consistency in how data is fetched, cached,
 * and managed throughout the application.
 */

/**
 * Query Key Factory Pattern
 * 
 * Each module should create a QueryKeyFactory to generate consistent React Query keys.
 * Keys are organized hierarchically for better cache management.
 * 
 * @example
 * ```typescript
 * export const customerKeys = {
 *   all: () => ['customers'] as const,
 *   lists: () => [...customerKeys.all(), 'list'] as const,
 *   list: (filters?: CustomerFilters) => 
 *     [...customerKeys.lists(), { filters }] as const,
 *   details: () => [...customerKeys.all(), 'detail'] as const,
 *   detail: (id: string) => [...customerKeys.details(), id] as const,
 *   stats: () => [...customerKeys.all(), 'stats'] as const,
 * } as const;
 * ```
 */
export const queryKeyFactoryPattern = {
  documentation: `
    Query Key Factory Pattern:
    
    1. Use hierarchical structure (all → lists/details → specific)
    2. Make keys descriptive and queryable
    3. Include filters/params in the key
    4. Use 'as const' for type safety
    
    Benefits:
    - Easy to invalidate specific queries
    - Organized cache structure
    - Better debugging
  `,
  
  example: {
    allItems: () => ['items'] as const,
    lists: () => ['items', 'list'] as const,
    listWithFilters: (filters?: Record<string, unknown>) => 
      ['items', 'list', { filters }] as const,
    detail: (id: string) => ['items', 'detail', id] as const,
    stats: () => ['items', 'stats'] as const,
  }
};

/**
 * Custom Hook Pattern
 * 
 * Standard pattern for creating data-fetching hooks
 * 
 * @example
 * ```typescript
 * export interface UseItemsOptions {
 *   filters?: ItemFilters;
 *   enabled?: boolean;
 * }
 * 
 * export function useItems(options: UseItemsOptions = {}) {
 *   const service = useService<IItemService>();
 *   const store = useItemStore();
 *   
 *   const { data, isLoading, error, isFetching } = useQuery({
 *     queryKey: itemKeys.list(options.filters),
 *     queryFn: () => service.getItems(options.filters),
 *     enabled: options.enabled !== false,
 *     ...LISTS_QUERY_CONFIG,
 *   });
 *   
 *   // Update store when data arrives
 *   useEffect(() => {
 *     if (data) {
 *       store.setItems(data.items);
 *       store.setTotalCount(data.total);
 *     }
 *   }, [data, store]);
 *   
 *   return {
 *     items: data?.items ?? [],
 *     total: data?.total ?? 0,
 *     isLoading,
 *     isFetching,
 *     error: error?.message || null,
 *   };
 * }
 * ```
 */
export const customHookPattern = {
  steps: [
    '1. Define hook options interface',
    '2. Use useService<IService>() to get typed service',
    '3. Use useQuery with queryKey, queryFn, and config',
    '4. Return loading/error/data states',
    '5. Update store on data changes',
    '6. Handle enabled/disabled states',
  ],
  
  template: `
    export interface UseXxxOptions {
      filters?: XxxFilters;
      enabled?: boolean;
    }
    
    export function useXxx(options: UseXxxOptions = {}) {
      const service = useService<IXxxService>();
      const store = useXxxStore();
      
      const { data, isLoading, error, isFetching } = useQuery({
        queryKey: xxxKeys.list(options.filters),
        queryFn: () => service.getXxx(options.filters),
        enabled: options.enabled !== false,
        ...LISTS_QUERY_CONFIG,
      });
      
      useEffect(() => {
        if (data) {
          store.setItems(data.items);
          store.setTotalCount(data.total);
        }
      }, [data, store]);
      
      return {
        items: data?.items ?? [],
        total: data?.total ?? 0,
        isLoading,
        isFetching,
        error: error?.message || null,
      };
    }
  `,
};

/**
 * Mutation Hook Pattern
 * 
 * Standard pattern for create/update/delete operations
 * 
 * @example
 * ```typescript
 * export function useCreateItem(onSuccess?: (item: Item) => void) {
 *   const service = useService<IItemService>();
 *   const store = useItemStore();
 *   const queryClient = useQueryClient();
 *   
 *   return useMutation({
 *     mutationFn: (input: CreateItemInput) => service.createItem(input),
 *     onSuccess: (item) => {
 *       store.addItem(item);
 *       queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
 *       onSuccess?.(item);
 *       message.success('Item created successfully');
 *     },
 *     onError: (error) => {
 *       const msg = handleError(error, 'useCreateItem');
 *       message.error(msg);
 *     },
 *   });
 * }
 * ```
 */
export const mutationHookPattern = {
  steps: [
    '1. Get typed service via useService<IService>()',
    '2. Get store instance',
    '3. Get queryClient for cache invalidation',
    '4. Define useMutation with success/error handlers',
    '5. In onSuccess: update store and invalidate cache',
    '6. In onError: handle error and show message',
    '7. Return mutation object',
  ],
  
  template: `
    export function useCreateXxx(onSuccess?: (item: Xxx) => void) {
      const service = useService<IXxxService>();
      const store = useXxxStore();
      const queryClient = useQueryClient();
      
      return useMutation({
        mutationFn: (input: CreateXxxInput) => service.createXxx(input),
        onSuccess: (item) => {
          store.addItem(item);
          queryClient.invalidateQueries({ queryKey: xxxKeys.lists() });
          onSuccess?.(item);
          message.success('Item created successfully');
        },
        onError: (error) => {
          const msg = handleError(error, 'useCreateXxx');
          message.error(msg);
        },
      });
    }
  `,
};

/**
 * Store Hook Pattern
 * 
 * Standard pattern for accessing Zustand stores
 * 
 * @example
 * ```typescript
 * export const useXxxStore = create<IXxxStore>((set) => ({
 *   items: [],
 *   itemsMap: {},
 *   selectedId: null,
 *   isLoading: false,
 *   error: null,
 *   
 *   setItems: (items) => set({ items }),
 *   setLoading: (isLoading) => set({ isLoading }),
 *   setError: (error) => set({ error }),
 *   
 *   reset: () => set({
 *     items: [],
 *     itemsMap: {},
 *     selectedId: null,
 *     isLoading: false,
 *     error: null,
 *   }),
 * }));
 * ```
 */
export const storeHookPattern = {
  steps: [
    '1. Import create from zustand',
    '2. Define interface extending IStoreState<T>',
    '3. Initialize with set function',
    '4. Define all state variables',
    '5. Define all setter methods',
    '6. Include reset() method',
    '7. Export the hook',
  ],
  
  template: `
    import { create } from 'zustand';
    import { immer } from 'zustand/middleware/immer';
    import { IStoreState } from '@/modules/core/types';
    
    interface IXxxStore extends IStoreState<Xxx> {
      // Add module-specific state here
    }
    
    export const useXxxStore = create<IXxxStore>()(
      immer((set) => ({
        items: [],
        itemsMap: {},
        selectedId: null,
        isLoading: false,
        error: null,
        totalCount: 0,
        currentPage: 1,
        pageSize: 10,
        filters: {},
        searchQuery: '',
        sortBy: 'createdAt',
        sortDirection: 'desc',
        
        setItems: (items) => set({ items }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        reset: () => set({
          items: [],
          itemsMap: {},
          selectedId: null,
          isLoading: false,
          error: null,
        }),
      }))
    );
  `,
};

/**
 * Component Integration Pattern
 * 
 * How to use hooks in components
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { items, isLoading, error } = useItems();
 *   const store = useXxxStore();
 *   const mutation = useCreateItem();
 *   
 *   const handleCreate = async (input: CreateItemInput) => {
 *     await mutation.mutateAsync(input);
 *   };
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       {items.map(item => <ItemCard key={item.id} item={item} />)}
 *       <CreateForm onSubmit={handleCreate} />
 *     </div>
 *   );
 * }
 * ```
 */
export const componentIntegrationPattern = {
  steps: [
    '1. Use custom hooks to fetch data',
    '2. Access store for state management',
    '3. Use mutation hooks for actions',
    '4. Handle loading/error states',
    '5. Display data',
    '6. Call mutations on user actions',
  ],
};

/**
 * Error Handling Pattern
 * 
 * Standard error handling in hooks
 * 
 * @example
 * ```typescript
 * const { data, error } = useQuery({
 *   queryKey: ['items'],
 *   queryFn: async () => {
 *     try {
 *       return await service.getItems();
 *     } catch (error) {
 *       const message = handleError(error, 'useItems');
 *       throw new Error(message);
 *     }
 *   },
 * });
 * ```
 */
export const errorHandlingPattern = {
  steps: [
    '1. Use handleError() utility for error messages',
    '2. Always provide context string (function name)',
    '3. Store error in state/store',
    '4. Show to user via message.error()',
    '5. Log for debugging',
  ],
};

/**
 * Cache Invalidation Pattern
 * 
 * When and how to invalidate cache
 * 
 * @example
 * ```typescript
 * // After mutation succeeds
 * onSuccess: () => {
 *   // Invalidate specific query
 *   queryClient.invalidateQueries({ queryKey: itemKeys.list() });
 *   
 *   // Or invalidate entire scope
 *   queryClient.invalidateQueries({ queryKey: itemKeys.all() });
 * }
 * ```
 */
export const cacheInvalidationPattern = {
  steps: [
    '1. After create: invalidate lists',
    '2. After update: invalidate detail + lists',
    '3. After delete: invalidate lists',
    '4. Use queryKey hierarchies for precision',
    '5. Avoid over-invalidation (use specific keys)',
  ],
};

/**
 * Query Configuration Pattern
 * 
 * Using standardized query configs
 * 
 * @example
 * ```typescript
 * import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG } from '@/modules/core/constants';
 * 
 * // For lists
 * useQuery({ ...config, ...LISTS_QUERY_CONFIG })
 * 
 * // For details
 * useQuery({ ...config, ...DETAIL_QUERY_CONFIG })
 * ```
 */
export const queryConfigPattern = {
  configs: [
    'LISTS_QUERY_CONFIG - for collection queries',
    'DETAIL_QUERY_CONFIG - for single item queries',
    'STATS_QUERY_CONFIG - for analytics queries',
    'REFERENCE_DATA_QUERY_CONFIG - for reference data',
    'INFINITE_QUERY_CONFIG - for infinite scroll/pagination',
  ],
  
  usage: 'Spread config: ...LISTS_QUERY_CONFIG',
};

/**
 * Type Safety Pattern
 * 
 * Ensuring type safety in hooks
 * 
 * Steps:
 * 1. Always define service interfaces (IXxxService)
 * 2. Use useService<IXxxService>() for typing
 * 3. Define hook option interfaces
 * 4. Define hook return type interfaces
 * 5. No 'any' types
 * 6. All parameters typed
 */
export const typeSafetyPattern = {
  requirements: [
    'Service must have IXxxService interface',
    'Hook options must be typed interface',
    'Hook return must be typed interface',
    'No any types in hooks',
    'Generic types properly constrained',
  ],
};

export const HookPatterns = {
  queryKeyFactory: queryKeyFactoryPattern,
  customHook: customHookPattern,
  mutationHook: mutationHookPattern,
  storeHook: storeHookPattern,
  componentIntegration: componentIntegrationPattern,
  errorHandling: errorHandlingPattern,
  cacheInvalidation: cacheInvalidationPattern,
  queryConfig: queryConfigPattern,
  typeSafety: typeSafetyPattern,
} as const;
