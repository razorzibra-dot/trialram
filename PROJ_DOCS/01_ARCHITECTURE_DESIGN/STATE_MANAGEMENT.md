---
title: State Management Architecture
description: Zustand for client state, React Query for server state, and Context API integration
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: all
---

# State Management Architecture

## 🎯 Overview

**State Management** controls how application data flows through React components. The PDS-CRM uses a **dual-store pattern**:

1. **React Query** - Server state (data from backend)
2. **Zustand** - Client state (UI state, filters, user preferences)
3. **Context API** - Shared configuration and providers

**Key Principle**: Keep them separate. Don't duplicate server state in Zustand.

**Why This Matters:**
- React Query handles caching and sync automatically
- Zustand keeps UI responsive without server coupling
- Separation of concerns makes code predictable
- Prevents data consistency issues

---

## 🏗️ State Management Architecture

```
┌─────────────────────────────────────────────────────┐
│                React Component                      │
│  const { data } = useQuery(...)  [Server State]     │
│  const { filter } = useFilter()   [Client State]    │
└────────────┬────────────────────┬──────────────────┘
             │                    │
    ┌────────▼───────────┐   ┌────▼─────────────┐
    │  React Query Cache │   │  Zustand Store  │
    │  - Products        │   │  - Filters      │
    │  - Customers       │   │  - Modal open   │
    │  - Sales           │   │  - Drawer open  │
    │  [Cached, Stale]   │   │  - Sort order   │
    └────────────────────┘   └────┬────────────┘
             ▲                     │
             │                     │
    ┌────────┴───────────────────┬┘
    │  useEffect/Mutations       │  User Interaction
    │  Invalidate on change      │  Update filters
    │                            │
    └─────────┬──────────────────┴─────────┐
              │                             │
         ┌────▼──────────┐           ┌─────▼─────┐
         │ Service       │           │ localStorage
         │ Factory       │           │ Persist UI
         └────┬──────────┘           │ state
              │                       └──────────┘
         ┌────▼──────────┐
         │ Backend API   │
         │ (Supabase)    │
         └───────────────┘
```

---

## 💾 Zustand Store Pattern

### Session Store (Persistent)

**Location**: `src/stores/sessionStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantName: string;
  permissions: string[];
  avatar?: string;
}

interface SessionStore {
  // User state
  currentUser: SessionUser | null;
  currentTenant: { id: string; name: string } | null;

  // Session status
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: SessionUser) => void;
  setTenant: (tenant: { id: string; name: string }) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;

  // Queries
  isAuthenticated: () => boolean;
  getPermissions: () => string[];
  hasPermission: (permission: string) => boolean;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentTenant: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ currentUser: user }),
      setTenant: (tenant) => set({ currentTenant: tenant }),
      clearSession: () => set({
        currentUser: null,
        currentTenant: null,
        error: null,
      }),
      setLoading: (loading) => set({ isLoading: loading }),

      isAuthenticated: () => get().currentUser !== null,
      getPermissions: () => get().currentUser?.permissions || [],
      hasPermission: (permission: string) =>
        get().currentUser?.permissions?.includes(permission) ?? false,
    }),
    {
      name: 'session-store',  // localStorage key
      partialize: (state) => ({  // Only persist these fields
        currentUser: state.currentUser,
        currentTenant: state.currentTenant,
      }),
    }
  )
);

// Usage in component
function MyComponent() {
  const { currentUser, hasPermission } = useSessionStore();
  const canEdit = hasPermission('customer_update');
  return <div>{currentUser?.email} - Can edit: {canEdit}</div>;
}
```

### UI Store (Non-Persistent)

**Location**: `src/stores/uiStore.ts`

```typescript
import { create } from 'zustand';

interface UIStore {
  // Modal states
  modals: {
    createCustomer: boolean;
    editCustomer: boolean;
    deleteCustomer: boolean;
    importCustomers: boolean;
  };

  // Drawer states
  drawers: {
    customerFilter: boolean;
    settingsSidebar: boolean;
  };

  // UI state
  currentView: 'grid' | 'list';
  sidebarCollapsed: boolean;
  notificationBadges: Record<string, number>;

  // Actions
  openModal: (modalName: keyof UIStore['modals']) => void;
  closeModal: (modalName: keyof UIStore['modals']) => void;
  openDrawer: (drawerName: keyof UIStore['drawers']) => void;
  closeDrawer: (drawerName: keyof UIStore['drawers']) => void;
  setView: (view: 'grid' | 'list') => void;
  toggleSidebar: () => void;
  setBadge: (feature: string, count: number) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  modals: {
    createCustomer: false,
    editCustomer: false,
    deleteCustomer: false,
    importCustomers: false,
  },

  drawers: {
    customerFilter: false,
    settingsSidebar: false,
  },

  currentView: 'grid',
  sidebarCollapsed: false,
  notificationBadges: {},

  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  openDrawer: (drawerName) =>
    set((state) => ({
      drawers: { ...state.drawers, [drawerName]: true },
    })),

  closeDrawer: (drawerName) =>
    set((state) => ({
      drawers: { ...state.drawers, [drawerName]: false },
    })),

  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({
    sidebarCollapsed: !state.sidebarCollapsed,
  })),

  setBadge: (feature, count) =>
    set((state) => ({
      notificationBadges: { ...state.notificationBadges, [feature]: count },
    })),
}));

// Usage in component
function CustomerHeader() {
  const { openModal } = useUIStore();

  return (
    <Button onClick={() => openModal('createCustomer')}>
      Create Customer
    </Button>
  );
}

function CreateCustomerModal() {
  const { modals, closeModal } = useUIStore();

  return (
    <Modal
      open={modals.createCustomer}
      onCancel={() => closeModal('createCustomer')}
    >
      {/* Modal content */}
    </Modal>
  );
}
```

### Filter Store (Persistent)

**Location**: `src/stores/filterStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  // Customer filters
  customers: {
    searchText: string;
    status: string[];
    dateRange: [string, string] | null;
    tags: string[];
  };

  // Sales filters
  sales: {
    searchText: string;
    stage: string[];
    minAmount: number | null;
    maxAmount: number | null;
    owner: string | null;
  };

  // Generic setters
  setCustomerFilters: (filters: Partial<FilterState['customers']>) => void;
  setSalesFilters: (filters: Partial<FilterState['sales']>) => void;
  clearAllFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      customers: {
        searchText: '',
        status: [],
        dateRange: null,
        tags: [],
      },

      sales: {
        searchText: '',
        stage: [],
        minAmount: null,
        maxAmount: null,
        owner: null,
      },

      setCustomerFilters: (filters) =>
        set((state) => ({
          customers: { ...state.customers, ...filters },
        })),

      setSalesFilters: (filters) =>
        set((state) => ({
          sales: { ...state.sales, ...filters },
        })),

      clearAllFilters: () =>
        set({
          customers: {
            searchText: '',
            status: [],
            dateRange: null,
            tags: [],
          },
          sales: {
            searchText: '',
            stage: [],
            minAmount: null,
            maxAmount: null,
            owner: null,
          },
        }),
    }),
    {
      name: 'filter-store',
      partialize: (state) => ({
        customers: state.customers,
        sales: state.sales,
      }),
    }
  )
);

// Usage with React Query
function CustomerList() {
  const filters = useFilterStore((state) => state.customers);

  const { data: customers } = useQuery({
    queryKey: ['customers', filters],  // Filters in key!
    queryFn: () => customerService.getCustomers(filters),
    enabled: true,
  });

  return <div>{/* Display customers */}</div>;
}
```

---

## 🔄 Server State with React Query

### Simple Query Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryKeys';

function CustomerList() {
  const { currentTenant } = useSessionStore();

  // Server state
  const { data: customers, isLoading, error } = useQuery({
    queryKey: queryKeys.customers.all(currentTenant?.id),
    queryFn: () => customerService.getCustomers(currentTenant?.id),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });

  return (
    <div>
      {isLoading ? <Skeleton /> : customers?.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

### Query with Client-Side Filtering

```typescript
function CustomerListWithFilters() {
  const { currentTenant } = useSessionStore();
  const filters = useFilterStore((state) => state.customers);

  // 1. Fetch ALL customers from server
  const { data: allCustomers } = useQuery({
    queryKey: queryKeys.customers.all(currentTenant?.id),
    queryFn: () => customerService.getCustomers(currentTenant?.id),
  });

  // 2. Filter on client side (doesn't re-fetch)
  const filteredCustomers = useMemo(() => {
    if (!allCustomers) return [];

    return allCustomers.filter((customer) => {
      if (filters.searchText && 
          !customer.name.includes(filters.searchText)) {
        return false;
      }

      if (filters.status.length > 0 &&
          !filters.status.includes(customer.status)) {
        return false;
      }

      if (filters.tags.length > 0 &&
          !filters.tags.some(tag => customer.tags?.includes(tag))) {
        return false;
      }

      return true;
    });
  }, [allCustomers, filters]);

  return (
    <div>
      <Input
        value={filters.searchText}
        onChange={(e) =>
          useFilterStore.setState((state) => ({
            customers: { ...state.customers, searchText: e.target.value },
          }))
        }
        placeholder="Search..."
      />
      {filteredCustomers?.map(c => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 Context API for Configuration

### Theme Context

```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useContext } from 'react';
import { theme } from '@/theme/salesforceTheme';

interface ThemeContextType {
  theme: typeof theme;
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setDarkMode] = useState(false);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Notification Context

```typescript
// src/contexts/NotificationContext.tsx
import { createContext, useContext } from 'react';
import { message } from 'antd';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notif: Omit<Notification, 'id'>) => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notif: Omit<Notification, 'id'>) => {
    const id = generateId();
    const fullNotif = { ...notif, id };

    // Show Ant Design message
    message[notif.type](notif.message);

    // Add to state
    setNotifications((prev) => [...prev, fullNotif]);

    // Auto-remove
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, notif.duration || 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within NotificationProvider'
    );
  }
  return context;
}
```

---

## 🔗 Integration: Combining All Three

```typescript
function CompleteCustomerPage() {
  // 1. Session from Zustand (persistent)
  const { currentTenant, hasPermission } = useSessionStore();

  // 2. UI state from Zustand (non-persistent)
  const { modals, openModal, closeModal } = useUIStore();

  // 3. Filters from Zustand (persistent)
  const filters = useFilterStore((state) => state.customers);

  // 4. Server data from React Query
  const { data: customers, isLoading } = useQuery({
    queryKey: queryKeys.customers.list(
      currentTenant?.id,
      filters
    ),
    queryFn: () =>
      customerService.getCustomers(currentTenant?.id, filters),
    enabled: !!currentTenant?.id,
  });

  // 5. Theme from Context
  const { theme } = useTheme();

  // 6. Mutations for create/update/delete
  const createMutation = useMutation({
    mutationFn: (data) =>
      customerService.createCustomer(data, currentTenant?.id),
    onSuccess: () => {
      message.success('Customer created');
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all(currentTenant?.id),
      });
      closeModal('createCustomer');
    },
  });

  if (!hasPermission('customer_read')) {
    return <div>Access Denied</div>;
  }

  return (
    <div style={{ background: theme.colors.background }}>
      {/* Header with action buttons */}
      {hasPermission('customer_create') && (
        <Button onClick={() => openModal('createCustomer')}>
          Create Customer
        </Button>
      )}

      {/* Filter section */}
      <CustomerFilters />

      {/* Customer table */}
      {isLoading ? (
        <Skeleton />
      ) : (
        <Table
          dataSource={customers}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Actions',
              render: (_, record) =>
                hasPermission('customer_update') && (
                  <Button type="link" onClick={() => console.log(record)}>
                    Edit
                  </Button>
                ),
            },
          ]}
        />
      )}

      {/* Create modal */}
      <Modal
        open={modals.createCustomer}
        onCancel={() => closeModal('createCustomer')}
      >
        <Form
          onFinish={(data) =>
            createMutation.mutate(data)
          }
        >
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
          <Button
            loading={createMutation.isPending}
            htmlType="submit"
          >
            Create
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
```

---

## ❌ Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Duplicating Server State in Zustand

```typescript
// WRONG - Duplicates React Query data
const store = create((set) => ({
  customers: [],  // WRONG! This duplicates server data
  fetchCustomers: async () => {
    const data = await api.getCustomers();
    set({ customers: data });  // Manual caching - why?
  },
}));

// RIGHT - Use React Query
const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => api.getCustomers(),
});
```

### ❌ Anti-Pattern 2: Storing Stale Data

```typescript
// WRONG - Data will be stale
const [data, setData] = useState(null);
useEffect(() => {
  api.getData().then(setData);  // Called once on mount
}, []);

// RIGHT - React Query auto-sync
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.getData(),
  staleTime: 5 * 60 * 1000,  // Refetch after 5 min
  refetchOnWindowFocus: true,  // Refetch when returning to tab
});
```

### ❌ Anti-Pattern 3: Over-Persisting

```typescript
// WRONG - Persisting everything including errors
const store = create(
  persist(
    (set) => ({
      data: null,
      error: null,
      isLoading: false,
      // ...
    }),
    { name: 'store' }  // Persists all fields
  )
);

// RIGHT - Selective persistence
const store = create(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'store',
      partialize: (state) => ({  // Only persist these
        data: state.data,
        preferences: state.preferences,
        // Don't persist: error, isLoading
      }),
    }
  )
);
```

---

## ✅ Best Practices

### ✅ DO

- **DO**: Use React Query for all server state
- **DO**: Use Zustand for UI state (modals, filters, preferences)
- **DO**: Persist user preferences but not loading states
- **DO**: Invalidate queries when mutations succeed
- **DO**: Include filters in query key
- **DO**: Check permissions in Zustand
- **DO**: Use Context for configuration
- **DO**: Memoize filtered/computed data

### ❌ DON'T

- **DON'T**: Duplicate server state in Zustand
- **DON'T**: Persist loading states or errors
- **DON'T**: Call API directly in useEffect
- **DON'T**: Store full user objects in localStorage
- **DON'T**: Use Context for frequently-changing state
- **DON'T**: Create new store for every feature
- **DON'T**: Ignore stale time settings
- **DON'T**: Forget to enable queries conditionally

---

## 📊 State Organization Guide

```
┌─────────────────────────────────────────────┐
│        React Query (Server State)           │
├─────────────────────────────────────────────┤
│ - Products                                  │
│ - Customers                                 │
│ - Sales                                     │
│ - Tickets                                   │
│ - Any data from backend                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    Zustand Session Store (Persistent)      │
├─────────────────────────────────────────────┤
│ - currentUser                               │
│ - currentTenant                             │
│ - permissions                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│     Zustand UI Store (Non-Persistent)      │
├─────────────────────────────────────────────┤
│ - Modal open/close states                   │
│ - Drawer open/close states                  │
│ - Sidebar collapsed/expanded                │
│ - Current view mode                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    Zustand Filter Store (Persistent)       │
├─────────────────────────────────────────────┤
│ - Search text                               │
│ - Selected filters                          │
│ - Sort order                                │
│ - Date ranges                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│      Context API (Configuration)            │
├─────────────────────────────────────────────┤
│ - Theme                                     │
│ - Notifications                             │
│ - Global config                             │
└─────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

- [ ] Session store created with persistent middleware
- [ ] UI store for modals/drawers created
- [ ] Filter store created
- [ ] React Query setup in main.tsx
- [ ] Query key factory created
- [ ] Theme context created
- [ ] Notification context created
- [ ] All queries use tenantId
- [ ] Mutations invalidate queries
- [ ] Filters stored in store + query key
- [ ] Permissions checked from session
- [ ] localStorage properly managed

---

## 🔗 Related Documentation

- [React Query](./REACT_QUERY.md) - Server state management
- [Session Management](./SESSION_MANAGEMENT.md) - User session state
- [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md) - Permission state

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team  
**Stack**: Zustand 5.0.8 + React Query 5.90.2