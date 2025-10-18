# Dashboard - Quick Start Guide

## What Changed?

### Before (Static Mock Data)
```typescript
// ❌ Hardcoded values
getDashboardStats(): Promise<DashboardStats> {
  return {
    totalCustomers: 150,      // ← Hardcoded
    totalDeals: 45,           // ← Hardcoded
    totalRevenue: 125000,     // ← Hardcoded
    // ...
  };
}
```

### After (Dynamic Real Data)
```typescript
// ✅ Real data from Supabase
getDashboardStats(): Promise<DashboardStats> {
  // Fetch from Supabase tables
  const customers = await this.customerService.getCustomers();
  const sales = await this.salesService.getSales();
  
  return {
    totalCustomers: customers.length,  // ← Real count
    totalDeals: sales.length,          // ← Real deals
    totalRevenue: sales.sum(v => v.value), // ← Calculated
    // ...
  };
}
```

## Key Files Updated

### 1. **dashboardService.ts** - Core Service
```
✅ Fetches real data from Supabase
✅ Intelligent error handling with fallback
✅ Parallel data fetching (Promise.allSettled)
✅ Data aggregation and calculation
```

### 2. **mockData.ts** - Fallback Data (NEW)
```
✅ Mock data for when Supabase is unavailable
✅ Used as graceful degradation fallback
✅ Easy to maintain and update
```

### 3. **useDashboard.ts** - React Hooks
```
✅ Added useSalesPipeline() hook
✅ React Query integration for caching
✅ Proper loading states
```

### 4. **DashboardPage.tsx** - UI Component
```
✅ Updated Sales Pipeline section (dynamic)
✅ Added more ticket statistics
✅ Proper loading indicators
```

### 5. **BaseService.ts** - Base Class
```
✅ Added handleError() method
✅ Improved error logging
```

## How to Verify It's Working

### 1. Check Console Logs
Open DevTools (F12) → Console tab

You should see:
```
🔄 Fetching dashboard statistics from Supabase...
✅ Dashboard statistics loaded successfully
```

### 2. Verify Data Is Real
Navigate to: `http://localhost:5173/dashboard`

**Check these values:**
- Total Customers count matches active customers in Supabase
- Active Deals matches won sales
- Total Revenue is sum of sales amounts
- Top Customers shows real customer names and values
- Sales Pipeline shows actual stage breakdown

### 3. Test Fallback (Optional)
Temporarily disconnect Supabase to test mock data fallback:
1. In DevTools → Network tab
2. Set to "Offline" mode
3. Reload dashboard
4. Should still see mock data displayed

## Data Sources

### Real Data From Supabase

| Metric | Source | How It's Calculated |
|--------|--------|-------------------|
| Total Customers | `customers` table | `COUNT(*) WHERE status='active'` |
| Active Deals | `sales` table | `COUNT(*) WHERE status='won'` |
| Total Revenue | `sales` table | `SUM(value) WHERE status='won'` |
| Recent Activity | `customers` + `sales` | Latest records combined |
| Top Customers | `sales` + `customers` | Grouped by customer, sorted by value |
| Sales Pipeline | `sales` table | Grouped by stage field |
| Ticket Stats | Mock (placeholder) | Ready for integration |

### Mock Data Fallback

Located in: `src/modules/features/dashboard/services/mockData.ts`

Used when:
- Supabase connection fails
- Network error occurs
- Service is unavailable

## Extending the Dashboard

### Add a New Metric

#### Step 1: Add to Service
```typescript
// In dashboardService.ts
async fetchMyMetric(): Promise<MyType> {
  try {
    const data = await this.myService.getData();
    return data;
  } catch (error) {
    this.handleError('Failed to fetch my metric', error);
    throw error;
  }
}
```

#### Step 2: Add to Main Stats
```typescript
// In getDashboardStats()
const [myData] = await Promise.allSettled([
  this.fetchMyMetric(),
  // ...
]);

return {
  myMetric: myData.status === 'fulfilled' ? myData.value : getMockData().myMetric,
  // ...
};
```

#### Step 3: Create Hook
```typescript
// In useDashboard.ts
export const useMyMetric = () => {
  const dashboardService = useService<DashboardService>('dashboardService');
  return useQuery({
    queryKey: [...dashboardKeys.all, 'myMetric'],
    queryFn: () => dashboardService.fetchMyMetric(),
    staleTime: 5 * 60 * 1000,
  });
};
```

#### Step 4: Use in UI
```typescript
// In DashboardPage.tsx
const { data: myMetric, isLoading } = useMyMetric();

return <div>{myMetric}</div>;
```

## Common Tasks

### Update Mock Data
```typescript
// mockData.ts
export const getMockData = (): DashboardStats => ({
  totalCustomers: 200,  // Change here
  totalDeals: 60,       // Change here
  // ...
});
```

### Adjust Cache Stale Time
```typescript
// useDashboard.ts
export const useDashboardStats = () => {
  return useQuery({
    staleTime: 10 * 60 * 1000,  // Change to 10 minutes
    // ...
  });
};
```

### Change Data Refresh Rate
```typescript
// In hook
staleTime: 2 * 60 * 1000,        // Data is fresh for 2 minutes
refetchInterval: 1 * 60 * 1000,  // Auto-refetch every 1 minute
```

### Test with Different Data
1. Use Supabase Studio to add test data
2. Dashboard will automatically reflect changes
3. No code changes needed

## Debugging

### Enable Verbose Logging
```typescript
// In dashboardService.ts, constructor
this.customerService = new SupabaseCustomerService();
this.customerService.logEnabled = true;  // Enable logs
```

### Use React Query DevTools
```bash
# Already included, press Ctrl+Q to open
```

### Check Supabase Connection
```typescript
// In browser console
import { getSupabaseClient } from '@/services/supabase/client';
const client = getSupabaseClient();
console.log(client);  // Should show client object
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for Supabase API calls
4. Check response data

## Performance Tips

### For Large Datasets
1. **Pagination**: Limit records fetched
```typescript
async fetchData(limit: number = 10) {
  return await this.service.getData({ limit });
}
```

2. **Selective Fields**: Fetch only needed columns
```typescript
.select('id, name, value')  // Only these fields
```

3. **Filtering**: Apply server-side filters
```typescript
.where('status', '=', 'active')  // Server filters first
```

4. **Caching**: Increase stale time
```typescript
staleTime: 15 * 60 * 1000  // 15 minutes
```

### Monitor Performance
- Open DevTools → Performance tab
- Record rendering
- Look for bottlenecks
- Check React Query devtools for cache hits

## Troubleshooting

### Dashboard shows mock data instead of real data
**Possible causes:**
1. Supabase not connected → Check `.env` file
2. Tables don't exist → Run migrations
3. No data in tables → Seed database

**Solution:**
```bash
# 1. Check .env
cat .env | grep SUPABASE

# 2. Run migrations
npm run supabase:migrations

# 3. Seed data
npm run supabase:seed
```

### Dashboard is loading slowly
**Solution:**
1. Check React Query devtools
2. Look at network requests
3. Verify Supabase indexes
4. Consider pagination

### Some data shows but not all
**Solution:**
1. Check console for errors
2. Each metric fails independently
3. Missing data sources gracefully use mock data
4. Add new data sources as needed

### No data at all (blank dashboard)
**Solution:**
1. Verify browser console (F12)
2. Check Supabase connection
3. Verify `.env` configuration
4. Test with mock data toggle

## Best Practices

✅ **Always use fallback data** - Users see something even if data fails  
✅ **Cache appropriately** - Balance freshness vs performance  
✅ **Log errors** - Console shows what failed and why  
✅ **Test offline** - Verify mock data works  
✅ **Type-safe queries** - Use TypeScript for data  
✅ **Lazy load data** - Only fetch what's visible  
✅ **Monitor performance** - Use React Query devtools  

## Quick Commands

```bash
# Start development server
npm run dev

# View dashboard
open http://localhost:5173/dashboard

# Check Supabase connection
npm run test:supabase

# Seed test data
npm run supabase:seed

# View React Query devtools
# Press Ctrl+Q in browser when dev server running
```

## Next Steps

1. **Integrate Tickets** - Add ticket service queries
2. **Add Real-Time** - Enable Supabase realtime subscriptions
3. **Custom Dashboards** - Allow users to customize widgets
4. **Export Reports** - Generate PDF/Excel reports
5. **Scheduled Tasks** - Refresh data on schedule

---

**Need Help?** Check the main `DASHBOARD_ARCHITECTURE.md` file for detailed information!