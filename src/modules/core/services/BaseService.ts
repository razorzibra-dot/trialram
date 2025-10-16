/**
 * Base Service Class
 * Provides common functionality for all services
 */

import { serviceContainer } from './ServiceContainer';

export abstract class BaseService {
  protected container = serviceContainer;

  /**
   * Get a service dependency
   */
  protected getService<T>(name: string): T {
    return this.container.get<T>(name);
  }

  /**
   * Check if a service is available
   */
  protected hasService(name: string): boolean {
    return this.container.has(name);
  }

  /**
   * Initialize the service
   * Override this method to perform initialization logic
   */
  async initialize(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Cleanup the service
   * Override this method to perform cleanup logic
   */
  async cleanup(): Promise<void> {
    // Default implementation does nothing
  }
}

/**
 * Service Interface
 * All services should implement this interface
 */
export interface IService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Service Manager
 * Manages the lifecycle of services
 */
export class ServiceManager {
  private static instance: ServiceManager;
  private initializedServices = new Set<string>();

  private constructor() {}

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Initialize a service
   */
  async initializeService(name: string): Promise<void> {
    if (this.initializedServices.has(name)) {
      return;
    }

    const service = serviceContainer.get<IService>(name);
    if (service && typeof service.initialize === 'function') {
      await service.initialize();
      this.initializedServices.add(name);
    }
  }

  /**
   * Initialize all services
   */
  async initializeAllServices(): Promise<void> {
    const serviceNames = serviceContainer.getRegisteredServices();
    
    for (const name of serviceNames) {
      try {
        await this.initializeService(name);
      } catch (error) {
        console.error(`Failed to initialize service '${name}':`, error);
      }
    }
  }

  /**
   * Cleanup a service
   */
  async cleanupService(name: string): Promise<void> {
    if (!this.initializedServices.has(name)) {
      return;
    }

    const service = serviceContainer.get<IService>(name);
    if (service && typeof service.cleanup === 'function') {
      await service.cleanup();
      this.initializedServices.delete(name);
    }
  }

  /**
   * Cleanup all services
   */
  async cleanupAllServices(): Promise<void> {
    const serviceNames = Array.from(this.initializedServices);
    
    for (const name of serviceNames) {
      try {
        await this.cleanupService(name);
      } catch (error) {
        console.error(`Failed to cleanup service '${name}':`, error);
      }
    }
  }

  /**
   * Check if a service is initialized
   */
  isInitialized(name: string): boolean {
    return this.initializedServices.has(name);
  }

  /**
   * Get all initialized services
   */
  getInitializedServices(): string[] {
    return Array.from(this.initializedServices);
  }
}

// Export singleton instance
export const serviceManager = ServiceManager.getInstance();
