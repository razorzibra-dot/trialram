/**
 * useImpersonationActionTracker Hook Tests
 * 
 * Tests the action tracking hook:
 * - Tracking page views, API calls, CRUD operations
 * - Session association
 * - Action retrieval and clearing
 * - Error handling
 * - Integration with ImpersonationContext
 * 
 * Layer 7: HOOKS Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImpersonationActionTracker } from '../useImpersonationActionTracker';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import * as serviceFactory from '@/services/serviceFactory';

// Mock the context
vi.mock('@/contexts/ImpersonationContext');
vi.mock('@/services/serviceFactory');

describe('useImpersonationActionTracker Hook', () => {
  const mockSession = {
    id: 'session-123',
    superUserId: 'admin-1',
    impersonatedUserId: 'user-1',
    tenantId: 'tenant-1',
    loginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Mock useImpersonationMode
    vi.mocked(useImpersonationMode).mockReturnValue({
      activeSession: mockSession,
      isImpersonating: true,
      startImpersonation: vi.fn(),
      endImpersonation: vi.fn(),
      getSessionDetails: vi.fn(() => mockSession),
      isSessionValid: vi.fn(() => true),
      getRemainingSessionTime: vi.fn(() => 28800000),
    });

    // Mock service factory
    vi.mocked(serviceFactory.impersonationActionTracker).trackPageView = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).trackApiCall = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).trackCrudAction = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).trackExport = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).trackSearch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).trackPrint = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serviceFactory.impersonationActionTracker).getSessionActions = vi.fn().mockReturnValue([]);
    vi.mocked(serviceFactory.impersonationActionTracker).getActionCount = vi.fn().mockReturnValue(0);
    vi.mocked(serviceFactory.impersonationActionTracker).getActionSummary = vi.fn().mockReturnValue({});
    vi.mocked(serviceFactory.impersonationActionTracker).clearSessionActions = vi.fn().mockReturnValue(undefined);
  });

  describe('Hook Initialization', () => {
    it('should initialize with active impersonation session', () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      expect(result.current.isTracking).toBe(true);
      expect(result.current.sessionId).toBe('session-123');
    });

    it('should throw error when used outside ImpersonationProvider', () => {
      vi.mocked(useImpersonationMode).mockImplementationOnce(() => {
        throw new Error('useImpersonationMode must be used within an ImpersonationProvider');
      });

      expect(() => renderHook(() => useImpersonationActionTracker())).toThrow();
    });

    it('should have no tracking when not impersonating', () => {
      vi.mocked(useImpersonationMode).mockReturnValueOnce({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: vi.fn(),
        endImpersonation: vi.fn(),
        getSessionDetails: vi.fn(() => null),
        isSessionValid: vi.fn(() => false),
        getRemainingSessionTime: vi.fn(() => -1),
      });

      const { result } = renderHook(() => useImpersonationActionTracker());

      expect(result.current.isTracking).toBe(false);
      expect(result.current.sessionId).toBeNull();
    });
  });

  describe('Page View Tracking', () => {
    it('should track page view', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackPageView('/customers');
      });

      expect(serviceFactory.impersonationActionTracker.trackPageView).toHaveBeenCalledWith(
        'session-123',
        '/customers',
        undefined
      );
    });

    it('should track page view with metadata', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());
      const metadata = { filters: { status: 'active' } };

      await act(async () => {
        await result.current.trackPageView('/customers', metadata);
      });

      expect(serviceFactory.impersonationActionTracker.trackPageView).toHaveBeenCalledWith(
        'session-123',
        '/customers',
        metadata
      );
    });

    it('should gracefully handle tracking failure', async () => {
      vi.mocked(serviceFactory.impersonationActionTracker.trackPageView).mockRejectedValueOnce(
        new Error('Tracking failed')
      );

      const { result } = renderHook(() => useImpersonationActionTracker());

      // Should not throw
      await act(async () => {
        await result.current.trackPageView('/customers');
      });

      expect(serviceFactory.impersonationActionTracker.trackPageView).toHaveBeenCalled();
    });
  });

  describe('API Call Tracking', () => {
    it('should track API call with all parameters', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackApiCall('GET', 'customers', 'cust_123', 200, 150, { operationType: 'fetch' });
      });

      expect(serviceFactory.impersonationActionTracker.trackApiCall).toHaveBeenCalledWith(
        'session-123',
        'GET',
        'customers',
        'cust_123',
        200,
        150,
        { operationType: 'fetch' }
      );
    });

    it('should track API call with minimal parameters', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackApiCall('POST', 'customers');
      });

      expect(serviceFactory.impersonationActionTracker.trackApiCall).toHaveBeenCalledWith(
        'session-123',
        'POST',
        'customers',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('CRUD Operation Tracking', () => {
    it('should track CREATE action', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackCreate('customer', 'cust_123', { name: 'Acme Corp' });
      });

      expect(serviceFactory.impersonationActionTracker.trackCrudAction).toHaveBeenCalledWith(
        'session-123',
        'CREATE',
        'customer',
        'cust_123',
        { name: 'Acme Corp' }
      );
    });

    it('should track UPDATE action', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackUpdate('customer', 'cust_123', { status: 'active' });
      });

      expect(serviceFactory.impersonationActionTracker.trackCrudAction).toHaveBeenCalledWith(
        'session-123',
        'UPDATE',
        'customer',
        'cust_123',
        { status: 'active' }
      );
    });

    it('should track DELETE action', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackDelete('customer', 'cust_123');
      });

      expect(serviceFactory.impersonationActionTracker.trackCrudAction).toHaveBeenCalledWith(
        'session-123',
        'DELETE',
        'customer',
        'cust_123',
        undefined
      );
    });
  });

  describe('Export Tracking', () => {
    it('should track export', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackExport('customers', 'csv', 100, { filters: { status: 'active' } });
      });

      expect(serviceFactory.impersonationActionTracker.trackExport).toHaveBeenCalledWith(
        'session-123',
        'customers',
        'csv',
        100,
        { filters: { status: 'active' } }
      );
    });
  });

  describe('Search Tracking', () => {
    it('should track search', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackSearch('customers', 'Acme', 5, { filters: { status: 'active' } });
      });

      expect(serviceFactory.impersonationActionTracker.trackSearch).toHaveBeenCalledWith(
        'session-123',
        'customers',
        'Acme',
        5,
        { filters: { status: 'active' } }
      );
    });
  });

  describe('Print Tracking', () => {
    it('should track print', async () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      await act(async () => {
        await result.current.trackPrint('/customers/cust_123', { format: 'pdf' });
      });

      expect(serviceFactory.impersonationActionTracker.trackPrint).toHaveBeenCalledWith(
        'session-123',
        '/customers/cust_123',
        { format: 'pdf' }
      );
    });
  });

  describe('Action Retrieval', () => {
    it('should get session actions', () => {
      const mockActions = [
        {
          actionType: 'PAGE_VIEW' as const,
          resource: '/customers',
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(serviceFactory.impersonationActionTracker.getSessionActions).mockReturnValueOnce(mockActions);

      const { result } = renderHook(() => useImpersonationActionTracker());

      const actions = result.current.getActions();

      expect(serviceFactory.impersonationActionTracker.getSessionActions).toHaveBeenCalledWith('session-123');
      expect(actions).toEqual(mockActions);
    });

    it('should get action count', () => {
      vi.mocked(serviceFactory.impersonationActionTracker.getActionCount).mockReturnValueOnce(5);

      const { result } = renderHook(() => useImpersonationActionTracker());

      const count = result.current.getActionCount();

      expect(serviceFactory.impersonationActionTracker.getActionCount).toHaveBeenCalledWith('session-123');
      expect(count).toBe(5);
    });

    it('should get action summary', () => {
      const mockSummary = {
        PAGE_VIEW: 2,
        API_CALL: 1,
        CREATE: 1,
        UPDATE: 0,
        DELETE: 0,
        EXPORT: 0,
        SEARCH: 0,
        PRINT: 0,
      };

      vi.mocked(serviceFactory.impersonationActionTracker.getActionSummary).mockReturnValueOnce(mockSummary);

      const { result } = renderHook(() => useImpersonationActionTracker());

      const summary = result.current.getActionSummary();

      expect(serviceFactory.impersonationActionTracker.getActionSummary).toHaveBeenCalledWith('session-123');
      expect(summary).toEqual(mockSummary);
    });
  });

  describe('Action Clearing', () => {
    it('should clear session actions', () => {
      const { result } = renderHook(() => useImpersonationActionTracker());

      act(() => {
        result.current.clearActions();
      });

      expect(serviceFactory.impersonationActionTracker.clearSessionActions).toHaveBeenCalledWith('session-123');
    });
  });

  describe('No Session Handling', () => {
    it('should return empty array when no session', () => {
      vi.mocked(useImpersonationMode).mockReturnValueOnce({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: vi.fn(),
        endImpersonation: vi.fn(),
        getSessionDetails: vi.fn(() => null),
        isSessionValid: vi.fn(() => false),
        getRemainingSessionTime: vi.fn(() => -1),
      });

      const { result } = renderHook(() => useImpersonationActionTracker());

      expect(result.current.getActions()).toEqual([]);
      expect(result.current.getActionCount()).toBe(0);
    });

    it('should return empty summary when no session', () => {
      vi.mocked(useImpersonationMode).mockReturnValueOnce({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: vi.fn(),
        endImpersonation: vi.fn(),
        getSessionDetails: vi.fn(() => null),
        isSessionValid: vi.fn(() => false),
        getRemainingSessionTime: vi.fn(() => -1),
      });

      const { result } = renderHook(() => useImpersonationActionTracker());

      expect(result.current.getActionSummary()).toEqual({});
    });

    it('should throw error when tracking without session', async () => {
      vi.mocked(useImpersonationMode).mockReturnValueOnce({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: vi.fn(),
        endImpersonation: vi.fn(),
        getSessionDetails: vi.fn(() => null),
        isSessionValid: vi.fn(() => false),
        getRemainingSessionTime: vi.fn(() => -1),
      });

      const { result } = renderHook(() => useImpersonationActionTracker());

      // Should not throw, but log warning and handle gracefully
      await act(async () => {
        await result.current.trackPageView('/customers');
      });

      // Tracking should not be called without session
      expect(serviceFactory.impersonationActionTracker.trackPageView).not.toHaveBeenCalled();
    });
  });
});