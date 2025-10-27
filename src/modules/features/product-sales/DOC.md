---
title: Product Sales Module
description: Complete documentation for the Product Sales module including sales transactions, order tracking, shipment management, and revenue recognition
lastUpdated: 2025-01-15
relatedModules: [sales, customers, masters, contracts]
category: module
status: production
---

# Product Sales Module

## Overview

The Product Sales module manages individual product transactions, sales orders, order fulfillment, shipment tracking, and revenue recognition. It operates in conjunction with the Sales module for deal-level management and provides detailed transaction-level records.

## Module Structure

```
product-sales/
├── components/              # Reusable UI components
│   ├── ProductSaleDetailPanel.tsx    # Side drawer for sale details
│   ├── ProductSaleFormPanel.tsx      # Side drawer for create/edit
│   └── ProductSalesList.tsx          # Sales list component
├── hooks/                   # Custom React hooks
│   ├── useProductSales.ts           # React Query hooks
├── services/                # Business logic
│   ├── productSaleService.ts        # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── productSaleStore.ts          # Zustand state
├── views/                   # Page components
│   ├── ProductSalesPage.tsx         # Main product sales page
│   └── ProductSaleDetailPage.tsx
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Sales Order Management
- Create, read, update, and delete product sales
- Multiple product selection per order
- Quantity and unit price configuration
- Discount and tax calculation
- Order status tracking

### 2. Order Fulfillment
- Order confirmation
- Shipment tracking
- Delivery confirmation
- Invoice generation
- Return management

### 3. Revenue Recognition
- Revenue posting
- Tax calculation
- Discount tracking
- Payment terms integration
- Billing cycle management

### 4. Inventory Integration
- Stock checking before sale
- Stock reservation
- Stock adjustment on shipment
- Inventory alerts

### 5. Customer Linking
- Link to customer records
- Customer history
- Payment information
- Delivery address management

## Architecture

### Component Layer

#### ProductSalesPage.tsx
- Ant Design Table with sales list
- Columns: Order #, Customer, Product, Qty, Price, Total, Status, Date, Actions
- Search by order number, customer
- Filter by status, product, date range
- Create sale order button
- Pagination: 50 orders per page

#### ProductSaleDetailPanel.tsx
- Order information display
- Product details (SKU, Price, Qty)
- Totals (Subtotal, Tax, Discount, Grand Total)
- Customer information
- Shipment tracking
- Payment status
- Edit button

#### ProductSaleFormPanel.tsx
- Create/Edit sales order form
- Customer selection
- Product lookup and multi-select
- Quantity and pricing
- Discount configuration
- Tax calculation (automatic)
- Delivery address
- Form validation

### State Management (Zustand)

```typescript
interface ProductSaleStore {
  sales: ProductSale[];
  selectedSale: ProductSale | null;
  isLoading: boolean;
  error: string | null;
  
  setSales: (sales: ProductSale[]) => void;
  setSelectedSale: (sale: ProductSale | null) => void;
  addSale: (sale: ProductSale) => void;
  updateSale: (sale: ProductSale) => void;
  deleteSale: (id: string) => void;
}
```

### API/Hooks (React Query)

```typescript
// Get all product sales
const { data: sales } = useProductSales(filters);

// Get single sale
const { data: sale } = useProductSale(saleId);

// Create sale
const createMutation = useCreateProductSale();
await createMutation.mutateAsync(saleData);

// Update sale
const updateMutation = useUpdateProductSale(saleId);
await updateMutation.mutateAsync(updates);

// Get sales statistics
const { data: stats } = useProductSalesStats();
```

## Data Types & Interfaces

```typescript
interface ProductSale {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  
  // Line items
  lineItems: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    tax?: number;
  }[];
  
  // Pricing
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discount?: number;
  discountPercentage?: number;
  grandTotal: number;
  
  // Status & Tracking
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'invoiced' | 'paid' | 'cancelled';
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  
  // Delivery
  deliveryAddress: string;
  shippingMethod: string;
  trackingNumber?: string;
  
  // Payment
  paymentTerms: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  
  // References
  invoiceId?: string;
  salesDealId?: string;
  
  createdAt: string;
  updatedAt: string;
}

interface ProductSaleFilter {
  status?: string[];
  customerId?: string;
  dateRange?: [Date, Date];
  priceRange?: [number, number];
  searchQuery?: string;
}

interface ProductSaleStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
}
```

## Integration Points

### 1. Sales Module
- Link to sales deals
- Conversion from deals to sales
- Deal fulfillment tracking

### 2. Customers Module
- Customer association
- Payment history
- Delivery preferences

### 3. Masters Module
- Product information
- Pricing reference
- Inventory status

### 4. Contracts Module
- Contract-based pricing
- Service contract link

### 5. Notifications Module
- Order confirmation notifications
- Shipment alerts
- Delivery confirmations
- Payment reminders

## RBAC & Permissions

```typescript
// Required Permissions
- product-sales:view         // View product sales
- product-sales:create       // Create sales orders
- product-sales:edit         // Edit sales orders
- product-sales:delete       // Delete sales orders
- product-sales:ship         // Mark as shipped
- product-sales:invoice      // Generate invoices

// Role-Based Access
Admin:
  - Full access
  
Sales Manager:
  - Can view, create, edit all orders
  - Cannot delete orders
  
Sales Rep:
  - Can view, create orders
  - Can edit own orders only
  
Customer:
  - Can view own orders only
```

## Common Use Cases

### 1. Creating a Product Sale Order

```typescript
const createProductSale = async (saleData: Partial<ProductSale>) => {
  const mutation = useCreateProductSale();
  await mutation.mutateAsync({
    customerId: 'cust_123',
    lineItems: [
      {
        productId: 'prod_1',
        quantity: 5,
        unitPrice: 100,
      },
    ],
    taxRate: 0.1,
    deliveryAddress: '123 Main St, City, State 12345',
    shippingMethod: 'FedEx',
    paymentTerms: 'Net 30',
  });
};
```

### 2. Calculating Order Total

```typescript
const calculateOrderTotal = (lineItems: any[], taxRate: number, discount?: number) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * taxRate;
  const discountAmount = discount ? subtotal * (discount / 100) : 0;
  return subtotal + taxAmount - discountAmount;
};
```

### 3. Updating Order Status

```typescript
const updateOrderStatus = async (saleId: string, newStatus: string) => {
  const mutation = useUpdateProductSale(saleId);
  await mutation.mutateAsync({
    status: newStatus,
    shippedDate: newStatus === 'shipped' ? new Date().toISOString() : undefined,
    deliveredDate: newStatus === 'delivered' ? new Date().toISOString() : undefined,
  });
};
```

## Troubleshooting

### Issue: Product sales not loading
**Cause**: Service factory not configured  
**Solution**: Verify `VITE_API_MODE` and service in factory

### Issue: Stock not deducting
**Cause**: Masters service not integrated  
**Solution**: Verify product service in factory

### Issue: Tax calculation incorrect
**Cause**: Wrong tax rate or formula  
**Solution**: Verify tax rate configuration and calculation logic

### Issue: Cannot update order
**Cause**: Status not allowed or permission denied  
**Solution**: Check order status workflow and RBAC permissions

## Related Documentation

- [Sales Module](../sales/DOC.md)
- [Customers Module](../customers/DOC.md)
- [Masters Module](../masters/DOC.md)
- [Revenue Recognition Guide](../../docs/architecture/REVENUE_RECOGNITION.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready