/**
 * Application Bootstrap
 * Registers and configures all application modules
 */

import { registerModule } from './ModuleRegistry';
import { FeatureModule } from '@/modules/core/types';

/**
 * Register core modules
 */
export async function registerCoreModules(): Promise<void> {
  // Core module
  const coreModule: FeatureModule = {
    name: 'core',
    routes: [],
    services: ['serviceContainer', 'serviceManager'],
    components: {},
    async initialize() {
      console.log('Core module initialized');
    },
  };

  // Shared module
  const sharedModule: FeatureModule = {
    name: 'shared',
    routes: [],
    services: [],
    components: {},
    dependencies: ['core'],
    async initialize() {
      console.log('Shared module initialized');
    },
  };

  registerModule(coreModule);
  registerModule(sharedModule);

  // Also register feature modules here
  await registerFeatureModules();
}

/**
 * Register feature modules
 */
export async function registerFeatureModules(): Promise<void> {
  try {
    // Customer module
    const { customerModule } = await import('./features/customers');
    registerModule(customerModule);
    console.log('Customer module registered');

    // Deals module
    const { dealsModule } = await import('./features/deals');
    registerModule(dealsModule);
    console.log('Deals module registered');

    // Tickets module
    const { ticketsModule } = await import('./features/tickets');
    registerModule(ticketsModule);
    console.log('Tickets module registered');

    // Job Works module
    const { jobWorksModule } = await import('./features/jobworks');
    registerModule(jobWorksModule);
    console.log('Job Works module registered');

    // Dashboard module
    const { dashboardModule } = await import('./features/dashboard');
    registerModule(dashboardModule);
    console.log('Dashboard module registered');

    // Masters module
    const { mastersModule } = await import('./features/masters');
    registerModule(mastersModule);
    console.log('Masters module registered');

    // Super Admin module
    const { superAdminModule } = await import('./features/super-admin');
    registerModule(superAdminModule);
    console.log('Super Admin module registered');

    // User Management module
    const { userManagementModule } = await import('./features/user-management');
    registerModule(userManagementModule);
    console.log('User Management module registered');

    // Notifications module (already exists, update registration)
    const { notificationsModule } = await import('./features/notifications');
    registerModule(notificationsModule);
    console.log('Notifications module registered');


    // Service Contracts module
    const { serviceContractsModule } = await import('./features/service-contracts');
    registerModule(serviceContractsModule);
    console.log('Service Contracts module registered');

    // Configuration module
    const { configurationModule } = await import('./features/configuration');
    registerModule(configurationModule);
    console.log('Configuration module registered');


    // Audit Logs module
    const { auditLogsModule } = await import('./features/audit-logs');
    registerModule(auditLogsModule);
    console.log('Audit Logs module registered');

    // Product Sales module
    const { productSalesModule } = await import('./features/product-sales');
    registerModule(productSalesModule);
    console.log('Product Sales module registered');

    // Complaints module
    const { complaintsModule } = await import('./features/complaints');
    registerModule(complaintsModule);
    console.log('Complaints module registered');

    // Products module
    const { productModule } = await import('./features/products');
    registerModule(productModule);
    console.log('Products module registered');
  } catch (error) {
    console.error('Error registering feature modules:', error);
  }
}

/**
 * Register layout modules
 */
export async function registerLayoutModules(): Promise<void> {
  // Layout modules will be registered here
  const layoutModule: FeatureModule = {
    name: 'layouts',
    routes: [],
    services: [],
    components: {},
    dependencies: ['core', 'shared'],
    async initialize() {
      console.log('Layout module initialized');
    },
  };

  registerModule(layoutModule);
}

/**
 * Bootstrap the entire application
 */
export async function bootstrapApplication(): Promise<void> {
  console.log('Bootstrapping application...');
  
  // Register modules in order
  await registerCoreModules();
  await registerLayoutModules();
  // Note: registerFeatureModules() is already called inside registerCoreModules()
  
  console.log('Application bootstrap completed');
}
