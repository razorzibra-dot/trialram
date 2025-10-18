# 🔧 INTEGRATION ISSUES & FIXES CHECKLIST

**Priority Level:** CRITICAL | **Implementation Time:** 2-3 days

---

## 🚨 CRITICAL ISSUES (MUST FIX)

### Issue #1: ProductSaleDetail Component - Direct Service Import ⭐

**Severity:** 🔴 HIGH | **Impact:** Breaks mock/real API switching

**Location:** `src/components/product-sales/ProductSaleDetail.tsx:35-36`

**Current Code (BROKEN):**
```typescript
import { serviceContractService } from '@/services/serviceContractService';
```

**Problem:**
- ❌ Imports directly from file (not the index)
- ❌ Bypasses factory pattern
- ❌ Cannot switch between mock/real API
- ❌ When real API is disabled, still uses mock or crashes

**Fixed Code:**
```typescript
import { serviceContractService } from '@/services';
```

**Why This Matters:**
When users switch `VITE_USE_MOCK_API=false`, this component won't recognize the switch because it imports directly from the mock service file.

**Verification:**
After fix, verify that both import styles work:
```bash
# Mock mode
VITE_USE_MOCK_API=true npm run dev
# Check ProductSaleDetail works ✅

# Real API mode  
VITE_USE_MOCK_API=false npm run dev
# Check ProductSaleDetail tries real API ✅
```

---

### Issue #2: Missing Real API Service - ProductSaleService 🔴

**Severity:** 🔴 CRITICAL | **Impact:** Product Sales module cannot use real API

**Location:** Missing file: `src/services/real/productSaleService.ts`

**Current State:**
```
src/services/
├── productSaleService.ts          ✅ Mock service exists
└── real/
    └── productSaleService.ts      ❌ MISSING
```

**Fix Implementation:**

**Step 1:** Create file `src/services/real/productSaleService.ts`

```typescript
import { IProductSaleService } from '../api/apiServiceFactory';
import { baseApiService } from '../api/baseApiService';
import apiConfig from '@/config/apiConfig';
import { ProductSale } from '@/types/productSales';

export class RealProductSaleService implements IProductSaleService {
  async getProductSales(filters?: Record<string, unknown>): Promise<ProductSale[]> {
    try {
      const response = await baseApiService.get<ProductSale[]>(
        `${apiConfig.endpoints.productSales.base}`,
        { params: filters }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching product sales:', error);
      throw error;
    }
  }

  async getProductSale(id: string): Promise<ProductSale> {
    const response = await baseApiService.get<ProductSale>(
      `${apiConfig.endpoints.productSales.base}/${id}`
    );
    return response.data!;
  }

  async createProductSale(data: Partial<ProductSale>): Promise<ProductSale> {
    const response = await baseApiService.post<ProductSale>(
      `${apiConfig.endpoints.productSales.base}`,
      data
    );
    return response.data!;
  }

  async updateProductSale(id: string, data: Partial<ProductSale>): Promise<ProductSale> {
    const response = await baseApiService.put<ProductSale>(
      `${apiConfig.endpoints.productSales.base}/${id}`,
      data
    );
    return response.data!;
  }

  async deleteProductSale(id: string): Promise<void> {
    await baseApiService.delete(`${apiConfig.endpoints.productSales.base}/${id}`);
  }
}
```

**Step 2:** Add interface to `src/services/api/apiServiceFactory.ts`

```typescript
// After INotificationService, add:
export interface IProductSaleService {
  getProductSales(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getProductSale(id: string): Promise<Record<string, unknown>>;
  createProductSale(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateProductSale(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteProductSale(id: string): Promise<void>;
}
```

**Step 3:** Register in apiServiceFactory.ts

```typescript
// Add import at top
import { RealProductSaleService } from '../real/productSaleService';

// Add factory function
export function getProductSaleService(): IProductSaleService {
  if (isUsingMockApi()) {
    return mockProductSaleService;
  }
  return new RealProductSaleService();
}
```

**Step 4:** Update `src/services/index.ts`

```typescript
// Import the factory function
import { getProductSaleService, IProductSaleService } from './api/apiServiceFactory';

// Export wrapper
const _productSaleService = getProductSaleService();
export const productSaleService = _productSaleService;
```

**Testing:**
```bash
# Test mock mode
VITE_USE_MOCK_API=true npm run dev
# Product Sales should show mock data ✅

# Test real API mode
VITE_USE_MOCK_API=false npm run dev
# Product Sales should call backend ✅
# Check network tab for /api/v1/product-sales requests ✅
```

---

### Issue #3: Missing Real API Service - ServiceContractService 🔴

**Severity:** 🔴 CRITICAL | **Impact:** Service Contracts module cannot use real API

**Location:** Missing file: `src/services/real/serviceContractService.ts`

**Fix:** Follow same pattern as ProductSaleService above

**File Template:**
```typescript
import { IServiceContractService } from '../api/apiServiceFactory';
import { baseApiService } from '../api/baseApiService';
import apiConfig from '@/config/apiConfig';
import { ServiceContract } from '@/types/productSales';

export class RealServiceContractService implements IServiceContractService {
  async getServiceContracts(filters?: Record<string, unknown>): Promise<ServiceContract[]> {
    const response = await baseApiService.get(
      `${apiConfig.endpoints.serviceContracts.base}`,
      { params: filters }
    );
    return response.data || [];
  }

  async getServiceContract(id: string): Promise<ServiceContract> {
    const response = await baseApiService.get(
      `${apiConfig.endpoints.serviceContracts.base}/${id}`
    );
    return response.data;
  }

  async createServiceContract(data: Partial<ServiceContract>): Promise<ServiceContract> {
    const response = await baseApiService.post(
      `${apiConfig.endpoints.serviceContracts.base}`,
      data
    );
    return response.data;
  }

  async updateServiceContract(id: string, data: Partial<ServiceContract>): Promise<ServiceContract> {
    const response = await baseApiService.put(
      `${apiConfig.endpoints.serviceContracts.base}/${id}`,
      data
    );
    return response.data;
  }

  async deleteServiceContract(id: string): Promise<void> {
    await baseApiService.delete(`${apiConfig.endpoints.serviceContracts.base}/${id}`);
  }

  async getServiceContractByProductSaleId(productSaleId: string): Promise<ServiceContract | null> {
    const response = await baseApiService.get(
      `${apiConfig.endpoints.serviceContracts.base}/by-product-sale/${productSaleId}`
    );
    return response.data || null;
  }
}
```

**Endpoint Requirement:**
Backend .NET Core API must implement:
- `GET /api/v1/service-contracts`
- `GET /api/v1/service-contracts/{id}`
- `POST /api/v1/service-contracts`
- `PUT /api/v1/service-contracts/{id}`
- `DELETE /api/v1/service-contracts/{id}`
- `GET /api/v1/service-contracts/by-product-sale/{productSaleId}`

---

## ⚠️ HIGH PRIORITY ISSUES (SHOULD FIX)

### Issue #4: Missing ComplaintService Real API 🟡

**Severity:** 🟡 HIGH | **Impact:** Complaints module cannot use real API

**Fix:** Create `src/services/real/complaintService.ts` following ProductSaleService template

**Required Methods:**
- getComplaints()
- getComplaint(id)
- createComplaint()
- updateComplaint()
- deleteComplaint()

---

### Issue #5: Missing Service Interfaces 🟡

**Severity:** 🟡 MEDIUM | **Impact:** Type safety not enforced

**Location:** `src/services/api/apiServiceFactory.ts`

**Services Missing Interfaces:**
1. IProductSaleService
2. IServiceContractService
3. IComplaintService
4. ICompanyService
5. IConfigurationService
6. IJobWorkService
7. ILogsService
8. IPdfTemplateService
9. IPushService
10. IRbacService
11. ISchedulerService
12. ISuperAdminService
13. ITemplateService
14. ITenantService
15. IWhatsAppService
16. IProductService

**Fix:** Add each interface after INotificationService

Example for IProductSaleService:
```typescript
export interface IProductSaleService {
  getProductSales(filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  getProductSale(id: string): Promise<Record<string, unknown>>;
  createProductSale(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateProductSale(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteProductSale(id: string): Promise<void>;
}
```

---

### Issue #6: API Endpoints Configuration Incomplete 🟡

**Severity:** 🟡 MEDIUM | **Impact:** Services may not know correct endpoints

**Location:** `src/config/apiConfig.ts`

**Current Endpoints:**
```typescript
✅ auth
✅ customers
✅ sales
✅ tickets
✅ contracts
✅ users
✅ dashboard
✅ notifications
✅ files
✅ audit
❌ productSales
❌ serviceContracts
❌ complaints
❌ companies
❌ (and 11 more...)
```

**Fix:** Add missing endpoints

```typescript
export default {
  endpoints: {
    // ... existing endpoints ...
    
    productSales: {
      base: '/product-sales'
    },
    
    serviceContracts: {
      base: '/service-contracts'
    },
    
    complaints: {
      base: '/complaints'
    },
    
    companies: {
      base: '/companies'
    },
    
    configuration: {
      base: '/configuration'
    },
    
    jobWorks: {
      base: '/job-works'
    },
    
    pdfTemplates: {
      base: '/pdf-templates'
    },
    
    products: {
      base: '/products'
    },
    
    logs: {
      base: '/logs'
    },
    
    rbac: {
      base: '/rbac'
    },
    
    scheduler: {
      base: '/scheduler'
    },
    
    superAdmin: {
      base: '/super-admin'
    },
    
    templates: {
      base: '/templates'
    },
    
    tenants: {
      base: '/tenants'
    }
  }
};
```

---

## 🟢 MEDIUM PRIORITY ISSUES (GOOD TO FIX)

### Issue #7: Add Service Health Checks

**Severity:** 🟢 LOW | **Impact:** Better error detection

**Implementation:** Add to index.ts

```typescript
export async function checkServiceHealth(): Promise<boolean> {
  try {
    if (apiServiceFactory.isUsingMockApi()) return true;
    
    // Try a simple ping to backend
    const response = await baseApiService.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Service health check failed:', error);
    return false;
  }
}
```

---

### Issue #8: Add Logging for API Switching

**Severity:** 🟢 LOW | **Impact:** Better debugging

**In apiServiceFactory.ts:**

```typescript
export function getAuthService(): IAuthService {
  if (isUsingMockApi()) {
    console.log('🎭 Using MOCK AuthService');
    return mockAuthService;
  }
  console.log('🌐 Using REAL AuthService (Backend)');
  return new RealAuthService();
}
```

---

## ✅ VERIFICATION CHECKLIST

After implementing fixes, verify:

```
[ ] ProductSaleDetail imports from src/services/index.ts
[ ] ProductSaleService real API created and registered
[ ] ServiceContractService real API created and registered
[ ] ComplaintService real API created and registered
[ ] IProductSaleService interface defined
[ ] IServiceContractService interface defined
[ ] IComplaintService interface defined
[ ] API endpoints configured for all services
[ ] Mock mode works: VITE_USE_MOCK_API=true
[ ] Real API mode works: VITE_USE_MOCK_API=false
[ ] Network requests go to localhost:5137/api/v1 in real mode
[ ] All components use serviceContractService from index.ts
[ ] No direct imports from individual service files
[ ] Type checking passes: npm run type-check
[ ] Linting passes: npm run lint
```

---

## 📊 IMPLEMENTATION PRIORITY & TIMELINE

### Week 1 (Days 1-3)
- ✅ Fix ProductSaleDetail import
- ✅ Implement ProductSaleService real API
- ✅ Implement ServiceContractService real API
- ✅ Add IProductSaleService interface
- ✅ Add IServiceContractService interface
- ✅ Configure API endpoints

### Week 2 (Days 4-7)
- ✅ Implement ComplaintService real API
- ✅ Add remaining 12 service interfaces
- ✅ Add health checks
- ✅ Add logging

### Week 3+ (Additional Services)
- ✅ Implement other missing real APIs
- ✅ Performance optimization
- ✅ Caching implementation

---

## 🚀 QUICK START

### For Issue #1 (5 minutes):
```bash
# 1. Edit ProductSaleDetail.tsx
# 2. Change line 35-36 import
# 3. Save file
# Done!
```

### For Issue #2 (30 minutes):
```bash
# 1. Create src/services/real/productSaleService.ts
# 2. Copy template from above
# 3. Add interface to apiServiceFactory.ts
# 4. Update src/services/index.ts exports
# 5. Test with VITE_USE_MOCK_API toggle
```

### For Issue #3 (30 minutes):
```bash
# Same as Issue #2 for ServiceContractService
```

---

## ❓ FAQ

**Q: Will fixing these break existing functionality?**
A: No. All fixes are additive and maintain backward compatibility.

**Q: Can I implement the real APIs gradually?**
A: Yes. The factory pattern allows you to implement real APIs one service at a time.

**Q: What if the backend endpoints don't exist yet?**
A: You can keep using mock mode (VITE_USE_MOCK_API=true) until backend is ready.

**Q: How do I test the fixes?**
A: Run `npm run dev` with mock mode, then toggle VITE_USE_MOCK_API to test.

---

**Status:** 🔴 CRITICAL | **Action Required:** YES | **Timeline:** 2-3 days