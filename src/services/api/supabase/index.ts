/**
 * Supabase Services Index
 * Centralized export for all Supabase backend implementations
 * 
 * NOTE: Only implemented services are exported. Other services fall back to mock implementations.
 */

export { supabaseSalesService } from './salesService';
export { supabaseUserService } from './userService';
export { supabaseRbacService } from './rbacService';

// Export mock services for non-implemented Supabase services
// These will be used as fallback until Supabase implementations are created
import { customerService as supabaseCustomerService } from '../customerService';
import { ticketService as supabaseTicketService } from '../ticketService';
import { contractService as supabaseContractService } from '../contractService';
import { notificationService as supabaseNotificationService } from '../notificationService';

export { supabaseCustomerService, supabaseTicketService, supabaseContractService, supabaseNotificationService };