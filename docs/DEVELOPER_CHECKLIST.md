# Developer Checklist - API Consistency

This checklist ensures consistency between Mock/Static Data API and Real .NET Core Backend API.

---

## 📋 Before Starting Development

- [ ] Read [API Switching Guide](./API_SWITCHING_GUIDE.md)
- [ ] Understand the dual API architecture
- [ ] Know how to switch between Mock and Real API modes
- [ ] Verify `.env` configuration is correct
- [ ] Test that both API modes work on your machine

---

## 🆕 Adding a New Service

### Step 1: Planning
- [ ] Define the service interface with all required methods
- [ ] Document expected request/response formats
- [ ] Identify data mapping requirements (backend ↔ frontend)
- [ ] Plan mock data structure

### Step 2: Interface Definition
- [ ] Open `src/services/api/apiServiceFactory.ts`
- [ ] Add new interface extending base service interface
- [ ] Define all method signatures with proper TypeScript types
- [ ] Add JSDoc comments for each method

**Example:**
```typescript
export interface IMyNewService {
  /**
   * Get all items with optional filters
   */
  getItems(filters?: any): Promise<ItemResponse[]>;
  
  /**
   * Get single item by ID
   */
  getItem(id: string): Promise<ItemResponse>;
  
  // ... other methods
}
```

### Step 3: Mock Service Implementation
- [ ] Create `src/services/myNewService.ts`
- [ ] Implement `IMyNewService` interface
- [ ] Add realistic mock data (at least 5-10 items)
- [ ] Implement all CRUD operations
- [ ] Add proper error handling
- [ ] Test mock service independently

**Checklist for Mock Service:**
- [ ] Implements the interface completely
- [ ] Returns realistic data
- [ ] Handles edge cases (empty results, not found, etc.)
- [ ] Uses proper TypeScript types
- [ ] Includes JSDoc comments
- [ ] Simulates async behavior (setTimeout if needed)

### Step 4: Real Service Implementation
- [ ] Create `src/services/real/myNewService.ts`
- [ ] Implement `IMyNewService` interface
- [ ] Use `baseApiService` for HTTP calls
- [ ] Use endpoints from `apiConfig.endpoints`
- [ ] Add proper error handling
- [ ] Map backend response to frontend model

**Checklist for Real Service:**
- [ ] Implements the interface completely
- [ ] Uses `baseApiService.get/post/put/delete`
- [ ] Uses correct API endpoints from `apiConfig`
- [ ] Handles HTTP errors properly
- [ ] Maps backend data to frontend model
- [ ] Includes JSDoc comments
- [ ] Handles authentication automatically (via baseApiService)

### Step 5: Factory Registration
- [ ] Open `src/services/api/apiServiceFactory.ts`
- [ ] Import both mock and real services
- [ ] Add service instance property
- [ ] Add getter method with auto-switching logic
- [ ] Add to `clearServiceInstances()` method
- [ ] Export convenience function

**Example:**
```typescript
// Import services
import { RealMyNewService } from '../real/myNewService';
import { myNewService as mockMyNewService } from '../myNewService';

class ApiServiceFactory {
  private myNewServiceInstance: IMyNewService | null = null;

  public getMyNewService(): IMyNewService {
    if (!this.myNewServiceInstance) {
      this.myNewServiceInstance = this.useMockApi 
        ? mockMyNewService
        : new RealMyNewService();
    }
    return this.myNewServiceInstance;
  }

  private clearServiceInstances(): void {
    // ... existing code
    this.myNewServiceInstance = null;
  }
}

export const getMyNewService = () => apiServiceFactory.getMyNewService();
```

### Step 6: Export from Index
- [ ] Open `src/services/index.ts`
- [ ] Import getter function from factory
- [ ] Create service wrapper if data mapping needed
- [ ] Export service instance
- [ ] Add JSDoc comments

**Example (Simple Export):**
```typescript
import { getMyNewService } from './api/apiServiceFactory';

export const myNewService = getMyNewService();
```

**Example (With Data Mapping):**
```typescript
import { getMyNewService } from './api/apiServiceFactory';

export const myNewService = {
  async getItems(filters?: any): Promise<Item[]> {
    const base = getMyNewService();
    if (apiServiceFactory.isUsingMockApi()) {
      return base.getItems(filters);
    }
    const response = await base.getItems(filters);
    return response.map(mapItemToFrontend);
  },
  // ... other methods
};
```

### Step 7: Testing
- [ ] Test with Mock API (`VITE_USE_MOCK_API=true`)
  - [ ] All CRUD operations work
  - [ ] Mock data displays correctly
  - [ ] No console errors
  - [ ] Edge cases handled (empty, not found, etc.)

- [ ] Test with Real API (`VITE_USE_MOCK_API=false`)
  - [ ] Backend endpoint exists and works
  - [ ] All CRUD operations work
  - [ ] Data mapping works correctly
  - [ ] Authentication works
  - [ ] Error handling works
  - [ ] No console errors

- [ ] Test switching between modes
  - [ ] Switch from Mock to Real
  - [ ] Switch from Real to Mock
  - [ ] Verify no cached data issues

### Step 8: Documentation
- [ ] Add service to this checklist
- [ ] Update `docs/API_SWITCHING_GUIDE.md` if needed
- [ ] Add JSDoc comments to all methods
- [ ] Document any special requirements
- [ ] Update `.zencoder/rules/repo.md` if needed

---

## 🔄 Modifying Existing Service

### Before Making Changes
- [ ] Identify which service needs modification
- [ ] Check if service has both mock and real implementations
- [ ] Review existing interface definition
- [ ] Plan changes to maintain backward compatibility

### Making Changes
- [ ] Update interface in `src/services/api/apiServiceFactory.ts`
- [ ] Update mock service in `src/services/[service]Service.ts`
- [ ] Update real service in `src/services/real/[service]Service.ts`
- [ ] Update data mapping in `src/services/index.ts` if needed
- [ ] Update TypeScript types if needed

### Testing Changes
- [ ] Test with Mock API
- [ ] Test with Real API
- [ ] Test all affected components
- [ ] Verify backward compatibility
- [ ] Check for console errors

---

## 🧪 Testing Checklist

### Mock API Testing
- [ ] Set `VITE_USE_MOCK_API=true` in `.env`
- [ ] Restart development server
- [ ] Verify console shows "MOCK/STATIC DATA" mode
- [ ] Test all CRUD operations
- [ ] Test filtering and pagination
- [ ] Test error scenarios
- [ ] Verify UI displays data correctly

### Real API Testing
- [ ] Set `VITE_USE_MOCK_API=false` in `.env`
- [ ] Ensure backend is running
- [ ] Restart development server
- [ ] Verify console shows "REAL .NET CORE BACKEND" mode
- [ ] Test all CRUD operations
- [ ] Test filtering and pagination
- [ ] Test authentication flow
- [ ] Test error scenarios
- [ ] Verify UI displays data correctly

### Integration Testing
- [ ] Test switching between modes
- [ ] Test with different user roles
- [ ] Test with different tenants
- [ ] Test concurrent operations
- [ ] Test error recovery

---

## 📝 Code Review Checklist

### For Reviewers
- [ ] Both mock and real services implemented
- [ ] Interface properly defined
- [ ] Services registered in factory
- [ ] Exported from index
- [ ] Data mapping implemented correctly
- [ ] Error handling present
- [ ] TypeScript types correct
- [ ] JSDoc comments present
- [ ] Tests pass for both modes
- [ ] No direct service imports in components
- [ ] Backward compatibility maintained

### Common Issues to Check
- [ ] No hardcoded API URLs
- [ ] No direct imports of mock/real services
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] No duplicate code
- [ ] Proper TypeScript types
- [ ] No console.log statements (use proper logging)

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All services have both implementations
- [ ] All tests pass for both modes
- [ ] `.env.example` is up to date
- [ ] Documentation is updated
- [ ] No console errors in production build
- [ ] Backend API is ready and tested

### Environment Configuration
- [ ] Development: `VITE_USE_MOCK_API=true`
- [ ] Staging: `VITE_USE_MOCK_API=false`, staging API URL
- [ ] Production: `VITE_USE_MOCK_API=false`, production API URL

### Post-Deployment
- [ ] Verify API mode in console
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Verify authentication works
- [ ] Check API response times

---

## 🔍 Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Direct import of mock service
import { customerService } from '@/services/customerService';

// Direct import of real service
import { RealCustomerService } from '@/services/real/customerService';

// Hardcoded API URL
const response = await fetch('http://localhost:5137/api/customers');

// Skipping mock implementation
// Only implementing real service

// Inconsistent interfaces
// Mock and real services have different methods
```

### ✅ Do This Instead
```typescript
// Import from central index
import { customerService } from '@/services';

// Use configured API
import { baseApiService } from '@/services/api/baseApiService';
const response = await baseApiService.get('/customers');

// Implement both versions
// Mock service in src/services/
// Real service in src/services/real/

// Consistent interfaces
// Both implement ICustomerService
```

---

## 📚 Reference

### Key Files
- `src/services/index.ts` - Central service export
- `src/services/api/apiServiceFactory.ts` - Service factory
- `src/services/api/baseApiService.ts` - HTTP client
- `src/config/apiConfig.ts` - API configuration
- `.env` - Environment configuration

### Documentation
- [API Switching Guide](./API_SWITCHING_GUIDE.md)
- [Repository Overview](../.zencoder/rules/repo.md)
- [Documentation Index](./README.md)

### Commands
```bash
# Start development with mock API
VITE_USE_MOCK_API=true npm run dev

# Start development with real API
VITE_USE_MOCK_API=false npm run dev

# Start backend
cd backend && dotnet run --project CrmPortal.API/CrmPortal.API.csproj

# Run tests
npm test

# Build for production
npm run build
```

---

## ✅ Final Checklist

Before marking your work as complete:

- [ ] All items in relevant sections checked
- [ ] Both API modes tested
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Backward compatibility maintained
- [ ] Team members notified of changes

---

**Remember:** Consistency between Mock and Real API is critical for smooth development and deployment. Always implement and test both versions!

---

**Last Updated:** 2024
**Version:** 1.0