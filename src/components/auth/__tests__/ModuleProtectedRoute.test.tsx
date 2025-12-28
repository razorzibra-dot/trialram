/**
 * Unit Tests for ModuleProtectedRoute Component
 * 
 * Tests all states and scenarios:
 * - Loading state during permission check
 * - Access granted for authorized users
 * - Access denied with custom fallback
 * - Error handling during permission check
 * - Audit logging of unauthorized access
 * - Super admin access control
 * - Regular user access control
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ModuleProtectedRoute, { DefaultAccessDenied, LoadingSpinner } from '../ModuleProtectedRoute';
import { useModuleAccess } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services';

// Mock dependencies
jest.mock('@/hooks');
jest.mock('@/contexts/AuthContext');
jest.mock('@/services', () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

describe('ModuleProtectedRoute Component', () => {
  const mockUseModuleAccess = useModuleAccess as jest.MockedFunction<typeof useModuleAccess>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockAuditService = auditService as jest.Mocked<typeof auditService>;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'manager' as const,
    status: 'active' as const,
    isSuperAdmin: false,
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
  };

  const mockSuperAdmin = {
    id: 'super-1',
    email: 'admin@example.com',
    name: 'Super Admin',
    role: 'super_admin' as const,
    status: 'active' as const,
    isSuperAdmin: true,
    tenantId: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      sessionInfo: jest.fn(),
      getTenantId: jest.fn(),
    } as any);
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking access', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: true,
        error: null,
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Checking Access')).toBeInTheDocument();
      expect(screen.getByText('Verifying your permissions...')).toBeInTheDocument();
    });

    it('should not show module content while loading', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: true,
        error: null,
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.queryByText('Module Content')).not.toBeInTheDocument();
    });
  });

  describe('Access Granted', () => {
    it('should render children when access is granted', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Customer Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Customer Module Content')).toBeInTheDocument();
    });

    it('should not show access denied UI when access is granted', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Customer Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      const ComplexComponent = () => (
        <div>
          <h1>Module Title</h1>
          <p>Module Description</p>
          <button>Action Button</button>
        </div>
      );

      render(
        <ModuleProtectedRoute moduleName="customers">
          <ComplexComponent />
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Module Title')).toBeInTheDocument();
      expect(screen.getByText('Module Description')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Access Denied', () => {
    it('should show default access denied UI when access is denied', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'Insufficient permissions to access this module',
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this module.")).toBeInTheDocument();
    });

    it('should display reason for access denial', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'Super admins cannot access tenant modules',
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Super admins cannot access tenant modules')).toBeInTheDocument();
    });

    it('should show custom fallback when provided', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      const CustomFallback = () => <div>Custom Access Denied Page</div>;

      render(
        <ModuleProtectedRoute moduleName="customers" fallback={<CustomFallback />}>
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Custom Access Denied Page')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should log unauthorized access attempt', async () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'Insufficient permissions',
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      await waitFor(() => {
        expect(mockAuditService.logAction).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UNAUTHORIZED_MODULE_ACCESS',
            resource: 'module:customers',
            resourceId: 'customers',
            userId: 'user-1',
            status: 'denied',
          })
        );
      });
    });

    it('should call onAccessDenied callback', async () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'Permission denied',
      });

      const onAccessDenied = jest.fn();

      render(
        <ModuleProtectedRoute moduleName="customers" onAccessDenied={onAccessDenied}>
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      await waitFor(() => {
        expect(onAccessDenied).toHaveBeenCalledWith('Permission denied');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error UI when permission check fails', () => {
      const error = new Error('Permission check failed');
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error,
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Permission check failed')).toBeInTheDocument();
    });

    it('should not render children when error occurs', () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: new Error('Permission check failed'),
        isSuperAdmin: false,
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.queryByText('Module Content')).not.toBeInTheDocument();
    });
  });

  describe('Super Admin Access Control', () => {
    it('should grant super admin access to super-admin module', () => {
      mockUseAuth.mockReturnValue({
        user: mockSuperAdmin,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: true,
      });

      render(
        <ModuleProtectedRoute moduleName="super-admin">
          <div>Admin Panel Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Admin Panel Content')).toBeInTheDocument();
    });

    it('should block super admin from tenant modules', () => {
      mockUseAuth.mockReturnValue({
        user: mockSuperAdmin,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: true,
        reason: 'Super admins cannot access tenant modules',
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Customer Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Customer Content')).not.toBeInTheDocument();
    });
  });

  describe('Audit Logging', () => {
    it('should include user ID in audit log', async () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'No permissions',
      });

      render(
        <ModuleProtectedRoute moduleName="deals">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      await waitFor(() => {
        expect(mockAuditService.logAction).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
          })
        );
      });
    });

    it('should include module name in audit log', async () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'No permissions',
      });

      render(
        <ModuleProtectedRoute moduleName="contracts">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      await waitFor(() => {
        expect(mockAuditService.logAction).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: 'module:contracts',
          })
        );
      });
    });

    it('should handle audit logging failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuditService.logAction.mockImplementation(() => {
        throw new Error('Audit service error');
      });

      mockUseModuleAccess.mockReturnValue({
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'No permissions',
      });

      render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to log unauthorized access'),
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('DefaultAccessDenied Component', () => {
    it('should display default denied message', () => {
      render(<DefaultAccessDenied />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this module.")).toBeInTheDocument();
    });

    it('should display reason when provided', () => {
      render(<DefaultAccessDenied reason="Super admin isolation enforced" />);

      expect(screen.getByText('Super admin isolation enforced')).toBeInTheDocument();
    });

    it('should not display reason section when not provided', () => {
      const { container } = render(<DefaultAccessDenied />);

      const reasonSection = container.querySelector('.bg-red-50');
      expect(reasonSection).not.toBeInTheDocument();
    });
  });

  describe('LoadingSpinner Component', () => {
    it('should display loading message', () => {
      render(<LoadingSpinner />);

      expect(screen.getByText('Checking Access')).toBeInTheDocument();
      expect(screen.getByText('Verifying your permissions...')).toBeInTheDocument();
    });

    it('should render spinner animation', () => {
      const { container } = render(<LoadingSpinner />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle rapid access state changes', () => {
      mockUseModuleAccess
        .mockReturnValueOnce({
          canAccess: false,
          isLoading: true,
          error: null,
          isSuperAdmin: false,
        })
        .mockReturnValueOnce({
          canAccess: true,
          isLoading: false,
          error: null,
          isSuperAdmin: false,
        });

      const { rerender } = render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Checking Access')).toBeInTheDocument();

      // Update to granted state
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      rerender(
        <ModuleProtectedRoute moduleName="customers">
          <div>Module Content</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Module Content')).toBeInTheDocument();
    });

    it('should handle module name changes', async () => {
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      const { rerender } = render(
        <ModuleProtectedRoute moduleName="customers">
          <div>Customer Module</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Customer Module')).toBeInTheDocument();

      // Change module
      mockUseModuleAccess.mockReturnValue({
        canAccess: true,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
      });

      rerender(
        <ModuleProtectedRoute moduleName="deals">
          <div>Deals Module</div>
        </ModuleProtectedRoute>
      );

      expect(screen.getByText('Sales Module')).toBeInTheDocument();
    });
  });
});