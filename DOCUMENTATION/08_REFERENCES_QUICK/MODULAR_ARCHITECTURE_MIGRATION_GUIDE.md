# Modular Architecture Migration Guide

This guide explains the new modular architecture implemented for the CRM application and how to migrate from the old structure.

## Overview

The application has been refactored from a monolithic structure to a modular architecture with the following benefits:

- **Better separation of concerns**: Each module handles a specific domain
- **Improved maintainability**: Easier to understand and modify individual features
- **Enhanced scalability**: New features can be added as independent modules
- **Better testing**: Modules can be tested in isolation
- **Code reusability**: Shared components and utilities are centralized
- **Lazy loading**: Modules are loaded on demand for better performance

## New Architecture Structure

```
src/modules/
├── core/                    # Core functionality
│   ├── components/         # Shared UI components (ErrorBoundary, LoadingSpinner)
│   ├── hooks/             # Shared custom hooks (useQuery, etc.)
│   ├── services/          # Core services (ServiceContainer, BaseService)
│   ├── store/             # Global state management (Zustand)
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Utility functions
├── shared/                 # Shared business logic
│   ├── components/        # Business-specific shared components (DataTable)
│   └── hooks/             # Business-specific hooks (useDataTable)
├── features/              # Feature modules
│   ├── customers/         # Customer management module
│   ├── sales/             # Sales management module
│   ├── contracts/         # Contract management module
│   └── ...               # Other feature modules
├── layouts/               # Layout components
└── routing/               # Routing infrastructure
```

## Key Changes

### 1. State Management

**Old**: Multiple React contexts
```typescript
// Old approach
const { user } = useAuth();
const { currentPortal } = usePortal();
```

**New**: Centralized Zustand store with slices
```typescript
// New approach
import { useAuth, useUI } from '@/modules/core/store';

const { user, login, logout } = useAuth();
const { currentPortal, setCurrentPortal } = useUI();
```

### 2. Service Layer

**Old**: Direct service imports
```typescript
// Old approach
import { customerService } from '@/services';
```

**New**: Dependency injection with service container
```typescript
// New approach
import { inject } from '@/modules/core/services/ServiceContainer';

const customerService = inject<CustomerService>('customerService');
```

### 3. Component Organization

**Old**: Components organized by type
```
src/components/
├── ui/
├── customers/
├── sales/
└── layout/
```

**New**: Components organized by module
```
src/modules/
├── core/components/        # Core UI components
├── shared/components/      # Shared business components
└── features/customers/components/  # Customer-specific components
```

### 4. Data Fetching

**Old**: Custom hooks with manual state management
```typescript
// Old approach
const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  customerService.getCustomers()
    .then(setCustomers)
    .finally(() => setLoading(false));
}, []);
```

**New**: React Query with enhanced hooks
```typescript
// New approach
import { useCustomers } from '@/modules/features/customers/hooks/useCustomers';

const { customers, isLoading, error, refetch } = useCustomers(filters);
```

## Migration Steps

### Step 1: Update Entry Point

Replace the old main.tsx with the new modular version:

```typescript
// Update src/main.tsx
import ModularApp from './modules/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModularApp />
  </React.StrictMode>,
);
```

### Step 2: Migrate State Management

Replace context usage with the new store:

```typescript
// Old
import { useAuth } from '@/contexts/AuthContext';

// New
import { useAuth } from '@/modules/core/store';
```

### Step 3: Update Service Usage

Replace direct service imports with dependency injection:

```typescript
// Old
import { customerService } from '@/services';

// New
import { useCustomers } from '@/modules/features/customers/hooks/useCustomers';
```

### Step 4: Migrate Components

Move components to appropriate modules:

1. **Core components**: Move to `src/modules/core/components/`
2. **Shared components**: Move to `src/modules/shared/components/`
3. **Feature components**: Move to respective feature modules

### Step 5: Update Routing

The new routing system automatically includes module routes. No changes needed for existing routes.

## Module Development Guide

### Creating a New Feature Module

1. **Create module structure**:
```
src/modules/features/my-feature/
├── components/
├── hooks/
├── services/
├── store/
├── types/
├── routes.tsx
└── index.ts
```

2. **Implement store**:
```typescript
// store/myFeatureStore.ts
export const useMyFeatureStore = create<MyFeatureState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // State and actions
      }))
    )
  )
);
```

3. **Create service**:
```typescript
// services/myFeatureService.ts
export class MyFeatureService extends BaseService {
  async getData() {
    // Implementation
  }
}
```

4. **Register module**:
```typescript
// index.ts
export const myFeatureModule = {
  name: 'my-feature',
  path: '/my-feature',
  services: ['myFeatureService'],
  dependencies: ['core', 'shared'],
  routes: myFeatureRoutes,
  
  async initialize() {
    registerService('myFeatureService', MyFeatureService);
  },
};
```

5. **Add to bootstrap**:
```typescript
// bootstrap.ts
const { myFeatureModule } = await import('./features/my-feature');
registerModule(myFeatureModule);
```

## Best Practices

### 1. Module Independence
- Modules should not directly import from other feature modules
- Use shared modules for common functionality
- Communicate between modules through events or shared state

### 2. Service Design
- Extend BaseService for consistent behavior
- Use dependency injection for service dependencies
- Keep services focused on a single responsibility

### 3. State Management
- Use module-specific stores for feature state
- Keep global state minimal (auth, UI, notifications)
- Use selectors for performance optimization

### 4. Component Design
- Keep components small and focused
- Use composition over inheritance
- Implement proper error boundaries

### 5. Type Safety
- Define clear interfaces for all services
- Use strict TypeScript configuration
- Export types from module index files

## Performance Considerations

### 1. Lazy Loading
- All feature modules are lazy-loaded by default
- Use React.lazy() for component-level lazy loading
- Preload critical routes for better UX

### 2. Bundle Splitting
- Each module creates its own bundle chunk
- Shared dependencies are automatically optimized
- Use dynamic imports for large dependencies

### 3. Caching
- React Query provides automatic caching
- Configure appropriate stale times
- Use optimistic updates for better UX

## Testing Strategy

### 1. Unit Testing
- Test each module in isolation
- Mock dependencies using the service container
- Use module-specific test utilities

### 2. Integration Testing
- Test module interactions
- Use test-specific module configurations
- Mock external services

### 3. E2E Testing
- Test complete user workflows
- Use the modular architecture for better test organization
- Implement page object models per module

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure module is registered in bootstrap.ts
2. **Service not available**: Check service registration in module initialization
3. **State not updating**: Verify store selectors and subscriptions
4. **Route not working**: Check route configuration in module routes

### Debug Tools

1. **Redux DevTools**: Monitor store state changes
2. **React Query DevTools**: Debug data fetching
3. **Module Registry**: Check registered modules in console
4. **Service Container**: Inspect registered services

## Migration Checklist

- [ ] Update entry point to use ModularApp
- [ ] Replace context usage with new store
- [ ] Update service imports to use hooks
- [ ] Move components to appropriate modules
- [ ] Test all existing functionality
- [ ] Update tests to use new architecture
- [ ] Update documentation
- [ ] Train team on new patterns

## Support

For questions or issues with the migration:

1. Check this guide first
2. Review module examples in the codebase
3. Check console for initialization errors
4. Use debug tools to inspect state and services
