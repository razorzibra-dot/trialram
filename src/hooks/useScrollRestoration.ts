import { useEffect, useCallback, useRef, useMemo } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface UseScrollRestorationOptions {
  smooth?: boolean;
  delay?: number;
  threshold?: number; // Minimum scroll distance to trigger save
  debounceMs?: number; // Debounce scroll events
}

export const useScrollRestoration = (
  elementRef: React.RefObject<HTMLElement>,
  savePosition: (position: ScrollPosition) => void,
  restorePosition: () => ScrollPosition | null,
  options: UseScrollRestorationOptions = {}
) => {
  const {
    smooth = true,
    delay = 100,
    threshold = 10,
    debounceMs = 100
  } = options;
  
  const lastScrollPosition = useRef<ScrollPosition>({ x: 0, y: 0, timestamp: 0 });
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isRestoring = useRef(false);
  
  // Smooth scroll to position
  const scrollToPosition = useCallback((position: ScrollPosition) => {
    if (!elementRef.current) return;
    
    isRestoring.current = true;
    
    if (smooth) {
      elementRef.current.scrollTo({
        left: position.x,
        top: position.y,
        behavior: 'smooth'
      });
      
      // Reset restoring flag after animation
      setTimeout(() => {
        isRestoring.current = false;
      }, 500);
    } else {
      elementRef.current.scrollLeft = position.x;
      elementRef.current.scrollTop = position.y;
      isRestoring.current = false;
    }
  }, [elementRef, smooth]);
  
  // Debounced scroll save
  const debouncedSave = useCallback((position: ScrollPosition) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      // Only save if scroll distance is significant
      const deltaX = Math.abs(position.x - lastScrollPosition.current.x);
      const deltaY = Math.abs(position.y - lastScrollPosition.current.y);
      
      if (deltaX >= threshold || deltaY >= threshold) {
        savePosition(position);
        lastScrollPosition.current = position;
      }
    }, debounceMs);
  }, [savePosition, threshold, debounceMs]);
  
  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!elementRef.current || isRestoring.current) return;
    
    const element = elementRef.current;
    const position: ScrollPosition = {
      x: element.scrollLeft,
      y: element.scrollTop,
      timestamp: Date.now()
    };
    
    debouncedSave(position);
  }, [elementRef, debouncedSave]);
  
  // Restore scroll position on mount
  const restoreScrollPosition = useCallback(() => {
    const position = restorePosition();
    if (position && elementRef.current) {
      // Delay restoration to ensure content is loaded
      setTimeout(() => {
        scrollToPosition(position);
      }, delay);
    }
  }, [restorePosition, elementRef, scrollToPosition, delay]);
  
  // Save current position
  const saveCurrentPosition = useCallback(() => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    const position: ScrollPosition = {
      x: element.scrollLeft,
      y: element.scrollTop,
      timestamp: Date.now()
    };
    
    savePosition(position);
  }, [elementRef, savePosition]);
  
  // Set up scroll listener
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);
  
  // Memoize the return object to prevent infinite loops in components
  return useMemo(() => ({
    restoreScrollPosition,
    saveCurrentPosition,
    scrollToPosition,
    isRestoring: () => isRestoring.current
  }), [restoreScrollPosition, saveCurrentPosition, scrollToPosition]);
};

// Hook for managing scroll restoration with intersection observer
export const useScrollRestorationWithVisibility = (
  elementRef: React.RefObject<HTMLElement>,
  savePosition: (position: ScrollPosition) => void,
  restorePosition: () => ScrollPosition | null,
  options: UseScrollRestorationOptions = {}
) => {
  const scrollRestoration = useScrollRestoration(elementRef, savePosition, restorePosition, options);
  const isVisible = useRef(true);
  
  // Set up intersection observer to pause scroll saving when element is not visible
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);
  
  // Enhanced save that checks visibility
  const saveCurrentPosition = useCallback(() => {
    if (isVisible.current) {
      scrollRestoration.saveCurrentPosition();
    }
  }, [scrollRestoration]);
  
  // Memoize the return object to prevent infinite loops
  return useMemo(() => ({
    ...scrollRestoration,
    saveCurrentPosition,
    isVisible: () => isVisible.current
  }), [scrollRestoration, saveCurrentPosition]);
};

// Hook for table scroll restoration with column/row awareness
export const useTableScrollRestoration = (
  tableRef: React.RefObject<HTMLElement>,
  savePosition: (position: ScrollPosition) => void,
  restorePosition: () => ScrollPosition | null,
  options: UseScrollRestorationOptions = {}
) => {
  const scrollRestoration = useScrollRestoration(tableRef, savePosition, restorePosition, {
    ...options,
    threshold: 5, // Lower threshold for tables
    debounceMs: 50 // Faster response for tables
  });
  
  // Enhanced restore that waits for table content
  const restoreScrollPosition = useCallback(() => {
    if (!tableRef.current) return;
    
    // Wait for table to be fully rendered
    const checkTableReady = () => {
      const table = tableRef.current;
      if (!table) return;
      
      const rows = table.querySelectorAll('tr');
      if (rows.length > 0) {
        scrollRestoration.restoreScrollPosition();
      } else {
        // Retry after a short delay
        setTimeout(checkTableReady, 50);
      }
    };
    
    checkTableReady();
  }, [tableRef, scrollRestoration]);
  
  // Memoize the return object to prevent infinite loops
  return useMemo(() => ({
    ...scrollRestoration,
    restoreScrollPosition
  }), [scrollRestoration, restoreScrollPosition]);
};

// Hook for modal scroll restoration
export const useModalScrollRestoration = (
  modalRef: React.RefObject<HTMLElement>,
  modalId: string,
  savePosition: (position: ScrollPosition) => void,
  restorePosition: () => ScrollPosition | null,
  isOpen: boolean
) => {
  const scrollRestoration = useScrollRestoration(modalRef, savePosition, restorePosition, {
    smooth: false, // Instant scroll for modals
    delay: 0,
    threshold: 5,
    debounceMs: 100
  });
  
  // Restore position when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Small delay to ensure modal content is rendered
      setTimeout(() => {
        scrollRestoration.restoreScrollPosition();
      }, 100);
    }
  }, [isOpen, modalRef, scrollRestoration]);
  
  // Save position when modal closes
  useEffect(() => {
    if (!isOpen) {
      scrollRestoration.saveCurrentPosition();
    }
  }, [isOpen, scrollRestoration]);
  
  // Return the memoized scrollRestoration object (already memoized by useScrollRestoration)
  return scrollRestoration;
};
