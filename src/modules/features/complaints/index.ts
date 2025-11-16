/**
 * Complaints Module
 * Customer complaint management and tracking
 */

// Type exports
export type { Complaint, ComplaintComment, ComplaintFilters, ComplaintStats, ComplaintFormData, ComplaintUpdateData } from '@/types/complaints';

// Routes
export { complaintsRoutes } from './routes';
import { complaintsRoutes } from './routes';

// Module configuration
export const complaintsModule = {
  name: 'complaints',
  path: '/complaints',
  services: ['complaintService'],
  dependencies: ['core', 'shared'],
  routes: complaintsRoutes as Array<Record<string, unknown>>,
  components: {},

  // Initialize the module
  async initialize() {
    const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
    const { complaintService } = await import('@/services/serviceFactory');

    // Register complaint service from factory
    registerServiceInstance('complaintService', complaintService);

    console.log('Complaints module initialized');
  },

  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');

    // Remove complaint service
    serviceContainer.remove('complaintService');

    console.log('Complaints module cleaned up');
  },
};