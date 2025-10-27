---
title: Quick References and Checklists
description: Quick start guides, development checklists, and handy reference materials
lastUpdated: 2025-01-27
category: references
---

# 📚 Quick References and Checklists

**Status**: ✅ **COMPREHENSIVE REFERENCE LIBRARY**  
**Last Updated**: 2025-01-27  
**Checklists**: 10+  
**Quick Guides**: 20+

---

## 🎯 Quick Navigation

- [🚀 Quick Start Guides](#-quick-start-guides)
- [✅ Development Checklists](#-development-checklists)
- [🔑 API Quick Reference](#-api-quick-reference)
- [📋 Role & Permission Matrix](#-role--permission-matrix)
- [🔧 Configuration Reference](#-configuration-reference)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [🐛 Common Commands](#-common-commands)

---

## 🚀 Quick Start Guides

### 1. Developer Setup (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd CRMV9_NEWTHEME

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Start development
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
```

**Next Steps**:
- Log in with test credentials
- Navigate to a module
- Check browser console for any errors

---

### 2. Setting Up Supabase Locally (10 minutes)

```bash
# 1. Start Docker
docker-compose -f docker-compose.local.yml up -d

# 2. Wait for services to start
# (PostgreSQL port 5432, Supabase API port 54321)

# 3. Update .env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-key
VITE_API_MODE=supabase

# 4. Restart development server
npm run dev

# 5. Access Supabase Studio
# http://localhost:54323
```

---

### 3. Running Tests

```bash
# ESLint
npm run lint

# TypeScript check
npx tsc --noEmit

# Build verification
npm run build

# Preview build
npm run preview
```

---

### 4. Database Migrations

```bash
# Apply pending migrations
supabase db push

# Create new migration
supabase migration new <migration_name>

# Reset database (local only)
supabase db reset
```

---

## ✅ Development Checklists

### Before Committing Code

- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles successfully (`npx tsc --noEmit`)
- [ ] Tests pass (if applicable)
- [ ] No console errors or warnings
- [ ] Code follows project conventions
- [ ] Documentation updated (if applicable)
- [ ] No hardcoded values or secrets

### Feature Implementation Checklist

- [ ] Feature designed and approved
- [ ] Components created with TypeScript
- [ ] Service layer implemented
- [ ] Mock service implementation
- [ ] Supabase service implementation
- [ ] Factory service integration
- [ ] React Query hooks created
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Tests written and passing
- [ ] Documentation created
- [ ] Code reviewed
- [ ] Feature tested in both mock and Supabase modes

### Bug Fix Checklist

- [ ] Issue identified and reproduced
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed
- [ ] No regression issues
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Marked as resolved

### Module Refactoring Checklist

- [ ] Current module analyzed
- [ ] Refactoring scope defined
- [ ] Backward compatibility ensured
- [ ] Tests updated
- [ ] All methods tested
- [ ] Documentation updated
- [ ] Team notified
- [ ] Code reviewed
- [ ] Changes deployed to staging

---

## 🔑 API Quick Reference

### Service Factory Pattern

```typescript
// Import factory service
import { customerService as factoryCustomerService } from '@/services/serviceFactory';

// Use in module
const getCustomers = async () => {
  return factoryCustomerService.getCustomers();
};

// Use in React hook
const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => factoryCustomerService.getCustomers(),
  });
};
```

### Available Services

```typescript
// Import services from factory
import { 
  customerService,
  salesService,
  contractService,
  jobWorkService,
  productService,
  productSaleService,
  notificationService,
  ticketService,
  userService,
  rbacService,
  dashboardService,
} from '@/services/serviceFactory';

// All services support:
// - Mock implementation (VITE_API_MODE=mock)
// - Supabase implementation (VITE_API_MODE=supabase)
// - Automatic switching via environment variable
```

### Common API Patterns

```typescript
// GET - Retrieve data
const data = await customerService.getCustomers();
const customer = await customerService.getCustomer(id);

// POST - Create new
const created = await customerService.createCustomer(formData);

// PUT - Update existing
const updated = await customerService.updateCustomer(id, formData);

// DELETE - Remove
await customerService.deleteCustomer(id);

// BULK operations
await customerService.bulkDelete(ids);
```

---

## 📋 Role & Permission Matrix

### User Roles

| Role | Module Access | CRUD | Create Reports | Admin |
|------|---------------|------|-----------------|-------|
| **Admin** | All | Full | ✅ | ✅ |
| **Manager** | All | Full | ✅ | ❌ |
| **User** | Assigned | Partial | ❌ | ❌ |
| **Guest** | Read-Only | ❌ | ❌ | ❌ |

### Module Permissions

```
Customers: Create, Read, Update, Delete, Export, Bulk Operations
Sales: Create, Read, Update, Delete, Change Stage, Update Deal
Contracts: Create, Read, Update, Delete, Generate PDF, Approve
Tickets: Create, Read, Update, Delete, Assign, Close
Products: Read, Update (Admin only)
Reports: View, Generate, Schedule
Admin: All settings, User management, System configuration
```

### Permission Levels

- **View**: Can see the data
- **Create**: Can create new records
- **Edit**: Can modify existing records
- **Delete**: Can remove records
- **Export**: Can download data
- **Admin**: Can configure the module

---

## 🔧 Configuration Reference

### Environment Variables

```bash
# API Configuration
VITE_API_MODE=mock|real|supabase              # Backend mode
VITE_SUPABASE_URL=https://project.supabase.co # Supabase URL
VITE_SUPABASE_ANON_KEY=key-here               # Supabase key

# Application
VITE_APP_NAME=PDS CRM                         # App display name
VITE_APP_VERSION=1.0.0                        # Version number

# Features (Feature flags)
VITE_FEATURE_REPORTS=true                     # Enable reports
VITE_FEATURE_ADVANCED_FILTERS=true            # Advanced filters
VITE_FEATURE_BULK_OPERATIONS=true             # Bulk operations

# Debugging
VITE_DEBUG=false                              # Debug mode
VITE_LOG_LEVEL=info|warn|error                # Log level
```

### Configure for Local Development

```bash
# .env.local
VITE_API_MODE=mock
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-key
VITE_DEBUG=true
```

### Configure for Production

```bash
# .env.production
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_DEBUG=false
```

---

## ⌨️ Keyboard Shortcuts

### General Navigation
| Key | Action |
|-----|--------|
| `/` | Focus search |
| `?` | Show help |
| `Esc` | Close modal/drawer |
| `Tab` | Focus next element |
| `Shift+Tab` | Focus previous element |

### Grid/Table Operations
| Key | Action |
|-----|--------|
| `Click + Shift` | Multi-select rows |
| `Space` | Toggle row selection |
| `Ctrl+A` | Select all |
| `Ctrl+Shift+A` | Deselect all |
| `Delete` | Delete selected |

### Form Operations
| Key | Action |
|-----|--------|
| `Ctrl+Enter` | Submit form |
| `Escape` | Cancel/Close |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |

---

## 🐛 Common Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Format code
npm run format

# Full quality check
npm run quality:check
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git commit -m "feat: description of change"

# Push branch
git push origin feature/feature-name

# Create pull request
# (On GitHub/GitLab)

# Merge to main
git checkout main
git merge feature/feature-name
```

### Database

```bash
# Start local Supabase
docker-compose -f docker-compose.local.yml up -d

# Stop Supabase
docker-compose -f docker-compose.local.yml down

# View database logs
docker-compose logs db

# Reset database
supabase db reset
```

---

## 📊 Common Code Patterns

### React Hook Pattern

```typescript
// Module hook using React Query
import { useQuery } from '@tanstack/react-query';
import { useService } from '@/hooks/useService';

export const useCustomers = () => {
  const customerService = useService('customerService');
  
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000,
  });
};
```

### Component Pattern

```typescript
// Functional component with hooks
import React from 'react';
import { useCustomers } from '../hooks/useCustomers';

export const CustomerList: React.FC = () => {
  const { data, isLoading, error } = useCustomers();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
};
```

### Service Implementation Pattern

```typescript
// Mock service
export const mockCustomerService = {
  getCustomers: async () => {
    return [/* mock data */];
  },
  createCustomer: async (data) => {
    return { id: generateId(), ...data };
  },
};

// Supabase service
export const supabaseCustomerService = {
  getCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*');
    return data || [];
  },
  // ... other methods
};
```

---

## 🚨 Troubleshooting Quick Guide

### Issue: "Tenant context not initialized"
**Solution**:
1. Add `useTenantContext()` guard
2. Use `enabled: isInitialized` in React Query
3. Check AuthContext initialization

### Issue: "Unauthorized 401"
**Solution**:
1. Verify token in localStorage
2. Check token refresh logic
3. Verify permissions in RBAC

### Issue: "Empty grid despite data"
**Solution**:
1. Verify data binding
2. Check grid data source
3. Inspect network response

### Issue: "Service returning undefined"
**Solution**:
1. Check if correct mode (mock/supabase)
2. Verify service factory integration
3. Check for null/undefined handling

---

## 📖 Documentation Map

| Type | Location | Frequency |
|------|----------|-----------|
| Architecture | `/PROJ_DOCS/01_ARCHITECTURE_DESIGN/` | Once per phase |
| Setup Guides | `/PROJ_DOCS/05_SETUP_CONFIGURATION/` | On major changes |
| Module Docs | `/src/modules/features/{module}/DOC.md` | With each module |
| Troubleshooting | `/PROJ_DOCS/06_TROUBLESHOOTING/` | As issues occur |
| References | `/PROJ_DOCS/07_REFERENCES_QUICK/` | Regularly updated |
| Summaries | `/PROJ_DOCS/09_SUMMARY_AND_REPORTS/` | After each phase |

---

## 🔗 Related Resources

- **PHASE_COMPLETION_REPORTS.md** - Phase completion details
- **IMPLEMENTATION_STATUS.md** - Feature implementation progress
- **ARCHITECTURE_AND_DESIGN.md** - System design
- **INTEGRATION_AND_AUDITS.md** - Integration verification
- **TROUBLESHOOTING_AND_FIXES.md** - Known issues and solutions
- **UI_UX_AND_DESIGN.md** - Design system details

---

## 📋 Useful Links

### Documentation
- [PROJ_DOCS/INDEX.md](../INDEX.md) - Main documentation index
- [PROJ_DOCS/00_START_HERE/](../00_START_HERE/) - Getting started

### External Resources
- [Ant Design Documentation](https://ant.design/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## ✨ Pro Tips

1. **Use Environment Switching**: Switch between mock and Supabase easily
   ```bash
   VITE_API_MODE=mock npm run dev
   ```

2. **Debug with React Query DevTools**: Install the React Query DevTools browser extension

3. **Check Supabase Logs**: View real-time query logs in Supabase Dashboard

4. **Use TypeScript Strict Mode**: Catch bugs early with strict typing

5. **Test in Both Modes**: Always test features in both mock and Supabase modes

6. **Check Browser Console**: Monitor for warnings and errors during development

7. **Use React DevTools**: Inspect component props and state

8. **Review Migrations**: Check database migrations before committing

---

**Status**: QUICK REFERENCE GUIDE  
**Last Updated**: 2025-01-27  
**Maintenance**: Updated as new tools and patterns are introduced