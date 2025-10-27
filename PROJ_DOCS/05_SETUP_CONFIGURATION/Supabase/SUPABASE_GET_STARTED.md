# 🚀 Local Supabase - Get Started Guide

**Your local Supabase is now configured and ready to use!**

This guide will have you up and running in **5 minutes**.

---

## ⚡ 5-Minute Quick Start

### Step 1: Install Docker (if you don't have it)

Download and install Docker Desktop:
- **Windows/Mac:** https://www.docker.com/products/docker-desktop
- **Linux:** Use package manager or https://docs.docker.com/install/

Docker Desktop includes Docker Engine + Docker Compose.

### Step 2: Install Supabase CLI

```powershell
npm install -g supabase
```

Verify installation:
```powershell
supabase --version
```

### Step 3: Initialize Local Supabase (First Time Only)

In your project root directory:

```powershell
supabase init
```

This creates:
- `supabase/config.toml` - Configuration file
- `supabase/migrations/` - Database schemas
- `supabase/seed.sql` - Sample data (optional)

### Step 4: Start Local Supabase

```powershell
supabase start
```

**This will take 2-3 minutes on first run.**

You should see:
```
Started supabase local development server.

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:5432/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
```

**Keep this terminal open!** Supabase runs in the background.

### Step 5: Start Your CRM App (In a New Terminal)

```powershell
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in 150 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help

✅ Supabase client initialized
✅ Configuration valid
```

### Step 6: Open Your App

Open in browser:
```
http://localhost:5173
```

**Done! 🎉 You're ready to develop!**

---

## 📚 Next: Understanding the Setup

### What's Running?

```
YOUR COMPUTER
├─ Terminal 1: supabase start
│  ├─ PostgreSQL database (localhost:5432)
│  ├─ Supabase API (localhost:54321)
│  ├─ Supabase Studio (localhost:54323) ← Manage database here
│  └─ Inbucket (localhost:54324) ← Test emails here
│
└─ Terminal 2: npm run dev
   └─ Your React app (localhost:5173)
```

### Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Your CRM App |
| http://localhost:54321 | API Endpoint |
| http://localhost:54323 | Database Management (Studio) |
| http://localhost:54324 | Email Testing |

### Configuration

Your `.env` file is already configured:

```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

Everything points to your local Supabase instance!

---

## 🗄️ Create Your First Table

### Via Studio (Recommended)

1. Open http://localhost:54323
2. Click **"New Table"** button
3. Fill in table name: `customers`
4. Add columns:
   - `id` (Type: Serial) - Primary Key ✓
   - `name` (Type: Text)
   - `email` (Type: Text)
   - `phone` (Type: Text)
   - `created_at` (Type: Timestamp) - Default: now()
   - `updated_at` (Type: Timestamp) - Default: now()
5. Click **"Save"**

Done! Table created in PostgreSQL.

### Via SQL (Alternative)

1. Open Studio: http://localhost:54323
2. Click **"SQL Editor"**
3. Paste:

```sql
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all" ON customers FOR SELECT USING (true);
```

4. Click **"Execute"**

### Insert Sample Data

```sql
INSERT INTO customers (name, email, phone) VALUES
('John Doe', 'john@example.com', '555-1234'),
('Jane Smith', 'jane@example.com', '555-5678'),
('Bob Johnson', 'bob@example.com', '555-9012');
```

Execute it in Studio → You have data! ✅

---

## 🔌 Connect Your React Component

### Example: Fetch Customers

```typescript
// src/pages/Customers.tsx
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/services/supabase'

export function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const client = getSupabaseClient()
        const { data, error } = await client
          .from('customers')
          .select('*')
        
        if (error) throw error
        setCustomers(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Customers</h1>
      <ul>
        {customers.map(customer => (
          <li key={customer.id}>
            {customer.name} - {customer.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**That's it!** The component automatically connects to your local Supabase.

---

## 🔄 Real-Time Updates

Want live updates when data changes?

```typescript
useEffect(() => {
  const client = getSupabaseClient()
  
  // Subscribe to changes
  const channel = client
    .channel('public:customers')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'customers' },
      (payload) => {
        console.log('Change detected:', payload)
        // Update state here
        setCustomers(prev => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [])
```

Now when anyone inserts/updates/deletes data, ALL users see the changes instantly! ⚡

---

## 🎯 Common Tasks

### Add a Record

```typescript
const { data, error } = await client.from('customers').insert({
  name: 'New Customer',
  email: 'new@example.com',
  phone: '555-0000'
})
```

### Update a Record

```typescript
const { data, error } = await client.from('customers')
  .update({ name: 'Updated Name' })
  .eq('id', 1)
```

### Delete a Record

```typescript
const { data, error } = await client.from('customers')
  .delete()
  .eq('id', 1)
```

### Search

```typescript
const { data, error } = await client.from('customers')
  .select()
  .ilike('name', '%john%')  // Case-insensitive search
```

### Pagination

```typescript
const { data, error } = await client.from('customers')
  .select()
  .range(0, 9)  // Get first 10 records
```

---

## 📊 Database Management

### Access via Different Tools

**Via Studio (Easiest)**
```
http://localhost:54323
```

**Via pgAdmin (Advanced)**
```powershell
docker run -p 5050:80 dpage/pgadmin4
# Open http://localhost:5050
# Login: admin@admin.com / admin
```

**Via DBeaver (Professional)**
- Download: https://dbeaver.io
- Connect to: localhost:5432
- Database: postgres
- User: postgres
- Password: postgres

---

## ✅ Verify Everything Works

### Check 1: Supabase Running

```powershell
supabase status
```

You should see URLs for all services.

### Check 2: Database Connected

```powershell
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/postgres

# List tables
\dt

# Exit
\q
```

### Check 3: App Connected

In browser DevTools (F12 → Console):
```javascript
import { getSupabaseClient } from '@/services/supabase'
const client = getSupabaseClient()
console.log('✅ Connected!', client)
```

You should see the Supabase client object.

### Check 4: Query Works

```javascript
const { data } = await client.from('customers').select()
console.log('✅ Data:', data)
```

You should see your customer records.

---

## 🛑 Stop/Restart Services

### Stop Services (When Done for Day)

```powershell
supabase stop
```

This stops all Docker containers but preserves your data.

### Restart Services

```powershell
supabase start
```

Your data is still there! ✅

### Reset Everything (⚠️ Deletes All Data)

```powershell
supabase db reset
```

Completely resets database to initial state.

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop
```powershell
# On Windows: Click Start, search "Docker Desktop", open it
# Then retry: supabase start
```

### "Port 54321 already in use"

**Solution:** Kill the process
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 54321).OwningProcess | Stop-Process -Force
supabase start
```

### "Supabase won't start"

**Solution:** Full reset
```powershell
supabase stop
docker system prune -a
supabase start
```

### "Can't connect from app"

**Solution:** Check .env file
```bash
# Should be:
VITE_SUPABASE_URL=http://localhost:54321
VITE_API_MODE=supabase

# Then restart:
npm run dev
```

---

## 📚 Documentation Files

- **This file:** `SUPABASE_GET_STARTED.md` ← You are here
- **Setup details:** `LOCAL_SUPABASE_SETUP.md`
- **Quick commands:** `SUPABASE_QUICK_REFERENCE.md`
- **Architecture:** `LOCAL_SUPABASE_ARCHITECTURE.md`
- **Progress tracking:** `IMPLEMENTATION_PROGRESS_SUPABASE.md`

---

## 🎓 Next Steps

### Now (Today)
1. ✅ Complete this guide
2. ✅ Create 2-3 database tables
3. ✅ Create a React component to display data
4. ✅ Test real-time updates

### This Week
1. Create all required tables for your CRM
2. Set up Row Level Security policies
3. Implement all service classes
4. Test complete CRUD operations

### Next Week
1. Implement real-time features
2. Add search and filtering
3. Optimize performance
4. Unit test services

---

## 🚀 Moving to Production

When you're ready to go live:

1. **Create cloud Supabase project**
   - Go to https://supabase.com
   - Click "New project"
   - Follow setup wizard

2. **Get credentials**
   - Project Settings → API
   - Copy Project URL and Anon Key

3. **Update .env**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-cloud-key
   ```

4. **Deploy migrations**
   ```powershell
   supabase db push
   ```

5. **Deploy app**
   ```powershell
   npm run build
   # Upload dist/ to your hosting
   ```

**That's it!** Your code doesn't change. Only config changes. 🎉

---

## 💬 Pro Tips

- **Real-time is powerful:** Use subscriptions instead of polling
- **Row Level Security is important:** Use it for multi-tenant apps
- **Migrations track schema:** Always create migrations for changes
- **Offline works too:** idb library stores data locally, syncs when online
- **No vendor lock-in:** It's just PostgreSQL + REST API

---

## 📞 Help & Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Docker Docs:** https://docs.docker.com/
- **Your Team:** Ask any questions!

---

## ✨ You're Ready!

```powershell
# Terminal 1
supabase start

# Terminal 2
npm run dev

# Browser
http://localhost:5173
```

**Welcome to local Supabase development! 🎉**

You now have:
- ✅ Real PostgreSQL database
- ✅ Real-time capabilities
- ✅ Authentication ready
- ✅ REST API working
- ✅ No cloud costs
- ✅ Offline support
- ✅ Zero internet required

**Happy coding! 🚀**

---

**Questions?** Check:
1. `LOCAL_SUPABASE_SETUP.md` - Detailed setup guide
2. `SUPABASE_QUICK_REFERENCE.md` - Command reference
3. `LOCAL_SUPABASE_ARCHITECTURE.md` - How it all works

**Stuck?** Jump to Troubleshooting section above.