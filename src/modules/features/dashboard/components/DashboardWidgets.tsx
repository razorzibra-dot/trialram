/**
 * Dashboard Widgets
 * Reusable dashboard widget components
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  TicketIcon, 
  Target,
  Activity,
  Clock
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-muted-foreground">{description}</p>
            {trend && (
              <div className={`flex items-center text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

interface ActivityItem {
  id: string;
  type: 'deal' | 'ticket' | 'customer' | 'user';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activities,
  loading = false,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return Target;
      case 'ticket':
        return TicketIcon;
      case 'customer':
        return Users;
      case 'user':
        return Activity;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deal':
        return 'bg-green-100 text-green-800';
      case 'ticket':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and changes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{activity.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TopCustomersWidgetProps {
  customers: Array<{
    id: string;
    name: string;
    totalValue: number;
    dealCount: number;
  }>;
  loading?: boolean;
}

export const TopCustomersWidget: React.FC<TopCustomersWidgetProps> = ({
  customers,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers</CardTitle>
        <CardDescription>Highest value customers by total deals</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.dealCount} deals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(customer.totalValue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TicketStatsWidgetProps {
  stats: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  loading?: boolean;
}

export const TicketStatsWidget: React.FC<TicketStatsWidgetProps> = ({
  stats,
  loading = false,
}) => {
  const statItems = [
    { label: 'Open', value: stats.open, color: 'bg-red-100 text-red-800' },
    { label: 'In Progress', value: stats.inProgress, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Resolved', value: stats.resolved, color: 'bg-green-100 text-green-800' },
    { label: 'Closed', value: stats.closed, color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>Current ticket status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.color} mb-2`}>
                  <span className="text-lg font-bold">{item.value}</span>
                </div>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
