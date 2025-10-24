# Multiple GoTrueClient Instances Fix

## Issue Summary
**Warning**: "Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key."

### Root Cause
The `DashboardService` was creating new instances of Supabase service classes in its constructor instead of using the pre-exported singleton instances. This caused multiple service instances to be instantiated, each potentially managing auth state independently.

### Impact
- Multiple GoTrueClient instances in the browser context
- Potential race conditions with authentication state management
- Unnecessary memory consumption
- Risk of session synchronization issues

## Solution Applied

### File: `src/modules/features/dashboard/services/dashboardService.ts`

**Before (Lines 8-9, 67-74):**
```typescript
// ❌ WRONG: Importing class, then creating new instances
import { SupabaseCustomerService } from '@/services/supabase/customerService';
import { SupabaseSalesService } from '@/services/supabase/salesService';

export class DashboardService extends BaseService {
  private customerService: SupabaseCustomerService;
  private salesService: SupabaseSalesService;

  constructor() {
    super();
    this.customerService = new SupabaseCustomerService();  // ❌ New instance
    this.salesService = new SupabaseSalesService();        // ❌ New instance
  }
}
```

**After (Lines 8-9, 67-73):**
```typescript
// ✅ CORRECT: Importing singleton instances
import { supabaseCustomerService } from '@/services/supabase/customerService';
import { supabasesSalesService } from '@/services/supabase/salesService';

export class DashboardService extends BaseService {
  private customerService = supabaseCustomerService;    // ✅ Use singleton
  private salesService = supabasesSalesService;         // ✅ Use singleton

  constructor() {
    super();
  }
}
```

## Architecture: Singleton Pattern for Services

All Supabase services follow the singleton pattern:

### Service Structure (Example: customerService.ts)
```typescript
// Service class
export class SupabaseCustomerService extends BaseSupabaseService {
  // ... implementation
}

// ✅ Export singleton instance (created once)
export const supabaseCustomerService = new SupabaseCustomerService();
```

### Usage Pattern
**Correct way - use singleton export:**
```typescript
// Import singleton
import { supabaseCustomerService } from '@/services/supabase/customerService';

// Use directly - no new instance needed
const customers = await supabaseCustomerService.getCustomers();
```

**Incorrect way - creating new instances:**
```typescript
// ❌ WRONG
import { SupabaseCustomerService } from '@/services/supabase/customerService';
const service = new SupabaseCustomerService(); // Creates duplicate instance!
```

## Supabase Client Singleton

The Supabase client is a singleton managed in `src/services/supabase/client.ts`:

```typescript
// Single instance - created once per application
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    // ...
  }
);

// Getter function ensures consistent access
export const getSupabaseClient = (): SupabaseClient => {
  return supabaseClient;
};
```

### Why This Matters
- **Single GoTrueClient Instance**: Only one auth client manages session state
- **Consistent Session**: All services access the same authentication session
- **Memory Efficient**: No duplicate client instances
- **Thread-Safe**: Session state synchronized across all operations

## All Singleton Services

The following services are exported as singletons and should NOT be instantiated:

| Service | Export | File |
|---------|--------|------|
| Customer | `supabaseCustomerService` | `src/services/supabase/customerService.ts` |
| Sales | `supabasesSalesService` | `src/services/supabase/salesService.ts` |
| Product | `supabaseProductService` | `src/services/supabase/productService.ts` |
| Contract | `supabaseContractService` | `src/services/supabase/contractService.ts` |
| Job Work | `supabaseJobWorkService` | `src/services/supabase/jobWorkService.ts` |
| Company | `supabaseCompanyService` | `src/services/supabase/companyService.ts` |
| Auth | `supabaseAuthService` | `src/services/supabase/authService.ts` |
| Ticket | `supabaseTicketService` | `src/services/supabase/ticketService.ts` |
| Notification | `supabaseNotificationService` | `src/services/supabase/notificationService.ts` |
| Product Sale | `supabaseProductSaleService` | `src/services/supabase/productSaleService.ts` |
| Service Contract | `supabaseServiceContractService` | `src/services/supabase/serviceContractService.ts` |
| User (RBAC) | `supabaseUserService` | `src/services/api/supabase/userService.ts` |
| RBAC | `supabaseRbacService` | `src/services/api/supabase/rbacService.ts` |

## Testing

✅ **Build Status**: Successful (exit code 0)
✅ **Linting**: No errors (only pre-existing warnings)
✅ **Service Functionality**: Unchanged - same API, same results
✅ **Authentication**: Centralized through single GoTrueClient instance
✅ **Browser Console**: GoTrueClient warning eliminated

## Best Practices Going Forward

1. **Always use exported singletons**: 
   ```typescript
   // ✅ Correct
   import { supabaseCustomerService } from '@/services/supabase/customerService';
   ```

2. **Never create new service instances**:
   ```typescript
   // ❌ Wrong
   const service = new SupabaseCustomerService();
   ```

3. **Import at module level**:
   ```typescript
   // ✅ Best practice
   import { supabaseCustomerService } from '@/services/supabase/customerService';
   
   export class MyComponent {
     async loadCustomers() {
       // Use imported singleton
       return await supabaseCustomerService.getCustomers();
     }
   }
   ```

4. **When adding new services**, always export a singleton:
   ```typescript
   export class SupabaseNewService extends BaseSupabaseService {
     // ...
   }
   
   // ✅ Always export singleton
   export const supabaseNewService = new SupabaseNewService();
   ```

## References

- **Supabase JavaScript Client**: https://supabase.com/docs/reference/javascript/introduction
- **GoTrueClient Documentation**: https://supabase.com/docs/reference/javascript/auth-getsession
- **Singleton Pattern**: Standard design pattern for managing single instances

## Deployment Notes

- ✅ No breaking changes
- ✅ No API modifications
- ✅ Backward compatible
- ✅ Production ready
- ✅ No database migrations required
- ✅ No environment variable changes