# Product Sales Standardization - Verification Checklist
**Date**: January 30, 2025  
**Purpose**: Verify all analytics dashboard fixes are working correctly

---

## Quick Start

### Mode 1: Test with Mock Data
```bash
# Update .env
VITE_API_MODE=mock

# Start development server
npm run dev

# Navigate to: http://localhost:5173/product-sales/analytics
```

### Mode 2: Test with Supabase
```bash
# Update .env
VITE_API_MODE=supabase

# Make sure Supabase is running (Docker or cloud)
# Start development server
npm run dev

# Navigate to: http://localhost:5173/product-sales/analytics
```

---

## Dashboard Verification Checklist

### ✅ Page Load
- [ ] Analytics page loads without errors
- [ ] No 404 or 500 errors in console
- [ ] No TypeScript errors about ProductSalesAnalytics type
- [ ] No warnings about undefined tenant context

### ✅ Data Display - Metrics Cards
- [ ] **Total Sales**: Shows numeric value (e.g., "45")
- [ ] **Total Revenue**: Shows formatted currency (e.g., "$234,567.89")
- [ ] **Average Sale Value**: Shows currency (e.g., "$5,214.22")
- [ ] **Completed Sales**: Shows count (e.g., "32")
- [ ] **Pending Sales**: Shows count (e.g., "13")

### ✅ Data Display - Charts and Tables

**Monthly Revenue Chart**:
- [ ] Chart renders without errors
- [ ] Shows 12 months of data (or YTD if partial year)
- [ ] X-axis shows months correctly
- [ ] Y-axis shows revenue values
- [ ] Hover shows correct month and revenue

**Top Products Table**:
- [ ] Table renders with data
- [ ] Shows Product ID, Product Name, Quantity, Revenue columns
- [ ] Data is sorted by revenue (descending)
- [ ] All product names display correctly
- [ ] Numbers are properly formatted

**Top Customers Table**:
- [ ] Table renders with data
- [ ] Shows Customer ID, Customer Name, Sales Count, Revenue columns
- [ ] Data is sorted by revenue (descending)
- [ ] All customer names display correctly
- [ ] Revenue values are formatted with currency

**Status Distribution Pie Chart**:
- [ ] Pie chart renders
- [ ] Shows all status categories (new, renewed, expired)
- [ ] Each slice labeled with status and percentage
- [ ] Colors are distinct for each status
- [ ] Hover tooltip shows percentage

### ✅ Data Consistency

**Mock Mode Verification**:
- [ ] Same data loads consistently on page refresh
- [ ] Numbers match documented seed data
- [ ] All 5 product sales from mock data appear in top products
- [ ] All 5 customers from mock data appear in top customers

**Supabase Mode Verification**:
- [ ] Data loads from PostgreSQL
- [ ] Numbers change if you add/update records via panel
- [ ] Only current tenant's data shows (multi-tenant isolation)
- [ ] No sensitive data from other tenants visible

### ✅ Type Safety Verification

In browser console (F12):
```javascript
// These should NOT produce errors:
console.log('Page loaded successfully');

// Check for type warnings:
// Look for: "cannot read property 'totalSales' of undefined"
// Should NOT appear if fix is working
```

### ✅ Network Requests (Browser DevTools)

**Network Tab**:
1. Open DevTools → Network tab
2. Load analytics page
3. Look for network request to backend:
   - **Mock Mode**: Should see no network requests (data is local)
   - **Supabase Mode**: Should see request to Supabase API
4. Response should include analytics data:
   ```json
   {
     "totalSales": 45,
     "totalRevenue": 567890.50,
     "averageSaleValue": 12619.79,
     ...
   }
   ```

### ✅ Console Errors Check

Press F12 → Console tab and verify:
- ❌ No errors with "ProductSalesAnalytics"
- ❌ No errors with "undefined method getAnalytics"
- ❌ No errors with "Cannot read property 'totalSales'"
- ❌ No errors with "Missing tenant context"
- ❌ No "Unauthorized" errors
- ✅ Info message about Service Factory mode (e.g., "Service Factory initialized with mode: mock")

---

## Advanced Verification

### Test Multi-Tenant Isolation (Supabase Mode)

1. Login as User in Tenant A
2. View analytics dashboard - note the numbers
3. Switch to Tenant B (if your app supports this)
4. View analytics dashboard - should show different numbers
5. **Verify**: Each tenant only sees their own data

### Test Mode Switching

1. Start with `VITE_API_MODE=mock`
2. Load analytics page - note the data
3. Stop server (Ctrl+C)
4. Change `.env` to `VITE_API_MODE=supabase`
5. Restart server
6. Load analytics page - should work with Supabase data
7. **Verify**: Both modes work without errors

### Test Field Name Transformation

Open Network tab or React DevTools:
1. In Supabase mode, check the API response
2. Verify response contains camelCase fields:
   - `totalSales` (not `total_sales`)
   - `totalRevenue` (not `total_revenue`)
   - `averageSaleValue` (not `average_deal_size`)
   - `revenueByMonth` (not `sales_by_month`)
   - `byStatus` (not `status_distribution`)

---

## Expected Data (Mock Mode)

From seed data in productSaleService.ts:

**Metrics**:
- Total Sales: 5 products
- Total Revenue: ~$265,300 (sum of all costs)
- Average Sale Value: ~$53,060

**Top Products**:
1. Hydraulic Press Machine - $75,000
2. Sensor Array Kit - $7,000
3. Chemical Pump - $5,200
4. Power Tool Kit - $2,100
5. Industrial Compressor - $175,000 (highest)

**Top Customers**:
1. ABC Manufacturing - $75,000
2. XYZ Logistics - $7,000
3. Global Tech - $5,200
4. Standard Tools - $2,100
5. Heavy Industries - $175,000 (highest)

**Status Distribution**:
- New: 4 sales (80%)
- Renewed: 1 sales (20%)
- Expired: 0 sales (0%)

---

## Troubleshooting

### Issue: "Cannot read property 'totalSales' of undefined"

**Cause**: Service returning wrong data structure or null
**Solution**:
1. Check console for service factory mode
2. Verify `.env` has correct `VITE_API_MODE`
3. Check network request shows DTO fields (camelCase)
4. Look for errors in service implementation

### Issue: Analytics page is blank/no data

**Cause**: Service method not found or tenant context missing
**Solution**:
1. Check browser console for errors
2. Verify `useAuth()` hook returns current user with `tenant_id`
3. Verify service factory is initialized
4. Check Supabase is running (if in Supabase mode)

### Issue: "Unauthorized" error in Supabase mode

**Cause**: Likely using mock service against Supabase authentication
**Solution**:
1. Verify `VITE_API_MODE=supabase` in `.env`
2. Verify hook imports from `serviceFactory`, not direct service
3. Clear browser cache and localStorage
4. Restart development server

### Issue: Different data in mock vs Supabase modes

**Expected**: Mock mode shows seed data, Supabase shows actual database
**Verify**:
1. In mock mode: Check seed data matches output
2. In Supabase mode: Add test data and verify it appears
3. Both modes should return valid ProductSalesAnalyticsDTO structure

---

## Success Indicators

✅ **All criteria met** when:
1. Dashboard loads in both mock and Supabase modes
2. All metric cards display with correct values
3. All charts and tables render properly
4. Console has no ProductSalesAnalytics or data structure errors
5. Type checking passes (TypeScript shows no errors)
6. Multi-tenant isolation works (if testable)
7. Field names are camelCase in network requests

---

## Documentation References

For detailed implementation information, see:
- `PROD_SALES_STANDARDIZATION_COMPLETION_2025_01_30.md` - Full implementation details
- `PROD_SALES_STANDARDIZATION_QUICK_FIX_2025_01_30.md` - Quick reference guide
- `.zencoder/rules/repo.md` - Service factory pattern documentation

---

**Status**: Ready for verification testing  
**Last Updated**: 2025-01-30