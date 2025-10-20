/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthState } from '@/types/auth';
import { authService } from '@/services';
import { sessionManager } from '@/utils/sessionManager';
import { httpInterceptor } from '@/utils/httpInterceptor';
import { toast } from '@/hooks/use-toast';
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

    toast({
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
      variant: 'destructive',
    });

    navigate('/login');
  }, [navigate]);

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

        sessionManager.startSessionMonitoring(handleSessionExpiry);
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
  }, [handleSessionExpiry, handleUnauthorized, handleForbidden, handleTokenRefresh]);

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

      sessionManager.startSessionMonitoring(handleSessionExpiry);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${response.user.name}`,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
      
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      sessionManager.stopSessionMonitoring();
      
      sessionManager.clearSession();
      
      await authService.logout();
      
      // Clear multi-tenant context on logout
      multiTenantService.clearTenantContext();
      setTenant(null);
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });

      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });

      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear multi-tenant context on logout
      multiTenantService.clearTenantContext();
      setTenant(null);
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      navigate('/login');
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
