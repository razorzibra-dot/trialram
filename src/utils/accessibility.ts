/**
 * Accessibility utilities for the CRM application
 * Provides functions for managing focus, announcements, and keyboard navigation
 */

// Focus management utilities
export const focusUtils = {
  /**
   * Trap focus within a container element
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },

  /**
   * Get the currently focused element
   */
  getCurrentFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement
  },

  /**
   * Move focus to the first focusable element in a container
   */
  focusFirst: (container: HTMLElement) => {
    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusableElement) {
      focusableElement.focus()
    }
  }
}

// Screen reader announcements
export const announceUtils = {
  /**
   * Create a live region for screen reader announcements
   */
  createLiveRegion: (politeness: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', politeness)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    document.body.appendChild(liveRegion)
    return liveRegion
  },

  /**
   * Announce a message to screen readers
   */
  announce: (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = announceUtils.createLiveRegion(politeness)
    liveRegion.textContent = message
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion)
    }, 1000)
  },

  /**
   * Announce form validation errors
   */
  announceError: (message: string) => {
    announceUtils.announce(`Error: ${message}`, 'assertive')
  },

  /**
   * Announce successful actions
   */
  announceSuccess: (message: string) => {
    announceUtils.announce(`Success: ${message}`, 'polite')
  }
}

// Keyboard navigation utilities
export const keyboardUtils = {
  /**
   * Handle escape key to close modals/dropdowns
   */
  handleEscape: (callback: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  },

  /**
   * Handle arrow key navigation for lists/menus
   */
  handleArrowNavigation: (
    container: HTMLElement,
    options: {
      vertical?: boolean
      horizontal?: boolean
      loop?: boolean
    } = { vertical: true, loop: true }
  ) => {
    const focusableElements = container.querySelectorAll(
      '[role="menuitem"], [role="option"], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
      let nextIndex = currentIndex
      
      switch (e.key) {
        case 'ArrowDown':
          if (options.vertical) {
            nextIndex = currentIndex + 1
            if (nextIndex >= focusableElements.length) {
              nextIndex = options.loop ? 0 : currentIndex
            }
            e.preventDefault()
          }
          break
        case 'ArrowUp':
          if (options.vertical) {
            nextIndex = currentIndex - 1
            if (nextIndex < 0) {
              nextIndex = options.loop ? focusableElements.length - 1 : currentIndex
            }
            e.preventDefault()
          }
          break
        case 'ArrowRight':
          if (options.horizontal) {
            nextIndex = currentIndex + 1
            if (nextIndex >= focusableElements.length) {
              nextIndex = options.loop ? 0 : currentIndex
            }
            e.preventDefault()
          }
          break
        case 'ArrowLeft':
          if (options.horizontal) {
            nextIndex = currentIndex - 1
            if (nextIndex < 0) {
              nextIndex = options.loop ? focusableElements.length - 1 : currentIndex
            }
            e.preventDefault()
          }
          break
        case 'Home':
          nextIndex = 0
          e.preventDefault()
          break
        case 'End':
          nextIndex = focusableElements.length - 1
          e.preventDefault()
          break
      }
      
      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus()
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
}

// Color contrast utilities
export const contrastUtils = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = contrastUtils.getLuminance(...color1)
    const lum2 = contrastUtils.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  },

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAG: (ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean => {
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7
    }
    return size === 'large' ? ratio >= 3 : ratio >= 4.5
  }
}

// ARIA utilities
export const ariaUtils = {
  /**
   * Generate unique IDs for ARIA relationships
   */
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Set up ARIA describedby relationships
   */
  setDescribedBy: (element: HTMLElement, describingElements: HTMLElement[]): void => {
    const ids = describingElements.map(el => {
      if (!el.id) {
        el.id = ariaUtils.generateId('desc')
      }
      return el.id
    })
    element.setAttribute('aria-describedby', ids.join(' '))
  },

  /**
   * Set up ARIA labelledby relationships
   */
  setLabelledBy: (element: HTMLElement, labellingElements: HTMLElement[]): void => {
    const ids = labellingElements.map(el => {
      if (!el.id) {
        el.id = ariaUtils.generateId('label')
      }
      return el.id
    })
    element.setAttribute('aria-labelledby', ids.join(' '))
  },

  /**
   * Update ARIA expanded state
   */
  setExpanded: (element: HTMLElement, expanded: boolean): void => {
    element.setAttribute('aria-expanded', expanded.toString())
  },

  /**
   * Update ARIA selected state
   */
  setSelected: (element: HTMLElement, selected: boolean): void => {
    element.setAttribute('aria-selected', selected.toString())
  }
}

// Reduced motion utilities
export const motionUtils = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Apply animation only if user doesn't prefer reduced motion
   */
  conditionalAnimation: (element: HTMLElement, animationClass: string): void => {
    if (!motionUtils.prefersReducedMotion()) {
      element.classList.add(animationClass)
    }
  }
}

// Export all utilities
export const a11y = {
  focus: focusUtils,
  announce: announceUtils,
  keyboard: keyboardUtils,
  contrast: contrastUtils,
  aria: ariaUtils,
  motion: motionUtils
}
