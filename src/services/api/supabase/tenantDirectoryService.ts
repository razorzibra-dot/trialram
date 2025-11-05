/**
 * Supabase Tenant Directory Service
 * Loads list of all tenants with their detailed statistics
 * Queries: tenants table + tenant_statistics for aggregated data
 * 
 * @module supabaseTenantDirectoryService
 */

import { getSupabaseClient } from '@/services/supabase/client';
import { TenantDirectoryEntry } from '@/types/superAdmin';

const supabase = getSupabaseClient();

export const supabaseTenantDirectoryService = {
  /**
   * Get all tenants from the tenants table
   */
  getAllTenants: async (): Promise<TenantDirectoryEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching tenants:', error);
        throw new Error(`Failed to fetch tenants: ${error.message}`);
      }

      console.log(`✅ Fetched ${(data || []).length} tenants from directory`);

      // Convert to directory entries
      return (data || []).map((tenant: any) => ({
        tenantId: tenant.id,
        name: tenant.name,
        status: tenant.status || 'active',
        plan: tenant.plan || 'professional',
        activeUsers: tenant.active_users || 0,
        totalContracts: tenant.total_contracts || 0,
        totalSales: tenant.total_sales || 0,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at || tenant.created_at,
      }));
    } catch (err) {
      console.error('❌ Tenant directory query failed:', err);
      throw err;
    }
  },

  /**
   * Get a specific tenant details
   */
  getTenant: async (tenantId: string): Promise<TenantDirectoryEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows
        console.error('❌ Error fetching tenant:', error);
        throw new Error(`Failed to fetch tenant: ${error.message}`);
      }

      if (!data) {
        console.warn(`⚠️ Tenant not found: ${tenantId}`);
        return null;
      }

      console.log(`✅ Fetched tenant details: ${tenantId}`);

      return {
        tenantId: data.id,
        name: data.name,
        status: data.status || 'active',
        plan: data.plan || 'professional',
        activeUsers: data.active_users || 0,
        totalContracts: data.total_contracts || 0,
        totalSales: data.total_sales || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
      };
    } catch (err) {
      console.error('❌ Get tenant query failed:', err);
      throw err;
    }
  },

  /**
   * Get tenants by status
   */
  getTenantsByStatus: async (
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<TenantDirectoryEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching tenants by status:', error);
        throw new Error(`Failed to fetch tenants: ${error.message}`);
      }

      console.log(
        `✅ Fetched ${(data || []).length} ${status} tenants`
      );

      return (data || []).map((tenant: any) => ({
        tenantId: tenant.id,
        name: tenant.name,
        status: tenant.status || 'active',
        plan: tenant.plan || 'professional',
        activeUsers: tenant.active_users || 0,
        totalContracts: tenant.total_contracts || 0,
        totalSales: tenant.total_sales || 0,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at || tenant.created_at,
      }));
    } catch (err) {
      console.error('❌ Get tenants by status query failed:', err);
      throw err;
    }
  },

  /**
   * Get tenant statistics summary
   */
  getTenantStats: async (): Promise<{
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    suspendedTenants: number;
  }> => {
    try {
      const { data, error, count } = await supabase
        .from('tenants')
        .select('status', { count: 'exact' });

      if (error) {
        console.error('❌ Error fetching tenant stats:', error);
        throw new Error(`Failed to fetch tenant stats: ${error.message}`);
      }

      const stats = {
        totalTenants: count || 0,
        activeTenants: (data || []).filter((t: any) => t.status === 'active').length,
        inactiveTenants: (data || []).filter((t: any) => t.status === 'inactive').length,
        suspendedTenants: (data || []).filter((t: any) => t.status === 'suspended').length,
      };

      console.log('✅ Fetched tenant statistics:', stats);
      return stats;
    } catch (err) {
      console.error('❌ Get tenant stats query failed:', err);
      throw err;
    }
  },

  /**
   * Update tenant statistics (when super user records metrics)
   */
  updateTenantStats: async (
    tenantId: string,
    updates: {
      activeUsers?: number;
      totalContracts?: number;
      totalSales?: number;
    }
  ): Promise<TenantDirectoryEntry> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({
          active_users: updates.activeUsers,
          total_contracts: updates.totalContracts,
          total_sales: updates.totalSales,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating tenant stats:', error);
        throw new Error(`Failed to update tenant stats: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to update tenant stats');
      }

      console.log(`✅ Updated tenant statistics for ${tenantId}`);

      return {
        tenantId: data.id,
        name: data.name,
        status: data.status || 'active',
        plan: data.plan || 'professional',
        activeUsers: data.active_users || 0,
        totalContracts: data.total_contracts || 0,
        totalSales: data.total_sales || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
      };
    } catch (err) {
      console.error('❌ Update tenant stats failed:', err);
      throw err;
    }
  },
};