/**
 * Configuration Module - Module Container Pattern
 * Handles tenant configuration and testing with standardized service management
 */
import { FeatureModule } from '@/modules/core/types';
import { configurationRoutes } from './routes';
import { getServiceContainer } from '@/modules/core/serviceContainer';
import { tenantService } from '@/services/serviceFactory';
import { configTestService } from './services/configTestService';

export const configurationModule: FeatureModule = {
  name: 'configuration',
  path: '/configuration',
  routes: configurationRoutes,
  services: ['tenantService', 'configTestService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const container = getServiceContainer();
      container.registerService('tenantService', tenantService);
      container.registerService('configTestService', configTestService);
      console.log('[Configuration Module] Initialized with services: tenantService, configTestService');
    } catch (error) {
      console.error('[Configuration Module] Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const container = getServiceContainer();
      container.unregisterService('tenantService');
      container.unregisterService('configTestService');
      console.log('[Configuration Module] Cleanup complete');
    } catch (error) {
      console.error('[Configuration Module] Cleanup failed:', error);
    }
  },
};

// Export views for direct imports if needed
export { default as TenantConfigurationPage } from './views/TenantConfigurationPage';
export { default as ConfigurationTestPage } from './views/ConfigurationTestPage';