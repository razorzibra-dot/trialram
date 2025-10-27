# Sales Service Relationship Ambiguity Fix

## Problem
**Error**: `PGRST201: Could not embed because more than one relationship was found for 'sales' and 'users'`

**Location**: 
- `baseService.ts:69` - Error fetching sales
- `salesService.ts:71` - Failed to fetch deals
- `salesService.ts:198` - Failed to fetch sales statistics

## Root Cause
The `sales` table has **TWO** foreign key relationships to the `users` table:
1. `assigned_to` - User the sale is assigned to
2. `created_by` - User who created the sale

When Supabase PostgREST queries tried to embed `assigned_user:users(...)`, it couldn't determine which relationship to use, causing the ambiguity error.

### Problematic Queries
```typescript
// Old approach - caused PGRST201 error
select(`*,
  customer:customers(*),
  items:sale_items(*),
  assigned_user:users(id, firstName, lastName, email)`)
```

## Solution
**Removed complex relationship embedding** following the pattern established in the previous session's multi-tenant fixes.

The `sales` table already stores `assigned_to_name` directly, so we don't need to fetch related user data via relationship embedding. This approach:
- ✅ Avoids relationship ambiguity
- ✅ Follows Supabase RLS best practices
- ✅ Reduces query complexity
- ✅ Maintains all necessary data

### Updated Queries
```typescript
// New approach - no user relationship embedding
select(`*,
  customer:customers(*),
  items:sale_items(*)`)
```

## Files Modified
**File**: `src/services/supabase/salesService.ts`

### Changes
1. **`getSales()` method** (lines 32-38)
   - Removed: `assigned_user:users(id, firstName, lastName, email)`
   - Reason: Avoid PGRST201 relationship ambiguity error

2. **`getSale()` method** (lines 84-87)
   - Removed: `assigned_user:users(id, firstName, lastName, email)`
   - Reason: Consistent with getSales pattern

3. **`createSale()` method** (lines 130-133)
   - Removed: `assigned_user:users(id, firstName, lastName, email)`
   - Reason: Consistent with getSales pattern

4. **`updateSale()` method** (lines 170-173)
   - Removed: `assigned_user:users(id, firstName, lastName, email)`
   - Reason: Consistent with getSales pattern

5. **`mapSaleResponse()` method** (line 356)
   - Changed: `dbSale.assigned_user?.firstName` → `dbSale.assigned_to_name`
   - Reason: Use stored field instead of relationship-based field

## Data Model Context
The sales table structure:
```sql
CREATE TABLE sales (
  ...
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),  -- ✅ This field is already populated
  ...
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ...
);
```

## Verification
✅ TypeScript compilation: Pass (`npx tsc --noEmit`)
✅ ESLint validation: Pass (no new errors)
✅ Build process: In progress

## Testing Recommendations
1. **Test Dashboard Load**: Verify dashboard loads without "Tenant context not initialized" or relationship errors
2. **Test Sales Pipeline**: Confirm sales-by-stage queries work correctly
3. **Test Sales Statistics**: Verify performance metrics display without errors
4. **Test Sales CRUD**: Create, read, update sales to ensure queries work

## Related Patterns
This fix follows the architecture established in the previous session's race condition fixes:
- Query guards for tenant context initialization
- Avoided complex relationship embedding due to Supabase RLS constraints
- Sequential single-table queries preferred over relationship embedding

## Future Considerations
If user details (firstName, lastName, email) are needed for the assigned user in the future:
- Option 1: Add a separate hook to fetch user details using the `assigned_to` UUID
- Option 2: Store additional user fields in the sales table (denormalization)
- Option 3: Create a view that joins sales and users appropriately

For now, the `assigned_to_name` field provides sufficient user identification for the dashboard and sales pipeline views.