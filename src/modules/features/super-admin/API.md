# Super Admin Module - API Documentation

## Service Factory Pattern

All service calls are routed through the factory pattern to support multiple backend implementations:

```typescript
import { superUserService as factorySuperUserService } from '@/services/serviceFactory';
```

## SuperUser Service API

### Super User Management

#### `getSuperUsers()`
Get all super users in the system.

**Returns**: `Promise<SuperUserType[]>`

**Parameters**: None

**Example**:
```typescript
const superUsers = await factorySuperUserService.getSuperUsers();
```

**Error Handling**:
- Throws error if no permission to view super users
- Returns empty array if no super users exist

---

#### `getSuperUser(id: string)`
Get a specific super user by ID.

**Returns**: `Promise<SuperUserType>`

**Parameters**:
- `id` (string, required): Super user record ID

**Example**:
```typescript
const superUser = await factorySuperUserService.getSuperUser('su_123');
```

**Error Handling**:
- Throws error if super user not found
- Throws error if user lacks permission

---

#### `getSuperUserByUserId(userId: string)`
Get super user record by user ID.

**Returns**: `Promise<SuperUserType | null>`

**Parameters**:
- `userId` (string, required): User ID

**Example**:
```typescript
const superUser = await factorySuperUserService.getSuperUserByUserId('user_456');
```

**Error Handling**:
- Returns `null` if user is not a super user
- Does not throw error (safe pattern)

---

#### `createSuperUser(input: SuperUserTenantAccessCreateInput)`
Create a new super user.

**Returns**: `Promise<SuperUserType>`

**Parameters**:
```typescript
{
  superUserId: string;        // UUID of the super user
  tenantId: string;           // UUID of tenant
  accessLevel: AccessLevel;   // 'full' | 'limited' | 'read_only' | 'specific_modules'
}
```

**Example**:
```typescript
const newSuperUser = await factorySuperUserService.createSuperUser({
  superUserId: 'user_789',
  tenantId: 'tenant_001',
  accessLevel: 'full'
});
```

**Error Handling**:
- Validates input parameters
- Checks if user exists and has super_user role
- Throws error if already a super user for this tenant
- Enforces unique constraint on (superUserId, tenantId)

**Validation Rules**:
- `superUserId`: Must be UUID format
- `tenantId`: Must be UUID format
- `accessLevel`: Must be one of enum values
- User must exist in system
- User must have `super_user` or `super_admin` role

---

#### `updateSuperUser(id: string, input: Partial<SuperUserTenantAccessUpdateInput>)`
Update a super user's details.

**Returns**: `Promise<SuperUserType>`

**Parameters**:
- `id` (string, required): Super user record ID
- `input` (object, required): Partial update object
  - All fields optional

**Example**:
```typescript
const updated = await factorySuperUserService.updateSuperUser('su_123', {
  accessLevel: 'limited'
});
```

**Error Handling**:
- Throws error if super user not found
- Validates access level if provided
- Enforces RLS policies

---

#### `deleteSuperUser(id: string)`
Delete a super user and revoke all access.

**Returns**: `Promise<{ success: boolean }>`

**Parameters**:
- `id` (string, required): Super user record ID

**Example**:
```typescript
await factorySuperUserService.deleteSuperUser('su_123');
```

**Error Handling**:
- Cascade deletes associated audit logs
- Cascade deletes impersonation sessions
- Throws error if deletion fails

---

### Tenant Access Management

#### `getTenantAccess(superUserId: string)`
Get all tenant accesses for a super user.

**Returns**: `Promise<SuperUserTenantAccessType[]>`

**Parameters**:
- `superUserId` (string, required): Super user ID

**Example**:
```typescript
const accesses = await factorySuperUserService.getTenantAccess('su_123');
```

**Caching**: 5-minute cache via React Query

---

#### `grantTenantAccess(input: SuperUserTenantAccessCreateInput)`
Grant a super user access to a tenant.

**Returns**: `Promise<SuperUserTenantAccessType>`

**Parameters**:
```typescript
{
  superUserId: string;
  tenantId: string;
  accessLevel: AccessLevel;
}
```

**Example**:
```typescript
const access = await factorySuperUserService.grantTenantAccess({
  superUserId: 'su_123',
  tenantId: 'tenant_002',
  accessLevel: 'limited'
});
```

**Error Handling**:
- Validates both super user and tenant exist
- Checks for existing access (prevents duplicates)
- Logs action to audit trail

---

#### `revokeTenantAccess(superUserId: string, tenantId: string)`
Revoke a super user's access to a tenant.

**Returns**: `Promise<{ success: boolean }>`

**Parameters**:
- `superUserId` (string, required): Super user ID
- `tenantId` (string, required): Tenant ID

**Example**:
```typescript
await factorySuperUserService.revokeTenantAccess('su_123', 'tenant_002');
```

**Error Handling**:
- Throws error if access not found
- Ends any active impersonation sessions in that tenant
- Logs revocation to audit trail

---

### Impersonation Management

#### `startImpersonation(input: ImpersonationStartInput)`
Start an impersonation session.

**Returns**: `Promise<ImpersonationLogType>`

**Parameters**:
```typescript
{
  superUserId: string;        // Super user initiating
  impersonatedUserId: string; // User being impersonated
  tenantId: string;           // Tenant context
  reason?: string;            // Optional reason for audit
}
```

**Example**:
```typescript
const session = await factorySuperUserService.startImpersonation({
  superUserId: 'su_123',
  impersonatedUserId: 'user_999',
  tenantId: 'tenant_001',
  reason: 'Troubleshooting customer issue'
});
```

**Error Handling**:
- Validates super user has access to tenant
- Validates impersonated user belongs to tenant
- Checks session limits (prevents multiple simultaneous)
- Captures IP address and user agent

**Security**:
- Records in audit log with timestamp
- Session context strictly scoped to tenant
- User cannot escalate privileges through impersonation

---

#### `endImpersonation(logId: string, actionsTaken?: any)`
End an impersonation session.

**Returns**: `Promise<ImpersonationLogType>`

**Parameters**:
- `logId` (string, required): Impersonation log ID
- `actionsTaken` (object, optional): Actions performed during session

**Example**:
```typescript
const closed = await factorySuperUserService.endImpersonation('log_456', {
  itemsModified: 5,
  ordersCreated: 2
});
```

**Error Handling**:
- Throws error if session not found
- Throws error if session already closed
- Updates logout_at timestamp
- Stores actions_taken JSONB data

---

#### `getImpersonationLogs(filters?: any)`
Get impersonation audit logs with optional filtering.

**Returns**: `Promise<ImpersonationLogType[]>`

**Parameters**:
```typescript
{
  superUserId?: string;      // Filter by super user
  tenantId?: string;         // Filter by tenant
  startDate?: Date;          // Date range start
  endDate?: Date;            // Date range end
  limit?: number;            // Limit results
  offset?: number;           // Pagination offset
}
```

**Example**:
```typescript
const logs = await factorySuperUserService.getImpersonationLogs({
  tenantId: 'tenant_001',
  startDate: new Date('2025-02-01'),
  endDate: new Date('2025-02-11')
});
```

**Caching**: 3-minute cache via React Query

---

#### `getActiveImpersonations()`
Get all currently active impersonation sessions.

**Returns**: `Promise<ImpersonationLogType[]>`

**Parameters**: None

**Example**:
```typescript
const activeSessions = await factorySuperUserService.getActiveImpersonations();
```

**Refetch Interval**: 30 seconds (real-time tracking)

---

### Tenant Statistics & Metrics

#### `getTenantStatistics(tenantId: string)`
Get all metrics for a specific tenant.

**Returns**: `Promise<TenantStatisticType[]>`

**Parameters**:
- `tenantId` (string, required): Tenant ID

**Example**:
```typescript
const stats = await factorySuperUserService.getTenantStatistics('tenant_001');
```

**Includes Metrics**:
- `active_users`: Number of active users
- `total_contracts`: Count of contracts
- `total_sales`: Revenue or sales amount
- `total_transactions`: Transaction count
- `disk_usage`: Storage usage in bytes
- `api_calls_daily`: API call count

**Caching**: 5-minute cache

---

#### `getAllTenantStatistics()`
Get metrics for all tenants (aggregated).

**Returns**: `Promise<TenantStatisticType[]>`

**Parameters**: None

**Example**:
```typescript
const allStats = await factorySuperUserService.getAllTenantStatistics();
```

**Caching**: 10-minute cache (expensive operation)

---

#### `recordTenantMetric(tenantId: string, metricType: string, value: number)`
Record a new metric for a tenant.

**Returns**: `Promise<TenantStatisticType>`

**Parameters**:
- `tenantId` (string, required): Tenant ID
- `metricType` (string, required): Type of metric (from MetricType enum)
- `value` (number, required): Metric value

**Example**:
```typescript
await factorySuperUserService.recordTenantMetric(
  'tenant_001',
  'active_users',
  256
);
```

**Metric Types**:
- `'active_users'`: Integer count
- `'total_contracts'`: Integer count
- `'total_sales'`: Decimal (currency)
- `'total_transactions'`: Integer count
- `'disk_usage'`: Integer (bytes)
- `'api_calls_daily'`: Integer count

**Error Handling**:
- Validates metric type
- Validates value format matches type
- Logs to audit trail

**Cache Invalidation**: Invalidates tenant statistics cache

---

### Configuration Overrides

#### `getConfigOverrides(tenantId: string)`
Get all configuration overrides for a tenant.

**Returns**: `Promise<TenantConfigOverrideType[]>`

**Parameters**:
- `tenantId` (string, required): Tenant ID

**Example**:
```typescript
const overrides = await factorySuperUserService.getConfigOverrides('tenant_001');
```

**Caching**: 5-minute cache

---

#### `createConfigOverride(input: TenantConfigOverrideCreateInput)`
Create a new configuration override.

**Returns**: `Promise<TenantConfigOverrideType>`

**Parameters**:
```typescript
{
  tenantId: string;           // Target tenant
  configKey: string;          // Configuration key
  configValue: any;           // Configuration value (stored as JSONB)
  overrideReason?: string;    // Reason for override
  expiresAt?: Date;          // Optional expiration date
}
```

**Example**:
```typescript
const override = await factorySuperUserService.createConfigOverride({
  tenantId: 'tenant_001',
  configKey: 'features.advanced_analytics',
  configValue: true,
  overrideReason: 'Pilot program for tenant',
  expiresAt: new Date('2025-06-01')
});
```

**Error Handling**:
- Validates config key format
- Validates JSONB serialization
- Logs creation to audit trail

**Cache Invalidation**: Invalidates tenant config cache

---

#### `updateConfigOverride(id: string, configValue: any)`
Update an existing configuration override.

**Returns**: `Promise<TenantConfigOverrideType>`

**Parameters**:
- `id` (string, required): Override record ID
- `configValue` (any, required): New value

**Example**:
```typescript
await factorySuperUserService.updateConfigOverride('override_123', false);
```

---

#### `deleteConfigOverride(id: string)`
Delete a configuration override.

**Returns**: `Promise<{ success: boolean }>`

**Parameters**:
- `id` (string, required): Override record ID

**Example**:
```typescript
await factorySuperUserService.deleteConfigOverride('override_123');
```

**Cache Invalidation**: Invalidates tenant config cache

---

## Error Codes & Handling

### Common Error Responses

| Code | Status | Message | Action |
|------|--------|---------|--------|
| 401 | Unauthorized | User not authenticated | Redirect to login |
| 403 | Forbidden | User lacks required permission | Show permission error |
| 404 | Not Found | Resource not found | Show not found message |
| 409 | Conflict | Unique constraint violation (e.g., duplicate access) | Show conflict error |
| 422 | Unprocessable Entity | Validation error | Show form validation errors |
| 500 | Internal Server Error | Server error occurred | Show generic error, log details |

### Error Handling Pattern

```typescript
try {
  const data = await factorySuperUserService.someMethod(input);
  // Handle success
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    showValidationErrors(error.details);
  } else if (error instanceof PermissionError) {
    // Handle permission errors
    showPermissionDenied();
  } else if (error instanceof NotFoundError) {
    // Handle not found
    showNotFound();
  } else {
    // Handle generic error
    console.error('Operation failed:', error);
    showGenericError();
  }
}
```

---

## Rate Limiting

All API calls are subject to rate limiting:

- **Default**: 100 requests per minute per user
- **Bulk Operations**: 20 requests per minute for batch operations
- **High-Frequency Endpoints**: 1000 requests per minute
  - `getImpersonationLogs`
  - `getTenantStatistics`

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707600300
```

**When Limit Exceeded**: 
- Status: `429 Too Many Requests`
- Retry after: Check `Retry-After` header

---

## Multi-Tenant Safety

All operations enforce multi-tenant isolation:

1. **Row-Level Security (RLS)**: Database enforces tenant boundaries
2. **Explicit Tenant Context**: All queries must include tenant_id
3. **Access Validation**: Super user access verified before operation
4. **Audit Logging**: All operations logged with tenant context

### Example with Tenant Validation
```typescript
// Super user can only access their assigned tenants
const access = await getSuperUserAccess(superUserId, tenantId);
if (!access) {
  throw new PermissionError('No access to this tenant');
}

// Proceed with operation in tenant context
return performOperationInTenant(tenantId, operation);
```

---

## Pagination

Large result sets support pagination:

```typescript
interface PaginationParams {
  limit: number;      // Items per page (default: 10, max: 100)
  offset: number;     // Skip N items (default: 0)
}

interface PaginationResponse {
  data: T[];
  total: number;      // Total items available
  limit: number;
  offset: number;
  hasMore: boolean;   // More items available
}
```

---

## Caching Strategy

React Query handles automatic caching:

- **Query Keys**: Standardized pattern `['superUser', action, ...params]`
- **Cache Duration**: Configured per endpoint (3-10 minutes)
- **Invalidation**: Manual on mutations, automatic on success
- **Stale Time**: Data marked stale after cache duration
- **Refetch**: Background refetch on window focus

---

## Testing the API

### With Mock Service (Development)
```bash
VITE_API_MODE=mock npm run dev
# Uses mock data from src/services/superUserService.ts
```

### With Supabase (Production-like)
```bash
VITE_API_MODE=supabase npm run dev
# Uses PostgreSQL via Supabase client
```

### Example Test Flow
```typescript
// 1. Get all super users
const users = await factorySuperUserService.getSuperUsers();

// 2. Create tenant access for first user
const access = await factorySuperUserService.grantTenantAccess({
  superUserId: users[0].id,
  tenantId: 'test_tenant_001',
  accessLevel: 'full'
});

// 3. Start impersonation
const session = await factorySuperUserService.startImpersonation({
  superUserId: users[0].id,
  impersonatedUserId: 'test_user_001',
  tenantId: 'test_tenant_001'
});

// 4. Record metrics
await factorySuperUserService.recordTenantMetric(
  'test_tenant_001',
  'active_users',
  42
);

// 5. End impersonation
await factorySuperUserService.endImpersonation(session.id);
```