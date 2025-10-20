# Role-Based Dashboard Implementation Guide

This guide provides step-by-step instructions for implementing the role-based dashboard feature in the PDS-CRM Application.

## Overview

The dashboard will display different widgets based on the user's role:

1. **Admin Dashboard**:
   - Annual service contracts expiring today
   - Pending complaints more than 7 days
   - Today's complaints
   - Sales analytics

2. **Engineer Dashboard**:
   - Pending complaints more than 7 days
   - Today's complaints
   - Assigned job works

3. **Customer Dashboard**:
   - Total product count
   - Product service contracts expiring
   - Active complaints

## Implementation Steps

### Step 1: Create Dashboard Service Methods

1. Open `src/services/dashboardService.ts` and add the following methods:

```typescript
import { supabase } from './supabase/client';

export const dashboardService = {
  // Admin Dashboard Methods
  async getExpiringContracts(days: number = 7) {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from('service_contracts')
      .select('*, customer:customers(name), product:products(name)')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', targetDate.toISOString().split('T')[0])
      .eq('status', 'active');
      
    if (error) throw error;
    return data;
  },
  
  async getPendingComplaints(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*, customer:customers(name), product:products(name), engineer:users(name)')
      .eq('status', 'new')
      .lte('created_at', cutoffDate.toISOString());
      
    if (error) throw error;
    return data;
  },
  
  async getTodayComplaints() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*, customer:customers(name), product:products(name), engineer:users(name)')
      .gte('created_at', today.toISOString());
      
    if (error) throw error;
    return data;
  },
  
  // Engineer Dashboard Methods
  async getAssignedJobWorks(engineerId: string) {
    const { data, error } = await supabase
      .from('job_works')
      .select('*, customer:customers(name), product:products(name)')
      .eq('receiver_engineer_id', engineerId)
      .in('status', ['pending', 'in_progress']);
      
    if (error) throw error;
    return data;
  },
  
  // Customer Dashboard Methods
  async getCustomerProductCount(customerId: string) {
    const { count, error } = await supabase
      .from('product_sales')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId);
      
    if (error) throw error;
    return count;
  },
  
  async getCustomerExpiringContracts(customerId: string, days: number = 30) {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from('service_contracts')
      .select('*, product:products(name)')
      .eq('customer_id', customerId)
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', targetDate.toISOString().split('T')[0])
      .eq('status', 'active');
      
    if (error) throw error;
    return data;
  },
  
  async getCustomerActiveComplaints(customerId: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, product:products(name), engineer:users(name)')
      .eq('customer_id', customerId)
      .in('status', ['new', 'in_progress']);
      
    if (error) throw error;
    return data;
  },
  
  // Analytics Methods
  async getSalesAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    let startDate = new Date();
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    const { data, error } = await supabase
      .from('product_sales')
      .select('sale_date, total_cost')
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0])
      .order('sale_date');
      
    if (error) throw error;
    
    // Process data for chart display
    const processedData = processAnalyticsData(data, period, startDate, endDate);
    return processedData;
  },
  
  async getContractAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    // Similar implementation as getSalesAnalytics but for contracts
  },
  
  async getComplaintAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    // Similar implementation as getSalesAnalytics but for complaints
  }
};

// Helper function to process analytics data
function processAnalyticsData(data: any[], period: string, startDate: Date, endDate: Date) {
  // Implementation depends on the period and data structure
  // This is a placeholder for the actual implementation
  return data;
}
```

### Step 2: Create Role-Based Dashboard Widget Components

1. Create the directory structure:

```
src/modules/features/dashboard/components/widgets/
```

2. Create `AdminDashboardWidgets.tsx`:

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, List, Typography, Tag, Spin, Empty } from 'antd';
import { WarningOutlined, ClockCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { dashboardService } from '@/services/dashboardService';
import { StatCard } from '@/components/common/StatCard';
import { formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;

export const AdminDashboardWidgets: React.FC = () => {
  // Fetch expiring contracts
  const { data: expiringContracts, isLoading: isLoadingContracts } = useQuery(
    ['expiringContracts', 7],
    () => dashboardService.getExpiringContracts(7)
  );
  
  // Fetch pending complaints
  const { data: pendingComplaints, isLoading: isLoadingPendingComplaints } = useQuery(
    ['pendingComplaints', 7],
    () => dashboardService.getPendingComplaints(7)
  );
  
  // Fetch today's complaints
  const { data: todayComplaints, isLoading: isLoadingTodayComplaints } = useQuery(
    ['todayComplaints'],
    () => dashboardService.getTodayComplaints()
  );
  
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <StatCard
            title="Expiring Contracts"
            value={expiringContracts?.length || 0}
            icon={<WarningOutlined />}
            color="warning"
            loading={isLoadingContracts}
            description="Contracts expiring in next 7 days"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Pending Complaints"
            value={pendingComplaints?.length || 0}
            icon={<ClockCircleOutlined />}
            color="error"
            loading={isLoadingPendingComplaints}
            description="Complaints pending for more than 7 days"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Today's Complaints"
            value={todayComplaints?.length || 0}
            icon={<AlertOutlined />}
            color="primary"
            loading={isLoadingTodayComplaints}
            description="New complaints received today"
          />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Expiring Contracts" loading={isLoadingContracts}>
            {expiringContracts?.length ? (
              <List
                dataSource={expiringContracts}
                renderItem={(contract) => (
                  <List.Item>
                    <List.Item.Meta
                      title={contract.product.name}
                      description={`Customer: ${contract.customer.name}`}
                    />
                    <div>
                      <Tag color="warning">Expires: {formatDate(contract.end_date)}</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No contracts expiring soon" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Pending Complaints" loading={isLoadingPendingComplaints}>
            {pendingComplaints?.length ? (
              <List
                dataSource={pendingComplaints}
                renderItem={(complaint) => (
                  <List.Item>
                    <List.Item.Meta
                      title={complaint.title}
                      description={`Customer: ${complaint.customer.name}`}
                    />
                    <div>
                      <Tag color="error">Pending: {formatDate(complaint.created_at)}</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No pending complaints" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};
```

3. Create `EngineerDashboardWidgets.tsx`:

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, List, Typography, Tag, Empty } from 'antd';
import { ToolOutlined, ClockCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;

export const EngineerDashboardWidgets: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch pending complaints
  const { data: pendingComplaints, isLoading: isLoadingPendingComplaints } = useQuery(
    ['pendingComplaints', 7],
    () => dashboardService.getPendingComplaints(7)
  );
  
  // Fetch today's complaints
  const { data: todayComplaints, isLoading: isLoadingTodayComplaints } = useQuery(
    ['todayComplaints'],
    () => dashboardService.getTodayComplaints()
  );
  
  // Fetch assigned job works
  const { data: assignedJobWorks, isLoading: isLoadingJobWorks } = useQuery(
    ['assignedJobWorks', user?.id],
    () => dashboardService.getAssignedJobWorks(user?.id || ''),
    {
      enabled: !!user?.id
    }
  );
  
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <StatCard
            title="Assigned Jobs"
            value={assignedJobWorks?.length || 0}
            icon={<ToolOutlined />}
            color="primary"
            loading={isLoadingJobWorks}
            description="Jobs assigned to you"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Pending Complaints"
            value={pendingComplaints?.length || 0}
            icon={<ClockCircleOutlined />}
            color="error"
            loading={isLoadingPendingComplaints}
            description="Complaints pending for more than 7 days"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Today's Complaints"
            value={todayComplaints?.length || 0}
            icon={<AlertOutlined />}
            color="warning"
            loading={isLoadingTodayComplaints}
            description="New complaints received today"
          />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Assigned Job Works" loading={isLoadingJobWorks}>
            {assignedJobWorks?.length ? (
              <List
                dataSource={assignedJobWorks}
                renderItem={(job) => (
                  <List.Item>
                    <List.Item.Meta
                      title={job.job_ref_id}
                      description={`Customer: ${job.customer.name}`}
                    />
                    <div>
                      <Tag color={job.status === 'pending' ? 'default' : 'processing'}>
                        {job.status === 'pending' ? 'Pending' : 'In Progress'}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No job works assigned" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Today's Complaints" loading={isLoadingTodayComplaints}>
            {todayComplaints?.length ? (
              <List
                dataSource={todayComplaints}
                renderItem={(complaint) => (
                  <List.Item>
                    <List.Item.Meta
                      title={complaint.title}
                      description={`Customer: ${complaint.customer.name}`}
                    />
                    <div>
                      <Tag color="warning">New</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No new complaints today" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};
```

4. Create `CustomerDashboardWidgets.tsx`:

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, List, Typography, Tag, Empty } from 'antd';
import { ShoppingCartOutlined, FileTextOutlined, AlertOutlined } from '@ant-design/icons';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;

export const CustomerDashboardWidgets: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch product count
  const { data: productCount, isLoading: isLoadingProductCount } = useQuery(
    ['customerProductCount', user?.customer_id],
    () => dashboardService.getCustomerProductCount(user?.customer_id || ''),
    {
      enabled: !!user?.customer_id
    }
  );
  
  // Fetch expiring contracts
  const { data: expiringContracts, isLoading: isLoadingContracts } = useQuery(
    ['customerExpiringContracts', user?.customer_id, 30],
    () => dashboardService.getCustomerExpiringContracts(user?.customer_id || '', 30),
    {
      enabled: !!user?.customer_id
    }
  );
  
  // Fetch active complaints
  const { data: activeComplaints, isLoading: isLoadingComplaints } = useQuery(
    ['customerActiveComplaints', user?.customer_id],
    () => dashboardService.getCustomerActiveComplaints(user?.customer_id || ''),
    {
      enabled: !!user?.customer_id
    }
  );
  
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <StatCard
            title="Your Products"
            value={productCount || 0}
            icon={<ShoppingCartOutlined />}
            color="primary"
            loading={isLoadingProductCount}
            description="Total products purchased"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Expiring Contracts"
            value={expiringContracts?.length || 0}
            icon={<FileTextOutlined />}
            color="warning"
            loading={isLoadingContracts}
            description="Contracts expiring in next 30 days"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Active Complaints"
            value={activeComplaints?.length || 0}
            icon={<AlertOutlined />}
            color="error"
            loading={isLoadingComplaints}
            description="Your active complaints"
          />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Expiring Contracts" loading={isLoadingContracts}>
            {expiringContracts?.length ? (
              <List
                dataSource={expiringContracts}
                renderItem={(contract) => (
                  <List.Item>
                    <List.Item.Meta
                      title={contract.product.name}
                      description={`Contract #: ${contract.contract_number}`}
                    />
                    <div>
                      <Tag color="warning">Expires: {formatDate(contract.end_date)}</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No contracts expiring soon" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Active Complaints" loading={isLoadingComplaints}>
            {activeComplaints?.length ? (
              <List
                dataSource={activeComplaints}
                renderItem={(complaint) => (
                  <List.Item>
                    <List.Item.Meta
                      title={complaint.title}
                      description={`Product: ${complaint.product.name}`}
                    />
                    <div>
                      <Tag color={complaint.status === 'new' ? 'default' : 'processing'}>
                        {complaint.status === 'new' ? 'New' : 'In Progress'}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No active complaints" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};
```

### Step 3: Create Analytics Components

1. Create the directory structure:

```
src/modules/features/dashboard/components/analytics/
```

2. Create `SalesAnalytics.tsx`:

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Radio, Spin, Empty } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService } from '@/services/dashboardService';

type PeriodType = 'week' | 'month' | 'quarter' | 'year';

export const SalesAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  
  const { data: salesData, isLoading } = useQuery(
    ['salesAnalytics', period],
    () => dashboardService.getSalesAnalytics(period)
  );
  
  const handlePeriodChange = (e: any) => {
    setPeriod(e.target.value);
  };
  
  return (
    <Card 
      title="Sales Analytics" 
      extra={
        <Radio.Group value={period} onChange={handlePeriodChange}>
          <Radio.Button value="week">Week</Radio.Button>
          <Radio.Button value="month">Month</Radio.Button>
          <Radio.Button value="quarter">Quarter</Radio.Button>
          <Radio.Button value="year">Year</Radio.Button>
        </Radio.Group>
      }
    >
      {isLoading ? (
        <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </div>
      ) : salesData?.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={salesData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#1890ff" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="No sales data available" style={{ height: 300 }} />
      )}
    </Card>
  );
};
```

3. Create similar components for `ContractAnalytics.tsx` and `ComplaintAnalytics.tsx`.

### Step 4: Update Dashboard Page

1. Open `src/modules/features/dashboard/views/DashboardPage.tsx` and update it:

```typescript
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminDashboardWidgets } from '../components/widgets/AdminDashboardWidgets';
import { EngineerDashboardWidgets } from '../components/widgets/EngineerDashboardWidgets';
import { CustomerDashboardWidgets } from '../components/widgets/CustomerDashboardWidgets';
import { SalesAnalytics } from '../components/analytics/SalesAnalytics';
import { ContractAnalytics } from '../components/analytics/ContractAnalytics';
import { ComplaintAnalytics } from '../components/analytics/ComplaintAnalytics';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  const renderDashboardWidgets = () => {
    switch (user?.role) {
      case 'admin':
      case 'super_admin':
        return <AdminDashboardWidgets />;
      case 'engineer':
        return <EngineerDashboardWidgets />;
      case 'customer':
        return <CustomerDashboardWidgets />;
      default:
        return <AdminDashboardWidgets />;
    }
  };
  
  const renderAnalytics = () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return (
        <div style={{ marginTop: 24 }}>
          <SalesAnalytics />
          <div style={{ marginTop: 16 }}>
            <ContractAnalytics />
          </div>
          <div style={{ marginTop: 16 }}>
            <ComplaintAnalytics />
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}`}
        description="Your personalized dashboard"
        breadcrumb={{
          items: [
            { title: 'Home' },
            { title: 'Dashboard' }
          ]
        }}
      />
      
      <div style={{ padding: 24 }}>
        {renderDashboardWidgets()}
        {renderAnalytics()}
      </div>
    </>
  );
};
```

### Step 5: Create Utility Functions

1. Create `src/utils/formatters.ts` if it doesn't exist:

```typescript
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
```

### Step 6: Testing

1. Test the dashboard with different user roles:
   - Log in as an admin user
   - Log in as an engineer user
   - Log in as a customer user

2. Verify that the correct widgets are displayed for each role

3. Test the analytics components:
   - Change the period and verify that the data updates
   - Check that the charts render correctly

### Step 7: Optimization

1. Add error handling:

```typescript
// Example error handling in a component
const { data: expiringContracts, isLoading, error } = useQuery(...);

if (error) {
  return (
    <Alert
      message="Error"
      description="Failed to load expiring contracts. Please try again later."
      type="error"
      showIcon
    />
  );
}
```

2. Add loading states:

```typescript
// Example loading state in a component
if (isLoading) {
  return <Spin size="large" />;
}
```

3. Implement query caching:

```typescript
// Configure React Query client with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

## Conclusion

This guide provides a comprehensive approach to implementing the role-based dashboard feature in the PDS-CRM Application. By following these steps, you will create a dashboard that displays different widgets based on the user's role, providing relevant information to each type of user.

Remember to test thoroughly with different user roles and ensure that the dashboard is responsive and performs well on all devices.