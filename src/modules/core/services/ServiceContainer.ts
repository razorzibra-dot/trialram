/**
 * Service Container - Dependency Injection Container
 * Manages service instances and their dependencies
 */

export interface ServiceConstructor<T = any> {
  new (...args: any[]): T;
}

export interface ServiceFactory<T = any> {
  (): T;
}

export type ServiceDefinition<T = any> = ServiceConstructor<T> | ServiceFactory<T>;

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();
  private factories = new Map<string, ServiceDefinition>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service with the container
   */
  register<T>(name: string, definition: ServiceDefinition<T>, singleton = true): void {
    this.factories.set(name, definition);
    if (singleton) {
      this.singletons.set(name, null);
    }
  }

  /**
   * Register a service instance
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    // Check if we have a direct instance
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check if it's a singleton and already created
    if (this.singletons.has(name)) {
      const existing = this.singletons.get(name);
      if (existing) {
        return existing;
      }
    }

    // Create new instance
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found`);
    }

    let instance: T;
    if (typeof factory === 'function' && factory.prototype) {
      // Constructor function
      instance = new (factory as ServiceConstructor<T>)();
    } else {
      // Factory function
      instance = (factory as ServiceFactory<T>)();
    }

    // Store singleton
    if (this.singletons.has(name)) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Remove a service
   */
  remove(name: string): void {
    this.services.delete(name);
    this.singletons.delete(name);
    this.factories.delete(name);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    const names = new Set<string>();
    this.services.forEach((_, name) => names.add(name));
    this.factories.forEach((_, name) => names.add(name));
    return Array.from(names);
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();

// Decorator for service injection
export function Injectable(name: string) {
  return function <T extends ServiceConstructor>(constructor: T) {
    serviceContainer.register(name, constructor);
    return constructor;
  };
}

// Helper function for service injection
export function inject<T>(name: string): T {
  return serviceContainer.get<T>(name);
}

// Service registration helper
export function registerService<T>(
  name: string,
  definition: ServiceDefinition<T>,
  singleton = true
): void {
  serviceContainer.register(name, definition, singleton);
}

// Service instance registration helper
export function registerServiceInstance<T>(name: string, instance: T): void {
  serviceContainer.registerInstance(name, instance);
}
