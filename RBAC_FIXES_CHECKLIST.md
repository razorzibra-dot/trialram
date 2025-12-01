# RBAC Implementation Fixes - Detailed Task Checklist

## Overview
This checklist tracks the implementation of 4 critical fixes to the RBAC system identified in the comprehensive architecture analysis.

**Total Tasks**: 33 subtasks across 4 fixes + 3 final verification tasks
**Estimated Total Time**: 13 hours
**Priority Order**: Fix #3 → Fix #1 → Fix #2 → Fix #4 → Final Verification

---

## 🔴 CRITICAL PRIORITY (Do First)

### Fix #3: Add RLS Policies to audit_logs Table ⏱️ 1 hour
**Impact**: Security - prevents unauthorized access to other tenants' audit logs
**Status**: Not Started
**Risk Level**: CRITICAL - BLOCKING (should fix before production data)

- [ ] **fix3-1**: Review current audit_logs migration (20250101000010) and RLS policy requirements
- [ ] **fix3-2**: Create new migration for audit_logs RLS policies (filter by tenant_id, admin access only)
- [ ] **fix3-3**: Implement RLS SELECT policy allowing only super_admin and current tenant admins to read audit logs
- [ ] **fix3-4**: Test RLS policies - verify tenant isolation and admin access
- [ ] **fix3-5**: Update Supabase audit log queries to respect new RLS policies

**Key Files to Modify**:
- `supabase/migrations/` - Create new migration file
- `src/services/rbac/supabase/rbacService.ts` - Update audit log queries

---

## 🟠 HIGH PRIORITY (This Week)

### Fix #1: Standardize Permission Naming Convention ⏱️ 4 hours
**Current State**: Permissions named inconsistently across modules
- `crm:customer:record:read` (core hooks)
- `crm:customer:record:update` (RBAC service)
- `user:list` (user-management)

**Target Format**: `{resource}:{action}` (e.g., `crm:customer:record:read`, `crm:user:record:create`, `crm:sales:deal:update`)

**Impact**: Permission checks may fail silently, inconsistent audit logging, maintenance difficulty
**Status**: Not Started

#### Phase 1: Planning & Audit
- [ ] **fix1-1**: Document target format (`{resource}:{action}`) as standard convention
- [ ] **fix1-2**: Audit all permission references in codebase - create mapping of all naming inconsistencies

#### Phase 2: Update Mock Data
- [ ] **fix1-3**: Update mock RBAC service (`src/services/rbac/rbacService.ts`) - rename all permissions to `{resource}:{action}` format

#### Phase 3: Update Database
- [ ] **fix1-4**: Update database permissions seed data - rename all permissions to new format

#### Phase 4: Update Components & Hooks
- [ ] **fix1-5**: Update all permission checks in components - change from `crm:customer:record:update` to `crm:customer:record:read` format
- [ ] **fix1-6**: Update usePermission hook - ensure it expects correct permission format
- [ ] **fix1-7**: Update role templates - rename permissions to `{resource}:{action}` format

#### Phase 5: Testing
- [ ] **fix1-8**: Test all permission checks work correctly after renaming

**Key Files to Modify**:
- `src/services/rbac/rbacService.ts` - Mock data
- `supabase/migrations/` - Seed data
- `src/modules/*/guards/permissionGuards.ts` - Permission checks
- `src/modules/core/hooks/useRBAC.ts` - Hook implementation
- `src/modules/*/hooks/usePermission.ts` - Permission hooks
- All components using permission checks

---

## 🟡 MEDIUM PRIORITY (Next Phase)

### Fix #2: Implement Real Client IP Tracking ⏱️ 2 hours
**Current Issue**: IP address hardcoded to `192.168.1.1` in line 347 of `src/services/rbac/supabase/rbacService.ts`
**Impact**: Cannot detect unauthorized access patterns, geo-location tracking impossible, audit logs useless for security analysis
**Status**: Not Started

#### Phase 1: Research & Planning
- [ ] **fix2-1**: Research IP capture options (server-side API, X-Forwarded-For headers, client detection libraries)
- [ ] **fix2-2**: Determine implementation approach - server-side logging vs client-side limitation documentation

#### Phase 2: Implementation
- [ ] **fix2-3**: Remove hardcoded `192.168.1.1` from audit logs - implement proper IP detection
- [ ] **fix2-4**: If server-side needed - create API endpoint or middleware for IP logging

#### Phase 3: Testing
- [ ] **fix2-5**: Test IP logging in audit records - verify correct IPs are captured

**Key Files to Modify**:
- `src/services/rbac/supabase/rbacService.ts` - Line 347 (audit log IP)
- `src/api/` - Middleware for IP tracking (if server-side)
- `src/services/rbac/mock/rbacService.ts` - Mock implementation

**Notes**:
- Client-side JavaScript cannot reliably detect actual client IP
- May require backend API integration for accurate IP tracking
- Consider documenting client-side limitation if server-side not feasible

---

### Fix #4: Centralize Permission Validation Logic ⏱️ 6 hours
**Current Issue**: Permission validation scattered across 5 locations:
1. RBAC Service (`src/services/rbac/`)
2. Permission Guards (`src/modules/features/user-management/guards/permissionGuards.ts`)
3. Auth Context (`src/modules/core/contexts/AuthContext.tsx`)
4. usePermission hook (`src/modules/*/hooks/usePermission.ts`)
5. Core hooks (`src/modules/core/hooks/useRBAC.ts`)

**Impact**: Developers confused about which function to use, inconsistent validation, hard to maintain
**Status**: Not Started

#### Phase 1: Mapping & Design
- [ ] **fix4-1**: Map all permission check locations - identify all validation implementations
- [ ] **fix4-2**: Create unified permission validation interface in RBAC service

#### Phase 2: Refactoring RBAC Service
- [ ] **fix4-3**: Refactor RBAC Service - consolidate permission checks into central validation method

#### Phase 3: Update Components & Hooks
- [ ] **fix4-4**: Update permissionGuards.ts - use centralized validation from RBAC service
- [ ] **fix4-5**: Update Auth Context - delegate permission checks to RBAC service
- [ ] **fix4-6**: Update usePermission hook - use centralized RBAC service validation
- [ ] **fix4-7**: Update core hooks - use centralized RBAC service validation

#### Phase 4: Testing
- [ ] **fix4-8**: Test all permission checks use consistent validation logic

**Key Files to Modify**:
- `src/services/rbac/rbacService.ts` - Add centralized validation interface
- `src/modules/features/user-management/guards/permissionGuards.ts` - Use central service
- `src/modules/core/contexts/AuthContext.tsx` - Delegate to RBAC service
- `src/modules/*/hooks/usePermission.ts` - Use central service
- `src/modules/core/hooks/useRBAC.ts` - Use central service

**Recommended Approach**:
- Create unified interface: `validatePermission(userId, permission, context?): Promise<boolean>`
- All permission checks route through RBAC service
- RBAC service handles: role lookup, permission matching, tenant isolation, caching

---

## ✅ FINAL VERIFICATION (After All Fixes)

- [ ] **final-1**: Run full test suite - verify all fixes work correctly together
- [ ] **final-2**: Run lint and typecheck - ensure code quality (`npm run lint`, `npm run typecheck`)
- [ ] **final-3**: Review all changes - ensure no regressions introduced

---

## Implementation Timeline

```
Day 1 (2 hours):
├─ Fix #3: RLS Policies (1 hour) ← CRITICAL
└─ Fix #1 Phase 1: Planning & Audit (1 hour)

Day 2 (3 hours):
├─ Fix #1 Phase 2-5: Implementation & Testing (3 hours)
└─ End of Phase: All permissions standardized

Day 3 (2 hours):
├─ Fix #2: Client IP Tracking (2 hours)
└─ End of Phase: Audit logs have real IP addresses

Day 4 (4 hours):
├─ Fix #4: Centralize Validation (4 hours)
└─ End of Phase: Single source of truth for permission checks

Day 5 (2 hours):
├─ Final Verification
├─ Run test suite
├─ Lint & typecheck
└─ Code review
```

---

## Success Criteria

### Fix #3 Complete ✓
- [ ] RLS policies created and deployed
- [ ] Audit logs table properly protected
- [ ] Tenant isolation verified
- [ ] Admin-only access confirmed

### Fix #1 Complete ✓
- [ ] All permissions use `{resource}:{action}` format
- [ ] Mock service updated
- [ ] Database seed updated
- [ ] All permission checks use new format
- [ ] Tests pass

### Fix #2 Complete ✓
- [ ] Real IP addresses captured in audit logs
- [ ] Hardcoded IP removed
- [ ] Implementation documented
- [ ] Tests verify IP capture

### Fix #4 Complete ✓
- [ ] Centralized validation interface created
- [ ] All 5 locations use central service
- [ ] Consistent validation across app
- [ ] Tests verify consistency

### Overall Quality ✓
- [ ] All tests pass
- [ ] Zero lint errors
- [ ] Zero type errors
- [ ] Code review approved
- [ ] Ready for production

---

## Notes

- **Dependency Order**: Fix #3 → Fix #1 → Fix #2 → Fix #4 (can be done in parallel after #1)
- **Testing**: Each fix should have tests before moving to next
- **Code Review**: Recommended after each major fix
- **Database Migrations**: Create new migration files; never modify existing migrations
- **Documentation**: Update permission naming docs after Fix #1
- **Breaking Changes**: Fix #1 introduces breaking change to permission names - coordinate with team

---

**Last Updated**: November 22, 2025
**Status**: Ready to Begin
**Next Step**: Start with Fix #3 (fix3-1)
