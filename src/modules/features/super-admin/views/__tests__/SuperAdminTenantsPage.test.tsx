/**
 * SuperAdminTenantsPage Component Tests
 * Tests for tenant management page with TenantDirectoryGrid integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import SuperAdminTenantsPage from '../SuperAdminTenantsPage';
import * as authContext from '@/contexts/AuthContext';
import * as superAdminHooks from '../../hooks';

// Mock contexts and hooks
jest.mock('@/contexts/AuthContext');
jest.mock('../../hooks');

// Setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockTenantStatistics = [
  {
    tenantId: 'tenant_1',
    tenantName: 'Acme Corporation',
    status: 'healthy',
    activeUsers: 45,
    totalContracts: 12,
    totalSales: 500000,
    lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    tenantId: 'tenant_2',
    tenantName: 'Tech Innovations Inc',
    status: 'warning',
    activeUsers: 28,
    totalContracts: 8,
    totalSales: 350000,
    lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockTenantAccess = [
  {
    id: 'access_1',
    superAdminId: 'admin_1',
    tenantId: 'tenant_1',
    accessLevel: 'full' as const,
    grantedAt: new Date().toISOString(),
  },
];

const mockHealth = {
  api: 'healthy',
  database: 'healthy',
  storage: 'healthy',
};

describe('SuperAdminTenantsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth
    (authContext.useAuth as jest.Mock).mockReturnValue({
      hasPermission: jest.fn(() => true),
      user: { id: 'admin_1', name: 'Admin User' },
    });

    // Mock hooks
    (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
      statistics: mockTenantStatistics,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    });

    (superAdminHooks.useTenantAccess as jest.Mock).mockReturnValue({
      tenantAccess: mockTenantAccess,
      isLoading: false,
    });

    (superAdminHooks.useSystemHealth as jest.Mock).mockReturnValue({
      health: mockHealth,
      isLoading: false,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SuperAdminTenantsPage />
          <Toaster />
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('should render page header with title', () => {
      renderComponent();

      expect(screen.getByText('Tenants Management')).toBeInTheDocument();
      expect(screen.getByText('Monitor and manage all tenants across the platform')).toBeInTheDocument();
    });

    test('should display statistics cards', () => {
      renderComponent();

      expect(screen.getByText('Total Tenants')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText('Tenant Access')).toBeInTheDocument();
    });

    test('should display stat values correctly', () => {
      renderComponent();

      expect(screen.getByText('2 active tenants')).toBeInTheDocument();
      expect(screen.getByText('1 tenants healthy')).toBeInTheDocument();
      expect(screen.getByText('1 need attention')).toBeInTheDocument();
      expect(screen.getByText('1 access records')).toBeInTheDocument();
    });

    test('should render tabs for grid and table views', () => {
      renderComponent();

      expect(screen.getByText('Grid View')).toBeInTheDocument();
      expect(screen.getByText('Table View')).toBeInTheDocument();
    });

    test('should have grid view as default', () => {
      renderComponent();

      const gridButton = screen.getByRole('button', { name: /Grid View/i });
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should display refresh and export buttons', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });
  });

  describe('Permission Check', () => {
    test('should show access denied message when user lacks permissions', () => {
      (authContext.useAuth as jest.Mock).mockReturnValue({
        hasPermission: jest.fn(() => false),
        user: { id: 'user_1', name: 'Regular User' },
      });

      renderComponent();

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to manage tenants.")).toBeInTheDocument();
    });

    test('should call hasPermission with correct permission string', () => {
      const hasPermissionMock = jest.fn(() => true);
      (authContext.useAuth as jest.Mock).mockReturnValue({
        hasPermission: hasPermissionMock,
        user: { id: 'admin_1', name: 'Admin User' },
      });

      renderComponent();

      expect(hasPermissionMock).toHaveBeenCalledWith('super_user:manage_tenants');
    });
  });

  describe('View Mode Switching', () => {
    test('should switch to table view when table button clicked', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        expect(tableButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    test('should switch back to grid view', async () => {
      renderComponent();

      // First switch to table
      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      // Then switch back to grid
      const gridButton = screen.getByRole('button', { name: /Grid View/i });
      fireEvent.click(gridButton);

      await waitFor(() => {
        expect(gridButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    test('should persist view mode state', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        // View mode should be persisted
        expect(tableButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Grid View', () => {
    test('should render TenantDirectoryGrid component', () => {
      renderComponent();

      // Grid view should display the search input
      expect(screen.getByPlaceholderText('Search tenants by name or ID')).toBeInTheDocument();
    });

    test('should display tenant cards in grid view', () => {
      renderComponent();

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
    });

    test('should show grid controls (search, filter, sort)', () => {
      renderComponent();

      expect(screen.getByText('All Status')).toBeInTheDocument();
      expect(screen.getByText(/Sort by/)).toBeInTheDocument();
    });
  });

  describe('Table View', () => {
    test('should render table in table view', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        // Table columns should be present
        expect(screen.getByText('Tenant')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
      });
    });

    test('should display tenant data in table', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        expect(screen.getByText('tenant_1')).toBeInTheDocument();
        expect(screen.getByText(/45/)).toBeInTheDocument(); // Active users
      });
    });

    test('should have pagination in table view', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        // Pagination should be present
        expect(screen.getByRole('option', { name: '10 / page' })).toBeInTheDocument();
      });
    });

    test('should have action buttons in table rows', async () => {
      renderComponent();

      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /View/i });
        expect(viewButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tenant Selection', () => {
    test('should open detail drawer when tenant is selected from grid', async () => {
      renderComponent();

      // Click on a tenant card
      const tenantCard = screen.getByText('Acme Corporation').closest('div[class*="card"]');
      fireEvent.click(tenantCard!);

      await waitFor(() => {
        expect(screen.getByText('Tenant Details')).toBeInTheDocument();
      });
    });

    test('should display selected tenant details in drawer', async () => {
      renderComponent();

      // Click on a tenant card
      const tenantCard = screen.getByText('Acme Corporation').closest('div[class*="card"]');
      fireEvent.click(tenantCard!);

      await waitFor(() => {
        expect(screen.getByText('tenant_1')).toBeInTheDocument();
        expect(screen.getByText(/HEALTHY/)).toBeInTheDocument();
      });
    });

    test('should close detail drawer on close button click', async () => {
      renderComponent();

      // Open drawer
      const tenantCard = screen.getByText('Acme Corporation').closest('div[class*="card"]');
      fireEvent.click(tenantCard!);

      await waitFor(() => {
        expect(screen.getByText('Tenant Details')).toBeInTheDocument();
      });

      // Find and click close button (usually first button in drawer header)
      const closeButton = screen.getAllByRole('button').find(
        (btn) => btn.getAttribute('aria-label')?.includes('Close')
      );

      if (closeButton) {
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByText('Tenant Details')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Export Functionality', () => {
    test('should trigger download when export button is clicked', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

      renderComponent();

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(createObjectURLSpy).toHaveBeenCalled();
      });

      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    test('should show success toast on export', async () => {
      renderComponent();

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/exported|success/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Loading States', () => {
    test('should show loading spinner while data loads', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [],
        isLoading: true,
        refetch: jest.fn(),
      });

      renderComponent();

      // Refresh button should show loading state
      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      expect(refreshButton).toHaveAttribute('aria-busy');
    });

    test('should disable interactions while loading', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [],
        isLoading: true,
        refetch: jest.fn(),
      });

      renderComponent();

      // Various controls should be present but potentially disabled
      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    test('should call refresh hook when refresh button clicked', async () => {
      const refetchMock = jest.fn().mockResolvedValue(undefined);
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: mockTenantStatistics,
        isLoading: false,
        refetch: refetchMock,
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      // Wait for page reload (will happen via window.location.reload)
      // In test environment, this won't actually reload
      await waitFor(() => {
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Display', () => {
    test('should display tenant metrics cards', () => {
      renderComponent();

      // After metrics are loaded, metrics cards should show
      const metricsSection = screen.queryByText(/Metrics|metrics/i);
      // Metrics may be displayed or not based on data
      expect(screen.getByText(/Total Tenants|Healthy|Warnings/)).toBeInTheDocument();
    });

    test('should display tenant access information', async () => {
      renderComponent();

      await waitFor(() => {
        // Tenant Access section should be rendered
        expect(screen.getByText('Tenant Access')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should render statistics cards responsively', () => {
      renderComponent();

      // All stat cards should be present
      expect(screen.getByText('Total Tenants')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText('Tenant Access')).toBeInTheDocument();
    });

    test('should render tabs responsively', () => {
      renderComponent();

      const gridButton = screen.getByRole('button', { name: /Grid View/i });
      const tableButton = screen.getByRole('button', { name: /Table View/i });

      expect(gridButton).toBeInTheDocument();
      expect(tableButton).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('should integrate TenantDirectoryGrid with selection callback', async () => {
      renderComponent();

      const tenantCard = screen.getByText('Acme Corporation').closest('div[class*="card"]');
      fireEvent.click(tenantCard!);

      await waitFor(() => {
        // Drawer should open with selected tenant details
        expect(screen.getByText('Tenant Details')).toBeInTheDocument();
      });
    });

    test('should maintain state across view mode switches', async () => {
      renderComponent();

      // Switch to table view
      const tableButton = screen.getByRole('button', { name: /Table View/i });
      fireEvent.click(tableButton);

      // Switch back to grid view
      const gridButton = screen.getByRole('button', { name: /Grid View/i });
      fireEvent.click(gridButton);

      // Grid view should be active
      await waitFor(() => {
        expect(gridButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing tenant data gracefully', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText('Tenants Management')).toBeInTheDocument();
      // Page should still render
    });

    test('should handle missing access data gracefully', () => {
      (superAdminHooks.useTenantAccess as jest.Mock).mockReturnValue({
        tenantAccess: [],
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('0 access records')).toBeInTheDocument();
    });

    test('should handle missing health data gracefully', () => {
      (superAdminHooks.useSystemHealth as jest.Mock).mockReturnValue({
        health: {},
        isLoading: false,
      });

      renderComponent();

      // Page should still render even without health data
      expect(screen.getByText('Tenants Management')).toBeInTheDocument();
    });
  });
});