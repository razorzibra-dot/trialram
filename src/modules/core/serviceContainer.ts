/**
 * Service Container Bridge
 * Re-exports from the main ServiceContainer for convenience imports
 * 
 * This file provides a stable import path for modules
 * Location: src/modules/core/serviceContainer.ts
 * 
 * Usage:
 * import { getServiceContainer, serviceContainer } from '@/modules/core/serviceContainer';
 */

import { 
  ServiceContainer,
  serviceContainer as serviceContainerInstance,
  registerService,
  registerServiceInstance,
  unregisterService,
  inject,
  Injectable,
  type ServiceConstructor,
  type ServiceFactory,
  type ServiceDefinition
} from './services/ServiceContainer';

// Re-export everything
export {
  ServiceContainer,
  registerService,
  registerServiceInstance,
  unregisterService,
  inject,
  Injectable,
  type ServiceConstructor,
  type ServiceFactory,
  type ServiceDefinition
};

// Export the singleton instance
export const serviceContainer = serviceContainerInstance;

/**
 * Get the service container instance
 * Helper function for modules that prefer functional access
 */
export function getServiceContainer(): ServiceContainer {
  return serviceContainerInstance;
}