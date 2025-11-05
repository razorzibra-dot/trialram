# Super Admin Isolation & Impersonation - Implementation Guide

**Document Version**: 1.0  
**Audience**: Full-Stack Developers  
**Difficulty**: ADVANCED  
**Estimated Time**: 8-12 days (6-8 hours/day)

---

## 📋 Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Phase 2 Implementation Steps](#phase-2-implementation-steps)
3. [Module Access Control](#module-access-control)
4. [Impersonation Session Management](#impersonation-session-management)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)

---

## Overview & Architecture

### Current State

The application has completed **Phase 1**:
- ✅ All database tables created
- ✅ Backend services implemented
- ✅ React hooks for data fetching ready
- ✅ UI components built
- ✅ Type safety with Zod validation

### Goal: Phase 2

Implement the **access control layer** that ensures:

```
┌─────────────────────────────────────────────────────────┐
│  User Authentication Layer                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ AuthContext - Current User, Role, Permissions    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           v                       v
    ┌─────────────┐        ┌──────────────────┐
    │ Super Admin?│        │ Regular User     │
    │ Yes         │        │ (Tenant-bound)   │
    └──────┬──────┘        └──────────────────┘
           │
           ├─ Can access super-admin routes only
           ├─ Cannot see regular modules
           │
           └─ Can impersonate any tenant user
              │
              ├─ Start session → Log entry
              ├─ Access tenant with user context
              ├─ Track all actions
              └─ End session → Log result
```

---

## Phase 2 Implementation Steps

### Step 1: Update User Type for Super Admin Flag

**File**: `src/types/auth.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'engineer' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  tenantId: string | null;  // ← NULL for super admins
  tenantName?: string;
  avatar?: string;
  isSuperAdmin: boolean;    // ← NEW: Flag to check if super admin
  isSuperAdminMode?: boolean; // ← NEW: Flag if currently impersonating
  impersonatedAsUserId?: string; // ← NEW: Track who they're impersonating
  impersonationLogId?: string;   // ← NEW: Track the session
  // ... rest of fields
}
```

**Why**: Type safety and easy super admin detection across the app.

---

### Step 2: Create Module Access Hook

**File**: `src/hooks/useModuleAccess.ts` (NEW)

```typescript
/**
 * Hook to check if current user can access a specific module
 * 
 * Super admins: Can ONLY access super-admin module
 * Regular users: Can access their tenant modules based on RBAC
 */
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { rbacService } from '@/services/serviceFactory';

interface ModuleAccessResult {
  canAccess: boolean;
  reason?: string;
  isLoading: boolean;
  error?: Error;
}

export function useModuleAccess(moduleName: string): ModuleAccessResult {
  const { user, hasPermission } = useAuth();

  // Query for checking RBAC permissions
  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['module-access', moduleName, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // For super admins - only allow super-admin module
      if (user.isSuperAdmin) {
        return moduleName === 'super-admin' ? ['allowed'] : [];
      }

      // For regular users - check RBAC
      const perms = await rbacService.getPermissions(user.id);
      return perms.filter(p => 
        p.module === moduleName || p.module === '*'
      );
    },
    enabled: !!user?.id,
  });

  const canAccess = !user?.isSuperAdmin 
    ? (permissions?.length ?? 0) > 0 || hasPermission(`${moduleName}:view`)
    : moduleName === 'super-admin';

  const reason = !canAccess 
    ? user?.isSuperAdmin 
      ? 'Super admins can only access the super-admin module'
      : 'You do not have permission to access this module'
    : undefined;

  return {
    canAccess,
    reason,
    isLoading,
    error: error instanceof Error ? error : undefined,
  };
}
```

**Why**: Centralized module access logic that can be used in route guards and UI.

---

### Step 3: Create Module Access Guard Component

**File**: `src/components/auth/ModuleProtectedRoute.tsx` (NEW)

```typescript
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { Spin } from 'antd';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
  fallbackRoute?: string;
}

/**
 * Route guard that checks module-level access based on user role
 * 
 * - Super admins can ONLY access super-admin module
 * - Regular users are blocked from super-admin module
 * - Both checked via RBAC permissions
 */
const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  children,
  moduleName,
  fallbackRoute = '/',
}) => {
  const location = useLocation();
  const { canAccess, reason, isLoading } = useModuleAccess(moduleName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!canAccess) {
    console.warn(`[ModuleProtectedRoute] Access denied to ${moduleName}: ${reason}`);
    
    // Log security event (audit)
    // await auditService.logUnauthorizedAccess({
    //   module: moduleName,
    //   reason,
    //   timestamp: new Date(),
    // });

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{reason}</p>
          <Navigate to={fallbackRoute} replace />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default ModuleProtectedRoute;
```

**Why**: Prevents unauthorized access to modules at the route level.

---

### Step 4: Update ModuleRegistry with Access Control

**File**: `src/modules/ModuleRegistry.ts`

Add this method to the ModuleRegistry class:

```typescript
/**
 * Get modules accessible to current user
 * 
 * Super admins: Only super-admin module
 * Regular users: All modules matching their RBAC permissions
 */
async getAccessibleModules(
  user: User,
  rbacService: any
): Promise<FeatureModule[]> {
  const allModules = this.getAll();

  // Super admins: Only super-admin module
  if (user.isSuperAdmin) {
    const superAdminModule = allModules.find(m => m.name === 'super-admin');
    return superAdminModule ? [superAdminModule] : [];
  }

  // Regular users: Filter by RBAC permissions
  try {
    const permissions = await rbacService.getPermissions(user.id);
    const allowedModules = new Set(
      permissions
        .filter((p: any) => p.module)
        .map((p: any) => p.module)
    );

    return allModules.filter(m => 
      allowedModules.has(m.name) || allowedModules.has('*')
    );
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    // Fallback: Return only core modules
    return allModules.filter(m => m.name === 'core');
  }
}

/**
 * Check if user can access specific module
 */
canUserAccessModule(user: User, moduleName: string): boolean {
  // Super admins can only access super-admin module
  if (user.isSuperAdmin) {
    return moduleName === 'super-admin';
  }

  // Regular users cannot access super-admin module
  if (moduleName === 'super-admin') {
    return false;
  }

  // All other access checked via RBAC at runtime
  return true;
}
```

**Why**: Enables dynamic module loading based on user role.

---

### Step 5: Create Impersonation Context

**File**: `src/contexts/ImpersonationContext.tsx` (NEW)

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { ImpersonationLogType } from '@/types/superUserModule';
import { superUserService as factorySuperUserService } from '@/services/serviceFactory';

interface ImpersonationContextType {
  // Current impersonation session (if any)
  activeSession: ImpersonationLogType | null;
  
  // The user being impersonated
  impersonatedUser: User | null;
  
  // Flags
  isImpersonating: boolean;
  isLoading: boolean;
  error: Error | null;

  // Actions
  startImpersonation: (userId: string, tenantId: string, reason: string) => Promise<void>;
  endImpersonation: (actionsTaken?: any[]) => Promise<void>;
  
  // Helpers
  getImpersonationInfo: () => string; // Returns readable info like "Impersonating John Doe (john@example.com)"
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonationMode = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonationMode must be used within ImpersonationProvider');
  }
  return context;
};

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [activeSession, setActiveSession] = useState<ImpersonationLogType | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check localStorage for active session
        const sessionData = sessionStorage.getItem('activeImpersonation');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setActiveSession(session);
        }

        // Fetch active sessions from backend
        const activeSessions = await factorySuperUserService.getActiveImpersonations();
        if (activeSessions && activeSessions.length > 0) {
          const latest = activeSessions[0];
          setActiveSession(latest);
          sessionStorage.setItem('activeImpersonation', JSON.stringify(latest));
        }
      } catch (err) {
        console.error('Failed to restore impersonation session:', err);
      }
    };

    restoreSession();
  }, []);

  const startImpersonation = async (
    userId: string,
    tenantId: string,
    reason: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const log = await factorySuperUserService.startImpersonation({
        impersonatedUserId: userId,
        tenantId,
        reason,
      });

      setActiveSession(log);
      
      // Store in session storage
      sessionStorage.setItem('activeImpersonation', JSON.stringify(log));

      console.log('Impersonation started:', log.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start impersonation');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endImpersonation = async (actionsTaken?: any[]) => {
    if (!activeSession) {
      console.warn('No active impersonation session to end');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await factorySuperUserService.endImpersonation({
        logId: activeSession.id,
        actionsTaken,
      });

      setActiveSession(null);
      setImpersonatedUser(null);
      
      // Clear session storage
      sessionStorage.removeItem('activeImpersonation');

      console.log('Impersonation ended');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to end impersonation');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getImpersonationInfo = (): string => {
    if (!impersonatedUser) return '';
    return `Impersonating ${impersonatedUser.name} (${impersonatedUser.email})`;
  };

  const value: ImpersonationContextType = {
    activeSession,
    impersonatedUser,
    isImpersonating: !!activeSession && !activeSession.logout_at,
    isLoading,
    error,
    startImpersonation,
    endImpersonation,
    getImpersonationInfo,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};
```

**Why**: Tracks impersonation session state globally, not just in one component.

---

### Step 6: Update AuthContext to Support Super Admin

**File**: `src/contexts/AuthContext.tsx`

Add to the AuthContextType interface:

```typescript
interface AuthContextType extends AuthState {
  // ... existing fields ...
  isSuperAdmin: () => boolean;
  canAccessModule: (moduleName: string) => boolean;
  getCurrentImpersonationSession: () => any | null;
}
```

Add these methods in the provider:

```typescript
const isSuperAdmin = (): boolean => {
  return authState.user?.isSuperAdmin === true;
};

const canAccessModule = (moduleName: string): boolean => {
  if (!authState.user) return false;
  
  // Super admins can only access super-admin module
  if (isSuperAdmin()) {
    return moduleName === 'super-admin';
  }

  // Regular users cannot access super-admin module
  if (moduleName === 'super-admin') {
    return false;
  }

  return true;
};

const getCurrentImpersonationSession = (): any | null => {
  // Returns the current impersonation log if active
  const session = sessionStorage.getItem('activeImpersonation');
  if (!session) return null;

  const parsed = JSON.parse(session);
  return parsed.logout_at ? null : parsed;
};
```

**Why**: Provides convenient access checks at the auth layer.

---

### Step 7: Update Super Admin Routes with Module Guard

**File**: `src/modules/features/super-admin/routes.tsx`

```typescript
import ModuleProtectedRoute from '@/components/auth/ModuleProtectedRoute';

export const superAdminRoutes: RouteObject[] = [
  {
    path: 'super-admin',
    element: (
      <ModuleProtectedRoute moduleName="super-admin">
        {/* Routes wrapper */}
      </ModuleProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <RouteWrapper>
            <SuperAdminDashboardPage />
          </RouteWrapper>
        ),
      },
      // ... other routes
    ],
  },
];
```

**Why**: Ensures only super admins can access super-admin routes.

---

### Step 8: Update Sidebar Navigation

**File**: `src/components/layout/Sidebar.tsx` (EXAMPLE UPDATE)

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const superAdminAccess = useModuleAccess('super-admin');

  // Determine which menu items to show
  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      visible: true, // Always visible
    },
    {
      key: 'customers',
      label: 'Customers',
      visible: !user?.isSuperAdmin, // NOT visible for super admins
    },
    {
      key: 'sales',
      label: 'Sales',
      visible: !user?.isSuperAdmin,
    },
    {
      key: 'super-admin',
      label: 'System Admin',
      visible: superAdminAccess.canAccess,
      icon: <SettingOutlined />,
    },
  ];

  const visibleItems = menuItems.filter(item => item.visible);

  return (
    <Sider>
      <Menu items={visibleItems} />
    </Sider>
  );
};
```

**Why**: Super admins see only their admin options, regular users see their module options.

---

### Step 9: Create Impersonation Status Banner

**File**: `src/components/common/ImpersonationBanner.tsx` (NEW)

```typescript
import React from 'react';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { Alert, Button, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

/**
 * Displays a banner when super admin is actively impersonating a user
 * Allows quick exit from impersonation mode
 */
export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, getImpersonationInfo, endImpersonation, isLoading } =
    useImpersonationMode();

  if (!isImpersonating) return null;

  return (
    <Alert
      type="warning"
      style={{ marginBottom: 16 }}
      message={
        <Space>
          <span>🔐 {getImpersonationInfo()}</span>
          <Button
            type="text"
            danger
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => endImpersonation()}
            loading={isLoading}
          >
            Exit Impersonation
          </Button>
        </Space>
      }
      showIcon
    />
  );
};
```

**Why**: Makes impersonation mode obvious to super admins - critical for security.

---

### Step 10: Add Impersonation Banner to Layout

**File**: `src/modules/App.tsx` or `src/components/layout/Layout.tsx`

```typescript
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';

const AppLayout: React.FC = ({ children }) => {
  return (
    <ImpersonationProvider>
      <div>
        <ImpersonationBanner />
        {children}
      </div>
    </ImpersonationProvider>
  );
};
```

**Why**: Ensures all pages show impersonation status.

---

### Step 11: Implement Quick Impersonation UI

**File**: `src/modules/features/super-admin/views/SuperAdminDashboardPage.tsx` (ADD)

```typescript
import { Table, Button, Modal, Form, Select, Spin } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
import { userService } from '@/services/serviceFactory';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Quick impersonation UI for super admin dashboard
 */
const QuickImpersonationWidget: React.FC = () => {
  const { user } = useAuth();
  const { startImpersonation, isLoading } = useImpersonationMode();
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [reason, setReason] = useState<string>('Testing functionality');

  // Fetch all tenants
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      // Call super admin service to get all tenants
      const response = await fetch('/api/tenants');
      return response.json();
    },
  });

  // Fetch users for selected tenant
  const { data: users } = useQuery({
    queryKey: ['users', selectedTenant],
    queryFn: async () => {
      if (!selectedTenant) return [];
      const response = await fetch(`/api/tenants/${selectedTenant}/users`);
      return response.json();
    },
    enabled: !!selectedTenant,
  });

  const handleImpersonate = async () => {
    try {
      await startImpersonation(selectedUser, selectedTenant, reason);
      // Optionally navigate to dashboard or main page
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Impersonation failed:', err);
      Modal.error({
        title: 'Impersonation Failed',
        content: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  if (!user?.isSuperAdmin) return null;

  return (
    <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
      <h3>🔐 Quick Impersonation</h3>
      <Form layout="inline" style={{ marginTop: 16 }}>
        <Form.Item label="Tenant" style={{ marginRight: 16 }}>
          <Select
            placeholder="Select tenant"
            value={selectedTenant}
            onChange={setSelectedTenant}
            style={{ width: 200 }}
            options={tenants?.map((t: any) => ({
              label: t.name,
              value: t.id,
            })) || []}
          />
        </Form.Item>

        <Form.Item label="User" style={{ marginRight: 16 }}>
          <Select
            placeholder="Select user"
            value={selectedUser}
            onChange={setSelectedUser}
            style={{ width: 200 }}
            options={users?.map((u: any) => ({
              label: u.name,
              value: u.id,
            })) || []}
            disabled={!selectedTenant}
          />
        </Form.Item>

        <Form.Item label="Reason" style={{ marginRight: 16 }}>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Purpose of impersonation"
            style={{ padding: 4 }}
          />
        </Form.Item>

        <Button
          type="primary"
          onClick={handleImpersonate}
          loading={isLoading}
          disabled={!selectedUser || isLoading}
        >
          Start Impersonation
        </Button>
      </Form>
    </div>
  );
};

export default QuickImpersonationWidget;
```

**Why**: Provides super admin easy access to start impersonating any tenant user.

---

### Step 12: Add Audit Logging for All Super Admin Actions

**File**: `src/services/auditService.ts` (UPDATE or CREATE)

```typescript
/**
 * Audit Service for logging super admin actions
 */
import { superUserService } from '@/services/serviceFactory';

interface AuditLog {
  action: string;
  module: string;
  userId: string;
  targetUserId?: string;
  tenantId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  status: 'success' | 'failure';
  error?: string;
}

export const auditService = {
  /**
   * Log super admin action
   */
  async logAction(log: AuditLog): Promise<void> {
    try {
      await superUserService.logAuditAction({
        action: log.action,
        module: log.module,
        userId: log.userId,
        targetUserId: log.targetUserId,
        tenantId: log.tenantId,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        error: log.error,
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw - audit logging should not break app
    }
  },

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(data: {
    userId: string;
    attemptedModule: string;
    reason: string;
  }): Promise<void> {
    await this.logAction({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      module: data.attemptedModule,
      userId: data.userId,
      status: 'failure',
      error: data.reason,
      timestamp: new Date(),
    });
  },

  /**
   * Log impersonation start
   */
  async logImpersonationStart(data: {
    superAdminId: string;
    impersonatedUserId: string;
    tenantId: string;
    reason: string;
  }): Promise<void> {
    await this.logAction({
      action: 'IMPERSONATION_START',
      module: 'super-admin',
      userId: data.superAdminId,
      targetUserId: data.impersonatedUserId,
      tenantId: data.tenantId,
      details: { reason: data.reason },
      status: 'success',
      timestamp: new Date(),
    });
  },

  /**
   * Log impersonation end
   */
  async logImpersonationEnd(data: {
    superAdminId: string;
    impersonatedUserId: string;
    tenantId: string;
    actionsTaken?: string[];
  }): Promise<void> {
    await this.logAction({
      action: 'IMPERSONATION_END',
      module: 'super-admin',
      userId: data.superAdminId,
      targetUserId: data.impersonatedUserId,
      tenantId: data.tenantId,
      details: { actionsTaken: data.actionsTaken || [] },
      status: 'success',
      timestamp: new Date(),
    });
  },
};
```

**Why**: Complete audit trail of all super admin actions for compliance and security.

---

## Impersonation Session Management

### How Impersonation Works

```
1. Super Admin clicks "Impersonate User"
   ↓
2. SelectTenant → SelectUser → EnterReason
   ↓
3. Call startImpersonation()
   ├─ Create log entry in DB
   ├─ Generate session token
   ├─ Store in sessionStorage
   └─ Update AuthContext
   ↓
4. App reloads/refreshes with impersonation context
   ├─ All API calls use impersonated user's permissions
   ├─ UI shows "Impersonating..." banner
   └─ Actions tracked in audit log
   ↓
5. Super Admin clicks "Exit Impersonation"
   ├─ Call endImpersonation()
   ├─ Log session end with actions taken
   ├─ Clear sessionStorage
   └─ Restore super admin context
   ↓
6. Audit log shows complete timeline
```

### Key Points

**Session Storage**:
```typescript
// Stored in sessionStorage (cleared on browser close)
{
  id: 'log-123',
  superAdminId: 'admin-1',
  impersonatedUserId: 'user-456',
  tenantId: 'tenant-789',
  loginAt: '2025-02-20T10:00:00Z',
  logoutAt: null,
  reason: 'Testing customer flow',
  actionsTaken: []
}
```

**Context Available to Super Admin**:
```typescript
// During impersonation, user context shows:
{
  id: 'user-456', // The impersonated user
  tenantId: 'tenant-789',
  role: 'manager', // Their actual role
  permissions: [...], // Their actual permissions
  
  // But also tracks:
  isSuperAdminMode: true,
  impersonationLogId: 'log-123',
}
```

**API Requests**:
```typescript
// All API calls include impersonation header
GET /api/customers
Headers:
  Authorization: Bearer <token>
  X-Impersonation-Log-Id: log-123  // ← Added by interceptor
  X-Super-Admin-Id: admin-1        // ← Added by interceptor
```

**Backend Validation**:
```sql
-- Database enforces that:
1. Impersonation log exists
2. Super admin has access to tenant
3. Impersonated user exists in tenant
4. Session is not already ended

-- All actions are tagged with:
- Impersonation log ID
- Original super admin ID
- Timestamp
```

---

## Testing & Validation

### Test Case 1: Super Admin Cannot Access Regular Modules

**File**: `src/__tests__/super-admin-isolation.test.ts` (NEW)

```typescript
describe('Super Admin Isolation', () => {
  it('should prevent super admin from accessing customer module', () => {
    // Setup super admin user
    const superAdmin = {
      id: 'super-1',
      isSuperAdmin: true,
      role: 'super_admin',
      tenantId: null,
    };

    // Try to access customer module
    const canAccess = canUserAccessModule(superAdmin, 'customers');

    // Should be denied
    expect(canAccess).toBe(false);
  });

  it('should allow super admin to access super-admin module', () => {
    const superAdmin = {
      id: 'super-1',
      isSuperAdmin: true,
      role: 'super_admin',
      tenantId: null,
    };

    const canAccess = canUserAccessModule(superAdmin, 'super-admin');

    expect(canAccess).toBe(true);
  });

  it('should allow regular user to access customer module', () => {
    const regularUser = {
      id: 'user-1',
      isSuperAdmin: false,
      role: 'manager',
      tenantId: 'tenant-1',
    };

    const canAccess = canUserAccessModule(regularUser, 'customers');

    expect(canAccess).toBe(true);
  });

  it('should prevent regular user from accessing super-admin module', () => {
    const regularUser = {
      id: 'user-1',
      isSuperAdmin: false,
      role: 'manager',
      tenantId: 'tenant-1',
    };

    const canAccess = canUserAccessModule(regularUser, 'super-admin');

    expect(canAccess).toBe(false);
  });
});
```

---

### Test Case 2: Impersonation Creates Proper Audit Trail

```typescript
describe('Impersonation Audit Trail', () => {
  it('should create audit log entry on impersonation start', async () => {
    const result = await startImpersonation({
      superAdminId: 'super-1',
      impersonatedUserId: 'user-1',
      tenantId: 'tenant-1',
      reason: 'Testing customer flow',
    });

    // Verify log entry exists
    const log = await getImpersonationLog(result.logId);
    expect(log).toMatchObject({
      superAdminId: 'super-1',
      impersonatedUserId: 'user-1',
      tenantId: 'tenant-1',
      reason: 'Testing customer flow',
      loginAt: expect.any(Date),
      logoutAt: null,
    });
  });

  it('should close audit log entry on impersonation end', async () => {
    const startResult = await startImpersonation({...});
    
    await endImpersonation({
      logId: startResult.logId,
      actionsTaken: ['viewed_contracts', 'created_ticket'],
    });

    const log = await getImpersonationLog(startResult.logId);
    expect(log.logoutAt).not.toBeNull();
    expect(log.actionsTaken).toEqual(['viewed_contracts', 'created_ticket']);
  });
});
```

---

### Manual Testing Checklist

**Super Admin Navigation**:
- [ ] Login as super admin
- [ ] Verify sidebar shows only "System Admin" option
- [ ] Verify cannot navigate to `/customers`, `/sales`, etc.
- [ ] Verify can access `/super-admin/dashboard`

**Impersonation Flow**:
- [ ] On super admin dashboard, select tenant and user
- [ ] Click "Start Impersonation"
- [ ] Verify "Impersonating..." banner appears
- [ ] Verify can access regular modules now
- [ ] Verify actions are tracked in audit log
- [ ] Click "Exit Impersonation"
- [ ] Verify banner disappears
- [ ] Verify back to super admin view

**Audit Logging**:
- [ ] Check super_user_impersonation_logs table
- [ ] Verify entries show start/end times
- [ ] Verify actions are recorded
- [ ] Verify super admin ID is tracked

---

## Troubleshooting

### Issue: Super Admin Can Still Access Regular Modules

**Diagnosis**:
1. Check if `isSuperAdmin` is properly set on user object
2. Verify `useModuleAccess()` hook is being called
3. Check browser console for errors

**Solution**:
```typescript
// In AuthContext, ensure:
const isSuperAdmin = (): boolean => {
  return authState.user?.role === 'super_admin' && authState.user?.isSuperAdmin === true;
};

// NOT just:
// return authState.user?.isSuperAdmin === true;
```

---

### Issue: Impersonation Banner Not Showing

**Diagnosis**:
1. Check if ImpersonationProvider is wrapping app
2. Verify sessionStorage has impersonation data
3. Check if `isImpersonating` flag is true

**Solution**:
```typescript
// In src/modules/App.tsx, ensure:
<ImpersonationProvider>
  <YourApp>
    <ImpersonationBanner />
  </YourApp>
</ImpersonationProvider>
```

---

### Issue: Impersonation Actions Not Being Logged

**Diagnosis**:
1. Verify backend is receiving `X-Impersonation-Log-Id` header
2. Check if audit logging is enabled
3. Verify database triggers are firing

**Solution**:
```typescript
// Add HTTP interceptor to include headers:
httpClient.interceptors.request.use((config) => {
  const session = sessionStorage.getItem('activeImpersonation');
  if (session) {
    const { id } = JSON.parse(session);
    config.headers['X-Impersonation-Log-Id'] = id;
  }
  return config;
});
```

---

### Issue: Super Admin Locked Out of Super Admin Module

**Diagnosis**:
1. Check if `canAccessModule()` logic is backwards
2. Verify super admin routes have guards

**Solution**:
```typescript
// Correct logic:
if (moduleName === 'super-admin') {
  return isSuperAdmin(); // Only true for super admins
}
return !isSuperAdmin(); // False for super admins
```

---

## Next Steps

1. **Implement Steps 1-12** above in order
2. **Run test cases** to validate functionality
3. **Manual testing** with test accounts
4. **Security review** before production deployment
5. **Documentation updates** with final API docs

---

## References

- [`SUPER_ADMIN_ISOLATION_COMPLETION_INDEX.md`](./SUPER_ADMIN_ISOLATION_COMPLETION_INDEX.md)
- [`SUPER_ADMIN_ISOLATION_PENDING_TASKS.md`](./SUPER_ADMIN_ISOLATION_PENDING_TASKS.md)
- [`src/modules/features/super-admin/DOC.md`](./src/modules/features/super-admin/DOC.md)
- [`src/types/superUserModule.ts`](./src/types/superUserModule.ts)

---

**Implementation Guide Version**: 1.0  
**Last Updated**: February 2025  
**Status**: Ready for implementation