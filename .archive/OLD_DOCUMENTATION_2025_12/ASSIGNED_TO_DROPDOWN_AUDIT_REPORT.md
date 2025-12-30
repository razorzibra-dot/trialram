# Assigned To Dropdown Consistency Audit Report
**Date:** 2025-02-28  
**Status:** CRITICAL INCONSISTENCIES FOUND  
**Impact:** High - User assignment dropdowns are broken/inconsistent across modules

---

## Executive Summary

Deep investigation revealed **CRITICAL inconsistencies** in "Assigned To" dropdown implementations across ALL modules:

### Critical Issues Found:
1. **TicketsFormPanel**: Uses non-existent `DynamicSelect type="users"` (BROKEN)
2. **LeadFormPanel**: Uses plain `Input` field instead of dropdown (WRONG)
3. **ComplaintsFormPanel**: Uses hardcoded mock data in Select (TODO comment)
4. **JobWorksFormPanel**: Uses empty `Select` with no options (BROKEN)
5. **ConvertToContractModal**: Uses plain `Input` instead of dropdown (WRONG)
6. **Mixed naming**: `assigned_to` vs `assignedTo` vs `assigned_engineer_id` vs `receiver_engineer_id`

---

## Current Implementation Status

### ✅ WORKING CORRECTLY

#### 1. **Customers Module**
- **File:** `CustomerFormPanel.tsx`
- **Implementation:** Manual `Select` with `useActiveUsers()` hook
- **Hook Location:** `src/modules/features/customers/hooks/useUsers.ts`
- **Field Name:** `assignedTo`
- **Code Pattern:**
```tsx
import { useActiveUsers } from '../hooks/useUsers';

const { data: users = [], isLoading: usersLoading } = useActiveUsers();

<Form.Item label="Assigned To" name="assignedTo">
  <Select size="large" loading={usersLoading}>
    {users.map((user) => (
      <Select.Option key={user.id} value={user.id}>
        👤 {user.firstName} {user.lastName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>
```
- **Status:** ✅ **CORRECT** - Loads from tenant users table via userService

---

### ❌ BROKEN IMPLEMENTATIONS

#### 2. **Tickets Module**
- **File:** `TicketsFormPanel.tsx`
- **Implementation:** `DynamicSelect type="users"`
- **Field Name:** `assigned_to`
- **Code Pattern:**
```tsx
<Form.Item label="Assigned To" name="assigned_to">
  <DynamicSelect
    type="users"  // ❌ THIS TYPE DOESN'T EXIST!
    placeholder="Select team member"
    allowClear
  />
</Form.Item>
```
- **Problem:** DynamicSelect only supports `'categories' | 'suppliers' | 'status' | 'custom'`
- **Status:** ❌ **BROKEN** - Component will fail/show nothing

#### 3. **Deals/Leads Module - LeadFormPanel**
- **File:** `LeadFormPanel.tsx`
- **Implementation:** Plain `Input` field
- **Field Name:** `assignedTo`
- **Code Pattern:**
```tsx
<Form.Item name="assignedTo" label="Assigned To">
  <Input placeholder="Enter assignee ID or name" />
</Form.Item>
```
- **Problem:** Users must type ID/name manually instead of selecting from dropdown
- **Status:** ❌ **WRONG** - Should be dropdown, not text input

#### 4. **Deals Module - ConvertToContractModal**
- **File:** `ConvertToContractModal.tsx`
- **Implementation:** Plain `Input` field
- **Field Name:** `assigned_to`
- **Code Pattern:**
```tsx
<Form.Item name="assigned_to" label="Assigned To">
  <Input placeholder="Assign to user" />
</Form.Item>
```
- **Problem:** Same as LeadFormPanel - manual text entry
- **Status:** ❌ **WRONG** - Should be dropdown

#### 5. **Complaints Module**
- **File:** `ComplaintsFormPanel.tsx`
- **Implementation:** Manual `Select` with hardcoded mock data
- **Field Name:** `assigned_engineer_id`
- **Code Pattern:**
```tsx
<Form.Item label="Assigned Engineer" name="assigned_engineer_id">
  <Select placeholder="Select engineer (optional)" size="large" allowClear>
    {/* TODO: Fetch engineers from user service */}
    <Select.Option value="eng1">John Smith (Senior Engineer)</Select.Option>
    <Select.Option value="eng2">Sarah Johnson (Technical Specialist)</Select.Option>
    <Select.Option value="eng3">Mike Davis (Field Engineer)</Select.Option>
  </Select>
</Form.Item>
```
- **Problem:** Uses hardcoded mock data instead of real users from database
- **Status:** ❌ **TODO** - Not fetching from tenant users table

#### 6. **JobWorks Module**
- **File:** `JobWorksFormPanel.tsx`
- **Implementation:** Empty `Select` with no options
- **Field Name:** `receiver_engineer_id`
- **Code Pattern:**
```tsx
<Form.Item
  label="Assigned Engineer"
  name="receiver_engineer_id"
  rules={[{ required: true, message: 'Please assign an engineer' }]}
>
  <Select placeholder="Select engineer" />
</Form.Item>
```
- **Problem:** No options provided - dropdown will be empty
- **Status:** ❌ **BROKEN** - Required field with no data source

---

## Field Naming Inconsistencies

Different modules use different field names for the same concept:

| Module | Field Name | Comment |
|--------|-----------|---------|
| Customers | `assignedTo` | camelCase |
| Tickets | `assigned_to` | snake_case |
| Leads | `assignedTo` | camelCase |
| Deals/Contracts | `assigned_to` | snake_case |
| Complaints | `assigned_engineer_id` | Different concept - stores ID not name |
| JobWorks | `receiver_engineer_id` | Different concept - "receiver" not "assigned" |

**Display Field Names** (read-only in tables/details):
- Tickets: `assigned_to_name`
- Deals: `assigned_to_name`
- JobWorks: `assigned_to_name`
- Complaints: `assigned_engineer_name`

---

## Existing useUsers Hooks

### Location 1: Customers Module
**File:** `src/modules/features/customers/hooks/useUsers.ts`

```typescript
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phone?: string;
}

export function useUsers(options?: UseUsersOptions) {
  const { tenantId } = useTenantContext();
  return useQuery({
    queryKey: ['users', tenantId, options?.status, options?.limit],
    queryFn: () => fetchUsers(options),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}

export function useActiveUsers() {
  return useUsers({ status: 'active' });
}
```

### Location 2: User Management Module
**File:** `src/modules/features/user-management/hooks/useUsers.ts`

```typescript
export function useUsers(filters?: UserFiltersDTO) {
  const userService = useService<IUserService>("userService");
  const { data: users = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: USER_QUERY_KEYS.list(filters),
    queryFn: () => userService.getUsers(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
  return { users, loading, error, refetch };
}
```

**Problem:** Two different implementations in two locations!

---

## Recommended Solution

### Option A: Create Shared Hook (RECOMMENDED)
**Location:** `src/hooks/useActiveUsers.ts`

```typescript
/**
 * Shared hook for loading active users for "Assigned To" dropdowns
 * Used across ALL modules for consistency
 */
import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/hooks/useTenantContext';
import { userService } from '@/services/serviceFactory';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phone?: string;
}

async function fetchActiveUsers(tenantId: string): Promise<User[]> {
  const response = await userService.getUsers();
  const usersArray = Array.isArray(response) ? response : (response as any)?.data || [];
  return usersArray.filter((u: User) => u.status === 'active');
}

export function useActiveUsers() {
  const { tenantId } = useTenantContext();
  return useQuery({
    queryKey: ['active-users', tenantId],
    queryFn: () => fetchActiveUsers(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}
```

### Standard Component Pattern

```tsx
import { useActiveUsers } from '@/hooks/useActiveUsers';

export const MyFormPanel = () => {
  const { data: users = [], isLoading: usersLoading } = useActiveUsers();
  
  return (
    <Form.Item 
      label="Assigned To" 
      name="assigned_to"
      tooltip="Select a team member to assign this item"
    >
      <Select 
        size="large" 
        loading={usersLoading}
        placeholder="Select team member"
        allowClear
        showSearch
        optionFilterProp="children"
      >
        {users.map((user) => (
          <Select.Option key={user.id} value={user.id}>
            👤 {user.firstName} {user.lastName}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};
```

---

## Implementation Checklist

### Phase 1: Create Shared Infrastructure ✅
- [ ] Create `src/hooks/useActiveUsers.ts` (shared hook)
- [ ] Export from `src/hooks/index.ts`
- [ ] Verify userService.getUsers() returns correct data
- [ ] Test with mock and Supabase services

### Phase 2: Fix Broken Implementations ❌
- [ ] **TicketsFormPanel** - Replace DynamicSelect with manual Select + useActiveUsers
- [ ] **LeadFormPanel** - Replace Input with Select + useActiveUsers
- [ ] **ConvertToContractModal** - Replace Input with Select + useActiveUsers
- [ ] **ComplaintsFormPanel** - Replace hardcoded options with useActiveUsers
- [ ] **JobWorksFormPanel** - Add useActiveUsers to populate Select

### Phase 3: Standardize Working Implementation ✅
- [ ] **CustomerFormPanel** - Update to use shared hook from `src/hooks/`
- [ ] **CustomerListPage** - Update to use shared hook

### Phase 4: Field Naming Standardization
- [ ] Decide on standard: `assigned_to` (snake_case) vs `assignedTo` (camelCase)
- [ ] Update all forms to use consistent field name
- [ ] Update database mappings if needed
- [ ] Update DTOs/types to match

### Phase 5: Database Verification
- [ ] Verify users table has correct schema
- [ ] Verify tenant_id filtering works
- [ ] Test with multiple tenants
- [ ] Verify mock service returns correct data structure

### Phase 6: Testing
- [ ] Unit tests for useActiveUsers hook
- [ ] Integration tests for each form
- [ ] E2E tests for assignment workflow
- [ ] Multi-tenant isolation tests

---

## Database Integration

All "Assigned To" dropdowns should populate from:

**Table:** `users`  
**Filter:** `status = 'active' AND tenant_id = <current_tenant>`  
**Service:** `userService.getUsers()` via `serviceFactory`

### Expected Data Structure:
```typescript
{
  id: string;           // UUID
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  tenant_id: string;    // Filtered by RLS
  avatar?: string;
  phone?: string;
}
```

---

## Files Requiring Changes

### To Create:
1. `src/hooks/useActiveUsers.ts` - Shared hook

### To Update:
1. `src/modules/features/tickets/components/TicketsFormPanel.tsx`
2. `src/modules/features/deals/components/LeadFormPanel.tsx`
3. `src/modules/features/deals/components/ConvertToContractModal.tsx`
4. `src/modules/features/complaints/components/ComplaintsFormPanel.tsx`
5. `src/modules/features/jobworks/components/JobWorksFormPanel.tsx`
6. `src/modules/features/customers/components/CustomerFormPanel.tsx`
7. `src/modules/features/customers/views/CustomerListPage.tsx`

### To Deprecate (After Migration):
1. `src/modules/features/customers/hooks/useUsers.ts` (move to shared location)

---

## Next Steps

1. **Create shared hook** at `src/hooks/useActiveUsers.ts`
2. **Fix critical broken implementations** (Tickets, JobWorks - required fields with no data)
3. **Replace wrong implementations** (LeadForm, ContractModal - Input → Select)
4. **Update hardcoded data** (ComplaintsForm - remove TODO)
5. **Migrate working implementations** (Customers - use shared hook)
6. **Standardize field naming** across all modules
7. **Test thoroughly** with real database

---

## Related Files

### Hook Locations:
- ✅ `src/modules/features/customers/hooks/useUsers.ts` (working)
- ✅ `src/modules/features/user-management/hooks/useUsers.ts` (comprehensive)
- ❌ `src/hooks/useActiveUsers.ts` (NEEDS TO BE CREATED)

### Form Components:
- ✅ `src/modules/features/customers/components/CustomerFormPanel.tsx` (working)
- ❌ `src/modules/features/tickets/components/TicketsFormPanel.tsx` (broken)
- ❌ `src/modules/features/deals/components/LeadFormPanel.tsx` (wrong)
- ❌ `src/modules/features/deals/components/ConvertToContractModal.tsx` (wrong)
- ❌ `src/modules/features/complaints/components/ComplaintsFormPanel.tsx` (hardcoded)
- ❌ `src/modules/features/jobworks/components/JobWorksFormPanel.tsx` (empty)

### Shared Components:
- `src/components/forms/DynamicSelect.tsx` (does NOT support 'users' type)

---

**Report Generated:** 2025-02-28  
**Priority:** CRITICAL  
**Estimated Effort:** 4-6 hours  
**Risk:** High - Required fields broken, user assignment not working
