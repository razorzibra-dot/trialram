# ESLint Error Fix Plan - Comprehensive Systematic Approach

## Overview
- **Total Errors**: 46 (all `@typescript-eslint/no-explicit-any`)
- **Total Warnings**: 14 (8 React Hook dependencies + 3 react-refresh + 1 no-unused-expressions + 2 others)
- **Files Affected**: 21 files
- **Strategy**: Fix by priority - core infrastructure first, then features

## Priority Levels

### PHASE 1: Core Infrastructure (Affects Entire Codebase) - 7 Issues
These are used by many features and must be fixed first.

1. **`src/modules/core/hooks/useQuery.ts`** ⭐ CRITICAL
   - Lines 110 (2x), 130, 180, 188
   - 5 `any` type violations
   - Impact: Query hook used across all feature modules
   - Strategy: Add proper TypeScript generics/interfaces for query parameters and responses

2. **`src/modules/core/store/index.ts`** ⭐ CRITICAL
   - Lines 90, 100
   - 2 `any` type violations
   - Impact: Global state store used everywhere
   - Strategy: Type the store actions and state properly

3. **`src/modules/core/components/PageHeader.tsx`** 
   - Line 8: react-refresh warning (non-component export)
   - Strategy: Extract constant to separate file

4. **`src/modules/core/components/StatCard.tsx`**
   - Line 8: react-refresh warning (non-component export)
   - Strategy: Extract constant to separate file

---

### PHASE 2: High-Impact Feature Modules (8+ issues each) - 21 Issues

1. **`src/modules/features/pdf-templates/views/PDFTemplatesPage.tsx`** 🔴 HIGH
   - Lines 75, 90, 106, 111, 128, 144, 156, 166, 183, 200, 211
   - 11 `any` type violations
   - Issue: Event handlers and callback parameters lack types
   - Strategy: Add proper handler types for table operations (edit, delete, create callbacks)

2. **`src/modules/features/notifications/views/NotificationsPage.tsx`** 🔴 HIGH
   - Lines 76, 80, 85, 116, 126, 136, 152, 170, 177, 183, 414
   - 10 `any` errors + 2 React Hook warnings + 1 no-unused-expressions
   - Issues: Multiple any types + missing useEffect dependencies + expression error
   - Strategy: Type event handlers, fix hook dependencies, and fix syntax error

3. **`src/modules/features/super-admin/views/SuperAdminTenantsPage.tsx`** 🟠 MEDIUM-HIGH
   - Lines 139, 151, 162, 174, 193, 201, 211
   - 7 `any` type violations + 1 useEffect dependency warning
   - Issue: Form callbacks and table operations
   - Strategy: Type form handlers and table callbacks

4. **`src/modules/features/audit-logs/views/LogsPage.tsx`** 🟠 MEDIUM-HIGH
   - Lines 57, 62, 72, 82, 99
   - 4 `any` errors + 1 useEffect dependency warning
   - Issue: Filter and data callbacks
   - Strategy: Type filter and display callbacks

---

### PHASE 3: Medium-Impact Feature Modules (3-4 issues) - 9 Issues

1. **`src/modules/features/service-contracts/views/ServiceContractDetailPage.tsx`**
   - Lines 113, 217, 241, 266
   - 3 `any` errors + 1 useEffect dependency warning

2. **`src/modules/features/complaints/views/ComplaintsPage.tsx`**
   - Lines 59, 167, 238
   - 2 `any` errors + 1 useEffect dependency warning

3. **`src/modules/features/configuration/views/TenantConfigurationPage.tsx`**
   - Line 65, 181
   - 1 `any` error + 1 useEffect dependency warning

4. **`src/modules/features/super-admin/views/SuperAdminConfigurationPage.tsx`**
   - Line 114, 193
   - 1 `any` error + 1 useEffect dependency warning

5. **`src/modules/features/super-admin/views/SuperAdminAnalyticsPage.tsx`**
   - Line 227
   - 1 `any` error

6. **`src/modules/features/super-admin/views/SuperAdminLogsPage.tsx`**
   - Lines 58, 59
   - 2 `any` errors

---

### PHASE 4: Low-Impact Feature Modules (1-2 issues each) - 9 Issues

1. **`src/modules/features/service-contracts/views/ServiceContractsPage.tsx`**
   - Line 334, 94
   - 1 `any` error + 1 useEffect dependency warning

2. **`src/modules/features/customers/views/CustomerDetailPage.tsx`**
   - Line 277
   - 1 `any` error

3. **`src/modules/features/product-sales/views/ProductSalesPage.tsx`**
   - Line 82, 289
   - 1 `any` error + 1 useEffect dependency warning

4. **`src/modules/features/jobworks/views/JobWorksPage.tsx`**
   - Line 125
   - 1 `any` error

5. **`src/modules/features/masters/views/CompaniesPage.tsx`**
   - Line 127
   - 1 `any` error

6. **`src/modules/features/masters/views/ProductsPage.tsx`**
   - Line 131
   - 1 `any` error

7. **`src/modules/features/configuration/routes.tsx`**
   - Line 13
   - 1 react-refresh warning

8. **`src/modules/features/customers/components/CustomerList.tsx`**
   - Lines 35, 41
   - 2 useMemo dependency warnings

---

## Implementation Strategy

### Step 1: Fix Core Infrastructure (Must be done first)
1. Start with `useQuery.ts` - define proper query parameter types
2. Then `store/index.ts` - type store actions and state
3. Fix component exports in PageHeader and StatCard

### Step 2: Fix High-Impact Modules (Tier 1)
1. PDFTemplatesPage - type table operation callbacks
2. NotificationsPage - fix all any types + dependencies
3. SuperAdminTenantsPage - type form handlers

### Step 3: Fix Medium-Impact Modules (Tier 2)
Process each module systematically

### Step 4: Fix Low-Impact Modules (Tier 3)
Quick wins - single or double issues per file

### Step 5: Fix React Hook Warnings
Add missing dependencies to useEffect and useMemo hooks

---

## Common Patterns to Fix

### Pattern 1: Event Handler Any Types
```typescript
// ❌ BEFORE
const handleSave = (data: any) => { ... }

// ✅ AFTER
interface FormData {
  id: string;
  name: string;
  // ... other fields
}
const handleSave = (data: FormData) => { ... }
```

### Pattern 2: Callback Parameters
```typescript
// ❌ BEFORE
const columns = [{ ... render: (text, record: any) => ... }]

// ✅ AFTER
interface RecordType {
  // ... properties
}
const columns = [{ ... render: (text, record: RecordType) => ... }]
```

### Pattern 3: Missing Hook Dependencies
```typescript
// ❌ BEFORE
useEffect(() => {
  fetchData();
}, [])

// ✅ AFTER
useEffect(() => {
  if (fetchData) {
    fetchData();
  }
}, [fetchData]) // Include dependency
```

---

## Estimated Effort

- **Phase 1 (Core)**: 1-2 hours - CRITICAL PATH
- **Phase 2 (High-Impact)**: 2-3 hours
- **Phase 3 (Medium)**: 1-2 hours
- **Phase 4 (Low)**: 30 mins - 1 hour
- **Total**: 5-8 hours

---

## Success Criteria

✅ All `@typescript-eslint/no-explicit-any` warnings resolved
✅ All React Hook dependencies properly configured
✅ All react-refresh warnings eliminated
✅ ESLint passes with `--max-warnings 0`
✅ Pre-commit hook validation passes
✅ No existing functionality broken