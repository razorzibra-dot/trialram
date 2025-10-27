# 🚀 Local Supabase Setup Guide

## Overview

This guide walks you through setting up **local Supabase** for the PDS-CRM application. Local Supabase runs PostgreSQL and all services on your machine via Docker, perfect for development without needing cloud credentials.

---

## 📋 Prerequisites

### Required
- **Docker Desktop** (v4.0+) - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (included with Docker Desktop)
- **Node.js** (v16+) - Already installed in your project
- **Git** - For version control

### Optional
- **Supabase CLI** (for easier management)
- **pgAdmin** or **DBeaver** (for direct database inspection)

---

## ✅ Installation Steps

### Step 1: Install Supabase CLI (Recommended)

Open PowerShell in your project root and run:

```powershell
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

**Alternative (using Homebrew on Mac/WSL):**
```bash
brew install supabase/tap/supabase
```

---

### Step 2: Initialize Local Supabase Project

In your project root directory (`c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME`), run:

```powershell
# Initialize Supabase in the project
supabase init

# This creates:
# - supabase/ directory with configuration
# - .env file updates (if needed)
```

**What gets created:**
```
supabase/
├── config.toml           # Supabase CLI configuration
├── seed.sql             # Database initialization script (optional)
└── migrations/          # Database migration files
```

---

### Step 3: Start Local Supabase (Docker)

Start all services (PostgreSQL, Studio, Auth, etc.):

```powershell
# Start local Supabase (runs Docker containers)
supabase start

# This will:
# ✅ Pull necessary Docker images
# ✅ Start PostgreSQL on localhost:5432
# ✅ Start Supabase Studio on http://localhost:54323
# ✅ Start API on http://localhost:54321
# ⏳ Takes 2-3 minutes on first run
```

**Expected Output:**
```
Started supabase local development server.

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:5432/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
```

Save these URLs! You'll need them.

---

### Step 4: Get Credentials from Local Supabase

After Supabase starts, display credentials:

```powershell
# Show all credentials (JWT tokens, API keys, etc.)
supabase status

# You'll see something like:
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important Notes:**
- The local instance generates these keys automatically
- They're stored in `supabase/config.toml`
- In development, these default keys are safe to use locally

---

### Step 5: Verify .env Configuration

Your `.env` file should already be configured. **Verify:**

```bash
# Check .env file
cat .env | grep VITE_SUPABASE

# Should show:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=eyJ...
# VITE_SUPABASE_SERVICE_KEY=eyJ...
# VITE_API_MODE=supabase
```

If not configured, update manually:

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MTk4NjEyMzIwMH0.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoxOTg2MTIzMjAwfQ.NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
VITE_API_MODE=supabase
```

---

### Step 6: Start Development Server

```powershell
# Restart your dev server (if already running)
npm run dev

# You should see in console:
# ✅ Supabase client initialized
# ✅ Configuration valid
```

---

## 🎯 Quick Start Summary

```powershell
# 1. Install CLI (first time only)
npm install -g supabase

# 2. Initialize (first time only)
supabase init

# 3. Start services
supabase start

# 4. In another terminal, start app
npm run dev

# 5. Verify connection (in browser console)
import { getSupabaseClient } from '@/services/supabase'
const client = getSupabaseClient()
console.log('✅ Connected:', client)
```

---

## 🌐 Access Local Services

### Supabase Studio (Web UI)
- **URL:** http://localhost:54323
- **Purpose:** Manage tables, auth, storage, etc.
- **No login needed** for local development

### PostgreSQL Database
- **Host:** localhost
- **Port:** 5432
- **Database:** postgres
- **User:** postgres
- **Password:** postgres

### API Endpoint
- **Base URL:** http://localhost:54321
- **GraphQL:** http://localhost:54321/graphql/v1
- **REST:** http://localhost:54321/rest/v1

### Email Testing (Inbucket)
- **URL:** http://localhost:54324
- **Purpose:** View emails sent during development

---

## 📁 Directory Structure

After setup, your project includes:

```
project/
├── .env                          # Updated with local URLs
├── supabase/
│   ├── config.toml              # Local config (generated)
│   ├── seed.sql                 # Database initialization
│   └── migrations/              # Database schema files
│       └── 20240115000000_init.sql (example)
│
├── src/
│   ├── services/supabase/
│   │   ├── client.ts            # ✅ Points to localhost:54321
│   │   ├── baseService.ts
│   │   └── index.ts
│   │
│   └── config/
│       └── backendConfig.ts      # ✅ Reads VITE_SUPABASE_*
```

---

## 🔄 Common Commands

### Start Services
```powershell
supabase start
```

### Stop Services
```powershell
supabase stop
```

### Restart Services
```powershell
supabase stop
supabase start
```

### View Logs
```powershell
supabase logs
```

### View Status
```powershell
supabase status
```

### Reset Database (⚠️ Deletes all data)
```powershell
supabase db reset
```

---

## 🐛 Troubleshooting

### Issue: Docker not running
**Error:** `Cannot connect to Docker daemon`

**Solution:**
```powershell
# Start Docker Desktop manually
# Or use WSL2 backend if on Windows
```

### Issue: Port 54321 already in use
**Error:** `Bind for 127.0.0.1:54321 failed`

**Solution:**
```powershell
# Kill the process using the port
Get-Process -Id (Get-NetTCPConnection -LocalPort 54321).OwningProcess | Stop-Process -Force

# Or change the port in supabase/config.toml
```

### Issue: Supabase won't start
**Error:** Various Docker errors

**Solution:**
```powershell
# Clean up Docker
supabase stop
docker system prune -a

# Restart
supabase start
```

### Issue: CORS errors in browser
**Error:** `Access to XMLHttpRequest has been blocked by CORS`

**Solution:** Already handled in `src/services/supabase/client.ts` with proper headers.

---

## 🔐 Security Notes

### ⚠️ Local Development ONLY
- The default JWT tokens are **NOT secure**
- They're designed for local testing only
- **Never use in production**

### Environment Variable Management
- `.env` contains local credentials (safe for local dev)
- **Never commit `.env` to version control**
- `.gitignore` should include `.env` (already configured)

### For Production
When moving to cloud:
1. Create Supabase project at supabase.com
2. Replace credentials in `.env`
3. Keep `VITE_API_MODE=supabase`
4. Deploy with real credentials in CI/CD secrets

---

## 📊 Database Management

### Access Studio
1. Open http://localhost:54323
2. Go to **SQL Editor**
3. Create tables, manage auth, etc.

### Example: Create a users table
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Enable read for all" ON users FOR SELECT USING (true);
```

### Access pgAdmin (optional)
```powershell
# If you need advanced database management
docker run -p 5050:80 dpage/pgadmin4

# Access at http://localhost:5050
# Login: admin@admin.com / admin
```

---

## ✅ Verification Checklist

- [ ] Docker Desktop installed and running
- [ ] Supabase CLI installed (`supabase --version` works)
- [ ] `supabase start` completes successfully
- [ ] `.env` has correct `VITE_SUPABASE_URL=http://localhost:54321`
- [ ] `VITE_API_MODE=supabase`
- [ ] `npm run dev` starts without errors
- [ ] Browser console shows `✅ Supabase client initialized`
- [ ] http://localhost:54323 is accessible (Supabase Studio)

---

## 🚀 Next Steps

Once verified:

1. **Create database tables** in Studio
   - Tables for customers, contracts, sales, etc.
   - Match your data model

2. **Update service implementations**
   - `src/services/supabase/customerService.ts`
   - `src/services/supabase/contractService.ts`
   - etc.

3. **Test with real data**
   - Create sample records
   - Test CRUD operations
   - Test real-time subscriptions

---

## 📚 Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase CLI Guide:** https://supabase.com/docs/guides/cli
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Docker Docs:** https://docs.docker.com/

---

## 💬 Need Help?

If you encounter issues:

1. Check logs: `supabase logs`
2. Restart services: `supabase stop && supabase start`
3. Reset database: `supabase db reset`
4. Check Docker: `docker ps` (should show Supabase containers)

---

**Happy coding! 🎉**

Your local Supabase is now ready for development. The configuration will automatically switch to your cloud Supabase when you update the environment variables for production.