/**
 * Impersonation Banner Component
 * 
 * Visual indicator displayed at the top of the application when a super admin
 * is impersonating another user. This banner provides clear visibility into
 * the current impersonation session and allows the user to exit impersonation mode.
 * 
 * **Features**:
 * - Shows impersonated user information
 * - Displays super admin information
 * - "Exit Impersonation" button for quick session termination
 * - Warning color scheme to distinguish impersonation mode
 * - Auto-hide when not impersonating
 * - Responsive design
 * 
 * **Usage**:
 * ```typescript
 * <ImpersonationBanner />
 * // Component automatically shows/hides based on impersonation status
 * ```
 * 
 * **Integration**:
 * - Requires ImpersonationProvider in component tree
 * - Should be placed in main layout/app component
 * - Recommended position: top of page, above main content
 * 
 * @component
 * @see ImpersonationContext - Session management
 * @see useAuth - Authentication and impersonation status
 */

import React, { useCallback } from 'react';
import { Alert, Button, Space, Spin } from 'antd';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/**
 * Impersonation Banner Component Props
 */
interface ImpersonationBannerProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Optional callback when exit button is clicked */
  onExit?: () => void;
}

/**
 * Impersonation Banner Component
 * 
 * Displays a prominent warning banner when super admin is impersonating
 * another user. The banner shows:
 * - Super admin who initiated impersonation
 * - User being impersonated
 * - Tenant/company context
 * - Exit button to end impersonation
 * 
 * @component
 * @param props - Component props
 * @returns React component or null if not impersonating
 */
const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  className,
  onExit,
}) => {
  const { activeSession, isImpersonating, endImpersonation } = useImpersonationMode();
  const { user, logout } = useAuth();
  const [isExiting, setIsExiting] = React.useState(false);

  // Handle exit impersonation
  const handleExit = useCallback(async () => {
    try {
      setIsExiting(true);
      
      // End impersonation session
      await endImpersonation();
      
      // Call optional callback
      if (onExit) {
        onExit();
      }
      
      // Log out the impersonated session
      await logout();
      
      console.log('[ImpersonationBanner] Exited impersonation mode');
    } catch (error) {
      console.error('[ImpersonationBanner] Error exiting impersonation:', error);
      setIsExiting(false);
    }
  }, [endImpersonation, logout, onExit]);

  // Don't render if not impersonating
  if (!isImpersonating || !activeSession) {
    return null;
  }

  // Build impersonation info
  const info = {
    superAdmin: activeSession.superUserId,
    impersonatedUser: activeSession.impersonatedUserId,
    tenant: activeSession.tenantId,
    sessionId: activeSession.id,
  };

  return (
    <div
      className={cn(
        'w-full bg-yellow-50 border-b-2 border-yellow-400 shadow-sm',
        className
      )}
      role="alert"
      aria-label="Impersonation mode active"
      data-testid="impersonation-banner"
    >
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  Impersonation Mode Active
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You are currently impersonating{' '}
                  <span className="font-medium">{info.impersonatedUser}</span>
                  {' '}in{' '}
                  <span className="font-medium">{info.tenant}</span>
                </p>
              </div>
            </div>
          </Space>
        }
        type="warning"
        showIcon={false}
        className="mb-0 bg-yellow-50 border-0"
        style={{
          padding: '16px',
        }}
        action={
          <Button
            danger
            type="primary"
            size="small"
            onClick={handleExit}
            loading={isExiting}
            disabled={isExiting}
            icon={!isExiting && <LogOut className="w-4 h-4" />}
            className="ml-2"
          >
            {isExiting ? 'Exiting...' : 'Exit Impersonation'}
          </Button>
        }
      />

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="px-4 py-2 bg-yellow-100 text-xs text-yellow-700 border-t border-yellow-200"
          data-testid="impersonation-banner-debug"
        >
          <details>
            <summary className="cursor-pointer font-semibold">
              Session Details
            </summary>
            <div className="mt-2 font-mono space-y-1">
              <div>
                <strong>Session ID:</strong> {info.sessionId}
              </div>
              <div>
                <strong>Super Admin:</strong> {info.superAdmin}
              </div>
              <div>
                <strong>Impersonated User:</strong> {info.impersonatedUser}
              </div>
              <div>
                <strong>Tenant:</strong> {info.tenant}
              </div>
              <div>
                <strong>Started:</strong> {activeSession.loginAt}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

ImpersonationBanner.displayName = 'ImpersonationBanner';

export default ImpersonationBanner;

/**
 * Export helper for easy import
 */
export { ImpersonationBanner };