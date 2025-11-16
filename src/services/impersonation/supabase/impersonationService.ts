/**
 * Supabase Impersonation Service
 * Handles super user impersonation audit logging and session tracking
 * Queries: super_user_impersonation_logs table
 * 
 * @module supabaseImpersonationService
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

import {
  ImpersonationLogType,
  ImpersonationStartInput,
  ImpersonationEndInput,
} from '@/types/superUserModule';

/**
 * Convert Supabase DB record to ImpersonationLogType
 */
const convertSupabaseRecord = (record: any): ImpersonationLogType => ({
  id: record.id,
  superUserId: record.super_user_id,
  impersonatedUserId: record.impersonated_user_id,
  tenantId: record.tenant_id,
  startedAt: record.login_at,
  endedAt: record.logout_at,
  reason: record.reason,
  actions: Array.isArray(record.actions_taken) ? record.actions_taken : [],
});

export const supabaseImpersonationService = {
  /**
   * Get all impersonation logs
   */
  getImpersonationLogs: async (): Promise<ImpersonationLogType[]> => {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching impersonation logs:', error);
        throw new Error(`Failed to fetch impersonation logs: ${error.message}`);
      }

      return (data || []).map(convertSupabaseRecord);
    } catch (err) {
      console.error('❌ Impersonation logs query failed:', err);
      throw err;
    }
  },

  /**
   * Get impersonation logs for a specific super user
   */
  getImpersonationLogsByUserId: async (
    superUserId: string
  ): Promise<ImpersonationLogType[]> => {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .select('*')
        .eq('super_user_id', superUserId)
        .order('login_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error(
          '❌ Error fetching logs for super user:',
          superUserId,
          error
        );
        throw new Error(
          `Failed to fetch impersonation logs for user: ${error.message}`
        );
      }

      return (data || []).map(convertSupabaseRecord);
    } catch (err) {
      console.error('❌ Query failed for super user logs:', err);
      throw err;
    }
  },

  /**
   * Get a specific impersonation log by ID
   */
  getImpersonationLogById: async (id: string): Promise<ImpersonationLogType> => {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching impersonation log:', id, error);
        throw new Error(`Failed to fetch impersonation log: ${error.message}`);
      }

      if (!data) {
        throw new Error('Impersonation log not found');
      }

      return convertSupabaseRecord(data);
    } catch (err) {
      console.error('❌ Query failed for impersonation log:', err);
      throw err;
    }
  },

  /**
   * Start a new impersonation session
   */
  startImpersonation: async (
    input: ImpersonationStartInput
  ): Promise<ImpersonationLogType> => {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .insert({
          super_user_id: input.superUserId,
          impersonated_user_id: input.impersonatedUserId,
          tenant_id: input.tenantId,
          reason: input.reason,
          login_at: new Date().toISOString(),
          logout_at: null,
          actions_taken: [],
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error starting impersonation:', error);
        throw new Error(`Failed to start impersonation: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create impersonation session');
      }

      console.log('✅ Impersonation session started:', data.id);
      return convertSupabaseRecord(data);
    } catch (err) {
      console.error('❌ Start impersonation failed:', err);
      throw err;
    }
  },

  /**
   * End an impersonation session
   */
  endImpersonation: async (input: ImpersonationEndInput): Promise<void> => {
    try {
      const { error } = await supabase
        .from('super_user_impersonation_logs')
        .update({
          logout_at: new Date().toISOString(),
          actions_taken: input.actionsTaken,
        })
        .eq('id', input.logId);

      if (error) {
        console.error('❌ Error ending impersonation:', error);
        throw new Error(`Failed to end impersonation: ${error.message}`);
      }

      console.log('✅ Impersonation session ended:', input.logId);
    } catch (err) {
      console.error('❌ End impersonation failed:', err);
      throw err;
    }
  },

  /**
   * Get all currently active impersonation sessions (logout_at IS NULL)
   */
  getActiveImpersonations: async (): Promise<ImpersonationLogType[]> => {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .select('*')
        .is('logout_at', null)
        .order('login_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active impersonations:', error);
        throw new Error(
          `Failed to fetch active impersonations: ${error.message}`
        );
      }

      console.log(`✅ Found ${(data || []).length} active impersonation sessions`);
      return (data || []).map(convertSupabaseRecord);
    } catch (err) {
      console.error('❌ Query failed for active impersonations:', err);
      throw err;
    }
  },
};