/**
 * Hook to get current tenant context
 * Follows strict layer synchronization rules
 */

import { useState, useEffect } from 'react';
import { multiTenantService } from '@/services/serviceFactory';
import { Tenant } from '@/types/rbac';

export const useCurrentTenant = (): Tenant | null => {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    // Get initial tenant context and convert to Tenant interface
    const tenantContext = multiTenantService.getCurrentTenant();

    if (tenantContext) {
      const tenantData: Tenant = {
        id: tenantContext.tenantId || '',
        name: tenantContext.tenantName || '',
        domain: '', // Domain not available in context
        status: 'active', // Default status
        plan: 'professional', // Default plan
        createdAt: new Date().toISOString(),
        settings: {},
        usage: {}
      };
      setTenant(tenantData);
    }

    // Subscribe to tenant changes
    const unsubscribe = multiTenantService.subscribe((newContext) => {
      if (newContext) {
        const tenantData: Tenant = {
          id: newContext.tenantId || '',
          name: newContext.tenantName || '',
          domain: '',
          status: 'active',
          plan: 'professional',
          createdAt: new Date().toISOString(),
          settings: {},
          usage: {}
        };
        setTenant(tenantData);
      } else {
        setTenant(null);
      }
    });

    return unsubscribe;
  }, []);

  return tenant;
};