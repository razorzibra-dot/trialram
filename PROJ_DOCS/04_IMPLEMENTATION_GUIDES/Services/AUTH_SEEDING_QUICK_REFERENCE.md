# 🔐 Auth Seeding Quick Reference

## ⚡ One-Line Setup

### Windows (PowerShell)
```powershell
supabase start; .\scripts\setup-auth-seeding.ps1; npm run dev
```

### macOS/Linux (Bash)
```bash
supabase start && npm run seed:all && npm run dev
```

### One Command at a Time
```bash
npm run seed:auth     # Create auth users
npm run seed:sql      # Generate seed SQL  
npm run seed:db       # Reset database
npm run dev           # Start dev server
```

---

## 📋 Command Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `npm run seed:auth` | Create Supabase Auth users | `auth-users-config.json` |
| `npm run seed:sql` | Generate SQL from config | `supabase/seed-users.sql` |
| `npm run seed:db` | Reset database with seeds | Database populated |
| `npm run seed:all` | All three steps combined | Complete setup |

---

## 👥 Test Users

```
Acme Corporation:
  admin@acme.com (password123) - Admin role
  manager@acme.com (password123) - Manager role
  engineer@acme.com (password123) - Engineer role
  user@acme.com (password123) - Agent role

Tech Solutions Inc:
  admin@techsolutions.com (password123) - Admin role
  manager@techsolutions.com (password123) - Manager role

Global Trading Ltd:
  admin@globaltrading.com (password123) - Admin role
```

---

## 🔍 Verification

### Check Auth Users Created
```bash
# Login endpoint test (should return token)
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}'
```

### Check Database Users
```bash
# Via Supabase CLI
supabase start
# Then visit http://localhost:54323 (Studio)
# Navigate to: Database > public > users

# Via SQL
supabase db execute "SELECT * FROM users;"
```

### Check User Mapping
```bash
# View auth-users-config.json
cat auth-users-config.json

# Expected: User IDs should match between auth and database
```

---

## 🚀 Setup Flow

```
1. supabase start
   └─ Starts local Supabase

2. npm run seed:auth (or PowerShell script)
   ├─ Creates auth users
   ├─ Gets their IDs
   └─ Saves auth-users-config.json

3. npm run seed:sql
   ├─ Reads auth-users-config.json
   ├─ Maps users to tenants/roles
   └─ Outputs seed-users.sql

4. npm run seed:db
   ├─ Runs migrations
   ├─ Runs seed.sql (tenants, products, etc.)
   ├─ Runs seed-users.sql (users with auth IDs)
   ├─ Runs RBAC seed (roles, permissions)
   └─ Enables RLS policies

5. npm run dev
   └─ Start development server
```

---

## ⚙️ File Structure

```
📦 Project Root
├── 📁 scripts/
│   ├── seed-auth-users.ts          (Creates auth users)
│   ├── generate-seed-sql.ts        (Generates SQL)
│   └── setup-auth-seeding.ps1      (Windows setup)
│
├── 📁 supabase/
│   ├── seed.sql                    (Base seed data)
│   └── seed-users.sql              (Generated users)
│
├── 📄 auth-users-config.json       (Generated config)
├── 📄 .env                         (Configuration)
├── 📄 package.json                 (npm scripts added)
│
└── 📄 AUTH_SEEDING_*.md            (Documentation)
```

---

## 🔧 Customization

### Add New User

1. Edit `scripts/seed-auth-users.ts`:
```typescript
const TEST_USERS: TestUser[] = [
  // ... existing users
  {
    email: 'newuser@domain.com',
    password: 'password123',
    displayName: 'New User',
    tenant: 'Acme Corporation',  // Must exist in seed.sql
  },
];
```

2. Reseed:
```bash
npm run seed:auth && npm run seed:sql && npm run seed:db
```

### Change User Role

1. Edit `scripts/generate-seed-sql.ts`:
```typescript
const ROLE_MAPPING: Record<string, string> = {
  'admin@acme.com': 'super_admin',  // Changed from 'admin'
  // ... other mappings
};
```

2. Regenerate:
```bash
npm run seed:sql && npm run seed:db
```

### Change User Password

Users created with `password123` by default.

To change:
1. Edit `TEST_USERS` in `scripts/seed-auth-users.ts`
2. Change the `password` field
3. Reseed: `npm run seed:all`

---

## ❌ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing env vars" | Check `.env` has VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY |
| "User already exists" | Script skips them. Delete from Supabase > Settings > Users if needed |
| "auth-users-config.json not found" | Run `npm run seed:auth` first |
| "Foreign key error" | Run `npm run seed:db` - resets everything in correct order |
| "Can't login" | Check user exists: `supabase db execute "SELECT * FROM users WHERE email='...';` |
| "Tenant isolation not working" | Verify RLS policies: `supabase db execute "SELECT * FROM pg_policies;"` |

---

## 📊 Quick Status Check

```bash
# All-in-one status check
echo "1. Auth users:" && \
npm run seed:auth 2>&1 | grep -E "(Created|Skipping)" && \
echo "2. Config:" && \
cat auth-users-config.json | jq '.users | length' && \
echo "3. Database:" && \
supabase db execute "SELECT COUNT(*) FROM users;" && \
echo "✅ All systems operational"
```

---

## 🔐 Security Checklist

- [ ] Change passwords before production
- [ ] Use strong passwords (not `password123`)
- [ ] Keep `.env` and auth keys secret
- [ ] Don't commit passwords to git
- [ ] Verify RLS policies enabled
- [ ] Test tenant isolation works
- [ ] Enable 2FA for production users

---

## 📖 Full Documentation

- **Setup Guide**: `AUTH_SEEDING_SETUP_GUIDE.md`
- **Implementation Summary**: `AUTH_SEEDING_IMPLEMENTATION_SUMMARY.md`
- **RBAC Integration**: `RBAC_IMPLEMENTATION_COMPREHENSIVE.md`

---

## 💡 Pro Tips

1. **Save config backup**:
   ```bash
   cp auth-users-config.json auth-users-config.backup.json
   ```

2. **Quick status**:
   ```bash
   cat auth-users-config.json | jq '.users[] | {email, userId}'
   ```

3. **Test permission flow**:
   - Login with admin user
   - Check browser console for permission logs
   - Verify can access admin features

4. **Monitor performance**:
   - Check permission cache hit rate
   - Monitor RLS policy execution time
   - Profile login performance

---

## 🆘 Emergency Fixes

### Complete Reset
```bash
supabase db reset --ignore-retention-policy
npm run seed:all
```

### Rebuild Auth
```bash
# Remove old auth users (via dashboard)
# Settings > Users > Delete all

# Recreate
npm run seed:auth
npm run seed:sql
npm run seed:db
```

### Sync Mismatch
```bash
# Check auth users
supabase db execute "SELECT id, email FROM auth.users;"

# Check db users
supabase db execute "SELECT id, email FROM public.users;"

# Should match
```

---

## 🎯 Common Workflows

### Fresh Start
```bash
supabase start
npm install
npm run seed:all
npm run dev
```

### Update Code & Test
```bash
npm run seed:all    # Reset data
npm run dev         # Start fresh
```

### Production Prep
```bash
# 1. Change passwords
# 2. Update .env for production
# 3. Create auth users on production Supabase
# 4. Deploy frontend
```

### Debugging
```bash
# Enable logs
export DEBUG=supabase:*
npm run dev

# Check database
supabase db execute "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## 📞 Need Help?

1. Check **troubleshooting** section above
2. Review `AUTH_SEEDING_SETUP_GUIDE.md`
3. Check `.env` configuration
4. Verify Supabase running: `supabase status`
5. Review script output for error messages

---

**Last Updated**: January 2024  
**Status**: ✅ Production Ready