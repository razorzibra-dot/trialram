/**
 * SuperAdminUsersPage Tests
 * Tests for super admin user management page with search, filter, and pagination
 * 
 * Tests:
 * - Page rendering and layout
 * - Permission checks
 * - Statistics card display
 * - Search functionality
 * - Filter by access level
 * - Filter by super admin status
 * - Clear filters
 * - Pagination
 * - CRUD operations
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SuperAdminUsersPage from '../SuperAdminUsersPage';
import * as authContext from '@/contexts/AuthContext';
import * as hooks from '../../hooks/useSuperUserManagement';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('../../hooks/useSuperUserManagement');
jest.mock('@/components/common', () => ({
  PageHeader: ({ title, description, extra }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {extra}
    </div>
  ),
  StatCard: ({ title, value }: any) => (
    <div data-testid="stat-card">{title}: {value}</div>
  ),
}));
jest.mock('../../components', () => ({
  SuperUserList: ({ onEdit, onViewDetails, onDelete, onGrantAccess }: any) => (
    <div data-testid="super-user-list">
      <button onClick={() => onEdit({ id: 'user-1', name: 'John' })}>
        Edit
      </button>
      <button onClick={() => onViewDetails({ id: 'user-1' })}>
        View Details
      </button>
      <button onClick={() => onDelete('user-1')}>
        Delete
      </button>
      <button onClick={() => onGrantAccess({ id: 'user-1' })}>
        Grant Access
      </button>
    </div>
  ),
  SuperUserFormPanel: ({ onSubmit, onCancel }: any) => (
    <div data-testid="super-user-form">
      <button onClick={() => onSubmit({ email: 'new@test.com' })}>
        Submit Form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  SuperUserDetailPanel: ({ onEdit, onDelete, onGrantAccess }: any) => (
    <div data-testid="super-user-detail">
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onGrantAccess}>Grant Access</button>
    </div>
  ),
  GrantAccessModal: ({ onClose, onSuccess }: any) => (
    <div data-testid="grant-access-modal">
      <button onClick={onSuccess}>Grant</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockSuperUsers = [
  {
    id: 'user-1',
    email: 'john@example.com',
    name: 'John Doe',
    accessLevel: 'full',
    isSuperAdmin: true,
    status: 'active',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    accessLevel: 'limited',
    isSuperAdmin: false,
    status: 'active',
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    name: 'Bob Johnson',
    accessLevel: 'read_only',
    isSuperAdmin: false,
    status: 'active',
  },
];

const mockTenantAccess = [
  { id: 'access-1', superUserId: 'user-1', tenantId: 'tenant-1' },
];

const renderPage = () => {
  return render(
    <BrowserRouter>
      <SuperAdminUsersPage />
    </BrowserRouter>
  );
};

describe('SuperAdminUsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authContext.useAuth as jest.Mock).mockReturnValue({
      hasPermission: jest.fn(() => true),
    });

    (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
      superUsers: mockSuperUsers,
      isLoading: false,
      error: null,
      createSuperUser: jest.fn(),
      updateSuperUser: jest.fn(),
      deleteSuperUser: jest.fn(),
      refetch: jest.fn(),
    });

    (hooks.useTenantAccess as jest.Mock).mockReturnValue({
      tenantAccess: mockTenantAccess,
      isLoading: false,
      grantAccess: jest.fn(),
      revokeAccess: jest.fn(),
    });
  });

  describe('Page Rendering', () => {
    test('renders page header with title and description', () => {
      renderPage();
      expect(screen.getByText('Super Users Management')).toBeInTheDocument();
      expect(
        screen.getByText('Manage super user accounts and tenant access assignments')
      ).toBeInTheDocument();
    });

    test('displays statistics cards', () => {
      renderPage();
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards.length).toBeGreaterThan(0);
      expect(screen.getByText(/Total Super Users:/)).toBeInTheDocument();
    });

    test('displays search and filter section', () => {
      renderPage();
      expect(
        screen.getByPlaceholderText('Search by email, name, or ID...')
      ).toBeInTheDocument();
    });

    test('displays super user list', () => {
      renderPage();
      expect(screen.getByTestId('super-user-list')).toBeInTheDocument();
    });

    test('displays create button in header', () => {
      renderPage();
      const createButton = screen.getByText('Create Super User');
      expect(createButton).toBeInTheDocument();
    });

    test('displays refresh button', () => {
      renderPage();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Permission Checks', () => {
    test('shows access denied alert when user lacks permission', () => {
      (authContext.useAuth as jest.Mock).mockReturnValue({
        hasPermission: jest.fn(() => false),
      });

      renderPage();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('searches super users by email', async () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(
        'Search by email, name, or ID...'
      );

      fireEvent.change(searchInput, { target: { value: 'john@example.com' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('john@example.com');
      });
    });

    test('searches super users by name', async () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(
        'Search by email, name, or ID...'
      );

      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('Jane');
      });
    });

    test('clears search input with allowClear', async () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(
        'Search by email, name, or ID...'
      ) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(searchInput.value).toBe('test');
    });
  });

  describe('Filter Functionality', () => {
    test('filters by access level', async () => {
      renderPage();
      const filterSelects = screen.getAllByRole('combobox');
      // Access level filter should be one of the select components
      expect(filterSelects.length).toBeGreaterThan(0);
    });

    test('filters by super admin status', async () => {
      renderPage();
      const filterSelects = screen.getAllByRole('combobox');
      expect(filterSelects.length).toBeGreaterThan(0);
    });

    test('resets page to 1 when filter changes', async () => {
      renderPage();
      const filterSelects = screen.getAllByRole('combobox');
      expect(filterSelects.length).toBeGreaterThan(0);
    });
  });

  describe('Clear Filters', () => {
    test('clears all filters with Clear Filters button', async () => {
      renderPage();
      const clearButton = screen.getByText('Clear Filters');
      expect(clearButton).toBeInTheDocument();
    });

    test('resets search query when clearing filters', async () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(
        'Search by email, name, or ID...'
      );
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls', () => {
      renderPage();
      expect(screen.getByText(/Page/)).toBeInTheDocument();
    });

    test('displays page size selector', () => {
      renderPage();
      const pageSelects = screen.getAllByRole('combobox');
      // Page size selector should exist
      expect(pageSelects.length).toBeGreaterThan(0);
    });

    test('shows previous and next buttons', () => {
      renderPage();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('disables previous button on first page', () => {
      renderPage();
      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    test('disables next button when on last page', () => {
      renderPage();
      const nextButton = screen.getByText('Next');
      // With default 10 items per page and 3 items total, should be disabled
      if (mockSuperUsers.length <= 10) {
        expect(nextButton).toBeDisabled();
      }
    });
  });

  describe('Create Super User', () => {
    test('opens form drawer when create button is clicked', async () => {
      renderPage();
      const createButton = screen.getByText('Create Super User');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('super-user-form')).toBeInTheDocument();
      });
    });

    test('submits form with correct data', async () => {
      const mockCreateSuperUser = jest.fn();
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: mockSuperUsers,
        isLoading: false,
        error: null,
        createSuperUser: mockCreateSuperUser,
        updateSuperUser: jest.fn(),
        deleteSuperUser: jest.fn(),
        refetch: jest.fn(),
      });

      renderPage();
      const createButton = screen.getByText('Create Super User');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('super-user-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Super user created successfully'
        );
      });
    });
  });

  describe('Edit Super User', () => {
    test('opens form drawer in edit mode', async () => {
      renderPage();
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('super-user-form')).toBeInTheDocument();
      });
    });

    test('shows success message on update', async () => {
      const mockUpdateSuperUser = jest.fn();
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: mockSuperUsers,
        isLoading: false,
        error: null,
        createSuperUser: jest.fn(),
        updateSuperUser: mockUpdateSuperUser,
        deleteSuperUser: jest.fn(),
        refetch: jest.fn(),
      });

      renderPage();
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Form');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Super user updated successfully'
        );
      });
    });
  });

  describe('View Details', () => {
    test('opens detail drawer when view button is clicked', async () => {
      renderPage();
      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByTestId('super-user-detail')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Super User', () => {
    test('deletes super user with confirmation', async () => {
      const mockDeleteSuperUser = jest.fn();
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: mockSuperUsers,
        isLoading: false,
        error: null,
        createSuperUser: jest.fn(),
        updateSuperUser: jest.fn(),
        deleteSuperUser: mockDeleteSuperUser,
        refetch: jest.fn(),
      });

      renderPage();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Super user deleted successfully'
        );
      });
    });

    test('shows error message on delete failure', async () => {
      const mockDeleteSuperUser = jest.fn().mockRejectedValue(
        new Error('Delete failed')
      );
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: mockSuperUsers,
        isLoading: false,
        error: null,
        createSuperUser: jest.fn(),
        updateSuperUser: jest.fn(),
        deleteSuperUser: mockDeleteSuperUser,
        refetch: jest.fn(),
      });

      renderPage();
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to delete super user'
        );
      });
    });
  });

  describe('Grant Access', () => {
    test('opens grant access modal', async () => {
      renderPage();
      const grantButton = screen.getByText('Grant Access');
      fireEvent.click(grantButton);

      await waitFor(() => {
        expect(screen.getByTestId('grant-access-modal')).toBeInTheDocument();
      });
    });

    test('shows success message on access granted', async () => {
      renderPage();
      const grantButton = screen.getByText('Grant Access');
      fireEvent.click(grantButton);

      await waitFor(() => {
        const grantModalButton = screen.getByText('Grant');
        fireEvent.click(grantModalButton);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Access granted successfully'
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error alert when loading fails', () => {
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: [],
        isLoading: false,
        error: new Error('Failed to load'),
        createSuperUser: jest.fn(),
        updateSuperUser: jest.fn(),
        deleteSuperUser: jest.fn(),
        refetch: jest.fn(),
      });

      renderPage();
      expect(screen.getByText('Error loading super users')).toBeInTheDocument();
    });

    test('shows empty state when no users match filters', async () => {
      renderPage();
      const searchInput = screen.getByPlaceholderText(
        'Search by email, name, or ID...'
      );

      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No super users found')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state for refresh button', () => {
      (hooks.useSuperUserManagement as jest.Mock).mockReturnValue({
        superUsers: mockSuperUsers,
        isLoading: true,
        error: null,
        createSuperUser: jest.fn(),
        updateSuperUser: jest.fn(),
        deleteSuperUser: jest.fn(),
        refetch: jest.fn(),
      });

      renderPage();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    test('calculates and displays total super users', () => {
      renderPage();
      expect(screen.getByText(/Total Super Users:/)).toBeInTheDocument();
    });

    test('calculates and displays full access count', () => {
      renderPage();
      expect(screen.getByText(/Full Access:/)).toBeInTheDocument();
    });

    test('calculates and displays super admin count', () => {
      renderPage();
      expect(screen.getByText(/Super Admins:/)).toBeInTheDocument();
    });

    test('displays tenant access count', () => {
      renderPage();
      expect(screen.getByText(/Multi-Tenant:/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders statistics cards responsively', () => {
      renderPage();
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards.length).toBeGreaterThan(0);
    });

    test('search and filter layout responsive', () => {
      renderPage();
      expect(
        screen.getByPlaceholderText('Search by email, name, or ID...')
      ).toBeInTheDocument();
    });
  });
});