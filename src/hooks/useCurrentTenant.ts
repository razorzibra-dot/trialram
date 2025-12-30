/**
 * Hook to get current tenant context
 * Follows strict layer synchronization rules
 */

import { useState, useEffect } from 'react';
import { multiTenantService } from '@/services/serviceFactory';
import { sessionService } from '@/services/session/SessionService';
import { Tenant } from '@/types/rbac';

export const useCurrentTenant = (): Tenant | null => {
  // Seed from SessionService cache to avoid any network or legacy calls
  const initialTenant = sessionService.getTenant();
  const [tenant, setTenant] = useState<Tenant | null>(
    initialTenant
      ? {
          id: initialTenant.id,
          name: initialTenant.name,
          domain: '',
          status: initialTenant.status || 'active',
          plan: 'professional',
          createdAt: new Date().toISOString(),
          settings: {},
          usage: {},
        }
      : null
  );

  useEffect(() => {
    // Align with any in-memory multiTenantService context (already cache-backed)
    const tenantContext = multiTenantService.getCurrentTenant();
    if (tenantContext) {
      setTenant({
        id: tenantContext.tenantId || '',
        name: tenantContext.tenantName || '',
        domain: '',
        status: 'active',
        plan: 'professional',
        createdAt: new Date().toISOString(),
        settings: {},
        usage: {},
      });
    }

    // Subscribe to tenant changes (purely cache/memory, no network)
    const unsubscribe = multiTenantService.subscribe((newContext) => {
      if (newContext) {
        setTenant({
          id: newContext.tenantId || '',
          name: newContext.tenantName || '',
          domain: '',
          status: 'active',
          plan: 'professional',
          createdAt: new Date().toISOString(),
          settings: {},
          usage: {},
        });
      } else {
        setTenant(null);
      }
    });

    return unsubscribe;
  }, []);

  return tenant;
};