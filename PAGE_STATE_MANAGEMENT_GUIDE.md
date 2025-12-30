/**
 * PAGE STATE MANAGEMENT GUIDE
 * Standard patterns for loading, error, and permission states
 * Use this guide to ensure consistency across all modules
 */

# Page State Management - Enterprise Standard

## Overview
All pages MUST use the standardized `PageLoader` and `AccessDenied` components for consistent UX across the application.

## Components

### 1. PageLoader
**Location:** `@/components/common/PageLoader`
**Purpose:** Consistent loading state for all pages

**Props:**
- `message?: string` - Loading message (default: "Loading...")
- `size?: 'small' | 'default' | 'large'` - Spinner size (default: 'large')
- `minHeight?: number | string` - Container min height (default: '400px')
- `tip?: string` - Spinner tip text (shown above message)
- `fullscreen?: boolean` - Show fullscreen overlay (default: false)

### 2. AccessDenied
**Location:** `@/components/common/AccessDenied`
**Purpose:** Consistent permission denied UI for all pages

**Props:**
- `variant?: 'alert' | 'result'` - Display style (default: 'result')
- `resource?: string` - Module/resource name for message
- `title?: string` - Custom title
- `description?: string` - Custom description
- `showHomeButton?: boolean` - Show "Go to Dashboard" button (default: true)
- `actions?: React.ReactNode` - Custom action buttons
- `padding?: number` - Container padding (default: 24)

---

## Standard Implementation Pattern

### ✅ CORRECT Implementation (Customers Module - Reference)

```typescript
import React, { useState, useMemo } from 'react';
import { PageHeader, PageLoader, AccessDenied } from '@/components/common';
import { useModuleData } from '@/contexts/ModuleDataContext';
import { useAuth } from '@/contexts/AuthContext';

export const CustomerListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data: moduleData, isLoading: moduleLoading, error } = useModuleData();
  
  // Permission checks
  const canRead = hasPermission('crm:customer:read');
  
  // 1. LOADING STATE - Show consistent spinner
  if (moduleLoading) {
    return (
      <PageLoader 
        message="Loading customers..." 
        tip="Fetching customer data and statistics" 
      />
    );
  }
  
  // 2. ERROR STATE - Show user-friendly error
  if (error) {
    return (
      <AccessDenied
        variant="result"
        title="Error Loading Customers"
        description={`Failed to load customers: ${error.message}`}
        showHomeButton={true}
      />
    );
  }
  
  // 3. PERMISSION CHECK - Show access denied
  if (!canRead) {
    return (
      <AccessDenied
        variant="result"
        resource="customers"
        showHomeButton={true}
      />
    );
  }
  
  // 4. RENDER PAGE CONTENT
  return (
    <>
      <PageHeader title="Customer Management" />
      {/* ... rest of page content ... */}
    </>
  );
};
```

---

## Usage Examples

### Example 1: Basic Loading State
```typescript
if (loading) {
  return <PageLoader />;
}
```

### Example 2: Loading with Custom Message
```typescript
if (loading) {
  return (
    <PageLoader 
      message="Loading product sales..."
      tip="This may take a moment"
      size="large"
    />
  );
}
```

### Example 3: Fullscreen Loading Overlay
```typescript
if (processing) {
  return (
    <PageLoader 
      message="Processing batch operation..."
      tip="Please wait"
      fullscreen={true}
    />
  );
}
```

### Example 4: Permission Denied (Alert Style)
```typescript
if (!hasPermission('crm:deals:read')) {
  return (
    <AccessDenied
      variant="alert"
      resource="deals"
      showHomeButton={true}
    />
  );
}
```

### Example 5: Permission Denied (Result Style)
```typescript
if (!hasPermission('crm:service-contracts:read')) {
  return (
    <AccessDenied
      variant="result"
      resource="service contracts"
      showHomeButton={true}
    />
  );
}
```

### Example 6: Custom Error Message
```typescript
if (error) {
  return (
    <AccessDenied
      variant="result"
      title="Unable to Load Data"
      description={`An error occurred: ${error.message}. Please try again later.`}
      showHomeButton={true}
    />
  );
}
```

### Example 7: Access Denied with Custom Actions
```typescript
if (!canAccess) {
  return (
    <AccessDenied
      variant="result"
      resource="reports"
      actions={
        <>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
          <Button type="link" onClick={() => setShowContactAdmin(true)}>
            Contact Admin
          </Button>
        </>
      }
    />
  );
}
```

---

## State Order (Critical!)

**ALWAYS check states in this order:**

1. **Loading State** - Show `PageLoader`
2. **Error State** - Show `AccessDenied` with error details
3. **Permission Check** - Show `AccessDenied` for unauthorized access
4. **Render Content** - Show actual page content

**Why this order?**
- Prevents "flashing" of permission errors during loading
- Ensures errors are shown even if permissions fail
- Provides best user experience

---

## ❌ WRONG Patterns (DO NOT USE)

### Wrong: Plain text loading
```typescript
// ❌ BAD - Inconsistent, unprofessional
if (loading) {
  return <div>Loading...</div>;
}
```

### Wrong: Plain text error
```typescript
// ❌ BAD - Inconsistent error display
if (error) {
  return <div style={{ padding: 24 }}>Error: {error.message}</div>;
}
```

### Wrong: Plain text permission denied
```typescript
// ❌ BAD - Inconsistent, no navigation
if (!canRead) {
  return <div style={{ padding: 24 }}>You don't have permission.</div>;
}
```

### Wrong: Incorrect state order
```typescript
// ❌ BAD - Permission check before loading
if (!canRead) {
  return <AccessDenied />;
}

if (loading) {
  return <PageLoader />;  // Never reached during initial load!
}
```

---

## Variant Selection Guide

### Use `variant="alert"` when:
- Error/denial should be inline with other content
- Page has multiple sections, only one is restricted
- Space is limited
- Less severe restriction

### Use `variant="result"` when:
- Entire page is restricted
- Error is critical
- Want prominent, centered message
- Professional, full-page experience needed

---

## Customization Examples

### Custom Loading Heights
```typescript
// Short loader for inline content
<PageLoader message="Loading..." minHeight="200px" />

// Tall loader for full pages
<PageLoader message="Loading..." minHeight="600px" />

// Percentage-based height
<PageLoader message="Loading..." minHeight="80vh" />
```

### Custom Padding
```typescript
// No padding (edge-to-edge)
<AccessDenied variant="result" resource="data" padding={0} />

// Large padding
<AccessDenied variant="result" resource="data" padding={48} />
```

---

## Module-Specific Messages

### Customers
```typescript
<PageLoader message="Loading customers..." tip="Fetching customer data and statistics" />
<AccessDenied variant="result" resource="customers" />
```

### Deals
```typescript
<PageLoader message="Loading deals..." tip="Fetching deal pipeline and metrics" />
<AccessDenied variant="result" resource="deals" />
```

### Products
```typescript
<PageLoader message="Loading products..." tip="Fetching product catalog" />
<AccessDenied variant="result" resource="products" />
```

### Service Contracts
```typescript
<PageLoader message="Loading service contracts..." tip="Fetching contract details" />
<AccessDenied variant="result" resource="service contracts" />
```

### Product Sales
```typescript
<PageLoader message="Loading product sales..." tip="Fetching sales data and analytics" />
<AccessDenied variant="result" resource="product sales" />
```

---

## Integration Checklist

When updating a module to use these components:

- [ ] Import `PageLoader` and `AccessDenied` from `@/components/common`
- [ ] Replace all text-based loading states with `<PageLoader />`
- [ ] Replace all text-based error displays with `<AccessDenied variant="result" />`
- [ ] Replace all text-based permission denials with `<AccessDenied variant="result" />`
- [ ] Ensure state checks are in correct order: loading → error → permission → content
- [ ] Test loading state appears correctly
- [ ] Test error state with simulated error
- [ ] Test permission denial with restricted user
- [ ] Verify "Go to Dashboard" button works

---

## Benefits

✅ **Consistency**: All pages look and behave the same
✅ **Professional**: Enterprise-grade UI components
✅ **User-Friendly**: Clear messages and navigation options
✅ **Maintainable**: Single source of truth for states
✅ **Accessible**: Proper ARIA labels and semantic HTML
✅ **Configurable**: Flexible props for all scenarios
✅ **Responsive**: Works on all screen sizes

---

## Quick Reference

| State | Component | Variant | Props |
|-------|-----------|---------|-------|
| Loading | `PageLoader` | N/A | `message`, `tip`, `size` |
| Error | `AccessDenied` | `result` | `title`, `description` |
| Permission | `AccessDenied` | `result` | `resource` |
| Inline Denial | `AccessDenied` | `alert` | `resource` |

---

## Migration Examples

### Before (Product Sales)
```typescript
if (!hasPermission('crm:product-sale:record:read')) {
  return (
    <div style={{ padding: 24 }}>
      <Alert
        message="Access Denied"
        description="You don't have permission to access product sales."
        type="warning"
        showIcon
      />
    </div>
  );
}
```

### After (Product Sales)
```typescript
if (!hasPermission('crm:product-sale:record:read')) {
  return (
    <AccessDenied
      variant="result"
      resource="product sales"
      showHomeButton={true}
    />
  );
}
```

### Before (Service Contracts)
```typescript
if (!hasPermission('crm:contract:service:update')) {
  return (
    <div style={{ padding: 24 }}>
      <Alert
        message="Access Denied"
        description="You don't have permission to access service contracts."
        type="warning"
        showIcon
      />
    </div>
  );
}
```

### After (Service Contracts)
```typescript
if (!hasPermission('crm:contract:service:update')) {
  return (
    <AccessDenied
      variant="result"
      resource="service contracts"
      showHomeButton={true}
    />
  );
}
```

---

## See Also

- `PageHeader` - Standard page header component
- `EmptyState` - Empty state for tables and lists
- `StatsGrid` - Statistics cards display
- Enterprise UI Component Library

---

**Last Updated:** December 29, 2025
**Status:** ✅ Production Ready
**Reference Implementation:** CustomerListPage.tsx
