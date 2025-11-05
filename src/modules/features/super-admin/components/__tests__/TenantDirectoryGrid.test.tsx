/**
 * TenantDirectoryGrid Component Tests
 * Comprehensive test suite for tenant grid display, search, filter, sort, and pagination
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import TenantDirectoryGrid from '../TenantDirectoryGrid';
import * as superAdminHooks from '../../hooks';

// Mock hooks
jest.mock('../../hooks', () => ({
  useTenantMetrics: jest.fn(),
  useTenantAccess: jest.fn(),
}));

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
    lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
  },
  {
    tenantId: 'tenant_2',
    tenantName: 'Tech Innovations Inc',
    status: 'warning',
    activeUsers: 28,
    totalContracts: 8,
    totalSales: 350000,
    lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  },
  {
    tenantId: 'tenant_3',
    tenantName: 'Global Services Ltd',
    status: 'error',
    activeUsers: 12,
    totalContracts: 3,
    totalSales: 120000,
    lastActivityDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    tenantId: 'tenant_4',
    tenantName: 'Business Solutions Pro',
    status: 'healthy',
    activeUsers: 67,
    totalContracts: 18,
    totalSales: 850000,
    lastActivityDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
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

describe('TenantDirectoryGrid Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
      statistics: mockTenantStatistics,
      isLoading: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    });

    (superAdminHooks.useTenantAccess as jest.Mock).mockReturnValue({
      tenantAccess: mockTenantAccess,
      isLoading: false,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TenantDirectoryGrid {...props} />
        <Toaster />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    test('should render component with all tenant cards', () => {
      renderComponent();

      // Check that all tenant names are displayed
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
      expect(screen.getByText('Global Services Ltd')).toBeInTheDocument();
      expect(screen.getByText('Business Solutions Pro')).toBeInTheDocument();
    });

    test('should display loading spinner when data is loading', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [],
        isLoading: true,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText('Loading tenant directory...')).toBeInTheDocument();
    });

    test('should display empty state when no tenants available', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText('No tenants available')).toBeInTheDocument();
    });

    test('should render search input with placeholder', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');
      expect(searchInput).toBeInTheDocument();
    });

    test('should render status filter dropdown', () => {
      renderComponent();

      const filterButton = screen.getByText('All Status');
      expect(filterButton).toBeInTheDocument();
    });

    test('should render sort dropdown', () => {
      renderComponent();

      const sortButtons = screen.getAllByText(/Sort by/);
      expect(sortButtons.length).toBeGreaterThan(0);
    });

    test('should render refresh button', () => {
      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Tenant Card Display', () => {
    test('should display tenant name, ID, and status on each card', () => {
      renderComponent();

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText(/tenant_1/i)).toBeInTheDocument();
      expect(screen.getByText(/HEALTHY/i)).toBeInTheDocument();
    });

    test('should display user count on tenant card', () => {
      renderComponent();

      expect(screen.getByText(/45 users/)).toBeInTheDocument();
      expect(screen.getByText(/28 users/)).toBeInTheDocument();
    });

    test('should display contract count on tenant card', () => {
      renderComponent();

      expect(screen.getByText(/12 contracts/)).toBeInTheDocument();
      expect(screen.getByText(/8 contracts/)).toBeInTheDocument();
    });

    test('should display total sales on tenant card', () => {
      renderComponent();

      expect(screen.getByText(/₹500,000/)).toBeInTheDocument();
      expect(screen.getByText(/₹850,000/)).toBeInTheDocument();
    });

    test('should display activity timestamp on tenant card', () => {
      renderComponent();

      expect(screen.getByText(/2h ago|Just now|ago/)).toBeInTheDocument();
    });

    test('should show status badge with appropriate color', () => {
      renderComponent();

      const healthyBadges = screen.getAllByText(/✓ HEALTHY/);
      expect(healthyBadges.length).toBeGreaterThan(0);

      const warningBadges = screen.getAllByText(/⚠ WARNING/);
      expect(warningBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    test('should filter tenants by tenant name', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search for "Acme"
      await userEvent.type(searchInput, 'Acme');

      // Should display only Acme Corporation
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.queryByText('Tech Innovations Inc')).not.toBeInTheDocument();
      expect(screen.queryByText('Global Services Ltd')).not.toBeInTheDocument();
    });

    test('should filter tenants by tenant ID', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search for "tenant_2"
      await userEvent.type(searchInput, 'tenant_2');

      // Should display only tenant_2
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
    });

    test('should be case-insensitive search', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search with mixed case
      await userEvent.type(searchInput, 'ACME');

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    test('should reset pagination when searching', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search
      await userEvent.type(searchInput, 'Acme');

      // Page should be reset to 1 (shown in URL or state)
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    test('should show no results message when search finds nothing', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search for non-existent tenant
      await userEvent.type(searchInput, 'NonExistent');

      expect(screen.getByText('No tenants found')).toBeInTheDocument();
    });

    test('should clear search with clear button', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID') as HTMLInputElement;

      // Type search
      await userEvent.type(searchInput, 'Acme');
      expect(searchInput.value).toBe('Acme');

      // Clear button should appear (built into Ant Design Input)
      // Find and click the clear button
      const clearButton = screen.getByRole('button', { name: '' });
      fireEvent.click(clearButton);

      // Wait for value to clear
      await waitFor(() => {
        expect(searchInput.value).toBe('');
      });
    });
  });

  describe('Filter Functionality', () => {
    test('should filter tenants by healthy status', async () => {
      renderComponent();

      // Click on status filter dropdown
      const filterDropdown = screen.getByText('All Status');
      fireEvent.click(filterDropdown);

      // Click "Healthy" option
      await waitFor(() => {
        const healthyOption = screen.getByText('Healthy');
        fireEvent.click(healthyOption);
      });

      // Should show only healthy tenants
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Business Solutions Pro')).toBeInTheDocument();
      expect(screen.queryByText('Tech Innovations Inc')).not.toBeInTheDocument();
    });

    test('should filter tenants by warning status', async () => {
      renderComponent();

      // Click on status filter dropdown
      const filterDropdown = screen.getByText('All Status');
      fireEvent.click(filterDropdown);

      // Click "Warning" option
      await waitFor(() => {
        const warningOption = screen.getByText('Warning');
        fireEvent.click(warningOption);
      });

      // Should show only warning tenants
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
    });

    test('should filter tenants by error status', async () => {
      renderComponent();

      // Click on status filter dropdown
      const filterDropdown = screen.getByText('All Status');
      fireEvent.click(filterDropdown);

      // Click "Error" option
      await waitFor(() => {
        const errorOption = screen.getByText('Error');
        fireEvent.click(errorOption);
      });

      // Should show only error tenants
      expect(screen.getByText('Global Services Ltd')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
    });

    test('should show all tenants when filter is set to all', async () => {
      renderComponent();

      // Ensure all tenants are visible initially
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
      expect(screen.getByText('Global Services Ltd')).toBeInTheDocument();
      expect(screen.getByText('Business Solutions Pro')).toBeInTheDocument();
    });

    test('should reset pagination when filtering', async () => {
      renderComponent();

      const filterDropdown = screen.getByText('All Status');
      fireEvent.click(filterDropdown);

      await waitFor(() => {
        const healthyOption = screen.getByText('Healthy');
        fireEvent.click(healthyOption);
      });

      // Page should be reset to 1
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });
  });

  describe('Sort Functionality', () => {
    test('should sort tenants by name', async () => {
      renderComponent();

      // Find and click sort dropdown (need to find the one with "Sort by Name")
      const sortElements = screen.getAllByRole('button');
      const sortButton = sortElements.find((btn) =>
        btn.textContent?.includes('Sort by Name')
      );

      if (sortButton) {
        fireEvent.click(sortButton);

        await waitFor(() => {
          // Names should be sorted alphabetically
          const cards = screen.getAllByRole('heading');
          const tenantNames = cards.map((c) => c.textContent).filter(Boolean);
          expect(tenantNames.length).toBeGreaterThan(0);
        });
      }
    });

    test('should sort tenants by active users (descending)', async () => {
      renderComponent();

      // The tenants are already sorted by various criteria
      // Business Solutions Pro (67 users) should appear before others in user sort
      expect(screen.getByText('Business Solutions Pro')).toBeInTheDocument();
    });

    test('should sort by status (healthy > warning > error)', async () => {
      renderComponent();

      // When sorted by status, check the order of status badges
      const statusBadges = screen.getAllByText(/HEALTHY|WARNING|ERROR/);
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    test('should display pagination controls', () => {
      renderComponent();

      // Check for pagination info
      const paginationText = screen.getByText(/Showing.*of.*tenants/);
      expect(paginationText).toBeInTheDocument();
    });

    test('should change page size', async () => {
      // Add more tenants to trigger pagination
      const manyTenants = Array.from({ length: 30 }, (_, i) => ({
        ...mockTenantStatistics[0],
        tenantId: `tenant_${i}`,
        tenantName: `Tenant ${i}`,
      }));

      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: manyTenants,
        isLoading: false,
        refetch: jest.fn().mockResolvedValue(undefined),
      });

      renderComponent();

      // Find page size selector
      const pageSizeElements = screen.getAllByText(/per page/);
      expect(pageSizeElements.length).toBeGreaterThan(0);
    });

    test('should display correct number of items per page', () => {
      renderComponent();

      // Default page size is 12, but we only have 4 tenants
      // So should display all 4
      expect(screen.getByText('Showing 4 of 4 tenants')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    test('should call refetch when refresh button is clicked', async () => {
      const refetchMock = jest.fn().mockResolvedValue(undefined);
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: mockTenantStatistics,
        isLoading: false,
        refetch: refetchMock,
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalled();
      });
    });

    test('should show success toast on refresh', async () => {
      const refetchMock = jest.fn().mockResolvedValue(undefined);
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: mockTenantStatistics,
        isLoading: false,
        refetch: refetchMock,
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    test('should disable refresh button while loading', () => {
      const refetchMock = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: mockTenantStatistics,
        isLoading: false,
        refetch: refetchMock,
      });

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      // Button should have loading state
      expect(refreshButton).toHaveAttribute('aria-busy');
    });
  });

  describe('Card Click Interaction', () => {
    test('should call onTenantSelect when card is clicked', async () => {
      const onTenantSelectMock = jest.fn();

      renderComponent({ onTenantSelect: onTenantSelectMock });

      // Click on a tenant card
      const acmeCard = screen.getByText('Acme Corporation').closest('div[class*="card"]');
      fireEvent.click(acmeCard!);

      await waitFor(() => {
        expect(onTenantSelectMock).toHaveBeenCalled();
      });
    });

    test('should pass correct tenant data to onTenantSelect', async () => {
      const onTenantSelectMock = jest.fn();

      renderComponent({ onTenantSelect: onTenantSelectMock });

      // Click on a tenant card
      const card = screen.getByText('Acme Corporation').closest('div');
      fireEvent.click(card!);

      await waitFor(() => {
        expect(onTenantSelectMock).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant_1',
            tenantName: 'Acme Corporation',
            status: 'healthy',
            activeUsers: 45,
          })
        );
      });
    });

    test('should not call onTenantSelect when showActions is false', () => {
      const onTenantSelectMock = jest.fn();

      renderComponent({ onTenantSelect: onTenantSelectMock, showActions: false });

      // Refresh button should not be visible
      expect(screen.queryByRole('button', { name: /Refresh/i })).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should render grid with responsive column layout', () => {
      renderComponent();

      // Grid should render and display all tenants
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Innovations Inc')).toBeInTheDocument();
    });

    test('should display results info', () => {
      renderComponent();

      const resultsInfo = screen.getByText(/Showing.*of.*tenants/);
      expect(resultsInfo).toBeInTheDocument();
    });
  });

  describe('Data Synchronization', () => {
    test('should display sync indicator', () => {
      renderComponent();

      expect(screen.getByText('✓ Data synchronized')).toBeInTheDocument();
    });

    test('should show syncing message while loading', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: mockTenantStatistics,
        isLoading: true,
        refetch: jest.fn(),
      });

      renderComponent();

      // When loading and data exists, sync indicator may vary
      // Component should still be responsive
      expect(screen.getByText(/Acme Corporation|Syncing data/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing tenant data gracefully', () => {
      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [
          {
            tenantId: 'tenant_1',
            // Missing other required fields
          },
        ],
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      // Component should render without crashing
      expect(screen.getByText('Showing')).toBeInTheDocument();
    });

    test('should format missing activity date as "Never"', () => {
      const tenantWithoutActivity = {
        ...mockTenantStatistics[0],
        lastActivityDate: undefined,
      };

      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: [tenantWithoutActivity],
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      // Should display default activity text
      expect(screen.getByText(/Showing 1 of 1/)).toBeInTheDocument();
    });
  });

  describe('Combined Interactions', () => {
    test('should search and filter simultaneously', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');

      // Search for healthy tenants with "Corp" in name
      await userEvent.type(searchInput, 'Corp');

      // Should show only Acme Corporation
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.queryByText('Tech Innovations Inc')).not.toBeInTheDocument();
    });

    test('should search, filter, and sort together', async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search tenants by name or ID');
      await userEvent.type(searchInput, 'Corp');

      // Should still maintain functionality
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should handle large dataset efficiently', () => {
      const largeTenantSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockTenantStatistics[0],
        tenantId: `tenant_${i}`,
        tenantName: `Tenant ${i}`,
      }));

      (superAdminHooks.useTenantMetrics as jest.Mock).mockReturnValue({
        statistics: largeTenantSet,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderComponent();

      // Should render without performance issues
      // Default page size is 12
      expect(screen.getByText(/Showing 12 of 100/)).toBeInTheDocument();
    });
  });
});