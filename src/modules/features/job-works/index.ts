/**
 * Job Works Module - Enterprise Project Management
 * Complete job work and project management functionality
 */

import { FeatureModule } from '@/modules/core/types';
import { jobWorksRoutes } from './routes';

// Module definition
export const jobWorksModule: FeatureModule = {
  name: 'job-works',
  path: '/job-works',
  routes: jobWorksRoutes,
  services: ['jobWorkService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Initializing Job Works module...');
    // Module initialization logic
    return Promise.resolve();
  }
};

export default jobWorksModule;