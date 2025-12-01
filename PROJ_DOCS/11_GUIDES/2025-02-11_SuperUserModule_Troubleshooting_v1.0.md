# Super User Module - Troubleshooting Guide

**Version**: 1.0  
**Date**: February 11, 2025  
**Purpose**: Diagnose and resolve Super User module issues  
**Audience**: System Administrators, Developers

---

## Table of Contents

1. [Access & Permission Issues](#access--permission-issues)
2. [Data Consistency Issues](#data-consistency-issues)
3. [Performance Issues](#performance-issues)
4. [Impersonation Problems](#impersonation-problems)
5. [Audit Logging Issues](#audit-logging-issues)
6. [Configuration Issues](#configuration-issues)
7. [Database Issues](#database-issues)
8. [Testing & Validation](#testing--validation)

---

## Access & Permission Issues

### Problem: "Permission Denied" on Super Admin Dashboard

**Symptoms**:
- Page shows "You don't have permission to access this"
- Red error banner at top
- Redirect to home page

**Root Causes**:
1. User role not set to `super_user` or `super_admin`
2. User's role assignment not propagated
3. Authentication token expired
4. RBAC permissions not properly configured

**Diagnosis Steps**:

```typescript
// Check 1: Verify VITE_API_MODE
console.log('API Mode:', process.env.VITE_API_MODE);
// Should be 'supabase' or 'mock'

// Check 2: Verify user has super_user role
const currentUser = await userService.getCurrentUser();
console.log('User roles:', currentUser.roles);
// Should include 'super_user' or 'super_admin'

// Check 3: Verify RBAC permissions loaded
const permissions = await rbacService.getUserPermissions();
console.log('Permissions:', permissions);
// Should include 'super_user:*' permissions
```

**Solutions** (in order):

1. **First**: Sign out and sign back in
   ```bash
   # In browser developer console
   localStorage.clear();
   location.reload();
   ```

2. **Check user role** in User Management:
   - Go to User Management → Users
   - Find your user
   - Verify "super_user" role assigned
   - If missing, add role and save

3. **Verify RBAC permissions**:
   ```bash
   # Check if super_user permissions exist
   VITE_API_MODE=supabase npm run dev
   # Go to Admin → RBAC → Roles
   # Look for "Super User" or "Super Admin" role
   # If missing, contact admin
   ```

4. **Check environment variable**:
   ```bash
   # Verify .env file
   cat .env | grep VITE_API_MODE
   # Should output: VITE_API_MODE=supabase
   
   # If wrong, update .env and restart dev server
   ```

5. **Nuclear option** - Restart everything:
   ```bash
   # Stop dev server (Ctrl+C)
   # Stop Supabase (docker-compose down)
   # Start Supabase (docker-compose up -d)
   # Start dev server (npm run dev)
   # Wait 30 seconds
   # Sign out/in again
   ```

---

### Problem: Some Super Admin Features Inaccessible

**Symptoms**:
- Dashboard works but Logs page shows "Permission Denied"
- Some buttons disabled or hidden
- Specific features locked

**Root Cause**: User has partial permissions, not full super_user permissions

**Solution**:

1. **Check specific permission**:
   ```typescript
   const hasPermission = await rbacService.validatePermission(
     'crm:platform:audit:view'
   );
   console.log('Has permission:', hasPermission);
   ```

2. **Update user role to include all super_user permissions**:
   - Go to Admin → RBAC → Roles
   - Select user's role
   - Add missing permissions
   - Save

3. **Or assign full Super Admin role**:
   - Go to User Management → Users
   - Edit your user
   - Change role from "super_user" to "super_admin"
   - Save

---

### Problem: Cannot Create/Edit Super Users

**Symptoms**:
- "Grant Access" button disabled
- Form won't submit
- Error "Missing required permission"

**Root Cause**: User lacks `crm:platform:user:manage` permission

**Solution**:

```typescript
// Verify permission
const canManageUsers = await rbacService.validatePermission(
  'crm:platform:user:manage'
);
console.log('Can manage users:', canManageUsers);

// If false, user needs this permission added
```

1. Request admin to add `crm:platform:user:manage` permission
2. Or use super_admin role (includes all permissions)

---

## Data Consistency Issues

### Problem: Super User Records Not Synced With User Records

**Symptoms**:
- Super user visible in Super Admin but not in User Management
- User Management shows user but not super user status
- Deleting user in User Management doesn't delete super user record

**Root Cause**: Cascade delete not triggered or integration not working

**Diagnosis**:

```typescript
// Check if super user record exists
const superUser = await superUserService.getSuperUserByUserId('user_123');
console.log('Super user record:', superUser);

// Check if user record exists
const user = await userService.getUser('user_123');
console.log('User record:', user);

// Should both exist and be in sync
```

**Solution**:

1. **Verify database referential integrity**:
   ```sql
   -- Check if super_user_tenant_access references valid user_id
   SELECT sua.id, sua.super_user_id, u.id
   FROM super_user_tenant_access sua
   LEFT JOIN users u ON sua.super_user_id = u.id
   WHERE u.id IS NULL;
   -- Should return 0 rows (no orphaned records)
   ```

2. **For orphaned records** (user deleted but super user remains):
   ```sql
   -- Delete orphaned super user records
   DELETE FROM super_user_tenant_access
   WHERE super_user_id NOT IN (SELECT id FROM users);
   ```

3. **Verify cascade delete works**:
   ```typescript
   // Create test user
   const testUser = await userService.createUser({
     email: 'test@example.com',
     firstName: 'Test',
     lastName: 'User'
   });
   
   // Make super user
   const superUser = await superUserService.createSuperUser({
     superUserId: testUser.id,
     tenantId: 'tenant_001',
     accessLevel: 'full'
   });
   
   // Delete user
   await userService.deleteUser(testUser.id);
   
   // Verify super user also deleted
   const stillExists = await superUserService.getSuperUserByUserId(testUser.id);
   console.log('Super user still exists:', stillExists !== null); // Should be false
   ```

---

### Problem: Metrics Not Recording

**Symptoms**:
- Metrics stay at old values
- New records created but not visible
- Analytics page shows outdated data

**Root Cause**: Metrics not being recorded, or cache not invalidated

**Diagnosis**:

```typescript
// Check if metrics recorded
const metrics = await superUserService.getTenantStatistics('tenant_001');
console.log('Metrics:', metrics);
console.log('Recorded at:', metrics.map(m => m.recordedAt));

// Check if recent records exist (within last hour)
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const recent = metrics.filter(m => new Date(m.recordedAt) > oneHourAgo);
console.log('Recent metrics count:', recent.length);
```

**Solution**:

1. **Manually record a metric**:
   ```typescript
   const recorded = await superUserService.recordTenantMetric(
     'tenant_001',
     'active_users',
     42
   );
   console.log('Recorded:', recorded);
   ```

2. **Clear React Query cache**:
   ```typescript
   // In component or browser console
   queryClient.invalidateQueries({ 
     queryKey: ['tenantStatistics'] 
   });
   ```

3. **Refresh page** to clear all caches:
   ```bash
   # Browser refresh
   Ctrl+R or Cmd+R
   ```

4. **Check database directly**:
   ```sql
   -- View tenant statistics
   SELECT * FROM tenant_statistics
   WHERE tenant_id = 'tenant_001'
   ORDER BY recorded_at DESC
   LIMIT 10;
   ```

---

### Problem: Configuration Overrides Not Applied

**Symptoms**:
- Create override but value not used by app
- Update override but old value persists
- Delete override but setting still active

**Root Cause**: Override created but not read by application, or client-side cache

**Diagnosis**:

```typescript
// Check if override exists
const overrides = await superUserService.getConfigOverrides('tenant_001');
console.log('Overrides:', overrides);

// Check if expired
const now = new Date();
const active = overrides.filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
console.log('Active overrides:', active);
```

**Solution**:

1. **Verify override created**:
   - Go to Super Admin → Configuration
   - Check "Tenant Configuration Overrides" table
   - Override should be visible with your values

2. **For client app to read override**:
   - Restart the app (sign out/in)
   - Or do full page refresh (Ctrl+R)
   - Check if app reads from config service

3. **Check if overrides actually used in code**:
   ```typescript
   // Find where config is read
   const config = await configService.getTenantConfig('tenant_001');
   
   // Should include override values
   console.log('Config:', config);
   ```

4. **Verify not expired**:
   ```sql
   -- Check override expiration
   SELECT id, config_key, config_value, expires_at
   FROM tenant_config_overrides
   WHERE tenant_id = 'tenant_001'
   AND (expires_at IS NULL OR expires_at > NOW());
   ```

---

## Performance Issues

### Problem: Dashboard Loads Slowly

**Symptoms**:
- Dashboard takes >3 seconds to load
- Spinner spinning for long time
- Browser tab becomes unresponsive

**Root Cause**: 
- Large amount of data being fetched
- Unoptimized queries
- Slow network
- Too many concurrent requests

**Diagnosis**:

```typescript
// Check network tab in browser DevTools
// 1. Open DevTools (F12)
// 2. Go to Network tab
// 3. Refresh page
// 4. Look for slow requests (red or yellow)
// 5. Click request to see:
//    - Size: Should be <100KB
//    - Duration: Should be <1s
//    - Status: Should be 200

// Also check Console tab for errors
```

**Solutions**:

1. **Check network speed**:
   ```bash
   # Use browser Network tab to identify slow endpoints
   # Look for requests > 1 second
   # Record network waterfall
   ```

2. **Optimize queries** (if developer):
   ```typescript
   // Instead of fetching all data
   const allData = await service.getAllData();
   
   // Use pagination
   const page1 = await service.getData({ limit: 10, offset: 0 });
   ```

3. **Increase cache time**:
   ```typescript
   // Modify hook to cache longer (e.g., 30 minutes instead of 5)
   const { data } = useQuery({
     queryKey: ['dashboardData'],
     queryFn: fetchData,
     staleTime: 1000 * 60 * 30  // 30 minutes
   });
   ```

4. **Use lazy loading** for heavy components:
   - Load only visible data first
   - Load other data on demand

5. **Check Supabase connection**:
   ```bash
   # Test database connection speed
   VITE_API_MODE=supabase npm run dev
   # Open DevTools → Network tab
   # Monitor for slow queries
   ```

---

### Problem: Analytics Page Very Slow with Multiple Tenants

**Symptoms**:
- Multi-tenant comparison hangs
- Takes >10 seconds to load
- Browser becomes unresponsive

**Root Cause**: Fetching all metrics for all tenants at once

**Solution**:

1. **Load fewer tenants at once**:
   ```typescript
   // Instead of comparing 100 tenants
   // Compare top 10 by size
   const topTenants = tenants
     .sort((a, b) => b.userCount - a.userCount)
     .slice(0, 10);
   ```

2. **Use date range filtering**:
   ```typescript
   // Instead of all metrics ever
   // Get last 30 days
   const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
   const metrics = await getMetrics({ startDate });
   ```

3. **Paginate results**:
   ```typescript
   // Load 10 metrics at a time
   const firstPage = await getMetrics({ limit: 10, offset: 0 });
   ```

---

## Impersonation Problems

### Problem: Cannot Start Impersonation

**Symptoms**:
- "Start Impersonation" button disabled
- Error "No access to this tenant"
- No users appear in dropdown

**Root Cause**: 
- Super user not assigned to tenant
- User doesn't belong to tenant
- Missing permission

**Diagnosis**:

```typescript
// Check 1: Super user has tenant access
const access = await superUserService.getTenantAccess('su_123');
console.log('Super user tenant access:', access);
// Should include target tenant

// Check 2: User exists in tenant
const users = await userService.getUsersByTenant('tenant_001');
console.log('Users in tenant:', users);
// Should include target user

// Check 3: Have permission
const canImpersonate = await rbacService.validatePermission(
  'super_user:impersonate_users'
);
console.log('Can impersonate:', canImpersonate);
```

**Solution**:

1. **Grant super user access to tenant first**:
   - Go to Super Admin → Users
   - Click super user (yourself)
   - Click "Grant Access"
   - Select target tenant
   - Choose access level
   - Click "Grant"

2. **Verify user exists in tenant**:
   - Go to Customers → Users (or appropriate module)
   - Search for user
   - If not found, create user in that tenant first

3. **Verify permission**:
   ```bash
   # Go to Admin → RBAC → Roles
   # Click your role
   # Verify 'super_user:impersonate_users' permission
   ```

---

### Problem: Impersonation Session Ended Unexpectedly

**Symptoms**:
- Yellow banner disappeared
- Logged out of impersonated user
- See message "Session ended"
- Lost work

**Root Cause**:
- Session timeout (default: 1 hour)
- Browser tab inactive for too long
- Token expired
- Server error

**Solutions**:

1. **For timeout** (>1 hour):
   - Expected behavior
   - End impersonation properly before timeout
   - Plan impersonation sessions within timeout window

2. **For inactive tab**:
   - Keep browser tab active
   - Use impersonation session more quickly
   - Avoid leaving session idle

3. **For unexpected logout**:
   - Check browser console for errors
   - Reload page
   - Start impersonation again
   - Report if persistent

**Prevent data loss**:
- Always end impersonation explicitly (don't just close tab)
- Actions recorded regardless of how session ends
- But better to end properly for audit trail

---

### Problem: Impersonation Not Logged

**Symptoms**:
- Session ended but not in audit logs
- No entry in Super Admin → Logs
- "Session started" event missing

**Root Cause**: Audit logging not triggered, or logs not fetched yet

**Diagnosis**:

```typescript
// Check if log exists
const logs = await superUserService.getImpersonationLogs({
  superUserId: 'su_123'
});
console.log('Impersonation logs:', logs);

// Check database directly
SELECT * FROM super_user_impersonation_logs
ORDER BY login_at DESC
LIMIT 10;
```

**Solution**:

1. **Refresh logs page** (cache delay):
   - Go to Super Admin → Logs
   - Scroll to top and click "Refresh"
   - Or Ctrl+R to refresh page

2. **Check date range** (wrong filter):
   - Logs page shows date range
   - Verify range includes when session occurred
   - Expand date range if needed

3. **Search for user**:
   - Use "Super User" filter
   - Search your name
   - Filter to recent dates

4. **If still not found**:
   - Check database directly (see above)
   - If in database but not visible, clear React Query cache
   - If not in database, impersonation session wasn't completed properly

---

## Audit Logging Issues

### Problem: Audit Logs Missing Actions

**Symptoms**:
- Created super user but not in audit log
- Granted access but no log entry
- Made changes but not recorded

**Root Cause**: Audit logging disabled, or logs not visible yet

**Diagnosis**:

```typescript
// Check if audit service is logging
const recentLogs = await auditService.getLogs({
  startDate: new Date(Date.now() - 60 * 1000),  // Last 60 seconds
  userId: currentUserId
});
console.log('Recent logs:', recentLogs);
```

**Solution**:

1. **Check cache** (React Query stale data):
   ```typescript
   // Invalidate cache and refetch
   queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
   ```

2. **Refresh logs page**:
   - Click "Refresh" button
   - Or Ctrl+R full page refresh

3. **Check date range filters**:
   - Remove all date filters
   - Verify you're looking at correct dates
   - Expand to broader range

4. **Verify audit service configured**:
   ```bash
   # Check if audit tables exist
   VITE_API_MODE=supabase npm run dev
   # Open Supabase Dashboard
   # Check if audit_logs table exists
   ```

---

### Problem: Audit Logs Show Wrong User

**Symptoms**:
- Action shows different super user than who performed it
- "Created by" shows wrong name
- Audit trail doesn't match reality

**Root Cause**: 
- Context not properly set
- User ID stored incorrectly
- Session confusion

**Solution**:

1. **Verify current user context**:
   ```typescript
   const currentUser = await authService.getCurrentUser();
   console.log('Current user ID:', currentUser.id);
   // Verify this is who you are
   ```

2. **Check if multi-tenant context set**:
   ```typescript
   const tenantContext = getCurrentTenantContext();
   console.log('Current tenant:', tenantContext);
   // Verify correct tenant
   ```

3. **Verify service factory routing**:
   ```typescript
   console.log('API mode:', process.env.VITE_API_MODE);
   // Should be 'supabase' for accurate audit
   // (mock mode doesn't persist)
   ```

---

## Configuration Issues

### Problem: Configuration Changes Not Persisted

**Symptoms**:
- Create override, refresh, it's gone
- Update value but old value returns
- Delete config but it reappears

**Root Cause**: Using mock mode (data not persisted), or cache not cleared

**Diagnosis**:

```typescript
// Check API mode
console.log('API mode:', process.env.VITE_API_MODE);
// If 'mock', data won't persist across refreshes

// Check if data in Supabase
VITE_API_MODE=supabase npm run dev
// Refresh page
// If now visible, you were in mock mode
```

**Solution**:

1. **Use Supabase mode** for persistence:
   ```bash
   # Verify .env
   cat .env | grep VITE_API_MODE
   # Should be 'supabase'
   
   # If not, update .env and restart
   VITE_API_MODE=supabase
   npm run dev
   ```

2. **Clear React Query cache** after changes:
   ```typescript
   queryClient.invalidateQueries({ 
     queryKey: ['tenantConfig'] 
   });
   ```

3. **Verify in database**:
   ```sql
   -- Check configuration override exists
   SELECT * FROM tenant_config_overrides
   WHERE tenant_id = 'tenant_001'
   ORDER BY created_at DESC;
   ```

---

### Problem: Configuration Override Expired Automatically

**Symptoms**:
- Override set with "Expires" date
- Date passed but override still active
- Or expired before expected date

**Root Cause**: 
- Client not checking expiration
- Expiration date in past
- Timezone confusion

**Solution**:

1. **Check expiration date was set correctly**:
   - Go to Super Admin → Configuration
   - Look for override
   - Check "Expires" column
   - Date should be in future

2. **If expired but still active** (cache issue):
   - Restart application
   - Clear browser cache (Ctrl+Shift+R)
   - Sign out/in

3. **If expiration date wrong**:
   - Delete override
   - Create new one with correct date
   - Verify date is in future
   - Check system timezone

4. **Database check**:
   ```sql
   -- Check expires_at
   SELECT id, config_key, expires_at, (expires_at < NOW()) as is_expired
   FROM tenant_config_overrides
   WHERE tenant_id = 'tenant_001';
   ```

---

## Database Issues

### Problem: Database Connection Errors

**Symptoms**:
- "Cannot connect to database"
- Pages show loading spinner forever
- Network errors in console

**Root Cause**: 
- Supabase not running
- Credentials wrong
- Network issue

**Diagnosis**:

```bash
# Check if Supabase running
docker-compose ps

# Check Supabase logs
docker-compose logs supabase

# Test connection
curl http://localhost:54321/health
```

**Solution**:

1. **Start Supabase**:
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   # Wait 30 seconds for initialization
   ```

2. **Verify credentials** in `.env`:
   ```
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

3. **Restart dev server**:
   ```bash
   # Stop: Ctrl+C
   # Start: npm run dev
   ```

4. **Test Supabase Studio**:
   ```bash
   # Open in browser
   http://localhost:54323
   # Login with default credentials
   # Check database tables exist
   ```

---

### Problem: Missing Database Tables/Migration

**Symptoms**:
- Error "Table not found"
- Super user features not working
- 500 errors on API calls

**Root Cause**: Database migration not applied

**Solution**:

1. **Apply migration**:
   ```bash
   supabase db push
   ```

2. **Verify tables created**:
   ```bash
   # Go to Supabase Studio
   http://localhost:54323
   # Navigate to SQL Editor
   # Run:
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name LIKE 'super_user%';
   ```

3. **Apply seed data** (if needed):
   ```bash
   supabase db reset
   # or manually run seed script
   ```

---

## Testing & Validation

### Complete Super User Module Test Checklist

```typescript
// 1. Create super user
const superUser = await superUserService.createSuperUser({
  superUserId: 'test_user_001',
  tenantId: 'test_tenant_001',
  accessLevel: 'full'
});
console.assert(superUser.id, 'Super user created');

// 2. Grant tenant access
const access = await superUserService.grantTenantAccess({
  superUserId: superUser.id,
  tenantId: 'test_tenant_002',
  accessLevel: 'limited'
});
console.assert(access.id, 'Access granted');

// 3. Verify access listed
const accesses = await superUserService.getTenantAccess(superUser.id);
console.assert(accesses.length >= 2, 'Both accesses visible');

// 4. Start impersonation
const session = await superUserService.startImpersonation({
  superUserId: superUser.id,
  impersonatedUserId: 'test_user_002',
  tenantId: 'test_tenant_001',
  reason: 'Testing'
});
console.assert(session.id, 'Session started');

// 5. Record metric
const metric = await superUserService.recordTenantMetric(
  'test_tenant_001',
  'active_users',
  42
);
console.assert(metric.id, 'Metric recorded');

// 6. End impersonation
const closed = await superUserService.endImpersonation(session.id);
console.assert(closed.logoutAt, 'Session ended');

// 7. Get audit logs
const logs = await superUserService.getImpersonationLogs({
  superUserId: superUser.id
});
console.assert(logs.length > 0, 'Session in audit logs');

console.log('✅ All tests passed!');
```

---

## Getting Help

**Before Contacting Support**:

1. Check this guide for your issue
2. Check browser console for errors (F12)
3. Check network tab for failed requests
4. Try refreshing/signing out and in
5. Try with different browser

**Collect Diagnostic Information**:

```typescript
// Save this info before contacting support
{
  apiMode: process.env.VITE_API_MODE,
  userRole: currentUser.role,
  tenantContext: currentTenantContext,
  browserInfo: navigator.userAgent,
  timestamp: new Date().toISOString(),
  errorMessage: errorFromConsole,
  steps: [
    'Step 1: What you clicked/did',
    'Step 2: What happened',
    'Step 3: Expected vs actual'
  ]
}
```

**Report Issue With**:
- Detailed steps to reproduce
- Exact error message
- Screenshot of error
- API mode (mock or supabase)
- Your user role
- Affected tenant(s)

---

**Last Updated**: February 11, 2025  
**Version**: 1.0.0  
**Status**: Production Ready