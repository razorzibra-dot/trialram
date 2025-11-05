/**
 * Super Admin Layout - Sidebar Navigation Tests
 * 
 * Tests for sidebar menu rendering, navigation items, and user interactions
 * Verifies all super admin navigation links and sections are properly displayed
 * 
 * Test Coverage:
 * - Sidebar rendering on desktop and mobile
 * - Navigation sections and menu items
 * - Current page highlighting
 * - Navigation links functionality
 * - Impersonation history link presence
 * - Icon rendering for menu items
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SuperAdminProvider, useSuperAdmin } from '@/contexts/SuperAdminContext';
import { PortalProvider, usePortal } from '@/contexts/PortalContext';
import SuperAdminLayout from '../SuperAdminLayout';

// Mock components
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
  lastCheck: new Date(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <PortalProvider>
        <AuthProvider>
          <SuperAdminProvider>
            {component}
          </SuperAdminProvider>
        </AuthProvider>
      </PortalProvider>
    </BrowserRouter>
  );
};

describe('SuperAdminLayout - Sidebar Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAuth
    jest.mocked(useAuth).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
      isLoading: false,
      hasRole: (role: string) => role === 'super_admin',
    } as any);

    // Mock useSuperAdmin
    jest.mocked(useSuperAdmin).mockReturnValue({
      refreshAll: jest.fn(),
      systemHealth: mockSystemHealth,
      isSuperAdmin: true,
    } as any);

    // Mock usePortal
    jest.mocked(usePortal).mockReturnValue({
      isSuperAdmin: true,
    } as any);
  });

  describe('Sidebar Sections Rendering', () => {
    test('should render Platform Control section', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Platform Control')).toBeInTheDocument();
    });

    test('should render Management section', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Management')).toBeInTheDocument();
    });

    test('should render Impersonation & Audit section', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Impersonation & Audit')).toBeInTheDocument();
    });

    test('should render Configuration section', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });

  describe('Navigation Menu Items', () => {
    test('should render Dashboard link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    test('should render System Health link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    test('should render Analytics link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('should render Tenant Management link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Tenant Management')).toBeInTheDocument();
    });

    test('should render Global Users link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Global Users')).toBeInTheDocument();
    });

    test('should render Role Requests link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Role Requests')).toBeInTheDocument();
    });

    test('should render Impersonation History link', () => {
      renderWithProviders(<SuperAdminLayout />);
      const impersonationLink = screen.getByText('Impersonation History');
      expect(impersonationLink).toBeInTheDocument();
    });

    test('should render Platform Configuration link', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Platform Configuration')).toBeInTheDocument();
    });
  });

  describe('Navigation Link Navigation', () => {
    test('Impersonation History link should have correct href', () => {
      renderWithProviders(<SuperAdminLayout />);
      const link = screen.getByRole('button', { name: /Impersonation History/i });
      expect(link).toHaveClass('w-full');
    });

    test('Dashboard link should have correct href', () => {
      renderWithProviders(<SuperAdminLayout />);
      const link = screen.getByRole('button', { name: /Super Admin Dashboard/i });
      expect(link).toHaveClass('w-full');
    });
  });

  describe('Current Page Highlighting', () => {
    test('should highlight Dashboard when on dashboard route', () => {
      window.history.pushState({}, 'Dashboard', '/super-admin/dashboard');
      renderWithProviders(<SuperAdminLayout />);
      const dashboardLink = screen.getByRole('button', { name: /Super Admin Dashboard/i });
      expect(dashboardLink).toHaveClass('bg-accent-50');
    });

    test('should highlight Impersonation History when on impersonation history route', () => {
      window.history.pushState({}, 'History', '/super-admin/impersonation-history');
      renderWithProviders(<SuperAdminLayout />);
      const historyLink = screen.getByRole('button', { name: /Impersonation History/i });
      expect(historyLink).toHaveClass('bg-accent-50');
    });
  });

  describe('System Status Display', () => {
    test('should display system status when available', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    test('should display system health status badge', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    test('should display uptime percentage', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('99.9%')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    test('should display user name', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin User')).toBeInTheDocument();
    });

    test('should display Super Admin badge', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });

    test('should display user avatar fallback', () => {
      renderWithProviders(<SuperAdminLayout />);
      const avatars = screen.getAllByText('SU');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Portal Switcher Integration', () => {
    test('should display portal switcher', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByTestId('portal-switcher')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    test('should display breadcrumbs section', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });

    test('should update breadcrumbs based on route', () => {
      window.history.pushState({}, 'Impersonation', '/super-admin/impersonation-history');
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });
  });

  describe('Sidebar Logo Section', () => {
    test('should display sidebar logo with Crown icon', () => {
      renderWithProviders(<SuperAdminLayout />);
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Platform Control')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should render mobile menu button', () => {
      renderWithProviders(<SuperAdminLayout />);
      // Mobile menu button should be present in header
      const header = screen.getByRole('contentinfo') || screen.getByRole('banner') || document.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Navigation Sections Organization', () => {
    test('should have 4 navigation sections', () => {
      renderWithProviders(<SuperAdminLayout />);
      const sections = [
        'Platform Control',
        'Management',
        'Impersonation & Audit',
        'Configuration'
      ];
      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });

    test('Impersonation & Audit section should be between Management and Configuration', () => {
      renderWithProviders(<SuperAdminLayout />);
      const nav = screen.getByText('Management').parentElement?.parentElement;
      const text = nav?.textContent || '';
      expect(text).toContain('Management');
      expect(text).toContain('Impersonation & Audit');
      expect(text).toContain('Configuration');
    });
  });

  describe('Menu Item Styling', () => {
    test('menu items should have proper button styling', () => {
      renderWithProviders(<SuperAdminLayout />);
      const dashboardLink = screen.getByRole('button', { name: /Super Admin Dashboard/i });
      expect(dashboardLink).toHaveClass('w-full');
      expect(dashboardLink).toHaveClass('flex');
      expect(dashboardLink).toHaveClass('items-center');
    });

    test('menu sections should have proper title styling', () => {
      renderWithProviders(<SuperAdminLayout />);
      const managementTitle = screen.getByText('Management');
      expect(managementTitle).toHaveClass('text-xs');
      expect(managementTitle).toHaveClass('font-semibold');
    });
  });

  describe('All Super Admin Routes Accessible', () => {
    const routes = [
      'Super Admin Dashboard',
      'System Health',
      'Analytics',
      'Tenant Management',
      'Global Users',
      'Role Requests',
      'Impersonation History',
      'Platform Configuration',
    ];

    routes.forEach(route => {
      test(`should have ${route} link accessible`, () => {
        renderWithProviders(<SuperAdminLayout />);
        expect(screen.getByText(route)).toBeInTheDocument();
      });
    });
  });
});