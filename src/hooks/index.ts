/**
 * Hooks Index
 * Central export point for all custom React hooks
 * 
 * PHASE 4 HOOKS (Supabase Integration):
 * =====================================
 * - useSupabaseCustomers  - Customer management with real-time sync
 * - useSupabaseSales      - Sales pipeline and deal management
 * - useSupabaseTickets    - Support ticket management with SLA tracking
 * - useSupabaseContracts  - Contract lifecycle management
 * 
 * EXISTING HOOKS (Utility):
 * ========================
 * - useAuth           - Authentication and authorization
 * - useToast          - Toast notifications
 * - useMobile         - Mobile responsiveness
 * - useLocalStorage   - Local storage persistence
 * - useScrollRestoration - Scroll position restoration
 * - useEnhancedTableScroll - Enhanced table scrolling
 * 
 * USAGE:
 * ======
 * import { 
 *   useSupabaseCustomers, 
 *   useSupabaseSales,
 *   useSupabaseTickets,
 *   useSupabaseContracts
 * } from '@/hooks';
 */

// Phase 4: Supabase Integration Hooks
export { useSupabaseCustomers } from './useSupabaseCustomers';
export { useSupabaseSales } from './useSupabaseSales';
export { useSupabaseTickets } from './useSupabaseTickets';
export { useSupabaseContracts } from './useSupabaseContracts';

// Existing utility hooks
export { useAuth } from '@/contexts/AuthContext';
export { useToast } from './use-toast';
export { useMobile } from './use-mobile';
export { useLocalStorage } from './useLocalStorage';
export { useScrollRestoration } from './useScrollRestoration';
export { useEnhancedTableScroll } from './useEnhancedTableScroll';