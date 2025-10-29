---
title: Product Sales Module Implementation Guide
description: Complete step-by-step guide for implementing and using the Product Sales module
date: 2025-01-29
author: AI Agent
version: 2.0.0
status: active
projectName: PDS-CRM Application
guideType: implementation
scope: Product Sales module (complete workflow)
audience: developers|operators|admins
difficulty: intermediate
estimatedTime: 30 minutes
previousVersions: ["1.0.0"]
nextReview: 2025-02-28
---

# Product Sales Module - Implementation Guide v2.0

## Overview & Purpose

This guide provides comprehensive step-by-step instructions for implementing, configuring, and using the Product Sales module v2.0 in the PDS-CRM Application. It covers all features from basic order management to advanced workflows like invoice generation, status automation, and bulk operations.

**Target Audience**: React developers, system administrators, operations teams  
**Estimated Time**: 30 minutes to read, variable for implementation  
**Prerequisites**: Node.js 18+, npm 9+, basic React knowledge

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Core Workflows](#core-workflows)
5. [Advanced Features](#advanced-features)
6. [Integration Guide](#integration-guide)
7. [Troubleshooting](#troubleshooting)
8. [Performance Tuning](#performance-tuning)
9. [Security Best Practices](#security-best-practices)

---

## Prerequisites/Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn 3.6+)
- **React**: 18.2.0+
- **TypeScript**: 5.0.2+
- **Database**: Supabase PostgreSQL or mock data service

### Development Environment
```bash
# Verify installations
node --version  # v18.x.x or higher
npm --version   # v9.x.x or higher

# Check project setup
npm list react            # Should be 18.2.0+
npm list typescript       # Should be 5.0.2+
```

### Required Permissions
- Access to `/src/modules/features/product-sales` directory
- Access to `.env` file for configuration
- If using Supabase: access to project dashboard

### Knowledge Prerequisites
- Understanding of React hooks and React Query
- Familiarity with Ant Design components
- Basic knowledge of TypeScript
- Understanding of state management (Zustand)

---

## Installation & Setup

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd ~/source/repos/PDS-CRM-Application/CRMV9_NEWTHEME

# Install all dependencies (if not already done)
npm install

# Verify clean install
npm list
```

**Expected Output**: All packages listed without errors

### Step 2: Verify Module Structure

```bash
# Check if product-sales module exists
ls -la src/modules/features/product-sales/

# Should see:
# - components/
# - hooks/
# - services/
# - store/
# - utils/
# - views/
# - DOC.md
# - index.ts
# - routes.tsx
```

### Step 3: Configure Environment Variables

Create or update `.env` file:

```bash
# API Configuration
VITE_API_MODE=mock                          # Use 'mock' for development, 'supabase' for production

# Supabase Configuration (if using Supabase mode)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: API endpoints
VITE_API_URL=http://localhost:3000/api
```

**Verification**: Check `.env` file exists and contains correct values

### Step 4: Start Development Server

```bash
# Start development server
npm run dev

# Expected output:
# ✓ built in 42.18s
# ➜  Local:   http://localhost:5173/

# Navigate to:
# http://localhost:5173/product-sales
```

**Expected Behavior**: Product Sales page loads without errors

### Step 5: Verify Module Loading

Open browser developer tools:

```javascript
// In browser console, verify:
// 1. No 404 errors in Network tab
// 2. No red errors in Console tab
// 3. ProductSalesPage component renders

// Check store is accessible:
import { useProductSalesStore } from '@/modules/features/product-sales/store';
// Should import without errors
```

---

## Configuration

### Environment Configuration

#### Development Mode (Mock Data)

```bash
# .env file
VITE_API_MODE=mock

# Benefits:
# - No database required
# - Fast development
# - Predictable test data
```

#### Production Mode (Supabase)

```bash
# .env file
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Requires:
# - Supabase project created
# - Database migrations applied
# - RLS policies configured
```

### Module Configuration

#### Import in Your App

```typescript
// In your main routing file
import { productSalesRoutes } from '@/modules/features/product-sales/routes';

// Add to routes array
const routes = [
  ...productSalesRoutes,
  // other routes
];
```

#### Access Module

```typescript
// Direct import of components
import { ProductSalesPage } from '@/modules/features/product-sales/views';

// Or use hooks
import { 
  useProductSales, 
  useCreateProductSale 
} from '@/modules/features/product-sales/hooks';
```

### Database Migrations (Supabase)

```bash
# Apply migrations
supabase db push

# Expected tables:
# - product_sales
# - product_sales_items
# - invoices
# - invoice_emails
# - status_transitions_audit
```

---

## Core Workflows

### Workflow 1: Creating a Product Sale

#### Step 1: Navigate to Product Sales Page

```typescript
// User navigates to /product-sales
// Page displays:
// - Sales list table
// - Filters and search
// - "Create New Sale" button
```

#### Step 2: Click Create Sale Button

```typescript
// Button click triggers:
// - Opens ProductSaleFormPanel (side drawer)
// - Clears form fields
// - Ready for input
```

#### Step 3: Fill Form Fields

```typescript
// Required fields:
Field             | Type           | Example
------------------------------------------
Customer          | Dropdown       | "Acme Corp"
Product           | Dropdown       | "Widget Pro"
Quantity          | Number         | 5
Unit Price        | Currency       | $99.99
Total Price       | Auto-calc      | $499.95 (read-only)
Sale Date         | Date Picker    | 2025-01-29
Delivery Address  | Text           | "123 Main St..."
Warranty (months) | Number         | 12
Notes             | Text Area      | Optional

// Form auto-calculates:
// - Total Price = Quantity × Unit Price
// - Displays tax preview
```

#### Step 4: Submit Form

```typescript
// Click "Create Sale" button
// System validates:
// ✓ All required fields filled
// ✓ Positive quantity and price
// ✓ Valid date
// ✓ Delivery address length

// On success:
// 1. Record saved to database
// 2. Form closes
// 3. List refreshes
// 4. Success notification shows
// 5. New sale appears in list

// On error:
// 1. Error message displayed
// 2. Form remains open
// 3. User can correct and retry
```

### Workflow 2: Viewing Sale Details

#### Step 1: Click Sale Row

```typescript
// User clicks any sale row in table
// System loads sale details:
// - ID and status
// - Customer information
// - Product information
// - Order totals
// - Delivery information
// - Warranty details
// - Notes and attachments
// - Action buttons
```

#### Step 2: Available Actions

```typescript
// Based on sale status and permissions:

// Edit Button
// - Enabled: All statuses except 'paid'
// - Action: Opens form in edit mode
// - Updates existing sale

// Generate Invoice Button
// - Enabled: Status = 'delivered'
// - Action: Opens InvoiceGenerationModal
// - Creates invoice with tax calculation

// Send Invoice Email Button
// - Enabled: Invoice exists
// - Action: Opens InvoiceEmailModal
// - Sends email with PDF

// Change Status Button
// - Enabled: Valid transitions exist
// - Action: Opens StatusTransitionModal
// - Updates status with auto-triggers

// Delete Button
// - Enabled: Status = 'draft' or 'pending'
// - Action: Shows confirmation
// - Removes record after confirmation

// Generate Contract Button
// - Enabled: Warranty period > 0
// - Action: Navigates to Contracts module
// - Pre-fills contract with sale data
```

### Workflow 3: Managing Status Transitions

#### Step 1: Open Status Change Dialog

```typescript
// Click "Change Status" button in detail panel
// Modal shows:
// - Current status (read-only)
// - New status dropdown
// - Optional reason textarea
// - Confirm/Cancel buttons
```

#### Step 2: Select New Status

```typescript
// Dropdown shows valid next states based on rules:

Current Status | Valid Next States
------------------------------------------
pending        | confirmed, cancelled
confirmed      | shipped, cancelled
shipped        | delivered, returned
delivered      | invoiced
invoiced       | paid
paid           | N/A (terminal state)
cancelled      | N/A (terminal state)

// Example: If current = 'pending'
// Options shown: 'confirmed', 'cancelled'
```

#### Step 3: Add Optional Notes

```typescript
// User can enter reason for status change:
// - "Inventory available, ready to ship"
// - "Customer requested cancellation"
// - "Quality check failed, pending re-inspection"

// Notes are logged in audit trail
```

#### Step 4: Confirm Transition

```typescript
// Click "Confirm" button
// System executes workflow:
// 1. Validate transition is allowed
// 2. Update sale status
// 3. Trigger side effects:
//    - Update inventory (if shipment)
//    - Generate invoice (if delivered)
//    - Send notifications
// 4. Log to audit trail
// 5. Show success message
// 6. Refresh UI
```

### Workflow 4: Generating Invoices

#### Step 1: Open Invoice Modal

```typescript
// Prerequisites:
// - Sale status must be 'delivered'
// - Sale must have line items

// Click "Generate Invoice" button
// InvoiceGenerationModal opens showing:
// - Sale summary information
// - Currency selector (USD, EUR, GBP, INR)
// - Tax rate input (default 10%)
// - Payment terms dropdown
// - Invoice items summary
// - Calculated totals
```

#### Step 2: Configure Invoice Details

```typescript
Field            | Type        | Default  | Options
-------------------------------------------------------
Currency         | Dropdown    | USD      | USD, EUR, GBP, INR
Tax Rate         | Percentage  | 10%      | 0-25%
Payment Terms    | Dropdown    | Net 30   | Net 15/30/45/60, Due on Receipt

// Real-time calculation updates totals:
// Subtotal:      $499.95
// Tax (10%):     $50.00
// ─────────────────────
// Total:         $549.95
```

#### Step 3: Generate Invoice

```typescript
// Click "Generate Invoice" button
// System processes:
// 1. Calculate totals with tax
// 2. Generate unique invoice number (INV-2025-01-00001)
// 3. Create PDF with company branding
// 4. Save invoice URL to database
// 5. Update sale status to 'invoiced'
// 6. Notify finance team
// 7. Show success message
// 8. Display invoice download link
```

### Workflow 5: Sending Invoices by Email

#### Step 1: Open Email Modal

```typescript
// Prerequisites:
// - Invoice must be generated
// - Customer email must exist

// Click "Send Invoice Email" button
// InvoiceEmailModal opens with 3 tabs:
// - Send Now (immediate)
// - Schedule (future delivery)
// - Preview (email template)
```

#### Step 2: Send Immediately

```typescript
// "Send Now" Tab:
// Fields:
// - To: [customer email] (pre-filled, editable)
// - CC: [manager email] (add/remove)
// - BCC: [finance email] (add/remove)
// - Attach PDF: [toggle] (enabled by default)

// Click "Send Now" button
// System:
// 1. Validates all email addresses
// 2. Renders email HTML template
// 3. Sends email with PDF attachment
// 4. Logs email event to audit trail
// 5. Shows "Email sent successfully"
```

#### Step 3: Or Schedule for Later

```typescript
// "Schedule" Tab:
// Fields:
// - To: [customer email]
// - CC/BCC: [recipients]
// - Date/Time: [date picker + time]
// - Attach PDF: [toggle]

// Click "Schedule Send" button
// System:
// 1. Queues email for future delivery
// 2. Validates send time is in future
// 3. Logs scheduled event
// 4. Shows "Email scheduled successfully"
// 5. Email sends at specified time
```

### Workflow 6: Bulk Operations

#### Step 1: Select Multiple Sales

```typescript
// In sales list table:
// 1. Checkbox appears in table header
// 2. Click checkbox to select all visible
// 3. Or click individual row checkboxes

// Bulk Toolbar appears showing:
// - "2 sales selected"
// - "Clear" button
// - "Change Status" button
// - "Delete Selected" button
// - "Export Selected" button
```

#### Step 2: Bulk Status Change

```typescript
// Click "Change Status" button
// Modal shows:
// - "2 sales selected"
// - Status dropdown (filtered by valid transitions)
// - Optional reason textarea

// Select new status: "shipped"
// Click "Confirm"
// System:
// 1. Validates each sale for transition
// 2. Updates all selected sales
// 3. Triggers notifications for each
// 4. Shows results: "2 updated successfully"
// 5. Refreshes list
```

#### Step 3: Bulk Delete

```typescript
// Click "Delete Selected" button
// Confirmation dialog:
// - "Delete 2 sales? This cannot be undone."
// - "Cancel" / "Delete" buttons

// Click "Delete"
// System:
// 1. Deletes all selected sales
// 2. Logs deletion to audit trail
// 3. Shows "2 sales deleted successfully"
// 4. Clears selection
// 5. Refreshes list
```

#### Step 4: Bulk Export

```typescript
// Click "Export Selected" button
// Export modal:
// - Format: CSV or Excel
// - Columns: [checkboxes for each column]
// - "Select All" / "Select None" buttons
// - "Export" button

// Select columns:
// ☑ Sale ID
// ☑ Customer Name
// ☑ Total Price
// ☑ Status
// ☑ Order Date
// ☐ Notes

// Click "Export"
// System:
// 1. Formats selected records
// 2. Generates CSV/XLSX file
// 3. Downloads file: "product_sales_export.csv"
// 4. Shows "Export complete"
```

---

## Advanced Features

### Feature 1: Advanced Filtering

```typescript
// Click "Advanced Filters" button
// Modal opens with:

// Date Range Filter
// From: [date picker]
// To: [date picker]

// Price Range Filter
// Min: [slider]
// Max: [slider]

// Status Filter (multi-select)
// ☑ Pending
// ☑ Confirmed
// ☑ Shipped
// ☑ Delivered
// ☑ Invoiced
// ☑ Paid

// Customer Filter (searchable multi-select)
// [search box] shows matching customers

// Product Filter (searchable multi-select)
// [search box] shows matching products

// Warranty Status Filter
// - All
// - Active
// - Expired
// - Expiring Soon

// Buttons:
// - "Apply Filters" (updates list)
// - "Reset" (clears all filters)
// - "Save as Preset" (saves filter combination)
// - "Load Preset" (dropdown with saved presets)
```

### Feature 2: Analytics & Reporting

```typescript
// Statistics cards display at top:

// Card 1: Total Sales
// Shows: Count and trend
// Tooltip: Click for breakdown by status

// Card 2: Total Revenue
// Shows: Currency amount
// Tooltip: Click for monthly breakdown

// Card 3: Pending Orders
// Shows: Count of undelivered sales
// Tooltip: Click to filter by pending

// Card 4: Monthly Revenue
// Shows: Current month total
// Tooltip: Click for comparison chart

// Each card is clickable for drilldown
```

### Feature 3: Contract Generation

```typescript
// Click "Generate Contract" button in detail panel
// Prerequisites:
// - Sale must be delivered or paid
// - Warranty period must be defined

// System:
// 1. Navigates to Service Contracts module
// 2. Pre-fills form with:
//    - Customer name and contact
//    - Product information
//    - Warranty period (from sale)
//    - Delivery address
//    - Payment terms
// 3. User completes contract
// 4. System links contract to sale
// 5. Updates sale with contract ID
```

---

## Integration Guide

### Integrating with Customers Module

```typescript
// Import customer service
import { customerService } from '@/services/serviceFactory';

// Get customer details
const customer = await customerService.getCustomer(customerId);

// In ProductSaleFormPanel:
// - Customer dropdown pre-fills name/contact
// - Shows customer history
// - Validates customer status is active
```

### Integrating with Products Module

```typescript
// Import product service
import { productService } from '@/services/serviceFactory';

// Check product availability
const product = await productService.getProduct(productId);

// In form:
// - Shows current stock
// - Prevents selling more than available
// - Updates stock on shipment status change
```

### Integrating with Notifications

```typescript
// Already built-in via workflowNotificationService
// Automatically sends:
// - Customer status change notifications
// - Manager approval alerts
// - Warehouse shipment alerts
// - Finance invoice alerts

// No additional setup required
```

### Integrating with Service Contracts

```typescript
// Generate contract from sale
import { useGenerateContractFromSale } from '@/modules/features/product-sales/hooks';

const { mutate: generateContract } = useGenerateContractFromSale(saleId);

await generateContract({
  saleId,
  contractType: 'service',
  templateId: 'warranty',
});

// Contract module receives pre-filled data:
// - Customer information
// - Warranty period
// - Product details
// - Delivery address
```

---

## Troubleshooting

### Issue: Module not loading

**Symptoms**: Blank page or 404 error  
**Solutions**:
1. Check `.env` file exists and is readable
2. Run `npm install` to ensure all dependencies installed
3. Verify `VITE_API_MODE` is set ('mock' or 'supabase')
4. Check browser console for specific errors
5. Run `npm run build` to validate TypeScript

### Issue: Sales list is empty

**Symptoms**: No sales showing even though records exist  
**Solutions**:
1. Check API mode: `VITE_API_MODE` should match backend
2. If using Supabase: verify database connection
3. Check RLS policies are not blocking queries
4. Verify user has permission to view product sales
5. Check filters aren't hiding all results

### Issue: Form won't submit

**Symptoms**: Click "Create" but form stays open  
**Solutions**:
1. Check console for validation errors
2. Ensure all required fields are filled
3. Verify quantity and price are positive numbers
4. Check delivery address is not too long
5. Verify customer and product are selected

### Issue: Invoice generation fails

**Symptoms**: Button click does nothing  
**Solutions**:
1. Verify sale status is 'delivered'
2. Check PDF template service is available
3. Ensure sale has line items
4. Verify all required fields are filled
5. Check browser console for errors

### Issue: Emails not sending

**Symptoms**: "Send Invoice Email" shows success but email not received  
**Solutions**:
1. Verify recipient email address is valid
2. Check email service is configured
3. Verify SMTP credentials in environment
4. Check email wasn't filtered as spam
5. Review audit logs for send events

### Issue: Bulk operations timing out

**Symptoms**: Operation hangs or shows error after long wait  
**Solutions**:
1. Limit selections to 100 records maximum
2. Check network connection stability
3. Try with smaller batch first
4. Verify database is responsive
5. Check browser memory usage

---

## Performance Tuning

### Optimize List Loading

```typescript
// Use pagination effectively
// Default: 50 records per page
// For slow connections: reduce to 25

// Use filters to reduce dataset
// Before export: filter to relevant records

// Enable analytics caching
// Analytics data cached for 5 minutes
```

### Optimize Large Exports

```typescript
// For exports > 5,000 records:
// 1. Use filters to reduce size
// 2. Export in CSV format (lighter than Excel)
// 3. Select only needed columns
// 4. Consider splitting into multiple exports

// Example: Monthly export strategy
// Export each week separately instead of full month
```

### Optimize Real-time Updates

```typescript
// Use refetch() selectively
// Don't poll on every keystroke
// Use debouncing for search filters

// Good:
const { refetch } = useProductSales();
setTimeout(() => refetch(), 3000); // Refresh after 3s

// Bad:
onKeyUp={() => refetch()}; // Refreshes on every key
```

---

## Security Best Practices

### Data Protection

1. **Always use HTTPS** in production
   ```bash
   VITE_API_URL=https://api.yourdomain.com  # NOT http://
   ```

2. **Protect sensitive credentials**
   - Never commit `.env` to git
   - Use environment variables for secrets
   - Rotate API keys regularly

3. **Validate all inputs**
   - Form validation on client side
   - Server-side validation always
   - Sanitize textarea input

### Access Control

1. **Enforce RBAC**
   - Check permissions before showing buttons
   - Verify backend also enforces
   - Log all CRUD operations

2. **Multi-tenant isolation**
   - Use RLS policies in Supabase
   - Verify tenant context in all queries
   - Never assume single tenant

3. **Audit logging**
   - All status changes logged
   - User and timestamp recorded
   - IP address captured
   - Review logs regularly

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] HTTPS configured
- [ ] Backup strategy in place
- [ ] Error monitoring set up
- [ ] Performance tested with production data
- [ ] Security audit completed
- [ ] Team trained on new features
- [ ] Rollback procedure documented

---

## Support & Resources

- **Module Documentation**: `src/modules/features/product-sales/DOC.md`
- **API Reference**: Check hooks in `src/modules/features/product-sales/hooks/`
- **Examples**: Code examples in this guide
- **Issues**: Check module troubleshooting section

---

## Version History

| Version | Date       | Changes               |
|---------|------------|-----------------------|
| 2.0.0   | 2025-01-29 | Complete rewrite with Phase 2-3 features |
| 1.0.0   | 2025-01-15 | Initial implementation |

---

**Last Updated**: 2025-01-29  
**Next Review**: 2025-02-28  
**Status**: Production Ready ✅