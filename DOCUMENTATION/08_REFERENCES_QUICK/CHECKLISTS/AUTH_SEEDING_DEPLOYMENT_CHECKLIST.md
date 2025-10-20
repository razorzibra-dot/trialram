# ✅ Auth Seeding Deployment Checklist

## 📋 Pre-Deployment

- [ ] Supabase CLI installed: `supabase --version`
- [ ] Node.js installed: `node --version`
- [ ] Project dependencies installed: `npm install`
- [ ] `.env` file exists and configured
- [ ] Git working directory clean: `git status`

---

## 🚀 Deployment Steps

### Phase 1: Preparation

- [ ] Stop current dev server (if running)
- [ ] Backup existing database:
  ```bash
  supabase db pull  # Pull schema from local DB
  git status         # Check for schema changes
  ```
- [ ] Verify environment variables:
  ```bash
  grep "VITE_SUPABASE" .env
  ```

### Phase 2: Supabase Setup

- [ ] Start Supabase:
  ```bash
  supabase start
  ```
- [ ] Verify connection:
  ```bash
  supabase status
  ```
  Should show all services running (green ✅)

### Phase 3: Auth User Creation

**Option A: Windows PowerShell (Recommended)**
```powershell
.\scripts\setup-auth-seeding.ps1
```
- [ ] Script validates prerequisites
- [ ] Creates auth users
- [ ] Generates seed SQL
- [ ] Resets database
- [ ] Displays test users

**Option B: Manual Commands**
- [ ] Create auth users:
  ```bash
  npm run seed:auth
  ```
  Check output for ✅ confirmations

- [ ] Verify config created:
  ```bash
  ls -la auth-users-config.json
  ```
  Should show ~2KB file

- [ ] Generate SQL:
  ```bash
  npm run seed:sql
  ```
  Should create `supabase/seed-users.sql`

- [ ] Verify seed SQL created:
  ```bash
  ls -la supabase/seed-users.sql
  ```

- [ ] Reset database:
  ```bash
  supabase db reset
  ```
  Watch for success message

**Option C: All-in-One**
```bash
npm run seed:all
```
- [ ] Wait for all 3 steps to complete
- [ ] Check for error messages

### Phase 4: Verification

#### Database Content

- [ ] Check tenants created:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM tenants;" 
  # Should return: 3
  ```

- [ ] Check users created:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM users;"
  # Should return: 7
  ```

- [ ] Check user-auth mapping:
  ```bash
  supabase db execute "SELECT email, tenant_id FROM users ORDER BY email;"
  # Should show 7 users with correct tenant IDs
  ```

- [ ] Check roles created:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM roles;"
  # Should return: 7
  ```

- [ ] Check permissions:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM permissions;"
  # Should return: 34
  ```

- [ ] Check role-permission mappings:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM role_permissions;"
  # Should return: 150+
  ```

#### Auth Users

- [ ] Test auth user 1:
  ```bash
  curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@acme.com","password":"password123"}'
  ```
  Should return: `access_token` and `refresh_token`

- [ ] Test auth user 2:
  ```bash
  curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@techsolutions.com","password":"password123"}'
  ```
  Should return: `access_token` and `refresh_token`

#### Config Files

- [ ] `auth-users-config.json` exists:
  ```bash
  cat auth-users-config.json | jq '.users | length'
  # Should return: 7
  ```

- [ ] Config has valid user IDs:
  ```bash
  cat auth-users-config.json | jq '.users[] | .userId' 
  # Should show 7 UUIDs
  ```

### Phase 5: Application Testing

- [ ] Start dev server:
  ```bash
  npm run dev
  ```
  Should start without errors

- [ ] Open browser to localhost:5173

- [ ] Test login with admin@acme.com:
  - [ ] Email field accepts input
  - [ ] Password field accepts input
  - [ ] Login button works
  - [ ] No console errors

- [ ] After login:
  - [ ] Redirects to dashboard
  - [ ] User name displayed
  - [ ] Tenant name shown
  - [ ] Permissions loaded (check console logs)

- [ ] Test navigation:
  - [ ] Can access Customers module
  - [ ] Can access Sales module
  - [ ] Can access Tickets module
  - [ ] Can access Contracts module
  - [ ] Can access Service Contracts (admin only)
  - [ ] Can access Product Sales (admin only)

- [ ] Test tenant isolation:
  - [ ] Login with admin@acme.com
  - [ ] Can see Acme corporation data
  - [ ] Cannot see Tech Solutions data
  - [ ] Cannot see Global Trading data
  - [ ] Logout

- [ ] Test other tenant:
  - [ ] Login with admin@techsolutions.com
  - [ ] Can see Tech Solutions data only
  - [ ] Cannot see Acme data
  - [ ] Cannot see Global Trading data

- [ ] Test role-based access:
  - [ ] Login with manager@acme.com
  - [ ] Should have operational permissions
  - [ ] Should NOT have admin features
  - [ ] Logout

- [ ] Test agent role:
  - [ ] Login with user@acme.com
  - [ ] Should have customer service permissions
  - [ ] Should have limited access
  - [ ] Logout

### Phase 6: Performance Testing

- [ ] Check permission load time:
  - [ ] Open browser DevTools (F12)
  - [ ] Go to Network tab
  - [ ] Clear logs
  - [ ] Reload page with user logged in
  - [ ] Permission check should complete < 100ms

- [ ] Check cache effectiveness:
  - [ ] Open browser console
  - [ ] Look for cache hit logs
  - [ ] Second navigation should be faster (< 5ms)

- [ ] Check database performance:
  - [ ] Monitor Supabase for slow queries
  - [ ] Should see minimal DB queries due to caching

### Phase 7: Security Testing

- [ ] RLS policies enabled:
  ```bash
  supabase db execute "SELECT * FROM pg_policies WHERE tablename = 'users';"
  # Should show policies
  ```

- [ ] Tenant isolation enforced:
  - [ ] Admin from Acme cannot access Tech Solutions data
  - [ ] Verify via database:
    ```bash
    supabase db execute "SELECT * FROM users WHERE tenant_id != 'acme-id';"
    # Should return empty for Acme user
    ```

- [ ] Audit logging working:
  ```bash
  supabase db execute "SELECT COUNT(*) FROM audit_logs;"
  # Should have entries from login/access
  ```

- [ ] Password not exposed:
  - [ ] Check localStorage: `localStorage.getItem('crm_auth_token')`
  - [ ] Should NOT contain password
  - [ ] Should contain JWT token

### Phase 8: Documentation

- [ ] Auth seeding guide reviewed:
  - [ ] Read `AUTH_SEEDING_SETUP_GUIDE.md`
  - [ ] Understand flow and architecture

- [ ] Quick reference available:
  - [ ] Bookmark `AUTH_SEEDING_QUICK_REFERENCE.md`
  - [ ] Know basic commands

- [ ] Implementation guide reviewed:
  - [ ] Understand how to add new users
  - [ ] Know troubleshooting steps

---

## 🔍 Post-Deployment Verification

### Data Integrity

```bash
# All checks should return expected counts:
supabase db execute "
SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM roles) as roles,
  (SELECT COUNT(*) FROM permissions) as permissions,
  (SELECT COUNT(*) FROM role_permissions) as role_permissions,
  (SELECT COUNT(*) FROM user_roles) as user_roles;
"
```

Expected results:
```
 tenants | users | roles | permissions | role_permissions | user_roles
---------+-------+-------+-------------+------------------+----------
       3 |     7 |     7 |          34 |              150 |          7
```

### User Access Matrix

```bash
# Verify admin permissions:
supabase db execute "
SELECT 
  u.email, 
  u.role, 
  COUNT(p.name) as permission_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.tenant_id = (SELECT id FROM tenants WHERE name = 'Acme Corporation')
GROUP BY u.email, u.role
ORDER BY permission_count DESC;
"
```

Expected: Admin has ~34 permissions, Manager ~20, Agent ~9, Engineer ~8

---

## 🆘 Rollback Procedure

If issues occur:

### Quick Rollback
```bash
# 1. Stop dev server
Ctrl+C

# 2. Stop Supabase
supabase stop

# 3. Start fresh
supabase start
npm run seed:all
npm run dev
```

### Complete Rollback
```bash
# 1. Restore from backup (if available)
git checkout -- supabase/

# 2. Reset to previous working state
supabase db reset --ignore-retention-policy

# 3. Re-run setup
npm run seed:all
```

### Partial Issues

| Issue | Rollback |
|-------|----------|
| Just users wrong | `npm run seed:sql && npm run seed:db` |
| Auth users issue | Delete and `npm run seed:auth` |
| Database corrupted | `supabase db reset` |
| Complete failure | `supabase stop && supabase start && npm run seed:all` |

---

## ✅ Success Criteria

All of the following must be true:

- ✅ 7 auth users created in Supabase Auth
- ✅ 7 database users created with matching auth IDs
- ✅ 3 tenants properly configured
- ✅ 34 permissions loaded from database
- ✅ 7 roles with permission mappings
- ✅ All test users can login successfully
- ✅ Tenant isolation verified working
- ✅ RBAC permissions enforced
- ✅ RLS policies enabled and active
- ✅ Audit logs recording access
- ✅ Dev server starts without errors
- ✅ Application runs without console errors
- ✅ Performance acceptable (< 100ms for DB queries)

---

## 📊 Sign-Off

| Item | Status | Date | Notes |
|------|--------|------|-------|
| Pre-deployment checks | ⬜ | ___ | |
| Deployment execution | ⬜ | ___ | |
| Verification complete | ⬜ | ___ | |
| Performance acceptable | ⬜ | ___ | |
| Security validation | ⬜ | ___ | |
| Documentation reviewed | ⬜ | ___ | |
| Team sign-off | ⬜ | ___ | |
| Go-live approved | ⬜ | ___ | |

---

## 📞 Troubleshooting Quick Links

- Missing env vars? → See `AUTH_SEEDING_SETUP_GUIDE.md` > Troubleshooting
- User ID mismatch? → Check `auth-users-config.json` vs database
- Login fails? → Test auth endpoint with curl
- Permissions not loading? → Check console logs and database permissions
- Tenant isolation broken? → Verify RLS policies and tenant_id

---

## 🎉 Completion

Once all checkmarks are complete:

✅ **Auth seeding is fully operational**

You can now:
- Add new users via `seed-auth-users.ts`
- Modify permissions via database
- Monitor access via audit logs
- Scale to additional tenants
- Deploy to production

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Verified By**: _____________  

---

**Next Phase**: Monitor performance and prepare for production deployment

**Related Docs**:
- `AUTH_SEEDING_SETUP_GUIDE.md`
- `AUTH_SEEDING_QUICK_REFERENCE.md`
- `RBAC_IMPLEMENTATION_COMPREHENSIVE.md`
- `RBAC_DEPLOYMENT_CHECKLIST.md`