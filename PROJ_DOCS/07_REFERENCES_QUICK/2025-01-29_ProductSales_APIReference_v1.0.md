---
title: Product Sales Module - API Reference
description: Complete API reference for all hooks, services, components, types, and enums in the Product Sales module
date: 2025-01-29
author: AI Agent
version: 1.0.0
status: active
projectName: PDS-CRM Application
category: reference
scope: Product Sales module API
audience: developers
---

# Product Sales Module - API Reference v1.0

**Quick Navigation**: [Hooks](#hooks-api) | [Services](#services-api) | [Components](#components-api) | [Types](#data-types) | [Enums](#enums)

---

## Hooks API

### Query Hooks (Read Data)

#### useProductSales

Fetches paginated list of product sales with optional filters.

```typescript
const { data, isLoading, error, refetch } = useProductSales(filters?);

// Parameters
interface Options {
  filters?: ProductSaleFilters;
  pagination?: { page: number; pageSize: number };
  enabled?: boolean;  // Conditional fetching
}

// Returns
interface Result {
  data: ProductSale[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
  isRefetching: boolean;
}

// Example
const { data: sales } = useProductSales({
  status: ['pending', 'confirmed'],
  dateRange: [startDate, endDate],
  searchQuery: 'Acme',
});
```

#### useProductSale

Fetches single product sale by ID.

```typescript
const { data, isLoading, error } = useProductSale(saleId);

// Parameters
interface Options {
  id: string;           // Sale ID (required)
  enabled?: boolean;    // Skip query if false
}

// Returns
interface Result {
  data: ProductSale | null;
  isLoading: boolean;
  error: Error | null;
}

// Example
const { data: sale } = useProductSale('sale_123');
```

#### useProductSalesAnalytics

Fetches aggregated analytics data.

```typescript
const { data, isLoading, error } = useProductSalesAnalytics();

// Returns
interface Analytics {
  totalSales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  pendingCount: number;
  deliveredCount: number;
  paidCount: number;
}

// Example
const { data: analytics } = useProductSalesAnalytics();
console.log(`Total: $${analytics.totalRevenue}`);
```

#### useProductSalesFilters

Manages filter state with URL synchronization.

```typescript
const { filters, setFilters, resetFilters } = useProductSalesFilters();

// Returns
interface FilterManager {
  filters: ProductSaleFilters;
  setFilters: (filters: ProductSaleFilters) => void;
  resetFilters: () => void;
  applyPreset: (presetName: string) => void;
  savePreset: (presetName: string) => void;
}

// Example
setFilters({
  status: ['shipped'],
  priceRange: [100, 1000],
  dateRange: [startDate, endDate],
});

// Filters auto-sync to URL: 
// /product-sales?status=shipped&minPrice=100&maxPrice=1000
```

#### useProductSalesForm

Manages form state for create/edit operations.

```typescript
const form = useProductSalesForm(initialValues?);

// Returns
interface FormManager {
  form: FormInstance;
  isValid: boolean;
  isDirty: boolean;
  values: Partial<ProductSale>;
  errors: Record<string, string>;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

// Example
const form = useProductSalesForm({
  customerId: 'cust_123',
  status: 'draft',
});
```

---

### Mutation Hooks (Write Data)

#### useCreateProductSale

Creates new product sale record.

```typescript
const { mutate, mutateAsync, isLoading, error } = useCreateProductSale();

// Parameters
interface CreateInput {
  customerId: string;
  customerName: string;
  lineItems: ProductSaleItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  grandTotal: number;
  deliveryAddress: string;
  shippingMethod?: string;
  paymentTerms?: string;
  notes?: string;
}

// Returns
interface Mutation {
  mutate: (data: CreateInput, onSuccess?: (id: string) => void) => void;
  mutateAsync: (data: CreateInput) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
  data?: string;  // Created sale ID
}

// Example
await mutateAsync({
  customerId: 'cust_123',
  customerName: 'Acme Corp',
  lineItems: [...],
  subtotal: 499.95,
  taxAmount: 50.00,
  taxRate: 0.1,
  grandTotal: 549.95,
  deliveryAddress: '123 Main St',
});
```

#### useUpdateProductSale

Updates existing product sale.

```typescript
const { mutate, mutateAsync, isLoading } = useUpdateProductSale(saleId);

// Parameters
interface UpdateInput {
  customerId?: string;
  status?: string;
  deliveryAddress?: string;
  shippingMethod?: string;
  notes?: string;
  // ... other optional fields
}

// Example
await mutateAsync({
  status: 'shipped',
  shippedDate: new Date().toISOString(),
});
```

#### useDeleteProductSale

Deletes product sale with confirmation.

```typescript
const { mutate, mutateAsync, isLoading } = useDeleteProductSale(saleId);

// Shows confirmation dialog before deleting
// Returns true if deleted, false if cancelled

// Example
const deleted = await mutateAsync();
if (deleted) {
  message.success('Sale deleted');
}
```

#### useStatusTransition

Executes status workflow with auto-triggers.

```typescript
const { mutate, mutateAsync } = useStatusTransition(saleId);

// Parameters
interface TransitionInput {
  saleId: string;
  newStatus: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// Auto-triggers:
// - Notifies affected stakeholders
// - Updates related records
// - Logs to audit trail
// - Validates transition rules

// Example
await mutateAsync({
  saleId: 'sale_123',
  newStatus: 'shipped',
  reason: 'Inventory confirmed, ready for shipment',
});
```

#### useGenerateInvoice

Generates invoice from product sale.

```typescript
const { mutate, mutateAsync } = useGenerateInvoice(saleId);

// Parameters
interface InvoiceInput {
  saleId: string;
  taxRate: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  paymentTerms: string;
}

// Returns
interface InvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  invoiceUrl: string;
  generatedAt: string;
}

// Example
const result = await mutateAsync({
  saleId: 'sale_123',
  taxRate: 0.1,
  currency: 'USD',
  paymentTerms: 'Net 30',
});
console.log(`Invoice: ${result.invoiceNumber}`);
```

#### useInvoiceEmail

Sends invoice by email.

```typescript
const { mutate: sendNow, mutate: scheduleEmail } = useInvoiceEmail(saleId);

// Send Immediately
interface SendNowInput {
  recipientEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  attachPDF?: boolean;
  subject?: string;
}

// Schedule for Later
interface ScheduleInput {
  recipientEmail: string;
  ccEmails?: string[];
  sendAt: Date;  // Must be in future
  attachPDF?: boolean;
}

// Example
await sendNow({
  recipientEmail: 'customer@acme.com',
  ccEmails: ['manager@company.com'],
  attachPDF: true,
});

// Or schedule
await scheduleEmail({
  recipientEmail: 'customer@acme.com',
  sendAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});
```

#### useBulkOperations

Performs bulk operations on multiple sales.

```typescript
const bulk = useBulkOperations();

// Bulk Update Status
const { bulkUpdateStatus } = bulk;
const result = await bulkUpdateStatus({
  saleIds: ['sale_1', 'sale_2', 'sale_3'],
  newStatus: 'shipped',
  reason?: 'Bulk shipment update',
});
// Returns: { successCount: 3, failureCount: 0 }

// Bulk Delete
const { bulkDelete } = bulk;
const result = await bulkDelete({
  saleIds: ['sale_1', 'sale_2'],
});
// Returns: { deletedCount: 2, skippedCount: 0 }

// Bulk Export
const { bulkExport } = bulk;
await bulkExport({
  saleIds: ['sale_1', 'sale_2'],
  format: 'xlsx',  // 'csv' or 'xlsx'
  columns: ['id', 'customerName', 'totalPrice', 'status'],
});
// Automatically downloads file
```

---

## Services API

### productSaleService (Factory-routed)

Core service for product sales operations.

```typescript
import { productSaleService } from '@/services/serviceFactory';

// Get all sales
const sales = await productSaleService.getProductSales(filters?, pagination?);

// Get single sale
const sale = await productSaleService.getProductSale(saleId);

// Create
const result = await productSaleService.createProductSale(data);

// Update
const result = await productSaleService.updateProductSale(saleId, updates);

// Delete
await productSaleService.deleteProductSale(saleId);

// Get analytics
const analytics = await productSaleService.getProductSalesAnalytics();
```

### statusTransitionService

Handles status workflow logic.

```typescript
import { statusTransitionService } from '@/modules/features/product-sales/services';

// Execute transition
const result = await statusTransitionService.transitionStatus(saleId, newStatus, reason?);

// Get valid transitions
const validStates = statusTransitionService.getValidTransitions(currentStatus);
// Returns: ['shipped', 'cancelled']

// Validate transition
const isValid = statusTransitionService.validateTransition(fromStatus, toStatus);
```

### invoiceService

Invoice generation and calculations.

```typescript
import { invoiceService } from '@/modules/features/product-sales/services';

// Generate invoice
const invoice = await invoiceService.generateInvoice({
  saleData: productSale,
  taxRate: 0.1,
  currency: 'USD',
  paymentTerms: 'Net 30',
});
// Returns: { invoiceId, invoiceNumber, invoiceUrl }

// Calculate totals
const totals = invoiceService.calculateTotals(items, taxRate, currency);
// Returns: { subtotal, tax, total }

// Format currency
const formatted = invoiceService.formatCurrency(1000, 'USD');
// Returns: "$1,000.00"

// Generate invoice number
const invoiceNum = invoiceService.generateInvoiceNumber();
// Returns: "INV-2025-01-00042"
```

### invoiceEmailService

Email delivery for invoices.

```typescript
import { invoiceEmailService } from '@/modules/features/product-sales/services';

// Send immediately
await invoiceEmailService.sendInvoiceEmail({
  saleId: 'sale_123',
  recipientEmail: 'customer@example.com',
  ccEmails: ['manager@company.com'],
  options: { attachPDF: true },
});

// Schedule for later
await invoiceEmailService.scheduleInvoiceEmail({
  saleId: 'sale_123',
  recipientEmail: 'customer@example.com',
  sendAt: futureDate,
});

// Validate emails
const isValid = invoiceEmailService.validateEmails(['email@example.com']);
```

### workflowNotificationService

Sends workflow notifications.

```typescript
import { workflowNotificationService } from '@/modules/features/product-sales/services';

// Status change notification
await workflowNotificationService.notifyStatusChange(saleId, oldStatus, newStatus);

// Pending approval
await workflowNotificationService.notifyPendingApproval(saleId);

// Shipment ready
await workflowNotificationService.notifyShipmentReady(saleId);

// Invoice generated
await workflowNotificationService.notifyInvoiceGenerated(saleId);

// Payment received
await workflowNotificationService.notifyPaymentReceived(saleId);
```

### bulkOperationsService

Bulk data operations.

```typescript
import { bulkOperationsService } from '@/modules/features/product-sales/services';

// Bulk update status
const result = await bulkOperationsService.bulkUpdateStatus(saleIds, newStatus);

// Bulk delete
const result = await bulkOperationsService.bulkDelete(saleIds);

// Bulk export
const result = await bulkOperationsService.bulkExport(saleIds, format, columns);
// Auto-downloads file

// Export to CSV
const csv = await bulkOperationsService.exportToCSV(salesData, columns);

// Export to XLSX
const xlsx = await bulkOperationsService.exportToXLSX(salesData, columns);
```

---

## Components API

### ProductSalesList

Main table component for displaying sales.

```typescript
import { ProductSalesList } from '@/modules/features/product-sales/components';

<ProductSalesList
  data={sales}
  isLoading={isLoading}
  pagination={{
    current: currentPage,
    pageSize: 50,
    total: totalCount,
  }}
  onPageChange={(page) => setCurrentPage(page)}
  onRowClick={(record) => setSelectedSale(record)}
  onEdit={(record) => showEditForm(record)}
  onDelete={(record) => deleteSale(record.id)}
  onView={(record) => showDetailPanel(record)}
  onSort={(sorter) => applySorting(sorter)}
/>
```

### ProductSaleFormPanel

Create/Edit form side drawer.

```typescript
import { ProductSaleFormPanel } from '@/modules/features/product-sales/components';

<ProductSaleFormPanel
  visible={showForm}
  sale={editingSale}  // undefined for create
  onClose={() => setShowForm(false)}
  onSubmit={(data) => createOrUpdateSale(data)}
  isLoading={isSaving}
/>
```

### ProductSaleDetailPanel

View details side drawer.

```typescript
import { ProductSaleDetailPanel } from '@/modules/features/product-sales/components';

<ProductSaleDetailPanel
  visible={showDetails}
  sale={selectedSale}
  onClose={() => setShowDetails(false)}
  onEdit={(sale) => editSale(sale)}
  onDelete={(saleId) => deleteSale(saleId)}
  onStatusChange={(newStatus) => changeStatus(newStatus)}
  onGenerateInvoice={() => generateInvoice()}
/>
```

### AdvancedFiltersModal

Advanced filtering interface.

```typescript
import { AdvancedFiltersModal } from '@/modules/features/product-sales/components';

<AdvancedFiltersModal
  visible={showFilters}
  filters={currentFilters}
  onApply={(filters) => applyFilters(filters)}
  onReset={() => resetFilters()}
  onSavePreset={(name) => saveFilterPreset(name)}
  onLoadPreset={(name) => loadFilterPreset(name)}
/>
```

### ExportModal

CSV/Excel export interface.

```typescript
import { ExportModal } from '@/modules/features/product-sales/components';

<ExportModal
  visible={showExport}
  selectedCount={selectedSales.length}
  onExport={(format, columns) => exportData(format, columns)}
  onCancel={() => setShowExport(false)}
/>
```

### BulkActionToolbar

Bulk operations toolbar.

```typescript
import { BulkActionToolbar } from '@/modules/features/product-sales/components';

<BulkActionToolbar
  selectedCount={selectedSales.length}
  onChangeStatus={(newStatus) => bulkChangeStatus(newStatus)}
  onDelete={() => bulkDelete()}
  onExport={(format) => bulkExport(format)}
  onClear={() => clearSelection()}
/>
```

### StatusTransitionModal

Status change dialog.

```typescript
import { StatusTransitionModal } from '@/modules/features/product-sales/components';

<StatusTransitionModal
  visible={showStatusModal}
  currentStatus={sale.status}
  onConfirm={(newStatus, reason) => changeStatus(newStatus, reason)}
  onCancel={() => setShowStatusModal(false)}
/>
```

### InvoiceGenerationModal

Invoice creation dialog.

```typescript
import { InvoiceGenerationModal } from '@/modules/features/product-sales/components';

<InvoiceGenerationModal
  visible={showInvoiceModal}
  sale={selectedSale}
  onGenerate={(config) => generateInvoice(config)}
  onCancel={() => setShowInvoiceModal(false)}
/>
```

### InvoiceEmailModal

Invoice email dialog.

```typescript
import { InvoiceEmailModal } from '@/modules/features/product-sales/components';

<InvoiceEmailModal
  visible={showEmailModal}
  invoiceId={invoiceId}
  customerEmail={customer.email}
  onSendNow={(config) => sendEmailNow(config)}
  onSchedule={(config) => scheduleEmail(config)}
  onCancel={() => setShowEmailModal(false)}
/>
```

---

## Data Types

```typescript
// Main Product Sale
interface ProductSale {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  lineItems: ProductSaleItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discount?: number;
  discountPercentage?: number;
  grandTotal: number;
  status: ProductSaleStatus;
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  deliveryAddress: string;
  shippingMethod?: string;
  trackingNumber?: string;
  paymentTerms?: string;
  paymentStatus: PaymentStatus;
  invoiceId?: string;
  warrantyPeriod?: number;
  notes?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Line Item
interface ProductSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  tax?: number;
  taxRate?: number;
}

// Filters
interface ProductSaleFilters {
  status?: ProductSaleStatus[];
  customerId?: string;
  dateRange?: [Date, Date];
  priceRange?: [number, number];
  searchQuery?: string;
  warrantyStatus?: 'all' | 'active' | 'expired' | 'expiring';
}

// Analytics
interface ProductSalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  pendingCount: number;
  deliveredCount: number;
  paidCount: number;
  topCustomers: Array<{ name: string; revenue: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
}

// Invoice
interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  amount: number;
  taxAmount: number;
  total: number;
  currency: Currency;
  paymentTerms: string;
  dueDate: string;
  invoiceUrl: string;
  emailSentAt?: string;
  paidAt?: string;
  createdAt: string;
}
```

---

## Enums

```typescript
// Product Sale Status
enum ProductSaleStatus {
  'pending' = 'pending',        // Initial state
  'confirmed' = 'confirmed',    // Customer confirmed
  'shipped' = 'shipped',        // Item dispatched
  'delivered' = 'delivered',    // Received by customer
  'invoiced' = 'invoiced',      // Invoice generated
  'paid' = 'paid',              // Payment received (terminal)
  'cancelled' = 'cancelled',    // Cancelled (terminal)
}

// Payment Status
enum PaymentStatus {
  'pending' = 'pending',
  'partial' = 'partial',
  'paid' = 'paid',
}

// Currency
type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

// Export Format
type ExportFormat = 'csv' | 'xlsx';
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| PS001 | Invalid sale ID | Verify sale exists |
| PS002 | Customer not found | Verify customer is active |
| PS003 | Invalid status transition | Check allowed transitions |
| PS004 | Invoice already exists | Can't generate duplicate |
| PS005 | Email validation failed | Verify email format |
| PS006 | Tax calculation error | Check tax rate and amounts |
| PS007 | Insufficient inventory | Reduce quantity or wait for stock |
| PS008 | Permission denied | User lacks required permissions |

---

## Quick Reference

```typescript
// Creating a sale
const mutation = useCreateProductSale();
await mutation.mutateAsync(saleData);

// Updating status
const { mutate } = useStatusTransition(saleId);
mutate({ saleId, newStatus: 'shipped' });

// Generating invoice
const { mutate } = useGenerateInvoice(saleId);
mutate({ taxRate: 0.1, currency: 'USD' });

// Sending email
const { mutate: send } = useInvoiceEmail(saleId);
send({ recipientEmail: 'customer@example.com' });

// Bulk operations
const bulk = useBulkOperations();
await bulk.bulkUpdateStatus({ saleIds, newStatus });
```

---

**Last Updated**: 2025-01-29  
**Version**: 1.0.0  
**Status**: ✅ Complete