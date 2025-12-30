/**
 * Hook to check if tenant context is initialized
 * Prevents queries from running before tenant context is ready
 */

import { useEffect, useState } from 'react';
import { multiTenantService as factoryMultiTenantService } from '@/services/serviceFactory';
import { sessionService } from '@/services/session/SessionService';
import type { TenantContext } from '@/types/tenant';

export const useTenantContext = () => {
  // Seed from SessionService cache to avoid any legacy user/tenant queries
  const cachedTenant = sessionService.getTenant();
  const cachedUser = sessionService.getCurrentUser();
  const [tenant, setTenant] = useState<TenantContext | null>(
    cachedUser
      ? {
          tenantId: cachedTenant?.id || null,
          tenantName: cachedTenant?.name,
          userId: cachedUser.id,
          role: cachedUser.role,
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(!cachedUser);

  useEffect(() => {
    // Set initial tenant context
    const currentTenant = factoryMultiTenantService.getCurrentTenant();
    console.log('[useTenantContext] Initialized with tenant:', currentTenant);
    if (currentTenant) {
      setTenant(currentTenant);
    }
    setIsLoading(false);

    // Subscribe to tenant changes
    const unsubscribe = factoryMultiTenantService.subscribe((newTenant) => {
      console.log('[useTenantContext] Tenant changed:', newTenant);
      setTenant(newTenant);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const isInitialized = !!tenant;
  console.log('[useTenantContext] Returning:', { isInitialized, tenantId: tenant?.tenantId, isLoading });

  return {
    tenant,
    isInitialized,
    tenantId: tenant?.tenantId,
    userId: tenant?.userId,
    role: tenant?.role,
    isLoading,
  };
};