---
title: Service Inventory & Status Matrix
description: Complete listing of all 64+ services with implementation status
date: 2025-01-13
author: AI Agent
---

# Service Inventory & Status Matrix

## Overview
- **Total Services**: 64+
- **Properly Implemented**: 35
- **Mock-Only**: 4
- **Unused**: 4
- **Fragmented**: 8+

---

## CORE SERVICES (Authentication & Auth)

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| authService | `__archived-mocks__/authService.ts` | ✅ | ✅ | ? | ⚠️ Archived | Still imported and used |
| userService | `userService.ts` | ✅ | ✅ | ? | ✅ Active | User management |
| rbacService | `rbacService.ts` | ✅ | ✅ | ? | ✅ Active | Role-based access control |

---

## BUSINESS DOMAIN SERVICES

### Sales & Deals
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| salesService | `api/supabase/salesService.ts` | ✅ | ✅ | ? | ✅ Active | Deal management |
| productSaleService | `productSaleService.ts` | ✅ | ✅ | ? | ✅ Active | Product sales |

### Customers
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| customerService | `__archived-mocks__/customerService.ts` | ✅ | ✅ | ? | ⚠️ Archived | Still used in factory |

### Products & Inventory
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| productService | `productService.ts` | ✅ | ✅ | ? | ✅ Active | Product management |
| jobWorkService | `jobWorkService.ts` | ✅ | ✅ | ? | ✅ Active | Job work operations |

### Operations & Contracts
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| contractService | `supabase/contractService.ts` | ⚠️ Supabase | ✅ | ? | ✅ Active | Contracts module |
| serviceContractService | `supabase/serviceContractService.ts` | ✅ | ✅ | ? | ✅ Active | Service contracts |

### Company Management
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| companyService | `supabase/companyService.ts` | ✅ | ✅ | ? | ✅ Active | Company operations |

### Tickets & Issues
| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| ticketService | `ticketService.ts` | ✅ | ✅ | ? | ✅ Active | Ticket management |
| complaintService | `complaintService.ts` | ✅ | ❌ | 378 | 🔴 **UNUSED** | Mock-only, no Supabase |

---

## TENANT & MULTI-TENANT SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| tenantService | `tenantService.ts` | ✅ | ✅ | ? | ✅ Active | Tenant CRUD |
| multiTenantService | `supabase/multiTenantService.ts` | ❌ | ✅ | ? | ✅ Active | Infrastructure-level |
| tenantMetricsService | `api/supabase/tenantMetricsService.ts` | ❌ | ✅ | ? | ✅ Active | Tenant statistics |
| tenantDirectoryService | `tenantDirectoryService.ts` | ✅ | ✅ | ? | ✅ Active | Tenant directory |

**Issue**: 4 services should be 1-2 unified services

---

## AUDIT & COMPLIANCE SERVICES ⚠️ FRAGMENTED (5 → 1)

| Service | Location | Mock | Supabase | Lines | Status | Consolidate? |
|---------|----------|------|----------|-------|--------|--------------|
| auditService | `auditService.ts` | ✅ | ✅ | ? | ✅ Active | Core audit logs |
| auditRetentionService | `auditRetentionService.ts` | ✅ | ✅ | 392 | ✅ Active | Retention policies |
| auditDashboardService | `auditDashboardService.ts` | ? | ? | ? | ✅ Active | Audit metrics |
| complianceReportService | `complianceReportService.ts` | ✅ | ✅ | ? | ✅ Active | Compliance reports |
| impersonationActionTracker | `impersonationActionTracker.ts` | ✅ | ✅ | ? | ✅ Active | Impersonation tracking |

**Consolidation**: Merge into single `auditService` with sub-methods

---

## RATE LIMITING SERVICES ⚠️ DUPLICATED (2 → 1)

| Service | Location | Mock | Supabase | Lines | Status | Consolidate? |
|---------|----------|------|----------|-------|--------|--------------|
| rateLimitService | `rateLimitService.ts` | ✅ | ✅ | ? | ✅ Active | General rate limiting |
| impersonationRateLimitService | `impersonationRateLimitService.ts` | ✅ | ✅ | ? | ✅ Active | Impersonation-specific |

**Consolidation**: Merge into single `rateLimitService` with target parameter

---

## NOTIFICATION SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| notificationService | `notificationService.ts` | ✅ | ✅ | ? | ✅ Active | Backend notifications |
| uiNotificationService | `uiNotificationService.ts` | ✅ | ✅ | ? | ✅ Active | Client-side UI notifications |
| complianceNotificationService | `api/supabase/complianceNotificationService.ts` | ✅ | ✅ | ? | ✅ Active | Compliance alerts |

---

## FILE & STORAGE SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| fileService | `fileService.ts` | ✅ | ❌ | 266 | 🔴 **UNUSED** | Mock-only, no Supabase |
| dashboardService | `dashboardService.ts` | ✅ | ? | 407 | ⚠️ Not in factory | Partially implemented |

---

## ADMIN & MANAGEMENT SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| superAdminService | `superAdminService.ts` | ✅ | ✅ | ? | ✅ Active | Super admin operations |
| superAdminManagementService | `api/supabase/superAdminManagementService.ts` | ✅ | ✅ | ? | ✅ Active | Admin lifecycle management |
| roleRequestService | `roleRequestService.ts` | ✅ | ✅ | ? | ✅ Active | Role elevation requests |
| impersonationService | `api/supabase/impersonationService.ts` | ❌ | ✅ | ? | ✅ Active | Impersonation session mgmt |

---

## REFERENCE DATA SERVICES ⚠️ SPLIT (2 → 1)

| Service | Location | Mock | Supabase | Lines | Status | Consolidate? |
|---------|----------|------|----------|-------|--------|--------------|
| referenceDataService | `api/supabase/referenceDataService.ts` | ✅ | ✅ | ? | ✅ Active | Reference data |
| referenceDataLoader | `api/supabase/referenceDataLoader.ts` | ✅ | ✅ | ? | ✅ Active | Loader/cache |

**Consolidation**: Merge into single service or document cache pattern

---

## SESSION & CONFIGURATION SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| sessionConfigService | `sessionConfigService.ts` | ✅ | N/A | ? | ⚠️ Special | Client-side only |

**Issue**: Should be in auth context, not a service

---

## INFRASTRUCTURE/UTILITY SERVICES

| Service | Location | Mock | Supabase | Lines | Status | Notes |
|---------|----------|------|----------|-------|--------|-------|
| baseApiService | `api/baseApiService.ts` | N/A | N/A | ? | ✅ Utility | Base API wrapper |
| baseService | `supabase/baseService.ts` | N/A | N/A | ? | ✅ Utility | Supabase base class |
| authService (Supabase) | `supabase/authService.ts` | ✅ | ✅ | ? | ✅ Active | Supabase auth |

---

## ARCHIVED/DEPRECATED

| Service | Location | Status | Action |
|---------|----------|--------|--------|
| authService (archived) | `__archived-mocks__/authService.ts` | ⚠️ Still used | Remove imports or restore |
| customerService (archived) | `__archived-mocks__/customerService.ts` | ⚠️ Still used | Remove imports or restore |
| salesService (archived) | `__archived-mocks__/salesService.ts` | ⚠️ Still used | Remove imports or restore |
| contractService (renamed) | (moved to __archived-mocks__) | ⚠️ Incomplete | Complete cleanup |

---

## SUMMARY BY STATUS

### ✅ ACTIVE & PROPERLY IMPLEMENTED (35 services)
```
✅ productSaleService
✅ jobWorkService
✅ notificationService
✅ tenantService
✅ ticketService
✅ productService
✅ contractService (Contracts)
✅ serviceContractService
✅ companyService
✅ userService
✅ rbacService
✅ authService
✅ salesService
✅ customerService
✅ auditService
✅ auditRetentionService
✅ auditDashboardService
✅ complianceReportService
✅ impersonationActionTracker
✅ rateLimitService
✅ impersonationRateLimitService
✅ superAdminService
✅ superAdminManagementService
✅ roleRequestService
✅ impersonationService
✅ referenceDataService
✅ referenceDataLoader
✅ tenantMetricsService
✅ tenantDirectoryService
✅ multiTenantService
✅ complianceNotificationService
✅ uiNotificationService
✅ baseApiService
✅ baseService
```

### 🔴 UNUSED (4 services)
```
❌ complaintService (378 lines) - Mock only, never used
❌ fileService (266 lines) - Mock only, never used
❌ sessionConfigService (?) - Client-side, should be context
❌ dashboardService (407 lines) - Exists but not in factory
```

### ⚠️ FRAGMENTED (8+ services that should be consolidated)
```
Audit Services (5 → 1):
  auditService
  auditRetentionService
  auditDashboardService
  complianceReportService
  impersonationActionTracker

Rate Limiting (2 → 1):
  rateLimitService
  impersonationRateLimitService

Reference Data (2 → 1):
  referenceDataService
  referenceDataLoader

Tenant Services (4 → 1):
  tenantService
  tenantMetricsService
  tenantDirectoryService
  multiTenantService
```

### 🟡 ARCHIVED BUT STILL USED (3 services)
```
⚠️ __archived-mocks__/authService.ts
⚠️ __archived-mocks__/customerService.ts
⚠️ __archived-mocks__/salesService.ts
```

---

## SERVICE FACTORY STRUCTURE

### Root Services Factory (serviceFactory.ts - 1538 lines)
- Registers 40+ services
- Contains 900+ lines of boilerplate exports
- Needs to be merged with apiServiceFactory

### API Services Factory (apiServiceFactory.ts - 477 lines)
- Registers 15+ services
- Overlaps with serviceFactory
- Should be merged

### Main Exports (index.ts - 146 lines)
- Re-exports from both factories
- Confusing API surface
- Needs cleanup

---

## RECOMMENDATIONS MATRIX

| Service | Action | Priority | Effort | Impact |
|---------|--------|----------|--------|--------|
| complaintService | DELETE | Critical | 1 hour | Remove 378 lines of dead code |
| fileService | DELETE or implement | Critical | 2 hours | Remove 266 lines or complete |
| sessionConfigService | Move to context | High | 2 hours | Reduce factory bloat |
| dashboardService | Expose or delete | High | 4 hours | Clarify API surface |
| Audit services (5) | Consolidate | High | 16 hours | Reduce 5 files to 1 |
| Rate limiting (2) | Consolidate | High | 8 hours | Reduce 2 files to 1 |
| apiServiceFactory | Merge | Critical | 24 hours | Unify architecture |
| Boilerplate exports | Remove | Medium | 8 hours | Reduce 1538 → 600 lines |

---

## TOTAL CONSOLIDATION POTENTIAL

| Metric | Current | Target | Reduction |
|--------|---------|--------|-----------|
| Service files | 64+ | 35-40 | 45% |
| Factory lines | 1538 | 600 | 60% |
| Boilerplate lines | 900+ | 100 | 90% |
| Mock-only services | 4 | 0 | 100% |
| Fragmented groups | 8+ | 0 | 100% |

---

**Generated**: 2025-01-13  
**Last Updated**: 2025-01-13  
**Status**: Ready for Consolidation
