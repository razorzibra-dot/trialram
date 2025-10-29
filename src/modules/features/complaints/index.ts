/**
 * Complaints Module - Module Container Pattern
 * Handles customer complaints management with standardized service management
 */
import { FeatureModule } from '@/modules/core/types';
import { complaintsRoutes } from './routes';
import { getServiceContainer } from '@/modules/core/serviceContainer';
import { complaintService } from '@/services/complaintService';

export const complaintsModule: FeatureModule = {
  name: 'complaints',
  path: '/complaints',
  routes: complaintsRoutes,
  services: ['complaintService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const container = getServiceContainer();
      container.registerService('complaintService', complaintService);
      console.log('[Complaints Module] Initialized with services: complaintService');
    } catch (error) {
      console.error('[Complaints Module] Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const container = getServiceContainer();
      container.unregisterService('complaintService');
      console.log('[Complaints Module] Cleanup complete');
    } catch (error) {
      console.error('[Complaints Module] Cleanup failed:', error);
    }
  },
};

// Export views for direct imports if needed
export { default as ComplaintsPage } from './views/ComplaintsPage';