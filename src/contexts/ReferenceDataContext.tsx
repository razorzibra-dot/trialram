import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// ✅ PHASE 1.5: DYNAMIC DATA LOADING - Layer 6 (React Context)
// Import from factory (Layer 5) - never import services directly
import { referenceDataService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
} from '@/types/referenceData.types';
import { pageDataService, PageDataRequirements } from '@/services/page/PageDataService';
import backendConfig from '@/config/backendConfig';

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

const CACHE_TTL = backendConfig.cache?.referenceTtlMs ?? 5 * 60 * 1000; // configurable TTL

interface ReferenceDataProviderProps {
  children: React.ReactNode;
  cacheTTL?: number;
}

// Persisted caches across component remounts (e.g., React 18 StrictMode double render)
const tenantCache: Map<string, { data: CacheState; timestamp: number }> = new Map();
const inFlightFetches: Map<string, Promise<CacheState>> = new Map();

const getTenantCacheKey = (tenantId: string | null | undefined) => tenantId ?? 'system';

export const ReferenceDataProvider: React.FC<ReferenceDataProviderProps> = ({
  children,
  cacheTTL = CACHE_TTL,
}) => {
  const { isAuthenticated, tenant } = useAuth();
  const tenantId = tenant?.tenantId;

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

  // Prevent duplicate fetches (e.g., React 18 StrictMode double-invocation in dev)
  const isFetchingRef = useRef(false);

  // Refs for debouncing and cleanup
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const prewarmDoneRef = useRef(false);

  /**
   * Fetch all reference data from service (Layer 5: Factory routes to correct backend)
   */
  const fetchAllReferenceData = useCallback(async () => {
    // Wait for tenant resolution; undefined means not ready yet
    if (tenantId === undefined) return;

    const cacheKey = getTenantCacheKey(tenantId);

    // Try persisted sessionStorage cache first (survives F5)
    try {
      const persistedRaw = sessionStorage.getItem(`refDataCache:${cacheKey}`);
      if (persistedRaw) {
        const persisted = JSON.parse(persistedRaw) as { data: CacheState; timestamp: number };
        if (persisted && Date.now() - persisted.timestamp < cacheTTL) {
          tenantCache.set(cacheKey, persisted);
          if (isMountedRef.current) {
            setCache(persisted.data);
            setMetadata((prev) => ({ ...prev, lastRefresh: persisted.timestamp, isLoading: false, error: null }));
          }
          // Use persisted data immediately and return without network fetch
          return;
        }
      }
    } catch (e) {
      // Ignore JSON/Storage errors; proceed to normal flow
    }

    // Reuse fresh cache across StrictMode remounts
    const cached = tenantCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      if (isMountedRef.current) {
        setCache(cached.data);
        setMetadata((prev) => ({ ...prev, lastRefresh: cached.timestamp, isLoading: false, error: null }));
      }
      return;
    }

    // Return in-flight fetch if already running for this tenant
    const inFlight = inFlightFetches.get(cacheKey);
    if (inFlight) {
      const data = await inFlight;
      if (isMountedRef.current) {
        setCache(data);
        setMetadata((prev) => ({ ...prev, lastRefresh: Date.now(), isLoading: false, error: null }));
      }
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isMountedRef.current) return;

    setMetadata((prev) => ({ ...prev, isLoading: true, error: null }));

    const fetchPromise = (async () => {
      try {
        // Call getAllReferenceData which returns all 4 data types
        const data = await referenceDataService.getAllReferenceData(tenantId);

        const nextCache: CacheState = {
          statusOptions: data.statusOptions || [],
          referenceData: data.referenceData || [],
          categories: data.categories || [],
          suppliers: data.suppliers || [],
        };

        const snapshot = { data: nextCache, timestamp: Date.now() };
        tenantCache.set(cacheKey, snapshot);
        try {
          sessionStorage.setItem(`refDataCache:${cacheKey}`, JSON.stringify(snapshot));
        } catch {
          // Ignore sessionStorage errors (quota exceeded, private mode, etc.)
        }
        return nextCache;
      } catch (error) {
        console.error('[ReferenceDataContext] Error fetching data:', error);
        throw error;
      } finally {
        isFetchingRef.current = false;
        inFlightFetches.delete(cacheKey);
      }
    })();

    inFlightFetches.set(cacheKey, fetchPromise);

    try {
      const resolved = await fetchPromise;

      if (isMountedRef.current) {
        setCache(resolved);
        setMetadata((prev) => ({
          ...prev,
          lastRefresh: Date.now(),
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setMetadata((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch reference data',
        }));
      }
    }
  }, [cacheTTL, tenantId]);

  /**
    * Initialize context on mount - only load data when authenticated and tenant context is available
    */
   useEffect(() => {
     isMountedRef.current = true;

     // Only load data if user is authenticated and tenant context has been resolved
    if (isAuthenticated && tenantId !== undefined) {
       // Load data on mount
       fetchAllReferenceData();

       // Setup auto-refresh timer (5 minutes)
       refreshTimerRef.current = setInterval(() => {
        if (isMountedRef.current && isAuthenticated && tenantId !== undefined) {
           fetchAllReferenceData();
         }
       }, cacheTTL);
     } else {
       // Clear data when user becomes unauthenticated
       setCache({
         statusOptions: [],
         referenceData: [],
         categories: [],
         suppliers: [],
       });
       setMetadata((prev) => ({
         ...prev,
         lastRefresh: 0,
         isLoading: false,
         error: null,
       }));
     }

     return () => {
       isMountedRef.current = false;
       if (refreshTimerRef.current) {
         clearInterval(refreshTimerRef.current);
       }
     };
  }, [cacheTTL, fetchAllReferenceData, isAuthenticated, tenantId]);

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
      if (!tenantId) return;
      const statusOptions = await referenceDataService.getStatusOptions(undefined, tenantId);
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, statusOptions }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing status options:', error);
    }
  }, [tenantId]);

  const refreshCategories = useCallback(async () => {
    try {
      if (!tenantId) return;
      const categories = await referenceDataService.getCategories(tenantId);
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, categories }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing categories:', error);
    }
  }, [tenantId]);

  const refreshSuppliers = useCallback(async () => {
    try {
      if (!tenantId) return;
      const suppliers = await referenceDataService.getSuppliers(tenantId);
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, suppliers }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing suppliers:', error);
    }
  }, [tenantId]);

  const refreshReferenceData = useCallback(async () => {
    try {
      if (!tenantId) return;
      const referenceData = await referenceDataService.getReferenceData(undefined, tenantId);
      if (isMountedRef.current) {
        setCache((prev) => ({ ...prev, referenceData }));
      }
    } catch (error) {
      console.error('[ReferenceDataContext] Error refreshing reference data:', error);
    }
  }, [tenantId]);

  /**
   * After reference data is loaded, pre-warm common pages so navigating to them
   * does not trigger additional API calls (customers/users batched ahead of time).
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (tenantId === undefined) return;
    if (prewarmDoneRef.current) return;

    // Only start pre-warm after first successful load
    if (metadata.lastRefresh > 0) {
      prewarmDoneRef.current = true;
      const requirements: PageDataRequirements = {
        session: true,
        module: { customers: true, users: true },
      };
      pageDataService
        .preloadPages([{ route: '/tenant/customers', requirements }])
        .catch((e) => console.warn('[ReferenceDataContext] Pre-warm failed:', e));
    }
  }, [isAuthenticated, tenantId, metadata.lastRefresh]);

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
      return cache.categories.find((cat) => cat.name === key);
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