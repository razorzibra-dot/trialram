/**
 * Supabase Tenant Metrics Service
 * Handles tenant statistics and analytics
 * Queries: tenant_statistics table
 * 
 * @module supabaseTenantMetricsService
 */

import { getSupabaseClient } from '@/services/supabase/client';
import { TenantStatisticType } from '@/types/superUserModule';

const supabase = getSupabaseClient();

/**
 * Convert Supabase DB record to TenantStatisticType
 */
const convertSupabaseRecord = (record: any): TenantStatisticType => ({
  id: record.id,
  tenantId: record.tenant_id,
  metricType: record.metric_type as any,
  metricValue: parseFloat(record.metric_value) || 0,
  recordedAt: record.recorded_at,
});

export const supabaseTenantMetricsService = {
  /**
   * Get tenant metrics
   * If tenantId is 'all_tenants', returns metrics for all tenants
   * Otherwise returns metrics for a specific tenant
   */
  getTenantMetrics: async (tenantId: string): Promise<TenantStatisticType[]> => {
    try {
      if (tenantId === 'all_tenants') {
        // Fetch latest metrics for each tenant (one record per metric type per tenant)
        const { data, error } = await supabase
          .from('tenant_statistics')
          .select('DISTINCT ON (tenant_id, metric_type) *')
          .order('tenant_id')
          .order('metric_type')
          .order('recorded_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching all tenant metrics:', error);
          throw new Error(`Failed to fetch tenant metrics: ${error.message}`);
        }

        console.log(
          `✅ Fetched metrics for ${new Set((data || []).map((r) => r.tenant_id)).size} tenants`
        );
        return (data || []).map(convertSupabaseRecord);
      } else {
        // Fetch metrics for specific tenant
        const { data, error } = await supabase
          .from('tenant_statistics')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('recorded_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error(
            '❌ Error fetching metrics for tenant:',
            tenantId,
            error
          );
          throw new Error(`Failed to fetch tenant metrics: ${error.message}`);
        }

        console.log(
          `✅ Fetched ${(data || []).length} metric records for tenant ${tenantId}`
        );
        return (data || []).map(convertSupabaseRecord);
      }
    } catch (err) {
      console.error('❌ Tenant metrics query failed:', err);
      throw err;
    }
  },

  /**
   * Get comparison metrics for multiple tenants
   */
  getComparisonMetrics: async (
    tenantIds: string[]
  ): Promise<Map<string, TenantStatisticType[]>> => {
    try {
      const { data, error } = await supabase
        .from('tenant_statistics')
        .select('*')
        .in('tenant_id', tenantIds)
        .order('tenant_id')
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching comparison metrics:', error);
        throw new Error(
          `Failed to fetch comparison metrics: ${error.message}`
        );
      }

      // Group by tenant ID
      const map = new Map<string, TenantStatisticType[]>();
      (data || []).forEach((record) => {
        const tenantId = record.tenant_id;
        if (!map.has(tenantId)) {
          map.set(tenantId, []);
        }
        map.get(tenantId)!.push(convertSupabaseRecord(record));
      });

      console.log(`✅ Fetched comparison metrics for ${map.size} tenants`);
      return map;
    } catch (err) {
      console.error('❌ Comparison metrics query failed:', err);
      throw err;
    }
  },

  /**
   * Get metric trends for a tenant over time
   */
  getMetricsTrend: async (
    tenantId: string,
    metricType: string,
    days: number
  ): Promise<TenantStatisticType[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('tenant_statistics')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('metric_type', metricType)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error(
          '❌ Error fetching metric trends:',
          tenantId,
          metricType,
          error
        );
        throw new Error(`Failed to fetch metric trends: ${error.message}`);
      }

      console.log(
        `✅ Fetched ${(data || []).length} trend records for ${metricType} over ${days} days`
      );
      return (data || []).map(convertSupabaseRecord);
    } catch (err) {
      console.error('❌ Metrics trend query failed:', err);
      throw err;
    }
  },

  /**
   * Record a new metric value
   */
  recordMetric: async (
    tenantId: string,
    metricType: string,
    value: number
  ): Promise<TenantStatisticType> => {
    try {
      const { data, error } = await supabase
        .from('tenant_statistics')
        .insert({
          tenant_id: tenantId,
          metric_type: metricType,
          metric_value: value,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error recording metric:', error);
        throw new Error(`Failed to record metric: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create metric record');
      }

      console.log(
        `✅ Recorded metric ${metricType}=${value} for tenant ${tenantId}`
      );
      return convertSupabaseRecord(data);
    } catch (err) {
      console.error('❌ Record metric failed:', err);
      throw err;
    }
  },
};