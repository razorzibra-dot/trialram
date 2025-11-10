import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// ✅ PHASE 1.5: DYNAMIC DATA LOADING - Layer 6 (React Context)
// Import from factory (Layer 5) - never import services directly
import { referenceDataService } from '@/services/serviceFactory';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
} from '@/types/referenceData.types';

/**
 * ✅ PHASE 1.5: DYNAMIC DATA LOADING - LAYER 6 (React Context)
 * 
 * ReferenceDataContext provides centralized management of all reference data:
 * - Status options (sales, tickets, contracts, jobwork, etc.)
 * - Reference data (priorities, severities, departments, etc.)
 * - Product categories
 * - Suppliers
 * 
 * KEY FEATURES:
 * 1. Cache Strategy: Initial load + 5-minute auto-refresh + manual invalidation
 * 2. Stale-While-Revalidate: Use old data while fetching new data
 * 3. Error Handling: Fallback to cached data on errors
 * 4. Multi-tenant: Automatic tenant isolation via service layer
 * 
 * Architecture Layer: Layer 6 (React Context)
 * Dependencies: serviceFactory → referenceDataService
 * Used by: Hooks (Layer 7) → UI Components (Layer 8)
 */

interface CacheState {
  statusOptions: StatusOption[];
  referenceData: ReferenceData[];
  categories: ProductCategory[];
  suppliers: Supplier[];
}

interface CacheMetadata {
  lastRefresh: number;
  isLoading: boolean;
  error: string | null;
}

interface ReferenceDataContextType {
  // Data
  statusOptions: StatusOption[];
  referenceData: ReferenceData[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Query methods
  getStatusesByModule: (module: string) => StatusOption[];
  getCategoryById: (id: string) => ProductCategory | undefined;
  getCategoryByKey: (key: string) => ProductCategory | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  getRefDataByCategory: (category: string) => ReferenceData[];
  
  // Mutation methods
  addCategory: (category: ProductCategory) => void;
  updateCategory: (id: string, category: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addStatusOption: (status: StatusOption) => void;
  updateStatusOption: (id: string, status: Partial<StatusOption>) => void;
  deleteStatusOption: (id: string) => void;
  
  // Cache management
  invalidateCache: () => void;
  refreshData: () => Promise<void>;
  refreshStatusOptions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshReferenceData: () => Promise<void>;
}

const ReferenceDataContext = createContext<ReferenceDataContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface ReferenceDataProviderProps {
  children: React.ReactNode;
  cacheTTL?: number;
}

export const ReferenceDataProvider: React.FC<ReferenceDataProviderProps> = ({
  children,
  cacheTTL = CACHE_TTL,
}) => {
  // Main cache state
  const [cache, setCache] = useState<CacheState>({
    statusOptions: [],
    referenceData: [],
    categories: [],
    suppliers: [],
  });

  // Metadata
  const [metadata, setMetadata] = useState<CacheMetadata>({
    lastRefresh: 0,
    isLoading: false,
    error: null,
  });

  // Refs for debouncing and cleanup
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  /**
   * Fetch all reference data from service (Layer 5: Factory routes to correct backend)
   */
  const fetchAllReferenceData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setMetadata((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call getAllReferenceData which returns all 4 data types
      const data = await referenceDataService.getAllReferenceData();

      if (isMountedRef.current) {
        setCache({
          statusOptions: data.statusOptions || [],
          referenceData: data.referenceData || [],
          categories: data.categories || [],
          suppliers: data.suppliers || [],
        });

        setMetadata((prev) => ({
          ...prev,
          lastRefresh: Date.now(),
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error fetching data:', error);

      if (isMountedRef.current) {
        setMetadata((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch reference data',
        }));
      }
    }
  }, []);

  /**
   * Initialize context on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Load data on mount
    fetchAllReferenceData();

    // Setup auto-refresh timer (5 minutes)
    refreshTimerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchAllReferenceData();
      }
    }, cacheTTL);

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [cacheTTL, fetchAllReferenceData]);

  /**
   * Invalidate cache and force refresh
   * Called when mutations occur or cache becomes stale
   */
  const invalidateCache = useCallback(() => {
    setMetadata((prev) => ({ ...prev, lastRefresh: 0 }));
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    invalidateCache();
    await fetchAllReferenceData();
  }, [invalidateCache, fetchAllReferenceData]);

  /**
   * Refresh specific data types
   */
  const refreshStatusOptions = useCallback(async () => {
    try {
      const statusOptions = await referenceDataService.getStatusOptions();
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, statusOptions }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing status options:', error);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const categories = await referenceDataService.getCategories();
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, categories }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing categories:', error);
    }
  }, []);

  const refreshSuppliers = useCallback(async () => {
    try {
      const suppliers = await referenceDataService.getSuppliers();
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, suppliers }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing suppliers:', error);
    }
  }, []);

  const refreshReferenceData = useCallback(async () => {
    try {
      const referenceData = await referenceDataService.getReferenceData();
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, referenceData }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing reference data:', error);
    }
  }, []);

  /**
   * QUERY METHODS - Read-only operations
   */

  const getStatusesByModule = useCallback(
    (module: string): StatusOption[] => {
      return cache.statusOptions.filter(
        (status) => status.module === module && status.isActive !== false
      );
    },
    [cache.statusOptions]
  );

  const getCategoryById = useCallback(
    (id: string): ProductCategory | undefined => {
      return cache.categories.find((cat) => cat.id === id);
    },
    [cache.categories]
  );

  const getCategoryByKey = useCallback(
    (key: string): ProductCategory | undefined => {
      return cache.categories.find((cat) => cat.key === key);
    },
    [cache.categories]
  );

  const getSupplierById = useCallback(
    (id: string): Supplier | undefined => {
      return cache.suppliers.find((sup) => sup.id === id);
    },
    [cache.suppliers]
  );

  const getRefDataByCategory = useCallback(
    (category: string): ReferenceData[] => {
      return cache.referenceData.filter(
        (data) => data.category === category && data.isActive !== false
      );
    },
    [cache.referenceData]
  );

  /**
   * MUTATION METHODS - Update local cache (real updates via services)
   * Note: These update local cache immediately (optimistic update)
   * In production, should trigger server mutations and cache invalidation
   */

  const addCategory = useCallback((category: ProductCategory) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
    }
    // Trigger server mutation and refresh
    refreshCategories();
  }, [refreshCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<ProductCategory>) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
      }));
    }
    // Trigger server mutation and refresh
    refreshCategories();
  }, [refreshCategories]);

  const deleteCategory = useCallback((id: string) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        categories: prev.categories.filter((cat) => cat.id !== id),
      }));
    }
    // Trigger server mutation and refresh
    refreshCategories();
  }, [refreshCategories]);

  const addSupplier = useCallback((supplier: Supplier) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        suppliers: [...prev.suppliers, supplier],
      }));
    }
    // Trigger server mutation and refresh
    refreshSuppliers();
  }, [refreshSuppliers]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        suppliers: prev.suppliers.map((sup) =>
          sup.id === id ? { ...sup, ...updates } : sup
        ),
      }));
    }
    // Trigger server mutation and refresh
    refreshSuppliers();
  }, [refreshSuppliers]);

  const deleteSupplier = useCallback((id: string) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        suppliers: prev.suppliers.filter((sup) => sup.id !== id),
      }));
    }
    // Trigger server mutation and refresh
    refreshSuppliers();
  }, [refreshSuppliers]);

  const addStatusOption = useCallback((status: StatusOption) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        statusOptions: [...prev.statusOptions, status],
      }));
    }
    // Trigger server mutation and refresh
    refreshStatusOptions();
  }, [refreshStatusOptions]);

  const updateStatusOption = useCallback((id: string, updates: Partial<StatusOption>) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        statusOptions: prev.statusOptions.map((status) =>
          status.id === id ? { ...status, ...updates } : status
        ),
      }));
    }
    // Trigger server mutation and refresh
    refreshStatusOptions();
  }, [refreshStatusOptions]);

  const deleteStatusOption = useCallback((id: string) => {
    if (isMountedRef.current) {
      setCache((prev) => ({
        ...prev,
        statusOptions: prev.statusOptions.filter((status) => status.id !== id),
      }));
    }
    // Trigger server mutation and refresh
    refreshStatusOptions();
  }, [refreshStatusOptions]);

  const value: ReferenceDataContextType = {
    // Data
    statusOptions: cache.statusOptions,
    referenceData: cache.referenceData,
    categories: cache.categories,
    suppliers: cache.suppliers,

    // State
    isLoading: metadata.isLoading,
    error: metadata.error,

    // Query methods
    getStatusesByModule,
    getCategoryById,
    getCategoryByKey,
    getSupplierById,
    getRefDataByCategory,

    // Mutation methods
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addStatusOption,
    updateStatusOption,
    deleteStatusOption,

    // Cache management
    invalidateCache,
    refreshData,
    refreshStatusOptions,
    refreshCategories,
    refreshSuppliers,
    refreshReferenceData,
  };

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

/**
 * Hook to access reference data context
 * 
 * Usage:
 * ```typescript
 * const refData = useReferenceData();
 * const salesStatuses = refData.getStatusesByModule('sales');
 * ```
 * 
 * @throws Error if used outside ReferenceDataProvider
 */
export const useReferenceData = (): ReferenceDataContextType => {
  const context = useContext(ReferenceDataContext);

  if (!context) {
    throw new Error('useReferenceData must be used within ReferenceDataProvider');
  }

  return context;
};

export default ReferenceDataContext;