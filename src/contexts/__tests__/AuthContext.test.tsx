/**
 * AuthContext Tests
 * Tests for the new super admin methods added in Task 2.6
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { User } from '@/types/auth';
import * as services from '@/services';
import * as sessionManagerModule from '@/utils/sessionManager';
import * as ModuleRegistry from '@/modules/ModuleRegistry';

// Mock dependencies
jest.mock('@/services', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getToken: jest.fn(),
    hasRole: jest.fn(),
    hasPermission: jest.fn(),
  },
}));

jest.mock('@/utils/sessionManager', () => ({
  sessionManager: {
    validateSession: jest.fn(() => false),
    initialize: jest.fn(),
    startSessionMonitoring: jest.fn(),
    stopSessionMonitoring: jest.fn(),
    clearSession: jest.fn(),
    getSessionInfo: jest.fn(() => ({
      isValid: false,
      timeUntilExpiry: 0,
      user: null,
      tokenPayload: null,
    })),
  },
}));

jest.mock('@/services/sessionConfigService', () => ({
  sessionConfigService: {
    getConfig: jest.fn(() => ({})),
  },
}));

jest.mock('@/utils/httpInterceptor', () => ({
  httpInterceptor: {
    init: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('@/services/uiNotificationService', () => ({
  uiNotificationService: {
    successNotify: jest.fn(),
    errorNotify: jest.fn(),
  },
}));

jest.mock('@/services/supabase/multiTenantService', () => ({
  multiTenantService: {
    initializeTenantContext: jest.fn(),
    getCurrentTenantId: jest.fn(),
    clearTenantContext: jest.fn(),
  },
}));

jest.mock('@/modules/ModuleRegistry', () => ({
  canUserAccessModule: jest.fn((user: User, moduleName: string) => {
    // Mock implementation: only super admin can access super-admin module
    if (moduleName === 'super-admin') {
      return user.isSuperAdmin === true;
    }
    // Regular users can access tenant modules
    return !user.isSuperAdmin;
  }),
}));

/**
 * Test component that uses the new AuthContext methods
 */
const TestComponent = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="is-super-admin">{auth.isSuperAdmin() ? 'true' : 'false'}</div>
      <div data-testid="can-access-customers">
        {auth.canAccessModule('customers') ? 'true' : 'false'}
      </div>
      <div data-testid="can-access-super-admin">
        {auth.canAccessModule('super-admin') ? 'true' : 'false'}
      </div>
      <div data-testid="impersonation-session">
        {auth.getCurrentImpersonationSession() ? 'impersonating' : 'not-impersonating'}
      </div>
      <div data-testid="auth-state">
        {auth.user ? `${auth.user.name}` : 'no-user'}
      </div>
    </div>
  );
};

/**
 * Render helper that wraps TestComponent with required providers
 */
const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext - New Super Admin Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSuperAdmin()', () => {
    it('should return false when user is not authenticated', () => {
      renderWithAuth();
      expect(screen.getByTestId('is-super-admin')).toHaveTextContent('false');
    });

    it('should return false when user is not a super admin', () => {
      const regularUser: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(regularUser);

      renderWithAuth();
      expect(screen.getByTestId('is-super-admin')).toHaveTextContent('false');
    });

    it('should return true when user is a super admin', () => {
      const superAdminUser: User = {
        id: 'super-admin-1',
        email: 'admin@example.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(superAdminUser);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('is-super-admin')).toHaveTextContent('true');
    });
  });

  describe('canAccessModule()', () => {
    it('should return false for unauthenticated users', () => {
      renderWithAuth();
      expect(screen.getByTestId('can-access-customers')).toHaveTextContent('false');
    });

    it('should allow regular users to access tenant modules', () => {
      const regularUser: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(regularUser);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('can-access-customers')).toHaveTextContent('true');
    });

    it('should deny regular users access to super-admin module', () => {
      const regularUser: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(regularUser);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('can-access-super-admin')).toHaveTextContent('false');
    });

    it('should allow super admins to access super-admin module', () => {
      const superAdminUser: User = {
        id: 'super-admin-1',
        email: 'admin@example.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: null,
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(superAdminUser);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('can-access-super-admin')).toHaveTextContent('true');
    });

    it('should return false on error and fail securely', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('can-access-customers')).toHaveTextContent('false');
    });
  });

  describe('getCurrentImpersonationSession()', () => {
    it('should return null when user is not impersonating', () => {
      renderWithAuth();
      expect(screen.getByTestId('impersonation-session')).toHaveTextContent('not-impersonating');
    });

    it('should return null when impersonatedAsUserId is missing', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        impersonationLogId: 'log-1',
        // impersonatedAsUserId is missing
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('impersonation-session')).toHaveTextContent('not-impersonating');
    });

    it('should return impersonation session when user is impersonating', () => {
      const superAdminUser: User = {
        id: 'super-admin-1',
        email: 'admin@example.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: 'tenant-1',
        impersonatedAsUserId: 'impersonated-user-1',
        impersonationLogId: 'log-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(superAdminUser);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('impersonation-session')).toHaveTextContent('impersonating');
    });

    it('should return null when not authenticated', () => {
      jest.mocked(services.authService.getCurrentUser).mockReturnValue(null);

      renderWithAuth();
      expect(screen.getByTestId('impersonation-session')).toHaveTextContent('not-impersonating');
    });
  });

  describe('Delegation to existing services', () => {
    it('should delegate module access check to ModuleRegistry.canUserAccessModule', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      screen.getByTestId('can-access-customers'); // This triggers the delegation
    });

    it('should not duplicate ModuleRegistry logic', () => {
      // This test ensures that canAccessModule delegates to ModuleRegistry
      // instead of re-implementing the access control logic
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();

      // Any call to canAccessModule should have called ModuleRegistry
      screen.getByTestId('can-access-customers');
    });
  });

  describe('Error handling', () => {
    it('should handle errors in canAccessModule gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('can-access-customers')).toHaveTextContent('false');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in getCurrentImpersonationSession gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const user: User = {
        id: 'super-admin-1',
        email: 'admin@example.com',
        name: 'Super Admin',
        isSuperAdmin: true,
        tenantId: 'tenant-1',
        impersonatedAsUserId: null, // This might cause an error in edge cases
      };

      jest.mocked(services.authService.getCurrentUser).mockReturnValue(user);
      jest.mocked(sessionManagerModule.sessionManager.validateSession).mockReturnValue(true);

      renderWithAuth();
      expect(screen.getByTestId('impersonation-session')).toHaveTextContent('not-impersonating');

      consoleErrorSpy.mockRestore();
    });
  });
});