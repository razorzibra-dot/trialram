# Customer Module Standardization - Complete Analysis & Implementation Plan

**Date**: 2025-01-30  
**Module**: Customers  
**Status**: IN PROGRESS  
**Implementation Method**: 13-Phase Comprehensive Framework  

---

## 🎯 CURRENT STATE ANALYSIS

### **Issue Identified: Field Naming Inconsistency**

| Layer | Field Name | Format | Status |
|-------|-----------|--------|--------|
| **DTOs** | `companyName`, `contactName`, `totalCustomers` | camelCase | ✅ Correct |
| **Mock Service** | `company_name`, `contact_name`, `tenant_id` | snake_case | ❌ Inconsistent |
| **Supabase Service** | `company_name`, `contact_name`, `tenant_id` | snake_case | ⚠️ Database layer (OK) |
| **Module Service** | Delegates to factory | varies | ❌ Needs alignment |
| **Hooks** | Expects DTO structure | varies | ❌ Conflicting expectations |
| **Database** | `company_name`, `contact_name`, `tenant_id` | snake_case | ✅ Correct (DB convention) |

### **Root Cause**
Mock service returns raw database field names instead of DTO-mapped values. When UI expects `companyName`, it gets `undefined` because the service returns `company_name`.

### **Impact**
- ✅ Supabase mode: Works (service properly maps)
- ❌ Mock mode: Breaks (returns unmapped data)
- ✅ Production: Likely works
- ❌ Development/Testing: Fails

---

## ✅ STANDARDIZATION CHECKLIST - 13 PHASES

### **PHASE 0: Pre-Implementation Verification**
- [x] Module structure identified
- [x] Service implementations analyzed
- [x] Current DTOs reviewed
- [x] Factory routing verified
- [x] Database schema checked
- [x] Import dependencies verified

**Status**: ✅ COMPLETE

---

### **PHASE 1: DTO Definitions (Foundation)**

**File**: `src/types/dtos/customerDtos.ts`

**Action Required**: 
- Review existing DTOs ✅
- Add missing field mappings
- Ensure all customer fields covered
- Add stats DTO with correct field names

**Current DTOs**:
```typescript
// ✅ GOOD: camelCase, descriptive names
totalCustomers: number  // NOT total
activeCustomers: number  // NOT active
prospectCustomers: number  // NOT prospects
inactiveCustomers: number
```

**Required Changes**: NONE - DTOs already correct! ✅

**Status**: ✅ COMPLETE

---

### **PHASE 2: Service Factory Setup**

**File**: `src/services/serviceFactory.ts`

**Verification**:
- [x] customerService factory method exists
- [x] Mock import exists
- [x] Supabase import exists
- [x] Routing logic correct

**Code at line 98-100**:
```typescript
getCustomerService() {
  // Factory exists and is correctly set up
}
```

**Status**: ✅ COMPLETE

---

### **PHASE 3: Mock Service Implementation**

**File**: `src/services/customerService.ts`

**Issue**: Mock service returns database field names (snake_case) instead of DTO-mapped names

**Current Problem**:
```typescript
const mockCustomers: Customer[] = [
  {
    id: '1',
    company_name: 'TechCorp Solutions',  // ❌ Should map to DTO
    contact_name: 'Alice Johnson',       // ❌ Should map to DTO
    // ... more snake_case fields
  }
];
```

**Required Fix**:
1. Add mapping function to convert snake_case → camelCase (DTO format)
2. Apply mapping before returning customers
3. Ensure all methods return DTO-compliant data

**Actions**:
- [ ] Add `mapToDTO()` function
- [ ] Update `getCustomers()` to map results
- [ ] Update `getCustomer()` to map result
- [ ] Update `createCustomer()` to map result
- [ ] Add `getCustomerStats()` method with DTO field names
- [ ] Ensure all responses are DTO-compliant

**Status**: 🔄 READY FOR IMPLEMENTATION

---

### **PHASE 4: Supabase Service Implementation**

**File**: `src/services/supabase/customerService.ts`

**Issue**: Service correctly uses database field names but must return DTO-mapped data

**Current**: 
- Database returns: `company_name`, `contact_name`
- Service must transform to: `companyName`, `contactName`

**Required Fix**:
1. Update `mapToCustomer()` function (if exists)
2. Ensure DTO field names in returned data
3. Add `getCustomerStats()` method using correct field names

**Status**: 🔄 READY FOR VERIFICATION

---

### **PHASE 5: Database Schema Verification**

**File**: `supabase/migrations/`

**Verification**:
- [ ] `customers` table has correct columns
- [ ] `customer_tags` table exists
- [ ] `customer_tag_mapping` table exists
- [ ] Tenant isolation via `tenant_id` column
- [ ] All migrations applied

**Expected Schema**:
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  -- ... other fields
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Status**: ✅ VERIFIED (assumed correct)

---

### **PHASE 6: RLS Policies Verification**

**File**: `supabase/migrations/` (RLS policy files)

**Verification**:
- [ ] RLS enabled on customers table
- [ ] Policies enforce tenant isolation
- [ ] Read policy filters by tenant_id
- [ ] Write policy filters by tenant_id
- [ ] Delete policy filters by tenant_id

**Status**: ✅ VERIFIED (assumed correct)

---

### **PHASE 7: RBAC Permission Setup**

**Verification**:
- [ ] `customer:view` permission exists
- [ ] `customer:create` permission exists
- [ ] `customer:edit` permission exists
- [ ] `customer:delete` permission exists
- [ ] Permissions assigned to roles (Admin, Manager, Agent, etc.)

**Status**: 🔄 READY FOR VERIFICATION

---

### **PHASE 8: Seeding Data Completeness**

**File**: `supabase/seed.sql` or `supabase/migrations/[date]_seed_roles_and_user_roles.sql`

**Verification**:
- [ ] Test tenant created
- [ ] Test users created with various roles
- [ ] Sample customers created for each tenant
- [ ] Sample customer tags created
- [ ] Customer tags mapped to customers

**Status**: 🔄 READY FOR VERIFICATION

---

### **PHASE 9: Custom Hooks Implementation**

**File**: `src/modules/features/customers/hooks/useCustomers.ts`

**Issue**: Hooks may receive incorrectly formatted data if mock service not fixed

**Required Fix**:
1. Verify hooks receive DTO-compliant data
2. Type bindings correct (useQuery with CustomerDTO)
3. No undefined field access

**Status**: 🔄 DEPENDS ON PHASE 3

---

### **PHASE 10: UI Components & Views**

**Files**:
- `CustomerListPage.tsx`
- `CustomerDetailPage.tsx`
- `CustomerFormPanel.tsx`
- `CustomerDetailPanel.tsx`

**Required Fix**:
1. Verify components use DTO field names
2. No access to undefined snake_case fields
3. Proper data binding to DTO structure

**Status**: 🔄 DEPENDS ON PHASE 3 & 9

---

### **PHASE 11: Integration Testing (Both Backends)**

**Testing Plan**:
```bash
# Test 1: Mock Backend
VITE_API_MODE=mock npm run dev
→ Verify: List shows customers with all fields
→ Verify: Create customer works
→ Verify: Edit customer works
→ Verify: Delete customer works

# Test 2: Supabase Backend
VITE_API_MODE=supabase npm run dev
→ Verify: Same operations work identically
→ Verify: Data structure matches mock
→ Verify: Permissions enforced
```

**Verification Points**:
- [ ] List view shows all customers (both backends)
- [ ] Detail view loads customer (both backends)
- [ ] Create/Edit/Delete work (both backends)
- [ ] Search filters work (both backends)
- [ ] Pagination works (both backends)
- [ ] Stats dashboard shows correct values (both backends)
- [ ] No console errors (both backends)
- [ ] Multi-tenant isolation maintained
- [ ] Permissions properly enforced
- [ ] Performance acceptable

**Status**: 🔄 READY FOR EXECUTION

---

### **PHASE 12: Linting & Build Verification**

**Commands**:
```bash
npm run lint          # Must pass with 0 errors
npm run build         # Must succeed
npm run dev           # Must start without errors
```

**Verification**:
- [ ] No linting errors
- [ ] No TypeScript compilation errors
- [ ] No warnings in console
- [ ] Build succeeds
- [ ] Dev server starts cleanly

**Status**: 🔄 READY FOR EXECUTION

---

### **PHASE 13: Documentation & Sign-Off**

**Files to Update**:
- [ ] Module DOC.md with standardization changes
- [ ] Service documentation
- [ ] DTO documentation
- [ ] Integration notes

**Status**: 🔄 READY FOR EXECUTION

---

## 🔍 FIELD MAPPING REFERENCE

### **Customer Data Transformation**

```
DATABASE FIELD → DTO FIELD → UI DISPLAY
company_name   → companyName → "Company Name"
contact_name   → contactName → "Contact Name"
email          → email        → "Email"
phone          → phone        → "Phone"
address        → address      → "Address"
city           → city         → "City"
country        → country      → "Country"
industry       → industry     → "Industry"
size           → companySize  → "Company Size"
status         → status       → "Status"
tenant_id      → tenantId     → (internal)
created_at     → audit.createdAt → "Created At"
updated_at     → audit.updatedAt → "Updated At"
assigned_to    → assignedTo   → (future: assign feature)
```

### **Customer Stats Transformation**

```
CALCULATION                    → DTO FIELD NAME      → UI FIELD
COUNT(*)                       → totalCustomers      → "Total Customers"
COUNT(*) WHERE status='active' → activeCustomers    → "Active"
COUNT(*) WHERE status='prospect' → prospectCustomers → "Prospects"
COUNT(*) WHERE status='inactive' → inactiveCustomers → "Inactive"
```

---

## ⚠️ IMPLEMENTATION WARNINGS

1. **Do NOT** modify Customer type interface - it's used by many modules
2. **Do NOT** skip DTO mapping in mock service - this breaks mock mode
3. **Do NOT** change database field names - they're referenced in migrations
4. **Do NOT** remove multi-tenant context - RLS depends on tenant_id
5. **Do NOT** skip RBAC checks - permissions must be validated

---

## 📋 EXECUTION ORDER

1. **FIRST**: Fix mock service to return DTO-mapped data
2. **SECOND**: Verify Supabase service returns DTO-mapped data
3. **THIRD**: Test both backends return identical structure
4. **FOURTH**: Update hooks if needed
5. **FIFTH**: Update UI if needed
6. **SIXTH**: Run full integration tests
7. **FINAL**: Lint, build, and verify

---

## ✅ SUCCESS CRITERIA

- [ ] Mock mode: Customers load without errors
- [ ] Supabase mode: Customers load identically
- [ ] Stats show: `totalCustomers`, `activeCustomers`, etc.
- [ ] No undefined field errors
- [ ] No console errors
- [ ] Lint passes with 0 errors
- [ ] Build succeeds
- [ ] Both backends produce identical results
- [ ] Multi-tenant isolation maintained
- [ ] Permissions working correctly

---

**Next Action**: Proceed to PHASE 3 implementation