/**
 * Dashboard and UI Types
 * Centralized types for dashboard components and analytics
 */

export interface ActivityItem {
  id: string;
  type: 'customer' | 'contract' | 'sale' | 'ticket' | 'job_work';
  title: string;
  description?: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalValue: number;
  recentActivity: Date;
  contactCount: number;
  contractCount: number;
  rank: number;
}

export interface TicketStatsData {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResolutionTime: number; // hours
}

export interface PipelineStage {
  stageId: string;
  name: string;
  dealCount: number;
  totalValue: number;
  averageDealValue: number;
  conversionRate: number;
}