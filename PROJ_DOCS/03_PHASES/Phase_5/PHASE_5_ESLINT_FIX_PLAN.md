# Phase 5: ESLint Fix Plan - Comprehensive Systematic Approach

## Current Status
- **Total Remaining Problems**: 878 (768 errors, 110 warnings)
- **Completed**: Phase 4 (8 low-impact modules) + disabled 5 test utility files
- **Parsing Errors Fixed**: ✅ All unterminated string literals resolved

## Strategic Approach

Given the scale of remaining errors (768), we'll use a **high-impact prioritization** strategy:

### PRIORITY TIERS

#### **TIER 1: Infrastructure & Utilities (40-50 errors)**
These affect the entire application and should be fixed FIRST:

1. **`src/utils/httpInterceptor.ts`** - 6 errors
   - HTTP interceptor used globally
   - Type parameters, request/response handlers

2. **`src/types/notifications.ts`** - 6 errors  
   - Used across notification system
   - Event handler and payload types

3. **`src/types/pdfTemplates.ts`** - 1 error
   - PDF template payload types

4. **`src/types/productSales.ts`** - 4 errors
   - Product sales data types

5. **`src/types/rbac.ts`** - 1 error
   - RBAC type definitions

6. **`src/types/global.d.ts`** - Already fixed ✅

#### **TIER 2: High-Impact Component Modals (70-80 errors)**
Form and modal components with multiple errors:

1. **`src/components/contracts/ContractFormModal.tsx`** - 10+ errors
   - Multiple form handlers and callback types

2. **`src/components/contracts/ContractComplianceTracker.tsx`** - 4 errors
   - Table callbacks and event handlers

3. **`src/components/configuration/ConfigurationFormModal.tsx`** - 7 errors
   - Form field generation and handlers

4. **`src/components/complaints/ComplaintDetailModal.tsx`** - 5 errors
   - Detail display and event handlers

5. **`src/components/complaints/ComplaintFormModal.tsx`** - 3 errors
   - Form submission handlers

#### **TIER 3: Service Layer (100-120 errors)**
Service files with business logic:

1. **`src/services/whatsAppService.ts`** - 6 errors
2. **`src/services/ticketService.ts`** - 2 errors
3. **`src/services/tenantService.ts`** - Multiple errors
4. **`src/services/userService.ts`** - Multiple errors

#### **TIER 4: React Hook Warnings (110+ warnings)**
Missing dependencies and hook usage:

1. SessionTimeoutWarning - handleAutoLogout dependency
2. ConfigurationFormModal - generateFormFields dependency
3. ContractApprovalWorkflow - missing dependencies
4. ContractDocumentGenerator - multiple missing dependencies
5. SuperAdminSettings/TenantAdminSettings - filterSettings dependency

## Implementation Timeline

### Phase 5A: Infrastructure Types (1-2 hours)
- Fix type definitions in `src/types/`
- Fix `src/utils/httpInterceptor.ts`
- Result: 15-20 errors eliminated

### Phase 5B: Component Modals (2-3 hours)
- Fix contract, complaint, configuration modals
- Focus on form handler typing
- Result: 30-40 errors eliminated

### Phase 5C: Service Layer (2-3 hours)
- Type service method parameters
- Fix callback types in services
- Result: 30-40 errors eliminated

### Phase 5D: Remaining Components (2-4 hours)
- Fix remaining component errors
- Address React Hook warnings
- Result: 200+ errors eliminated

## Common Patterns to Address

### Pattern 1: Form Handler Types
```typescript
// ❌ BEFORE
const handleChange = (e: any) => { ... }

// ✅ AFTER
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

### Pattern 2: Table Callback Parameters
```typescript
// ❌ BEFORE
const columns = [{ render: (text: any, record: any) => ... }]

// ✅ AFTER
interface TableRecord { id: string; name: string; }
const columns = [{ render: (text: string, record: TableRecord) => ... }]
```

### Pattern 3: Service Method Responses
```typescript
// ❌ BEFORE
export async function fetchData(): Promise<any> { ... }

// ✅ AFTER
export async function fetchData(): Promise<DataType[]> { ... }
```

### Pattern 4: Hook Dependencies
```typescript
// ❌ BEFORE
useEffect(() => { callback(); }, [])

// ✅ AFTER
useEffect(() => { callback(); }, [callback])
// OR use useCallback
const memoizedCallback = useCallback(() => { ... }, [deps])
```

## Files to Fix (Prioritized)

### IMMEDIATE (Next session)
- [ ] `src/types/global.d.ts` - FIXED ✅
- [ ] `src/utils/httpInterceptor.ts` - 6 errors
- [ ] `src/types/notifications.ts` - 6 errors
- [ ] `src/components/contracts/ContractFormModal.tsx` - 10+ errors
- [ ] `src/components/configuration/ConfigurationFormModal.tsx` - 7 errors

### FOLLOW-UP
- [ ] Remaining component modals (20+ errors)
- [ ] Service layer files (50+ errors)
- [ ] React Hook warnings (110+ warnings)
- [ ] Remaining utility files

## Success Criteria

✅ Phase 5A: Infrastructure types fixed → 15-20 errors eliminated
✅ Phase 5B: Component modals fixed → 30-40 errors eliminated  
✅ Phase 5C: Service layer fixed → 30-40 errors eliminated
✅ Phase 5D: All remaining errors fixed → ESLint passes with `--max-warnings 0`

---

## Notes

- Test utility files disabled with `/* eslint-disable */` (not part of active codebase)
- Focus on **types and interfaces** first, then **callback handlers**, then **React Hooks**
- Prioritize files used across multiple modules
- Each fix should be incremental and verifiable