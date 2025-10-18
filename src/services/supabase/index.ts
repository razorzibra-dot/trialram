/**
 * Supabase Services Index
 * Central export point for all Supabase-based services
 * 
 * These services implement database-first development using Supabase as the backend.
 * Each service extends BaseSupabaseService and provides domain-specific functionality.
 * 
 * USAGE:
 * ======
 * import { 
 *   supabaseAuthService,
 *   supabaseCustomerService,
 *   supabasesSalesService,
 *   supabaseTicketService,
 *   supabaseContractService,
 *   supabaseProductService,
 *   supabaseCompanyService,
 *   supabaseNotificationService
 * } from '@/services/supabase';
 * 
 * Or import the client directly:
 * import { getSupabaseClient, initializeSupabase } from '@/services/supabase/client';
 * 
 * INITIALIZATION:
 * ===============
 * In your main.tsx or App.tsx:
 * 
 *   import { initializeSupabase } from '@/services/supabase/client';
 *   
 *   try {
 *     initializeSupabase();
 *     console.log('✅ Supabase initialized');
 *   } catch (error) {
 *     console.error('❌ Failed to initialize Supabase', error);
 *   }
 * 
 * ARCHITECTURE:
 * =============
 * BaseSupabaseService
 *   ├── AuthService (Authentication, JWT tokens, users)
 *   ├── CustomerService (Customer CRUD, search)
 *   ├── SalesService (Sales pipeline, deals)
 *   ├── TicketService (Support tickets, comments, attachments)
 *   ├── ContractService (Contract management, approvals)
 *   ├── ProductService (Product catalog, inventory)
 *   ├── CompanyService (Organization management)
 *   └── NotificationService (User notifications, preferences)
 * 
 * FEATURES:
 * =========
 * ✅ Real-time subscriptions (Supabase Realtime)
 * ✅ Multi-tenant data isolation (RLS policies)
 * ✅ Full-text search capabilities
 * ✅ Soft deletes support
 * ✅ Pagination and filtering
 * ✅ Batch operations
 * ✅ Error handling and logging
 * ✅ Business logic (KPIs, statistics)
 */

// Core client
export { 
  initializeSupabase,
  getSupabaseClient,
  disconnectSupabase,
  isSupabaseInitialized,
  getSupabaseUrl
} from './client';

// Base service
export { 
  BaseSupabaseService,
  type PaginationOptions,
  type QueryOptions,
  type SubscriptionOptions
} from './baseService';

// Auth Service
export {
  SupabaseAuthService,
  supabaseAuthService,
  type AuthResponse
} from './authService';

// Customer Service
export {
  SupabaseCustomerService,
  supabaseCustomerService,
  type CustomerFilters
} from './customerService';

// Sales Service
export {
  SupabaseSalesService,
  supabasesSalesService,
  type SalesFilters
} from './salesService';

// Ticket Service
export {
  SupabaseTicketService,
  supabaseTicketService,
  type TicketFilters
} from './ticketService';

// Contract Service
export {
  SupabaseContractService,
  supabaseContractService,
  type ContractFilters
} from './contractService';

// Product Service
export {
  SupabaseProductService,
  supabaseProductService,
  type Product as SupabaseProduct,
  type ProductFilters
} from './productService';

// Company Service
export {
  SupabaseCompanyService,
  supabaseCompanyService,
  type Company,
  type CompanyFilters
} from './companyService';

// Notification Service
export {
  SupabaseNotificationService,
  supabaseNotificationService,
  type Notification,
  type NotificationPreference,
  type NotificationFilters
} from './notificationService';