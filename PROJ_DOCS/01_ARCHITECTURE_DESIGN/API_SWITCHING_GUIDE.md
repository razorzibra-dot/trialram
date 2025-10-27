# API Switching Guide

## Overview

The PDS-CRM application supports two API modes:
1. **Mock/Static Data API** - Uses local static data for development and testing
2. **Real .NET Core Backend API** - Connects to the actual backend server

This guide explains how to switch between these modes and maintain consistency.

---

## Quick Start: Switching API Modes

### Method 1: Environment Variable (Recommended)

1. Open the `.env` file in the project root
2. Modify the `VITE_USE_MOCK_API` variable:
   ```env
   # For Mock/Static Data
   VITE_USE_MOCK_API=true
   
   # For Real .NET Core Backend
   VITE_USE_MOCK_API=false
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```

### Method 2: Runtime Configuration

The application automatically detects the API mode on startup and logs it to the console:

```
╔════════════════════════════════════════════════════════════╗
║              CRM API CONFIGURATION                         ║
╠════════════════════════════════════════════════════════════╣
║  Mode: MOCK/STATIC DATA                                    ║
║  Base URL: /mock-api                                       ║
║  Environment: development                                  ║
╚════════════════════════════════════════════════════════════╝
```

---

## Configuration Files

### 1. `.env` - Main Configuration

```env
# API Configuration
VITE_USE_MOCK_API=true                          # true = Mock, false = Real
VITE_API_ENVIRONMENT=development                # development, staging, production
VITE_API_BASE_URL=http://localhost:5137/api/v1  # Backend API URL
VITE_API_TIMEOUT=30000                          # Request timeout in ms

# Authentication
VITE_AUTH_TOKEN_KEY=crm_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=crm_refresh_token
VITE_AUTH_USER_KEY=crm_user

# Features
VITE_ENABLE_LOGGING=true
VITE_ENABLE_METRICS=true
```

### 2. `src/config/apiConfig.ts` - API Configuration

This file contains:
- Environment configurations (development, staging, production, mock)
- API endpoint definitions
- Helper functions for API URL generation
- Automatic mode detection and logging

**Key Functions:**
- `getApiConfig()` - Returns current API configuration
- `isUsingMockApi()` - Checks if using mock API
- `getApiUrl(endpoint)` - Generates full API URL
- `getApiHeaders()` - Returns API headers with authentication

---

## Service Architecture

### Directory Structure

```
src/services/
├── index.ts                    # Central export point (USE THIS)
├── api/
│   ├── apiServiceFactory.ts    # Service factory with auto-switching
│   ├── baseApiService.ts       # Base HTTP client with interceptors
│   └── interfaces/
│       └── index.ts            # TypeScript interfaces for API
├── real/                       # Real .NET Core backend services
│   ├── authService.ts
│   ├── customerService.ts
│   ├── salesService.ts
│   ├── ticketService.ts
│   ├── contractService.ts
│   ├── userService.ts
│   ├── dashboardService.ts
│   ├── notificationService.ts
│   ├── fileService.ts
│   └── auditService.ts
└── [service]Service.ts         # Mock/static data services
    ├── authService.ts
    ├── customerService.ts
    ├── salesService.ts
    └── ...
```

### Service Flow

```
Component
    ↓
import { customerService } from '@/services'
    ↓
src/services/index.ts (Unified Interface)
    ↓
apiServiceFactory (Auto-switching)
    ↓
    ├─→ Mock Service (if VITE_USE_MOCK_API=true)
    └─→ Real Service (if VITE_USE_MOCK_API=false)
```

---

## Usage in Components

### ✅ Correct Usage

Always import services from the central index:

```typescript
import { customerService, authService, salesService } from '@/services';

// Use the service
const customers = await customerService.getCustomers();
const user = await authService.getCurrentUser();
```

### ❌ Incorrect Usage

Never import services directly:

```typescript
// DON'T DO THIS
import { customerService } from '@/services/customerService';
import { RealCustomerService } from '@/services/real/customerService';
```

---

## Adding New Services

When adding a new service, follow these steps to maintain consistency:

### Step 1: Define Interface

Add interface to `src/services/api/apiServiceFactory.ts`:

```typescript
export interface IMyNewService {
  getData(filters?: any): Promise<any[]>;
  getItem(id: string): Promise<any>;
  createItem(data: any): Promise<any>;
  updateItem(id: string, data: any): Promise<any>;
  deleteItem(id: string): Promise<void>;
}
```

### Step 2: Create Mock Service

Create `src/services/myNewService.ts`:

```typescript
class MyNewService implements IMyNewService {
  private mockData = [
    // Static data for development
  ];

  async getData(filters?: any): Promise<any[]> {
    // Return mock data
    return this.mockData;
  }

  async getItem(id: string): Promise<any> {
    return this.mockData.find(item => item.id === id);
  }

  // Implement other methods...
}

export const myNewService = new MyNewService();
```

### Step 3: Create Real Service

Create `src/services/real/myNewService.ts`:

```typescript
import { baseApiService } from '../api/baseApiService';
import { apiConfig } from '@/config/apiConfig';
import { IMyNewService } from '../api/apiServiceFactory';

export class RealMyNewService implements IMyNewService {
  async getData(filters?: any): Promise<any[]> {
    const response = await baseApiService.get('/my-endpoint', { params: filters });
    return response.data;
  }

  async getItem(id: string): Promise<any> {
    const response = await baseApiService.get(`/my-endpoint/${id}`);
    return response.data;
  }

  // Implement other methods...
}
```

### Step 4: Register in Factory

Update `src/services/api/apiServiceFactory.ts`:

```typescript
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
}

export const getMyNewService = () => apiServiceFactory.getMyNewService();
```

### Step 5: Export from Index

Update `src/services/index.ts`:

```typescript
import { getMyNewService } from './api/apiServiceFactory';

export const myNewService = getMyNewService();
```

---

## Data Mapping

The `src/services/index.ts` file handles data mapping between backend and frontend models.

### Example: Customer Mapping

```typescript
// Backend Response (from .NET Core API)
interface CustomerResponse {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  // ... camelCase properties
}

// Frontend Model (used in components)
interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  // ... snake_case properties
}

// Mapper function
const mapCustomer = (c: CustomerResponse): Customer => ({
  id: c.id,
  company_name: c.companyName,
  contact_name: c.contactName,
  email: c.email,
  // ... map all properties
});
```

---

## Testing Both Modes

### Test Checklist

When implementing a new feature, test both API modes:

- [ ] Test with `VITE_USE_MOCK_API=true`
  - Verify mock data displays correctly
  - Test CRUD operations with static data
  - Ensure no console errors

- [ ] Test with `VITE_USE_MOCK_API=false`
  - Verify backend API connection
  - Test CRUD operations with real data
  - Check authentication flow
  - Verify error handling

### Common Issues

#### Issue: Service not switching

**Solution:** Clear service instances and restart:
```typescript
apiServiceFactory.switchApiMode(false); // Force switch to real API
```

#### Issue: Data format mismatch

**Solution:** Check data mapping in `src/services/index.ts` and ensure mappers handle all properties.

#### Issue: Authentication errors

**Solution:** Verify token storage and refresh logic in `src/services/api/baseApiService.ts`.

---

## Backend API Requirements

For the real API mode to work, the .NET Core backend must:

1. **Run on configured port** (default: `http://localhost:5137`)
2. **Implement all endpoints** defined in `src/config/apiConfig.ts`
3. **Use consistent response format**:
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Success",
     "errors": []
   }
   ```
4. **Support JWT authentication** with Bearer tokens
5. **Handle CORS** for frontend origin
6. **Implement pagination** with standard parameters (page, limit, sort, order)

### Starting the Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project CrmPortal.API/CrmPortal.API.csproj
```

---

## Best Practices

### 1. Always Use Central Service Export

```typescript
// ✅ Good
import { customerService } from '@/services';

// ❌ Bad
import { customerService } from '@/services/customerService';
```

### 2. Handle Both Success and Error Cases

```typescript
try {
  const customers = await customerService.getCustomers();
  // Handle success
} catch (error) {
  // Handle error (works for both mock and real API)
  console.error('Failed to fetch customers:', error);
}
```

### 3. Use TypeScript Interfaces

```typescript
import { Customer } from '@/types/crm';

const customer: Customer = await customerService.getCustomer(id);
```

### 4. Keep Mock Data Realistic

Mock services should return data that closely resembles real API responses:

```typescript
private mockCustomers: Customer[] = [
  {
    id: '1',
    company_name: 'TechCorp Solutions',
    contact_name: 'Alice Johnson',
    email: 'alice@techcorp.com',
    // ... complete and realistic data
  }
];
```

### 5. Implement Consistent Error Handling

Both mock and real services should throw errors in the same format:

```typescript
throw new Error('Failed to fetch customer: Not found');
```

---

## Troubleshooting

### Problem: API mode not switching

**Symptoms:** Changes to `.env` don't take effect

**Solutions:**
1. Restart the development server completely
2. Clear browser cache and localStorage
3. Check console for API configuration log
4. Verify `.env` file is in the project root

### Problem: CORS errors with real API

**Symptoms:** Network errors when calling backend

**Solutions:**
1. Ensure backend CORS is configured for frontend origin
2. Check backend is running on correct port
3. Verify `VITE_API_BASE_URL` in `.env`

### Problem: Authentication not working

**Symptoms:** 401 errors on API calls

**Solutions:**
1. Check token storage in localStorage
2. Verify token refresh logic in `baseApiService.ts`
3. Ensure backend JWT configuration matches frontend

### Problem: Data not displaying correctly

**Symptoms:** Empty or malformed data in UI

**Solutions:**
1. Check data mapping functions in `src/services/index.ts`
2. Verify backend response format matches expected interface
3. Add console logs to mapper functions for debugging

---

## Environment-Specific Configuration

### Development

```env
VITE_USE_MOCK_API=true
VITE_API_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5137/api/v1
VITE_ENABLE_LOGGING=true
VITE_DEBUG_MODE=true
```

### Staging

```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=staging
VITE_API_BASE_URL=https://api-staging.yourcompany.com/api/v1
VITE_ENABLE_LOGGING=true
VITE_DEBUG_MODE=false
```

### Production

```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.yourcompany.com/api/v1
VITE_ENABLE_LOGGING=false
VITE_DEBUG_MODE=false
```

---

## Future Enhancements

When adding new features, ensure consistency by:

1. **Defining clear interfaces** for all services
2. **Implementing both mock and real versions** of every service
3. **Adding data mappers** for backend-to-frontend conversion
4. **Testing both API modes** before merging
5. **Updating this documentation** with new services
6. **Maintaining backward compatibility** with existing code

---

## Support

For questions or issues:
1. Check this guide first
2. Review console logs for API configuration
3. Verify `.env` settings
4. Check backend API is running (for real mode)
5. Review service implementation in `src/services/`

---

**Last Updated:** 2024
**Version:** 1.0