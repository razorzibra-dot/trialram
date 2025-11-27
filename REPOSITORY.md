# CRM Application Repository Documentation

**Project:** PDS CRM Application v9.0  
**Version:** 9.0 (New Theme)  
**Last Updated:** November 22, 2025  
**Status:** Production Ready  

---

## 📋 Quick Start

### 1. 🚀 Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd CRMV9_NEWTHEME

# Install dependencies
npm install
# or
bun install

# Setup environment
cp .env.example .env
# Configure .env with your Supabase credentials

# Start development server
npm run dev
# or
bun run dev
```

### 2. 🏗️ Architecture Overview

This repository implements a **24-service factory architecture** with dual-mode backend support:

- **Mock Mode**: Development/testing with local data
- **Supabase Mode**: Production with PostgreSQL backend
- **Proxy Pattern**: Zero-boilerplate service delegation

**Core Services:**
- Authentication & User Management
- Customer Relationship Management  
- Sales & Deal Management
- Contract & Service Management
- Product Catalog & Inventory
- Role-Based Access Control (RBAC)
- Multi-Tenant Architecture
- Audit Logging & Compliance

---

## 🏛️ Architecture Details

### Service Factory Pattern

The application uses a **proxy-based service factory** that eliminates 900+ lines of boilerplate code:

```typescript
// Before: 900+ lines of method forwarding
export const authService = {
  login: (...args) => serviceFactory.getAuthService().login(...args),
  logout: (...args) => serviceFactory.getAuthService().logout(...args),
  // ... 50+ more methods
};

// After: 1 line via proxy
export const authService = createServiceProxy('auth');
```

**Result**: 68% reduction in service factory code (1,538 → 497 lines)

### Multi-Tenant Architecture

```sql
-- All tenant-scoped tables include tenant_id
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  -- Data is automatically isolated by RLS
);

-- Row Level Security enforces tenant isolation
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

### RBAC System

**Role Hierarchy:**
1. **Super Admin** - Global access across all tenants
2. **Administrator** - Full tenant access
3. **Manager** - Business operations access
4. **User** - Limited functional access
5. **Engineer** - Technical operations access
6. **Customer** - Read-only external access

**Permission Format**: `{resource}:{action}` (e.g., `customers:manage`, `users:read`)

---

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- PostgreSQL (local Supabase recommended)
- Supabase account (for production backend)

### Environment Configuration

```bash
# Required Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_MODE=mock|supabase|real

# For local development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_API_MODE=mock
```

### Database Setup

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Run migrations**:
   ```bash
   supabase db reset
   ```

3. **Seed development data**:
   ```bash
   # Create auth users
   npx ts-node scripts/seed-auth-users.ts
   
   # Sync user IDs to seed.sql
   npx ts-node scripts/sync-auth-to-sql.ts
   
   # Seed database
   npx ts-node scripts/seed-database.ts
   ```

---

## 🗄️ Database Architecture

### Migration Strategy

**Critical Migration Order:**
```
20250101000001 - Initial schema (tenants, users)
20250101000007 - Row Level Security setup
20251120000003 - Auth user creation
20251122000001 - Audit logs RLS policies
20251122000002 - Permission format update ← CRITICAL
[Seed data insertion] ← Must wait for above
```

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `tenants` | Multi-tenant isolation | Domain, plan, status |
| `users` | User accounts | Tenant context, super admin |
| `roles` | Role definitions | System vs custom roles |
| `permissions` | Permission catalog | Resource:Action format |
| `customers` | CRM data | Full tenant isolation |
| `sales` | Sales pipeline | Deal tracking |
| `contracts` | Contract management | Legal agreements |
| `audit_logs` | Compliance tracking | Full action audit |

### RBAC Schema

```sql
-- Users can have multiple roles
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  tenant_id UUID REFERENCES tenants(id),
  PRIMARY KEY (user_id, role_id, tenant_id)
);

-- Roles map to permissions
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (role_id, permission_id)
);
```

---

## 🚨 Critical Fixes & Updates

### RBAC Permission Format Fix (November 2025)

**Issue**: Database seed data used legacy permission names that were deleted by migration `20251122000002`.

**Resolution**: 
- ✅ Updated `supabase/seed.sql` with new permission format
- ✅ Fixed 34 permission entries: `manage_users` → `users:manage`
- ✅ Updated 200+ role permission mappings
- ✅ Added comprehensive validation scripts

**Files Modified**:
- `supabase/seed.sql` (Lines 14-48, 431-618)
- `supabase/migrations/20251122000002_*`
- Created validation scripts for ongoing verification

### Auth User Synchronization

**Issue**: Auth users and database users required matching UUIDs.

**Solution**:
- Created `scripts/seed-auth-users.ts` for auth user creation
- Created `scripts/sync-auth-to-sql.ts` for ID synchronization
- Automated process ensures consistency

### Database Validation Framework

**Comprehensive Validation Scripts**:
- `audit_logs_table_validation.sql` - 210 validation queries
- `customer_tables_validation.sql` - 267 validation queries
- `contract_tables_validation.sql` - 402 validation queries

---

## 📊 Testing & Validation

### Test Coverage

- **Unit Tests**: 85% coverage maintained
- **Integration Tests**: Mock/Supabase switching verified
- **E2E Tests**: Critical user flows validated
- **Database Tests**: Schema integrity confirmed

### Validation Checklist

**Pre-Deployment**:
- [ ] All migrations run successfully
- [ ] Permission format validation passes
- [ ] Auth user synchronization verified
- [ ] RLS policies tested
- [ ] RBAC functionality confirmed

**Post-Deployment**:
- [ ] User authentication works
- [ ] Tenant isolation verified
- [ ] Super admin access confirmed
- [ ] Audit logging functional
- [ ] Performance metrics acceptable

### Testing Commands

```bash
# Run all tests
npm test

# Run database validation
psql -d your_database -f audit_logs_table_validation.sql
psql -d your_database -f customer_tables_validation.sql
psql -d your_database -f contract_tables_validation.sql

# Test auth user sync
npx ts-node scripts/seed-auth-users.ts --dry-run
```

---

## 🔍 Monitoring & Debugging

### Health Checks

```typescript
// Service factory health check
import { serviceFactory } from '@/services';

const health = serviceFactory.getBackendInfo();
console.log(`Mode: ${health.mode}`);
console.log(`Services: ${health.availableServices.length}`);
```

### Debug Queries

```sql
-- Check RBAC integrity
SELECT u.email, r.name, p.name as permission
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY u.email, r.name;

-- Verify tenant isolation
SELECT 
  u.email,
  u.tenant_id,
  t.name as tenant,
  COUNT(c.id) as customers
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN customers c ON u.tenant_id = c.tenant_id
GROUP BY u.email, u.tenant_id, t.name;
```

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Permission Denied | 403 errors on valid operations | Check role_permissions table assignments |
| Super Admin Can't Access All | Limited tenant visibility | Verify super_admin role with NULL tenant_id |
| Auth Sync Issues | Login failures | Run auth user synchronization scripts |
| Migration Failures | Schema errors | Check migration order and dependencies |

---

## 📁 Project Structure

```
CRMV9_NEWTHEME/
├── src/
│   ├── components/          # React components
│   ├── services/           # Service factory & implementations
│   │   ├── serviceFactory.ts # Core factory (497 lines)
│   │   ├── auth/           # Authentication services
│   │   ├── rbac/           # RBAC services
│   │   └── ...
│   ├── modules/            # Feature modules
│   └── hooks/              # Custom React hooks
├── supabase/
│   ├── migrations/         # Database migrations
│   │   ├── 20251122000001_add_audit_logs_rls_policies.sql
│   │   └── 20251122000002_update_permissions_to_resource_action_format.sql
│   └── seed.sql           # Development seed data
├── scripts/               # Utility scripts
│   ├── seed-auth-users.ts
│   ├── sync-auth-to-sql.ts
│   └── seed-database.ts
├── docs/                  # Documentation
├── ARCHITECTURE.md        # Detailed architecture docs
└── [config files]
```

---

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**:
   ```bash
   VITE_API_MODE=supabase
   VITE_SUPABASE_URL=production_url
   VITE_SUPABASE_ANON_KEY=production_key
   ```

2. **Database Migration**:
   ```bash
   supabase db push
   ```

3. **Validation**:
   ```bash
   # Run all validation scripts
   psql -d production_db -f validate_all.sql
   ```

4. **Health Check**:
   ```bash
   npm run build
   npm run test:e2e
   ```

### Rollback Procedure

```bash
# Database rollback
supabase migration down --to 20251122000001

# Application rollback
git revert <commit-hash>
npm run build
```

---

## 📖 Additional Documentation

### Core Documentation

- **ARCHITECTURE.md** - Detailed system architecture
- **DATABASE_SCRIPT_SYNCHRONIZATION_FIX_CHECKLIST.md** - RBAC fix procedures  
- **SCRIPT_SYNCHRONIZATION_AUDIT_REPORT.md** - Issue analysis and resolution
- **PROJ_DOCS/** - Comprehensive project documentation

### API Documentation

- **Service Interfaces** - See `/src/services/*/index.ts`
- **Type Definitions** - See `/src/types/`
- **Database Schema** - See migration files

### User Guides

- **Setup Guide** - Database and environment configuration
- **RBAC Guide** - Role and permission management
- **API Reference** - Service method documentation

---

## 🤝 Contributing

### Development Workflow

1. **Fork & Branch**: Create feature branch from `main`
2. **Implement**: Follow architecture patterns
3. **Test**: Ensure all tests pass
4. **Validate**: Run database validation scripts
5. **Document**: Update relevant documentation
6. **PR**: Submit with detailed description

### Code Standards

- **TypeScript**: Full type coverage required
- **ESLint**: All rules must pass
- **Testing**: 85%+ coverage maintained
- **Documentation**: Complex logic must be documented

### RBAC Considerations

When adding new features:

1. **Define Permissions**: Use `{resource}:{action}` format
2. **Update Roles**: Assign appropriate permissions
3. **Test Isolation**: Verify tenant boundaries
4. **Update Seed**: Include in development data
5. **Document Changes**: Update RBAC documentation

---

## 📞 Support & Contact

### Technical Issues

- **Database Issues**: Check validation scripts and migration logs
- **RBAC Issues**: Verify role assignments and permission format
- **Auth Issues**: Run user synchronization scripts
- **Performance Issues**: Monitor service factory metrics

### Documentation Issues

- **Outdated Info**: Submit PR with corrections
- **Missing Guides**: Request via GitHub issues
- **Architecture Questions**: See ARCHITECTURE.md detailed sections

---

## 📝 Changelog

### v9.0 (November 2025)
- ✅ **CRITICAL**: Fixed RBAC permission format synchronization
- ✅ Enhanced database validation framework  
- ✅ Improved auth user synchronization
- ✅ Added comprehensive testing procedures
- ✅ Updated architecture documentation

### v8.x (Previous Versions)
- Service factory optimization (68% code reduction)
- Multi-tenant architecture implementation
- RBAC system development
- Audit logging integration

---

**Repository Maintained By:** Development Team  
**Last Major Update:** November 22, 2025  
**Next Review:** December 2025