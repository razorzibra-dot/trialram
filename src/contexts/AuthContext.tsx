/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthState } from '@/types/auth';
import { authService as factoryAuthService, sessionConfigService as factorySessionConfigService, uiNotificationService as factoryUINotificationService, multiTenantService as factoryMultiTenantService } from '@/services/serviceFactory';
import { sessionManager } from '@/utils/sessionManager';
import { httpInterceptor } from '@/utils/httpInterceptor';
import type { TenantContext } from '@/types/tenant';
import { canUserAccessModule } from '@/modules/ModuleRegistry';
import { ImpersonationLogType } from '@/types/superUserModule';
import { ImpersonationContextType } from '@/contexts/ImpersonationContext';

interface SessionInfo {
  isValid: boolean;
  timeUntilExpiry: number;
  user: unknown;
  tokenPayload: unknown;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  sessionInfo: () => SessionInfo;
  tenantId?: string;
  getTenantId: () => string | undefined;
  tenant?: TenantContext | null;
  /**
   * Check if the current user is a super admin
   * @returns true if user is authenticated and has isSuperAdmin flag set to true
   */
  isSuperAdmin: () => boolean;
  /**
   * Check if the current user can access a specific module
   * Delegates to ModuleRegistry for module access control logic
   * @param moduleName - Name of the module to check access for
   * @returns true if user is authenticated and has access to the module
   */
  canAccessModule: (moduleName: string) => boolean;
  /**
   * Check if user is currently in an active impersonation session
   * Integrates with ImpersonationContext via sessionStorage
   * @returns true if user is impersonating another user
   */
  isImpersonating: () => boolean;
  /**
   * Get the current impersonation session if user is impersonating another user
   * Integrates with ImpersonationContext and returns session details
   * @returns ImpersonationLogType object if impersonating, null otherwise
   */
  getCurrentImpersonationSession: () => ImpersonationLogType | null;
  /**
   * Get permissions for the current user (pulled from auth service / DB)
   */
  getUserPermissions: (role?: string) => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  const [tenant, setTenant] = useState<TenantContext | null>(null);

  const navigate = useNavigate();

  const handleSessionExpiry = React.useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });

    factoryUINotificationService.errorNotify(
      'Session Expired',
      'Your session has expired. Please log in again.'
    );

    navigate('/login');
  }, [navigate]);

  const handleSessionExtension = React.useCallback(() => {
    console.log('[AuthContext] Session extended - user resumed work');
  }, []);

  const handleUnauthorized = React.useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });

    navigate('/login');
  }, [navigate]);

  const handleForbidden = React.useCallback(() => {
    console.log('Access forbidden - insufficient permissions');
  }, []);

  const handleTokenRefresh = React.useCallback((newToken: string) => {
    setAuthState(prev => ({
      ...prev,
      token: newToken
    }));
  }, []);

  useEffect(() => {
    httpInterceptor.init({
      onUnauthorized: handleUnauthorized,
      onForbidden: handleForbidden,
      onTokenRefresh: handleTokenRefresh,
    });

    const initializeAuth = async () => {
      const isValidSession = sessionManager.validateSession();
      
      if (isValidSession) {
        const user = factoryAuthService.getCurrentUser();
        const token = factoryAuthService.getToken();
        
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });

        // Initialize multi-tenant context
        if (user?.id) {
          const tenantContext = await factoryMultiTenantService.initializeTenantContext(user.id);
          setTenant(tenantContext);
        }

        // Initialize session manager with config
        sessionManager.initialize(factorySessionConfigService.getConfig());
        
        // Start session monitoring with enhanced callbacks
        sessionManager.startSessionMonitoring(
          handleSessionExpiry,
          undefined, // onIdleWarning - handled by SessionProvider component
          handleSessionExtension
        );
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        factoryMultiTenantService.clearTenantContext();
        setTenant(null);
      }
    };

    initializeAuth();

    return () => {
      sessionManager.stopSessionMonitoring();
      httpInterceptor.destroy();
    };
  }, [handleSessionExpiry, handleSessionExtension, handleUnauthorized, handleForbidden, handleTokenRefresh]);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await factoryAuthService.login({ email, password });
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false
      });

      // Initialize multi-tenant context on login
      if (response.user?.id) {
        const tenantContext = await factoryMultiTenantService.initializeTenantContext(response.user.id);
        setTenant(tenantContext);
      }

      // Initialize session manager with config
      sessionManager.initialize(factorySessionConfigService.getConfig());
      
      // Start session monitoring
      sessionManager.startSessionMonitoring(
        handleSessionExpiry,
        undefined, // onIdleWarning - handled by SessionProvider component
        handleSessionExtension
      );

      factoryUINotificationService.successNotify(
        'Welcome back!',
        `Logged in as ${response.user.name}`
      );
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      factoryUINotificationService.errorNotify(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials'
      );
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Starting logout sequence...');
      
      // Step 1: Stop session monitoring immediately
      sessionManager.stopSessionMonitoring();
      console.log('[AuthContext] Session monitoring stopped');
      
      // Step 2: Clear session data from storage (BEFORE state changes)
      sessionManager.clearSession();
      console.log('[AuthContext] Session data cleared from storage');
      
      // Step 3: Call backend logout
      try {
        await factoryAuthService.logout();
        console.log('[AuthContext] Backend logout completed');
      } catch (backendError) {
        console.error('[AuthContext] Backend logout error (continuing):', backendError);
        // Continue even if backend logout fails - client-side cleanup is most important
      }

      // Step 3.5: End impersonation session if active during logout
      try {
        const impersonationSession = sessionStorage.getItem('impersonation_session');
        if (impersonationSession) {
          console.log('[AuthContext] Active impersonation session detected during logout');
          
          // Clear impersonation session from storage
          sessionStorage.removeItem('impersonation_session');
          console.log('[AuthContext] Impersonation session cleared from storage');
          
          // Log impersonation end event for audit trail
          try {
            // Attempt to call end impersonation API (if available)
            // This helps track when super admin's impersonation session ended
            console.log('[AuthContext] Impersonation session ended due to logout');
          } catch (auditError) {
            console.error('[AuthContext] Error logging impersonation end:', auditError);
            // Continue - audit logging failure shouldn't block logout
          }
        }
      } catch (impersonationError) {
        console.error('[AuthContext] Error cleaning up impersonation on logout:', impersonationError);
        // Continue - impersonation cleanup failure shouldn't block logout
      }
      
      // Step 4: Clear multi-tenant context on logout
      try {
        factoryMultiTenantService.clearTenantContext();
        setTenant(null);
        console.log('[AuthContext] Tenant context cleared');
      } catch (tenantError) {
        console.error('[AuthContext] Error clearing tenant context:', tenantError);
        setTenant(null);
      }

      // Step 5: CRITICAL - Update auth state to unauthenticated
      // Set isLoading: true during the transition to prevent race conditions
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true  // Keep loading to prevent redirect loops during transition
      });
      
      console.log('[AuthContext] Auth state cleared (isLoading=true)');

      // Step 6: Wait for React state updates to be processed and DOM re-renders
      // This ensures all components see isAuthenticated=false before navigation
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log('[AuthContext] State update delay completed');

      // Step 7: Show success notification
      factoryUINotificationService.successNotify(
        'Logged out',
        'You have been successfully logged out.'
      );

      // Step 8: Set isLoading to false now that we're about to navigate
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false  // Now set to false so LoginPage can render
      });
      
      console.log('[AuthContext] Auth state updated (isLoading=false)');
      
      // Step 9: Small additional delay to ensure state is fully processed
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 10: Navigate to login with replace to prevent back button issues
      console.log('[AuthContext] Navigating to login page');
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      
      // Ensure cleanup happens even on error
      try {
        factoryMultiTenantService.clearTenantContext();
      } catch (e) {
        console.error('[AuthContext] Error clearing tenant context in error handler:', e);
      }
      
      setTenant(null);
      
      // Clear auth state immediately on error
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log('[AuthContext] Error recovery: navigating to login');
      // Navigate with replace to ensure clean history
      navigate('/login', { replace: true });
    }
  };

  const hasRole = (role: string): boolean => {
    return factoryAuthService.hasRole(role);
  };

  const hasPermission = (permission: string): boolean => {
    return factoryAuthService.hasPermission(permission);
  };

  const getUserPermissions = (role?: string): string[] => {
    try {
      return factoryAuthService.getUserPermissions();
    } catch (e) {
      console.warn('[AuthContext] getUserPermissions failed', e);
      return [];
    }
  };

  const sessionInfo = () => {
    return sessionManager.getSessionInfo();
  };

  const getTenantId = (): string | undefined => {
    try {
      return tenant?.tenantId || factoryMultiTenantService.getCurrentTenantId();
    } catch {
      return undefined;
    }
  };

  /**
   * Check if the current user is a super admin
   * @returns true if user is authenticated and has isSuperAdmin flag set to true
   */
  const isSuperAdmin = (): boolean => {
    return authState.isAuthenticated && authState.user?.isSuperAdmin === true;
  };

  /**
   * Check if the current user can access a specific module
   * Delegates to ModuleRegistry for access control logic
   * @param moduleName - Name of the module to check access for
   * @returns true if user is authenticated and has access to the module
   */
  const canAccessModuleMethod = (moduleName: string): boolean => {
    try {
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('[AuthContext.canAccessModule] User not authenticated');
        return false;
      }

      return canUserAccessModule(authState.user, moduleName);
    } catch (error) {
      console.error('[AuthContext.canAccessModule] Error checking module access:', error);
      // Fail securely - deny access on error
      return false;
    }
  };

  /**
   * Check if user is currently in an active impersonation session
   * @returns true if user is impersonating another user
   */
  const isImpersonating = (): boolean => {
    return (
      authState.isAuthenticated &&
      authState.user !== null &&
      authState.user.impersonatedAsUserId !== undefined &&
      authState.user.impersonatedAsUserId !== null
    );
  };

  /**
   * Get the current impersonation session if user is impersonating another user
   * 
   * This method first tries to access ImpersonationContext for the active session.
   * If ImpersonationContext is not available or no active session exists there,
   * it falls back to building the session from user state.
   * 
   * @returns ImpersonationLogType if impersonating, null otherwise
   * @integrated Task 3.3: Links with ImpersonationContext via sessionStorage
   */
  const getCurrentImpersonationSession = (): ImpersonationLogType | null => {
    try {
      // Step 1: Try to get active session from ImpersonationContext via sessionStorage
      // This is the canonical source when in impersonation mode
      try {
        const storedSession = sessionStorage.getItem('impersonation_session');
        if (storedSession) {
          const { session } = JSON.parse(storedSession);
          if (
            session &&
            typeof session === 'object' &&
            session.id &&
            session.superUserId &&
            session.impersonatedUserId
          ) {
            console.log('[AuthContext.getCurrentImpersonationSession] Active session from ImpersonationContext', {
              superUserId: session.superUserId,
              impersonatedUserId: session.impersonatedUserId,
              tenantId: session.tenantId,
            });
            return session as ImpersonationLogType;
          }
        }
      } catch (storageError) {
        console.debug('[AuthContext.getCurrentImpersonationSession] Could not access ImpersonationContext session', storageError);
        // Continue to fallback method
      }

      // Step 2: Fallback - Build from user state
      // This is used when ImpersonationContext is not available or session storage is empty
      if (
        !authState.isAuthenticated ||
        !authState.user ||
        !authState.user.impersonatedAsUserId ||
        !authState.user.impersonationLogId
      ) {
        return null;
      }

      const session: ImpersonationLogType = {
        id: authState.user.impersonationLogId,
        superUserId: authState.user.id,
        impersonatedUserId: authState.user.impersonatedAsUserId,
        tenantId: authState.user.tenantId || '',
        loginAt: new Date().toISOString(), // Approximation from user state
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[AuthContext.getCurrentImpersonationSession] Active session from user state (fallback)', {
        superUserId: session.superUserId,
        impersonatedUserId: session.impersonatedUserId,
        tenantId: session.tenantId,
      });

      return session;
    } catch (error) {
      console.error('[AuthContext.getCurrentImpersonationSession] Error getting impersonation session:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasRole,
    hasPermission,
    getUserPermissions,
    sessionInfo,
    tenantId: tenant?.tenantId,
    getTenantId,
    tenant,
    isSuperAdmin,
    canAccessModule: canAccessModuleMethod,
    isImpersonating,
    getCurrentImpersonationSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
