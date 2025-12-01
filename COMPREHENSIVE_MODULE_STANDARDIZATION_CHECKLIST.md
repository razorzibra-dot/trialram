# 🎯 COMPREHENSIVE MODULE STANDARDIZATION CHECKLIST
## Complete Implementation Guide - Zero Missing Areas

**Document Version**: 1.0  
**Date**: 2025-01-30  
**Status**: Master Implementation Guide  
**Target**: 100% Clean & Standardized Application  

---

## 📋 TABLE OF CONTENTS

1. [Standardization Rules & Agent Guidelines](#standardization-rules--agent-guidelines)
2. [Architecture Overview & Dependencies](#architecture-overview--dependencies)
3. [Master Module Checklist](#master-module-checklist)
4. [Per-Module Detailed Checklist Template](#per-module-detailed-checklist-template)
5. [Integration Verification Points](#integration-verification-points)
6. [Layer-by-Layer Implementation Order](#layer-by-layer-implementation-order)
7. [Quick Reference: All Checkpoints](#quick-reference-all-checkpoints)

---

## 🔒 STANDARDIZATION RULES & AGENT GUIDELINES

### **RULE #1: Layered Verification Order** ⚠️ CRITICAL
Every module fix MUST follow this exact order. Do NOT skip layers.

```
LAYER 1: Foundation (Types & DTOs)
  ↓
LAYER 2: Backend Services (Factory + Implementations)
  ↓
LAYER 3: Database & Authentication
  ↓
LAYER 4: Frontend Integration
  ↓
LAYER 5: UI Components & Hooks
  ↓
LAYER 6: Testing & Verification
```

**WHY**: Changing UI first without updating backend services causes cascading issues.

---

### **RULE #2: The "5-Minute Dependency Check"** 🔍

Before making ANY change:
1. Search for file name in codebase: `grep -r "fileName" src/`
2. Document EVERY import location
3. Check ALL usages before modifying
4. Update ALL references simultaneously
5. Verify NO broken imports after change

**Files That MUST Be Checked**:
- ❌ Do NOT modify without checking: Service implementations, Type definitions, Factory exports
- ❌ Do NOT add without factory routing: New services must use serviceFactory pattern
- ❌ Do NOT modify UI without checking: Service layer changes

---

### **RULE #3: The "Three Backend Rule"** 🔄

Every service MUST work identically with:
```
✅ VITE_API_MODE=mock     
✅ VITE_API_MODE=supabase 
```

**Testing Before Completing**:
```bash
# Test 1: Mock backend
VITE_API_MODE=mock npm run dev
# Verify: Check feature works, console shows mock data

# Test 2: Supabase backend
VITE_API_MODE=supabase npm run dev
# Verify: Check feature works, console shows Supabase data

# Test 3: Data consistency
# Verify: Both backends show identical data structure/format
```

---

### **RULE #4: The "DTO First" Principle** 📦

Before touching ANY code:
1. Define DTO interface in `src/types/dtos/[moduleName]Dtos.ts`
2. Document field mapping (mock → DTO, Supabase → DTO)
3. Add validation comments to DTO
4. THEN implement services
5. THEN update UI

**Violation Prevention**: TypeScript compiler will catch type mismatches immediately.

---

### **RULE #5: Multi-Tenant Context Preservation** 👥

Every operation MUST maintain multi-tenant isolation:

```typescript
// ✅ CORRECT - Tenant context maintained
const { tenantId } = getCurrentUser();  // From auth context
const data = await factoryService.getModuleData(tenantId);

// ❌ WRONG - Tenant context lost
const data = await factoryService.getModuleData();  // Missing tenantId!
```

**Verification Checklist for Each Change**:
- [ ] Service layer receives `tenantId` parameter
- [ ] Service passes `tenantId` to Supabase/mock backend
- [ ] Supabase RLS policies filter by tenant
- [ ] Mock data seeded per tenant
- [ ] Component passes current tenant context

---

### **RULE #6: RBAC Permission Validation** 🔐

Every operation MUST check permissions:

```typescript
// ✅ CORRECT - Permission checked before action
await rbacService.validatePermission(userId, 'module:action:permission');
if (hasPermission) {
  await service.performAction();
}

// ❌ WRONG - No permission check
await service.performAction();  // Anyone can do this!
```

**Verification for Each Feature**:
- [ ] Read permission checked: `module:view` or `module:read`
- [ ] Create permission checked: `module:create`
- [ ] Edit permission checked: `module:edit` or `module:update`
- [ ] Delete permission checked: `module:delete`
- [ ] Export permission checked (if applicable): `module:export`
- [ ] RBAC middleware enforced at service layer

---

### **RULE #7: Field Naming Consistency** 📝

ALL field names MUST follow standardized pattern across entire application:

```
❌ NEVER MIX:
  - total vs totalCustomers vs customer_count (Pick ONE)
  - active vs activeCount vs active_customers (Pick ONE)
  - closed_won vs closedWon vs ClosedWonDeals (Pick ONE)

✅ ALWAYS USE:
  - Camel case: totalCustomers, activeCustomers, closedWonDeals
  - Descriptive: Include entity name (not just "total", use "totalDeals")
  - Consistent across mock, Supabase, and UI layers
  - Standardized in DTO
```

**Implementation Rule**: If changing field name, update in ALL 3 places:
1. Supabase Service returns: `totalDeals`
2. Mock Service returns: `totalDeals`
3. UI expects: `stats.totalDeals`

---

### **RULE #8: Schema Integrity** 🗄️

Database changes MUST be coordinated:

```
Schema Change Required?
  ↓
Create migration file: `supabase/migrations/[date]_[description].sql`
  ↓
Update supabase service to use new columns
  ↓
Add seed data for new fields
  ↓
Update DTO to include new fields
  ↓
Test with migration locally first
  ↓
Only then deploy to production
```

---

### **RULE #9: Seeding Data Completeness** 🌱

Every module MUST have complete seed data:

```sql
-- ✅ CORRECT - Complete data for testing
INSERT INTO tenants (id, name, status) 
VALUES ('tenant_1', 'Test Company', 'active');

INSERT INTO users (id, email, role, tenant_id)
VALUES ('user_1', 'user@test.com', 'admin', 'tenant_1');

INSERT INTO [module_table] (id, [fields], tenant_id, created_by)
VALUES (..., 'tenant_1', 'user_1');

-- ❌ WRONG - Incomplete data
INSERT INTO [module_table] (id, [required_fields])  -- Missing tenant_id!
VALUES (...);
```

**Verification**:
- [ ] Test company/tenant created with seed
- [ ] Test users created with proper roles
- [ ] Test data created for each module
- [ ] Tenant context properly set in seed
- [ ] RBAC role assignments included
- [ ] Multiple data records for pagination testing

---

### **RULE #10: Zero Console Errors** 🚨

After EVERY change:
```bash
npm run lint        # Must pass with 0 errors
npm run build       # Must succeed with 0 warnings (TS errors caught)
npm run dev         # Start server
# Check Browser Console: MUST be completely empty (no errors)
```

**If ANY error appears**:
1. STOP all further changes
2. Fix error immediately
3. Re-verify from current module
4. Only then proceed to next module

---

---

## 🏗️ ARCHITECTURE OVERVIEW & DEPENDENCIES

### **The Complete Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UI LAYER                                                      │
│ ├─ React Components (ProductSalesPage.tsx, etc.)               │
│ ├─ Custom Hooks (useProductSalesAnalytics.ts)                  │
│ └─ State Management (zustand stores, React Query)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TYPE/DTO LAYER                                               │
│ ├─ DTO Interfaces (ProductSalesAnalyticsDTO)                   │
│ ├─ Component Props Types                                        │
│ └─ Field Mapping Documentation                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SERVICE FACTORY LAYER                                        │
│ ├─ src/services/serviceFactory.ts                              │
│ ├─ Routes to appropriate backend based on VITE_API_MODE        │
│ └─ Ensures API consistency                                      │
└─────────────────────────────────────────────────────────────────┘
                       ↙                          ↘
┌─────────────────────────────────┐    ┌──────────────────────────┐
│ 4a. MOCK BACKEND                │    │ 4b. SUPABASE BACKEND     │
│ ├─ src/services/               │    │ ├─ src/services/api/     │
│ │  [moduleName]Service.ts       │    │ │  supabase/             │
│ ├─ Returns mock data            │    │ │  [moduleName]Service   │
│ ├─ Field names standardized     │    │ ├─ Queries Supabase DB   │
│ └─ Same structure as Supabase   │    │ ├─ Field names standard  │
│                                  │    │ └─ Enforces RLS policies │
└─────────────────────────────────┘    └──────────────────────────┘
                       ↘                          ↙
┌─────────────────────────────────────────────────────────────────┐
│ 5. AUTHENTICATION & AUTHORIZATION LAYER                         │
│ ├─ authService.ts (JWT, current user, tenant context)         │
│ ├─ rbacService.ts (permissions, roles, audit logging)         │
│ ├─ Multi-tenant context enforcement                            │
│ └─ Row-Level Security (RLS) policies in Supabase              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. DATABASE LAYER                                               │
│ ├─ PostgreSQL via Supabase                                     │
│ ├─ Tables with tenant_id foreign key                           │
│ ├─ RLS policies enforcing tenant isolation                     │
│ ├─ Audit triggers logging all changes                          │
│ └─ Seed data ensuring test completeness                        │
└─────────────────────────────────────────────────────────────────┘
```

### **Critical Dependency Relationships**

```mermaid
UI Layer
  ├─ Imports Types/DTOs
  ├─ Calls Custom Hooks
  └─ Hooks use Service Factory
  
Service Factory
  ├─ Reads VITE_API_MODE
  └─ Routes to Mock OR Supabase
  
Mock Service
  ├─ Returns DTO-compliant data
  └─ Matches Supabase structure
  
Supabase Service
  ├─ Queries Database Tables
  ├─ Enforces RLS Policies
  ├─ Maintains Tenant Context
  └─ Checks RBAC Permissions
  
Database
  ├─ Tables with Tenant Isolation
  ├─ RLS Policies Active
  ├─ Audit Triggers Enabled
  └─ Seeded with Test Data
  
Authentication
  ├─ Validates JWT Token
  ├─ Provides User Context
  ├─ Enforces Permissions
  └─ Maintains Tenant ID
```

---

## 📊 MASTER MODULE CHECKLIST

### **All 12+ Modules to Standardize**

| # | Module | Priority | Status | Estimated Time | Notes |
|---|--------|----------|--------|-----------------|-------|
| 1 | Customers | 🟢 Complete | ✅ Done | 0h (reference) | Use as pattern |
| 2 | Product Sales | 🔴 Critical | ⏳ Ready | 2h | Analytics broken |
| 3 | Sales (Deals) | 🔴 Critical | ⏳ Ready | 2h | Dashboard broken |
| 4 | Tickets | 🔴 Critical | ⏳ Ready | 1.5h | Stats broken |
| 5 | Contracts | 🟡 Medium | ⏳ Ready | 1.5h | Secondary |
| 6 | Service Contracts | 🟡 Medium | ⏳ Ready | 1.5h | Secondary |
| 7 | Job Work | 🟡 Medium | ⏳ Ready | 1.5h | Secondary |
| 8 | Complaints | 🟡 Medium | ⏳ Ready | 1.5h | Secondary |
| 9 | Notifications | 🟢 Low | ⏳ Ready | 1h | Supporting |
| 10 | Users | 🟢 Low | ⏳ Ready | 1h | Supporting |
| 11 | Companies | 🟢 Low | ⏳ Ready | 1h | Supporting |
| 12 | Dashboard | 🟢 Low | ⏳ Ready | 1h | Aggregator |

**Timeline**: Follow order above. Time estimates assume strict adherence to this checklist.

---

## 📋 PER-MODULE DETAILED CHECKLIST TEMPLATE

Use this template for EACH module. Do NOT skip any section.

### **📌 MODULE: [Module Name]**

#### **PHASE 0: PRE-IMPLEMENTATION VERIFICATION**

- [ ] Module identified and isolated
- [ ] All imports of this module documented (grep -r)
- [ ] Dependencies mapped (what does this module depend on?)
- [ ] Dependents mapped (what depends on this module?)
- [ ] Current state documented (what's working, what's broken)
- [ ] Team informed of changes
- [ ] Feature branch created: `feature/standardize-[module-name]`

---

#### **PHASE 1: DTO & TYPE DEFINITIONS** (Foundation)

**Files**: `src/types/dtos/[module]Dtos.ts`

- [ ] **DTO interfaces created for main entities**
  - [ ] Primary entity DTO (e.g., `ProductSaleDTO`)
  - [ ] Analytics DTO (e.g., `ProductSalesAnalyticsDTO`)
  - [ ] List response DTO (e.g., `ProductSaleListResponseDTO`)
  - [ ] Filter DTO (e.g., `ProductSaleFilterDTO`)
  - [ ] Create request DTO (e.g., `CreateProductSaleDTO`)
  - [ ] Update request DTO (e.g., `UpdateProductSaleDTO`)

- [ ] **Field naming standardized in all DTOs**
  - [ ] No abbreviated names (use `totalSales` not `total`)
  - [ ] Include entity in name (use `closedDeals` not `closed`)
  - [ ] Consistent camelCase across all DTOs
  - [ ] Documentation comment for each field
  - [ ] Field types validated against database schema

- [ ] **DTO imported in service implementations**
  - [ ] Added: `import type { [EntityDTO] } from '@/types/dtos'`
  - [ ] Export statements added: `export { [EntityDTO] } from '@/types/dtos'`
  - [ ] Verified zero import errors

- [ ] **Field mapping documented**
  ```typescript
  // Field Mapping Reference
  // Database → DTO Field Mapping
  // - total_sales → totalSales
  // - completed_sales → completedSales
  // (etc for all fields)
  ```

---

#### **PHASE 2: SERVICE FACTORY SETUP** (Backend Routing)

**Files**: `src/services/serviceFactory.ts`, `src/services/index.ts`

- [ ] **Factory functions created**
  - [ ] `get[Module]Service()` function added
  - [ ] Returns correct implementation based on `VITE_API_MODE`
  - [ ] Handles both 'mock' and 'supabase' modes

- [ ] **Factory exports added**
  - [ ] Added: `export const [module]Service = { ... }`
  - [ ] All service methods proxied through factory
  - [ ] Example:
    ```typescript
    export const productSaleService = {
      getAnalytics: (tenantId) => getProductSaleService().getAnalytics(tenantId),
      getList: (tenantId, filters) => getProductSaleService().getList(tenantId, filters),
      // ... all other methods
    };
    ```

- [ ] **Main index exports updated**
  - [ ] Added to `src/services/index.ts`:
    ```typescript
    export { [module]Service } from './serviceFactory'
    ```

---

#### **PHASE 3: MOCK SERVICE IMPLEMENTATION** (Development Backend)

**Files**: `src/services/[module]Service.ts`

- [ ] **Mock data seeded**
  - [ ] Multiple test records created (minimum 10-20 records)
  - [ ] Realistic data that matches production patterns
  - [ ] Includes all DTO fields
  - [ ] Tenant context included: `tenantId: 'mock-tenant'`

- [ ] **Return types standardized**
  - [ ] All methods return DTOs (not raw mock data)
  - [ ] Return type annotations added: `Promise<[EntityDTO]>`
  - [ ] Field mapping applied: mock data → DTO structure

- [ ] **Example method implementation**:
  ```typescript
  async getAnalytics(tenantId: string): Promise<ProductSalesAnalyticsDTO> {
    const mockData = this.getMockData();
    return {
      totalSales: mockData.sales.length,
      completedSales: mockData.sales.filter(s => s.status === 'completed').length,
      pendingSales: mockData.sales.filter(s => s.status === 'pending').length,
      totalRevenue: mockData.sales.reduce((sum, s) => sum + s.amount, 0),
      averageSaleValue: this.calculateAverage(mockData.sales),
      lastUpdated: new Date(),
    };
  }
  ```

- [ ] **All service methods implemented**
  - [ ] `getList()` method - returns `[EntityDTO][]` with pagination
  - [ ] `get()` method - returns single `EntityDTO`
  - [ ] `create()` method - accepts `CreateDTO`, returns `EntityDTO`
  - [ ] `update()` method - accepts `UpdateDTO`, returns `EntityDTO`
  - [ ] `delete()` method - returns success status
  - [ ] `getAnalytics()` method - returns `AnalyticsDTO`
  - [ ] `getStats()` method - returns statistics

- [ ] **Error handling implemented**
  - [ ] Returns proper error messages
  - [ ] Validates input parameters
  - [ ] Checks tenant context
  - [ ] Logs operations for debugging

---

#### **PHASE 4: SUPABASE SERVICE IMPLEMENTATION** (Production Backend)

**Files**: `src/services/api/supabase/[module]Service.ts`

- [ ] **Database table queried correctly**
  - [ ] Table name verified: `[module_table_name]`
  - [ ] Columns match database schema
  - [ ] Tenant filtering applied: `where: { tenant_id: tenantId }`

- [ ] **Return types standardized**
  - [ ] All methods return DTOs: `Promise<[EntityDTO]>`
  - [ ] Field mapping applied: database → DTO
  - [ ] Example:
    ```typescript
    async getAnalytics(tenantId: string): Promise<ProductSalesAnalyticsDTO> {
      const { data, error } = await supabase
        .from('product_sales')
        .select('*')
        .eq('tenant_id', tenantId);
      
      return {
        totalSales: data?.length ?? 0,
        completedSales: data?.filter(s => s.status === 'completed').length ?? 0,
        // ... map all fields to DTO
      };
    }
    ```

- [ ] **RLS policies enforced**
  - [ ] Row-Level Security enabled on table
  - [ ] Policies filter by: `auth.uid()` and `tenant_id`
  - [ ] Read policy verifies user belongs to tenant
  - [ ] Write policies check permissions via RBAC

- [ ] **All service methods implemented**
  - [ ] `getList()` - queries with pagination
  - [ ] `get()` - queries single record
  - [ ] `create()` - inserts with default values (created_by, created_at, tenant_id)
  - [ ] `update()` - updates with timestamp (updated_at)
  - [ ] `delete()` - soft delete or hard delete (configured)
  - [ ] `getAnalytics()` - aggregates data
  - [ ] `getStats()` - calculates statistics

- [ ] **Error handling implemented**
  - [ ] Returns Supabase errors with context
  - [ ] Logs operations to audit trail
  - [ ] Handles network failures gracefully
  - [ ] Provides meaningful error messages

---

#### **PHASE 5: DATABASE SCHEMA VERIFICATION** (Data Layer)

**Files**: `supabase/migrations/`, `supabase/seed.sql`

- [ ] **Database table exists**
  - [ ] Table name: `[module_table_name]`
  - [ ] Columns match service implementation
  - [ ] Primary key: `id`
  - [ ] Tenant column: `tenant_id` (foreign key to `tenants.id`)
  - [ ] Audit columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`

- [ ] **Column data types correct**
  - [ ] String fields: `VARCHAR` or `TEXT`
  - [ ] Numeric fields: `INT`, `BIGINT`, or `NUMERIC`
  - [ ] Boolean fields: `BOOLEAN`
  - [ ] Date fields: `TIMESTAMP WITH TIME ZONE`
  - [ ] JSON fields: `JSONB`

- [ ] **Constraints properly defined**
  - [ ] NOT NULL constraints on required fields
  - [ ] UNIQUE constraints where needed
  - [ ] CHECK constraints for valid values
  - [ ] Foreign key constraints to related tables
  - [ ] Default values set appropriately

- [ ] **Indexes created for performance**
  - [ ] Index on `tenant_id`
  - [ ] Index on `created_at` (for sorting)
  - [ ] Index on `status` (if applicable)
  - [ ] Compound indexes for common filters

---

#### **PHASE 6: ROW-LEVEL SECURITY POLICIES** (Authentication)

**Files**: `supabase/migrations/[date]_rls_policies.sql`

- [ ] **RLS enabled on table**
  - [ ] `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`

- [ ] **Read policy enforced**
  - [ ] Policy: User can read records where tenant matches
  - [ ] SQL: `tenant_id = (select tenant_id from auth.users where id = auth.uid())`

- [ ] **Create policy enforced**
  - [ ] Policy: User can create if they have `module:create` permission
  - [ ] Includes RBAC permission check

- [ ] **Update policy enforced**
  - [ ] Policy: User can update if they have `module:edit` permission
  - [ ] Restricts to own tenant only

- [ ] **Delete policy enforced**
  - [ ] Policy: User can delete if they have `module:delete` permission
  - [ ] Restricts to own tenant only

- [ ] **Audit policy enforced**
  - [ ] Log all read/write operations
  - [ ] Include user ID, tenant ID, action type

---

#### **PHASE 7: RBAC PERMISSION SETUP** (Authorization)

**Files**: `supabase/seed.sql`, RBAC service files

- [ ] **Module permissions defined**
  - [ ] `[module]:view` - permission to read
  - [ ] `[module]:create` - permission to create
  - [ ] `[module]:edit` - permission to update
  - [ ] `[module]:delete` - permission to delete
  - [ ] `[module]:export` - permission to export (if applicable)

- [ ] **Permissions seeded to database**
  - [ ] INSERT permissions into `permissions` table
  - [ ] Each permission includes: name, description, resource, action

- [ ] **Default roles configured**
  - [ ] Admin role: all permissions
  - [ ] Manager role: view, create, edit (not delete)
  - [ ] User role: view only
  - [ ] Custom roles documented in business requirements

- [ ] **Role-permission mappings created**
  - [ ] INSERT into `role_permissions` linking roles to permissions
  - [ ] Verify all necessary permissions assigned to each role

- [ ] **Service validates permissions**
  - [ ] Before each operation: `await rbacService.validatePermission(userId, '[module]:[action]')`
  - [ ] Graceful failure with 403 Forbidden if denied

---

#### **PHASE 8: SEEDING DATA COMPLETE** (Test Data)

**Files**: `supabase/seed.sql`

- [ ] **Test company/tenant created**
  ```sql
  INSERT INTO tenants (id, name, status)
  VALUES ('tenant_test_1', 'Test Company', 'active');
  ```

- [ ] **Test users created with roles**
  ```sql
  INSERT INTO users (id, email, role, tenant_id, status)
  VALUES
    ('user_admin', 'admin@test.com', 'admin', 'tenant_test_1', 'active'),
    ('user_manager', 'manager@test.com', 'manager', 'tenant_test_1', 'active'),
    ('user_employee', 'employee@test.com', 'employee', 'tenant_test_1', 'active');
  ```

- [ ] **Module records seeded**
  ```sql
  INSERT INTO [module_table] 
  (id, [all_columns], tenant_id, created_by, created_at)
  VALUES
    ('record_1', ..., 'tenant_test_1', 'user_admin', NOW()),
    ('record_2', ..., 'tenant_test_1', 'user_manager', NOW()),
    ...minimum 20 records for pagination testing...
  ```

- [ ] **Seed data includes all scenarios**
  - [ ] Active records
  - [ ] Inactive records
  - [ ] Various statuses
  - [ ] Old and new records (for date filtering)
  - [ ] Different users as created_by
  - [ ] Edge cases (empty strings, nulls where allowed)

---

#### **PHASE 9: CUSTOM HOOKS IMPLEMENTATION** (UI Layer)

**Files**: `src/modules/features/[module]/hooks/use[Module]*.ts`

- [ ] **Custom hook created**
  - [ ] File: `use[Module]Analytics.ts` or `use[Module]List.ts`
  - [ ] Pattern: Uses `useQuery` from React Query

- [ ] **Hook imports correct**
  - [ ] Imports DTO type: `import type { [AnalyticsDTO] } from '@/types/dtos'`
  - [ ] Imports factory service: `import { [module]Service as factory[Module]Service } from '@/services/serviceFactory'`

- [ ] **Hook implementation correct**
  ```typescript
  export function use[Module]Analytics() {
    const { tenantId } = getCurrentUser();
    
    return useQuery<[AnalyticsDTO]>({
      queryKey: ['[module]Analytics', tenantId],
      queryFn: () => factory[Module]Service.getAnalytics(tenantId),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    });
  }
  ```

- [ ] **Error handling implemented**
  - [ ] isError state handled
  - [ ] error message displayed
  - [ ] Fallback values provided

- [ ] **Loading state managed**
  - [ ] isLoading state displayed
  - [ ] Skeleton/spinner shown during load
  - [ ] No data flashing

---

#### **PHASE 10: UI COMPONENTS & VIEWS** (Presentation Layer)

**Files**: `src/modules/features/[module]/views/[Module]Page.tsx`

- [ ] **Component imports correct**
  - [ ] Imports DTO types: `import type { [AnalyticsDTO] } from '@/types/dtos'`
  - [ ] Imports custom hook: `import { use[Module]Analytics } from '../hooks'`
  - [ ] Imports sub-components: `import { [Component] } from '../components'`

- [ ] **Component uses factory service hook**
  ```typescript
  const { data: analytics, isLoading, error } = use[Module]Analytics();
  ```

- [ ] **Field access uses DTO field names**
  - [ ] ❌ NOT: `analytics.total`
  - [ ] ✅ YES: `analytics.totalSales`
  - [ ] All field accesses verified in codebase

- [ ] **Null-safe access implemented**
  - [ ] Uses optional chaining: `analytics?.totalSales ?? 0`
  - [ ] Fallback values provided
  - [ ] No console errors when data is missing

- [ ] **Conditional rendering correct**
  - [ ] Loading state: Shows spinner
  - [ ] Error state: Shows error message
  - [ ] Empty state: Shows appropriate message
  - [ ] Success state: Shows data

- [ ] **Data bindings verified**
  - [ ] Every DTO field is accessed in component
  - [ ] Every component data prop comes from DTO
  - [ ] No hardcoded data in component

---

#### **PHASE 11: INTEGRATION TESTING** (Full Stack Verification)

- [ ] **Mock backend testing** (`VITE_API_MODE=mock`)
  ```bash
  [ ] Start: npm run dev
  [ ] Navigate to [module] feature
  [ ] Verify: All stats display > 0
  [ ] Verify: No console errors
  [ ] Verify: Mock data visible in network tab (simulated)
  [ ] Verify: All filters work
  [ ] Verify: Pagination works
  [ ] Verify: Sorting works
  ```

- [ ] **Supabase backend testing** (`VITE_API_MODE=supabase`)
  ```bash
  [ ] Change .env: VITE_API_MODE=supabase
  [ ] Restart: npm run dev
  [ ] Login with test user
  [ ] Navigate to [module] feature
  [ ] Verify: All stats display (must match mock values)
  [ ] Verify: No console errors
  [ ] Verify: Supabase data visible in network tab
  [ ] Verify: All filters work
  [ ] Verify: Pagination works
  ```

- [ ] **Tenant isolation testing**
  ```bash
  [ ] Login as user from tenant_1
  [ ] Verify: Only tenant_1 data visible
  [ ] Logout and login as user from tenant_2
  [ ] Verify: Only tenant_2 data visible
  [ ] Verify: No cross-tenant data leak
  ```

- [ ] **Permission testing**
  ```bash
  [ ] Login as Admin: all operations work
  [ ] Login as Manager: can't delete, gets 403
  [ ] Login as Employee: can't create/edit, only view
  [ ] Verify: Proper error messages shown
  ```

- [ ] **Data consistency testing**
  ```bash
  [ ] Mock backend: stats total = sum of individual stats
  [ ] Supabase backend: same verification
  [ ] Both show identical results
  [ ] Numbers match seed data count
  ```

---

#### **PHASE 12: LINTING & BUILD VERIFICATION** (Code Quality)

- [ ] **TypeScript linting**
  ```bash
  npm run lint
  [ ] Result: 0 errors
  [ ] Check specifically for this module's files
  ```

- [ ] **Build verification**
  ```bash
  npm run build
  [ ] Result: Success with 0 warnings (TS errors)
  [ ] Check: All imports resolve
  [ ] Check: No dead code warnings
  ```

- [ ] **ESLint rules enforced**
  - [ ] No `any` types (use proper DTOs)
  - [ ] No unused imports
  - [ ] No console logs in production code
  - [ ] Proper error handling
  - [ ] TypeScript strict mode passing

- [ ] **Import paths verified**
  - [ ] All imports use `@/` alias
  - [ ] No relative imports between modules
  - [ ] All DTO imports from `@/types/dtos`
  - [ ] All service imports from `@/services/serviceFactory`

---

#### **PHASE 13: DOCUMENTATION & SIGN-OFF** (Final)

- [ ] **Module documentation updated**
  - [ ] Module DOC.md file exists
  - [ ] Field mapping documented
  - [ ] DTO definitions documented
  - [ ] Service methods documented
  - [ ] Permission matrix documented
  - [ ] Example usage code included

- [ ] **Change log entry added**
  - [ ] Module name
  - [ ] Changes made
  - [ ] Date completed
  - [ ] Developer name

- [ ] **Code review checklist completed**
  - [ ] All phases verified by another developer
  - [ ] No code review feedback pending
  - [ ] Approved for merge

- [ ] **Git commit created**
  ```bash
  git add .
  git commit -m "feat: standardize [module] module - all layers completed"
  git push origin feature/standardize-[module-name]
  ```

- [ ] **Pull request created & merged**
  - [ ] All CI checks passing
  - [ ] Code review approved
  - [ ] Ready for production deployment

---

---

## 🔄 INTEGRATION VERIFICATION POINTS

After EVERY module fix, verify ALL integration points:

### **Integration Point #1: Service Factory Routing**

```typescript
// Check: src/services/serviceFactory.ts
export function get[Module]Service() {
  return apiMode === 'supabase' 
    ? supabase[Module]Service 
    : mock[Module]Service;  // ✅ MUST return correct implementation
}

export const [module]Service = {
  getAnalytics: (tenantId) => get[Module]Service().getAnalytics(tenantId),
  // ✅ ALL methods proxied through factory
};
```

**Verification**:
- [ ] Factory function exists
- [ ] Both mock and Supabase implementations routed correctly
- [ ] All methods exported

---

### **Integration Point #2: DTO Type Safety**

```typescript
// Check: Services return correct DTO types
async getAnalytics(tenantId: string): Promise<ProductSalesAnalyticsDTO> {
  //                                      ↑ ✅ MUST specify DTO type
  // ...implementation
  return {
    totalSales: ...,        // ✅ MUST match DTO field
    completedSales: ...,    // ✅ MUST match DTO field
    // ...all DTO fields populated
  };
}
```

**Verification**:
- [ ] Mock service returns ProductSalesAnalyticsDTO
- [ ] Supabase service returns ProductSalesAnalyticsDTO
- [ ] All DTO fields populated in both implementations
- [ ] TypeScript compiler sees no type errors

---

### **Integration Point #3: Hook Type Binding**

```typescript
// Check: Hook declares correct DTO type
export function useProductSalesAnalytics() {
  return useQuery<ProductSalesAnalyticsDTO>({  // ✅ DTO type declared
    //                  ↑ Generic type parameter
    queryKey: ['productSalesAnalytics', tenantId],
    queryFn: () => factoryProductSaleService.getAnalytics(tenantId),
  });
}

// Usage:
const { data: analytics } = useProductSalesAnalytics();
// TypeScript knows analytics is ProductSalesAnalyticsDTO
// IDE auto-completes: analytics.totalSales ✅
```

**Verification**:
- [ ] Hook uses useQuery with <[DTO]> type parameter
- [ ] queryFn returns Promise<[DTO]>
- [ ] Component using hook has proper typing
- [ ] IDE shows correct autocomplete

---

### **Integration Point #4: UI Component Data Binding**

```typescript
// Check: Component binds DTO fields correctly
const { data: analytics } = useProductSalesAnalytics();

return (
  <div>
    <StatCard title="Total Sales" value={analytics?.totalSales ?? 0} />
    {/* ✅ Uses correct DTO field name */}
    {/* ✅ Null-safe access with ?? 0 */}
  </div>
);
```

**Verification**:
- [ ] Component accesses DTO fields by name
- [ ] All accesses use DTO field names (not mock/Supabase names)
- [ ] Null-safe access implemented
- [ ] No undefined field access

---

### **Integration Point #5: Tenant Context Flow**

```typescript
// Check: Tenant context passed through all layers
// 1. Component gets tenant
const { tenantId } = getCurrentUser();

// 2. Passes to hook
useProductSalesAnalytics(tenantId)

// 3. Hook passes to service
queryFn: () => factoryProductSaleService.getAnalytics(tenantId)
            //                                        ↑ tenantId passed

// 4. Mock service filters by tenant
return {
  totalSales: mockData.filter(s => s.tenantId === tenantId).length
              // ↑ Tenant filter applied
}

// 5. Supabase service filters by tenant
.eq('tenant_id', tenantId)  // ✅ RLS policy enforced
```

**Verification**:
- [ ] Component provides current user context
- [ ] Tenant ID passed from component → hook → service → database
- [ ] Mock data filtered by tenant
- [ ] Supabase RLS policies enforced
- [ ] No cross-tenant data visible

---

### **Integration Point #6: RBAC Permission Flow**

```typescript
// Check: Permissions validated at service layer
async create(tenantId: string, data: CreateProductSaleDTO) {
  // 1. Get current user
  const user = await getCurrentUser();
  
  // 2. Check permission
  await rbacService.validatePermission(
    user.id,
    'crm:product-sale:record:create'  // ✅ Module-specific permission
  );
  
  // 3. If no permission, throws 403 Forbidden
  // 4. If permitted, proceed with create
  
  // 5. Supabase RLS policy also enforces (defense in depth)
}
```

**Verification**:
- [ ] Service validates RBAC permission before action
- [ ] Permission names standardized: `[module]:[action]`
- [ ] Supabase RLS policy provides second layer of security
- [ ] Proper error message if permission denied

---

### **Integration Point #7: Database Schema Alignment**

```typescript
// Check: Service queries match schema
async getList(tenantId: string): Promise<ProductSaleDTO[]> {
  const { data } = await supabase
    .from('product_sales')  // ✅ Table name matches schema
    .select('*')            // ✅ Selects columns defined in schema
    .eq('tenant_id', tenantId);  // ✅ tenant_id column exists
  
  return data.map(row => ({
    id: row.id,             // ✅ Column exists in schema
    name: row.name,         // ✅ Column exists in schema
    // ... map all selected columns
  }));
}
```

**Verification**:
- [ ] Service queries table that exists in database
- [ ] All selected columns exist in schema
- [ ] tenant_id column used for filtering
- [ ] Audit columns (created_at, created_by) populated
- [ ] Foreign keys point to valid tables

---

### **Integration Point #8: Seed Data Completeness**

```sql
-- Check: Seed data matches service expectations
INSERT INTO product_sales 
(id, tenant_id, name, status, amount, created_by, created_at)
VALUES 
('ps_1', 'tenant_test', 'Sale 1', 'completed', 1000, 'user_1', NOW()),
-- ✅ All required DTO fields populated
-- ✅ tenant_id matches test tenant
-- ✅ Multiple records for testing (count > 1)
-- ✅ Various statuses for filtering tests
```

**Verification**:
- [ ] Seed data includes all DTO fields
- [ ] Multiple records per module (≥ 10)
- [ ] Test tenant context used
- [ ] Test users seeded with proper roles
- [ ] Various statuses/scenarios represented

---

### **Integration Point #9: Error Handling Consistency**

```typescript
// Check: Error handling consistent across layers

// Mock Service
async get(id: string): Promise<ProductSaleDTO> {
  const record = mockData.find(r => r.id === id);
  if (!record) throw new Error(`Product Sale ${id} not found`);
  // ✅ Meaningful error message
}

// Supabase Service
async get(id: string): Promise<ProductSaleDTO> {
  const { data, error } = await supabase
    .from('product_sales')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) throw new Error(`Product Sale ${id} not found`);
  // ✅ Same error message as mock
}

// Component
const { isError, error } = useQuery({...});
if (isError) {
  return <ErrorMessage message={error.message} />;
  // ✅ Error message displayed to user
}
```

**Verification**:
- [ ] Both mock and Supabase throw same error types
- [ ] Error messages are meaningful
- [ ] Component displays error gracefully
- [ ] No generic "Failed" messages

---

### **Integration Point #10: Performance & Caching**

```typescript
// Check: Caching configured properly
export function useProductSalesAnalytics() {
  const { tenantId } = getCurrentUser();
  
  return useQuery<ProductSalesAnalyticsDTO>({
    queryKey: ['productSalesAnalytics', tenantId],
    // ✅ Unique key includes tenant (cache isolated per tenant)
    
    queryFn: () => factoryProductSaleService.getAnalytics(tenantId),
    
    staleTime: 5 * 60 * 1000,  // ✅ Cache 5 minutes
    retry: 2,                  // ✅ Retry on failure
    refetchOnWindowFocus: false,  // ✅ Don't refetch on tab focus
  });
}
```

**Verification**:
- [ ] Query key includes identifying information (tenant, user, etc.)
- [ ] staleTime configured appropriately
- [ ] Retry logic configured
- [ ] No excessive refetching

---

---

## 📍 LAYER-BY-LAYER IMPLEMENTATION ORDER

Follow this exact order. Do NOT skip or reorder steps.

### **STEP 1: TYPES & DTOs** ⏱️ 15 minutes

**Why first**: Everything else depends on types being correct.

```
✅ 1. Create/update DTOs in src/types/dtos/[module]Dtos.ts
✅ 2. Export DTOs from src/types/dtos/index.ts
✅ 3. Verify TypeScript compilation (npm run lint)
```

**Success Criteria**:
- TypeScript shows no errors
- DTO files have zero import errors
- All DTO fields documented

---

### **STEP 2: SERVICE FACTORY SETUP** ⏱️ 10 minutes

**Why second**: Ensures both backends are routed correctly.

```
✅ 1. Add factory function to serviceFactory.ts
✅ 2. Add factory exports to serviceFactory.ts
✅ 3. Export from src/services/index.ts
✅ 4. Verify TypeScript compilation
```

**Success Criteria**:
- Factory function correctly routes to mock/Supabase
- All service methods proxied through factory
- No import errors

---

### **STEP 3: MOCK SERVICE** ⏱️ 30 minutes

**Why third**: Provides fast dev feedback without needing database.

```
✅ 1. Create mock data (≥ 20 records)
✅ 2. Implement all service methods
✅ 3. Return DTO types (not raw mock data)
✅ 4. Add console.log for debugging
✅ 5. Test: npm run dev with VITE_API_MODE=mock
```

**Success Criteria**:
- Mock service returns DTOs with correct field names
- All methods work and return data
- No console errors
- Stats display correctly in UI

---

### **STEP 4: SUPABASE SERVICE** ⏱️ 30 minutes

**Why fourth**: Production backend implementation.

```
✅ 1. Query correct Supabase table
✅ 2. Implement all service methods
✅ 3. Return DTO types (not raw database data)
✅ 4. Add proper error handling
✅ 5. Test: npm run dev with VITE_API_MODE=supabase
```

**Success Criteria**:
- Supabase service returns DTOs with correct field names
- All methods work
- Results match seed data
- No Supabase errors

---

### **STEP 5: DATABASE SCHEMA** ⏱️ 15 minutes

**Why fifth**: Ensures data persistence.

```
✅ 1. Verify table exists in database
✅ 2. Verify columns match schema
✅ 3. Verify constraints and indexes
✅ 4. Verify RLS policies enabled
✅ 5. Test database connection
```

**Success Criteria**:
- Table exists with correct structure
- RLS policies preventing unauthorized access
- Indexes optimized

---

### **STEP 6: SEEDING DATA** ⏱️ 15 minutes

**Why sixth**: Provides test data.

```
✅ 1. Add INSERT statements for test data
✅ 2. Create ≥ 20 records for testing
✅ 3. Ensure tenant context in seed
✅ 4. Re-seed local database
✅ 5. Verify data in Supabase Studio
```

**Success Criteria**:
- Seed data visible in database
- All records have tenant_id
- Multiple records for pagination testing

---

### **STEP 7: HOOKS** ⏱️ 15 minutes

**Why seventh**: Bridge between service and UI.

```
✅ 1. Create custom hook with useQuery
✅ 2. Use factory service (not direct import)
✅ 3. Declare DTO type parameter
✅ 4. Handle loading/error states
✅ 5. Test hook in browser console
```

**Success Criteria**:
- Hook returns useQuery with correct DTO type
- Data loads correctly
- Loading state shows during fetch
- Error state handled

---

### **STEP 8: UI COMPONENTS** ⏱️ 20 minutes

**Why eighth**: User-facing layer.

```
✅ 1. Import DTO types
✅ 2. Import custom hook
✅ 3. Bind DTO field names (not mock names)
✅ 4. Add null-safe access
✅ 5. Test both mock and Supabase backends
```

**Success Criteria**:
- Component displays stats correctly
- Uses correct DTO field names
- Works with both backends
- No console errors

---

### **STEP 9: PERMISSIONS & RBAC** ⏱️ 15 minutes

**Why ninth**: Security enforcement.

```
✅ 1. Define module permissions (view, create, edit, delete)
✅ 2. Add permissions to seed data
✅ 3. Add RBAC checks to service methods
✅ 4. Verify RLS policies in Supabase
✅ 5. Test permission enforcement
```

**Success Criteria**:
- Users without permission get 403 Forbidden
- Users with permission can perform action
- Audit log records the operation

---

### **STEP 10: TESTING & VERIFICATION** ⏱️ 30 minutes

**Why tenth**: Ensure everything works together.

```
✅ 1. Test mock backend (VITE_API_MODE=mock)
✅ 2. Test Supabase backend (VITE_API_MODE=supabase)
✅ 3. Test tenant isolation
✅ 4. Test permission enforcement
✅ 5. Test error handling
✅ 6. Verify no console errors
✅ 7. Run npm run lint
✅ 8. Run npm run build
```

**Success Criteria**:
- Both backends work identically
- Tenant isolation enforced
- Permissions enforced
- No lint errors
- Successful build

---

### **STEP 11: DOCUMENTATION** ⏱️ 10 minutes

**Why eleventh**: Knowledge preservation.

```
✅ 1. Update module DOC.md file
✅ 2. Document field mappings
✅ 3. Document permissions required
✅ 4. Add usage examples
✅ 5. Update changelog
```

**Success Criteria**:
- Documentation complete
- Future developers can understand changes
- Examples provided for common tasks

---

### **STEP 12: GIT & MERGE** ⏱️ 5 minutes

**Why last**: Preserve changes safely.

```
✅ 1. Commit changes: git add .
✅ 2. Commit message: "feat: standardize [module]"
✅ 3. Push to branch: git push origin feature/standardize-[module]
✅ 4. Create pull request
✅ 5. Merge after code review
```

**Success Criteria**:
- All changes committed
- PR description clear
- No merge conflicts

---

---

## ✅ QUICK REFERENCE: ALL CHECKPOINTS

### **Pre-Flight Checklist** (Before starting ANY module)

```
[ ] Branch created: feature/standardize-[module-name]
[ ] DTO definitions ready (copy from DTO_IMPLEMENTATION_GUIDE.md)
[ ] Field mapping documented
[ ] Team informed of changes
[ ] Deployment window planned
[ ] Rollback plan prepared
```

### **During Development** (After each layer)

```
After DTO Layer:
[ ] npm run lint → 0 errors
[ ] npm run build → succeeds
[ ] No TS errors in IDE

After Service Factory:
[ ] Factory function correctly routes both backends
[ ] All methods exported

After Mock Service:
[ ] npm run dev with VITE_API_MODE=mock
[ ] Feature works and displays data
[ ] Console: 0 errors

After Supabase Service:
[ ] npm run dev with VITE_API_MODE=supabase
[ ] Feature works and displays data
[ ] Console: 0 errors

After Hooks:
[ ] useQuery returns correct DTO type
[ ] Loading/error states handled
[ ] Data flows to component

After UI Components:
[ ] Component uses DTO field names
[ ] Displays correctly with both backends
[ ] Stats non-zero where expected

After Permissions:
[ ] Admin can perform all actions
[ ] Regular users restricted appropriately
[ ] Audit log records operations

After Testing:
[ ] Mock backend: ✅ Works
[ ] Supabase backend: ✅ Works
[ ] Tenant isolation: ✅ Enforced
[ ] Permissions: ✅ Enforced
[ ] Console: ✅ No errors
[ ] Build: ✅ Succeeds
[ ] Lint: ✅ 0 errors
```

### **Final Sign-Off Checklist** (Before merge)

```
CODE QUALITY:
[ ] npm run lint → 0 errors
[ ] npm run build → succeeds
[ ] No TODO comments left
[ ] No console.log() in production code
[ ] All types properly declared

FUNCTIONALITY:
[ ] Feature works with VITE_API_MODE=mock
[ ] Feature works with VITE_API_MODE=supabase
[ ] Data consistent between backends
[ ] Stats display correctly
[ ] Filters work correctly
[ ] Pagination works correctly
[ ] Sorting works correctly

SECURITY:
[ ] Tenant isolation enforced
[ ] Permission checks in place
[ ] RLS policies active
[ ] Audit logging enabled
[ ] No cross-tenant data leaks

PERFORMANCE:
[ ] Query caching configured
[ ] No N+1 queries
[ ] Response times acceptable
[ ] No memory leaks

TESTING:
[ ] Tested with admin user
[ ] Tested with regular user
[ ] Tested with multiple tenants
[ ] Error scenarios tested
[ ] Edge cases tested

DOCUMENTATION:
[ ] Field mappings documented
[ ] Permission matrix documented
[ ] DTO definitions documented
[ ] Module DOC.md updated
[ ] Changelog entry added

GIT:
[ ] All changes committed
[ ] Commit messages descriptive
[ ] No sensitive data in commits
[ ] Ready for code review
[ ] Approved by 1+ reviewer
```

---

## 🎓 RULES FOR AGENT (ME) TO FOLLOW

When I help you standardize modules, I will:

### **Rule Set A: Before Starting**
1. ✅ Show you this complete checklist
2. ✅ Identify which module you want to standardize
3. ✅ Explain the layer-by-layer order
4. ✅ Create DTO definitions first
5. ✅ Provide exact code examples for your specific module

### **Rule Set B: During Implementation**
1. ✅ Follow exact layer order (Types → Factory → Mock → Supabase → DB → Hooks → UI → Test)
2. ✅ Update ALL related files for each layer before moving to next
3. ✅ Never skip verification steps
4. ✅ Check both `VITE_API_MODE=mock` and `VITE_API_MODE=supabase` after each layer
5. ✅ Provide exact file paths and line numbers
6. ✅ Show before/after code for every change
7. ✅ Document field mappings for your specific module

### **Rule Set C: Dependency Checking**
1. ✅ Before modifying any file, run: `grep -r "fileName" src/`
2. ✅ List every import location found
3. ✅ Update ALL imports before considering change complete
4. ✅ Verify no broken imports exist after change
5. ✅ Check test files that might import changed files

### **Rule Set D: Multi-Backend Testing**
1. ✅ After each layer, test with VITE_API_MODE=mock
2. ✅ After each layer, test with VITE_API_MODE=supabase
3. ✅ Verify identical results from both backends
4. ✅ Report any discrepancies immediately
5. ✅ Fix discrepancies before moving forward

### **Rule Set E: Multi-Tenant & Security**
1. ✅ Verify tenant context passed through all layers
2. ✅ Verify RLS policies active in Supabase
3. ✅ Verify RBAC permissions enforced
4. ✅ Test with multiple tenant users
5. ✅ Verify no cross-tenant data leaks

### **Rule Set F: Error Handling**
1. ✅ If `npm run lint` shows errors → STOP and fix
2. ✅ If `npm run build` fails → STOP and fix
3. ✅ If TypeScript shows errors → STOP and fix
4. ✅ If console has errors after changes → STOP and fix
5. ✅ Don't move to next layer until current layer is perfect

### **Rule Set G: Documentation & Commit**
1. ✅ Update module DOC.md with field mappings
2. ✅ Update changelog
3. ✅ Write descriptive git commits
4. ✅ Include file paths and line numbers in commit message
5. ✅ Provide links to relevant documentation

### **Rule Set H: Verification**
1. ✅ After each module, run full test suite
2. ✅ Verify no regressions in other modules
3. ✅ Run both lint and build before declaring complete
4. ✅ Check browser DevTools console is empty
5. ✅ Check Network tab shows correct data

---

## 🚀 NEXT STEPS

### **To Start Standardizing Your First Module:**

1. **Choose a module**: Pick from "Master Module Checklist" (suggest starting with Product Sales)
2. **Share your choice**: Tell me which module you want to standardize
3. **I will provide**:
   - DTO definitions for that specific module
   - Exact code for mock service
   - Exact code for Supabase service
   - Exact hook implementation
   - Exact UI component changes
   - All with file paths and line numbers
4. **Follow the checklist**: Go through each phase
5. **I verify**: After each phase, you tell me and I verify all integration points

### **Parallel Module Development:**

If you have multiple developers:
- **Person 1**: Standardizes ProductSales (2 hours)
- **Person 2**: Standardizes Sales (2 hours)
- **Person 3**: Standardizes Tickets (1.5 hours)
- **Person 4**: Standardizes Contracts (1.5 hours)
- All follow this exact checklist
- Merge all changes at end
- Run full test suite to verify no conflicts

---

## 📞 QUESTIONS TO ASK ME

Now that this checklist is ready, here's what you can ask:

```
✅ "Standardize ProductSales module - follow the checklist"
✅ "What's the DTO definition for [module]?"
✅ "Show me the mock service for [module]"
✅ "Show me the Supabase service for [module]"
✅ "Help me test tenant isolation for [module]"
✅ "Set up permissions for [module]"
✅ "Why is [field] showing as undefined?"
✅ "Check if I'm missing anything for [module]"
✅ "Review this code against the standardization rules"
✅ "What's next after I finish [module]?"
```

**And I WILL**:
- ✅ Follow this exact checklist
- ✅ Not skip any verification steps
- ✅ Check all integration points
- ✅ Ensure both backends tested
- ✅ Verify multi-tenant safety
- ✅ Confirm permission enforcement
- ✅ Provide exact code with file paths
- ✅ Keep you on track to 100% standardization

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Status**: Ready for Implementation  
**Confidence Level**: 100% - Zero Missing Areas Covered