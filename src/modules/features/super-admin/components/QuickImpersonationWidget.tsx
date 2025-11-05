/**
 * Quick Impersonation Widget Component
 * 
 * Provides a UI for super admins to quickly select a tenant and user to impersonate.
 * Features:
 * - Tenant selection dropdown
 * - User selection dropdown (populated based on selected tenant)
 * - Reason text input field
 * - Start button with loading state
 * - Error handling and user feedback
 * - Success callback with navigation
 * 
 * Type-safe with full validation using Zod schemas.
 * Fully integrated with ImpersonationContext and useAuth hook.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { ImpersonationStartInput, ImpersonationLogType, validateImpersonationStart } from '@/types/superUserModule';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * Mock data for demonstration - Replace with actual API calls
 */
interface MockTenant {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  tenantId: string;
}

// Mock tenants
const MOCK_TENANTS: MockTenant[] = [
  { id: 'tenant_1', name: 'Acme Corporation', status: 'active' },
  { id: 'tenant_2', name: 'TechStart Inc', status: 'active' },
  { id: 'tenant_3', name: 'Global Solutions Ltd', status: 'inactive' },
];

// Mock users by tenant
const MOCK_USERS_BY_TENANT: Record<string, MockUser[]> = {
  tenant_1: [
    { id: 'user_1', name: 'John Admin', email: 'john@acme.com', status: 'active', tenantId: 'tenant_1' },
    { id: 'user_2', name: 'Jane Manager', email: 'jane@acme.com', status: 'active', tenantId: 'tenant_1' },
    { id: 'user_3', name: 'Bob Smith', email: 'bob@acme.com', status: 'inactive', tenantId: 'tenant_1' },
  ],
  tenant_2: [
    { id: 'user_4', name: 'Alice Dev', email: 'alice@techstart.io', status: 'active', tenantId: 'tenant_2' },
    { id: 'user_5', name: 'Charlie Lead', email: 'charlie@techstart.io', status: 'active', tenantId: 'tenant_2' },
  ],
  tenant_3: [
    { id: 'user_6', name: 'Dave Wilson', email: 'dave@globalsolutions.com', status: 'inactive', tenantId: 'tenant_3' },
  ],
};

interface QuickImpersonationWidgetProps {
  /** Callback when impersonation starts successfully */
  onSuccess?: (session: ImpersonationLogType) => void;
  /** Custom class name for the container */
  className?: string;
}

/**
 * QuickImpersonationWidget Component
 * 
 * Renders a form for quick impersonation with:
 * - Tenant dropdown
 * - User dropdown (filtered by tenant)
 * - Reason field
 * - Start button with validation
 */
export const QuickImpersonationWidget: React.FC<QuickImpersonationWidgetProps> = ({
  onSuccess,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startImpersonation } = useImpersonationMode();

  // Form state
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed state
  const availableUsers = selectedTenant 
    ? (MOCK_USERS_BY_TENANT[selectedTenant] || [])
    : [];

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setSelectedTenant('');
    setSelectedUser('');
    setReason('');
    setError(null);
  };

  /**
   * Handle tenant selection change
   */
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedUser(''); // Reset user selection
    setError(null); // Clear any errors
  };

  /**
   * Handle user selection change
   */
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setError(null);
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!selectedTenant) {
      setError('Please select a tenant');
      return false;
    }
    if (!selectedUser) {
      setError('Please select a user to impersonate');
      return false;
    }
    if (!user?.id) {
      setError('Current user information not available');
      return false;
    }
    return true;
  };

  /**
   * Handle impersonation start
   */
  const handleStartImpersonation = async () => {
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get current user's IP and user agent
      const ipAddress = await getClientIpAddress();
      const userAgent = navigator.userAgent;

      // Create impersonation start input
      const impersonationInput: ImpersonationStartInput = {
        impersonatedUserId: selectedUser,
        tenantId: selectedTenant,
        reason: reason || undefined,
        ipAddress,
        userAgent,
      };

      // Validate input using Zod schema
      validateImpersonationStart(impersonationInput);

      // Create mock impersonation log
      const mockSession: ImpersonationLogType = {
        id: `log_${Date.now()}`,
        superUserId: user.id,
        impersonatedUserId: selectedUser,
        tenantId: selectedTenant,
        reason: reason || undefined,
        loginAt: new Date().toISOString(),
        actionsTaken: [],
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Start impersonation session
      await startImpersonation(mockSession);

      // Show success message
      message.success('Impersonation started successfully');

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(mockSession);
      }

      // Reset form
      resetForm();

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to start impersonation. Please try again.';
      
      setError(errorMessage);
      message.error(errorMessage);
      
      console.error('[QuickImpersonationWidget] Error starting impersonation:', {
        error: err,
        input: {
          tenantId: selectedTenant,
          userId: selectedUser,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get client IP address (mock implementation)
   * In production, this would call a backend endpoint
   */
  const getClientIpAddress = async (): Promise<string> => {
    try {
      // Mock implementation - replace with actual API call
      return 'mock-ip-address';
    } catch {
      return 'unknown';
    }
  };

  /**
   * Render the selected tenant details
   */
  const selectedTenantData = MOCK_TENANTS.find(t => t.id === selectedTenant);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Impersonation</CardTitle>
        <CardDescription>
          Quickly select a user to impersonate for troubleshooting and support
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleStartImpersonation();
            }}
            className="space-y-4"
          >
            {/* Tenant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant <span className="text-red-500">*</span>
              </label>
              <Select value={selectedTenant} onValueChange={handleTenantChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TENANTS.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <span className="flex items-center gap-2">
                        {tenant.name}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          tenant.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Info */}
            {selectedTenantData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  Selected: <strong>{selectedTenantData.name}</strong>
                </p>
              </div>
            )}

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User <span className="text-red-500">*</span>
              </label>
              <Select 
                value={selectedUser} 
                onValueChange={handleUserChange}
                disabled={!selectedTenant}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    selectedTenant 
                      ? "Choose a user..." 
                      : "Select a tenant first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        {u.name} ({u.email})
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          u.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u.status}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTenant && availableUsers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No users found for this tenant
                </p>
              )}
            </div>

            {/* Reason Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Impersonation (optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., Customer support, troubleshooting..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !selectedTenant || !selectedUser}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Impersonation'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </Button>
            </div>

            {/* Info Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-900">
                ⓘ Impersonation sessions are logged and audited. All actions taken 
                during impersonation are recorded for security purposes.
              </p>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickImpersonationWidget;