import { createClient } from '@supabase/supabase-js';

// Environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anonymous Key not configured. Check your .env file.'
  );
}

// Create and export centralized Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'crm-v9-theme'
    }
  }
});

// Export function to get client instance (for backward compatibility)
export const getSupabaseClient = () => supabase;
