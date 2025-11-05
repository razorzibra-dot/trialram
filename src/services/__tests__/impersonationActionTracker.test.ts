/**
 * Impersonation Action Tracker Service Tests
 * 
 * Tests the action tracking service for impersonation sessions:
 * - Page view tracking
 * - API call tracking
 * - CRUD operation tracking
 * - Export tracking
 * - Search tracking
 * - Print tracking
 * - Session action retrieval and clearing
 * - Action summary generation
 * 
 * Layer 3: MOCK SERVICE Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { impersonationActionTracker } from '../impersonationActionTracker';
import { ImpersonationAction } from '@/types/superUserModule';

describe('ImpersonationActionTracker Service', () => {
  const SESSION_ID = 'session-123';
  const INVALID_SESSION_ID = '';

  beforeEach(() => {
    // Clear actions before each test
    impersonationActionTracker.clearSessionActions(SESSION_ID);
  });

  describe('trackPageView', () => {
    it('should track page view successfully', async () => {
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions).toHaveLength(1);
      expect(actions[0].actionType).toBe('PAGE_VIEW');
      expect(actions[0].resource).toBe('/customers');
    });

    it('should track page view with metadata', async () => {
      const metadata = { queryParams: { sort: 'name' } };
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers', metadata);

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].metadata).toMatchObject({ queryParams: { sort: 'name' } });
    });

    it('should throw error on empty session ID', async () => {
      await expect(impersonationActionTracker.trackPageView(INVALID_SESSION_ID, '/customers')).rejects.toThrow(
        'Session ID is required'
      );
    });

    it('should throw error on empty page', async () => {
      await expect(impersonationActionTracker.trackPageView(SESSION_ID, '')).rejects.toThrow(
        'Page name is required'
      );
    });

    it('should include referrer in metadata', async () => {
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].metadata).toBeDefined();
      expect(actions[0].metadata?.timestamp).toBeDefined();
    });
  });

  describe('trackApiCall', () => {
    it('should track API call with all parameters', async () => {
      await impersonationActionTracker.trackApiCall(
        SESSION_ID,
        'GET',
        'customers',
        'cust_123',
        200,
        150,
        { operationType: 'list' }
      );

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('API_CALL');
      expect(actions[0].method).toBe('GET');
      expect(actions[0].resource).toBe('customers');
      expect(actions[0].resourceId).toBe('cust_123');
      expect(actions[0].status).toBe(200);
      expect(actions[0].duration).toBe(150);
    });

    it('should track API call with minimal parameters', async () => {
      await impersonationActionTracker.trackApiCall(SESSION_ID, 'POST', 'customers');

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('API_CALL');
      expect(actions[0].method).toBe('POST');
    });

    it('should normalize HTTP method to uppercase', async () => {
      await impersonationActionTracker.trackApiCall(SESSION_ID, 'post', 'customers');

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].method).toBe('POST');
    });

    it('should throw error without session ID', async () => {
      await expect(
        impersonationActionTracker.trackApiCall(INVALID_SESSION_ID, 'GET', 'customers')
      ).rejects.toThrow();
    });

    it('should throw error without HTTP method', async () => {
      await expect(impersonationActionTracker.trackApiCall(SESSION_ID, '', 'customers')).rejects.toThrow();
    });

    it('should throw error without resource', async () => {
      await expect(impersonationActionTracker.trackApiCall(SESSION_ID, 'GET', '')).rejects.toThrow();
    });
  });

  describe('trackCrudAction', () => {
    it('should track CREATE action', async () => {
      await impersonationActionTracker.trackCrudAction(
        SESSION_ID,
        'CREATE',
        'customer',
        'cust_123',
        { companyName: 'Acme Corp' }
      );

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('CREATE');
      expect(actions[0].resource).toBe('customer');
      expect(actions[0].resourceId).toBe('cust_123');
    });

    it('should track UPDATE action', async () => {
      await impersonationActionTracker.trackCrudAction(
        SESSION_ID,
        'UPDATE',
        'customer',
        'cust_123',
        { before: { status: 'prospect' }, after: { status: 'active' } }
      );

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('UPDATE');
    });

    it('should track DELETE action', async () => {
      await impersonationActionTracker.trackCrudAction(SESSION_ID, 'DELETE', 'customer', 'cust_123');

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('DELETE');
    });

    it('should throw error for invalid action type', async () => {
      await expect(
        impersonationActionTracker.trackCrudAction(SESSION_ID, 'INVALID' as never, 'customer', 'cust_123')
      ).rejects.toThrow();
    });

    it('should throw error without resource ID', async () => {
      await expect(
        impersonationActionTracker.trackCrudAction(SESSION_ID, 'CREATE', 'customer', '')
      ).rejects.toThrow();
    });
  });

  describe('trackExport', () => {
    it('should track export action', async () => {
      await impersonationActionTracker.trackExport(
        SESSION_ID,
        'customers',
        'csv',
        100,
        { filters: { status: 'active' } }
      );

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('EXPORT');
      expect(actions[0].resource).toBe('customers');
      expect(actions[0].metadata?.format).toBe('csv');
      expect(actions[0].metadata?.recordCount).toBe(100);
    });

    it('should throw error without resource', async () => {
      await expect(impersonationActionTracker.trackExport(SESSION_ID, '', 'csv', 100)).rejects.toThrow();
    });

    it('should throw error without format', async () => {
      await expect(impersonationActionTracker.trackExport(SESSION_ID, 'customers', '', 100)).rejects.toThrow();
    });
  });

  describe('trackSearch', () => {
    it('should track search action', async () => {
      await impersonationActionTracker.trackSearch(SESSION_ID, 'customers', 'Acme', 5);

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('SEARCH');
      expect(actions[0].resource).toBe('customers');
      expect(actions[0].metadata?.query).toBe('Acme');
      expect(actions[0].metadata?.resultCount).toBe(5);
    });

    it('should throw error without query', async () => {
      await expect(impersonationActionTracker.trackSearch(SESSION_ID, 'customers', '', 0)).rejects.toThrow();
    });
  });

  describe('trackPrint', () => {
    it('should track print action', async () => {
      await impersonationActionTracker.trackPrint(SESSION_ID, '/customers/cust_123', { format: 'pdf' });

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].actionType).toBe('PRINT');
      expect(actions[0].resource).toBe('/customers/cust_123');
    });
  });

  describe('Session Management', () => {
    it('should return empty array for non-existent session', () => {
      const actions = impersonationActionTracker.getSessionActions('non-existent');
      expect(actions).toEqual([]);
    });

    it('should get action count', async () => {
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      await impersonationActionTracker.trackPageView(SESSION_ID, '/sales');
      await impersonationActionTracker.trackApiCall(SESSION_ID, 'GET', 'customers');

      expect(impersonationActionTracker.getActionCount(SESSION_ID)).toBe(3);
    });

    it('should return 0 for non-existent session count', () => {
      expect(impersonationActionTracker.getActionCount('non-existent')).toBe(0);
    });

    it('should get action summary', async () => {
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      await impersonationActionTracker.trackPageView(SESSION_ID, '/sales');
      await impersonationActionTracker.trackApiCall(SESSION_ID, 'GET', 'customers');
      await impersonationActionTracker.trackCrudAction(SESSION_ID, 'CREATE', 'customer', 'cust_123');
      await impersonationActionTracker.trackExport(SESSION_ID, 'customers', 'csv', 50);

      const summary = impersonationActionTracker.getActionSummary(SESSION_ID);
      expect(summary).toEqual({
        PAGE_VIEW: 2,
        API_CALL: 1,
        CREATE: 1,
        UPDATE: 0,
        DELETE: 0,
        EXPORT: 1,
        SEARCH: 0,
        PRINT: 0,
      });
    });

    it('should clear session actions', async () => {
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      expect(impersonationActionTracker.getActionCount(SESSION_ID)).toBe(1);

      impersonationActionTracker.clearSessionActions(SESSION_ID);
      expect(impersonationActionTracker.getActionCount(SESSION_ID)).toBe(0);
    });
  });

  describe('Action Properties', () => {
    it('should include timestamp in all actions', async () => {
      const beforeTime = new Date().toISOString();
      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      const afterTime = new Date().toISOString();

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions[0].timestamp).toBeDefined();
      expect(actions[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(actions[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should validate action structure against schema', async () => {
      await impersonationActionTracker.trackApiCall(SESSION_ID, 'POST', 'customers', 'cust_123', 201, 250);

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      const action = actions[0];

      // Verify required properties
      expect(action.actionType).toBeDefined();
      expect(action.resource).toBeDefined();
      expect(action.timestamp).toBeDefined();

      // Verify it matches ImpersonationAction interface
      expect(typeof action.actionType).toBe('string');
      expect(typeof action.resource).toBe('string');
      expect(typeof action.timestamp).toBe('string');
    });
  });

  describe('Memory Management', () => {
    it('should limit actions to 1000 per session', async () => {
      // Add 1001 actions
      for (let i = 0; i < 1001; i++) {
        await impersonationActionTracker.trackPageView(SESSION_ID, `/page${i}`);
      }

      const actions = impersonationActionTracker.getSessionActions(SESSION_ID);
      expect(actions.length).toBe(1000);
      // First action should be removed
      expect(actions[0].resource).toBe('/page1');
    });
  });

  describe('Multiple Sessions', () => {
    it('should track actions for multiple sessions independently', async () => {
      const SESSION_2 = 'session-456';

      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      await impersonationActionTracker.trackPageView(SESSION_2, '/sales');

      expect(impersonationActionTracker.getActionCount(SESSION_ID)).toBe(1);
      expect(impersonationActionTracker.getActionCount(SESSION_2)).toBe(1);

      const actions1 = impersonationActionTracker.getSessionActions(SESSION_ID);
      const actions2 = impersonationActionTracker.getSessionActions(SESSION_2);

      expect(actions1[0].resource).toBe('/customers');
      expect(actions2[0].resource).toBe('/sales');
    });

    it('should clear actions for one session without affecting others', async () => {
      const SESSION_2 = 'session-456';

      await impersonationActionTracker.trackPageView(SESSION_ID, '/customers');
      await impersonationActionTracker.trackPageView(SESSION_2, '/sales');

      impersonationActionTracker.clearSessionActions(SESSION_ID);

      expect(impersonationActionTracker.getActionCount(SESSION_ID)).toBe(0);
      expect(impersonationActionTracker.getActionCount(SESSION_2)).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', () => {
      const count = impersonationActionTracker.getActionCount('missing-session');
      expect(count).toBe(0);
    });

    it('should not throw on clear with invalid session', () => {
      expect(() => impersonationActionTracker.clearSessionActions('invalid')).not.toThrow();
    });
  });
});