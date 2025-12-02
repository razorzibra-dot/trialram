/**
 * useService Hook
 * Hook for accessing services from the service container
 */

import { serviceContainer } from '../services/ServiceContainer';

/**
 * Hook to get a service from the service container
 * @param serviceName The name of the service to retrieve
 * @returns The service instance
 */
export function useService<T = unknown>(serviceName: string): T {
  try {
    console.log(`[useService] 🔍 Looking for service '${serviceName}'...`);
    const registeredServices = serviceContainer.getRegisteredServices();
    console.log(`[useService] 📋 Registered services:`, registeredServices);
    
    const service = serviceContainer.get(serviceName);
    
    if (!service) {
      console.error(`[useService] ❌ Service '${serviceName}' not found. Registered services:`, registeredServices);
      throw new Error(`Service '${serviceName}' not found in service container. Make sure it's registered. Available: ${registeredServices.join(', ')}`);
    }
    
    console.log(`[useService] ✅ Retrieved service '${serviceName}':`, {
      type: typeof service,
      isFunction: typeof service === 'function',
      hasGetProducts: 'getProducts' in service,
      constructorName: service?.constructor?.name,
      serviceKeys: service && typeof service === 'object' ? Object.keys(service) : []
    });
    return service as T;
  } catch (error) {
    console.error(`[useService] ❌ Error retrieving service '${serviceName}':`, error);
    throw error;
  }
}

/**
 * Hook to check if a service exists in the container
 * @param serviceName The name of the service to check
 * @returns Whether the service exists
 */
export function useHasService(serviceName: string): boolean {
  return serviceContainer.has(serviceName);
}