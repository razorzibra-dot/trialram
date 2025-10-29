---
title: Product Sales Module - Troubleshooting Guide v1.0
description: Comprehensive troubleshooting guide for common issues and solutions in the Product Sales module
date: 2025-01-29
author: Development Team
version: 1.0
status: Published
scope: Product Sales Module
audience: Developers, DevOps, Support
difficulty: Intermediate
tags: [troubleshooting, debugging, faq, solutions, product-sales]
---

# 🔧 Product Sales Module - Troubleshooting Guide v1.0

**Last Updated**: 2025-01-29  
**Version**: 1.0  
**Status**: Published  
**Module**: Product Sales  

---

## 📋 Quick Troubleshooting Index

| Issue | Severity | Category | Solution |
|-------|----------|----------|----------|
| Cannot read property 'id' of undefined | 🔴 Critical | Data | [Jump to Section](#1-cannot-read-property-id-of-undefined) |
| Service is not defined | 🔴 Critical | Service | [Jump to Section](#2-service-is-not-defined) |
| Filters not updating list | 🟠 High | UI State | [Jump to Section](#3-filters-not-updating-list) |
| Form validation not working | 🟠 High | Forms | [Jump to Section](#4-form-validation-not-working) |
| Export not generating file | 🟡 Medium | Export | [Jump to Section](#5-export-not-generating-file) |
| Supabase connection error | 🔴 Critical | Database | [Jump to Section](#6-supabase-connection-error) |
| RLS policy preventing create | 🔴 Critical | Security | [Jump to Section](#7-rls-policy-preventing-create) |
| Bulk operations failing silently | 🟠 High | Bulk Ops | [Jump to Section](#8-bulk-operations-failing-silently) |

---

## 🆘 Issue #1: Cannot read property 'id' of undefined

### ❌ Symptom
```
TypeError: Cannot read property 'id' of undefined
at ProductSalesList.tsx:45:12
```

### 🔍 Root Causes

**Cause A**: Data not loaded yet (async timing issue)
```typescript
// ❌ WRONG - No null check
const sale = salesList[0];  // undefined if data not loaded
const id = sale.id;  // 💥 ERROR
```

**Cause B**: Incorrect destructuring in hooks
```typescript
// ❌ WRONG
const { data } = useProductSales();
const id = data.id;  // undefined - data is array, not object
```

**Cause C**: Wrong service returns null
```typescript
// ❌ WRONG
const sale = await productService.getSale(id);
const total = sale.total;  // null if sale is undefined
```

### ✅ Solutions

**Solution A**: Add proper null checks
```typescript
// ✅ CORRECT
const sale = salesList?.[0];
if (!sale) return <Empty />;
const id = sale.id;
```

**Solution B**: Correct hook destructuring
```typescript
// ✅ CORRECT - data is array
const { data: salesList = [] } = useProductSales();

// ✅ CORRECT - get single item
const { data: sale } = useProductSale(id);
if (!sale) return null;
```

**Solution C**: Handle null returns
```typescript
// ✅ CORRECT
const sale = await productService.getSale(id);
if (!sale) {
  throw new Error(`Sale ${id} not found`);
}
const total = sale.total;
```

### 🧪 Verification Checklist
- [ ] All data access guarded by null checks
- [ ] Component doesn't render before data loads
- [ ] Console shows no undefined warnings
- [ ] Test with empty dataset
- [ ] Test with real data

### 📞 Still Having Issues?
**Next Steps**:
1. Add `console.log('Data:', data)` before accessing properties
2. Check React DevTools - Component props should show valid data
3. Verify hook is called with correct parameters
4. Check that service method is returning data in expected format

---

## 🆘 Issue #2: Service is not defined

### ❌ Symptom
```
ReferenceError: productSaleService is not defined
at useProductSales.ts:10:5
```

### 🔍 Root Causes

**Cause A**: Direct import from legacy service (not factory-routed)
```typescript
// ❌ WRONG - Bypasses factory pattern
import productSaleService from '@/services/productSaleService';
```

**Cause B**: Missing export in serviceFactory.ts
```typescript
// ❌ WRONG - Service not exported from factory
// serviceFactory.ts missing: export { productSaleService }
```

**Cause C**: Typo in import name
```typescript
// ❌ WRONG
import { productSalesService } from '@/services/serviceFactory';
// Should be: productSaleService (singular)
```

**Cause D**: Wrong import path
```typescript
// ❌ WRONG
import { productSaleService } from '@/services/productService';
// Should be: from '@/services/serviceFactory'
```

### ✅ Solutions

**Solution A**: Use factory-routed service correctly
```typescript
// ✅ CORRECT
import { productSaleService as factoryProductSaleService } from '@/services/serviceFactory';

// Use in hook
const data = await factoryProductSaleService.getSales(filters);
```

**Solution B**: Verify serviceFactory.ts exports
```typescript
// ✅ CORRECT in serviceFactory.ts
import { supabaseProductSaleService } from './api/supabase/productSaleService';
import { mockProductSaleService } from './productSaleService';

export const productSaleService = {
  getSales: () => getProductSaleService().getSales(),
  getSale: (id) => getProductSaleService().getSale(id),
  createSale: (data) => getProductSaleService().createSale(data),
  // ... all other methods
};

export function getProductSaleService() {
  return apiMode === 'supabase' 
    ? supabaseProductSaleService 
    : mockProductSaleService;
}
```

**Solution C**: Use correct import names
```typescript
// ✅ CORRECT - Check exact names
import { productSaleService } from '@/services/serviceFactory';
// NOT productSalesService, NOT productService
```

**Solution D**: Verify import path
```typescript
// ✅ CORRECT
import { productSaleService } from '@/services/serviceFactory';
import { productService } from '@/services/serviceFactory';
import { customerService } from '@/services/serviceFactory';
```

### 🧪 Verification Steps
- [ ] Check serviceFactory.ts has product sale service export
- [ ] Verify import statement in component
- [ ] Verify service name spelling (no 's' suffix)
- [ ] Check that both mock and Supabase implementations exist
- [ ] Verify VITE_API_MODE is set correctly

### 📞 Debugging Commands
```typescript
// Add to serviceFactory.ts for debugging
console.log('API Mode:', import.meta.env.VITE_API_MODE);
console.log('Service loaded:', getProductSaleService());
```

---

## 🆘 Issue #3: Filters not updating list

### ❌ Symptom
- Changing filter values doesn't refresh the displayed data
- List shows old data even after filter change
- Search doesn't work
- No loading state when filters change

### 🔍 Root Causes

**Cause A**: Filter changes not triggering re-query
```typescript
// ❌ WRONG - Query not dependent on filters
const { data } = useQuery(['productSales'], () => {
  // Filters not included in dependencies!
  return productSaleService.getSales();
});
```

**Cause B**: Filters not synced to URL/state
```typescript
// ❌ WRONG - Local filter state not syncing
const [localFilters, setLocalFilters] = useState({});
// When user changes filter in UI, state updated but not re-querying
```

**Cause C**: Query key not including filter hash
```typescript
// ❌ WRONG - Same query key used regardless of filters
useQuery(['productSales'], ...)  // No filter variation
```

### ✅ Solutions

**Solution A**: Include filters in React Query dependencies
```typescript
// ✅ CORRECT
const { data } = useQuery(
  ['productSales', filters],  // Filters in query key
  () => productSaleService.getSales(filters),
  { enabled: !!filters }  // Only run when filters exist
);
```

**Solution B**: Properly sync filter state
```typescript
// ✅ CORRECT - Use custom hook that handles sync
const { filters, setFilters } = useProductSalesFilters();

// When user changes filter in UI
const handleFilterChange = (newFilters) => {
  setFilters(newFilters);  // This triggers re-query via hook
};
```

**Solution C**: Use proper filter cache key
```typescript
// ✅ CORRECT - Hash filters for consistent cache key
const filterKey = JSON.stringify(filters);
useQuery(
  ['productSales', filterKey],
  () => productSaleService.getSales(filters),
  { staleTime: 1000 * 60 * 5 }  // Cache for 5 minutes
);
```

### 🧪 Verification Steps
- [ ] Open React DevTools → Profiler
- [ ] Change a filter value
- [ ] Verify component re-renders
- [ ] Verify useQuery hook dependencies include filters
- [ ] Check Network tab - API called with new filters
- [ ] List data updates to match new filters

### 📝 Common Filter Issues
```typescript
// DEBUG: Log filter changes
useEffect(() => {
  console.log('Filters changed:', filters);
}, [filters]);

// DEBUG: Log query invalidations
queryClient.onMutate(() => {
  console.log('Query invalidating...');
});
```

---

## 🆘 Issue #4: Form validation not working

### ❌ Symptom
- Form submits with invalid data
- No error messages displayed
- Required fields can be left blank
- Custom validations ignored
- Form doesn't prevent submission

### 🔍 Root Causes

**Cause A**: Validation rules not configured
```typescript
// ❌ WRONG - No rules defined
<Form form={form} onFinish={handleSubmit}>
  <Form.Item name="quantity">
    <Input />
  </Form.Item>
  {/* No rules! */}
</Form>
```

**Cause B**: Form.Item rules not validated
```typescript
// ❌ WRONG - Rules exist but form not validated on submit
const handleSubmit = (values) => {
  // Submitting without validation!
  return productSaleService.createSale(values);
};
```

**Cause C**: Custom validator not async
```typescript
// ❌ WRONG - Custom validator not handling async
const validateQuantity = (rule, value) => {
  const existingData = await db.query(...);  // ❌ Can't use await
  if (value > existingData) throw new Error('Not enough stock');
};
```

**Cause D**: Form reset clearing validators
```typescript
// ❌ WRONG - Reset loses validators
form.resetFields();  // Only resets values, not rules
```

### ✅ Solutions

**Solution A**: Define proper validation rules
```typescript
// ✅ CORRECT - Comprehensive rules
<Form.Item
  name="quantity"
  rules={[
    { required: true, message: 'Quantity is required' },
    { type: 'number', min: 1, message: 'Quantity must be > 0' },
    { 
      validator: async (_, value) => {
        const stock = await productService.getStock(productId);
        if (value > stock) {
          throw new Error(`Only ${stock} available`);
        }
      }
    }
  ]}
  validateTrigger="onBlur"
>
  <InputNumber />
</Form.Item>
```

**Solution B**: Ensure form validation on submit
```typescript
// ✅ CORRECT - Form validates before onFinish
const handleSubmit = async (values) => {
  try {
    const result = await productSaleService.createSale(values);
    message.success('Sale created successfully');
    return result;
  } catch (error) {
    message.error(error.message);
    throw error;  // Form won't close on error
  }
};

<Form form={form} onFinish={handleSubmit}>
  {/* Fields with rules */}
</Form>
```

**Solution C**: Handle async validators properly
```typescript
// ✅ CORRECT - Async validator
{
  validator: (_, value) => {
    return new Promise((resolve, reject) => {
      productService.checkStockAvailability(productId, value)
        .then(available => {
          if (available) resolve();
          else reject(new Error('Not enough stock'));
        })
        .catch(reject);
    });
  }
}
```

**Solution D**: Maintain validators during reset
```typescript
// ✅ CORRECT - Reset only values
form.resetFields();  // Keeps validators

// Or explicitly preserve rules
const formValues = form.getFieldsValue();
form.setFieldsValue({
  ...formValues,
  quantity: undefined
});
```

### 🧪 Verification Steps
- [ ] Try submitting form with empty required fields
- [ ] Verify error messages appear
- [ ] Check form doesn't submit with errors
- [ ] Test custom validators with edge cases
- [ ] Verify form clears after successful submit
- [ ] Check React DevTools - Form state includes errors

### 📞 Debug Validation
```typescript
// Log validation errors
const onFinishFailed = (errorInfo) => {
  console.log('Failed fields:', errorInfo.errorFields);
  console.log('Errors:', errorInfo.errorFields.map(f => f.errors));
};

<Form onFinishFailed={onFinishFailed}>
```

---

## 🆘 Issue #5: Export not generating file

### ❌ Symptom
- Export button clicked but no file downloads
- Browser console shows no errors
- No loading state during export
- Export modal closes but file not created

### 🔍 Root Causes

**Cause A**: File generation library not imported
```typescript
// ❌ WRONG - xlsx not available
const generateExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);  // ❌ XLSX undefined
};
```

**Cause B**: Blob not created correctly
```typescript
// ❌ WRONG - Invalid mime type
const blob = new Blob([csvData], { type: 'text/csv' });
// Browser might refuse to download
```

**Cause C**: Download trigger not working
```typescript
// ❌ WRONG - Missing link cleanup
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'sales.csv';
link.click();
// Missing: link.remove() or cleanup
```

**Cause D**: Large dataset timeout
```typescript
// ❌ WRONG - No chunking for large exports
const data = await productSaleService.getSales();  // 100k rows
XLSX.write(workbook);  // Might timeout or freeze
```

### ✅ Solutions

**Solution A**: Ensure library imported
```typescript
// ✅ CORRECT
import * as XLSX from 'xlsx';

const generateExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales');
  XLSX.writeFile(wb, 'product-sales.xlsx');
};
```

**Solution B**: Use correct MIME types
```typescript
// ✅ CORRECT MIME types
const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
const excelBlob = new Blob([excelData], { 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const jsonBlob = new Blob([jsonData], { type: 'application/json' });
```

**Solution C**: Proper file download with cleanup
```typescript
// ✅ CORRECT - Proper download and cleanup
const downloadFile = (blob, filename) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);  // Some browsers need this
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);  // Cleanup
};

// Usage
downloadFile(blob, 'sales-export.csv');
```

**Solution D**: Handle large exports with chunking
```typescript
// ✅ CORRECT - Chunk large exports
const MAX_ROWS_PER_SHEET = 50000;

const generateLargeExcel = async (data) => {
  const wb = XLSX.utils.book_new();
  const chunks = chunkArray(data, MAX_ROWS_PER_SHEET);
  
  chunks.forEach((chunk, index) => {
    const ws = XLSX.utils.json_to_sheet(chunk);
    XLSX.utils.book_append_sheet(wb, ws, `Sheet${index + 1}`);
  });
  
  XLSX.writeFile(wb, 'product-sales-large.xlsx');
};
```

### 🧪 Verification Steps
- [ ] Check browser console for errors
- [ ] Test with small dataset (5 records)
- [ ] Verify download folder receives file
- [ ] Check file extension is correct
- [ ] Open file to verify data integrity
- [ ] Test with different export formats (CSV, Excel)
- [ ] Check file size matches expected data

### 📞 Debug Export
```typescript
// Add logging
const handleExport = async (format) => {
  try {
    console.log('Starting export, format:', format);
    const data = await fetchSalesData();
    console.log('Data fetched, records:', data.length);
    
    const blob = createBlob(data, format);
    console.log('Blob created, size:', blob.size);
    
    downloadFile(blob, `sales.${format}`);
    console.log('File downloaded');
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

---

## 🆘 Issue #6: Supabase connection error

### ❌ Symptom
```
Error: Unauthorized (401)
Error: Connection refused
Error: FATAL: password authentication failed
```

### 🔍 Root Causes

**Cause A**: Wrong VITE_API_MODE setting
```
# .env
VITE_API_MODE=mock  # ❌ WRONG - Mock mode doesn't use Supabase
```

**Cause B**: Invalid Supabase credentials
```
# .env
VITE_SUPABASE_URL=https://wrong-project.supabase.co  # ❌ Invalid
VITE_SUPABASE_KEY=invalid_anon_key  # ❌ Invalid
```

**Cause C**: Network connectivity issue
```
// App not connected to internet or Supabase firewall blocking
```

**Cause D**: RLS policies blocking queries
```
-- ❌ RLS policy too restrictive
CREATE POLICY "Only owner" ON product_sales
USING (user_id = auth.uid());  -- But auth.uid() returns NULL
```

### ✅ Solutions

**Solution A**: Set correct API mode
```
# .env - For Supabase
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

**Solution B**: Verify Supabase credentials
```typescript
// Verify in Supabase dashboard
// 1. Go to Settings → API
// 2. Copy Project URL
// 3. Copy Anon Public key
// 4. Paste into .env

// Test connection
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
const { data, error } = await supabase.from('product_sales').select('count(*)');
console.log('Connection test:', error ? 'FAILED' : 'SUCCESS');
```

**Solution C**: Check network connectivity
```typescript
// Test in browser console
fetch('https://your-project.supabase.co/rest/v1/product_sales')
  .then(r => console.log('Connection OK'))
  .catch(e => console.error('Connection failed:', e.message));
```

**Solution D**: Fix RLS policies for proper auth
```sql
-- ✅ CORRECT - Proper RLS policy
CREATE POLICY "Users can access own tenant data" ON product_sales
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    )
  );

-- Allow anon access if needed
CREATE POLICY "Anon access if shared" ON product_sales
  FOR SELECT USING (
    shared_with_anon = true
  );
```

### 🧪 Verification Steps
- [ ] Check `.env` file has correct VITE_API_MODE=supabase
- [ ] Verify Supabase credentials in `.env`
- [ ] Test Supabase connection from browser console
- [ ] Check RLS policies in Supabase dashboard
- [ ] Verify user is authenticated (check auth.uid())
- [ ] Test with mock mode first to isolate issue

### 📞 Connection Debug
```typescript
// Add to app startup
const diagnosticTest = async () => {
  console.log('API Mode:', import.meta.env.VITE_API_MODE);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  
  if (import.meta.env.VITE_API_MODE === 'supabase') {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Auth status:', error ? 'NOT LOGGED IN' : 'LOGGED IN');
      
      const { data: testData, error: queryError } = 
        await supabase.from('product_sales').select('count(*)', { count: 'exact' });
      console.log('Query test:', queryError ? `FAILED: ${queryError.message}` : 'SUCCESS');
    } catch (e) {
      console.error('Diagnostic failed:', e);
    }
  }
};

// Call on app load
useEffect(() => {
  diagnosticTest();
}, []);
```

---

## 🆘 Issue #7: RLS policy preventing create

### ❌ Symptom
```
Error: new row violates row-level security policy "product_sales_insert_policy"
Error: permission denied for relation product_sales
```

### 🔍 Root Causes

**Cause A**: RLS policy not allowing authenticated users to insert
```sql
-- ❌ WRONG - Too restrictive
CREATE POLICY "Prevent all inserts" ON product_sales
  FOR INSERT WITH CHECK (false);
```

**Cause B**: Missing tenant_id in insert
```typescript
// ❌ WRONG - No tenant_id
const newSale = await productSaleService.createSale({
  customer_id: '123',
  product_id: '456'
  // Missing: tenant_id
});
```

**Cause C**: User not properly authenticated
```typescript
// ❌ WRONG - User not logged in but trying to write
// auth.uid() returns NULL when not authenticated
```

**Cause D**: Insufficient RLS policy conditions
```sql
-- ❌ WRONG - Policy too strict on tenant check
CREATE POLICY "Users can insert own sales" ON product_sales
  FOR INSERT WITH CHECK (
    tenant_id = 'hardcoded_value'  -- ❌ Only specific tenant
  );
```

### ✅ Solutions

**Solution A**: Create proper insert policy
```sql
-- ✅ CORRECT - Allow inserts for authenticated users
CREATE POLICY "Users can insert sales for their tenant" ON product_sales
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id = (
      SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    )
  );
```

**Solution B**: Include tenant_id in all inserts
```typescript
// ✅ CORRECT - Always include tenant_id
const createSale = async (saleData) => {
  const currentUser = await authService.getCurrentUser();
  
  const newSale = {
    ...saleData,
    tenant_id: currentUser.tenant_id,  // Always add
    created_by: currentUser.id
  };
  
  return await supabase
    .from('product_sales')
    .insert([newSale])
    .select();
};
```

**Solution C**: Verify user is authenticated
```typescript
// ✅ CORRECT - Check auth before operations
const ensureAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// In service method
const user = await ensureAuthenticated();
```

**Solution D**: Create flexible RLS policies
```sql
-- ✅ CORRECT - Flexible policy with fallback
CREATE POLICY "Team can manage sales" ON product_sales
  FOR ALL USING (
    -- User's own records
    created_by = auth.uid()
    -- Or team members' records
    OR user_id IN (
      SELECT user_id FROM team_members 
      WHERE team_id = (
        SELECT team_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );
```

### 🧪 Verification Steps
- [ ] Check user is logged in (verify in Supabase Auth)
- [ ] Verify user has tenant_id assigned
- [ ] Check RLS policies in Supabase dashboard
- [ ] Test insert with correct tenant_id
- [ ] Review policy conditions match your data model
- [ ] Test with different user roles

### 📞 RLS Debug
```sql
-- Test RLS policy directly in Supabase SQL Editor
-- Check what auth.uid() returns
SELECT auth.uid() as current_user;

-- Check user's tenant
SELECT id, tenant_id FROM auth.users WHERE id = auth.uid();

-- Simulate insert check
SELECT * FROM product_sales 
WHERE auth.uid() IS NOT NULL
AND tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid());
```

---

## 🆘 Issue #8: Bulk operations failing silently

### ❌ Symptom
- Bulk update/delete completes without error
- But no data actually changed
- No success or error message shown
- Loading state disappears but nothing happened

### 🔍 Root Causes

**Cause A**: Empty selection set
```typescript
// ❌ WRONG - No rows selected
const selected = [];  // Empty!
const result = await bulkService.updateStatus(selected, 'completed');
// Silently succeeds because no rows to update
```

**Cause B**: Bulk operation not awaited
```typescript
// ❌ WRONG - Fire and forget
bulkService.deleteSelected(selectedIds);
setSelectedIds([]);  // Clears UI before delete completes
```

**Cause C**: Error caught and swallowed
```typescript
// ❌ WRONG - Error silenced
try {
  await bulkService.update(data);
} catch (error) {
  console.error(error);  // Only logs, no user notification
}
```

**Cause D**: Batch operation partial failure
```typescript
// ❌ WRONG - Some succeed, some fail
const results = await Promise.allSettled([
  update(id1),  // ✅ Succeeds
  update(id2),  // ❌ Fails (RLS denied)
  update(id3)   // ✅ Succeeds
]);
// Only reports success because Promise.allSettled never rejects
```

### ✅ Solutions

**Solution A**: Validate selection before bulk operation
```typescript
// ✅ CORRECT - Check selection first
const handleBulkUpdate = async () => {
  if (!selectedIds || selectedIds.length === 0) {
    message.warning('Please select at least one item');
    return;
  }
  
  try {
    const result = await bulkService.updateStatus(selectedIds, newStatus);
    message.success(`Updated ${result.count} items`);
  } catch (error) {
    message.error(`Update failed: ${error.message}`);
  }
};
```

**Solution B**: Properly await bulk operations
```typescript
// ✅ CORRECT - Await and handle response
const handleBulkDelete = async () => {
  setLoading(true);
  try {
    const result = await bulkService.deleteSelected(selectedIds);
    message.success(`Deleted ${result.count} items`);
    // Only clear after success
    setSelectedIds([]);
    await queryClient.invalidateQueries(['productSales']);
  } catch (error) {
    message.error(`Delete failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

**Solution C**: Notify user of all outcomes
```typescript
// ✅ CORRECT - Report partial failures
const handleBulkOperation = async (ids, operation) => {
  const results = await Promise.allSettled(
    ids.map(id => bulkService[operation](id))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    message.warning(`Completed ${succeeded}, failed ${failed}`);
  } else {
    message.success(`All ${succeeded} items processed`);
  }
};
```

**Solution D**: Validate each operation result
```typescript
// ✅ CORRECT - Check actual updates
const handleBulkUpdate = async (ids, updates) => {
  setLoading(true);
  try {
    const results = await Promise.all(
      ids.map(id => bulkService.updateSale(id, updates))
    );
    
    // Verify updates worked
    const updatedCount = results.filter(r => r.status === 'success').length;
    if (updatedCount === 0) {
      throw new Error('No items were updated. Check permissions.');
    }
    
    message.success(`Updated ${updatedCount} items`);
    await invalidateCache();
  } catch (error) {
    message.error(`Operation failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### 🧪 Verification Steps
- [ ] Select at least one item before bulk operation
- [ ] Watch Network tab - API called with correct IDs
- [ ] Check response - Should include count of affected rows
- [ ] Refresh page - Verify changes persist
- [ ] Test with single item first
- [ ] Test error scenario (try delete read-only item)
- [ ] Verify success message appears

### 📞 Debug Bulk Operations
```typescript
// Add detailed logging
const debugBulkOperation = async (ids, operation) => {
  console.log('Starting bulk operation:', operation);
  console.log('Selected IDs:', ids);
  console.log('Count:', ids.length);
  
  try {
    const response = await bulkService[operation](ids);
    console.log('Response:', response);
    console.log('Affected rows:', response.count);
    return response;
  } catch (error) {
    console.error('Bulk operation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw error;
  }
};
```

---

## 📚 Additional Resources

### Configuration References
- **Service Factory**: `src/services/serviceFactory.ts`
- **Mock Services**: `src/services/productSaleService.ts`
- **Supabase Services**: `src/services/api/supabase/productSaleService.ts`
- **RLS Policies**: `supabase/migrations/20250101000007_row_level_security.sql`

### Documentation
- **Module DOC**: `src/modules/features/product-sales/DOC.md`
- **Implementation Guide**: `PROJ_DOCS/11_GUIDES/2025-01-29_ProductSales_ImplementationGuide_v2.0.md`
- **API Reference**: `PROJ_DOCS/07_REFERENCES_QUICK/2025-01-29_ProductSales_APIReference_v1.0.md`

### Debug Tools
- **React DevTools**: Check component state, props, hooks
- **Redux DevTools**: (if using Redux) Time-travel debugging
- **Supabase Dashboard**: Monitor RLS policies, see actual data
- **Network Tab**: Verify API calls and responses
- **Browser Console**: Check for errors and add logging

### Common Commands
```bash
# Test build
npm run build

# Run linter
npm run lint

# Start dev server in mock mode
VITE_API_MODE=mock npm run dev

# Start dev server in Supabase mode
VITE_API_MODE=supabase npm run dev

# Run type checking
npx tsc --noEmit

# View Supabase migrations
supabase migration list
```

---

## 🆘 Still Need Help?

### Before Reaching Out
1. **Check the logs**: Browser console, network tab, browser inspector
2. **Verify setup**: `.env` file, dependencies installed, build successful
3. **Try debugging**: Add console.log statements, check React DevTools
4. **Search docs**: Check other documentation files
5. **Reproduce**: Try with minimal example to isolate issue

### Getting Support
- **Documentation**: `PROJ_DOCS/` folder has detailed guides
- **Module Code**: Review implementation in `src/modules/features/product-sales/`
- **Test Files**: Check `src/modules/features/product-sales/__tests__/` for examples
- **Service Implementations**: Review `src/services/` for patterns

### Reporting Issues
When reporting issues, include:
- **Error message**: Full text of error
- **Steps to reproduce**: Exact steps to trigger issue
- **Environment**: Node version, VITE_API_MODE, etc.
- **Logs**: Browser console errors, network tab requests
- **Code**: Relevant code snippet showing the issue

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-29 | Initial comprehensive troubleshooting guide |

---

**Last Updated**: 2025-01-29  
**Status**: Published  
**Maintenance**: Ongoing - Add issues as they're discovered