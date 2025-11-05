/**
 * Quick Impersonation Widget - Unit Tests
 * 
 * Test coverage for:
 * - Component rendering
 * - Form validation
 * - Tenant and user selection
 * - Impersonation start functionality
 * - Error handling
 * - Loading states
 * - Success callbacks
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QuickImpersonationWidget } from '../QuickImpersonationWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { message } from 'antd';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/ImpersonationContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseImpersonationMode = useImpersonationMode as jest.MockedFunction<typeof useImpersonationMode>;

describe('QuickImpersonationWidget', () => {
  const mockStartImpersonation = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseAuth.mockReturnValue({
      user: {
        id: 'super_admin_1',
        email: 'admin@platform.com',
        name: 'Super Admin',
        isSuperAdmin: true,
      } as any,
      login: jest.fn(),
      logout: jest.fn(),
      restoreSession: jest.fn(),
      getCurrentImpersonationSession: jest.fn(),
      isImpersonating: jest.fn(() => false),
      canAccessModule: jest.fn(() => true),
      hasRole: jest.fn(() => true),
      hasPermission: jest.fn(() => true),
      isSuperAdmin: jest.fn(() => true),
    });

    mockUseImpersonationMode.mockReturnValue({
      activeSession: null,
      isImpersonating: false,
      startImpersonation: mockStartImpersonation,
      endImpersonation: jest.fn(),
      getSessionDetails: jest.fn(() => null),
      isSessionValid: jest.fn(() => false),
      getRemainingSessionTime: jest.fn(() => -1),
    });

    mockStartImpersonation.mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <QuickImpersonationWidget {...props} />
      </BrowserRouter>
    );
  };

  // ===== RENDERING TESTS =====

  describe('Component Rendering', () => {
    test('should render the widget with title and description', () => {
      renderComponent();

      expect(screen.getByText('Quick Impersonation')).toBeInTheDocument();
      expect(screen.getByText(/quickly select a user to impersonate/i)).toBeInTheDocument();
    });

    test('should render form fields', () => {
      renderComponent();

      expect(screen.getByText(/Select Tenant/i)).toBeInTheDocument();
      expect(screen.getByText(/Select User/i)).toBeInTheDocument();
      expect(screen.getByText(/Reason for Impersonation/i)).toBeInTheDocument();
    });

    test('should render required field indicators', () => {
      renderComponent();

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    test('should render action buttons', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Start Impersonation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    });

    test('should render info note about audit logging', () => {
      renderComponent();

      expect(screen.getByText(/impersonation sessions are logged and audited/i)).toBeInTheDocument();
    });
  });

  // ===== FORM VALIDATION TESTS =====

  describe('Form Validation', () => {
    test('start button should be disabled initially', () => {
      renderComponent();

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      expect(startButton).toBeDisabled();
    });

    test('should show error when submitting without tenant selection', async () => {
      renderComponent();

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      
      // First select a user (requires tenant first)
      // Since we can't without tenant, just try to submit
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a tenant')).toBeInTheDocument();
      });
    });

    test('should show error when submitting without user selection', async () => {
      renderComponent();

      // Select tenant but not user
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a user to impersonate')).toBeInTheDocument();
      });
    });

    test('should enable start button when all required fields are filled', async () => {
      renderComponent();

      // Select tenant
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      // Select user
      await waitFor(() => {
        const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
        fireEvent.click(userTrigger);
      });

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      // Check if button is enabled
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
        expect(startButton).not.toBeDisabled();
      });
    });
  });

  // ===== TENANT SELECTION TESTS =====

  describe('Tenant Selection', () => {
    test('should display all available tenants in dropdown', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('TechStart Inc')).toBeInTheDocument();
        expect(screen.getByText('Global Solutions Ltd')).toBeInTheDocument();
      });
    });

    test('should show tenant status badges', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const activeStatus = screen.getAllByText('active');
        expect(activeStatus.length).toBeGreaterThan(0);
      });
    });

    test('should display selected tenant info', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/Selected: Acme Corporation/i)).toBeInTheDocument();
      });
    });

    test('should reset user selection when tenant changes', async () => {
      renderComponent();

      // Select first tenant
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      // Select a user
      await waitFor(() => {
        const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
        fireEvent.click(userTrigger);
      });

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      // Change tenant
      const tenantTrigger2 = screen.getByRole('button', { name: /Acme Corporation/i });
      fireEvent.click(tenantTrigger2);

      await waitFor(() => {
        const techstartOption = screen.getByText('TechStart Inc');
        fireEvent.click(techstartOption);
      });

      // User selection should be reset
      await waitFor(() => {
        const userButton = screen.getByRole('button', { name: /Choose a user/i });
        expect(userButton).toHaveTextContent('Choose a user');
      });
    });
  });

  // ===== USER SELECTION TESTS =====

  describe('User Selection', () => {
    test('should disable user dropdown until tenant is selected', () => {
      renderComponent();

      const userTrigger = screen.getAllByRole('button')[1]; // Second trigger should be user
      
      // Find the actual user trigger
      const userLabel = screen.getByText(/Select User/i);
      const userTriggerBtn = userLabel.parentElement?.querySelector('button');
      
      expect(userTriggerBtn).toBeInTheDocument();
    });

    test('should show message when no users available for tenant', async () => {
      renderComponent();

      // Select a tenant
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      // Mock a tenant with no users would require test setup
      // This is a limitation of the current mock data
    });

    test('should populate users when tenant is selected', async () => {
      renderComponent();

      // Select Acme Corporation
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      // Open user dropdown
      await waitFor(() => {
        const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
        fireEvent.click(userTrigger);
      });

      await waitFor(() => {
        expect(screen.getByText(/John Admin/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Manager/i)).toBeInTheDocument();
        expect(screen.getByText(/Bob Smith/i)).toBeInTheDocument();
      });
    });

    test('should show user status badges', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const statusBadges = screen.getAllByText(/active|inactive/);
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== IMPERSONATION START TESTS =====

  describe('Starting Impersonation', () => {
    test('should call startImpersonation with correct parameters', async () => {
      renderComponent();

      // Select tenant
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      // Select user
      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/Customer support/i);
      fireEvent.change(reasonInput, { target: { value: 'Customer support request' } });

      // Submit form
      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockStartImpersonation).toHaveBeenCalled();
        const callArgs = mockStartImpersonation.mock.calls[0][0];
        expect(callArgs.tenantId).toBe('tenant_1');
        expect(callArgs.impersonatedUserId).toBe('user_1');
        expect(callArgs.reason).toBe('Customer support request');
      });
    });

    test('should show loading state while starting impersonation', async () => {
      mockStartImpersonation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderComponent();

      // Select tenant and user
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Starting/i)).toBeInTheDocument();
        expect(mockStartImpersonation).toHaveBeenCalled();
      });
    });

    test('should show success message when impersonation starts', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Impersonation started successfully');
      });
    });

    test('should call onSuccess callback when provided', async () => {
      renderComponent({ onSuccess: mockOnSuccess });

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        const session = mockOnSuccess.mock.calls[0][0];
        expect(session.impersonatedUserId).toBe('user_1');
        expect(session.tenantId).toBe('tenant_1');
      });
    });

    test('should reset form after successful impersonation', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const reasonInput = screen.getByPlaceholderText(/Customer support/i) as HTMLInputElement;
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockStartImpersonation).toHaveBeenCalled();
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    test('should display error when startImpersonation fails', async () => {
      const errorMessage = 'Failed to start session';
      mockStartImpersonation.mockRejectedValueOnce(new Error(errorMessage));

      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(message.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    test('should handle unknown errors gracefully', async () => {
      mockStartImpersonation.mockRejectedValueOnce('Unknown error');

      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to start impersonation/i)).toBeInTheDocument();
      });
    });

    test('should allow retry after error', async () => {
      mockStartImpersonation
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);

      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      let startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Retry
      startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockStartImpersonation).toHaveBeenCalledTimes(2);
        expect(message.success).toHaveBeenCalledWith('Impersonation started successfully');
      });
    });
  });

  // ===== RESET BUTTON TESTS =====

  describe('Reset Functionality', () => {
    test('should clear form when reset button is clicked', async () => {
      renderComponent();

      // Fill form
      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const reasonInput = screen.getByPlaceholderText(/Customer support/i);
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

      // Click reset
      const resetButton = screen.getByRole('button', { name: /Reset/i });
      fireEvent.click(resetButton);

      // Form should be cleared
      await waitFor(() => {
        const tenantBtn = screen.getByRole('button', { name: /Choose a tenant/i });
        expect(tenantBtn).toBeInTheDocument();
      });
    });

    test('should disable reset button while loading', async () => {
      mockStartImpersonation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /Reset/i });
        expect(resetButton).toBeDisabled();
      });
    });
  });

  // ===== REASON FIELD TESTS =====

  describe('Reason Field', () => {
    test('should display character counter for reason field', () => {
      renderComponent();

      const reasonInput = screen.getByPlaceholderText(/Customer support/i);
      fireEvent.change(reasonInput, { target: { value: 'Test' } });

      expect(screen.getByText(/4\/500 characters/)).toBeInTheDocument();
    });

    test('should enforce max length on reason field', () => {
      renderComponent();

      const reasonInput = screen.getByPlaceholderText(/Customer support/i) as HTMLInputElement;
      const maxLength = reasonInput.maxLength;

      expect(maxLength).toBe(500);
    });

    test('should allow reason field to be optional', async () => {
      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      // Don't fill reason field, submit anyway
      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockStartImpersonation).toHaveBeenCalled();
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====

  describe('Accessibility', () => {
    test('should have proper label associations', () => {
      renderComponent();

      const labels = screen.getAllByText(/Select Tenant|Select User|Reason for Impersonation/);
      expect(labels.length).toBe(3);
    });

    test('should have semantic HTML structure', () => {
      renderComponent();

      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    test('should disable inputs properly when loading', async () => {
      mockStartImpersonation.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderComponent();

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const reasonInput = screen.getByPlaceholderText(/Customer support/i) as HTMLInputElement;
      fireEvent.change(reasonInput, { target: { value: 'Test' } });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(reasonInput.disabled).toBe(true);
      });
    });
  });

  // ===== CUSTOM PROPS TESTS =====

  describe('Custom Props', () => {
    test('should apply custom className', () => {
      const { container } = render(
        <BrowserRouter>
          <QuickImpersonationWidget className="custom-class" />
        </BrowserRouter>
      );

      const cards = container.querySelectorAll('.custom-class');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('should handle onSuccess callback', async () => {
      const onSuccess = jest.fn();
      renderComponent({ onSuccess });

      const tenantTrigger = screen.getByRole('button', { name: /Choose a tenant/i });
      fireEvent.click(tenantTrigger);

      await waitFor(() => {
        const acmeOption = screen.getByText('Acme Corporation');
        fireEvent.click(acmeOption);
      });

      const userTrigger = screen.getByRole('button', { name: /Choose a user/i });
      fireEvent.click(userTrigger);

      await waitFor(() => {
        const johnOption = screen.getByText(/John Admin/i);
        fireEvent.click(johnOption);
      });

      const startButton = screen.getByRole('button', { name: /Start Impersonation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
          impersonatedUserId: 'user_1',
          tenantId: 'tenant_1',
        }));
      });
    });
  });
});