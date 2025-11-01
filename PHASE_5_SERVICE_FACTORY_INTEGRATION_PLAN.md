---
phase: 5
title: Service Factory Integration Rollout - Multi-Module Standardization
startDate: 2025-01-30
status: IN_PROGRESS
---

# Phase 5: Service Factory Integration Rollout

## 📊 Overview

After successfully completing Phase 4 (Contract Module factory integration), Phase 5 focuses on **systematically applying the same Service Factory pattern to remaining modules** that currently use legacy service imports.

**Objective**: Achieve 100% service factory usage across all modules for seamless mock/Supabase switching.

---

## 🎯 Target Modules & Current Status

### ✅ PHASE 4 COMPLETE
- **Contracts Module** ✅ 
  - File: `/src/modules/features/contracts/services/contractService.ts`
  - Status: Factory-routed via `contractService` from serviceFactory
  - Methods: 9/9 delegating to factory

### 🔄 PHASE 5.1: Sales Module (HIGH PRIORITY)
- **File**: `/src/modules/features/sales/services/salesService.ts`
- **Current Issue**: Uses `legacySalesService` (line 9)
- **Fix Required**: Update to use `salesService` from serviceFactory
- **Methods to Update**: ~12 methods
- **Impact**: Deal management, sales pipeline operations

### 🔄 PHASE 5.2: Tickets Module (HIGH PRIORITY)
- **File**: `/src/modules/features/tickets/services/ticketService.ts`
- **Current Issue**: Uses `legacyTicketService` (line 9)
- **Fix Required**: Update to use factory-routed service
- **Methods to Update**: ~10 methods
- **Impact**: Ticket management, support operations

### 🔄 PHASE 5.3: Customers Module (VERIFY STATUS)
- **File**: `/src/modules/features/customers/services/customerService.ts`
- **Current Status**: Uses `apiServiceFactory` (line 10)
- **Note**: May need alignment with main serviceFactory pattern
- **Status**: Likely already factory-routed but different factory

### 🔄 PHASE 5.4: Job Works Module (MEDIUM PRIORITY)
- **File**: `/src/modules/features/jobworks/services/jobWorksService.ts`
- **Status**: TBD - needs verification
- **Impact**: Job work management

### 🔄 PHASE 5.5: Other Specialty Services (LOWER PRIORITY)
Product Sales sub-services that may need verification:
- `productSalesAuditService.ts` - Uses `auditService`
- `invoiceService.ts` - May use legacy imports
- `statusTransitionService.ts` - May use legacy imports
- Other workflow/notification services

---

## 🔧 Implementation Strategy

### Standard Pattern for All Modules
```typescript
// ❌ OLD (Legacy approach)
import { salesService as legacySalesService } from '@/services';

// ✅ NEW (Factory pattern)
import { salesService as factorySalesService } from '@/services/serviceFactory';

// Implementation delegates to factory
async getDeals(filters?: SalesFilters) {
  return factorySalesService.getDeals(filters);
}
```

### Execution Order (Highest to Lowest Impact)
1. **Sales Module** - Core CRM functionality (deals)
2. **Tickets Module** - Customer support operations
3. **Customers Module** - Verify/align factory pattern
4. **Job Works Module** - Business operations
5. **Specialty Services** - Supporting services

---

## ✅ Phase 5.1: Sales Module Integration

### Changes Required

**File**: `/src/modules/features/sales/services/salesService.ts`

```diff
- import { salesService as legacySalesService } from '@/services';
+ import { salesService as factorySalesService } from '@/services/serviceFactory';
```

**Methods to Update**:
1. `getDeals()` - Factory delegate
2. `getDeal()` - Factory delegate
3. `createDeal()` - Factory delegate
4. `updateDeal()` - Factory delegate
5. `deleteDeal()` - Factory delegate
6. `getDealStats()` - Factory delegate
7. `getDealsByStage()` - Factory delegate
8. `getDealsByCustomer()` - Factory delegate
9. `getDealsByAssignee()` - Factory delegate
10. `getOpportunitiesByCustomer()` - Factory delegate
11. `convertDealToContract()` - Factory delegate
12. Custom methods - Review for factory routing

### Documentation Update
- Add module-level comment explaining factory pattern
- Add warning about Sales vs Product Sales modules
- Reference Phase 4 Contract module for pattern example

---

## ✅ Phase 5.2: Tickets Module Integration

### Changes Required

**File**: `/src/modules/features/tickets/services/ticketService.ts`

```diff
- import { ticketService as legacyTicketService } from '@/services';
+ import { ticketService as factorySalesService } from '@/services/serviceFactory';
```

**Methods to Update**:
1. `getTickets()` - Factory delegate
2. `getTicket()` - Factory delegate
3. `createTicket()` - Factory delegate
4. `updateTicket()` - Factory delegate
5. `deleteTicket()` - Factory delegate
6. `getTicketStats()` - Factory delegate
7. `getTicketsByCustomer()` - Factory delegate
8. `getTicketsByAssignee()` - Factory delegate
9. `getOverdueTickets()` - Factory delegate
10. `resolveTicket()` - Factory delegate

### Documentation Update
- Add factory pattern explanation
- Reference Service Factory architecture
- Include multi-tenant context explanation

---

## 📋 Service Factory Exports (Reference)

Current exports in `serviceFactory.ts`:
- ✅ `contractService` - Contracts module
- ✅ `productSaleService` - Product Sales module
- ✅ `salesService` - Sales module (deals)
- ✅ `customerService` - Customer module
- ✅ `jobWorkService` - Job Work module
- ✅ `ticketService` - Ticket module
- ✅ `userService` - User management
- ✅ `rbacService` - Role-based access control
- ✅ `notificationService` - Notifications
- ✅ `serviceContractService` - Service Contracts module

**Note**: All core services are already exported with proxy methods from serviceFactory!

---

## 🔍 Verification Checklist

For each module service update, verify:

- [ ] Legacy import removed (no `legacySalesService`, `legacyTicketService`, etc.)
- [ ] Factory import added: `import { XXXService as factoryXXXService } from '@/services/serviceFactory'`
- [ ] All methods delegate to factory service
- [ ] No business logic remains in module service (delegation only)
- [ ] Type definitions preserved
- [ ] Filter interfaces compatible with factory service
- [ ] Documentation updated with factory explanation
- [ ] Module/Service distinction clearly noted (if applicable)
- [ ] Build passes without errors
- [ ] No TypeScript compilation warnings

---

## 🏗️ Architecture After Phase 5

```
┌──────────────────────────────────────────┐
│         All Module Services              │
│  Sales, Tickets, Customers, JobWorks    │
│  Product Sales, Contracts, etc.         │
└────────────────┬─────────────────────────┘
                 │ All delegate to
┌────────────────▼─────────────────────────┐
│      Unified Service Factory             │
│   serviceFactory.ts (SINGLE ROUTER)      │
└────────────────┬─────────────────────────┘
                 │ Routes based on
                 │ VITE_API_MODE env var
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼───┐      ┌─────▼──────┐
    │  MOCK  │      │  SUPABASE  │
    │ Backend│      │  Backend   │
    └────────┘      └────────────┘
```

**Benefits**:
- ✅ Single point of truth for backend routing
- ✅ Environment-based switching (VITE_API_MODE)
- ✅ Consistent multi-tenant support
- ✅ No "Unauthorized" errors from mixed backends
- ✅ All modules follow same pattern
- ✅ Easy to add new backends in future

---

## 📊 Progress Tracking

| Module | File | Status | Priority | ETA |
|--------|------|--------|----------|-----|
| Sales | `sales/services/salesService.ts` | 🔄 TODO | HIGH | Phase 5.1 |
| Tickets | `tickets/services/ticketService.ts` | 🔄 TODO | HIGH | Phase 5.2 |
| Customers | `customers/services/customerService.ts` | ⏳ VERIFY | MEDIUM | Phase 5.3 |
| JobWorks | `jobworks/services/jobWorksService.ts` | ⏳ VERIFY | MEDIUM | Phase 5.4 |
| Contracts | `contracts/services/contractService.ts` | ✅ DONE | - | Phase 4 |

---

## 🚀 Execution Plan

### Step 1: Sales Module (5-10 mins)
1. Open `/src/modules/features/sales/services/salesService.ts`
2. Replace `legacySalesService` import with factory import
3. Update all method implementations to delegate to factory
4. Add documentation comments
5. Build and verify

### Step 2: Tickets Module (5-10 mins)
1. Open `/src/modules/features/tickets/services/ticketService.ts`
2. Replace `legacyTicketService` import with factory import
3. Update all method implementations to delegate to factory
4. Add documentation comments
5. Build and verify

### Step 3: Verify Customers Module (3-5 mins)
1. Check if needs alignment with main serviceFactory
2. Update if necessary or document current approach

### Step 4: Verify JobWorks Module (3-5 mins)
1. Check current implementation
2. Update if using legacy imports

### Step 5: Product Sales Audit (5-10 mins)
1. Review specialty services in product-sales module
2. Update any legacy imports
3. Ensure consistency with factory pattern

### Step 6: Build & Deploy (5 mins)
1. Full production build
2. Verify no errors/warnings
3. Test factory routing

---

## 📝 Notes

- **No Breaking Changes**: All changes are backward compatible
- **Type Safety**: Full TypeScript support maintained
- **Multi-tenant Support**: Supabase tenant context automatically maintained
- **Testing**: Existing tests should still pass (no logic changes)
- **Documentation**: Each update includes module-level documentation

---

## 🎯 Success Criteria

✅ All 12+ core module services use serviceFactory pattern  
✅ No legacy service imports in module services  
✅ 100% method delegation to factory (no redundant logic)  
✅ Full TypeScript compliance  
✅ Build clean (no errors/warnings from these changes)  
✅ All existing functionality preserved  
✅ Clear documentation on factory pattern  
✅ Ready for future Phase 6 (optional CI/CD automation)  

---

## 🔄 Next Steps (Phase 6+)

- Optional: CI/CD automation for service factory verification
- Optional: Add service factory validation tests
- Optional: Create service factory documentation site
- Optional: Performance monitoring for factory routing

---

**Last Updated**: 2025-01-30  
**Phase Status**: IN_PROGRESS  
**Next Action**: Execute Phase 5.1 (Sales Module)