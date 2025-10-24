# Supabase Singleton Services - Quick Reference

## 🎯 TL;DR
**Always use exported singleton instances. Never create new service instances.**

## ✅ DO THIS

### Import and Use Singleton
```typescript
// ✅ Correct way
import { supabaseCustomerService } from '@/services/supabase/customerService';

async function loadCustomers() {
  const customers = await supabaseCustomerService.getCustomers();
  return customers;
}
```

### Multiple Services in One Component
```typescript
// ✅ Import multiple singletons
import { supabaseCustomerService } from '@/services/supabase/customerService';
import { supabasesSalesService } from '@/services/supabase/salesService';
import { supabaseProductService } from '@/services/supabase/productService';

export class DashboardService {
  async getDashboardData() {
    const [customers, sales, products] = await Promise.all([
      supabaseCustomerService.getCustomers(),
      supabasesSalesService.getSales(),
      supabaseProductService.getProducts(),
    ]);
    return { customers, sales, products };
  }
}
```

### Factory Pattern (Multi-Mode Services)
```typescript
// ✅ Use factory-routed services
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
import { rbacService as factoryRbacService } from '@/services/serviceFactory';

// Factory automatically routes to mock or Supabase based on VITE_API_MODE
const customers = await factoryCustomerService.getCustomers();
const permissions = await factoryRbacService.getPermissions();
```

## ❌ DON'T DO THIS

### Creating New Instances
```typescript
// ❌ WRONG - Creates duplicate Supabase clients!
import { SupabaseCustomerService } from '@/services/supabase/customerService';

constructor() {
  this.customerService = new SupabaseCustomerService(); // ❌ NO!
}
```

### Direct Class Imports Without Singleton
```typescript
// ❌ WRONG - Always use the exported singleton
import { SupabaseCustomerService } from '@/services/supabase/customerService';
const service = new SupabaseCustomerService(); // ❌ NO!
```

### Importing Wrong Service
```typescript
// ❌ WRONG - Uses legacy mock service, not Supabase
import productService from '@/services/productService';

// This bypasses the service factory pattern and ignores VITE_API_MODE
```

## 📋 Available Singleton Services

| Import Path | Singleton Export | Usage |
|---|---|---|
| `@/services/supabase/customerService` | `supabaseCustomerService` | Customer data operations |
| `@/services/supabase/salesService` | `supabasesSalesService` | Sales records |
| `@/services/supabase/productService` | `supabaseProductService` | Product catalog |
| `@/services/supabase/contractService` | `supabaseContractService` | Contract management |
| `@/services/supabase/jobWorkService` | `supabaseJobWorkService` | Job work orders |
| `@/services/supabase/companyService` | `supabaseCompanyService` | Company data |
| `@/services/supabase/authService` | `supabaseAuthService` | Authentication |
| `@/services/supabase/ticketService` | `supabaseTicketService` | Ticket management |
| `@/services/supabase/notificationService` | `supabaseNotificationService` | Notifications |
| `@/services/supabase/productSaleService` | `supabaseProductSaleService` | Product sales |
| `@/services/supabase/serviceContractService` | `supabaseServiceContractService` | Service contracts |
| `@/services/api/supabase/userService` | `supabaseUserService` | User management |
| `@/services/api/supabase/rbacService` | `supabaseRbacService` | Role-based access |

## 🔌 Common Service Methods

### Customer Service
```typescript
import { supabaseCustomerService } from '@/services/supabase/customerService';

// Get all customers
const customers = await supabaseCustomerService.getCustomers();

// Get single customer
const customer = await supabaseCustomerService.getCustomer(id);

// Create customer
const newCustomer = await supabaseCustomerService.createCustomer(data);

// Update customer
await supabaseCustomerService.updateCustomer(id, data);

// Delete customer
await supabaseCustomerService.deleteCustomer(id);
```

### Sales Service
```typescript
import { supabasesSalesService } from '@/services/supabase/salesService';

// Get all sales
const sales = await supabasesSalesService.getSales();

// Get sales by status
const wonSales = await supabasesSalesService.getSales({ status: 'won' });

// Create sale
const newSale = await supabasesSalesService.createSale(data);

// Update sale
await supabasesSalesService.updateSale(id, data);
```

### RBAC Service
```typescript
import { rbacService as factoryRbacService } from '@/services/serviceFactory';

// Get permissions
const permissions = await factoryRbacService.getPermissions();

// Get roles
const roles = await factoryRbacService.getRoles();

// Get permission matrix
const matrix = await factoryRbacService.getPermissionMatrix();

// Assign role to user
await factoryRbacService.assignUserRole(userId, roleId);
```

## 🚨 Common Mistakes

### Mistake 1: Creating New Instance in Constructor
```typescript
// ❌ WRONG
constructor() {
  this.service = new SupabaseCustomerService();
}

// ✅ CORRECT
private service = supabaseCustomerService;

constructor() {
  // No need to create new instance
}
```

### Mistake 2: Not Using Factory for Multi-Mode Services
```typescript
// ❌ WRONG - Only works with Supabase, ignores mock mode
import { supabaseCustomerService } from '@/services/supabase/customerService';

// ✅ CORRECT - Works with both mock and Supabase
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
```

### Mistake 3: Storing Service in State
```typescript
// ❌ WRONG - Service is singleton, should not be in state
const [service] = useState(() => new SupabaseCustomerService());

// ✅ CORRECT - Import and use directly
import { supabaseCustomerService } from '@/services/supabase/customerService';

const handleLoad = async () => {
  const data = await supabaseCustomerService.getCustomers();
  setCustomers(data);
};
```

## 🔍 Checking for Issues

### Is GoTrueClient Warning Appearing?
```bash
# Check browser console for:
# "Multiple GoTrueClient instances detected"
```

**Fix**: Replace `new ServiceClass()` with singleton import

### Is Authentication State Not Syncing?
**Likely cause**: Creating new service instances  
**Fix**: Use singleton imports consistently

### Is Memory Usage High?
**Likely cause**: Multiple service instances  
**Fix**: Use factory exports or singleton imports

## 📚 Related Documentation

- See `GOTRUECLIENT_SINGLETON_FIX.md` for detailed explanation
- See repo.md for service factory pattern details
- See individual service files for API documentation

## ⚡ Performance Impact

- ✅ Single Supabase client instance
- ✅ Shared authentication state
- ✅ Reduced memory footprint
- ✅ Eliminated session race conditions
- ✅ Faster service initialization

## 🎓 Learning Resources

1. **Singleton Pattern**: Only one instance exists per application
2. **Module-level imports**: Services instantiated when module loads
3. **Service factory**: Routes calls based on `VITE_API_MODE`
4. **Supabase client**: Manages auth, database, realtime connections

---

**Last Updated**: 2024  
**Status**: Production Ready ✅