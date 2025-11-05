/**
 * Module Registry
 * Central registry for managing application modules with access control support
 * 
 * **Module Access Control**:
 * - Super-admin modules: Only accessible to super admins (isSuperAdmin=true, tenantId=null)
 * - Tenant modules: Accessible to regular users based on RBAC permissions
 * - Module access is checked at runtime based on user role and permissions
 */

import { FeatureModule, User } from '@/modules/core/types';
import { authService } from '@/services';

/**
 * Super-admin only modules
 * These modules are ONLY accessible to platform-level super admins
 */
const SUPER_ADMIN_ONLY_MODULES = ['super-admin', 'system-admin', 'admin-panel'];

/**
 * Tenant modules
 * These modules are accessible to regular tenant users based on RBAC
 */
const TENANT_MODULES = [
  'customers',
  'sales',
  'contracts',
  'service-contracts',
  'products',
  'product-sales',
  'tickets',
  'complaints',
  'job-works',
  'notifications',
  'reports',
  'settings',
];

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
      console.log(`[ModuleRegistry.initialize] Module '${name}' already initialized, skipping`);
      return;
    }

    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module '${name}' not found`);
    }

    console.log(`[ModuleRegistry.initialize] ▶ Initializing module '${name}'`, {
      hasDependencies: !!module.dependencies && module.dependencies.length > 0,
      dependencies: module.dependencies || [],
      timestamp: new Date().toISOString()
    });

    // Initialize dependencies first
    if (module.dependencies) {
      for (const dependency of module.dependencies) {
        console.log(`[ModuleRegistry.initialize] Initializing dependency '${dependency}' of '${name}'`);
        await this.initialize(dependency);
      }
    }

    // Initialize the module
    if (module.initialize) {
      console.log(`[ModuleRegistry.initialize] Calling initialize() for '${name}'`);
      const startTime = performance.now();
      try {
        await module.initialize();
        const duration = performance.now() - startTime;
        console.log(`[ModuleRegistry.initialize] ✓ Module '${name}' initialize() completed (${duration.toFixed(2)}ms)`);
      } catch (error) {
        console.error(`[ModuleRegistry.initialize] ✗ Module '${name}' initialize() failed:`, error);
        throw error;
      }
    } else {
      console.log(`[ModuleRegistry.initialize] Module '${name}' has no initialize() method`);
    }

    this.initializedModules.add(name);
    console.log(`[ModuleRegistry.initialize] ✓ Module '${name}' marked as initialized`);
  }

  /**
   * Initialize all modules
   */
  async initializeAll(): Promise<void> {
    const moduleNames = this.getModuleNames();
    console.log(`[ModuleRegistry.initializeAll] ▶ Starting initialization of ${moduleNames.length} modules`, {
      modules: moduleNames,
      timestamp: new Date().toISOString()
    });
    
    const startTime = performance.now();
    let successCount = 0;
    let failureCount = 0;
    const failedModules: Array<{ name: string; error: string }> = [];
    
    for (const name of moduleNames) {
      try {
        await this.initialize(name);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to initialize module '${name}':`, error);
        failureCount++;
        failedModules.push({ name, error: errorMsg });
      }
    }
    
    const duration = performance.now() - startTime;
    console.log(`[ModuleRegistry.initializeAll] ✓ Module initialization completed`, {
      totalModules: moduleNames.length,
      successCount,
      failureCount,
      failedModules: failedModules.length > 0 ? failedModules : undefined,
      duration: duration.toFixed(2) + 'ms',
      timestamp: new Date().toISOString()
    });
    
    if (failureCount > 0) {
      console.warn(`[ModuleRegistry.initializeAll] ⚠️ ${failureCount} module(s) failed to initialize`, failedModules);
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

  /**
   * Check if a module is a super-admin only module
   * 
   * @param moduleName - Name of module to check
   * @returns true if module is super-admin only
   */
  private isSuperAdminModule(moduleName: string): boolean {
    return SUPER_ADMIN_ONLY_MODULES.includes(moduleName.toLowerCase());
  }

  /**
   * Check if a module is a tenant module
   * 
   * @param moduleName - Name of module to check
   * @returns true if module is a tenant module
   */
  private isTenantModule(moduleName: string): boolean {
    return TENANT_MODULES.includes(moduleName.toLowerCase());
  }

  /**
   * Check if user can access a specific module
   * 
   * **Super Admin Access**:
   * - Super admins can ONLY access super-admin modules
   * - Super admins CANNOT access tenant modules
   * 
   * **Regular User Access**:
   * - Regular users CANNOT access super-admin modules
   * - Regular users can access tenant modules based on RBAC permissions
   * 
   * @param user - User object to check access for
   * @param moduleName - Name of module to check access for
   * @returns true if user can access module, false otherwise
   * @throws Error if module is not registered or user object is invalid
   * 
   * @example
   * ```typescript
   * // Super admin accessing super-admin module
   * const superAdmin = { isSuperAdmin: true, tenantId: null, ... };
   * registry.canUserAccessModule(superAdmin, 'super-admin'); // true
   * 
   * // Super admin trying to access tenant module (blocked)
   * registry.canUserAccessModule(superAdmin, 'customers'); // false
   * 
   * // Regular user with permission
   * const regularUser = { isSuperAdmin: false, tenantId: 'tenant-1', ... };
   * registry.canUserAccessModule(regularUser, 'customers'); // true (if has permission)
   * registry.canUserAccessModule(regularUser, 'super-admin'); // false (always blocked)
   * ```
   */
  canUserAccessModule(user: User, moduleName: string): boolean {
    try {
      // Validate inputs
      if (!user || !user.id) {
        console.warn('[ModuleRegistry.canUserAccessModule] Invalid user object');
        return false;
      }

      if (!moduleName || typeof moduleName !== 'string') {
        console.warn('[ModuleRegistry.canUserAccessModule] Invalid module name');
        return false;
      }

      const normalizedModuleName = moduleName.toLowerCase();
      const isSuperAdmin = user.isSuperAdmin === true;

      console.log(`[ModuleRegistry.canUserAccessModule] Checking access for user ${user.id} to module '${normalizedModuleName}'`, {
        isSuperAdmin,
        tenantId: user.tenantId,
      });

      // Check if module is registered
      if (!this.modules.has(normalizedModuleName)) {
        console.warn(`[ModuleRegistry.canUserAccessModule] Module '${normalizedModuleName}' not registered`);
        return false;
      }

      // Super admin access control
      if (isSuperAdmin) {
        // Super admins can ONLY access super-admin modules
        const canAccess = this.isSuperAdminModule(normalizedModuleName);
        console.log(`[ModuleRegistry.canUserAccessModule] Super admin access to '${normalizedModuleName}': ${canAccess}`);
        return canAccess;
      }

      // Regular user access control

      // Cannot access super-admin modules
      if (this.isSuperAdminModule(normalizedModuleName)) {
        console.log(`[ModuleRegistry.canUserAccessModule] Regular user blocked from super-admin module '${normalizedModuleName}'`);
        return false;
      }

      // Check RBAC for tenant modules
      if (this.isTenantModule(normalizedModuleName)) {
        // Check if user has permission for this module
        const hasPermission = authService.hasPermission(`manage_${normalizedModuleName}`)
          || authService.hasPermission(`${normalizedModuleName}:read`)
          || authService.hasPermission('read');

        console.log(`[ModuleRegistry.canUserAccessModule] Regular user RBAC check for '${normalizedModuleName}': ${hasPermission}`);
        return hasPermission;
      }

      // Unknown module type, deny by default
      console.log(`[ModuleRegistry.canUserAccessModule] Unknown module type '${normalizedModuleName}', denying access`);
      return false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[ModuleRegistry.canUserAccessModule] Error checking module access:`, error);
      // Fail securely - deny access on error
      return false;
    }
  }

  /**
   * Get all modules accessible to a user
   * 
   * **Returns**:
   * - For super admins: Only super-admin modules (super-admin, system-admin, admin-panel)
   * - For regular users: Only tenant modules they have RBAC permission to access
   * 
   * @param user - User object to get accessible modules for
   * @returns Array of FeatureModule objects user can access
   * @throws Error if user object is invalid
   * 
   * @example
   * ```typescript
   * // Super admin gets super-admin modules
   * const superAdmin = { isSuperAdmin: true, tenantId: null, ... };
   * const modules = registry.getAccessibleModules(superAdmin);
   * // returns: [{ name: 'super-admin', ... }, { name: 'system-admin', ... }, ...]
   * 
   * // Regular user gets accessible tenant modules
   * const regularUser = { isSuperAdmin: false, tenantId: 'tenant-1', ... };
   * const modules = registry.getAccessibleModules(regularUser);
   * // returns: modules where user has RBAC permissions
   * ```
   */
  getAccessibleModules(user: User): FeatureModule[] {
    try {
      // Validate user
      if (!user || !user.id) {
        console.warn('[ModuleRegistry.getAccessibleModules] Invalid user object');
        return [];
      }

      console.log(`[ModuleRegistry.getAccessibleModules] Getting accessible modules for user ${user.id}`, {
        isSuperAdmin: user.isSuperAdmin,
        tenantId: user.tenantId,
      });

      const isSuperAdmin = user.isSuperAdmin === true;
      const accessibleModules: FeatureModule[] = [];

      // For each registered module, check if user has access
      for (const [moduleName, moduleObj] of this.modules.entries()) {
        if (this.canUserAccessModule(user, moduleName)) {
          accessibleModules.push(moduleObj);
        }
      }

      console.log(`[ModuleRegistry.getAccessibleModules] User ${user.id} has access to ${accessibleModules.length} module(s)`, {
        moduleNames: accessibleModules.map(m => m.name),
      });

      return accessibleModules;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[ModuleRegistry.getAccessibleModules] Error getting accessible modules:`, error);
      // Return empty array on error (fail securely)
      return [];
    }
  }

  /**
   * Get all accessible module names for a user
   * 
   * Convenience method that returns only module names instead of full objects
   * 
   * @param user - User object to get accessible module names for
   * @returns Array of module names user can access
   * 
   * @example
   * ```typescript
   * const modules = registry.getAccessibleModuleNames(user);
   * // returns: ['customers', 'sales', 'products', ...]
   * ```
   */
  getAccessibleModuleNames(user: User): string[] {
    return this.getAccessibleModules(user).map(m => m.name);
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

/**
 * Check if a user can access a specific module
 * @param user - User object to check access for
 * @param moduleName - Name of module to check access for
 * @returns true if user can access module
 */
export function canUserAccessModule(user: User, moduleName: string): boolean {
  return moduleRegistry.canUserAccessModule(user, moduleName);
}

/**
 * Get all modules accessible to a user
 * @param user - User object to get accessible modules for
 * @returns Array of accessible modules
 */
export function getAccessibleModules(user: User): FeatureModule[] {
  return moduleRegistry.getAccessibleModules(user);
}

/**
 * Get all accessible module names for a user
 * @param user - User object to get accessible module names for
 * @returns Array of accessible module names
 */
export function getAccessibleModuleNames(user: User): string[] {
  return moduleRegistry.getAccessibleModuleNames(user);
}
