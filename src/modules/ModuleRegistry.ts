/**
 * Module Registry
 * Central registry for managing application modules
 */

import { FeatureModule } from '@/modules/core/types';

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules = new Map<string, FeatureModule>();
  private initializedModules = new Set<string>();

  private constructor() {}

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register a module
   */
  register(module: FeatureModule): void {
    this.modules.set(module.name, module);
    console.log(`Module '${module.name}' registered`);
  }

  /**
   * Get a module by name
   */
  get(name: string): FeatureModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Check if a module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Get all registered modules
   */
  getAll(): FeatureModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get all module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Initialize a module
   */
  async initialize(name: string): Promise<void> {
    if (this.initializedModules.has(name)) {
      return;
    }

    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module '${name}' not found`);
    }

    // Initialize dependencies first
    if (module.dependencies) {
      for (const dependency of module.dependencies) {
        await this.initialize(dependency);
      }
    }

    // Initialize the module
    if (module.initialize) {
      await module.initialize();
    }

    this.initializedModules.add(name);
    console.log(`Module '${name}' initialized`);
  }

  /**
   * Initialize all modules
   */
  async initializeAll(): Promise<void> {
    const moduleNames = this.getModuleNames();
    
    for (const name of moduleNames) {
      try {
        await this.initialize(name);
      } catch (error) {
        console.error(`Failed to initialize module '${name}':`, error);
      }
    }
  }

  /**
   * Cleanup a module
   */
  async cleanup(name: string): Promise<void> {
    if (!this.initializedModules.has(name)) {
      return;
    }

    const module = this.modules.get(name);
    if (!module) {
      return;
    }

    // Cleanup the module
    if (module.cleanup) {
      await module.cleanup();
    }

    this.initializedModules.delete(name);
    console.log(`Module '${name}' cleaned up`);
  }

  /**
   * Cleanup all modules
   */
  async cleanupAll(): Promise<void> {
    const moduleNames = Array.from(this.initializedModules);
    
    for (const name of moduleNames) {
      try {
        await this.cleanup(name);
      } catch (error) {
        console.error(`Failed to cleanup module '${name}':`, error);
      }
    }
  }

  /**
   * Check if a module is initialized
   */
  isInitialized(name: string): boolean {
    return this.initializedModules.has(name);
  }

  /**
   * Get all initialized modules
   */
  getInitializedModules(): string[] {
    return Array.from(this.initializedModules);
  }

  /**
   * Get all routes from modules
   */
  getAllRoutes(): Array<Record<string, unknown>> {
    const routes: Array<Record<string, unknown>> = [];
    
    for (const module of this.modules.values()) {
      if (module.routes) {
        routes.push(...module.routes);
      }
    }
    
    return routes;
  }

  /**
   * Unregister a module
   */
  unregister(name: string): void {
    this.modules.delete(name);
    this.initializedModules.delete(name);
    console.log(`Module '${name}' unregistered`);
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
    this.initializedModules.clear();
  }
}

// Export singleton instance
export const moduleRegistry = ModuleRegistry.getInstance();

// Helper functions
export function registerModule(module: FeatureModule): void {
  moduleRegistry.register(module);
}

export function getModule(name: string): FeatureModule | undefined {
  return moduleRegistry.get(name);
}

export function initializeModules(): Promise<void> {
  return moduleRegistry.initializeAll();
}

export function cleanupModules(): Promise<void> {
  return moduleRegistry.cleanupAll();
}
