# 🚀 Super Admin Services - Developer Quick Reference

**Last Updated**: 2025-02-12  
**Cleanup Status**: ✅ Complete  
**API Modes**: Mock ✅ | Supabase ✅

---

## 📌 Quick Navigation

| Need | File | Purpose |
|------|------|---------|
| **Problem Details** | `SUPER_ADMIN_DASHBOARD_ERROR_FIX.md` | Dashboard error explanation & fix |
| **Services Overview** | `SUPER_ADMIN_SERVICES_INVENTORY.md` | All active services reference |
| **Cleanup Details** | `SUPER_ADMIN_CLEANUP_COMPLETE.md` | What was removed & why |
| **Visual Summary** | `SUPER_ADMIN_CLEANUP_VISUAL_SUMMARY.txt` | At-a-glance diagram |
| **Archived Files** | `MARK_FOR_DELETE/deprecated_super_user_services/` | Backups of deleted files |

---

## 🎯 When to Use Each Service

### Super Admin Management Service
**For**: Fetching and managing super admin user objects

```typescript
// ✅ CORRECT - Use the hook
import { useSuperAdminList } from '@/modules/features/super-admin/hooks';
const { superUsers, isLoading, error } = useSuperAdminList();

// Component: SuperAdminDashboard, SuperUserList
// Data: User objects with email, name, status, createdAt
```

### Super User Service  
**For**: Managing tenant access relationships (which super admin has access to which tenant)

```typescript
// ✅ CORRECT - Use the hook
import { useSuperUserManagement } from '@/modules/features/super-admin/hooks';
const { userTenantAccess, grantAccess, revokeAccess } = useSuperUserManagement();

// Components: Analytics, Users, Logs pages
// Data: Access relationships, impersonation logs, tenant stats
```

---

## 🪝 Hook Quick Reference

### Dashboard/List Operations
```typescript
// Get all super admins (with error handling)
import { useSuperAdminList } from '@/modules/features/super-admin/hooks';
const { superUsers, isLoading, error, isEmpty } = useSuperAdminList();
```

### Single Super Admin
```typescript
// Get one super admin by ID
import { useSuperAdmin } from '@/modules/features/super-admin/hooks';
const { data: superAdmin, isLoading, error } = useSuperAdmin(userId);
```

### Statistics
```typescript
// Get super admin stats
import { useSuperAdminStats } from '@/modules/features/super-admin/hooks';
const { data: stats, isLoading } = useSuperAdminStats();
```

### Delete/Demote Action
```typescript
// Mutation hook for demoting a super admin
import { useDemoteSuperAdmin } from '@/modules/features/super-admin/hooks';
const { mutate: demote, isPending } = useDemoteSuperAdmin();

// Usage
demote(superAdminId, {
  onSuccess: () => console.log('Demoted!'),
  onError: (err) => console.error(err),
});
```

### Tenant Access (Different Service!)
```typescript
// For tenant access relationships
import { useSuperUserManagement } from '@/modules/features/super-admin/hooks';
const { 
  userTenantAccess,    // Array of access records
  grantAccess,         // Mutation to grant access
  revokeAccess,        // Mutation to revoke access
} = useSuperUserManagement(superAdminId);
```

---

## 🔧 Service Factory Usage

### Direct Service Access (Last Resort)
```typescript
// Only use if hooks don't fit your use case!
import { superAdminManagementService } from '@/services/serviceFactory';

// All methods work in both mock and supabase modes
const allAdmins = await superAdminManagementService.getAllSuperAdmins();
const admin = await superAdminManagementService.getSuperAdminById(id);
const stats = await superAdminManagementService.getSuperAdminStats();
```

### Testing
```typescript
// Mock data available in mock service
import { mockSuperAdminManagementService } from '@/services/superAdminManagementService';

// Mock super admin: admin@platform.com
const mockAdmins = await mockSuperAdminManagementService.getAllSuperAdmins();
```

---

## 💾 Data Types

### SuperAdminDTO (User Objects)
```typescript
interface SuperAdminDTO {
  id: string;                    // UUID
  email: string;                 // email@example.com
  firstName?: string;            // John
  lastName?: string;             // Doe
  name?: string;                 // John Doe (computed or stored)
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  role?: string;                 // 'super_admin'
  tenantId?: string;             // Tenant they belong to
}
```

### SuperUserTenantAccessType (Access Relationships)
```typescript
interface SuperUserTenantAccessType {
  id: string;                    // UUID
  userId: string;                // Super admin's user ID
  tenantId: string;              // Tenant they access
  accessLevel: string;           // 'read', 'write', 'admin'
  grantedAt: string;             // When access was granted
  grantedBy?: string;            // Who granted it
}
```

---

## ❌ Common Mistakes to Avoid

### ❌ Wrong Service for Wrong Purpose
```typescript
// WRONG - Dashboard trying to use tenant access service
import { useSuperUserManagement } from '@/modules/features/super-admin/hooks';
const { userTenantAccess } = useSuperUserManagement();
// This doesn't have superUsers! Returns access relationships instead

// CORRECT - Use the right hook
import { useSuperAdminList } from '@/modules/features/super-admin/hooks';
const { superUsers } = useSuperAdminList();  // Has the data you need
```

### ❌ Direct Backend Imports
```typescript
// WRONG - Bypasses factory and fails in certain API modes
import { mockSuperAdminManagementService } from '@/services/superAdminManagementService';
const admins = await mockSuperAdminManagementService.getAllSuperAdmins();

// CORRECT - Uses factory routing
import { superAdminManagementService } from '@/services/serviceFactory';
const admins = await superAdminManagementService.getAllSuperAdmins();
```

### ❌ Mixing Services
```typescript
// WRONG - Can't use tenant access mutations on user data
const { grantAccess } = useSuperUserManagement();  // Access management
const { superUsers } = useSuperAdminList();         // User objects
grantAccess(superUsers[0].id);                      // Wrong data structure!

// CORRECT - Use service methods that match the data
const { userTenantAccess } = useSuperUserManagement(superAdminId);
const { grantAccess } = useSuperUserManagement();
grantAccess({ userId: superAdminId, tenantId, accessLevel });
```

---

## 🧪 Quick Testing

### Test Dashboard
```bash
# 1. Start dev server
npm run dev

# 2. Set mock mode (default)
VITE_API_MODE=mock npm run dev

# 3. Navigate to /super-admin/dashboard
# Should show: Super Users Overview with list of admins
# Should NOT show: "Error loading super users"
```

### Test Both API Modes
```bash
# Test mock mode
VITE_API_MODE=mock npm run build && npm run preview

# Test supabase mode  
VITE_API_MODE=supabase npm run build && npm run preview
```

### Check for Import Errors
```bash
# Run linter
npm run lint

# Should show: No import warnings about super user services
```

---

## 📋 Cleanup Changes Summary

### ✅ Added
- `useSuperAdminList()` hook ⭐ NEW
- `superAdminManagementService` service
- Proper type separation (SuperAdminDTO vs relationships)

### ⚠️ Modified
- `SuperAdminDashboardPage` - Now uses correct hook
- `SuperUserList` - Updated to use `useSuperAdminList`
- `superUserService` - Factory-routed, still works for access management

### 🗑️ Deleted (Archived)
- `src/services/superUserService.ts` (old mock)
- `src/services/api/supabase/superUserService.ts` (old supabase)
- `src/modules/features/super-admin/services/superUserService.ts` (module wrapper)

**Backups**: `MARK_FOR_DELETE/deprecated_super_user_services/`

---

## 🚨 Troubleshooting

### "Cannot find module 'useSuperUserManagement'"
```
❌ You're trying to use the old hook in a new component
✅ Use: useSuperAdminList() instead
```

### "Error loading super users" on dashboard
```
❌ Component is using wrong hook
✅ Use: useSuperAdminList() (returns { superUsers, isLoading, error })
   NOT: useSuperUserManagement() (returns access relationships)
```

### "Unauthorized" errors in console
```
❌ Check: Is VITE_API_MODE set correctly?
✅ Mock mode: VITE_API_MODE=mock
✅ Supabase mode: VITE_API_MODE=supabase

❌ Check: Service factory exports correct service
✅ Verify: src/services/serviceFactory.ts
```

### Import warnings after cleanup
```
❌ Some file still imports old services
✅ Search: superUserService (old mock/supabase version)
✅ Update: Use factory imports instead
```

---

## 📞 Support

**Question**: Which service should I use?
- **For super admin users**: `superAdminManagementService` via `useSuperAdminList()` hook
- **For tenant access**: `superUserService` via `useSuperUserManagement()` hook

**Question**: How do I add a new super admin feature?
1. Check if `useSuperAdminList()` provides the data you need
2. If yes, use that hook
3. If no, add method to `superAdminManagementService`
4. Update service factory exports
5. Create new hook if needed

**Question**: Are old files permanently deleted?
- No! Backups exist in `MARK_FOR_DELETE/deprecated_super_user_services/`
- Easy to restore if needed
- But not needed - all functionality replaced

---

## ✨ Key Files to Know

```
src/
├── services/
│   ├── superAdminManagementService.ts          ✅ NEW
│   ├── api/supabase/superAdminManagementService.ts  ✅ NEW
│   ├── serviceFactory.ts                       ✅ UPDATED
│   └── superUserService.ts                     ✅ STILL HERE (tenant access)
│
└── modules/features/super-admin/
    ├── hooks/
    │   ├── useSuperAdminManagement.ts          ✅ NEW
    │   └── useSuperUserManagement.ts           ✅ STILL HERE
    ├── views/
    │   ├── SuperAdminDashboardPage.tsx         ✅ UPDATED
    │   ├── SuperAdminAnalyticsPage.tsx         ✅ NO CHANGE
    │   ├── SuperAdminUsersPage.tsx             ✅ NO CHANGE
    │   └── SuperAdminLogsPage.tsx              ✅ NO CHANGE
    └── components/
        └── SuperUserList.tsx                   ✅ UPDATED

MARK_FOR_DELETE/
└── deprecated_super_user_services/
    ├── CLEANUP_REPORT.md
    ├── superUserService.ts.backup
    ├── supabase_superUserService.ts.backup
    └── module_superUserService.ts.backup
```

---

## 🎉 You're All Set!

The super admin dashboard should now be working perfectly. The "Error loading super users" message should be gone, and all components should be using the correct services. 

Happy coding! 🚀