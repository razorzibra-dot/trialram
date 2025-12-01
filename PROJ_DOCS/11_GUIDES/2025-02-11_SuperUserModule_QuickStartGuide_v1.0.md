# Super User Module - Quick Start Guide

**Version**: 1.0  
**Date**: February 11, 2025  
**Purpose**: Get started with Super User module administration  
**Audience**: System Administrators, Super Users

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Accessing Super Admin Features](#accessing-super-admin-features)
3. [Common Tasks](#common-tasks)
4. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before getting started, ensure:

- ✅ You are logged in with a `super_user` or `super_admin` role
- ✅ Your user account has been granted super user status
- ✅ You have access to the Super Admin section from main navigation
- ✅ VITE_API_MODE is set to `supabase` (production) or `mock` (development)

**Check Your Status:**
```bash
# Visit this page to verify your permissions
http://localhost:5173/super-admin/dashboard
```

If you get a "Permission Denied" message, contact your administrator.

---

## Accessing Super Admin Features

### Via Navigation Menu

1. Click **"Admin"** in main navigation
2. Select **"Super Admin"** from submenu
3. Choose specific feature:
   - **Dashboard**: Overview and quick stats
   - **Users**: Manage super users
   - **Tenants**: Manage all tenants
   - **Logs**: View impersonation and audit logs
   - **Analytics**: Multi-tenant metrics
   - **Configuration**: System and tenant settings
   - **Health**: System health monitoring
   - **Role Requests**: Approve/reject role requests

### Direct URL Access

```
http://localhost:5173/super-admin/                    # Main dashboard
http://localhost:5173/super-admin/users              # Super users
http://localhost:5173/super-admin/tenants            # Tenants
http://localhost:5173/super-admin/logs               # Logs
http://localhost:5173/super-admin/analytics          # Analytics
http://localhost:5173/super-admin/configuration      # Configuration
http://localhost:5173/super-admin/health             # Health
http://localhost:5173/super-admin/role-requests      # Role requests
```

---

## Common Tasks

### Task 1: Create a New Super User

**Goal**: Grant a user super admin privileges

**Steps**:

1. Go to **Super Admin → Users**
2. Click **"+ Create Super User"** button
3. In the form panel:
   - **Select User**: Choose user from dropdown (searches by name/email)
   - **Access Level**: Select one:
     - `full` - Complete access to all tenants and features
     - `limited` - Access restricted to assigned tenants
     - `read_only` - Read-only access, no modifications
     - `specific_modules` - Access to specific features only
4. Click **"Grant Access"** to confirm tenant assignment
5. Click **"Create"** button

**Result**: 
- User becomes a super user
- Access record created in database
- Action logged in audit trail

**Troubleshooting**:
- User not in dropdown? → They must exist in User Management first
- Error "Already a super user"? → User is already assigned to this tenant

---

### Task 2: Grant Tenant Access to Super User

**Goal**: Allow a super user to manage a specific tenant

**Steps**:

1. Go to **Super Admin → Users**
2. Find the super user in the table
3. Click **"Grant Access"** button or select user and click **"+"**
4. In grant access modal:
   - **Tenant**: Select from dropdown (searches by name)
   - **Access Level**: Choose level (see Task 1 for levels)
5. Click **"Grant"** button

**Multi-Tenant Access**:
- One super user can manage multiple tenants
- Each tenant has independent access level
- "Switch tenant" button on dashboard to view from tenant perspective

**Result**:
- Super user can now access this tenant
- Impersonate users in this tenant
- View metrics for this tenant

---

### Task 3: Impersonate a User

**Goal**: Login as another user to troubleshoot or test

**Steps**:

1. Go to **Super Admin → Users** or any tenant's user list
2. Find the user to impersonate
3. Click **"Impersonate"** button (or "Login As...")
4. Optional: Enter **Reason** for audit trail
   - Examples: "Troubleshooting customer issue", "Testing feature"
5. Click **"Start Impersonation"** button

**During Impersonation**:
- You see the app as that user
- All your actions are logged
- Yellow banner at top shows: "Impersonating [user name] in [tenant name]"
- Your own user ID shown in top right

**Return to Super User**:
1. Click **"End Impersonation"** button (top bar or drawer)
2. Optional: Add notes about actions taken
3. Click **"Confirm"** to close session

**Audit Trail**:
- Session logged with start/end times
- All actions during session recorded
- Reason stored for reference

---

### Task 4: View Impersonation Logs

**Goal**: Review impersonation history and audit trail

**Steps**:

1. Go to **Super Admin → Logs**
2. View **Impersonation Audit Log** table:
   - **Super User**: Who initiated the session
   - **Impersonated User**: Who was impersonated
   - **Tenant**: Which tenant context
   - **Session**: Start time, end time, duration
   - **Reason**: Why (if provided)
3. Click row to expand details:
   - Detailed timestamps
   - IP address of super user
   - Browser/user agent info
   - Actions taken during session

**Filtering**:
- **By Super User**: Click dropdown, select or search
- **By Date Range**: Click date picker, select range
- **By Status**: Active or Closed sessions
- **Search**: Free-text search in reason field

**Export**:
- Click **"Export CSV"** to download as spreadsheet
- Includes all visible columns and filters

---

### Task 5: View Tenant Metrics & Analytics

**Goal**: Monitor tenant usage and compare performance

**Steps**:

1. Go to **Super Admin → Analytics**
2. Select view mode:
   - **Overview**: Single tenant metrics
   - **Comparison**: Multiple tenants side-by-side
   - **Detailed**: Drill-down analysis

**For Overview**:
1. Select tenant from **"Select Tenant"** dropdown
2. View metric cards:
   - **Active Users**: Current active users
   - **Total Contracts**: All contracts
   - **Total Sales**: Revenue amount
   - **Total Transactions**: Transaction count
   - **Disk Usage**: Storage usage
   - **API Calls**: Daily API call count
3. Click metric card to see trend chart

**For Comparison**:
1. Click **"Add Tenant"** to select multiple tenants
2. View side-by-side comparison table
3. Sort by any column (click header)
4. Color-coded status indicators:
   - 🟢 Green: Healthy (above average)
   - 🟡 Yellow: Warning (below average)
   - 🔴 Red: Critical (significantly low)

**Time Range**:
- Click period button: 7 days, 30 days, 90 days, 1 year
- Or select custom date range

---

### Task 6: Manage Configuration Overrides

**Goal**: Apply tenant-specific settings

**Steps**:

1. Go to **Super Admin → Configuration**
2. Scroll to **Tenant Configuration Overrides** section
3. Click **"+ Add Override"** button
4. In the form:
   - **Tenant**: Select target tenant
   - **Config Key**: Choose from available keys (dropdown)
   - **Value**: Enter value (auto-validated for type)
   - **Reason**: Optional explanation
   - **Expires**: Optional expiration date
5. Click **"Save"** button

**Available Config Keys**:
- `features.advanced_analytics` (boolean)
- `features.bulk_operations` (boolean)
- `limits.api_rate` (number: requests/minute)
- `limits.storage_gb` (number: GB)
- `maintenance.enabled` (boolean)
- `maintenance.message` (string: message to display)

**View Overrides**:
1. In Configuration page, see **Tenant Config Overrides** table
2. View all active overrides for all tenants
3. See expiration countdown (if applicable)

**Update Override**:
1. Click override row
2. Click **"Edit"** button
3. Change value
4. Click **"Save"**

**Delete Override**:
1. Click override row
2. Click **"Delete"** button
3. Confirm deletion

**Temporary Overrides**:
- Set **"Expires"** date for temporary settings
- Override automatically removed on expiration date
- Useful for feature pilots, maintenance windows

---

### Task 7: Monitor System Health

**Goal**: Check system status and identify issues

**Steps**:

1. Go to **Super Admin → Health**
2. View **System Health Overview**:
   - Overall health percentage (0-100%)
   - Color indicator (green/yellow/red)
3. Check **Service Status**:
   - **Database**: Connected/Disconnected
   - **API**: Healthy/Degraded
   - **Storage**: OK/Low/Critical
4. Monitor **Performance Metrics**:
   - Average response time (ms)
   - Error rate (%)
   - Success rate (%)
5. Review **Recent Errors**:
   - Error count
   - Most common errors
   - Click to view details

**Tenant Storage**:
- View per-tenant storage usage
- Progress bar shows % of allocated space
- 🟢 Green: <70% used
- 🟡 Yellow: 70-90% used
- 🔴 Red: >90% used (approaching limit)

**System Uptime**:
- Percentage uptime over selected period
- Breakdown by service

**What to Do If Issues Found**:
- **Database disconnected**: Check database connection, restart if needed
- **High error rate**: Check application logs, review recent changes
- **Low disk space**: Archive old data or contact hosting provider

---

### Task 8: Manage Role Requests

**Goal**: Approve or reject requests for role changes

**Steps**:

1. Go to **Super Admin → Role Requests**
2. View requests table with status:
   - **Pending**: Awaiting review (blue)
   - **Approved**: Accepted (green)
   - **Rejected**: Declined (red)
3. For pending request:
   - Click row to view details in panel
   - Review requested role and reason
4. Click **"Approve"** or **"Reject"** button
5. If rejecting, enter reason in text field
6. Click **"Confirm"** button

**Bulk Actions**:
1. Select multiple requests (checkboxes)
2. Click **"Bulk Approve"** or **"Bulk Reject"** button
3. Confirm with bulk action dialog

**Filter Requests**:
- By status: Pending, Approved, Rejected
- By tenant: Select from dropdown
- By user: Search name/email
- By date: Select date range

---

## Troubleshooting

### Issue: "Permission Denied" on Super Admin pages

**Cause**: User doesn't have super_user role

**Solution**:
1. Ask administrator to grant you super_user role
2. Or contact platform admin
3. Sign out and sign back in
4. Try again

---

### Issue: Can't find user to make super user

**Cause**: User hasn't been created in system yet

**Solution**:
1. Go to **User Management** module
2. Create user first
3. Then return to Super Admin → Users
4. Create super user record for newly created user

---

### Issue: Impersonation won't start

**Cause**: Super user doesn't have access to that tenant

**Solution**:
1. Verify super user has access to tenant
   - Go to Super Admin → Users
   - Click super user
   - Check "Tenant Access" list
2. If missing, grant access first:
   - Click "Grant Access" button
   - Select target tenant
   - Choose access level
   - Click "Grant"
3. Then try impersonation again

---

### Issue: Metrics not updating

**Cause**: Metrics recorded but not visible, or data stale

**Solution**:
1. **Refresh page**: Press Ctrl+R or Cmd+R
2. **Check cache**: React Query caches metrics for 5 minutes
   - Wait 5 minutes or refresh cache
3. **Verify data**: Check that operations were performed
   - Create contracts, add users, etc.
4. **Manual record**: 
   - Go to Super Admin → Configuration
   - Manually record metric if needed

---

### Issue: Configuration override not taking effect

**Cause**: Client-side cache, override hasn't been refreshed yet

**Solution**:
1. **In affected app**: Refresh page or sign out/in
2. **Check expiration**: Verify override hasn't expired
3. **Verify value**: Go to Configuration page, check override is still there
4. **Test in new session**: Sign out, sign back in, test

---

### Issue: Audit logs show old data

**Cause**: Logs truncated or filtered, or asking for data older than retention

**Solution**:
1. **Check date range**: Verify you're looking at correct date range
2. **Clear filters**: Remove all filters to see all available logs
3. **Export CSV**: Download logs before viewing (better for large datasets)
4. **Retention**: Logs kept for 90 days; older data not available

---

## Quick Reference

### Permission Requirements

All super admin features require `super_user` or `super_admin` role:

| Feature | Role | Specific Permission |
|---------|------|-------------------|
| View Dashboard | super_user | super_user:view_dashboard |
| Manage Users | super_user | crm:platform:user:manage |
| Grant Access | super_user | crm:platform:tenant:manage |
| Impersonate | super_user | super_user:impersonate_users |
| View Logs | super_user | crm:platform:audit:view |
| Manage Config | super_user | crm:platform:config:manage |
| View Analytics | super_user | crm:platform:crm:analytics:insight:view |
| Manage Permissions | super_admin | super_user:manage_permissions |

---

### Keyboard Shortcuts

- `Esc`: Close drawers/modals
- `Ctrl+F`: Search/filter table
- `Ctrl+E`: Export table to CSV

---

### API Mode (Development)

Switch between mock and real data:

```bash
# Development with mock data
VITE_API_MODE=mock npm run dev

# Production-like with Supabase
VITE_API_MODE=supabase npm run dev
```

Data in mock mode is not persisted. For testing persistence, use `supabase` mode.

---

### Getting Help

**Documentation**:
- Module guide: `src/modules/features/super-admin/DOC.md`
- API docs: `src/modules/features/super-admin/API.md`
- This guide: `PROJ_DOCS/11_GUIDES/2025-02-11_SuperUserModule_QuickStartGuide_v1.0.md`

**Common Issues**: See Troubleshooting section above

**Report Bug**: Contact development team with:
- What you were doing
- Error message (if any)
- Steps to reproduce
- Timestamp of issue

---

## Summary

You now know how to:
- ✅ Create and manage super users
- ✅ Grant and revoke tenant access
- ✅ Impersonate users for troubleshooting
- ✅ View and filter impersonation logs
- ✅ Monitor tenant analytics and metrics
- ✅ Apply configuration overrides
- ✅ Check system health
- ✅ Manage role requests

**Next Steps**:
- Explore each feature in your environment
- Refer to detailed documentation as needed
- Report issues to development team

---

**Last Updated**: February 11, 2025  
**Version**: 1.0.0  
**Status**: Production Ready