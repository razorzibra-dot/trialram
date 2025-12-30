# Quick Reference - Multiple Notifications Issue

## TL;DR

**Problem**: Actions show 2+ duplicate notifications

**Cause**: Both hooks AND components show notifications

**Solution**: Remove `message.success/error` calls from components - let hooks handle all notifications

---

## Quick Fix Template

### BEFORE (Wrong - Duplicate Notifications)
```typescript
const handleSubmit = async (data) => {
  try {
    await createLead.mutateAsync(data);
    message.success('Lead created');  // ❌ DUPLICATE!
  } catch (error) {
    message.error('Failed');  // ❌ DUPLICATE!
  }
};
```

### AFTER (Correct - Single Notification)
```typescript
const handleSubmit = async (data) => {
  await createLead.mutateAsync(data);
  // Hook shows notification automatically ✅
};
```

---

## Files Already Fixed ✅

1. LeadList.tsx
2. LeadFormPanel.tsx
3. LeadDetailPanel.tsx
4. DealFormPanel.tsx
5. ProductListPage.tsx
6. UsersPage.tsx

**Test these first** - they should show single notifications now.

---

## How to Fix Any File

1. Find `await *.mutateAsync(` in component
2. Look for `message.success()` or `message.error()` right after
3. **DELETE** those message calls
4. **DELETE** try-catch if only used for notifications
5. Keep `message.info()` and `message.warning()` (those are for user guidance)
6. Test - should see ONE notification per action

---

## Remaining Modules Needing Fix

### Easy (1 file each, 4 locations)
- [ ] src/modules/features/product-sales/views/ProductSalesPage.tsx
- [ ] src/modules/features/customers/views/CustomerListPage.tsx

### Medium (2-4 files, ~10 locations total)
- [ ] src/modules/features/tickets/**/*.tsx
- [ ] src/modules/features/complaints/**/*.tsx
- [ ] src/modules/features/user-management/views/RoleManagementPage.tsx

### Lower Priority
- [ ] src/modules/features/masters/**/*.tsx
- [ ] src/modules/features/jobworks/**/*.tsx

---

## Testing

After any fix:

1. Create a record → Should see ONE notification
2. Edit the record → Should see ONE notification  
3. Delete the record → Should see ONE notification
4. Try invalid action → Should see ONE error

If you still see multiple notifications, check:
- Did you remove `message.success()` call?
- Did you remove the try-catch?
- Did you keep `message.info()` calls (those are OK)?

---

## Why This Happens

Every mutation hook looks like this:

```typescript
useMutation({
  mutationFn: ...,
  onSuccess: () => {
    success('Done');  // Hook shows notification
  },
  onError: () => {
    error('Failed');  // Hook shows error
  }
})
```

So the component just needs to call:
```typescript
await mutation.mutateAsync(data);  // ✅ Hook handles notifications
```

**NOT**:
```typescript
await mutation.mutateAsync(data);
message.success('Done');  // ❌ Duplicate!
```

---

## Documentation

For more details, see:
- [NOTIFICATION_DEDUPLICATION_PATTERN.md](NOTIFICATION_DEDUPLICATION_PATTERN.md) - Complete pattern guide
- [NOTIFICATION_DUPLICATION_FIX_SUMMARY.md](NOTIFICATION_DUPLICATION_FIX_SUMMARY.md) - All affected files listed
- [NOTIFICATION_ISSUE_INVESTIGATION_COMPLETE.md](NOTIFICATION_ISSUE_INVESTIGATION_COMPLETE.md) - Full investigation report

---

## Pattern Going Forward

**For new code**:
- Mutations: Add `onSuccess` and `onError` with notifications in hooks
- Components: Call `mutateAsync()` without try-catch
- Components: Only use `message.info()` for user guidance
- **NEVER** use `message.success()` or `message.error()` after mutations

This ensures clean, consistent notifications everywhere.

---

**Last Updated**: December 27, 2025
**Status**: 6 files fixed, pattern established, documentation complete
