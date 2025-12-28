# Enterprise Role Configuration - Quick Reference Card

**🔴 CRITICAL RULE:** Never hardcode role names in service code. Roles are configurable and can change.

---

## ✅ DO THIS (Correct Pattern)

### Step 1: Import
```typescript
import { buildRoleFilter, ROLES_ASSIGNABLE_FOR_LEADS } from '@/constants/roleConstants';
import backendConfig from '@/config/backendConfig';
```

### Step 2: Use Dynamic Configuration
```typescript
const assignableRoles = backendConfig.roles?.assignableForLeads || ROLES_ASSIGNABLE_FOR_LEADS;

const { data: users, error } = await supabase
  .from('users')
  .select('id, name, role')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')
  .or(buildRoleFilter(assignableRoles));  // ✅ DYNAMIC
```

### Step 3: Error Handling
```typescript
if (error) {
  console.error('[Service] Error fetching users with roles:', {
    error: error.message,
    configuredRoles: assignableRoles,  // ✅ Log what was configured
    timestamp: new Date().toISOString()
  });
  throw error;
}
```

---

## ❌ DON'T DO THIS (Wrong Pattern)

### ❌ WRONG #1: Hardcoded Role Names
```typescript
.or('role.eq.agent,role.eq.manager,role.eq.admin')  // 🔴 BREAKS if roles change
```

### ❌ WRONG #2: String Interpolation
```typescript
.or(`role.eq.${role1},role.eq.${role2}`)  // 🔴 Fragile, no constants
```

### ❌ WRONG #3: No Fallback
```typescript
const roles = backendConfig.roles?.assignableForLeads;  // 🔴 Crashes if undefined
.or(buildRoleFilter(roles));
```

### ❌ WRONG #4: No Error Logging
```typescript
if (error) throw error;  // 🔴 Doesn't show which roles were configured
```

---

## Configuration Sources (Priority Order)

### 1️⃣ Runtime (Highest Priority)
```typescript
// In SessionConfigContext or SessionManager
sessionConfig?.roleConfig?.assignableForLeads
```

### 2️⃣ Environment Variables
```bash
# .env file
VITE_ROLES_ASSIGNABLE_FOR_LEADS=agent,manager,admin,super_admin
VITE_ROLES_ASSIGNABLE_FOR_DEALS=agent,manager,admin,super_admin
VITE_ROLES_ASSIGNABLE_FOR_TICKETS=agent,manager,admin,super_admin
```

### 3️⃣ Code Constants (Fallback)
```typescript
// src/constants/roleConstants.ts
export const ROLES_ASSIGNABLE_FOR_LEADS = [
  'agent', 'manager', 'admin', 'super_admin'
];
```

---

## Helper Functions Reference

### `buildRoleFilter(roles: string[]): string`
Converts role array to Supabase `.or()` filter syntax.

```typescript
buildRoleFilter(['agent', 'manager', 'admin'])
// Returns: 'role.eq.agent,role.eq.manager,role.eq.admin'
```

### `isRoleAssignableForLeads(role: string, allowedRoles?: string[]): boolean`
Check if a role is assignable for leads.

```typescript
isRoleAssignableForLeads('agent')  // true
isRoleAssignableForLeads('viewer')  // false
```

---

## Template: New Auto-Assign Feature

```typescript
async autoAssignEntity(id: string): Promise<EntityDTO> {
  try {
    // 1. Get current user context
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    
    const tenantId = this.getTenantId(user);
    if (!tenantId) throw new Error('Tenant missing');
    
    // 2. Fetch the entity
    const entity = await this.getEntity(id);
    if (entity.assignedTo) {
      console.log('[Service] Entity already assigned:', id);
      return entity;
    }
    
    // ✅ 3. CRITICAL: Use dynamic role configuration
    const assignableRoles = backendConfig.roles?.assignableFor[entity] || ROLES_ASSIGNABLE_FOR_ENTITY;
    
    if (!assignableRoles || assignableRoles.length === 0) {
      throw new Error('[Service] No assignable roles configured');
    }
    
    console.log('[Service] Fetching assignees for roles:', assignableRoles);
    
    // 4. Fetch eligible assignees using dynamic roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .or(buildRoleFilter(assignableRoles));  // ✅ Dynamic!
    
    if (error) {
      console.error('[Service] Error fetching assignees:', {
        error: error.message,
        configuredRoles: assignableRoles  // ✅ Log config
      });
      throw error;
    }
    
    if (!users || users.length === 0) {
      console.warn('[Service] No assignees found for roles:', assignableRoles);
      throw new Error('No available assignees');
    }
    
    // 5. Apply load-balancing logic
    const assignedUserId = this.selectLeastLoadedUser(users);
    
    console.log('[Service] Auto-assigning:', {
      entityId: id,
      assignedTo: assignedUserId,
      availableUsers: users.length,
      configuredRoles: assignableRoles
    });
    
    // 6. Update and return
    return this.updateEntity(id, { assignedTo: assignedUserId });
  } catch (error) {
    console.error('[Service] Error auto-assigning entity:', error);
    throw error;
  }
}
```

---

## Testing Your Role Configuration

### 1. Manual Testing
```bash
# Start dev server
npm run dev

# Check console on startup
# Should see: "[BackendConfig] ✅ Configuration valid"
# Check assigned roles in logs

# Change role in .env
VITE_ROLES_ASSIGNABLE_FOR_LEADS=custom_agent,custom_manager

# Restart server
# Should use new roles without code changes
```

### 2. Unit Test
```typescript
describe('Role Configuration', () => {
  it('should build correct filter from role array', () => {
    const filter = buildRoleFilter(['agent', 'manager']);
    expect(filter).toBe('role.eq.agent,role.eq.manager');
  });
  
  it('should handle custom roles', () => {
    const customRoles = ['sales_agent', 'team_lead'];
    const filter = buildRoleFilter(customRoles);
    expect(filter).toBe('role.eq.sales_agent,role.eq.team_lead');
  });
});
```

### 3. Integration Test
```typescript
describe('Auto-assign with dynamic roles', () => {
  it('should use configured roles', async () => {
    process.env.VITE_ROLES_ASSIGNABLE_FOR_LEADS = 'agent,supervisor';
    
    const service = new SupabaseLeadsService();
    const assigned = await service.autoAssignLead('lead-123');
    
    expect(assigned.assignedTo).toBeDefined();
  });
});
```

---

## Debugging Role Configuration Issues

### Issue: "No available assignees to assign entity"
```typescript
// Check what roles were configured
console.log('Configured roles:', assignableRoles);
// Check .env file
cat .env | grep VITE_ROLES

// Verify roles exist in database
SELECT DISTINCT role FROM users WHERE tenant_id = 'your-tenant';

// Fix: Update roles in .env or backendConfig.ts
```

### Issue: Role name changed, auto-assign stopped working
```typescript
// ✅ CORRECT FIX: Update .env
VITE_ROLES_ASSIGNABLE_FOR_LEADS=new_agent_name,new_manager_name

// ❌ WRONG: Don't change service code
// Service code should never mention specific role names!
```

### Issue: Logs show empty role array
```typescript
// Check if backendConfig loaded properly
console.log('backendConfig.roles:', backendConfig.roles);

// Check if environment variables set
console.log('VITE_ROLES_ASSIGNABLE_FOR_LEADS:', process.env.VITE_ROLES_ASSIGNABLE_FOR_LEADS);

// Check fallback constants are imported
import { ROLES_ASSIGNABLE_FOR_LEADS } from '@/constants/roleConstants';
```

---

## File References

| File | Purpose |
|------|---------|
| [roleConstants.ts](src/constants/roleConstants.ts) | All role constants & helpers |
| [backendConfig.ts](src/config/backendConfig.ts) | Load from environment variables |
| [leadsService.ts](src/services/deals/supabase/leadsService.ts#L725) | Canonical implementation example |
| [copilot-instructions.md](.github/copilot-instructions.md#enterprise-role-configuration) | Full documentation |
| [DYNAMIC_ROLES_ENTERPRISE_FIX.md](DYNAMIC_ROLES_ENTERPRISE_FIX.md) | Detailed guide |
| [HARDCODED_ROLES_AUDIT_COMPLETE.md](HARDCODED_ROLES_AUDIT_COMPLETE.md) | Audit results |

---

## Key Takeaways

🔴 **NEVER** hardcode role names in service code  
🟢 **ALWAYS** use `roleConstants.ts` and `backendConfig.roles`  
🔵 **ALWAYS** use `buildRoleFilter()` to generate query filters  
🟡 **ALWAYS** add error logging showing configured roles  
⚪ **ALWAYS** fall back to constants if config is missing  

---

## Get Help

- See [leadsService.ts](src/services/deals/supabase/leadsService.ts#L725-L815) for working example
- Read [Enterprise Role Configuration](copilot-instructions.md#enterprise-role-configuration) section in copilot-instructions.md
- Check [DYNAMIC_ROLES_ENTERPRISE_FIX.md](DYNAMIC_ROLES_ENTERPRISE_FIX.md) for detailed patterns
- Ask about this in code review if unsure

**Remember:** If you see hardcoded role names anywhere in service code, that's a code review blocker! ⛔
