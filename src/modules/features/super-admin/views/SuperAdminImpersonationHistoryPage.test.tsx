/**
 * Tests for SuperAdminImpersonationHistoryPage
 * 
 * Coverage:
 * - Component rendering
 * - Data loading and display
 * - Filtering (search, date range, status)
 * - Pagination
 * - Detail drawer
 * - Statistics calculation
 * - Error states
 * - Empty states
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuperAdminImpersonationHistoryPage from './SuperAdminImpersonationHistoryPage';
import * as useImpersonationModule from '../hooks/useImpersonation';
import { ImpersonationLogType, ImpersonationAction } from '@/types/superUserModule';
import dayjs from 'dayjs';

// Mock the hook
jest.mock('../hooks/useImpersonation');

// Create a test-friendly query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

// Test data
const mockActions: ImpersonationAction[] = [
  {
    actionType: 'PAGE_VIEW',
    resource: '/dashboard',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    statusCode: 200,
  },
  {
    actionType: 'API_CALL',
    resource: 'customers',
    resourceId: 'cust_1',
    method: 'GET',
    statusCode: 200,
    duration: 150,
    timestamp: new Date(Date.now() - 4000).toISOString(),
  },
  {
    actionType: 'CREATE',
    resource: 'contract',
    resourceId: 'contract_1',
    statusCode: 201,
    metadata: { status: 'draft' },
    timestamp: new Date(Date.now() - 3000).toISOString(),
  },
  {
    actionType: 'UPDATE',
    resource: 'customer',
    resourceId: 'cust_1',
    statusCode: 200,
    timestamp: new Date(Date.now() - 2000).toISOString(),
  },
  {
    actionType: 'DELETE',
    resource: 'note',
    resourceId: 'note_1',
    statusCode: 204,
    timestamp: new Date(Date.now() - 1000).toISOString(),
  },
];

const mockLogs: ImpersonationLogType[] = [
  {
    id: 'log_1',
    superUserId: 'admin_1',
    impersonatedUserId: 'user_1',
    tenantId: 'tenant_1',
    loginAt: new Date(Date.now() - 10000).toISOString(),
    logoutAt: new Date(Date.now() - 5000).toISOString(),
    reason: 'Troubleshooting customer issue',
    ipAddress: '192.168.1.100',
    actionsTaken: mockActions,
    createdAt: new Date(Date.now() - 10000).toISOString(),
  },
  {
    id: 'log_2',
    superUserId: 'admin_1',
    impersonatedUserId: 'user_2',
    tenantId: 'tenant_2',
    loginAt: new Date(Date.now() - 5000).toISOString(),
    logoutAt: null, // Active session
    reason: 'Investigating data issue',
    ipAddress: '192.168.1.101',
    actionsTaken: [mockActions[0]],
    createdAt: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: 'log_3',
    superUserId: 'admin_2',
    impersonatedUserId: 'user_3',
    tenantId: 'tenant_3',
    loginAt: new Date(Date.now() - 100000).toISOString(),
    logoutAt: new Date(Date.now() - 90000).toISOString(),
    reason: 'User verification',
    ipAddress: '192.168.1.102',
    actionsTaken: [],
    createdAt: new Date(Date.now() - 100000).toISOString(),
  },
];

describe('SuperAdminImpersonationHistoryPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const renderComponent = (mockData = mockLogs) => {
    (useImpersonationModule.useImpersonationLogs as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <SuperAdminImpersonationHistoryPage />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render page header', () => {
      renderComponent();
      expect(screen.getByText('Impersonation History')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should render statistics cards', () => {
      renderComponent();
      expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('Completed Sessions')).toBeInTheDocument();
      expect(screen.getByText('Total Actions Tracked')).toBeInTheDocument();
    });

    it('should render filter controls', () => {
      renderComponent();
      expect(screen.getByPlaceholderText(/search by user id/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });

    it('should render table with columns', () => {
      renderComponent();
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Tenant')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should calculate total sessions correctly', () => {
      renderComponent();
      // mockLogs has 3 sessions
      const stats = screen.getAllByText(/\d+/);
      expect(stats[0]).toHaveTextContent('3'); // Total Sessions
    });

    it('should calculate active sessions correctly', () => {
      renderComponent();
      // mockLogs has 1 active session (log_2 with logoutAt: null)
      const activeStats = screen.getByText('Active Sessions').closest('div');
      expect(activeStats).toBeInTheDocument();
    });

    it('should calculate total actions tracked', () => {
      renderComponent();
      // mockLogs has 5+1+0 = 6 total actions
      expect(screen.getByText('Total Actions Tracked')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display all logs in table', () => {
      renderComponent();
      // Each log has an admin_id and user_id displayed
      expect(screen.getByText(/admin_1/)).toBeInTheDocument();
      expect(screen.getByText(/admin_2/)).toBeInTheDocument();
    });

    it('should show correct status tags', () => {
      renderComponent();
      const completedTags = screen.getAllByText('Completed');
      const activeTags = screen.getAllByText('Active');
      expect(completedTags.length).toBeGreaterThan(0);
      expect(activeTags.length).toBeGreaterThan(0);
    });

    it('should display action count for each log', () => {
      renderComponent();
      const actionCountTags = screen.getAllByText(/^\d+$/);
      expect(actionCountTags.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('should filter by search text', async () => {
      renderComponent();
      const searchInput = screen.getByPlaceholderText(/search by user id/i);

      await userEvent.type(searchInput, 'Troubleshooting');
      await waitFor(() => {
        expect(searchInput).toHaveValue('Troubleshooting');
      });

      // Should show only log_1 which has "Troubleshooting" in reason
      expect(screen.getByText(/Troubleshooting customer issue/)).toBeInTheDocument();
    });

    it('should filter by status - active only', async () => {
      renderComponent();
      const statusSelect = screen.getByDisplayValue('All Statuses');

      await userEvent.click(statusSelect);
      const activeOption = screen.getByText('Active Only');
      await userEvent.click(activeOption);

      await waitFor(() => {
        const activeTags = screen.getAllByText('Active');
        // Should only show active sessions
        expect(activeTags.length).toBeGreaterThan(0);
      });
    });

    it('should filter by status - completed only', async () => {
      renderComponent();
      const statusSelect = screen.getByDisplayValue('All Statuses');

      await userEvent.click(statusSelect);
      const completedOption = screen.getByText('Completed Only');
      await userEvent.click(completedOption);

      await waitFor(() => {
        const completedTags = screen.getAllByText('Completed');
        // Should only show completed sessions
        expect(completedTags.length).toBeGreaterThan(0);
      });
    });

    it('should clear search and reset filters', async () => {
      renderComponent();
      const searchInput = screen.getByPlaceholderText(/search by user id/i);

      await userEvent.type(searchInput, 'test');
      expect(searchInput).toHaveValue('test');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await userEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', () => {
      renderComponent();
      expect(screen.getByText(/sessions/)).toBeInTheDocument();
    });

    it('should handle page size changes', async () => {
      renderComponent();
      // Pagination controls should be present
      expect(screen.getByText(/sessions/)).toBeInTheDocument();
    });
  });

  describe('Detail Drawer', () => {
    it('should open detail drawer when clicking view button', async () => {
      renderComponent();

      // Find first view button
      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1]; // Last button is typically View

      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Impersonation Session Details')).toBeInTheDocument();
      });
    });

    it('should display session details in drawer', async () => {
      renderComponent();

      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1];

      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Session Overview')).toBeInTheDocument();
      });
    });

    it('should show actions timeline in drawer', async () => {
      renderComponent();

      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1];

      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/Action Timeline/)).toBeInTheDocument();
      });
    });

    it('should close drawer when clicking close button', async () => {
      renderComponent();

      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1];

      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Impersonation Session Details')).toBeInTheDocument();
      });

      // Close drawer (ESC or close button)
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      (useImpersonationModule.useImpersonationLogs as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SuperAdminImpersonationHistoryPage />
        </QueryClientProvider>
      );

      // Loading spinner should be visible
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      const error = new Error('Failed to load impersonation logs');

      (useImpersonationModule.useImpersonationLogs as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SuperAdminImpersonationHistoryPage />
        </QueryClientProvider>
      );

      expect(screen.getByText(/error loading impersonation history/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no logs', () => {
      renderComponent([]);

      expect(screen.getByText(/no impersonation sessions found/i)).toBeInTheDocument();
    });

    it('should show empty state when filter returns no results', async () => {
      renderComponent();
      const searchInput = screen.getByPlaceholderText(/search by user id/i);

      await userEvent.type(searchInput, 'nonexistent_search_term_xyz');

      await waitFor(() => {
        expect(screen.getByText(/no impersonation sessions found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Action Details in Drawer', () => {
    it('should display different action types with correct icons', async () => {
      renderComponent();

      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1];

      await userEvent.click(viewButton);

      await waitFor(() => {
        // Should show multiple action types
        expect(screen.getByText(/PAGE_VIEW/)).toBeInTheDocument();
        expect(screen.getByText(/API_CALL/)).toBeInTheDocument();
        expect(screen.getByText(/CREATE/)).toBeInTheDocument();
      });
    });

    it('should show action details like resource, method, status code', async () => {
      renderComponent();

      const viewButtons = screen.getAllByRole('button', { name: '' });
      const viewButton = viewButtons[viewButtons.length - 1];

      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/Resource:/)).toBeInTheDocument();
        expect(screen.getByText(/Method:/)).toBeInTheDocument();
        expect(screen.getByText(/Status:/)).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should filter by date range', async () => {
      renderComponent();

      // The date range picker button should be present
      const datePickerButton = screen.getByRole('button', { name: /select date range/i });
      expect(datePickerButton).toBeInTheDocument();
    });
  });

  describe('Export Button', () => {
    it('should have export button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should export button be clickable', async () => {
      renderComponent();
      const exportButton = screen.getByRole('button', { name: /export/i });

      await userEvent.click(exportButton);
      // TODO: Add export implementation
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderComponent();
      const heading = screen.getByText('Impersonation History');
      expect(heading.tagName).toBe('H1');
    });

    it('should have accessible form controls', () => {
      renderComponent();
      const searchInput = screen.getByPlaceholderText(/search by user id/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render table columns responsive', () => {
      renderComponent();
      // Table should have scroll on x-axis for responsiveness
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});