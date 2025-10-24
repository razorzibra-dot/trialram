import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager } from '@/utils/sessionManager';

export interface UseSessionManagerReturn {
  isSessionWarningVisible: boolean;
  timeRemaining: number;
  idleTime: number;
  sessionInfo: {
    isValid: boolean;
    timeUntilExpiry: number;
    idleTime: number;
    user: unknown;
    tokenPayload: unknown;
  };
  handleExtendSession: () => void;
  handleLogout: () => void;
  manualResetIdleTimer: () => void;
}

/**
 * useSessionManager
 * 
 * Custom hook for managing session state and idle tracking in components.
 * Provides session warning visibility, countdown timers, and session extension.
 * 
 * @example
 * ```tsx
 * const { isSessionWarningVisible, timeRemaining, handleExtendSession, handleLogout } = useSessionManager();
 * 
 * return (
 *   <>
 *     <SessionExpiryWarningModal
 *       isOpen={isSessionWarningVisible}
 *       timeRemaining={timeRemaining}
 *       onExtend={handleExtendSession}
 *       onLogout={handleLogout}
 *     />
 *   </>
 * );
 * ```
 */
export const useSessionManager = (): UseSessionManagerReturn => {
  const { logout } = useAuth();
  const [isSessionWarningVisible, setIsSessionWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  // Handle idle warning
  const handleIdleWarning = useCallback((timeUntilExpiry: number) => {
    console.log('[useSessionManager] Idle warning triggered, time remaining:', timeUntilExpiry);
    setTimeRemaining(Math.floor(timeUntilExpiry));
    setIsSessionWarningVisible(true);
  }, []);

  // Handle session expiry
  const handleSessionExpiry = useCallback(() => {
    console.log('[useSessionManager] Session expired');
    setIsSessionWarningVisible(false);
    logout().catch(err => {
      console.error('[useSessionManager] Error during logout:', err);
      // Force logout even if there's an error
      window.location.href = '/login';
    });
  }, [logout]);

  // Handle activity detected
  const handleActivityDetected = useCallback(() => {
    console.log('[useSessionManager] Activity detected, clearing warning');
    setIsSessionWarningVisible(false);
  }, []);

  // Initialize session monitoring on mount
  useEffect(() => {
    // Start session monitoring with callbacks
    sessionManager.startSessionMonitoring(
      handleSessionExpiry,
      handleIdleWarning,
      handleActivityDetected
    );

    // Update idle time every second
    const idleInterval = setInterval(() => {
      setIdleTime(sessionManager.getIdleTime());
    }, 1000);

    return () => {
      clearInterval(idleInterval);
      sessionManager.stopSessionMonitoring();
    };
  }, [handleSessionExpiry, handleIdleWarning, handleActivityDetected]);

  // Handle extend session
  const handleExtendSession = useCallback(() => {
    console.log('[useSessionManager] Session extended by user');
    sessionManager.extendSession();
    setIsSessionWarningVisible(false);
    setTimeRemaining(0);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    console.log('[useSessionManager] User initiated logout');
    logout().catch(err => {
      console.error('[useSessionManager] Error during logout:', err);
      window.location.href = '/login';
    });
  }, [logout]);

  // Manual reset for activity (if needed by components)
  const manualResetIdleTimer = useCallback(() => {
    sessionManager.resetIdleTimer();
    setIsSessionWarningVisible(false);
  }, []);

  // Get session info
  const sessionInfo = sessionManager.getSessionInfo();

  return {
    isSessionWarningVisible,
    timeRemaining,
    idleTime,
    sessionInfo,
    handleExtendSession,
    handleLogout,
    manualResetIdleTimer,
  };
};

export default useSessionManager;