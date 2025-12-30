# Customer Computed Fields - Complete Layer Cleanup

## Issue Summary
The columns `total_sales_amount`, `total_orders`, `average_order_value`, and `last_purchase_date` were **DROPPED** from the `customers` database table and moved to a materialized view called `customer_summary`. The application code was still trying to SELECT and UPDATE these non-existent columns, causing 400 Bad Request errors.

## Database Schema Changes (Already Applied)
```sql
-- These columns were removed from customers table (line 5679-5682 in COMPLETE_DATABASE_EXPORT.sql):
ALTER TABLE customers
DROP COLUMN IF EXISTS total_sales_amount,
DROP COLUMN IF EXISTS total_orders,
DROP COLUMN IF EXISTS average_order_value,
DROP COLUMN IF EXISTS last_purchase_date;
```

These fields now exist **ONLY** in the `customer_summary` materialized view which aggregates data from the `sales` (deals) table.

## Layer-by-Layer Fixes Applied

### ✅ Layer 1: Database Schema
**Status**: Already fixed by migration
- Columns dropped from `customers` table
- Created `customer_summary` materialized view with computed aggregations
- Created `customers_with_stats` view for easy querying with stats

### ✅ Layer 2: Repository (CustomerRepository.ts)
**Fixed**: Removed computed fields from type definitions and configuration

**Changes Made**:
1. **CustomerRow Interface**: Removed the 4 computed fields
   ```typescript
   // ❌ REMOVED (they don't exist in DB):
   total_sales_amount?: number;
   total_orders?: number;
   average_order_value?: number;
   last_purchase_date?: string;
   ```

2. **selectFields Configuration**: Removed computed fields from SELECT clause
   ```typescript
   // Before: Included non-existent columns causing 400 errors
   selectFields: '...total_sales_amount,total_orders,average_order_value,last_purchase_date...'
   
   // After: Only real columns from customers table
   selectFields: 'id,company_name,contact_name,...,tags,...' // No computed fields
   ```

3. **readOnlyFields Configuration**: Removed computed fields
   ```typescript
   // Before: Listed as read-only but don't exist
   readOnlyFields: [..., 'total_sales_amount', 'total_orders', 'average_order_value', 'last_purchase_date']
   
   // After: Only real read-only fields
   readOnlyFields: ['id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id']
   ```

### ✅ Layer 3: Mapper Functions (CustomerRepository.ts)
**Fixed**: Mapper now sets computed fields to undefined, unmapper never includes them

**mapCustomerRow (DB → App)**:
```typescript
// Sets computed fields to undefined since they don't come from base table
totalSalesAmount: undefined,
totalOrders: undefined,
averageOrderValue: undefined,
lastPurchaseDate: undefined,
```

**unmapCustomerRow (App → DB)**:
```typescript
// Never maps computed fields - they're explicitly excluded
// Only maps user-editable fields like company_name, contact_name, etc.
```

### ✅ Layer 4: Service (customerService.ts)
**Fixed**: getCustomerStats() now queries from customer_summary view

**Before** (BROKEN):
```typescript
const { data } = await supabaseClient
  .from('customers')  // ❌ These columns don't exist here
  .select('total_sales_amount, total_orders, average_order_value, last_purchase_date')
```

**After** (FIXED):
```typescript
const { data } = await supabaseClient
  .from('customer_summary')  // ✅ Correct view with computed fields
  .select('total_sales_amount, total_orders, average_order_value, last_purchase_date')
  .eq('id', customerId)
  .single();

// Fallback for customers with no sales yet
if (error?.code === 'PGRST116') {
  return { totalSalesAmount: 0, totalOrders: 0, ... };
}
```

### ✅ Layer 5: TypeScript Types (crm.ts)
**Status**: Already correct
- Fields remain in `Customer` interface as **optional** (`totalSalesAmount?: number`)
- This is correct because:
  - They may be undefined from base table queries
  - They can be populated via `getCustomerStats()` or when querying views
  - TypeScript safety maintained with optional types

### ✅ Layer 6: Hooks (useCustomers.ts)
**Fixed**: Added documentation about computed fields limitation

**useCustomerAnalytics Hook**:
- Added comments explaining fields will be undefined from base queries
- Documented TODO: Should query customer_summary view directly for analytics
- Current implementation returns 0 for computed metrics (safe fallback)

### ✅ Layer 7: Mock Service (mockCustomerService.ts)
**Status**: Already correct
- Mock data doesn't include computed fields in customer objects
- `getCustomerStats()` returns mock statistics separately
- Consistent with real service behavior

### ✅ Layer 8: UI Components
**Status**: No changes needed
- Forms never allowed editing these fields (they were always computed)
- Display components handle optional fields correctly with `|| 0` fallbacks
- Analytics page uses separate stats service (correct pattern)

## How to Use Computed Fields Now

### ❌ DON'T: Try to get them from base customer queries
```typescript
const customer = await customerService.findById(id);
console.log(customer.totalSalesAmount); // ❌ Will be undefined
```

### ✅ DO: Use getCustomerStats() service method
```typescript
const customer = await customerService.findById(id);
const stats = await customerService.getCustomerStats(id);
console.log(stats.totalSalesAmount); // ✅ Computed from customer_summary view
```

### ✅ DO: Query customer_summary or customers_with_stats view directly
```typescript
const { data } = await supabaseClient
  .from('customer_summary')  // or 'customers_with_stats'
  .select('id, company_name, total_sales_amount, total_orders')
  .eq('id', customerId);
```

## Views Available

### customer_summary (Materialized View)
Contains computed aggregations:
- `total_sales_amount`: SUM of all sale values
- `total_orders`: COUNT of sales
- `average_order_value`: AVG sale value
- `last_purchase_date`: MAX actual_close_date from sales
- `open_sales`, `open_tickets`, `active_service_contracts`

**Use when**: You need up-to-date sales metrics for analytics

### customers_with_stats (Regular View)
Joins customers table with customer_summary:
- All customer base fields
- Plus computed sales metrics
- Plus assigned_to name from users table

**Use when**: You need customer details AND sales stats in one query

## Testing Checklist

### ✅ CRUD Operations
- [x] Create customer - No longer tries to set computed fields
- [x] Update customer - No longer includes computed fields in PATCH
- [x] Read customer - Base fields load correctly
- [x] Delete customer - Works as before

### ✅ Stats Queries
- [x] getCustomerStats() queries customer_summary view
- [x] Returns zeros for customers with no sales (fallback works)
- [x] No 400 errors on any customer operations

### 🔄 Pending
- [ ] Update useCustomerAnalytics to query customer_summary directly
- [ ] Add integration test for computed fields from view
- [ ] Performance test customer_summary view refresh

## Error Fixed
**Before**: 
```
PATCH http://127.0.0.1:65421/rest/v1/customers?id=eq.xxx 400 (Bad Request)
RepositoryError: Failed to update customers
```

**Cause**: Repository was trying to SELECT non-existent columns in the return statement after UPDATE

**After**: ✅ Update succeeds, only selects real columns from customers table

## Performance Notes
- `customer_summary` is a **materialized view** - refresh periodically for latest stats
- For real-time stats, query aggregates directly from deals table
- Base customer CRUD operations are now faster (no computed joins)

## Migration Status
- [x] Database migration applied (columns dropped)
- [x] Repository layer cleaned up
- [x] Service layer updated to use views
- [x] Types remain compatible (optional fields)
- [x] UI continues to work (handles undefined correctly)
- [ ] Analytics hook optimization (future improvement)

## Related Files
- `supabase/COMPLETE_DATABASE_EXPORT.sql` (lines 5679-5682, 5250-5340)
- `src/services/customer/supabase/CustomerRepository.ts`
- `src/services/customer/supabase/customerService.ts`
- `src/modules/features/customers/hooks/useCustomers.ts`
- `src/types/crm.ts` (Customer interface)

## Summary
All layers from database to UI are now properly synchronized. Computed fields no longer exist in the base `customers` table and must be fetched from `customer_summary` view or computed on-demand. The application handles this correctly with fallbacks and proper service methods.
