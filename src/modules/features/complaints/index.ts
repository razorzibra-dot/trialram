/**
 * Complaints Module
 * Customer complaint management and tracking
 */

// Type exports
export type { Complaint, ComplaintComment, ComplaintFilters, ComplaintStats, ComplaintFormData, ComplaintUpdateData } from '@/types/complaints';

// Routes
export { complaintsRoutes } from './routes';
import { complaintsRoutes } from './routes';
import { registerServiceInstance, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { complaintService } from '@/services/serviceFactory';

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
    // Register complaint service from factory
    registerServiceInstance('complaintService', complaintService);
    console.log('Complaints module initialized');
  },

  // Cleanup the module
  async cleanup() {
    // Remove complaint service
    serviceContainer.remove('complaintService');
    console.log('Complaints module cleaned up');
  },
};