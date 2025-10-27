# 🎯 GET STARTED - Running with Supabase

## ⚡ Quick 3-Step Setup (2 minutes)

### Step 1️⃣: Install Supabase CLI (One-time)
```bash
npm install -g supabase
```

### Step 2️⃣: Start Supabase Backend
```bash
supabase start
```

**Expected output:**
```
✓ Started supabase local development setup
✓ Postgres database: postgresql://...
✓ Supabase API: http://localhost:54321
✓ Supabase Studio: http://localhost:54323
```

### Step 3️⃣: Start Development Server (New Terminal)
```bash
npm run dev
```

**Expected output:**
```
✓ VITE v4.5.14  ready in 615 ms
✓ Local:   http://localhost:5000/
```

---

## ✅ Verify Everything Works

### 1. Check Backend Connection
- Open browser: `http://localhost:5000`
- Open DevTools Console (F12)
- Look for: `🗄️  API Mode: supabase`

### 2. Test Real-Time Updates
- Open two browser tabs with the application
- Create/update a customer in Tab 1
- See it appear in Tab 2 instantly! ✨

### 3. API Status Check
```bash
# Should return customer data
curl http://localhost:54321/rest/v1/customers \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

---

## 🚀 Using the Application

### Available Modules (All Powered by Supabase)

| Module | Status | Features |
|--------|--------|----------|
| 👥 Customers | ✅ Live | Create, Update, Delete, Search |
| 📊 Sales | ✅ Live | Pipeline, Stages, Deals |
| 🎫 Tickets | ✅ Live | Support Queue, SLA Tracking |
| 📋 Contracts | ✅ Live | Lifecycle, Renewals |
| 👤 Auth | ✅ Live | JWT, Multi-tenant |
| 🔔 Notifications | ✅ Live | Real-time Events |

### Building Components with Phase 4 Hooks

```typescript
// Any component file
import { useSupabaseCustomers } from '@/hooks';

export function MyComponent() {
  const { customers, loading, error, create, update, delete: deleteCustomer } = useSupabaseCustomers();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Customers: {customers.length}</h2>
      {/* Your UI here */}
    </div>
  );
}
```

---

## 🔧 Convenient Startup Scripts

### PowerShell Script (Recommended for Windows)
```bash
./start-supabase.ps1
```

### Batch Script (Alternative)
```bash
.\start-supabase.bat
```

Both scripts will:
✓ Check dependencies  
✓ Verify configuration  
✓ Start Supabase  
✓ Start dev server  

---

## 📊 What's Already Configured

✅ **Database**
- All tables created: customers, sales, tickets, contracts, users, etc.
- Indexes optimized for performance
- Row-level security enabled

✅ **Real-Time**
- Subscriptions configured
- Automatic sync across browsers
- Change detection enabled

✅ **Authentication**
- JWT-based auth
- Multi-tenant support
- User roles: admin, manager, agent, engineer, customer

✅ **API Mode**
- Set to `supabase` in `.env`
- Ready to use immediately

---

## 🎛️ Switching Backends (No Code Changes!)

### Change Backend in `.env`

**For Mock Data:**
```bash
VITE_API_MODE=mock
```

**For Real .NET Backend:**
```bash
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:5137/api/v1
```

**For Supabase (Default):**
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=http://localhost:54321
```

Then restart: `npm run dev`

---

## 🛠️ Common Operations

### View Supabase Studio (Data Explorer)
```bash
supabase studio
# Opens: http://localhost:54323
```

### Reset Database
```bash
supabase db reset
```

### Stop Supabase
```bash
supabase stop
```

### View Logs
```bash
supabase logs --project-ref local
```

---

## ❌ Troubleshooting

### "Connection refused on port 54321"
**Solution:**
```bash
supabase start  # Make sure this runs in Terminal 1
```

### "Database not initialized"
**Solution:**
```bash
supabase db reset
```

### "Cannot find module 'supabase'"
**Solution:**
```bash
npm install
```

### "Real-time not updating"
**Solution:** Check `.env`:
```bash
VITE_SUPABASE_ENABLE_REALTIME=true  # Should be enabled
```

### "Port 5000 already in use"
**Solution:**
```bash
# Change in vite.config.ts or kill the process
netstat -ano | findstr :5000  # Find process
taskkill /PID <PID> /F       # Kill it
```

---

## 📚 Full Documentation

- **Phase 4 Quick Start**: `PHASE_4_QUICK_START.md`
- **Full Integration Guide**: `PHASE_4_SERVICE_ROUTER_INTEGRATION.md`
- **Supabase Setup Details**: `SUPABASE_SETUP_GUIDE.md`
- **Architecture**: `ARCHITECTURE_VISUAL_GUIDE.md`
- **API Reference**: `API_QUICK_REFERENCE.md`

---

## 🎓 Next Steps

1. ✅ Get Supabase running (this guide)
2. ✅ Start dev server with `npm run dev`
3. ✅ Open `http://localhost:5000` in browser
4. ✅ Check browser console for `🗄️  API Mode: supabase`
5. ✅ Navigate to different modules (Customers, Sales, Tickets)
6. ✅ See data loading from Supabase in real-time
7. ✅ Build new components using Phase 4 hooks

---

## 🎉 You're Ready!

The application is now running with:
- ✅ Supabase backend (local)
- ✅ Real-time synchronization
- ✅ PostgreSQL database
- ✅ Phase 4 hooks for components
- ✅ Multi-tenant support
- ✅ Role-based access control

**Happy coding!** 🚀

---

## 💡 Pro Tips

### Tip 1: Keep Supabase Running
Keep the `supabase start` terminal open while developing. It keeps data in memory.

### Tip 2: Use Browser DevTools
Check Network tab to see real-time subscriptions and API calls.

### Tip 3: Test with Multiple Tabs
Open app in 2 tabs to see real-time sync in action!

### Tip 4: Check Supabase Studio
Visit `http://localhost:54323` to inspect/manage database directly.

### Tip 5: Review the Code
- Hooks: `src/hooks/useSupabase*.ts`
- Services: `src/services/supabase/`
- Config: `src/config/apiConfig.ts`
- Factory: `src/services/api/apiServiceFactory.ts`