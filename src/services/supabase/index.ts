/**
 * Supabase Services - Barrel Export
 * Central export point for all Supabase-related services
 */

export { supabaseClient, supabaseAdmin, getSupabaseClient, getCurrentUser, getCurrentSession, onAuthStateChange, logout, isSupabaseConfigured, getConnectionStatus } from './client';
export { multiTenantService, type TenantContext } from './multiTenantService';
export {
  addTenantFilter,
  applyPagination,
  applySorting,
  buildServiceContractQuery,
  buildProductSalesQuery,
  buildCustomerQuery,
  handleSupabaseError,
  retryQuery,
  buildRealtimeFilter,
  countRecords,
  buildSearchQuery,
} from './queryBuilders';
export { supabaseAuthService } from './authService';
export { supabaseServiceContractService } from './serviceContractService';
export { supabaseProductSaleService } from './productSaleService';
export { supabaseCustomerService } from './customerService';
export { supabaseTicketService } from './ticketService';
export { supabaseSalesService } from './salesService';
export { supabaseContractService } from './contractService';
export { supabaseNotificationService } from './notificationService';
export { supabaseProductService } from './productService';
export { supabaseCompanyService } from './companyService';