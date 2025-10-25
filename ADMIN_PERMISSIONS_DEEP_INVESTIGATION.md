# Deep Investigation: Admin Users Missing CRUD Buttons

## Current Investigation Session Summary

**Issue**: Admin users cannot see Create/Update/Delete action buttons in any tenant module UI.

**User Observation**: The `user_roles` table in Supabase is completely empty with no data.

---

## 🔍 FINDINGS

### Finding 1: Database Schema Mismatch (COLUMN NAMING)
**Severity**: 🔴 HIGH - Affects User Data Loading

**Issue**:
- **Database Schema** defines columns: `first_name`, `last_name`, `role`, `tenant_id` (snake_case)
- **authService Code** tries to access: `appUser.firstName`, `appUser.lastName`, `appUser.role`

**Location**: `src/services/authService.ts` lines 350-355

**Code**:
```typescript
// WRONG - Database returns first_name, not firstName
firstName: appUser.firstName,  // undefined
lastName: appUser.lastName,    // undefined
role: appUser.role,            // ✓ CORRECT
tenantId: appUser.tenant_id,   // ✓ CORRECT
```

**Impact**:
- User `name` field becomes "undefined undefined" (cosmetic issue)
- BUT `role` field SHOULD work correctly
- This suggests the role IS being read properly from database

**Fix Required**: Convert snake_case from database to camelCase in User object

---

### Finding 2: Dual RBAC Architectures
**Severity**: 🟡 MEDIUM - Architectural Confusion

**Architecture 1 - Legacy System** (Currently Used):
- `users` table has `role` column with values: admin, manager, agent, engineer, customer
- `authService.ts` uses this `role` field directly
- `hasPermission()` checks against hardcoded `rolePermissions` map

**Architecture 2 - Proper RBAC System** (Defined But Not Used):
- `roles` table - stores role definitions with permissions as JSONB
- `user_roles` table - junction table (EMPTY - root cause!)
- `permissions` table - permission definitions
- `role_permissions` table - role-permission mappings

**Current Status**:
- Legacy system is fully implemented and should work
- Proper RBAC system has tables but NO DATA
- No code is reading from `user_roles` or `roles` tables
- **No switch between systems based on what data exists**

---

### Finding 3: Permission Check Logic (Working Correctly)
**Severity**: 🟢 GOOD - Logic is sound

**Code Analysis** (`src/services/authService.ts` lines 469-535):

1. ✅ Super admin check: `if (user.role === 'super_admin') return true`
2. ✅ Permission string parsing: Handles both 'read' and 'sales:update' formats
3. ✅ Action mapping: 'update' → 'write', 'delete' → 'delete'
4. ✅ Role-based lookup: Gets permissions from `rolePermissions[userRole]`
5. ✅ Manage permission fallback: Checks for 'manage_sales' etc.

**Permission Mapping**:
```typescript
// For role='admin'
rolePermissions['admin'] = [
  'read', 'write', 'delete',           // ✓ Generic permissions
  'manage_customers', 'manage_sales',  // ✓ Resource-specific
  // ... more permissions
]

// When checking 'sales:update'
1. Parse: resource='sales', action='update'
2. Map: action='update' → 'write'
3. Check: 'write' IN admin permissions → TRUE ✓
```

**Conclusion**: Permission logic should work IF `role` field is correctly set to 'admin'

---

### Finding 4: UI Component Permission Checks (Correct)
**Severity**: 🟢 GOOD - Components properly checking

**Example** (`src/modules/features/sales/views/SalesPage.tsx`):

```typescript
// Line 199 - New Deal button
{hasPermission('sales:create') && (
  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
    New Deal
  </Button>
)}

// Line 159 - Edit button
{hasPermission('sales:update') && (
  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
    Edit
  </Button>
)}

// Line 164 - Delete button
{hasPermission('sales:delete') && (
  <Popconfirm ...>
    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
      Delete
    </Button>
  </Popconfirm>
)}
```

✅ All buttons properly guarded with permission checks

---

## 🎯 ROOT CAUSE ANALYSIS

### Hypothesis 1: Users Don't Have 'admin' Role (MOST LIKELY)
**Probability**: 90%

**Scenario**:
1. Users exist in Supabase auth
2. Users table has entries BUT `role` column is NULL or set to 'agent'
3. Admin permissions require `role='admin'`
4. Therefore, buttons are hidden

**Verification Needed**:
```sql
SELECT id, email, role, status, tenant_id FROM users WHERE email LIKE '%admin%';
```

**Fix**: Update user rows to set `role='admin'`:
```sql
UPDATE users SET role='admin' WHERE email IN ('admin@acme.com', ...);
```

---

### Hypothesis 2: User Not Found in Database
**Probability**: 5%

**Scenario**:
1. User authenticated successfully with Supabase auth
2. User record NOT found in `users` table during login
3. Login fails with "User profile not found"

**Check**: Line 335-337 in authService.ts:
```typescript
if (userError) {
  console.error('[AUTH] User fetch error:', userError);
  throw new Error('User profile not found. Contact administrator.');
}
```

If this error appears in browser console, this is the issue.

---

### Hypothesis 3: Status Field Issue
**Probability**: 2%

**Issue**: User `role` might be set correctly, but `status='suspended'` or 'inactive'

**Current Check**: The code does NOT check `status` field in `hasPermission()`

**Code**:
```typescript
// Line 469-480: Only checks role, not status
const userRole = user.role || user.role;
if (!userRole) {
  return false;
}
```

**Potential Issue**: If user status is 'suspended', they still get permissions

---

## 📋 VERIFICATION CHECKLIST

### Step 1: Verify User Data in Database
```sql
-- Check admin users
SELECT id, email, name, role, status, tenant_id FROM users 
WHERE email LIKE '%admin%' 
LIMIT 5;
```

**Expected Output**:
```
id          | email              | name        | role  | status | tenant_id
------------|-------------------|-------------|-------|--------|------------------
uuid...     | admin@acme.com    | Admin User  | admin | active | uuid...
```

**Look For**:
- ❌ `role IS NULL` - Need to set role
- ❌ `role = 'agent'` - Should be 'admin'
- ✅ `role = 'admin'` - Correct

---

### Step 2: Verify Login Session
Open browser console (F12) and run:
```javascript
// Check if user is stored after login
const storedUser = JSON.parse(localStorage.getItem('crm_user'));
console.log('Current User:', storedUser);
console.log('User Role:', storedUser?.role);
console.log('User Email:', storedUser?.email);
```

**Expected Output**:
```javascript
{
  id: "uuid...",
  email: "admin@acme.com",
  name: "undefined undefined",  // ← This is the naming bug
  role: "admin",                 // ← MUST be 'admin'
  ...
}
```

**If `role` is NOT 'admin'**: Stop here - issue is in Step 1

---

### Step 3: Verify Permission Checking
```javascript
// Test the hasPermission function
const authService = window.authService;
authService.hasPermission('sales:create');   // Should log and return true/false
authService.hasPermission('sales:update');
authService.hasPermission('sales:delete');
```

Watch browser console for debug output from lines 490, 516, 520, 528, 533

---

### Step 4: Verify Component Rendering
```javascript
// Check if SalesPage component sees permission
const component = document.querySelector('[data-testid="sales-page"]');
console.log('Component exists:', !!component);

// Look for buttons
console.log('Create button visible:', !!document.querySelector('[title*="New Deal"]'));
console.log('Edit button visible:', !!document.querySelector('[title*="Edit"]'));
console.log('Delete button visible:', !!document.querySelector('[title*="Delete"]'));
```

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Update User Roles (SQL)
**If `user_roles` table is supposed to stay empty (legacy mode)**:

```sql
UPDATE users 
SET role = 'admin'
WHERE email IN (
  'admin@acme.com',
  'admin@techcorp.com',
  'admin@innovatecorp.com'
)
AND role != 'admin';
```

---

### Fix 2: Fix Column Naming in authService
**File**: `src/services/authService.ts`

**Change lines 350-352 from**:
```typescript
name: `${appUser.firstName} ${appUser.lastName}`,
firstName: appUser.firstName,
lastName: appUser.lastName,
```

**To**:
```typescript
name: `${appUser.first_name} ${appUser.last_name}`,
firstName: appUser.first_name,
lastName: appUser.last_name,
```

Also update in `restoreSession()` method around line 422

---

### Fix 3: Populate Proper RBAC Tables (Long-term)
If the architecture should use `user_roles` table:

1. Run migration to populate roles table
2. Run migration to populate user_roles with assignments
3. Update authService to query `user_roles` and `roles` tables
4. Remove hardcoded `rolePermissions` map

This is more complex - see `ADMIN_PERMISSIONS_ACTION_PLAN.md`

---

## 🚨 IMPORTANT NEXT STEPS

**Priority 1** - Immediate:
1. Check current user role in database
2. Verify login console logs
3. Run Step 2 verification above

**Priority 2** - If role is 'admin':
1. Check browser console for permission checking debug logs
2. Verify component is rendering (Step 4)

**Priority 3** - If buttons still don't show:
1. Apply Fix 2 (column naming)
2. Test again

**Priority 4** - Long-term:
1. Implement proper RBAC using user_roles table
2. Apply Fix 3

---

## 📊 System Architecture Diagram

```
Authentication Login
    ↓
Supabase Auth (supabase.auth.signInWithPassword)
    ↓
Get App User (users table)
    ↓
Check role COLUMN directly
    ↓
Store user.role in localStorage
    ↓
Component calls hasPermission('sales:update')
    ↓
authService.hasPermission() reads from localStorage
    ↓
Check: user.role === 'admin' in rolePermissions
    ↓
Return: true/false to component
    ↓
Component shows/hides button based on result

NOTE: user_roles TABLE IS COMPLETELY BYPASSED!
```

---

## 📝 Console Debug Commands

Run these in browser console (F12):

```javascript
// 1. Check stored user
console.table(JSON.parse(localStorage.getItem('crm_user')));

// 2. Check permissions array for user's role
const role = JSON.parse(localStorage.getItem('crm_user')).role;
console.log('Role:', role);

// 3. Test all permission checks
['sales:create', 'sales:update', 'sales:delete'].forEach(perm => {
  console.log(`hasPermission('${perm}'):`, authService.hasPermission(perm));
});

// 4. Check rolePermissions map
console.table(authService.rolePermissions);

// 5. Verify button visibility after checking permissions
console.log('Buttons visible:', {
  create: !!document.querySelector('[title*="New"]'),
  edit: !!document.querySelector('[title*="Edit"]'),
  delete: !!document.querySelector('[title*="Delete"]')
});
```

---

## 🎓 Learning Points

1. **Dual System Issue**: Having both `role` column and `user_roles` table creates confusion
2. **Schema Mismatch**: Database (snake_case) vs TypeScript (camelCase) mismatch
3. **Hardcoded Permissions**: No flexibility without code changes
4. **Missing Status Check**: `status` field should be checked in permissions
5. **Architecture Debt**: Should be one consistent RBAC system, not two
