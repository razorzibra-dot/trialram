/**
 * Unit Tests for ImpersonationBanner Component
 * 
 * Tests:
 * - Hidden when not impersonating
 * - Displayed when impersonating
 * - Shows correct impersonation info
 * - Exit button functionality
 * - Error handling
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImpersonationBanner from '../ImpersonationBanner';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { useAuth } from '@/contexts/AuthContext';
import { ImpersonationLogType } from '@/types/superUserModule';

// Mock dependencies
jest.mock('@/contexts/ImpersonationContext');
jest.mock('@/contexts/AuthContext');

const mockUseImpersonationMode = useImpersonationMode as jest.MockedFunction<typeof useImpersonationMode>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ImpersonationBanner Component', () => {
  const mockImpersonationSession: ImpersonationLogType = {
    id: 'log-123',
    superUserId: 'super-admin-1',
    impersonatedUserId: 'user-123',
    tenantId: 'tenant-1',
    loginAt: '2025-02-21T10:00:00Z',
    createdAt: '2025-02-21T10:00:00Z',
    updatedAt: '2025-02-21T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: {
        id: 'super-admin-1',
        name: 'Super Admin',
        email: 'admin@example.com',
        role: 'super_admin',
        status: 'active',
        isSuperAdmin: true,
        tenantId: null,
      } as any,
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      sessionInfo: jest.fn(),
      getTenantId: jest.fn(),
      isSuperAdmin: jest.fn(() => true),
      canAccessModule: jest.fn(),
      isImpersonating: jest.fn(() => true),
      getCurrentImpersonationSession: jest.fn(() => mockImpersonationSession),
    } as any);
  });

  describe('Visibility', () => {
    it('should not render when not impersonating', () => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: null,
        isImpersonating: false,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      const { container } = render(<ImpersonationBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when impersonating', () => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      render(<ImpersonationBanner />);
      expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    beforeEach(() => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);
    });

    it('should display impersonation status message', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByText(/Impersonation Mode Active/i)).toBeInTheDocument();
    });

    it('should display impersonated user information', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByText(/user-123/)).toBeInTheDocument();
    });

    it('should display tenant information', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByText(/tenant-1/)).toBeInTheDocument();
    });

    it('should have warning styling (yellow colors)', () => {
      const { container } = render(<ImpersonationBanner />);
      const banner = container.querySelector('[role="alert"]');
      expect(banner).toHaveClass('bg-yellow-50');
      expect(banner).toHaveClass('border-yellow-400');
    });
  });

  describe('Exit Button', () => {
    beforeEach(() => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn().mockResolvedValue(undefined),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);
    });

    it('should display exit button', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByRole('button', { name: /Exit Impersonation/i })).toBeInTheDocument();
    });

    it('should call endImpersonation and logout on exit button click', async () => {
      const endImpersonationMock = jest.fn().mockResolvedValue(undefined);
      const logoutMock = jest.fn().mockResolvedValue(undefined);

      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: endImpersonationMock,
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      mockUseAuth.mockReturnValue({
        logout: logoutMock,
      } as any);

      render(<ImpersonationBanner />);
      
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/i });
      await userEvent.click(exitButton);

      await waitFor(() => {
        expect(endImpersonationMock).toHaveBeenCalled();
        expect(logoutMock).toHaveBeenCalled();
      });
    });

    it('should show loading state while exiting', async () => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000))),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      render(<ImpersonationBanner />);
      
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/i });
      fireEvent.click(exitButton);

      expect(screen.getByRole('button', { name: /Exiting/i })).toBeInTheDocument();
    });

    it('should call optional onExit callback', async () => {
      const onExitMock = jest.fn();
      const endImpersonationMock = jest.fn().mockResolvedValue(undefined);
      const logoutMock = jest.fn().mockResolvedValue(undefined);

      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: endImpersonationMock,
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      mockUseAuth.mockReturnValue({
        logout: logoutMock,
      } as any);

      render(<ImpersonationBanner onExit={onExitMock} />);
      
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/i });
      await userEvent.click(exitButton);

      await waitFor(() => {
        expect(onExitMock).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during exit gracefully', async () => {
      const endImpersonationMock = jest.fn().mockRejectedValue(new Error('Session error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: endImpersonationMock,
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);

      render(<ImpersonationBanner />);
      
      const exitButton = screen.getByRole('button', { name: /Exit Impersonation/i });
      await userEvent.click(exitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ImpersonationBanner] Error exiting impersonation:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Debug Information', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);
    });

    it('should display debug info in development mode', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByTestId('impersonation-banner-debug')).toBeInTheDocument();
      expect(screen.getByText(/Session Details/i)).toBeInTheDocument();
    });

    it('should show session ID in debug info', () => {
      render(<ImpersonationBanner />);
      const summary = screen.getByText(/Session Details/i);
      fireEvent.click(summary);
      expect(screen.getByText('log-123')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseImpersonationMode.mockReturnValue({
        activeSession: mockImpersonationSession,
        isImpersonating: true,
        startImpersonation: jest.fn(),
        endImpersonation: jest.fn(),
        getSessionDetails: jest.fn(),
        isSessionValid: jest.fn(),
        getRemainingSessionTime: jest.fn(),
      } as any);
    });

    it('should have proper ARIA role', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<ImpersonationBanner />);
      expect(screen.getByLabelText(/Impersonation mode active/i)).toBeInTheDocument();
    });
  });
});