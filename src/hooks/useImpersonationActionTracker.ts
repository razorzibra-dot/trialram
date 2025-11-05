/**
 * useImpersonationActionTracker Hook
 * 
 * Hook for tracking actions during impersonation sessions.
 * Provides convenient methods to track different types of actions:
 * - Page views (navigation)
 * - API calls (read/write operations)
 * - CRUD operations (create/update/delete)
 * - Exports (data export)
 * - Searches (search queries)
 * - Prints (document printing)
 * 
 * Actions are automatically associated with the current impersonation session
 * and stored for audit trails and reporting.
 * 
 * Usage:
 * ```typescript
 * const actionTracker = useImpersonationActionTracker();
 * 
 * // Track page view
 * await actionTracker.trackPageView('/customers');
 * 
 * // Track API call
 * await actionTracker.trackApiCall('GET', 'customers', undefined, 200, 150);
 * 
 * // Track CRUD operation
 * await actionTracker.trackCreate('customer', 'cust_123', { name: 'Acme Corp' });
 * 
 * // Get action summary
 * const summary = actionTracker.getActionSummary();
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { impersonationActionTracker } from '@/services/serviceFactory';
import { ImpersonationAction } from '@/types/superUserModule';

/**
 * Hook return type for impersonation action tracking
 */
export interface ImpersonationActionTrackerHook {
  /**
   * Whether an impersonation session is currently active
   */
  isTracking: boolean;

  /**
   * Current session ID (null if not impersonating)
   */
  sessionId: string | null;

  /**
   * Track a page view action
   * @param page - Page path or name
   * @param metadata - Optional metadata
   */
  trackPageView: (page: string, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Track an API call action
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param resource - API resource/endpoint
   * @param resourceId - Optional resource ID
   * @param status - Response status code
   * @param duration - Request duration in milliseconds
   * @param metadata - Optional metadata
   */
  trackApiCall: (
    method: string,
    resource: string,
    resourceId?: string,
    status?: number,
    duration?: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Track a CREATE action
   * @param resource - Resource type
   * @param resourceId - ID of created resource
   * @param metadata - Optional metadata
   */
  trackCreate: (resource: string, resourceId: string, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Track an UPDATE action
   * @param resource - Resource type
   * @param resourceId - ID of updated resource
   * @param metadata - Optional metadata (can include before/after)
   */
  trackUpdate: (resource: string, resourceId: string, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Track a DELETE action
   * @param resource - Resource type
   * @param resourceId - ID of deleted resource
   * @param metadata - Optional metadata
   */
  trackDelete: (resource: string, resourceId: string, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Track a data export action
   * @param resource - What was exported
   * @param format - Export format (csv, excel, pdf, etc.)
   * @param recordCount - Number of records exported
   * @param metadata - Optional metadata
   */
  trackExport: (
    resource: string,
    format: string,
    recordCount: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Track a search action
   * @param resource - What was searched
   * @param query - Search query
   * @param resultCount - Number of results found
   * @param metadata - Optional metadata
   */
  trackSearch: (
    resource: string,
    query: string,
    resultCount: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  /**
   * Track a print action
   * @param resource - What was printed
   * @param metadata - Optional metadata
   */
  trackPrint: (resource: string, metadata?: Record<string, unknown>) => Promise<void>;

  /**
   * Get all actions tracked for current session
   */
  getActions: () => ImpersonationAction[];

  /**
   * Get action count for current session
   */
  getActionCount: () => number;

  /**
   * Get action summary (counts by type) for current session
   */
  getActionSummary: () => Record<string, number>;

  /**
   * Clear all tracked actions for current session
   */
  clearActions: () => void;
}

/**
 * Hook to track actions during impersonation
 * Must be used within components rendered by ImpersonationProvider
 * 
 * @returns Action tracker interface
 * @throws Error if used outside of ImpersonationProvider
 */
export function useImpersonationActionTracker(): ImpersonationActionTrackerHook {
  const { activeSession, isImpersonating } = useImpersonationMode();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Update session ID when impersonation starts/stops
  useEffect(() => {
    if (isImpersonating && activeSession?.id) {
      setSessionId(activeSession.id);
      console.log('[useImpersonationActionTracker] Tracking started for session:', activeSession.id);
    } else {
      setSessionId(null);
      console.log('[useImpersonationActionTracker] Tracking stopped');
    }
  }, [isImpersonating, activeSession?.id]);

  /**
   * Helper to ensure session is active before tracking
   */
  const ensureSession = useCallback((): string => {
    if (!sessionId || !isImpersonating) {
      throw new Error('No active impersonation session - cannot track action');
    }
    return sessionId;
  }, [sessionId, isImpersonating]);

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    async (page: string, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackPageView(sid, page, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track page view:', error);
        // Don't throw - allow action to continue even if tracking fails
      }
    },
    [ensureSession]
  );

  /**
   * Track API call
   */
  const trackApiCall = useCallback(
    async (
      method: string,
      resource: string,
      resourceId?: string,
      status?: number,
      duration?: number,
      metadata?: Record<string, unknown>
    ) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackApiCall(sid, method, resource, resourceId, status, duration, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track API call:', error);
        // Don't throw - allow action to continue even if tracking fails
      }
    },
    [ensureSession]
  );

  /**
   * Track CREATE action
   */
  const trackCreate = useCallback(
    async (resource: string, resourceId: string, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackCrudAction(sid, 'CREATE', resource, resourceId, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track create:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Track UPDATE action
   */
  const trackUpdate = useCallback(
    async (resource: string, resourceId: string, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackCrudAction(sid, 'UPDATE', resource, resourceId, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track update:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Track DELETE action
   */
  const trackDelete = useCallback(
    async (resource: string, resourceId: string, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackCrudAction(sid, 'DELETE', resource, resourceId, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track delete:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Track EXPORT action
   */
  const trackExport = useCallback(
    async (resource: string, format: string, recordCount: number, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackExport(sid, resource, format, recordCount, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track export:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Track SEARCH action
   */
  const trackSearch = useCallback(
    async (resource: string, query: string, resultCount: number, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackSearch(sid, resource, query, resultCount, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track search:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Track PRINT action
   */
  const trackPrint = useCallback(
    async (resource: string, metadata?: Record<string, unknown>) => {
      try {
        const sid = ensureSession();
        await impersonationActionTracker.trackPrint(sid, resource, metadata);
      } catch (error) {
        console.warn('[useImpersonationActionTracker] Failed to track print:', error);
      }
    },
    [ensureSession]
  );

  /**
   * Get all actions for current session
   */
  const getActions = useCallback((): ImpersonationAction[] => {
    if (!sessionId) return [];
    return impersonationActionTracker.getSessionActions(sessionId);
  }, [sessionId]);

  /**
   * Get action count for current session
   */
  const getActionCount = useCallback((): number => {
    if (!sessionId) return 0;
    return impersonationActionTracker.getActionCount(sessionId);
  }, [sessionId]);

  /**
   * Get action summary for current session
   */
  const getActionSummary = useCallback((): Record<string, number> => {
    if (!sessionId) return {};
    return impersonationActionTracker.getActionSummary(sessionId);
  }, [sessionId]);

  /**
   * Clear actions for current session
   */
  const clearActions = useCallback((): void => {
    if (!sessionId) return;
    impersonationActionTracker.clearSessionActions(sessionId);
  }, [sessionId]);

  return {
    isTracking: isImpersonating,
    sessionId,
    trackPageView,
    trackApiCall,
    trackCreate,
    trackUpdate,
    trackDelete,
    trackExport,
    trackSearch,
    trackPrint,
    getActions,
    getActionCount,
    getActionSummary,
    clearActions,
  };
}