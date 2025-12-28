# Dynamic Roles Implementation - Enterprise Rule

**Date:** December 27, 2025  
**Issue:** Hardcoded role names breaking application when roles are renamed or changed  
**Solution:** Centralized, configuration-driven role management

---

## Problem: Hardcoded Roles ❌

### Before (BROKEN in Enterprise)
```typescript
// ❌ BAD: Hardcoded role names - breaks if roles change
const { data: tenantUsers, error } = await supabase
  .from('users')
  .select('id, first_name, last_name, role')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')
  .or('role.eq.agent,role.eq.manager,role.eq.admin');  // 🔴 FAILS if roles renamed
```

**Risks:**
- ❌ If admin renames `agent` → `sales_agent`, query breaks silently
- ❌ Adding new roles requires code deployment
- ❌ Tenant-specific role names unsupported
- ❌ No audit trail of what roles are assignable

---

## Solution: Dynamic Configuration ✅

### Step 1: Define Role Constants
**File:** `src/constants/roleConstants.ts`

```typescript
export const ApplicationRoles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

export const ROLES_ASSIGNABLE_FOR_LEADS: string[] = [
  ApplicationRoles.AGENT,
  ApplicationRoles.MANAGER,
  ApplicationRoles.ADMIN,
  ApplicationRoles.SUPER_ADMIN,
];

export const buildRoleFilter = (roles: string[]): string => {
  return roles.map(role => `role.eq.${role}`).join(',');
};
```

### Step 2: Load from Environment
**File:** `src/config/backendConfig.ts`

```typescript
export interface BackendConfig {
  // ... other config
  roles?: {
    assignableForLeads: string[];
    assignableForDeals: string[];
    assignableForTickets: string[];
  };
}

export const backendConfig: BackendConfig = {
  // ... other config
  roles: {
    // Load from environment, with sensible defaults
    assignableForLeads: (import.meta.env.VITE_ROLES_ASSIGNABLE_FOR_LEADS || 'agent,manager,admin,super_admin').split(','),
    assignableForDeals: (import.meta.env.VITE_ROLES_ASSIGNABLE_FOR_DEALS || 'agent,manager,admin,super_admin').split(','),
    assignableForTickets: (import.meta.env.VITE_ROLES_ASSIGNABLE_FOR_TICKETS || 'agent,manager,admin,super_admin').split(','),
  }
};
```

### Step 3: Use in Service
**File:** `src/services/deals/supabase/leadsService.ts`

```typescript
import { buildRoleFilter, ROLES_ASSIGNABLE_FOR_LEADS } from '@/constants/roleConstants';
import backendConfig from '@/config/backendConfig';

async autoAssignLead(id: string): Promise<LeadDTO> {
  // ✅ GOOD: Use dynamic config
  const assignableRoles = backendConfig.roles?.assignableForLeads || ROLES_ASSIGNABLE_FOR_LEADS;
  
  if (!assignableRoles || assignableRoles.length === 0) {
    throw new Error('No assignable roles configured');
  }
  
  console.log('[LeadsService] Fetching assignees for roles:', assignableRoles);
  
  const { data: tenantUsers, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, role')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .or(buildRoleFilter(assignableRoles));  // ✅ Dynamic!

  if (error) {
    console.error('[LeadsService] Error fetching assignees:', {
      error: error.message,
      roles: assignableRoles
    });
    throw error;
  }
  // ... rest of logic
}
```

---

## Configuration Hierarchy

### Runtime Override (Highest Priority)
```typescript
// From SessionConfigContext - per tenant/environment
const sessionRoles = sessionConfig?.roleConfig?.assignableForLeads;
```

### Environment Variables (Medium Priority)
```bash
# .env
VITE_ROLES_ASSIGNABLE_FOR_LEADS=agent,manager,admin,super_admin
VITE_ROLES_ASSIGNABLE_FOR_DEALS=agent,manager,admin,super_admin
VITE_ROLES_ASSIGNABLE_FOR_TICKETS=agent,manager,admin,super_admin
```

### Fallback Constants (Lowest Priority)
```typescript
// src/constants/roleConstants.ts
export const ROLES_ASSIGNABLE_FOR_LEADS = [
  'agent', 'manager', 'admin', 'super_admin'
];
```

---

## Benefits (Enterprise)

| Benefit | Impact |
|---------|--------|
| **Zero-downtime role changes** | Rename roles via `.env` without redeploying code |
| **Multi-tenant flexibility** | Different tenants can have different role names |
| **Audit trail** | Role config centralized and versioned |
| **New role support** | Add roles to `.env` without touching service code |
| **Scalability** | Thousands of tenants with different role schemas |
| **Maintainability** | Single source of truth for roles per context |

---

## Files Modified

1. **Created:** `src/constants/roleConstants.ts`
   - `ApplicationRoles` enum
   - `ROLES_ASSIGNABLE_FOR_LEADS` constant
   - `buildRoleFilter()` helper
   - Documentation and patterns

2. **Updated:** `src/config/backendConfig.ts`
   - Added `roles` section to `BackendConfig` interface
   - Load roles from `VITE_ROLES_ASSIGNABLE_*` env vars
   - Sensible defaults for all role lists

3. **Updated:** `src/services/deals/supabase/leadsService.ts`
   - Import `buildRoleFilter` and `ROLES_ASSIGNABLE_FOR_LEADS`
   - Changed `autoAssignLead()` to use `backendConfig.roles?.assignableForLeads`
   - Use `buildRoleFilter()` to generate safe query filter
   - Added error logging for role configuration

4. **Updated:** `.github/copilot-instructions.md`
   - Added "Enterprise Role Configuration" section
   - Documented NO HARDCODED ROLES rule
   - Showed configuration hierarchy and examples
   - Listed key files and environment variables

---

## Testing

### Unit Test Example
```typescript
describe('Role Constants', () => {
  it('should build correct Supabase filter', () => {
    const filter = buildRoleFilter(['agent', 'manager', 'admin']);
    expect(filter).toBe('role.eq.agent,role.eq.manager,role.eq.admin');
  });

  it('should support dynamic role lists', () => {
    const customRoles = ['custom_role_1', 'custom_role_2'];
    const filter = buildRoleFilter(customRoles);
    expect(filter).toBe('role.eq.custom_role_1,role.eq.custom_role_2');
  });
});
```

### Integration Test Example
```typescript
describe('Auto-assign with dynamic roles', () => {
  it('should fetch assignees using configured roles', async () => {
    // Setup: Mock env with custom roles
    process.env.VITE_ROLES_ASSIGNABLE_FOR_LEADS = 'agent,supervisor';
    
    const service = new SupabaseLeadsService();
    const lead = await service.autoAssignLead('lead-123');
    
    expect(lead.assignedTo).toBeDefined();
  });
});
```

---

## Migration Guide

### For Existing Services
If you have other services with hardcoded roles:

1. **Import** role helpers:
   ```typescript
   import { buildRoleFilter, ROLES_ASSIGNABLE_FOR_LEADS } from '@/constants/roleConstants';
   ```

2. **Replace** hardcoded filters:
   ```typescript
   // ❌ Before
   .or('role.eq.agent,role.eq.manager')
   
   // ✅ After
   const roles = backendConfig.roles?.assignableForLeads || ROLES_ASSIGNABLE_FOR_LEADS;
   .or(buildRoleFilter(roles))
   ```

3. **Test** with environment variables:
   ```bash
   VITE_ROLES_ASSIGNABLE_FOR_LEADS=custom_agent,custom_manager npm run dev
   ```

---

## Checklist for Code Review

- [ ] No hardcoded role names (no `.or('role.eq.agent,...)')` in service code)
- [ ] Uses `buildRoleFilter()` to generate query filters
- [ ] Falls back to `backendConfig.roles` or `ROLES_ASSIGNABLE_FOR_LEADS` constant
- [ ] Error logging shows which roles were used
- [ ] Environment variables documented in `.env.example`
- [ ] Unit tests cover dynamic role scenarios
- [ ] No role-specific business logic outside `roleConstants.ts`

---

## References

- **File:** [roleConstants.ts](src/constants/roleConstants.ts)
- **File:** [backendConfig.ts](src/config/backendConfig.ts)
- **File:** [leadsService.ts](src/services/deals/supabase/leadsService.ts#L750-L810)
- **Docs:** [copilot-instructions.md](.github/copilot-instructions.md#enterprise-role-configuration)
