/* eslint-disable react-refresh/only-export-components */
/**
 * Impersonation Context - Session Management for Super Admin Impersonation
 * 
 * This context manages the state and lifecycle of super admin impersonation sessions.
 * It provides methods to start, end, and track impersonation sessions with
 * sessionStorage persistence for cross-page navigation.
 * 
 * Key Features:
 * - Session persistence via sessionStorage
 * - Automatic session restoration on page reload
 * - Comprehensive error handling
 * - Audit logging for session events
 * - Type-safe impersonation session management
 * 
 * Usage:
 * ```typescript
 * const { isImpersonating, activeSession, startImpersonation, endImpersonation } = useImpersonationMode();
 * 
 * // Start impersonation
 * await startImpersonation(impersonationLog);
 * 
 * // Check if impersonating
 * if (isImpersonating) {
 *   console.log(`Impersonating: ${activeSession?.impersonatedUserId}`);
 * }
 * 
 * // End impersonation
 * await endImpersonation();
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ImpersonationLogType } from '@/types/superUserModule';

/**
 * Impersonation session configuration
 */
const IMPERSONATION_STORAGE_KEY = 'impersonation_session';
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Context type definition for impersonation management
 */
export interface ImpersonationContextType {
  /**
   * Currently active impersonation session, null if not impersonating
   */
  activeSession: ImpersonationLogType | null;

  /**
   * Whether a super admin is currently impersonating another user
   */
  isImpersonating: boolean;

  /**
   * Start an impersonation session
   * Stores session in state and sessionStorage for persistence
   * @param session - The impersonation session to activate
   * @throws Error if session data is invalid or storage fails
   */
  startImpersonation: (session: ImpersonationLogType) => Promise<void>;

  /**
   * End the current impersonation session
   * Clears session from state and sessionStorage
   * @throws Error if session clearing fails
   */
  endImpersonation: () => Promise<void>;

  /**
   * Get details of the current impersonation session
   * @returns Current session or null if not impersonating
   */
  getSessionDetails: () => ImpersonationLogType | null;

  /**
   * Check if session is still valid based on timeout
   * @returns true if session is still active and within timeout window
   */
  isSessionValid: () => boolean;

  /**
   * Get remaining session time in milliseconds
   * @returns Remaining time in ms, or -1 if no session or expired
   */
  getRemainingSessionTime: () => number;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

/**
 * Hook to access impersonation context
 * Must be used within an ImpersonationProvider
 * 
 * @returns Impersonation context object
 * @throws Error if used outside of ImpersonationProvider
 */
export const useImpersonationMode = (): ImpersonationContextType => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonationMode must be used within an ImpersonationProvider');
  }
  return context;
};

/**
 * ImpersonationProvider component
 * Provides impersonation session management to child components
 * 
 * Features:
 * - Restores sessions from sessionStorage on mount
 * - Manages session lifecycle
 * - Handles session validation and timeouts
 * - Provides comprehensive error handling
 */
export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ImpersonationLogType | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  /**
   * Restore session from sessionStorage on component mount
   */
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedSession = sessionStorage.getItem(IMPERSONATION_STORAGE_KEY);
        
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          const { session, startTime } = parsed;
          
          // Validate session structure
          if (
            session &&
            typeof session === 'object' &&
            session.id &&
            session.superUserId &&
            session.impersonatedUserId
          ) {
            // Check if session hasn't timed out
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < SESSION_TIMEOUT_MS) {
              setActiveSession(session as ImpersonationLogType);
              setSessionStartTime(startTime);
              console.log('[ImpersonationContext] Session restored from storage', {
                impersonatedUserId: session.impersonatedUserId,
                elapsedTime: `${Math.round(elapsedTime / 1000)}s`,
              });
            } else {
              // Session has timed out
              console.warn('[ImpersonationContext] Stored session has expired', {
                elapsedTime: `${Math.round(elapsedTime / 1000)}s`,
                timeoutMs: SESSION_TIMEOUT_MS,
              });
              sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        console.error('[ImpersonationContext] Error restoring session from storage:', error);
        // Clear corrupted session data
        try {
          sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        } catch (clearError) {
          console.error('[ImpersonationContext] Error clearing corrupted session:', clearError);
        }
      }
    };

    restoreSession();
  }, []);

  /**
   * Validate session structure
   * @param session - Session object to validate
   * @returns true if valid
   */
  const validateSession = useCallback((session: unknown): session is ImpersonationLogType => {
    if (!session || typeof session !== 'object') return false;
    
    const s = session as Record<string, unknown>;
    return (
      typeof s.id === 'string' &&
      typeof s.superUserId === 'string' &&
      typeof s.impersonatedUserId === 'string' &&
      typeof s.tenantId === 'string'
    );
  }, []);

  /**
   * Check if session is still valid based on timeout
   */
  const isSessionValid = useCallback((): boolean => {
    if (!sessionStartTime) return false;
    
    const elapsedTime = Date.now() - sessionStartTime;
    return elapsedTime < SESSION_TIMEOUT_MS;
  }, [sessionStartTime]);

  /**
   * Get remaining session time in milliseconds
   */
  const getRemainingSessionTime = useCallback((): number => {
    if (!sessionStartTime || !activeSession) return -1;
    
    const elapsedTime = Date.now() - sessionStartTime;
    const remaining = SESSION_TIMEOUT_MS - elapsedTime;
    
    return remaining > 0 ? remaining : -1;
  }, [sessionStartTime, activeSession]);

  /**
   * Start an impersonation session
   */
  const startImpersonation = useCallback(async (session: ImpersonationLogType): Promise<void> => {
    try {
      // Validate session
      if (!validateSession(session)) {
        throw new Error('Invalid impersonation session: missing required fields');
      }

      const startTime = Date.now();
      const sessionData = { session, startTime };

      // Store in sessionStorage for persistence
      sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(sessionData));

      // Update state
      setActiveSession(session);
      setSessionStartTime(startTime);

      console.log('[ImpersonationContext] Impersonation session started', {
        superUserId: session.superUserId,
        impersonatedUserId: session.impersonatedUserId,
        tenantId: session.tenantId,
        sessionId: session.id,
      });
    } catch (error) {
      console.error('[ImpersonationContext] Error starting impersonation:', error);
      throw error;
    }
  }, [validateSession]);

  /**
   * End the current impersonation session
   */
  const endImpersonation = useCallback(async (): Promise<void> => {
    try {
      const endingSession = activeSession;

      // Clear from sessionStorage
      sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);

      // Clear state
      setActiveSession(null);
      setSessionStartTime(null);

      if (endingSession) {
        console.log('[ImpersonationContext] Impersonation session ended', {
          impersonatedUserId: endingSession.impersonatedUserId,
          sessionId: endingSession.id,
          duration: sessionStartTime ? `${Math.round((Date.now() - sessionStartTime) / 1000)}s` : 'unknown',
        });
      }
    } catch (error) {
      console.error('[ImpersonationContext] Error ending impersonation:', error);
      throw error;
    }
  }, [activeSession, sessionStartTime]);

  /**
   * Get current session details
   */
  const getSessionDetails = useCallback((): ImpersonationLogType | null => {
    if (!activeSession || !isSessionValid()) {
      return null;
    }
    return activeSession;
  }, [activeSession, isSessionValid]);

  /**
   * Context value object
   */
  const value: ImpersonationContextType = {
    activeSession: isSessionValid() ? activeSession : null,
    isImpersonating: activeSession !== null && isSessionValid(),
    startImpersonation,
    endImpersonation,
    getSessionDetails,
    isSessionValid,
    getRemainingSessionTime,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};