/**
 * MODULE DATA CONTEXT - Provides pre-loaded page data to component tree
 * ============================================================================
 *
 * Pattern: Wrap each module/page with ModuleDataProvider
 * Components access data via useModuleData() hook (zero API calls)
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pageDataService, PageData, PageDataRequirements } from '@/services/page/PageDataService';
import { useLocation } from 'react-router-dom';

// Debug flag - set to true to enable verbose logging
const DEBUG_LOGGING = false;

interface ModuleDataContextType {
  data: PageData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const ModuleDataContext = createContext<ModuleDataContextType | undefined>(undefined);

export const useModuleData = (): ModuleDataContextType => {
  const context = useContext(ModuleDataContext);
  if (!context) {
    throw new Error('useModuleData must be used within ModuleDataProvider');
  }
  return context;
};

/**
 * Optional accessor for ModuleDataContext.
 * Returns undefined when used outside of a ModuleDataProvider.
 * Useful for shared hooks that can opportunistically read page-batched data
 * without hard-requiring the provider to be present.
 */
export const useOptionalModuleData = (): ModuleDataContextType | undefined => {
  return useContext(ModuleDataContext);
};

interface ModuleDataProviderProps {
  children: ReactNode;
  requirements: PageDataRequirements;
}

/**
 * ENTERPRISE: Module Data Provider
 * Wraps each module/page and provides pre-loaded data to all child components
 *
 * Usage:
 * <ModuleDataProvider
 *   requirements={{
 *     session: true,
 *     referenceData: { categories: true, suppliers: true },
 *     module: { customers: true },
 *   }}
 * >
 *   <CustomerModule />
 * </ModuleDataProvider>
 */
export const ModuleDataProvider: React.FC<ModuleDataProviderProps> = ({ children, requirements }) => {
  const location = useLocation();
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use route pathname as unique identifier
      const route = location.pathname;
      console.log('[ModuleDataProvider] Loading page data for route:', route);
      const pageData = await pageDataService.loadPageData(route, requirements);

      setData(pageData);
      console.log('[ModuleDataProvider] Page data loaded successfully');
    } catch (err) {
      console.error('[ModuleDataProvider] Error loading page data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load page data'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Force-refresh utility bypassing caches (used after mutations)
  const forceRefresh = async () => {
    try {
      console.log('[ModuleDataProvider] 🔄 forceRefresh called at', new Date().toISOString());
      console.log('[ModuleDataProvider] 📍 Current route:', location.pathname);
      
      setIsLoading(true);
      setError(null);
      
      const route = location.pathname;
      console.log('[ModuleDataProvider] 📞 Calling pageDataService.refreshPageData...');
      
      const pageData = await pageDataService.refreshPageData(route, requirements);
      
      console.log('[ModuleDataProvider] ✅ Got fresh page data:', {
        moduleDataKeys: Object.keys(pageData?.moduleData || {}),
        customersCount: Array.isArray(pageData?.moduleData?.customers) ? pageData.moduleData.customers.length : 0,
        customersIsArray: Array.isArray(pageData?.moduleData?.customers),
        timestamp: new Date().toISOString()
      });
      
      console.log('[ModuleDataProvider] 🔧 Calling setData to update React state...');
      setData(pageData);
      console.log('[ModuleDataProvider] ✅ setData called, state should update now');
      
    } catch (err) {
      console.error('[ModuleDataProvider] ❌ Error refreshing page data:', err);
      if (DEBUG_LOGGING && err instanceof Error) {
        console.error('[ModuleDataProvider] Error details:', {
          message: err.message,
          stack: err.stack
        });
      }
      setError(err instanceof Error ? err : new Error('Failed to refresh page data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Cleanup: invalidate cache when leaving module
    return () => {
      pageDataService.invalidatePageCache(location.pathname);
    };
  }, [location.pathname, requirements]);

  return (
    <ModuleDataContext.Provider
      value={{
        data,
        isLoading,
        error,
        refresh: forceRefresh,
      }}
    >
      {children}
    </ModuleDataContext.Provider>
  );
};
