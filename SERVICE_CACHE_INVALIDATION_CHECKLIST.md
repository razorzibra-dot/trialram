# ⚠️ CRITICAL SERVICE CACHE INVALIDATION CHECKLIST

**Created:** December 29, 2025  
**Applies To:** ALL entity services with in-memory caching  
**Severity:** CRITICAL - Causes stale data bugs  

---

## 🚨 The Problem

Services with `listCache` and `detailCache` MUST clear them after mutations (create/update/delete). 

**If not cleared:** PageDataService → calls service → gets stale cached data → UI shows wrong data.

---

## ✅ Implementation Checklist

Copy this checklist for EVERY entity service:

### For CREATE Operation
```typescript
protected async afterCreate(entity: YourEntity): Promise<void> {
  try {
    this.listCache.clear();
    this.listInFlight.clear();
    console.log('[YourEntityService] Cache cleared after create');
  } catch {}
}
```

### For UPDATE Operation
```typescript
async update(id: string, data: Partial<YourEntity>, context?: any): Promise<YourEntity> {
  const updated = await this.repository.update(id, data);
  await this.afterUpdate?.(updated);
  
  // Clear list caches
  try {
    this.listCache.clear();
    this.listInFlight.clear();
    console.log('[YourEntityService] Cache cleared after update');
  } catch {}
  
  // Update detail cache with fresh data
  try {
    this.detailCache.set(id, { data: updated, timestamp: Date.now() });
  } catch {}
  
  return updated;
}
```

### For DELETE Operation
```typescript
async delete(id: string, context?: any): Promise<void> {
  await super.delete(id, context);
  
  // Clear ALL caches
  try {
    this.listCache.clear();
    this.listInFlight.clear();
    this.detailCache.delete(id);
    this.detailInFlight.delete(id);
    console.log('[YourEntityService] Cache cleared after delete');
  } catch {}
}
```

---

## 📋 Services Checklist

| Service | File Path | Status | Date Fixed |
|---------|-----------|--------|------------|
| CustomerService | `src/services/customer/supabase/customerService.ts` | ✅ Fixed | 2025-12-29 |
| DealService | `src/services/deals/supabase/dealsService.ts` | ⏳ TODO | - |
| ProductService | `src/services/product/supabase/productService.ts` | ⏳ TODO | - |
| TicketService | `src/services/ticket/supabase/ticketService.ts` | ⏳ TODO | - |
| ComplaintService | `src/services/complaint/supabase/complaintService.ts` | ⏳ TODO | - |
| ServiceContractService | `src/services/serviceContract/supabase/serviceContractService.ts` | ⏳ TODO | - |
| JobWorkService | `src/services/jobwork/supabase/jobWorkService.ts` | ⏳ TODO | - |
| ProductSaleService | `src/services/productsale/supabase/productSaleService.ts` | ⏳ TODO | - |

---

## 🧪 Testing Steps

After implementing cache clearing:

1. **Test CREATE:**
   - Create a new record
   - Check console for `[ServiceName] Cache cleared after create`
   - Verify record appears in list immediately (no F5)

2. **Test UPDATE:**
   - Edit an existing record
   - Check console for `[ServiceName] Cache cleared after update`
   - Verify changes appear immediately (no F5)

3. **Test DELETE:**
   - Delete a record
   - Check console for `[ServiceName] Cache cleared after delete`
   - Verify record disappears immediately (no F5)

---

## 🐛 Symptoms of Missing Cache Clearing

- ❌ After create: Count stays same, new record not visible
- ❌ After update: Changes don't appear, old data still shows
- ❌ After delete: Record still visible in list
- ❌ Console shows: `customersCount: 3` but should be `4`
- ❌ Only F5 refresh fixes the issue

---

## 📚 Related Documentation

- `ENTITY_MUTATION_REFRESH_PATTERN.md` - Full mutation refresh flow
- `MUTATION_REFRESH_DIAGNOSTIC.md` - Troubleshooting guide
- `MUTATION_REFRESH_QUICK_REFERENCE.md` - Quick reference
- `repo.md` Section 1.4 - Rule 1A
- `.github/copilot-instructions.md` - Rule 3A

---

## 🚀 Quick Fix Template

When adding cache clearing to a service:

1. **Find the service file:** `src/services/[entity]/supabase/[entity]Service.ts`
2. **Verify it has caches:**
   ```typescript
   private listCache: Map<...> = new Map();
   private listInFlight: Map<...> = new Map();
   private detailCache: Map<...> = new Map();
   private detailInFlight: Map<...> = new Map();
   ```
3. **Add afterCreate hook** (see checklist above)
4. **Override update method** (see checklist above)
5. **Override delete method** (see checklist above)
6. **Test all three operations**
7. **Update this checklist** with ✅ status

---

**REMEMBER:** This is NOT optional! ALL services MUST implement cache clearing to prevent stale data bugs.
