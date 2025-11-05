/**
 * Impersonation Action Tracker Service - Mock Implementation
 * 
 * Tracks actions performed during super admin impersonation sessions.
 * Stores actions in memory and prepares them for submission with session end.
 * 
 * Action Types Tracked:
 * - PAGE_VIEW: User visited a page
 * - API_CALL: API request was made
 * - CREATE: New record created
 * - UPDATE: Record updated
 * - DELETE: Record deleted
 * - EXPORT: Data exported
 * - SEARCH: Search performed
 * - PRINT: Document printed
 * 
 * Layer Implementation:
 * - Layer 2 (TYPES): ImpersonationAction interface in superUserModule.ts
 * - Layer 3 (MOCK): This file
 * - Layer 5 (FACTORY): Routed through serviceFactory.ts
 * - Layer 6 (MODULE): Used via useImpersonationActionTracker hook
 */

import { ImpersonationAction } from '@/types/superUserModule';
import { ImpersonationActionSchema } from '@/types/superUserModule';

/**
 * Mock Impersonation Action Tracker Service
 * Manages action tracking during impersonation sessions
 */
class ImpersonationActionTracker {
  /**
   * In-memory storage for actions tracked during current session
   * Session ID -> Actions array
   */
  private sessionActions: Map<string, ImpersonationAction[]> = new Map();

  /**
   * Track a page view action during impersonation
   * 
   * @param sessionId - Active impersonation session ID
   * @param page - Page path or name
   * @param metadata - Optional additional metadata
   * @throws Error if page name is empty or session doesn't exist
   */
  async trackPageView(
    sessionId: string,
    page: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!page) throw new Error('Page name is required');

    try {
      const action: ImpersonationAction = {
        actionType: 'PAGE_VIEW',
        resource: page,
        metadata: {
          ...metadata,
          referrer: document?.referrer || undefined,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.log('[ImpersonationActionTracker] Page view tracked', {
        sessionId,
        page,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking page view:', error);
      throw error;
    }
  }

  /**
   * Track an API call action during impersonation
   * 
   * @param sessionId - Active impersonation session ID
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param resource - API resource/endpoint
   * @param resourceId - Optional resource ID
   * @param status - Response status code or 'success'/'error'
   * @param duration - Request duration in milliseconds
   * @param metadata - Optional additional metadata
   */
  async trackApiCall(
    sessionId: string,
    method: string,
    resource: string,
    resourceId?: string,
    status?: number | string,
    duration?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!method) throw new Error('HTTP method is required');
    if (!resource) throw new Error('Resource is required');

    try {
      const action: ImpersonationAction = {
        actionType: 'API_CALL',
        resource,
        resourceId,
        method: method.toUpperCase(),
        status: status || 200,
        metadata,
        timestamp: new Date().toISOString(),
        duration,
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.debug('[ImpersonationActionTracker] API call tracked', {
        sessionId,
        method,
        resource,
        status,
        duration,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking API call:', error);
      throw error;
    }
  }

  /**
   * Track a CRUD action (CREATE, UPDATE, DELETE)
   * 
   * @param sessionId - Active impersonation session ID
   * @param actionType - 'CREATE', 'UPDATE', or 'DELETE'
   * @param resource - Resource type (e.g., 'customer', 'contract')
   * @param resourceId - ID of the affected resource
   * @param metadata - Optional metadata including changes
   */
  async trackCrudAction(
    sessionId: string,
    actionType: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!['CREATE', 'UPDATE', 'DELETE'].includes(actionType)) {
      throw new Error('Action type must be CREATE, UPDATE, or DELETE');
    }
    if (!resource) throw new Error('Resource is required');
    if (!resourceId) throw new Error('Resource ID is required');

    try {
      const action: ImpersonationAction = {
        actionType,
        resource,
        resourceId,
        metadata,
        timestamp: new Date().toISOString(),
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.log('[ImpersonationActionTracker] CRUD action tracked', {
        sessionId,
        actionType,
        resource,
        resourceId,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking CRUD action:', error);
      throw error;
    }
  }

  /**
   * Track a data export action
   * 
   * @param sessionId - Active impersonation session ID
   * @param resource - What was exported
   * @param format - Export format (csv, excel, pdf, etc.)
   * @param recordCount - Number of records exported
   * @param metadata - Optional additional metadata
   */
  async trackExport(
    sessionId: string,
    resource: string,
    format: string,
    recordCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!resource) throw new Error('Resource is required');
    if (!format) throw new Error('Export format is required');

    try {
      const action: ImpersonationAction = {
        actionType: 'EXPORT',
        resource,
        metadata: {
          ...metadata,
          format,
          recordCount,
        },
        timestamp: new Date().toISOString(),
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.log('[ImpersonationActionTracker] Export tracked', {
        sessionId,
        resource,
        format,
        recordCount,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking export:', error);
      throw error;
    }
  }

  /**
   * Track a search action
   * 
   * @param sessionId - Active impersonation session ID
   * @param resource - What was searched
   * @param query - Search query
   * @param resultCount - Number of results found
   * @param metadata - Optional additional metadata
   */
  async trackSearch(
    sessionId: string,
    resource: string,
    query: string,
    resultCount: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!resource) throw new Error('Resource is required');
    if (!query) throw new Error('Search query is required');

    try {
      const action: ImpersonationAction = {
        actionType: 'SEARCH',
        resource,
        metadata: {
          ...metadata,
          query,
          resultCount,
        },
        timestamp: new Date().toISOString(),
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.log('[ImpersonationActionTracker] Search tracked', {
        sessionId,
        resource,
        resultCount,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking search:', error);
      throw error;
    }
  }

  /**
   * Track a print action
   * 
   * @param sessionId - Active impersonation session ID
   * @param resource - What was printed
   * @param metadata - Optional additional metadata
   */
  async trackPrint(
    sessionId: string,
    resource: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required');
    if (!resource) throw new Error('Resource is required');

    try {
      const action: ImpersonationAction = {
        actionType: 'PRINT',
        resource,
        metadata,
        timestamp: new Date().toISOString(),
      };

      // Validate action structure
      ImpersonationActionSchema.parse(action);

      // Add to session actions
      this.addAction(sessionId, action);

      console.log('[ImpersonationActionTracker] Print action tracked', {
        sessionId,
        resource,
      });
    } catch (error) {
      console.error('[ImpersonationActionTracker] Error tracking print:', error);
      throw error;
    }
  }

  /**
   * Get all actions tracked for a session
   * 
   * @param sessionId - Session ID to retrieve actions for
   * @returns Array of actions tracked during this session
   */
  getSessionActions(sessionId: string): ImpersonationAction[] {
    if (!sessionId) return [];
    return this.sessionActions.get(sessionId) || [];
  }

  /**
   * Get action count for a session
   * 
   * @param sessionId - Session ID
   * @returns Number of actions tracked
   */
  getActionCount(sessionId: string): number {
    if (!sessionId) return 0;
    return (this.sessionActions.get(sessionId) || []).length;
  }

  /**
   * Get action summary for a session (counts by action type)
   * 
   * @param sessionId - Session ID
   * @returns Object with counts for each action type
   */
  getActionSummary(sessionId: string): Record<string, number> {
    const actions = this.getSessionActions(sessionId);
    const summary: Record<string, number> = {
      PAGE_VIEW: 0,
      API_CALL: 0,
      CREATE: 0,
      UPDATE: 0,
      DELETE: 0,
      EXPORT: 0,
      SEARCH: 0,
      PRINT: 0,
    };

    actions.forEach(action => {
      if (action.actionType in summary) {
        summary[action.actionType]++;
      }
    });

    return summary;
  }

  /**
   * Clear all actions for a session (when ending impersonation)
   * 
   * @param sessionId - Session ID to clear
   */
  clearSessionActions(sessionId: string): void {
    if (!sessionId) return;
    this.sessionActions.delete(sessionId);
    console.log('[ImpersonationActionTracker] Session actions cleared', { sessionId });
  }

  /**
   * Internal helper: Add action to session
   */
  private addAction(sessionId: string, action: ImpersonationAction): void {
    if (!this.sessionActions.has(sessionId)) {
      this.sessionActions.set(sessionId, []);
    }

    const actions = this.sessionActions.get(sessionId)!;
    actions.push(action);

    // Limit to 1000 actions per session to prevent memory issues
    if (actions.length > 1000) {
      console.warn('[ImpersonationActionTracker] Action limit reached (1000), oldest actions removed');
      this.sessionActions.set(sessionId, actions.slice(-1000));
    }
  }
}

export const impersonationActionTracker = new ImpersonationActionTracker();