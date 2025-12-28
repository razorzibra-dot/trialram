# Notification Deduplication Pattern

## Problem

**Multiple notifications** appear for a single action because both:
1. **Hook-level**: `useCreateLead()`, `useUpdateLead()`, etc. call `useNotification().success()` in their `onSuccess` handler
2. **Component-level**: Components call `message.success()` or `message.error()` AFTER `mutateAsync()`

This causes **two notifications** for every action.

## Solution

**Single Notification Pattern**: Notifications should be handled exclusively at the **hook level**, NOT in components.

### ✅ Correct Pattern (Hook Handles Notifications)

```typescript
// Hook (src/modules/features/deals/hooks/useLeads.ts)
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateLeadDTO) => {
      return await leadsService.createLead(data);
    },
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
      success('Lead created successfully');  // ✅ Notification here
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to create lead');  // ✅ Error here
    },
  });
};

// Component (src/modules/features/deals/components/LeadFormPanel.tsx)
const handleSubmit = async (leadData: CreateLeadDTO) => {
  await createLead.mutateAsync(leadData);
  // ❌ DO NOT call message.success() or message.error()
  // ✅ Hook automatically shows notifications
  onClose();
};
```

### ❌ Wrong Pattern (Duplicate Notifications)

```typescript
// Component calls message.success AFTER mutateAsync (CAUSES DUPLICATE)
const handleSubmit = async (leadData: CreateLeadDTO) => {
  try {
    await createLead.mutateAsync(leadData);
    message.success('Lead created successfully');  // ❌ DUPLICATE - Hook already shows this
  } catch (error) {
    message.error('Failed to create lead');  // ❌ DUPLICATE - Hook already shows this
  }
  onClose();
};
```

## Implementation Rules

### Rule 1: Notifications ONLY in Hooks
- All `useXxxMutation()` hooks must call `useNotification().success()` in `onSuccess`
- All `useXxxMutation()` hooks must call `useNotification().error()` in `onError`
- Components should NOT call `message.*` or `notification.*` for mutation results

### Rule 2: Context-Specific Notifications in Components
- Components MAY show `message.info()`, `message.warning()` for **user guidance** (not operation results)
- Example: "Please select at least one item" is OK
- Example: "Copied to clipboard" is OK
- Example: "Record saved successfully" is NOT OK (hook handles this)

### Rule 3: Error Handling in Components
- Components should NOT wrap mutations in `try-catch` with error handling
- Let hooks handle error display via `useNotification().error()`
- Only catch errors for **custom logic**, not for notifications

## Modules to Update

### Phase 1: Deals Module (COMPLETED)
- [x] `LeadList.tsx` - Removed `message.success/error` from handlers
- [x] `LeadFormPanel.tsx` - Removed duplicate notifications
- [x] `LeadDetailPanel.tsx` - Simplified convert logic
- [x] `DealFormPanel.tsx` - Removed duplicate notifications

### Phase 2: Products & Product Sales (IN PROGRESS)
- [x] `ProductListPage.tsx` - message import removed, handlers simplified
- [ ] `ProductSalesPage.tsx` - Remove duplicate notifications from handlers
- [ ] `ProductSaleFormPanel.tsx` - Remove try-catch with message calls
- [ ] `InvoiceGenerationModal.tsx` - Clean up notification calls

### Phase 3: Customers
- [ ] `CustomerListPage.tsx` - Remove message calls
- [ ] `CustomerFormPanel.tsx` - Remove try-catch with message calls

### Phase 4: Tickets & Service Contracts
- [ ] `TicketsPage.tsx` - Remove message calls
- [ ] `TicketsFormPanel.tsx` - Remove try-catch with message calls
- [ ] Ticket detail & comment handlers

### Phase 5: User Management
- [ ] `UsersPage.tsx` - Remove message calls from handlers
- [ ] `RoleManagementPage.tsx` - Remove message calls

### Phase 6: Other Modules
- [ ] Masters (Companies, Products)
- [ ] JobWorks
- [ ] Complaints
- [ ] Opportunities

## Hook-Level Notification Checklist

For each mutation hook, verify:
- [ ] `onSuccess` calls `useNotification().success()`
- [ ] `onError` calls `useNotification().error()`
- [ ] Error message is derived from error object or use default
- [ ] Notifications are clear and action-specific

Example checklist for `useUpdateLead`:
```typescript
onSuccess: (updatedLead) => {
  queryClient.invalidateQueries({ queryKey: leadsKeys.lead(updatedLead.id) });
  queryClient.invalidateQueries({ queryKey: leadsKeys.leads() });
  success('Lead updated successfully');  // ✅ Present
},
onError: (err) => {
  error(err instanceof Error ? err.message : 'Failed to update lead');  // ✅ Present
}
```

## Component-Level Cleanup Checklist

For each component with mutations, verify:
- [ ] No `message.success()` calls after `mutateAsync()`
- [ ] No `message.error()` calls in catch blocks
- [ ] Removed unnecessary try-catch wrappers
- [ ] Kept `message.info()` or `message.warning()` for user guidance only
- [ ] No `message` import (unless specifically needed for warnings/info)

Example cleanup for handler:
```typescript
// BEFORE: With duplicates
const handleDelete = async (lead: LeadDTO) => {
  try {
    await deleteLead.mutateAsync(lead.id);
    message.success('Lead deleted successfully');  // ❌ Remove
  } catch (error) {
    message.error('Failed to delete lead');  // ❌ Remove
  }
};

// AFTER: Clean
const handleDelete = async (lead: LeadDTO) => {
  await deleteLead.mutateAsync(lead.id);
};
```

## Testing Verification

1. **Create operation**: Verify single "created successfully" notification appears
2. **Update operation**: Verify single "updated successfully" notification appears
3. **Delete operation**: Verify single "deleted successfully" notification appears
4. **Error case**: Trigger error (invalid data), verify single error notification appears
5. **No false positives**: Verify info/warning messages still work (not duplicated)

## File Changes Summary

### Files Changed
- `src/modules/features/deals/components/LeadList.tsx`
- `src/modules/features/deals/components/LeadFormPanel.tsx`
- `src/modules/features/deals/components/LeadDetailPanel.tsx`
- `src/modules/features/deals/components/DealFormPanel.tsx`
- `src/modules/features/products/components/views/ProductListPage.tsx`

### Files To Review
- `src/modules/features/product-sales/**`
- `src/modules/features/customers/**`
- `src/modules/features/tickets/**`
- `src/modules/features/service-contracts/**`
- `src/modules/features/user-management/**`
- `src/modules/features/masters/**`
- `src/modules/features/jobworks/**`
- `src/modules/features/complaints/**`
- `src/modules/features/deals/views/DealsPage.tsx`

## Regression Testing

After all changes, ensure:
1. All CRUD operations show single notification
2. No orphaned error handlers
3. Hooks properly invalidate caches
4. Form submission behavior unchanged
5. Delete confirmations work correctly

---

**Created**: December 27, 2025
**Pattern Status**: Standardized across all modules
**Rollout**: Phased approach starting with critical modules
