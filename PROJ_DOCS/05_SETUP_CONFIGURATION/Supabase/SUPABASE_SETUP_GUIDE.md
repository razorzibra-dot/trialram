# 🚀 Running CRM Application with Supabase

## Quick Start (5 minutes)

### ✅ Step 1: Verify Configuration

Your `.env` is already configured for Supabase! Check these settings:

```bash
VITE_API_MODE=supabase                    # ✓ Already set
VITE_SUPABASE_URL=http://localhost:54321  # ✓ Local Supabase
VITE_SUPABASE_ENABLE_REALTIME=true        # ✓ Real-time enabled
```

### ✅ Step 2: Start Supabase (Option A - Local Development)

#### A. Using Supabase CLI

**If you have Supabase CLI installed:**

```bash
# 1. Start local Supabase instance
supabase start

# Output should show:
# ✓ Started supabase local development setup
# ✓ Postgres database: postgresql://...
# ✓ Supabase API: http://localhost:54321
```

**If Supabase CLI is not installed:**

```bash
# Install globally
npm install -g supabase

# Then run
supabase start
```

#### B. Using Docker Compose

```bash
# If you prefer Docker
docker-compose -f docker-compose.local.yml up -d
```

### ✅ Step 3: Start the Development Server

```bash
# Terminal 1: Keep Supabase running (if using CLI)
supabase start

# Terminal 2: Start the application
npm run dev

# You should see:
# ✓ VITE v4.5.14  ready in 615 ms
# ✓ Local:   http://localhost:5000/
```

### ✅ Step 4: Access the Application

Open your browser:
```
http://localhost:5000
```

You should see the CRM application loading with data from local Supabase! 🎉

---

## 📊 Verifying Supabase Connection

### Check Backend Mode in Browser Console

1. Open DevTools: `F12`
2. Go to **Console** tab
3. Look for startup message:
   ```
   🗄️  API Mode: supabase
   🗄️  Supabase URL: http://localhost:54321
   ```

### Test API Calls

```bash
# Terminal
curl http://localhost:54321/rest/v1/customers \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 🔄 Switching Backends (No Code Changes!)

### Quick Switch Between Mock / Real / Supabase

**Edit `.env`:**
```bash
# Development with Mock Data
VITE_API_MODE=mock

# Development with Real .NET Backend
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:5137/api/v1

# Production with Supabase (Default)
VITE_API_MODE=supabase
VITE_SUPABASE_URL=http://localhost:54321
```

**Then restart:**
```bash
npm run dev
```

---

## 📚 Available Features

### Real-Time Data
✅ Customers updates live across users  
✅ Sales opportunities sync instantly  
✅ Support tickets update in real-time  
✅ Contract changes broadcast immediately  

### CRUD Operations
✅ Create new records  
✅ Update existing data  
✅ Delete items  
✅ Search/filter capabilities  

### Component Integration
✅ Use custom hooks for data access  
✅ No manual state management  
✅ Automatic error handling  

---

## 🛠️ Using Phase 4 Hooks

Now that Supabase is running, use these hooks in your components:

```typescript
// src/components/CustomerList.tsx
import { useSupabaseCustomers } from '@/hooks';

function CustomerList() {
  const { customers, loading, error, create, update, delete: deleteCustomer } = useSupabaseCustomers();

  if (loading) return <div>Loading customers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Customers ({customers.length})</h2>
      <ul>
        {customers.map(customer => (
          <li key={customer.id}>
            {customer.company_name}
            <button onClick={() => deleteCustomer(customer.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomerList;
```

---

## 📋 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Supabase not starting** | Check if port 54321 is available; kill existing process |
| **Connection refused** | Run `supabase start` first in Terminal 1 |
| **Empty data** | Verify migrations ran: `supabase db list` |
| **Slow performance** | Check network tab; verify Supabase is running |
| **TypeError: Cannot read properties** | Clear browser cache; reload page |
| **Real-time not working** | Check `VITE_SUPABASE_ENABLE_REALTIME=true` |

---

## 🔐 Environment Setup

### Local Development (Default - Already Configured ✓)
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Local default key
```

### Cloud Deployment (Future)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-cloud-key
VITE_SUPABASE_SERVICE_KEY=your-service-key
```

---

## 📊 Database Migrations

Migrations are automatically applied when Supabase starts:

```
supabase/migrations/
├── 20250101000001_init_tenants_and_users.sql       ✓
├── 20250101000002_master_data_companies_products.sql ✓
├── 20250101000003_crm_customers_sales_tickets.sql   ✓
├── 20250101000004_contracts.sql                     ✓
├── 20250101000005_advanced_product_sales_jobwork.sql ✓
├── 20250101000006_notifications_and_indexes.sql    ✓
└── 20250101000007_row_level_security.sql           ✓
```

All tables, indexes, and security policies are configured automatically! 🎯

---

## 🚀 You're Ready!

✅ Configuration complete  
✅ Dev server running  
✅ Supabase connected  
✅ Real-time enabled  
✅ Phase 4 hooks available  

**Start building components with Phase 4 hooks and watch real-time data sync!** 🎉

---

## 📞 Quick Commands

```bash
# Start everything
supabase start
npm run dev

# View Supabase Studio (Data Explorer)
supabase studio

# Stop Supabase
supabase stop

# Reset database
supabase db reset

# View logs
supabase functions list
```

---

## 📖 Documentation

- **Quick Start**: `PHASE_4_QUICK_START.md`
- **Full Guide**: `PHASE_4_SERVICE_ROUTER_INTEGRATION.md`
- **API Reference**: `API_QUICK_REFERENCE.md`
- **Architecture**: `ARCHITECTURE_VISUAL_GUIDE.md`