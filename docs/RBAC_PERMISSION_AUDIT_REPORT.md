# RBAC Permission Audit Report - Fix #1 Analysis

## Overview
Comprehensive audit of all permission references in the codebase that need to be standardized from `manage_*` format to `{resource}:{action}` format.

## Files Requiring Updates

### 🔴 HIGH PRIORITY - Service Layer

#### 1. Mock RBAC Service (`src/services/rbac/rbacService.ts`)
**Status**: ❌ Contains legacy permissions  
**Lines**: 16-35 (Permission definitions)  
**Required Updates**:
- `manage_customers` → `customers:read`, `customers:create`, `customers:update`
- `manage_sales` → `sales:read`, `sales:create`, `sales:update`  
- `manage_tickets` → `tickets:read`, `tickets:create`, `tickets:update`
- `manage_users` → `users:read`, `users:create`, `users:update`, `users:delete`
- `manage_roles` → `roles:read`, `roles:create`, `roles:update`, `roles:delete`

#### 2. Supabase RBAC Service (`src/services/rbac/supabase/rbacService.ts`)
**Status**: ❌ Contains legacy permissions  
**Lines**: 606-620 (Permission definitions)  
**Required Updates**: Same as Mock RBAC Service

#### 3. Auth Services (Mock & Supabase)
**Files**: 
- `src/services/auth/authService.ts` (Lines 280-330)
- `src/services/auth/supabase/authService.ts` (Lines 280-440)

**Status**: ❌ Contains legacy role permission mappings  
**Required Updates**: Update all role permission arrays

### 🟡 MEDIUM PRIORITY - Configuration

#### 4. Navigation Permissions (`src/config/navigationPermissions.ts`)
**Status**: ❌ Uses legacy permissions  
**Lines**: 46-135  
**Required Updates**:
- `manage_customers` → `customers:read`
- `manage_sales` → `sales:read`
- `manage_users` → `users:read`

#### 5. Hook Implementations
**Files**:
- `src/hooks/useModuleAccess.ts` (Line 186)
- `src/hooks/usePermissionBasedNavigation.ts`

**Status**: ❌ Hardcoded permission checks  
**Required Updates**: Update permission logic

### 🟢 LOW PRIORITY - Tests & Documentation

#### 6. Test Files (Multiple)
**Files**: `src/__tests__/*.ts`, `src/**/__tests__/*.test.ts`
**Status**: ❌ Mock data contains legacy permissions  
**Required Updates**: Update all test mock data

#### 7. Integration Tests
**Files**: `src/__tests__/integration/`, `src/utils/*.test.ts`
**Status**: ❌ Test permissions need updating  
**Required Updates**: Update test permission references

## Permission Mapping Reference

### Core Resources
| Legacy Format | New Standard Format | Usage Context |
|---------------|---------------------|---------------|
| `manage_customers` | `customers:read`, `customers:create`, `customers:update`, `customers:delete` | Customer module operations |
| `manage_sales` | `sales:read`, `sales:create`, `sales:update`, `sales:delete` | Sales module operations |
| `manage_tickets` | `tickets:read`, `tickets:create`, `tickets:update`, `tickets:delete` | Support ticket operations |
| `manage_users` | `users:read`, `users:create`, `users:update`, `users:delete` | User management operations |
| `manage_roles` | `roles:read`, `roles:create`, `roles:update`, `roles:delete` | Role management operations |

### Specialized Resources
| Legacy Format | New Standard Format | Usage Context |
|---------------|---------------------|---------------|
| `manage_complaints` | `complaints:read`, `complaints:create`, `complaints:update` | Customer complaints |
| `manage_contracts` | `contracts:read`, `contracts:create`, `contracts:update`, `contracts:delete` | Contract management |
| `manage_products` | `products:read`, `products:create`, `products:update`, `products:delete` | Product catalog |
| `manage_job_works` | `job_works:read`, `job_works:create`, `job_works:update` | Job work orders |

### Administrative Resources
| Legacy Format | New Standard Format | Usage Context |
|---------------|---------------------|---------------|
| `manage_settings` | `settings:read`, `settings:update` | System configuration |
| `view_analytics` | `analytics:read` | Reports and analytics |
| `manage_tenants` | `tenants:read`, `tenants:create`, `tenants:update` | Multi-tenant management |

## Impact Analysis

### Files to Modify: ~25-30 files
### Total Lines to Update: ~500-800 lines
### Risk Level: HIGH (Breaking change - requires coordinated updates)

## Implementation Strategy

### Phase 1: Service Layer Updates
1. Update Mock RBAC service permissions and role mappings
2. Update Supabase RBAC service permissions  
3. Update Auth service role permission arrays
4. Test service layer functionality

### Phase 2: Configuration Updates
1. Update navigation permission configurations
2. Update hook implementations
3. Update component permission checks

### Phase 3: Test Updates
1. Update all test mock data
2. Update integration tests
3. Run comprehensive test suite

### Phase 4: Validation
1. End-to-end testing
2. Permission validation
3. Regression testing

## Success Criteria

- [ ] All `manage_*` permissions converted to `{resource}:{action}` format
- [ ] No breaking changes in functionality
- [ ] All tests pass
- [ ] Permission checks work correctly
- [ ] Navigation filtering works properly
- [ ] Role-based access control functions as expected

## Risk Mitigation

1. **Backup Strategy**: Create backup branches before implementation
2. **Incremental Updates**: Update one layer at a time
3. **Testing**: Comprehensive testing after each phase
4. **Rollback Plan**: Maintain ability to rollback if issues arise
5. **Documentation**: Update all documentation alongside code changes

---

**Audit Completed**: November 22, 2025  
**Next Step**: Begin fix1-3 - Update mock RBAC service permissions  
**Estimated Time**: 4-6 hours for complete implementation