/**
 * Hook to check if tenant context is initialized
 * Prevents queries from running before tenant context is ready
 */

import { useEffect, useState } from 'react';
import { multiTenantService, type TenantContext } from '@/services/supabase/multiTenantService';

export const useTenantContext = () => {
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set initial tenant context
    const currentTenant = multiTenantService.getCurrentTenant();
    setTenant(currentTenant);
    setIsLoading(false);

    // Subscribe to tenant changes
    const unsubscribe = multiTenantService.subscribe((newTenant) => {
      setTenant(newTenant);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    tenant,
    isInitialized: !!tenant,
    tenantId: tenant?.tenantId,
    userId: tenant?.userId,
    role: tenant?.role,
    isLoading,
  };
};