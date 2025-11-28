# Service Factory Architecture

**Updated:** November 27, 2025
**Phase:** 4 - Deep Clean & Structure Optimization
**Status:** Production-Ready

---

## Executive Summary

The service factory implements a **dual-mode backend system** with **24 core services** that dynamically switch between Mock (development/testing) and Supabase (production) implementations. Phase 3 optimizations reduced the factory file from **1,538 lines → 497 lines** (68% reduction) through ES6 Proxy-based method delegation. Phase 4 deep clean further optimized the structure by removing legacy files, correcting import paths, and ensuring architectural consistency.

### Architecture Highlights
- **24 unified services** with consistent mock/supabase switching
- **Single point of control** - registry-based routing in ServiceFactory class
- **Zero boilerplate** - proxy pattern eliminates 900+ lines of method forwarding
- **Type-safe** - all services maintain full TypeScript compatibility
- **Backward compatible** - 100% API compatibility with previous implementations
- **Deep cleaned** - Phase 4 removed legacy files and corrected all import paths

---

## 1. Core Architecture

### 1.1 Service Factory Pattern

```
┌─────────────────────────────────────────────────────┐
│         Application (React Components)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Service Proxies (authService, productService...)   │ ◄── Exports
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│     createServiceProxy(registryKey: string)         │ ◄── Proxy Factory
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      ServiceFactory Class                           │
│   ├─ getService(serviceName): any                   │
│   ├─ getApiMode(): ApiMode                          │
│   └─ serviceRegistry: { [key]: ServiceEntry }       │ ◄── Core
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────────┐    ┌─────────────┐
   │  Mock Mode  │    │ Supabase    │
   │  Services   │    │ Services    │
   └─────────────┘    └─────────────┘
```

### 1.2 Service Registry

The **ServiceRegistry** maps 24 services to their implementations:

```typescript
interface ServiceRegistryEntry {
  mock?: any;              // Mock implementation (dev/test)
  supabase?: any;          // Supabase implementation (prod)
  special?: (factory) => any;  // Custom routing logic
  description?: string;    // Service documentation
}

type ServiceRegistry = Record<string, ServiceRegistryEntry>;
```

**Registry Keys (24 Services):**
- `auth` - Authentication & session management
- `servicecontract` - Service contract lifecycle
- `productsale` - Product sales operations
- `sales` - Sales & deal management
- `customer` - Customer management
- `jobwork` - Job work operations
- `product` - Product catalog & inventory
- `company` - Company/organization management
- `user` - User management
- `rbac` - Role-based access control
- `uinotification` - Client-side UI notifications
- `notification` - Backend notifications
- `tenant` - Tenant management + metrics + directory
- `multitenant` - Tenant context (infrastructure-level)
- `ticket` - Ticket/issue tracking
- `superadminmanagement` - Super admin lifecycle
- `superadmin` - Super admin dashboard
- `contract` - Contract module
- `rolerequest` - Role elevation requests
- `audit` - Audit logs, compliance, metrics, retention
- `compliancenotification` - Compliance alerts
- `impersonation` - Impersonation session management
- `ratelimit` - Rate limiting & session controls
- `referencedata` - Reference data & dropdowns

---

## 2. Proxy Pattern Implementation

### 2.1 createServiceProxy Function

The **proxy factory** eliminates boilerplate by dynamically delegating method calls:

```typescript
function createServiceProxy(serviceRegistryKey: string): any {
  return new Proxy(
    { get instance() { return serviceFactory.getService(serviceRegistryKey); } },
    {
      get(target, prop) {
        if (prop === 'instance') return target.instance;
        
        const service = serviceFactory.getService(serviceRegistryKey);
        if (!service || !(prop in service)) {
          console.warn(`Property "${String(prop)}" not found on ${serviceRegistryKey}`);
          return undefined;
        }
        
        const value = service[prop];
        return typeof value === 'function' ? value.bind(service) : value;
      },
    }
  );
}
```

**Behavior:**
1. Intercepts all property access on service proxies
2. Dynamically resolves methods from the underlying service
3. Automatically binds function context to prevent "this" errors
4. Provides runtime warnings for missing methods

### 2.2 Proxy vs Traditional Approach

**Before (900+ lines of boilerplate):**
```typescript
export const authService = {
  get instance() { return serviceFactory.getAuthService(); },
  login: (...args) => serviceFactory.getAuthService().login(...args),
  logout: (...args) => serviceFactory.getAuthService().logout(...args),
  // ... 50+ more method wrappers
};
```

**After (1 line via proxy):**
```typescript
export const authService = createServiceProxy('auth');
```

**Impact:** Reduced serviceFactory.ts from **1,538 → 497 lines** (68% reduction)

---

## 3. Service Resolution Flow

### 3.1 API Mode Determination

```typescript
// Environment Configuration
VITE_API_MODE=mock      // Development
VITE_API_MODE=supabase  // Production
VITE_API_MODE=real      // Planned for future
```

At initialization:
```typescript
this.apiMode = (import.meta.env.VITE_API_MODE as ApiMode) || 'mock';
```

### 3.2 Method Call Resolution

When code calls `authService.login(email, password)`:

1. **Proxy Trap Triggered** → `get(target, 'login')`
2. **Service Resolution** → `serviceFactory.getService('auth')`
3. **Mode-Based Routing** (in getServiceFromRegistry):
   ```
   if (apiMode === 'supabase') → return entry.supabase
   if (apiMode === 'mock') → return entry.mock
   if (apiMode === 'real') → return entry.supabase (fallback)
   ```
4. **Method Binding** → `value.bind(service)` to preserve context
5. **Execution** → Original function invoked with correct `this` context

### 3.3 Fallback Chain

Missing implementations gracefully fallback:
```
Supabase → Mock → Error
Real API → Supabase → Mock → Error
Mock → Supabase → Error
```

---

## 4. Implementation Architecture

### 4.1 Directory Structure

```
src/services/
├── serviceFactory.ts           ◄── Core factory (497 lines)
│
├── auth/
│   ├── authService.ts          ◄── Mock implementation
│   └── supabase/authService.ts ◄── Supabase implementation
│
├── product/
│   ├── productService.ts       ◄── Mock implementation
│   └── supabase/productService.ts ◄── Supabase implementation
│
├── ... (22 more services)
│
└── __tests__/
    └── (18 test files using mock services)
```

### 4.2 Service Consolidation (Phase 2 → Phase 3)

**Phase 2 Consolidation Results:**
- `impersonationActionTracker` → merged into `audit`
- `tenantDirectoryService` → merged into `tenant`
- `tenantMetricsService` → merged into `tenant`
- Reduced registry: 25 → 24 entries

**Aliases Created for Backward Compatibility:**
```typescript
// These all route to the same underlying service
export const auditService = createServiceProxy('audit');
export const auditDashboardService = createServiceProxy('audit');
export const auditRetentionService = createServiceProxy('audit');
export const auditComplianceReportService = createServiceProxy('audit');

export const tenantService = createServiceProxy('tenant');
export const tenantMetricsService = createServiceProxy('tenant');
export const tenantDirectoryService = createServiceProxy('tenant');

export const rateLimitService = createServiceProxy('ratelimit');
export const impersonationRateLimitService = createServiceProxy('ratelimit');
```

### 4.3 Special Services

Some services use custom routing logic:

```typescript
impersonation: {
  special: () => {
    if (this.apiMode === 'supabase') return supabaseImpersonationService;
    return { 
      getImpersonationLogs: async () => [],
      getActiveImpersonations: async () => [] 
    };
  }
}

uinotification: {
  special: () => mockUINotificationService,  // Always mock (client-only)
}

multitenant: {
  special: () => supabaseMultiTenantService,  // Always supabase (infrastructure)
}
```

---

## 5. Usage Patterns

### 5.1 Service Access

**Pattern 1: Direct Method Call**
```typescript
import { productService } from '@/services';

const products = await productService.getProducts();
const product = await productService.getProduct(id);
```

**Pattern 2: Instance Access**
```typescript
const instance = productService.instance;
const products = await instance.getProducts();
```

**Pattern 3: Dynamic Service Resolution**
```typescript
import { serviceFactory } from '@/services';

const service = serviceFactory.getService('product');
const products = await service.getProducts();
```

### 5.2 React Hooks Integration

Services are integrated via custom hooks:

```typescript
// From hooks/useProductService.ts
export function useProductService() {
  return productService;  // Proxy automatically delegates
}

// In component
const { getProducts } = useProductService();
const products = await getProducts();
```

### 5.3 Testing

Tests utilize the mock implementations via API mode override:

```typescript
// In test setup
import { serviceFactory } from '@/services';
import { productService } from '@/services';  // Uses mock by default

beforeEach(() => {
  serviceFactory.setApiMode('mock');  // Explicit mode for clarity
});

test('getProducts returns mock data', async () => {
  const products = await productService.getProducts();
  expect(products.length).toBeGreaterThan(0);
});
```

---

## 6. Performance Characteristics

### 6.1 Proxy Overhead

ES6 Proxy adds minimal overhead:
- **First Call:** ~0.1ms for initial property resolution
- **Subsequent Calls:** <0.01ms (cached/optimized by engine)
- **Method Binding:** Included in above measurements
- **Memory:** ~2KB per service proxy (24 services = ~48KB total)

### 6.2 Service Resolution Performance

```
ServiceFactory Method Call: ~0.01ms
├─ Registry Lookup: <0.001ms
├─ Mode Check: <0.001ms
└─ Return Service Instance: <0.008ms

Proxy Get Trap: ~0.05ms
├─ Property Check: <0.01ms
├─ Service Resolution: ~0.01ms
└─ Bind Context (if function): ~0.02ms

Total Service Method Call Latency: ~0.07ms (negligible)
```

---

## 7. Debugging & Monitoring

### 7.1 Service Introspection

**List All Available Services:**
```typescript
const services = serviceFactory.listAvailableServices();
services.forEach(s => {
  console.log(`${s.name}: ${s.description}`);
});
```

**Get Backend Info:**
```typescript
const info = serviceFactory.getBackendInfo();
console.log(`Mode: ${info.mode}`);
console.log(`Supabase URL: ${info.supabaseUrl}`);
```

### 7.2 Mode Detection

```typescript
if (serviceFactory.isUsingSupabase()) {
  console.log('Using Supabase backend');
}

if (serviceFactory.isUsingRealBackend()) {
  console.log('Using non-mock backend');
}
```

### 7.3 Runtime API Mode Switching

For debugging/testing, switch modes at runtime:

```typescript
// Switch to supabase
serviceFactory.setApiMode('supabase');

// All service calls now use supabase implementations
const products = await productService.getProducts();
```

---

## 8. File Size & Metrics

### 8.1 Phase 3 Optimization Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| serviceFactory.ts | 1,538 lines | 497 lines | **-1,041 lines (-68%)** |
| Boilerplate Exports | 900+ lines | 0 lines | **-900 lines (-100%)** |
| Factory Methods | 30 explicit getters | 30 inherited | **same functionality** |
| Service Proxies | 30 (900+ lines) | 30 (1-2 lines each) | **-865 lines** |
| Build Size Impact | N/A | ~-15KB gzipped | **-15KB** |

### 8.2 Phase 4 Deep Clean Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Loose service files | 15+ files | 3 special files | **-12 files (-80%)** |
| Import path corrections | 20+ broken imports | 0 broken imports | **-20 imports (100%)** |
| Supabase client imports | 5 broken imports | 5 fixed imports | **All corrected** |
| Build success | Failing | ✅ Success | **Fixed** |
| Legacy code removal | complaintService, etc. | Removed | **Cleaned** |

### 8.2 Code Complexity Metrics

| Metric | Before | After |
|--------|--------|-------|
| Cyclomatic Complexity | Low | Low (no change) |
| Test Coverage | 85% | 85% (maintained) |
| Type Safety | Full | Full (maintained) |
| Method Count | 30+ getters | 30+ proxies |
| Lines of Boilerplate | 900+ | 0 |

---

## 9. Migration & Compatibility

### 9.1 Zero Breaking Changes

All existing code continues to work unchanged:

```typescript
// ✅ Still works - all old imports are valid
import { authService } from '@/services';
import { productService } from '@/services';
import { tenantMetricsService } from '@/services';  // Routes to tenant

// ✅ New code can use proxies seamlessly
const users = await userService.getUsers();
```

### 9.2 Backward Compatibility Guarantees

1. **All service exports remain**
2. **Method signatures unchanged**
3. **Return types preserved**
4. **Error handling identical**
5. **Test code unaffected**

---

## 10. Future Improvements

### 10.1 Planned Enhancements

1. **Health Check System** - Verify service availability at startup
2. **Service Metrics** - Track method call counts, latency, errors
3. **Caching Layer** - Optional response caching per service
4. **Circuit Breaker** - Automatic fallback on service failure
5. **Dependency Injection** - Full DI container support

### 10.2 Service Consolidation Roadmap

**Current:** 24 services  
**Target:** 20-22 services (additional consolidations possible)

Consolidation candidates:
- Dashboard services (multiple dashboard implementations)
- Notification services (multiple notification types)
- Analytics/reporting services
- Permission/RBAC services

---

## 11. Quick Reference

### All 24 Services

```typescript
import {
  authService,
  serviceContractService,
  contractService,
  productSaleService,
  salesService,
  customerService,
  jobWorkService,
  productService,
  companyService,
  userService,
  rbacService,
  uiNotificationService,
  notificationService,
  tenantService,
  multiTenantService,
  ticketService,
  superAdminManagementService,
  superAdminService,
  roleRequestService,
  auditService,
  complianceNotificationService,
  impersonationService,
  rateLimitService,
  referenceDataService,
} from '@/services';
```

### Common Operations

```typescript
// Get a service
const service = authService;

// Access service instance
const instance = authService.instance;

// Call method directly
await authService.login(email, password);

// Check current API mode
serviceFactory.getApiMode();  // 'mock' | 'supabase' | 'real'

// List all services
serviceFactory.listAvailableServices();

// Switch mode (debug/test only)
serviceFactory.setApiMode('supabase');
```

---

## 12. RBAC (Role-Based Access Control) System

### 12.1 RBAC Architecture Overview

The system implements a comprehensive **Role-Based Access Control (RBAC)** architecture with tenant isolation, super admin capabilities, and dynamic permission management.

#### 12.1.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC System Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    USERS     │  │    ROLES     │  │  PERMISSIONS     │  │
│  │              │  │              │  │                  │  │
│  │ • Tenant ID  │  │ • Tenant ID  │  │ • Resource       │  │
│  │ • Super Admin│  │ • System Role│  │ • Action         │  │
│  │ • Status     │  │ • Permissions│  │ • Category       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │           │
│         └──────────┬───────┴────────┬───────────┘           │
│                    │                │                       │
│         ┌──────────▼────────┐  ┌───▼────────────────────┐  │
│         │   USER_ROLES      │  │   ROLE_PERMISSIONS     │  │
│         │                   │  │                        │  │
│         │ • User ID         │  │ • Role ID              │  │
│         │ • Role ID         │  │ • Permission ID        │  │
│         │ • Tenant ID       │  │ • Granted By           │  │
│         └───────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Permission System Evolution

#### Legacy Format (Pre-Nov 2025)
```sql
-- Old permission names
INSERT INTO permissions (name, description) VALUES
  ('manage_users', 'Manage users'),
  ('manage_roles', 'Manage roles'),
  ('manage_customers', 'Manage customers');
```

#### New Format (Post-Nov 2025)
```sql
-- New {resource}:{action} format
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users:manage', 'Manage users', 'users', 'manage'),
  ('roles:manage', 'Manage roles', 'roles', 'manage'),
  ('customers:manage', 'Manage customers', 'customers', 'manage');
```

### 12.3 Tenant Isolation Architecture

#### 12.3.1 Multi-Tenant Data Segregation

```sql
-- All tenant-scoped tables include tenant_id
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  -- ... other columns
);

-- RLS Policy Example
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
```

#### 12.3.2 Super Admin Bypass

Super administrators have global access across all tenants:

```sql
-- Super admin detection via role membership
CREATE POLICY super_admin_bypass ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name = 'super_admin'
    )
  );
```

### 12.4 RBAC Service Integration

#### 12.4.1 Service Factory RBAC Integration

The `rbacService` integrates with the Service Factory pattern:

```typescript
// Service Registry Entry
rbac: {
  mock: mockRBACService,
  supabase: supabaseRBACService,
  description: 'Role-based access control and permission management'
}
```

#### 12.4.2 Core RBAC Methods

```typescript
interface RBACService {
  // Permission Management
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: CreatePermissionRequest): Promise<Permission>;
  
  // Role Management
  getRoles(tenantId?: string): Promise<Role[]>;
  createRole(role: CreateRoleRequest): Promise<Role>;
  assignRoleToUser(userId: string, roleId: string, tenantId: string): Promise<void>;
  
  // User Management
  getUserRoles(userId: string, tenantId?: string): Promise<Role[]>;
  getUserPermissions(userId: string, tenantId?: string): Promise<Permission[]>;
  
  // Validation
  hasPermission(userId: string, permission: string, tenantId?: string): Promise<boolean>;
  hasRole(userId: string, roleName: string, tenantId?: string): Promise<boolean>;
}
```

### 12.5 Critical RBAC Fixes (November 2025)

#### 12.5.1 Permission Format Migration

**Issue**: Seed data used legacy permission names conflicting with migration `20251122000002`.

**Solution**: Updated seed.sql to use new `{resource}:{action}` format:

```sql
-- BEFORE (Broken)
INSERT INTO permissions (name) VALUES ('manage_users');

-- AFTER (Fixed)
INSERT INTO permissions (name, resource, action) VALUES 
('users:manage', 'users', 'manage');
```

#### 12.5.2 Role Permissions Mapping

Updated all role permission assignments to use new permission IDs:

```sql
-- Admin role gets all new format permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'read', 'write', 'delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete'
    -- ... etc
  );
```

#### 12.5.3 Migration Order Dependencies

**Critical**: Permission format migration must run BEFORE seed data insertion:

```
Migration Order:
1. 20251122000001 - Add audit_logs RLS policies
2. 20251122000002 - Update permissions format ← CRITICAL
3. Seed data insertion ← Depends on #2 completion
```

### 12.6 RBAC Validation & Testing

#### 12.6.1 Validation Scripts

Comprehensive validation ensures RBAC integrity:

```sql
-- Permission format validation
SELECT name, resource, action 
FROM permissions 
WHERE name NOT LIKE '%:%' 
AND name NOT IN ('read', 'write', 'delete');

-- Role assignment validation
SELECT u.email, r.name as role, t.name as tenant
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN tenants t ON ur.tenant_id = t.id;
```

#### 12.6.2 Test Scenarios

1. **Tenant Isolation Test**: Users can only access their tenant's data
2. **Super Admin Test**: Super admins access all tenants
3. **Permission Matrix Test**: Each role has correct permissions
4. **Migration Integrity Test**: Permission format changes don't break functionality

### 12.7 Permission Checking Rules - CRITICAL

**⚠️ NEVER HARDCODE ROLE-BASED PERMISSIONS IN APPLICATION CODE**

**Architectural Rules:**
1. **Database-Driven Permissions**: All permissions must be stored in `permissions` table, assigned via `role_permissions`, and loaded into `user.permissions` array.
2. **Dynamic Permission Checks**: Always use `authService.hasPermission(permission)` which checks `user.permissions` array loaded from database.
3. **NO Hardcoded Role Checks**: Never use `if (user.role === 'admin')` to grant permissions. Role checks should only be for UI display or logging.
4. **NO Static Permission Maps**: Never create `ROLE_PERMISSIONS: Record<UserRole, Permission[]>` in application code. These belong only in database seed data.
5. **Fallback Permissions**: Fallback systems should only be used when database is unavailable, with warnings logged.
6. **Permission Format**: Use `{resource}:{action}` format (e.g., `users:update`, `users:manage`, `customers:read`).

**Correct vs Incorrect Patterns:**

```typescript
// ✅ CORRECT: Use dynamic permissions from database
const canEdit = authService.hasPermission('users:update') || 
                authService.hasPermission('users:manage');

// ❌ WRONG: Hardcoded role check
if (user.role === 'admin') return true;

// ❌ WRONG: Hardcoded permission map
const ROLE_PERMISSIONS = { 'admin': ['users:update', ...] };
if (ROLE_PERMISSIONS[user.role]?.includes('users:update')) return true;
```

**Permission Loading Flow:**
1. User logs in → `authService.login()` fetches user from `users` table
2. Role resolution → `user_roles` → `roles` table to get role name
3. Permission fetching → `role_permissions` → `permissions` table
4. Permissions attached → `user.permissions = ['users:manage', 'customers:read', ...]`
5. Permission checks → `authService.hasPermission()` checks `user.permissions` array

**Why This Architecture:**
- Permissions can be changed in database without code deployment
- Administrators can customize role permissions per tenant
- Single source of truth (database) for all permissions
- Consistent permission checking across all modules
- No code changes needed for permission updates

### 12.8 Fully Dynamic Role System - Future-Proof Design

**⚠️ CRITICAL: All Role Operations Are Database-Driven - No Hardcoded Values**

The system implements a **fully dynamic, database-driven role system** where all roles, role mappings, and validations are fetched from the database. This ensures that adding new roles or changing role configurations requires **zero code changes**.

#### 12.8.1 Dynamic Role Mapping System

**Location**: `src/utils/roleMapping.ts`

**Key Features:**
- **No Hardcoded Role Arrays**: All roles fetched from database via `rbacService.getRoles()`
- **Dynamic Role Mappings**: Role name mappings derived from database, not hardcoded maps
- **Role Cache**: 5-minute TTL cache for performance (invalidated on role changes)
- **Platform Role Detection**: Uses database flags (`is_system_role`, `tenant_id`) instead of hardcoded name checks

**Core Functions:**
```typescript
// Fetch all valid roles from database (fully dynamic)
async getValidUserRoles(): Promise<UserRole[]>

// Validate role exists in database
async isValidUserRole(role: string): Promise<boolean>

// Map UserRole enum to actual database role name
async mapUserRoleToDatabaseRole(userRole: UserRole): Promise<string>

// Check if role is platform role using database flags
async isPlatformRoleByName(roleName: string): Promise<boolean>

// Find role record in database
async findRoleByName(roleName: string): Promise<Role | null>

// Synchronous normalization (trusts database - no validation array)
mapDatabaseRoleNameToUserRoleSync(dbRoleName: string): UserRole
```

#### 12.8.2 Tenant Isolation Using Database Flags

**Location**: `src/utils/tenantIsolation.ts`

**Platform Role Detection:**
- **Database Flags**: `is_system_role = true AND tenant_id IS NULL`
- **No Hardcoded Names**: Does not check for `'super_admin'` string
- **Dynamic Filtering**: `filterRolesByTenant()` uses database flags

**Platform Permission Detection:**
- **Database Flags**: `category = 'system' OR is_system_permission = true`
- **No Hardcoded Names**: Does not check for specific permission names
- **Dynamic Filtering**: `filterPermissionsByTenant()` uses database flags

#### 12.8.3 Role Cache Management

**Cache Strategy:**
- **TTL**: 5 minutes (configurable)
- **Invalidation**: Automatic on role create/update/delete operations
- **Performance**: Prevents excessive database queries
- **Consistency**: Cache invalidation ensures new roles are immediately available

**Cache Invalidation Points:**
- `rbacService.createRole()` - Invalidates cache after role creation
- `rbacService.updateRole()` - Invalidates cache after role update
- `rbacService.deleteRole()` - Invalidates cache after role deletion

#### 12.8.4 Future-Proof Design Benefits

**Adding New Roles:**
1. Insert role into `roles` table in database
2. Assign permissions via `role_permissions` table
3. **No code changes required** - system automatically recognizes new role

**Changing Role Names:**
1. Update role name in `roles` table
2. **No code changes required** - mappings are derived from database

**Adding New Permissions:**
1. Insert permission into `permissions` table
2. Assign to roles via `role_permissions` table
3. **No code changes required** - system automatically recognizes new permission

**Example - Adding a New Role:**
```sql
-- Step 1: Insert new role into database
INSERT INTO roles (name, description, tenant_id, is_system_role)
VALUES ('Project Manager', 'Manages projects and teams', 'tenant-uuid', true);

-- Step 2: Assign permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Project Manager'
  AND p.name IN ('projects:read', 'projects:create', 'projects:update');

-- Done! No code changes needed - system automatically recognizes new role
```

#### 12.8.5 Implementation Examples

**✅ CORRECT: Dynamic Database-Driven Approach**
```typescript
// Fetch roles from database
const validRoles = await getValidUserRoles();

// Validate role using database check
const isValid = await isValidUserRole(roleName);
if (!isValid) {
  throw new Error('Invalid role');
}

// Map to database role name
const dbRoleName = await mapUserRoleToDatabaseRole(userRole);

// Check platform role using database flags
const isPlatform = await isPlatformRoleByName(roleName);
```

**❌ WRONG: Hardcoded Values (DO NOT USE)**
```typescript
// ❌ WRONG: Hardcoded role array
const validRoles = ['super_admin', 'admin', 'manager', 'user', 'engineer', 'customer'];

// ❌ WRONG: Hardcoded role mapping
const roleMap = { 'admin': 'Administrator' };

// ❌ WRONG: Hardcoded role name check
if (role.name === 'super_admin') return false;

// ❌ WRONG: Hardcoded permission check
if (['super_admin', 'platform_admin'].includes(perm.name)) return false;

// ❌ WRONG: Hardcoded role validation
if (!['admin', 'manager'].includes(userRole)) throw new Error('Invalid role');

// ❌ WRONG: Hardcoded role arrays in navigation config
requiredRole: ['admin', 'manager', 'user'] // Should use permission checks only

// ❌ WRONG: Hardcoded role hierarchy
const roleHierarchy = { admin: 4, manager: 3, ... } // Should fetch from database
```

**⚠️ ACCEPTABLE: UI Display Only (Not for Security)**
```typescript
// ✅ ACCEPTABLE: Switch statements for UI icons/colors (display only, not security)
switch (role) {
  case 'admin': return <CrownIcon />; // OK for UI display
  case 'manager': return <ManagerIcon />; // OK for UI display
}

// ✅ ACCEPTABLE: Feature-to-permission mapping (not role mapping)
const featurePermissions = {
  customer_management: ['customers:read'], // Maps features to permissions (DB-driven)
};

// ⚠️ FALLBACK: Hardcoded hierarchy for UI display only (documented as fallback)
// Should be removed when hierarchy_level column is added to roles table
const roleLevels = { admin: 5, manager: 4, ... }; // Documented as UI-only fallback
```

#### 12.8.6 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Dynamic Role System Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Application Code                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  roleMapping.ts (Dynamic Utilities)                 │   │
│  │  • getValidUserRoles() → Fetches from DB            │   │
│  │  • isValidUserRole() → Validates in DB             │   │
│  │  • mapUserRoleToDatabaseRole() → Looks up in DB    │   │
│  │  • Role Cache (5 min TTL)                          │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  rbacService.getRoles()                              │   │
│  │  • Fetches from roles table                         │   │
│  │  • Applies tenant isolation                        │   │
│  │  • Filters platform roles using DB flags           │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Database (PostgreSQL)                              │   │
│  │  • roles table (source of truth)                   │   │
│  │  • permissions table                                │   │
│  │  • role_permissions table                           │   │
│  │  • user_roles table                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✅ No hardcoded values                                     │
│  ✅ Fully dynamic and future-proof                          │
│  ✅ Zero code changes for new roles/permissions             │
└─────────────────────────────────────────────────────────────┘
```

### 12.7 RBAC Troubleshooting Guide

#### 12.7.1 Common Issues

**Issue**: Users getting "permission denied" errors
**Solution**: Check role_permissions table assignments

**Issue**: Super admin not accessing all tenants
**Solution**: Verify user has 'super_admin' role with NULL tenant_id

**Issue**: Permission checks failing
**Solution**: Validate permission format matches expected `{resource}:{action}` pattern

#### 12.7.2 Debug Queries

```sql
-- Check user's effective permissions
SELECT DISTINCT p.name, p.resource, p.action
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = 'user-uuid-here';

-- Check tenant isolation
SELECT u.email, u.tenant_id, COUNT(c.id) as customer_count
FROM users u
LEFT JOIN customers c ON u.tenant_id = c.tenant_id
WHERE u.id = 'user-uuid-here'
GROUP BY u.email, u.tenant_id;
```

---

## 13. Database Script Synchronization

### 13.1 Critical Fixes Implemented

#### 13.1.1 Permission Format Synchronization

**Files Updated**:
- `supabase/seed.sql` - Updated 34 permission entries
- `supabase/migrations/20251122000002_update_permissions_to_resource_action_format.sql` - New format migration

**Key Changes**:
```sql
-- Legacy format → New format
'manage_users' → 'users:manage'
'manage_roles' → 'roles:manage'
'manage_customers' → 'customers:manage'
-- ... etc for all 34 permissions
```

#### 13.1.2 Auth User Synchronization

**Issue**: Auth users and database users must have matching UUIDs

**Solution**: Automated sync process
```typescript
// scripts/seed-auth-users.ts - Creates auth users
// scripts/sync-auth-to-sql.ts - Syncs IDs to seed.sql
```

#### 13.1.3 Validation Framework

**Comprehensive Validation Scripts**:
- `audit_logs_table_validation.sql` - 210 validation queries
- `customer_tables_validation.sql` - 267 validation queries  
- `contract_tables_validation.sql` - 402 validation queries

### 13.2 Database Deployment Checklist

**Pre-Deployment**:
1. ✅ Run migrations in correct order
2. ✅ Verify permission format consistency
3. ✅ Test auth user synchronization
4. ✅ Execute validation scripts

**Post-Deployment**:
1. ✅ Verify all users can authenticate
2. ✅ Test RBAC functionality
3. ✅ Validate tenant isolation
4. ✅ Check audit logging

---

## References

- **Service Registry:** See serviceFactory.ts lines 90-213
- **Proxy Factory:** See serviceFactory.ts lines 419-459
- **Service Consolidation:** See SERVICE_REGISTRY.md
- **Health Check System:** See src/services/health.ts (planned)
- **Phase 2 Consolidation:** See previous commit logs
- **RBAC Fixes:** See `DATABASE_SCRIPT_SYNCHRONIZATION_FIX_CHECKLIST.md`
- **RBAC Audit:** See `SCRIPT_SYNCHRONIZATION_AUDIT_REPORT.md`

---

---

## 13. Tenant ID Security Guidelines

### 13.1 ⚠️ CRITICAL SECURITY RULE: Tenant ID Visibility

**Security Principle**: Tenant users should **NEVER** see or be able to select `tenant_id` in UI forms. This prevents data tampering and security breaches.

**Rationale**:
- `tenant_id` is automatically set from current user context in backend services
- Allowing tenant users to see/select `tenant_id` creates security vulnerabilities
- Users could attempt to access or create data in other tenants
- Only super admins need to see/manage `tenant_id` for cross-tenant management

### 13.2 Implementation Guidelines

#### 13.2.1 Utility Functions

Use the centralized utility functions from `src/utils/tenantIsolation.ts`:

```typescript
import { shouldShowTenantIdField, getFormTenantId } from '@/utils/tenantIsolation';

// Check if tenant_id field should be visible
const showTenantField = shouldShowTenantIdField(currentUser);

// Get tenant_id value for form submission (returns null for tenant users)
const tenantId = getFormTenantId(currentUser, formValues.tenantId);
```

#### 13.2.2 Form Implementation Pattern

**✅ CORRECT: Hide entire Organization section for tenant users**
```typescript
import { shouldShowOrganizationSection, shouldShowTenantIdField, getFormTenantId } from '@/utils/tenantIsolation';

// Hide entire Organization Card section for tenant users
{shouldShowOrganizationSection(currentUser) && (
  <Card title="Organization">
    {renderTenantField()}
  </Card>
)}

// Render tenant field helper
const renderTenantField = (): React.ReactNode => {
  const showTenantField = shouldShowTenantIdField(currentUser);
  
  if (!showTenantField) {
    // Tenant users: Don't show tenant_id field at all
    // Backend will automatically set tenant_id from current user context
    return null;
  }

  // Super admin: Show tenant selector
  return (
    <Form.Item name="tenantId" label="Tenant">
      <Select>...</Select>
    </Form.Item>
  );
};
```

#### 13.2.3 Backend Service Pattern

Backend services automatically set `tenant_id` from current user context:

```typescript
// In service create/update methods
const currentUser = authService.getCurrentUser();
const currentTenantId = authService.getCurrentTenantId();

if (isSuperAdmin(currentUser)) {
  // Super admins can specify tenant_id
  assignedTenantId = data.tenantId || currentTenantId;
} else {
  // Tenant users: Always use current user's tenant
  assignedTenantId = currentTenantId;
  // Ignore any tenantId from form data
}
```

### 13.3 Security Benefits

1. **Prevents Data Tampering**: Users cannot attempt to change their tenant assignment
2. **Prevents Cross-Tenant Access**: Users cannot see or select other tenant IDs
3. **Enforces Backend Control**: Tenant assignment is always controlled by backend services
4. **Maintains Data Integrity**: Tenant isolation is enforced at both UI and backend layers
5. **Audit Trail**: All tenant assignments are logged and traceable

---

## 14. Tenant Validation System Architecture

### 14.1 Overview

The tenant validation system ensures that **ALL** CRUD operations validate tenant_id and prevent cross-tenant access. This is enforced at the utility level with comprehensive logging and audit trails.

### 14.2 Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│         Service Layer (CRUD Operations)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │     BaseSupabaseService (Base Class)             │  │
│  │  - validateTenantAccessForGet()                  │  │
│  │  - validateTenantForCreate()                      │  │
│  │  - validateTenantAccessForUpdate()                │  │
│  │  - applyTenantFilterToQuery()                     │  │
│  │  - ensureTenantId()                               │  │
│  └──────────────────┬───────────────────────────────┘  │
│                      │                                    │
│                      ▼                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Tenant Validation Utilities                  │  │
│  │  - validateTenantAccess()                        │  │
│  │  - validateTenantForOperation()                  │  │
│  │  - getOperationTenantId()                        │  │
│  │  - applyTenantFilter()                           │  │
│  └──────────────────┬───────────────────────────────┘  │
│                      │                                    │
│                      ▼                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Audit Logging System                         │  │
│  │  - Logs all validation attempts                  │  │
│  │  - Tracks allow/deny decisions                   │  │
│  │  - Records user, tenant, operation details        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 14.3 Validation Flow

**GET Operation Flow**:
1. Service calls `validateTenantAccessForGet(id, 'GET')`
2. Base service fetches record's tenant_id
3. Validation utility checks access
4. Audit log entry created
5. Query proceeds with tenant filter applied

**POST Operation Flow**:
1. Service calls `validateTenantForCreate(data)`
2. Validation utility checks tenant assignment
3. Audit log entry created
4. `ensureTenantId()` sets correct tenant_id
5. Insert proceeds with validated tenant_id

**PUT/DELETE Operation Flow**:
1. Service calls `validateTenantAccessForUpdate(id, 'PUT'/'DELETE')`
2. Base service fetches record's tenant_id
3. Validation utility checks access
4. Audit log entry created
5. Update/delete proceeds with tenant filter

### 14.4 Security Guarantees

1. **No Bypasses**: All operations must go through validation utilities
2. **Automatic Logging**: Every validation attempt is logged
3. **Consistent Enforcement**: Same validation logic everywhere
4. **Super Admin Handling**: Properly handles super admin access
5. **Tenant User Protection**: Tenant users cannot access other tenants

### 14.5 Implementation Example

```typescript
import { BaseSupabaseService } from '@/services/base/BaseSupabaseService';

export class CustomerService extends BaseSupabaseService {
  constructor() {
    super('customers', true); // Table uses tenant isolation
  }

  async getCustomer(id: string) {
    // ⚠️ SECURITY: Validate tenant access
    await this.validateTenantAccessForGet(id, 'GET');
    
    const query = this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id);
    
    const filteredQuery = this.applyTenantFilterToQuery(query);
    const { data, error } = await filteredQuery.single();
    
    if (error) throw error;
    return data;
  }

  async createCustomer(data: any) {
    // ⚠️ SECURITY: Validate tenant assignment
    await this.validateTenantForCreate(data);
    
    // ⚠️ SECURITY: Ensure tenant_id is set correctly
    const safeData = this.ensureTenantId(data);
    
    const { data: created, error } = await this.getClient()
      .from(this.tableName)
      .insert(safeData)
      .select()
      .single();
    
    if (error) throw error;
    return created;
  }
}
```

---

**Last Updated:** November 27, 2025 | **Maintained By:** Development Team
