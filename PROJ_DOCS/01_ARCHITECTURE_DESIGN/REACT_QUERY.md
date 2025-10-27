---
title: React Query Architecture
description: Server state management, data fetching, caching, and synchronization
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: all
---

# React Query Architecture

## 🎯 Overview

**React Query** (TanStack Query v5) manages all server state: data fetched from the backend API. It handles caching, synchronization, background updates, and automatic retry logic.

**Key Responsibilities:**
- Fetch data from services
- Cache responses to avoid redundant requests
- Automatically sync data in the background
- Invalidate cache when data changes
- Manage loading and error states
- Handle retries on failure

**Why This Matters:**
- Eliminates manual useState/useEffect data fetching
- Automatic background sync keeps data fresh
- Cache prevents unnecessary API calls
- Better performance and user experience
- Consistent error handling across app

**Principle**: React Query = server state. Zustand = client state.

---

## 🏗️ React Query Architecture

```
┌──────────────────────────────────────┐
│      React Component                 │
└────────────────┬─────────────────────┘
                 │
                 │ useQuery()
                 ▼
    ┌────────────────────────────┐
    │  React Query Cache         │
    │  ├─ Query Key Hash         │
    │  ├─ Data                   │
    │  ├─ Status (stale/fresh)   │
    │  └─ Metadata               │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  Cache Status Check        │
    │  ├─ Fresh? → Return cached │
    │  └─ Stale? → Refetch       │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  Query Function            │
    │  (calls service)           │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  Service Factory           │
    │  (routes to mock/Supabase) │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  Backend API               │
    │  (REST or Supabase)        │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  Update Cache              │
    │  & Re-render Component     │
    └────────────────────────────┘
```

---

## 📝 Setup & Configuration

### Query Client Setup

**Location**: `src/config/queryClient.ts`

```typescript
import { QueryClient, DefaultError } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: 5 * 60 * 1000,              // 5 minutes - consider data fresh
      gcTime: 10 * 60 * 1000,                // 10 minutes (formerly cacheTime)

      // Retry logic
      retry: 2,                               // Retry 2 times on failure
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Component integration
      refetchOnWindowFocus: true,             // Refetch when window regains focus
      refetchOnReconnect: true,               // Refetch when connection restored
      refetchOnMount: false,                  // Don't refetch on component mount

      // Error handling
      throwOnError: false,                    // Don't throw, return error in response
    },

    mutations: {
      // Retry logic
      retry: 1,                               // Retry 1 time on failure
      
      // Error handling
      throwOnError: false,
    },
  },
});
```

### Provider Setup

**Location**: `src/main.tsx`

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

---

## 🔍 Query Keys

**Principle**: Query keys must be hierarchical and include all parameters that affect the data.

### Query Key Structure

```typescript
// Format: [domain, feature, id?, filters?, ...]
type QueryKey = [string, string, ...string[]]

// Examples:
['customers', tenantId]                    // All customers
['customers', tenantId, customerId]        // Single customer
['customers', tenantId, { status: 'active' }]  // Filtered customers
['sales', tenantId, 'stats']               // Sales statistics
['products', tenantId, { category: 'electronics' }]  // Filtered products
```

### Query Key Factory

```typescript
// src/services/queryKeys.ts
export const queryKeys = {
  // Customers
  customers: {
    all: (tenantId: string) => ['customers', tenantId] as const,
    detail: (tenantId: string, id: string) => 
      ['customers', tenantId, id] as const,
    list: (tenantId: string, filters?: CustomerFilters) =>
      ['customers', tenantId, { ...filters }] as const,
    search: (tenantId: string, query: string) =>
      ['customers', tenantId, 'search', query] as const,
  },

  // Sales
  sales: {
    all: (tenantId: string) => ['sales', tenantId] as const,
    detail: (tenantId: string, id: string) =>
      ['sales', tenantId, id] as const,
    list: (tenantId: string, filters?: SalesFilters) =>
      ['sales', tenantId, { ...filters }] as const,
    stats: (tenantId: string) =>
      ['sales', tenantId, 'stats'] as const,
  },

  // Products
  products: {
    all: (tenantId: string) => ['products', tenantId] as const,
    detail: (tenantId: string, id: string) =>
      ['products', tenantId, id] as const,
    list: (tenantId: string, filters?: ProductFilters) =>
      ['products', tenantId, { ...filters }] as const,
  },
};

// Usage
useQuery({
  queryKey: queryKeys.customers.list(tenantId, { status: 'active' }),
  queryFn: () => customerService.getCustomers(tenantId, { status: 'active' }),
});
```

---

## 🪝 useQuery Hook

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/serviceFactory';
import { queryKeys } from '@/services/queryKeys';
import { useSessionStore } from '@/stores/sessionStore';

function CustomerList() {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  // Fetch all customers
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.customers.all(tenantId),
    queryFn: () => customerService.getCustomers(tenantId),
    enabled: !!tenantId,  // Only run if tenantId exists
  });

  if (!tenantId) return <div>No tenant</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### Query with Filters

```typescript
function CustomerList() {
  const { currentTenant } = useSessionStore();
  const [filters, setFilters] = useState({ status: 'active' });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers.list(currentTenant?.id, filters),
    queryFn: () => 
      customerService.getCustomers(currentTenant?.id, filters),
    enabled: !!currentTenant?.id,
  });

  return (
    <div>
      <Select
        value={filters.status}
        onChange={(value) => setFilters({ status: value })}
      >
        <Option value="active">Active</Option>
        <Option value="inactive">Inactive</Option>
      </Select>
      
      {data?.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### Dependent Queries (Parallel)

```typescript
function CustomerDetail({ customerId }: { customerId: string }) {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  // Fetch customer data
  const customerQuery = useQuery({
    queryKey: queryKeys.customers.detail(tenantId, customerId),
    queryFn: () => customerService.getCustomer(customerId, tenantId),
    enabled: !!tenantId && !!customerId,
  });

  // Fetch related contacts (depends on customer)
  const contactsQuery = useQuery({
    queryKey: ['customers', tenantId, customerId, 'contacts'],
    queryFn: () => customerService.getContacts(customerId, tenantId),
    enabled: !!customerQuery.data,  // Only run after customer loaded
  });

  // Fetch sales (depends on customer)
  const salesQuery = useQuery({
    queryKey: ['customers', tenantId, customerId, 'sales'],
    queryFn: () => customerService.getSales(customerId, tenantId),
    enabled: !!customerQuery.data,  // Only run after customer loaded
  });

  if (customerQuery.isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{customerQuery.data?.name}</h1>
      
      {contactsQuery.isLoading ? <div>Loading contacts...</div> : (
        <div>
          {contactsQuery.data?.map(contact => (
            <div key={contact.id}>{contact.name}</div>
          ))}
        </div>
      )}

      {salesQuery.isLoading ? <div>Loading sales...</div> : (
        <div>
          {salesQuery.data?.map(sale => (
            <div key={sale.id}>{sale.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Infinite Query (Pagination)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function CustomerListInfinite() {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.customers.all(tenantId),
    queryFn: ({ pageParam }) => 
      customerService.getCustomers(tenantId, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.length > 0 ? lastPageParam + 1 : undefined,
    enabled: !!tenantId,
  });

  return (
    <div>
      {data?.pages.map((page) =>
        page.map((customer) => (
          <div key={customer.id}>{customer.name}</div>
        ))
      )}
      
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>
          Load More
        </Button>
      )}
    </div>
  );
}
```

---

## 🔄 Mutations (Create/Update/Delete)

### Basic Mutation

```typescript
import { useMutation } from '@tanstack/react-query';

function CreateCustomerForm() {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  const createMutation = useMutation({
    mutationFn: (newCustomer: CreateCustomerData) =>
      customerService.createCustomer(newCustomer, tenantId),
    
    // Called on success
    onSuccess: (data) => {
      message.success('Customer created successfully!');
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all(tenantId),
      });
    },

    // Called on error
    onError: (error) => {
      message.error(`Failed to create customer: ${error.message}`);
    },
  });

  const handleSubmit = async (formData: CreateCustomerData) => {
    await createMutation.mutateAsync(formData);
  };

  return (
    <Form onFinish={handleSubmit}>
      <Input name="name" placeholder="Customer Name" />
      <Button 
        loading={createMutation.isPending}
        htmlType="submit"
      >
        Create
      </Button>
    </Form>
  );
}
```

### Mutation with Optimistic Updates

```typescript
function UpdateCustomerForm({ customer }: { customer: Customer }) {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      customerService.updateCustomer(customer.id, data, tenantId),
    
    // Optimistic update: update cache immediately
    onMutate: async (newData) => {
      // Cancel any in-flight queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.customers.detail(tenantId, customer.id),
      });

      // Snapshot old data
      const previousCustomer = queryClient.getQueryData(
        queryKeys.customers.detail(tenantId, customer.id)
      );

      // Update cache optimistically
      queryClient.setQueryData(
        queryKeys.customers.detail(tenantId, customer.id),
        (old: Customer) => ({ ...old, ...newData })
      );

      return { previousCustomer };
    },

    onSuccess: () => {
      message.success('Customer updated!');
    },

    // Revert on error
    onError: (error, _, context) => {
      queryClient.setQueryData(
        queryKeys.customers.detail(tenantId, customer.id),
        context?.previousCustomer
      );
      message.error('Failed to update customer');
    },
  });

  const handleSubmit = (formData: Partial<Customer>) => {
    updateMutation.mutate(formData);
  };

  return (
    <Form onFinish={handleSubmit} initialValues={customer}>
      <Input name="name" placeholder="Name" />
      <Button loading={updateMutation.isPending} htmlType="submit">
        Save
      </Button>
    </Form>
  );
}
```

### Mutation with Batch Operations

```typescript
function BulkDeleteCustomers({ ids }: { ids: string[] }) {
  const { currentTenant } = useSessionStore();
  const tenantId = currentTenant?.id;

  const deleteMutation = useMutation({
    mutationFn: async (customerIds: string[]) => {
      // Delete all customers in parallel
      await Promise.all(
        customerIds.map(id =>
          customerService.deleteCustomer(id, tenantId)
        )
      );
    },

    onSuccess: () => {
      message.success(`Deleted ${ids.length} customers`);
      // Invalidate all customer queries
      queryClient.invalidateQueries({
        queryKey: ['customers'],
      });
    },
  });

  return (
    <Button
      danger
      loading={deleteMutation.isPending}
      onClick={() => deleteMutation.mutate(ids)}
    >
      Delete Selected
    </Button>
  );
}
```

---

## ✨ Cache Management

### Invalidate Queries

```typescript
// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: queryKeys.customers.detail(tenantId, customerId),
});

// Invalidate all queries for a feature
queryClient.invalidateQueries({
  queryKey: queryKeys.customers.all(tenantId),
});

// Invalidate all queries
queryClient.invalidateQueries();

// Invalidate with filters
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'customers' && 
    query.queryKey[1] === tenantId,
});
```

### Clear Cache

```typescript
// Clear specific query data
queryClient.removeQueries({
  queryKey: queryKeys.customers.detail(tenantId, customerId),
});

// Clear all queries
queryClient.clear();

// Clear on logout
export function clearCacheOnLogout() {
  queryClient.clear();
}
```

### Manual Cache Update

```typescript
// Set query data directly
queryClient.setQueryData(
  queryKeys.customers.detail(tenantId, customerId),
  newCustomerData
);

// Update query data with function
queryClient.setQueryData(
  queryKeys.customers.all(tenantId),
  (oldData: Customer[]) => [
    ...oldData,
    newCustomer,
  ]
);
```

---

## 📊 Status Management

### useQuery Status

```typescript
const { data, status, isLoading, isFetching, isError } = useQuery({
  queryKey: queryKeys.customers.all(tenantId),
  queryFn: () => customerService.getCustomers(tenantId),
});

// status can be: 'idle' | 'pending' | 'success' | 'error'
// isLoading: true while first request is in flight
// isFetching: true while any request is in flight (includes background sync)
// isError: true when error occurs

return (
  <>
    {isLoading && <Skeleton />}
    {isFetching && !isLoading && <div>Syncing...</div>}
    {data && <div>{data}</div>}
    {isError && <div>Error loading data</div>}
  </>
);
```

### useMutation Status

```typescript
const { data, status, isPending, isError } = useMutation({
  mutationFn: (newCustomer) => 
    customerService.createCustomer(newCustomer, tenantId),
});

// status can be: 'idle' | 'pending' | 'success' | 'error'
// isPending: true while mutation is in flight

return (
  <Button loading={isPending} onClick={() => mutate(formData)}>
    {isPending ? 'Creating...' : 'Create Customer'}
  </Button>
);
```

---

## 🚨 Error Handling

### Global Error Handler

```typescript
// src/config/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 401 or 403 errors
        if (error.status === 401 || error.status === 403) {
          return false;
        }
        // Retry other errors up to 3 times
        return failureCount < 3;
      },
    },
  },
});

// src/main.tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div>
      <h1>Query Error</h1>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      FallbackComponent={ErrorFallback}
    >
      {/* App */}
    </ErrorBoundary>
  );
}
```

### Per-Component Error Handling

```typescript
function CustomerList() {
  const { data, error, isError } = useQuery({
    queryKey: queryKeys.customers.all(tenantId),
    queryFn: () => customerService.getCustomers(tenantId),
  });

  if (isError) {
    // Handle specific error types
    if (error?.code === 'UNAUTHORIZED') {
      return <div>Please login again</div>;
    }
    if (error?.code === 'FORBIDDEN') {
      return <div>You don't have access to this data</div>;
    }
    return <div>Failed to load customers</div>;
  }

  return <div>{data}</div>;
}
```

---

## ✅ Best Practices

### ✅ DO

```typescript
// ✅ Use query keys factory
const { data } = useQuery({
  queryKey: queryKeys.customers.all(tenantId),
  queryFn: () => customerService.getCustomers(tenantId),
});

// ✅ Include tenant context in every query
const { data } = useQuery({
  queryKey: queryKeys.customers.all(tenantId),  // Tenant included
  queryFn: () => customerService.getCustomers(tenantId),  // Tenant included
});

// ✅ Use enabled for conditional queries
const { data } = useQuery({
  queryKey: queryKeys.customers.detail(tenantId, customerId),
  queryFn: () => customerService.getCustomer(customerId, tenantId),
  enabled: !!customerId && !!tenantId,  // Only run if both exist
});

// ✅ Invalidate on mutation success
useMutation({
  mutationFn: (data) => customerService.createCustomer(data, tenantId),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.all(tenantId),
    });
  },
});
```

### ❌ DON'T

```typescript
// ❌ Don't use hardcoded strings for query keys
const { data } = useQuery({
  queryKey: ['customers'],  // Missing tenant context!
  queryFn: () => customerService.getCustomers(),
});

// ❌ Don't mix client and server state
const [customers, setCustomers] = useState([]); // Avoid!
useQuery({
  queryKey: queryKeys.customers.all(tenantId),
  queryFn: () => customerService.getCustomers(tenantId),
  onSuccess: (data) => setCustomers(data), // Use query data directly
});

// ❌ Don't forget to enable queries conditionally
const { data } = useQuery({
  queryKey: queryKeys.customers.detail(tenantId, customerId),
  queryFn: () => customerService.getCustomer(customerId, tenantId),
  // Missing enabled! Will try to query even if customerId is undefined
});
```

---

## 📊 Monitoring & Debugging

### React Query DevTools

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/config/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Observer

```typescript
function QueryStatusMonitor() {
  const cache = queryClient.getQueryCache();

  const queries = cache.getAll();

  return (
    <div>
      <h3>Active Queries: {queries.length}</h3>
      {queries.map((query) => (
        <div key={String(query.queryKey)}>
          <p>Key: {JSON.stringify(query.queryKey)}</p>
          <p>Status: {query.getObserversCount()} observers</p>
          <p>Data: {query.isStale() ? 'Stale' : 'Fresh'}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Implementation Checklist

- [ ] QueryClient configured with appropriate timeouts
- [ ] QueryClientProvider wraps application
- [ ] Query key factory created for all features
- [ ] All queries include tenantId
- [ ] useQuery used for server state fetching
- [ ] useMutation used for create/update/delete
- [ ] Query invalidation on mutation success
- [ ] Error handling implemented
- [ ] Optimistic updates where appropriate
- [ ] Loading states shown to users
- [ ] React Query DevTools enabled in dev

---

## 🔗 Related Documentation

- [Service Factory Pattern](./SERVICE_FACTORY.md) - How queries fetch data
- [State Management](./STATE_MANAGEMENT.md) - Client state vs server state
- [Session Management](./SESSION_MANAGEMENT.md) - Tenant context in queries

---

**Last Updated**: 2025-01-20  
**Version**: React Query 5.90.2  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team