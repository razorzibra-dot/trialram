---
title: Super User Module - Quick Reference Guide
description: Quick reference for developers working with the Super User Module
date: 2025-02-11
author: AI Agent
version: 1.0.0
---

# Super User Module - Quick Reference Guide

## 📍 Current Status
- **Completion**: 87.5% (Phases 1-7 complete)
- **Build Status**: ✅ 0 errors, 0 warnings
- **Next Phase**: Phase 8 - UI Components

---

## 🚀 Quick Start for Developers

### Import Statements (Correct ✅)

```typescript
// Services - ALWAYS use factory
import { superUserService as factorySuperUserService } from '@/services/serviceFactory';

// Module Service
import superUserService from '@/modules/features/super-admin/services/superUserService';

// Hooks
import {
  useSuperUserManagement,
  useTenantAccess,
  useImpersonation,
  useTenantMetrics,
  useTenantConfig,
} from '@/modules/features/super-admin/hooks';

// Types
import type {
  SuperUserType,
  TenantAccessType,
  ImpersonationLogType,
  TenantStatisticType,
  TenantConfigOverrideType,
} from '@/types/superUserModule';
```

### What NOT to Do ❌

```typescript
// ❌ WRONG - Don't import mock service directly
import superUserService from '@/services/superUserService';

// ❌ WRONG - Don't import Supabase service directly
import { supabaseSuperUserService } from '@/services/api/supabase/superUserService';

// ❌ WRONG - Don't bypass factory pattern
const data = await supabaseSuperUserService.getSuperUsers();
```

---

## 📦 What's Available

### Phase 6: Module Service (23 Methods)

**Location**: `src/modules/features/super-admin/services/superUserService.ts`

```typescript
import superUserService from '@/modules/features/super-admin/services/superUserService';

// Super User Management (6 methods)
const users = await superUserService.getSuperUsers(); // cached
const user = await superUserService.getSuperUser(id);
const user = await superUserService.getSuperUserByUserId(userId);
const newUser = await superUserService.createSuperUser(input); // validates
const updated = await superUserService.updateSuperUser(id, input);
await superUserService.deleteSuperUser(id); // cascades

// Tenant Access (4 methods)
const {data, total, page, limit} = await superUserService.getTenantAccessList(superUserId, 1, 20);
const access = await superUserService.grantTenantAccess(input); // conflict checked
await superUserService.revokeTenantAccess(superUserId, tenantId); // verified
const updated = await superUserService.updateAccessLevel(superUserId, tenantId, 'full');

// Impersonation (4 methods)
const session = await superUserService.startImpersonation(input);
const updated = await superUserService.endImpersonation(logId, actions);
const {data, total} = await superUserService.getImpersonationHistory(filters, 1, 20);
const active = await superUserService.getActiveImpersonations();

// Analytics (4 methods)
const metrics = await superUserService.getTenantMetrics(tenantId);
const comparison = await superUserService.getComparisonMetrics(tenantIds);
const metric = await superUserService.recordMetric(tenantId, 'active_users', 42);
const trend = await superUserService.getMetricsTrend(tenantId, 'active_users', 30);

// Configuration (5 methods)
const overrides = await superUserService.getConfigOverrides(tenantId);
const override = await superUserService.createOverride(input); // key validated
const updated = await superUserService.updateOverride(id, value);
await superUserService.expireOverride(id);
superUserService.validateConfigKey('feature_flags'); // true/false
```

### Phase 7: React Hooks (5 Hooks)

**Location**: `src/modules/features/super-admin/hooks/`

#### Hook 1: useSuperUserManagement
```typescript
import { useSuperUserManagement } from '@/modules/features/super-admin/hooks';

const {
  superUsers,          // SuperUserType[]
  selectedSuperUser,   // SuperUserType | null
  loading,            // boolean
  isCreating,         // boolean
  isUpdating,         // boolean
  isDeleting,         // boolean
  error,              // string | null
  refetch,            // () => Promise<void>
  create,             // (input) => Promise<SuperUserType>
  update,             // (id, input) => Promise<SuperUserType>
  delete: deleteSuperUser, // (id) => Promise<void>
  selectSuperUser,    // (id) => Promise<void>
} = useSuperUserManagement();
```

#### Hook 2: useTenantAccess
```typescript
import { useTenantAccess } from '@/modules/features/super-admin/hooks';

const {
  accessList,        // TenantAccessType[]
  selectedAccess,    // TenantAccessType | null
  page,             // number
  limit,            // number
  total,            // number
  loading,          // boolean
  isGranting,       // boolean
  isRevoking,       // boolean
  isUpdating,       // boolean
  error,            // string | null
  grant,            // (input) => Promise<void>
  revoke,           // (superUserId, tenantId) => Promise<void>
  updateLevel,      // (superUserId, tenantId, level) => Promise<void>
  selectAccess,     // (access) => void
  setPage,          // (page) => void
  refetch,          // () => Promise<void>
} = useTenantAccess(superUserId);
```

#### Hook 3: useImpersonation
```typescript
import { useImpersonation } from '@/modules/features/super-admin/hooks';

const {
  logs,               // ImpersonationLogType[]
  activeSession,      // ImpersonationSession | null
  page,              // number
  limit,             // number
  total,             // number
  loading,           // boolean
  isStarting,        // boolean
  isEnding,          // boolean
  error,             // string | null
  sessionStartTime,   // Date | null
  startSession,      // (input) => Promise<void>
  endSession,        // (actions?) => Promise<void>
  getLogs,           // (filters?, page?) => Promise<void>
  refetch,           // () => Promise<void>
  setPage,           // (page) => void
} = useImpersonation();
```

#### Hook 4: useTenantMetrics
```typescript
import { useTenantMetrics } from '@/modules/features/super-admin/hooks';

const {
  metrics,            // TenantStatisticType[]
  comparisonData,     // MetricComparison[]
  trendData,          // TenantStatisticType[]
  selectedTenantId,   // string | null
  selectedMetricType, // string | null
  trendDays,          // number
  loading,            // boolean
  isLoadingComparison, // boolean
  isLoadingTrend,     // boolean
  error,              // string | null
  loadMetrics,        // (tenantId) => Promise<void>
  loadComparison,     // (tenantIds) => Promise<void>
  loadTrend,          // (tenantId, metricType, days?) => Promise<void>
  recordMetric,       // (tenantId, type, value) => Promise<void>
  setSelectedMetricType, // (type) => void
  setTrendDays,       // (days) => void
  refetch,            // () => Promise<void>
} = useTenantMetrics();
```

#### Hook 5: useTenantConfig
```typescript
import { useTenantConfig, VALID_CONFIG_KEYS } from '@/modules/features/super-admin/hooks';

const {
  overrides,      // TenantConfigOverrideType[]
  selectedOverride, // TenantConfigOverrideType | null
  filterByKey,    // string | null
  loading,        // boolean
  isCreating,     // boolean
  isUpdating,     // boolean
  isDeleting,     // boolean
  error,          // string | null
  loadOverrides,  // (tenantId) => Promise<void>
  create,         // (input) => Promise<void>
  update,         // (id, value) => Promise<void>
  expire,         // (id) => Promise<void>
  selectOverride, // (override) => void
  setFilterByKey, // (key) => void
  validateConfigKey, // (key) => boolean
  refetch,        // () => Promise<void>
} = useTenantConfig();

// Valid keys: 'feature_flags' | 'maintenance_mode' | 'api_rate_limit' | 
//             'session_timeout' | 'data_retention_days' | 'backup_frequency' |
//             'notification_settings' | 'audit_log_level'
```

---

## 📊 Data Types

### SuperUserType
```typescript
interface SuperUserType {
  id: string;           // UUID
  userId: string;       // FK to users
  accessLevel: AccessLevel;
  isSuperAdmin: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type AccessLevel = 'full' | 'limited' | 'read_only' | 'specific_modules';
```

### TenantAccessType
```typescript
interface TenantAccessType {
  id: string;
  superUserId: string;
  tenantId: string;
  accessLevel: AccessLevel;
  createdAt: Date;
  updatedAt: Date;
}
```

### ImpersonationLogType
```typescript
interface ImpersonationLogType {
  id: string;
  superUserId: string;
  impersonatedUserId: string;
  tenantId: string;
  reason?: string;
  loginAt: Date;
  logoutAt?: Date;
  actionsTaken: string[];
  ipAddress: string;
  userAgent: string;
}
```

### TenantStatisticType
```typescript
interface TenantStatisticType {
  id: string;
  tenantId: string;
  metricType: MetricType;
  metricValue: number;
  recordedAt: Date;
  updatedAt: Date;
}

type MetricType = 
  | 'active_users'
  | 'total_contracts'
  | 'total_sales'
  | 'total_transactions'
  | 'disk_usage'
  | 'api_calls_daily';
```

### TenantConfigOverrideType
```typescript
interface TenantConfigOverrideType {
  id: string;
  tenantId: string;
  configKey: string;
  configValue: unknown;
  overrideReason: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}
```

---

## 🎯 Common Usage Patterns

### Pattern 1: List with Pagination
```typescript
function SuperUsersList() {
  const { superUsers, loading, error, refetch, setPage, page } = 
    useSuperUserManagement();

  return (
    <>
      {loading && <Spin />}
      {error && <Alert type="error" message={error} />}
      <Table dataSource={superUsers} />
      <Pagination current={page} onChange={setPage} />
    </>
  );
}
```

### Pattern 2: Create with Validation
```typescript
function CreateSuperUserForm() {
  const { create, isCreating, error } = useSuperUserManagement();

  const handleSubmit = async (values) => {
    try {
      await create(values);
      message.success('Super user created');
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <Form onFinish={handleSubmit} loading={isCreating}>
      {/* form fields */}
    </Form>
  );
}
```

### Pattern 3: Grant Tenant Access
```typescript
function GrantAccessModal({ superUserId, onClose }) {
  const { grant, isGranting } = useTenantAccess(superUserId);

  const handleGrant = async (tenantId) => {
    try {
      await grant({ superUserId, tenantId, accessLevel: 'full' });
      message.success('Access granted');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <Modal onOk={() => handleGrant('tenant-id')}>
      {/* modal content */}
    </Modal>
  );
}
```

### Pattern 4: Real-time Session Tracking
```typescript
function ActiveImpersonationCard() {
  const { activeSession, sessionStartTime, endSession } = useImpersonation();

  if (!activeSession) return <Empty description="No active session" />;

  return (
    <Card>
      <p>Impersonating: {activeSession.impersonatedUserId}</p>
      <p>Started: {sessionStartTime?.toLocaleString()}</p>
      <Button onClick={() => endSession()}>End Session</Button>
    </Card>
  );
}
```

### Pattern 5: Compare Metrics
```typescript
function TenantComparison({ tenantIds }) {
  const { comparisonData, loadComparison, loading } = useTenantMetrics();

  useEffect(() => {
    loadComparison(tenantIds);
  }, [tenantIds]);

  return (
    <>
      {loading && <Spin />}
      <Table
        dataSource={comparisonData}
        columns={[
          { title: 'Tenant', dataIndex: 'tenantName' },
          { title: 'Active Users', dataIndex: ['metrics', 'active_users'] },
          { title: 'Contracts', dataIndex: ['metrics', 'total_contracts'] },
        ]}
      />
    </>
  );
}
```

---

## 🔍 Debugging Tips

### Check TypeScript Errors
```bash
npx tsc --noEmit
```

### Verify Build Status
```bash
npm run validate:code
```

### Debug Service Calls
```typescript
// All service methods throw descriptive errors
try {
  await superUserService.grantTenantAccess(input);
} catch (error) {
  console.error('Error:', error.message); // "Super user X already has access to tenant Y"
}
```

### Check Cache Status
```typescript
// Module service includes caching - refetch to bypass cache
const { refetch } = useSuperUserManagement();
await refetch(); // Forces fresh data from backend
```

### Monitor Active Impersonations
```typescript
// useImpersonation auto-refreshes every 30 seconds
const { activeSession, sessionStartTime } = useImpersonation();
console.log('Active session:', activeSession);
console.log('Started at:', sessionStartTime);
```

---

## 📋 Configuration Keys (Whitelist)

```typescript
// Valid config keys for createOverride()
'feature_flags'         // Feature flag overrides
'maintenance_mode'      // Tenant maintenance mode
'api_rate_limit'        // API rate limiting
'session_timeout'       // Session timeout duration
'data_retention_days'   // Data retention policy
'backup_frequency'      // Backup scheduling
'notification_settings' // Notification configuration
'audit_log_level'       // Audit logging level
```

---

## ⚙️ Configuration

### Environment Variables
```bash
# .env file
VITE_API_MODE=supabase  # Use supabase backend (default)
# or
VITE_API_MODE=mock      # Use mock backend (development)
```

### Default Caching
```typescript
// Module service cache TTL: 5 minutes
// React Query stale time: 5 minutes
// Auto-refresh: 30 seconds for active impersonations
```

---

## 🚨 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Super user with user ID X already exists" | Duplicate super user | Check if user already has super user record |
| "No existing access found" | Trying to revoke non-existent access | Verify access exists before revoking |
| "Invalid config key: X" | Using invalid config key | Use one of the 8 valid keys |
| "Unauthorized" | Wrong API mode | Ensure VITE_API_MODE=supabase |
| "Cache not updating" | Mutation didn't invalidate | Use refetch() method |

---

## 📞 When Phase 8 Starts

### Component Structure
```
Components/
├── SuperUserList.tsx
├── SuperUserFormPanel.tsx
├── SuperUserDetailPanel.tsx
├── TenantAccessList.tsx
├── GrantAccessModal.tsx
├── ImpersonationActiveCard.tsx
├── ImpersonationLogTable.tsx
├── TenantMetricsCards.tsx
├── MultiTenantComparison.tsx
├── ConfigOverrideTable.tsx
└── ConfigOverrideForm.tsx
```

### Each Component Should:
1. Import hook from Phase 7
2. Import types from `/src/types/superUserModule.ts`
3. Use Ant Design + Tailwind CSS
4. Handle loading/error states
5. Include form validation
6. Add proper TypeScript types

---

## 📚 Documentation

### Complete Docs
- `SUPER_USER_MODULE_SESSION2_COMPLETION.md` - Session 2 full report
- `SUPER_USER_MODULE_CHECKLIST_UPDATE_SESSION2.md` - Updated checklist
- `SUPER_USER_MODULE_SESSION2_FINAL_SUMMARY.md` - Technical summary

### Code Comments
- All module service methods have JSDoc comments
- All hooks have TypeScript types and JSDoc
- All types have inline documentation

---

## ✅ Verification Checklist (Before Phase 8)

- [x] TypeScript compilation: 0 errors
- [x] All imports verified
- [x] Factory pattern enforced
- [x] No direct service imports
- [x] Caching implemented
- [x] Error handling complete
- [x] Hooks ready to use
- [x] Types synchronized
- [x] Documentation complete

---

**Last Updated**: February 11, 2025  
**Status**: ✅ Ready for Phase 8  
**Build**: ✅ All systems operational
