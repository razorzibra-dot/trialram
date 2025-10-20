# Phase 4 Stage 2 - Service Usage Quick Reference

## Quick Import Guide

### Product Sale Service
```typescript
import { productSaleService } from '@/services/serviceFactory';

// All methods available:
productSaleService.getProductSales(filters, page, limit)
productSaleService.getProductSaleById(id)
productSaleService.createProductSale(data)
productSaleService.updateProductSale(id, data)
productSaleService.deleteProductSale(id)
productSaleService.getProductSalesAnalytics()
productSaleService.uploadAttachment(saleId, file)
```

### Customer Service
```typescript
import { customerService } from '@/services/serviceFactory';

// All methods available:
customerService.getCustomers(filters)
customerService.getCustomer(id)
customerService.createCustomer(data)
customerService.updateCustomer(id, updates)
customerService.deleteCustomer(id)
customerService.bulkDeleteCustomers(ids)
customerService.bulkUpdateCustomers(ids, updates)
customerService.getTags()
customerService.createTag(name, color)
customerService.exportCustomers(format)
customerService.importCustomers(csvData)
customerService.getIndustries()
customerService.getSizes()
```

---

## Common Usage Patterns

### 1. Fetch All Product Sales (with filters)
```typescript
const { productSaleService } = require('@/services/serviceFactory');

const response = await productSaleService.getProductSales(
  {
    status: 'new',
    min_amount: 5000,
    date_from: '2024-01-01',
    search: 'Acme'
  },
  1,  // page
  10  // limit
);

// response.data → array of ProductSale
// response.total → total count
// response.totalPages → number of pages
```

### 2. Create New Product Sale
```typescript
const newSale = await productSaleService.createProductSale({
  customer_id: 'cust-001',
  product_id: 'prod-002',
  units: 5,
  cost_per_unit: 2500,
  delivery_date: '2024-06-15',
  notes: 'Bulk order with discount'
});

// Warranty expiry auto-calculated as 2025-06-15
// Status auto-set based on warranty date
// Service contract auto-generated (Stage 1 integration)
```

### 3. Get Product Sales Analytics
```typescript
const analytics = await productSaleService.getProductSalesAnalytics();

// Returns:
{
  total_sales: 45,
  total_revenue: 125000,
  average_deal_size: 2777.78,
  sales_by_month: [
    { month: '2024-01', sales_count: 5, revenue: 25000 },
    { month: '2024-02', sales_count: 8, revenue: 42000 }
  ],
  top_products: [
    { product_id: 'p1', product_name: 'CRM Suite', 
      total_sales: 15, total_revenue: 125000, units_sold: 45 }
  ],
  top_customers: [
    { customer_id: 'c1', customer_name: 'Acme Corp',
      total_sales: 3, total_revenue: 45000, last_purchase: '2024-06-15' }
  ],
  status_distribution: [
    { status: 'new', count: 28, percentage: 62.22 },
    { status: 'expired', count: 17, percentage: 37.78 }
  ],
  warranty_expiring_soon: [...]
}
```

### 4. Get All Customers (with filters)
```typescript
const customers = await customerService.getCustomers({
  status: 'active',
  industry: 'Technology',
  size: 'enterprise',
  search: 'Tech'
});
// Returns: Customer[]
```

### 5. Create New Customer
```typescript
const newCustomer = await customerService.createCustomer({
  company_name: 'NewTech Inc',
  contact_name: 'John Doe',
  email: 'john@newtech.com',
  phone: '+1-555-0100',
  address: '100 Tech Ave',
  city: 'Seattle',
  country: 'USA',
  industry: 'Technology',
  size: 'medium',
  status: 'active',
  notes: 'New enterprise client'
  // assigned_to auto-filled with current user
});
```

### 6. Manage Customer Tags
```typescript
// Get all tags
const tags = await customerService.getTags();

// Create new tag
const newTag = await customerService.createTag('Premium', '#FFD700');
```

### 7. Export Customers
```typescript
// Export as CSV
const csvData = await customerService.exportCustomers('csv');
// Download as file...

// Export as JSON
const jsonData = await customerService.exportCustomers('json');
```

### 8. Import Customers from CSV
```typescript
const csvContent = `"Company Name","Contact Name","Email",...
"ABC Corp","John","john@abc.com",...`;

const result = await customerService.importCustomers(csvContent);
// result: { success: 5, errors: [] }
```

### 9. Bulk Operations
```typescript
// Bulk delete
await customerService.bulkDeleteCustomers([
  'cust-001', 'cust-002', 'cust-003'
]);

// Bulk update (e.g., mark as inactive)
await customerService.bulkUpdateCustomers(
  ['cust-001', 'cust-002'],
  { status: 'inactive' }
);
```

### 10. Upload File Attachment
```typescript
const file = fileInputRef.current.files[0];

const attachment = await productSaleService.uploadAttachment(
  'sale-id-123',
  file
);

// Returns: 
// {
//   id: 'att-1234567890',
//   name: 'contract.pdf',
//   size: 245760,
//   type: 'application/pdf',
//   url: 'https://supabase...storage...',
//   uploaded_at: '2024-06-15T10:30:00Z'
// }
```

---

## React Hook Pattern

### In Component:
```typescript
import { useEffect, useState } from 'react';
import { productSaleService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';

function ProductSalesPage() {
  const { getTenantId } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const response = await productSaleService.getProductSales(
          { status: 'new' },
          1,
          10
        );
        setSales(response.data);
      } catch (error) {
        console.error('Failed to load sales:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {sales.map(sale => (
        <div key={sale.id}>{sale.customer_name} - ${sale.total_cost}</div>
      ))}
    </div>
  );
}
```

---

## Multi-Tenant Context

### Automatic Tenant Filtering:

Every query automatically includes your current tenant:

```typescript
// ❌ NO NEED TO DO THIS:
const tenantId = useAuth().getTenantId();
response = await supabase
  .from('product_sales')
  .select('*')
  .eq('tenant_id', tenantId);

// ✅ DO THIS INSTEAD:
// Service automatically adds tenant filter
const response = await productSaleService.getProductSales();
```

---

## Error Handling

### Standard Error Pattern:
```typescript
try {
  const sale = await productSaleService.getProductSaleById(id);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // "Product sale not found"
    // "Failed to fetch product sale"
    // etc.
  }
}
```

### Common Errors:
- "Product sale not found"
- "Customer not found"
- "Failed to create product sale"
- "Failed to update customer"
- "Failed to upload attachment"
- "Failed to import customers"

---

## API Mode Switching (Testing)

### Check Current Mode:
```typescript
import { serviceFactory } from '@/services/serviceFactory';

const mode = serviceFactory.getApiMode();
const info = serviceFactory.getBackendInfo();

// { mode: 'supabase', supabaseUrl: '...', apiBaseUrl: undefined }
```

### Switch Modes (for testing):
```typescript
// Switch to mock (use mock data)
serviceFactory.setApiMode('mock');
const sales = await productSaleService.getProductSales();
// Uses mock data now

// Switch back to Supabase
serviceFactory.setApiMode('supabase');
const sales2 = await productSaleService.getProductSales();
// Uses real Supabase data
```

---

## Type Definitions

### ProductSale
```typescript
interface ProductSale {
  id: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  units: number;
  cost_per_unit: number;
  total_cost: number;
  delivery_date: string; // YYYY-MM-DD
  warranty_expiry: string; // YYYY-MM-DD
  status: 'new' | 'renewed' | 'expired';
  notes: string;
  attachments: FileAttachment[];
  service_contract_id?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

### Customer
```typescript
interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect';
  tags: CustomerTag[];
  notes?: string;
  assigned_to: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface CustomerTag {
  id: string;
  name: string;
  color: string;
}
```

---

## Database Queries

### Product Sales Filtering:
```typescript
// Status filter
.eq('status', 'new')

// Date range
.gte('delivery_date', '2024-01-01')
.lte('delivery_date', '2024-12-31')

// Amount range
.gte('total_cost', 5000)
.lte('total_cost', 50000)

// Search (case-insensitive)
.or(`customer_name.ilike.%search%,product_name.ilike.%search%,notes.ilike.%search%`)
```

### Customer Filtering:
```typescript
// Status filter
.eq('status', 'active')

// Industry filter
.eq('industry', 'Technology')

// Size filter
.eq('size', 'enterprise')

// Assignment filter
.eq('assigned_to', 'user-id')

// Search (case-insensitive)
.or(`company_name.ilike.%search%,contact_name.ilike.%search%,email.ilike.%search%`)
```

---

## Performance Tips

1. **Use Pagination**: Don't fetch all records at once
   ```typescript
   const page1 = await productSaleService.getProductSales({}, 1, 20);
   const page2 = await productSaleService.getProductSales({}, 2, 20);
   ```

2. **Filter at Database Level**: Don't fetch and filter in code
   ```typescript
   // ✅ Good: Filter happens in database
   const sales = await productSaleService.getProductSales({ status: 'new' });
   
   // ❌ Bad: Fetch all then filter in code
   const allSales = await productSaleService.getProductSales();
   const filtered = allSales.filter(s => s.status === 'new');
   ```

3. **Use React Query**: Cache and auto-refresh (future enhancement)
   ```typescript
   // Coming in Stage 3: Real-time Integration
   ```

---

## Troubleshooting

### Service returns undefined:
```typescript
// Check if you're using the right import:
import { productSaleService } from '@/services/serviceFactory'; // ✅ Correct

// Not:
import { productSaleService } from './productSaleService'; // ❌ Wrong (old path)
```

### Tenant isolation errors:
```typescript
// Make sure AuthContext is initialized:
const { getTenantId } = useAuth();
if (!getTenantId()) {
  throw new Error('User not authenticated');
}
```

### Empty results:
```typescript
// Check filters aren't too restrictive:
const result = await productSaleService.getProductSales({
  status: 'new',
  min_amount: 100000 // ← Maybe no sales > $100k
});
```

---

## Next: Stage 3 Real-time Features

Coming soon:
- Real-time subscription to product sales changes
- Real-time subscription to customer updates
- Auto-refresh when data changes on server
- Real-time notifications

```typescript
// Preview of Stage 3:
productSaleService.subscribeToUpdates(tenantId, (change) => {
  console.log('Sale updated:', change);
});
```