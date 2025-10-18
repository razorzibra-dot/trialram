/**
 * Supabase Client
 * Single instance shared across the application
 * Handles initialization, authentication, and lifecycle management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { backendConfig, isSupabaseConfigured } from '@/config/backendConfig';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client with proper configuration
 * This is a singleton pattern - only one instance per application
 */
export function initializeSupabase(): SupabaseClient {
  // Return existing client if already initialized
  if (supabaseClient) {
    console.log('✅ Using existing Supabase client instance');
    return supabaseClient;
  }

  // Validate configuration before initializing
  if (!isSupabaseConfigured()) {
    throw new Error(
      '❌ Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    );
  }

  const config = backendConfig.supabase!;

  console.log('🔧 Initializing Supabase client...');

  // Create client with proper options
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      enabled: config.enableRealtime,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'crm-v9/1.0',
        'X-API-Mode': 'supabase',
      },
    },
  });

  console.log('✅ Supabase client initialized');

  // Setup event listeners for monitoring
  setupSupabaseListeners(supabaseClient);

  return supabaseClient;
}

/**
 * Get existing Supabase client or initialize if needed
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
}

/**
 * Setup Supabase event listeners for debugging and monitoring
 */
function setupSupabaseListeners(client: SupabaseClient): void {
  // Listen for auth state changes
  client.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event);

    if (event === 'SIGNED_OUT') {
      // Clear local session data
      localStorage.removeItem('supabase_session');
      console.log('🔓 Session cleared');
    }

    if (event === 'SIGNED_IN') {
      console.log('✅ User signed in:', session?.user?.email);
    }
  });

  // Log connection status
  client.realtime.setAuth(
    (async () => {
      const { data } = await client.auth.getSession();
      return data.session?.access_token || '';
    })()
  );

  console.log('📡 Supabase listeners configured');
}

/**
 * Disconnect and cleanup Supabase client
 */
export async function disconnectSupabase(): Promise<void> {
  if (!supabaseClient) return;

  try {
    // Close any realtime subscriptions
    await supabaseClient.removeAllChannels();
    console.log('🔌 Supabase disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Supabase:', error);
  } finally {
    supabaseClient = null;
  }
}

/**
 * Check if Supabase is initialized
 */
export function isSupabaseInitialized(): boolean {
  return supabaseClient !== null;
}

/**
 * Get current Supabase configuration URL (for debugging)
 */
export function getSupabaseUrl(): string {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  return backendConfig.supabase!.url;
}

export default getSupabaseClient;