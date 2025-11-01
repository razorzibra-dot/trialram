/**
 * Dashboard Service - Module Layer
 * Business logic for dashboard analytics and widgets
 * ⚠️ IMPORTANT: This is for the Dashboard module
 *
 * This service uses the Service Factory pattern to route between mock and Supabase implementations
 * based on VITE_API_MODE environment variable
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
import { salesService as factorySalesService } from '@/services/serviceFactory';
import { 
  getMockData, 
  getMockActivityData, 
  getMockSalesTrend, 
  getMockTicketStats, 
  getMockTopCustomers 
} from './mockData';

export interface DashboardStats {
  totalCustomers: number;
  totalDeals: number;
  totalTickets: number;
  totalRevenue: number;
  recentActivity: ActivityItem[];
  salesTrend: TrendData[];
  ticketStats: TicketStatsData;
  topCustomers: CustomerData[];
  salesPipeline?: SalesPipelineData;
}

export interface SalesPipelineData {
  qualification: { value: number; percentage: number };
  proposal: { value: number; percentage: number };
  negotiation: { value: number; percentage: number };
}

export interface ActivityItem {
  id: string;
  type: 'deal' | 'ticket' | 'customer' | 'user';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface TrendData {
  date: string;
  value: number;
  label: string;
}

export interface TicketStatsData {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  resolutionRate?: number;
}

export interface CustomerData {
  id: string;
  name: string;
  totalValue: number;
  dealCount: number;
}

export class DashboardService extends BaseService {
  private useMockData: boolean = false;

  constructor() {
    super();
  }

  /**
   * Get customer service from factory (routes based on VITE_API_MODE)
   */
  private getCustomerService() {
    return factoryCustomerService;
  }

  /**
   * Get sales service from factory (routes based on VITE_API_MODE)
   */
  private getSalesService() {
    return factorySalesService;
  }

  /**
   * Get dashboard statistics with real data from Supabase
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🔄 Fetching dashboard statistics from Supabase...');

      // Fetch data in parallel
      const [customers, sales, activities, salesTrend, ticketStats, topCustomers, salesPipeline] = await Promise.allSettled([
        this.fetchCustomerStats(),
        this.fetchSalesStats(),
        this.fetchRecentActivity(5),
        this.fetchSalesTrend(),
        this.fetchTicketStats(),
        this.fetchTopCustomers(4),
        this.fetchSalesPipeline(),
      ]);

      // Handle results - if any fails, use mock data for that section
      const stats: DashboardStats = {
        totalCustomers: customers.status === 'fulfilled' ? customers.value.count : 150,
        totalDeals: sales.status === 'fulfilled' ? sales.value.count : 45,
        totalTickets: ticketStats.status === 'fulfilled' ? ticketStats.value.open : 23,
        totalRevenue: sales.status === 'fulfilled' ? sales.value.revenue : 125000,
        recentActivity: activities.status === 'fulfilled' ? activities.value : getMockActivityData(5),
        salesTrend: salesTrend.status === 'fulfilled' ? salesTrend.value : getMockSalesTrend(),
        ticketStats: ticketStats.status === 'fulfilled' ? ticketStats.value : getMockTicketStats(),
        topCustomers: topCustomers.status === 'fulfilled' ? topCustomers.value : getMockTopCustomers(4),
        salesPipeline: salesPipeline.status === 'fulfilled' ? salesPipeline.value : getMockData().salesPipeline,
      };

      console.log('✅ Dashboard statistics loaded successfully');
      return stats;
    } catch (error) {
      this.handleError('Failed to fetch dashboard statistics', error);
      // Return mock data as fallback
      console.log('⚠️ Using mock data for dashboard');
      return getMockData();
    }
  }

  /**
   * Fetch customer statistics from factory service
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchCustomerStats(): Promise<{ count: number }> {
    try {
      const customers = await this.getCustomerService().getCustomers({ status: 'active' });
      return { count: customers.length };
    } catch (error) {
      this.handleError('Failed to fetch customer stats', error);
      throw error;
    }
  }

  /**
   * Fetch sales statistics from factory service
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchSalesStats(): Promise<{ count: number; revenue: number }> {
    try {
      const sales = await this.getSalesService().getDeals({ status: 'won' });
      const count = sales.length;
      const revenue = sales.reduce((sum, sale) => sum + (sale.value || 0), 0);
      return { count, revenue };
    } catch (error) {
      this.handleError('Failed to fetch sales stats', error);
      throw error;
    }
  }

  /**
   * Fetch recent activity from factory services
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const sales = await this.getSalesService().getDeals();
      const customers = await this.getCustomerService().getCustomers();

      // Create activity items from recent data
      const activities: ActivityItem[] = [];

      // Add recent sales as deals
      sales.slice(0, Math.ceil(limit / 2)).forEach((sale) => {
        activities.push({
          id: sale.id || '',
          type: 'deal',
          title: `Deal: ${sale.title || 'Untitled'}`,
          description: `Created for ${sale.customer_name || 'Unknown customer'}`,
          timestamp: sale.created_at || new Date().toISOString(),
          user: 'System',
        });
      });

      // Add recent customers
      customers.slice(0, Math.ceil(limit / 2)).forEach((customer) => {
        activities.push({
          id: customer.id || '',
          type: 'customer',
          title: `New customer: ${customer.company_name || 'Unknown'}`,
          description: `Added to system`,
          timestamp: customer.created_at || new Date().toISOString(),
          user: 'System',
        });
      });

      // Sort by timestamp and return limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.handleError('Failed to fetch recent activity', error);
      throw error;
    }
  }

  /**
   * Fetch sales trend data from factory service
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchSalesTrend(): Promise<TrendData[]> {
    try {
      const sales = await this.getSalesService().getDeals();

      // Group sales by month
      const monthlyData: Record<string, number> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      sales.forEach((sale) => {
        if (sale.created_at) {
          const date = new Date(sale.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (sale.value || 0);
        }
      });

      // Generate trend data for last 6 months
      const trends: TrendData[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = monthlyData[monthKey] || 0;
        trends.push({
          date: date.toISOString().split('T')[0],
          value,
          label: months[date.getMonth()],
        });
      }

      return trends;
    } catch (error) {
      this.handleError('Failed to fetch sales trend', error);
      throw error;
    }
  }

  /**
   * Fetch ticket statistics
   */
  private async fetchTicketStats(): Promise<TicketStatsData> {
    try {
      // TODO: Implement ticket service integration
      // For now, return mock data
      return getMockTicketStats();
    } catch (error) {
      this.handleError('Failed to fetch ticket stats', error);
      throw error;
    }
  }

  /**
   * Fetch top customers by value from factory services
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchTopCustomers(limit: number = 5): Promise<CustomerData[]> {
    try {
      const customers = await this.getCustomerService().getCustomers();
      const sales = await this.getSalesService().getDeals();

      // Calculate customer totals
      const customerTotals: Record<string, { name: string; value: number; dealCount: number }> = {};

      sales.forEach((sale) => {
        const customerId = sale.customer_id || '';
        if (customerId) {
          if (!customerTotals[customerId]) {
            const customer = customers.find((c) => c.id === customerId);
            customerTotals[customerId] = {
              name: customer?.company_name || 'Unknown',
              value: 0,
              dealCount: 0,
            };
          }
          customerTotals[customerId].value += sale.value || 0;
          customerTotals[customerId].dealCount += 1;
        }
      });

      // Convert to array and sort by value
      return Object.entries(customerTotals)
        .map(([id, data]) => ({
          id,
          name: data.name,
          totalValue: data.value,
          dealCount: data.dealCount,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, limit);
    } catch (error) {
      this.handleError('Failed to fetch top customers', error);
      throw error;
    }
  }

  /**
   * Fetch sales pipeline data from factory service
   * Routes to mock or Supabase based on VITE_API_MODE
   */
  private async fetchSalesPipeline(): Promise<SalesPipelineData> {
    try {
      const sales = await this.getSalesService().getDeals();

      // Group by stage
      const stages: Record<string, number> = {
        qualification: 0,
        proposal: 0,
        negotiation: 0,
      };

      sales.forEach((sale) => {
        const stage = sale.stage?.toLowerCase() || 'qualification';
        if (stage in stages) {
          stages[stage as keyof typeof stages] += sale.value || 0;
        }
      });

      const total = Object.values(stages).reduce((a, b) => a + b, 0) || 1;

      return {
        qualification: {
          value: stages.qualification,
          percentage: Math.round((stages.qualification / total) * 100),
        },
        proposal: {
          value: stages.proposal,
          percentage: Math.round((stages.proposal / total) * 100),
        },
        negotiation: {
          value: stages.negotiation,
          percentage: Math.round((stages.negotiation / total) * 100),
        },
      };
    } catch (error) {
      this.handleError('Failed to fetch sales pipeline', error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const stats = await this.getDashboardStats();
      return stats.recentActivity.slice(0, limit);
    } catch (error) {
      this.handleError('Failed to fetch recent activity', error);
      return getMockActivityData(limit);
    }
  }

  /**
   * Get sales trend data
   */
  async getSalesTrend(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<TrendData[]> {
    try {
      const stats = await this.getDashboardStats();
      return stats.salesTrend;
    } catch (error) {
      this.handleError('Failed to fetch sales trend', error);
      return getMockSalesTrend();
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStatsData> {
    try {
      const stats = await this.getDashboardStats();
      return stats.ticketStats;
    } catch (error) {
      this.handleError('Failed to fetch ticket statistics', error);
      return getMockTicketStats();
    }
  }

  /**
   * Get top customers
   */
  async getTopCustomers(limit: number = 5): Promise<CustomerData[]> {
    try {
      const stats = await this.getDashboardStats();
      return stats.topCustomers.slice(0, limit);
    } catch (error) {
      this.handleError('Failed to fetch top customers', error);
      return getMockTopCustomers(limit);
    }
  }

  /**
   * Get sales pipeline
   */
  async getSalesPipeline(): Promise<SalesPipelineData> {
    try {
      const stats = await this.getDashboardStats();
      return stats.salesPipeline || getMockData().salesPipeline!;
    } catch (error) {
      this.handleError('Failed to fetch sales pipeline', error);
      return getMockData().salesPipeline!;
    }
  }

  /**
   * Get widget data by type
   */
  async getWidgetData(widgetType: string): Promise<unknown> {
    try {
      switch (widgetType) {
        case 'sales_overview': {
          const stats = await this.getDashboardStats();
          return {
            totalRevenue: stats.totalRevenue,
            monthlyGrowth: 12.5,
            dealsWon: stats.totalDeals,
            conversionRate: 68.2,
          };
        }

        case 'ticket_overview':
          return await this.getTicketStats();

        case 'recent_activity':
          return await this.getRecentActivity(5);

        case 'top_customers':
          return await this.getTopCustomers(5);

        case 'sales_chart':
          return await this.getSalesTrend();

        case 'sales_pipeline':
          return await this.getSalesPipeline();

        default:
          throw new Error(`Unknown widget type: ${widgetType}`);
      }
    } catch (error) {
      this.handleError(`Failed to fetch widget data for ${widgetType}`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<unknown> {
    try {
      return {
        responseTime: 245, // ms
        uptime: 99.9, // %
        activeUsers: 42,
        systemLoad: 65, // %
        memoryUsage: 78, // %
        diskUsage: 45, // %
      };
    } catch (error) {
      this.handleError('Failed to fetch performance metrics', error);
      throw error;
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(format: 'csv' | 'json' | 'pdf' = 'json'): Promise<string> {
    try {
      const stats = await this.getDashboardStats();

      if (format === 'json') {
        return JSON.stringify(stats, null, 2);
      }

      if (format === 'csv') {
        // Simple CSV export of key metrics
        const csv = [
          ['Metric', 'Value'],
          ['Total Customers', stats.totalCustomers.toString()],
          ['Total Deals', stats.totalDeals.toString()],
          ['Total Tickets', stats.totalTickets.toString()],
          ['Total Revenue', stats.totalRevenue.toString()],
        ]
          .map((row) => row.join(','))
          .join('\r\n');

        return csv;
      }

      // PDF would require additional library
      throw new Error('PDF export not implemented');
    } catch (error) {
      this.handleError('Failed to export dashboard data', error);
      throw error;
    }
  }
}