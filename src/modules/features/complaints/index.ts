/**
 * Complaints Module
 * Handles customer complaints management
 */
import { FeatureModule } from '@/modules/core/types';
import { complaintsRoutes } from './routes';

export const complaintsModule: FeatureModule = {
  name: 'complaints',
  routes: complaintsRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Complaints module initialized');
  },
  async cleanup() {
    console.log('Complaints module cleanup');
  },
};

// Export views for direct imports if needed
export { default as ComplaintsPage } from './views/ComplaintsPage';