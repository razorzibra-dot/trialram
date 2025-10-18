/**
 * Mock Data Service
 * Provides fallback mock data for dashboard when Supabase is unavailable
 */

import { DashboardStats, ActivityItem, TrendData, TicketStatsData, CustomerData } from './dashboardService';

export const getMockData = (): DashboardStats => ({
  totalCustomers: 150,
  totalDeals: 45,
  totalTickets: 23,
  totalRevenue: 125000,
  recentActivity: [
    {
      id: '1',
      type: 'deal',
      title: 'New deal created',
      description: 'Website redesign project for Acme Corp',
      timestamp: new Date().toISOString(),
      user: 'John Doe',
    },
    {
      id: '2',
      type: 'ticket',
      title: 'Support ticket resolved',
      description: 'Login issue fixed for customer',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Jane Smith',
    },
    {
      id: '3',
      type: 'customer',
      title: 'New customer added',
      description: 'Tech Solutions Inc. joined as new customer',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Mike Johnson',
    },
  ],
  salesTrend: [
    { date: '2024-01-01', value: 15000, label: 'Jan' },
    { date: '2024-02-01', value: 18000, label: 'Feb' },
    { date: '2024-03-01', value: 22000, label: 'Mar' },
    { date: '2024-04-01', value: 19000, label: 'Apr' },
    { date: '2024-05-01', value: 25000, label: 'May' },
    { date: '2024-06-01', value: 28000, label: 'Jun' },
  ],
  ticketStats: {
    open: 8,
    inProgress: 12,
    resolved: 15,
    closed: 3,
    resolutionRate: 60,
  },
  topCustomers: [
    { id: '1', name: 'Acme Corp', totalValue: 45000, dealCount: 5 },
    { id: '2', name: 'Tech Solutions', totalValue: 32000, dealCount: 3 },
    { id: '3', name: 'Global Industries', totalValue: 28000, dealCount: 4 },
    { id: '4', name: 'StartupXYZ', totalValue: 15000, dealCount: 2 },
  ],
  salesPipeline: {
    qualification: { value: 125000, percentage: 75 },
    proposal: { value: 85000, percentage: 60 },
    negotiation: { value: 45000, percentage: 40 },
  },
});

export const getMockActivityData = (limit: number = 10): ActivityItem[] => {
  const mockData = getMockData();
  return mockData.recentActivity.slice(0, limit);
};

export const getMockSalesTrend = (): TrendData[] => {
  const mockData = getMockData();
  return mockData.salesTrend;
};

export const getMockTicketStats = (): TicketStatsData => {
  const mockData = getMockData();
  return mockData.ticketStats;
};

export const getMockTopCustomers = (limit: number = 5): CustomerData[] => {
  const mockData = getMockData();
  return mockData.topCustomers.slice(0, limit);
};