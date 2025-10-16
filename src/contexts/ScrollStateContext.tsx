import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface ScrollStateContextType {
  // Sidebar scroll management
  saveSidebarScrollPosition: (position: ScrollPosition) => void;
  restoreSidebarScrollPosition: () => ScrollPosition | null;
  getSidebarScrollRef: () => React.RefObject<HTMLElement>;
  
  // Page scroll management
  savePageScrollPosition: (route: string, position: ScrollPosition) => void;
  restorePageScrollPosition: (route: string) => ScrollPosition | null;
  getPageScrollRef: () => React.RefObject<HTMLElement>;
  
  // Table scroll management
  saveTableScrollPosition: (tableId: string, position: ScrollPosition) => void;
  restoreTableScrollPosition: (tableId: string) => ScrollPosition | null;
  
  // Modal scroll management
  saveModalScrollPosition: (modalId: string, position: ScrollPosition) => void;
  restoreModalScrollPosition: (modalId: string) => ScrollPosition | null;
  
  // Auto-save scroll positions
  enableAutoSave: (elementRef: React.RefObject<HTMLElement>, key: string) => void;
  disableAutoSave: (key: string) => void;
  
  // Clear old scroll positions
  clearOldScrollPositions: (maxAge?: number) => void;
}

const ScrollStateContext = createContext<ScrollStateContextType | undefined>(undefined);

interface ScrollStateProviderProps {
  children: React.ReactNode;
  maxScrollHistoryAge?: number; // in milliseconds, default 30 minutes
}

export const ScrollStateProvider: React.FC<ScrollStateProviderProps> = ({
  children,
  maxScrollHistoryAge = 30 * 60 * 1000 // 30 minutes
}) => {
  
  // Refs for different scroll containers
  const sidebarScrollRef = useRef<HTMLElement>(null);
  const pageScrollRef = useRef<HTMLElement>(null);
  
  // Storage for scroll positions
  const scrollPositions = useRef<Map<string, ScrollPosition>>(new Map());
  const autoSaveIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Sidebar scroll management
  const saveSidebarScrollPosition = useCallback((position: ScrollPosition) => {
    scrollPositions.current.set('sidebar', position);
    // Also save to sessionStorage for persistence across page reloads
    sessionStorage.setItem('sidebar-scroll', JSON.stringify(position));
  }, []);
  
  const restoreSidebarScrollPosition = useCallback((): ScrollPosition | null => {
    // First try memory
    let position = scrollPositions.current.get('sidebar');
    
    // If not in memory, try sessionStorage
    if (!position) {
      const stored = sessionStorage.getItem('sidebar-scroll');
      if (stored) {
        try {
          position = JSON.parse(stored);
        } catch (e) {
          console.warn('Failed to parse stored sidebar scroll position:', e);
        }
      }
    }
    
    return position || null;
  }, []);
  
  const getSidebarScrollRef = useCallback(() => sidebarScrollRef, []);
  
  // Page scroll management
  const savePageScrollPosition = useCallback((route: string, position: ScrollPosition) => {
    const key = `page-${route}`;
    scrollPositions.current.set(key, position);
    sessionStorage.setItem(key, JSON.stringify(position));
  }, []);
  
  const restorePageScrollPosition = useCallback((route: string): ScrollPosition | null => {
    const key = `page-${route}`;
    let position = scrollPositions.current.get(key);
    
    if (!position) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          position = JSON.parse(stored);
        } catch (e) {
          console.warn(`Failed to parse stored page scroll position for ${route}:`, e);
        }
      }
    }
    
    return position || null;
  }, []);
  
  const getPageScrollRef = useCallback(() => pageScrollRef, []);
  
  // Table scroll management
  const saveTableScrollPosition = useCallback((tableId: string, position: ScrollPosition) => {
    const key = `table-${tableId}`;
    scrollPositions.current.set(key, position);
    sessionStorage.setItem(key, JSON.stringify(position));
  }, []);
  
  const restoreTableScrollPosition = useCallback((tableId: string): ScrollPosition | null => {
    const key = `table-${tableId}`;
    let position = scrollPositions.current.get(key);
    
    if (!position) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          position = JSON.parse(stored);
        } catch (e) {
          console.warn(`Failed to parse stored table scroll position for ${tableId}:`, e);
        }
      }
    }
    
    return position || null;
  }, []);
  
  // Modal scroll management
  const saveModalScrollPosition = useCallback((modalId: string, position: ScrollPosition) => {
    const key = `modal-${modalId}`;
    scrollPositions.current.set(key, position);
    // Don't persist modal scroll positions to sessionStorage as they're temporary
  }, []);
  
  const restoreModalScrollPosition = useCallback((modalId: string): ScrollPosition | null => {
    const key = `modal-${modalId}`;
    return scrollPositions.current.get(key) || null;
  }, []);
  
  // Auto-save functionality
  const enableAutoSave = useCallback((elementRef: React.RefObject<HTMLElement>, key: string) => {
    // Clear existing interval if any
    const existingInterval = autoSaveIntervals.current.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Set up new auto-save interval
    const interval = setInterval(() => {
      if (elementRef.current) {
        const element = elementRef.current;
        const position: ScrollPosition = {
          x: element.scrollLeft,
          y: element.scrollTop,
          timestamp: Date.now()
        };
        
        if (key.startsWith('sidebar')) {
          saveSidebarScrollPosition(position);
        } else if (key.startsWith('page-')) {
          const route = key.replace('page-', '');
          savePageScrollPosition(route, position);
        } else if (key.startsWith('table-')) {
          const tableId = key.replace('table-', '');
          saveTableScrollPosition(tableId, position);
        } else if (key.startsWith('modal-')) {
          const modalId = key.replace('modal-', '');
          saveModalScrollPosition(modalId, position);
        }
      }
    }, 500); // Save every 500ms
    
    autoSaveIntervals.current.set(key, interval);
  }, [saveSidebarScrollPosition, savePageScrollPosition, saveTableScrollPosition, saveModalScrollPosition]);
  
  const disableAutoSave = useCallback((key: string) => {
    const interval = autoSaveIntervals.current.get(key);
    if (interval) {
      clearInterval(interval);
      autoSaveIntervals.current.delete(key);
    }
  }, []);
  
  // Clear old scroll positions
  const clearOldScrollPositions = useCallback((maxAge: number = maxScrollHistoryAge) => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    scrollPositions.current.forEach((position, key) => {
      if (now - position.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      scrollPositions.current.delete(key);
      sessionStorage.removeItem(key);
    });
  }, [maxScrollHistoryAge]);
  
  // Note: Auto-save of page scroll position is now handled by individual page components
  // using the usePageScroll hook to avoid Router context dependency issues
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      autoSaveIntervals.current.forEach(interval => clearInterval(interval));
      autoSaveIntervals.current.clear();
    };
  }, []);
  
  // Periodic cleanup of old scroll positions
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      clearOldScrollPositions();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [clearOldScrollPositions]);
  
  const value: ScrollStateContextType = {
    saveSidebarScrollPosition,
    restoreSidebarScrollPosition,
    getSidebarScrollRef,
    savePageScrollPosition,
    restorePageScrollPosition,
    getPageScrollRef,
    saveTableScrollPosition,
    restoreTableScrollPosition,
    saveModalScrollPosition,
    restoreModalScrollPosition,
    enableAutoSave,
    disableAutoSave,
    clearOldScrollPositions
  };
  
  return (
    <ScrollStateContext.Provider value={value}>
      {children}
    </ScrollStateContext.Provider>
  );
};

export const useScrollState = (): ScrollStateContextType => {
  const context = useContext(ScrollStateContext);
  if (context === undefined) {
    throw new Error('useScrollState must be used within a ScrollStateProvider');
  }
  return context;
};

// Custom hooks for specific use cases
export const useSidebarScroll = () => {
  const { 
    saveSidebarScrollPosition, 
    restoreSidebarScrollPosition, 
    getSidebarScrollRef,
    enableAutoSave,
    disableAutoSave
  } = useScrollState();
  
  return {
    saveSidebarScrollPosition,
    restoreSidebarScrollPosition,
    getSidebarScrollRef,
    enableAutoSave: () => enableAutoSave(getSidebarScrollRef(), 'sidebar'),
    disableAutoSave: () => disableAutoSave('sidebar')
  };
};

export const usePageScroll = (route?: string) => {
  const location = useLocation();
  const currentRoute = route || location.pathname;
  const { 
    savePageScrollPosition, 
    restorePageScrollPosition, 
    getPageScrollRef,
    enableAutoSave,
    disableAutoSave
  } = useScrollState();
  
  return {
    savePageScrollPosition: (position: ScrollPosition) => savePageScrollPosition(currentRoute, position),
    restorePageScrollPosition: () => restorePageScrollPosition(currentRoute),
    getPageScrollRef,
    enableAutoSave: () => enableAutoSave(getPageScrollRef(), `page-${currentRoute}`),
    disableAutoSave: () => disableAutoSave(`page-${currentRoute}`)
  };
};

export const useTableScroll = (tableId: string) => {
  const { 
    saveTableScrollPosition, 
    restoreTableScrollPosition,
    enableAutoSave,
    disableAutoSave
  } = useScrollState();
  
  const tableRef = useRef<HTMLElement>(null);
  
  return {
    tableRef,
    saveTableScrollPosition: (position: ScrollPosition) => saveTableScrollPosition(tableId, position),
    restoreTableScrollPosition: () => restoreTableScrollPosition(tableId),
    enableAutoSave: () => enableAutoSave(tableRef, `table-${tableId}`),
    disableAutoSave: () => disableAutoSave(`table-${tableId}`)
  };
};

export const useModalScroll = (modalId: string) => {
  const { 
    saveModalScrollPosition, 
    restoreModalScrollPosition,
    enableAutoSave,
    disableAutoSave
  } = useScrollState();
  
  const modalRef = useRef<HTMLElement>(null);
  
  return {
    modalRef,
    saveModalScrollPosition: (position: ScrollPosition) => saveModalScrollPosition(modalId, position),
    restoreModalScrollPosition: () => restoreModalScrollPosition(modalId),
    enableAutoSave: () => enableAutoSave(modalRef, `modal-${modalId}`),
    disableAutoSave: () => disableAutoSave(`modal-${modalId}`)
  };
};
