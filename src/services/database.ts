import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Restore session from localStorage on initialization
async function initializeSession() {
  try {
    const sessionStr = localStorage.getItem('supabase_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      console.log('[DB] Restoring session from localStorage:', session?.user?.id);
      const { error } = await supabase.auth.setSession(session);
      if (error) {
        console.warn('[DB] Session restore error:', error.message);
        localStorage.removeItem('supabase_session');
      } else {
        console.log('[DB] Session restored successfully');
      }
    } else {
      console.debug('[DB] No session in localStorage');
    }
  } catch (err) {
    console.error('[DB] Session initialization error:', err);
    localStorage.removeItem('supabase_session');
  }
}

// Initialize on load
initializeSession();

// Database helper functions
export class DatabaseService {
  // Generic query methods
  static async select(table: string, columns = '*', filters?: Record<string, unknown>) {
    let query = supabase.from(table).select(columns);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    if (error) throw new Error(`Database query failed: ${error.message}`);
    return data;
  }

  static async insert(table: string, data: Record<string, unknown>) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw new Error(`Database insert failed: ${error.message}`);
    return result;
  }

  static async update(table: string, id: string, data: Record<string, unknown>) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Database update failed: ${error.message}`);
    return result;
  }

  static async delete(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Database delete failed: ${error.message}`);
    return true;
  }

  static async findById(table: string, id: string) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database query failed: ${error.message}`);
    }
    return data;
  }

  static async findOne(table: string, filters: Record<string, unknown>) {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database query failed: ${error.message}`);
    }
    return data;
  }

  static async count(table: string, filters?: Record<string, unknown>) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { count, error } = await query;
    if (error) throw new Error(`Database count failed: ${error.message}`);
    return count || 0;
  }
}