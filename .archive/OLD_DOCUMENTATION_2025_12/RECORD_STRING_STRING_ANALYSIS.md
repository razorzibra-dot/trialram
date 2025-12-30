# Record<string, string> Analysis - Database-Driven Conversion

**Date:** December 15, 2025  
**Scan:** All `Record<string, string>` objects across the codebase

---

## 🎯 Analysis Summary

### Total Found: 31 instances

### Categories:

1. **UI Color Mappings (MUST CONVERT)** - 13 instances
2. **Label/Display Mappings (MUST CONVERT)** - 3 instances  
3. **Router/Path Mappings (SYSTEM - OK)** - 2 instances
4. **Super Admin System (ACCEPTABLE)** - 5 instances
5. **Form Type Definitions (OK)** - 2 instances
6. **Action/Event Mappings (ACCEPTABLE)** - 6 instances

---

## 🔴 MUST CONVERT - Color & Label Mappings (16 instances)

### Tickets Module (4 instances)

**Files:**
- `src/modules/features/tickets/components/TicketsDetailPanel.tsx`
- `src/modules/features/tickets/views/TicketsPage.tsx`

**Hardcoded:**
```typescript
const statusColors: Record<string, string> = {
  open: 'warning',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
  pending: 'warning',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};
```

**Database has:** `ticket_status`, `ticket_priority` with metadata containing `badgeColor`

**Solution:** Use metadata from reference_data

---

### Complaints Module (5 instances)

**Files:**
- `src/modules/features/complaints/views/ComplaintsPage.tsx`
- `src/modules/features/complaints/components/ComplaintsDetailPanel.tsx`

**Hardcoded:**
```typescript
const statusColors: Record<string, string> = {
  new: 'blue',
  in_progress: 'orange',
  resolved: 'green',
  closed: 'default',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const typeLabels: Record<string, string> = {
  breakdown: 'Equipment Breakdown',
  preventive: 'Preventive Maintenance',
  software_update: 'Software Update',
  optimize: 'Optimization',
};
```

**Database has:** `complaint_status`, `complaint_priority`, `complaint_type` with metadata

**Solution:** Use metadata from reference_data

---

### Masters Module - Companies (3 instances)

**Files:**
- `src/modules/features/masters/components/CompaniesDetailPanel.tsx`
- `src/modules/features/masters/views/CompaniesPage.tsx`

**Hardcoded:**
```typescript
const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  prospect: 'blue',
};

const sizeLabels: Record<string, string> = {
  startup: 'Startup',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  enterprise: 'Enterprise',
};
```

**Database has:** `company_status`, `company_size` with metadata

**Solution:** Use metadata from reference_data

---

### Masters Module - Products (1 instance)

**File:** `src/modules/features/masters/components/ProductsDetailPanel.tsx`

**Hardcoded:**
```typescript
const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  discontinued: 'red',
};
```

**Database has:** `product_status` with metadata

**Solution:** Use metadata from reference_data

---

### Service Contracts (1 instance)

**File:** `src/modules/features/service-contracts/views/ServiceContractDetailPage.tsx`

**Hardcoded:**
```typescript
const colors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'warning',
  active: 'success',
  on_hold: 'warning',
  completed: 'processing',
  cancelled: 'default',
  expired: 'error',
};
```

**Database has:** `service_contract_status` with metadata containing `badgeColor`

**Solution:** Use metadata from reference_data

---

### Product Sales (2 instances)

**Files:**
- `src/modules/features/product-sales/views/ProductSalesPage.tsx`
- `src/modules/features/product-sales/components/ProductSaleDetailPanel.tsx`

**Hardcoded:**
```typescript
const colorMap: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  // ... etc
};
```

**Database has:** Product sale workflow statuses with metadata

**Solution:** Use metadata from reference_data

---

## 🟢 ACCEPTABLE - System/Infrastructure (13 instances)

### Router/Path Mappings (2 instances)
- `src/modules/routing/ModularRouter.tsx` - Path to module mapping
- `src/modules/routing/__tests__/ModularRouter.access-guards.test.tsx` - Test fixtures

**Reason:** Internal routing infrastructure, not tenant data

---

### Super Admin UI (5 instances)
- `src/modules/features/super-admin/components/SuperUserDetailPanel.tsx` - Access level colors
- `src/modules/features/super-admin/components/SuperUserList.tsx` - Status colors
- `src/modules/features/super-admin/components/TenantAccessList.tsx` - Access colors
- `src/modules/features/super-admin/views/SuperAdminImpersonationHistoryPage.tsx` - Icon/color maps
- `src/modules/features/super-admin/components/AuditSummaryDashboard.tsx` - Action maps

**Reason:** Super-admin system UI, not tenant-customizable

---

### Form Type Definitions (2 instances)
- `src/modules/features/product-sales/components/InvoiceEmailModal.tsx` - Form values type

**Reason:** TypeScript form type definition, not data

---

### Audit/Customer Display (4 instances)
- `src/modules/features/audit-logs/views/LogsPage.tsx` - Action colors
- `src/modules/features/customers/views/CustomerDetailPage.tsx` - Various display colors

**Reason:** Display helpers for system audit events

---

## 📊 Conversion Strategy

### Pattern to Use

**Current (Hardcoded):**
```typescript
const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'default',
};

<Tag color={statusColors[item.status]}>
  {item.status.toUpperCase()}
</Tag>
```

**New (Database-Driven):**
```typescript
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

const { tenant } = useCurrentTenant();
const { data: statuses = [] } = useReferenceDataByCategory(tenant?.id, 'company_status');

// Create lookup helper
const getStatusMetadata = (key: string) => {
  const item = statuses.find(s => s.key === key);
  return item?.metadata || {};
};

<Tag color={getStatusMetadata(item.status).badgeColor || 'default'}>
  {getStatusMetadata(item.status).label || item.status.toUpperCase()}
</Tag>
```

### Helper Hook Pattern

Create reusable hook: `useReferenceDataLookup.ts`

```typescript
export const useReferenceDataLookup = (category: string) => {
  const { tenant } = useCurrentTenant();
  const { data = [], isLoading } = useReferenceDataByCategory(tenant?.id, category);
  
  const getMetadata = useCallback((key: string) => {
    const item = data.find(d => d.key === key);
    return item?.metadata || {};
  }, [data]);
  
  const getColor = useCallback((key: string) => {
    return getMetadata(key).badgeColor || 'default';
  }, [getMetadata]);
  
  const getLabel = useCallback((key: string) => {
    const item = data.find(d => d.key === key);
    return item?.label || key;
  }, [data]);
  
  return { data, isLoading, getMetadata, getColor, getLabel };
};
```

---

## 🎯 Files Requiring Updates (16 files)

### Priority 1 - Core Modules (CRITICAL)
1. ✅ ~~TicketsPage.tsx~~ - Already uses database for dropdowns, need color lookup
2. ✅ ~~TicketsDetailPanel.tsx~~ - Need color lookup from metadata
3. ✅ ~~ComplaintsPage.tsx~~ - Need color lookup from metadata
4. ✅ ~~ComplaintsDetailPanel.tsx~~ - Need color + label lookups
5. ✅ ~~ServiceContractDetailPage.tsx~~ - Need color lookup

### Priority 2 - Masters Module
6. ✅ ~~CompaniesDetailPanel.tsx~~ - Need color + label lookups
7. ✅ ~~CompaniesPage.tsx~~ - Need label lookup
8. ✅ ~~ProductsDetailPanel.tsx~~ - Need color lookup

### Priority 3 - Product Sales
9. ✅ ~~ProductSalesPage.tsx~~ - Need color lookup
10. ✅ ~~ProductSaleDetailPanel.tsx~~ - Need color lookup

---

## ✅ Verification Checklist

### Migration Check
- [x] All categories have `metadata` with `badgeColor` field
- [x] ticket_status, ticket_priority ✅
- [x] complaint_status, complaint_priority, complaint_type ✅
- [x] company_status, company_size ✅
- [x] product_status ✅
- [x] service_contract_status ✅

### Code Changes
- [ ] Create `useReferenceDataLookup` hook
- [ ] Update TicketsPage.tsx
- [ ] Update TicketsDetailPanel.tsx
- [ ] Update ComplaintsPage.tsx
- [ ] Update ComplaintsDetailPanel.tsx
- [ ] Update CompaniesDetailPanel.tsx
- [ ] Update CompaniesPage.tsx
- [ ] Update ProductsDetailPanel.tsx
- [ ] Update ServiceContractDetailPage.tsx
- [ ] Update ProductSalesPage.tsx
- [ ] Update ProductSaleDetailPanel.tsx

### Testing
- [ ] npm run build (0 errors)
- [ ] Verify colors display correctly
- [ ] Verify labels display correctly
- [ ] Test with different tenants

---

## 🚀 Impact

**Before:** 16 hardcoded color/label mappings across modules  
**After:** 100% database-driven via reference_data metadata

**Benefits:**
- ✅ Tenant-specific color customization
- ✅ No code changes for UI updates
- ✅ Consistent with architecture requirement
- ✅ Centralized configuration
