---
title: Product Sales Standardization - Quick Fix Reference
description: Line-by-line code changes for Product Sales standardization
date: 2025-01-30
author: AI Agent
version: 1.0
status: active
category: implementation-guide
---

# Product Sales Standardization - Quick Fix Reference 🔧

## Overview
Follow these exact changes to standardize the Product Sales module. All line numbers are approximate - search for the exact code.

---

## 1️⃣ Fix: useProductSalesAnalytics Hook

**File**: `src/modules/features/product-sales/hooks/useProductSalesAnalytics.ts`

### Change 1: Import Factory Service
```diff
- import { useService } from '@/modules/core/hooks/useService';
+ import { productSaleService as factoryProductSaleService } from '@/services/serviceFactory';
+ import { useAuth } from '@/contexts/AuthContext'; // Add if not already imported
```

### Change 2: Get Tenant ID in Hook
```diff
export const useProductSalesAnalytics = (dateRange?: { startDate: string; endDate: string }) => {
+ const { user } = useAuth();
+ const tenantId = user?.tenant_id || 'default-tenant';
  const { setAnalytics, setError, clearError } = useProductSalesStore();
- const service = useService<any>('productSaleService');
```

### Change 3: Use Factory Service & Remove DateRange
```diff
  return useQuery({
    queryKey: [
      ...productSalesKeys.analytics(),
-     dateRange ? `${dateRange.startDate}-${dateRange.endDate}` : 'all-time',
    ],
    queryFn: async () => {
      clearError();
      try {
-       const analytics: ProductSalesAnalytics = await service.getAnalytics(dateRange);
+       const analytics = await factoryProductSaleService.getProductSalesAnalytics(tenantId);
```

### Change 4: Simplify Data Transformation
```diff
        // Transform and update store
        const analyticsState = {
-         totalSales: analytics.total_sales || 0,
-         totalRevenue: analytics.total_revenue || 0,
-         averageDealSize: analytics.average_deal_size || 0,
-         topProducts: analytics.top_products?.map((p) => ({
+         totalSales: analytics.totalSales ?? 0,
+         totalRevenue: analytics.totalRevenue ?? 0,
+         averageSaleValue: analytics.averageSaleValue ?? 0,
+         topProducts: analytics.topProducts?.map((p) => ({
-           id: p.product_id,
-           name: p.product_name,
-           count: p.total_sales,
+           id: p.productId,
+           name: p.productName,
+           count: p.quantity,
            revenue: p.revenue,
          })) || [],
-         topCustomers: analytics.top_customers?.map((c) => ({
+         topCustomers: analytics.topCustomers?.map((c) => ({
-           id: c.customer_id,
-           name: c.customer_name,
-           count: c.total_sales,
+           id: c.customerId,
+           name: c.customerName,
+           count: c.totalSales,
            revenue: c.revenue,
          })) || [],
-         statusDistribution: (analytics.status_distribution || []).reduce(
+         statusDistribution: (analytics.byStatus || []).reduce(
            (acc, s) => ({
              ...acc,
              [s.status]: s.count,
            }),
            {}
          ),
-         monthlyTrend: analytics.sales_by_month?.map((m) => ({
+         monthlyTrend: analytics.revenueByMonth ? Object.entries(analytics.revenueByMonth).map(([month, revenue]) => ({
-           month: m.month,
-           sales: m.sales_count,
-           revenue: m.revenue,
+           month,
+           sales: 0, // Calculated from topProducts if needed
+           revenue,
          })) || [],
        };
```

### Change 5: Update Import Type
```diff
- import { ProductSalesAnalytics } from '@/types/productSales';
+ import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
```

---

## 2️⃣ Fix: Mock Service (productSaleService.ts)

**File**: `src/services/productSaleService.ts`

### Change 1: Rename Method
```diff
- async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalytics> {
-   return this.getAnalytics(tenantId);
- }
-
- // Get analytics data
- async getAnalytics(tenantId?: string): Promise<ProductSalesAnalytics> {
+ // Get analytics data
+ async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO> {
```

### Change 2: Return camelCase Fields
```diff
      return {
-       total_sales: totalSales,
-       total_revenue: totalRevenue,
-       average_deal_size: averageDealSize,
-       sales_by_month: salesByMonth,
-       top_products: topProducts,
-       top_customers: topCustomers,
-       status_distribution: statusDistribution,
-       warranty_expiring_soon: warrantyExpiringSoon
+       totalSales: totalSales,
+       totalRevenue: totalRevenue,
+       averageSaleValue: averageDealSize,
+       revenueByMonth: Object.fromEntries(
+         salesByMonth.map(m => [m.month, m.revenue])
+       ),
+       topProducts: topProducts.map(p => ({
+         productId: p.product_id,
+         productName: p.product_name,
+         quantity: p.units_sold,
+         revenue: p.total_revenue,
+       })),
+       topCustomers: topCustomers.map(c => ({
+         customerId: c.customer_id,
+         customerName: c.customer_name,
+         totalSales: c.total_sales,
+         revenue: c.total_revenue,
+       })),
+       byStatus: statusDistribution,
+       lastUpdated: new Date().toISOString(),
      };
```

### Change 3: Add Import
```diff
+ import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
```

---

## 3️⃣ Fix: Supabase Service (supabase/productSaleService.ts)

**File**: `src/services/supabase/productSaleService.ts`

### Change 1: Add TenantId Parameter
```diff
- async getProductSalesAnalytics(): Promise<ProductSalesAnalytics> {
+ async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO> {
    try {
-     const tenantId = multiTenantService.getCurrentTenantId();
+     const finalTenantId = tenantId || multiTenantService.getCurrentTenantId();
```

### Change 2: Update Query to Use TenantId
```diff
      // Get all product sales
      const { data: sales, error: salesError } = await supabaseClient
        .from('product_sales')
        .select('*')
-       .eq('tenant_id', tenantId);
+       .eq('tenant_id', finalTenantId);
```

### Change 3: Return camelCase Fields
```diff
      if (mappedSales.length === 0) {
        return {
-         total_sales: 0,
-         total_revenue: 0,
-         average_deal_size: 0,
-         sales_by_month: [],
-         top_products: [],
-         top_customers: [],
-         status_distribution: [],
-         warranty_expiring_soon: []
+         totalSales: 0,
+         totalRevenue: 0,
+         averageSaleValue: 0,
+         revenueByMonth: {},
+         topProducts: [],
+         topCustomers: [],
+         byStatus: [],
+         lastUpdated: new Date().toISOString(),
        };
      }
```

### Change 4: Update Monthly Calculation
```diff
      const salesByMonth = Array.from(salesByMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
-       .map(([month, data]) => ({
+       .map(([month, _data]) => [
+         month,
+         data.revenue
+       ]));
+     
+     const revenueByMonth = Object.fromEntries(salesByMonth.map(([month, revenue]) => [month, revenue]));
```

### Change 5: Update Top Products Mapping
```diff
      const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([key, data]) => {
          const [productId, productName] = key.split('|');
          return {
-           product_id: productId,
-           product_name: productName,
-           total_sales: data.count,
-           total_revenue: data.revenue,
-           units_sold: data.units
+           productId: productId,
+           productName: productName,
+           quantity: data.units,
+           revenue: data.revenue,
          };
        });
```

### Change 6: Update Top Customers Mapping
```diff
      const topCustomers = Array.from(customerMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([key, data]) => {
          const [customerId, customerName] = key.split('|');
          return {
-           customer_id: customerId,
-           customer_name: customerName,
-           total_sales: data.count,
-           total_revenue: data.revenue,
-           last_purchase: data.lastPurchase
+           customerId: customerId,
+           customerName: customerName,
+           totalSales: data.count,
+           revenue: data.revenue,
          };
        });
```

### Change 7: Update Status Distribution & Return
```diff
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalSales) * 100
      }));

      // ... warranty calculation ...

      return {
-       total_sales: totalSales,
-       total_revenue: totalRevenue,
-       average_deal_size: averageDealSize,
-       sales_by_month: salesByMonth,
-       top_products: topProducts,
-       top_customers: topCustomers,
-       status_distribution: statusDistribution,
-       warranty_expiring_soon: warrantyExpiringSoon
+       totalSales: totalSales,
+       totalRevenue: totalRevenue,
+       averageSaleValue: averageDealSize,
+       revenueByMonth: revenueByMonth,
+       topProducts: topProducts,
+       topCustomers: topCustomers,
+       byStatus: statusDistribution,
+       lastUpdated: new Date().toISOString(),
      };
```

### Change 8: Add Import
```diff
+ import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
```

---

## 4️⃣ Fix: Service Factory (serviceFactory.ts)

**File**: `src/services/serviceFactory.ts`

### Change: Verify Export (Should Already Be Correct)
```typescript
export const productSaleService = {
  // ... other methods ...
  getProductSalesAnalytics: (...args: Parameters<typeof supabaseProductSaleService.getProductSalesAnalytics>) =>
    serviceFactory.getProductSaleService().getProductSalesAnalytics(...args),
  // ... other methods ...
};
```

✅ This should already be correct. Verify it exists and matches.

---

## 5️⃣ Update Component Type Imports

**File**: `src/modules/features/product-sales/components/ProductSalesAnalyticsDashboard.tsx`

```diff
- import { ProductSalesAnalytics } from '@/types/productSales';
+ import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
```

---

## 🧪 Testing After Changes

### Test 1: Mock Mode
```bash
# In .env file:
VITE_API_MODE=mock

# Run development server
npm run dev

# In browser:
1. Navigate to Product Sales module
2. Open analytics dashboard
3. Verify all metrics load
4. Open browser DevTools → Console
5. Check for errors
```

### Test 2: Supabase Mode
```bash
# In .env file:
VITE_API_MODE=supabase

# Run development server
npm run dev

# In browser:
1. Navigate to Product Sales module
2. Open analytics dashboard
3. Verify all metrics load
4. Open browser DevTools → Console
5. Check for errors
```

### Test 3: Linting & Build
```bash
npm run lint
npm run build
```

Both should show **0 errors**.

---

## 📋 Implementation Checklist

- [ ] Update useProductSalesAnalytics.ts hook (all 5 changes)
- [ ] Update productSaleService.ts mock (3 changes)
- [ ] Update supabase/productSaleService.ts (8 changes)
- [ ] Verify serviceFactory.ts exports
- [ ] Update component imports
- [ ] Test mock mode - no errors
- [ ] Test Supabase mode - no errors
- [ ] Run: npm run lint → 0 errors
- [ ] Run: npm run build → 0 errors
- [ ] Browser console clean - no errors
- [ ] Analytics dashboard displays data correctly
- [ ] All fields show correct values

---

## 🎯 Success Indicators

After all changes:

✅ Dashboard loads without errors  
✅ All analytics metrics display  
✅ Mock and Supabase modes identical  
✅ No console errors  
✅ Lint: 0 errors  
✅ Build: 0 errors  

---

**Estimated Time**: 45 minutes to 1 hour  
**Complexity**: Medium  
**Risk Level**: Low (changes are localized to one module)
