# Quick Reference Card - API Consistency

## 🔄 Switch API Mode

### In `.env` file:
```env
# Mock/Static Data
VITE_USE_MOCK_API=true

# Real .NET Backend
VITE_USE_MOCK_API=false
```

**Then restart:** `npm run dev`

---

## ✅ Design Assurances (Performance Pattern)
- **Concurrency safety:** PageDataService and ModuleDataProvider reuse a single in-flight promise per cache key (tenant + requirements) so StrictMode double-render and rapid navigation do not duplicate fetches.
- **Complex workflows:** Supports parallel fan-out (customers + users + reference) with cached reuse; gate complex pages with feature flags to stage rollout.
- **Separation/loose coupling:** Modules consume data via useModuleData/useService routed through the factory; reference data stays in context; session data comes from SessionService cache—no direct Supabase/service imports in modules.
- **Safe pilot/rollback:** Keep legacy hooks available; pilot on Customers first; rollback by removing the ModuleDataProvider wrapper and restoring legacy hooks. Cache stays route-scoped with invalidation on navigation.

---

## 📦 Import Services

### ✅ ALWAYS DO THIS:
```typescript
import { customerService, authService, salesService } from '@/services';
```

### ❌ NEVER DO THIS:
```typescript
import { customerService } from '@/services/customerService';
import { RealCustomerService } from '@/services/real/customerService';
```

---

## 🆕 Add New Service (5 Steps)

### 1. Define Interface
**File:** `src/services/api/apiServiceFactory.ts`
```typescript
export interface IMyService {
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item>;
  createItem(data: any): Promise<Item>;
  updateItem(id: string, data: any): Promise<Item>;
  deleteItem(id: string): Promise<void>;
}
```

### 2. Create Mock Service
**File:** `src/services/myService.ts`
```typescript
class MyService implements IMyService {
  private mockData = [/* mock data */];
  
  async getItems(): Promise<Item[]> {
    return this.mockData;
  }
  // ... implement all methods
}

export const myService = new MyService();
```

### 3. Create Real Service
**File:** `src/services/real/myService.ts`
```typescript
import { baseApiService } from '../api/baseApiService';
import { IMyService } from '../api/apiServiceFactory';

export class RealMyService implements IMyService {
  async getItems(): Promise<Item[]> {
    const response = await baseApiService.get('/items');
    return response.data;
  }
  // ... implement all methods
}
```

### 4. Register in Factory
**File:** `src/services/api/apiServiceFactory.ts`
```typescript
import { RealMyService } from '../real/myService';
import { myService as mockMyService } from '../myService';

class ApiServiceFactory {
  private myServiceInstance: IMyService | null = null;

  public getMyService(): IMyService {
    if (!this.myServiceInstance) {
      this.myServiceInstance = this.useMockApi 
        ? mockMyService
        : new RealMyService();
    }
    return this.myServiceInstance;
  }
}

export const getMyService = () => apiServiceFactory.getMyService();
```

### 5. Export from Index
**File:** `src/services/index.ts`
```typescript
import { getMyService } from './api/apiServiceFactory';

export const myService = getMyService();
```

---

## 🧪 Test Both Modes

### Mock API Test:
```bash
# 1. Set in .env
VITE_USE_MOCK_API=true

# 2. Restart
npm run dev

# 3. Check console for:
# "Mode: MOCK/STATIC DATA"

# 4. Test all operations
```

### Real API Test:
```bash
# 1. Start backend
cd backend && dotnet run

# 2. Set in .env
VITE_USE_MOCK_API=false

# 3. Restart
npm run dev

# 4. Check console for:
# "Mode: REAL .NET CORE BACKEND"

# 5. Test all operations
```

---

## 📁 File Structure

```
src/services/
├── index.ts                    ⭐ Import from here
├── api/
│   ├── apiServiceFactory.ts    📝 Define interfaces
│   ├── baseApiService.ts       🌐 HTTP client
│   └── interfaces/             📋 Type definitions
├── real/                       🔴 Real backend services
│   ├── authService.ts
│   ├── customerService.ts
│   └── ...
└── [service]Service.ts         🟢 Mock services
```

---

## 🔑 Key Rules

1. ✅ **Always import from** `@/services`
2. ✅ **Implement both** mock and real versions
3. ✅ **Use same interface** for both
4. ✅ **Test both modes** before commit
5. ✅ **Map data** in `src/services/index.ts`
6. ✅ **Keep mock data realistic**
7. ✅ **Document changes**

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Mode not switching | Restart dev server |
| CORS errors | Check backend CORS config |
| Auth not working | Check token in localStorage |
| Data not showing | Check data mapping |
| Console errors | Check API configuration log |

---

## 📞 Quick Commands

```bash
# Development with mock
npm run dev

# Start backend
cd backend && dotnet run

# Build production
npm run build

# Check API mode
# Look for console log on app start
```

---

## 🌍 Environment Setup

### Development (Mock):
```env
VITE_USE_MOCK_API=true
VITE_API_ENVIRONMENT=development
```

### Development (Real):
```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5137/api/v1
```

### Production:
```env
VITE_USE_MOCK_API=false
VITE_API_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.yourcompany.com/api/v1
```

---

## 📚 Full Documentation

- **[API Switching Guide](./API_SWITCHING_GUIDE.md)** - Complete guide
- **[Developer Checklist](./DEVELOPER_CHECKLIST.md)** - Step-by-step checklist
- **[Repository Overview](../.zencoder/rules/repo.md)** - Architecture details

---

## ⚡ Quick Tips

- Console shows API mode on startup
- Both services must have same methods
- Use `baseApiService` for HTTP calls
- Map backend data to frontend models
- Test edge cases (empty, errors, etc.)
- Keep mock data up-to-date
- Document breaking changes

---

**Print this card and keep it handy! 📌**

---

**Last Updated:** 2024 | **Version:** 1.0