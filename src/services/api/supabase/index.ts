/**
 * Supabase Services Index
 * Centralized export for all Supabase backend implementations
 * 
 * NOTE: Only implemented services are exported. Other services fall back to mock implementations.
 */

export { supabasesSalesService } from './salesService';
export { supabaseUserService } from './userService';
export { supabaseRbacService } from './rbacService';