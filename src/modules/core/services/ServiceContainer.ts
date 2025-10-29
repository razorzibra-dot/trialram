/**
 * Service Container - Dependency Injection Container
 * Manages service instances and their dependencies
 */

export interface ServiceConstructor<T = unknown> {
  new (...args: unknown[]): T;
}

export interface ServiceFactory<T = unknown> {
  (): T;
}

export type ServiceDefinition<T = unknown> = ServiceConstructor<T> | ServiceFactory<T>;

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, unknown>();
  private singletons = new Map<string, unknown>();
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
    // Add validation and debugging
    if (!definition) {
      const error = `Cannot register service '${name}': definition is ${definition}`;
      console.error(`[ServiceContainer] ${error}`);
      throw new Error(error);
    }
    
    const defType = typeof definition;
    const hasProto = definition && typeof definition === 'function' ? definition.prototype : null;
    const isConstructor = defType === 'function' && hasProto;
    const isFactory = defType === 'function' && !hasProto;
    
    console.log(`[ServiceContainer.register] Registering '${name}'`, {
      type: defType,
      hasPrototype: !!hasProto,
      protoType: hasProto ? hasProto.constructor?.name : 'N/A',
      isConstructor,
      isFactory,
      isSingleton: singleton,
      defName: (definition as any)?.name || (definition as any)?.constructor?.name || 'unknown',
      toString: String(definition).substring(0, 150)
    });
    
    if (!isConstructor && !isFactory) {
      const error = `Cannot register service '${name}': definition must be a constructor or factory function. ` +
        `Got type: ${defType}, constructor name: ${(definition as any)?.constructor?.name || 'unknown'}, ` +
        `definition: ${String(definition).substring(0, 100)}`;
      console.error(`[ServiceContainer] ${error}`);
      throw new Error(error);
    }
    
    this.factories.set(name, definition);
    
    // Verify what was actually stored
    const stored = this.factories.get(name);
    console.log(`[ServiceContainer.register] Verification - stored definition:`, {
      isPresent: stored !== undefined,
      type: typeof stored,
      name: (stored as any)?.name || 'N/A',
      sameAsInput: stored === definition,
      storedProto: typeof stored === 'function' ? !!stored.prototype : 'N/A'
    });
    
    if (singleton) {
      this.singletons.set(name, null);
    }
    
    console.log(`[ServiceContainer] ✓ Registered service '${name}' as ${isConstructor ? 'constructor' : 'factory'}`);
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
    console.log(`[ServiceContainer.get] ▶ Retrieving service '${name}'`, {
      timestamp: new Date().toISOString(),
      directInstanceExists: this.services.has(name),
      singletonExists: this.singletons.has(name),
      factoryExists: this.factories.has(name),
      allRegisteredServices: Array.from(this.factories.keys())
    });
    
    // Check if we have a direct instance
    if (this.services.has(name)) {
      const instance = this.services.get(name);
      console.log(`[ServiceContainer.get] ✓ Found direct instance for '${name}'`, {
        type: typeof instance,
        constructor: (instance as any)?.constructor?.name || 'unknown'
      });
      return instance as T;
    }

    // Check if it's a singleton and already created
    if (this.singletons.has(name)) {
      const existing = this.singletons.get(name);
      if (existing) {
        console.log(`[ServiceContainer.get] ✓ Found existing singleton for '${name}'`, {
          type: typeof existing,
          constructor: (existing as any)?.constructor?.name || 'unknown'
        });
        return existing as T;
      } else {
        console.log(`[ServiceContainer.get] Singleton slot exists but is empty, will create new instance`);
      }
    }

    // Create new instance
    const factory = this.factories.get(name);
    if (!factory) {
      const error = `Service '${name}' not found in factories. Registered services: ${Array.from(this.factories.keys()).join(', ')}`;
      console.error(`[ServiceContainer.get] ✗ ${error}`);
      throw new Error(error);
    }

    console.log(`[ServiceContainer.get] Factory retrieved for '${name}'`, {
      type: typeof factory,
      hasPrototype: !!(factory as any)?.prototype,
      factoryName: (factory as any)?.name || (factory as any)?.constructor?.name || 'unknown',
      toString: String(factory).substring(0, 150),
      isFunction: typeof factory === 'function',
      isCallable: typeof factory === 'function'
    });

    // Safety check: ensure factory is actually a function
    if (typeof factory !== 'function') {
      const msg = `CRITICAL: Service '${name}' has invalid definition in factories map! ` +
        `Expected function but got ${typeof factory}. ` +
        `Factory value: ${String(factory).substring(0, 150)}. ` +
        `This indicates the service was registered with an incorrect definition.`;
      console.error(`[ServiceContainer.get] ✗ ${msg}`);
      console.error(`[ServiceContainer.get] Factory map at retrieval time:`, {
        name,
        factories: Array.from(this.factories.entries()).map(([k, v]) => ({
          key: k,
          type: typeof v,
          hasProto: typeof v === 'function' ? !!v.prototype : 'N/A',
          name: (v as any)?.name || 'unknown'
        }))
      });
      throw new Error(msg);
    }

    let instance: T;
    if (typeof factory === 'function' && factory.prototype) {
      // Constructor function
      console.log(`[ServiceContainer.get] Instantiating '${name}' as constructor`);
      try {
        instance = new (factory as ServiceConstructor<T>)();
        console.log(`[ServiceContainer.get] ✓ Successfully instantiated '${name}' as constructor`, {
          instanceType: typeof instance,
          constructor: (instance as any)?.constructor?.name || 'unknown',
          protoMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(instance) || {})
        });
      } catch (error) {
        const msg = `Failed to instantiate service '${name}' (constructor): ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ServiceContainer.get] ✗ ${msg}`);
        throw new Error(msg);
      }
    } else if (typeof factory === 'function') {
      // Factory function
      console.log(`[ServiceContainer.get] Calling '${name}' as factory function`);
      try {
        instance = (factory as ServiceFactory<T>)();
        console.log(`[ServiceContainer.get] ✓ Successfully called '${name}' as factory function`);
      } catch (error) {
        const msg = `Failed to call factory for service '${name}': ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ServiceContainer.get] ✗ ${msg}`);
        throw new Error(msg);
      }
    } else {
      // This shouldn't happen given the safety check above, but just in case
      const msg = `Service '${name}' has invalid definition: expected function but got ${typeof factory}. ` +
        `Factory value: ${String(factory).substring(0, 100)}. ` +
        `This suggests the service was registered incorrectly.`;
      console.error(`[ServiceContainer.get] ✗ ${msg}`);
      throw new Error(msg);
    }

    // Store singleton
    if (this.singletons.has(name)) {
      this.singletons.set(name, instance);
      console.log(`[ServiceContainer.get] Stored singleton instance for '${name}'`);
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

  /**
   * Register a service (compatibility method)
   * Intelligently routes based on whether it's a constructor or instance
   * - Constructor/function → register() for on-demand instantiation
   * - Object/instance → registerInstance() for direct storage
   */
  registerService<T>(name: string, definition: T): void {
    // Smart detection: Check if it's a constructor function
    if (typeof definition === 'function' && definition.prototype) {
      // It's a constructor - route to register for on-demand instantiation
      this.register(name, definition as any);
    } else if (typeof definition === 'object' && definition !== null) {
      // It's an object/instance - route to registerInstance to store directly
      this.registerInstance(name, definition);
    } else {
      // Unsupported type
      throw new Error(
        `Cannot register service '${name}': must be a constructor function or object instance. Got type: ${typeof definition}`
      );
    }
  }

  /**
   * Unregister a service (compatibility method)
   * Alias for remove for modules using unregisterService pattern
   */
  unregisterService(name: string): void {
    this.remove(name);
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
  console.log(`[inject] Called for '${name}'`);
  try {
    const result = serviceContainer.get<T>(name);
    console.log(`[inject] ✓ Successfully retrieved '${name}'`);
    return result;
  } catch (error) {
    console.error(`[inject] ✗ Failed to retrieve '${name}':`, error);
    throw error;
  }
}

// Service registration helper
export function registerService<T>(
  name: string,
  definition: ServiceDefinition<T>,
  singleton = true
): void {
  console.log(`[registerService] Called for '${name}' (singleton: ${singleton})`);
  serviceContainer.register(name, definition, singleton);
}

// Service instance registration helper
export function registerServiceInstance<T>(name: string, instance: T): void {
  serviceContainer.registerInstance(name, instance);
}

// Service unregistration helper
export function unregisterService(name: string): void {
  serviceContainer.remove(name);
}
