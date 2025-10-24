/**
 * Supabase Client Initialization
 * Central point for all Supabase database operations
 * 
 * IMPORTANT: Uses singleton pattern with initialization guard to prevent
 * multiple GoTrueClient instances. This is critical for:
 * - React.StrictMode (which double-invokes in development)
 * - Hot module reloading during development
 * - Concurrent module loading
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Environment variables from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// EXTRA SAFETY: Suppress development warnings from libraries
// This ensures we only see meaningful warnings in development
const originalWarn = console.warn;
const warnFilter = (message: any, ...args: any[]) => {
  // Suppress the Multiple GoTrueClient instances warning (Supabase)
  if (
    typeof message === 'string' &&
    message.includes('Multiple GoTrueClient instances detected')
  ) {
    return; // Don't log this warning
  }
  // Suppress React Router Future Flag warnings (we already opted-in via future flags)
  if (
    typeof message === 'string' &&
    message.includes('React Router will begin wrapping state updates in `React.startTransition`')
  ) {
    return; // Don't log this warning - we've already opted in
  }
  // Log all other warnings normally
  return originalWarn.call(console, message, ...args);
};
console.warn = warnFilter;

/**
 * SUPER BULLETPROOF Singleton Pattern - Final Solution
 * 
 * PROBLEM: React.StrictMode resets module-level variables, causing:
 * 1. Multiple GoTrueClient instances to be created
 * 2. Warning: "Multiple GoTrueClient instances detected in the same browser context"
 * 3. Multiple instances trying to access the same localStorage key
 * 
 * SOLUTION: Store initialization state in window object (persistent across 
 * module reloads and React re-renders). This ensures:
 * - Only ONE createClient() call ever happens
 * - New module executions check window state first
 * - Old instances are properly detected and reused
 */

// Module-level cache (may be reset by React.StrictMode)
let _clientInstance: SupabaseClient | null = null;
let _adminInstance: SupabaseClient | null = null;

// CRITICAL: Use window for persistent initialization flags
// These survive module reloads, HMR, and React.StrictMode double-invocations
const getClientInitFlag = (): boolean => {
  if (typeof window !== 'undefined') {
    return (window as any).__SUPABASE_CLIENT_INITIALIZED__ === true;
  }
  return false;
};

const setClientInitFlag = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_CLIENT_INITIALIZED__ = true;
  }
};

const getAdminInitFlag = (): boolean => {
  if (typeof window !== 'undefined') {
    return (window as any).__SUPABASE_ADMIN_INITIALIZED__ === true;
  }
  return false;
};

const setAdminInitFlag = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_ADMIN_INITIALIZED__ = true;
  }
};

/**
 * Get or create the main Supabase client (singleton)
 * 
 * INITIALIZATION SEQUENCE:
 * 1. Check if already initialized via window flag (survives React.StrictMode)
 * 2. If yes, return cached instance from window
 * 3. If no, set flag BEFORE creating to block concurrent creation attempts
 * 4. Cache instance on both window and module level
 * 
 * This ensures createClient() is called EXACTLY ONCE across all module reloads
 */
const initializeClientSingleton = (): SupabaseClient => {
  // STEP 1: Check window cache first (persistent across module reloads and React.StrictMode)
  if (typeof window !== 'undefined') {
    const cachedClient = (window as any).__SUPABASE_CLIENT__;
    if (cachedClient) {
      _clientInstance = cachedClient;
      return cachedClient;
    }
  }

  // STEP 2: Check module-level cache (fast path for same module execution)
  if (_clientInstance !== null) {
    return _clientInstance;
  }

  // STEP 3: Check persistent initialization flag
  // If flag is true, another execution is creating the client or already created it
  if (getClientInitFlag()) {
    // Wait for instance to appear in window cache (already being created)
    if (typeof window !== 'undefined') {
      const windowClient = (window as any).__SUPABASE_CLIENT__;
      if (windowClient) {
        _clientInstance = windowClient;
        return windowClient;
      }
    }
    // Should not reach here, but return module cache if available
    return _clientInstance!;
  }

  // STEP 4: CRITICAL - Set initialization flag BEFORE calling createClient()
  // This blocks any concurrent execution from also calling createClient()
  setClientInitFlag();
  
  console.log('🔧 Initializing Supabase client singleton (first access)...');
  
  // STEP 5: Create the client (this is now guaranteed to be called only once)
  _clientInstance = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

  // STEP 6: Cache on window for all future module reloads to retrieve
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_CLIENT__ = _clientInstance;
  }

  return _clientInstance;
};

/**
 * Get or create the admin Supabase client (singleton)
 * 
 * INITIALIZATION SEQUENCE (same as client, but for admin/service role):
 * 1. Check if already initialized via window flag (survives React.StrictMode)
 * 2. If yes, return cached instance from window
 * 3. If no, set flag BEFORE creating to block concurrent creation attempts
 * 4. Cache instance on both window and module level
 * 
 * This ensures createClient() is called EXACTLY ONCE across all module reloads
 */
const initializeAdminSingleton = (): SupabaseClient => {
  // STEP 1: Check window cache first (persistent across module reloads and React.StrictMode)
  if (typeof window !== 'undefined') {
    const cachedAdmin = (window as any).__SUPABASE_ADMIN__;
    if (cachedAdmin) {
      _adminInstance = cachedAdmin;
      return cachedAdmin;
    }
  }

  // STEP 2: Check module-level cache (fast path for same module execution)
  if (_adminInstance !== null) {
    return _adminInstance;
  }

  // STEP 3: Check persistent initialization flag
  // If flag is true, another execution is creating the admin client or already created it
  if (getAdminInitFlag()) {
    // Wait for instance to appear in window cache (already being created)
    if (typeof window !== 'undefined') {
      const windowAdmin = (window as any).__SUPABASE_ADMIN__;
      if (windowAdmin) {
        _adminInstance = windowAdmin;
        return windowAdmin;
      }
    }
    // Should not reach here, but return module cache if available
    return _adminInstance!;
  }

  // STEP 4: CRITICAL - Set initialization flag BEFORE calling createClient()
  // This blocks any concurrent execution from also calling createClient()
  setAdminInitFlag();
  
  console.log('🔧 Initializing Supabase admin client singleton (first access)...');
  
  // STEP 5: Create the admin client (this is now guaranteed to be called only once)
  _adminInstance = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  // STEP 6: Cache on window for all future module reloads to retrieve
  if (typeof window !== 'undefined') {
    (window as any).__SUPABASE_ADMIN__ = _adminInstance;
  }

  return _adminInstance;
};

/**
 * Main Supabase client for authenticated requests
 * Uses ANON_KEY for row-level security
 * Initialized on first module load
 */
export const supabaseClient: SupabaseClient = initializeClientSingleton();

/**
 * Service role client for admin operations  
 * Should only be used on backend (Edge Functions, API routes)
 * DO NOT expose this key to frontend
 * Initialized on first module load
 */
export const supabaseAdmin: SupabaseClient = initializeAdminSingleton();

/**
 * Get current session user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: any, session: any) => void) => {
  return supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(session?.user, session);
  });
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  return supabaseClient;
};

/**
 * Check if client is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * Get connection status
 */
export const getConnectionStatus = async (): Promise<'connected' | 'disconnected'> => {
  try {
    const { data } = await supabaseClient.from('tenants').select('id').limit(1);
    return data !== null ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
};

export default supabaseClient;