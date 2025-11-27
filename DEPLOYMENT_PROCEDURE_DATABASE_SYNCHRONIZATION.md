# Database Script Synchronization - Deployment Procedure

## 🚨 CRITICAL DEPLOYMENT ORDER

### Required Execution Sequence:
1. **Run ALL migrations in timestamp order** (including `20251122000002`)
2. **THEN run seed.sql**

### Why This Order Matters:
- Migration `20251122000002_update_permissions_to_resource_action_format.sql` converts legacy permission names (`manage_users`) to granular format (`users:read`, `users:create`, etc.)
- Seed.sql contains legacy permission names that the migration will convert
- Running seed.sql BEFORE the migration will cause conflicts and failures

### Migration Files to Execute (in order):
```
20250101000001_init_tenants_and_users.sql
20250101000002_master_data_companies_products.sql
...
20251122000001_add_audit_logs_rls_policies.sql
20251122000002_update_permissions_to_resource_action_format.sql  ⬅️ CRITICAL
```

### Post-Migration Files:
```
supabase/seed.sql  ⬅️ Run AFTER migration 20251122000002
```

## ✅ Verification Steps:

### 1. Check Permission Format
```sql
SELECT name, resource, action 
FROM permissions 
WHERE name LIKE '%:%' 
ORDER BY name;
```
Expected: Permissions in `{resource}:{action}` format (e.g., `users:read`, `customers:create`)

### 2. Verify Role Permissions
```sql
SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY r.name;
```
Expected: All roles should have appropriate permission counts

### 3. Test User Authentication
```sql
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email;
```
Expected: All test users should be properly assigned to roles

## 🛠️ Rollback Procedure:
If issues occur during deployment:

1. **Stop all database operations**
2. **Restore from backup** (if available)
3. **Re-run the migration sequence**
4. **Contact database team** for assistance

## 📋 Checklist:
- [ ] All migrations executed in timestamp order
- [ ] Migration `20251122000002` completed successfully
- [ ] Seed.sql executed after migrations
- [ ] Permission format verification passed
- [ ] Role permissions verification passed
- [ ] User authentication test passed
- [ ] No constraint violations or errors

---
*Last Updated: 2025-11-22 21:34:00 UTC*
*Critical: Migration 20251122000002 MUST run before seed.sql*