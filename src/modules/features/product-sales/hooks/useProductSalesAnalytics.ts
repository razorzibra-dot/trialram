/**
 * useProductSalesAnalytics Hook
 * Fetches analytics data for product sales dashboard
 * Includes caching with TTL for performance
 */

import { useQuery } from '@tanstack/react-query';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import type { IProductSalesService } from '../services/productSalesService';
import { useAuth } from '@/contexts/AuthContext';
import { productSalesKeys } from './useProductSales';
import { STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

/**
 * Hook for fetching product sales analytics data
 * @returns Query result with analytics data
 */
export const useProductSalesAnalytics = () => {
  const service = useService<IProductSalesService>('productSaleService');
  const { user } = useAuth();
  const tenantId = user?.tenant_id || 'default-tenant';
  const { setAnalytics, setError, clearError } = useProductSalesStore();

  return useQuery({
    queryKey: [...productSalesKeys.analytics()],
    queryFn: async () => {
      clearError();
      try {
        const analytics = await service.getProductSalesAnalytics(tenantId);

        const analyticsState = {
          totalSales: analytics.totalSales ?? 0,
          totalRevenue: analytics.totalRevenue ?? 0,
          averageSaleValue: analytics.averageSaleValue ?? 0,
          topProducts: analytics.topProducts?.map((p) => ({
            id: p.productId,
            name: p.productName,
            count: p.quantity,
            revenue: p.revenue,
          })) || [],
          topCustomers: analytics.topCustomers?.map((c) => ({
            id: c.customerId,
            name: c.customerName,
            count: c.totalSales,
            revenue: c.revenue,
          })) || [],
          statusDistribution: (analytics.byStatus || []).reduce(
            (acc, s) => ({
              ...acc,
              [s.status]: s.count,
            }),
            {}
          ),
          monthlyTrend: analytics.revenueByMonth ? Object.entries(analytics.revenueByMonth).map(([month, revenue]) => ({
            month,
            sales: 0,
            revenue,
          })) || [] : [],
        };

        setAnalytics(analyticsState);
        return analyticsState;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch analytics data';
        setError(errorMessage);
        throw error;
      }
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching top selling products
 * @param limit Number of top products to fetch
 * @returns Query result with top products
 */
export const useTopProductSales = (limit: number = 10) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'top-products', limit],
    queryFn: async () => {
      return service.getTopProducts(limit);
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching top customers by revenue
 * @param limit Number of top customers to fetch
 * @returns Query result with top customers
 */
export const useTopCustomerSales = (limit: number = 10) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'top-customers', limit],
    queryFn: async () => {
      return service.getTopCustomers(limit);
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching sales revenue trend over time
 * @param monthsBack Number of months to look back (default: 12)
 * @returns Query result with trend data
 */
export const useSalesRevenueTrend = (monthsBack: number = 12) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'revenue-trend', monthsBack],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);

      return service.getRevenueTrend(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching warranties expiring soon
 * @param daysAhead Number of days ahead to check (default: 30)
 * @returns Query result with expiring warranties
 */
export const useExpiringWarranties = (daysAhead: number = 30) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'expiring-warranties', daysAhead],
    queryFn: async () => {
      return service.getExpiringWarranties(daysAhead);
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching sales summary statistics
 * @returns Query result with summary statistics
 */
export const useSalesSummaryStats = () => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'summary-stats'],
    queryFn: async () => {
      return service.getSummaryStats();
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for checking contract renewal opportunities
 * @returns Query result with renewal opportunities
 */
export const useRenewalOpportunities = () => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.analytics(), 'renewal-opportunities'],
    queryFn: async () => {
      return service.getRenewalOpportunities();
    },
    ...STATS_QUERY_CONFIG,
  });
};