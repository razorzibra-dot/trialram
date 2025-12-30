# 🚀 Supabase Fresh Start Setup Guide

## ✅ Complete One-Command Database Setup

This solution provides everything needed to get a fully functional CRM system working with just **`supabase db reset`**.

### 🎯 What's Included

- **Complete Database Schema**: All tables, relationships, and constraints
- **Row Level Security (RLS)**: Comprehensive security policies for multi-tenancy
- **Seed Data**: Tenants, roles, permissions, users, and sample business data
- **Automatic Auth Sync**: Seamless integration with Supabase Auth
- **Sample Data**: Companies, products, customers, sales, and contracts
- **Performance Indexes**: Optimized for production use

### 🚀 Quick Start (One Command)

```bash
# 1. Start Supabase
supabase start

# 2. Run the complete setup (everything happens automatically)
supabase db reset

# 3. Create auth users (choose one method)
```

#### Method A: Manual Auth User Creation (Simple)
1. Go to Supabase Dashboard → Authentication → Users
2. Create these users:
   - Email: `admin@acme.com` | Password: `password123`
   - Email: `manager@acme.com` | Password: `password123`
   - Email: `engineer@acme.com` | Password: `password123`
   - Email: `user@acme.com` | Password: `password123`
   - Email: `customer@acme.com` | Password: `password123`
   - Email: `superadmin@platform.com` | Password: `password123`

#### Method B: Automated Auth Setup (Recommended)
```bash
# Create auth users automatically
npx tsx scripts/seed-auth-users.ts

# Sync auth IDs to database
tsx scripts/sync-auth-to-sql.ts

# Reset database with synced IDs
supabase db reset
```

### 🔐 Default Login Credentials

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| `admin@acme.com` | `password123` | Administrator | Acme Corporation |
| `manager@acme.com` | `password123` | Manager | Acme Corporation |
| `engineer@acme.com` | `password123` | Engineer | Acme Corporation |
| `user@acme.com` | `password123` | User | Acme Corporation |
| `customer@acme.com` | `password123` | Customer | Acme Corporation |
| `superadmin@platform.com` | `password123` | Super Admin | Global |

### 🏢 Sample Organizations

The system comes pre-configured with 3 organizations:

1. **Acme Corporation** (Enterprise Plan)
   - Users: admin@acme.com, manager@acme.com, engineer@acme.com, user@acme.com, customer@acme.com
   
2. **Tech Solutions Inc** (Professional Plan)
   - Users: admin@techsolutions.com, manager@techsolutions.com
   
3. **Global Trading Ltd** (Basic Plan)
   - Users: admin@globaltrading.com

### 📊 What Gets Created

#### Core Tables
- `tenants` - Organizations/companies using the system
- `users` - User profiles (extends auth.users)
- `roles` - Role-based access control
- `permissions` - Granular permissions
- `user_roles` - User role assignments
- `role_permissions` - Role permission assignments
- `companies` - Customer companies
- `products` - Product catalog
- `customers` - Customer contacts
- `sales` - Sales transactions
- `sale_items` - Line items for sales
- `contracts` - Service contracts
- `notifications` - System notifications
- `audit_logs` - Activity tracking

#### Sample Data
- 3 Organizations
- 11 Test users across all organizations
- 6 Role types (Administrator, Manager, Engineer, User, Customer, Super Admin)
- 20+ Permissions for granular access control
- 3 Sample companies
- 5 Sample products
- 3 Sample customers
- 3 Sample sales transactions
- 3 Sample contracts
- 3 Sample notifications

### 🔒 Security Features

- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Row Level Security (RLS)**: Users can only access their tenant's data
- **Role-Based Access Control**: Granular permissions system
- **Super Admin Override**: Platform administrators can access all data
- **Audit Logging**: Complete activity tracking

### 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase Auth │    │   Public Schema  │    │   Business Data │
│                 │    │                  │    │                 │
│ • Auth Users    │◄──►│ • User Profiles  │◄──►│ • Customers     │
│ • JWT Tokens    │    │ • Roles & Perms  │    │ • Products      │
│ • Sessions      │    │ • Tenants        │    │ • Sales         │
└─────────────────┘    └──────────────────┘    │ • Contracts     │
                                               └─────────────────┘
```

### 🛠️ Advanced Setup Options

#### Custom Tenant Setup
```sql
-- Add your own organization
INSERT INTO tenants (name, domain, subscription_plan) 
VALUES ('Your Company', 'yourcompany.com', 'enterprise');

-- Create users and assign roles as needed
```

#### Permission Customization
```sql
-- Add custom permissions
INSERT INTO permissions (name, description, category) 
VALUES ('custom_feature:access', 'Access custom feature', 'module');

-- Assign to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Administrator' AND p.name = 'custom_feature:access';
```

#### Development Tools
```sql
-- Check system status
SELECT validate_system_setup();

-- View all users and their roles
SELECT u.email, u.name, r.name as role, t.name as tenant
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN tenants t ON u.tenant_id = t.id
ORDER BY t.name, r.name, u.email;

-- View permission assignments
SELECT r.name as role, p.name as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.category, p.name;
```

### 🐛 Troubleshooting

#### Auth Sync Issues
```sql
-- Check if users exist in both auth.users and public.users
SELECT 
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE WHEN pu.id IS NULL THEN 'Missing in public.users' ELSE 'Synced' END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email LIKE '%@acme.com' OR au.email LIKE '%@platform.com';
```

#### RLS Policy Issues
```sql
-- Check RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'companies', 'products', 'customers', 'sales');

-- Test user access (run as authenticated user)
SELECT * FROM companies; -- Should return only your tenant's companies
```

#### Missing Data
```sql
-- Verify core data exists
SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM roles) as roles,
  (SELECT COUNT(*) FROM permissions) as permissions,
  (SELECT COUNT(*) FROM user_roles) as assignments;
```

### 🔄 Reset Process

If you need to start completely fresh:

```bash
# 1. Stop Supabase
supabase stop

# 2. Reset everything
supabase db reset

# 3. Recreate auth users (if using manual method)
# Or run the automated scripts

# 4. System is ready!
```

### 📈 Performance Optimization

The migration includes performance indexes for:
- User queries by tenant
- Role and permission lookups
- Business data filtering
- Audit log retrieval

### 🚀 Production Deployment

For production use:

1. **Change Default Passwords**: Update all default passwords
2. **Customize Permissions**: Adjust role permissions as needed
3. **Add Your Data**: Replace sample data with real business data
4. **Monitor Performance**: Use the included audit logs
5. **Backup Strategy**: Implement regular database backups

### 💡 Next Steps

After setup is complete:

1. **Customize Branding**: Update company names and branding
2. **Add Real Data**: Replace sample data with actual business data
3. **Configure Workflows**: Set up business processes
4. **Train Users**: Onboard your team to the system
5. **Monitor Usage**: Track system performance and user adoption

---

## 🎉 Success!

Your CRM system is now ready with:
- ✅ Complete multi-tenant architecture
- ✅ Comprehensive security policies
- ✅ Sample data for testing
- ✅ Automatic auth synchronization
- ✅ Performance optimizations

**Start building your custom CRM features on top of this solid foundation!**