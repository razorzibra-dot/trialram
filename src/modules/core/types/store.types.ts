/**
 * Store Layer Type Definitions
 * Base interfaces for Zustand store patterns across all modules
 * 
 * These interfaces provide a standardized structure that all feature modules
 * should follow to ensure consistency and maintainability.
 */

/**
 * Base state interface for all stores
 * Provides standard structure for data, UI state, and metadata
 */
export interface IBaseStoreState<T> {
  // Data state
  items: T[];
  itemsMap: Record<string, T>;
  selectedId: string | null;
  
  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Pagination state
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Filter state
  filters: Record<string, unknown>;
  searchQuery: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

/**
 * Base actions interface for all stores
 * Standard setter methods that all stores should implement
 */
export interface IBaseStoreActions<T> {
  // Data setters
  setItems(items: T[]): void;
  setItemsMap(itemsMap: Record<string, T>): void;
  addItem(item: T, getId: (item: T) => string): void;
  updateItem(item: T, getId: (item: T) => string): void;
  removeItem(id: string): void;
  selectItem(id: string | null): void;
  
  // UI state setters
  setLoading(isLoading: boolean): void;
  setCreating(isCreating: boolean): void;
  setUpdating(isUpdating: boolean): void;
  setDeleting(isDeleting: boolean): void;
  setError(error: string | null): void;
  
  // Pagination setters
  setTotalCount(count: number): void;
  setCurrentPage(page: number): void;
  setPageSize(size: number): void;
  setTotalPages(pages: number): void;
  
  // Filter setters
  setFilters(filters: Record<string, unknown>): void;
  setSearchQuery(query: string): void;
  setSortBy(field: string): void;
  setSortDirection(direction: 'asc' | 'desc'): void;
  
  // Reset function
  reset(): void;
}

/**
 * Combined store state with actions
 * Use this interface when defining your Zustand store types
 * 
 * @example
 * interface ICustomerStore extends IStoreState<Customer> {
 *   // Add module-specific state here
 * }
 */
export interface IStoreState<T> extends IBaseStoreState<T>, IBaseStoreActions<T> {}

/**
 * Query key factory type
 * Used to generate consistent React Query keys for a module
 * 
 * @example
 * export const customerKeys = {
 *   all: () => ['customers'],
 *   lists: () => [...customerKeys.all(), 'list'],
 *   list: (filters) => [...customerKeys.lists(), { filters }],
 *   details: () => [...customerKeys.all(), 'detail'],
 *   detail: (id) => [...customerKeys.details(), id],
 * } as const;
 */
export interface IQueryKeyFactory {
  all: () => readonly unknown[];
  lists: () => readonly unknown[];
  list: (filters?: Record<string, unknown>) => readonly unknown[];
  details: () => readonly unknown[];
  detail: (id: string | number) => readonly unknown[];
}

/**
 * Store initialization options
 * Standard options for store creation
 */
export interface IStoreInitOptions {
  /**
   * Enable debugging output
   * @default false
   */
  debug?: boolean;
  
  /**
   * Enable state persistence
   * @default false
   */
  persist?: boolean;
  
  /**
   * Persistence storage key
   * @example "customer_store_v1"
   */
  persistKey?: string;
}

/**
 * Export all store-related types
 * Allows convenient access via `StoreTypes['BaseState']<T>`
 */
export type StoreTypes = {
  BaseState: typeof IBaseStoreState;
  BaseActions: typeof IBaseStoreActions;
  State: typeof IStoreState;
  QueryKeyFactory: IQueryKeyFactory;
  InitOptions: IStoreInitOptions;
};
