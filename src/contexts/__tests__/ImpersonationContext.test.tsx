/**
 * ImpersonationContext Unit Tests
 * 
 * Test suite for the ImpersonationContext provider and useImpersonationMode hook.
 * Tests cover:
 * - Session initialization and restoration
 * - Starting/ending impersonation sessions
 * - Session validation and timeouts
 * - Storage persistence
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ImpersonationProvider, useImpersonationMode } from '../ImpersonationContext';
import { ImpersonationLogType } from '@/types/superUserModule';

/**
 * Mock session data for testing
 */
const mockSession: ImpersonationLogType = {
  id: 'log-123',
  superUserId: 'admin-1',
  impersonatedUserId: 'user-456',
  tenantId: 'tenant-789',
  reason: 'Testing impersonation',
  loginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Helper to render hook with provider
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(ImpersonationProvider, null, children)
);

describe('ImpersonationContext', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Clear console spies
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with no active session by default', () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      expect(result.current.activeSession).toBeNull();
      expect(result.current.isImpersonating).toBe(false);
    });

    it('should restore session from sessionStorage on mount', async () => {
      const sessionData = { session: mockSession, startTime: Date.now() };
      sessionStorage.setItem('impersonation_session', JSON.stringify(sessionData));

      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeSession).toBeDefined();
        expect(result.current.isImpersonating).toBe(true);
      });
    });

    it('should handle corrupted sessionStorage data gracefully', async () => {
      sessionStorage.setItem('impersonation_session', 'invalid json {{{');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeSession).toBeNull();
        expect(result.current.isImpersonating).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw error if hook used outside provider', () => {
      expect(() => {
        renderHook(() => useImpersonationMode());
      }).toThrow('useImpersonationMode must be used within an ImpersonationProvider');
    });
  });

  describe('startImpersonation()', () => {
    it('should start an impersonation session', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      expect(result.current.activeSession).toEqual(mockSession);
      expect(result.current.isImpersonating).toBe(true);
    });

    it('should persist session to sessionStorage', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      const stored = sessionStorage.getItem('impersonation_session');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.session).toEqual(mockSession);
      expect(typeof parsed.startTime).toBe('number');
    });

    it('should reject invalid session data', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      const invalidSession = { id: 'test' } as ImpersonationLogType;

      await expect(
        act(async () => {
          await result.current.startImpersonation(invalidSession);
        })
      ).rejects.toThrow('Invalid impersonation session');
    });

    it('should log session start event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ImpersonationContext]'),
        expect.stringContaining('Impersonation session started'),
        expect.objectContaining({
          superUserId: 'admin-1',
          impersonatedUserId: 'user-456',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('endImpersonation()', () => {
    it('should end an active impersonation session', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      expect(result.current.isImpersonating).toBe(true);

      await act(async () => {
        await result.current.endImpersonation();
      });

      expect(result.current.activeSession).toBeNull();
      expect(result.current.isImpersonating).toBe(false);
    });

    it('should clear session from sessionStorage', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      expect(sessionStorage.getItem('impersonation_session')).toBeDefined();

      await act(async () => {
        await result.current.endImpersonation();
      });

      expect(sessionStorage.getItem('impersonation_session')).toBeNull();
    });

    it('should log session end event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.endImpersonation();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ImpersonationContext]'),
        expect.stringContaining('Impersonation session ended'),
        expect.objectContaining({
          impersonatedUserId: 'user-456',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle ending when no session is active', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      // Should not throw
      await act(async () => {
        await expect(result.current.endImpersonation()).resolves.toBeUndefined();
      });
    });
  });

  describe('getSessionDetails()', () => {
    it('should return null if not impersonating', () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      expect(result.current.getSessionDetails()).toBeNull();
    });

    it('should return active session details when impersonating', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      const details = result.current.getSessionDetails();
      expect(details).toEqual(mockSession);
      expect(details?.impersonatedUserId).toBe('user-456');
    });

    it('should return null if session has expired', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      // Create a session that will be considered expired
      const expiredStartTime = Date.now() - (9 * 60 * 60 * 1000); // 9 hours ago
      const sessionData = { session: mockSession, startTime: expiredStartTime };
      sessionStorage.setItem('impersonation_session', JSON.stringify(sessionData));

      // Re-render to trigger restoration
      const { result: result2 } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result2.current.getSessionDetails()).toBeNull();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('isSessionValid()', () => {
    it('should return false if no session is active', () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      expect(result.current.isSessionValid()).toBe(false);
    });

    it('should return true if session is active and within timeout', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      expect(result.current.isSessionValid()).toBe(true);
    });

    it('should return false if session has timed out', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a session that started 9 hours ago (past 8-hour timeout)
      const expiredStartTime = Date.now() - (9 * 60 * 60 * 1000);
      const sessionData = { session: mockSession, startTime: expiredStartTime };
      sessionStorage.setItem('impersonation_session', JSON.stringify(sessionData));

      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSessionValid()).toBe(false);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getRemainingSessionTime()', () => {
    it('should return -1 if no session is active', () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      expect(result.current.getRemainingSessionTime()).toBe(-1);
    });

    it('should return approximate remaining time in milliseconds', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result.current.startImpersonation(mockSession);
      });

      const remaining = result.current.getRemainingSessionTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(8 * 60 * 60 * 1000);
    });

    it('should return -1 if session has expired', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const expiredStartTime = Date.now() - (9 * 60 * 60 * 1000);
      const sessionData = { session: mockSession, startTime: expiredStartTime };
      sessionStorage.setItem('impersonation_session', JSON.stringify(sessionData));

      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result.current.getRemainingSessionTime()).toBe(-1);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Persistence', () => {
    it('should persist and restore session across context remount', async () => {
      const { result: result1 } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await result1.current.startImpersonation(mockSession);
      });

      expect(result1.current.isImpersonating).toBe(true);

      // Unmount and remount
      const { result: result2 } = renderHook(() => useImpersonationMode(), { wrapper });

      await waitFor(() => {
        expect(result2.current.isImpersonating).toBe(true);
        expect(result2.current.activeSession).toEqual(mockSession);
      });
    });

    it('should handle sessionStorage unavailability gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Temporarily disable sessionStorage
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      await act(async () => {
        await expect(result.current.startImpersonation(mockSession)).rejects.toThrow();
      });

      sessionStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Session Validation', () => {
    it('should validate required session fields', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      const incompleteSession = {
        id: 'log-123',
        superUserId: 'admin-1',
        // Missing impersonatedUserId and tenantId
      } as ImpersonationLogType;

      await expect(
        act(async () => {
          await result.current.startImpersonation(incompleteSession);
        })
      ).rejects.toThrow();
    });

    it('should accept valid session with optional fields', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      const validSession: ImpersonationLogType = {
        id: 'log-123',
        superUserId: 'admin-1',
        impersonatedUserId: 'user-456',
        tenantId: 'tenant-789',
        loginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Optional fields intentionally omitted
      };

      await act(async () => {
        await result.current.startImpersonation(validSession);
      });

      expect(result.current.isImpersonating).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should log errors when starting impersonation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      const invalidSession = {} as ImpersonationLogType;

      await expect(
        act(async () => {
          await result.current.startImpersonation(invalidSession);
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should maintain safe state even after errors', async () => {
      const { result } = renderHook(() => useImpersonationMode(), { wrapper });

      const invalidSession = {} as ImpersonationLogType;

      try {
        await act(async () => {
          await result.current.startImpersonation(invalidSession);
        });
      } catch {
        // Expected to throw
      }

      // State should remain safe
      expect(result.current.activeSession).toBeNull();
      expect(result.current.isImpersonating).toBe(false);
    });
  });
});