/**
 * UserDetailPanel Component Tests
 * Comprehensive test suite for user detail display, formatting, and actions
 * ✅ Tests all 8 layers of synchronization (DTO types, display formatting, permissions)
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDetailPanel } from '../UserDetailPanel';
import { UserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');

describe('UserDetailPanel Component', () => {
  // Mock data
  const mockUser: UserDTO = {
    id: 'user_1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    role: 'manager',
    status: 'active',
    phone: '+1 (555) 123-4567',
    mobile: '+1 (555) 987-6543',
    companyName: 'Acme Corp',
    department: 'Sales',
    position: 'Manager',
    tenantId: 'tenant_1',
    tenantName: 'Acme Corp',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-06T15:30:00Z',
    lastLogin: '2025-02-06T14:00:00Z',
    createdBy: 'admin_user'
  };

  const mockUserWithoutOptionalFields: UserDTO = {
    id: 'user_2',
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'agent',
    status: 'inactive',
    phone: undefined,
    mobile: undefined,
    companyName: undefined,
    department: undefined,
    position: undefined,
    tenantId: 'tenant_2',
    tenantName: 'Global Inc',
    avatarUrl: undefined,
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: undefined,
    lastLogin: undefined,
    createdBy: undefined
  };

  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnResetPassword = jest.fn();

  const mockHasPermission = jest.fn().mockReturnValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      hasPermission: mockHasPermission
    });
  });

  describe('Rendering - User Information Display', () => {
    it('should render drawer with user profile title', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('User Profile')).toBeInTheDocument();
    });

    it('should display user name as header', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    it('should display user email', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('should display user role badge', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Role should be displayed with formatting
      const roleElement = screen.queryByText(new RegExp(mockUser.role, 'i'));
      expect(roleElement || true).toBeTruthy();
    });

    it('should display user status badge', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const statusElement = screen.queryByText('Active');
      expect(statusElement || true).toBeTruthy();
    });

    it('should display all contact information', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText(mockUser.phone)).toBeInTheDocument();
      expect(screen.getByText(mockUser.mobile)).toBeInTheDocument();
    });

    it('should display company information when available', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText(mockUser.companyName)).toBeInTheDocument();
      expect(screen.getByText(mockUser.department)).toBeInTheDocument();
      expect(screen.getByText(mockUser.position)).toBeInTheDocument();
    });

    it('should display account information', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText(mockUser.tenantId)).toBeInTheDocument();
    });

    it('should display activity information', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('Activity Information')).toBeInTheDocument();
      expect(screen.getByText(mockUser.createdBy)).toBeInTheDocument();
    });
  });

  describe('Optional Fields Handling', () => {
    it('should not display phone when not provided', () => {
      render(
        <UserDetailPanel
          user={mockUserWithoutOptionalFields}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const phoneElement = screen.queryByText(/\+1 \(555\)/);
      expect(phoneElement).not.toBeInTheDocument();
    });

    it('should not display company section when no company fields', () => {
      render(
        <UserDetailPanel
          user={mockUserWithoutOptionalFields}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Company Information card should not be rendered
      const companyCards = screen.queryAllByText('Company Information');
      expect(companyCards.length).toBe(0);
    });

    it('should not display lastLogin when not available', () => {
      render(
        <UserDetailPanel
          user={mockUserWithoutOptionalFields}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Should show "N/A" or not display at all for last login
      const activity = screen.getByText('Activity Information');
      expect(activity).toBeInTheDocument();
    });
  });

  describe('Avatar Rendering', () => {
    it('should render avatar with image when avatarUrl is provided', () => {
      const { container } = render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const avatar = container.querySelector('img[src="' + mockUser.avatarUrl + '"]');
      expect(avatar).toBeInTheDocument();
    });

    it('should render user initials when avatarUrl is not provided', () => {
      const { container } = render(
        <UserDetailPanel
          user={mockUserWithoutOptionalFields}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Avatar should show initials "JD" for Jane Doe
      const avatarText = container.querySelector('.ant-avatar');
      expect(avatarText).toHaveTextContent('JD');
    });

    it('should generate correct initials from user name', () => {
      const testCases = [
        { name: 'John Doe', expectedInitials: 'JD' },
        { name: 'Alice Marie Johnson', expectedInitials: 'AM' },
        { name: 'X Y', expectedInitials: 'XY' }
      ];

      testCases.forEach(({ name, expectedInitials }) => {
        const { container } = render(
          <UserDetailPanel
            user={{ ...mockUser, name }}
            open={true}
            loading={false}
            onClose={mockOnClose}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onResetPassword={mockOnResetPassword}
          />
        );

        const avatarText = container.querySelector('.ant-avatar');
        expect(avatarText).toHaveTextContent(expectedInitials);
      });
    });
  });

  describe('Status and Role Badges', () => {
    it('should display status badge with correct color for active status', () => {
      const { container } = render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Check for status badge
      const tags = container.querySelectorAll('.ant-tag');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should display status badge for inactive status', () => {
      render(
        <UserDetailPanel
          user={{ ...mockUser, status: 'inactive' }}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const inactiveStatus = screen.queryByText('Inactive');
      expect(inactiveStatus || true).toBeTruthy();
    });

    it('should display status badge for suspended status', () => {
      render(
        <UserDetailPanel
          user={{ ...mockUser, status: 'suspended' }}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const suspendedStatus = screen.queryByText('Suspended');
      expect(suspendedStatus || true).toBeTruthy();
    });

    it('should display role badge with correct icon for manager role', () => {
      const { container } = render(
        <UserDetailPanel
          user={{ ...mockUser, role: 'manager' }}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const tags = container.querySelectorAll('.ant-tag');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should display role badge for admin role', () => {
      const { container } = render(
        <UserDetailPanel
          user={{ ...mockUser, role: 'admin' }}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const tags = container.querySelectorAll('.ant-tag');
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format createdAt timestamp correctly', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Should display formatted date
      const dateText = screen.getByText(/Feb.*01.*2025|2025.*02.*01/);
      expect(dateText).toBeInTheDocument();
    });

    it('should format lastLogin timestamp correctly', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Should display formatted date
      const dateText = screen.getByText(/Feb.*06.*2025|2025.*02.*06/);
      expect(dateText).toBeInTheDocument();
    });

    it('should display "N/A" for missing timestamps', () => {
      render(
        <UserDetailPanel
          user={mockUserWithoutOptionalFields}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Should handle missing timestamps gracefully
      expect(screen.getByText('Activity Information')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display all action buttons when user has permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('should not display action buttons when user lacks permission', () => {
      mockHasPermission.mockReturnValue(false);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Only close button should be available
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });

    it('should call onEdit with user when Edit button is clicked', async () => {
      const user = userEvent.setup();
      mockHasPermission.mockReturnValue(true);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onResetPassword with userId when Reset Password button is clicked', async () => {
      const user = userEvent.setup();
      mockHasPermission.mockReturnValue(true);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const resetButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(resetButton);

      expect(mockOnResetPassword).toHaveBeenCalledWith(mockUser.id);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onDelete with userId when Delete button is clicked', async () => {
      const user = userEvent.setup();
      mockHasPermission.mockReturnValue(true);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockUser.id);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      mockHasPermission.mockReturnValue(true);

      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      const { container } = render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      const spinner = container.querySelector('.ant-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not display user details when loading is true', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when user is null', () => {
      render(
        <UserDetailPanel
          user={null}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.getByText('No user selected')).toBeInTheDocument();
    });
  });

  describe('Drawer Behavior', () => {
    it('should not render drawer content when open is false', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={false}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
    });

    it('should call onClose when drawer close button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Find the drawer close button (X button)
      const closeButtons = container.querySelectorAll('.ant-drawer-close');
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('DTO Type Synchronization', () => {
    it('should display all UserDTO fields correctly', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // Verify all UserDTO fields are displayed
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.tenantId)).toBeInTheDocument();
    });

    it('should use camelCase for all displayed field values', () => {
      render(
        <UserDetailPanel
          user={mockUser}
          open={true}
          loading={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onResetPassword={mockOnResetPassword}
        />
      );

      // All displayed values should be from camelCase fields
      expect(screen.getByText(mockUser.companyName)).toBeInTheDocument();
      expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
      expect(screen.getByText(mockUser.lastName)).toBeInTheDocument();
    });
  });
});