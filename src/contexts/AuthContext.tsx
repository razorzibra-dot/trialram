/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthState } from '@/types/auth';
import { authService } from '@/services';
import { sessionManager } from '@/utils/sessionManager';
import { sessionConfigService } from '@/services/sessionConfigService';
import { httpInterceptor } from '@/utils/httpInterceptor';
import { uiNotificationService } from '@/services/uiNotificationService';
import { multiTenantService, type TenantContext } from '@/services/supabase/multiTenantService';

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

    uiNotificationService.errorNotify(
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
        const user = authService.getCurrentUser();
        const token = authService.getToken();
        
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });

        // Initialize multi-tenant context
        if (user?.id) {
          const tenantContext = await multiTenantService.initializeTenantContext(user.id);
          setTenant(tenantContext);
        }

        // Initialize session manager with config
        sessionManager.initialize(sessionConfigService.getConfig());
        
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
        multiTenantService.clearTenantContext();
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
      const response = await authService.login({ email, password });
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false
      });

      // Initialize multi-tenant context on login
      if (response.user?.id) {
        const tenantContext = await multiTenantService.initializeTenantContext(response.user.id);
        setTenant(tenantContext);
      }

      // Initialize session manager with config
      sessionManager.initialize(sessionConfigService.getConfig());
      
      // Start session monitoring
      sessionManager.startSessionMonitoring(
        handleSessionExpiry,
        undefined, // onIdleWarning - handled by SessionProvider component
        handleSessionExtension
      );

      uiNotificationService.successNotify(
        'Welcome back!',
        `Logged in as ${response.user.name}`
      );
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      uiNotificationService.errorNotify(
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
        await authService.logout();
        console.log('[AuthContext] Backend logout completed');
      } catch (backendError) {
        console.error('[AuthContext] Backend logout error (continuing):', backendError);
        // Continue even if backend logout fails - client-side cleanup is most important
      }
      
      // Step 4: Clear multi-tenant context on logout
      try {
        multiTenantService.clearTenantContext();
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
      uiNotificationService.successNotify(
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
        multiTenantService.clearTenantContext();
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
    return authService.hasRole(role);
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const sessionInfo = () => {
    return sessionManager.getSessionInfo();
  };

  const getTenantId = (): string | undefined => {
    try {
      return tenant?.tenantId || multiTenantService.getCurrentTenantId();
    } catch {
      return undefined;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasRole,
    hasPermission,
    sessionInfo,
    tenantId: tenant?.tenantId,
    getTenantId,
    tenant
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
