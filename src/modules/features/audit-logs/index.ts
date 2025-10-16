/**
 * Audit Logs Module
 * Handles system audit logs and monitoring
 */
import { FeatureModule } from '@/modules/core/types';
import { auditLogsRoutes } from './routes';

export const auditLogsModule: FeatureModule = {
  name: 'audit-logs',
  routes: auditLogsRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Audit Logs module initialized');
  },
  async cleanup() {
    console.log('Audit Logs module cleanup');
  },
};

// Export views for direct imports if needed
export { default as LogsPage } from './views/LogsPage';