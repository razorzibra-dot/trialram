/**
 * Tickets Module
 * Support ticket management and tracking
 */

// Service type exports only
export type { TicketFilters, CreateTicketData, TicketStats } from './services/ticketService';

// Hook exports
export * from './hooks/useTickets';

// Component exports
export { TicketsDetailPanel } from './components/TicketsDetailPanel';
export { TicketsFormPanel } from './components/TicketsFormPanel';

// Routes
export { ticketsRoutes } from './routes';
import { ticketsRoutes } from './routes';

// Module configuration
export const ticketsModule = {
  name: 'tickets',
  path: '/tickets',
  services: ['ticketService'],
  dependencies: ['core', 'shared'],
  routes: ticketsRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
    const { ticketService } = await import('@/services/serviceFactory');
    
    // Register ticket service from factory
    registerServiceInstance('ticketService', ticketService);
    
    console.log('Tickets module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove ticket service
    serviceContainer.remove('ticketService');
    
    console.log('Tickets module cleaned up');
  },
};
