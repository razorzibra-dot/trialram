# 🔍 Quick RBAC Verification Commands

Run these SQL queries in Supabase to verify tenant, user, role, and permission configuration.

---

## 1️⃣ Verify Tenants

```sql
-- Show all tenants
SELECT 
  id, 
  name, 
  domain, 
  status, 
  plan,
  created_at
FROM tenants
ORDER BY created_at;

-- Expected Result:
-- 3 rows:
-- 1. 550e8400-e29b-41d4-a716-446655440001 | Acme Corporation | acme-corp.local | active | enterprise
-- 2. 550e8400-e29b-41d4-a716-446655440002 | Tech Solutions Inc | tech-solutions.local | active | premium
-- 3. 550e8400-e29b-41d4-a716-446655440003 | Global Trading Ltd | global-trading.local | active | enterprise
```

---

## 2️⃣ Verify Regular Users (Tenant-Scoped)

```sql
-- Show all regular users (NOT super admins)
SELECT 
  email, 
  name, 
  role, 
  status,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = FALSE
ORDER BY email;

-- Expected Result:
-- 9 rows total:
-- admin@acme.com | Admin Acme | admin | active | false | 550e8400-e29b-41d4-a716-446655440001
-- manager@acme.com | Manager Acme | manager | active | false | 550e8400-e29b-41d4-a716-446655440001
-- engineer@acme.com | Engineer Acme | engineer | active | false | 550e8400-e29b-41d4-a716-446655440001
-- user@acme.com | User Acme | agent | active | false | 550e8400-e29b-41d4-a716-446655440001
-- admin@techsolutions.com | Admin Tech | admin | active | false | 550e8400-e29b-41d4-a716-446655440002
-- manager@techsolutions.com | Manager Tech | manager | active | false | 550e8400-e29b-41d4-a716-446655440002
-- admin@globaltrading.com | Admin Global | admin | active | false | 550e8400-e29b-41d4-a716-446655440003
```

---

## 3️⃣ Verify Super Admins (Platform-Wide)

```sql
-- Show all super administrators
SELECT 
  email, 
  name, 
  role, 
  status,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = TRUE
ORDER BY email;

-- Expected Result:
-- 3 rows:
-- superuser.auditor@platform.admin | Super User Auditor | super_admin | active | true | NULL
-- superuser1@platform.admin | Super User 1 | super_admin | active | true | NULL
-- superuser2@platform.admin | Super User 2 | super_admin | active | true | NULL
-- 
-- CRITICAL: All super admins should have tenant_id = NULL
```

---

## 4️⃣ Verify Constraint: Super Admin Role Consistency

```sql
-- Check constraint: is_super_admin = TRUE requires role = 'super_admin' AND tenant_id = NULL
SELECT 
  email,
  is_super_admin,
  role,
  tenant_id,
  CASE 
    WHEN is_super_admin = TRUE AND (role != 'super_admin' OR tenant_id IS NOT NULL) THEN '❌ VIOLATION'
    WHEN is_super_admin = FALSE AND (role = 'super_admin' OR tenant_id IS NULL) THEN '❌ VIOLATION'
    ELSE '✅ OK'
  END as constraint_status
FROM users
ORDER BY is_super_admin DESC, email;

-- Expected Result:
-- All rows should show: ✅ OK
```

---

## 5️⃣ Verify Roles Per Tenant

```sql
-- Show all roles organized by tenant
SELECT 
  t.name as tenant_name,
  r.name as role_name,
  r.is_system_role,
  COUNT(rp.permission_id) as permission_count
FROM tenants t
LEFT JOIN roles r ON t.id = r.tenant_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY t.id, t.name, r.id, r.name, r.is_system_role
ORDER BY t.name, r.name;

-- Expected Result:
-- Acme Corporation:
--   Super Administrator | true | 29
--   Administrator | true | 24
--   Manager | true | 19
--   Agent | true | 9
--   Engineer | true | 7
--
-- Tech Solutions Inc:
--   Super Administrator | true | 29
--   Administrator | true | 24
--   Manager | true | 19
--
-- Global Trading Ltd:
--   Super Administrator | true | 29
```

---

## 6️⃣ Verify User-Role Assignments

```sql
-- Show all user-to-role assignments
SELECT 
  u.email,
  u.role as user_role,
  r.name as assigned_role,
  t.name as tenant_name,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN tenants t ON ur.tenant_id = t.id
WHERE u.is_super_admin = FALSE
ORDER BY t.name, u.email;

-- Expected Result:
-- 7 rows showing each user assigned to their role:
-- admin@acme.com | admin | Super Administrator | Acme Corporation | [timestamp]
-- manager@acme.com | manager | Manager | Acme Corporation | [timestamp]
-- ... etc
```

---

## 7️⃣ Verify All Permissions

```sql
-- Show all defined permissions
SELECT 
  name,
  resource,
  action,
  description
FROM permissions
ORDER BY resource, action;

-- Expected Result:
-- 31 permissions including:
-- view_dashboard | dashboard | view | View dashboard and analytics
-- view_customers | customers | view | View customer data
-- create_customers | customers | create | Create new customers
-- ... and 28 more
```

---

## 8️⃣ Verify Unique Constraints

```sql
-- Check unique_email_per_tenant
SELECT email, tenant_id, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY email, tenant_id
HAVING COUNT(*) > 1;

-- Expected Result: 0 rows (no duplicates)

-- Check unique_role_per_tenant
SELECT name, tenant_id, COUNT(*) as count
FROM roles
GROUP BY name, tenant_id
HAVING COUNT(*) > 1;

-- Expected Result: 0 rows (no duplicates)
```

---

## 9️⃣ Verify No Orphaned Records

```sql
-- Check for orphaned users (missing tenant)
SELECT u.id, u.email
FROM users u
WHERE u.is_super_admin = FALSE AND u.tenant_id NOT IN (SELECT id FROM tenants);

-- Expected Result: 0 rows

-- Check for orphaned roles (missing tenant)
SELECT r.id, r.name
FROM roles r
WHERE r.tenant_id NOT IN (SELECT id FROM tenants);

-- Expected Result: 0 rows

-- Check for orphaned user_roles (missing references)
SELECT ur.id
FROM user_roles ur
WHERE ur.user_id NOT IN (SELECT id FROM users)
   OR ur.role_id NOT IN (SELECT id FROM roles)
   OR ur.tenant_id NOT IN (SELECT id FROM tenants);

-- Expected Result: 0 rows
```

---

## 🔟 Verify Super User Tenant Access

```sql
-- Show super user access mappings
SELECT 
  u.email,
  COUNT(suta.tenant_id) as tenant_access_count,
  string_agg(t.name, ', ') as accessible_tenants
FROM users u
LEFT JOIN super_user_tenant_access suta ON u.id = suta.super_user_id
LEFT JOIN tenants t ON suta.tenant_id = t.id
WHERE u.is_super_admin = TRUE
GROUP BY u.id, u.email
ORDER BY u.email;

-- Expected Result:
-- superuser1@platform.admin | 3 | Acme Corporation, Tech Solutions Inc, Global Trading Ltd
-- superuser2@platform.admin | 2 | Acme Corporation, Tech Solutions Inc
-- superuser.auditor@platform.admin | 3 | Acme Corporation, Tech Solutions Inc, Global Trading Ltd
```

---

## 1️⃣1️⃣ Verify RLS Policies

```sql
-- Show all RLS policies on RBAC tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('permissions', 'roles', 'user_roles', 'role_templates')
ORDER BY tablename, policyname;

-- Expected Result:
-- Should show policies for:
-- - permissions: users_view_all_permissions, admins_create_permissions, admins_update_permissions
-- - roles: users_view_tenant_roles, admins_create_roles, admins_update_roles, admins_delete_roles
-- - user_roles: users_view_tenant_user_roles, admins_assign_roles, admins_remove_roles
-- - role_templates: users_view_role_templates, admins_create_role_templates, admins_update_role_templates, super_admin_delete_role_templates
```

---

## 1️⃣2️⃣ User Count by Tenant

```sql
-- Count users per tenant
SELECT 
  t.name as tenant_name,
  COUNT(u.id) as active_users,
  COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN u.role = 'manager' THEN 1 END) as managers,
  COUNT(CASE WHEN u.role = 'agent' THEN 1 END) as agents,
  COUNT(CASE WHEN u.role = 'engineer' THEN 1 END) as engineers
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.deleted_at IS NULL AND u.is_super_admin = FALSE
GROUP BY t.id, t.name
ORDER BY t.name;

-- Expected Result:
-- Acme Corporation | 4 | 1 | 1 | 1 | 1
-- Global Trading Ltd | 1 | 1 | 0 | 0 | 0
-- Tech Solutions Inc | 2 | 1 | 1 | 0 | 0
-- Plus 3 super admins not shown (tenant_id = NULL)
```

---

## 1️⃣3️⃣ Verify Permission Coverage by Role

```sql
-- Show detailed permission breakdown for each role
SELECT 
  r.name as role_name,
  t.name as tenant_name,
  p.resource,
  p.action,
  p.name as permission_name
FROM roles r
JOIN tenants t ON r.tenant_id = t.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Administrator'
ORDER BY t.name, p.resource, p.action;

-- Expected Result:
-- Shows all permissions assigned to Administrator role per tenant
```

---

## 1️⃣4️⃣ Verify No Constraint Violations

```sql
-- Run all constraint checks at once
WITH issues AS (
  -- Check 1: Super admin consistency
  SELECT 'super_admin_consistency' as check_type, 
         COUNT(*) as violation_count
  FROM users 
  WHERE (is_super_admin = TRUE AND (role != 'super_admin' OR tenant_id IS NOT NULL))
     OR (is_super_admin = FALSE AND role = 'super_admin')
  UNION ALL
  -- Check 2: Orphaned users
  SELECT 'orphaned_users', COUNT(*)
  FROM users u
  WHERE is_super_admin = FALSE AND tenant_id NOT IN (SELECT id FROM tenants)
  UNION ALL
  -- Check 3: Orphaned roles
  SELECT 'orphaned_roles', COUNT(*)
  FROM roles r
  WHERE tenant_id NOT IN (SELECT id FROM tenants)
  UNION ALL
  -- Check 4: Orphaned role_permissions
  SELECT 'orphaned_role_permissions', COUNT(*)
  FROM role_permissions rp
  WHERE role_id NOT IN (SELECT id FROM roles) 
     OR permission_id NOT IN (SELECT id FROM permissions)
)
SELECT check_type, violation_count, 
       CASE WHEN violation_count = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM issues
ORDER BY check_type;

-- Expected Result:
-- All rows should show violation_count = 0 and status = ✅ PASS
```

---

## 1️⃣5️⃣ Final Health Check Dashboard

```sql
-- Complete health check in one query
SELECT 
  'Tenants' as category,
  COUNT(*)::text as count,
  'active' as status
FROM tenants
UNION ALL
SELECT 'Regular Users', COUNT(*)::text, 'active'
FROM users WHERE is_super_admin = FALSE AND deleted_at IS NULL
UNION ALL
SELECT 'Super Admins', COUNT(*)::text, 'active'
FROM users WHERE is_super_admin = TRUE AND deleted_at IS NULL
UNION ALL
SELECT 'Roles', COUNT(*)::text, 'total'
FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*)::text, 'total'
FROM permissions
UNION ALL
SELECT 'User-Role Assignments', COUNT(*)::text, 'total'
FROM user_roles
UNION ALL
SELECT 'Role-Permission Mappings', COUNT(*)::text, 'total'
FROM role_permissions
ORDER BY category;

-- Expected Result:
-- Tenants | 3 | active
-- Regular Users | 9 | active
-- Super Admins | 3 | active
-- Roles | 9 | total
-- Permissions | 31 | total
-- User-Role Assignments | 7 | total
-- Role-Permission Mappings | 133+ | total
```

---

## 🆘 Troubleshooting Commands

### If RLS is blocking queries:

```sql
-- Check RLS status on RBAC tables
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('permissions', 'roles', 'user_roles', 'role_templates')
ORDER BY tablename;

-- Expected: All should show rowsecurity = true
```

### If you see "no rows" or "permission denied":

```sql
-- Verify you're authenticated as correct user
SELECT 
  current_user_id::text as current_user,
  email as user_email
FROM users 
WHERE id = auth.uid();

-- Or for super admin verification
SELECT 
  email,
  is_super_admin,
  role,
  tenant_id
FROM users 
WHERE id = auth.uid();
```

### To manually test tenant isolation:

```sql
-- As tenant admin in Acme
SELECT * FROM customers WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001';
-- Should work ✅

-- Try to query another tenant
SELECT * FROM customers WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440002';
-- Should return 0 rows (RLS policy blocks cross-tenant access) ✅
```

---

## Summary Table

| Check | Command | Expected | Status |
|-------|---------|----------|--------|
| Tenants | Query #1 | 3 rows | ✅ |
| Regular Users | Query #2 | 9 rows | ✅ |
| Super Admins | Query #3 | 3 rows (tenant_id=NULL) | ✅ |
| Constraints | Query #4 | All OK | ✅ |
| Roles | Query #5 | 9 total | ✅ |
| Assignments | Query #6 | 7 user_roles | ✅ |
| Permissions | Query #7 | 31 permissions | ✅ |
| Uniqueness | Query #8 | 0 duplicates | ✅ |
| Integrity | Query #9 | 0 orphaned | ✅ |
| Super Access | Query #10 | 3 super users mapped | ✅ |
| RLS Policies | Query #11 | All policies shown | ✅ |
| User Count | Query #12 | Expected counts | ✅ |

---

## ✅ All Verified!

If all queries return the expected results, your tenant, user, role, and permission seeded data is **properly configured and production-ready**! 🎉