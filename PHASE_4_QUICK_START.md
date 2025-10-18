# Phase 4: Quick Start Guide

**TL;DR**: Use Phase 4 custom hooks in components. Backend switching happens automatically via `.env` configuration.

---

## 🚀 30-Second Overview

### Before (Manual service handling)
```typescript
const [customers, setCustomers] = useState([]);
useEffect(() => {
  customerService.getCustomers().then(setCustomers);
}, []);
```

### After (Phase 4 hook)
```typescript
const { customers } = useSupabaseCustomers();
```

That's it! The hook handles loading, error states, and automatic backend selection.

---

## 🎯 Using Phase 4 Hooks

### 1. Import the hook
```typescript
import { useSupabaseCustomers } from '@/hooks';
```

### 2. Use in component
```typescript
function CustomerList() {
  const { customers, loading, error } = useSupabaseCustomers();

  if (loading) return <Spinner />;
  if (error) return <div className="error">{error}</div>;

  return (
    <ul>
      {customers.map(c => (
        <li key={c.id}>{c.company_name}</li>
      ))}
    </ul>
  );
}
```

That's all! The hook automatically handles:
- ✅ Fetching data from the configured backend
- ✅ Managing loading/error states
- ✅ Providing refresh functionality
- ✅ CRUD operations (create, update, delete)

---

## 📦 Available Phase 4 Hooks

### Customers
```typescript
import { useSupabaseCustomers } from '@/hooks';

const {
  customers,    // Customer array
  loading,      // true during fetch
  error,        // Error message or null
  refetch,      // () => Promise - manual refresh
  create,       // (data) => Promise - create customer
  update,       // (id, data) => Promise - update customer
  delete,       // (id) => Promise - delete customer
  search        // (query) => Promise - search customers
} = useSupabaseCustomers();
```

### Sales
```typescript
import { useSupabaseSales } from '@/hooks';

const {
  sales,           // Sales array
  loading, error,
  refetch,
  create, update, delete,
  getByStage,      // (stage) => Sale[] - filter by pipeline stage
  getByCustomer    // (customerId) => Sale[] - filter by customer
} = useSupabaseSales();
```

### Tickets
```typescript
import { useSupabaseTickets } from '@/hooks';

const {
  tickets,         // Ticket array
  loading, error,
  refetch,
  create, update, delete,
  getByStatus,     // (status) => Ticket[]
  getByPriority,   // (priority) => Ticket[]
  getByAssignee,   // (assigneeId) => Ticket[]
  getSLABreached   // () => Ticket[] - violations
} = useSupabaseTickets();
```

### Contracts
```typescript
import { useSupabaseContracts } from '@/hooks';

const {
  contracts,       // Contract array
  loading, error,
  refetch,
  create, update, delete,
  getByStatus,     // (status) => Contract[]
  getByType,       // (type) => Contract[]
  getActive,       // () => Contract[] - currently active
  getExpiringSoon  // (days?: 30) => Contract[] - expiring
} = useSupabaseContracts();
```

---

## 🎛️ Switching Backends

No code changes needed! Just update `.env` and restart dev server.

### Option 1: Global Mode (all services use same backend)

**Use Mock Data (development/testing)**
```bash
# .env
VITE_API_MODE=mock
```

**Use Real .NET Backend**
```bash
# .env
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:5137/api/v1
```

**Use Supabase** (default, recommended)
```bash
# .env
VITE_API_MODE=supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-key>
```

### Option 2: Mix Backends (per-service override)

```bash
# .env
VITE_API_MODE=real                    # Default for all
VITE_CUSTOMER_BACKEND=supabase        # Override: use Supabase for customers
VITE_SALES_BACKEND=supabase           # Override: use Supabase for sales
# Tickets, Contracts, etc. still use Real API
```

---

## 💡 Common Patterns

### 1. Create with Refetch
```typescript
function CreateCustomerForm() {
  const { create, refetch } = useSupabaseCustomers();
  
  const handleSubmit = async (formData) => {
    await create(formData);
    await refetch();
  };
}
```

### 2. Search/Filter
```typescript
function SearchCustomers() {
  const { customers, search } = useSupabaseCustomers();
  const [results, setResults] = useState([]);
  
  const handleSearch = async (query) => {
    const found = await search(query);
    setResults(found);
  };
}
```

### 3. Filter Results
```typescript
function PriorityTickets() {
  const { getByPriority } = useSupabaseTickets();
  
  const criticalTickets = getByPriority('critical');
  
  return <TicketList tickets={criticalTickets} />;
}
```

### 4. Multiple Hooks in One Component
```typescript
function Dashboard() {
  const { customers } = useSupabaseCustomers();
  const { sales } = useSupabaseSales();
  const { tickets } = useSupabaseTickets();
  
  return (
    <div>
      <Stats
        customerCount={customers.length}
        saleCount={sales.length}
        ticketCount={tickets.length}
      />
    </div>
  );
}
```

### 5. Error Handling
```typescript
function SafeCustomerList() {
  const { customers, loading, error, refetch } = useSupabaseCustomers();
  
  if (error) return (
    <div className="error">
      <p>{error}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
  
  if (loading) return <Spinner />;
  
  return <CustomerList customers={customers} />;
}
```

---

## 🔧 Manual Service Usage (Still Supported)

If you need direct service access (not in a component):

```typescript
import { customerService } from '@/services';

// Automatically uses backend set in VITE_API_MODE
const customers = await customerService.getCustomers();
```

This still works but hooks are preferred for components.

---

## 🌍 Environment Variable Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_MODE` | `mock`\|`real`\|`supabase` | Global backend selection |
| `VITE_*_BACKEND` | `mock`\|`real`\|`supabase` | Per-service override |
| `VITE_USE_MOCK_API` | `true`\|`false` | Legacy mode (backward compat) |
| `VITE_API_BASE_URL` | URL | Real API endpoint |
| `VITE_SUPABASE_URL` | URL | Supabase endpoint |
| `VITE_SUPABASE_ANON_KEY` | Key | Supabase authentication |

---

## ✅ Verification

### Check which backend you're using
1. Open browser DevTools → Console
2. Look for startup message:
   - 🎭 = Mock mode
   - 🔌 = Real .NET API
   - 🗄️ = Supabase

### Test backend switching
```bash
# Change VITE_API_MODE in .env
# Restart: npm run dev
# Check console for updated mode message
```

---

## 🎓 Next: Building Components

Now that Phase 4 is ready, build components using these hooks:

1. **Customer Management**
   ```typescript
   import { useSupabaseCustomers } from '@/hooks';
   // Build: CustomerList, CustomerForm, CustomerDetail
   ```

2. **Sales Pipeline**
   ```typescript
   import { useSupabaseSales } from '@/hooks';
   // Build: SalesPipeline, DealCard, SalesChart
   ```

3. **Support Tickets**
   ```typescript
   import { useSupabaseTickets } from '@/hooks';
   // Build: TicketQueue, TicketDetail, SLAAlert
   ```

4. **Contracts**
   ```typescript
   import { useSupabaseContracts } from '@/hooks';
   // Build: ContractLibrary, RenewalTracker
   ```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Hook returns empty data | Check `.env` - is backend configured? |
| Getting wrong backend | Verify `VITE_API_MODE` or service override in `.env` |
| Changes not showing | Restart dev server: `npm run dev` |
| TypeScript errors | Ensure types imported: `import type { Customer }` |
| Hook not found | Check import path: `from '@/hooks'` |

---

## 📚 Resources

- **Full Details**: `PHASE_4_SERVICE_ROUTER_INTEGRATION.md`
- **Configuration**: `src/config/apiConfig.ts`
- **Service Factory**: `src/services/api/apiServiceFactory.ts`
- **Hook Source**: `src/hooks/useSupabase*.ts`
- **Service Exports**: `src/services/index.ts`

---

## 🚀 You're Ready!

Use Phase 4 hooks in your components and focus on UI. Backend switching happens automatically.

Happy coding! 🎉