---
description: Repository Information Overview
alwaysApply: true
---

# PDS-CRM Application Information

## Summary
A modular CRM (Customer Relationship Management) application with a React frontend and multiple backend options including .NET Core and Supabase. The application follows a clean architecture pattern and is designed to manage customers, contracts, sales, tickets, and notifications in a multi-tenant environment.

## Structure
- **src/**: Frontend React application with modular architecture
  - **modules/**: Feature modules with self-contained functionality
  - **services/**: API services with mock, real, and Supabase implementations
  - **components/**: Reusable UI components
  - **contexts/**: React context providers
  - **hooks/**: Custom React hooks
  - **types/**: TypeScript type definitions
- **supabase/**: Supabase configuration and migrations
- **public/**: Static assets
- **docs/**: Documentation files

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.0.2
**Build System**: Vite 4.4.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.2.0 with React Router 6.8.1
- Ant Design 5.27.5 for UI components
- TanStack React Query 5.90.2 for data fetching
- Supabase 2.38.0 for backend integration
- Tailwind CSS 3.3.0 for styling
- Zod 3.22.2 for schema validation
- Zustand 5.0.8 for state management

**Development Dependencies**:
- ESLint 8.45.0 for code linting
- Husky 8.0.3 for git hooks
- Vite 4.4.5 for development server and building

## Build & Installation
```bash
# Install dependencies
npm install

# Development with mock data
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker
**Configuration**: Docker Compose setup for local Supabase development
**Services**:
- PostgreSQL database (port 5432)
- Supabase API (port 54321)
- Supabase Studio (port 54323)
- Email testing (port 54324)

**Run Command**:
```bash
docker-compose -f docker-compose.local.yml up -d
```

## API Configuration
**Multiple Backend Options**:
- Mock/Static Data API (for development)
- .NET Core Backend API (production)
- Supabase PostgreSQL (real-time database)

**Switching Modes**:
```
# In .env file
VITE_API_MODE=mock|real|supabase
```

## Testing
**Framework**: ESLint for static analysis
**Configuration**: .eslintrc.js
**Run Command**:
```bash
# Run linter
npm run lint

# Validate code quality
npm run validate:code

# Run quality checks
npm run quality:check
```

## Architecture
**Frontend**: Modular architecture with feature modules
**State Management**: React Query and Context API
**Authentication**: JWT with Bearer tokens
**Database**: PostgreSQL via Supabase
**UI Library**: Ant Design with Tailwind CSS
**Design System**: Salesforce-inspired professional theme

### Service Factory Pattern (Critical)
The application uses a **Service Factory Pattern** to route service calls between different backend implementations based on the `VITE_API_MODE` environment variable.

**Why This Matters**:
- Prevents "Unauthorized" errors that occur when mock services are called against Supabase's authentication layer
- Ensures proper multi-tenant context is maintained when using Supabase
- Allows seamless switching between development (mock) and production (Supabase) modes

**Architecture Overview**:
```
Module Service
  ↓
Service Factory (src/services/serviceFactory.ts)
  ├─→ Mock Service (VITE_API_MODE=mock)
  └─→ Supabase Service (VITE_API_MODE=supabase)
```

**How Service Factory Works**:
1. Each backend implementation has its own service file:
   - Mock: `src/services/{serviceName}.ts`
   - Supabase: `src/services/api/{serviceName}.ts`
2. `serviceFactory.ts` provides a centralized router that:
   - Reads `VITE_API_MODE` environment variable at runtime
   - Returns the appropriate service implementation
   - Ensures module services always use factory-routed calls

**Implemented Factory Services**:
- `getJobWorkService()` - Job work operations
- `getCustomerService()` - Customer operations
- `getProductSaleService()` - Product sales operations
- `getProductService()` - Product operations
- Generic `getService(serviceName)` method for dynamic routing

**Common Pitfalls to Avoid** ⚠️:
1. ❌ **Direct Import from Mock Service**: Module services should NOT directly import from legacy mock services
   ```typescript
   // WRONG - This bypasses the factory pattern
   import productService from '@/services/productService';
   ```
   
2. ✅ **Use Factory Service**: Always import and use the factory service
   ```typescript
   // CORRECT
   import { productService as factoryProductService } from '@/services/serviceFactory';
   ```

3. ❌ **Direct Supabase Calls**: Module services should NOT import Supabase services directly
   ```typescript
   // WRONG - Breaks abstraction, ignores mock mode
   import { supabaseProductService } from '@/services/api/supabase/productService';
   ```

4. ✅ **Let Factory Handle Routing**: The factory pattern ensures the right implementation is used
   ```typescript
   // CORRECT - Factory chooses implementation based on VITE_API_MODE
   const { data, error } = await factoryProductService.getProductStats();
   ```

**Adding a New Service to Factory**:
When adding a new service that needs multi-mode support:

1. **Create both implementations**:
   - Mock: `src/services/{serviceName}.ts`
   - Supabase: `src/services/api/supabase/{serviceName}.ts`

2. **Update serviceFactory.ts**:
   ```typescript
   import { supabase{ServiceName}Service } from './api/supabase/{serviceName}';
   import { mock{ServiceName}Service } from './{serviceName}';
   
   export function get{ServiceName}Service() {
     return apiMode === 'supabase' 
       ? supabase{ServiceName}Service 
       : mock{ServiceName}Service;
   }
   
   export const {serviceName}Service = {
     method1: () => get{ServiceName}Service().method1(),
     method2: () => get{ServiceName}Service().method2(),
     // ... all other methods
   };
   ```

3. **Update module service**:
   - Import from factory: `import { {serviceName}Service as factory{ServiceName}Service } from '@/services/serviceFactory'`
   - Use factory service in all method implementations

4. **Update src/services/index.ts**:
   - Export from factory: `export { {serviceName}Service } from './serviceFactory'`

**Debugging "Unauthorized" Errors**:
If you see "Unauthorized" errors:
1. Check `VITE_API_MODE` in `.env` file (should be 'supabase' or 'mock')
2. Verify the calling code uses factory service, not direct imports
3. Check that `serviceFactory.ts` exports the correct service method
4. Ensure mock services don't attempt to access `authService.getCurrentUser()` when called in Supabase mode

**Known Factory-Routed Services**:
- Product Service (productService)
- Product Sale Service (productSaleService)
- Job Work Service (jobWorkService)
- Customer Service (customerService)
- Company Service (companyService)
- Notification Service (notificationService)
- Sales Service (salesService)
- Contract Service (contractService)
- User Service (userService) ⭐ NEW
- RBAC Service (rbacService) ⭐ NEW

### User Management & RBAC Services (New in Phase 4)

**User Service** - Multi-backend user management:
- **Mock Implementation**: `src/services/userService.ts`
- **Supabase Implementation**: `src/services/api/supabase/userService.ts`
- **Factory Export**: `export { userService } from './serviceFactory'`

**Methods**: `getUsers()`, `getUser()`, `createUser()`, `updateUser()`, `deleteUser()`, `resetPassword()`, `getRoles()`, `getPermissions()`, `getStatuses()`, `getTenants()`

**RBAC Service** - Multi-backend role-based access control:
- **Mock Implementation**: `src/services/rbacService.ts`
- **Supabase Implementation**: `src/services/api/supabase/rbacService.ts`
- **Factory Export**: `export { rbacService } from './serviceFactory'`

**Methods**: `getPermissions()`, `getRoles()`, `createRole()`, `updateRole()`, `deleteRole()`, `assignUserRole()`, `removeUserRole()`, `getPermissionMatrix()`, `getRoleTemplates()`, `createRoleFromTemplate()`, `getAuditLogs()`, `logAction()`, `getUsersByRole()`, `bulkAssignRole()`, `bulkRemoveRole()`, `validateRolePermissions()`

**Features**:
- ✅ Full Supabase PostgreSQL integration
- ✅ Multi-tenant support with Row-Level Security
- ✅ Audit logging for all actions
- ✅ Permission validation and role templates
- ✅ Bulk role assignment/removal

**Usage in Components**:
```typescript
// Correct way - use factory service
import { userService as factoryUserService } from '@/services/serviceFactory';

// Get all users
const users = await factoryUserService.getUsers();

// Create new user
const newUser = await factoryUserService.createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'Manager',
  status: 'active',
  tenantId: 'tenant_1',
  tenantName: 'Company Name'
});

// RBAC operations
import { rbacService as factoryRbacService } from '@/services/serviceFactory';

const permissions = await factoryRbacService.getPermissions();
const roles = await factoryRbacService.getRoles();
const permissionMatrix = await factoryRbacService.getPermissionMatrix();
```

**Database Schema Requirements**:
- `users` table with: id, email, firstName, lastName, role, status, tenantId, tenantName, lastLogin, createdAt, avatar, phone
- `roles` table with: id, name, description, tenant_id, permissions (array), is_system_role, created_at, updated_at
- `user_roles` table with: user_id, role_id, assigned_at
- `permissions` table with: id, name, description, category ⭐ REQUIRED, resource, action, is_system_permission
- `role_templates` table with: id, name, description, permissions (array), is_default, category ⭐ REQUIRED
- `audit_logs` table with: id, user_id, action, resource, resource_id, details (jsonb), ip_address, user_agent, tenant_id, timestamp

**⚠️ IMPORTANT - Schema Fix Required**:
If you see these errors in browser console:
- `column permissions.category does not exist`
- `relation "tenant_*.role_templates" does not exist`

**Apply Migration Fix**:
Run migration: `supabase/migrations/20250101000009_fix_rbac_schema.sql`

**How to Apply**:
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard:
# SQL Editor → New Query → Paste migration file → Execute
```

See: `RBAC_SCHEMA_FIX_GUIDE.md` for detailed instructions.