/**
 * Audit Logs Module - Module Container Pattern
 * Handles system audit logs and monitoring with standardized service management
 */
import { FeatureModule } from '@/modules/core/types';
import { auditLogsRoutes } from './routes';
import { getServiceContainer } from '@/modules/core/serviceContainer';
import { auditService } from '@/services/serviceFactory';

export const auditLogsModule: FeatureModule = {
  name: 'audit-logs',
  path: '/audit-logs',
  routes: auditLogsRoutes,
  services: ['auditService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const container = getServiceContainer();
      container.registerService('auditService', auditService);
      console.log('[Audit Logs Module] Initialized with services: auditService');
    } catch (error) {
      console.error('[Audit Logs Module] Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const container = getServiceContainer();
      container.unregisterService('auditService');
      console.log('[Audit Logs Module] Cleanup complete');
    } catch (error) {
      console.error('[Audit Logs Module] Cleanup failed:', error);
    }
  },
};

// Views are lazy-loaded via routes; avoid static re-exports to preserve chunking