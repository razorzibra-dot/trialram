/**
 * Hooks Index
 * Central export point for all custom React hooks
 * 
 * UTILITY HOOKS:
 * ==============
 * - useAuth           - Authentication and authorization
 * - useNotification   - Ant Design notifications (replaces deprecated useToast)
 * - useMobile         - Mobile responsiveness
 * - useLocalStorage   - Local storage persistence
 * - useScrollRestoration - Scroll position restoration
 * - useEnhancedTableScroll - Enhanced table scrolling
 * - useTenantContext  - Multi-tenancy context
 * - useSessionManager - Session management
 * - usePermissionBasedNavigation - RBAC navigation
 * - useModuleAccess   - Super-admin module access control
 * 
 * FEATURE HOOKS:
 * ==============
 * Feature-specific hooks are now located in their respective modules:
 * - Customers: @/modules/features/customers/hooks
 * - Sales: @/modules/features/sales/hooks
 * - Tickets: @/modules/features/tickets/hooks
 * - Contracts: @/modules/features/contracts/hooks
 */

// Service Factory Hooks
// useService moved to @/modules/core/hooks/useService (factory pattern replaced with container-based DI)

// Existing utility hooks
export { useAuth } from '@/contexts/AuthContext';
export { useNotification } from './useNotification';
export { useIsMobile, useBreakpoint, useResponsive } from './use-mobile';
export { useLocalStorage } from './useLocalStorage';
export { useScrollRestoration } from './useScrollRestoration';
export { useEnhancedTableScroll } from './useEnhancedTableScroll';
export { useTenantContext } from './useTenantContext';
export { useSessionManager } from './useSessionManager';
export { usePermissionBasedNavigation } from './usePermissionBasedNavigation';
export { useActiveUsers } from './useActiveUsers'; // Shared hook for "Assigned To" dropdowns

// Phase 6: Permission & Access Control Hooks
export {
  usePermission,
  useRole,
  useIsSuperAdmin,
  useIsImpersonating,
  useCurrentImpersonationSession,
  useIsAuthenticated,
  useCurrentUser,
  useCurrentTenantId,
  usePermissionGate,
  usePermissions,
  useFeatureAccess,
} from './usePermission';

// Additional tenant hooks
export { useCurrentTenant } from './useCurrentTenant';

// Phase 5: Super Admin Isolation Hooks
export { useModuleAccess, useAccessibleModules, type ModuleAccessResult } from './useModuleAccess';
export { useCanAccessModule } from './useCanAccessModule';
export { useImpersonationActionTracker, type ImpersonationActionTrackerHook } from './useImpersonationActionTracker';

// PHASE 1.5: Dynamic Data Loading Hooks (Layer 7)
export {
  useCategories,
  useSuppliers,
  useStatusOptions,
  useReferenceDataOptions,
  useReferenceDataByCategory,
  useAllReferenceData,
} from './useReferenceDataOptions';