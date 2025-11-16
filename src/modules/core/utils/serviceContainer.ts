/**
 * Service Container Utilities
 * Helper functions for type-safe service access
 */

import { serviceContainer } from '../serviceContainer';
import type { ServiceContainer } from '../services/ServiceContainer';

/**
 * Get a service instance with type safety
 * @param serviceName - The name of the service to retrieve
 * @returns The service instance
 * @throws Error if service is not registered
 *
 * @example
 * const customerService = getService<ICustomerService>('customerService');
 */
export function getService<T>(serviceName: string): T {
  const service = serviceContainer.getService(serviceName);
  if (!service) {
    throw new Error(`Service '${serviceName}' is not registered`);
  }
  return service as T;
}

/**
 * Register a service instance
 * @param serviceName - The name to register the service under
 * @param serviceInstance - The service instance to register
 *
 * @example
 * registerService('customerService', new CustomerService());
 */
export function registerService(serviceName: string, serviceInstance: unknown): void {
  serviceContainer.registerService(serviceName, serviceInstance);
}

/**
 * Check if a service is registered
 * @param serviceName - The name of the service to check
 * @returns true if the service is registered
 *
 * @example
 * if (hasService('customerService')) {
 *   // Service is available
 * }
 */
export function hasService(serviceName: string): boolean {
  return serviceContainer.hasService(serviceName);
}

/**
 * Get the service container instance
 * @returns The service container instance
 */
export function getServiceContainer(): ServiceContainer {
  return serviceContainer;
}