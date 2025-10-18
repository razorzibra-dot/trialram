# New Service Implementation Checklist

Use this checklist when adding a new service to the application. Following these steps ensures consistency and proper mock/real API switching.

---

## 📋 Pre-Implementation

- [ ] Define data models in `src/types/crm.ts`
- [ ] Document expected API endpoints
- [ ] Create TypeScript interfaces for API responses
- [ ] Plan mock data structure
- [ ] Review existing similar services for patterns

---

## 🏗️ Step 1: Create Type Definitions

**File**: `src/types/crm.ts`

```typescript
// ✅ DO: Use snake_case for UI models
export interface MyEntity {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

// Document the backend API response structure
export interface MyEntityResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}
```

### Checklist
- [ ] Entity interface created
- [ ] All required fields included
- [ ] TypeScript types are specific (avoid `any`)
- [ ] Optional fields marked with `?`
- [ ] Response interface created for API
- [ ] Naming conventions consistent

---

## 🎭 Step 2: Create Mock Service

**File**: `src/services/myEntityService.ts`

```typescript
/**
 * Mock MyEntity Service
 * Development/Testing service with static data
 */

import { MyEntity } from '@/types/crm';

class MyEntityService {
  // Mock data - Use realistic sample data
  private mockEntities: MyEntity[] = [
    {
      id: '1',
      name: 'Entity 1',
      description: 'Sample entity for testing',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      tenant_id: 'tenant_1'
    },
    {
      id: '2',
      name: 'Entity 2',
      description: 'Another sample entity',
      status: 'inactive',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      tenant_id: 'tenant_1'
    }
  ];

  /**
   * Get all entities
   */
  async getEntities(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MyEntity[]> {
    let result = this.mockEntities;

    // Apply filters
    if (filters?.status) {
      result = result.filter(e => e.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search)
      );
    }

    // Simulate pagination
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      result = result.slice(start, start + filters.limit);
    }

    return result;
  }

  /**
   * Get single entity by ID
   */
  async getEntity(id: string): Promise<MyEntity> {
    const entity = this.mockEntities.find(e => e.id === id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Create new entity
   */
  async createEntity(data: Partial<MyEntity>): Promise<MyEntity> {
    const newEntity: MyEntity = {
      id: Date.now().toString(),
      name: data.name || '',
      description: data.description || '',
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: data.tenant_id || 'tenant_1'
    };

    this.mockEntities.push(newEntity);
    return newEntity;
  }

  /**
   * Update entity
   */
  async updateEntity(id: string, data: Partial<MyEntity>): Promise<MyEntity> {
    const index = this.mockEntities.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const updated: MyEntity = {
      ...this.mockEntities[index],
      ...data,
      id, // Ensure ID doesn't change
      created_at: this.mockEntities[index].created_at, // Keep original creation date
      updated_at: new Date().toISOString()
    };

    this.mockEntities[index] = updated;
    return updated;
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string): Promise<void> {
    const index = this.mockEntities.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Entity with ID ${id} not found`);
    }
    this.mockEntities.splice(index, 1);
  }

  /**
   * Bulk delete entities
   */
  async bulkDeleteEntities(ids: string[]): Promise<void> {
    this.mockEntities = this.mockEntities.filter(e => !ids.includes(e.id));
  }
}

export const myEntityService = new MyEntityService();
```

### Checklist
- [ ] Service class created
- [ ] Mock data array with realistic data
- [ ] At least 3-5 sample items
- [ ] All CRUD methods implemented
- [ ] Filters properly applied
- [ ] Errors handled appropriately
- [ ] Timestamps use ISO format
- [ ] Service instance exported

---

## 📝 Step 3: Define Service Interface

**File**: `src/services/api/apiServiceFactory.ts`

```typescript
/**
 * Add interface definition in apiServiceFactory.ts
 */

export interface IMyEntityService {
  getEntities(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getEntity(id: string): Promise<Record<string, unknown>>;
  createEntity(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateEntity(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteEntity(id: string): Promise<void>;
  bulkDeleteEntities(ids: string[]): Promise<void>;
}
```

### Checklist
- [ ] Interface created with all methods
- [ ] Method signatures use generic Record<string, unknown>
- [ ] Return types properly specified
- [ ] Interface name follows pattern: `I[ServiceName]Service`
- [ ] Exported from apiServiceFactory.ts

---

## 🔗 Step 4: Create Real API Service

**File**: `src/services/real/myEntityService.ts`

```typescript
/**
 * Real MyEntity Service
 * Production service that communicates with .NET Core backend API
 */

import { baseApiService } from '../api/baseApiService';
import { apiConfig } from '@/config/apiConfig';
import { MyEntity as MyEntityResponse } from '../api/interfaces'; // Import response type
import { IMyEntityService } from '../api/apiServiceFactory';

export class RealMyEntityService implements IMyEntityService {

  /**
   * Get all entities
   */
  async getEntities(
    filters?: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await baseApiService.get<Record<string, unknown>>(
        `${apiConfig.endpoints.myEntity.base}?${params.toString()}`
      );

      const payload = response.data;
      const list: Record<string, unknown>[] = Array.isArray(payload)
        ? payload
        : (payload?.items ?? []);
      
      return list;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch entities';
      throw new Error(message);
    }
  }

  /**
   * Get single entity by ID
   */
  async getEntity(id: string): Promise<Record<string, unknown>> {
    try {
      return await baseApiService.get<Record<string, unknown>>(
        `${apiConfig.endpoints.myEntity.base}/${id}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch entity';
      throw new Error(message);
    }
  }

  /**
   * Create new entity
   */
  async createEntity(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      return await baseApiService.post<Record<string, unknown>>(
        apiConfig.endpoints.myEntity.base,
        data
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create entity';
      throw new Error(message);
    }
  }

  /**
   * Update entity
   */
  async updateEntity(
    id: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      return await baseApiService.put<Record<string, unknown>>(
        `${apiConfig.endpoints.myEntity.base}/${id}`,
        data
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update entity';
      throw new Error(message);
    }
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string): Promise<void> {
    try {
      await baseApiService.delete(
        `${apiConfig.endpoints.myEntity.base}/${id}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete entity';
      throw new Error(message);
    }
  }

  /**
   * Bulk delete entities
   */
  async bulkDeleteEntities(ids: string[]): Promise<void> {
    try {
      await baseApiService.post(
        `${apiConfig.endpoints.myEntity.bulk}`,
        { ids }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to bulk delete entities';
      throw new Error(message);
    }
  }
}
```

### Checklist
- [ ] Class created and implements IMyEntityService
- [ ] All methods implemented from interface
- [ ] Uses baseApiService for HTTP calls
- [ ] Error handling with try-catch
- [ ] Proper error messages
- [ ] Uses apiConfig.endpoints
- [ ] Exported as `RealMyEntityService`
- [ ] Handles pagination params
- [ ] Handles filters properly

---

## 🏭 Step 5: Register in Service Factory

**File**: `src/services/api/apiServiceFactory.ts`

```typescript
/**
 * Add imports at top of file
 */
import { myEntityService as mockMyEntityService } from '../myEntityService';
import { RealMyEntityService } from '../real/myEntityService';

/**
 * Add getter function for the service
 */
export function getMyEntityService(): IMyEntityService {
  return isUsingMockApi()
    ? (mockMyEntityService as unknown as IMyEntityService)
    : new RealMyEntityService();
}
```

### Checklist
- [ ] Mock import added
- [ ] Real class import added
- [ ] Getter function created
- [ ] Function returns correct type
- [ ] Checks isUsingMockApi()
- [ ] Function named correctly: `get[ServiceName]Service`
- [ ] Exported from factory

---

## 🗺️ Step 6: Add Data Mapper

**File**: `src/services/index.ts`

```typescript
/**
 * Add at appropriate location in index.ts
 */

// Import the getter and interface
import { 
  getMyEntityService,
  IMyEntityService 
} from './api/apiServiceFactory';

// Define mapper function (converts API response to UI model)
const mapMyEntity = (m: MyEntityResponse): MyEntity => ({
  id: m.id,
  name: m.name,
  description: m.description,
  status: m.status as 'active' | 'inactive',
  created_at: m.createdAt,
  updated_at: m.updatedAt,
  tenant_id: m.tenantId
});

// Export service wrapper with transformation
export const myEntityService = {
  async getEntities(filters?: Record<string, unknown>): Promise<MyEntity[]> {
    const base: IMyEntityService = getMyEntityService();
    
    if (apiServiceFactory.isUsingMockApi()) {
      return base.getEntities(filters) as Promise<MyEntity[]>;
    }
    
    const res: MyEntityResponse[] = await base.getEntities(filters) as MyEntityResponse[];
    return res.map(mapMyEntity);
  },

  async getEntity(id: string): Promise<MyEntity> {
    const base: IMyEntityService = getMyEntityService();
    
    if (apiServiceFactory.isUsingMockApi()) {
      return base.getEntity(id) as Promise<MyEntity>;
    }
    
    const m: MyEntityResponse = await base.getEntity(id) as MyEntityResponse;
    return mapMyEntity(m);
  },

  async createEntity(data: Partial<MyEntity>): Promise<MyEntity> {
    const base: IMyEntityService = getMyEntityService();
    
    const req = {
      name: data.name,
      description: data.description,
      status: data.status
    };
    
    if (apiServiceFactory.isUsingMockApi()) {
      return base.createEntity(req) as Promise<MyEntity>;
    }
    
    const m: MyEntityResponse = await base.createEntity(req) as MyEntityResponse;
    return mapMyEntity(m);
  },

  async updateEntity(id: string, data: Partial<MyEntity>): Promise<MyEntity> {
    const base: IMyEntityService = getMyEntityService();
    
    const req = {
      name: data.name,
      description: data.description,
      status: data.status
    };
    
    if (apiServiceFactory.isUsingMockApi()) {
      return base.updateEntity(id, req) as Promise<MyEntity>;
    }
    
    const m: MyEntityResponse = await base.updateEntity(id, req) as MyEntityResponse;
    return mapMyEntity(m);
  },

  async deleteEntity(id: string): Promise<void> {
    const base: IMyEntityService = getMyEntityService();
    return base.deleteEntity(id);
  },

  async bulkDeleteEntities(ids: string[]): Promise<void> {
    const base: IMyEntityService = getMyEntityService();
    return base.bulkDeleteEntities(ids);
  }
};
```

### Checklist
- [ ] Mapper function created
- [ ] Converts camelCase (API) to snake_case (UI)
- [ ] All wrapper methods implemented
- [ ] Service exported from index.ts
- [ ] Type safety maintained
- [ ] Error handling preserved
- [ ] Both mock and real paths handled

---

## ⚙️ Step 7: Update Configuration

**File**: `src/config/apiConfig.ts`

```typescript
/**
 * 1. Update ApiEndpoints interface
 */
export interface ApiEndpoints {
  // ... existing endpoints
  myEntity: {
    base: string;
    search: string;
    bulk: string;
  };
}

/**
 * 2. Update apiEndpoints object
 */
export const apiEndpoints: ApiEndpoints = {
  // ... existing endpoints
  myEntity: {
    base: '/myEntities',          // List and create
    search: '/myEntities/search',  // Search endpoint
    bulk: '/myEntities/bulk'       // Bulk operations
  }
};
```

### Checklist
- [ ] Interface updated
- [ ] Endpoints added to config
- [ ] Endpoints follow REST conventions
- [ ] Matches backend API routes
- [ ] Base endpoint defined
- [ ] Additional endpoints added as needed

---

## 🧪 Step 8: Create Hook (Optional but Recommended)

**File**: `src/modules/features/[feature]/hooks/useMyEntities.ts`

```typescript
/**
 * Custom hook for MyEntity service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myEntityService } from '@/services';
import { MyEntity } from '@/types/crm';

export const useMyEntities = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['myEntities', filters],
    queryFn: () => myEntityService.getEntities(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMyEntity = (id: string) => {
  return useQuery({
    queryKey: ['myEntity', id],
    queryFn: () => myEntityService.getEntity(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateMyEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<MyEntity>) => myEntityService.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEntities'] });
    }
  });
};

export const useUpdateMyEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MyEntity> }) =>
      myEntityService.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEntities'] });
    }
  });
};

export const useDeleteMyEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => myEntityService.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEntities'] });
    }
  });
};
```

### Checklist
- [ ] Hook created with useQuery
- [ ] Proper query keys
- [ ] Stale time configured
- [ ] Mutations implemented
- [ ] Query invalidation on mutations
- [ ] Error handling included
- [ ] Loading states available

---

## 📚 Step 9: Add API Response Type

**File**: `src/services/api/interfaces/index.ts`

```typescript
/**
 * Add response interface (CamelCase from API)
 */

export interface MyEntityResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface MyEntityRequest {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}
```

### Checklist
- [ ] Response interface created
- [ ] Uses CamelCase (API convention)
- [ ] All required fields included
- [ ] Optional fields marked
- [ ] Exported from interfaces

---

## ✅ Step 10: Testing Checklist

- [ ] **Mock Service Test**: Set `VITE_USE_MOCK_API=true`, verify mock data loads
- [ ] **Real API Test**: Set `VITE_USE_MOCK_API=false`, backend running, verify API calls
- [ ] **Service Interface**: All methods implemented correctly
- [ ] **Type Safety**: No TypeScript errors
- [ ] **Data Mapping**: Mock and real data transform correctly
- [ ] **Error Handling**: Proper errors thrown and caught
- [ ] **CRUD Operations**: Create, read, update, delete all work
- [ ] **Filtering**: Filters applied correctly in mock service
- [ ] **Bulk Operations**: Bulk delete works if implemented
- [ ] **Performance**: No unnecessary API calls
- [ ] **DevTools**: Network tab shows correct calls (real mode only)
- [ ] **Hook Usage**: Custom hooks work properly with components

---

## 🚀 Step 11: Documentation

Create a README for your feature:

**File**: `src/modules/features/[feature]/README.md`

```markdown
# MyEntity Feature

## Overview
Brief description of the feature.

## Services
- `myEntityService` - Core service for MyEntity operations

## Hooks
- `useMyEntities()` - Get all entities
- `useMyEntity(id)` - Get single entity
- `useCreateMyEntity()` - Create entity mutation
- `useUpdateMyEntity()` - Update entity mutation
- `useDeleteMyEntity()` - Delete entity mutation

## API Endpoints
- GET `/myEntities` - List entities
- GET `/myEntities/{id}` - Get single entity
- POST `/myEntities` - Create entity
- PUT `/myEntities/{id}` - Update entity
- DELETE `/myEntities/{id}` - Delete entity

## Mock Data
Located in `src/services/myEntityService.ts`

## Usage Example
```typescript
import { useMyEntities } from '@/modules/features/[feature]/hooks/useMyEntities';

export const MyEntityList = () => {
  const { data: entities, isLoading } = useMyEntities();
  
  return (
    <div>
      {isLoading ? 'Loading...' : entities.map(e => <div key={e.id}>{e.name}</div>)}
    </div>
  );
};
```
```

### Checklist
- [ ] README created
- [ ] Feature overview documented
- [ ] Services documented
- [ ] Hooks documented
- [ ] API endpoints listed
- [ ] Usage examples provided
- [ ] Mock data location referenced

---

## 📋 Final Verification

### Code Quality
- [ ] No `any` types used
- [ ] Proper error handling
- [ ] TypeScript strict mode compliant
- [ ] No console.logs left
- [ ] No dead code
- [ ] Proper indentation and formatting

### Architecture Compliance
- [ ] Follows service factory pattern
- [ ] Mock and real services separated
- [ ] Data mapping implemented
- [ ] Interfaces properly defined
- [ ] Configuration updated
- [ ] API endpoints configured

### Testing
- [ ] Mock API mode tested
- [ ] Real API mode tested (if backend available)
- [ ] Error scenarios tested
- [ ] Data transformation verified
- [ ] Component integration tested

### Documentation
- [ ] Service documented
- [ ] Hooks documented
- [ ] API endpoints documented
- [ ] Usage examples provided
- [ ] README created

---

## 🎓 Common Patterns

### Pattern 1: Simple CRUD Service
Use this for basic entity management with standard CRUD operations.

### Pattern 2: Service with Filters
Add filtering logic for complex queries.

### Pattern 3: Service with Pagination
Implement pagination for large datasets.

### Pattern 4: Service with Search
Add full-text search capabilities.

### Pattern 5: Service with Relations
Handle related entities and nested data.

---

## 🔗 Related Files

- Types: `src/types/crm.ts`
- Mock Service: `src/services/myEntityService.ts`
- Real Service: `src/services/real/myEntityService.ts`
- Factory: `src/services/api/apiServiceFactory.ts`
- Wrapper: `src/services/index.ts`
- Config: `src/config/apiConfig.ts`
- Interfaces: `src/services/api/interfaces/index.ts`
- Hooks: `src/modules/features/[feature]/hooks/useMyEntities.ts`

---

## ✨ Tips & Tricks

1. **Use Faker.js for better mock data**
   ```typescript
   import { faker } from '@faker-js/faker';
   name: faker.company.name(),
   ```

2. **Leverage existing service patterns**
   - Check `customerService` for CRUD examples
   - Check `salesService` for complex operations

3. **Keep mock data realistic**
   - Use valid email formats
   - Use realistic company names
   - Use proper date formats (ISO 8601)

4. **Test both modes**
   - Switch VITE_USE_MOCK_API frequently
   - Ensure consistency between modes

5. **Document as you go**
   - Add comments for complex logic
   - Update README while implementing

---

**Remember**: The goal is to create services that work seamlessly in both mock and real modes with zero component code changes.

**Last Updated**: Current Session  
**Difficulty**: Medium  
**Time Estimate**: 30-45 minutes