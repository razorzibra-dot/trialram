# API Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PDS-CRM Application                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    React Components                           │ │
│  │  (Customers, Sales, Tickets, Contracts, Dashboard, etc.)     │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                  │
│                                  │ import { service } from          │
│                                  │ '@/services'                     │
│                                  ▼                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              src/services/index.ts                            │ │
│  │         (Central Service Export & Data Mapping)               │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │         src/services/api/apiServiceFactory.ts                 │ │
│  │              (Auto-Switching Factory)                         │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  if (VITE_USE_MOCK_API === 'true')                      │ │ │
│  │  │    return MockService                                    │ │ │
│  │  │  else                                                     │ │ │
│  │  │    return RealService                                    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────┬───────────────────────┬───────────────────┘ │
│                      │                       │                      │
│         MOCK MODE    │                       │    REAL MODE         │
│                      ▼                       ▼                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐ │
│  │   Mock/Static Services      │  │   Real Backend Services     │ │
│  │                             │  │                             │ │
│  │  src/services/              │  │  src/services/real/         │ │
│  │  ├── authService.ts         │  │  ├── authService.ts         │ │
│  │  ├── customerService.ts     │  │  ├── customerService.ts     │ │
│  │  ├── salesService.ts        │  │  ├── salesService.ts        │ │
│  │  ├── ticketService.ts       │  │  ├── ticketService.ts       │ │
│  │  └── ...                    │  │  └── ...                    │ │
│  │                             │  │                             │ │
│  │  Returns: Static Data       │  │  Uses: baseApiService       │ │
│  └─────────────────────────────┘  └──────────────┬──────────────┘ │
│                                                   │                 │
│                                                   ▼                 │
│                                  ┌─────────────────────────────┐   │
│                                  │  baseApiService.ts          │   │
│                                  │  (HTTP Client + Interceptors)│  │
│                                  └──────────────┬──────────────┘   │
│                                                 │                   │
└─────────────────────────────────────────────────┼───────────────────┘
                                                  │
                                                  │ HTTP Requests
                                                  ▼
                                  ┌─────────────────────────────┐
                                  │   .NET Core Backend API     │
                                  │   (http://localhost:5137)   │
                                  │                             │
                                  │  ├── Auth Controller        │
                                  │  ├── Customer Controller    │
                                  │  ├── Sales Controller       │
                                  │  ├── Ticket Controller      │
                                  │  └── ...                    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │   PostgreSQL Database       │
                                  └─────────────────────────────┘
```

---

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         .env File                                   │
│                                                                     │
│  VITE_USE_MOCK_API=true/false  ◄─── CHANGE THIS TO SWITCH MODE     │
│  VITE_API_ENVIRONMENT=development                                   │
│  VITE_API_BASE_URL=http://localhost:5137/api/v1                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Read on app startup
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   src/config/apiConfig.ts                           │
│                                                                     │
│  export function getApiConfig(): ApiEnvironment {                   │
│    const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';│
│    if (useMockApi) return environments.mock;                        │
│    return environments[environment];                                │
│  }                                                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Used by
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              src/services/api/apiServiceFactory.ts                  │
│                                                                     │
│  private useMockApi: boolean = isUsingMockApi();                    │
│                                                                     │
│  public getCustomerService(): ICustomerService {                    │
│    return this.useMockApi                                           │
│      ? mockCustomerService                                          │
│      : new RealCustomerService();                                   │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Interface Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ICustomerService Interface                       │
│                                                                     │
│  interface ICustomerService {                                       │
│    getCustomers(filters?: any): Promise<Customer[]>;               │
│    getCustomer(id: string): Promise<Customer>;                      │
│    createCustomer(data: any): Promise<Customer>;                    │
│    updateCustomer(id: string, data: any): Promise<Customer>;        │
│    deleteCustomer(id: string): Promise<void>;                       │
│  }                                                                  │
└────────────────────┬────────────────────────────┬───────────────────┘
                     │                            │
         Implements  │                            │  Implements
                     ▼                            ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│   MockCustomerService           │  │   RealCustomerService           │
│                                 │  │                                 │
│  class CustomerService          │  │  export class                   │
│    implements ICustomerService  │  │    RealCustomerService          │
│  {                              │  │    implements ICustomerService  │
│    private mockData = [...];    │  │  {                              │
│                                 │  │    async getCustomers() {       │
│    async getCustomers() {       │  │      const response =           │
│      return this.mockData;      │  │        await baseApiService     │
│    }                            │  │          .get('/customers');    │
│    // ... other methods         │  │      return response.data;      │
│  }                              │  │    }                            │
│                                 │  │    // ... other methods         │
│  export const customerService   │  │  }                              │
│    = new CustomerService();     │  │                                 │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

---

## Data Flow - Mock Mode

```
Component
   │
   │ customerService.getCustomers()
   ▼
src/services/index.ts
   │
   │ getCustomerService()
   ▼
apiServiceFactory
   │
   │ useMockApi = true
   ▼
MockCustomerService
   │
   │ return mockData
   ▼
Component receives data
```

---

## Data Flow - Real Mode

```
Component
   │
   │ customerService.getCustomers()
   ▼
src/services/index.ts
   │
   │ getCustomerService()
   ▼
apiServiceFactory
   │
   │ useMockApi = false
   ▼
RealCustomerService
   │
   │ baseApiService.get('/customers')
   ▼
baseApiService
   │
   │ Add auth headers, tenant ID, etc.
   │ HTTP GET request
   ▼
.NET Core Backend API
   │
   │ Process request
   │ Query database
   ▼
PostgreSQL Database
   │
   │ Return data
   ▼
Backend API
   │
   │ Format response
   │ { success: true, data: [...] }
   ▼
baseApiService
   │
   │ Handle response
   │ Map data if needed
   ▼
RealCustomerService
   │
   │ return response.data
   ▼
src/services/index.ts
   │
   │ Map to frontend model
   ▼
Component receives data
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Login Request                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  authService.login(email, password)                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
         MOCK   │                               │   REAL
                ▼                               ▼
┌─────────────────────────────┐  ┌─────────────────────────────────┐
│  MockAuthService            │  │  RealAuthService                │
│  - Return mock user         │  │  - POST /auth/login             │
│  - Generate fake token      │  │  - Receive JWT token            │
└──────────────┬──────────────┘  └──────────────┬──────────────────┘
               │                                │
               └────────────────┬───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Store in localStorage:                                             │
│  - crm_auth_token                                                   │
│  - crm_refresh_token                                                │
│  - crm_user                                                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  All subsequent requests include:                                   │
│  Authorization: Bearer <token>                                      │
│  X-Tenant-ID: <tenant_id>                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Component makes request
   │
   ▼
Service (Mock or Real)
   │
   ├─ Success ──────────────────────────────────┐
   │                                             │
   └─ Error                                      │
      │                                          │
      ▼                                          │
   baseApiService (Real mode only)              │
      │                                          │
      ├─ 401 Unauthorized                        │
      │  └─ Attempt token refresh                │
      │     ├─ Success: Retry request            │
      │     └─ Fail: Logout user                 │
      │                                          │
      ├─ 403 Forbidden                           │
      │  └─ Show "Access Denied" toast           │
      │                                          │
      ├─ 500 Server Error                        │
      │  └─ Retry with exponential backoff       │
      │                                          │
      └─ Other errors                            │
         └─ Show error toast                     │
                                                 │
                                                 ▼
                                    Component receives response
```

---

## Adding New Service - Visual Guide

```
Step 1: Define Interface
┌─────────────────────────────────────────────────────────────────────┐
│  src/services/api/apiServiceFactory.ts                              │
│                                                                     │
│  export interface IMyService {                                      │
│    getItems(): Promise<Item[]>;                                     │
│    // ... other methods                                             │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 2 & 3: Implement Services
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│  src/services/myService.ts   │  │  src/services/real/myService.ts  │
│                              │  │                                  │
│  class MyService             │  │  export class RealMyService      │
│    implements IMyService     │  │    implements IMyService         │
│  {                           │  │  {                               │
│    private mockData = [...]; │  │    async getItems() {            │
│    async getItems() {        │  │      return await                │
│      return this.mockData;   │  │        baseApiService            │
│    }                         │  │        .get('/items');           │
│  }                           │  │    }                             │
│                              │  │  }                               │
│  export const myService =    │  │                                  │
│    new MyService();          │  │                                  │
└──────────────────────────────┘  └──────────────────────────────────┘
                                │
                                ▼
Step 4: Register in Factory
┌─────────────────────────────────────────────────────────────────────┐
│  src/services/api/apiServiceFactory.ts                              │
│                                                                     │
│  class ApiServiceFactory {                                          │
│    public getMyService(): IMyService {                              │
│      return this.useMockApi                                         │
│        ? mockMyService                                              │
│        : new RealMyService();                                       │
│    }                                                                │
│  }                                                                  │
│                                                                     │
│  export const getMyService = () =>                                  │
│    apiServiceFactory.getMyService();                                │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
Step 5: Export from Index
┌─────────────────────────────────────────────────────────────────────┐
│  src/services/index.ts                                              │
│                                                                     │
│  import { getMyService } from './api/apiServiceFactory';            │
│                                                                     │
│  export const myService = getMyService();                           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ✅ Ready to use in components!
```

---

## Directory Structure

```
src/
├── config/
│   └── apiConfig.ts                    # API configuration & endpoints
│
├── services/
│   ├── index.ts                        # ⭐ Central export point
│   │
│   ├── api/
│   │   ├── apiServiceFactory.ts        # Service factory with auto-switching
│   │   ├── baseApiService.ts           # HTTP client with interceptors
│   │   └── interfaces/
│   │       └── index.ts                # TypeScript interfaces
│   │
│   ├── real/                           # Real .NET Core backend services
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── salesService.ts
│   │   ├── ticketService.ts
│   │   ├── contractService.ts
│   │   ├── userService.ts
│   │   ├── dashboardService.ts
│   │   ├── notificationService.ts
│   │   ├── fileService.ts
│   │   └── auditService.ts
│   │
│   └── [service]Service.ts             # Mock/static data services
│       ├── authService.ts
│       ├── customerService.ts
│       ├── salesService.ts
│       ├── ticketService.ts
│       └── ...
│
├── types/
│   ├── crm.ts                          # Frontend type definitions
│   ├── auth.ts
│   └── ...
│
└── modules/features/
    ├── customers/
    ├── sales/
    ├── tickets/
    └── ...
```

---

## Key Principles

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSISTENCY RULES                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Single Import Point                                             │
│     Always: import { service } from '@/services'                    │
│     Never:  import { service } from '@/services/service'            │
│                                                                     │
│  2. Dual Implementation                                             │
│     Every service MUST have both mock and real versions             │
│                                                                     │
│  3. Interface Consistency                                           │
│     Mock and real services implement the same interface             │
│                                                                     │
│  4. Automatic Switching                                             │
│     Mode determined by VITE_USE_MOCK_API environment variable       │
│                                                                     │
│  5. Data Mapping                                                    │
│     Backend ↔ Frontend data mapping in src/services/index.ts        │
│                                                                     │
│  6. Error Handling                                                  │
│     Consistent error handling in both mock and real services        │
│                                                                     │
│  7. Testing                                                         │
│     Test both modes before committing changes                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**For detailed implementation guide, see [API_SWITCHING_GUIDE.md](./API_SWITCHING_GUIDE.md)**

---

**Last Updated:** 2024 | **Version:** 1.0