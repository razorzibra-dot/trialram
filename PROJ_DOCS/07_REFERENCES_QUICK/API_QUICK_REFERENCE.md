# API Architecture Quick Reference Guide

## 🚀 Quick Start

### Switch Between APIs

#### 1. Edit `.env` file (root directory)
```env
# Use Mock/Static Data (Development)
VITE_USE_MOCK_API=true

# Use Real .NET Backend
VITE_USE_MOCK_API=false
```

#### 2. Restart Dev Server
```bash
npm run dev
```

**That's it!** Everything else switches automatically.

---

## 📁 File Structure Quick Reference

```
src/
├── services/
│   ├── index.ts                    ← 🎯 Import services from HERE
│   ├── api/
│   │   ├── apiServiceFactory.ts   ← Factory for creating services
│   │   ├── baseApiService.ts      ← HTTP client (Axios)
│   │   └── interfaces/            ← TypeScript interfaces
│   ├── real/
│   │   ├── customerService.ts     ← Real API implementation
│   │   ├── salesService.ts
│   │   └── ...
│   └── customerService.ts         ← Mock data implementation
│       ├── salesService.ts
│       └── ...
├── config/
│   └── apiConfig.ts               ← API configuration (endpoints, env)
├── types/
│   ├── crm.ts                     ← UI data models (snake_case)
│   └── ...
└── modules/
    └── features/
        └── customers/
            ├── views/
            │   └── CustomerListPage.tsx ← Uses useCustomers hook
            ├── hooks/
            │   └── useCustomers.ts      ← Uses customerService
            └── ...
```

---

## 💡 Key Concepts

### 1. Import Services
**✅ DO THIS:**
```typescript
import { customerService, salesService } from '@/services';
```

**❌ DON'T DO THIS:**
```typescript
import { customerService } from '@/services/customerService';  // ❌ Wrong!
```

### 2. Use in Components
```typescript
const MyComponent = () => {
  const { data, isLoading } = useCustomers();
  
  return (
    <div>
      {isLoading ? 'Loading...' : <CustomerList customers={data} />}
    </div>
  );
};
```

### 3. Data Flow
```
Component → Hook (useCustomers) → Service (customerService) 
→ Factory (checks VITE_USE_MOCK_API) 
→ Mock Service OR Real Service
```

---

## 🔧 Adding a New Service

### 5-Minute Checklist

- [ ] Create mock service in `src/services/myService.ts`
- [ ] Create interface in `src/services/api/apiServiceFactory.ts`
- [ ] Create real service in `src/services/real/myService.ts`
- [ ] Register in factory function (apiServiceFactory.ts)
- [ ] Add data mapper in `src/services/index.ts`
- [ ] Export from `src/services/index.ts`
- [ ] Add endpoints to `src/config/apiConfig.ts`

### Code Template

#### Mock Service (`src/services/myService.ts`)
```typescript
import { MyType } from '@/types/crm';

class MyService {
  private mockData: MyType[] = [
    { id: '1', name: 'Item 1' },
  ];

  async getAll(): Promise<MyType[]> {
    return this.mockData;
  }

  async getById(id: string): Promise<MyType> {
    return this.mockData.find(m => m.id === id)!;
  }
}

export const myService = new MyService();
```

#### Interface (`src/services/api/apiServiceFactory.ts`)
```typescript
export interface IMyService {
  getAll(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getById(id: string): Promise<Record<string, unknown>>;
}
```

#### Real Service (`src/services/real/myService.ts`)
```typescript
import { baseApiService } from '../api/baseApiService';
import { apiConfig } from '@/config/apiConfig';
import { IMyService } from '../api/apiServiceFactory';

export class RealMyService implements IMyService {
  async getAll(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const response = await baseApiService.get(apiConfig.endpoints.my.base);
    return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    return baseApiService.get(`${apiConfig.endpoints.my.base}/${id}`);
  }
}
```

#### Factory (`src/services/api/apiServiceFactory.ts`)
```typescript
export function getMyService(): IMyService {
  return isUsingMockApi()
    ? (myService as unknown as IMyService)
    : new RealMyService();
}
```

#### Wrapper (`src/services/index.ts`)
```typescript
const mapMyData = (m: MyResponse): MyType => ({
  id: m.id,
  name: m.myName,
  // ... mappings
});

export const myService = {
  async getAll(filters?: Record<string, unknown>): Promise<MyType[]> {
    const base = getMyService();
    if (apiServiceFactory.isUsingMockApi()) {
      return base.getAll(filters) as Promise<MyType[]>;
    }
    const res = await base.getAll(filters) as MyResponse[];
    return res.map(mapMyData);
  }
};
```

#### Config (`src/config/apiConfig.ts`)
```typescript
export interface ApiEndpoints {
  my: {
    base: string;
    search: string;
  };
}

export const apiEndpoints: ApiEndpoints = {
  my: {
    base: '/my',
    search: '/my/search',
  }
};
```

---

## 🐛 Common Issues & Fixes

### Issue: Component shows old data after .env change
**Fix**: Restart dev server (`npm run dev`)

### Issue: "VITE_USE_MOCK_API is not defined"
**Fix**: Check .env file exists and has: `VITE_USE_MOCK_API=true`

### Issue: API returns 401 (Unauthorized)
**Fix**: Check backend is running, verify token in localStorage

### Issue: Network tab shows no API calls (using mock)
**Fix**: This is normal! Mock services don't make network calls

### Issue: Real API returns different data structure
**Fix**: Update mapper function in `src/services/index.ts`

---

## 📊 Architecture Comparison

### Mock API (Development)
```
Component → Hook → Service (Mock)
                 ↓
            Static Data in Memory
            (No network call)
```

### Real API (Production)
```
Component → Hook → Service (Real)
                 ↓
            HTTP Request to Backend
                 ↓
            Response Processing
                 ↓
            Data Mapper (transform)
                 ↓
            Return to Component
```

---

## 🎯 Data Type Conventions

### Backend API (CamelCase)
```json
{
  "companyName": "Tech Corp",
  "contactName": "John Doe",
  "taxId": "12-3456789"
}
```

### Frontend UI (snake_case)
```typescript
{
  company_name: "Tech Corp",
  contact_name: "John Doe",
  tax_id: "12-3456789"
}
```

**Mapping happens automatically in `src/services/index.ts`**

---

## 🔍 Debugging Tips

### 1. Check Which API Mode is Active
```javascript
// In browser console
import { isUsingMockApi } from '@/config/apiConfig';
console.log(isUsingMockApi()); // true or false
```

### 2. View API Configuration
```javascript
// In browser console
import apiConfig from '@/config/apiConfig';
console.log(apiConfig);
```

### 3. Monitor API Calls
- Open DevTools → Network tab
- Filter by "Fetch/XHR"
- Mock mode: No calls
- Real mode: Calls to localhost:5137

### 4. Check Service Type
```typescript
// In service file
console.log(typeof getCustomerService()); // 'object'
console.log(getCustomerService().constructor.name);
```

---

## ✅ Best Practices

1. **Always import from `src/services/index.ts`**
   ```typescript
   ✅ import { customerService } from '@/services';
   ❌ import { customerService } from '@/services/customerService';
   ```

2. **Use hooks in components**
   ```typescript
   ✅ const { data } = useCustomers();
   ❌ const data = await customerService.getCustomers();
   ```

3. **Keep mock data consistent with real API**
   ```typescript
   // Mock must have same fields as API response
   mockCustomer: {
     id: '1',
     companyName: 'Corp',
     contactName: 'John'
   }
   ```

4. **Handle errors in components**
   ```typescript
   const { data, error, isLoading } = useCustomers();
   if (error) return <ErrorComponent error={error} />;
   ```

5. **Use TypeScript interfaces**
   ```typescript
   const getCustomer = (id: string): Promise<Customer> => {
     return customerService.getCustomer(id);
   };
   ```

---

## 📚 File Reference

| File | Purpose | When to Modify |
|------|---------|---|
| `.env` | Environment configuration | When switching between mock/real API |
| `src/config/apiConfig.ts` | API endpoints & config | When adding new endpoints |
| `src/services/index.ts` | Service exports & mappers | When adding new services or changing data shape |
| `src/services/customerService.ts` | Mock data | When updating test data |
| `src/services/real/customerService.ts` | Real API calls | When API contract changes |
| `src/services/api/apiServiceFactory.ts` | Service factory | When adding new services |

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set `VITE_USE_MOCK_API=false` in production .env
- [ ] Set correct `VITE_API_BASE_URL` for backend
- [ ] Test all services with real API
- [ ] Verify data transformation (mock vs real)
- [ ] Check error handling
- [ ] Test with slow network (DevTools → Throttling)
- [ ] Verify authentication tokens work
- [ ] Check CORS configuration on backend
- [ ] Run security scan

---

## 📞 Support

### Getting Help

1. **Check if mock/real API mode is correct**
   ```env
   VITE_USE_MOCK_API=true  # Development
   VITE_USE_MOCK_API=false # Production
   ```

2. **Verify service is exported from `src/services/index.ts`**

3. **Check TypeScript interfaces match data structure**

4. **Review API response in Network tab (DevTools)**

5. **Check `src/services/index.ts` mapper function**

---

## 🔗 Related Documentation

- Full Audit Report: `API_AUDIT_REPORT.md`
- Config Reference: `src/config/apiConfig.ts`
- Service Factory: `src/services/api/apiServiceFactory.ts`
- .env Example: `.env.example`

---

**Last Updated**: Current Session  
**Version**: 1.0  
**Status**: Production Ready ✅