# Complete Database Reset Guide

**Version:** 1.0  
**Date:** November 23, 2025  
**Status:** Production Ready

---

## Overview

This guide documents the consolidated database reset system for the Enterprise Multi-Tenant CRM Application. The new system uses a **single command approach** that eliminates the complexity of managing 60+ individual migration files.

### Key Benefits

- **Single Command Reset**: `supabase db reset` handles everything
- **Consolidated Schema**: All tables created in proper sequence with dependencies
- **Clean Structure**: No more migration conflicts or dependency issues
- **Production Ready**: Includes RLS policies, permissions, and seed data
- **Validated Setup**: Built-in validation and monitoring functions

---

## Quick Start

### One Command Setup

```bash
# Complete database reset with all functionality
supabase db reset
```

That's it! This single command will:

1. **Drop existing schema** (if any)
2. **Create all tables** in proper sequence
3. **Enable Row Level Security** policies
4. **Set up permissions** with Resource:Action format
5. **Insert seed data** for testing
6. **Create auto-sync functions** for authentication
7. **Add performance indexes**
8. **Validate the setup**

### Complaints Schema Assurance

- Migration `20251130000001_restore_complaints_schema.sql` now runs automatically after the consolidated reset.
- It normalizes the `complaints` table, recreates the `complaints_with_details` view, and reapplies RLS for complaint comments.
- No extra manual steps are required—`supabase db reset` alone keeps the complaints module aligned with the TypeScript service and UI layers.

### Test the Setup

```sql
-- Verify system is ready
SELECT validate_system_setup();

-- Check system status
SELECT complete_fresh_setup();

-- List all users
SELECT email, name, status, tenant_id FROM users LIMIT 10;
```

---

## System Architecture

### Database Schema

The consolidated script creates **15 core tables** with proper relationships:

#### Multi-Tenant Foundation
- **tenants** - Organization/company entities
- **users** - User profiles (extends auth.users)
- **roles** - Role definitions per tenant
- **permissions** - Resource:Action permissions
- **user_roles** - User-role assignments
- **role_permissions** - Role-permission mapping

#### Business Entities
- **companies** - Customer organizations
- **customers** - Individual customer contacts
- **products** - Product catalog
- **sales** - Sales transactions
- **sale_items** - Line items in sales (Product Sales / Orders module)
- **contracts** - Legal agreements
- **service_contracts** - Service agreements
- **job_works** - Project/job management
- **tickets** - Support tickets
- **complaints** - Customer complaints
- **notifications** - User notifications
- **audit_logs** - Comprehensive audit trail

> Note: This project contains both `sale_items` (originally created for the Product Sales / Orders module) and `deal_items` (created later for the CRM Deals pipeline). The two tables are distinct; `sale_items` is the canonical storage for product-order line items while `deal_items` holds CRM deal line items. A nullable `deal_id` column may exist on `sale_items` for integration/compatibility but application code should prefer `deal_items` when operating on the Deals module.
>
> See `supabase/TABLE_OWNERSHIP.md` for full details and migration notes.

### Security Features

#### Row Level Security (RLS)
- **Tenant Isolation**: Users only see their tenant's data
- **Super Admin Bypass**: Platform admins can access all data
- **Context-Aware Policies**: Automatic filtering by tenant_id
- **Resource Protection**: INSERT/UPDATE/DELETE policies for all tables

#### Permission System
- **Resource:Action Format**: `customers:manage`, `crm:sales:deal:read`
- **Hierarchical Permissions**: Core permissions cascade to modules
- **Role-Based Access**: Admin, Manager, Engineer, User, Customer roles
- **System Permissions**: Super admin and platform admin privileges

### Auto-Sync Features

#### Authentication Integration
- **Auth Users Sync**: Automatic sync between auth.users and public.users
- **Role Assignment**: Auto-assign roles based on email patterns
- **Tenant Mapping**: Map users to tenants by email domain
- **Profile Creation**: Create user profiles from auth data

---

## Migration Management

### Before (Legacy Approach)

❌ **60+ individual migration files**
- Complex dependency management
- Migration conflicts
- Difficult troubleshooting
- Risk of partial deployments
- No single point of failure

### After (Consolidated Approach)

✅ **3 essential migration files**

| File | Purpose | Status |
|------|---------|--------|
| `20251124000001_complete_database_reset.sql` | Complete schema + seed data | **Primary** |
| `20251122000001_add_audit_logs_rls_policies.sql` | Audit log RLS policies | **Supporting** |
| `20251122000002_update_permissions_to_resource_action_format.sql` | Permission format fix | **Supporting** |

### Archive System

Legacy migration files have been moved to:
```
supabase/migrations/archive/legacy_migrations/
```

The archive is maintained for:
- Historical reference
- Audit compliance
- Debugging legacy issues
- Understanding schema evolution

**Manual cleanup required**: See `CLEANUP_LEGACY_FILES.sql` for detailed instructions.

---

## Development Workflow

### Fresh Development Setup

1. **Start with clean slate**:
   ```bash
   supabase db reset
   ```

2. **Verify setup**:
   ```sql
   SELECT validate_system_setup();
   ```

3. **Create test users** (via Supabase dashboard or API):
   - `admin@acme.com / password123`
   - `manager@acme.com / password123`
   - `engineer@acme.com / password123`
   - `superadmin@platform.com / password123`

4. **Test authentication**:
   - Login with test users
   - Verify tenant isolation
   - Check permissions

### Development Modifications

For new features:

1. **Schema Changes**: Modify the consolidated script
2. **Testing**: `supabase db reset` to test changes
3. **Version Control**: Commit the modified script
4. **Deployment**: Same single command for deployment

**Note**: For production deployments, coordinate with the team to ensure data migration strategy.

---

## Validation and Monitoring

### Built-in Functions

#### System Validation
```sql
SELECT validate_system_setup();
```

**Returns:**
- `status`: "ready" or "issues_found"
- `summary`: Counts of all entities
- `issues`: Array of any problems
- `next_steps`: Recommended actions

#### Setup Completion
```sql
SELECT complete_fresh_setup();
```

**Returns:** Confirmation message and system status

#### Audit Queries
```sql
-- Check tenant isolation
SELECT tenant_id, COUNT(*) as user_count 
FROM users 
GROUP BY tenant_id;

-- Check permission assignments
SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Performance Monitoring

The consolidated script includes **performance indexes**:

- **Tenant Indexes**: `idx_*_tenant_id` on all tenant-scoped tables
- **User Indexes**: Email, status, super admin flags
- **Relationship Indexes**: Foreign key relationships
- **Audit Indexes**: User actions and table operations

---

## Troubleshooting

### Common Issues

#### Issue: "Permission denied" errors
**Solution**: Check role assignments
```sql
SELECT u.email, r.name, t.name as tenant
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN tenants t ON ur.tenant_id = t.id
WHERE u.email = 'problematic@email.com';
```

#### Issue: Users can't see their tenant data
**Solution**: Verify RLS policies and tenant_id assignments
```sql
-- Check tenant assignment
SELECT email, tenant_id, is_super_admin FROM users;

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename = 'your_table_name';
```

#### Issue: Permission checks failing
**Solution**: Validate permission format
```sql
-- Should show resource:action format
SELECT name, resource, action FROM permissions 
WHERE name NOT LIKE '%:%' 
AND name NOT IN ('read', 'write', 'delete');
```

### Debug Mode

Enable debug logging:
```sql
-- Enable query logging (requires superuser)
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

---

## File Reference

### Essential Files

| File | Purpose | Lines |
|------|---------|-------|
| `supabase/seed.sql` | Entry point for reset | 25 |
| `supabase/migrations/20251124000001_complete_database_reset.sql` | Complete schema | 794 |
| `supabase/migrations/20251122000001_add_audit_logs_rls_policies.sql` | Audit RLS | 145 |
| `supabase/migrations/20251122000002_update_permissions_to_resource_action_format.sql` | Permission fix | 288 |

### Documentation Files

| File | Purpose |
|------|---------|
| `supabase/DATABASE_RESET_GUIDE.md` | This guide |
| `supabase/migrations/CLEANUP_LEGACY_FILES.sql` | Cleanup instructions |
| `supabase/migrations/archive/README_LEGACY_MIGRATIONS.md` | Archive documentation |

### Test/Validation Files

| File | Purpose |
|------|---------|
| `validate_auth_user_sync.sql` | Auth sync validation |
| `test_permission_validation_final.sql` | Permission validation |
| `pre-deployment-validation.sql` | Pre-deployment checks |

---

## Command Reference

### Reset Commands

```bash
# Complete database reset
supabase db reset

# Reset with verbose output
supabase db reset --debug

# Reset specific database
supabase db reset --db-ref your-project-ref
```

### Migration Commands

```bash
# Create new migration (if needed)
supabase migration new your_migration_name

# Apply migrations manually
supabase db push

# Generate types after reset
supabase gen types typescript --local > src/types/database.ts
```

### Development Commands

```bash
# Start local Supabase
supabase start

# Open Supabase Studio
supabase studio

# View logs
supabase logs
```

---

## Security Considerations

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based permissions with tenant isolation
- **Audit Trail**: Comprehensive logging of all user actions
- **Session Management**: Secure JWT-based authentication

### Compliance
- **GDPR Ready**: Data isolation per tenant
- **Audit Compliance**: Complete audit trail
- **Data Governance**: Structured permission system
- **Access Monitoring**: User action logging

### Best Practices
- **Regular Backups**: Enable automated backups
- **Security Updates**: Keep Supabase instance updated
- **Access Reviews**: Regular permission audits
- **Monitoring**: Set up security monitoring alerts

---

## Support and Maintenance

### Getting Help

1. **Check validation**: Run `SELECT validate_system_setup();`
2. **Review logs**: Use Supabase Studio or CLI logs
3. **Consult documentation**: This guide and archived files
4. **Team consultation**: Coordinate with development team

### Maintenance Tasks

#### Regular (Weekly)
- Validate system health
- Check audit log integrity
- Review permission assignments

#### Monthly
- Archive cleanup (if needed)
- Performance analysis
- Security audit

#### Quarterly
- Schema review
- Migration strategy update
- Documentation updates

---

## Appendix

### Sample Test Data

The system includes sample data for testing:

**Tenants:**
- Acme Corporation (Enterprise)
- Tech Solutions Inc (Professional)
- Global Trading Ltd (Basic)

**Users per tenant:**
- Administrator (full access)
- Manager (departmental access)
- Engineer (technical access)
- User (standard access)
- Customer (limited access)

**Sample Business Data:**
- Companies, products, customers
- Sales transactions with line items
- Contracts and service agreements
- Support tickets and complaints

### Environment Variables

Required for full functionality:
```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

**End of Database Reset Guide**

*For questions or issues, refer to the troubleshooting section or consult with the development team.*