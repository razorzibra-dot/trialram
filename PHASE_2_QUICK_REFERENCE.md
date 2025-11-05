# PHASE 2: SUPER ADMIN MANAGEMENT - QUICK REFERENCE GUIDE

**Version**: 1.0  
**Date**: 2025-02-15  
**Status**: Production Ready ✅

---

## 🚀 5-MINUTE QUICK START

### Import the Service
```typescript
// In any component, service, or module:
import { superAdminManagementService } from '@/services';
```

### Basic Operations

**Check if user is super admin:**
```typescript
const isSuperAdmin = await superAdminManagementService.isSuperAdmin(userId);
```

**Create new super admin:**
```typescript
const superAdmin = await superAdminManagementService.createSuperAdmin({
  email: 'admin@example.com',
  name: 'Admin Name',
  firstName: 'Admin',
  lastName: 'Name',
  status: 'active'
});
```

**Promote regular user to super admin:**
```typescript
const promoted = await superAdminManagementService.promoteSuperAdmin({
  userId: 'user-123'
});
```

**Get all super admins:**
```typescript
const allSuperAdmins = await superAdminManagementService.getAllSuperAdmins();
```

---

## 📋 COMPLETE API REFERENCE

### Service Methods (12 Total)

#### Create & Lifecycle

**`createSuperAdmin(input: CreateSuperAdminInput): Promise<SuperAdminDTO>`**
- Creates new super admin user
- Automatically sets: `tenantId=null`, `isSuperAdmin=true`, `role='super_admin'`
- Returns: New super admin user object

**`promoteSuperAdmin(input: PromoteSuperAdminInput): Promise<SuperAdminDTO>`**
- Promotes existing user to super admin
- Sets: `tenantId=null`, `isSuperAdmin=true`, `role='super_admin'`
- Returns: Promoted user as super admin

**`demoteSuperAdmin(userId: string): Promise<UserDTO>`**
- Demotes super admin to regular user
- Sets: `isSuperAdmin=false`, `role` based on existing role
- Returns: Demoted user object

#### Query & Validation

**`getSuperAdmin(superAdminId: string): Promise<SuperAdminDTO>`**
- Gets single super admin by ID
- Returns: Super admin object with `tenantId=null` and `isSuperAdmin=true`

**`getAllSuperAdmins(): Promise<SuperAdminDTO[]>`**
- Gets all platform super admins
- Returns: Array of super admin objects

**`isSuperAdmin(userId: string): Promise<boolean>`**
- Checks if user is super admin
- Returns: true if super admin, false otherwise

#### Tenant Access Management

**`grantTenantAccess(input: GrantTenantAccessInput): Promise<SuperAdminTenantAccess>`**
```typescript
// Input:
{
  superAdminId: string;
  tenantId: string;
  accessLevel: 'admin' | 'viewer' | 'editor';
}
```
- Grants super admin access to specific tenant
- Returns: Access record

**`revokeTenantAccess(input: RevokeTenantAccessInput): Promise<void>`**
```typescript
// Input:
{
  superAdminId: string;
  tenantId: string;
}
```
- Revokes super admin access from tenant
- Returns: void

**`getSuperAdminTenantAccess(superAdminId: string): Promise<SuperAdminTenantAccess[]>`**
- Gets all tenant accesses for super admin
- Returns: Array of access records

**`getAllTenantAccesses(): Promise<SuperAdminTenantAccess[]>`**
- Gets all super admin tenant accesses (all super admins)
- Returns: Array of all access records

#### Analytics

**`getSuperAdminStats(): Promise<SuperAdminStatsDTO>`**
- Gets statistics about super admins
- Returns: Stats object with count, dates, etc.

**`getActionLogs(filters?: LogFilters): Promise<SuperAdminActionLog[]>`**
- Gets audit logs of super admin actions
- Returns: Array of action log entries

---

## 🏗️ ARCHITECTURE

### Multi-Backend Support
```
Your Code
    ↓
superAdminManagementService (Service Factory)
    ↓
    ├─ VITE_API_MODE=mock      → Mock Service (In-Memory)
    ├─ VITE_API_MODE=supabase  → Supabase Service (PostgreSQL)
    └─ VITE_API_MODE=real      → Real API (Future)
```

### Environment Configuration
```bash
# .env file - choose one:
VITE_API_MODE=mock       # For development
VITE_API_MODE=supabase   # For production with PostgreSQL
```

---

## 🔐 KEY CONSTRAINTS

### Super Admin Identity
A user is a super admin if and only if:
- ✅ `isSuperAdmin === true` (boolean flag)
- ✅ `tenantId === null` (no tenant scope)
- ✅ `role === 'super_admin'` (special role)

### Regular Admin Identity
A regular admin must have:
- ✅ `isSuperAdmin === false`
- ✅ `tenantId !== null` (assigned to specific tenant)
- ✅ `role !== 'super_admin'`

### Type Safety
Invalid combinations are prevented by TypeScript:
```typescript
// ✅ VALID - Super admin
const superAdmin: SuperAdminDTO = {
  isSuperAdmin: true,
  tenantId: null,
  role: 'super_admin'
};

// ❌ INVALID - Regular user with null tenant
const invalidUser: UserDTO = {
  isSuperAdmin: false,
  tenantId: null,  // ❌ ERROR: Must have tenantId for regular users
};
```

---

## 💾 DATABASE SCHEMA (Supabase)

### users table
```sql
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Super admin users have:
-- is_super_admin = true
-- tenant_id = NULL
-- role = 'super_admin'
```

### user_tenant_accesses table
```sql
CREATE TABLE user_tenant_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  access_level VARCHAR(50) NOT NULL,  -- 'admin', 'viewer', 'editor'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### audit_logs table
```sql
ALTER TABLE audit_logs ALTER COLUMN tenant_id DROP NOT NULL;

-- Super admin actions have:
-- tenant_id = NULL (platform-wide)
-- Regular admin actions have:
-- tenant_id = specific tenant ID
```

---

## 🎯 COMMON USE CASES

### Use Case 1: Check Admin Level in Component
```typescript
import { superAdminManagementService } from '@/services';

export function AdminPanel({ userId }: { userId: string }) {
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    superAdminManagementService.isSuperAdmin(userId)
      .then(setIsSuper);
  }, [userId]);

  return (
    <div>
      {isSuper ? (
        <p>Platform-wide super admin</p>
      ) : (
        <p>Tenant-scoped admin</p>
      )}
    </div>
  );
}
```

### Use Case 2: Promote User to Super Admin
```typescript
async function promoteToSuper(userId: string) {
  try {
    const promoted = await superAdminManagementService.promoteSuperAdmin({
      userId
    });
    console.log('Promoted:', promoted);
  } catch (error) {
    console.error('Failed to promote:', error);
  }
}
```

### Use Case 3: Grant Tenant Access
```typescript
async function grantAccess(superAdminId: string, tenantId: string) {
  try {
    const access = await superAdminManagementService.grantTenantAccess({
      superAdminId,
      tenantId,
      accessLevel: 'admin'
    });
    console.log('Access granted:', access);
  } catch (error) {
    console.error('Failed to grant access:', error);
  }
}
```

### Use Case 4: Get Audit Trail
```typescript
async function viewAuditLogs() {
  try {
    const logs = await superAdminManagementService.getActionLogs({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      limit: 100
    });
    console.log('Recent actions:', logs);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
  }
}
```

---

## 📊 TYPE DEFINITIONS

### SuperAdminDTO
```typescript
interface SuperAdminDTO extends UserDTO {
  isSuperAdmin: true;      // Must be true
  tenantId: null;          // Must be null
  role: 'super_admin';     // Must be 'super_admin'
  // All other UserDTO fields...
}
```

### CreateSuperAdminInput
```typescript
interface CreateSuperAdminInput {
  email: string;           // Required
  name: string;            // Required
  firstName?: string;      // Optional
  lastName?: string;       // Optional
  status?: UserStatus;     // Optional, defaults to 'active'
  avatarUrl?: string;      // Optional
  phone?: string;          // Optional
  mobile?: string;         // Optional
}
```

### SuperAdminTenantAccess
```typescript
interface SuperAdminTenantAccess {
  id: string;
  superAdminId: string;
  tenantId: string;
  accessLevel: 'admin' | 'viewer' | 'editor';
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

---

## ⚠️ COMMON PITFALLS

### ❌ DON'T: Import services directly
```typescript
// ❌ WRONG - Breaks multi-backend support
import { mockSuperAdminManagementService } from '@/services/superAdminManagementService';

// ✅ RIGHT - Use the factory
import { superAdminManagementService } from '@/services';
```

### ❌ DON'T: Manually set tenant_id to null
```typescript
// ❌ WRONG - Breaks type system
const user: UserDTO = {
  tenantId: null,
  isSuperAdmin: false  // ❌ Contradiction!
};

// ✅ RIGHT - Use proper types
const superAdmin: SuperAdminDTO = {
  tenantId: null,
  isSuperAdmin: true   // ✅ Consistent
};
```

### ❌ DON'T: Forget to handle errors
```typescript
// ❌ WRONG - No error handling
const result = await superAdminManagementService.createSuperAdmin(input);

// ✅ RIGHT - Proper error handling
try {
  const result = await superAdminManagementService.createSuperAdmin(input);
} catch (error) {
  console.error('Failed:', error);
  // Show user-friendly error message
}
```

### ❌ DON'T: Mix tenant modes
```typescript
// ❌ WRONG - Allows regular user to have null tenant
if (!user.tenantId) {
  user.role = 'admin';  // ❌ Missing isSuperAdmin check
}

// ✅ RIGHT - Check full super admin constraints
if (user.tenantId === null && user.isSuperAdmin) {
  // This is a super admin
}
```

---

## 🐛 DEBUGGING TIPS

### Check Environment Mode
```typescript
// Know which backend is active:
const mode = process.env.VITE_API_MODE;
console.log('Using backend:', mode); // 'mock' or 'supabase'
```

### Enable Debug Logging
```typescript
// In browser console:
localStorage.setItem('DEBUG_SUPER_ADMIN', 'true');
// Then reload page

// In code:
if (localStorage.getItem('DEBUG_SUPER_ADMIN')) {
  console.log('Super admin action:', {
    userId,
    isSuperAdmin,
    tenantId
  });
}
```

### Test Mock Service Locally
```typescript
// In browser console:
import { superAdminManagementService } from '@/services';

// Test get all
const all = await superAdminManagementService.getAllSuperAdmins();
console.log(all);

// Test create
const newOne = await superAdminManagementService.createSuperAdmin({
  email: 'test@example.com',
  name: 'Test'
});
console.log(newOne);
```

---

## 📚 RELATED DOCUMENTATION

- **[PHASE_2_COMPLETION_VERIFICATION.md](./PHASE_2_COMPLETION_VERIFICATION.md)** - Detailed verification checklist
- **[RBAC_COMPLETION_INDEX.md](./RBAC_COMPLETION_INDEX.md)** - Overall RBAC progress tracking
- **[RBAC_PENDING_TASKS_CHECKLIST.md](./RBAC_PENDING_TASKS_CHECKLIST.md)** - Task checklist

---

## ✅ QUICK CHECKLIST

Before using Phase 2 features:
- [ ] Updated `.env` with `VITE_API_MODE=mock` or `VITE_API_MODE=supabase`
- [ ] For Supabase mode: Database migrations applied
- [ ] Supabase client configured in `src/lib/supabase.ts`
- [ ] Service imports using factory: `import { superAdminManagementService } from '@/services'`
- [ ] Type imports for TypeScript support: `import { SuperAdminDTO } from '@/modules/features/super-admin/types'`
- [ ] Error handling implemented for async operations

---

## 🆘 TROUBLESHOOTING

### Issue: "Service not found"
**Solution**: Ensure you're importing from `@/services`:
```typescript
import { superAdminManagementService } from '@/services';
```

### Issue: "tenantId is not null but isSuperAdmin is false"
**Solution**: This violates constraints. Check data integrity:
```typescript
// ✅ CORRECT: Either super admin with null tenant
{ isSuperAdmin: true, tenantId: null }
// OR regular user with assigned tenant
{ isSuperAdmin: false, tenantId: 'tenant-123' }
```

### Issue: "Email already exists"
**Solution**: Check existing users before creating:
```typescript
const existing = await superAdminManagementService.getAllSuperAdmins();
const emailExists = existing.some(s => s.email === email);
```

### Issue: "Cannot connect to database"
**Solution**: Verify Supabase configuration:
```typescript
// Check in src/lib/supabase.ts
// Ensure Supabase URL and key are set correctly
```

---

**Last Updated**: 2025-02-15  
**Status**: Production Ready ✅  
**Questions?**: See PHASE_2_COMPLETION_VERIFICATION.md for detailed information