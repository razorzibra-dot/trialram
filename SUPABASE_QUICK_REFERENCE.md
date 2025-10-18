# 🚀 Local Supabase Quick Reference Card

## ⚡ 30-Second Setup

```powershell
# Terminal 1: Start Supabase (runs in background)
supabase start

# Terminal 2: Start development server
npm run dev

# Done! 🎉
```

---

## 🌐 Local URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | http://localhost:5173 | Your CRM application |
| **API** | http://localhost:54321 | REST/GraphQL endpoints |
| **Studio** | http://localhost:54323 | Database management UI |
| **Inbucket** | http://localhost:54324 | Email testing |
| **Database** | localhost:5432 | Direct PostgreSQL access |

---

## 🗄️ Database Credentials

```
Host:     localhost
Port:     5432
Database: postgres
User:     postgres
Password: postgres
```

**Tool Access:**
```powershell
# pgAdmin
docker run -p 5050:80 dpage/pgadmin4
# Login: admin@admin.com / admin

# DBeaver (GUI)
# Download and connect to localhost:5432
```

---

## 📋 Essential Commands

### Start/Stop Services

```powershell
# Start services (runs in background)
supabase start

# Stop services
supabase stop

# Restart services
supabase stop
supabase start

# View status
supabase status

# View real-time logs
supabase logs

# Follow specific service logs
supabase logs --follow postgres
supabase logs --follow api
```

---

### Database Management

```powershell
# Reset entire database (⚠️ deletes all data)
supabase db reset

# Create migration file
supabase migration new <migration_name>

# Apply pending migrations
supabase migration up

# View migration history
supabase migration list
```

---

### Development Workflow

```powershell
# 1. Make database changes in Studio
# http://localhost:54323

# 2. Create migration from changes
supabase db pull

# 3. Start dev server
npm run dev

# 4. Test in browser
# http://localhost:5173
```

---

## 🔍 Verify Connection in Browser

### Browser Console Test

```javascript
// Paste into browser DevTools Console (F12 → Console tab)

import { getSupabaseClient } from '@/services/supabase'

const client = getSupabaseClient()
console.log('✅ Client ready:', client)

// Try a query
const { data, error } = await client
  .from('table_name')
  .select('*')
  .limit(1)

console.log('Data:', data)
console.log('Error:', error)
```

### API Test with curl

```powershell
# Get all records from a table
curl -X GET "http://localhost:54321/rest/v1/table_name?limit=10" `
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MTk4NjEyMzIwMH0.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM"

# Or use the full anon key from .env
# VITE_SUPABASE_ANON_KEY=...
```

---

## 🛠️ Troubleshooting

### Port Already in Use

```powershell
# Kill process on port
Get-Process -Id (Get-NetTCPConnection -LocalPort 54321).OwningProcess | Stop-Process -Force

# Change port in supabase/config.toml:
# [api]
# port = 54321  ← change this number
```

### Docker Not Running

```powershell
# Start Docker Desktop
# Windows: Click Windows Start, search "Docker Desktop"
# WSL2: wsl.exe -l -v  # Check version

# Or use Docker CLI
docker system prune -a
supabase start
```

### Supabase Won't Start

```powershell
# Full reset
supabase stop
docker system prune -a --volumes
supabase start

# Check Docker containers
docker ps

# Check Docker logs
docker logs supabase_postgres
docker logs supabase_api
```

### Connection Refused

```powershell
# 1. Check Supabase is running
supabase status

# 2. Check if .env is correct
cat .env | grep VITE_SUPABASE

# Expected:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_API_MODE=supabase

# 3. Restart dev server
npm run dev
```

---

## 📁 Important Files

```
.env
├── VITE_SUPABASE_URL=http://localhost:54321
├── VITE_SUPABASE_ANON_KEY=...
├── VITE_API_MODE=supabase
└── (other configuration)

supabase/
├── config.toml              # ← Local Supabase configuration
├── migrations/              # ← Database schemas
│   └── 20240115000000_init.sql
└── seed.sql                 # ← Sample data (optional)

src/
├── services/supabase/
│   ├── client.ts            # ← Connects to localhost:54321
│   ├── baseService.ts
│   └── ...
└── config/
    └── backendConfig.ts     # ← Reads VITE_SUPABASE_* from .env
```

---

## 🔐 Environment Variables

### Development (Local)
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_KEY=eyJ...
```

### Production (Cloud)
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-cloud-key>
VITE_SUPABASE_SERVICE_KEY=<your-service-key>
```

### Switch Backends
```bash
# Use Mock (hardcoded data)
VITE_API_MODE=mock

# Use Real .NET API
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:5137/api/v1

# Use Supabase
VITE_API_MODE=supabase
```

---

## 📊 Common SQL Queries

### View All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Create Table
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

CREATE POLICY "Enable read for all" ON customers 
  FOR SELECT USING (true);
```

### Insert Sample Data
```sql
INSERT INTO customers (name, email, phone) VALUES
('John Doe', 'john@example.com', '555-1234'),
('Jane Smith', 'jane@example.com', '555-5678');
```

### Check Row Level Security
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'customers';
```

---

## 🎯 Common Tasks

### Add Authentication
1. Open http://localhost:54323 (Studio)
2. Go to **Auth** → **Users**
3. Click **New User**
4. Set email & password

```javascript
// Sign in from your app
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Create Database Table
1. Open http://localhost:54323 (Studio)
2. Click **SQL Editor**
3. Paste SQL code
4. Click **Execute**

### Subscribe to Real-Time Changes
```javascript
import { getSupabaseClient } from '@/services/supabase'

const client = getSupabaseClient()

client
  .channel('public:customers')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'customers' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe()
```

### Upload Files
```javascript
const { data, error } = await client.storage
  .from('documents')
  .upload('filename.pdf', file)
```

---

## 📚 Next Steps

1. ✅ **Setup Complete** → Local Supabase is running
2. 📋 **Create Tables** → Use Studio at http://localhost:54323
3. 🔌 **Connect Services** → Implement supabase/customerService.ts, etc.
4. 🧪 **Test** → Use browser console or API calls
5. 🚀 **Deploy** → Update credentials for production

---

## 🔗 Quick Links

- **Documentation:** LOCAL_SUPABASE_SETUP.md
- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Status Page:** http://localhost:54323

---

## 💡 Pro Tips

- **Real-time is ON** by default (cool for live updates!)
- **Offline mode is ON** - app works without internet
- **Row Level Security** use for multi-tenant apps
- **Migrations** keep your schema version controlled
- **Seed data** use `supabase/seed.sql` for test data

---

**Keep this page bookmarked! 🔖**