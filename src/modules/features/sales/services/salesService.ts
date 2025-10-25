/**
 * Sales Service
 * Business logic for sales and deals management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Deal } from '@/types/crm';
import { PaginatedResponse } from '@/modules/core/types';
import { salesService as legacySalesService } from '@/services';

export interface SalesFilters {
  search?: string;
  stage?: string;
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minValue?: number;
  maxValue?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateDealData {
  title: string;
  description?: string;
  value: number;
  stage: string;
  customer_id: string;
  assigned_to?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  tags?: string[];
}

export interface DealStats {
  total: number;
  totalValue: number;
  byStage: Record<string, number>;
  byStageValue: Record<string, number>;
  conversionRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  monthlyTrend: Array<{
    month: string;
    deals: number;
    value: number;
  }>;
}

export class SalesService extends BaseService {
  /**
   * Get deals with filtering and pagination
   */
  async getDeals(filters: SalesFilters = {}): Promise<PaginatedResponse<Deal>> {
    try {
      // Use legacy service for now, but wrap in new interface
      const deals = await legacySalesService.getDeals(filters);
      
      // Filter and validate deals, ensuring all have required fields
      const validDeals = (Array.isArray(deals) ? deals : [])
        .filter((deal) => deal && typeof deal === 'object' && deal.id)
        .map((deal) => ({
          ...deal,
          title: deal.title || 'Untitled Deal',
          value: Number(deal.value) || 0,
          stage: deal.stage || 'lead',
          status: deal.status || 'open',
          customer_name: deal.customer_name || '',
          assigned_to_name: deal.assigned_to_name || '',
          tenant_id: deal.tenant_id || '',
          created_at: deal.created_at || new Date().toISOString(),
          updated_at: deal.updated_at || new Date().toISOString(),
        }));

      const pageSize = filters.pageSize || 20;
      
      // Transform to paginated response format
      return {
        data: validDeals,
        total: validDeals.length,
        page: filters.page || 1,
        pageSize: pageSize,
        totalPages: Math.ceil(validDeals.length / pageSize),
      };
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      throw error;
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<Deal> {
    try {
      return await legacySalesService.getDeal(id);
    } catch (error) {
      console.error(`Failed to fetch deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(data: CreateDealData): Promise<Deal> {
    try {
      return await legacySalesService.createDeal(data);
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    try {
      return await legacySalesService.updateDeal(id, data);
    } catch (error) {
      console.error(`Failed to update deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<void> {
    try {
      await legacySalesService.deleteDeal(id);
    } catch (error) {
      console.error(`Failed to delete deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update deal stage
   */
  async updateDealStage(id: string, stage: string): Promise<Deal> {
    try {
      return await this.updateDeal(id, { stage });
    } catch (error) {
      console.error(`Failed to update deal stage for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update deals
   */
  async bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]> {
    try {
      const promises = ids.map(id => this.updateDeal(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update deals:', error);
      throw error;
    }
  }

  /**
   * Bulk delete deals
   */
  async bulkDeleteDeals(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteDeal(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk delete deals:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(): Promise<DealStats> {
    try {
      // Get all deals for stats calculation
      const response = await this.getDeals({ pageSize: 1000 });
      const deals = response.data;

      const stats: DealStats = {
        total: deals.length,
        totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        byStage: {},
        byStageValue: {},
        conversionRate: 0,
        averageDealSize: 0,
        averageSalesCycle: 0,
        monthlyTrend: [],
      };

      // Calculate stage statistics
      deals.forEach(deal => {
        const stage = deal.stage || 'unknown';
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
        stats.byStageValue[stage] = (stats.byStageValue[stage] || 0) + (deal.value || 0);
      });

      // Calculate conversion rate
      const closedWon = stats.byStage['closed_won'] || 0;
      stats.conversionRate = deals.length > 0 ? (closedWon / deals.length) * 100 : 0;

      // Calculate average deal size
      stats.averageDealSize = deals.length > 0 ? stats.totalValue / deals.length : 0;

      return stats;
    } catch (error) {
      console.error('Failed to fetch sales statistics:', error);
      throw error;
    }
  }

  /**
   * Get deals by customer ID
   */
  async getDealsByCustomer(
    customerId: string,
    filters: SalesFilters = {}
  ): Promise<PaginatedResponse<Deal>> {
    try {
      // Get all deals for now - filter by customer ID
      const response = await this.getDeals({ ...filters, pageSize: 1000 });
      
      // Filter deals by customer_id
      const customerDeals = response.data.filter(
        (deal) => deal.customer_id === customerId || deal.customerId === customerId
      );

      const pageSize = filters.pageSize || 20;
      return {
        data: customerDeals,
        total: customerDeals.length,
        page: filters.page || 1,
        pageSize: pageSize,
        totalPages: Math.ceil(customerDeals.length / pageSize),
      };
    } catch (error) {
      console.error(`Failed to fetch deals for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Search deals
   */
  async searchDeals(query: string): Promise<Deal[]> {
    try {
      const response = await this.getDeals({ search: query });
      return response.data;
    } catch (error) {
      console.error('Failed to search deals:', error);
      throw error;
    }
  }

  /**
   * Get deal stages
   */
  async getDealStages(): Promise<string[]> {
    return [
      'lead',
      'qualified',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost'
    ];
  }

  /**
   * Export deals
   */
  async exportDeals(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getDeals({ pageSize: 10000 });
      const deals = response.data;

      if (format === 'json') {
        return JSON.stringify(deals, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Title', 'Customer', 'Value', 'Stage', 'Assigned To', 'Created Date'];
      const rows = deals.map(deal => [
        deal.id,
        deal.title,
        deal.customer_name || '',
        deal.value || 0,
        deal.stage || '',
        deal.assigned_to_name || '',
        deal.created_at || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      console.error('Failed to export deals:', error);
      throw error;
    }
  }

  /**
   * Import deals from CSV
   */
  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const errors: string[] = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const dealData: Record<string, string | undefined> = {};

          headers.forEach((header, index) => {
            dealData[header.toLowerCase().replace(' ', '_')] = values[index];
          });

          await this.createDeal(dealData);
          success++;
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('Failed to import deals:', error);
      throw error;
    }
  }
}
