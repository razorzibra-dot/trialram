# 🔐 Auth User Seeding Setup Guide

This guide explains how to properly seed Supabase Auth users and sync them with your database users table.

## 📋 Overview

The CRM application uses **two-layer user management**:

1. **Supabase Auth** - Authentication layer (auth.users table)
2. **Database Users** - Application users (public.users table)

This setup ensures:
- ✅ Proper auth user creation
- ✅ Database users linked to auth user IDs
- ✅ Tenant isolation maintained
- ✅ RBAC properly configured
- ✅ No broken foreign key references

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start Supabase

```bash
supabase start
```

Wait for the CLI to finish and display the connection details.

### Step 2: Create Auth Users

```bash
# Install dependencies (if not already done)
npm install

# Seed auth users
npx ts-node scripts/seed-auth-users.ts
```

**Output:**
```
🔐 Supabase Auth User Seeding
============================================================
✅ Created admin@acme.com
   User ID: 550e8400-e29b-41d4-a716-446655440101
   Tenant: Acme Corporation
✅ Created manager@acme.com
   User ID: 550e8400-e29b-41d4-a716-446655440102
   ...
```

The script generates `auth-users-config.json` with all created user IDs.

### Step 3: Generate Seed SQL

```bash
# Generate SQL INSERT statements from auth users
npx ts-node scripts/generate-seed-sql.ts > supabase/seed-users.sql
```

This creates a new file with proper auth user IDs.

### Step 4: Reset Database

```bash
supabase db reset
```

This runs:
- All migrations (schema creation)
- Original `seed.sql` (tenants, companies, products, etc.)
- Updated `seed-users.sql` (users with auth IDs)

### Step 5: Verify Setup

```bash
# Test login
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440101",
    "email": "admin@acme.com"
  }
}
```

---

## 📁 Files Created/Modified

### Created Files:
1. **`scripts/seed-auth-users.ts`**
   - Creates Supabase Auth users
   - Saves user IDs to `auth-users-config.json`
   - Handles existing users gracefully

2. **`scripts/generate-seed-sql.ts`**
   - Reads `auth-users-config.json`
   - Generates SQL with correct auth user IDs
   - Maps users to tenants and roles

3. **`auth-users-config.json`**
   - Stores created auth user IDs
   - Generated automatically by seed script
   - Used by SQL generation script

4. **`supabase/seed-users.sql`** (generated)
   - Users table inserts with auth user IDs
   - Merged into main seed during `db reset`

### Updated Files:
- None (backward compatible)

---

## 🔄 Complete Setup Workflow

### Fresh Installation

```bash
# 1. Start Supabase
supabase start

# 2. Seed auth users
npx ts-node scripts/seed-auth-users.ts

# 3. Generate SQL
npx ts-node scripts/generate-seed-sql.ts > supabase/seed-users.sql

# 4. Reset database
supabase db reset

# 5. Start development server
npm run dev
```

### Update Existing Users

If you need to modify users or add new ones:

```bash
# 1. Edit TEST_USERS in scripts/seed-auth-users.ts
# 2. Delete old auth users via Supabase dashboard (optional)
# 3. Reseed auth users
npx ts-node scripts/seed-auth-users.ts

# 4. Regenerate SQL
npx ts-node scripts/generate-seed-sql.ts > supabase/seed-users.sql

# 5. Reset database
supabase db reset
```

### Preserve Data (Skip Users Seeding)

If you want to reset data but keep users:

```bash
# Edit supabase/config.toml and modify db reset behavior
# Or manually run migrations and skip seed-users.sql
```

---

## 👥 Test Users Created

After running the setup, these users are available:

### Acme Corporation (Tenant 1)
| Email | Password | Role | Permissions |
|-------|----------|------|------------|
| admin@acme.com | password123 | Admin | All operations |
| manager@acme.com | password123 | Manager | Operational permissions |
| engineer@acme.com | password123 | Engineer | Technical operations |
| user@acme.com | password123 | Agent | Customer service |

### Tech Solutions Inc (Tenant 2)
| Email | Password | Role | Permissions |
|-------|----------|------|------------|
| admin@techsolutions.com | password123 | Admin | All operations |
| manager@techsolutions.com | password123 | Manager | Operational permissions |

### Global Trading Ltd (Tenant 3)
| Email | Password | Role | Permissions |
|-------|----------|------|------------|
| admin@globaltrading.com | password123 | Admin | All operations |

---

## 🔍 Verification Checklist

After setup, verify everything works:

- [ ] Auth users created (check `auth-users-config.json`)
- [ ] Database users inserted (check database)
- [ ] Users linked to tenants (run: `SELECT * FROM users;`)
- [ ] Permissions loaded (check console logs on login)
- [ ] Login works with test users
- [ ] Tenant isolation working (admin can't see other tenants)
- [ ] RBAC permissions enforced

---

## ❌ Troubleshooting

### Problem: "Missing environment variables"

**Solution:**
```bash
# Check .env file has these set:
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_SERVICE_KEY=your-service-key

# Get service key from Supabase output:
supabase start
```

### Problem: "User already exists"

**Solution:**
The script skips existing users. To recreate:

```bash
# Option 1: Edit auth-users-config.json and delete old entries
# Option 2: Delete users from Supabase dashboard Settings > Users

# Then reseed
npx ts-node scripts/seed-auth-users.ts
```

### Problem: "auth-users-config.json not found"

**Solution:**
```bash
# Run auth seeding first
npx ts-node scripts/seed-auth-users.ts

# This generates the config file
```

### Problem: "Foreign key constraint failed on users insert"

**Solution:**
```bash
# Make sure tenants exist first
# Check: supabase/seed.sql has tenant inserts before users
# And tenants table has been populated

# Verify:
supabase db reset  # Re-runs full sequence
```

### Problem: "User IDs don't match between auth and database"

**Solution:**
```bash
# Manually check mapping:
SELECT id FROM auth.users WHERE email = 'admin@acme.com';

# Then verify database:
SELECT id, email FROM public.users WHERE email = 'admin@acme.com';

# IDs should match
```

---

## 🛠️ Advanced Usage

### Custom Users

Edit `scripts/seed-auth-users.ts`:

```typescript
const TEST_USERS: TestUser[] = [
  {
    email: 'custom@yourdomain.com',
    password: 'secure-password',
    displayName: 'Custom User',
    tenant: 'Acme Corporation',  // Must match a tenant name in seed.sql
  },
  // ... add more users
];
```

Then reseed:
```bash
npx ts-node scripts/seed-auth-users.ts
npx ts-node scripts/generate-seed-sql.ts > supabase/seed-users.sql
supabase db reset
```

### Programmatic Usage

```typescript
// In your application
import { seedAuthUsers } from './scripts/seed-auth-users';

await seedAuthUsers();
```

### Database-Only Seeds

To seed without auth users:

```bash
# Just run the migration
supabase migration up

# Then run seed
supabase seed run
```

---

## 📊 How It Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Seed Auth Users                                 │
│ scripts/seed-auth-users.ts                              │
│ ├─ Creates users in auth.users (Supabase Auth)         │
│ ├─ Captures user IDs                                    │
│ └─ Saves to auth-users-config.json                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Generated:
                       │ {id, email, displayName, tenant}
                       │
┌──────────────────────▼──────────────────────────────────┐
│ Step 2: Generate Seed SQL                               │
│ scripts/generate-seed-sql.ts                            │
│ ├─ Reads auth-users-config.json                        │
│ ├─ Maps users to tenants and roles                     │
│ └─ Outputs SQL INSERT statements                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Generated:
                       │ supabase/seed-users.sql
                       │
┌──────────────────────▼──────────────────────────────────┐
│ Step 3: Reset Database                                  │
│ supabase db reset                                       │
│ ├─ Runs migrations (schema)                             │
│ ├─ Runs seed.sql (tenants, products, etc.)             │
│ ├─ Runs seed-users.sql (users with auth IDs)           │
│ ├─ Runs role/permission seeds (RBAC)                   │
│ └─ Enables RLS policies                                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ Result: Complete Setup                                  │
│ ├─ Auth users in Supabase Auth                         │
│ ├─ Database users synced with auth user IDs            │
│ ├─ Tenants properly isolated                           │
│ ├─ RBAC roles and permissions loaded                   │
│ └─ RLS policies enforcing security                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User Registration/Login
   └─> Supabase Auth creates user in auth.users
       └─> Application gets user ID from JWT token
           └─> Uses auth user ID to query public.users
               └─> Loads user profile, tenant_id, roles, permissions

2. Permission Check
   └─> authService checks user permissions from database
       └─> Ensures tenant_id matches current context
           └─> Enforces RLS policies at database layer

3. Data Access
   └─> RLS policies filter results by tenant_id
       └─> Only user's tenant data is visible
           └─> Audit logs record all access
```

---

## 🔐 Security Considerations

1. **Auth User IDs**: Never hardcode in frontend code
   - Use stored in localStorage during login
   - Retrieved from JWT token claims

2. **Service Role Key**: Keep VITE_SUPABASE_SERVICE_KEY secret
   - Never expose in client-side code
   - Only use server-side (Node scripts)
   - Use VITE_SUPABASE_ANON_KEY for client

3. **Passwords**: Change TEST_USERS passwords before production
   - Generate secure passwords
   - Store in secure password manager
   - Implement proper auth flows

4. **Tenant Isolation**: Enforced at 3 levels
   - Application layer (authService validates tenant_id)
   - Service layer (multiTenantService enforces isolation)
   - Database layer (RLS policies filter by tenant_id)

---

## 📚 Related Documentation

- **RBAC Implementation**: `RBAC_IMPLEMENTATION_COMPREHENSIVE.md`
- **Tenant Architecture**: Database migrations `001-007`
- **RLS Policies**: `supabase/migrations/20250101000007_row_level_security.sql`
- **RBAC Quick Reference**: `RBAC_QUICK_REFERENCE.md`

---

## ✅ Success Criteria

After following this guide:

✅ Auth users created with proper UUIDs  
✅ Database users linked to auth user IDs  
✅ Tenants properly seeded and isolated  
✅ RBAC roles and permissions loaded  
✅ Test users can login successfully  
✅ Tenant isolation working (verified)  
✅ Permission checks functional  
✅ RLS policies enforcing security  

---

## 📞 Support

For issues or questions:

1. Check **Troubleshooting** section above
2. Review generated `auth-users-config.json`
3. Check Supabase logs: `supabase status`
4. Verify .env configuration
5. Run migrations manually: `supabase migration up`

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: ✅ Production Ready