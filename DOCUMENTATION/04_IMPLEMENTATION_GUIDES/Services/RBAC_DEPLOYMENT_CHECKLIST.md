# RBAC Implementation - Deployment Checklist

## ✅ Pre-Deployment

### Code Review
- [x] All TypeScript code compiles
- [x] ESLint passes (0 new errors)
- [x] No breaking changes to existing functionality
- [x] Backward compatible with mock mode

### Testing Environment Setup
- [ ] Local database backup created
- [ ] Supabase local instance running
- [ ] Fresh checkout of code
- [ ] Dependencies installed: `npm install`

---

## 🚀 Deployment Steps

### Step 1: Backup Current Database
```bash
# Backup current Supabase instance
supabase db pull --linked
# This saves current schema to supabase/migrations/

# Keep a snapshot
supabase snapshot --name "pre-rbac-fix"
```

### Step 2: Reset Database (DEVELOPMENT ONLY)
```bash
# ⚠️ WARNING: This deletes all data in development
# DO NOT RUN ON PRODUCTION without backup!

supabase db reset
```

**What this does:**
- Removes all development data
- Re-runs all migrations (000-007)
- Re-applies seed data (now includes RBAC data)
- Fresh start with complete RBAC setup

### Step 3: Verify Seed Data Loaded

#### Via SQL:
```sql
-- Check permissions
SELECT COUNT(*) as permission_count FROM permissions;
-- Expected: 34

-- Check roles
SELECT COUNT(*) as role_count FROM roles;
-- Expected: 7

-- Check role-permissions
SELECT COUNT(*) as mapping_count FROM role_permissions;
-- Expected: 150+

-- Detailed check
SELECT 
  r.name as role_name,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Expected output:
-- Administrator | 34
-- Manager       | 20
-- Agent         | 9
-- Engineer      | 8
```

#### Via Browser Console:
```javascript
// After logging in as admin
fetch('/_supabase_health').then(r => r.json()).then(d => console.log('Connected'))
```

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 5: Clear Browser Data

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Refresh page
location.reload()
```

---

## ✅ Testing Phase

### Test 1: Admin Login

**Credentials**:
```
Email: admin@acme.com
Password: password123
```

**Expected**:
- ✅ Login successful
- ✅ Dashboard loads
- ✅ Sidebar shows all modules

**Verify in Console**:
```javascript
// Check authentication
const user = JSON.parse(localStorage.getItem('sb_current_user'));
console.log({
  userId: user.id,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId
});

// Expected:
// {
//   userId: "650e8400-e29b-41d4-a716-446655440001",
//   email: "admin@acme.com",
//   role: "admin",
//   tenantId: "550e8400-e29b-41d4-a716-446655440001"
// }
```

### Test 2: Permission Checks

```javascript
// Test synchronous checks
console.log('Permissions:');
console.log('manage_service_contracts:', authService.hasPermission('manage_service_contracts'));   // true
console.log('manage_product_sales:', authService.hasPermission('manage_product_sales'));          // true
console.log('manage_complaints:', authService.hasPermission('manage_complaints'));                // true
console.log('manage_users:', authService.hasPermission('manage_users'));                          // true
console.log('random_permission:', authService.hasPermission('random_permission'));                // false

// All should be true for admin
```

### Test 3: Tenant Isolation

```javascript
// Check tenant_id in storage
console.log({
  tenantId: authService.getCurrentTenantId(),
  storedTenantId: localStorage.getItem('sb_tenant_id'),
  userTenantId: JSON.parse(localStorage.getItem('sb_current_user')).tenantId
});

// All three should match: 550e8400-e29b-41d4-a716-446655440001
```

### Test 4: Module Access

Click each module and verify access:

| Module | Admin | Manager | Engineer | Agent | Result |
|--------|:-----:|:-------:|:---------:|:-----:|:------:|
| Service Contracts | ✓ | ✓ | ✗ | ✗ | Page loads or Access Denied |
| Product Sales | ✓ | ✓ | ✓ | ✗ | Page loads or Access Denied |
| Complaints | ✓ | ✗ | ✗ | ✓ | Page loads or Access Denied |
| Job Works | ✓ | ✗ | ✓ | ✗ | Page loads or Access Denied |

**Expected**: Admin can access all; others get appropriate access based on permissions

### Test 5: Data Isolation

```sql
-- Login as admin from Acme (550e8400-e29b-41d4-a716-446655440001)
-- Then run in browser console:

-- Check what tenant data you can see
SELECT COUNT(*) FROM customers;  
-- Should only return Acme customers (5)

SELECT COUNT(*) FROM customers WHERE tenant_id != '550e8400-e29b-41d4-a716-446655440001'::UUID;
-- Should return 0 (no cross-tenant data)

SELECT DISTINCT tenant_id FROM customers;
-- Should only show Acme's tenant_id
```

### Test 6: Async Permission Loading

```javascript
// Test async permission loading
(async () => {
  const has_contract_perm = await authService.hasPermissionAsync('manage_service_contracts');
  const all_permissions = await authService.getCurrentUserPermissions();
  
  console.log('Async permission check:', has_contract_perm);  // true
  console.log('All permissions:', all_permissions.length);   // 34 for admin
})();
```

---

## 🔍 Debugging Checklist

### Problem: Admin Can't Login

**Check**:
1. [ ] User exists: `SELECT * FROM users WHERE email = 'admin@acme.com';`
2. [ ] User has correct tenant: Check `tenant_id` matches Acme
3. [ ] Supabase Auth configured: Check email/password in auth.users
4. [ ] Clear localStorage: `localStorage.clear()` then retry

**Fix**:
```bash
# Reseed data
supabase db reset
```

### Problem: Service Contracts Module Not Accessible

**Check**:
1. [ ] Permission exists: `SELECT * FROM permissions WHERE name = 'manage_service_contracts';`
2. [ ] Admin role has permission:
   ```sql
   SELECT COUNT(*) FROM role_permissions rp
   JOIN roles r ON r.id = rp.role_id
   JOIN permissions p ON p.id = rp.permission_id
   WHERE r.name = 'Administrator' AND p.name = 'manage_service_contracts';
   -- Should be: 1
   ```
3. [ ] User has admin role: Check users table `role` column = 'admin'
4. [ ] Permission cache not stale: `authService.clearPermissionCache()`

**Fix**:
```javascript
// Clear and reload
authService.clearPermissionCache();
location.reload();
```

### Problem: Admin Sees Other Tenant Data

**Check**:
1. [ ] Tenant_id stored: `localStorage.getItem('sb_tenant_id')`
2. [ ] RLS policies enabled: `SELECT * FROM pg_policies WHERE tablename='customers';`
3. [ ] JWT includes tenant_id (advanced)
4. [ ] Tenant context matches: 
   ```javascript
   multiTenantService.getCurrentTenantId() === localStorage.getItem('sb_tenant_id')
   ```

**Fix**:
1. Check console for warnings: `[SECURITY] Tenant mismatch detected`
2. Re-login to refresh tenant context
3. Check RLS policies are enabled in Supabase dashboard

### Problem: Permission Cache Not Updating

**Check**:
1. [ ] Role changed in database
2. [ ] Cache wasn't cleared after change
3. [ ] Same browser session still active

**Fix**:
```javascript
// Clear specific user cache
authService.clearPermissionCache(userId);

// Clear all cache
authService.clearPermissionCache();

// Reload page
location.reload();
```

---

## 📊 Performance Validation

### Permission Check Speed
```javascript
// Test synchronous performance
console.time('sync-permission-check');
for (let i = 0; i < 1000; i++) {
  authService.hasPermission('manage_contracts');
}
console.timeEnd('sync-permission-check');
// Expected: < 5ms for 1000 calls (~1-5 microseconds per call)
```

### Async Permission Check Speed
```javascript
// Test async performance
console.time('async-permission-check');
await authService.hasPermissionAsync('manage_contracts');
console.timeEnd('async-permission-check');
// Expected: 50-150ms (includes DB query + parsing)
```

### Cache Hit Ratio
```javascript
// Monitor cache behavior (in devtools)
// Should see permission cache hit on subsequent calls
authService.hasPermission('manage_contracts');  // Cache miss
authService.hasPermission('manage_contracts');  // Cache hit
authService.hasPermission('manage_complaints');  // Cache hit
```

---

## 🛡️ Security Validation

### Tenant Isolation Test

**Test Case 1**: Login as Acme Admin
```
Expected: Can see Acme data only
- Customers: 5 (from Acme)
- Sales: 2 (from Acme)
- Contracts: 1 (from Acme)
```

**Test Case 2**: Check Cross-Tenant Visibility
```sql
-- After logging in as Acme admin, run:
SELECT DISTINCT tenant_id FROM (
  SELECT tenant_id FROM customers
  UNION
  SELECT tenant_id FROM sales
  UNION
  SELECT tenant_id FROM contracts
);
-- Expected: Only 550e8400-e29b-41d4-a716-446655440001 (Acme)
```

**Test Case 3**: Verify RLS Policies
```sql
-- Check RLS is enabled
SELECT tablename, policys FROM pg_policies 
WHERE tablename IN ('customers', 'sales', 'contracts')
LIMIT 5;
-- Expected: Multiple policies returned
```

### Permission Audit

**Test**: Check permission changes logged
```sql
SELECT * FROM audit_logs 
WHERE action = 'permission_granted' 
ORDER BY created_at DESC 
LIMIT 10;
-- Expected: Permission grant entries with timestamps
```

---

## 🚨 Rollback Plan (If Issues)

### Quick Rollback

```bash
# If major issues encountered:

# 1. Stop server
# (Ctrl+C)

# 2. Restore from backup
supabase db push --linked < backup.sql

# 3. Clear browser cache
# (Ctrl+Shift+Del in browser)

# 4. Restart server
npm run dev
```

### Rollback Commit (Version Control)

```bash
# If deployment to git needed:
git revert <commit-hash>
git push
```

---

## ✅ Post-Deployment Checklist

### Functionality
- [ ] Admin users can login
- [ ] Permissions checked before module access
- [ ] Service Contracts accessible to admin
- [ ] Product Sales accessible to admin
- [ ] Complaints accessible to admin
- [ ] All modules load correctly
- [ ] Data displayed accurately

### Security
- [ ] Admin sees only own tenant data
- [ ] Other tenant data not accessible
- [ ] Permission isolation working
- [ ] RLS policies enforced
- [ ] No security warnings in console
- [ ] No data leakage between tenants

### Performance
- [ ] Page load time acceptable
- [ ] Permission checks < 5ms
- [ ] No console errors
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Cache hit ratio > 75%

### Monitoring
- [ ] Error logs clean
- [ ] No security warnings
- [ ] Audit trail populated
- [ ] Performance metrics normal
- [ ] Tenant isolation verified
- [ ] No N+1 queries

---

## 📋 Sign-Off

- [ ] All tests passed
- [ ] No critical issues
- [ ] Documentation reviewed
- [ ] Rollback plan ready
- [ ] Ready for production

**Approved by**: _______________  
**Date**: _______________  
**Deployment Team**: _______________

---

## 🆘 Emergency Contacts

### For Deployment Issues:
1. Check RBAC_QUICK_REFERENCE.md troubleshooting
2. Review RBAC_IMPLEMENTATION_COMPREHENSIVE.md
3. Check browser console for error messages
4. Review SQL queries in seed.sql

### For Data Issues:
1. Check audit_logs table
2. Review tenant_id matches
3. Verify RLS policies enabled
4. Check permission mappings in database

### For Performance Issues:
1. Check permission cache size
2. Monitor database query times
3. Review browser console metrics
4. Check network tab for slow requests

---

## 📞 Support Resources

- **Full Documentation**: RBAC_IMPLEMENTATION_COMPREHENSIVE.md
- **Quick Reference**: RBAC_QUICK_REFERENCE.md
- **Session Summary**: RBAC_FIX_SUMMARY_SESSION.md
- **Seed Data**: supabase/seed.sql
- **Code**: src/services/supabase/authService.ts
- **Tenant Service**: src/services/supabase/multiTenantService.ts

---

**Deployment Date**: __________  
**Version**: 1.0 (Phase 1 - Complete)  
**Status**: Ready for QA/Production Testing