/**
 * useService Hook
 * Provides factory-routed service access for any service name
 * Supports multi-backend routing (mock vs Supabase)
 * 
 * @deprecated Use useService from '@/modules/core/hooks/useService' instead
 * This factory-based version will be removed in future versions.
 * The new container-based version provides better dependency injection.
 */

import {
  customerService as factoryCustomerService,
  productService as factoryProductService,
  productSaleService as factoryProductSaleService,
  jobWorkService as factoryJobWorkService,
  companyService as factoryCompanyService,
  notificationService as factoryNotificationService,
  serviceContractService as factoryServiceContractService,
  userService as factoryUserService,
  rbacService as factoryRbacService,
} from '@/services/serviceFactory';

type ServiceName =
  | 'customerService'
  | 'productService'
  | 'productSaleService'
  | 'jobWorkService'
  | 'companyService'
  | 'notificationService'
  | 'serviceContractService'
  | 'userService'
  | 'rbacService';

/**
 * Hook to get factory-routed services
 * Automatically routes to correct implementation based on VITE_API_MODE
 *
 * @param serviceName - Name of the service to retrieve
 * @returns The service instance (mock or Supabase based on environment)
 *
 * @example
 * const customerService = useService('customerService');
 * const customers = await customerService.getCustomers();
 */
export function useService(serviceName: ServiceName) {
  const services: Record<ServiceName, any> = {
    customerService: factoryCustomerService,
    productService: factoryProductService,
    productSaleService: factoryProductSaleService,
    jobWorkService: factoryJobWorkService,
    companyService: factoryCompanyService,
    notificationService: factoryNotificationService,
    serviceContractService: factoryServiceContractService,
    userService: factoryUserService,
    rbacService: factoryRbacService,
  };

  const service = services[serviceName];

  if (!service) {
    console.error(
      `useService: Unknown service "${serviceName}". Available services: ${Object.keys(services).join(', ')}`
    );
    throw new Error(`Unknown service: ${serviceName}`);
  }

  return service;
}

export type { ServiceName };