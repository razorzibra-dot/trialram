/**
 * Configuration Module
 * Handles tenant configuration and testing
 */
import { FeatureModule } from '@/modules/core/types';
import { configurationRoutes } from './routes';

export const configurationModule: FeatureModule = {
  name: 'configuration',
  routes: configurationRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Configuration module initialized');
  },
  async cleanup() {
    console.log('Configuration module cleanup');
  },
};

// Export views for direct imports if needed
export { default as TenantConfigurationPage } from './views/TenantConfigurationPage';
export { default as ConfigurationTestPage } from './views/ConfigurationTestPage';