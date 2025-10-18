# 🏗️ Local Supabase Architecture Guide

## System Architecture

### Local Development Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER (Docker)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📱 React Frontend (Vite Dev Server)                     │   │
│  │  http://localhost:5173                                   │   │
│  │                                                          │   │
│  │  • .tsx components                                       │   │
│  │  • React Router for navigation                           │   │
│  │  • Zustand for state management                          │   │
│  │  • TailwindCSS for styling                               │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                       │
│           │ HTTP/WebSocket (REST + Real-time)                   │
│           │                                                       │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │  🔌 Supabase API (PostgREST)                             │   │
│  │  http://localhost:54321                                  │   │
│  │                                                          │   │
│  │  • REST API (CRUD operations)                            │   │
│  │  • GraphQL endpoint                                      │   │
│  │  • Authentication middleware                             │   │
│  │  • Row Level Security enforcement                        │   │
│  │  • Real-time subscriptions (WebSocket)                   │   │
│  │  • JWT verification                                      │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                       │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │  🗄️  PostgreSQL Database                                 │   │
│  │  localhost:5432                                          │   │
│  │                                                          │   │
│  │  • Relational data storage                               │   │
│  │  • Row Level Security policies                           │   │
│  │  • Triggers for timestamps (created_at, updated_at)      │   │
│  │  • Full-text search capabilities                         │   │
│  │  • JSON operators for flexible data                      │   │
│  └────────────────────────────────────────────────────────┘   │
│           │                                                       │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │  🎨 Supabase Studio (Web UI)                             │   │
│  │  http://localhost:54323                                  │   │
│  │                                                          │   │
│  │  • Table management                                      │   │
│  │  • SQL editor                                            │   │
│  │  • Auth management                                       │   │
│  │  • Data browser                                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  ✉️  Inbucket (Email Testing)                            │     │
│  │  http://localhost:54324                                 │     │
│  │                                                          │     │
│  │  • Email preview in development                          │     │
│  │  • No real emails sent                                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

All services run locally via Docker containers!
```

---

## 🗂️ File Organization & Flow

### Configuration Layer

```
.env (Environment Variables)
 ├─ VITE_API_MODE=supabase         ← Global backend selection
 ├─ VITE_SUPABASE_URL=http://...   ← Points to localhost:54321
 ├─ VITE_SUPABASE_ANON_KEY=...     ← JWT for authentication
 ├─ VITE_SUPABASE_SERVICE_KEY=...  ← Admin key (server-side)
 ├─ VITE_SUPABASE_ENABLE_REALTIME  ← Real-time subscriptions
 └─ VITE_*_BACKEND                 ← Per-service backend override

src/config/backendConfig.ts (Backend Configuration Service)
 └─ Reads environment variables
    ├─ Validates configuration
    ├─ Provides getServiceBackend() helper
    └─ Prints debug information
```

### Service Layer

```
src/services/supabase/
 ├─ client.ts (Singleton)
 │  └─ Creates single Supabase client instance
 │     ├─ Connects to http://localhost:54321
 │     ├─ Handles authentication
 │     └─ Manages real-time subscriptions
 │
 ├─ baseService.ts (Abstract Base Class)
 │  └─ Provides common CRUD operations
 │     ├─ create(), read(), update(), delete()
 │     ├─ search(), filter(), sort()
 │     ├─ pagination()
 │     ├─ subscribeToChanges() [Real-time]
 │     └─ Error handling
 │
 ├─ authService.ts (Extends BaseService)
 │  └─ User authentication
 │     ├─ signUp()
 │     ├─ signIn()
 │     ├─ signOut()
 │     └─ Session management
 │
 ├─ customerService.ts (Extends BaseService)
 ├─ salesService.ts (Extends BaseService)
 ├─ contractService.ts (Extends BaseService)
 ├─ fileService.ts (Extends BaseService)
 ├─ notificationService.ts (Extends BaseService)
 └─ index.ts (Exports all services)
```

### Component/Hook Layer

```
src/components/
 ├─ Customer/
 │  └─ CustomerList.tsx
 │     └─ Uses useQuery() hook
 │        └─ Calls customerService.getAll()
 │           ├─ Fetches from http://localhost:54321
 │           ├─ PostgreSQL returns data
 │           └─ Real-time updates via WebSocket
 │
 ├─ Sales/
 │  └─ SalesList.tsx
 │     └─ Uses useSubscription() hook
 │        └─ Real-time changes streamed
 │
 └─ ...
```

---

## 🔄 Request-Response Flow

### Example: Fetching Customers

```
1. React Component Mounts
   └─ useEffect(() => { fetchCustomers() }, [])

2. Call Service Layer
   └─ const customers = await customerService.getAll()

3. Service Makes API Request
   └─ GET http://localhost:54321/rest/v1/customers
      ├─ Header: Authorization: Bearer <JWT_TOKEN>
      └─ Query: ?limit=50&offset=0

4. Supabase API (PostgREST)
   ├─ Verifies JWT token
   ├─ Checks Row Level Security policies
   ├─ Constructs SQL query
   └─ Forwards to PostgreSQL

5. PostgreSQL Executes Query
   ├─ SELECT * FROM customers WHERE ... (RLS policies applied)
   └─ Returns rows

6. Supabase API Formats Response
   └─ JSON array of customer objects

7. Service Parses Response
   └─ const customers = JSON.parse(response)

8. React Component Updates
   └─ setState(customers)
   └─ Component re-renders with data

9. User Sees Data
   └─ Customer list displayed in UI
```

### Example: Real-Time Updates

```
1. Component Subscribes to Changes
   └─ customerService.subscribeToChanges()

2. WebSocket Connection Established
   └─ ws://localhost:54321 (WebSocket upgrade)

3. PostgreSQL Change Event Occurs
   ├─ INSERT INTO customers ...
   ├─ UPDATE customers SET ...
   └─ DELETE FROM customers ...

4. Supabase Detects Change
   └─ Database trigger fires

5. Event Sent Over WebSocket
   └─ New data pushed to client (no polling!)

6. Service Receives Event
   └─ Callback function called with new data

7. Component Updates
   └─ UI updates instantly

8. User Sees Change
   └─ New/updated/deleted customer appears in real time
```

---

## 🔐 Security & Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│  User Registration / Login                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1. User submits credentials
                   │    signUp(email, password)
                   ▼
        ┌──────────────────────┐
        │  Supabase Auth (JWT) │
        │  :54321/auth/v1      │
        └──────────┬───────────┘
                   │
                   │ 2. Validates & creates user
                   │    Generates JWT token
                   ▼
        ┌──────────────────────┐
        │  PostgreSQL (auth    │
        │  schema)             │
        └──────────┬───────────┘
                   │
                   │ 3. Stores JWT in browser
                   │    localStorage.setItem(...)
                   ▼
        ┌──────────────────────┐
        │  Browser Local Store │
        └──────────┬───────────┘
                   │
                   │ 4. Include JWT in all requests
                   │    Authorization: Bearer <JWT>
                   ▼
        ┌──────────────────────────────┐
        │  All Subsequent API Calls     │
        │  • JWT verified              │
        │  • Row Level Security applied│
        │  • User context available    │
        └──────────────────────────────┘
```

### Row Level Security (RLS) Example

```sql
-- Only users can see their own records
CREATE POLICY "Users see own data"
ON customers FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can delete
CREATE POLICY "Only admins delete"
ON customers FOR DELETE
USING (auth.jwt() ->> 'role' = 'admin');
```

In request flow:
```
1. User makes request
   └─ JWT token included

2. Supabase extracts user ID from JWT
   └─ auth.uid() = 'user-123-abc'

3. RLS policy evaluated
   └─ SELECT * FROM customers
      WHERE auth.uid() = user_id

4. Only user's own records returned
   └─ Perfect for multi-tenant systems!
```

---

## 🔌 Service Layer Implementation Pattern

### Base Class (Template Method Pattern)

```typescript
// src/services/supabase/baseService.ts

abstract class BaseSupabaseService {
  protected table: string;
  
  // Template methods - derived classes use these
  async getAll() {
    const { data, error } = await client
      .from(this.table)
      .select();
    return data;
  }
  
  async create(record: T) {
    const { data, error } = await client
      .from(this.table)
      .insert(record)
      .select();
    return data;
  }
  
  // Real-time subscription
  subscribe(callback) {
    return client
      .channel(`public:${this.table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.table },
        callback
      )
      .subscribe();
  }
}
```

### Service Implementation

```typescript
// src/services/supabase/customerService.ts

class CustomerService extends BaseSupabaseService {
  table = 'customers';
  
  async getById(id: string) {
    return super.getById(id); // Inherited method
  }
  
  async findByEmail(email: string) {
    // Custom method specific to customers
    const { data } = await client
      .from('customers')
      .select()
      .eq('email', email);
    return data?.[0];
  }
}
```

### Component Usage

```typescript
// src/components/Customer/CustomerList.tsx

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  
  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      const data = await customerService.getAll();
      setCustomers(data);
    };
    fetchData();
    
    // Subscribe to real-time changes
    const subscription = customerService.subscribe((payload) => {
      console.log('Customer changed:', payload);
      // Update state with new data
      setCustomers(prev => [...prev, payload.new]);
    });
    
    return () => subscription?.unsubscribe();
  }, []);
  
  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

---

## 🌐 Multi-Backend Switching

### Configuration-Driven Design

```
Environment Variable: VITE_API_MODE
├─ mock       → Use hardcoded test data
├─ real       → Use .NET Core backend API
└─ supabase   → Use local/cloud Supabase

Factory Pattern: apiServiceFactory.ts
├─ Reads VITE_API_MODE
├─ Returns correct service implementation
└─ Component uses same interface (polymorphism)
```

### Example: Service Factory

```typescript
// src/services/api/apiServiceFactory.ts

export function getCustomerService() {
  const mode = import.meta.env.VITE_API_MODE || 'mock';
  
  switch (mode) {
    case 'mock':
      return new MockCustomerService();
    case 'real':
      return new RealCustomerService();
    case 'supabase':
      return new SupabaseCustomerService();
    default:
      return new MockCustomerService();
  }
}
```

### Component is Agnostic

```typescript
// Works with ANY backend! No changes needed.
const customerService = getCustomerService();
const customers = await customerService.getAll();
```

---

## 📊 Database Schema Example

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email varchar(255),
  name varchar(255),
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(20),
  address text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id bigserial PRIMARY KEY,
  customer_id bigint REFERENCES public.customers(id),
  user_id uuid REFERENCES public.profiles(id),
  amount decimal(15,2),
  status varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their customers"
ON public.customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their customers"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🚀 Deployment Strategy

### Development → Production Migration

```
PHASE 1: Local Development (Current)
├─ VITE_API_MODE=supabase
├─ VITE_SUPABASE_URL=http://localhost:54321
└─ Data: Local PostgreSQL

PHASE 2: Prepare for Cloud
├─ Create Supabase project at supabase.com
├─ Set up tables & policies in cloud
├─ Test with cloud credentials locally
└─ Environment variables updated

PHASE 3: Deploy to Production
├─ Update .env with cloud credentials
├─ VITE_API_MODE=supabase (same!)
├─ VITE_SUPABASE_URL=https://your-project.supabase.co
└─ No code changes needed! Only config changes.
```

### Zero-Downtime Migration

```
Services:           Mock        Real API    Supabase
                    ────────────────────────────────
Gradual Rollout:
Week 1:             100%        0%          0%
Week 2:             70%         20%         10%
Week 3:             30%         30%         40%
Week 4:             0%          0%          100%

Implementation:
VITE_API_MODE=supabase        # Global: all services use Supabase
VITE_CUSTOMER_BACKEND=mock    # Override: customers use mock
VITE_SALES_BACKEND=real       # Override: sales use real API
VITE_TICKET_BACKEND=supabase  # Override: tickets use Supabase
```

---

## 🎯 Benefits of Local Supabase

| Benefit | Details |
|---------|---------|
| **No Internet Required** | Develop offline |
| **Fast** | Local network = instant responses |
| **Safe** | No production data exposed |
| **Real Database** | PostgreSQL with all features |
| **Real-Time** | WebSocket subscriptions work |
| **Scalable** | Same as cloud version |
| **Easy Testing** | Reset data anytime with `supabase db reset` |
| **Free** | No cloud costs during development |

---

## 🔗 Service Dependencies

```
Application Components
        │
        ▼
Service Factory (getCustomerService, etc.)
        │
        ├─ Mock Services (static data)
        ├─ Real Services (calls .NET API)
        └─ Supabase Services (calls POST← API)
                │
                ▼
        Backend Config (reads .env)
                │
                ├─ VITE_API_MODE
                ├─ VITE_SUPABASE_URL
                ├─ VITE_SUPABASE_ANON_KEY
                └─ Per-service overrides

        Supabase Client (Singleton)
                │
                └─ HTTP/WebSocket to localhost:54321
                   │
                   ├─ JWT Authentication
                   ├─ Row Level Security
                   └─ Real-time Subscriptions
```

---

## 📚 Resources

- **This System:** Local Supabase running on your machine
- **Database:** PostgreSQL (port 5432)
- **API:** Supabase PostgREST (port 54321)
- **UI:** Supabase Studio (port 54323)
- **Documentation:** See LOCAL_SUPABASE_SETUP.md

---

**Architecture is clean, scalable, and ready for production! 🚀**