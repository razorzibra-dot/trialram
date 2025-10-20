/**
 * Supabase Client Initialization
 * Central point for all Supabase database operations
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

/**
 * Main Supabase client for authenticated requests
 * Uses ANON_KEY for row-level security
 */
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Service role client for admin operations
 * Should only be used on backend (Edge Functions, API routes)
 * DO NOT expose this key to frontend
 */
export const supabaseAdmin = createClient(
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