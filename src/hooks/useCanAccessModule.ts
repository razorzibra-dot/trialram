/**
 * useCanAccessModule Hook
 * 
 * Convenience hook for checking if the current user can access a specific module.
 * Returns a simple boolean instead of the full object from useModuleAccess.
 * 
 * **Usage**:
 * ```typescript
 * const canAccessCustomers = useCanAccessModule('customers');
 * 
 * return (
 *   <>
 *     {canAccessCustomers && <CustomersLink href="/customers" />}
 *   </>
 * );
 * ```
 * 
 * **Behavior**:
 * - Super admins: Returns false for all modules (super admins are isolated)
 * - Regular users: Returns true if they have RBAC permissions for the module
 * - Unauthenticated: Returns false
 * 
 * **Performance**:
 * - Uses React Query caching (5min stale, 10min cache)
 * - Minimal re-renders due to boolean result
 * - Ideal for conditional UI rendering
 * 
 * @param moduleName - Name of the module to check access for
 * @returns true if user can access the module, false otherwise
 * 
 * @see useModuleAccess - Full access checking hook with loading/error states
 * 
 * @example
 * // Show menu item only if user has access
 * function Navigation() {
 *   const canAccessSales = useCanAccessModule('sales');
 *   const canAccessCustomers = useCanAccessModule('customers');
 *   
 *   return (
 *     <nav>
 *       {canAccessCustomers && <a href="/customers">Customers</a>}
 *       {canAccessSales && <a href="/sales">Sales</a>}
 *     </nav>
 *   );
 * }
 * 
 * @example
 * // Conditional rendering of entire section
 * function Dashboard() {
 *   const canAccessAnalytics = useCanAccessModule('analytics');
 *   
 *   if (canAccessAnalytics) {
 *     return <AnalyticsDashboard />;
 *   }
 *   
 *   return <BasicDashboard />;
 * }
 */

import { useModuleAccess } from './useModuleAccess';

/**
 * Convenience hook to check if user can access a module
 * Returns only the boolean result, not the full access state
 * 
 * @param moduleName - Name of the module to check access for
 * @returns boolean - true if user has access, false otherwise
 */
export function useCanAccessModule(moduleName: string): boolean {
  const { canAccess } = useModuleAccess(moduleName);
  return canAccess;
}

export default useCanAccessModule;