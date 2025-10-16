import { useEffect, useRef, useCallback } from 'react';
import { useTableScroll } from '../contexts/ScrollStateContext';
import { useTableScrollRestoration } from './useScrollRestoration';

interface UseEnhancedTableScrollOptions {
  tableId: string;
  autoSave?: boolean;
  restoreOnMount?: boolean;
  saveOnUnmount?: boolean;
  smooth?: boolean;
  debounceMs?: number;
  threshold?: number;
}

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

export const useEnhancedTableScroll = (options: UseEnhancedTableScrollOptions) => {
  const {
    tableId,
    autoSave = true,
    restoreOnMount = true,
    saveOnUnmount = true,
    smooth = true,
    debounceMs = 100,
    threshold = 5
  } = options;
  
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    saveTableScrollPosition,
    restoreTableScrollPosition,
    enableAutoSave,
    disableAutoSave
  } = useTableScroll(tableId);
  
  // Enhanced scroll restoration for tables
  const scrollRestoration = useTableScrollRestoration(
    tableRef,
    saveTableScrollPosition,
    restoreTableScrollPosition,
    {
      smooth,
      delay: 150,
      threshold,
      debounceMs
    }
  );
  
  // Auto-save functionality
  useEffect(() => {
    if (autoSave) {
      enableAutoSave();
    }
    
    return () => {
      if (autoSave) {
        disableAutoSave();
      }
    };
  }, [autoSave, enableAutoSave, disableAutoSave]);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (restoreOnMount && tableRef.current) {
      const timer = setTimeout(() => {
        scrollRestoration.restoreScrollPosition();
      }, 200); // Wait for table content to load
      
      return () => clearTimeout(timer);
    }
  }, [restoreOnMount, scrollRestoration]);
  
  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (saveOnUnmount) {
        scrollRestoration.saveCurrentPosition();
      }
    };
  }, [saveOnUnmount, scrollRestoration]);
  
  // Manual scroll control functions
  const scrollToTop = useCallback(() => {
    if (tableRef.current) {
      scrollRestoration.scrollToPosition({ x: 0, y: 0, timestamp: Date.now() });
    }
  }, [scrollRestoration]);
  
  const scrollToBottom = useCallback(() => {
    if (tableRef.current) {
      const element = tableRef.current;
      scrollRestoration.scrollToPosition({
        x: element.scrollLeft,
        y: element.scrollHeight - element.clientHeight,
        timestamp: Date.now()
      });
    }
  }, [scrollRestoration]);
  
  const scrollToPosition = useCallback((position: Partial<ScrollPosition>) => {
    if (tableRef.current) {
      const element = tableRef.current;
      const fullPosition: ScrollPosition = {
        x: position.x ?? element.scrollLeft,
        y: position.y ?? element.scrollTop,
        timestamp: Date.now()
      };
      scrollRestoration.scrollToPosition(fullPosition);
    }
  }, [scrollRestoration]);
  
  const getCurrentPosition = useCallback((): ScrollPosition | null => {
    if (!tableRef.current) return null;
    
    const element = tableRef.current;
    return {
      x: element.scrollLeft,
      y: element.scrollTop,
      timestamp: Date.now()
    };
  }, []);
  
  const saveCurrentPosition = useCallback(() => {
    scrollRestoration.saveCurrentPosition();
  }, [scrollRestoration]);
  
  return {
    tableRef,
    scrollToTop,
    scrollToBottom,
    scrollToPosition,
    getCurrentPosition,
    saveCurrentPosition,
    restoreScrollPosition: scrollRestoration.restoreScrollPosition,
    isRestoring: scrollRestoration.isRestoring
  };
};

// Hook for managing scroll state across table operations (filter, sort, pagination)
export const useTableScrollWithOperations = (tableId: string) => {
  const tableScroll = useEnhancedTableScroll({
    tableId,
    autoSave: true,
    restoreOnMount: true,
    saveOnUnmount: true
  });
  
  const lastOperation = useRef<string>('');
  const operationTimestamp = useRef<number>(0);
  
  // Save scroll position before operations that might change table content
  const beforeOperation = useCallback((operationType: string) => {
    lastOperation.current = operationType;
    operationTimestamp.current = Date.now();
    tableScroll.saveCurrentPosition();
  }, [tableScroll]);
  
  // Restore or reset scroll position after operations
  const afterOperation = useCallback((operationType: string, shouldRestore: boolean = true) => {
    const timeSinceOperation = Date.now() - operationTimestamp.current;
    
    // Only restore if this is the same operation and it happened recently
    if (
      shouldRestore &&
      lastOperation.current === operationType &&
      timeSinceOperation < 5000 // 5 seconds
    ) {
      setTimeout(() => {
        tableScroll.restoreScrollPosition();
      }, 100);
    } else {
      // Reset to top for new operations
      setTimeout(() => {
        tableScroll.scrollToTop();
      }, 100);
    }
    
    lastOperation.current = '';
  }, [tableScroll]);
  
  // Specific operation handlers
  const handleFilter = useCallback((filterFn: () => void | Promise<void>) => {
    beforeOperation('filter');
    
    const result = filterFn();
    if (result instanceof Promise) {
      result.then(() => afterOperation('filter', false)); // Reset to top after filter
    } else {
      afterOperation('filter', false);
    }
  }, [beforeOperation, afterOperation]);
  
  const handleSort = useCallback((sortFn: () => void | Promise<void>) => {
    beforeOperation('sort');
    
    const result = sortFn();
    if (result instanceof Promise) {
      result.then(() => afterOperation('sort', true)); // Restore position after sort
    } else {
      afterOperation('sort', true);
    }
  }, [beforeOperation, afterOperation]);
  
  const handlePagination = useCallback((paginationFn: () => void | Promise<void>) => {
    beforeOperation('pagination');
    
    const result = paginationFn();
    if (result instanceof Promise) {
      result.then(() => afterOperation('pagination', false)); // Reset to top for new page
    } else {
      afterOperation('pagination', false);
    }
  }, [beforeOperation, afterOperation]);
  
  const handleRefresh = useCallback((refreshFn: () => void | Promise<void>) => {
    beforeOperation('refresh');
    
    const result = refreshFn();
    if (result instanceof Promise) {
      result.then(() => afterOperation('refresh', true)); // Restore position after refresh
    } else {
      afterOperation('refresh', true);
    }
  }, [beforeOperation, afterOperation]);
  
  return {
    ...tableScroll,
    handleFilter,
    handleSort,
    handlePagination,
    handleRefresh,
    beforeOperation,
    afterOperation
  };
};

// Hook for managing scroll in modal tables
export const useModalTableScroll = (modalId: string, tableId: string, isOpen: boolean) => {
  const fullTableId = `${modalId}-${tableId}`;
  const tableScroll = useEnhancedTableScroll({
    tableId: fullTableId,
    autoSave: isOpen,
    restoreOnMount: false, // Manual control for modals
    saveOnUnmount: false,
    smooth: false // Instant scroll for modals
  });
  
  // Restore scroll when modal opens
  useEffect(() => {
    if (isOpen && tableScroll.tableRef.current) {
      setTimeout(() => {
        tableScroll.restoreScrollPosition();
      }, 150);
    }
  }, [isOpen, tableScroll]);
  
  // Save scroll when modal closes
  useEffect(() => {
    if (!isOpen) {
      tableScroll.saveCurrentPosition();
    }
  }, [isOpen, tableScroll]);
  
  return tableScroll;
};
