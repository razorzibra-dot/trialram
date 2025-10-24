import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionManager, SessionConfig } from '@/utils/sessionManager';
import SessionExpiryWarningModal from '@/components/auth/SessionExpiryWarningModal';

interface SessionProviderProps {
  children: React.ReactNode;
  config?: Partial<SessionConfig>;
}

/**
 * SessionProvider
 * 
 * Enterprise-level session management provider that handles:
 * - Idle detection and tracking
 * - Session timeout monitoring
 * - Automatic session extension on activity
 * - Idle warning modal with countdown
 * - Auto-redirect to login on expiry
 * 
 * Wraps the entire app to provide global session management.
 * 
 * @example
 * ```tsx
 * <SessionProvider config={{ idleTimeout: 1800, idleWarningTime: 300 }}>
 *   <App />
 * </SessionProvider>
 * ```
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({ children, config }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isSessionWarningVisible, setIsSessionWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Initialize session manager and set up monitoring
  useEffect(() => {
    if (!isAuthenticated) {
      sessionManager.stopSessionMonitoring();
      return;
    }

    // Initialize session manager with custom config
    sessionManager.initialize(config);

    // Define callbacks
    const handleSessionExpiry = async () => {
      console.log('[SessionProvider] Session expired, logging out...');
      setIsSessionWarningVisible(false);
      
      try {
        // Call logout and wait for completion
        await logout();
        // Logout handles navigation, so we don't need to redirect here
      } catch (err) {
        console.error('[SessionProvider] Error during logout:', err);
        // Force redirect to login even if logout fails
        // Use a small delay to ensure state updates are processed
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    };

    const handleIdleWarning = (timeUntilExpiry: number) => {
      console.log('[SessionProvider] Idle warning - time remaining:', timeUntilExpiry);
      setTimeRemaining(Math.floor(timeUntilExpiry));
      setIsSessionWarningVisible(true);
    };

    const handleActivityDetected = () => {
      console.log('[SessionProvider] Activity detected during warning');
      // Keep warning visible if user is still idle, but reset idle timer
    };

    // Start monitoring
    sessionManager.startSessionMonitoring(
      handleSessionExpiry,
      handleIdleWarning,
      handleActivityDetected
    );

    return () => {
      sessionManager.stopSessionMonitoring();
    };
  }, [isAuthenticated, logout, config]);

  const handleExtendSession = () => {
    console.log('[SessionProvider] Extending session');
    sessionManager.extendSession();
    setIsSessionWarningVisible(false);
  };

  const handleLogout = async () => {
    console.log('[SessionProvider] User chose to logout');
    try {
      // Hide warning modal before logging out
      setIsSessionWarningVisible(false);
      
      // Call logout and wait for completion
      await logout();
      
      // Logout handles navigation, so we don't need to redirect here
    } catch (err) {
      console.error('[SessionProvider] Error during logout:', err);
      
      // Force redirect as last resort
      // Use a small delay to ensure state updates
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  return (
    <>
      {children}
      {isAuthenticated && (
        <SessionExpiryWarningModal
          isOpen={isSessionWarningVisible}
          timeRemaining={timeRemaining}
          onExtend={handleExtendSession}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default SessionProvider;