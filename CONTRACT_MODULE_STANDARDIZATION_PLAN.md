# Contract Module Standardization - Implementation Plan

**Status:** 🔴 CRITICAL ISSUES IDENTIFIED  
**Scope:** Full 8-layer standardization  
**Priority:** HIGH - Blocks multi-backend support

---

## 📊 ISSUES SUMMARY

### Layer 1️⃣: Database Schema (✅ CORRECT - Reference Layer)
**File:** `supabase/migrations/20250101000004_contracts.sql`

**Actual schema (snake_case):**
```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY,
  contract_number text,
  customer_id uuid NOT NULL REFERENCES customers(id),
  title text NOT NULL,
  description text,
  type text,
  status text,
  start_date date,
  end_date date,
  next_renewal_date date,
  auto_renew boolean,
  renewal_period_months integer,
  value decimal,
  currency text,
  payment_terms text,
  delivery_terms text,
  terms text,
  signature_required boolean,
  signed_date timestamp,
  created_by uuid,
  assigned_to uuid,
  priority text,
  reminder_days integer[],
  next_reminder_date date,
  notes text,
  tags text[],
  template_id uuid,
  version integer,
  content text,
  approval_stage text,
  compliance_status text,
  created_at timestamp,
  updated_at timestamp,
  deleted_at timestamp
);
```

✅ **Status:** Correct reference - all other layers must map to this

---

### Layer 2️⃣: TypeScript Types (🔴 CRITICAL ISSUES)
**File:** `src/types/contracts.ts`

#### Issue #1: Mixed Field Naming
- **Problem:** Inconsistent camelCase vs snake_case
- **Impact:** Field mapping errors, type mismatches
- **Examples:**
  - `uploadedAt` (camelCase) should be `uploaded_at` (maps to database)
  - `uploadedBy` (camelCase) should be `uploaded_by` (maps to database)
  - `approverName` (camelCase) should be `approver_name` (maps to database)

#### Issue #2: Duplicate Interface Definition
- **Problem:** `ContractFilters` defined twice (lines 170-181 AND 217-235)
  - First definition: snake_case (`customer_id`, `date_from`)
  - Second definition: camelCase (`assignedTo`, `dateRange`)
- **Impact:** Type confusion, linting errors
- **Fix:** Remove duplicate, standardize to snake_case for consistency

#### Issue #3: Missing Field Alignments
- **ContractAttachment:** Should use snake_case
  ```typescript
  uploadedAt: string;   // ❌ WRONG - should be uploaded_at
  uploadedBy: string;   // ❌ WRONG - should be uploaded_by
  ```

- **ApprovalRecord:** Mixed naming
  ```typescript
  approverName: string;  // ❌ WRONG - should be approver_name
  timestamp: string;     // ✅ CORRECT (already snake_case)
  ```

- **ContractTemplate:** Mixed naming
  ```typescript
  isActive: boolean;     // ❌ WRONG - should be is_active
  ```

#### Issue #4: Missing Fields in Contract Interface
- **Database has:** `signed_date`, `approval_stage`, `compliance_status`, `signature_required`
- **Type missing:** Some fields not present or inconsistently named

---

### Layer 3️⃣: Mock Service (🔴 CRITICAL ISSUES)
**File:** `src/services/contractService.ts`

#### Issue #1: Field Names Use camelCase (Wrong!)
- **Problem:** Mock data uses camelCase, should use snake_case
- **Examples:**
  ```javascript
  startDate: '2024-01-15',        // ❌ WRONG - should be start_date
  endDate: '2025-01-15',          // ❌ WRONG - should be end_date
  autoRenew: true,                // ❌ WRONG - should be auto_renew
  renewalTerms: '...',            // ❌ WRONG - should be renewal_terms
  createdBy: '1',                 // ❌ WRONG - should be created_by
  assignedTo: '2',                // ❌ WRONG - should be assigned_to
  templateId: '1',                // ❌ WRONG - should be template_id
  reminderDays: [90, 60, 30],     // ❌ WRONG - should be reminder_days
  nextReminderDate: '2024-10-15', // ❌ WRONG - should be next_reminder_date
  approvalHistory: [...],         // ❌ WRONG - should be approval_history
  signatureStatus: {...},         // ❌ WRONG - should be signature_status
  signedDate: '2024-01-15...',    // ❌ WRONG - should be signed_date
  complianceStatus: 'compliant',  // ✅ Correct but inconsistent with others
  ```

#### Issue #2: Nested Objects Naming
- **approvalHistory items use:** `approverName`, `timestamp`
- **Should use:** `approver_name` (for database field mapping)
- **Also missing:** `approver_id` (required for DB)

#### Issue #3: ContractParty Field Mismatch
- **Has:** `signatureRequired`, `signedAt`, `signatureUrl`, `signatureStatus`
- **Should be:** `signature_required`, `signed_at`, `signature_url`, `signature_status`

---

### Layer 4️⃣: Supabase Service (🔴 CRITICAL ISSUES)
**File:** `src/services/supabase/contractService.ts`

#### Issue #1: References Non-existent Database Fields
```typescript
renewal_date: data.renewal_date,           // ❌ WRONG - DB field is next_renewal_date
terms_and_conditions: data.terms_and_conditions,  // ❌ WRONG - DB field is terms
```

#### Issue #2: Incomplete Field Mapping in `mapContractResponse()`
- **Missing mappings:**
  - `approval_history` → Not mapped
  - `attachments` → Not mapped
  - `parties` → Not mapped
  - `signature_status` → Not mapped
  - `reminder_days` → Not mapped
  - `next_reminder_date` → Not mapped
  - `payment_terms` → Not mapped
  - `delivery_terms` → Not mapped
  - `renewal_period_months` → Not mapped
  - `renewal_terms` → Not mapped
  - `assigned_to_name` → Not mapped
  - `deal_id` → Not mapped
  - `deal_title` → Not mapped

#### Issue #3: Type Casting Issues
```typescript
type: (dbContract.type || 'standard') as Contract['type'],  // 'standard' not in enum!
```

---

### Layer 5️⃣: Service Factory (🔴 CRITICAL - NOT IMPLEMENTED)
**File:** `src/services/serviceFactory.ts`

#### Issue #1: Contract Service Not Registered
- **Missing:** No `getContractService()` method
- **Missing:** No `contractService` export
- **Missing:** Contract service routing logic
- **Impact:** Module cannot use factory pattern; breaks multi-backend support

#### Issue #2: Service Factory Path
- **Mock service:** Should be `src/services/contractService.ts` ✅ exists
- **Supabase service:** Should be `src/services/supabase/contractService.ts` ✅ exists
- **Factory routing:** ❌ NOT IMPLEMENTED

---

### Layer 6️⃣: Module Service (🔴 CRITICAL - WRONG PATTERN)
**File:** `src/modules/features/contracts/services/contractService.ts`

#### Issue #1: Uses Legacy Service Instead of Factory
```typescript
import { contractService as legacyContractService } from '@/services';  // ❌ WRONG!
```

**Should be:**
```typescript
import { contractService as factoryContractService } from '@/services/serviceFactory';  // ✅ CORRECT
```

#### Issue #2: Duplicate ContractFormData Definition
- Defined locally in module service
- Already defined in `src/types/contracts.ts`
- Creates redundancy and sync issues

#### Issue #3: Missing Field Mappings in `approveContract()`
```typescript
approver_name: 'Current User',  // ❌ Uses snake_case but type expects camelCase
approved_at: new Date().toISOString(),  // ❌ Field not in ApprovalRecord interface
```

---

### Layer 7️⃣: React Hooks (⚠️ DEPENDS ON LOWER LAYERS)
**Files:** `src/modules/features/contracts/hooks/*.ts`

**Status:** Will be broken until layers 1-6 are fixed
- Currently bind to wrong field names
- Type errors from interface inconsistencies
- Field mapping mismatches

---

### Layer 8️⃣: UI Components (⚠️ DEPENDS ON LOWER LAYERS)
**Files:** `src/modules/features/contracts/components/*.tsx`

**Status:** Will be broken until layers 1-6 are fixed
- Form fields won't bind correctly
- Type errors from interface inconsistencies
- Data display mismatches

---

## 🔧 IMPLEMENTATION ROADMAP

### Phase 1: Fix Type Definitions (Foundation)
**File:** `src/types/contracts.ts`

1. ✅ Remove duplicate `ContractFilters` interface (line 217-235)
2. ✅ Standardize all field names to snake_case (matching database)
3. ✅ Fix `ContractAttachment`: `uploadedAt` → `uploaded_at`, `uploadedBy` → `uploaded_by`
4. ✅ Fix `ApprovalRecord`: `approverName` → `approver_name`
5. ✅ Fix `ContractTemplate`: `isActive` → `is_active`
6. ✅ Add missing fields: `approval_stage`, `compliance_status`, `signature_required`
7. ✅ Add missing interfaces: Complete mappings for all nested objects

**Expected Changes:** ~30-40 field renamings

---

### Phase 2: Fix Mock Service
**File:** `src/services/contractService.ts`

1. ✅ Rename all mock contract fields to snake_case
2. ✅ Fix `ContractParty` field names
3. ✅ Fix `ApprovalRecord` field names in approval history
4. ✅ Validate contract type values match enum in database
5. ✅ Add validation for required fields

**Expected Changes:** 100+ field renamings across mock contracts

---

### Phase 3: Fix Supabase Service
**File:** `src/services/supabase/contractService.ts`

1. ✅ Fix database field references (`renewal_date` → `next_renewal_date`)
2. ✅ Fix database field references (`terms_and_conditions` → `terms`)
3. ✅ Complete `mapContractResponse()` with all missing fields
4. ✅ Fix type casting for contract type
5. ✅ Add field transformations for nested objects
6. ✅ Handle related data (parties, approvals, attachments)

**Expected Changes:** 15-20 mapping additions

---

### Phase 4: Register Contract Service in Factory
**File:** `src/services/serviceFactory.ts`

1. ✅ Import mock and Supabase contract services at top
2. ✅ Add `getContractService()` method with mode switching
3. ✅ Add `contractService` export with all method proxies
4. ✅ Add `contract` case in `getService()` generic method
5. ✅ Update imports section (add contract service imports)

**Expected Changes:** ~100 lines of new code

---

### Phase 5: Fix Module Service
**File:** `src/modules/features/contracts/services/contractService.ts`

1. ✅ Remove local `ContractFormData` definition
2. ✅ Import from `@/types/contracts` instead
3. ✅ Change import from legacy service to factory service
4. ✅ Fix field references in `approveContract()` method
5. ✅ Ensure all field names align with database schema

**Expected Changes:** 5-10 line updates

---

### Phase 6: Update Hooks
**Files:** `src/modules/features/contracts/hooks/*.ts`

1. ✅ Update field references to use correct snake_case names
2. ✅ Fix type mappings
3. ✅ Update filter object construction

**Expected Changes:** 10-15 field references per hook

---

### Phase 7: Update UI Components
**Files:** `src/modules/features/contracts/components/*.tsx`

1. ✅ Update form field bindings
2. ✅ Fix data display references
3. ✅ Update table column mappings
4. ✅ Fix filter object construction

**Expected Changes:** 20-30 field references per component

---

### Phase 8: Documentation
**File:** `src/modules/features/contracts/DOC.md`

1. ✅ Update with actual implementation state
2. ✅ Document field naming conventions
3. ✅ Add service layer mapping examples
4. ✅ Add integration examples

---

## 🎯 VALIDATION CHECKLIST

After implementation, verify:

- [ ] All type fields use snake_case (matching database)
- [ ] No duplicate interface definitions
- [ ] Mock service data uses correct field names
- [ ] Supabase service maps all database fields
- [ ] Service factory routes contract service correctly
- [ ] Module service uses factory pattern
- [ ] All hooks reference correct field names
- [ ] All components bind to correct fields
- [ ] TypeScript builds without errors
- [ ] ESLint passes all checks
- [ ] No circular dependencies
- [ ] Documentation updated and current

---

## 📋 DETAILED FIELD MAPPING REFERENCE

### Contract Interface
| Database Field | Type Field | Current Status |
|---|---|---|
| `contract_number` | `contract_number` | ✅ Correct |
| `customer_id` | `customer_id` | ✅ Correct |
| `start_date` | `start_date` | ✅ Correct |
| `end_date` | `end_date` | ✅ Correct |
| `next_renewal_date` | `next_renewal_date` | ✅ Correct |
| `auto_renew` | `auto_renew` | ✅ Correct |
| `created_by` | `created_by` | ✅ Correct |
| `assigned_to` | `assigned_to` | ✅ Correct |
| `reminder_days` | `reminder_days` | ✅ Correct |
| `approval_history` | `approval_history` | ⚠️ Nested mapping issue |
| `signature_status` | `signature_status` | ⚠️ Nested mapping issue |

### ContractAttachment Interface
| Database Field | Type Field | Current Status |
|---|---|---|
| `uploaded_at` | `uploadedAt` | ❌ WRONG - should be `uploaded_at` |
| `uploaded_by` | `uploadedBy` | ❌ WRONG - should be `uploaded_by` |

### ApprovalRecord Interface
| Database Field | Type Field | Current Status |
|---|---|---|
| `approver_name` | `approverName` | ❌ WRONG - should be `approver_name` |
| `timestamp` | `timestamp` | ✅ Correct |

---

## 🚀 EXECUTION NOTES

- **Total estimated changes:** 150-200 line modifications/additions
- **Risk level:** MEDIUM (widespread field renames)
- **Testing required:** Unit tests for service mappings, integration tests for multi-backend routing
- **No breaking changes expected:** If done correctly, backward compatible at API level
- **Rollback plan:** Can revert to previous commit if issues arise

---

## ⏭️ NEXT STEPS

1. **Review this plan** - Confirm all issues identified correctly
2. **Approve changes** - No code changes until approved
3. **Execute Phase 1-5** - Core layer fixes (most critical)
4. **Execute Phase 6-7** - UI layer updates (dependent on lower layers)
5. **Execute Phase 8** - Documentation
6. **Test** - Run full test suite to verify no regressions
