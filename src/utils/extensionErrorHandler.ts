/**
 * Extension Error Handler
 * Suppresses "Unchecked runtime.lastError" warnings from Chrome extensions
 * 
 * This utility prevents console errors when browser extensions attempt to
 * communicate with the page but fail to receive a response before the
 * message channel closes. This is a common issue with extensions like:
 * - Password managers
 * - Ad blockers
 * - Translation tools
 * - Developer extensions
 * 
 * The fix properly handles all incoming messages without breaking functionality.
 */

/**
 * Initialize extension error suppression
 * Sets up proper message handlers to prevent console warnings
 */
export const initializeExtensionErrorHandler = (): void => {
  // Only initialize in browser environment
  if (typeof window === 'undefined' || typeof chrome === 'undefined') {
    return;
  }

  try {
    // Handle potential runtime.lastError warnings
    // This is called when extensions try to communicate with the page
    if (window.chrome?.runtime?.onMessage) {
      window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Properly acknowledge receipt to prevent "lastError" warnings
        try {
          sendResponse({ received: true });
        } catch (error) {
          // Silently handle errors - the message port might already be closed
          console.debug('[ExtensionHandler] Message port already closed:', error instanceof Error ? error.message : String(error));
        }
        // Return false to indicate we handled the message synchronously
        return false;
      });
    }
  } catch (error) {
    // Silently fail - chrome API might not be available
    console.debug('[ExtensionHandler] Chrome runtime API not available:', error instanceof Error ? error.message : String(error));
  }

  // Also handle message events from iframes/extensions
  try {
    window.addEventListener('message', (event) => {
      // Only process our own messages, ignore extension communications
      if (event.origin === window.location.origin) {
        return;
      }
      
      // Acknowledge external messages to prevent hanging listeners
      if (event.data && typeof event.data === 'object') {
        try {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ received: true });
          }
        } catch (error) {
          // Silently handle port closure
        }
      }
    }, { passive: true });
  } catch (error) {
    // Silently fail
    console.debug('[ExtensionHandler] Message listener setup failed:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Suppress console errors in development
 * Filters out extension-related warnings to keep console clean
 */
export const setupConsoleErrorFilter = (): (() => void) | null => {
  // Only in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  try {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter extension-related errors
    const isExtensionError = (message: string | unknown): boolean => {
      const msgStr = String(message);
      return (
        msgStr.includes('runtime.lastError') ||
        msgStr.includes('A listener indicated an asynchronous response') ||
        msgStr.includes('message channel closed')
      );
    };

    // Override console.error to filter extension warnings
    console.error = function (...args: unknown[]) {
      if (!isExtensionError(args[0])) {
        originalError.apply(console, args);
      }
    };

    // Override console.warn to filter extension warnings
    console.warn = function (...args: unknown[]) {
      if (!isExtensionError(args[0])) {
        originalWarn.apply(console, args);
      }
    };

    // Return cleanup function
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  } catch (error) {
    console.debug('Failed to setup console error filter:', error);
    return null;
  }
};

/**
 * Initialize all extension error handlers
 */
export const initializeAllExtensionHandlers = (): (() => void) | null => {
  initializeExtensionErrorHandler();
  return setupConsoleErrorFilter();
};

export default initializeExtensionErrorHandler;