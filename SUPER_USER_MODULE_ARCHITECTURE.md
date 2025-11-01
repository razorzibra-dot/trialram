# Super User Module - Architecture & Data Flow

**Visual Reference for Multi-Layer Implementation**

---

## 🏗️ Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER / UI LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SuperAdminDashboardPage                                   │   │
│  │  SuperAdminUsersPage                                       │   │
│  │  SuperAdminTenantsPage                                     │   │
│  │  SuperAdminLogsPage                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓↑ (Forms, State, Events)
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT LAYER (Ant Design)                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ SuperUserList    SuperUserFormPanel    TenantAccessList      │  │
│  │ ImpersonationActiveCard    TenantMetricsCards              │  │
│  │ ConfigOverrideTable        MultiTenantComparison            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓↑ (useQuery, useMutation)
┌─────────────────────────────────────────────────────────────────────┐
│                         HOOKS LAYER (React Query)                   │
│  ┌────────────────┬────────────────┬────────────────┬────────────┐  │
│  │useSuperUser    │useTenantAccess │useImpersonation│useTenantM- │  │
│  │Management      │                │                │etrics     │  │
│  └────────────────┴────────────────┴────────────────┴────────────┘  │
│  Query Keys: ['superUsers'], ['tenantAccess', id], etc.             │
│  Cache Invalidation: On mutations (create, update, delete)          │
└─────────────────────────────────────────────────────────────────────┘
                          ↓↑ (Service calls)
┌─────────────────────────────────────────────────────────────────────┐
│              MODULE SERVICE LAYER (Business Logic)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  super-admin/services/superUserService.ts                 │   │
│  │  - Coordinates data flows                                 │   │
│  │  - Applies business logic                                │   │
│  │  - Uses factory pattern                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────────┐
│              SERVICE FACTORY (Routing Layer)                        │
│                  VITE_API_MODE environment variable                 │
│  ┌──────────────────┐              ┌─────────────────┐             │
│  │  Check API Mode  │              │ Route Request  │             │
│  │  'mock' or       │──────────→   │ to appropriate │             │
│  │  'supabase'      │              │ service        │             │
│  └──────────────────┘              └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
        ↓                                              ↓
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│     MOCK SERVICE LAYER          │    │  SUPABASE SERVICE LAYER      │
│  (src/services/)                │    │  (src/services/supabase/)    │
│                                 │    │                              │
│ ├─ getSuperUsers()              │    │ ├─ SELECT queries           │
│ ├─ createSuperUser()            │    │ ├─ Row mappers              │
│ ├─ getTenantAccess()            │    │ ├─ Column mapping           │
│ ├─ startImpersonation()         │    │ ├─ RLS policies             │
│ └─ ... (20 methods)             │    │ └─ Error handling           │
│                                 │    │                              │
│ MOCK DATA (In-Memory):          │    │ DATABASE QUERIES:           │
│ ├─ 3 super users               │    │ ├─ supabase_user_ta...      │
│ ├─ Tenant access records       │    │ ├─ super_user_impersona...  │
│ ├─ Impersonation logs          │    │ ├─ tenant_statistics        │
│ └─ Config overrides            │    │ └─ tenant_config_overrides  │
└─────────────────────────────────┘    └──────────────────────────────┘
        ↓                                              ↓
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│    MOCK DATA STORAGE            │    │   SUPABASE / PostgreSQL      │
│  (JavaScript Objects)           │    │   (Remote Database)          │
│                                 │    │                              │
│ Array of mock records with      │    │ Tables:                      │
│ same shape as database schema   │    │ ├─ super_user_tenant_...     │
│                                 │    │ ├─ super_user_impersona...   │
│                                 │    │ ├─ tenant_statistics         │
│                                 │    │ └─ tenant_config_overrides   │
└─────────────────────────────────┘    └──────────────────────────────┘
```

---

## 📊 Data Flow Examples

### Example 1: Fetch All Super Users

```
User Views Page
    ↓
SuperAdminUsersPage mounts
    ↓
useSuperUserManagement() hook called
    ↓
React Query: useQuery(['superUsers'])
    ↓
Module Service: superUserService.getSuperUsers()
    ↓
Service Factory: Check VITE_API_MODE
    ↓
┌────────────────────────────────────────┐
│ Mock Mode                │ Supabase Mode           │
├────────────────────────────────────────┤
│ mockService.getSuperUsers() │ supabaseService.getSuperUsers() │
│ ↓                        │ ↓                       │
│ Return mockData array    │ SELECT * FROM su...    │
│ (in-memory)             │ (database query)        │
│ ↓                        │ ↓                       │
│ [UserA, UserB, UserC]    │ DB returns raw rows     │
│                          │ ↓                       │
│                          │ mapSuperUserRow()       │
│                          │ ↓                       │
│                          │ [UserA, UserB, UserC]   │
└────────────────────────────────────────┘
    ↓
React Query caches results
    ↓
Hook updates component state
    ↓
SuperUserList component renders with data
    ↓
User sees table with super users
```

### Example 2: Create New Super User

```
User fills form and submits
    ↓
SuperUserFormPanel.onSubmit()
    ↓
Call hook: createSuperUser()
    ↓
useMutation({
  mutationFn: superUserService.createSuperUser()
})
    ↓
Module Service: superUserService.createSuperUser(input)
    ↓
Service Factory: Check VITE_API_MODE
    ↓
┌──────────────────────────────────────┐
│ Mock Mode     │ Supabase Mode        │
├──────────────────────────────────────┤
│ Validate input│ Validate input       │
│ Generate ID   │ INSERT into su...    │
│ Add to array  │ RETURNING * ...      │
│ Return new    │ mapSuperUserRow()    │
│ record        │ Return new record    │
└──────────────────────────────────────┘
    ↓
useMutation onSuccess callback fires
    ↓
Invalidate query cache: ['superUsers']
    ↓
React Query refetches data
    ↓
useQuery runs again
    ↓
New super user appears in table
    ↓
User sees success message
```

### Example 3: Impersonate User

```
User clicks "Impersonate" button
    ↓
ImpersonationActiveCard.onClick()
    ↓
Call hook: startImpersonation({
  impersonatedUserId: 'user-123',
  tenantId: 'tenant-456',
  reason: 'Troubleshooting'
})
    ↓
Service Factory routes to:
    ↓
Mock/Supabase Service:
├─ Validate super user has access to tenant
├─ Validate user exists in tenant
├─ Create impersonation session
├─ Log in impersonation_logs table
├─ Record start time
└─ Return impersonation log record
    ↓
Mutation success callback
    ↓
Store impersonation session in app context
    ↓
Switch user context to impersonated user
    ↓
Application UI reflects impersonated user
    ↓
Super user can now access tenant as that user
    ↓
All actions logged to 'actionsTaken' JSONB
    ↓
When super user clicks "End Impersonation"
    ↓
endImpersonation({logId, actionsTaken})
    ↓
Update impersonation_logs: logout_at = NOW()
    ↓
Clear impersonation context
    ↓
Switch back to super user
    ↓
Audit log shows complete impersonation session
```

---

## 🔄 Layer Synchronization: Database ↔ TypeScript

### Field Mapping Pattern

```typescript
// DATABASE LAYER (PostgreSQL)
CREATE TABLE super_user_tenant_access (
  id UUID PRIMARY KEY,
  super_user_id UUID NOT NULL,         // snake_case
  tenant_id UUID NOT NULL,
  access_level VARCHAR(50) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (super_user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

// ↓↓↓ MAPPING ↓↓↓

// TYPESCRIPT TYPES (src/types/superUserModule.ts)
export interface TenantAccessType {
  id: string;                          // camelCase
  superUserId: string;
  tenantId: string;
  accessLevel: 'full' | 'limited' | 'read_only' | 'specific_modules';
  createdAt: string;
  updatedAt: string;
}

export const TenantAccessSchema = z.object({
  id: z.string().uuid(),
  superUserId: z.string().uuid(),
  tenantId: z.string().uuid(),
  accessLevel: z.enum(['full', 'limited', 'read_only', 'specific_modules']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ↓↓↓ USED IN ↓↓↓

// SUPABASE SERVICE (src/services/supabase/superUserService.ts)
async getTenantAccess(superUserId: string): Promise<TenantAccessType[]> {
  const { data, error } = await supabase
    .from('super_user_tenant_access')
    .select(`
      id,
      super_user_id as superUserId,      // MAPPING: snake → camel
      tenant_id as tenantId,
      access_level as accessLevel,
      created_at as createdAt,
      updated_at as updatedAt
    `)
    .eq('super_user_id', superUserId);
  
  if (error) throw error;
  return (data || []).map(mapTenantAccessRow);
}

function mapTenantAccessRow(row: any): TenantAccessType {
  return {
    id: row.id,
    superUserId: row.superUserId,
    tenantId: row.tenantId,
    accessLevel: row.accessLevel as any,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ↓↓↓ ALSO USED IN ↓↓↓

// MOCK SERVICE (src/services/superUserService.ts)
async getTenantAccess(superUserId: string): Promise<TenantAccessType[]> {
  return mockTenantAccessData.filter(t => t.superUserId === superUserId);
}

// MOCK DATA (same structure)
const mockTenantAccessData: TenantAccessType[] = [
  {
    id: '1',
    superUserId: 'admin1',
    tenantId: 'tenant-1',
    accessLevel: 'full',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  // ...
];

// ↓↓↓ USED IN ↓↓↓

// MODULE SERVICE
async getTenantAccessList(superUserId: string) {
  return await superUserService.getTenantAccess(superUserId);
}

// ↓↓↓ USED IN ↓↓↓

// HOOKS (src/modules/features/super-admin/hooks/useTenantAccess.ts)
export function useTenantAccess(superUserId: string) {
  const { data: accessList = [], loading, error } = useQuery({
    queryKey: ['tenantAccess', superUserId],
    queryFn: () => moduleSuperUserService.getTenantAccessList(superUserId),
  });
  return { accessList, loading, error };
}

// ↓↓↓ USED IN ↓↓↓

// UI COMPONENTS (TenantAccessList.tsx)
export function TenantAccessList({ superUserId }: Props) {
  const { accessList, loading } = useTenantAccess(superUserId);
  
  return (
    <Table
      dataSource={accessList}
      columns={[
        { 
          dataIndex: 'tenantId',        // Bind to camelCase field
          title: 'Tenant ID' 
        },
        { 
          dataIndex: 'accessLevel',     // Bind to camelCase field
          title: 'Access Level',
          render: (level: string) => {
            // Render with proper formatting
            return level === 'full' ? 'Full Access' : level;
          }
        },
        // ...
      ]}
    />
  );
}
```

---

## 🔗 Service Integration Map

```
SUPER USER MODULE
├── Uses: User Management Service
│   ├─ Get user details by ID
│   ├─ Create/update/delete users
│   └─ Verify user exists in tenant
│
├── Uses: RBAC Service
│   ├─ Check permission: super_user:manage_tenants
│   ├─ Check permission: super_user:impersonate_users
│   ├─ Assign super_user role
│   └─ Verify role permissions
│
├── Uses: Tenant Service
│   ├─ Get all tenants
│   ├─ Get tenant details
│   ├─ Verify tenant exists
│   └─ Access tenant data
│
├── Uses: Audit Service
│   ├─ Log all super user actions
│   ├─ Log impersonation sessions
│   ├─ Log config changes
│   └─ Retrieve audit logs
│
└── Provides: Super User Data & Operations
    ├─ Super user management (CRUD)
    ├─ Tenant access grants
    ├─ Impersonation sessions
    ├─ Tenant metrics
    └─ Configuration overrides
```

---

## 📈 Seeding Data Relationships

```
USERS TABLE
├─ User 'superadmin'
│   └─ Has role: super_admin
│
├─ User 'admin2'
│   └─ Has role: super_user
│
└─ User 'admin3'
   └─ Has role: super_user

TENANTS TABLE
├─ Tenant: Enterprise Corp (tenant-1)
│   ├─ Status: Active
│   └─ Created: 2025-01-01
│
├─ Tenant: Mid-Market Inc (tenant-2)
│   ├─ Status: Active
│   └─ Created: 2025-01-01
│
└─ Tenant: Startup Labs (tenant-3)
    ├─ Status: Active
    └─ Created: 2025-01-01

SUPER_USER_TENANT_ACCESS TABLE
├─ superadmin → tenant-1 (full)
├─ superadmin → tenant-2 (full)
├─ superadmin → tenant-3 (full)
├─ admin2 → tenant-1 (limited)
├─ admin2 → tenant-2 (limited)
└─ admin3 → tenant-3 (read_only)

SUPER_USER_IMPERSONATION_LOGS TABLE
├─ superadmin impersonates user-100 in tenant-1
├─ superadmin impersonates user-200 in tenant-2
├─ admin2 impersonates user-101 in tenant-1
└─ ... (10+ total logs)

TENANT_STATISTICS TABLE
├─ tenant-1, active_users: 100
├─ tenant-1, total_contracts: 50
├─ tenant-1, total_sales: 100
├─ tenant-2, active_users: 50
├─ tenant-2, total_contracts: 20
├─ tenant-2, total_sales: 40
├─ tenant-3, active_users: 10
├─ tenant-3, total_contracts: 5
└─ tenant-3, total_sales: 10

TENANT_CONFIG_OVERRIDES TABLE
├─ tenant-1, feature_flag: enable_advanced_reporting
├─ tenant-2, max_users: 75
├─ tenant-3, trial_mode: true
└─ ... (5+ total)
```

---

## 🧪 Testing & Validation Layers

```
UNIT TESTS (Level 1)
├─ Service methods: superUserService.test.ts
├─ Validation logic: Zod schemas
├─ Error handling: Custom errors
└─ Type safety: TypeScript strict mode

INTEGRATION TESTS (Level 2)
├─ Mock vs Supabase parity
├─ Service + Hook interaction
├─ Component + Hook interaction
└─ Multi-tenant isolation

WORKFLOW TESTS (Level 3)
├─ Create super user workflow
├─ Impersonation session workflow
├─ Metric tracking workflow
├─ Config override workflow
└─ Permission check workflow

E2E TESTS (Level 4)
├─ Full page workflows
├─ User interactions
├─ Data persistence
├─ Audit trail creation
└─ Error scenarios
```

---

## 🔐 Security & Multi-Tenant Isolation

```
MULTI-TENANT SAFETY
├─ Database Layer (RLS)
│  ├─ super_user_tenant_access: visible only to admins
│  ├─ impersonation_logs: visible only to admins
│  ├─ config_overrides: visible only to assigned admins
│  └─ statistics: visible only to assigned admins
│
├─ Application Layer
│  ├─ Super user can only access assigned tenants
│  ├─ Impersonation validates tenant access
│  ├─ Config overrides scoped to tenant
│  └─ Metrics queries include tenant filter
│
├─ Audit Layer
│  ├─ All super user actions logged
│  ├─ Impersonation audit trail
│  ├─ Who accessed what when
│  └─ Config change history
│
└─ Permission Layer
   ├─ RBAC enforces super_user role
   ├─ Fine-grained permissions
   ├─ Permission validation on every call
   └─ Unauthorized access rejected

TESTING MULTI-TENANT SAFETY
├─ Test 1: SuperUserA accesses TenantA ✓ (allowed)
├─ Test 2: SuperUserA accesses TenantB ✗ (blocked)
├─ Test 3: SuperUserB accesses TenantA ✗ (blocked)
├─ Test 4: SuperUserB accesses TenantB ✓ (allowed)
├─ Test 5: Non-super-user accesses super-admin pages ✗ (blocked)
└─ Test 6: Impersonation preserves tenant isolation ✓
```

---

## 📊 Performance Considerations

```
QUERY OPTIMIZATION
├─ Indexes on frequently queried columns:
│  ├─ super_user_tenant_access (super_user_id, tenant_id)
│  ├─ impersonation_logs (super_user_id, tenant_id)
│  └─ config_overrides (tenant_id, config_key)
│
├─ Pagination for large result sets:
│  ├─ Super users: 50 per page
│  ├─ Tenant access: 20 per page
│  ├─ Impersonation logs: 100 per page
│  └─ Config overrides: 50 per page
│
├─ Caching strategy:
│  ├─ React Query: 5 minute stale time
│  ├─ Tenant stats: 15 minute cache
│  ├─ Impersonation session: 1 day cache
│  └─ Config overrides: 30 minute cache
│
└─ Query optimization:
   ├─ SELECT only needed columns
   ├─ Use LIMIT for large tables
   ├─ Filter at database level
   └─ Sort efficiently with indexes
```

---

## 📋 Deployment Topology

```
DEVELOPMENT (Local)
├─ Mode: VITE_API_MODE=mock
├─ Data Source: In-memory mock objects
├─ Database: N/A (mock doesn't use)
└─ Use for: Development, rapid testing

STAGING (Supabase Local)
├─ Mode: VITE_API_MODE=supabase
├─ Data Source: Local PostgreSQL
├─ Database: docker-compose database
└─ Use for: Integration testing, QA

PRODUCTION (Supabase Cloud)
├─ Mode: VITE_API_MODE=supabase
├─ Data Source: Cloud PostgreSQL
├─ Database: Supabase managed DB
└─ Use for: Real data, end users
```

---

## ✅ Validation Checklist by Layer

| Layer | Validation | Tool |
|-------|-----------|------|
| Database | Schema valid | `supabase db validate` |
| Types | TypeScript strict | `npx tsc --noEmit` |
| Services | Method signatures | Type checking |
| Factory | Routing correct | Manual testing |
| Module | Business logic | Unit tests |
| Hooks | State management | Integration tests |
| Components | Rendering | E2E tests |
| Pages | Full workflows | Manual testing |
| Integration | Dependent modules | Integration tests |
| Quality | Code standards | `npm run lint` |

---

## 🎯 Implementation Order

```
STEP 1: Design (Phase 1-2)
  ├─ Database schema
  └─ TypeScript types
                ↓
STEP 2: Services (Phase 3-6)
  ├─ Mock service
  ├─ Supabase service
  ├─ Factory integration
  └─ Module service
                ↓
STEP 3: UI Layer (Phase 7-10)
  ├─ Hooks
  ├─ Components
  └─ Pages
                ↓
STEP 4: Quality (Phase 11-15)
  ├─ Tests
  ├─ Documentation
  └─ Code quality
                ↓
STEP 5: Deployment (Phase 16-20)
  ├─ Final validation
  ├─ Cleanup
  └─ Sign-off
```

---

**Architecture is synchronized across all 7 layers**  
**Data flows: Database ↔ Services ↔ Hooks ↔ UI**  
**Consistency maintained through layer sync patterns**  
**Multi-tenant isolation enforced at all layers**

Full Checklist: `/PROJ_DOCS/10_CHECKLISTS/2025-02-11_SuperUserModule_CompletionChecklist_v1.0.md`