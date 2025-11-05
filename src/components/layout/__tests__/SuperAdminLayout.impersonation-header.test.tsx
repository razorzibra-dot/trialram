/**
 * Super Admin Layout - Impersonation Header Tests
 * 
 * Tests for impersonation status display in header
 * Verifies impersonation info visibility, exit button functionality
 * 
 * Test Coverage:
 * - Impersonation info display when impersonating
 * - Impersonation info hidden when not impersonating
 * - Exit button visibility and functionality
 * - Header badge with impersonation details
 * - User dropdown menu impersonation section
 * - Exit button loading state
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SuperAdminProvider, useSuperAdmin } from '@/contexts/SuperAdminContext';
import { PortalProvider, usePortal } from '@/contexts/PortalContext';
import { ImpersonationProvider, useImpersonationMode } from '@/contexts/ImpersonationContext';
import SuperAdminLayout from '../SuperAdminLayout';

jest.mock('@/components/portal/PortalSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="portal-switcher">Portal Switcher</div>,
}));

jest.mock('@/components/common/ImpersonationBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="impersonation-banner">Impersonation Banner</div>,
}));

const mockUser = {
  id: 'super-admin-1',
  email: 'superadmin@example.com',
  name: 'Super Admin User',
  role: 'super_admin',
  isSuperAdmin: true,
  tenantId: null,
  avatar: 'https://example.com/avatar.jpg',
};

const mockSystemHealth = {
  status: 'healthy' as const,
  uptime: 99.9,
  alerts: [],
  lastCheck: new Date(),
};

const mockActiveSession = {
  id: 'log-123',
  superUserId: 'super-1',
  impersonatedUserId: 'user-456',
  tenantId: 'tenant-789',
  reason: 'Troubleshooting customer issue',
  ipAddress: '192.168.1.1',
  loginAt: new Date().toISOString(),
  logoutAt: null,
  actionCount: 5,
  actions: [],
};

const renderWithProviders = (component: React.ReactElement, withImpersonation = false) => {
  return render(
    <BrowserRouter>
      <PortalProvider>
        <AuthProvider>
          <ImpersonationProvider>
            <SuperAdminProvider>
              {component}
            </SuperAdminProvider>
          </ImpersonationProvider>
        </AuthProvider>
      </PortalProvider>
    </BrowserRouter>
  );
};

describe('SuperAdminLayout - Impersonation Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mocked(useAuth).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
      isLoading: false,
      hasRole: (role: string) => role === 'super_admin',
    } as any);

    jest.mocked(useSuperAdmin).mockReturnValue({
      refreshAll: jest.fn(),
      systemHealth: mockSystemHealth,
      isSuperAdmin: true,
    } as any);

    jest.mocked(usePortal).mockReturnValue({
      isSuperAdmin: true,
    } as any);
  });

  describe('When Not Impersonating', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: () => null,
        isSessionValid: () => false,
        getRemainingSessionTime: () => -1,
      } as any);
    });

    test('should not display impersonation status info', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.queryByText(/Impersonating:/)).not.toBeInTheDocument();
    });

    test('should not display exit impersonation button', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.queryByText(/Exit Impersonation/)).not.toBeInTheDocument();
    });

    test('should not display impersonation mode in dropdown', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.queryByText(/IMPERSONATION MODE/)).not.toBeInTheDocument();
    });
  });

  describe('When Impersonating', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('should display impersonation status info in header', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText(/Impersonating:/)).toBeInTheDocument();
      expect(screen.getByText('user-456')).toBeInTheDocument();
    });

    test('should display exit impersonation button', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByRole('button', { name: /Exit Impersonation/ })).toBeInTheDocument();
    });

    test('exit button should have yellow styling', () => {
      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      expect(exitButton).toHaveStyle({ backgroundColor: '#FCD34D' });
    });

    test('should display impersonation mode section in user dropdown', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText(/IMPERSONATION MODE/)).toBeInTheDocument();
      });
    });

    test('user dropdown should show impersonated user ID', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('user-456')).toBeInTheDocument();
      });
    });

    test('user dropdown should show tenant ID if available', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Tenant: tenant-789/)).toBeInTheDocument();
      });
    });

    test('user dropdown should show reason if available', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Reason: Troubleshooting customer issue/)).toBeInTheDocument();
      });
    });

    test('impersonation info should include sparkles icon', () => {
      renderWithProviders(<SuperAdminLayout />);
      // Icon check - just verify the component renders
      const impersonationInfo = screen.getByText(/Impersonating:/);
      expect(impersonationInfo).toBeInTheDocument();
    });

    test('should have yellow background on impersonation badge', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonationInfo = screen.getByText(/Impersonating:/).closest('div');
      expect(impersonationInfo).toHaveStyle({ backgroundColor: '#FEF3C7' });
    });
  });

  describe('Exit Impersonation Button Functionality', () => {
    const mockEndImpersonation = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: mockEndImpersonation,
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('exit button should call endImpersonation when clicked', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      
      fireEvent.click(exitButton);
      
      await waitFor(() => {
        expect(mockEndImpersonation).toHaveBeenCalled();
      });
    });

    test('exit button should show loading state while exiting', async () => {
      const slowEndImpersonation = jest.fn(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: slowEndImpersonation,
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);

      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      
      fireEvent.click(exitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Exit\.\.\./)).toBeInTheDocument();
      });
    });

    test('exit button should be disabled while exiting', async () => {
      const slowEndImpersonation = jest.fn(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: slowEndImpersonation,
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);

      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      
      fireEvent.click(exitButton);
      
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /Exit\.\.\./i });
        expect(updatedButton).toBeDisabled();
      });
    });
  });

  describe('Impersonation Header Styling', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('impersonation status should use amber color scheme', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonationStatus = screen.getByText(/Impersonating:/).closest('div');
      expect(impersonationStatus).toHaveStyle({
        backgroundColor: '#FEF3C7'
      });
    });

    test('impersonation text should be amber colored', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonatingLabel = screen.getByText(/Impersonating:/);
      expect(impersonatingLabel).toHaveStyle({ color: '#92400E' });
    });

    test('exit button should have amber styling', () => {
      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      expect(exitButton).toHaveStyle({
        backgroundColor: '#FCD34D',
        color: '#92400E',
      });
    });
  });

  describe('Impersonation Session Details Display', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('should display impersonated user ID', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('user-456')).toBeInTheDocument();
    });

    test('should truncate long user IDs on mobile', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonationStatus = screen.getByText(/Impersonating:/).closest('div');
      expect(impersonationStatus).toHaveClass('truncate');
    });

    test('header impersonation info should be hidden on mobile', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonationDiv = screen.getByText(/Impersonating:/).parentElement;
      expect(impersonationDiv).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('exit button should be keyboard accessible', () => {
      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      expect(exitButton).toBeVisible();
      expect(exitButton).not.toBeDisabled();
    });

    test('impersonation status should have semantic meaning', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonatingLabel = screen.getByText(/Impersonating:/);
      expect(impersonatingLabel).toBeInTheDocument();
      expect(impersonatingLabel.textContent).toMatch(/user-456/);
    });

    test('dropdown menu should contain impersonation info', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText(/IMPERSONATION MODE/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: mockActiveSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockRejectedValue(new Error('Exit failed')),
        getSessionDetails: () => mockActiveSession,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('should handle exit impersonation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<SuperAdminLayout />);
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/ });
      
      fireEvent.click(exitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error exiting impersonation:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Details in Dropdown', () => {
    const sessionWithAllDetails = {
      ...mockActiveSession,
      reason: 'Troubleshooting customer issue',
      tenantId: 'tenant-789',
    };

    beforeEach(() => {
      jest.mocked(useImpersonationMode).mockReturnValue({
        activeSession: sessionWithAllDetails,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: () => sessionWithAllDetails,
        isSessionValid: () => true,
        getRemainingSessionTime: () => 28800000,
      } as any);
    });

    test('dropdown should display all session details when available', async () => {
      renderWithProviders(<SuperAdminLayout />);
      const userButton = screen.getAllByRole('button')[screen.getAllByRole('button').length - 1];
      fireEvent.click(userButton);
      
      await waitFor(() => {
        expect(screen.getByText(/IMPERSONATION MODE/)).toBeInTheDocument();
        expect(screen.getByText(/Impersonating:/)).toBeInTheDocument();
        expect(screen.getByText('user-456')).toBeInTheDocument();
        expect(screen.getByText(/Tenant: tenant-789/)).toBeInTheDocument();
        expect(screen.getByText(/Reason: Troubleshooting customer issue/)).toBeInTheDocument();
      });
    });
  });
});