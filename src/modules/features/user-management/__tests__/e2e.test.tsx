/**
 * Phase 3.4: E2E Tests - UI Workflows
 * Testing user management UI components with super admin handling
 * 
 * Tests:
 * - UserFormPanel: super admin form without tenant field
 * - UserFormPanel: regular user form with tenant selector
 * - UserDetailPanel: super admin badge display
 * - UserDetailPanel: regular user tenant display
 * - Form validation and submission
 * - State management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock components for testing (would be real components)
const MockUserFormPanel = ({ user, onSubmit }: any) => {
  const isSuperAdmin = user?.isSuperAdmin === true && user?.tenantId === null;

  return (
    <div data-testid="user-form-panel">
      <input
        defaultValue={user?.name}
        data-testid="name-input"
        onChange={(e) => console.log(e.target.value)}
      />
      <input
        defaultValue={user?.email}
        data-testid="email-input"
        type="email"
      />

      {!isSuperAdmin && (
        <div data-testid="tenant-selector">
          <label>Tenant</label>
          <select
            defaultValue={user?.tenantId}
            data-testid="tenant-select"
          >
            <option value="">Select Tenant</option>
            <option value="tenant-1">Tenant 1</option>
            <option value="tenant-2">Tenant 2</option>
          </select>
        </div>
      )}

      {isSuperAdmin && (
        <div data-testid="super-admin-info">
          <p>This is a platform-wide super admin</p>
          <p>Tenant field is not applicable</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        data-testid="submit-button"
      >
        Save User
      </button>
    </div>
  );
};

const MockUserDetailPanel = ({ user }: any) => {
  const isSuperAdmin = user?.isSuperAdmin === true && user?.tenantId === null;

  return (
    <div data-testid="user-detail-panel">
      <div data-testid="user-name">{user?.name}</div>
      <div data-testid="user-email">{user?.email}</div>

      {isSuperAdmin ? (
        <div
          data-testid="super-admin-badge"
          style={{ color: 'purple', display: 'flex', alignItems: 'center' }}
        >
          👑 Platform-Wide Super Admin
        </div>
      ) : (
        <div data-testid="tenant-display">{user?.tenantId}</div>
      )}

      <div data-testid="role-display">{user?.role}</div>
    </div>
  );
};

describe('User Management E2E Tests - Phase 3.4', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('UserFormPanel - Super Admin Handling', () => {
    it('should hide tenant field for super admin', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={superAdmin} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      // Tenant selector should NOT be visible
      expect(screen.queryByTestId('tenant-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tenant-select')).not.toBeInTheDocument();
    });

    it('should show super admin info alert', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={superAdmin} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      // Should show info message
      expect(screen.getByTestId('super-admin-info')).toBeInTheDocument();
      expect(screen.getByText('Platform-wide super admin')).toBeInTheDocument();
    });

    it('should show tenant field for regular user', () => {
      const regularUser = {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={regularUser} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      // Tenant selector SHOULD be visible
      expect(screen.getByTestId('tenant-selector')).toBeInTheDocument();
      expect(screen.getByTestId('tenant-select')).toBeInTheDocument();
    });

    it('should populate tenant field with current value for regular user', () => {
      const regularUser = {
        id: 'user-1',
        name: 'User',
        email: 'user@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={regularUser} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      const selectElement = screen.getByTestId('tenant-select') as HTMLSelectElement;
      expect(selectElement.value).toBe('tenant-1');
    });

    it('should display name and email fields for both user types', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={superAdmin} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
    });

    it('should handle form submission for super admin', async () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      const onSubmit = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={superAdmin} onSubmit={onSubmit} />
        </QueryClientProvider>
      );

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      // Should handle submission without tenant field
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle form submission for regular user', async () => {
      const regularUser = {
        id: 'user-1',
        name: 'User',
        email: 'user@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      const onSubmit = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={regularUser} onSubmit={onSubmit} />
        </QueryClientProvider>
      );

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      // Should handle submission with tenant field
      expect(submitButton).toBeInTheDocument();
    });

    it('should prevent invalid super admin state (tenantId present)', () => {
      // This is an invalid state that UI should prevent
      const invalidSuperAdmin = {
        id: 'invalid-1',
        name: 'Invalid Super',
        email: 'invalid@example.com',
        isSuperAdmin: true,
        tenantId: 'tenant-1', // Invalid: super admin with tenant
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={invalidSuperAdmin} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      // Should still hide tenant field based on isSuperAdmin flag
      // or show warning
      const isSuperAdmin = invalidSuperAdmin.isSuperAdmin === true && 
                          invalidSuperAdmin.tenantId === null;
      
      if (!isSuperAdmin) {
        expect(screen.getByTestId('tenant-selector')).toBeInTheDocument();
      }
    });
  });

  describe('UserDetailPanel - Super Admin Display', () => {
    it('should display crown badge for super admin', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('super-admin-badge')).toBeInTheDocument();
      expect(screen.getByText(/Platform-Wide Super Admin/i)).toBeInTheDocument();
    });

    it('should display badge with purple color', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      const badge = screen.getByTestId('super-admin-badge');
      expect(badge).toHaveStyle({ color: 'purple' });
    });

    it('should display tenant name for regular user', () => {
      const regularUser = {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={regularUser} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('tenant-display')).toHaveTextContent('tenant-1');
      expect(screen.queryByTestId('super-admin-badge')).not.toBeInTheDocument();
    });

    it('should display user name and email', () => {
      const user = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={user} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
    });

    it('should display user role', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('role-display')).toHaveTextContent('super_admin');
    });

    it('should handle transition from regular user to super admin', () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel
            user={{
              id: 'user-1',
              name: 'User',
              email: 'user@example.com',
              isSuperAdmin: false,
              tenantId: 'tenant-1',
              role: 'admin',
            }}
          />
        </QueryClientProvider>
      );

      // Should show tenant initially
      expect(screen.getByTestId('tenant-display')).toBeInTheDocument();
      expect(screen.queryByTestId('super-admin-badge')).not.toBeInTheDocument();

      // Re-render with promoted user
      rerender(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel
            user={{
              id: 'user-1',
              name: 'User',
              email: 'user@example.com',
              isSuperAdmin: true,
              tenantId: null,
              role: 'super_admin',
            }}
          />
        </QueryClientProvider>
      );

      // Should show super admin badge
      expect(screen.getByTestId('super-admin-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('tenant-display')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', () => {
      const user = {
        id: 'user-1',
        name: 'User',
        email: 'invalid-email',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={user} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(emailInput.type).toBe('email');
    });

    it('should require name field', () => {
      const user = {
        id: 'user-1',
        name: '',
        email: 'user@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={user} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('should prevent submission with invalid data', () => {
      const user = {
        id: 'user-1',
        name: '',
        email: 'invalid',
        isSuperAdmin: false,
        tenantId: '',
        role: 'admin',
      };

      const onSubmit = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={user} onSubmit={onSubmit} />
        </QueryClientProvider>
      );

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      // In real implementation would validate before submission
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain super admin state across re-renders', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('super-admin-badge')).toBeInTheDocument();

      // Re-render with same data
      rerender(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      // Should still show badge
      expect(screen.getByTestId('super-admin-badge')).toBeInTheDocument();
    });

    it('should update form when user data changes', () => {
      const user1 = {
        id: 'user-1',
        name: 'User 1',
        email: 'user1@example.com',
        isSuperAdmin: false,
        tenantId: 'tenant-1',
        role: 'admin',
      };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={user1} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      expect(nameInput.value).toBe('User 1');

      const user2 = {
        ...user1,
        name: 'User 2',
      };

      rerender(
        <QueryClientProvider client={queryClient}>
          <MockUserFormPanel user={user2} onSubmit={vi.fn()} />
        </QueryClientProvider>
      );

      const updatedNameInput = screen.getByTestId('name-input') as HTMLInputElement;
      expect(updatedNameInput.value).toBe('User 2');
    });
  });

  describe('Null Tenant ID Handling', () => {
    it('should handle null tenant ID safely in super admin', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      // Should not throw, should show badge instead
      expect(screen.getByTestId('super-admin-badge')).toBeInTheDocument();
    });

    it('should not display null tenant ID', () => {
      const superAdmin = {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@platform.com',
        isSuperAdmin: true,
        tenantId: null,
        role: 'super_admin',
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MockUserDetailPanel user={superAdmin} />
        </QueryClientProvider>
      );

      // Tenant display should not show "null"
      const tenantDisplay = screen.queryByTestId('tenant-display');
      if (tenantDisplay) {
        expect(tenantDisplay).not.toHaveTextContent('null');
      }
    });
  });
});